#!/bin/bash

# Build and Push Script for E-Commerce Microservices
# Usage: ./build-and-push.sh

set -e

DOCKERHUB_USERNAME="kastrov"
SERVICES=("user-service" "product-service" "cart-service" "order-service" "payment-service")

echo "=========================================="
echo "  E-Commerce Microservices Build Script"
echo "=========================================="

# Function to build and push a service
build_and_push() {
    local service=$1
    echo ""
    echo "Building $service..."
    
    cd services/$service
    docker build -t $DOCKERHUB_USERNAME/$service:latest .
    docker push $DOCKERHUB_USERNAME/$service:latest
    cd ../..
    
    echo "✅ $service built and pushed successfully"
}

# Build all backend services
for service in "${SERVICES[@]}"; do
    build_and_push $service
done

# Build frontend
echo ""
echo "Building frontend..."
cd frontend
docker build -t $DOCKERHUB_USERNAME/ecommerce-frontend:latest .
docker push $DOCKERHUB_USERNAME/ecommerce-frontend:latest
cd ..
echo "✅ Frontend built and pushed successfully"

echo ""
echo "=========================================="
echo "  All images built and pushed!"
echo "=========================================="
echo ""
echo "Images pushed to Docker Hub:"
for service in "${SERVICES[@]}"; do
    echo "  - $DOCKERHUB_USERNAME/$service:latest"
done
echo "  - $DOCKERHUB_USERNAME/ecommerce-frontend:latest"
echo ""
