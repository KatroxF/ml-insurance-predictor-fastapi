from sqlalchemy.orm import Session
from . import schemas
from .import models

def create_insurance(db:Session,data:schemas.Model_input,prediction:int,user_id):
    db_data=models.Insurance(
        user_id=user_id,
        age=data.age,
        bmi=data.bmi,
        children=data.children,
        smoker_encoded=data.smoker_encoded,
        prediction=prediction

    )
    db.add(db_data)
    db.commit()
    db.refresh(db_data)
    return db_data

