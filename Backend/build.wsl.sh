#!/bin/bash
cd "$(dirname "$0")" || exit
echo "Building Docker images for WSL..."
docker build -t identity-service:v2 ./services/identity-service
docker build -t application-service:v2 ./services/application-service
docker build -t interoperability-service:v2 ./services/interoperability-service
docker build -t notification-service:v2 ./services/notification-service
docker build -t mock-government-service:v2 ./services/mock-government-service
docker build -t api-gateway:v2 ./api-gateway/nginx
echo "Build complete."
