from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from config import settings

engine = create_engine(
    settings.DATABASE_URL,
    connect_args={
        "ssl_verify_cert": True,
        "ssl_verify_identity": True,
    },
    pool_pre_ping=True,
    pool_recycle=280,
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()