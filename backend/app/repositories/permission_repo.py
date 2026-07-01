from sqlalchemy.orm import Session
from app.models.permission import RolePermission
from app.schemas.permission import DEFAULT_PERMISSIONS, PERMISSION_CATALOG


def seed_defaults(db: Session) -> None:
    """Siembra los permisos por defecto si la tabla está vacía."""
    if db.query(RolePermission).count() > 0:
        return
    for role, perms in DEFAULT_PERMISSIONS.items():
        for key, allowed in perms.items():
            db.add(RolePermission(role=role, key=key, allowed=allowed))
    db.commit()


def get_all(db: Session) -> list[RolePermission]:
    return db.query(RolePermission).order_by(RolePermission.role, RolePermission.key).all()


def get_by_role(db: Session, role: str) -> list[RolePermission]:
    return db.query(RolePermission).filter(RolePermission.role == role).all()


def get_map_for_role(db: Session, role: str) -> dict[str, bool]:
    """Devuelve {key: allowed} para un rol. Incluye defaults si faltan claves."""
    rows = {r.key: r.allowed for r in get_by_role(db, role)}
    # Asegurar que todas las claves del catálogo estén presentes
    defaults = DEFAULT_PERMISSIONS.get(role, {})
    return {k: rows.get(k, defaults.get(k, False)) for k in PERMISSION_CATALOG}


def toggle(db: Session, role: str, key: str, allowed: bool) -> RolePermission | None:
    if key not in PERMISSION_CATALOG:
        return None
    row = db.query(RolePermission).filter(
        RolePermission.role == role,
        RolePermission.key == key,
    ).first()
    if row:
        row.allowed = allowed
    else:
        row = RolePermission(role=role, key=key, allowed=allowed)
        db.add(row)
    db.commit()
    db.refresh(row)
    return row


def reset_role(db: Session, role: str) -> None:
    """Restaura los permisos de un rol a sus valores por defecto."""
    db.query(RolePermission).filter(RolePermission.role == role).delete()
    for key, allowed in DEFAULT_PERMISSIONS.get(role, {}).items():
        db.add(RolePermission(role=role, key=key, allowed=allowed))
    db.commit()
