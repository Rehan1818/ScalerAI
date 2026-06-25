import math

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from auth import get_current_user
from database import get_db
from models import DNSRecord, HostedZone, User
from schemas import (
    DNSRecordCreate,
    DNSRecordResponse,
    DNSRecordUpdate,
    HostedZoneCreate,
    HostedZoneResponse,
    HostedZoneUpdate,
    MessageResponse,
    PaginatedResponse,
)

router = APIRouter(prefix="/api/hosted-zones", tags=["hosted-zones"])


def _zone_to_response(zone: HostedZone, db: Session) -> HostedZoneResponse:
    count = db.query(func.count(DNSRecord.id)).filter(DNSRecord.zone_id == zone.id).scalar() or 0
    return HostedZoneResponse(
        id=zone.id,
        name=zone.name,
        comment=zone.comment,
        private_zone=zone.private_zone,
        record_count=count,
        created_at=zone.created_at,
        updated_at=zone.updated_at,
    )


def _normalize_zone_name(name: str) -> str:
    name = name.strip().lower()
    if not name.endswith("."):
        name += "."
    return name


@router.get("", response_model=PaginatedResponse[HostedZoneResponse])
def list_hosted_zones(
    search: str = Query(default=""),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=10, ge=1, le=100),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    query = db.query(HostedZone)
    if search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(or_(HostedZone.name.ilike(term), HostedZone.comment.ilike(term)))

    total = query.count()
    zones = query.order_by(HostedZone.name).offset((page - 1) * limit).limit(limit).all()
    items = [_zone_to_response(z, db) for z in zones]

    return PaginatedResponse(
        items=items,
        total=total,
        page=page,
        limit=limit,
        pages=max(1, math.ceil(total / limit)) if total else 1,
    )


@router.post("", response_model=HostedZoneResponse, status_code=status.HTTP_201_CREATED)
def create_hosted_zone(
    payload: HostedZoneCreate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    name = _normalize_zone_name(payload.name)
    existing = db.query(HostedZone).filter(HostedZone.name == name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Hosted zone already exists")

    zone = HostedZone(name=name, comment=payload.comment, private_zone=payload.private_zone)
    db.add(zone)
    db.flush()

    ns_value = f"ns-1.awsdns-host.com.\nns-2.awsdns-host.net.\nns-3.awsdns-host.org.\nns-4.awsdns-host.co.uk."
    soa_value = f"{zone.id.replace('Z', 'ns')}.awsdns-host.com. awsdns-hostmaster.amazon.com. 1 7200 900 1209600 86400"

    db.add_all([
        DNSRecord(zone_id=zone.id, name=name, type="NS", ttl=172800, value=ns_value, routing_policy="Simple"),
        DNSRecord(zone_id=zone.id, name=name, type="SOA", ttl=900, value=soa_value, routing_policy="Simple"),
    ])
    db.commit()
    db.refresh(zone)
    return _zone_to_response(zone, db)


@router.get("/{zone_id}", response_model=HostedZoneResponse)
def get_hosted_zone(
    zone_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    zone = db.query(HostedZone).filter(HostedZone.id == zone_id).first()
    if not zone:
        raise HTTPException(status_code=404, detail="Hosted zone not found")
    return _zone_to_response(zone, db)


@router.patch("/{zone_id}", response_model=HostedZoneResponse)
def update_hosted_zone(
    zone_id: str,
    payload: HostedZoneUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    zone = db.query(HostedZone).filter(HostedZone.id == zone_id).first()
    if not zone:
        raise HTTPException(status_code=404, detail="Hosted zone not found")

    if payload.comment is not None:
        zone.comment = payload.comment
    if payload.private_zone is not None:
        zone.private_zone = payload.private_zone

    db.commit()
    db.refresh(zone)
    return _zone_to_response(zone, db)


@router.delete("/{zone_id}", response_model=MessageResponse)
def delete_hosted_zone(
    zone_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    zone = db.query(HostedZone).filter(HostedZone.id == zone_id).first()
    if not zone:
        raise HTTPException(status_code=404, detail="Hosted zone not found")

    db.delete(zone)
    db.commit()
    return MessageResponse(message=f"Hosted zone {zone_id} deleted")


# DNS Records nested under hosted zones
records_router = APIRouter(prefix="/api/hosted-zones/{zone_id}/records", tags=["dns-records"])


def _get_zone_or_404(zone_id: str, db: Session) -> HostedZone:
    zone = db.query(HostedZone).filter(HostedZone.id == zone_id).first()
    if not zone:
        raise HTTPException(status_code=404, detail="Hosted zone not found")
    return zone


@records_router.get("", response_model=PaginatedResponse[DNSRecordResponse])
def list_records(
    zone_id: str,
    search: str = Query(default=""),
    type: str = Query(default=""),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    _get_zone_or_404(zone_id, db)
    query = db.query(DNSRecord).filter(DNSRecord.zone_id == zone_id)

    if search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(or_(DNSRecord.name.ilike(term), DNSRecord.value.ilike(term)))
    if type.strip():
        query = query.filter(DNSRecord.type == type.strip().upper())

    total = query.count()
    records = query.order_by(DNSRecord.name, DNSRecord.type).offset((page - 1) * limit).limit(limit).all()

    return PaginatedResponse(
        items=[DNSRecordResponse.model_validate(r) for r in records],
        total=total,
        page=page,
        limit=limit,
        pages=max(1, math.ceil(total / limit)) if total else 1,
    )


@records_router.post("", response_model=DNSRecordResponse, status_code=status.HTTP_201_CREATED)
def create_record(
    zone_id: str,
    payload: DNSRecordCreate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    _get_zone_or_404(zone_id, db)
    name = payload.name.strip()
    if not name.endswith(".") and payload.type != "CNAME":
        if name == "@" or name == "":
            zone = db.query(HostedZone).filter(HostedZone.id == zone_id).first()
            name = zone.name if zone else name
        elif not name.endswith("."):
            pass  # relative name is ok

    record = DNSRecord(
        zone_id=zone_id,
        name=name,
        type=payload.type,
        ttl=payload.ttl,
        value=payload.value.strip(),
        routing_policy=payload.routing_policy,
        set_identifier=payload.set_identifier,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return DNSRecordResponse.model_validate(record)


@records_router.get("/{record_id}", response_model=DNSRecordResponse)
def get_record(
    zone_id: str,
    record_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    record = (
        db.query(DNSRecord)
        .filter(DNSRecord.id == record_id, DNSRecord.zone_id == zone_id)
        .first()
    )
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    return DNSRecordResponse.model_validate(record)


@records_router.patch("/{record_id}", response_model=DNSRecordResponse)
def update_record(
    zone_id: str,
    record_id: str,
    payload: DNSRecordUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    record = (
        db.query(DNSRecord)
        .filter(DNSRecord.id == record_id, DNSRecord.zone_id == zone_id)
        .first()
    )
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")

    if record.type in ("NS", "SOA") and payload.type and payload.type not in (record.type,):
        raise HTTPException(status_code=400, detail="Cannot change type of NS/SOA records")

    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(record, key, value)

    db.commit()
    db.refresh(record)
    return DNSRecordResponse.model_validate(record)


@records_router.delete("/{record_id}", response_model=MessageResponse)
def delete_record(
    zone_id: str,
    record_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    record = (
        db.query(DNSRecord)
        .filter(DNSRecord.id == record_id, DNSRecord.zone_id == zone_id)
        .first()
    )
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")

    if record.type in ("NS", "SOA"):
        raise HTTPException(status_code=400, detail="Cannot delete NS or SOA records")

    db.delete(record)
    db.commit()
    return MessageResponse(message=f"Record {record_id} deleted")
