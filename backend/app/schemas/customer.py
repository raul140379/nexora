from pydantic import BaseModel, ConfigDict, EmailStr
from typing import Optional
from datetime import datetime


class CustomerCreate(BaseModel):
    name: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    document_type: Optional[str] = None
    document_number: Optional[str] = None


class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    document_type: Optional[str] = None
    document_number: Optional[str] = None
    is_active: Optional[bool] = None


class CustomerResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: Optional[str]
    phone: Optional[str]
    address: Optional[str]
    document_type: Optional[str]
    document_number: Optional[str]
    is_active: bool
    created_at: datetime
    updated_at: datetime
