#!/bin/bash

echo "🚀 Starting Ubiquitous POC Development Environment..."

# Check Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop."
    exit 1
fi

# Start services
echo "📦 Starting containers..."
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to initialize..."
sleep 30

# Check service health
echo "🏥 Checking service health..."
docker-compose ps

# Initialize data if needed
echo "📊 Checking if data initialization is needed..."
if docker-compose exec -T datagen python -c "import os; exit(0 if os.path.exists('/app/.initialized') else 1)" 2>/dev/null; then
    echo "✅ Data already initialized"
else
    echo "🔄 Initializing synthetic data (this may take a few minutes)..."
    docker-compose exec datagen python scripts/init_all_data.py
fi

echo ""
echo "🎉 Development environment ready!"
echo ""
echo "📱 Access points:"
echo "   Frontend:  http://localhost:3000"
echo "   API Docs:  http://localhost:8000/docs"
echo "   Neo4j:     http://localhost:7474 (neo4j/ubiquitous123)"
echo "   Postgres:  localhost:5432 (postgres/ubiquitous123)"
echo ""
echo "📋 Useful commands:"
echo "   View logs:    docker-compose logs -f"
echo "   Stop:         docker-compose down"
echo "   Reset data:   docker-compose down -v && ./scripts/start-dev.sh"
echo ""