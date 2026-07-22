from typing import Optional, Dict, List
from sqlalchemy.orm import Session
from app.models.permission import RolePermission
from app.schemas.permission import DEFAULT_PERMISSIONS, PERMISSION_CATALOG


def seed_defaults(db: Session) -> None:
    for role, perms in DEFAULT_PERMISSIONS.items():
        for key, allowed in perms.items():
            row = db.query(RolePermission).filter(
                RolePermission.role == role, RolePermission.key == key
            ).first()
            if row:
                row.allowed = allowed
            else:
                db.add(RolePermission(role=role, key=key, allowed=allowed))
    db.commit()


def get_by_role(db: Session, role: str) -> List[RolePermission]:
    return db.query(RolePermission).filter(RolePermission.role == role).all()


def get_map_for_role(db: Session, role: str) -> Dict[str, bool]:
    rows = {r.key: r.allowed for r in get_by_role(db, role)}
    defaults = DEFAULT_PERMISSIONS.get(role, {})
    return {k: rows.get(k, defaults.get(k, False)) for k in PERMISSION_CATALOG}


def toggle(db: Session, role: str, key: str, allowed: bool) -> Optional[RolePermission]:
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
    db.query(RolePermission).filter(RolePermission.role == role).delete()
    for key, allowed in DEFAULT_PERMISSIONS.get(role, {}).items():
        db.add(RolePermission(role=role, key=key, allowed=allowed))
    db.commit()
