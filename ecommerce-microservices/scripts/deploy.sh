#!/bin/bash

# Deployment Script for E-Commerce Microservices on EKS
# Usage: ./deploy.sh

set -e

echo "=========================================="
echo "  E-Commerce Microservices Deployment"
echo "=========================================="
echo ""

# Navigate to kubernetes directory
cd "$(dirname "$0")/../kubernetes"

# Step 1: Create namespace
echo "Step 1: Creating namespace..."
kubectl apply -f namespace.yaml
echo "✅ Namespace created"

# Step 2: Create secrets
echo ""
echo "Step 2: Creating secrets..."
kubectl apply -f configmaps/secrets.yaml
echo "✅ Secrets created"

# Step 3: Deploy databases (wait for them to be ready)
echo ""
echo "Step 3: Deploying databases..."
kubectl apply -f databases/
echo "Waiting for database pods to be ready..."
sleep 10

# Wait for databases to be ready
for db in user-db product-db cart-db order-db payment-db; do
    echo "Waiting for $db..."
    kubectl wait --for=condition=available deployment/$db -n ecommerce --timeout=120s || true
done
echo "✅ Databases deployed"

# Step 4: Deploy microservices
echo ""
echo "Step 4: Deploying microservices..."
kubectl apply -f services/
echo "Waiting for service pods to be ready..."

# Wait for services to be ready
for svc in user-service product-service cart-service order-service payment-service frontend; do
    echo "Waiting for $svc..."
    kubectl wait --for=condition=available deployment/$svc -n ecommerce --timeout=180s || true
done
echo "✅ Microservices deployed"

# Step 5: Deploy Gateway/Ingress
echo ""
echo "Step 5: Deploying Ingress..."
kubectl apply -f gateway/ingress.yaml
echo "✅ Ingress deployed"

# Wait for ALB to be created
echo ""
echo "Waiting for Application Load Balancer to be created..."
echo "This may take 2-3 minutes..."
sleep 30

# Get the ALB URL
echo ""
echo "=========================================="
echo "  Deployment Complete!"
echo "=========================================="
echo ""

# Try to get the Ingress address
ALB_ADDRESS=$(kubectl get ingress ecommerce-ingress -n ecommerce -o jsonpath='{.status.loadBalancer.ingress[0].hostname}' 2>/dev/null || echo "")

if [ -n "$ALB_ADDRESS" ]; then
    echo "🌐 Application URL: http://$ALB_ADDRESS"
else
    echo "⏳ ALB is still being provisioned. Check status with:"
    echo "   kubectl get ingress ecommerce-ingress -n ecommerce"
fi

echo ""
echo "Useful commands:"
echo "  - Check pods:        kubectl get pods -n ecommerce"
echo "  - Check services:    kubectl get svc -n ecommerce"
echo "  - Check ingress:     kubectl get ingress -n ecommerce"
echo "  - View logs:         kubectl logs -f deployment/<service-name> -n ecommerce"
echo ""
