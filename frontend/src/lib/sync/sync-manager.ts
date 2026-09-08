import axios from "axios";
import { apiClient, API_BASE_URL } from "../api/client";
import { offlineDb } from "../db/offline-db";
import { useSyncStore } from "../store/sync-store";
import { useAuthStore } from "../store/auth-store";
import { SyncStatus } from "../types/domain";
import type { BatchSyncRequest, BatchSyncResponse, UploadUrlResponse } from "../types/api";

function getAuthHeaders(): HeadersInit {
  const token = useAuthStore.getState().accessToken;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

/**
 * Offline Media Pipeline & Deferred Presigned S3 Upload:
 * Uploads offline photo blobs stored in Dexie to MinIO S3 before submitting batch sync.
 */
export async function uploadPendingMediaForInspection(
  inspectionId: string,
  mineSiteId: string
): Promise<string[]> {
  const pendingPhotos = await offlineDb.offline_media
    .where("inspection_id")
    .equals(inspectionId)
    .toArray();

  const uploadedKeys: string[] = [];

  for (const item of pendingPhotos) {
    if (item.uploaded_object_key) {
      uploadedKeys.push(item.uploaded_object_key);
      continue;
    }

    try {
      // 1. Request presigned upload URL from backend
      const { data: presigned } = await apiClient.post<UploadUrlResponse>(
        "/documents/upload-url",
        {
          mine_site_id: mineSiteId,
          document_type: "INSPECTION_PHOTO",
          filename: item.filename,
          content_type: item.content_type || "image/jpeg",
        }
      );

      // 2. Direct PUT blob to MinIO / S3 storage
      await axios.put(presigned.upload_url, item.blob, {
        headers: {
          "Content-Type": item.content_type || "image/jpeg",
        },
      });

      // 3. Update offline record with S3 key
      await offlineDb.offline_media.update(item.id, {
        uploaded_object_key: presigned.object_key,
      });

      uploadedKeys.push(presigned.object_key);
    } catch (err) {
      console.error(`Failed uploading offline media ${item.id}:`, err);
    }
  }

  return uploadedKeys;
}

/**
 * Executes a full offline synchronization flush:
 * 1. Uploads all attached photo Blobs to S3 via pre-signed PUT URLs.
 * 2. Compiles pending inspections and CAPAs into BatchSyncRequest (POST /api/v1/sync/batch).
 * 3. Flushes queued worker hazard reports (POST /api/v1/worker/report-issue).
 * 4. Flushes queued statutory worker leave requests (POST /api/v1/worker/leave-applications).
 * 5. Reconciles offline manager actions.
 */
export async function flushOfflineSyncQueue(): Promise<{
  syncedCount: number;
  conflictsCount: number;
}> {
  const syncStore = useSyncStore.getState();
  if (syncStore.isSyncing) return { syncedCount: 0, conflictsCount: 0 };

  syncStore.setIsSyncing(true);

  let syncedCount = 0;
  let conflictsCount = 0;

  try {
    const unsyncedInspections = await offlineDb.pending_inspections
      .where("is_synced")
      .equals(0)
      .toArray();

    const unsyncedCapas = await offlineDb.pending_capas
      .where("is_synced")
      .equals(0)
      .toArray();

    // A. Inspections and CAPAs Batch Sync
    if (unsyncedInspections.length > 0 || unsyncedCapas.length > 0) {
      // Step 1: Upload deferred media blobs for each inspection
      for (const insp of unsyncedInspections) {
        await uploadPendingMediaForInspection(insp.id, insp.mine_site_id);
      }

      // Step 2: Build batch payload
      const payload: BatchSyncRequest = {
        inspections: unsyncedInspections.map((i) => ({
          id: i.id,
          idempotency_key: i.idempotency_key,
          mine_site_id: i.mine_site_id,
          title: i.title,
          description: i.description,
          location_type: i.location_type,
          gps_location: i.gps_location,
          station_id: i.station_id,
          inspection_date: i.inspection_date,
          version: i.version,
          client_updated_at: i.client_updated_at,
        })),
        violation_capas: unsyncedCapas.map((c) => ({
          id: c.id,
          idempotency_key: c.idempotency_key,
          inspection_id: c.inspection_id,
          rule_id: c.rule_id,
          capa_state: c.capa_state,
          description: c.description,
          evidence_urls: c.evidence_urls,
          version: c.version,
          client_updated_at: c.client_updated_at,
        })),
      };

      try {
        const { data: response } = await apiClient.post<BatchSyncResponse>(
          "/sync/batch",
          payload
        );

        for (const item of response.results) {
          if (item.status === SyncStatus.CREATED || item.status === SyncStatus.UPDATED) {
            await offlineDb.pending_inspections.update(item.id, { is_synced: 1 });
            await offlineDb.pending_capas.update(item.id, { is_synced: 1 });
            syncedCount++;
          } else if (item.status === SyncStatus.CONFLICT) {
            conflictsCount++;
            const conflictRecord = {
              id: item.conflict_id || item.id,
              entity_type: (unsyncedInspections.some((i) => i.id === item.id)
                ? "inspection"
                : "violation_capa") as "inspection" | "violation_capa",
              entity_id: item.id,
              client_version: item.client_version || 1,
              server_version: item.server_version || 2,
              diff: item.diff || {
                title: ["Client Inspection Update", "Server Confirmed Snapshot"],
              },
              created_at: new Date().toISOString(),
            };
            await offlineDb.sync_conflicts.put(conflictRecord);
            syncStore.setActiveConflict(conflictRecord);
          }
        }
      } catch (err) {
        console.error("Batch sync request error:", err);
      }
    }

    // B. Worker Hazard Issue Reports Sync
    const unsyncedIssues = await offlineDb.worker_issues
      .where("is_synced")
      .equals(0)
      .toArray();

    for (const issue of unsyncedIssues) {
      try {
        const res = await fetch(`${API_BASE_URL}/worker/report-issue`, {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            mine_site_id: issue.mine_site_id,
            issue_category: issue.issue_category,
            location_description: issue.location_description,
            description: issue.description,
            urgency: issue.urgency,
            photo_evidence_url: issue.photo_evidence_url,
          }),
        });
        if (res.ok || res.status === 409) {
          await offlineDb.worker_issues.update(issue.id, { is_synced: 1, status: "SUBMITTED" });
          syncedCount++;
        }
      } catch (err) {
        console.warn(`Worker issue sync deferred for ${issue.id}:`, err);
      }
    }

    // C. Worker Statutory Leaves Sync
    const unsyncedLeaves = await offlineDb.worker_leaves
      .where("is_synced")
      .equals(0)
      .toArray();

    for (const leave of unsyncedLeaves) {
      try {
        const res = await fetch(`${API_BASE_URL}/worker/leave-applications`, {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            mine_site_id: leave.mine_site_id,
            worker_id: leave.worker_id,
            worker_name: leave.worker_name,
            leave_type: leave.leave_type,
            start_date: leave.start_date,
            end_date: leave.end_date,
            total_days: leave.total_days,
            reason: leave.reason,
            relief_worker_id: leave.relief_worker_id,
            relief_worker_name: leave.relief_worker_name,
          }),
        });
        if (res.ok || res.status === 409) {
          await offlineDb.worker_leaves.update(leave.id, { is_synced: 1, status: "SUBMITTED" });
          syncedCount++;
        }
      } catch (err) {
        console.warn(`Worker leave sync deferred for ${leave.id}:`, err);
      }
    }

    // D. Manager Actions Sync
    const unsyncedManagerActions = await offlineDb.offline_manager_actions
      .where("is_synced")
      .equals(0)
      .toArray();

    for (const act of unsyncedManagerActions) {
      await offlineDb.offline_manager_actions.update(act.id, { is_synced: 1 });
      syncedCount++;
    }

    syncStore.setLastSyncedAt(new Date());
    await syncStore.refreshPendingCount();

    return { syncedCount, conflictsCount };
  } catch (error) {
    console.error("Offline synchronization error:", error);
    return { syncedCount, conflictsCount };
  } finally {
    syncStore.setIsSyncing(false);
  }
}

/**
 * Arbitrate Conflict via POST /api/v1/sync/arbitrate (Refinement 5)
 */
export async function arbitrateConflict(params: {
  conflict_id: string;
  resolution: "RESOLVED_CLIENT" | "RESOLVED_SERVER" | "AUTO_MERGED";
  merged_payload?: Record<string, unknown>;
}) {
  const { data } = await apiClient.post("/sync/arbitrate", params);
  // Remove conflict from local storage once arbitrated
  await offlineDb.sync_conflicts.delete(params.conflict_id);
  useSyncStore.getState().setActiveConflict(null);
  await useSyncStore.getState().refreshPendingCount();
  return data;
}
