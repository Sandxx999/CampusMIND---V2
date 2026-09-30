import bcrypt
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel
from sqlalchemy.orm import Session

from db.session import get_db_session
from db.models import UserAccount
from core.security import create_access_token
from api.deps import get_current_user

router = APIRouter(prefix="/api/auth", tags=["Authentication"])
router_v1 = APIRouter(prefix="/api/v1/auth", tags=["Authentication"])

class LoginRequest(BaseModel):
    username: str | None = None
    email: str | None = None
    password: str

@router.post("/login")
@router_v1.post("/login")
def login(request: LoginRequest):
    login_id = request.username or request.email
    if not login_id:
        raise HTTPException(status_code=400, detail="Must provide username or email")
    with get_db_session() as db:
        user = db.query(UserAccount).filter(
            (UserAccount.id == login_id) | (UserAccount.email == login_id)
        ).first()
        
        if not user or not bcrypt.checkpw(request.password.encode('utf-8'), user.password_hash.encode('utf-8')):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
            
        access_token = create_access_token(
            data={"sub": user.id, "role": user.role, "name": user.full_name}
        )
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": user.id,
                "role": user.role,
                "name": user.full_name,
                "email": user.email,
                "department": user.department
            }
        }

@router.get("/me")
@router_v1.get("/me")
def get_me(current_user: dict = Depends(get_current_user)):
    return current_user

# Note: For Swagger UI to work with OAuth2PasswordBearer natively, we can also add a route that accepts form data
@router.post("/token")
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    with get_db_session() as db:
        user = db.query(UserAccount).filter(
            (UserAccount.id == form_data.username) | (UserAccount.email == form_data.username)
        ).first()
        
        if not user or not bcrypt.checkpw(form_data.password.encode('utf-8'), user.password_hash.encode('utf-8')):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
            
        access_token = create_access_token(
            data={"sub": user.id, "role": user.role, "name": user.full_name}
        )
        
        return {"access_token": access_token, "token_type": "bearer"}
