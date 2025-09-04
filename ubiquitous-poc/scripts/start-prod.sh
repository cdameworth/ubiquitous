#!/bin/bash

echo "🏭 Starting Ubiquitous POC Production Environment..."

# Check Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop."
    exit 1
fi

# Start services with production configuration
echo "📦 Starting containers with production configuration..."
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Wait for services to be ready
echo "⏳ Waiting for services to initialize..."
sleep 60

# Check service health
echo "🏥 Checking service health..."
docker-compose ps

echo ""
echo "🎉 Production environment ready!"
echo ""
echo "📱 Access points:"
echo "   Application: http://localhost"
echo "   API Docs:    http://localhost/api/docs"
echo ""
echo "📋 Useful commands:"
echo "   View logs:    docker-compose logs -f"
echo "   Stop:         docker-compose down"
echo "   Scale API:    docker-compose up -d --scale api=3"
echo ""