from .database import SessionLocal
from .import models
from .utils import hashed_password   # your function

db = SessionLocal()

admin = models.User(
    username="admin",
    email="admin@gmail.com",
    hashed_password=hashed_password("admin123"),
    role="admin"
)

db.add(admin)
db.commit()
db.refresh(admin)

print("Admin created")