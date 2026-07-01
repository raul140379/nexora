from sqlalchemy.orm import Session, joinedload
from app.models.sale import Sale, SaleItem
from app.models.product_price import ProductPrice
from app.schemas.sale import SaleCreate, SaleUpdate
from .base import BaseRepository


class SaleRepository(BaseRepository[Sale, SaleCreate, SaleUpdate]):
    def get_with_items(self, db: Session, sale_id: int):
        return (
            db.query(self.model)
            .options(joinedload(self.model.items), joinedload(self.model.customer))
            .filter(self.model.id == sale_id)
            .first()
        )

    def get_all_with_items(self, db: Session, skip: int = 0, limit: int = 50):
        return (
            db.query(self.model)
            .options(joinedload(self.model.items), joinedload(self.model.customer))
            .order_by(self.model.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    def create_with_items(self, db: Session, data: SaleCreate, user_id: int) -> Sale:
        subtotal = sum(item.unit_price * item.quantity for item in data.items)
        discount = data.discount_pct  # already Decimal with default Decimal("0")
        total = subtotal * (1 - discount / 100)

        sale = Sale(
            customer_id=data.customer_id,
            user_id=user_id,
            notes=data.notes,
            discount_pct=discount,
            total=total,
        )
        db.add(sale)
        db.flush()

        for item_data in data.items:
            item = SaleItem(
                sale_id=sale.id,
                product_id=item_data.product_id,
                pack_price_id=item_data.pack_price_id,
                quantity=item_data.quantity,
                unit_price=item_data.unit_price,
                price_tier_name=item_data.price_tier_name,
                subtotal=item_data.unit_price * item_data.quantity,
            )
            db.add(item)
            # Descontar stock de la presentación específica
            pp = db.query(ProductPrice).filter(ProductPrice.id == item_data.pack_price_id).first()
            if pp:
                pp.stock = max(0, pp.stock - item_data.quantity)

        db.commit()
        db.refresh(sale)
        return sale


sale_repo = SaleRepository(Sale)
