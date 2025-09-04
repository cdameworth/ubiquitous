from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from typing import List, Dict, Any, Optional
import uvicorn
import asyncio
import json
from datetime import datetime, timedelta
import random
import uuid
from contextlib import asynccontextmanager

# Database imports
from app.database import (
    initialize_databases, 
    cleanup_databases,
    check_timescale_health,
    check_neo4j_health, 
    check_redis_health
)

# Import all routers
from app.routers import (
    network_analysis,
    observability,
    finops,
    security,
    outage_context,
    greenfield,
    arb_support,
    dr_guidance,
    executive_reporting,
    infrastructure_graph,
    demo_scenarios,
    performance,
    system
)

# Application lifespan management
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    try:
        db_status = await initialize_databases()
        print("🚀 Database initialization completed:")
        print(f"  - Overall Status: {db_status['overall_status']}")
        print(f"  - TimescaleDB: {db_status['timescale']['status']}")
        print(f"  - Neo4j: {db_status['neo4j']['status']} ({db_status['neo4j'].get('node_count', 0)} nodes)")
        print(f"  - Redis: {db_status['redis']['status']}")
    except Exception as e:
        print(f"❌ Database initialization failed: {e}")
        # Continue anyway for development
    
    yield
    
    # Shutdown
    await cleanup_databases()
    print("📦 Database connections closed")

app = FastAPI(
    title="Ubiquitous API",
    description="Capital Group Infrastructure Intelligence Platform API",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except:
                pass

manager = ConnectionManager()

# Include all routers
app.include_router(network_analysis.router)
app.include_router(observability.router)
app.include_router(finops.router)
app.include_router(security.router)
app.include_router(outage_context.router)
app.include_router(greenfield.router)
app.include_router(arb_support.router)
app.include_router(dr_guidance.router)
app.include_router(executive_reporting.router)
app.include_router(infrastructure_graph.router)
app.include_router(demo_scenarios.router)
app.include_router(performance.router)
app.include_router(system.router)

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

@app.get("/api/health")
async def api_health_check():
    # Check all database health
    timescale_health = await check_timescale_health()
    neo4j_health = await check_neo4j_health()
    redis_health = await check_redis_health()
    
    overall_status = "healthy" if all(
        h["status"] == "healthy" 
        for h in [timescale_health, neo4j_health, redis_health]
    ) else "degraded"
    
    return {
        "status": overall_status,
        "service": "ubiquitous-api",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat(),
        "dependencies": {
            "timescaledb": {
                "status": timescale_health["status"],
                "version": timescale_health.get("version", "unknown"),
                "pool_size": timescale_health.get("connection_pool_size", 0)
            },
            "neo4j": {
                "status": neo4j_health["status"],
                "version": neo4j_health.get("version", "unknown"),
                "nodes": neo4j_health.get("node_count", 0),
                "relationships": neo4j_health.get("relationship_count", 0)
            },
            "redis": {
                "status": redis_health["status"],
                "version": redis_health.get("version", "unknown"),
                "memory": redis_health.get("used_memory", "unknown")
            }
        }
    }

# Root endpoint
@app.get("/")
async def root():
    return {"message": "Ubiquitous API - Capital Group Infrastructure Intelligence Platform"}

# WebSocket endpoint for real-time updates
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Wait for incoming messages or send periodic updates
            try:
                # Check for incoming messages with timeout
                message = await asyncio.wait_for(websocket.receive_text(), timeout=5.0)
                
                # Handle incoming WebSocket messages
                try:
                    message_data = json.loads(message)
                    await handle_websocket_message(websocket, message_data)
                except json.JSONDecodeError:
                    await websocket.send_text(json.dumps({
                        "type": "error",
                        "message": "Invalid JSON message format",
                        "timestamp": datetime.utcnow().isoformat()
                    }))
                    
            except asyncio.TimeoutError:
                # No message received, send periodic system update
                update = {
                    "type": "system_update",
                    "timestamp": datetime.utcnow().isoformat(),
                    "data": {
                        "active_nodes": random.randint(15000, 15500),
                        "events_per_second": random.randint(950000, 1050000),
                        "cpu_utilization": round(random.uniform(65, 85), 2),
                        "memory_usage": round(random.uniform(70, 90), 2)
                    }
                }
                await websocket.send_text(json.dumps(update))
                
    except WebSocketDisconnect:
        manager.disconnect(websocket)

async def handle_websocket_message(websocket: WebSocket, message_data: Dict[str, Any]):
    """Handle incoming WebSocket messages"""
    try:
        message_type = message_data.get("type")
        
        if message_type in ["start_scenario", "pause_scenario", "resume_scenario", "stop_scenario", "jump_to_step"]:
            # Import here to avoid circular imports
            from app.routers.demo_scenarios import handle_scenario_websocket_message
            await handle_scenario_websocket_message(websocket, message_data)
            
        elif message_type == "ping":
            # Respond to ping with pong
            await websocket.send_text(json.dumps({
                "type": "pong",
                "timestamp": datetime.utcnow().isoformat()
            }))
            
        elif message_type == "subscribe":
            # Handle event subscriptions
            event_type = message_data.get("event")
            await websocket.send_text(json.dumps({
                "type": "subscription_ack",
                "event": event_type,
                "timestamp": datetime.utcnow().isoformat()
            }))
            
        else:
            # Unknown message type
            await websocket.send_text(json.dumps({
                "type": "error",
                "message": f"Unknown message type: {message_type}",
                "timestamp": datetime.utcnow().isoformat()
            }))
            
    except Exception as e:
        await websocket.send_text(json.dumps({
            "type": "error", 
            "message": f"Error processing message: {str(e)}",
            "timestamp": datetime.utcnow().isoformat()
        }))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)