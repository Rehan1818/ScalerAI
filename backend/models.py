import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base


def utcnow():
    return datetime.now(timezone.utc)


def generate_id(prefix: str) -> str:
    return f"{prefix}-{uuid.uuid4().hex[:12]}"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    username: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(256))
    email: Mapped[str] = mapped_column(String(128), default="")
    display_name: Mapped[str] = mapped_column(String(128), default="")
    account_id: Mapped[str] = mapped_column(String(12), default="123456789012")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)


class Session(Base):
    __tablename__ = "sessions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    token: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

    user: Mapped["User"] = relationship("User")


class HostedZone(Base):
    __tablename__ = "hosted_zones"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=lambda: generate_id("Z"))
    name: Mapped[str] = mapped_column(String(255), index=True)
    comment: Mapped[str] = mapped_column(Text, default="")
    private_zone: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, onupdate=utcnow)

    records: Mapped[list["DNSRecord"]] = relationship(
        "DNSRecord", back_populates="zone", cascade="all, delete-orphan"
    )


class DNSRecord(Base):
    __tablename__ = "dns_records"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=lambda: generate_id("R"))
    zone_id: Mapped[str] = mapped_column(ForeignKey("hosted_zones.id"), index=True)
    name: Mapped[str] = mapped_column(String(255), index=True)
    type: Mapped[str] = mapped_column(String(10), index=True)
    ttl: Mapped[int] = mapped_column(Integer, default=300)
    value: Mapped[str] = mapped_column(Text)
    routing_policy: Mapped[str] = mapped_column(String(32), default="Simple")
    set_identifier: Mapped[str] = mapped_column(String(128), default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, onupdate=utcnow)

    zone: Mapped["HostedZone"] = relationship("HostedZone", back_populates="records")
