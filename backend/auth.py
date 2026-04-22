from datetime import datetime,timedelta,timezone
from authlib.jose import jwt ,JoseError
from fastapi import HTTPException,Depends,Request
from sqlalchemy.orm import Session
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from backend.config import SECRET_KEY
from backend import models
from backend.database import get_db



ALGORITHM="HS256"
ACCESS_TOKEN_EXPIRY_MINUTES = 30
security = HTTPBearer()

def create_access_token(data:dict):
    header={"alg":ALGORITHM}
    expire=datetime.now(timezone.utc)+timedelta(
        minutes=ACCESS_TOKEN_EXPIRY_MINUTES
    )
    payload=data.copy()
    payload.update({
        "exp":expire
    })
    token= jwt.encode(header,payload, SECRET_KEY)
    return token
def get_current_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):

    token = credentials.credentials

    claims= verify_access_token(token)
    user_id=claims.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token")
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=401, detail="User not found")
    request.state.user = db_user
    request.state.user_id = db_user.id
    return db_user
def verify_access_token(token:str):
    try:
        claims=jwt.decode(token,SECRET_KEY)
        claims.validate()
        return claims
    except JoseError:
        raise HTTPException(
        status_code=401,
        detail="Invalid or expired token")
