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
