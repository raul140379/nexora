from sqlalchemy.orm import Session, joinedload
from app.models.product import Product
from app.models.product_price import ProductPrice
from app.schemas.product import ProductCreate, ProductUpdate
from .base import BaseRepository


class ProductRepository(BaseRepository[Product, ProductCreate, ProductUpdate]):
    def _opts(self):
        return [
            joinedload(self.model.category),
            joinedload(self.model.subcategory),
            joinedload(self.model.prices),
        ]

    def get_with_details(self, db: Session, product_id: int):
        return db.query(self.model).options(*self._opts()).filter(self.model.id == product_id).first()

    def get_all_with_details(self, db: Session, skip: int = 0, limit: int = 100):
        return db.query(self.model).options(*self._opts()).offset(skip).limit(limit).all()

    def get_by_sku(self, db: Session, sku: str):
        return db.query(self.model).options(*self._opts()).filter(self.model.sku == sku).first()

    def _sync_prices(self, db: Session, product: Product, price_data: list):
        db.query(ProductPrice).filter(ProductPrice.product_id == product.id).delete()
        for p in price_data:
            db.add(ProductPrice(
                product_id=product.id,
                pack_name=p.pack_name,
                units_per_pack=p.units_per_pack,
                price_a=p.price_a,
                price_b=p.price_b,
                price_c=p.price_c,
                stock=p.stock,
            ))

    def create_with_prices(self, db: Session, data: ProductCreate) -> Product:
        # precio base = price_a del primer empaque (Unidad) si existe
        base_price = data.price
        if data.prices:
            base_price = data.prices[0].price_a

        product = Product(
            name=data.name,
            description=data.description,
            sku=data.sku,
            price=base_price,
            stock=data.stock,
            category_id=data.category_id,
            subcategory_id=data.subcategory_id,
        )
        db.add(product)
        db.flush()
        self._sync_prices(db, product, data.prices)
        db.commit()
        db.refresh(product)
        return product

    def update_with_prices(self, db: Session, product_id: int, data: ProductCreate):
        product = self.get(db, product_id)
        if not product:
            return None

        base_price = data.price
        if data.prices:
            base_price = data.prices[0].price_a

        product.name = data.name
        product.description = data.description
        product.sku = data.sku
        product.price = base_price
        product.stock = data.stock
        product.category_id = data.category_id
        product.subcategory_id = data.subcategory_id

        self._sync_prices(db, product, data.prices)
        db.commit()
        db.refresh(product)
        return product

    def update_stock(self, db: Session, product_id: int, quantity_delta: int):
        product = self.get(db, product_id)
        if product:
            product.stock += quantity_delta
            db.commit()
            db.refresh(product)
        return product


product_repo = ProductRepository(Product)
