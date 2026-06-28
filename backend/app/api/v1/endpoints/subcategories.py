from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.api.v1.deps import get_db, get_current_user
from app.models.user import User
from app.repositories.subcategory_repo import subcategory_repo
from app.schemas.subcategory import SubcategoryCreate, SubcategoryUpdate, SubcategoryResponse

router = APIRouter(prefix="/subcategories", tags=["Subcategories"])


@router.get("", response_model=List[SubcategoryResponse])
def list_subcategories(category_id: int | None = None, db: Session = Depends(get_db)):
    if category_id:
        return subcategory_repo.get_by_category(db, category_id)
    return subcategory_repo.get_all(db)


@router.post("", response_model=SubcategoryResponse, status_code=201)
def create_subcategory(
    data: SubcategoryCreate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return subcategory_repo.create(db, data)


@router.put("/{sub_id}", response_model=SubcategoryResponse)
def update_subcategory(
    sub_id: int,
    data: SubcategoryUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    sub = subcategory_repo.update(db, sub_id, data)
    if not sub:
        raise HTTPException(status_code=404, detail="Tipo no encontrado")
    return sub


@router.delete("/{sub_id}", status_code=204)
def delete_subcategory(
    sub_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    if not subcategory_repo.delete(db, sub_id):
        raise HTTPException(status_code=404, detail="Tipo no encontrado")
