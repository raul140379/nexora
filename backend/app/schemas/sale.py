from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from decimal import Decimal
from datetime import datetime
from app.models.sale import SaleStatus


class SaleItemCreate(BaseModel):
    product_id: int
    pack_price_id: int           # ID de la presentación en product_prices
    quantity: int
    unit_price: Decimal
    price_tier_name: str = "Unidad"


class SaleItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    product_id: int
    pack_price_id: int
    quantity: int
    unit_price: Decimal
    price_tier_name: str
    subtotal: Decimal


class SaleCreate(BaseModel):
    customer_id: Optional[int] = None
    notes: Optional[str] = None
    discount_pct: Decimal = Decimal("0")
    items: List[SaleItemCreate]


class SaleUpdate(BaseModel):
    status: Optional[SaleStatus] = None
    notes: Optional[str] = None
    discount_pct: Optional[Decimal] = None


class SaleResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    customer_id: Optional[int]
    user_id: int
    total: Decimal
    discount_pct: Decimal
    status: SaleStatus
    notes: Optional[str]
    items: List[SaleItemResponse] = []
    created_at: datetime
    updated_at: datetime
