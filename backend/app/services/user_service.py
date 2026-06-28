from datetime import timedelta
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import get_password_hash, verify_password, create_access_token, create_refresh_token
from app.repositories.user_repo import user_repo
from app.schemas.user import UserCreate


class UserService:
    def register(self, db: Session, data: UserCreate):
        if user_repo.get_by_email(db, data.email):
            raise HTTPException(status_code=400, detail="El email ya está registrado")
        if user_repo.get_by_username(db, data.username):
            raise HTTPException(status_code=400, detail="El nombre de usuario ya está en uso")

        hashed = get_password_hash(data.password)
        return user_repo.create(db, data.email, data.username, hashed, data.full_name)

    def authenticate(self, db: Session, email: str, password: str):
        user = user_repo.get_by_email(db, email)
        if not user or not verify_password(password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Email o contraseña incorrectos",
            )
        if not user.is_active:
            raise HTTPException(status_code=400, detail="Cuenta desactivada")
        return user

    def create_tokens(self, user_id: int, email: str) -> tuple[str, str]:
        access_token = create_access_token(
            data={"sub": str(user_id), "email": email},
            expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
        )
        refresh_token = create_refresh_token(
            data={"sub": str(user_id), "email": email}
        )
        return access_token, refresh_token


user_service = UserService()
