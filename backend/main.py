import joblib
import pandas as pd
import numpy as np
import shap
import time
from fastapi import FastAPI, Depends, HTTPException, Query, Request
import logging
from backend.database import engine, SessionLocal, Base
from sqlalchemy.orm import Session

from backend import schemas
from backend import create
from backend import utils
from backend import models

from fastapi.middleware.cors import CORSMiddleware

from backend.auth import create_access_token, get_current_user

from sqlalchemy import func as sqlfunc

from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware




limiter=Limiter(key_func=get_remote_address)

Base.metadata.create_all(bind=engine)

logging.basicConfig(
    filename="app_requests.log",      
    level=logging.INFO,                
    format="%(asctime)s | %(levelname)s | %(message)s", 
    datefmt="%Y-%m-%d %H:%M:%S",
    force=True 
)



logger = logging.getLogger(__name__)

app = FastAPI()
app.add_middleware(SlowAPIMiddleware)
app.state.limiter=limiter
app.add_exception_handler(RateLimitExceeded,_rate_limit_exceeded_handler)
origins = [    
    "http://127.0.0.1:3000",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware('http')
async def log_requests(request, call_next):  
     start_time = time.time()                
     response = await call_next(request)
     process_time = time.time() - start_time
     client_ip = request.client.host

     
     logger.info(
          f"IP: {client_ip} | "
          f"Method: {request.method} | "
          f"URL: {request.url.path} | "
          f"Status: {response.status_code} | "
          f"Time: {process_time:.4f}s"
     )
     return response


model = joblib.load("backend/model1.pkl")
def preprocess(df):
    df["smoker"] = df["smoker"].map({"yes":1, "no":0})
    return df
raw_df = pd.read_csv("notebook/medical.csv")[["age","bmi","children","smoker"]]
background = preprocess(raw_df)
background = background.sample(100, random_state=42)

explainer=shap.LinearExplainer(model,background)
def get_db():
    db=SessionLocal()
    try:
        yield db
    finally:
        db.close()
@app.get("/predictions")
def get_predictions(
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
    page: int = 1,
    limit: int = 10
):
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admins only")
    skip = (page - 1) * limit
    records = (
        db.query(models.Insurance)
        .offset(skip)
        .limit(limit)
        .all()
    )
    total = db.query(models.Insurance).count()
    data = [{
        "id": r.id,
        "user_id": r.user_id,
        "age": r.age,
        "bmi": float(r.bmi),
        "children": r.children,
        "smoker_encoded": r.smoker_encoded,
        "prediction": r.prediction
    } for r in records]
    return {"data": data, "total": total, "page": page, "limit": limit}
 
@app.get("/stats")
def get_stats(user=Depends(get_current_user), db: Session = Depends(get_db)):
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admins only")
    total_users = db.query(models.User).count()
    total_predictions = db.query(models.Insurance).count()
    avg_prediction = db.query(sqlfunc.avg(models.Insurance.prediction)).scalar() or 0
    smoker_count = db.query(models.Insurance).filter(models.Insurance.smoker_encoded == 1).count()
    smoker_rate = round((smoker_count / total_predictions * 100), 1) if total_predictions > 0 else 0
    recent = (
        db.query(models.Insurance.prediction)
        .order_by(models.Insurance.id.desc())
        .limit(20)
        .all()
    )
    trend = [r.prediction for r in reversed(recent)]
    return {
        "total_users": total_users,
        "total_predictions": total_predictions,
        "avg_prediction": round(avg_prediction),
        "smoker_rate": smoker_rate,
        "smoker_count": smoker_count,
        "non_smoker_count": total_predictions - smoker_count,
        "trend": trend
    }
@app.get('/dashboard',response_model=schemas.DashboardResponse)
def dashboard(user=Depends(get_current_user),db:Session=Depends(get_db),page:int=1,limit:int=10):
     if user["role"]!="admin":
          raise HTTPException(status_code=403,detail="Admins only")
     skip=(page-1)*limit
     users=(
          db.query(models.User)
          .offset(skip)
          .limit(limit)
          .all()
     )
     total=db.query(models.User).count()
     data=[{
          "id":u.id,
          "username":u.username,
          "email":u.email,
          "created_at": u.created_at,
          "status":"Active"
          
     }for u in users
     ]
     return{
        "data": data,
        "total": total,
        "page": page,
        "limit": limit
     }

@app.post('/register',response_model=schemas.MessageResponse)  
@limiter.limit("3/minute")
def register(request: Request,user:schemas.UserCreate,db:Session=Depends(get_db)):
     existing_email=db.query(models.User).filter(
          models.User.email==user.email
     ).first()
     if existing_email:
          raise HTTPException(
               status_code=400,
               detail="Email already registered"
          )
     existing_username = db.query(models.User).filter(
        models.User.username == user.username
    ).first()
     if existing_username:
        raise HTTPException(
            status_code=400,
            detail="Username already taken"
        )
    
     hashed=utils.hashed_password(user.password)
     new_user=models.User(
          username=user.username,
          email=user.email,
          hashed_password=hashed
     )
     db.add(new_user)
     db.commit()
     db.refresh(new_user)
     return {"message":"User registered succesfull"}

@app.post("/login")
@limiter.limit("5/minute")
def login(request:Request,user:schemas.UserLogin,db:Session=Depends(get_db)):
     db_user=db.query(models.User).filter(
          models.User.email==user.useremail
     ).first()
     
     if not db_user:
          raise HTTPException(status_code=401,detail="Invalid email or password")
     if not utils.verify_password(user.password,db_user.hashed_password):
          raise HTTPException(status_code=401,detail="Invalid email or password")
     token=create_access_token({
          "user_id": db_user.id,
          "role": db_user.role
     })
     return {
          "access_token": token,
          "role": db_user.role
     }
     
@app.post("/predict",response_model=schemas.Output_Schema)
@limiter.limit("30/minute")
def predicts(request: Request,data:schemas.Model_input,user=Depends(get_current_user),db: Session = Depends(get_db)):
      if user["role"]!="user":
            raise HTTPException(status_code=403, detail="Users only")
      
      input_df=pd.DataFrame([{
           "age":data.age,
           "bmi":data.bmi,
           "children":data.children,
           "smoker_encoded":data.smoker_encoded
           
      }
           
     ])
    
      pred_log = model.predict(input_df)[0]
      prediction = float(np.exp(pred_log))
      shap_values=explainer.shap_values(input_df)[0]
      base_log=float((explainer.expected_value))
      base_real=float(np.exp(base_log))
      current=base_log
      explanation={}
      for features,val in zip(input_df.columns,shap_values):
          prev=np.exp(current)
          current+=val
          new=np.exp(current)
          explanation[features] = float(new - prev)

      
     
        
      
      
      saved=create.create_insurance(
        db=db,
        data=data,
        prediction=int(prediction),
        user_id=user["user_id"]
    )


      return schemas.Output_Schema(
           prediction=int(prediction),
           id=saved.id,
           explanation=explanation,
           base_value=float(base_real)
           

           )

     
     
      
           
      

