#!/bin/bash

# Ubiquitous POC Quick Deployment Script
# Deploys complete demo environment on any macbook with one command
#
# Usage: ./quick-deploy.sh [--dev|--demo|--full]
#   --dev   : Development environment (minimal resources)
#   --demo  : Demo environment (optimized for presentations)  
#   --full  : Full environment (all features enabled)

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Deployment mode
DEPLOY_MODE="${1:-demo}"

print_banner() {
    echo -e "${BLUE}"
    echo "╔════════════════════════════════════════════════════════════════╗"
    echo "║                                                                ║"
    echo "║               🚀 UBIQUITOUS POC QUICK DEPLOY 🚀                ║"
    echo "║                                                                ║"
    echo "║        Enterprise Infrastructure Intelligence Platform         ║"
    echo "║                    Capital Group Demo                         ║"
    echo "║                                                                ║"
    echo "╚════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

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

check_system_requirements() {
    print_step "Checking system requirements..."
    
    local missing_reqs=0
    
    # Check macOS
    if [[ "$OSTYPE" != "darwin"* ]]; then
        print_error "This script is designed for macOS. Detected: $OSTYPE"
        exit 1
    fi
    
    # Check if Homebrew is installed
    if ! command -v brew &> /dev/null; then
        print_warning "Homebrew not found. Installing..."
        /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    else
        print_success "Homebrew installed"
    fi
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        print_warning "Docker not found. Installing Docker Desktop..."
        brew install --cask docker
        echo -e "${YELLOW}⚠️  Please start Docker Desktop manually and run this script again${NC}"
        exit 1
    else
        print_success "Docker installed"
    fi
    
    # Check if Docker is running
    if ! docker info &> /dev/null; then
        print_error "Docker is not running. Please start Docker Desktop and try again."
        exit 1
    else
        print_success "Docker is running"
    fi
    
    # Check Docker Compose version
    if ! docker compose version &> /dev/null; then
        print_error "Docker Compose v2 not available. Please update Docker Desktop."
        exit 1
    else
        print_success "Docker Compose v2 available"
    fi
    
    # Check available memory
    local memory_gb=$(system_profiler SPHardwareDataType | grep "Memory:" | awk '{print $2}')
    local memory_value=${memory_gb%% *}
    if [[ $memory_value -lt 16 ]]; then
        print_warning "Less than 16GB RAM detected ($memory_gb). Performance may be impacted."
    else
        print_success "Sufficient memory: $memory_gb"
    fi
    
    # Check available disk space
    local disk_space=$(df -h . | tail -1 | awk '{print $4}')
    print_success "Available disk space: $disk_space"
}

install_optional_tools() {
    print_step "Installing optional development tools..."
    
    # Install useful tools for demo management
    local tools_to_install=()
    
    if ! command -v jq &> /dev/null; then
        tools_to_install+=("jq")
    fi
    
    if ! command -v curl &> /dev/null; then
        tools_to_install+=("curl")
    fi
    
    if ! command -v git &> /dev/null; then
        tools_to_install+=("git")
    fi
    
    if [[ ${#tools_to_install[@]} -gt 0 ]]; then
        print_warning "Installing missing tools: ${tools_to_install[*]}"
        brew install "${tools_to_install[@]}"
    fi
    
    print_success "All development tools ready"
}

clone_or_update_repo() {
    print_step "Setting up Ubiquitous repository..."
    
    if [[ ! -d "ubiquitous" ]]; then
        print_warning "Cloning repository..."
        git clone https://github.com/cdameworth/ubiquitous.git
        cd ubiquitous
    else
        print_warning "Repository exists. Updating..."
        cd ubiquitous
        git pull origin main
    fi
    
    print_success "Repository ready"
}

setup_environment() {
    print_step "Setting up deployment environment..."
    
    cd ubiquitous-poc
    
    # Select deployment configuration
    case "$DEPLOY_MODE" in
        "dev")
            export COMPOSE_FILE="docker-compose.yml"
            print_success "Development mode selected (minimal resources)"
            ;;
        "demo")
            export COMPOSE_FILE="docker-compose.yml"
            print_success "Demo mode selected (presentation optimized)"
            ;;
        "full")
            export COMPOSE_FILE="docker-compose.prod.yml"
            print_success "Full mode selected (production-like)"
            ;;
        *)
            print_error "Invalid mode: $DEPLOY_MODE. Use --dev, --demo, or --full"
            exit 1
            ;;
    esac
}

deploy_infrastructure() {
    print_step "Deploying infrastructure containers..."
    
    # Stop any existing containers
    docker compose down --volumes --remove-orphans 2>/dev/null || true
    
    # Pull latest images and build
    print_warning "Building and starting containers..."
    docker compose up -d --build
    
    print_success "Infrastructure containers started"
}

initialize_databases() {
    print_step "Initializing databases with synthetic data..."
    
    # Wait for databases to be ready
    print_warning "Waiting for databases to initialize..."
    sleep 30
    
    # Check database health
    local max_attempts=12
    local attempt=0
    
    while [[ $attempt -lt $max_attempts ]]; do
        if docker compose exec -T backend python -c "
import psycopg2
import redis
from neo4j import GraphDatabase
try:
    # Test Neo4j
    driver = GraphDatabase.driver('bolt://neo4j:7687', auth=('neo4j', 'ubiquitous123'))
    driver.verify_connectivity()
    driver.close()
    
    # Test TimescaleDB
    conn = psycopg2.connect(host='timescaledb', database='ubiquitous_metrics', user='ubiquitous_admin', password='ubiquitous123')
    conn.close()
    
    # Test Redis
    r = redis.Redis(host='redis', port=6379, password='ubiquitous123')
    r.ping()
    
    print('All databases ready')
except Exception as e:
    print(f'Database not ready: {e}')
    exit(1)
" 2>/dev/null; then
            break
        fi
        
        attempt=$((attempt + 1))
        print_warning "Databases not ready yet... (attempt $attempt/$max_attempts)"
        sleep 10
    done
    
    if [[ $attempt -eq $max_attempts ]]; then
        print_error "Databases failed to initialize after $((max_attempts * 10)) seconds"
        exit 1
    fi
    
    # Initialize with synthetic data
    print_warning "Populating databases with synthetic data..."
    docker compose exec -T datagen python main.py
    
    print_success "Databases initialized with synthetic data"
}

verify_deployment() {
    print_step "Verifying deployment..."
    
    # Check container health
    local containers=("frontend" "backend" "neo4j" "timescaledb" "redis" "datagen" "nginx")
    for container in "${containers[@]}"; do
        if docker compose ps $container | grep -q "Up"; then
            print_success "$container container running"
        else
            print_error "$container container not running"
            docker compose logs $container | tail -10
            exit 1
        fi
    done
    
    # Test API health
    print_warning "Testing API endpoints..."
    sleep 10
    
    local max_attempts=6
    local attempt=0
    
    while [[ $attempt -lt $max_attempts ]]; do
        if curl -s http://localhost:8000/health | grep -q "healthy"; then
            print_success "Backend API is healthy"
            break
        fi
        attempt=$((attempt + 1))
        print_warning "API not ready yet... (attempt $attempt/$max_attempts)"
        sleep 5
    done
    
    if [[ $attempt -eq $max_attempts ]]; then
        print_error "Backend API health check failed"
        exit 1
    fi
    
    # Test frontend
    if curl -s http://localhost:3000 | grep -q "Ubiquitous"; then
        print_success "Frontend is accessible"
    else
        print_warning "Frontend may still be starting up"
    fi
}

show_access_info() {
    print_step "Deployment complete! 🎉"
    
    echo -e "\n${GREEN}╔══════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                    🎭 DEMO ENVIRONMENT READY 🎭                    ║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════════════════════════════╝${NC}"
    
    echo -e "\n${BLUE}📱 Application Access:${NC}"
    echo -e "   🌐 Frontend:      ${GREEN}http://localhost:3000${NC}"
    echo -e "   📊 API Docs:      ${GREEN}http://localhost:8000/api/docs${NC}"
    echo -e "   🔍 API Health:    ${GREEN}http://localhost:8000/health${NC}"
    
    echo -e "\n${BLUE}🗄️  Database Access:${NC}"
    echo -e "   📈 Neo4j:         ${GREEN}http://localhost:7474${NC} (neo4j/ubiquitous123)"
    echo -e "   ⏰ TimescaleDB:   ${GREEN}localhost:5432${NC} (ubiquitous_admin/ubiquitous123)"
    echo -e "   🔄 Redis:         ${GREEN}localhost:6379${NC} (password: ubiquitous123)"
    
    echo -e "\n${BLUE}🎬 Demo Features:${NC}"
    echo -e "   💰 Cost Spiral Crisis    (4 min demo)"
    echo -e "   🚀 EKS Scaling Crisis     (5 min demo)"  
    echo -e "   🗄️  Oracle Performance   (4 min demo)"
    echo -e "   📜 SQL Server Licensing   (3 min demo)"
    
    echo -e "\n${BLUE}💡 Quick Demo Commands:${NC}"
    echo -e "   ${YELLOW}# View logs${NC}"
    echo -e "   docker compose logs -f backend"
    echo -e "   "
    echo -e "   ${YELLOW}# Restart specific service${NC}"
    echo -e "   docker compose restart backend"
    echo -e "   "
    echo -e "   ${YELLOW}# Reset all data${NC}"
    echo -e "   docker compose down -v && ./quick-deploy.sh $DEPLOY_MODE"
    
    echo -e "\n${GREEN}🎯 Ready for presentation! Open http://localhost:3000 to start.${NC}\n"
}

show_troubleshooting() {
    echo -e "\n${YELLOW}🔧 Troubleshooting:${NC}"
    echo -e "   ${RED}Problem:${NC} Containers won't start"
    echo -e "   ${GREEN}Solution:${NC} Check Docker Desktop is running and has sufficient resources"
    echo -e "   ${BLUE}Command:${NC} docker compose logs"
    echo -e ""
    echo -e "   ${RED}Problem:${NC} Frontend shows errors"
    echo -e "   ${GREEN}Solution:${NC} Backend may still be starting up, wait 60 seconds"
    echo -e "   ${BLUE}Command:${NC} curl http://localhost:8000/health"
    echo -e ""
    echo -e "   ${RED}Problem:${NC} No data in dashboards"
    echo -e "   ${GREEN}Solution:${NC} Run data initialization manually"
    echo -e "   ${BLUE}Command:${NC} docker compose exec datagen python main.py"
    echo -e ""
    echo -e "   ${RED}Problem:${NC} Port conflicts"
    echo -e "   ${GREEN}Solution:${NC} Stop other services using ports 3000, 8000, 7474, 5432, 6379"
    echo -e "   ${BLUE}Command:${NC} lsof -ti:3000,8000,7474,5432,6379 | xargs kill -9"
}

cleanup_on_error() {
    print_error "Deployment failed. Cleaning up..."
    docker compose down --volumes --remove-orphans 2>/dev/null || true
    exit 1
}

main() {
    trap cleanup_on_error ERR
    
    print_banner
    echo -e "${BLUE}Mode: ${DEPLOY_MODE}${NC}\n"
    
    check_system_requirements
    install_optional_tools
    clone_or_update_repo
    setup_environment
    deploy_infrastructure
    initialize_databases
    verify_deployment
    show_access_info
    show_troubleshooting
}

# Handle different deployment modes
case "$DEPLOY_MODE" in
    "--dev"|"dev")
        DEPLOY_MODE="dev"
        ;;
    "--demo"|"demo")
        DEPLOY_MODE="demo"
        ;;
    "--full"|"full")
        DEPLOY_MODE="full"
        ;;
    "--help"|"help")
        echo "Ubiquitous POC Quick Deploy"
        echo ""
        echo "Usage: ./quick-deploy.sh [mode]"
        echo ""
        echo "Modes:"
        echo "  dev   - Development environment (minimal resources)"
        echo "  demo  - Demo environment (presentation optimized) [default]"
        echo "  full  - Full environment (all features enabled)"
        echo ""
        echo "Examples:"
        echo "  ./quick-deploy.sh"
        echo "  ./quick-deploy.sh --demo"
        echo "  ./quick-deploy.sh --full"
        exit 0
        ;;
esac

main "$@"