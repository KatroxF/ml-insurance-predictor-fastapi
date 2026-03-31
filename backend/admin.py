from backend.database import SessionLocal
from backend import models
from backend.utils import hashed_password   # your function

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