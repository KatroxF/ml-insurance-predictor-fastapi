from dotenv import load_dotenv
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


if not os.getenv("DOCKER"):
    load_dotenv(os.path.join(BASE_DIR, ".env"))

SECRET_KEY = os.getenv("SECRET_KEY")
SQLALCHEMY_DATABASE_URL = os.getenv("SQLALCHEMY_DATABASE_URL")

if not SECRET_KEY:
    raise ValueError("SECRET_KEY is missing")

if not SQLALCHEMY_DATABASE_URL:
    raise ValueError("DATABASE_URL is missing")