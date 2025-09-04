#!/usr/bin/env python3
"""
Database Population Manager for Ubiquitous POC
Coordinates infrastructure and metrics data generation across all databases
"""

import asyncio
import logging
import os
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
import asyncpg
from neo4j import AsyncGraphDatabase
import redis.asyncio as redis

from aws_infrastructure_generator import AWSInfrastructureGenerator
from metrics_generator import MetricsGenerator


class DatabasePopulator:
    """Orchestrates data population across Neo4j, TimescaleDB, and Redis"""
    
    def __init__(self):
        self.logger = self._setup_logging()
        self.pg_pool: Optional[asyncpg.Pool] = None
        self.neo4j_driver = None
        self.redis_client = None
        
        # Generators
        self.infra_generator = AWSInfrastructureGenerator()
        self.metrics_generator = MetricsGenerator()
        
        # Configuration from environment variables
        database_url = os.getenv('DATABASE_URL', 'postgresql://postgres:ubiquitous123@localhost:5432/ubiquitous')
        neo4j_url = os.getenv('NEO4J_URL', 'bolt://neo4j:ubiquitous123@localhost:7687')
        redis_url = os.getenv('REDIS_URL', 'redis://localhost:6379')
        redis_password = os.getenv('REDIS_PASSWORD', 'ubiquitous_redis_2024')
        
        # Parse database URLs for connection config
        self.config = {
            'postgres': {
                'dsn': database_url
            },
            'neo4j': {
                'uri': neo4j_url.split('@')[1] if '@' in neo4j_url else neo4j_url,
                'user': neo4j_url.split('//')[1].split(':')[0] if '@' in neo4j_url else 'neo4j',
                'password': neo4j_url.split('//')[1].split(':')[1].split('@')[0] if '@' in neo4j_url else 'ubiquitous123'
            },
            'redis': {
                'url': redis_url,
                'password': redis_password
            }
        }
    
    def _setup_logging(self) -> logging.Logger:
        """Configure logging for data population"""
        logger = logging.getLogger('database_populator')
        logger.setLevel(logging.INFO)
        
        if not logger.handlers:
            handler = logging.StreamHandler()
            formatter = logging.Formatter(
                '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
            )
            handler.setFormatter(formatter)
            logger.addHandler(handler)
        
        return logger
    
    async def connect_databases(self) -> bool:
        """Initialize all database connections"""
        try:
            # PostgreSQL (TimescaleDB)
            self.logger.info("Connecting to TimescaleDB...")
            self.pg_pool = await asyncpg.create_pool(
                self.config['postgres']['dsn'],
                min_size=2,
                max_size=10
            )
            
            # Neo4j
            self.logger.info("Connecting to Neo4j...")
            self.neo4j_driver = AsyncGraphDatabase.driver(
                f"bolt://{self.config['neo4j']['uri']}",
                auth=(self.config['neo4j']['user'], self.config['neo4j']['password'])
            )
            
            # Redis
            self.logger.info("Connecting to Redis...")
            self.redis_client = redis.from_url(
                self.config['redis']['url'],
                password=self.config['redis']['password'],
                decode_responses=True
            )
            
            # Test connections
            await self._test_connections()
            self.logger.info("All database connections established successfully")
            return True
            
        except Exception as e:
            self.logger.error(f"Database connection failed: {e}")
            return False
    
    async def _test_connections(self):
        """Test all database connections"""
        # Test PostgreSQL
        async with self.pg_pool.acquire() as conn:
            await conn.execute("SELECT 1")
        
        # Test Neo4j
        async with self.neo4j_driver.session() as session:
            await session.run("RETURN 1")
        
        # Test Redis
        await self.redis_client.ping()
    
    async def populate_infrastructure(self) -> Dict[str, Any]:
        """Populate Neo4j with AWS infrastructure topology"""
        self.logger.info("Generating AWS infrastructure topology...")
        
        try:
            # Generate infrastructure data (includes clearing and direct Neo4j insertion)
            infrastructure_metadata = self.infra_generator.generate_full_infrastructure()
            
            # Cache infrastructure metadata in Redis
            await self._cache_infrastructure_metadata(infrastructure_metadata)
            
            self.logger.info(f"Infrastructure population complete: {infrastructure_metadata.get('nodes_created', 0)} nodes created")
            return infrastructure_metadata
            
        except Exception as e:
            self.logger.error(f"Infrastructure population failed: {e}")
            raise
    
    async def _insert_infrastructure_components(self, infrastructure: Dict[str, Any]):
        """Insert infrastructure components into Neo4j"""
        async with self.neo4j_driver.session() as session:
            # Create nodes
            for node in infrastructure.get('nodes', []):
                node_type = node['type']
                properties = {k: v for k, v in node.items() if k != 'type'}
                
                # Create Cypher query for node
                props_str = ', '.join([f"{k}: ${k}" for k in properties.keys()])
                query = f"CREATE (n:{node_type} {{ {props_str} }})"
                
                await session.run(query, **properties)
            
            # Create relationships
            for rel in infrastructure.get('relationships', []):
                query = """
                MATCH (a {id: $from_id}), (b {id: $to_id})
                CREATE (a)-[r:""" + rel['type'] + """ $props]->(b)
                """
                await session.run(
                    query,
                    from_id=rel['from'],
                    to_id=rel['to'],
                    props=rel.get('properties', {})
                )
    
    async def _cache_infrastructure_metadata(self, infrastructure_metadata: Dict[str, Any]):
        """Cache infrastructure metadata in Redis for fast access"""
        try:
            # Query actual data from Neo4j to cache
            async with self.neo4j_driver.session() as session:
                # Cache node counts by type
                result = await session.run("MATCH (n) RETURN labels(n)[0] as type, count(n) as count")
                node_counts = {}
                async for record in result:
                    node_counts[record["type"]] = record["count"]
                
                if node_counts:
                    await self.redis_client.hset("infra:node_counts", mapping=node_counts)
                
                # Cache cluster information for fast lookup
                cluster_result = await session.run("""
                    MATCH (c:EKSCluster) 
                    RETURN c.name as name, c.region as region, c.status as status, c.cost_monthly as cost_monthly
                """)
                
                async for record in cluster_result:
                    cluster_data = {
                        'region': record["region"] or 'unknown',
                        'status': record["status"] or 'unknown',  
                        'cost_monthly': record["cost_monthly"] or 0
                    }
                    await self.redis_client.hset(f"cluster:{record['name']}", mapping=cluster_data)
                
                # Cache total cost information
                cost_result = await session.run("MATCH (n) RETURN sum(n.cost_monthly) as total_cost")
                total_cost_record = await cost_result.single()
                total_cost = total_cost_record["total_cost"] if total_cost_record else 0
                await self.redis_client.set("infra:total_cost", total_cost or 0)
            
            self.logger.info("Infrastructure metadata cached in Redis")
            
        except Exception as e:
            self.logger.error(f"Redis caching failed: {e}")
    
    async def populate_historical_metrics(self, days_back: int = 90) -> bool:
        """Populate TimescaleDB with historical metrics data"""
        self.logger.info(f"Generating {days_back} days of historical metrics...")
        
        try:
            # Get infrastructure components from Neo4j
            components = await self._get_infrastructure_components()
            
            # Generate historical data
            end_time = datetime.utcnow()
            start_time = end_time - timedelta(days=days_back)
            
            # Generate metrics in batches (1 day at a time)
            current_time = start_time
            batch_count = 0
            
            while current_time < end_time:
                batch_end = min(current_time + timedelta(days=1), end_time)
                
                # Generate metrics for this batch
                metrics_batch = self.metrics_generator.generate_historical_batch(
                    components=components,
                    start_time=current_time,
                    end_time=batch_end,
                    interval_minutes=5
                )
                
                # Insert batch into database
                await self._insert_metrics_batch(metrics_batch)
                
                current_time = batch_end
                batch_count += 1
                
                if batch_count % 7 == 0:  # Log every week
                    self.logger.info(f"Processed {batch_count} days of metrics data...")
            
            # Refresh continuous aggregates
            await self._refresh_continuous_aggregates()
            
            self.logger.info("Historical metrics population complete")
            return True
            
        except Exception as e:
            self.logger.error(f"Historical metrics population failed: {e}")
            return False
    
    async def _get_infrastructure_components(self) -> List[Dict[str, Any]]:
        """Retrieve infrastructure components from Neo4j"""
        async with self.neo4j_driver.session() as session:
            result = await session.run("""
                MATCH (n)
                WHERE n.name IS NOT NULL
                RETURN n.name as name, labels(n)[0] as type, 
                       n.region as region, n.cost_monthly as cost_monthly
            """)
            
            components = []
            async for record in result:
                components.append({
                    'name': record['name'],
                    'type': record['type'],
                    'region': record.get('region'),
                    'cost_monthly': record.get('cost_monthly', 0)
                })
            
            return components
    
    async def _insert_metrics_batch(self, metrics_batch: Dict[str, List[Dict]]):
        """Insert a batch of metrics into TimescaleDB"""
        async with self.pg_pool.acquire() as conn:
            for table_name, records in metrics_batch.items():
                if not records:
                    continue
                
                # Get table columns
                columns = list(records[0].keys())
                
                # Prepare insert query
                placeholders = ', '.join([f'${i+1}' for i in range(len(columns))])
                query = f"INSERT INTO {table_name} ({', '.join(columns)}) VALUES ({placeholders})"
                
                # Execute batch insert
                values_list = [[record[col] for col in columns] for record in records]
                await conn.executemany(query, values_list)
    
    async def _refresh_continuous_aggregates(self):
        """Refresh TimescaleDB continuous aggregates"""
        async with self.pg_pool.acquire() as conn:
            # Refresh hourly aggregates
            await conn.execute("""
                CALL refresh_continuous_aggregate('system_metrics_hourly', NULL, NULL);
            """)
            
            await conn.execute("""
                CALL refresh_continuous_aggregate('business_metrics_hourly', NULL, NULL);
            """)
            
            self.logger.info("Continuous aggregates refreshed")
    
    async def start_realtime_generation(self):
        """Start real-time metrics generation for current data"""
        self.logger.info("Starting real-time metrics generation...")
        
        components = await self._get_infrastructure_components()
        
        while True:
            try:
                # Generate current metrics
                current_metrics = self.metrics_generator.generate_realtime_metrics(components)
                
                # Insert into database
                await self._insert_metrics_batch(current_metrics)
                
                # Cache latest metrics in Redis for fast access
                await self._cache_latest_metrics(current_metrics)
                
                # Wait for next interval
                await asyncio.sleep(60)  # 1-minute intervals for real-time
                
            except Exception as e:
                self.logger.error(f"Real-time generation error: {e}")
                await asyncio.sleep(5)  # Short retry delay
    
    async def _cache_latest_metrics(self, metrics: Dict[str, List[Dict]]):
        """Cache latest metrics in Redis for dashboard queries"""
        try:
            for table_name, records in metrics.items():
                if not records:
                    continue
                
                # Cache latest values by service/cluster
                for record in records:
                    key_parts = []
                    if 'service_name' in record:
                        key_parts.append(f"service:{record['service_name']}")
                    if 'cluster_name' in record:
                        key_parts.append(f"cluster:{record['cluster_name']}")
                    
                    if key_parts:
                        cache_key = f"latest:{table_name}:{':'.join(key_parts)}"
                        await self.redis_client.hset(cache_key, mapping={
                            k: str(v) for k, v in record.items() 
                            if k != 'time'
                        })
                        await self.redis_client.expire(cache_key, 300)  # 5-minute expiry
        
        except Exception as e:
            self.logger.error(f"Redis caching failed: {e}")
    
    async def get_population_status(self) -> Dict[str, Any]:
        """Get current data population status"""
        status = {
            'infrastructure': {},
            'metrics': {},
            'timestamp': datetime.utcnow().isoformat()
        }
        
        try:
            # Neo4j status
            async with self.neo4j_driver.session() as session:
                result = await session.run("""
                    MATCH (n) 
                    RETURN labels(n)[0] as type, count(n) as count
                """)
                
                node_counts = {}
                async for record in result:
                    node_counts[record['type']] = record['count']
                
                status['infrastructure']['nodes'] = node_counts
                status['infrastructure']['total_nodes'] = sum(node_counts.values())
            
            # TimescaleDB status
            async with self.pg_pool.acquire() as conn:
                metrics_counts = {}
                tables = ['system_metrics', 'business_metrics', 'cost_metrics', 
                         'security_events', 'audit_logs', 'performance_metrics',
                         'network_metrics', 'application_metrics']
                
                for table in tables:
                    try:
                        result = await conn.fetchval(f"SELECT COUNT(*) FROM {table}")
                        metrics_counts[table] = result
                    except:
                        metrics_counts[table] = 0
                
                status['metrics']['table_counts'] = metrics_counts
                status['metrics']['total_records'] = sum(metrics_counts.values())
            
            # Redis status
            redis_info = await self.redis_client.info('keyspace')
            status['cache'] = {
                'keys': await self.redis_client.dbsize(),
                'memory_usage': redis_info.get('used_memory_human', 'unknown')
            }
            
        except Exception as e:
            self.logger.error(f"Status check failed: {e}")
            status['error'] = str(e)
        
        return status
    
    async def cleanup(self):
        """Clean up database connections"""
        try:
            if self.pg_pool:
                await self.pg_pool.close()
            
            if self.neo4j_driver:
                await self.neo4j_driver.close()
            
            if self.redis_client:
                await self.redis_client.close()
            
            self.logger.info("Database connections closed")
            
        except Exception as e:
            self.logger.error(f"Cleanup error: {e}")


async def main():
    """Main execution function for standalone usage"""
    populator = DatabasePopulator()
    
    try:
        # Connect to databases
        if not await populator.connect_databases():
            print("❌ Database connection failed")
            return
        
        print("✅ Database connections established")
        
        # Populate infrastructure
        print("🏗️ Populating infrastructure...")
        infrastructure = await populator.populate_infrastructure()
        print(f"✅ Infrastructure populated: {len(infrastructure.get('nodes', []))} nodes")
        
        # Populate historical metrics
        print("📊 Populating historical metrics...")
        success = await populator.populate_historical_metrics(days_back=90)
        if success:
            print("✅ Historical metrics populated")
        else:
            print("❌ Historical metrics population failed")
        
        # Show status
        print("\n📋 Population Status:")
        status = await populator.get_population_status()
        print(f"Infrastructure nodes: {status['infrastructure'].get('total_nodes', 0)}")
        print(f"Metrics records: {status['metrics'].get('total_records', 0)}")
        print(f"Cache keys: {status['cache'].get('keys', 0)}")
        
        print("\n🚀 Data population complete!")
        print("Start real-time generation with: python database_populator.py --realtime")
        
    except KeyboardInterrupt:
        print("\n⚠️ Population interrupted by user")
    except Exception as e:
        print(f"❌ Population failed: {e}")
    finally:
        await populator.cleanup()


if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "--realtime":
        # Run real-time generation
        async def run_realtime():
            populator = DatabasePopulator()
            await populator.connect_databases()
            await populator.start_realtime_generation()
        
        asyncio.run(run_realtime())
    else:
        # Run population
        asyncio.run(main())