from typing import Optional
from sqlalchemy.orm import Session
from app.models.user import User
from app.repositories.base import BaseRepository


class UserRepository(BaseRepository[User, None, None]):
    def __init__(self):
        super().__init__(User)

    def get_by_email(self, db: Session, email: str) -> Optional[User]:
        return db.query(User).filter(User.email == email).first()

    def get_by_username(self, db: Session, username: str) -> Optional[User]:
        return db.query(User).filter(User.username == username).first()

    def create(self, db: Session, email: str, username: str,
               hashed_password: str, full_name: Optional[str] = None,
               role: str = 'vendedor') -> User:
        user = User(
            email=email,
            username=username,
            hashed_password=hashed_password,
            full_name=full_name,
            role=role,
            is_admin=(role == 'admin'),
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user

    def update(self, db: Session, user: User, **fields) -> User:
        for key, value in fields.items():
            setattr(user, key, value)
        db.commit()
        db.refresh(user)
        return user


user_repo = UserRepository()
