from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, Numeric, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.base import Base


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    subcategory_id = Column(Integer, ForeignKey("subcategories.id"), nullable=True)
    name = Column(String(200), nullable=False, index=True)
    description = Column(Text, nullable=True)
    sku = Column(String(50), unique=True, nullable=True, index=True)
    price = Column(Numeric(10, 2), nullable=False)   # precio base (unidad)
    stock = Column(Integer, default=0)               # stock en unidades mínimas
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    category = relationship("Category", backref="products")
    subcategory = relationship("Subcategory", backref="products")
    prices = relationship("ProductPrice", back_populates="product",
                          cascade="all, delete-orphan", order_by="ProductPrice.units_per_pack")
