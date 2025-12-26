# ArgoCD Setup Guide for E-Commerce Microservices

## Prerequisites
- EKS cluster running (kastro-cluster)
- kubectl configured
- Helm installed

---

## Step 1: Install ArgoCD on EKS

```bash
# Create ArgoCD namespace
kubectl create namespace argocd

# Install ArgoCD
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Wait for ArgoCD pods to be ready
kubectl wait --for=condition=available deployment/argocd-server -n argocd --timeout=300s

# Check ArgoCD pods
kubectl get pods -n argocd
```

---

## Step 2: Expose ArgoCD Server

### Option A: LoadBalancer (Recommended for EKS)
```bash
# Patch ArgoCD server to use LoadBalancer
kubectl patch svc argocd-server -n argocd -p '{"spec": {"type": "LoadBalancer"}}'

# Get the LoadBalancer URL
kubectl get svc argocd-server -n argocd
# Note the EXTERNAL-IP - this is your ArgoCD URL
```

### Option B: Port Forward (For testing)
```bash
kubectl port-forward svc/argocd-server -n argocd 8080:443
# Access at: https://localhost:8080
```

---

## Step 3: Get ArgoCD Admin Password

```bash
# Get initial admin password
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d
echo

# Login credentials:
# Username: admin
# Password: <output from above command>
```

---

## Step 4: Install ArgoCD CLI (Optional but Recommended)

```bash
# Linux
curl -sSL -o argocd-linux-amd64 https://github.com/argoproj/argo-cd/releases/latest/download/argocd-linux-amd64
sudo install -m 555 argocd-linux-amd64 /usr/local/bin/argocd
rm argocd-linux-amd64

# Verify installation
argocd version
```

---

## Step 5: Login to ArgoCD CLI

```bash
# Get ArgoCD server URL
ARGOCD_SERVER=$(kubectl get svc argocd-server -n argocd -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')

# Login (use --insecure if using self-signed cert)
argocd login $ARGOCD_SERVER --username admin --password <your-password> --insecure
```

---

## Step 6: Add Git Repository

```bash
# Add your GitHub repository (replace with your repo URL)
argocd repo add https://github.com/kastrov/ecommerce-microservices.git \
    --username <github-username> \
    --password <github-token-or-password>
```

---

## Step 7: Create ArgoCD Application

### Option A: Using CLI
```bash
argocd app create ecommerce-app \
    --repo https://github.com/kastrov/ecommerce-microservices.git \
    --path kubernetes \
    --dest-server https://kubernetes.default.svc \
    --dest-namespace ecommerce \
    --sync-policy automated \
    --auto-prune \
    --self-heal
```

### Option B: Using YAML Manifest (Recommended)
Apply the argocd-application.yaml file provided in this repo:
```bash
kubectl apply -f argocd/argocd-application.yaml
```

---

## Step 8: Verify Application

```bash
# Check application status
argocd app get ecommerce-app

# List all applications
argocd app list

# Manually sync if needed
argocd app sync ecommerce-app
```

---

## ArgoCD Web UI Access

1. Get the LoadBalancer URL:
   ```bash
   kubectl get svc argocd-server -n argocd -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'
   ```

2. Open in browser: `https://<LOADBALANCER-URL>`

3. Login with:
   - Username: `admin`
   - Password: (from Step 3)

---

## GitOps Workflow

Once configured, the workflow is:

1. **Developer pushes code** → GitHub
2. **Jenkins builds images** → Pushes to DockerHub
3. **Jenkins updates manifests** → Commits image tags to GitHub
4. **ArgoCD detects changes** → Automatically syncs to EKS
5. **Application updated** → Zero-downtime deployment

---

## Useful ArgoCD Commands

```bash
# Get app status
argocd app get ecommerce-app

# Sync application
argocd app sync ecommerce-app

# View app history
argocd app history ecommerce-app

# Rollback to previous version
argocd app rollback ecommerce-app <revision-number>

# Delete application
argocd app delete ecommerce-app

# View logs
argocd app logs ecommerce-app
```

---

## Troubleshooting

### ArgoCD can't reach Git repo
```bash
argocd repo list
argocd repo rm <repo-url>
argocd repo add <repo-url> --username <user> --password <token>
```

### Application stuck in "Progressing"
```bash
argocd app get ecommerce-app --show-operation
kubectl get events -n ecommerce
```

### Force sync
```bash
argocd app sync ecommerce-app --force
```
