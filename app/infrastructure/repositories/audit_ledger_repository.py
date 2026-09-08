"""
Audit Ledger Repository — per-mine-site sharded hash chain (Beanie/MongoDB).
"""
from uuid import UUID

from app.infrastructure.database.models import AuditLedgerModel


class AuditLedgerRepository:
    def __init__(self) -> None:
        pass

    async def get_last_for_mine(self, mine_site_id: UUID) -> AuditLedgerModel | None:
        """
        Fetch the most recent ledger entry for a given mine site.
        Note: MongoDB does not support row-level locking; rely on application-level
        optimistic concurrency or a distributed lock (e.g., Redis) if needed.
        """
        return (
            await AuditLedgerModel.find(AuditLedgerModel.mine_site_id == mine_site_id)
            .sort(-AuditLedgerModel.sequence_number)
            .limit(1)
            .first_or_none()
        )

    async def append(self, entry: AuditLedgerModel) -> AuditLedgerModel:
        await entry.insert()
        return entry

    async def get_chain_for_mine(
        self, mine_site_id: UUID, limit: int = 500, offset: int = 0
    ) -> list[AuditLedgerModel]:
        """Return ordered chain for verification scanning."""
        return (
            await AuditLedgerModel.find(AuditLedgerModel.mine_site_id == mine_site_id)
            .sort(AuditLedgerModel.sequence_number)
            .skip(offset)
            .limit(limit)
            .to_list()
        )

    async def get_by_entity(
        self, entity_type: str, entity_id: UUID
    ) -> list[AuditLedgerModel]:
        return (
            await AuditLedgerModel.find(
                AuditLedgerModel.entity_type == entity_type,
                AuditLedgerModel.entity_id == entity_id,
            )
            .sort(AuditLedgerModel.sequence_number)
            .to_list()
        )

    async def count_for_mine(self, mine_site_id: UUID) -> int:
        return await AuditLedgerModel.find(
            AuditLedgerModel.mine_site_id == mine_site_id
        ).count()
