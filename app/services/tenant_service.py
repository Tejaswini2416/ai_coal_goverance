"""
Tenant Service — ltree-native subtree scoping (Refinement 1).
"""
import uuid
from uuid import UUID

from app.domain.enums import TenantTier, UserRole
from app.infrastructure.database.models import TenantModel
from app.infrastructure.repositories.tenant_repository import TenantRepository


class TenantService:
    def __init__(self, tenant_repo: TenantRepository) -> None:
        self._repo = tenant_repo

    async def get_accessible_tenants(
        self,
        user_tenant_path: str,
        user_role: str,
    ) -> list[TenantModel]:
        """
        Return all tenants accessible to the user.
        MINISTRY_AUDITOR: entire tree.
        Others: subtree at-or-below their assigned node.
        """
        if UserRole(user_role) == UserRole.MINISTRY_AUDITOR:
            return await self._repo.list_all()
        return await self._repo.get_subtree(user_tenant_path)

    async def assert_access_to_path(
        self,
        user_tenant_path: str,
        target_tenant_path: str,
        user_role: str,
    ) -> None:
        """
        Raises PermissionError if user cannot access target_tenant_path.
        Uses ltree descendant semantics: target must be at-or-below user's node.
        """
        if UserRole(user_role) == UserRole.MINISTRY_AUDITOR:
            return
        is_descendant = await self._repo.is_descendant_of(target_tenant_path, user_tenant_path)
        if not is_descendant:
            raise PermissionError(
                f"Target '{target_tenant_path}' is outside your scope '{user_tenant_path}'."
            )

    async def create_tenant(
        self,
        name: str,
        tier: TenantTier,
        parent_id: UUID | None,
        parent_path: str | None,
    ) -> TenantModel:
        """
        Create a new organizational node.
        Path is built by appending a sanitized label to the parent path.
        """
        label = name.upper().replace(" ", "_")[:20]
        if parent_path:
            path = f"{parent_path}.{label}"
        else:
            # Root node (Ministry)
            path = label

        tenant = TenantModel(
            id        = uuid.uuid4(),
            name      = name,
            tier      = tier.value,
            path      = path,
            parent_id = parent_id,
        )
        return await self._repo.create(tenant)

    async def get_subtree(self, root_path: str) -> list[TenantModel]:
        return await self._repo.get_subtree(root_path)

    async def get_by_id(self, tenant_id: UUID) -> TenantModel | None:
        return await self._repo.get_by_id(tenant_id)

    async def get_ancestors(self, path: str) -> list[TenantModel]:
        return await self._repo.get_ancestors(path)
