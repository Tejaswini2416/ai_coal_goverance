"""Sync Conflict Log Repository — Beanie/MongoDB."""
from datetime import datetime
from uuid import UUID

from app.infrastructure.database.models import SyncConflictLogModel


class SyncConflictRepository:
    def __init__(self) -> None:
        pass

    async def create(self, conflict: SyncConflictLogModel) -> SyncConflictLogModel:
        await conflict.insert()
        return conflict

    async def get_by_id(self, conflict_id: UUID) -> SyncConflictLogModel | None:
        return await SyncConflictLogModel.find_one(SyncConflictLogModel.id == conflict_id)

    async def get_by_idempotency_key(self, key: UUID) -> SyncConflictLogModel | None:
        return await SyncConflictLogModel.find_one(
            SyncConflictLogModel.idempotency_key == key
        )

    async def list_pending(self) -> list[SyncConflictLogModel]:
        return (
            await SyncConflictLogModel.find(
                SyncConflictLogModel.status == "PENDING_ARBITRATION"
            )
            .sort(-SyncConflictLogModel.created_at)
            .to_list()
        )

    async def resolve(
        self,
        conflict_id: UUID,
        resolution: str,       # 'RESOLVED_CLIENT' | 'RESOLVED_SERVER'
        arbitrated_by: UUID,
    ) -> SyncConflictLogModel | None:
        conflict = await self.get_by_id(conflict_id)
        if conflict:
            conflict.status = resolution
            conflict.arbitrated_by = arbitrated_by
            conflict.arbitrated_at = datetime.utcnow()
            await conflict.save()
        return conflict
