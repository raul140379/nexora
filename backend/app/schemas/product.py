from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from decimal import Decimal
from datetime import datetime
from .category import CategoryResponse
from .subcategory import SubcategoryResponse
from .product_price import ProductPriceCreate, ProductPriceResponse


class ProductCreate(BaseModel):
    name: str
    description: Optional[str] = None
    sku: Optional[str] = None
    price: Decimal = Decimal("0")          # precio base (price_a de Unidad)
    stock: int = 0
    category_id: Optional[int] = None
    subcategory_id: Optional[int] = None
    prices: List[ProductPriceCreate] = []  # empaques con 3 precios c/u


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    sku: Optional[str] = None
    price: Optional[Decimal] = None
    stock: Optional[int] = None
    category_id: Optional[int] = None
    subcategory_id: Optional[int] = None
    is_active: Optional[bool] = None


class ProductResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    description: Optional[str]
    sku: Optional[str]
    price: Decimal
    stock: int
    is_active: bool
    category_id: Optional[int]
    subcategory_id: Optional[int]
    category: Optional[CategoryResponse] = None
    subcategory: Optional[SubcategoryResponse] = None
    prices: List[ProductPriceResponse] = []
    created_at: datetime
    updated_at: datetime
