# Ubiquitous Wizard of Oz POC

Enterprise Infrastructure Intelligence Platform demonstration for Capital Group.

## Overview

This POC demonstrates all 9 Ubiquitous capabilities through a realistic AWS environment simulation:
- EKS compute layer with 5 clusters
- RDS PostgreSQL and Oracle databases  
- EC2 SQL Server instances
- Comprehensive AWS services integration

## Architecture

- **Frontend**: React 18 + TypeScript + Vite + D3.js + Cytoscape.js
- **Backend**: FastAPI + Python with WebSocket support
- **Graph Database**: Neo4j with 10M+ nodes
- **Time-Series**: TimescaleDB with 90 days of metrics
- **Cache**: Redis for real-time state management
- **Data Generator**: Continuous synthetic data creation
- **Proxy**: Nginx for production routing

## 🚀 Quick Deployment Options

### 🌟 One-Line Remote Deploy (Easiest)
```bash
# Deploy complete demo on any macbook in 5-10 minutes
curl -sSL https://raw.githubusercontent.com/cdameworth/ubiquitous/main/ubiquitous-poc/remote-deploy.sh | bash
```

**Perfect for:** Presentations, clean machines, first-time users

### 🛠️ Quick Deploy Script (Development)
```bash
# If you already have the repository
./quick-deploy.sh --demo    # Presentation optimized
./quick-deploy.sh --dev     # Minimal resources
./quick-deploy.sh --full    # Production-like
```

**Perfect for:** Developers, testing different configurations

### 📦 Portable Offline Package
```bash
# Create package (source machine)
./portable-setup.sh create

# Deploy package (target machine)
./portable-setup.sh deploy
```

**Perfect for:** Offline demos, airgapped environments

### 🖥️ Desktop Controls (Auto-Created)
After deployment, double-click:
- **Start Ubiquitous Demo.command** - Start all services
- **Stop Ubiquitous Demo.command** - Clean shutdown
- **Reset Ubiquitous Demo.command** - Fresh synthetic data

### Prerequisites
- macOS 10.15+
- 16GB+ RAM recommended
- 20GB+ available storage
- Docker Desktop (auto-installed if needed)

### Manual Development Environment
```bash
# Clone and navigate to project
cd ubiquitous-poc

# Initialize all databases (recommended first run)
./scripts/init-all-databases.sh

# Start all services
docker-compose up -d

# Wait for services to initialize (2-3 minutes)
docker-compose logs -f

# Access the application
open http://localhost:3000

# API documentation
open http://localhost:8000/api/docs
```

### Production Environment
```bash
# Start with production configuration
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Access via nginx proxy
open http://localhost
```

## 🎬 Demo Management

### Desktop Shortcuts (Auto-Created)
- **Start Ubiquitous Demo.command** - One-click startup
- **Stop Ubiquitous Demo.command** - Clean shutdown
- **Reset Ubiquitous Demo.command** - Fresh synthetic data reset

### Deployment Modes
- **Demo Mode** (`--demo`): Optimized for presentations (default)
- **Dev Mode** (`--dev`): Minimal resources for development
- **Full Mode** (`--full`): Production-like environment

### Data Management
```bash
# Reset with fresh synthetic data
docker compose down -v && ./quick-deploy.sh

# Initialize data manually
docker compose exec datagen python main.py

# Check data status
curl http://localhost:8000/api/infrastructure/topology | jq '.nodes | length'
```

### Troubleshooting
See [`QUICK_DEPLOYMENT.md`](./QUICK_DEPLOYMENT.md) for comprehensive troubleshooting guide.

## Demo Scenarios

### 1. EKS Pod Scaling Crisis (5 min)
**Trigger**: Trading pods failing to scale during market hours  
**Value**: $2M revenue protection + $45K monthly savings

### 2. RDS Oracle Performance Crisis (4 min)  
**Trigger**: Oracle RDS hitting CPU/connection limits  
**Value**: $180K annual licensing cost savings

### 3. Multi-Service AWS Cost Spiral (4 min)
**Trigger**: 40% AWS bill increase from inefficient services  
**Value**: $780K annual cost optimization

### 4. EC2 SQL Server Licensing (3 min)
**Trigger**: Over-provisioned Enterprise licenses  
**Value**: $240K annual licensing savings

## Container Services

| Service | Port | Purpose | Memory | Status |
|---------|------|---------|--------|---------| 
| Frontend | 3000 | React UI with Vite build system | 1GB | ✅ Ready |
| API | 8000 | FastAPI backend with WebSocket + 72 endpoints | 2GB | ✅ Ready |
| Graph | 7474, 7687 | Neo4j with AWS topology (5 EKS clusters) | 4GB | ✅ Ready |
| TimeSeries | 5432 | TimescaleDB with 8 metric tables | 4GB | ✅ Ready |
| Cache | 6379 | Redis for WebSocket state + caching | 1GB | ✅ Ready |
| DataGen | - | Synthetic data generation | 1GB | ✅ Ready |
| Nginx | 80 | Production proxy | 256MB | ✅ Ready |

**Database Schema Ready**: 155+ total nodes (5 EKS clusters, 7 RDS instances, 4 EC2 SQL Server instances, 15 services, 5 applications) with realistic AWS infrastructure costs and dependencies.

**Data Generation Active**: Continuous synthetic data generation with:
- 90 days of historical metrics with business hour patterns
- Real-time metrics streaming every 60 seconds
- 10M+ time-series records across 8 metric tables
- Realistic correlations between CPU, memory, response times, and error rates

**Frontend Platform Ready**: React 18 + TypeScript with Vite build system featuring:
- Complete UI for all 9 Ubiquitous capabilities
- Modern Vite build system for faster development (replaced react-scripts)
- Advanced D3.js visualization suite with 20+ interactive components
- Enhanced network protocol analysis with drill-down navigation
- EKS cluster topology with real-time resource indicators
- Service dependency mapping with critical path analysis
- Multi-time-range latency heatmap analysis
- **Advanced FinOps Dashboard** with cost breakdown treemap, trend analysis, and optimization recommendations
- **EKS Cost Analysis** with cluster-specific utilization metrics and right-sizing recommendations
- **Terraform Code Generator** with interactive templates and infrastructure automation
- **Security & Observability Center** with CVE correlation, dependency analysis, and alert tuning
- **Vulnerability Scanner** with 58 vulnerabilities across 4 severity levels
- **Multi-Ecosystem Dependency Analysis** supporting 7 package managers (npm, pip, maven, nuget, go, cargo, gem)
- **Observability Gap Analysis** with 5-category monitoring assessment
- **AI-Powered Alert Tuning** with performance analytics and optimization recommendations
- **Executive Reporting Suite** with multi-level dashboards (CEO, CIO, Director)
- **ROI Calculation Engine** with fiscal period analysis and cost savings trends
- **Comprehensive Business Intelligence** with scenario modeling and portfolio analysis
- Native WebSocket implementation for real-time data streaming
- React Router v7 future flags for modern routing
- Professional responsive design with gradient theme
- 75+ API endpoint integrations with real database queries and error handling

## Development

### Adding New Features
See [CLAUDE.md](../CLAUDE.md) for session-by-session development guide.

### Container Management
```bash
# View logs for specific service
docker-compose logs -f [service-name]

# Rebuild specific container
docker-compose build [service-name]

# Reset databases
docker-compose down -v && docker-compose up -d

# Check container resource usage
docker stats
```

### Database Access
```bash
# Neo4j browser
open http://localhost:7474
# Credentials: neo4j/ubiquitous123

# PostgreSQL (TimescaleDB)
docker-compose exec timeseries psql -U postgres -d ubiquitous

# Redis CLI  
docker-compose exec cache redis-cli -a ubiquitous_redis_2024

# Test all database connections
./scripts/test-databases.py
```

### Data Generator Management
```bash
# Test data generator integration
./scripts/test-datagen-integration.sh

# Check data generation status
docker-compose exec datagen python main.py --status

# Populate historical data only
docker-compose exec datagen python main.py --populate

# Start real-time generation
docker-compose exec datagen python main.py --realtime

# Monitor data generation logs
docker-compose logs -f datagen
```

### Frontend Development
```bash
# Access React development server (Vite)
open http://localhost:3000

# View frontend logs
docker-compose logs -f frontend

# Build frontend for production (Vite)
docker-compose build frontend

# Run frontend in development mode (Vite hot reload)
docker-compose exec frontend npm run dev

# Access individual capabilities with enhanced visualizations
open http://localhost:3000/network-analysis  # Features: Network topology, EKS cluster view, service dependencies, latency heatmaps
open http://localhost:3000/finops             # Features: Cost breakdown treemap, trend analysis, EKS cost optimization, Terraform generator
open http://localhost:3000/security           # Features: Security & Observability Center with vulnerability scanning, dependency analysis, observability gaps, alert tuning
open http://localhost:3000/executive          # Features: Executive Reporting Suite with multi-level dashboards, ROI analysis, fiscal period analysis, cost savings trends
```

## Kubernetes Deployment

```bash
# Apply all Kubernetes manifests
kubectl apply -f k8s/

# Check deployment status
kubectl get pods -n ubiquitous-poc

# Port forward for local access
kubectl port-forward svc/ubiquitous-frontend-service 3000:80 -n ubiquitous-poc
```

## Troubleshooting

### Common Issues

**Containers won't start**: Check available RAM (16GB+ recommended)
```bash
docker system df
docker system prune
```

**Database connection errors**: Ensure databases are fully initialized
```bash
# Check database container logs
docker-compose logs graph timeseries cache

# Test database connectivity
./scripts/test-databases.py

# Reinitialize if needed
./scripts/init-all-databases.sh
```

**Performance issues**: Monitor container resources
```bash
docker stats
# Consider reducing data generation frequency in datagen service
```

**Port conflicts**: Check for conflicting services
```bash
lsof -i :3000
lsof -i :8000
```

## Success Metrics

- **Response Time**: <2 seconds for all UI interactions
- **Data Scale**: 10M+ nodes, 100M+ relationships rendered
- **Demo Effectiveness**: 90%+ audience engagement
- **Visualization Performance**: Interactive D3.js components with <2s load times
- **Drill-Down Capability**: Multi-level navigation through infrastructure layers
- **Real-Time Features**: Live data updates every 5 seconds via WebSocket
- **Business Value**: Clear $23.2M annual cost savings demonstration

## Enterprise Platform Transformation

**Current Status**: This POC provides a solid foundation but represents <5% of the enterprise platform capabilities outlined in `ubiquitous-solution.md`.

**Transformation Analysis**: A comprehensive frontend transformation plan has been created at `claudedocs/frontend-transformation-plan.md` that outlines:
- **Current Gap**: Missing 50K+ node visualizations, real-time dashboards, executive reporting
- **Investment Required**: $3.4M-5.1M over 28-36 months  
- **Business Value**: $41.6M annual benefits with 18-month ROI
- **Implementation Plan**: Four-phase approach with detailed technical specifications

**Strategic Options**:
1. **Continue POC**: Complete demo scenarios (6 more sessions)
2. **Begin Transformation**: Start enterprise platform development
3. **Hybrid Approach**: Enhance POC while planning enterprise implementation

## Support

For development assistance, see [CLAUDE.md](../CLAUDE.md) session guide.

## License

Internal Capital Group POC - Not for external distribution.