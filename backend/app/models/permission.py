from sqlalchemy import Column, Integer, String, Boolean, UniqueConstraint
from app.db.base import Base


class RolePermission(Base):
    __tablename__ = "role_permissions"

    id      = Column(Integer, primary_key=True, index=True)
    role    = Column(String, nullable=False)   # admin | ejecutivo | vendedor
    key     = Column(String, nullable=False)   # permission key
    allowed = Column(Boolean, default=True, nullable=False)

    __table_args__ = (UniqueConstraint("role", "key", name="uq_role_key"),)
