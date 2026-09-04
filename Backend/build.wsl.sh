#!/bin/bash
cd "$(dirname "$0")" || exit
TAG="v2-$(date +%s)"
echo $TAG > .image_tag
echo "Building Docker images for WSL with tag $TAG..."

docker build -t identity-service:$TAG ./services/identity-service
docker build -t application-service:$TAG ./services/application-service
docker build -t interoperability-service:$TAG ./services/interoperability-service
docker build -t notification-service:$TAG ./services/notification-service
docker build -t mock-government-service:$TAG ./services/mock-government-service
docker build -t api-gateway:$TAG ./api-gateway/nginx

echo "Build complete. Tag saved to .image_tag"
