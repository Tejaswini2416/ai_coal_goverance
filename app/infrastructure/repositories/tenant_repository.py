"""
Tenant Repository — Beanie/MongoDB (replaces ltree with dot-path prefix matching).
"""
from uuid import UUID
import re

from app.infrastructure.database.models import TenantModel


class TenantRepository:
    def __init__(self) -> None:
        pass

    async def get_by_id(self, tenant_id: UUID) -> TenantModel | None:
        return await TenantModel.find_one(TenantModel.id == tenant_id)

    async def get_by_path(self, path: str) -> TenantModel | None:
        return await TenantModel.find_one(TenantModel.path == path)

    async def get_subtree(self, root_path: str) -> list[TenantModel]:
        """
        Return all tenants at or below root_path.
        In MongoDB we use a prefix regex — e.g. root_path='MOC.SECL' matches
        'MOC.SECL', 'MOC.SECL.AREA1', 'MOC.SECL.AREA1.MINE1', etc.
        """
        pattern = re.compile(f"^{re.escape(root_path)}(\\.|,|$)")
        docs = await TenantModel.find({"path": {"$regex": pattern}}).to_list()
        return sorted(docs, key=lambda t: (t.path.count("."), t.path))

    async def get_ancestors(self, path: str) -> list[TenantModel]:
        """Return all ancestor tenants by computing ancestor paths from dot-separated path."""
        parts = path.split(".")
        ancestor_paths = [".".join(parts[:i]) for i in range(1, len(parts))]
        if not ancestor_paths:
            return []
        docs = await TenantModel.find(
            {"path": {"$in": ancestor_paths}}
        ).to_list()
        return sorted(docs, key=lambda t: t.path.count("."))

    async def is_descendant_of(self, child_path: str, ancestor_path: str) -> bool:
        """True if child_path is a descendant-or-equal of ancestor_path."""
        return child_path == ancestor_path or child_path.startswith(ancestor_path + ".")

    async def create(self, tenant: TenantModel) -> TenantModel:
        await tenant.insert()
        return tenant

    async def list_all(self, tier: str | None = None) -> list[TenantModel]:
        query = TenantModel.find()
        if tier:
            query = TenantModel.find(TenantModel.tier == tier)
        docs = await query.to_list()
        return sorted(docs, key=lambda t: t.path)
