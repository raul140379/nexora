from sqlalchemy import Column, Integer, String, Numeric, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base import Base


class ProductPrice(Base):
    __tablename__ = "product_prices"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    pack_name = Column(String(50), nullable=False)       # "Unidad", "Caja x12", "Paquete x6"
    units_per_pack = Column(Integer, default=1, nullable=False)
    price_a = Column(Numeric(10, 2), nullable=False)
    price_b = Column(Numeric(10, 2), nullable=True)
    price_c = Column(Numeric(10, 2), nullable=True)
    stock = Column(Integer, default=0, nullable=False)

    product = relationship("Product", back_populates="prices")
