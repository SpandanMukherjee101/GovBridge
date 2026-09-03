#!/bin/bash
cd "$(dirname "$0")" || exit
echo "Building Docker images for Mac..."
docker build -t identity-service:latest ./services/identity-service
docker build -t application-service:latest ./services/application-service
docker build -t interoperability-service:latest ./services/interoperability-service
docker build -t notification-service:latest ./services/notification-service
docker build -t mock-government-service:latest ./services/mock-government-service
docker build -t api-gateway:latest ./api-gateway/nginx
echo "Build complete."
