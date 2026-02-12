from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
import os
from dotenv import load_dotenv

load_dotenv()

# Get database URL from environment variable
# Default to SQLite for easy local development (no PostgreSQL server required)
# For production, set DATABASE_URL to your PostgreSQL connection string
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "sqlite+aiosqlite:///./hrms_lite.db",
)

# Render and other hosts often give postgres://; SQLAlchemy async needs postgresql+asyncpg://
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+asyncpg://", 1)

# Require SSL for production Postgres (e.g. Render)
if DATABASE_URL.startswith("postgresql"):
    if "?" in DATABASE_URL:
        DATABASE_URL += "&ssl=require"
    else:
        DATABASE_URL += "?ssl=require"

# Create async engine
engine = create_async_engine(
    DATABASE_URL,
    echo=False,  # Set to True for SQL query logging
    future=True,
)

# Create async session factory
async_session_maker = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False
)

# Base class for models
Base = declarative_base()

# Dependency to get DB session
async def get_db():
    async with async_session_maker() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
