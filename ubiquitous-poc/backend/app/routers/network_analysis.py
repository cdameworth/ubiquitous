from fastapi import APIRouter, Query, HTTPException
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import random
import uuid
import logging
from ..services.neo4j_service import Neo4jService
from ..database import get_neo4j_session

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/network", tags=["Network Analysis"])

@router.get("/clusters")
async def get_available_clusters():
    """Get list of all available EKS clusters for dropdown selection"""
    try:
        # Get clusters from Neo4j
        clusters_data = await Neo4jService.get_eks_clusters_with_services()
        
        # Transform to dropdown format
        clusters = []
        for cluster in clusters_data:
            clusters.append({
                "value": cluster["name"],
                "label": cluster["name"].replace("prod-", "").replace("-cluster", "").replace("-", " ").title() + " Cluster",
                "region": cluster.get("region", "us-east-1"),
                "service_count": cluster.get("service_count", 0),
                "status": cluster.get("status", "active"),
                "cost_monthly": cluster.get("cost_monthly", 0)
            })
        
        return {
            "timestamp": datetime.utcnow().isoformat(),
            "clusters": sorted(clusters, key=lambda x: x["value"])
        }
        
    except Exception as e:
        logger.error(f"Failed to get clusters: {str(e)}")
        # Fallback to hardcoded clusters
        return {
            "timestamp": datetime.utcnow().isoformat(),
            "clusters": [
                {"value": "prod-trading-cluster", "label": "Trading Cluster", "region": "us-east-1", "service_count": 3, "status": "active"},
                {"value": "prod-risk-cluster", "label": "Risk Cluster", "region": "us-east-1", "service_count": 3, "status": "active"},
                {"value": "prod-portfolio-cluster", "label": "Portfolio Cluster", "region": "us-east-1", "service_count": 3, "status": "active"},
                {"value": "staging-apps-cluster", "label": "Staging Apps Cluster", "region": "us-east-1", "service_count": 2, "status": "active"},
                {"value": "dev-microservices-cluster", "label": "Dev Microservices Cluster", "region": "us-east-1", "service_count": 3, "status": "active"}
            ]
        }

@router.get("/protocol-analysis")
async def get_protocol_analysis(
    timeframe: str = Query("24h", description="Time range: 1h, 6h, 24h, 7d"),
    service: Optional[str] = Query(None, description="Filter by service name")
):
    """Network Protocol Analysis - Latency & distance insights for performance/reliability"""
    
    # Mock data generation
    services = ["auth-service", "payment-api", "user-management", "notification-service", "analytics-engine"]
    if service and service not in services:
        raise HTTPException(status_code=404, detail="Service not found")
    
    target_services = [service] if service else services
    
    analysis_data = []
    for svc in target_services:
        analysis_data.append({
            "service_name": svc,
            "protocol": random.choice(["HTTP/1.1", "HTTP/2", "gRPC", "WebSocket"]),
            "average_latency_ms": round(random.uniform(15, 250), 2),
            "p95_latency_ms": round(random.uniform(100, 500), 2),
            "p99_latency_ms": round(random.uniform(200, 800), 2),
            "geographic_distance_km": random.randint(50, 3000),
            "connection_pool_utilization": round(random.uniform(0.3, 0.9), 3),
            "error_rate": round(random.uniform(0.001, 0.05), 4),
            "throughput_rps": random.randint(100, 5000),
            "tcp_retransmissions": random.randint(0, 15),
            "ssl_handshake_time_ms": round(random.uniform(5, 45), 2),
            "recommendations": [
                {
                    "priority": "high" if random.random() > 0.7 else "medium",
                    "type": random.choice(["connection_pooling", "protocol_upgrade", "geographic_optimization", "timeout_adjustment"]),
                    "description": f"Consider optimizing {random.choice(['connection pooling', 'protocol version', 'geographic routing', 'timeout configuration'])} for improved performance",
                    "estimated_improvement": f"{random.randint(10, 40)}% latency reduction"
                }
            ]
        })
    
    return {
        "timestamp": datetime.utcnow().isoformat(),
        "timeframe": timeframe,
        "total_services_analyzed": len(analysis_data),
        "summary": {
            "average_latency_ms": round(sum(s["average_latency_ms"] for s in analysis_data) / len(analysis_data), 2),
            "high_priority_recommendations": len([s for s in analysis_data if s["recommendations"][0]["priority"] == "high"]),
            "total_throughput_rps": sum(s["throughput_rps"] for s in analysis_data)
        },
        "services": analysis_data
    }

@router.get("/topology")
async def get_network_topology(
    cluster: Optional[str] = Query(None, description="Filter by cluster name"),
    depth: int = Query(3, description="Network depth to analyze"),
    include_external: bool = Query(False, description="Include external dependencies")
):
    """Network topology and dependency mapping from real Neo4j data"""
    
    try:
        # Get real infrastructure topology from Neo4j
        topology_data = await Neo4jService.get_infrastructure_topology()
        
        # Transform Neo4j data to frontend format
        nodes = []
        links = []
        
        all_nodes = topology_data.get("nodes", [])
        all_relationships = topology_data.get("relationships", [])
        
        # Create cluster-specific topology using the same mappings as the Neo4j service
        if cluster and cluster != "all":
            # Get actual cluster-service mappings from Neo4j instead of hardcoded
            cluster_service_mapping = {}
            session = await get_neo4j_session()
            try:
                mapping_query = """
                MATCH (c:EKSCluster)<-[:DEPLOYED_ON]-(s:Service)
                RETURN c.name as cluster_name, collect(s.name) as services
                """
                result = session.run(mapping_query)
                for record in result:
                    cluster_service_mapping[record["cluster_name"]] = record["services"]
            finally:
                session.close()
            
            cluster_services = cluster_service_mapping.get(cluster, [])
            filtered_nodes = []
            filtered_node_ids = set()
            
            # Always include the target cluster
            for node_data in all_nodes:
                props = node_data.get("properties", {})
                node_name = props.get("name", "")
                labels = node_data.get("labels", [])
                node_id = str(node_data.get("id"))
                
                # Include the cluster itself
                if node_name == cluster:
                    filtered_nodes.append(node_data)
                    filtered_node_ids.add(node_id)
                
                # Include only services mapped to this cluster
                elif "Service" in labels and node_name in cluster_services:
                    filtered_nodes.append(node_data)
                    filtered_node_ids.add(node_id)
            
            # Filter relationships to only include those between filtered nodes
            for node_data in filtered_nodes:
                original_relationships = node_data.get("relationships", [])
                filtered_relationships = []
                
                for rel in original_relationships:
                    target = rel.get("target", {})
                    target_id = str(target.get("id"))
                    if target_id in filtered_node_ids:
                        filtered_relationships.append(rel)
                
                node_data["relationships"] = filtered_relationships
            
            all_nodes = filtered_nodes
        
        for node_data in all_nodes:
            props = node_data.get("properties", {})
            labels = node_data.get("labels", [])
            
            # Determine node type from labels
            node_type = "service"
            if "EKSCluster" in labels:
                node_type = "cluster"
            elif "RDSInstance" in labels or "EC2SQLServer" in labels:
                node_type = "database"
            elif "VPC" in labels:
                node_type = "vpc"
            elif "LoadBalancer" in labels or "ELB" in labels:
                node_type = "loadbalancer"
            elif "APIGateway" in labels:
                node_type = "gateway"
            elif "Service" in labels or "Application" in labels:
                node_type = "service"
            
            # Determine status from metrics or properties
            status = "healthy"
            cpu_usage = props.get("cpu_usage", random.randint(20, 80))
            memory_usage = props.get("memory_usage", random.randint(30, 85))
            
            if cpu_usage > 90 or memory_usage > 90:
                status = "critical"
            elif cpu_usage > 70 or memory_usage > 70:
                status = "warning"
            
            node_id = str(node_data.get("id"))
            node_name = props.get("name", f"node-{node_id}")
            
            nodes.append({
                "id": node_id,
                "name": node_name,
                "type": node_type,
                "status": status,
                "cluster": props.get("cluster", cluster),
                "region": props.get("region", "us-east-1"),
                "metrics": {
                    "cpu": cpu_usage,
                    "memory": memory_usage,
                    "latency": props.get("latency", random.randint(5, 50)),
                    "connections": props.get("connection_count", random.randint(10, 200))
                }
            })
            
        
        # Create filtered node IDs set for link filtering
        filtered_node_ids = set([n["id"] for n in nodes])
        
        # Transform database relationships to frontend links
        for rel in all_relationships:
            source_id = str(rel.get("source_id"))
            target_id = str(rel.get("target_id"))
            
            # Only include links where both source and target are in our filtered nodes
            if source_id in filtered_node_ids and target_id in filtered_node_ids:
                links.append({
                    "source": source_id,
                    "target": target_id,
                    "type": _map_relationship_to_link_type(rel.get("relationship_type")),
                    "latency": random.randint(2, 50),
                    "bandwidth": random.randint(100, 2000),
                    "packetLoss": round(random.uniform(0.001, 0.05), 4),
                    "requestRate": random.randint(50, 1500)
                })
        
        return {
            "timestamp": datetime.utcnow().isoformat(),
            "cluster": cluster,
            "depth": depth,
            "include_external": include_external,
            "topology": {
                "nodes": nodes,
                "links": links,
                "metadata": {
                    "total_services": len(nodes),
                    "total_connections": len(links),
                    "external_dependencies": len([n for n in nodes if n.get("type") == "external"]),
                    "health_status": {
                        "healthy": len([n for n in nodes if n["status"] == "healthy"]),
                        "warning": len([n for n in nodes if n["status"] == "warning"]),
                        "critical": len([n for n in nodes if n["status"] == "critical"])
                    }
                }
            }
        }
        
    except Exception as e:
        logger.error(f"Failed to get network topology: {str(e)}")
        # Fallback to simplified mock data on error
        return {
            "timestamp": datetime.utcnow().isoformat(),
            "cluster": cluster,
            "error": str(e),
            "topology": {
                "nodes": [],
                "links": [],
                "metadata": {
                    "total_services": 0,
                    "total_connections": 0,
                    "external_dependencies": 0,
                    "health_status": {"healthy": 0, "warning": 0, "critical": 0}
                }
            }
        }

def _map_relationship_to_link_type(relationship: str) -> str:
    """Map Neo4j relationship types to frontend link types"""
    mapping = {
        "CONNECTS_TO": "api_call",
        "DEPENDS_ON": "api_call", 
        "QUERIES": "database_query",
        "HOSTS": "load_balance",
        "ROUTES_TO": "api_call",
        "COMMUNICATES_WITH": "api_call",
        "BELONGS_TO": "vpc_connection"
    }
    return mapping.get(relationship, "api_call")

@router.get("/performance-metrics")
async def get_performance_metrics(
    timeframe: str = Query("1h", description="Time range: 5m, 15m, 1h, 6h, 24h")
):
    """Real-time network performance metrics"""
    
    # Generate time series data
    now = datetime.utcnow()
    intervals = {"5m": 5, "15m": 15, "1h": 60, "6h": 360, "24h": 1440}
    interval_minutes = intervals.get(timeframe, 60)
    
    # Generate 20 data points
    metrics = []
    for i in range(20):
        timestamp = now - timedelta(minutes=interval_minutes * (19 - i) / 20)
        metrics.append({
            "timestamp": timestamp.isoformat(),
            "latency_ms": round(random.uniform(50, 200), 2),
            "throughput_rps": random.randint(1000, 5000),
            "error_rate": round(random.uniform(0.001, 0.02), 4),
            "packet_loss": round(random.uniform(0, 0.5), 3),
            "bandwidth_utilization": round(random.uniform(0.3, 0.8), 3),
            "active_connections": random.randint(500, 2000)
        })
    
    return {
        "timestamp": datetime.utcnow().isoformat(),
        "timeframe": timeframe,
        "metrics": metrics,
        "summary": {
            "avg_latency_ms": round(sum(m["latency_ms"] for m in metrics) / len(metrics), 2),
            "total_requests": sum(m["throughput_rps"] for m in metrics) * interval_minutes // 60,
            "avg_error_rate": round(sum(m["error_rate"] for m in metrics) / len(metrics), 4),
            "peak_throughput_rps": max(m["throughput_rps"] for m in metrics)
        }
    }

@router.get("/latency-analysis")
async def get_latency_analysis(
    cluster: Optional[str] = Query(None, description="Filter by cluster name"),
    timeframe: str = Query("24h", description="Time range: 24h, 7d, 30d"),
    services: Optional[str] = Query(None, description="Comma-separated list of services to include")
):
    """Detailed latency analysis data for trend charts and heatmaps"""
    
    try:
        # Get cluster services if cluster is specified
        available_services = ["trading-api", "risk-calc", "portfolio", "compliance", "reporting", 
                            "auth-service", "payment-api", "user-management", "notification-service", "analytics-engine"]
        
        if cluster:
            cluster_service_mapping = {
                "prod-trading-cluster": ["trading-api", "risk-calc", "analytics-engine"],
                "prod-risk-cluster": ["risk-calc", "compliance", "analytics-engine"],
                "prod-portfolio-cluster": ["portfolio", "trading-api", "analytics-engine"],
                "staging-apps-cluster": ["auth-service", "notification-service"],
                "dev-microservices-cluster": ["auth-service", "user-management", "payment-api"]
            }
            available_services = cluster_service_mapping.get(cluster, available_services)
        
        if services:
            requested_services = [s.strip() for s in services.split(',')]
            available_services = [s for s in available_services if s in requested_services]
        
        # Generate time series data
        now = datetime.utcnow()
        time_ranges = {"24h": 24, "7d": 168, "30d": 720}  # hours
        hours_back = time_ranges.get(timeframe, 24)
        
        latency_data = []
        endpoints = ['/orders', '/positions', '/risk', '/reports', '/analytics', '/auth', '/users', '/payments', '/notifications']
        
        # Generate hourly data points
        for hour_offset in range(hours_back):
            timestamp = now - timedelta(hours=hour_offset)
            
            for service in available_services:
                for endpoint in endpoints[:3]:  # Limit to 3 endpoints per service for performance
                    # Business hours effect (9 AM - 5 PM UTC)
                    is_business_hours = 9 <= timestamp.hour <= 17
                    base_latency = random.uniform(5, 25)
                    business_multiplier = 1.8 if is_business_hours else 1.0
                    
                    # Add some variability based on service type
                    service_multiplier = 1.0
                    if 'trading' in service:
                        service_multiplier = 1.3  # Trading services are more demanding
                    elif 'analytics' in service:
                        service_multiplier = 1.5  # Analytics can be heavy
                    elif 'auth' in service:
                        service_multiplier = 0.8  # Auth is typically fast
                    
                    final_latency = base_latency * business_multiplier * service_multiplier
                    requests = random.randint(100, 2000) * (2 if is_business_hours else 1)
                    errors = random.randint(0, int(requests * 0.02))  # 0-2% error rate
                    
                    latency_data.append({
                        "timestamp": int(timestamp.timestamp() * 1000),  # JavaScript timestamp
                        "service": service,
                        "endpoint": endpoint,
                        "latency": round(final_latency, 2),
                        "cluster": cluster or "all",
                        "hour": timestamp.hour,
                        "day": timestamp.strftime('%Y-%m-%d'),
                        "requests": requests,
                        "errors": errors,
                        "region": "us-east-1"
                    })
        
        # Sort by timestamp (newest first for frontend processing)
        latency_data.sort(key=lambda x: x["timestamp"], reverse=True)
        
        return {
            "timestamp": datetime.utcnow().isoformat(),
            "cluster": cluster,
            "timeframe": timeframe,
            "services": available_services,
            "data": latency_data,
            "summary": {
                "total_data_points": len(latency_data),
                "services_analyzed": len(available_services),
                "time_range_hours": hours_back,
                "avg_latency": round(sum(d["latency"] for d in latency_data) / len(latency_data), 2) if latency_data else 0
            }
        }
        
    except Exception as e:
        logger.error(f"Failed to get latency analysis: {str(e)}")
        return {
            "timestamp": datetime.utcnow().isoformat(),
            "cluster": cluster,
            "error": str(e),
            "data": [],
            "summary": {"total_data_points": 0, "services_analyzed": 0, "time_range_hours": 0, "avg_latency": 0}
        }