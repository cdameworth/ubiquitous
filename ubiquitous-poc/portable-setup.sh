#!/bin/bash

# Portable Setup Script for Ubiquitous Demo
# Creates a portable deployment package for any macbook
#
# Usage: ./portable-setup.sh [create|deploy]
#   create - Creates portable deployment package
#   deploy - Deploys from portable package

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PACKAGE_NAME="ubiquitous-demo-$(date +%Y%m%d-%H%M%S)"

print_step() {
    echo -e "\n${PURPLE}▶ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

create_portable_package() {
    print_step "Creating portable deployment package..."
    
    local package_dir="/tmp/$PACKAGE_NAME"
    mkdir -p "$package_dir"
    
    # Copy essential files (excluding large binaries and node_modules)
    print_warning "Copying project files..."
    
    rsync -av --exclude='node_modules' \
             --exclude='.terraform' \
             --exclude='__pycache__' \
             --exclude='*.pyc' \
             --exclude='.DS_Store' \
             --exclude='dist' \
             --exclude='build' \
             --exclude='*.log' \
             "$SCRIPT_DIR/" "$package_dir/"
    
    # Create Docker images export
    print_warning "Exporting Docker images..."
    
    # Build images first
    docker compose -f docker-compose.yml build
    
    # Export built images
    docker save \
        ubiquitous-poc-frontend:latest \
        ubiquitous-poc-backend:latest \
        ubiquitous-poc-datagen:latest \
        nginx:alpine \
        neo4j:5.13-community \
        timescale/timescaledb:latest-pg15 \
        redis:7-alpine \
        | gzip > "$package_dir/ubiquitous-images.tar.gz"
    
    # Create deployment script
    cat > "$package_dir/deploy.sh" << 'DEPLOY_EOF'
#!/bin/bash

# Ubiquitous Portable Deployment Script
set -euo pipefail

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

print_step() {
    echo -e "\n${PURPLE}▶ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

echo -e "${BLUE}"
echo "╔═══════════════════════════════════════════════════╗"
echo "║          🚀 UBIQUITOUS PORTABLE DEPLOY 🚀          ║"
echo "║                                                   ║"
echo "║     Infrastructure Intelligence Platform          ║"
echo "║           Standalone Deployment                   ║"
echo "╚═══════════════════════════════════════════════════╝"
echo -e "${NC}"

print_step "Loading Docker images..."
if [[ -f "ubiquitous-images.tar.gz" ]]; then
    gunzip -c ubiquitous-images.tar.gz | docker load
    print_success "Docker images loaded"
else
    print_warning "No image archive found. Will pull from registry."
fi

print_step "Starting Ubiquitous platform..."
docker compose up -d

print_step "Waiting for services to be ready..."
sleep 30

print_step "Initializing synthetic data..."
docker compose exec -T datagen python main.py

print_success "Deployment complete!"

echo -e "\n${GREEN}🎯 Access Information:${NC}"
echo -e "   Frontend: ${GREEN}http://localhost:3000${NC}"
echo -e "   API:      ${GREEN}http://localhost:8000/api/docs${NC}"
echo -e "   Health:   ${GREEN}http://localhost:8000/health${NC}"

echo -e "\n${BLUE}💡 Demo ready! Open http://localhost:3000 to start.${NC}"
DEPLOY_EOF
    
    chmod +x "$package_dir/deploy.sh"
    
    # Create requirements file
    cat > "$package_dir/REQUIREMENTS.md" << 'REQ_EOF'
# Ubiquitous Demo Requirements

## System Requirements

### Hardware
- **RAM**: 16GB minimum, 32GB recommended
- **Storage**: 20GB available space
- **CPU**: 4 cores minimum, 8 cores recommended
- **Network**: Internet connection for initial setup

### Software
- **macOS**: 10.15 (Catalina) or later
- **Docker Desktop**: Latest version
- **Available Ports**: 3000, 8000, 7474, 5432, 6379, 80

## Quick Start

1. **Extract the package**: 
   ```bash
   unzip ubiquitous-demo-package.zip
   cd ubiquitous-demo-*/
   ```

2. **Run deployment**:
   ```bash
   ./deploy.sh
   ```

3. **Access the demo**:
   - Open http://localhost:3000
   - API documentation: http://localhost:8000/api/docs

## Troubleshooting

### Port Conflicts
```bash
# Find processes using required ports
lsof -ti:3000,8000,7474,5432,6379

# Kill conflicting processes
lsof -ti:3000,8000,7474,5432,6379 | xargs kill -9
```

### Container Issues
```bash
# View logs
docker compose logs -f [service-name]

# Restart services
docker compose restart

# Full reset
docker compose down -v && ./deploy.sh
```

### Performance Issues
- Ensure Docker Desktop has at least 8GB RAM allocated
- Close unnecessary applications
- Check Activity Monitor for high CPU usage
```
REQ_EOF
    
    # Create the final package
    print_warning "Creating deployment package..."
    
    local final_package="/tmp/ubiquitous-demo-package.zip"
    cd /tmp
    zip -r "$final_package" "$PACKAGE_NAME/"
    
    # Move to user's desktop for easy access
    local desktop_package="$HOME/Desktop/ubiquitous-demo-package.zip"
    mv "$final_package" "$desktop_package"
    
    print_success "Portable package created: $desktop_package"
    
    # Calculate package size
    local package_size=$(du -h "$desktop_package" | cut -f1)
    echo -e "\n${BLUE}📦 Package Information:${NC}"
    echo -e "   📄 File: $desktop_package"
    echo -e "   📊 Size: $package_size"
    echo -e "   🎯 Contains: Complete demo environment with synthetic data"
    
    # Cleanup temp directory
    rm -rf "$package_dir"
}

deploy_from_package() {
    print_step "Deploying from portable package..."
    
    # Look for package in current directory or Desktop
    local package_path=""
    if [[ -f "ubiquitous-demo-package.zip" ]]; then
        package_path="ubiquitous-demo-package.zip"
    elif [[ -f "$HOME/Desktop/ubiquitous-demo-package.zip" ]]; then
        package_path="$HOME/Desktop/ubiquitous-demo-package.zip"
    else
        print_error "No portable package found. Run './portable-setup.sh create' first."
        exit 1
    fi
    
    print_warning "Extracting package: $package_path"
    
    # Extract to temporary location
    local temp_dir="/tmp/ubiquitous-deploy-$$"
    mkdir -p "$temp_dir"
    unzip -q "$package_path" -d "$temp_dir"
    
    # Find the extracted directory
    local extracted_dir=$(find "$temp_dir" -name "ubiquitous-demo-*" -type d | head -1)
    
    if [[ -z "$extracted_dir" ]]; then
        print_error "Failed to find extracted demo directory"
        exit 1
    fi
    
    # Run the deployment
    cd "$extracted_dir"
    chmod +x deploy.sh
    ./deploy.sh
    
    # Cleanup
    rm -rf "$temp_dir"
    
    print_success "Portable deployment complete!"
}

show_usage() {
    echo "Ubiquitous Portable Setup"
    echo ""
    echo "Usage: ./portable-setup.sh [command]"
    echo ""
    echo "Commands:"
    echo "  create  - Create portable deployment package"
    echo "  deploy  - Deploy from existing package"
    echo "  help    - Show this help message"
    echo ""
    echo "Examples:"
    echo "  ./portable-setup.sh create"
    echo "  ./portable-setup.sh deploy"
}

case "${1:-help}" in
    "create")
        create_portable_package
        ;;
    "deploy")
        deploy_from_package
        ;;
    "help"|"--help"|*)
        show_usage
        ;;
esac