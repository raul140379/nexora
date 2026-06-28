from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.api.v1.deps import get_db, get_current_admin, get_current_user
from app.core.security import get_password_hash
from app.models.user import User
from app.repositories.user_repo import user_repo
from app.schemas.user import UserCreate, UserUpdate, UserResponse

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("", response_model=List[UserResponse])
def list_users(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    return db.query(User).order_by(User.created_at).all()


@router.post("", response_model=UserResponse, status_code=201)
def create_user(
    data: UserCreate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    if user_repo.get_by_email(db, data.email):
        raise HTTPException(status_code=400, detail="El email ya está registrado")
    if user_repo.get_by_username(db, data.username):
        raise HTTPException(status_code=400, detail="El username ya está en uso")
    hashed = get_password_hash(data.password)
    return user_repo.create(db, data.email, data.username, hashed, data.full_name, data.role)


@router.put("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    data: UserUpdate,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_admin),
):
    user = user_repo.get(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    if user_id == current.id and data.role and data.role != 'admin':
        raise HTTPException(status_code=400, detail="No podés quitarte el rol de admin a vos mismo")

    update_fields = data.model_dump(exclude_unset=True)
    if 'password' in update_fields:
        update_fields['hashed_password'] = get_password_hash(update_fields.pop('password'))

    return user_repo.update(db, user, **update_fields)


@router.delete("/{user_id}", status_code=204)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_admin),
):
    if user_id == current.id:
        raise HTTPException(status_code=400, detail="No podés eliminar tu propio usuario")
    user = user_repo.get(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    db.delete(user)
    db.commit()
