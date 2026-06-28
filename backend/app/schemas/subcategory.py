from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime


class SubcategoryCreate(BaseModel):
    category_id: int
    name: str


class SubcategoryUpdate(BaseModel):
    name: Optional[str] = None
    is_active: Optional[bool] = None


class SubcategoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    category_id: int
    name: str
    is_active: bool
    created_at: datetime
    updated_at: datetime
