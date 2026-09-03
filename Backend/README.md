# GovBridge — SIH26129 Backend

A microservices backend demonstrating **system integration and interoperability among government digital platforms**, built for Smart India Hackathon 2026.

## Architecture

```
                         ┌─────────────────┐
                         │  NGINX Gateway  │
                         │  (port 30080)   │
                         └────────┬────────┘
           ┌──────────┬──────────┼──────────┬──────────────┐
           │          │          │          │              │
   ┌───────▼──┐ ┌─────▼────┐ ┌──▼──────┐ ┌▼─────────┐ ┌──▼──────────┐
   │ Identity │ │Application│ │ Interop │ │Notifica- │ │Mock Gov     │
   │ Service  │ │ Service   │ │ Service │ │tion Svc  │ │Service      │
   │ :3001    │ │ :3002     │ │ :3003   │ │ :3004    │ │ :3005       │
   └────┬─────┘ └────┬─────┘ └────┬────┘ └────┬─────┘ └─────────────┘
        │             │            │           │
        │             │     ┌──────▼──────┐    │
        │             └────►│    Kafka     │◄──┘
        │                   │   (9092)    │
        │                   └─────────────┘
   ┌────▼─────────────────────────────────────────────┐
   │              PostgreSQL (5432)                    │
   │  identity_db | application_db | interop_db       │
   │  notification_db | government_db                 │
   └──────────────────────────────────────────────────┘
                    ┌──────────┐
                    │  Redis   │
                    │  (6379)  │
                    └──────────┘
```

## Services

| Service | Port | Database | Purpose |
|---------|------|----------|---------|
| **identity-service** | 3001 | `identity_db` | User registration, login, JWT auth, RBAC |
| **application-service** | 3002 | `application_db` | Citizen application lifecycle (create → submit → approve) |
| **interoperability-service** | 3003 | `interoperability_db` | Cross-department data exchange, connectors, consent, normalization |
| **notification-service** | 3004 | `notification_db` | Event-driven notifications via Kafka consumer |
| **mock-government-service** | 3005 | `government_db` | Simulates external government APIs (property, tax, licenses) |

## Database Strategy

Each service owns its own PostgreSQL database — **no cross-service database access**.

- Services communicate via **Kafka events** (async) or **REST** (sync, only interop → mock-gov)
- Each service has `scripts/migrate.js` and `scripts/seed.js` for schema + demo data
- `infrastructure/postgres/init.sql` creates all 5 databases at cluster startup

## Kafka Topics & Events

| Topic | Producer | Consumer | Events |
|-------|----------|----------|--------|
| `application.events` | application-service | interoperability-service, notification-service | `APPLICATION_SUBMITTED`, `APPLICATION_APPROVED`, `APPLICATION_REJECTED` |
| `data.exchange.events` | interoperability-service | notification-service | `DATA_RECEIVED`, `DATA_EXCHANGE_FAILED` |
| `consent.events` | interoperability-service | notification-service | `CONSENT_REQUESTED`, `CONSENT_GRANTED`, `CONSENT_REVOKED` |
| `integration.events` | interoperability-service | notification-service | `INTEGRATION_FAILED` |
| `notification.events` | (reserved) | — | — |

All events carry a unique `eventId` (UUID). Both interop and notification consumers enforce **idempotent processing** via Redis + PostgreSQL.

## Redis Usage

| Service | Purpose | Key Pattern | TTL |
|---------|---------|-------------|-----|
| identity-service | JWT blacklist on logout | `bl_<jti>` | Token remaining TTL |
| identity-service | Rate limiting | `rl:*` (express-rate-limit) | 15 min |
| interoperability-service | Idempotent event processing | `processed_event:<eventId>` | 24 hours |
| notification-service | Idempotent event processing | `processed_notification_event:<eventId>` | 24 hours |

No permanent sensitive data is stored in Redis.

## NGINX Routes

| External Path | Internal Service |
|---------------|-----------------|
| `/api/auth/*` | identity-service:3001 |
| `/api/applications/*` | application-service:3002 |
| `/api/interoperability/*` | interoperability-service:3003 |
| `/api/notifications/*` | notification-service:3004 |
| `/api/mock/*` | mock-government-service:3005 |

## Local Setup

### Prerequisites

- Docker
- Kubernetes (minikube / Docker Desktop K8s)


## Mock Government Service

The `mock-government-service` acts as an external simulation of varied legacy government APIs.

### Simulated Endpoints (via API Gateway)

- **Citizens API** (Nested JSON format)
```bash
cd Backend
bash build.wsl.sh          # Build Docker images
bash deploy.wsl.sh         # Apply K8s manifests
bash run.wsl.sh            # Run migrations & seeds
```

API is available at `http://localhost:30080/api/...`

## Demo Credentials

| Email | Password | Role | Department |
|-------|----------|------|------------|
| `citizen@govbridge.local` | `password123` | CITIZEN | — |
| `officer@govbridge.local` | `password123` | OFFICER | DEPT-LICENSING |
| `admin@govbridge.local` | `password123` | ADMIN | — |

## Complete End-to-End Flow

```
1. Citizen logs in
   POST /api/auth/login

2. Creates Business Licence application
   POST /api/applications/applications  { "serviceId": 1 }

3. Submits application
   POST /api/applications/applications/:id/submit
   → Publishes APPLICATION_SUBMITTED to Kafka

4. Interoperability Service consumes the event
   → Resolves citizen entity (entities table)
   → Verifies active consent (consents table)
   → Fetches property data from Mock Gov API (PROPERTY_REGISTRY connector)
   → Normalizes response into canonical format
   → Fetches tax data from Mock Gov API (TAX_SYSTEM connector)
   → Normalizes response
   → Publishes DATA_RECEIVED events

5. Notification Service creates notifications
   → "Your Business Licence application has been submitted."
   → "Property ownership or required information has been verified." (×2)

6. Officer logs in and views the application
   GET /api/applications/applications/:id

7. Officer approves
   POST /api/applications/applications/:id/approve
   → Publishes APPLICATION_APPROVED event

8. Notification created
   → "Your Business Licence application has been approved."

9. Citizen views timeline
   GET /api/applications/applications/:id/timeline
```

## Failure / Retry Flow

The mock-government-service supports failure simulation:

```
GET /api/mock/government/properties/PROP-001?simulate=500   → 500 error
GET /api/mock/government/properties/PROP-001?simulate=404   → 404 error
GET /api/mock/government/properties/PROP-001?simulate=timeout → 5s delay
```

When the interoperability-service encounters a failure:
1. Retries up to 3 times with exponential backoff (1s, 2s, 4s)
2. Persists failure status in `data_requests` table
3. Logs audit entry for `DATA_EXCHANGE_FAILED`
4. Publishes `DATA_EXCHANGE_FAILED` event to Kafka
5. Notification-service creates: "Verification with a government system is temporarily unavailable."
