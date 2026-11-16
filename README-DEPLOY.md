# ARcricinfo — Deployment Guide

## 🔒 Security First

| What | Where | Committed? |
|------|-------|------------|
| `.env.local` (frontend Vite env) | repo root | ❌ gitignored |
| `backend/.env` | backend/ | ❌ gitignored |
| `k8s/secret-*.yaml` | k8s/ | ❌ gitignored |
| `Dockerfile` | repo root | ✅ safe |
| `docker-compose.yml` | repo root | ✅ safe (no secrets) |
| `k8s/*.yaml` (non-secret) | k8s/ | ✅ safe |

Secrets are **never committed**. They are:
- Injected as `--build-arg` during Docker builds (CI only)
- Stored as GitHub Actions Secrets in the repo settings
- Applied to Kubernetes via `kubectl create secret` in CI/CD (not from YAML files)

---

## 🐳 Local Development with Docker Compose

### 1. Create a local `.env` file (never commit this)
```bash
# repo root .env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 2. Start the full stack
```bash
docker compose up --build
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3001 |
| Backend | http://localhost:4000 |

### 3. Stop
```bash
docker compose down
```

---

## ☸️ Kubernetes Production Deploy

### Prerequisites
- `kubectl` configured for your cluster
- Nginx Ingress Controller installed
- (Optional) cert-manager for TLS

### Step 1 — Install Nginx Ingress Controller
```bash
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.9.4/deploy/static/provider/cloud/deploy.yaml
```

### Step 2 — Create the namespace
```bash
kubectl apply -f k8s/00-namespace.yaml
```

### Step 3 — Create backend secrets
```bash
kubectl create secret generic arcricinfo-backend-secrets \
  --namespace=arcricinfo \
  --from-literal=SUPABASE_URL="https://your-project.supabase.co" \
  --from-literal=SUPABASE_ANON_KEY="your-anon-key" \
  --from-literal=SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

### Step 4 — Apply all manifests
```bash
kubectl apply -f k8s/
```

### Step 5 — Update the Ingress domain
Edit `k8s/06-ingress.yaml` and replace `arcricinfo.yourdomain.com` with your real domain, then re-apply.

### Step 6 — Monitor rollout
```bash
kubectl rollout status deployment/arcricinfo-frontend -n arcricinfo
kubectl rollout status deployment/arcricinfo-backend  -n arcricinfo
kubectl get pods -n arcricinfo
kubectl get ingress -n arcricinfo
```

---

## 🚀 CI/CD via GitHub Actions

The workflow at `.github/workflows/ci-cd.yml` automatically:
1. Builds Docker images on every push to `main`
2. Pushes images to GitHub Container Registry (`ghcr.io`)
3. Deploys to Kubernetes by updating the image SHA

### Required GitHub Secrets (Settings → Secrets → Actions)

| Secret | Description |
|--------|-------------|
| `VITE_SUPABASE_URL` | Supabase project URL (frontend build arg) |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key (frontend build arg) |
| `SUPABASE_URL` | Supabase URL (backend runtime) |
| `SUPABASE_ANON_KEY` | Supabase anon key (backend runtime) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (backend runtime) |
| `KUBECONFIG_B64` | Base64-encoded kubeconfig for your cluster |

Generate `KUBECONFIG_B64`:
```bash
cat ~/.kube/config | base64 -w 0
```

---

## 📐 Kubernetes Architecture

```
Internet → Ingress (Nginx)
              ├── /api/*        → Backend Service (port 4000)
              ├── /socket.io/*  → Backend Service (port 4000)   [WebSocket]
              └── /*            → Frontend Service (port 80)

Frontend Pods (2→5 replicas, HPA)   ← Nginx serving React SPA
Backend Pods  (2→6 replicas, HPA)   ← Express + Socket.IO
                                           ↓ HTTPS
                                       Supabase Cloud
```

Network Policies enforce **default-deny**: only declared pod-to-pod traffic is allowed.
