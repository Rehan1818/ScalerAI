import math

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from auth import create_session_token, get_current_user, invalidate_session, verify_password
from database import get_db
from models import DNSRecord, HostedZone, User
from schemas import (
    AuthResponse,
    DNSRecordCreate,
    DNSRecordResponse,
    DNSRecordUpdate,
    HostedZoneCreate,
    HostedZoneResponse,
    HostedZoneUpdate,
    LoginRequest,
    MessageResponse,
    PaginatedResponse,
    UserResponse,
)

router = APIRouter(prefix="/api/auth", tags=["auth"])
security = HTTPBearer(auto_error=False)


@router.post("/login", response_model=AuthResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == payload.username).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    token = create_session_token(db, user)
    return AuthResponse(user=UserResponse.model_validate(user), token=token)


@router.post("/logout", response_model=MessageResponse)
def logout(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
    db: Session = Depends(get_db),
):
    if credentials:
        invalidate_session(credentials.credentials, db)
    return MessageResponse(message="Logged out successfully")


@router.get("/me", response_model=UserResponse)
def me(current_user: User = Depends(get_current_user)):
    return UserResponse.model_validate(current_user)
