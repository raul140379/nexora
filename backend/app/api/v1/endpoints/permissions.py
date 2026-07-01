from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict

from app.api.v1.deps import get_db, get_current_admin, get_current_user
from app.models.user import User
from app.repositories.permission_repo import (
    seed_defaults, get_map_for_role, toggle, reset_role
)
from app.schemas.permission import (
    RolePermissionsResponse, PermissionItem, PermissionToggle, PERMISSION_CATALOG
)

router = APIRouter(prefix="/permissions", tags=["Permissions"])

VALID_ROLES = ("admin", "ejecutivo", "vendedor")


@router.get("/me", response_model=Dict[str, bool])
def my_permissions(
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    seed_defaults(db)
    return get_map_for_role(db, current.role)


@router.get("", response_model=List[RolePermissionsResponse])
def list_all_permissions(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    seed_defaults(db)
    result = []
    for role in VALID_ROLES:
        perms_map = get_map_for_role(db, role)
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
    role: str,
    key: str,
    data: PermissionToggle,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_admin),
):
    if role not in VALID_ROLES:
        raise HTTPException(status_code=400, detail="Rol inválido")
    if key not in PERMISSION_CATALOG:
        raise HTTPException(status_code=404, detail="Permiso no encontrado")
    if role == "admin" and key == "manage_users" and not data.allowed:
        raise HTTPException(status_code=400, detail="No se puede desactivar 'manage_users' del rol admin")
    row = toggle(db, role, key, data.allowed)
    return PermissionItem(key=row.key, label=PERMISSION_CATALOG[row.key], allowed=row.allowed)


@router.post("/{role}/reset")
def reset_role_permissions(
    role: str,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    if role not in VALID_ROLES:
        raise HTTPException(status_code=400, detail="Rol inválido")
    reset_role(db, role)
    return {"message": f"Permisos de '{role}' restaurados a valores por defecto"}
