#!/bin/bash

#############################################
# MANUAL COMMANDS REFERENCE
# E-Commerce Microservices Deployment
#############################################

# ============================================
# SECTION 1: BUILD AND PUSH DOCKER IMAGES
# ============================================

echo "=========================================="
echo "  BUILDING DOCKER IMAGES MANUALLY"
echo "=========================================="

# Set variables
DOCKERHUB_USERNAME="kastrov"
TAG="latest"  # or use specific version like "v1.0.0"

# Navigate to project directory
cd /path/to/ecommerce-microservices

# ------------------------------------------
# Build User Service
# ------------------------------------------
echo "Building User Service..."
cd services/user-service
docker build -t ${DOCKERHUB_USERNAME}/user-service:${TAG} .
docker push ${DOCKERHUB_USERNAME}/user-service:${TAG}
cd ../..

# ------------------------------------------
# Build Product Service
# ------------------------------------------
echo "Building Product Service..."
cd services/product-service
docker build -t ${DOCKERHUB_USERNAME}/product-service:${TAG} .
docker push ${DOCKERHUB_USERNAME}/product-service:${TAG}
cd ../..

# ------------------------------------------
# Build Cart Service
# ------------------------------------------
echo "Building Cart Service..."
cd services/cart-service
docker build -t ${DOCKERHUB_USERNAME}/cart-service:${TAG} .
docker push ${DOCKERHUB_USERNAME}/cart-service:${TAG}
cd ../..

# ------------------------------------------
# Build Order Service
# ------------------------------------------
echo "Building Order Service..."
cd services/order-service
docker build -t ${DOCKERHUB_USERNAME}/order-service:${TAG} .
docker push ${DOCKERHUB_USERNAME}/order-service:${TAG}
cd ../..

# ------------------------------------------
# Build Payment Service
# ------------------------------------------
echo "Building Payment Service..."
cd services/payment-service
docker build -t ${DOCKERHUB_USERNAME}/payment-service:${TAG} .
docker push ${DOCKERHUB_USERNAME}/payment-service:${TAG}
cd ../..

# ------------------------------------------
# Build Frontend
# ------------------------------------------
echo "Building Frontend..."
cd frontend
docker build -t ${DOCKERHUB_USERNAME}/ecommerce-frontend:${TAG} .
docker push ${DOCKERHUB_USERNAME}/ecommerce-frontend:${TAG}
cd ..

echo "✅ All images built and pushed!"

# ============================================
# SECTION 2: APPLY KUBERNETES MANIFESTS
# ============================================

echo "=========================================="
echo "  APPLYING KUBERNETES MANIFESTS"
echo "=========================================="

# Configure kubectl for EKS
aws eks update-kubeconfig --name kastro-cluster --region us-east-1

# ------------------------------------------
# Step 1: Create Namespace
# ------------------------------------------
echo "Creating namespace..."
kubectl apply -f kubernetes/namespace.yaml

# ------------------------------------------
# Step 2: Create Secrets
# ------------------------------------------
echo "Creating secrets..."
kubectl apply -f kubernetes/configmaps/secrets.yaml

# ------------------------------------------
# Step 3: Deploy Databases
# ------------------------------------------
echo "Deploying databases..."
kubectl apply -f kubernetes/databases/user-db.yaml
kubectl apply -f kubernetes/databases/product-db.yaml
kubectl apply -f kubernetes/databases/cart-db.yaml
kubectl apply -f kubernetes/databases/order-db.yaml
kubectl apply -f kubernetes/databases/payment-db.yaml

# Wait for databases to be ready
echo "Waiting for databases to start..."
sleep 30
kubectl wait --for=condition=available deployment/user-db -n ecommerce --timeout=120s
kubectl wait --for=condition=available deployment/product-db -n ecommerce --timeout=120s
kubectl wait --for=condition=available deployment/cart-db -n ecommerce --timeout=120s
kubectl wait --for=condition=available deployment/order-db -n ecommerce --timeout=120s
kubectl wait --for=condition=available deployment/payment-db -n ecommerce --timeout=120s

# ------------------------------------------
# Step 4: Deploy Microservices
# ------------------------------------------
echo "Deploying microservices..."
kubectl apply -f kubernetes/services/user-service.yaml
kubectl apply -f kubernetes/services/product-service.yaml
kubectl apply -f kubernetes/services/cart-service.yaml
kubectl apply -f kubernetes/services/order-service.yaml
kubectl apply -f kubernetes/services/payment-service.yaml
kubectl apply -f kubernetes/services/frontend.yaml

# Wait for services to be ready
echo "Waiting for services to start..."
kubectl wait --for=condition=available deployment/user-service -n ecommerce --timeout=180s
kubectl wait --for=condition=available deployment/product-service -n ecommerce --timeout=180s
kubectl wait --for=condition=available deployment/cart-service -n ecommerce --timeout=180s
kubectl wait --for=condition=available deployment/order-service -n ecommerce --timeout=180s
kubectl wait --for=condition=available deployment/payment-service -n ecommerce --timeout=180s
kubectl wait --for=condition=available deployment/frontend -n ecommerce --timeout=180s

# ------------------------------------------
# Step 5: Deploy Ingress (ALB)
# ------------------------------------------
echo "Deploying Ingress..."
kubectl apply -f kubernetes/gateway/ingress.yaml

echo "✅ All manifests applied!"

# ============================================
# SECTION 3: VERIFY DEPLOYMENT
# ============================================

echo "=========================================="
echo "  VERIFYING DEPLOYMENT"
echo "=========================================="

# Check pods
echo ""
echo "📦 PODS:"
kubectl get pods -n ecommerce -o wide

# Check services
echo ""
echo "🔧 SERVICES:"
kubectl get svc -n ecommerce

# Check ingress
echo ""
echo "🌐 INGRESS:"
kubectl get ingress -n ecommerce

# Check PVCs
echo ""
echo "💾 PERSISTENT VOLUME CLAIMS:"
kubectl get pvc -n ecommerce

# ============================================
# SECTION 4: GET APPLICATION URL
# ============================================

echo "=========================================="
echo "  APPLICATION ACCESS"
echo "=========================================="

# Wait for ALB to be provisioned
echo "Waiting for ALB to be ready (this may take 2-3 minutes)..."
sleep 60

# Get ALB URL
ALB_URL=$(kubectl get ingress ecommerce-ingress -n ecommerce -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')

if [ -n "$ALB_URL" ]; then
    echo ""
    echo "🎉 APPLICATION URL:"
    echo "=========================================="
    echo "   http://${ALB_URL}"
    echo "=========================================="
    echo ""
    echo "API Endpoints:"
    echo "   - User Service:    http://${ALB_URL}/api/users/"
    echo "   - Product Service: http://${ALB_URL}/api/products/"
    echo "   - Cart Service:    http://${ALB_URL}/api/cart/"
    echo "   - Order Service:   http://${ALB_URL}/api/orders/"
    echo "   - Payment Service: http://${ALB_URL}/api/payments/"
else
    echo "⏳ ALB is still being provisioned..."
    echo "Run this command to check:"
    echo "   kubectl get ingress ecommerce-ingress -n ecommerce"
fi

# ============================================
# SECTION 5: USEFUL DEBUGGING COMMANDS
# ============================================

echo ""
echo "=========================================="
echo "  USEFUL COMMANDS"
echo "=========================================="
cat << 'EOF'

# Check pod logs
kubectl logs -f deployment/user-service -n ecommerce
kubectl logs -f deployment/product-service -n ecommerce
kubectl logs -f deployment/frontend -n ecommerce

# Check pod details (for debugging)
kubectl describe pod <pod-name> -n ecommerce

# Exec into a pod
kubectl exec -it deployment/user-service -n ecommerce -- /bin/bash

# Port forward for local testing
kubectl port-forward svc/frontend 3000:80 -n ecommerce
kubectl port-forward svc/user-service 8001:8000 -n ecommerce
kubectl port-forward svc/product-service 8002:8000 -n ecommerce

# Restart a deployment
kubectl rollout restart deployment/user-service -n ecommerce

# Scale a deployment
kubectl scale deployment/frontend --replicas=3 -n ecommerce

# Delete and redeploy
kubectl delete deployment user-service -n ecommerce
kubectl apply -f kubernetes/services/user-service.yaml

# Delete everything
kubectl delete namespace ecommerce

EOF

# ============================================
# SECTION 6: DATABASE ACCESS COMMANDS
# ============================================

echo ""
echo "=========================================="
echo "  DATABASE ACCESS"
echo "=========================================="
cat << 'EOF'

# Connect to User Database
kubectl exec -it deployment/user-db -n ecommerce -- psql -U postgres -d userdb

# Connect to Product Database
kubectl exec -it deployment/product-db -n ecommerce -- psql -U postgres -d productdb

# Connect to Cart Database
kubectl exec -it deployment/cart-db -n ecommerce -- psql -U postgres -d cartdb

# Connect to Order Database
kubectl exec -it deployment/order-db -n ecommerce -- psql -U postgres -d orderdb

# Connect to Payment Database
kubectl exec -it deployment/payment-db -n ecommerce -- psql -U postgres -d paymentdb

# Inside PostgreSQL:
#   \dt              - List tables
#   \d+ tablename    - Describe table
#   SELECT * FROM users;
#   SELECT * FROM products;
#   SELECT * FROM orders;
#   \q               - Quit

EOF
