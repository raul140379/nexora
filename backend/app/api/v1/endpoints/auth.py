from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.v1.deps import get_current_user, get_db
from app.core.security import verify_token, get_password_hash
from app.models.user import User
from app.repositories.user_repo import user_repo
from app.schemas.user import LoginRequest, TokenRequest, TokenResponse, UserCreate, UserResponse
from app.services.user_service import user_service

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/setup", response_model=TokenResponse, status_code=201, tags=["Auth"])
async def setup_admin(data: UserCreate, db: Session = Depends(get_db)):
    """Crea el primer administrador. Devuelve 403 si ya existe algún admin."""
    existing_admin = db.query(User).filter(User.role == "admin").first()
    if existing_admin:
        raise HTTPException(status_code=403, detail="El sistema ya tiene un administrador configurado")
    hashed = get_password_hash(data.password)
    admin = user_repo.create(db, data.email, data.username, hashed, data.full_name, role="admin")
    access_token, refresh_token = user_service.create_tokens(admin.id, admin.email)
    return TokenResponse(access_token=access_token, refresh_token=refresh_token)


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
