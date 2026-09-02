#!/bin/bash

# run.wsl.sh - Forward API Gateway port to localhost for local testing on WSL

echo "Starting port forwarding for GovBridge API Gateway..."
echo "The API Gateway will be accessible at http://localhost:30080"
echo "Press Ctrl+C to stop this script."
echo ""

kubectl port-forward service/api-gateway 30080:80 -n govbridge
