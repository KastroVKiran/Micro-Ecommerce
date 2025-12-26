# Jenkins Setup Guide for E-Commerce Microservices CI/CD

## Prerequisites
- Ubuntu 24.04 (t2.large recommended for Jenkins server)
- Java 17+
- Docker installed

---

## Step 1: Install Jenkins

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Java
sudo apt install -y openjdk-17-jdk

# Add Jenkins repository
curl -fsSL https://pkg.jenkins.io/debian-stable/jenkins.io-2023.key | sudo tee \
    /usr/share/keyrings/jenkins-keyring.asc > /dev/null

echo deb [signed-by=/usr/share/keyrings/jenkins-keyring.asc] \
    https://pkg.jenkins.io/debian-stable binary/ | sudo tee \
    /etc/apt/sources.list.d/jenkins.list > /dev/null

# Install Jenkins
sudo apt update
sudo apt install -y jenkins

# Start Jenkins
sudo systemctl start jenkins
sudo systemctl enable jenkins

# Get initial admin password
sudo cat /var/lib/jenkins/secrets/initialAdminPassword
```

---

## Step 2: Install Docker

```bash
# Install Docker
sudo apt install -y docker.io

# Add Jenkins user to docker group
sudo usermod -aG docker jenkins

# Restart Jenkins
sudo systemctl restart jenkins
```

---

## Step 3: Install Required Tools on Jenkins Server

```bash
# Install kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl

# Install AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
sudo apt install -y unzip
unzip awscliv2.zip
sudo ./aws/install

# Install eksctl
curl --silent --location "https://github.com/weaveworks/eksctl/releases/latest/download/eksctl_$(uname -s)_amd64.tar.gz" | tar xz -C /tmp
sudo mv /tmp/eksctl /usr/local/bin

# Install Git
sudo apt install -y git
```

---

## Step 4: Access Jenkins Web UI

1. Open browser: `http://<JENKINS-SERVER-IP>:8080`
2. Enter initial admin password (from Step 1)
3. Install suggested plugins
4. Create admin user

---

## Step 5: Install Required Jenkins Plugins

Go to: **Manage Jenkins → Plugins → Available Plugins**

### Required Plugins:
| Plugin Name | Purpose |
|-------------|---------|
| **Docker Pipeline** | Build Docker images in pipeline |
| **Docker Commons** | Docker support |
| **Pipeline** | Pipeline as code support |
| **Pipeline: AWS Steps** | AWS integration |
| **Amazon ECR** | ECR support (optional) |
| **Git** | Git integration |
| **GitHub** | GitHub webhooks |
| **Credentials** | Manage credentials |
| **Credentials Binding** | Use credentials in pipeline |
| **Blue Ocean** | Modern UI (optional) |
| **Kubernetes CLI** | kubectl commands |
| **SSH Agent** | SSH key management |

### Install via CLI (Alternative):
```bash
# Install plugins via Jenkins CLI
java -jar jenkins-cli.jar -s http://localhost:8080/ install-plugin \
    docker-workflow \
    docker-commons \
    pipeline-aws \
    git \
    github \
    credentials \
    credentials-binding \
    blueocean \
    kubernetes-cli
```

---

## Step 6: Configure Credentials in Jenkins

Go to: **Manage Jenkins → Credentials → System → Global credentials**

### Add DockerHub Credentials:
1. Click "Add Credentials"
2. Kind: **Username with password**
3. ID: `dockerhub-credentials`
4. Username: `kastrov`
5. Password: Your DockerHub password or access token

### Add AWS Credentials:
1. Click "Add Credentials"
2. Kind: **AWS Credentials**
3. ID: `aws-credentials`
4. Access Key ID: Your AWS Access Key
5. Secret Access Key: Your AWS Secret Key

### Add GitHub Credentials (for ArgoCD workflow):
1. Click "Add Credentials"
2. Kind: **Username with password**
3. ID: `github-credentials`
4. Username: Your GitHub username
5. Password: GitHub Personal Access Token (with repo permissions)

---

## Step 7: Configure Jenkins Tools

Go to: **Manage Jenkins → Tools**

### Git:
- Name: `Default`
- Path: `/usr/bin/git`

### Docker:
- Name: `docker`
- Install automatically (or set path to `/usr/bin/docker`)

---

## Step 8: Create Jenkins Pipeline Job

### Option A: Pipeline from SCM (Recommended)
1. **New Item** → Enter name → Select **Pipeline**
2. In Pipeline section:
   - Definition: **Pipeline script from SCM**
   - SCM: **Git**
   - Repository URL: `https://github.com/kastrov/ecommerce-microservices.git`
   - Branch: `*/main`
   - Script Path: `Jenkinsfile`
3. Save

### Option B: Manual Pipeline
1. **New Item** → Enter name → Select **Pipeline**
2. In Pipeline section:
   - Definition: **Pipeline script**
   - Paste the content of `Jenkinsfile`
3. Save

---

## Step 9: Configure GitHub Webhook (Optional)

1. Go to your GitHub repo → Settings → Webhooks
2. Add webhook:
   - Payload URL: `http://<JENKINS-IP>:8080/github-webhook/`
   - Content type: `application/json`
   - Events: Push events
3. In Jenkins job, enable "GitHub hook trigger for GITScm polling"

---

## Step 10: Configure AWS for Jenkins

```bash
# On Jenkins server, configure AWS for jenkins user
sudo -u jenkins aws configure
# Enter:
# - AWS Access Key ID
# - AWS Secret Access Key
# - Region: us-east-1
# - Output format: json

# Update kubeconfig for jenkins user
sudo -u jenkins aws eks update-kubeconfig --name kastro-cluster --region us-east-1

# Verify
sudo -u jenkins kubectl get nodes
```

---

## Pipeline Workflow Summary

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   GitHub    │────▶│   Jenkins   │────▶│  DockerHub  │
│   (Code)    │     │   (Build)   │     │  (Images)   │
└─────────────┘     └──────┬──────┘     └─────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │    EKS      │
                    │  (Deploy)   │
                    └─────────────┘
```

---

## Troubleshooting

### Docker permission denied
```bash
sudo usermod -aG docker jenkins
sudo systemctl restart jenkins
```

### kubectl not found
```bash
sudo ln -s /usr/local/bin/kubectl /usr/bin/kubectl
```

### AWS credentials not working
```bash
sudo -u jenkins aws sts get-caller-identity
```

### Pipeline fails at Docker build
- Check Docker daemon is running: `sudo systemctl status docker`
- Check Jenkins user in docker group: `groups jenkins`
