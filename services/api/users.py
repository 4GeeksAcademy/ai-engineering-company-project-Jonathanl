from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status

from services.api.security import get_current_user, get_user_service, hash_password, require_admin
from services.api.user_models import User, UserCreate, UserPublic, UserRole, UserUpdate
from services.api.user_service import LastActiveAdminError, UserService
from services.api.user_store import DuplicateEmailError


router = APIRouter(prefix="/users", tags=["users"])


@router.post("", response_model=UserPublic, status_code=status.HTTP_201_CREATED)
def register_user(user_data: UserCreate, users: UserService = Depends(get_user_service)):
    hashed_password = hash_password(user_data.password.get_secret_value())
    try:
        user, _ = users.create_user(user_data, hashed_password, role=UserRole.USER)
    except DuplicateEmailError as error:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(error)) from error
    return user


@router.get("", response_model=list[UserPublic])
def list_users(
    users: UserService = Depends(get_user_service),
    _admin: User = Depends(require_admin),
):
    return users.list_users()


@router.get("/{user_id}", response_model=UserPublic)
def get_user(
    user_id: UUID,
    current_user: User = Depends(get_current_user),
    users: UserService = Depends(get_user_service),
):
    user = users.get_user_by_id(user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado.")
    if current_user.id != user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No puedes consultar este usuario.")
    return user


@router.put("/{user_id}", response_model=UserPublic)
def update_user(
    user_id: UUID,
    update: UserUpdate,
    current_user: User = Depends(get_current_user),
    users: UserService = Depends(get_user_service),
):
    is_admin = current_user.role == UserRole.ADMIN
    if current_user.id != user_id and not is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No puedes modificar este usuario.")
    if "role" in update.model_fields_set and not is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Solo admin puede cambiar roles.")
    try:
        user = users.update_user(user_id, update)
    except DuplicateEmailError as error:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(error)) from error
    except LastActiveAdminError as error:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(error)) from error
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado.")
    return user


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: UUID,
    users: UserService = Depends(get_user_service),
    _admin: User = Depends(require_admin),
):
    try:
        user = users.delete_user(user_id)
    except LastActiveAdminError as error:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(error)) from error
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado.")