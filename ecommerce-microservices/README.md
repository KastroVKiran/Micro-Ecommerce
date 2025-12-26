# E-Commerce Microservices Platform

A production-grade 3-tier e-commerce application built with microservices architecture, deployed on AWS EKS.

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        AWS EKS Cluster                          │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │              Application Load Balancer (ALB)               │  │
│  │                    via AWS Ingress                         │  │
│  └─────────────────────────┬─────────────────────────────────┘  │
│                            │                                     │
│  ┌─────────────────────────▼─────────────────────────────────┐  │
│  │                    Frontend (React)                        │  │
│  │              Nginx + React SPA Build                       │  │
│  └─────────────────────────┬─────────────────────────────────┘  │
│                            │                                     │
│  ┌─────────────────────────▼─────────────────────────────────┐  │
│  │                  Backend Microservices                     │  │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌──────┐ │  │
│  │  │  User   │ │ Product │ │  Cart   │ │  Order  │ │Payment│ │  │
│  │  │ Service │ │ Service │ │ Service │ │ Service │ │Service│ │  │
│  │  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘ └───┬──┘ │  │
│  │       │           │           │           │          │     │  │
│  │  ┌────▼────┐ ┌────▼────┐ ┌────▼────┐ ┌────▼────┐ ┌───▼──┐ │  │
│  │  │ UserDB  │ │ProductDB│ │ CartDB  │ │ OrderDB │ │PayDB │ │  │
│  │  │Postgres │ │Postgres │ │Postgres │ │Postgres │ │Postgr│ │  │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └──────┘ │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  Worker Node 1 (AZ-a)              Worker Node 2 (AZ-b)         │
└─────────────────────────────────────────────────────────────────┘
```

## 📁 Project Structure

```
ecommerce-microservices/
├── services/
│   ├── user-service/         # Authentication & user management
│   ├── product-service/      # Product catalog & inventory
│   ├── cart-service/         # Shopping cart operations
│   ├── order-service/        # Order processing
│   └── payment-service/      # Payment processing (dummy)
├── frontend/                  # React application
├── kubernetes/
│   ├── namespace.yaml
│   ├── configmaps/
│   ├── databases/
│   ├── services/
│   └── gateway/
└── scripts/
    ├── build-and-push.sh
    ├── deploy.sh
    ├── access-db.sh
    └── add-product.sh
```

## 🚀 Deployment Steps

### Prerequisites
- AWS CLI configured with proper credentials
- kubectl configured for your EKS cluster
- Docker installed and logged into DockerHub
- Helm installed

### Step 1: Build and Push Docker Images

```bash
cd ecommerce-microservices
chmod +x scripts/*.sh
./scripts/build-and-push.sh
```

### Step 2: Deploy to EKS

```bash
./scripts/deploy.sh
```

### Step 3: Get Application URL

```bash
kubectl get ingress ecommerce-ingress -n ecommerce
```

## 📊 Verify Deployment

### Check All Pods
```bash
kubectl get pods -n ecommerce
```

Expected output:
```
NAME                               READY   STATUS    RESTARTS   AGE
user-db-xxx                        1/1     Running   0          5m
product-db-xxx                     1/1     Running   0          5m
cart-db-xxx                        1/1     Running   0          5m
order-db-xxx                       1/1     Running   0          5m
payment-db-xxx                     1/1     Running   0          5m
user-service-xxx                   1/1     Running   0          4m
product-service-xxx                1/1     Running   0          4m
cart-service-xxx                   1/1     Running   0          4m
order-service-xxx                  1/1     Running   0          4m
payment-service-xxx                1/1     Running   0          4m
frontend-xxx                       1/1     Running   0          4m
```

### Check Services
```bash
kubectl get svc -n ecommerce
```

### Check Ingress
```bash
kubectl get ingress -n ecommerce
```

## 💾 Database Access

To connect to any database and verify data:

```bash
# User Database
kubectl exec -it deployment/user-db -n ecommerce -- psql -U postgres -d userdb

# Product Database
kubectl exec -it deployment/product-db -n ecommerce -- psql -U postgres -d productdb

# Cart Database
kubectl exec -it deployment/cart-db -n ecommerce -- psql -U postgres -d cartdb

# Order Database
kubectl exec -it deployment/order-db -n ecommerce -- psql -U postgres -d orderdb

# Payment Database
kubectl exec -it deployment/payment-db -n ecommerce -- psql -U postgres -d paymentdb
```

### Common SQL Commands
```sql
\dt                    -- List all tables
\d+ tablename          -- Describe table
SELECT * FROM users;   -- View all users
SELECT * FROM products;-- View all products
SELECT * FROM orders;  -- View all orders
\q                     -- Quit
```

## 📦 Adding New Products

Products are stored in the database, not in code. To add products:

### Option 1: Using the Script
```bash
./scripts/add-product.sh
```

### Option 2: Using cURL
```bash
# First, login to get a token
TOKEN=$(curl -s -X POST "http://<ALB_URL>/api/users/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@example.com","password":"password123"}' | jq -r '.token')

# Add a new product
curl -X POST "http://<ALB_URL>/api/products/products" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{
        "name": "New Product Name",
        "description": "Product description",
        "price": 9999,
        "original_price": 12999,
        "category": "Electronics",
        "brand": "BrandName",
        "image_url": "https://example.com/image.jpg",
        "stock": 100,
        "is_featured": true,
        "discount_percent": 23
    }'
```

**Note: Products appear immediately after adding - NO rebuild or redeploy needed!**

## 🔧 Useful Commands

### View Logs
```bash
# View service logs
kubectl logs -f deployment/user-service -n ecommerce
kubectl logs -f deployment/product-service -n ecommerce

# View database logs
kubectl logs -f deployment/user-db -n ecommerce
```

### Scale Services
```bash
# Scale a service (not recommended for databases)
kubectl scale deployment/frontend --replicas=3 -n ecommerce
```

### Restart Deployment
```bash
kubectl rollout restart deployment/user-service -n ecommerce
```

### Delete Everything
```bash
kubectl delete namespace ecommerce
```

## 🌐 API Endpoints

| Service | Endpoint | Description |
|---------|----------|-------------|
| User | POST /api/users/register | Register new user |
| User | POST /api/users/login | User login |
| User | GET /api/users/profile | Get user profile |
| Product | GET /api/products/products | List all products |
| Product | GET /api/products/products/{id} | Get product details |
| Product | POST /api/products/products | Add new product |
| Cart | GET /api/cart/cart | Get cart |
| Cart | POST /api/cart/cart | Add to cart |
| Order | POST /api/orders/orders | Create order |
| Order | GET /api/orders/orders | List user orders |
| Payment | POST /api/payments/payments/process | Process payment |

## 📈 Next Steps (Phase 2)

- [ ] Jenkins CI/CD Pipeline
- [ ] ArgoCD GitOps Deployment
- [ ] Monitoring with Prometheus & Grafana
- [ ] Centralized Logging with ELK Stack
- [ ] SSL/TLS with AWS Certificate Manager
- [ ] Auto-scaling with HPA
- [ ] Redis Caching Layer

## 🔐 Security Notes

- Change default database passwords in production
- Use AWS Secrets Manager for sensitive data
- Enable HTTPS with AWS ACM
- Implement rate limiting
- Add input validation
