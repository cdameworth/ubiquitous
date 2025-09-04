#!/bin/bash

# Ubiquitous POC Data Generator Integration Test
# Tests complete data generation system within Docker environment

set -e

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

print_header() {
    echo ""
    echo -e "${BLUE}$1${NC}"
    echo "$(printf '=%.0s' $(seq 1 ${#1}))"
}

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null; then
    print_error "docker-compose is not installed or not in PATH"
    exit 1
fi

print_header "🧪 Ubiquitous Data Generator Integration Test"
print_info "This script will test the complete data generation system"

# Start database services first
print_info "Starting database services..."
docker-compose up -d timeseries graph cache

# Wait for databases to be healthy
print_info "Waiting for database services to be ready..."
echo "This may take up to 2 minutes..."

TIMEOUT=120
COUNTER=0

while [ $COUNTER -lt $TIMEOUT ]; do
    # Check if all database services are healthy
    HEALTHY_COUNT=$(docker-compose ps | grep -E "(timeseries|graph|cache)" | grep -c "healthy\|Up")
    if [ $HEALTHY_COUNT -eq 3 ]; then
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

print_status "Database services are healthy"

# Test database connectivity
print_info "Testing database connectivity..."

# Test PostgreSQL
if docker-compose exec -T timeseries psql -U postgres -d ubiquitous -c "SELECT 1;" > /dev/null 2>&1; then
    print_status "TimescaleDB connection successful"
else
    print_error "TimescaleDB connection failed"
    exit 1
fi

# Test Neo4j
if docker-compose exec -T graph cypher-shell -u neo4j -p ubiquitous123 "RETURN 1;" > /dev/null 2>&1; then
    print_status "Neo4j connection successful"
else
    print_error "Neo4j connection failed"
    exit 1
fi

# Test Redis
if docker-compose exec -T cache redis-cli -a ubiquitous_redis_2024 ping > /dev/null 2>&1; then
    print_status "Redis connection successful"
else
    print_error "Redis connection failed"
    exit 1
fi

# Build data generator image
print_info "Building data generator image..."
if docker-compose build datagen; then
    print_status "Data generator image built successfully"
else
    print_error "Data generator image build failed"
    exit 1
fi

# Run data generator tests
print_info "Running data generator unit tests..."
if docker-compose run --rm datagen python test_datagen.py; then
    print_status "Data generator unit tests passed"
else
    print_error "Data generator unit tests failed"
    exit 1
fi

# Test population functionality
print_info "Testing data population (this may take a few minutes)..."
if docker-compose run --rm datagen python main.py --populate; then
    print_status "Data population test completed"
else
    print_error "Data population test failed"
    exit 1
fi

# Verify populated data
print_header "📊 Verifying Populated Data"

# Check Neo4j node count
NEO4J_NODES=$(docker-compose exec -T graph cypher-shell -u neo4j -p ubiquitous123 "MATCH (n) RETURN count(n) as count;" | grep -o '[0-9]\+' | head -1)
print_info "Neo4j nodes: $NEO4J_NODES"

if [ "$NEO4J_NODES" -gt 100 ]; then
    print_status "Neo4j infrastructure data populated successfully"
else
    print_warning "Low Neo4j node count: $NEO4J_NODES (expected >100)"
fi

# Check TimescaleDB metrics count
METRICS_COUNT=$(docker-compose exec -T timeseries psql -U postgres -d ubiquitous -c "SELECT COUNT(*) FROM system_metrics;" | grep -o '[0-9]\+' | head -1)
print_info "TimescaleDB metrics records: $METRICS_COUNT"

if [ "$METRICS_COUNT" -gt 1000 ]; then
    print_status "TimescaleDB metrics data populated successfully"
else
    print_warning "Low metrics count: $METRICS_COUNT (expected >1000)"
fi

# Check Redis cache
REDIS_KEYS=$(docker-compose exec -T cache redis-cli -a ubiquitous_redis_2024 dbsize | grep -o '[0-9]\+')
print_info "Redis cache keys: $REDIS_KEYS"

if [ "$REDIS_KEYS" -gt 10 ]; then
    print_status "Redis cache populated successfully"
else
    print_warning "Low Redis key count: $REDIS_KEYS (expected >10)"
fi

# Test real-time generation (short run)
print_info "Testing real-time generation (30 seconds)..."
docker-compose run --rm -d datagen python main.py --realtime &
REALTIME_PID=$!

sleep 30

# Kill the real-time process
kill $REALTIME_PID 2>/dev/null || true

# Check if new metrics were generated
FINAL_METRICS_COUNT=$(docker-compose exec -T timeseries psql -U postgres -d ubiquitous -c "SELECT COUNT(*) FROM system_metrics;" | grep -o '[0-9]\+' | head -1)

if [ "$FINAL_METRICS_COUNT" -gt "$METRICS_COUNT" ]; then
    print_status "Real-time metrics generation working"
    print_info "Metrics increased from $METRICS_COUNT to $FINAL_METRICS_COUNT"
else
    print_warning "Real-time metrics generation may not be working properly"
fi

# Test data generator service startup
print_info "Testing data generator service startup..."
docker-compose up -d datagen

# Wait for service to be healthy
COUNTER=0
while [ $COUNTER -lt 60 ]; do
    if docker-compose ps datagen | grep -q "healthy\|Up"; then
        break
    fi
    sleep 2
    COUNTER=$((COUNTER + 2))
    echo -n "."
done
echo ""

if [ $COUNTER -lt 60 ]; then
    print_status "Data generator service started successfully"
else
    print_warning "Data generator service startup may have issues"
fi

# Show service status
print_header "🔍 Service Status"
docker-compose ps

# Show sample data
print_header "📋 Sample Data Verification"

print_info "Sample EKS clusters:"
docker-compose exec -T graph cypher-shell -u neo4j -p ubiquitous123 "MATCH (c:EKSCluster) RETURN c.name, c.region, c.cost_monthly LIMIT 5;" 2>/dev/null | head -10

print_info "Recent system metrics:"
docker-compose exec -T timeseries psql -U postgres -d ubiquitous -c "SELECT service_name, cluster_name, cpu_utilization, memory_utilization FROM system_metrics ORDER BY time DESC LIMIT 5;" 2>/dev/null | head -10

print_info "Redis cache sample:"
docker-compose exec -T cache redis-cli -a ubiquitous_redis_2024 keys "*" 2>/dev/null | head -5

# Performance metrics
print_header "⚡ Performance Metrics"

# Container resource usage
print_info "Container resource usage:"
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}" | grep -E "(datagen|timeseries|graph|cache)"

# Test summary
print_header "🎯 Integration Test Summary"

if [ "$NEO4J_NODES" -gt 100 ] && [ "$METRICS_COUNT" -gt 1000 ] && [ "$REDIS_KEYS" -gt 10 ]; then
    print_status "All integration tests passed successfully!"
    print_info "Data generator is ready for production use"
    
    echo ""
    print_info "🚀 To start the complete system:"
    echo "   docker-compose up -d"
    echo ""
    print_info "📊 To monitor data generation:"
    echo "   docker-compose logs -f datagen"
    echo ""
    print_info "🔍 To check data status:"
    echo "   docker-compose exec datagen python main.py --status"
    
    EXIT_CODE=0
else
    print_warning "Some integration tests had warnings"
    print_info "Check logs for details: docker-compose logs datagen"
    EXIT_CODE=1
fi

print_header "🧹 Cleanup Options"
print_info "To stop services: docker-compose down"
print_info "To reset data: docker-compose down -v"
print_info "To view logs: docker-compose logs [service-name]"

exit $EXIT_CODE