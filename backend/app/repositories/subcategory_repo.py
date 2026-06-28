from sqlalchemy.orm import Session
from app.models.subcategory import Subcategory
from app.schemas.subcategory import SubcategoryCreate, SubcategoryUpdate
from .base import BaseRepository


class SubcategoryRepository(BaseRepository[Subcategory, SubcategoryCreate, SubcategoryUpdate]):
    def get_by_category(self, db: Session, category_id: int):
        return db.query(self.model).filter(
            self.model.category_id == category_id,
            self.model.is_active == True
        ).all()


subcategory_repo = SubcategoryRepository(Subcategory)
