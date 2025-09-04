#!/usr/bin/env python3
"""
Database connection test script for Ubiquitous POC
Tests connectivity to Neo4j, TimescaleDB, and Redis
"""

import asyncio
import sys
import os

# Add the backend directory to the path
sys.path.append('/app')

from app.database import (
    initialize_databases,
    cleanup_databases,
    check_timescale_health,
    check_neo4j_health,
    check_redis_health,
    get_sample_system_metrics,
    get_sample_infrastructure
)

async def test_database_connections():
    """Test all database connections and basic operations"""
    print("🔍 Testing Ubiquitous POC Database Connections")
    print("=" * 50)
    
    try:
        # Initialize all connections
        print("📡 Initializing database connections...")
        db_status = await initialize_databases()
        
        print(f"\n✅ Overall Status: {db_status['overall_status']}")
        print("\n📊 Detailed Health Checks:")
        
        # TimescaleDB Health
        ts_health = db_status['timescale']
        print(f"\n🐘 TimescaleDB:")
        print(f"   Status: {ts_health['status']}")
        if ts_health['status'] == 'healthy':
            print(f"   Version: {ts_health.get('version', 'unknown')}")
            print(f"   Pool Size: {ts_health.get('connection_pool_size', 0)}")
            print(f"   Active Connections: {ts_health.get('active_connections', 0)}")
        else:
            print(f"   Error: {ts_health.get('error', 'unknown')}")
        
        # Neo4j Health
        neo4j_health = db_status['neo4j']
        print(f"\n🕸️  Neo4j:")
        print(f"   Status: {neo4j_health['status']}")
        if neo4j_health['status'] == 'healthy':
            print(f"   Version: {neo4j_health.get('version', 'unknown')}")
            print(f"   Edition: {neo4j_health.get('edition', 'unknown')}")
            print(f"   Nodes: {neo4j_health.get('node_count', 0):,}")
            print(f"   Relationships: {neo4j_health.get('relationship_count', 0):,}")
        else:
            print(f"   Error: {neo4j_health.get('error', 'unknown')}")
        
        # Redis Health
        redis_health = db_status['redis']
        print(f"\n⚡ Redis:")
        print(f"   Status: {redis_health['status']}")
        if redis_health['status'] == 'healthy':
            print(f"   Version: {redis_health.get('version', 'unknown')}")
            print(f"   Memory Used: {redis_health.get('used_memory', 'unknown')}")
            print(f"   Connected Clients: {redis_health.get('connected_clients', 0)}")
            print(f"   Commands Processed: {redis_health.get('total_commands_processed', 0):,}")
        else:
            print(f"   Error: {redis_health.get('error', 'unknown')}")
        
        # Test data operations
        print(f"\n📈 Testing Data Operations:")
        
        # Test TimescaleDB sample data
        try:
            sample_metrics = await get_sample_system_metrics(5)
            print(f"   TimescaleDB: Retrieved {len(sample_metrics)} sample metrics")
            if sample_metrics:
                latest = sample_metrics[0]
                print(f"   Latest metric: {latest.get('service_name', 'unknown')} - "
                      f"CPU: {latest.get('cpu_utilization', 0):.1f}% at {latest.get('time', 'unknown')}")
        except Exception as e:
            print(f"   TimescaleDB data test failed: {e}")
        
        # Test Neo4j sample data
        try:
            sample_infra = await get_sample_infrastructure()
            print(f"   Neo4j: Retrieved {len(sample_infra)} infrastructure items")
            if sample_infra:
                cluster = sample_infra[0]
                print(f"   Sample cluster: {cluster.get('cluster_name', 'unknown')} - "
                      f"${cluster.get('cost_monthly', 0):,.0f}/month, {len(cluster.get('services', []))} services")
        except Exception as e:
            print(f"   Neo4j data test failed: {e}")
        
        # Connection test summary
        print(f"\n🎯 Connection Test Summary:")
        healthy_count = sum(1 for status in [ts_health, neo4j_health, redis_health] if status['status'] == 'healthy')
        print(f"   Healthy Databases: {healthy_count}/3")
        
        if healthy_count == 3:
            print("   🟢 All systems operational - Ready for POC demo")
            return True
        elif healthy_count >= 2:
            print("   🟡 Partial connectivity - Some features may be limited")
            return True
        else:
            print("   🔴 Critical connectivity issues - POC may not function properly")
            return False
            
    except Exception as e:
        print(f"\n❌ Database connection test failed: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    finally:
        # Cleanup
        try:
            await cleanup_databases()
            print("\n📦 Database connections closed")
        except Exception as e:
            print(f"Cleanup error: {e}")

async def main():
    """Main test function"""
    success = await test_database_connections()
    
    if success:
        print(f"\n✅ Database connectivity test completed successfully")
        sys.exit(0)
    else:
        print(f"\n❌ Database connectivity test failed")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())