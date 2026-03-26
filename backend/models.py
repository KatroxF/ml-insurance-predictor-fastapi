from sqlalchemy import Column,Integer,String,Float,Numeric,DateTime,ForeignKey
from sqlalchemy.sql import func
from .database import Base
from sqlalchemy.orm import relationship

class Insurance(Base):
    __tablename__="insurance_records"
    id=Column(Integer,primary_key=True,index=True)
    user_id = Column(Integer, ForeignKey("User_table.id"), nullable=False)
    age=Column(Integer,nullable=False)
    bmi=Column(Numeric(4,1),nullable=False)
    children=Column(Integer,nullable=False)
    smoker_encoded=Column(Integer)
    prediction = Column(Integer, nullable=False)
    user=relationship("User",back_populates="insurances")

class User(Base):
    __tablename__="User_table"
    id=Column(Integer, primary_key=True, index=True)
    username=Column(String,unique=True, index=True, nullable=False)
    email=Column(String, unique=True, index=True, nullable=False)   
    hashed_password=Column(String, nullable=False)
    role = Column(String, default="user")
    last_active=Column(DateTime(timezone=True), nullable=True)
    created_at=Column(DateTime(timezone=True), server_default=func.now())
    insurances=relationship("Insurance",back_populates="user")