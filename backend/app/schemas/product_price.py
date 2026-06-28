from pydantic import BaseModel, ConfigDict
from decimal import Decimal
from typing import Optional


class ProductPriceCreate(BaseModel):
    pack_name: str
    units_per_pack: int = 1
    price_a: Decimal
    price_b: Optional[Decimal] = None
    price_c: Optional[Decimal] = None
    stock: int = 0


class ProductPriceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    pack_name: str
    units_per_pack: int
    price_a: Decimal
    price_b: Optional[Decimal]
    price_c: Optional[Decimal]
    stock: int
