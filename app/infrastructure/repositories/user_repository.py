"""User Repository — Beanie/MongoDB."""
from uuid import UUID
from datetime import datetime

from app.infrastructure.database.models import UserModel, UserRefreshTokenModel


class UserRepository:
    def __init__(self) -> None:
        pass

    async def get_by_id(self, user_id: UUID) -> UserModel | None:
        return await UserModel.find_one(UserModel.id == user_id)

    async def get_by_email(self, email: str) -> UserModel | None:
        return await UserModel.find_one(UserModel.email == email.lower())

    async def create(self, user: UserModel) -> UserModel:
        await user.insert()
        return user

    async def update(self, user: UserModel) -> UserModel:
        await user.save()
        return user

    async def list_by_tenant_subtree(self, root_path: str) -> list[UserModel]:
        """
        Return all users whose tenant_path starts with root_path.
        In MongoDB we use a regex prefix match instead of ltree <@ operator.
        """
        import re
        pattern = re.compile(f"^{re.escape(root_path)}")
        return await UserModel.find(
            {"tenant_path": {"$regex": pattern}}
        ).to_list()

    # ── Refresh Tokens ──────────────────────────────────────────────────────
    async def create_refresh_token(self, token: UserRefreshTokenModel) -> UserRefreshTokenModel:
        await token.insert()
        return token

    async def get_refresh_token_by_hash(self, token_hash: str) -> UserRefreshTokenModel | None:
        return await UserRefreshTokenModel.find_one(
            UserRefreshTokenModel.token_hash == token_hash,
            UserRefreshTokenModel.revoked == False,  # noqa: E712
        )

    async def revoke_refresh_token(self, token_hash: str) -> None:
        token = await self.get_refresh_token_by_hash(token_hash)
        if token:
            token.revoked = True
            await token.save()

    async def revoke_all_user_tokens(self, user_id: UUID) -> None:
        tokens = await UserRefreshTokenModel.find(
            UserRefreshTokenModel.user_id == user_id,
            UserRefreshTokenModel.revoked == False,  # noqa: E712
        ).to_list()
        for token in tokens:
            token.revoked = True
            await token.save()
