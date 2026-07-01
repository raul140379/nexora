from pydantic import BaseModel
from typing import List, Dict

PERMISSION_CATALOG: Dict[str, str] = {
    "view_revenue":      "Ver montos y recaudación",
    "manage_users":      "Gestionar usuarios y roles",
    "edit_products":     "Crear / editar / eliminar productos",
    "view_customers":    "Ver y gestionar clientes",
    "manage_categories": "Gestionar categorías",
    "view_all_sales":    "Ver todas las ventas",
    "create_sales":      "Crear nuevas ventas",
    "view_reports":      "Ver reportes y estadísticas",
}

DEFAULT_PERMISSIONS: Dict[str, Dict[str, bool]] = {
    "admin": {k: True for k in PERMISSION_CATALOG},
    "ejecutivo": {
        "view_revenue":      True,
        "manage_users":      False,
        "edit_products":     True,
        "view_customers":    True,
        "manage_categories": True,
        "view_all_sales":    True,
        "create_sales":      True,
        "view_reports":      True,
    },
    "vendedor": {
        "view_revenue":      False,
        "manage_users":      False,
        "edit_products":     False,
        "view_customers":    False,
        "manage_categories": False,
        "view_all_sales":    False,
        "create_sales":      True,
        "view_reports":      False,
    },
}


class PermissionItem(BaseModel):
    key:     str
    label:   str
    allowed: bool


class RolePermissionsResponse(BaseModel):
    role:        str
    permissions: List[PermissionItem]


class PermissionToggle(BaseModel):
    allowed: bool


class AdminResetPasswordRequest(BaseModel):
    new_password: str
