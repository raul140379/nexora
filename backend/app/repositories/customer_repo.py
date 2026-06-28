from sqlalchemy.orm import Session
from app.models.customer import Customer
from app.schemas.customer import CustomerCreate, CustomerUpdate
from .base import BaseRepository


class CustomerRepository(BaseRepository[Customer, CustomerCreate, CustomerUpdate]):
    def get_by_email(self, db: Session, email: str):
        return db.query(self.model).filter(self.model.email == email).first()

    def get_by_document(self, db: Session, document_number: str):
        return db.query(self.model).filter(self.model.document_number == document_number).first()

    def search(self, db: Session, query: str, skip: int = 0, limit: int = 50):
        q = f"%{query}%"
        return (
            db.query(self.model)
            .filter(
                self.model.name.ilike(q)
                | self.model.email.ilike(q)
                | self.model.document_number.ilike(q)
            )
            .offset(skip)
            .limit(limit)
            .all()
        )


customer_repo = CustomerRepository(Customer)
