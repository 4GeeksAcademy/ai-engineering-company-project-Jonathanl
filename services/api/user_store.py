from uuid import UUID

from tinydb import Query

from services.api.database import CompanyDatabase
from services.api.user_models import Profile, ProfileUpdate, User, UserUpdate


class DuplicateEmailError(ValueError):
    pass


class DuplicateProfileError(ValueError):
    pass


def normalize_email(email: str) -> str:
    return email.strip().lower()


class UserStore:
    def __init__(self, database: CompanyDatabase):
        self._table = database.table("users")
        self._lock = database.lock

    def create(self, user: User) -> User:
        with self._lock:
            if self._table.contains(Query().email == normalize_email(str(user.email))):
                raise DuplicateEmailError("Ya existe un usuario con ese email.")
            self._table.insert(user.model_dump(mode="json"))
        return user

    def get_by_id(self, user_id: UUID) -> User | None:
        with self._lock:
            record = self._table.get(Query().id == str(user_id))
        return User.model_validate(record) if record is not None else None

    def get_by_email(self, email: str) -> User | None:
        with self._lock:
            record = self._table.get(Query().email == normalize_email(email))
        return User.model_validate(record) if record is not None else None

    def list(self) -> list[User]:
        with self._lock:
            records = self._table.all()
        return [User.model_validate(record) for record in records]

    def update(self, user_id: UUID, update: UserUpdate) -> User | None:
        with self._lock:
            record = self._table.get(Query().id == str(user_id))
            if record is None:
                return None

            user = User.model_validate(record)
            changes = update.model_dump(exclude_unset=True)
            if "email" in changes:
                changes["email"] = normalize_email(str(changes["email"]))
                duplicate = self._table.get(Query().email == changes["email"])
                if duplicate is not None and duplicate["id"] != str(user_id):
                    raise DuplicateEmailError("Ya existe un usuario con ese email.")

            updated = user.model_copy(update=changes)
            self._table.update(updated.model_dump(mode="json"), doc_ids=[record.doc_id])
            return updated

    def delete(self, user_id: UUID) -> User | None:
        with self._lock:
            record = self._table.get(Query().id == str(user_id))
            if record is None:
                return None
            user = User.model_validate(record)
            self._table.remove(doc_ids=[record.doc_id])
            return user


class ProfileStore:
    def __init__(self, database: CompanyDatabase):
        self._table = database.table("profiles")
        self._lock = database.lock

    def create(self, profile: Profile) -> Profile:
        with self._lock:
            if self._table.contains(Query().user_id == str(profile.user_id)):
                raise DuplicateProfileError("El usuario ya tiene un perfil.")
            self._table.insert(profile.model_dump(mode="json"))
        return profile

    def get_by_user_id(self, user_id: UUID) -> Profile | None:
        with self._lock:
            record = self._table.get(Query().user_id == str(user_id))
        return Profile.model_validate(record) if record is not None else None

    def update_by_user_id(self, user_id: UUID, update: ProfileUpdate) -> Profile | None:
        with self._lock:
            record = self._table.get(Query().user_id == str(user_id))
            if record is None:
                return None
            profile = Profile.model_validate(record)
            updated = profile.model_copy(update=update.model_dump(exclude_unset=True))
            self._table.update(updated.model_dump(mode="json"), doc_ids=[record.doc_id])
            return updated

    def delete_by_user_id(self, user_id: UUID) -> Profile | None:
        with self._lock:
            record = self._table.get(Query().user_id == str(user_id))
            if record is None:
                return None
            profile = Profile.model_validate(record)
            self._table.remove(doc_ids=[record.doc_id])
            return profile