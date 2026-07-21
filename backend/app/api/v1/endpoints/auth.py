from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.v1.deps import get_current_user, get_db
from app.core.security import verify_token
from app.models.user import User
from app.schemas.user import LoginRequest, TokenRequest, TokenResponse, UserCreate
from app.services.user_service import user_service

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/register", response_model=TokenResponse, status_code=201)
async def register(data: UserCreate, db: Session = Depends(get_db)):
    user = user_service.register(db, data)
    access_token, refresh_token = user_service.create_tokens(user.id, user.email)
    return TokenResponse(access_token=access_token, refresh_token=refresh_token)


@router.post("/login", response_model=TokenResponse)
async def login(data: LoginRequest, db: Session = Depends(get_db)):
    user = user_service.authenticate(db, data.email, data.password)
    access_token, refresh_token = user_service.create_tokens(user.id, user.email)
    return TokenResponse(access_token=access_token, refresh_token=refresh_token)


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(data: TokenRequest, db: Session = Depends(get_db)):
    payload = verify_token(data.refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token inválido")
    access_token, new_refresh = user_service.create_tokens(int(payload["sub"]), payload["email"])
    return TokenResponse(access_token=access_token, refresh_token=new_refresh)


@router.post("/logout")
async def logout():
    return {"message": "Sesión cerrada correctamente"}


@router.get("/me", response_model=UserResponse)
async def me(current_user: User = Depends(get_current_user)):
    return current_user
