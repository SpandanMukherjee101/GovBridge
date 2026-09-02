#!/bin/bash
cd "$(dirname "$0")" || exit
echo "Deploying to Kubernetes on WSL..."
kubectl apply -f infrastructure/kubernetes/namespace.yaml
kubectl apply -f infrastructure/kubernetes/configmap.yaml
kubectl apply -f infrastructure/kubernetes/secrets.yaml
kubectl apply -f infrastructure/kubernetes/postgres.yaml
kubectl apply -f infrastructure/kubernetes/redis.yaml
kubectl apply -f infrastructure/kubernetes/kafka.yaml
echo "Waiting for infrastructure to initialize..."
sleep 10
kubectl apply -f infrastructure/kubernetes/identity-service.yaml
kubectl apply -f infrastructure/kubernetes/application-service.yaml
kubectl apply -f infrastructure/kubernetes/interoperability-service.yaml
kubectl apply -f infrastructure/kubernetes/notification-service.yaml
kubectl apply -f infrastructure/kubernetes/mock-government-service.yaml
kubectl apply -f infrastructure/kubernetes/nginx-gateway.yaml
echo "Deployment complete."
