#!/bin/bash
cd "$(dirname "$0")" || exit
echo "Deploying to Kubernetes on Mac..."
echo "Tearing down existing govbridge namespace for a clean setup..."
kubectl delete namespace govbridge --ignore-not-found
echo "Waiting for namespace deletion to finalize..."
sleep 5

kubectl apply -f infrastructure/kubernetes/namespace.yaml
kubectl apply -f infrastructure/kubernetes/configmap.yaml
kubectl apply -f infrastructure/kubernetes/secrets.yaml
kubectl apply -f infrastructure/kubernetes/postgres.yaml
kubectl apply -f infrastructure/kubernetes/redis.yaml
kubectl apply -f infrastructure/kubernetes/kafka.yaml
echo "Waiting for infrastructure to initialize..."
sleep 10
TAG=$(cat .image_tag 2>/dev/null || echo "v2")
echo "Deploying with image tag: $TAG"

sed "s/:v2/:$TAG/g" infrastructure/kubernetes/identity-service.yaml | kubectl apply -f -
sed "s/:v2/:$TAG/g" infrastructure/kubernetes/application-service.yaml | kubectl apply -f -
sed "s/:v2/:$TAG/g" infrastructure/kubernetes/interoperability-service.yaml | kubectl apply -f -
sed "s/:v2/:$TAG/g" infrastructure/kubernetes/notification-service.yaml | kubectl apply -f -
sed "s/:v2/:$TAG/g" infrastructure/kubernetes/mock-government-service.yaml | kubectl apply -f -
sed "s/:v2/:$TAG/g" infrastructure/kubernetes/nginx-gateway.yaml | kubectl apply -f -
echo "Deployment complete."
