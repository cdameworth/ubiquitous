# 🚀 Ubiquitous POC Quick Deployment Guide

Multiple ways to quickly deploy the complete Ubiquitous demo environment on any macbook.

---

## 🌟 Option 1: One-Line Remote Deployment (Recommended)

**For someone with a clean macbook who wants the demo running in 5-10 minutes:**

```bash
curl -sSL https://raw.githubusercontent.com/cdameworth/ubiquitous/main/ubiquitous-poc/remote-deploy.sh | bash
```

**What this does:**
- ✅ Automatically installs prerequisites (Homebrew, Docker Desktop)
- ✅ Clones the repository to `~/Desktop/ubiquitous-demo/`
- ✅ Builds and starts all containers with synthetic data
- ✅ Creates desktop shortcuts for start/stop/reset
- ✅ Opens http://localhost:3000 automatically

**Requirements:** macOS 10.15+, internet connection, 16GB RAM recommended

---

## 🛠️ Option 2: Manual Git Clone Deployment

**If you prefer to clone manually or already have git/docker:**

```bash
# Clone repository
git clone https://github.com/cdameworth/ubiquitous.git
cd ubiquitous/ubiquitous-poc

# Quick deploy
./quick-deploy.sh --demo
```

**Deployment modes:**
- `--dev` - Minimal resources for development
- `--demo` - Optimized for presentations (default)
- `--full` - Full production-like environment

---

## 📦 Option 3: Portable Package Deployment

**For environments without reliable internet or when you need an offline package:**

### Create Package (on source machine):
```bash
cd ubiquitous-poc
./portable-setup.sh create
```
This creates `~/Desktop/ubiquitous-demo-package.zip` (~2-3GB) containing everything needed.

### Deploy Package (on target machine):
```bash
# Copy the zip file to target machine, then:
unzip ubiquitous-demo-package.zip
cd ubiquitous-demo-*/
./deploy.sh
```

---

## ⚡ Quick Access Summary

| Method | Time | Internet Required | Best For |
|--------|------|-------------------|----------|
| **One-line remote** | 5-10 min | ✅ Yes | Clean macbooks, presentations |
| **Manual clone** | 3-5 min | ✅ Yes | Developers, customization |
| **Portable package** | 2-3 min | ❌ No | Offline demos, airgapped environments |

---

## 🎬 Demo Environment Features

### Synthetic Data Included
- **155+ AWS infrastructure nodes** (EKS clusters, RDS instances, EC2 SQL Server)
- **10M+ graph relationships** representing real enterprise dependencies
- **90 days of metrics** across all infrastructure components
- **4 crisis scenarios** with realistic business impact calculations

### Real-time Capabilities
- **WebSocket streaming** for live updates during presentations
- **Interactive drill-down** across all visualization components
- **Presenter mode** with keyboard shortcuts and auto-advance
- **Cost savings calculator** with actual ROI demonstrations

### Complete Technology Stack
- **Frontend**: React 18 + TypeScript + D3.js + Mantine UI
- **Backend**: FastAPI + Python with 72 API endpoints
- **Databases**: Neo4j (10M nodes) + TimescaleDB + Redis
- **Infrastructure**: Docker containers with health monitoring

---

## 🎯 Access Information

Once deployed, the demo is available at:

| Service | URL | Credentials |
|---------|-----|-------------|
| **Demo Interface** | http://localhost:3000 | No login required |
| **API Documentation** | http://localhost:8000/api/docs | No auth required |
| **Neo4j Browser** | http://localhost:7474 | neo4j/ubiquitous123 |
| **Health Check** | http://localhost:8000/health | Status endpoint |

---

## 🔧 Management Commands

### Desktop Shortcuts (created automatically)
- **Start Ubiquitous Demo.command** - Start all services
- **Stop Ubiquitous Demo.command** - Stop all services  
- **Reset Ubiquitous Demo.command** - Reset with fresh data

### Manual Commands
```bash
cd ubiquitous-poc/

# Start demo
docker compose up -d

# View logs
docker compose logs -f backend

# Reset with fresh data
docker compose down -v && ./quick-deploy.sh

# Stop everything
docker compose down
```

---

## 🎭 Demo Scenarios

### 1. Cost Spiral Crisis (4 minutes)
- **Trigger**: 40% AWS bill increase from inefficient services
- **Journey**: Cost anomaly → S3/Lambda analysis → optimization → $780K saved
- **Demo Value**: Real-time cost optimization with Terraform automation

### 2. EKS Scaling Crisis (5 minutes) 
- **Trigger**: Trading pods failing to scale during market hours
- **Journey**: Alert → EKS analysis → ASG bottleneck → resolution → $2M saved
- **Demo Value**: Kubernetes expertise with business impact correlation

### 3. Oracle Performance Crisis (4 minutes)
- **Trigger**: Oracle RDS hitting CPU/connection limits
- **Journey**: DB metrics → PostgreSQL migration analysis → $180K licensing savings
- **Demo Value**: Database optimization with enterprise licensing intelligence

### 4. SQL Server Licensing Crisis (3 minutes)
- **Trigger**: Over-provisioned Enterprise SQL Server licenses
- **Journey**: License audit → workload assessment → edition downgrade → $240K saved
- **Demo Value**: License optimization with compliance validation

**Total Demo Value Demonstrated**: $3.2M+ in cost savings scenarios

---

## 🚨 Troubleshooting

### Quick Fixes

**Port Conflicts:**
```bash
# Find and kill conflicting processes
lsof -ti:3000,8000,7474,5432,6379 | xargs kill -9

# Or use different ports
FRONTEND_PORT=3001 BACKEND_PORT=8001 docker compose up -d
```

**Memory Issues:**
```bash
# Check Docker Desktop resource allocation
# Go to Docker Desktop → Settings → Resources
# Allocate at least 8GB RAM and 4 CPUs
```

**Container Startup Failures:**
```bash
# Check individual container logs
docker compose logs backend
docker compose logs datagen

# Reset everything
docker compose down -v --remove-orphans
./quick-deploy.sh --demo
```

**Data Missing:**
```bash
# Manually initialize synthetic data
docker compose exec datagen python main.py

# Verify data was created
curl http://localhost:8000/api/infrastructure/topology | jq '.nodes | length'
```

### Advanced Troubleshooting

**Database Connection Issues:**
```bash
# Test database connectivity
docker compose exec backend python -c "
from app.database import test_connections
test_connections()
"
```

**Performance Problems:**
```bash
# Check Docker resources
docker stats

# Check system resources
top -l 1 | grep "CPU usage"
```

---

## 📱 Mobile Demo Access

For demos on tablets or mobile devices, the interface is responsive:

- **Tablet**: Full functionality with touch interactions
- **Mobile**: Core dashboards with simplified navigation
- **Remote Access**: Use ngrok for external access during presentations

```bash
# Install ngrok for external access
brew install ngrok

# Expose demo publicly (for remote presentations)
ngrok http 3000
```

---

## ⚡ Performance Optimization

### For Best Demo Performance:
1. **Close unnecessary applications** before starting
2. **Ensure 16GB+ RAM** is available
3. **Use SSD storage** for Docker volumes
4. **Disable Time Machine** during demonstrations
5. **Connect to power** (not running on battery)

### Container Resource Allocation:
- **Frontend**: 1GB RAM, 1 CPU core
- **Backend**: 2GB RAM, 2 CPU cores  
- **Neo4j**: 4GB RAM, 2 CPU cores
- **TimescaleDB**: 4GB RAM, 2 CPU cores
- **Redis**: 1GB RAM, 1 CPU core

**Total**: ~12GB RAM, 8 CPU cores recommended

---

*Ready to transform infrastructure intelligence at Capital Group! 🏛️*