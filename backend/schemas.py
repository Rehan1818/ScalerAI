from datetime import datetime
from typing import Generic, Literal, TypeVar

from pydantic import BaseModel, Field

RECORD_TYPES = Literal["A", "AAAA", "CNAME", "TXT", "MX", "NS", "PTR", "SRV", "CAA"]
ROUTING_POLICIES = Literal["Simple", "Weighted", "Latency", "Failover", "Geolocation"]

T = TypeVar("T")


class PaginatedResponse(BaseModel, Generic[T]):
    items: list[T]
    total: int
    page: int
    limit: int
    pages: int


# Auth
class LoginRequest(BaseModel):
    username: str
    password: str


class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    display_name: str
    account_id: str

    model_config = {"from_attributes": True}


class AuthResponse(BaseModel):
    user: UserResponse
    token: str


# Hosted Zones
class HostedZoneCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    comment: str = ""
    private_zone: bool = False


class HostedZoneUpdate(BaseModel):
    comment: str | None = None
    private_zone: bool | None = None


class HostedZoneResponse(BaseModel):
    id: str
    name: str
    comment: str
    private_zone: bool
    record_count: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# DNS Records
class DNSRecordCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    type: RECORD_TYPES
    ttl: int = Field(default=300, ge=0, le=2147483647)
    value: str = Field(..., min_length=1)
    routing_policy: ROUTING_POLICIES = "Simple"
    set_identifier: str = ""


class DNSRecordUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    type: RECORD_TYPES | None = None
    ttl: int | None = Field(default=None, ge=0, le=2147483647)
    value: str | None = Field(default=None, min_length=1)
    routing_policy: ROUTING_POLICIES | None = None
    set_identifier: str | None = None


class DNSRecordResponse(BaseModel):
    id: str
    zone_id: str
    name: str
    type: str
    ttl: int
    value: str
    routing_policy: str
    set_identifier: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class MessageResponse(BaseModel):
    message: str
