from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.api.v1.deps import get_db, get_current_user
from app.models.user import User
from app.repositories.sale_repo import sale_repo
from app.repositories.product_repo import product_repo
from app.models.product_price import ProductPrice
from app.schemas.sale import SaleCreate, SaleUpdate, SaleResponse

router = APIRouter(prefix="/sales", tags=["Sales"])


@router.get("", response_model=List[SaleResponse])
def list_sales(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return sale_repo.get_all_with_items(db, skip=skip, limit=limit)


@router.post("", response_model=SaleResponse, status_code=201)
def create_sale(
    data: SaleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not data.items:
        raise HTTPException(status_code=400, detail="La venta debe tener al menos un producto")

    for item in data.items:
        pp = db.query(ProductPrice).filter(ProductPrice.id == item.pack_price_id).first()
        if not pp:
            raise HTTPException(status_code=404, detail=f"Presentación {item.pack_price_id} no encontrada")
        if pp.stock < item.quantity:
            raise HTTPException(
                status_code=400,
                detail=f"Stock insuficiente para '{pp.pack_name}': disponible {pp.stock}",
            )

    return sale_repo.create_with_items(db, data, current_user.id)


@router.get("/{sale_id}", response_model=SaleResponse)
def get_sale(
    sale_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    sale = sale_repo.get_with_items(db, sale_id)
    if not sale:
        raise HTTPException(status_code=404, detail="Venta no encontrada")
    return sale


@router.patch("/{sale_id}", response_model=SaleResponse)
def update_sale_status(
    sale_id: int,
    data: SaleUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    sale = sale_repo.get_with_items(db, sale_id)
    if not sale:
        raise HTTPException(status_code=404, detail="Venta no encontrada")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(sale, field, value)
    db.commit()
    return sale
