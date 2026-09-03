#!/bin/bash
cd "$(dirname "$0")" || exit

echo "Initializing databases for WSL..."

# Get postgres password from secret
POSTGRES_PASSWORD=$(kubectl get secret govbridge-secrets -n govbridge -o jsonpath='{.data.POSTGRES_PASSWORD}' | base64 --decode)

if [ -z "$POSTGRES_PASSWORD" ]; then
    echo "Error: Could not retrieve POSTGRES_PASSWORD from govbridge-secrets"
    exit 1
fi

echo "Creating databases in Postgres..."
PGPASSWORD=$POSTGRES_PASSWORD kubectl exec -i deployment/postgres -n govbridge -- psql -U postgres -d postgres -f - < infrastructure/postgres/init.sql

echo "Running migrations for microservices..."
for service in identity-service application-service interoperability-service notification-service mock-government-service; do
    echo "Migrating $service..."
    kubectl exec -i deployment/$service -n govbridge -- node src/scripts/migrate.js
done

echo "Running seeders for microservices..."
for service in identity-service application-service interoperability-service mock-government-service; do
    echo "Seeding $service..."
    kubectl exec -i deployment/$service -n govbridge -- node src/scripts/seed.js
done

echo "Database initialization and migration complete."
