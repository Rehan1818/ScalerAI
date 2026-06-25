# AWS Route53 Clone

A functional clone of the AWS Route 53 web console with persistent SQLite storage and a FastAPI backend. This project recreates the Route53 user experience and core workflows (hosted zones and DNS records) without implementing actual DNS resolution.

## Demo

After setup, access:
- **Frontend:** http://localhost:3000
- **Backend API docs:** http://localhost:8000/docs

**Demo login:** `admin` / `admin123`

## Tech Stack

| Layer    | Technology              |
|----------|-------------------------|
| Frontend | Next.js 15, TypeScript, Tailwind CSS |
| Backend  | FastAPI, SQLAlchemy     |
| Database | SQLite                  |

## Project Structure

```
ScalerAI/
├── backend/           # FastAPI REST API
│   ├── main.py        # App entry point
│   ├── models.py      # SQLAlchemy models
│   ├── schemas.py     # Pydantic schemas
│   ├── auth.py        # Session-based mock auth
│   ├── routers/       # API route handlers
│   └── seed.py        # DB init + demo data
├── frontend/          # Next.js console UI
│   └── src/
│       ├── app/       # Pages & layouts
│       ├── components/
│       ├── context/   # Auth & toast providers
│       └── lib/       # API client & types
└── README.md
```

## Setup Instructions

### Prerequisites

- Python 3.11+
- Node.js 18+

### Backend

```bash
cd backend
python -m venv .venv

# Windows
.venv\Scripts\activate

# macOS/Linux
source .venv/bin/activate

pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

The database is created automatically at `backend/data/route53.db` on first startup with seed data.

### Frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local   # optional; defaults to localhost:8000
npm run dev
```

Open http://localhost:3000 and sign in with `admin` / `admin123`.

## Architecture Overview

```
┌─────────────────┐     HTTP/JSON      ┌─────────────────┐
│  Next.js UI     │ ◄────────────────► │  FastAPI API    │
│  (port 3000)    │   Bearer token     │  (port 8000)    │
└─────────────────┘                    └────────┬────────┘
                                                │
                                                ▼
                                       ┌─────────────────┐
                                       │  SQLite DB      │
                                       │  route53.db     │
                                       └─────────────────┘
```

- **Authentication:** Mock IAM login. Credentials are stored hashed (bcrypt). Sessions use bearer tokens persisted in `localStorage` and validated server-side.
- **Hosted Zones:** Full CRUD with search and pagination. Creating a zone auto-generates NS and SOA records.
- **DNS Records:** Full CRUD within a zone. Supports A, AAAA, CNAME, TXT, MX, NS, PTR, SRV, CAA. NS/SOA records are protected from deletion.

## Database Schema

### users
| Column         | Type     | Description              |
|----------------|----------|--------------------------|
| id             | INTEGER  | Primary key              |
| username       | STRING   | Unique login name        |
| password_hash  | STRING   | Bcrypt hash              |
| email          | STRING   | User email               |
| display_name   | STRING   | Display name             |
| account_id     | STRING   | Mock AWS account ID      |
| created_at     | DATETIME | Creation timestamp       |

### sessions
| Column     | Type     | Description                    |
|------------|----------|--------------------------------|
| id         | INTEGER  | Primary key                    |
| user_id    | INTEGER  | FK → users.id                  |
| token      | STRING   | Unique session token           |
| expires_at | DATETIME | Session expiry (7 days)        |
| created_at | DATETIME | Creation timestamp             |

### hosted_zones
| Column       | Type     | Description                    |
|--------------|----------|--------------------------------|
| id           | STRING   | Primary key (e.g. Zabc123...)  |
| name         | STRING   | Domain name (e.g. example.com.)|
| comment      | TEXT     | Optional description           |
| private_zone | BOOLEAN  | Public or private zone         |
| created_at   | DATETIME | Creation timestamp             |
| updated_at   | DATETIME | Last update timestamp          |

### dns_records
| Column          | Type     | Description                         |
|-----------------|----------|-------------------------------------|
| id              | STRING   | Primary key (e.g. Rabc123...)       |
| zone_id         | STRING   | FK → hosted_zones.id                |
| name            | STRING   | Record name                         |
| type            | STRING   | A, AAAA, CNAME, TXT, MX, etc.       |
| ttl             | INTEGER  | Time to live in seconds             |
| value           | TEXT     | Record value                        |
| routing_policy  | STRING   | Simple, Weighted, Latency, etc.     |
| set_identifier  | STRING   | Optional routing set identifier     |
| created_at      | DATETIME | Creation timestamp                  |
| updated_at      | DATETIME | Last update timestamp               |

## API Overview

All endpoints except `/api/auth/login` and `/api/health` require `Authorization: Bearer <token>`.

### Authentication
| Method | Endpoint          | Description        |
|--------|-------------------|--------------------|
| POST   | `/api/auth/login` | Login, get token   |
| POST   | `/api/auth/logout`| Invalidate session |
| GET    | `/api/auth/me`    | Current user info  |

### Hosted Zones
| Method | Endpoint                    | Description              |
|--------|-----------------------------|--------------------------|
| GET    | `/api/hosted-zones`         | List (search, paginate)  |
| POST   | `/api/hosted-zones`         | Create zone + NS/SOA     |
| GET    | `/api/hosted-zones/{id}`    | Get zone details         |
| PATCH  | `/api/hosted-zones/{id}`    | Update comment/private   |
| DELETE | `/api/hosted-zones/{id}`    | Delete zone + records    |

Query params for list: `search`, `page`, `limit`

### DNS Records
| Method | Endpoint                                      | Description           |
|--------|-----------------------------------------------|-----------------------|
| GET    | `/api/hosted-zones/{zone_id}/records`         | List records          |
| POST   | `/api/hosted-zones/{zone_id}/records`         | Create record         |
| GET    | `/api/hosted-zones/{zone_id}/records/{id}`    | Get record            |
| PATCH  | `/api/hosted-zones/{zone_id}/records/{id}`    | Update record         |
| DELETE | `/api/hosted-zones/{zone_id}/records/{id}`    | Delete record         |

Query params for list: `search`, `type`, `page`, `limit`

## Features

### Implemented
- Mock authentication (login, logout, session persistence)
- Hosted Zones CRUD with search & pagination
- DNS Records CRUD with search, type filter & pagination
- AWS Route53-style UI (sidebar, tables, modals, toasts)
- Placeholder pages (Dashboard, Health Checks, Traffic Policies, Resolver, Profiles)

### Bonus (not yet implemented)
- Import/export BIND zone files
- Dark mode
- Keyboard shortcuts
- Bulk operations

## License

MIT
