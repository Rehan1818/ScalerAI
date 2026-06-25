import os

from sqlalchemy.orm import Session

from database import SessionLocal, engine
from models import Base, DNSRecord, HostedZone, User
from auth import hash_password


def seed_database():
    os.makedirs("data", exist_ok=True)
    Base.metadata.create_all(bind=engine)

    db: Session = SessionLocal()
    try:
        if db.query(User).first():
            return

        admin = User(
            username="admin",
            password_hash=hash_password("admin123"),
            email="admin@example.com",
            display_name="Route53 Admin",
            account_id="123456789012",
        )
        db.add(admin)
        db.commit()

        zone = HostedZone(
            name="example.com.",
            comment="Demo hosted zone",
            private_zone=False,
        )
        db.add(zone)
        db.flush()

        db.add_all([
            DNSRecord(
                zone_id=zone.id,
                name="example.com.",
                type="NS",
                ttl=172800,
                value="ns-1.awsdns-host.com.\nns-2.awsdns-host.net.\nns-3.awsdns-host.org.\nns-4.awsdns-host.co.uk.",
            ),
            DNSRecord(
                zone_id=zone.id,
                name="example.com.",
                type="SOA",
                ttl=900,
                value=f"{zone.id.replace('Z', 'ns')}.awsdns-host.com. awsdns-hostmaster.amazon.com. 1 7200 900 1209600 86400",
            ),
            DNSRecord(
                zone_id=zone.id,
                name="www.example.com.",
                type="A",
                ttl=300,
                value="192.0.2.1",
            ),
            DNSRecord(
                zone_id=zone.id,
                name="mail.example.com.",
                type="MX",
                ttl=3600,
                value="10 mail.example.com.",
            ),
            DNSRecord(
                zone_id=zone.id,
                name="_dmarc.example.com.",
                type="TXT",
                ttl=300,
                value='"v=DMARC1; p=none;"',
            ),
        ])
        db.commit()
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
    print("Database seeded successfully.")
