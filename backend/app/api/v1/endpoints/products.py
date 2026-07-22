from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import List

from app.api.v1.deps import get_db, get_current_user, get_current_admin
from app.models.user import User
from app.models.product_price import ProductPrice
from app.repositories.product_repo import product_repo
from app.schemas.product import ProductCreate, ProductUpdate, ProductResponse


class StockAdjust(BaseModel):
    quantity: int

router = APIRouter(prefix="/products", tags=["Products"])


@router.get("", response_model=List[ProductResponse])
def list_products(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return product_repo.get_all_with_details(db, skip=skip, limit=limit)


@router.post("", response_model=ProductResponse, status_code=201)
def create_product(
    data: ProductCreate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    if data.sku and product_repo.get_by_sku(db, data.sku):
        raise HTTPException(status_code=400, detail="Ya existe un producto con ese SKU")
    return product_repo.create_with_prices(db, data)


@router.get("/{product_id}", response_model=ProductResponse)
def get_product(product_id: int, db: Session = Depends(get_db)):
    prod = product_repo.get_with_details(db, product_id)
    if not prod:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return prod


@router.put("/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: int,
    data: ProductCreate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    if data.sku:
        existing = product_repo.get_by_sku(db, data.sku)
        if existing and existing.id != product_id:
            raise HTTPException(status_code=400, detail="Ya existe otro producto con ese SKU")
    prod = product_repo.update_with_prices(db, product_id, data)
    if not prod:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return prod


@router.delete("/{product_id}", status_code=204)
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    if not product_repo.delete(db, product_id):
        raise HTTPException(status_code=404, detail="Producto no encontrado")


@router.delete("")
def delete_all_products(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    products = db.query(product_repo.model).all()
    for p in products:
        db.delete(p)
    db.commit()
    return {"deleted": len(products)}


@router.patch("/{product_id}", response_model=ProductResponse)
def patch_product(
    product_id: int,
    data: ProductUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    prod = db.query(product_repo.model).filter(product_repo.model.id == product_id).first()
    if not prod:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(prod, field, value)
    db.commit()
    return product_repo.get_with_details(db, product_id)


@router.patch("/prices/{pack_price_id}/stock")
def adjust_stock(
    pack_price_id: int,
    data: StockAdjust,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    pp = db.query(ProductPrice).filter(ProductPrice.id == pack_price_id).first()
    if not pp:
        raise HTTPException(status_code=404, detail="Presentación no encontrada")
    pp.stock = max(0, pp.stock + data.quantity)
    db.commit()
    return {"id": pp.id, "pack_name": pp.pack_name, "stock": pp.stock}
