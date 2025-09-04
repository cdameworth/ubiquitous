"""
Database connection utilities for Ubiquitous POC
Handles connections to Neo4j, TimescaleDB, and Redis
"""

import asyncio
import asyncpg
import redis
from neo4j import GraphDatabase
from typing import Optional, Dict, Any, List
import os
from datetime import datetime, timedelta
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Database connection configurations
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:ubiquitous123@localhost:5432/ubiquitous")
NEO4J_URL = os.getenv("NEO4J_URL", "bolt://neo4j:ubiquitous123@localhost:7687")
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")

class DatabaseManager:
    """Manages connections to all databases with enhanced pooling and monitoring"""
    
    def __init__(self):
        self.pg_pool: Optional[asyncpg.Pool] = None
        self.neo4j_driver = None
        self.redis_client = None
        self._initialized = False
        self._connection_stats = {
            "pg_connections_created": 0,
            "pg_connections_failed": 0,
            "neo4j_sessions_created": 0,
            "neo4j_sessions_failed": 0,
            "redis_operations": 0,
            "redis_operations_failed": 0
        }
        self._last_health_check = None
    
    async def _setup_pg_connection(self, connection):
        """Setup function for each PostgreSQL connection"""
        try:
            # Set connection-specific parameters for better performance
            await connection.execute("SET statement_timeout = '30s'")
            await connection.execute("SET lock_timeout = '10s'")
            await connection.execute("SET idle_in_transaction_session_timeout = '60s'")
            # Enable TimescaleDB optimizations
            await connection.execute("SET timescaledb.max_background_workers = 4")
        except Exception as e:
            logger.warning(f"Failed to setup PostgreSQL connection: {e}")
    
    def get_connection_stats(self) -> Dict[str, Any]:
        """Get connection statistics for monitoring"""
        stats = self._connection_stats.copy()
        if self.pg_pool:
            stats.update({
                "pg_pool_size": self.pg_pool.get_size(),
                "pg_pool_min_size": self.pg_pool.get_min_size(),
                "pg_pool_max_size": self.pg_pool.get_max_size(),
                "pg_active_connections": self.pg_pool.get_size() - len(self.pg_pool._holders) if hasattr(self.pg_pool, '_holders') else 0
            })
        return stats
    
    async def initialize(self):
        """Initialize all database connections"""
        if self._initialized:
            return
            
        try:
            # Initialize PostgreSQL/TimescaleDB connection pool with enhanced configuration
            self.pg_pool = await asyncpg.create_pool(
                DATABASE_URL,
                min_size=5,  # Increased minimum connections
                max_size=20,  # Increased maximum connections
                command_timeout=30,  # Reduced timeout for faster failure detection
                server_settings={
                    'application_name': 'ubiquitous_api',
                    'tcp_keepalives_idle': '600',
                    'tcp_keepalives_interval': '30',
                    'tcp_keepalives_count': '3'
                },
                max_queries=50000,  # Maximum queries per connection
                max_inactive_connection_lifetime=300,  # 5 minutes
                setup=self._setup_pg_connection
            )
            self._connection_stats["pg_connections_created"] += self.pg_pool.get_size()
            logger.info("✅ TimescaleDB connection pool initialized")
            
            # Initialize Neo4j driver with enhanced configuration
            # Parse NEO4J_URL: bolt://neo4j:ubiquitous123@graph:7687
            if "@" in NEO4J_URL:
                # Split the URL to extract host and credentials
                protocol_and_auth, host_and_port = NEO4J_URL.split("@")
                protocol, auth_part = protocol_and_auth.split("//")
                username, password = auth_part.split(":")
                uri = f"{protocol}//{host_and_port}"
            else:
                # Fallback if URL format is different
                uri = NEO4J_URL
                username, password = "neo4j", "ubiquitous123"
            
            self.neo4j_driver = GraphDatabase.driver(
                uri,
                auth=(username, password),
                max_connection_pool_size=15,
                connection_acquisition_timeout=30,
                max_transaction_retry_time=15,
                initial_retry_delay=1,
                retry_delay_multiplier=2.0,
                retry_delay_jitter_factor=0.2
            )
            # Test Neo4j connection
            with self.neo4j_driver.session() as session:
                session.run("RETURN 1")
            logger.info("✅ Neo4j connection established")
            
            # Initialize Redis connection
            redis_url = REDIS_URL
            if "redis://" in redis_url and "@" not in redis_url:
                redis_url = redis_url.replace("redis://", "redis://:ubiquitous_redis_2024@")
            
            self.redis_client = redis.from_url(
                redis_url,
                decode_responses=True,
                socket_connect_timeout=5,
                socket_timeout=5
            )
            # Test Redis connection
            self.redis_client.ping()
            logger.info("✅ Redis connection established")
            
            self._initialized = True
            logger.info("🚀 All database connections initialized successfully")
            
        except Exception as e:
            logger.error(f"❌ Database initialization failed: {str(e)}")
            raise
    
    async def close(self):
        """Close all database connections"""
        if self.pg_pool:
            await self.pg_pool.close()
            logger.info("TimescaleDB pool closed")
        
        if self.neo4j_driver:
            self.neo4j_driver.close()
            logger.info("Neo4j driver closed")
        
        if self.redis_client:
            self.redis_client.close()
            logger.info("Redis connection closed")
        
        self._initialized = False

# Global database manager instance
db_manager = DatabaseManager()

# Utility functions for database operations

async def get_timescale_connection():
    """Get a TimescaleDB connection from the pool"""
    if not db_manager._initialized:
        await db_manager.initialize()
    return await db_manager.pg_pool.acquire()

async def release_timescale_connection(conn):
    """Release a TimescaleDB connection back to the pool"""
    await db_manager.pg_pool.release(conn)

async def get_neo4j_session():
    """Get a Neo4j session"""
    if not db_manager._initialized:
        await db_manager.initialize()
    return db_manager.neo4j_driver.session()

async def get_redis_client():
    """Get the Redis client"""
    if not db_manager._initialized:
        await db_manager.initialize()
    return db_manager.redis_client

# Health check functions

async def check_timescale_health() -> Dict[str, Any]:
    """Check TimescaleDB health and return status"""
    try:
        conn = await get_timescale_connection()
        try:
            result = await conn.fetchrow("SELECT version(), now() as timestamp")
            await conn.fetchval("SELECT count(*) FROM information_schema.tables WHERE table_name = 'system_metrics'")
            
            return {
                "status": "healthy",
                "version": result["version"].split()[1] if result["version"] else "unknown",
                "timestamp": result["timestamp"].isoformat(),
                "connection_pool_size": db_manager.pg_pool.get_size(),
                "active_connections": db_manager.pg_pool.get_size() - len(db_manager.pg_pool._holders)
            }
        finally:
            await release_timescale_connection(conn)
    except Exception as e:
        logger.error(f"TimescaleDB health check failed: {str(e)}")
        return {
            "status": "unhealthy",
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }

async def check_neo4j_health() -> Dict[str, Any]:
    """Check Neo4j health and return status"""
    try:
        session = await get_neo4j_session()
        try:
            result = session.run("CALL dbms.components() YIELD name, versions, edition")
            components = list(result)
            
            # Get basic stats
            node_count = session.run("MATCH (n) RETURN count(n) as count").single()["count"]
            rel_count = session.run("MATCH ()-[r]->() RETURN count(r) as count").single()["count"]
            
            return {
                "status": "healthy",
                "version": components[0]["versions"][0] if components else "unknown",
                "edition": components[0]["edition"] if components else "unknown",
                "timestamp": datetime.utcnow().isoformat(),
                "node_count": node_count,
                "relationship_count": rel_count
            }
        finally:
            session.close()
    except Exception as e:
        logger.error(f"Neo4j health check failed: {str(e)}")
        return {
            "status": "unhealthy",
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }

async def check_redis_health() -> Dict[str, Any]:
    """Check Redis health and return status"""
    try:
        redis_client = await get_redis_client()
        
        # Basic connectivity test
        redis_client.ping()
        
        # Get Redis info
        info = redis_client.info()
        memory_info = redis_client.info("memory")
        
        return {
            "status": "healthy",
            "version": info.get("redis_version", "unknown"),
            "timestamp": datetime.utcnow().isoformat(),
            "connected_clients": info.get("connected_clients", 0),
            "used_memory": memory_info.get("used_memory_human", "unknown"),
            "total_commands_processed": info.get("total_commands_processed", 0)
        }
    except Exception as e:
        logger.error(f"Redis health check failed: {str(e)}")
        return {
            "status": "unhealthy", 
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }

# Sample data functions

async def get_sample_system_metrics(limit: int = 100) -> List[Dict[str, Any]]:
    """Get sample system metrics from TimescaleDB"""
    try:
        conn = await get_timescale_connection()
        try:
            query = """
            SELECT time, service_name, cluster_name, region, environment,
                   cpu_utilization, memory_utilization, response_time_ms, 
                   error_rate, throughput_rps
            FROM system_metrics 
            WHERE time >= NOW() - INTERVAL '1 hour'
            ORDER BY time DESC 
            LIMIT $1
            """
            
            rows = await conn.fetch(query, limit)
            return [dict(row) for row in rows]
        finally:
            await release_timescale_connection(conn)
    except Exception as e:
        logger.error(f"Failed to get sample system metrics: {str(e)}")
        return []

async def get_sample_infrastructure() -> List[Dict[str, Any]]:
    """Get sample infrastructure data from Neo4j"""
    try:
        with get_neo4j_session() as session:
            query = """
            MATCH (c:EKSCluster)
            OPTIONAL MATCH (c)<-[:DEPLOYED_ON]-(s:Service)
            RETURN c.name as cluster_name, c.region as region, c.status as status,
                   c.total_nodes as total_nodes, c.cost_monthly as cost_monthly,
                   collect(s.name) as services
            LIMIT 10
            """
            
            result = session.run(query)
            return [dict(record) for record in result]
    except Exception as e:
        logger.error(f"Failed to get sample infrastructure: {str(e)}")
        return []

async def cache_sample_data():
    """Cache some sample data in Redis"""
    try:
        redis_client = await get_redis_client()
        
        # Cache current system status
        system_status = {
            "timestamp": datetime.utcnow().isoformat(),
            "active_services": 5,
            "healthy_clusters": 4,
            "total_nodes": 155,
            "avg_cpu_utilization": 45.2,
            "avg_response_time": 185.5
        }
        
        redis_client.setex(
            "system_status",
            300,  # 5 minutes TTL
            str(system_status)
        )
        
        # Cache WebSocket connection count
        redis_client.setex("ws_connections", 60, "0")
        
        logger.info("Sample data cached in Redis")
        return True
        
    except Exception as e:
        logger.error(f"Failed to cache sample data: {str(e)}")
        return False

# Database initialization function
async def initialize_databases():
    """Initialize all database connections and test them"""
    try:
        await db_manager.initialize()
        
        # Test all connections
        ts_health = await check_timescale_health()
        neo4j_health = await check_neo4j_health()
        redis_health = await check_redis_health()
        
        logger.info(f"TimescaleDB: {ts_health['status']}")
        logger.info(f"Neo4j: {neo4j_health['status']}")
        logger.info(f"Redis: {redis_health['status']}")
        
        # Cache sample data
        await cache_sample_data()
        
        return {
            "timescale": ts_health,
            "neo4j": neo4j_health,
            "redis": redis_health,
            "overall_status": "healthy" if all(
                h["status"] == "healthy" 
                for h in [ts_health, neo4j_health, redis_health]
            ) else "degraded"
        }
        
    except Exception as e:
        logger.error(f"Database initialization failed: {str(e)}")
        raise

# Cleanup function
async def cleanup_databases():
    """Clean up all database connections"""
    await db_manager.close()