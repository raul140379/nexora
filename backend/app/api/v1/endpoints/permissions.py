from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Literal

from app.api.v1.deps import get_db, get_current_admin, get_current_user
from app.models.user import User
from app.repositories import permission_repo
from app.schemas.permission import (
    RolePermissionsResponse, PermissionItem, PermissionToggle, PERMISSION_CATALOG
)

router = APIRouter(prefix="/permissions", tags=["Permissions"])

RoleType = Literal["admin", "ejecutivo", "vendedor"]


@router.get("/me", response_model=dict[str, bool])
def my_permissions(
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    """Devuelve el mapa de permisos del usuario autenticado."""
    permission_repo.seed_defaults(db)
    return permission_repo.get_map_for_role(db, current.role)


@router.get("", response_model=list[RolePermissionsResponse])
def list_all_permissions(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    """Lista todos los permisos agrupados por rol (solo admin)."""
    permission_repo.seed_defaults(db)
    result = []
    for role in ["admin", "ejecutivo", "vendedor"]:
        perms_map = permission_repo.get_map_for_role(db, role)
        result.append(RolePermissionsResponse(
            role=role,
            permissions=[
                PermissionItem(key=k, label=PERMISSION_CATALOG[k], allowed=perms_map[k])
                for k in PERMISSION_CATALOG
            ]
        ))
    return result


@router.put("/{role}/{key}", response_model=PermissionItem)
def update_permission(
    role: RoleType,
    key: str,
    data: PermissionToggle,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_admin),
):
    """Activa o desactiva un permiso para un rol (solo admin)."""
    if key not in PERMISSION_CATALOG:
        raise HTTPException(status_code=404, detail="Permiso no encontrado")
    # El admin no puede quitarse manage_users a sí mismo
    if role == "admin" and key == "manage_users" and not data.allowed:
        raise HTTPException(status_code=400, detail="No se puede desactivar 'manage_users' del rol admin")
    row = permission_repo.toggle(db, role, key, data.allowed)
    return PermissionItem(key=row.key, label=PERMISSION_CATALOG[row.key], allowed=row.allowed)


@router.post("/{role}/reset")
def reset_role_permissions(
    role: RoleType,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    """Restaura los permisos de un rol a sus valores por defecto."""
    permission_repo.reset_role(db, role)
    return {"message": f"Permisos de '{role}' restaurados a valores por defecto"}
