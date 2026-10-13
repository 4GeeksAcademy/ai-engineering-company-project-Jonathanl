from fastapi import APIRouter, Depends, HTTPException, status

from services.api.security import get_current_user, get_user_service
from services.api.user_models import Profile, ProfileUpdate, User
from services.api.user_service import UserService


router = APIRouter(prefix="/profiles", tags=["profiles"])


@router.get("/me", response_model=Profile)
def get_my_profile(
    current_user: User = Depends(get_current_user),
    users: UserService = Depends(get_user_service),
):
    profile = users.get_profile(current_user.id)
    if profile is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Perfil no encontrado.")
    return profile


@router.put("/me", response_model=Profile)
def update_my_profile(
    update: ProfileUpdate,
    current_user: User = Depends(get_current_user),
    users: UserService = Depends(get_user_service),
):
    profile = users.update_profile(current_user.id, update)
    if profile is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Perfil no encontrado.")
    return profile