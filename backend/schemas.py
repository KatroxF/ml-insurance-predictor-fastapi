from pydantic import BaseModel,EmailStr,Field,field_validator
from typing import Dict
from typing import Optional
from datetime import datetime
class UserCreate(BaseModel):
     username:str
     email:EmailStr
     password:str = Field(..., min_length=8, max_length=128)
class UserinDB(UserCreate):
     hashed_password:str
class Model_input(BaseModel):
    age: int=Field(...,ge=18,description="Age must be greater than 18")
    bmi: float=Field(...,ge=16,le=53.3,description="BMI should be between 16 and 53.3")
    children: int=Field(...,ge=0,le=5,description="No. of children does not exceed more than 5")
    smoker_encoded: int=Field(...,ge=0,le=1)
    @field_validator("age")
    def validate(cls,v):
         if v<18:
              raise ValueError("Age must be greater than 18")
         return v
    @field_validator("bmi")
    def validate_bmi(cls, v):
        if v < 16 or v > 53.3:
            raise ValueError("BMI should be between 16 and 53.3")
        return v
    @field_validator("children")
    def validate_children(cls, v):
        if v < 0 or v > 5:
            raise ValueError("Children must be between 0 and 5")
        return v
    @field_validator("smoker_encoded")
    def validate_smoker(cls, v):
        if v not in [0, 1]:
            raise ValueError("Smoker must be 0 (No) or 1 (Yes)")
        return v
class Output_Schema(BaseModel):
     prediction:int
     id:int
     explanation: Dict[str, float]
     base_value:float
class UserLogin(BaseModel):
     useremail:EmailStr
     password:str
class MessageResponse(BaseModel):
    message: str
class Userout(BaseModel):
     id:int
     username:str
     email:str
     created_at: Optional[datetime] = None
     last_active: Optional[datetime] = None
     
    
class DashboardResponse(BaseModel):
    data: list[Userout]
    total: int
    page: int
    limit: int

