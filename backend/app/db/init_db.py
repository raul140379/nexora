from app.db.base import Base
from app.db.session import engine
import app.models.user  # noqa
import app.models.category  # noqa
import app.models.subcategory  # noqa
import app.models.product  # noqa
import app.models.product_price  # noqa
import app.models.customer  # noqa
import app.models.sale  # noqa


def init_db():
    Base.metadata.create_all(bind=engine)
