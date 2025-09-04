"""
TimescaleDB Query Service for Time-Series Metrics Data
Provides comprehensive queries for system metrics, performance data, and business intelligence
"""

from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import asyncio
from ..database import get_timescale_connection, release_timescale_connection
import logging
import time
from functools import wraps

logger = logging.getLogger(__name__)

def timescale_error_handler(func):
    """Decorator for TimescaleDB error handling with retries and logging"""
    @wraps(func)
    async def wrapper(*args, **kwargs):
        max_retries = 3
        retry_delay = 1  # seconds
        
        for attempt in range(max_retries):
            try:
                start_time = time.time()
                result = await func(*args, **kwargs)
                execution_time = time.time() - start_time
                
                logger.info(f"TimescaleDB query {func.__name__} completed in {execution_time:.2f}s")
                return result
                
            except Exception as e:
                logger.warning(f"TimescaleDB query {func.__name__} failed on attempt {attempt + 1}: {str(e)}")
                
                if attempt == max_retries - 1:  # Last attempt
                    logger.error(f"TimescaleDB query {func.__name__} failed after {max_retries} attempts")
                    # Return empty result structure instead of raising
                    return {
                        "error": str(e),
                        "query_name": func.__name__,
                        "attempts": max_retries,
                        "data": [],
                        "summary": {},
                        "total_count": 0
                    }
                
                await asyncio.sleep(retry_delay * (attempt + 1))  # Exponential backoff
        
    return wrapper

class TimescaleService:
    """Service for querying TimescaleDB time-series metrics"""
    
    @staticmethod
    @timescale_error_handler
    async def get_system_metrics_summary(start_time: datetime = None, end_time: datetime = None, hours: int = 24) -> Dict[str, Any]:
        """Get system metrics summary for the last N hours"""
        try:
            conn = await get_timescale_connection()
            try:
                # Optimized query using time bucket aggregation for better performance
                query = """
                SELECT 
                    service_name,
                    cluster_name,
                    region,
                    environment,
                    COUNT(*) as data_points,
                    AVG(cpu_utilization) as avg_cpu,
                    MAX(cpu_utilization) as max_cpu,
                    AVG(memory_utilization) as avg_memory,
                    MAX(memory_utilization) as max_memory,
                    AVG(response_time_ms) as avg_response_time,
                    MAX(response_time_ms) as max_response_time,
                    AVG(error_rate) as avg_error_rate,
                    MAX(error_rate) as max_error_rate,
                    SUM(request_count) as total_requests,
                    AVG(throughput_rps) as avg_throughput,
                    CASE 
                        WHEN AVG(error_rate) > 5 OR AVG(response_time_ms) > 2000 THEN 'unhealthy'
                        WHEN AVG(error_rate) > 1 OR AVG(response_time_ms) > 1000 THEN 'degraded'
                        ELSE 'healthy'
                    END as health_status
                FROM system_metrics
                WHERE time >= $1
                  AND time <= $2
                GROUP BY service_name, cluster_name, region, environment
                ORDER BY avg_cpu DESC, avg_response_time DESC
                LIMIT 100
                """
                
                # Use provided times or calculate from hours
                if start_time is None:
                    start_time = datetime.utcnow() - timedelta(hours=hours)
                if end_time is None:
                    end_time = datetime.utcnow()
                
                rows = await conn.fetch(query, start_time, end_time)
                services = [dict(row) for row in rows]
                
                # Calculate overall metrics
                total_services = len(services)
                unhealthy_services = len([s for s in services if s["health_status"] == "unhealthy"])
                degraded_services = len([s for s in services if s["health_status"] == "degraded"])
                healthy_services = total_services - unhealthy_services - degraded_services
                
                avg_cpu_overall = sum(s["avg_cpu"] or 0 for s in services) / total_services if total_services > 0 else 0
                avg_memory_overall = sum(s["avg_memory"] or 0 for s in services) / total_services if total_services > 0 else 0
                avg_response_time_overall = sum(s["avg_response_time"] or 0 for s in services) / total_services if total_services > 0 else 0
                
                return {
                    "services": services,
                    "summary": {
                        "total_services": total_services,
                        "healthy_services": healthy_services,
                        "degraded_services": degraded_services,
                        "unhealthy_services": unhealthy_services,
                        "health_percentage": (healthy_services / total_services * 100) if total_services > 0 else 0,
                        "avg_cpu_utilization": round(avg_cpu_overall, 2),
                        "avg_memory_utilization": round(avg_memory_overall, 2),
                        "avg_response_time": round(avg_response_time_overall, 2)
                    }
                }
                
            finally:
                await release_timescale_connection(conn)
                
        except Exception as e:
            logger.error(f"Failed to get system metrics summary: {str(e)}")
            return {"services": [], "summary": {}}

    @staticmethod
    @timescale_error_handler
    async def get_service_performance_trend(service_name: str, cluster_name: str, hours: int = 24) -> Dict[str, Any]:
        """Get detailed performance trend for a specific service"""
        try:
            conn = await get_timescale_connection()
            try:
                query = """
                SELECT 
                    time_bucket('5 minutes', time) as time_bucket,
                    AVG(cpu_utilization) as cpu_utilization,
                    AVG(memory_utilization) as memory_utilization,
                    AVG(response_time_ms) as response_time_ms,
                    AVG(error_rate) as error_rate,
                    AVG(throughput_rps) as throughput_rps,
                    SUM(request_count) as request_count,
                    AVG(active_connections) as active_connections
                FROM system_metrics
                WHERE service_name = $1 
                  AND cluster_name = $2
                  AND time >= NOW() - INTERVAL '%s hours'
                GROUP BY time_bucket
                ORDER BY time_bucket
                """ % hours
                
                rows = await conn.fetch(query, service_name, cluster_name)
                trend_data = [dict(row) for row in rows]
                
                # Calculate trend statistics
                if trend_data:
                    cpu_values = [d["cpu_utilization"] for d in trend_data if d["cpu_utilization"] is not None]
                    memory_values = [d["memory_utilization"] for d in trend_data if d["memory_utilization"] is not None]
                    response_time_values = [d["response_time_ms"] for d in trend_data if d["response_time_ms"] is not None]
                    
                    cpu_trend = _calculate_trend(cpu_values)
                    memory_trend = _calculate_trend(memory_values)
                    response_time_trend = _calculate_trend(response_time_values)
                    
                    return {
                        "service_name": service_name,
                        "cluster_name": cluster_name,
                        "time_series": trend_data,
                        "trends": {
                            "cpu_trend": cpu_trend,
                            "memory_trend": memory_trend,
                            "response_time_trend": response_time_trend
                        },
                        "statistics": {
                            "data_points": len(trend_data),
                            "avg_cpu": round(sum(cpu_values) / len(cpu_values), 2) if cpu_values else 0,
                            "avg_memory": round(sum(memory_values) / len(memory_values), 2) if memory_values else 0,
                            "avg_response_time": round(sum(response_time_values) / len(response_time_values), 2) if response_time_values else 0
                        }
                    }
                else:
                    return {"service_name": service_name, "cluster_name": cluster_name, "time_series": [], "trends": {}, "statistics": {}}
                
            finally:
                await release_timescale_connection(conn)
                
        except Exception as e:
            logger.error(f"Failed to get service performance trend: {str(e)}")
            return {"time_series": [], "trends": {}, "statistics": {}}

    @staticmethod
    @timescale_error_handler
    async def get_database_performance_metrics(hours: int = 24) -> List[Dict[str, Any]]:
        """Get database performance metrics summary"""
        try:
            conn = await get_timescale_connection()
            try:
                query = """
                SELECT 
                    db_identifier,
                    db_engine,
                    instance_class,
                    region,
                    COUNT(*) as data_points,
                    AVG(cpu_utilization) as avg_cpu,
                    MAX(cpu_utilization) as max_cpu,
                    AVG(database_connections) as avg_connections,
                    MAX(database_connections) as max_connections,
                    AVG(read_latency_ms) as avg_read_latency,
                    AVG(write_latency_ms) as avg_write_latency,
                    AVG(buffer_cache_hit_ratio) as avg_cache_hit_ratio,
                    SUM(slow_queries) as total_slow_queries,
                    SUM(deadlocks) as total_deadlocks,
                    CASE 
                        WHEN AVG(cpu_utilization) > 80 OR AVG(read_latency_ms) > 100 THEN 'critical'
                        WHEN AVG(cpu_utilization) > 60 OR AVG(read_latency_ms) > 50 THEN 'warning'
                        ELSE 'normal'
                    END as performance_status
                FROM database_metrics
                WHERE time >= NOW() - INTERVAL '%s hours'
                GROUP BY db_identifier, db_engine, instance_class, region
                ORDER BY avg_cpu DESC, avg_read_latency DESC
                """ % hours
                
                rows = await conn.fetch(query)
                return [dict(row) for row in rows]
                
            finally:
                await release_timescale_connection(conn)
                
        except Exception as e:
            logger.error(f"Failed to get database performance metrics: {str(e)}")
            return []

    @staticmethod
    @timescale_error_handler
    async def get_network_latency_matrix(start_time: datetime = None, end_time: datetime = None, hours: int = 24) -> Dict[str, Any]:
        """Get network latency data for heatmap visualization"""
        try:
            conn = await get_timescale_connection()
            try:
                query = """
                SELECT 
                    source_service,
                    target_service,
                    source_cluster,
                    target_cluster,
                    connection_type,
                    region,
                    COUNT(*) as data_points,
                    AVG(avg_latency_ms) as avg_latency,
                    AVG(p95_latency_ms) as p95_latency,
                    AVG(p99_latency_ms) as p99_latency,
                    SUM(request_count) as total_requests,
                    SUM(error_count) as total_errors,
                    CASE 
                        WHEN SUM(request_count) > 0 THEN 
                            ROUND((SUM(error_count)::float / SUM(request_count) * 100)::numeric, 2)
                        ELSE 0 
                    END as error_percentage,
                    AVG(packet_loss_rate) as avg_packet_loss
                FROM network_metrics
                WHERE time >= NOW() - INTERVAL '%s hours'
                GROUP BY source_service, target_service, source_cluster, target_cluster, connection_type, region
                ORDER BY avg_latency DESC
                """ % hours
                
                rows = await conn.fetch(query)
                connections = [dict(row) for row in rows]
                
                # Generate service list for matrix
                services = list(set([c["source_service"] for c in connections] + 
                                   [c["target_service"] for c in connections]))
                services.sort()
                
                # Create latency matrix
                matrix = []
                for source in services:
                    row = []
                    for target in services:
                        if source == target:
                            row.append(0)
                        else:
                            connection = next((c for c in connections 
                                             if c["source_service"] == source and c["target_service"] == target), None)
                            row.append(float(connection["avg_latency"]) if connection and connection["avg_latency"] else None)
                    matrix.append(row)
                
                return {
                    "connections": connections,
                    "matrix": {
                        "services": services,
                        "latency_matrix": matrix
                    },
                    "summary": {
                        "total_connections": len(connections),
                        "avg_latency_overall": round(sum(c["avg_latency"] or 0 for c in connections) / len(connections), 2) if connections else 0,
                        "high_latency_connections": len([c for c in connections if (c["avg_latency"] or 0) > 100])
                    }
                }
                
            finally:
                await release_timescale_connection(conn)
                
        except Exception as e:
            logger.error(f"Failed to get network latency matrix: {str(e)}")
            return {"connections": [], "matrix": {"services": [], "latency_matrix": []}, "summary": {}}

    @staticmethod
    @timescale_error_handler
    async def get_cost_analysis(start_time: datetime = None, end_time: datetime = None, days: int = 30) -> Dict[str, Any]:
        """Get cost analysis data for FinOps dashboards"""
        try:
            conn = await get_timescale_connection()
            try:
                # Daily cost trends
                cost_trends_query = """
                SELECT 
                    DATE(time) as date,
                    resource_type,
                    region,
                    environment,
                    SUM(daily_cost) as total_daily_cost,
                    SUM(estimated_waste) as total_daily_waste,
                    COUNT(DISTINCT resource_id) as resource_count
                FROM cost_metrics
                WHERE time >= NOW() - INTERVAL '%s days'
                GROUP BY DATE(time), resource_type, region, environment
                ORDER BY date, total_daily_cost DESC
                """ % days
                
                cost_trends_rows = await conn.fetch(cost_trends_query)
                cost_trends = [dict(row) for row in cost_trends_rows]
                
                # Resource optimization opportunities
                optimization_query = """
                SELECT 
                    resource_id,
                    resource_type,
                    resource_name,
                    region,
                    environment,
                    AVG(daily_cost) as avg_daily_cost,
                    AVG(estimated_waste) as avg_daily_waste,
                    AVG(optimization_potential) as avg_optimization_potential,
                    MAX(rightsizing_recommendation) as recommendation
                FROM cost_metrics
                WHERE time >= NOW() - INTERVAL '%s days'
                  AND estimated_waste > 0
                GROUP BY resource_id, resource_type, resource_name, region, environment
                HAVING AVG(estimated_waste) > 10  -- Only resources with >$10/day waste
                ORDER BY avg_daily_waste DESC
                LIMIT 50
                """ % days
                
                optimization_rows = await conn.fetch(optimization_query)
                optimization_opportunities = [dict(row) for row in optimization_rows]
                
                # Cost breakdown by resource type
                breakdown_query = """
                SELECT 
                    resource_type,
                    SUM(daily_cost) as total_cost,
                    SUM(estimated_waste) as total_waste,
                    COUNT(DISTINCT resource_id) as resource_count,
                    AVG(daily_cost) as avg_cost_per_resource
                FROM cost_metrics
                WHERE time >= NOW() - INTERVAL '%s days'
                GROUP BY resource_type
                ORDER BY total_cost DESC
                """ % days
                
                breakdown_rows = await conn.fetch(breakdown_query)
                cost_breakdown = [dict(row) for row in breakdown_rows]
                
                # Calculate overall metrics
                total_cost = sum(item["total_cost"] or 0 for item in cost_breakdown)
                total_waste = sum(item["total_waste"] or 0 for item in cost_breakdown)
                waste_percentage = (total_waste / total_cost * 100) if total_cost > 0 else 0
                
                return {
                    "cost_trends": cost_trends,
                    "optimization_opportunities": optimization_opportunities,
                    "cost_breakdown": cost_breakdown,
                    "summary": {
                        "total_daily_cost": total_cost,
                        "total_daily_waste": total_waste,
                        "waste_percentage": round(waste_percentage, 2),
                        "optimization_count": len(optimization_opportunities),
                        "monthly_waste_projection": total_waste * 30
                    }
                }
                
            finally:
                await release_timescale_connection(conn)
                
        except Exception as e:
            logger.error(f"Failed to get cost analysis data: {str(e)}")
            return {"cost_trends": [], "optimization_opportunities": [], "cost_breakdown": [], "summary": {}}

    @staticmethod
    @timescale_error_handler
    async def get_business_value_metrics(start_time: datetime = None, end_time: datetime = None, days: int = 90) -> Dict[str, Any]:
        """Get business value metrics for executive reporting"""
        try:
            conn = await get_timescale_connection()
            try:
                # Business value by category
                category_query = """
                SELECT 
                    category,
                    metric_type,
                    SUM(cost_savings_usd) as total_cost_savings,
                    SUM(time_savings_hours) as total_time_savings,
                    AVG(efficiency_gain_percent) as avg_efficiency_gain,
                    AVG(risk_reduction_score) as avg_risk_reduction,
                    COUNT(*) as initiative_count
                FROM business_value_metrics
                WHERE time >= NOW() - INTERVAL '%s days'
                GROUP BY category, metric_type
                ORDER BY total_cost_savings DESC
                """ % days
                
                category_rows = await conn.fetch(category_query)
                value_by_category = [dict(row) for row in category_rows]
                
                # Monthly trends
                trends_query = """
                SELECT 
                    DATE_TRUNC('month', time) as month,
                    SUM(cost_savings_usd) as monthly_cost_savings,
                    SUM(time_savings_hours) as monthly_time_savings,
                    AVG(efficiency_gain_percent) as avg_efficiency_gain,
                    COUNT(DISTINCT initiative_name) as active_initiatives
                FROM business_value_metrics
                WHERE time >= NOW() - INTERVAL '%s days'
                GROUP BY DATE_TRUNC('month', time)
                ORDER BY month
                """ % days
                
                trends_rows = await conn.fetch(trends_query)
                value_trends = [dict(row) for row in trends_rows]
                
                # Top initiatives
                initiatives_query = """
                SELECT 
                    initiative_name,
                    category,
                    SUM(cost_savings_usd) as total_savings,
                    SUM(time_savings_hours) as total_time_savings,
                    AVG(efficiency_gain_percent) as avg_efficiency_gain,
                    confidence_level,
                    COUNT(*) as measurement_count
                FROM business_value_metrics
                WHERE time >= NOW() - INTERVAL '%s days'
                  AND initiative_name IS NOT NULL
                GROUP BY initiative_name, category, confidence_level
                ORDER BY total_savings DESC
                LIMIT 20
                """ % days
                
                initiatives_rows = await conn.fetch(initiatives_query)
                top_initiatives = [dict(row) for row in initiatives_rows]
                
                # Calculate ROI metrics
                total_cost_savings = sum(item["total_cost_savings"] or 0 for item in value_by_category)
                total_time_savings = sum(item["total_time_savings"] or 0 for item in value_by_category)
                avg_efficiency_gain = sum(item["avg_efficiency_gain"] or 0 for item in value_by_category) / len(value_by_category) if value_by_category else 0
                
                return {
                    "value_by_category": value_by_category,
                    "value_trends": value_trends,
                    "top_initiatives": top_initiatives,
                    "summary": {
                        "total_cost_savings": total_cost_savings,
                        "total_time_savings": total_time_savings,
                        "avg_efficiency_gain": round(avg_efficiency_gain, 2),
                        "annualized_savings": total_cost_savings * (365 / days),
                        "initiative_count": len(top_initiatives)
                    }
                }
                
            finally:
                await release_timescale_connection(conn)
                
        except Exception as e:
            logger.error(f"Failed to get business value metrics: {str(e)}")
            return {"value_by_category": [], "value_trends": [], "top_initiatives": [], "summary": {}}

    @staticmethod
    @timescale_error_handler
    async def get_security_events_summary(start_time: datetime = None, end_time: datetime = None, days: int = 30) -> Dict[str, Any]:
        """Get security events summary for security dashboard"""
        try:
            conn = await get_timescale_connection()
            try:
                # Security events by severity
                severity_query = """
                SELECT 
                    severity,
                    event_type,
                    status,
                    COUNT(*) as event_count,
                    AVG(cvss_score) as avg_cvss_score,
                    AVG(business_impact_score) as avg_business_impact,
                    AVG(resolution_time_hours) as avg_resolution_time
                FROM security_events
                WHERE time >= NOW() - INTERVAL '%s days'
                GROUP BY severity, event_type, status
                ORDER BY 
                    CASE severity 
                        WHEN 'critical' THEN 1
                        WHEN 'high' THEN 2
                        WHEN 'medium' THEN 3
                        WHEN 'low' THEN 4
                    END,
                    event_count DESC
                """ % days
                
                severity_rows = await conn.fetch(severity_query)
                events_by_severity = [dict(row) for row in severity_rows]
                
                # Daily trends
                trends_query = """
                SELECT 
                    DATE(time) as date,
                    severity,
                    COUNT(*) as daily_count
                FROM security_events
                WHERE time >= NOW() - INTERVAL '%s days'
                GROUP BY DATE(time), severity
                ORDER BY date
                """ % days
                
                trends_rows = await conn.fetch(trends_query)
                security_trends = [dict(row) for row in trends_rows]
                
                # Top affected resources
                resources_query = """
                SELECT 
                    resource_type,
                    service_name,
                    cluster_name,
                    region,
                    COUNT(*) as event_count,
                    COUNT(CASE WHEN severity = 'critical' THEN 1 END) as critical_count,
                    COUNT(CASE WHEN severity = 'high' THEN 1 END) as high_count,
                    AVG(cvss_score) as avg_cvss_score
                FROM security_events
                WHERE time >= NOW() - INTERVAL '%s days'
                GROUP BY resource_type, service_name, cluster_name, region
                ORDER BY event_count DESC, critical_count DESC
                LIMIT 20
                """ % days
                
                resources_rows = await conn.fetch(resources_query)
                affected_resources = [dict(row) for row in resources_rows]
                
                # Calculate summary metrics
                total_events = sum(item["event_count"] for item in events_by_severity)
                critical_events = sum(item["event_count"] for item in events_by_severity if item["severity"] == "critical")
                open_events = sum(item["event_count"] for item in events_by_severity if item["status"] == "open")
                
                return {
                    "events_by_severity": events_by_severity,
                    "security_trends": security_trends,
                    "affected_resources": affected_resources,
                    "summary": {
                        "total_events": total_events,
                        "critical_events": critical_events,
                        "open_events": open_events,
                        "resolution_rate": ((total_events - open_events) / total_events * 100) if total_events > 0 else 0
                    }
                }
                
            finally:
                await release_timescale_connection(conn)
                
        except Exception as e:
            logger.error(f"Failed to get security events summary: {str(e)}")
            return {"events_by_severity": [], "security_trends": [], "affected_resources": [], "summary": {}}

    @staticmethod
    @timescale_error_handler
    async def get_incident_analysis(start_time: datetime = None, end_time: datetime = None, days: int = 90) -> Dict[str, Any]:
        """Get incident analysis for operational dashboards"""
        try:
            conn = await get_timescale_connection()
            try:
                # Incident metrics by type and severity
                incidents_query = """
                SELECT 
                    incident_type,
                    severity,
                    status,
                    COUNT(*) as incident_count,
                    AVG(duration_minutes) as avg_duration,
                    AVG(detection_time_minutes) as avg_detection_time,
                    AVG(resolution_time_minutes) as avg_resolution_time,
                    SUM(affected_users) as total_affected_users,
                    SUM(revenue_impact) as total_revenue_impact,
                    COUNT(CASE WHEN preventable THEN 1 END) as preventable_incidents
                FROM incident_metrics
                WHERE time >= NOW() - INTERVAL '%s days'
                GROUP BY incident_type, severity, status
                ORDER BY total_revenue_impact DESC, avg_duration DESC
                """ % days
                
                incidents_rows = await conn.fetch(incidents_query)
                incident_analysis = [dict(row) for row in incidents_rows]
                
                # MTTR (Mean Time To Resolution) trends
                mttr_query = """
                SELECT 
                    DATE_TRUNC('week', time) as week,
                    incident_type,
                    AVG(resolution_time_minutes) as avg_resolution_time,
                    COUNT(*) as incident_count
                FROM incident_metrics
                WHERE time >= NOW() - INTERVAL '%s days'
                  AND status = 'resolved'
                GROUP BY DATE_TRUNC('week', time), incident_type
                ORDER BY week
                """ % days
                
                mttr_rows = await conn.fetch(mttr_query)
                mttr_trends = [dict(row) for row in mttr_rows]
                
                # Root cause analysis
                root_cause_query = """
                SELECT 
                    root_cause_category,
                    COUNT(*) as incident_count,
                    AVG(duration_minutes) as avg_duration,
                    SUM(revenue_impact) as total_impact,
                    COUNT(CASE WHEN preventable THEN 1 END) as preventable_count
                FROM incident_metrics
                WHERE time >= NOW() - INTERVAL '%s days'
                  AND root_cause_category IS NOT NULL
                GROUP BY root_cause_category
                ORDER BY incident_count DESC
                """ % days
                
                root_cause_rows = await conn.fetch(root_cause_query)
                root_cause_analysis = [dict(row) for row in root_cause_rows]
                
                # Calculate summary metrics
                total_incidents = sum(item["incident_count"] for item in incident_analysis)
                total_revenue_impact = sum(item["total_revenue_impact"] or 0 for item in incident_analysis)
                preventable_incidents = sum(item["preventable_incidents"] or 0 for item in incident_analysis)
                
                return {
                    "incident_analysis": incident_analysis,
                    "mttr_trends": mttr_trends,
                    "root_cause_analysis": root_cause_analysis,
                    "summary": {
                        "total_incidents": total_incidents,
                        "total_revenue_impact": total_revenue_impact,
                        "preventable_incidents": preventable_incidents,
                        "prevention_opportunity": (preventable_incidents / total_incidents * 100) if total_incidents > 0 else 0
                    }
                }
                
            finally:
                await release_timescale_connection(conn)
                
        except Exception as e:
            logger.error(f"Failed to get incident analysis: {str(e)}")
            return {"incident_analysis": [], "mttr_trends": [], "root_cause_analysis": [], "summary": {}}

def _calculate_trend(values: List[float]) -> str:
    """Calculate trend direction from time series values"""
    if len(values) < 2:
        return "stable"
    
    # Simple linear regression to determine trend
    n = len(values)
    x_sum = sum(range(n))
    y_sum = sum(values)
    xy_sum = sum(i * values[i] for i in range(n))
    x_squared_sum = sum(i * i for i in range(n))
    
    # Calculate slope
    slope = (n * xy_sum - x_sum * y_sum) / (n * x_squared_sum - x_sum * x_sum)
    
    # Determine trend based on slope
    if slope > 0.1:  # Threshold for increasing trend
        return "increasing"
    elif slope < -0.1:  # Threshold for decreasing trend
        return "decreasing"
    else:
        return "stable"

    @staticmethod
    @timescale_error_handler
    async def get_node_metrics(node_id: str, hours: int = 24) -> Dict[str, Any]:
        """Get latest metrics for a specific infrastructure node"""
        
        conn = None
        try:
            conn = await get_timescale_connection()
            
            # Query multiple metric tables for comprehensive node data
            node_metrics = {}
            
            # System metrics (CPU, Memory, Disk)
            system_query = """
            SELECT 
                time,
                cpu_utilization,
                memory_utilization,
                disk_utilization,
                network_in,
                network_out
            FROM system_metrics 
            WHERE node_id = $1 
              AND time >= NOW() - INTERVAL '%s hours'
            ORDER BY time DESC
            LIMIT 10
            """ % hours
            
            system_rows = await conn.fetch(system_query, node_id)
            node_metrics["system"] = [dict(row) for row in system_rows]
            
            # Application metrics (Response time, Throughput, Errors)
            app_query = """
            SELECT 
                time,
                response_time,
                throughput,
                error_rate,
                active_connections
            FROM application_metrics 
            WHERE service_id = $1 
              AND time >= NOW() - INTERVAL '%s hours'
            ORDER BY time DESC
            LIMIT 10
            """ % hours
            
            app_rows = await conn.fetch(app_query, node_id)
            node_metrics["application"] = [dict(row) for row in app_rows]
            
            # Database metrics if it's a database node
            db_query = """
            SELECT 
                time,
                connections_active,
                queries_per_second,
                slow_queries,
                cache_hit_ratio,
                replication_lag
            FROM database_metrics 
            WHERE db_instance_id = $1 
              AND time >= NOW() - INTERVAL '%s hours'
            ORDER BY time DESC
            LIMIT 10
            """ % hours
            
            db_rows = await conn.fetch(db_query, node_id)
            node_metrics["database"] = [dict(row) for row in db_rows]
            
            # Container metrics if it's a container/pod
            container_query = """
            SELECT 
                time,
                cpu_utilization,
                memory_utilization,
                restart_count,
                ready_replicas,
                desired_replicas
            FROM container_metrics 
            WHERE pod_id = $1 
              AND time >= NOW() - INTERVAL '%s hours'
            ORDER BY time DESC
            LIMIT 10
            """ % hours
            
            container_rows = await conn.fetch(container_query, node_id)
            node_metrics["container"] = [dict(row) for row in container_rows]
            
            # Aggregate latest values for quick access
            latest_metrics = {}
            
            # Get most recent non-null values from each category
            for category, metrics_list in node_metrics.items():
                if metrics_list:
                    latest = metrics_list[0]  # Most recent entry
                    for key, value in latest.items():
                        if key != 'time' and value is not None:
                            latest_metrics[f"{category}_{key}"] = value
            
            return {
                "node_id": node_id,
                "metrics": latest_metrics,
                "historical": node_metrics,
                "hours_requested": hours,
                "timestamp": datetime.utcnow().isoformat()
            }
            
        finally:
            if conn:
                await release_timescale_connection(conn)

    @staticmethod
    @timescale_error_handler
    async def execute_query(query: str, params: tuple = None) -> List[Dict[str, Any]]:
        """Execute a raw SQL query against TimescaleDB"""
        try:
            conn = await get_timescale_connection()
            try:
                if params:
                    rows = await conn.fetch(query, *params)
                else:
                    rows = await conn.fetch(query)
                return [dict(row) for row in rows]
                
            finally:
                await release_timescale_connection(conn)
                
        except Exception as e:
            logger.error(f"Failed to execute query: {str(e)}")
            return []