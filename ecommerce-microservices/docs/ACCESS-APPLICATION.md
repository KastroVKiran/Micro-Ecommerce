# How to Access the E-Commerce Application

## Application URL

After deployment, your application is accessible via the **AWS Application Load Balancer (ALB)**.

### Get the ALB URL:

```bash
# Run this command to get your application URL
kubectl get ingress ecommerce-ingress -n ecommerce -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'
```

**Example output:**
```
k8s-ecommerc-ecommerc-xxxxxxxxxx-xxxxxxxxxx.us-east-1.elb.amazonaws.com
```

### Access the Application:

| Component | URL |
|-----------|-----|
| **Frontend (Main App)** | `http://<ALB-URL>/` |
| **User Service API** | `http://<ALB-URL>/api/users/` |
| **Product Service API** | `http://<ALB-URL>/api/products/` |
| **Cart Service API** | `http://<ALB-URL>/api/cart/` |
| **Order Service API** | `http://<ALB-URL>/api/orders/` |
| **Payment Service API** | `http://<ALB-URL>/api/payments/` |

---

## URL Breakdown

```
http://k8s-ecommerc-ecommerc-abc123-xyz789.us-east-1.elb.amazonaws.com
│      │                                                             │
│      └─────────────── ALB DNS Name ───────────────────────────────┘
│
└── Protocol (HTTP - for HTTPS, configure ACM certificate)
```

---

## Testing the Application

### 1. Test Frontend
Open in browser:
```
http://<ALB-URL>/
```

### 2. Test API Endpoints

```bash
# Set your ALB URL
ALB_URL="k8s-ecommerc-ecommerc-abc123-xyz789.us-east-1.elb.amazonaws.com"

# Test Health Endpoints
curl http://${ALB_URL}/api/users/health
curl http://${ALB_URL}/api/products/health
curl http://${ALB_URL}/api/cart/health
curl http://${ALB_URL}/api/orders/health
curl http://${ALB_URL}/api/payments/health

# Get Products
curl http://${ALB_URL}/api/products/products

# Get Featured Products
curl http://${ALB_URL}/api/products/products/featured

# Get Categories
curl http://${ALB_URL}/api/products/products/categories

# Register a User
curl -X POST http://${ALB_URL}/api/users/register \
    -H "Content-Type: application/json" \
    -d '{
        "email": "test@example.com",
        "password": "password123",
        "full_name": "Test User",
        "phone": "9876543210"
    }'

# Login
curl -X POST http://${ALB_URL}/api/users/login \
    -H "Content-Type: application/json" \
    -d '{
        "email": "test@example.com",
        "password": "password123"
    }'
```

---

## Local Access (Port Forwarding)

If ALB is not ready or for debugging:

```bash
# Access Frontend locally
kubectl port-forward svc/frontend 3000:80 -n ecommerce
# Open: http://localhost:3000

# Access individual services
kubectl port-forward svc/user-service 8001:8000 -n ecommerce
kubectl port-forward svc/product-service 8002:8000 -n ecommerce
kubectl port-forward svc/cart-service 8003:8000 -n ecommerce
kubectl port-forward svc/order-service 8004:8000 -n ecommerce
kubectl port-forward svc/payment-service 8005:8000 -n ecommerce
```

---

## Troubleshooting Access Issues

### 1. ALB not showing URL
```bash
# Check ingress status
kubectl describe ingress ecommerce-ingress -n ecommerce

# Check AWS Load Balancer Controller logs
kubectl logs -n kube-system deployment/aws-load-balancer-controller
```

### 2. 502 Bad Gateway
```bash
# Check if pods are running
kubectl get pods -n ecommerce

# Check pod logs
kubectl logs -f deployment/frontend -n ecommerce
```

### 3. 404 Not Found
- Check if the path is correct
- API routes should start with `/api/`
- Frontend routes are handled by React Router

### 4. Connection Timeout
```bash
# Check if security groups allow traffic on port 80
# In AWS Console: EC2 → Security Groups → Find the ALB's security group
# Ensure inbound rule for port 80 from 0.0.0.0/0
```

---

## Custom Domain (Optional)

To use a custom domain like `shop.yourdomain.com`:

1. **Create Route 53 Hosted Zone** (if not exists)

2. **Create CNAME Record:**
   ```
   Name: shop.yourdomain.com
   Type: CNAME
   Value: <ALB-URL>
   ```

3. **For HTTPS, add ACM Certificate:**
   ```bash
   # Update ingress annotation
   kubectl annotate ingress ecommerce-ingress -n ecommerce \
       alb.ingress.kubernetes.io/certificate-arn=arn:aws:acm:us-east-1:739275478529:certificate/xxx
   ```

---

## Summary

```
┌─────────────────────────────────────────────────────────────┐
│                         INTERNET                             │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│            AWS Application Load Balancer (ALB)               │
│     http://k8s-ecommerc-xxx.us-east-1.elb.amazonaws.com     │
└─────────────────────────────┬───────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          │                   │                   │
          ▼                   ▼                   ▼
    ┌──────────┐       ┌──────────┐       ┌──────────┐
    │    /     │       │/api/users│       │/api/...  │
    │ Frontend │       │  Service │       │ Services │
    └──────────┘       └──────────┘       └──────────┘
```

**Your Application URL will be:**
```
http://<kubectl get ingress output>
```
