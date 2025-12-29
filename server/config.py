import os
from dotenv import load_dotenv

# Load environment variables from .env (only used locally)
load_dotenv()


class Config:
    # --- General ---
    FLASK_ENV = os.getenv("FLASK_ENV", "production")
    SECRET_KEY = os.getenv("SECRET_KEY", "change-me")
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "jwt-change-me")

    # --- Database ---
    DATABASE_URL = os.getenv(
        "DATABASE_URL",
        "postgresql://afyalink_db_1yp7_user:nL4lXimNNxQu2o1JtP3VxcqxDgmlaQ8O@dpg-d59bi0lactks73bovbsg-a.oregon-postgres.render.com/afyalink_db_1yp7",
    )

    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

    SQLALCHEMY_DATABASE_URI = DATABASE_URL
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # --- Pagination ---
    ITEMS_PER_PAGE = int(os.getenv("ITEMS_PER_PAGE", 12))

    # --- Third-party Integrations ---
    SENDGRID_API_KEY = os.getenv("SENDGRID_API_KEY", "")
    CLOUDINARY_CLOUD_NAME = os.getenv("CLOUDINARY_CLOUD_NAME", "")
    CLOUDINARY_API_KEY = os.getenv("CLOUDINARY_API_KEY", "")
    CLOUDINARY_API_SECRET = os.getenv("CLOUDINARY_API_SECRET", "")
