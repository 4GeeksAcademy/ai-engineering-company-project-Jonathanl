from datetime import datetime, timezone
from uuid import UUID, uuid4

from services.api.database import CompanyDatabase
from services.api.user_models import Profile, ProfileUpdate, User, UserCreate, UserRole, UserUpdate
from services.api.user_store import DuplicateEmailError, ProfileStore, UserStore, normalize_email


class LastActiveAdminError(ValueError):
    pass


class UserService:
    def __init__(self, database: CompanyDatabase):
        self._lock = database.lock
        self.users = UserStore(database)
        self.profiles = ProfileStore(database)

    def create_user(
        self,
        user_data: UserCreate,
        hashed_password: str,
        role: UserRole = UserRole.USER,
        is_active: bool = True,
    ) -> tuple[User, Profile]:
        if not hashed_password:
            raise ValueError("hashed_password no puede estar vacío.")

        email = normalize_email(str(user_data.email))
        user = User(
            id=uuid4(),
            email=email,
            hashed_password=hashed_password,
            is_active=is_active,
            role=role,
            created_at=datetime.now(timezone.utc),
        )
        profile = Profile(
            id=uuid4(),
            user_id=user.id,
            name=user_data.name,
            phone=user_data.phone,
            address=user_data.address,
        )

        with self._lock:
            if self.users.get_by_email(email) is not None:
                raise DuplicateEmailError("Ya existe un usuario con ese email.")
            self.users.create(user)
            try:
                self.profiles.create(profile)
            except Exception:
                self.profiles.delete_by_user_id(user.id)
                self.users.delete(user.id)
                raise
        return user, profile

    def list_users(self) -> list[User]:
        return self.users.list()

    def get_user_by_id(self, user_id: UUID) -> User | None:
        return self.users.get_by_id(user_id)

    def get_user_by_email(self, email: str) -> User | None:
        return self.users.get_by_email(email)

    def update_user(self, user_id: UUID, update: UserUpdate) -> User | None:
        with self._lock:
            user = self.users.get_by_id(user_id)
            if user is None:
                return None
            changes = update.model_dump(exclude_unset=True)
            if user.is_active and user.role == UserRole.ADMIN and changes.get("role") != UserRole.ADMIN:
                active_admins = [item for item in self.users.list() if item.is_active and item.role == UserRole.ADMIN]
                if len(active_admins) <= 1:
                    raise LastActiveAdminError("No se puede retirar el rol del último administrador activo.")
            return self.users.update(user_id, update)

    def get_profile(self, user_id: UUID) -> Profile | None:
        return self.profiles.get_by_user_id(user_id)

    def update_profile(self, user_id: UUID, update: ProfileUpdate) -> Profile | None:
        with self._lock:
            if self.users.get_by_id(user_id) is None:
                return None
            return self.profiles.update_by_user_id(user_id, update)

    def delete_user(self, user_id: UUID) -> User | None:
        with self._lock:
            user = self.users.get_by_id(user_id)
            if user is None:
                return None
            if user.is_active and user.role == UserRole.ADMIN:
                active_admins = [item for item in self.users.list() if item.is_active and item.role == UserRole.ADMIN]
                if len(active_admins) <= 1:
                    raise LastActiveAdminError("No se puede eliminar el último administrador activo.")
            user = self.users.delete(user_id)
            try:
                self.profiles.delete_by_user_id(user_id)
            except Exception:
                self.users.create(user)
                raise
            return user