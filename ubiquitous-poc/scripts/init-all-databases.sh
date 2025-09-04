#!/bin/bash

# Ubiquitous POC Database Initialization Script
# Initializes Neo4j schema, loads TimescaleDB sample data, and tests connections

set -e  # Exit on any error

echo "🚀 Initializing Ubiquitous POC Databases"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null; then
    print_error "docker-compose is not installed or not in PATH"
    exit 1
fi

# Start the database services
print_info "Starting database containers..."
docker-compose up -d timeseries graph cache

# Wait for services to be healthy
print_info "Waiting for database services to be ready..."
echo "This may take up to 2 minutes for first-time initialization..."

# Wait for services with timeout
TIMEOUT=120
COUNTER=0

while [ $COUNTER -lt $TIMEOUT ]; do
    if docker-compose ps | grep -E "(timeseries|graph|cache)" | grep -q "healthy\|Up"; then
        break
    fi
    sleep 2
    COUNTER=$((COUNTER + 2))
    echo -n "."
done
echo ""

if [ $COUNTER -ge $TIMEOUT ]; then
    print_error "Timeout waiting for database services to be ready"
    docker-compose logs timeseries graph cache
    exit 1
fi

print_status "Database containers are running"

# Initialize Neo4j data
print_info "Initializing Neo4j AWS infrastructure schema..."
sleep 10  # Give Neo4j extra time to fully start

if docker-compose exec graph cypher-shell -u neo4j -p ubiquitous123 -f /var/lib/neo4j/import/init.cypher; then
    print_status "Neo4j schema and sample data loaded"
else
    print_warning "Neo4j initialization had issues, but continuing..."
fi

# Check TimescaleDB schema (should auto-initialize from init.sql)
print_info "Verifying TimescaleDB schema initialization..."

if docker-compose exec timeseries psql -U postgres -d ubiquitous -c "\dt" > /dev/null; then
    print_status "TimescaleDB schema initialized"
else
    print_warning "TimescaleDB schema verification had issues, but continuing..."
fi

# Populate some sample data using the data generator
print_info "Starting data generator to populate sample data..."

if docker-compose up -d datagen; then
    print_status "Data generator started"
    sleep 10  # Give datagen time to start
    # Run the data generator to create initial sample data
    if docker-compose exec datagen python main.py --populate; then
        print_status "Sample data populated successfully"
    else
        print_warning "Sample data population had issues, but continuing..."
    fi
else
    print_warning "Data generator startup had issues, but continuing..."
fi

# Test database connections
print_info "Testing database connectivity..."

# Test Neo4j
if docker-compose exec graph cypher-shell -u neo4j -p ubiquitous123 "RETURN 'Neo4j connected' as status;" > /dev/null; then
    print_status "Neo4j connection successful"
else
    print_error "Neo4j connection failed"
fi

# Test TimescaleDB
if docker-compose exec timeseries psql -U postgres -d ubiquitous -c "SELECT 'TimescaleDB connected' as status;" > /dev/null; then
    print_status "TimescaleDB connection successful"
else
    print_error "TimescaleDB connection failed"
fi

# Test Redis
if docker-compose exec cache redis-cli ping > /dev/null; then
    print_status "Redis connection successful"
else
    print_error "Redis connection failed"
fi

# Display connection information
echo ""
echo "🎯 Database Connection Information:"
echo "=================================="
echo "TimescaleDB (PostgreSQL):"
echo "  Host: localhost:5432"
echo "  Database: ubiquitous"
echo "  Username: postgres"
echo "  Password: ubiquitous123"
echo ""
echo "Neo4j:"
echo "  Browser: http://localhost:7474"
echo "  Bolt: bolt://localhost:7687"
echo "  Username: neo4j"
echo "  Password: ubiquitous123"
echo ""
echo "Redis:"
echo "  Host: localhost:6379"
echo "  Password: ubiquitous_redis_2024"
echo ""

# Show sample queries
echo "📊 Sample Queries to Test:"
echo "========================="
echo ""
echo "TimescaleDB - Recent System Metrics:"
echo "SELECT service_name, cluster_name, cpu_utilization, memory_utilization"
echo "FROM system_metrics WHERE time >= NOW() - INTERVAL '1 hour'"
echo "ORDER BY time DESC LIMIT 10;"
echo ""
echo "Neo4j - EKS Clusters with Services:"
echo "MATCH (c:EKSCluster)<-[:DEPLOYED_ON]-(s:Service)"
echo "RETURN c.name, c.region, c.cost_monthly, collect(s.name) as services;"
echo ""
echo "Redis - Check Cached Data:"
echo "KEYS *"
echo ""

print_status "Database initialization complete!"
print_info "You can now start the full application with: docker-compose up"

exit 0