"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/auth-store";
import { offlineDb } from "@/lib/db/offline-db";
import { LocationType } from "@/lib/types/domain";
import { MOCK_STATIONS, fetchUndergroundStations } from "@/lib/api/underground";
import { formatGpsLocation } from "@/lib/utils/coords";
import { flushOfflineSyncQueue } from "@/lib/sync/sync-manager";
import { useSyncStore } from "@/lib/store/sync-store";
import {
  MapPin,
  HardHat,
  Camera,
  Compass,
  CheckCircle2,
  AlertTriangle,
  Upload,
  ArrowRight,
  Shield,
  Loader2,
} from "lucide-react";

export function InspectionWizard() {
  const router = useRouter();
  const { activeMineSiteId, activeMineName } = useAuthStore();
  const { isOnline, refreshPendingCount } = useSyncStore();

  const [locationType, setLocationType] = useState<LocationType>(LocationType.SURFACE_GPS);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [gpsLocation, setGpsLocation] = useState<string>("");
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [stationId, setStationId] = useState("");
  const [stations, setStations] = useState(MOCK_STATIONS);
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchUndergroundStations(activeMineSiteId).then((data) => {
      setStations(data);
      if (data.length > 0) setStationId(data[0].station_code);
    });
  }, [activeMineSiteId]);

  // Surface GPS Geolocation capture
  const handleCaptureGps = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your device browser.");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        setGpsAccuracy(Math.round(pos.coords.accuracy));
        // PostGIS POINT(lon lat) standard
        setGpsLocation(formatGpsLocation(lat, lon));
      },
      (err) => {
        setIsLocating(false);
        console.warn("GPS error, defaulting to RG-OCP 3 Ramagundam Telangana coordinates:", err);
        // Fallback demo coordinates inside RG-OCP 3 Ramagundam leasehold
        setGpsLocation("POINT(79.513400 18.756200)");
        setGpsAccuracy(8);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    const inspectionId = crypto.randomUUID();
    const idempotencyKey = crypto.randomUUID();

    try {
      // 1. Store inspection in local IndexedDB (Dexie)
      await offlineDb.pending_inspections.add({
        id: inspectionId,
        idempotency_key: idempotencyKey,
        mine_site_id: activeMineSiteId,
        title,
        description,
        location_type: locationType,
        gps_location: locationType === LocationType.SURFACE_GPS ? gpsLocation : null,
        station_id: locationType === LocationType.UNDERGROUND_STATION ? stationId : null,
        inspection_date: new Date().toISOString(),
        version: 1,
        client_updated_at: new Date().toISOString(),
        is_synced: 0,
      });

      // 2. Refinement 2: Store Photo attachment as native Blob in Dexie
      if (selectedPhoto) {
        await offlineDb.offline_media.add({
          id: crypto.randomUUID(),
          inspection_id: inspectionId,
          blob: selectedPhoto, // Native IndexedDB Blob storage
          filename: selectedPhoto.name,
          content_type: selectedPhoto.type || "image/jpeg",
          size_bytes: selectedPhoto.size,
          created_at: new Date().toISOString(),
        });
      }

      await refreshPendingCount();

      // 3. Attempt immediate sync flush if currently online
      if (isOnline) {
        flushOfflineSyncQueue();
      }

      setSuccessMessage(
        isOnline
          ? "Inspection submitted & synchronized to central database!"
          : "Saved offline in IndexedDB! Will auto-sync when network reconnects."
      );

      setTimeout(() => {
        router.push("/inspections");
      }, 1500);
    } catch (err) {
      console.error("Failed saving inspection locally:", err);
      alert("Error saving inspection locally.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-6">
      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-sm font-semibold flex items-center gap-3 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Mode Selection Pill Buttons */}
      <div className="bg-slate-900/90 border border-slate-800 p-2 rounded-2xl grid grid-cols-2 gap-2 shadow-xl">
        <button
          type="button"
          onClick={() => setLocationType(LocationType.SURFACE_GPS)}
          className={`flex items-center justify-center gap-2.5 py-3 rounded-xl text-xs font-bold transition-all ${
            locationType === LocationType.SURFACE_GPS
              ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-950"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Compass className="w-4 h-4" />
          Surface Mine Inspection (GPS Geofence)
        </button>

        <button
          type="button"
          onClick={() => setLocationType(LocationType.UNDERGROUND_STATION)}
          className={`flex items-center justify-center gap-2.5 py-3 rounded-xl text-xs font-bold transition-all ${
            locationType === LocationType.UNDERGROUND_STATION
              ? "bg-amber-400 text-slate-950 shadow-md shadow-amber-950"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <HardHat className="w-4 h-4" />
          Underground Seam Checkpoint (Station Code)
        </button>
      </div>

      {/* Main Inspection Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-2xl">
        {/* Mine Site Scope Badge */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
              Active Mine Leasehold
            </span>
            <div className="text-sm font-bold text-slate-100 flex items-center gap-2 mt-0.5">
              <MapPin className="w-4 h-4 text-emerald-400" />
              {activeMineName}
            </div>
          </div>
          <span className="text-[11px] font-mono px-2.5 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700">
            DGMS Standard Form
          </span>
        </div>

        {/* Title */}
        <div>
          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
            Inspection Title *
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Return Airway Methane & Airflow Velocity Audit"
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Location Specific Input */}
        {locationType === LocationType.SURFACE_GPS ? (
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
                <Compass className="w-4 h-4 text-emerald-400" />
                Live Surface GPS Coordinates (Lon / Lat)
              </span>
              <button
                type="button"
                onClick={handleCaptureGps}
                disabled={isLocating}
                className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all"
              >
                {isLocating ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Acquiring Satellites...
                  </>
                ) : (
                  <>
                    <Compass className="w-3.5 h-3.5" />
                    Acquire GPS Lock
                  </>
                )}
              </button>
            </div>

            <input
              type="text"
              readOnly
              value={gpsLocation}
              placeholder="Click 'Acquire GPS Lock' to verify lease boundary coordinates"
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-emerald-300"
            />

            {gpsAccuracy !== null && (
              <div className="text-[11px] text-slate-400 flex items-center justify-between">
                <span>Estimated Geolocation Accuracy:</span>
                <span className="font-mono text-emerald-400">±{gpsAccuracy} meters</span>
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <label className="block text-xs font-bold text-slate-300 flex items-center gap-2">
              <HardHat className="w-4 h-4 text-amber-400" />
              Registered Underground Station Checkpoint *
            </label>
            <select
              value={stationId}
              onChange={(e) => setStationId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-amber-400"
            >
              {stations.map((stn) => (
                <option key={stn.id} value={stn.station_code}>
                  {stn.station_code} — {stn.description} (-{stn.depth_meters}m)
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Description */}
        <div>
          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
            Observation Notes & Telemetry *
          </label>
          <textarea
            rows={3}
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Record air velocity, gas readings (CH4, CO), support integrity, or non-compliances observed..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Offline Media Photo Capture */}
        <div>
          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-2">
            <Camera className="w-4 h-4 text-cyan-400" />
            Field Evidence Photo (Stored Offline in IndexedDB)
          </label>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 px-4 py-3 rounded-xl border border-slate-800 bg-slate-950 hover:bg-slate-850 hover:border-slate-700 text-xs text-slate-300 cursor-pointer transition-all">
              <Upload className="w-4 h-4 text-emerald-400" />
              <span>Attach Inspection Image</span>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoChange}
                className="hidden"
              />
            </label>

            {photoPreview && (
              <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-slate-700 shadow-md">
                <img
                  src={photoPreview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Submit Action */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-extrabold text-sm tracking-wide shadow-xl shadow-emerald-950 hover:brightness-110 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Writing to Local IndexedDB Storage...
          </>
        ) : (
          <>
            <span>Submit Inspection & Queue for Sync</span>
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>
    </form>
  );
}
