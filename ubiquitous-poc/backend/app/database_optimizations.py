"""
Database optimization functions for improved query performance
Adds additional indexes and optimizations beyond the base schema
"""

from typing import Dict, Any
import asyncio
from .database import get_timescale_connection, release_timescale_connection
import logging

logger = logging.getLogger(__name__)

async def create_performance_indexes():
    """Create additional indexes for improved query performance"""
    
    optimization_queries = [
        # Additional composite indexes for system_metrics
        """
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_system_metrics_time_service 
        ON system_metrics (time DESC, service_name) 
        WHERE time >= NOW() - INTERVAL '7 days'
        """,
        
        """
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_system_metrics_health_status 
        ON system_metrics (
            CASE 
                WHEN error_rate > 5 OR response_time_ms > 2000 THEN 'unhealthy'
                WHEN error_rate > 1 OR response_time_ms > 1000 THEN 'degraded'
                ELSE 'healthy'
            END, 
            time DESC
        )
        WHERE time >= NOW() - INTERVAL '24 hours'
        """,
        
        # Cost analysis optimizations
        """
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cost_metrics_optimization 
        ON cost_metrics (estimated_waste DESC, time DESC, resource_type)
        WHERE estimated_waste > 0
        """,
        
        # Network performance indexes
        """
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_network_metrics_latency 
        ON network_metrics (source_service, target_service, avg_latency_ms DESC, time DESC)
        WHERE time >= NOW() - INTERVAL '1 day'
        """,
        
        # Security events optimization
        """
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_security_events_severity_time 
        ON security_events (severity, status, time DESC)
        WHERE time >= NOW() - INTERVAL '30 days'
        """,
        
        # Business value metrics index
        """
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_business_value_type_time 
        ON business_value_metrics (metric_type, category, time DESC)
        WHERE time >= NOW() - INTERVAL '90 days'
        """,
        
        # Database performance index
        """
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_database_metrics_performance 
        ON database_metrics (db_identifier, cpu_utilization DESC, time DESC)
        WHERE time >= NOW() - INTERVAL '24 hours'
        """,
        
        # Incident analysis index
        """
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_incident_metrics_resolution 
        ON incident_metrics (severity, status, resolution_time_minutes, time DESC)
        WHERE time >= NOW() - INTERVAL '90 days'
        """
    ]
    
    try:
        conn = await get_timescale_connection()
        try:
            results = []
            for i, query in enumerate(optimization_queries):
                try:
                    logger.info(f"Creating performance index {i+1}/{len(optimization_queries)}")
                    await conn.execute(query)
                    results.append(f"Index {i+1}: Success")
                except Exception as e:
                    logger.warning(f"Index {i+1} failed: {str(e)}")
                    results.append(f"Index {i+1}: Failed - {str(e)}")
            
            return {
                "status": "completed",
                "indexes_created": len([r for r in results if "Success" in r]),
                "indexes_failed": len([r for r in results if "Failed" in r]),
                "details": results
            }
            
        finally:
            await release_timescale_connection(conn)
            
    except Exception as e:
        logger.error(f"Failed to create performance indexes: {str(e)}")
        return {
            "status": "failed",
            "error": str(e),
            "indexes_created": 0,
            "indexes_failed": len(optimization_queries)
        }

async def analyze_query_performance():
    """Analyze current query performance and suggest optimizations"""
    
    analysis_queries = [
        {
            "name": "System Metrics Query Performance",
            "query": """
            EXPLAIN (ANALYZE, BUFFERS) 
            SELECT service_name, AVG(cpu_utilization) as avg_cpu
            FROM system_metrics 
            WHERE time >= NOW() - INTERVAL '1 hour'
            GROUP BY service_name
            ORDER BY avg_cpu DESC
            LIMIT 10
            """
        },
        {
            "name": "Cost Analysis Performance",
            "query": """
            EXPLAIN (ANALYZE, BUFFERS)
            SELECT resource_type, SUM(estimated_waste) as total_waste
            FROM cost_metrics
            WHERE time >= NOW() - INTERVAL '7 days'
              AND estimated_waste > 0
            GROUP BY resource_type
            ORDER BY total_waste DESC
            """
        },
        {
            "name": "Network Latency Analysis",
            "query": """
            EXPLAIN (ANALYZE, BUFFERS)
            SELECT source_service, target_service, AVG(avg_latency_ms) as avg_latency
            FROM network_metrics
            WHERE time >= NOW() - INTERVAL '1 hour'
            GROUP BY source_service, target_service
            HAVING AVG(avg_latency_ms) > 100
            ORDER BY avg_latency DESC
            """
        }
    ]
    
    try:
        conn = await get_timescale_connection()
        try:
            performance_results = []
            
            for analysis in analysis_queries:
                try:
                    result = await conn.fetch(analysis["query"])
                    execution_plan = [dict(row) for row in result]
                    
                    # Extract key performance metrics
                    plan_text = "\n".join([row.get("QUERY PLAN", "") for row in execution_plan])
                    
                    performance_results.append({
                        "query_name": analysis["name"],
                        "status": "success",
                        "execution_plan": plan_text,
                        "recommendations": _generate_recommendations(plan_text)
                    })
                    
                except Exception as e:
                    performance_results.append({
                        "query_name": analysis["name"],
                        "status": "failed",
                        "error": str(e),
                        "recommendations": ["Fix query syntax or check table structure"]
                    })
            
            return {
                "status": "completed",
                "timestamp": asyncio.get_event_loop().time(),
                "analyses": performance_results,
                "overall_recommendations": _generate_overall_recommendations(performance_results)
            }
            
        finally:
            await release_timescale_connection(conn)
            
    except Exception as e:
        logger.error(f"Failed to analyze query performance: {str(e)}")
        return {
            "status": "failed",
            "error": str(e),
            "analyses": []
        }

def _generate_recommendations(execution_plan: str) -> list:
    """Generate performance recommendations based on execution plan"""
    recommendations = []
    
    if "Seq Scan" in execution_plan:
        recommendations.append("Consider adding indexes to avoid sequential scans")
    
    if "Sort" in execution_plan and "external sort" in execution_plan.lower():
        recommendations.append("Increase work_mem or add indexes to avoid external sorts")
    
    if "Nested Loop" in execution_plan:
        recommendations.append("Consider optimizing join conditions or adding indexes")
    
    if "cost=" in execution_plan:
        # Extract cost information for more specific recommendations
        if "cost=1000" in execution_plan or "rows=100000" in execution_plan:
            recommendations.append("High cost query - consider query optimization or partitioning")
    
    if not recommendations:
        recommendations.append("Query performance appears optimal")
    
    return recommendations

def _generate_overall_recommendations(analyses: list) -> list:
    """Generate overall system recommendations"""
    recommendations = []
    
    failed_queries = len([a for a in analyses if a["status"] == "failed"])
    if failed_queries > 0:
        recommendations.append(f"Fix {failed_queries} failing queries to improve system health")
    
    seq_scan_queries = len([a for a in analyses if "sequential scan" in str(a.get("recommendations", []))])
    if seq_scan_queries > 0:
        recommendations.append("Multiple queries using sequential scans - review indexing strategy")
    
    recommendations.extend([
        "Consider implementing query result caching for frequently accessed data",
        "Monitor continuous aggregate refresh policies for optimal performance",
        "Review retention policies to balance storage costs with query performance",
        "Implement connection pooling optimization based on query patterns"
    ])
    
    return recommendations

async def get_table_statistics():
    """Get detailed table statistics for capacity planning"""
    
    stats_queries = {
        "system_metrics": """
        SELECT 
            schemaname,
            tablename,
            n_tup_ins as inserts,
            n_tup_upd as updates,
            n_tup_del as deletes,
            n_live_tup as live_tuples,
            n_dead_tup as dead_tuples,
            last_vacuum,
            last_autovacuum,
            last_analyze,
            last_autoanalyze
        FROM pg_stat_user_tables 
        WHERE tablename = 'system_metrics'
        """,
        
        "table_sizes": """
        SELECT 
            schemaname,
            tablename,
            pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
            pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
            pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) as index_size
        FROM pg_tables 
        WHERE schemaname = 'public'
          AND tablename IN ('system_metrics', 'database_metrics', 'network_metrics', 'cost_metrics')
        ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
        """,
        
        "index_usage": """
        SELECT 
            schemaname,
            tablename,
            indexname,
            idx_tup_read as index_reads,
            idx_tup_fetch as index_fetches,
            pg_size_pretty(pg_relation_size(indexname::regclass)) as index_size
        FROM pg_stat_user_indexes 
        WHERE schemaname = 'public'
        ORDER BY idx_tup_read DESC
        """
    }
    
    try:
        conn = await get_timescale_connection()
        try:
            statistics = {}
            
            for stat_name, query in stats_queries.items():
                try:
                    rows = await conn.fetch(query)
                    statistics[stat_name] = [dict(row) for row in rows]
                except Exception as e:
                    logger.warning(f"Failed to get {stat_name}: {str(e)}")
                    statistics[stat_name] = {"error": str(e)}
            
            return {
                "status": "success",
                "timestamp": asyncio.get_event_loop().time(),
                "statistics": statistics,
                "summary": {
                    "total_tables_analyzed": len([k for k, v in statistics.items() if not isinstance(v, dict) or "error" not in v]),
                    "failed_queries": len([k for k, v in statistics.items() if isinstance(v, dict) and "error" in v])
                }
            }
            
        finally:
            await release_timescale_connection(conn)
            
    except Exception as e:
        logger.error(f"Failed to get table statistics: {str(e)}")
        return {
            "status": "failed",
            "error": str(e),
            "statistics": {}
        }

# Main optimization function
async def optimize_database_performance():
    """Run all database optimizations"""
    
    logger.info("Starting database performance optimization")
    
    results = {
        "optimization_start": asyncio.get_event_loop().time(),
        "steps": {}
    }
    
    # Step 1: Create performance indexes
    logger.info("Step 1: Creating performance indexes")
    index_results = await create_performance_indexes()
    results["steps"]["indexes"] = index_results
    
    # Step 2: Analyze query performance
    logger.info("Step 2: Analyzing query performance")
    performance_results = await analyze_query_performance()
    results["steps"]["performance_analysis"] = performance_results
    
    # Step 3: Get table statistics
    logger.info("Step 3: Gathering table statistics")
    stats_results = await get_table_statistics()
    results["steps"]["table_statistics"] = stats_results
    
    results["optimization_end"] = asyncio.get_event_loop().time()
    results["total_duration"] = results["optimization_end"] - results["optimization_start"]
    results["overall_status"] = "completed"
    
    logger.info(f"Database optimization completed in {results['total_duration']:.2f} seconds")
    
    return results