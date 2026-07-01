from fastapi import APIRouter
from app.api.v1.endpoints import auth, categories, subcategories, products, customers, sales, users, permissions

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(categories.router)
api_router.include_router(subcategories.router)
api_router.include_router(products.router)
api_router.include_router(customers.router)
api_router.include_router(sales.router)
api_router.include_router(users.router)
api_router.include_router(permissions.router)
