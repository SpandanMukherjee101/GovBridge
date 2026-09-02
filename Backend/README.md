# GovBridge - SIH26129 Backend

This repository contains the backend infrastructure for the GovBridge project, designed for system integration and interoperability among government digital platforms.

## Architecture

- **identity-service** (Port 3001)
- **application-service** (Port 3002)
- **interoperability-service** (Port 3003)
- **notification-service** (Port 3004)
- **mock-government-service** (Port 3005)
- **API Gateway (Nginx)** (Port 80)
- **Infrastructure**: PostgreSQL, Redis, Kafka

## Running Locally (Kubernetes)

1. Apply core configuration:
```bash
kubectl apply -f infrastructure/kubernetes/namespace.yaml
kubectl apply -f infrastructure/kubernetes/configmap.yaml
kubectl apply -f infrastructure/kubernetes/secrets.yaml
```
2. Apply infrastructure and services:
```bash
kubectl apply -f infrastructure/kubernetes/
```

## Mock Government Service

The `mock-government-service` acts as an external simulation of varied legacy government APIs.

### Simulated Endpoints (via API Gateway)

- **Citizens API** (Nested JSON format)
  ```bash
  curl -s http://localhost:30080/api/mock/government/citizens/GOV-1001
  ```
- **Properties API** (Flat legacy format with abbreviations)
  ```bash
  curl -s http://localhost:30080/api/mock/government/properties/PROP-001
  ```
- **Tax API** (Uppercase format)
  ```bash
  curl -s http://localhost:30080/api/mock/government/tax/TAX-A101
  ```
- **Business Licenses API** (Standard REST)
  ```bash
  curl -s http://localhost:30080/api/mock/government/licenses/LIC-9001
  ```

### Failure Simulation

You can test error handling and retry logic by appending `?simulate=` to any mock API endpoint:
- `?simulate=500`: Forces an internal server error.
- `?simulate=404`: Forces a not found error.
- `?simulate=timeout`: Forces a 5-second delay.

Example:
```bash
curl -s "http://localhost:30080/api/mock/government/tax/TAX-A101?simulate=500"
```

## Identity Service

The `identity-service` provides Authentication (JWT) and Role-Based Access Control (RBAC). 

### Default Credentials (Development Only)

All demo accounts use the password: `password123`

| Email | Role | Department ID |
| --- | --- | --- |
| `citizen@govbridge.local` | CITIZEN | `null` |
| `officer@govbridge.local` | OFFICER | `DEPT-LICENSING` |
| `admin@govbridge.local` | ADMIN | `null` |

### Key Endpoints

- `POST /api/auth/register` (Email, Password)
- `POST /api/auth/login` (Email, Password -> Returns Access & Refresh JWT)
- `POST /api/auth/refresh` (Refresh Token)
- `POST /api/auth/logout` (Revokes Token)
- `GET /api/auth/me` (Returns User Profile & Permissions)
