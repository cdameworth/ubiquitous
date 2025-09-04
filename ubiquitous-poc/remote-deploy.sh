#!/bin/bash

# Remote Deployment Script for Ubiquitous Demo
# Single command to deploy on any macbook from GitHub
#
# Usage: curl -sSL https://raw.githubusercontent.com/cdameworth/ubiquitous/main/ubiquitous-poc/remote-deploy.sh | bash

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

print_banner() {
    echo -e "${BLUE}"
    echo "╔════════════════════════════════════════════════════════════════╗"
    echo "║                                                                ║"
    echo "║           🌐 UBIQUITOUS REMOTE DEPLOYMENT 🌐                   ║"
    echo "║                                                                ║"
    echo "║        Deploy from GitHub to any macbook instantly            ║"
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

check_prerequisites() {
    print_step "Checking macbook prerequisites..."
    
    # Check macOS
    if [[ "$OSTYPE" != "darwin"* ]]; then
        print_error "This script requires macOS. Detected: $OSTYPE"
        exit 1
    fi
    
    # Check if we have curl
    if ! command -v curl &> /dev/null; then
        print_error "curl is required but not installed"
        exit 1
    fi
    
    # Check if we have git
    if ! command -v git &> /dev/null; then
        print_warning "git not found. Installing via Xcode Command Line Tools..."
        xcode-select --install
        echo "Please run this script again after Xcode Command Line Tools installation completes."
        exit 1
    fi
    
    print_success "Prerequisites check passed"
}

install_homebrew() {
    if ! command -v brew &> /dev/null; then
        print_step "Installing Homebrew..."
        /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
        
        # Add Homebrew to PATH for Apple Silicon Macs
        if [[ -f "/opt/homebrew/bin/brew" ]]; then
            echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
            eval "$(/opt/homebrew/bin/brew shellenv)"
        fi
        
        print_success "Homebrew installed"
    else
        print_success "Homebrew already installed"
    fi
}

install_docker() {
    print_step "Setting up Docker Desktop..."
    
    if ! command -v docker &> /dev/null; then
        print_warning "Installing Docker Desktop..."
        brew install --cask docker
        
        print_warning "Starting Docker Desktop..."
        open /Applications/Docker.app
        
        # Wait for Docker to start
        echo "Waiting for Docker Desktop to start..."
        local attempt=0
        local max_attempts=30
        
        while ! docker info &> /dev/null && [[ $attempt -lt $max_attempts ]]; do
            sleep 2
            attempt=$((attempt + 1))
            echo -n "."
        done
        echo ""
        
        if [[ $attempt -eq $max_attempts ]]; then
            print_error "Docker Desktop failed to start. Please start it manually and run:"
            echo "curl -sSL https://raw.githubusercontent.com/cdameworth/ubiquitous/main/ubiquitous-poc/remote-deploy.sh | bash"
            exit 1
        fi
        
        print_success "Docker Desktop started"
    else
        # Check if Docker is running
        if ! docker info &> /dev/null; then
            print_warning "Starting Docker Desktop..."
            open /Applications/Docker.app
            
            local attempt=0
            local max_attempts=30
            
            while ! docker info &> /dev/null && [[ $attempt -lt $max_attempts ]]; do
                sleep 2
                attempt=$((attempt + 1))
                echo -n "."
            done
            echo ""
            
            if [[ $attempt -eq $max_attempts ]]; then
                print_error "Please start Docker Desktop manually and try again"
                exit 1
            fi
        fi
        
        print_success "Docker is running"
    fi
}

clone_and_deploy() {
    print_step "Cloning Ubiquitous repository..."
    
    local deploy_dir="$HOME/Desktop/ubiquitous-demo"
    
    # Remove existing directory if it exists
    if [[ -d "$deploy_dir" ]]; then
        print_warning "Removing existing deployment directory..."
        rm -rf "$deploy_dir"
    fi
    
    # Clone repository
    git clone https://github.com/cdameworth/ubiquitous.git "$deploy_dir"
    
    cd "$deploy_dir/ubiquitous-poc"
    
    print_success "Repository cloned to $deploy_dir"
}

deploy_ubiquitous() {
    print_step "Deploying Ubiquitous platform..."
    
    # Make scripts executable
    chmod +x scripts/*.sh
    chmod +x quick-deploy.sh
    
    # Run the quick deployment
    ./quick-deploy.sh --demo
}

create_desktop_launcher() {
    print_step "Creating desktop shortcuts..."
    
    local deploy_dir="$HOME/Desktop/ubiquitous-demo"
    
    # Create launcher script
    cat > "$HOME/Desktop/Start Ubiquitous Demo.command" << LAUNCHER_EOF
#!/bin/bash
cd "$deploy_dir/ubiquitous-poc"
docker compose up -d
sleep 15
open http://localhost:3000
echo "Ubiquitous Demo is starting..."
echo "Frontend: http://localhost:3000"
echo "API Docs: http://localhost:8000/api/docs"
LAUNCHER_EOF
    
    chmod +x "$HOME/Desktop/Start Ubiquitous Demo.command"
    
    # Create stop script
    cat > "$HOME/Desktop/Stop Ubiquitous Demo.command" << STOP_EOF
#!/bin/bash
cd "$deploy_dir/ubiquitous-poc"
docker compose down
echo "Ubiquitous Demo stopped."
STOP_EOF
    
    chmod +x "$HOME/Desktop/Stop Ubiquitous Demo.command"
    
    # Create reset script
    cat > "$HOME/Desktop/Reset Ubiquitous Demo.command" << RESET_EOF
#!/bin/bash
cd "$deploy_dir/ubiquitous-poc"
docker compose down -v
docker compose up -d
sleep 30
docker compose exec -T datagen python main.py
sleep 5
open http://localhost:3000
echo "Ubiquitous Demo reset and restarted with fresh data."
RESET_EOF
    
    chmod +x "$HOME/Desktop/Reset Ubiquitous Demo.command"
    
    print_success "Desktop shortcuts created"
    echo -e "   💫 Start Ubiquitous Demo.command"
    echo -e "   🛑 Stop Ubiquitous Demo.command"  
    echo -e "   🔄 Reset Ubiquitous Demo.command"
}

show_completion_info() {
    echo -e "\n${GREEN}╔══════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                    🎉 DEPLOYMENT COMPLETE! 🎉                     ║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════════════════════════════╝${NC}"
    
    echo -e "\n${BLUE}🌐 Access URLs:${NC}"
    echo -e "   Frontend:      ${GREEN}http://localhost:3000${NC}"
    echo -e "   API Docs:      ${GREEN}http://localhost:8000/api/docs${NC}"
    echo -e "   Health Check:  ${GREEN}http://localhost:8000/health${NC}"
    
    echo -e "\n${BLUE}🎬 Demo Features Ready:${NC}"
    echo -e "   💰 Cost Spiral Crisis"
    echo -e "   🚀 EKS Scaling Crisis" 
    echo -e "   🗄️  Oracle Performance Crisis"
    echo -e "   📜 SQL Server Licensing Crisis"
    
    echo -e "\n${BLUE}🖥️  Desktop Controls:${NC}"
    echo -e "   Double-click ${GREEN}'Start Ubiquitous Demo.command'${NC} to start"
    echo -e "   Double-click ${GREEN}'Stop Ubiquitous Demo.command'${NC} to stop"
    echo -e "   Double-click ${GREEN}'Reset Ubiquitous Demo.command'${NC} to reset data"
    
    echo -e "\n${PURPLE}🎯 Opening demo in your default browser...${NC}"
    sleep 3
    open http://localhost:3000
}

main() {
    print_banner
    check_prerequisites
    install_homebrew
    install_docker
    clone_and_deploy
    deploy_ubiquitous
    create_desktop_launcher
    show_completion_info
}

main "$@"