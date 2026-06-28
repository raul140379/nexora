from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.api.v1.deps import get_db, get_current_user
from app.models.user import User
from app.repositories.customer_repo import customer_repo
from app.schemas.customer import CustomerCreate, CustomerUpdate, CustomerResponse

router = APIRouter(prefix="/customers", tags=["Customers"])


@router.get("", response_model=List[CustomerResponse])
def list_customers(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    if search:
        return customer_repo.search(db, search, skip=skip, limit=limit)
    return customer_repo.get_all(db, skip=skip, limit=limit)


@router.post("", response_model=CustomerResponse, status_code=201)
def create_customer(
    data: CustomerCreate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    if data.email and customer_repo.get_by_email(db, data.email):
        raise HTTPException(status_code=400, detail="Ya existe un cliente con ese email")
    return customer_repo.create(db, data)


@router.get("/{customer_id}", response_model=CustomerResponse)
def get_customer(
    customer_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    cust = customer_repo.get(db, customer_id)
    if not cust:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return cust


@router.put("/{customer_id}", response_model=CustomerResponse)
def update_customer(
    customer_id: int,
    data: CustomerUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    cust = customer_repo.update(db, customer_id, data)
    if not cust:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return cust


@router.delete("/{customer_id}", status_code=204)
def delete_customer(
    customer_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    if not customer_repo.delete(db, customer_id):
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
