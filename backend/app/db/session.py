from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,      # detecta conexiones muertas antes de usarlas
    pool_recycle=300,        # recicla conexiones cada 5 min (Railway cierra las idle)
)
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    expire_on_commit=False,  # no expira atributos tras commit → evita SELECT extra innecesario
    bind=engine,
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
