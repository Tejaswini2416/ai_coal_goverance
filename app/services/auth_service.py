"""
Authentication Service — JWT issue/refresh/revoke + RBAC/ABAC enforcement.
"""
import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from uuid import UUID, uuid4

from jose import JWTError, jwt
import bcrypt

from app.config import settings
from app.domain.enums import UserRole
from app.infrastructure.database.models import UserModel, UserRefreshTokenModel
from app.infrastructure.repositories.user_repository import UserRepository

# ── Password hashing ──────────────────────────────────────────────────────────
def hash_password(plain: str) -> str:
    pwd_bytes = plain.encode("utf-8")
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pwd_bytes, salt).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False


def _hash_token(token: str) -> str:
    """SHA-256 hash of a raw refresh token for safe DB storage."""
    return hashlib.sha256(token.encode()).hexdigest()


# ── JWT helpers ───────────────────────────────────────────────────────────────
def _utcnow() -> datetime:
    return datetime.now(tz=timezone.utc)


def create_access_token(user: UserModel) -> str:
    expire = _utcnow() + timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {
        "sub":         str(user.id),
        "email":       user.email,
        "role":        user.role,
        "tenant_id":   str(user.tenant_id),
        "tenant_path": str(user.tenant_path),   # ltree path string (Refinement 1)
        "exp":         expire,
        "iat":         _utcnow(),
        "jti":         uuid4().hex,
    }
    return jwt.encode(payload, settings.APP_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def decode_access_token(token: str) -> dict:
    try:
        return jwt.decode(token, settings.APP_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
    except JWTError as e:
        raise ValueError(f"Invalid token: {e}") from e


# ── Auth Service ──────────────────────────────────────────────────────────────
class AuthService:
    def __init__(self, user_repo: UserRepository) -> None:
        self._user_repo = user_repo

    async def login(
        self, email: str, password: str
    ) -> tuple[str, str, UserModel]:
        """Authenticate user, return (access_token, refresh_token, user)."""
        user = await self._user_repo.get_by_email(email)
        if not user or not user.is_active:
            raise PermissionError("Invalid credentials.")
        if not verify_password(password, user.hashed_password):
            raise PermissionError("Invalid credentials.")

        access_token  = create_access_token(user)
        refresh_token = await self._issue_refresh_token(user)

        # Update last_login_at
        user.last_login_at = _utcnow()
        await self._user_repo.update(user)

        return access_token, refresh_token, user

    async def _issue_refresh_token(self, user: UserModel) -> str:
        raw_token = secrets.token_urlsafe(64)
        token_hash = _hash_token(raw_token)
        expires_at = _utcnow() + timedelta(days=settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS)
        record = UserRefreshTokenModel(
            user_id    = user.id,
            token_hash = token_hash,
            expires_at = expires_at,
        )
        await self._user_repo.create_refresh_token(record)
        return raw_token

    async def refresh(self, raw_refresh_token: str) -> tuple[str, str]:
        """Validate refresh token, rotate it, return new (access_token, refresh_token)."""
        token_hash = _hash_token(raw_refresh_token)
        token_record = await self._user_repo.get_refresh_token_by_hash(token_hash)
        if not token_record or token_record.revoked:
            raise PermissionError("Refresh token invalid or revoked.")
        exp = token_record.expires_at
        if exp.tzinfo is None:
            exp = exp.replace(tzinfo=timezone.utc)
        if exp < _utcnow():
            raise PermissionError("Refresh token expired.")

        user = await self._user_repo.get_by_id(token_record.user_id)
        if not user or not user.is_active:
            raise PermissionError("User not found or inactive.")

        # Rotate: revoke old, issue new
        await self._user_repo.revoke_refresh_token(token_hash)
        new_access  = create_access_token(user)
        new_refresh = await self._issue_refresh_token(user)
        return new_access, new_refresh

    async def logout(self, raw_refresh_token: str) -> None:
        token_hash = _hash_token(raw_refresh_token)
        await self._user_repo.revoke_refresh_token(token_hash)

    async def logout_all(self, user_id: UUID) -> None:
        await self._user_repo.revoke_all_user_tokens(user_id)

    # ── RBAC / ABAC helpers ───────────────────────────────────────────────────
    @staticmethod
    def require_role(user_role: str, *allowed_roles: UserRole) -> None:
        if UserRole(user_role) not in allowed_roles:
            raise PermissionError(
                f"Role '{user_role}' is not authorized. Required: {[r.value for r in allowed_roles]}"
            )

    @staticmethod
    def require_tenant_scope(user_tenant_path: str, target_tenant_path: str, user_role: str) -> None:
        """
        ABAC check: ensure user can access data at target_tenant_path.
        MINISTRY_AUDITOR can access any path.
        All others: target must be at-or-below user's own node (ltree descendant check).
        """
        if UserRole(user_role) == UserRole.MINISTRY_AUDITOR:
            return   # Full cross-tenant access
        # target_path must start with user's path
        if target_tenant_path != user_tenant_path and \
                not target_tenant_path.startswith(user_tenant_path + "."):
            raise PermissionError(
                f"Access denied: '{target_tenant_path}' is outside your organizational scope '{user_tenant_path}'."
            )
