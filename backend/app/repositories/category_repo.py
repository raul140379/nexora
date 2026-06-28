from sqlalchemy.orm import Session
from app.models.category import Category
from app.schemas.category import CategoryCreate, CategoryUpdate
from .base import BaseRepository


class CategoryRepository(BaseRepository[Category, CategoryCreate, CategoryUpdate]):
    def get_by_name(self, db: Session, name: str):
        return db.query(self.model).filter(self.model.name == name).first()

    def get_all_active(self, db: Session):
        return db.query(self.model).filter(self.model.is_active == True).all()


category_repo = CategoryRepository(Category)
