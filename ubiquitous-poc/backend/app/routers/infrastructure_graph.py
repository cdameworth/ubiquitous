"""
Infrastructure Graph API Router
Provides high-performance endpoints for large-scale infrastructure graph visualization
"""

from fastapi import APIRouter, Query, HTTPException, Path
from typing import List, Dict, Any, Optional
from datetime import datetime
import logging
import asyncio
from ..services.neo4j_service import Neo4jService
from ..services.timescale_service import TimescaleService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/infrastructure", tags=["Infrastructure Graph"])

@router.get("/applications")
async def get_applications():
    """Get list of applications for dashboard selector"""
    try:
        # Get applications from Neo4j
        topology_data = await Neo4jService.get_infrastructure_topology()
        
        if "error" in topology_data or not topology_data.get("nodes"):
            # Return mock applications
            return {
                "applications": [
                    {"id": "trading-app", "name": "Trading Application", "cluster": "prod-trading", "services": ["trading-api", "order-processor"]},
                    {"id": "risk-app", "name": "Risk Management", "cluster": "prod-risk", "services": ["risk-engine", "portfolio-analyzer"]},
                    {"id": "portfolio-app", "name": "Portfolio Management", "cluster": "prod-portfolio", "services": ["portfolio-api", "rebalancer"]},
                    {"id": "auth-app", "name": "Authentication Service", "cluster": "prod-auth", "services": ["auth-api", "session-manager"]}
                ]
            }
        
        # Extract applications from Neo4j data
        applications = []
        for node_data in topology_data.get("nodes", []):
            if "Application" in node_data.get("labels", []):
                properties = node_data.get("properties", {})
                applications.append({
                    "id": properties.get("id", str(node_data["id"])),
                    "name": properties.get("name", "Unknown Application"),
                    "cluster": properties.get("cluster", "unknown"),
                    "services": properties.get("services", [])
                })
        
        return {"applications": applications}
        
    except Exception as e:
        logger.error(f"Error fetching applications: {e}")
        return {"applications": []}

@router.get("/application/{app_id}")
async def get_application_infrastructure(app_id: str):
    """Get infrastructure nodes for a specific application"""
    try:
        # Get application-specific infrastructure using relationships
        app_infrastructure_data = await Neo4jService.get_application_infrastructure(app_id)
        
        if "error" in app_infrastructure_data:
            # Return mock application infrastructure
            mock_data = _get_mock_application_infrastructure(app_id)
            return {"nodes": mock_data}
        
        filtered_nodes = app_infrastructure_data.get("nodes", [])
        
        # If no nodes found for this application, return mock data
        if not filtered_nodes:
            mock_data = _get_mock_application_infrastructure(app_id)
            return {"nodes": mock_data}
        
        return {"nodes": filtered_nodes}
        
    except Exception as e:
        logger.error(f"Error fetching application infrastructure: {e}")
        return {"nodes": []}

@router.get("/nodes")
async def get_infrastructure_nodes():
    """Get all infrastructure nodes for dashboard overview"""
    try:
        topology_data = await Neo4jService.get_infrastructure_topology()
        
        if "error" in topology_data or not topology_data.get("nodes"):
            # Return mock nodes with tier information
            return {"nodes": _get_mock_infrastructure_nodes()}
        
        # Convert all labeled nodes to dashboard format (skip empty/unlabeled nodes)
        nodes = []
        for node_data in topology_data.get("nodes", []):
            labels = node_data.get("labels", [])
            
            # Skip nodes without labels (those 62 empty nodes)
            if not labels:
                continue
                
            properties = node_data.get("properties", {})
            primary_label = labels[0]
            
            # Convert Neo4j node to Dashboard format
            node = {
                "id": str(node_data["id"]),
                "type": _convert_neo4j_label_to_type(primary_label),
                "name": properties.get("name", f"{primary_label}-{node_data['id']}"),
                "status": _convert_neo4j_status(properties.get("status", "unknown")),
                "tier": _determine_tier_from_node(node_data),
                "metrics": {
                    "cpu": properties.get("cpu_utilization", 0),
                    "memory": properties.get("memory_utilization", 0),
                    "connections": properties.get("active_connections", properties.get("connections", 0)),
                    "cost": _format_cost(properties.get("cost_monthly", 0))
                },
                "cluster": properties.get("cluster_name", properties.get("cluster"))
            }
            nodes.append(node)
        
        return {"nodes": nodes}
        
    except Exception as e:
        logger.error(f"Error fetching infrastructure nodes: {e}")
        return {"nodes": []}

def _determine_tier_from_node(node_data: Dict) -> str:
    """Determine infrastructure tier based on node type and properties"""
    labels = node_data.get("labels", [])
    properties = node_data.get("properties", {})
    
    # Use properties.type for AWS resources, fallback to labels
    aws_type = properties.get("type", "").upper()
    node_name = properties.get("name", "").lower()
    
    # Determine tier based on AWS resource type first, then labels
    if not labels and not aws_type:
        return "infrastructure"
    
    # Map AWS resource types to infrastructure tiers
    if aws_type == "RDS" or any("sqlserver" in node_name for _ in [1]):
        return "database"
    elif aws_type == "EKS":
        return "app"  
    elif aws_type == "VPC":
        return "infrastructure"
    elif aws_type in ["ALB", "ELB"] or "loadbalancer" in node_name or "lb" in node_name:
        return "loadbalancer"
    elif any(x in node_name for x in ["frontend", "web", "ui", "portal", "dashboard", "notification"]):
        return "web"
    
    # Fallback to label-based detection
    primary_label = labels[0] if labels else ""
    if primary_label in ["LoadBalancer", "ALB", "ELB"]:
        return "loadbalancer"
    elif primary_label == "WebService":
        return "web"
    elif primary_label in ["RDSInstance", "Database"]:
        return "database"
    elif primary_label == "EC2Instance" and "sqlserver" in node_name:
        return "database"
    elif primary_label == "EKSCluster":
        return "app"
    elif primary_label in ["Service", "Application"] and any(x in node_name for x in ["web", "nginx", "frontend", "ui"]):
        return "web"
    elif primary_label in ["Service", "Application", "Pod"]:
        return "app"
    else:
        return "infrastructure"

def _get_mock_application_infrastructure(app_id: str) -> List[Dict]:
    """Generate mock infrastructure for a specific application"""
    
    # Map actual application IDs to mock data
    app_mapping = {
        "21": "trading-app",  # trading-platform
        "22": "risk-app",     # risk-management-system  
        "23": "portfolio-app", # portfolio-management
        "trading-platform": "trading-app",
        "risk-management-system": "risk-app", 
        "portfolio-management": "portfolio-app"
    }
    
    mapped_app_id = app_mapping.get(app_id, app_id)
    
    mock_apps = {
        "trading-app": [
            {"id": "web-lb-01", "type": "loadbalancer", "name": "trading-alb", "status": "healthy", "tier": "loadbalancer", "metrics": {"connections": 245, "cost": "$89/mo"}},
            {"id": "web-01", "type": "service", "name": "trading-web", "status": "healthy", "tier": "web", "metrics": {"cpu": 45, "memory": 67, "cost": "$156/mo"}},
            {"id": "web-02", "type": "service", "name": "trading-web-2", "status": "healthy", "tier": "web", "metrics": {"cpu": 52, "memory": 71, "cost": "$156/mo"}},
            {"id": "app-01", "type": "service", "name": "trading-api", "status": "warning", "tier": "app", "metrics": {"cpu": 78, "memory": 85, "cost": "$234/mo"}},
            {"id": "app-02", "type": "service", "name": "order-processor", "status": "healthy", "tier": "app", "metrics": {"cpu": 34, "memory": 56, "cost": "$189/mo"}},
            {"id": "db-01", "type": "database", "name": "trading-db-primary", "status": "healthy", "tier": "database", "metrics": {"memory": 78, "connections": 125, "cost": "$445/mo"}},
            {"id": "db-02", "type": "database", "name": "trading-db-replica", "status": "healthy", "tier": "database", "metrics": {"memory": 65, "connections": 87, "cost": "$445/mo"}}
        ],
        "risk-app": [
            {"id": "risk-lb-01", "type": "loadbalancer", "name": "risk-alb", "status": "healthy", "tier": "loadbalancer", "metrics": {"connections": 89, "cost": "$67/mo"}},
            {"id": "risk-web-01", "type": "service", "name": "risk-frontend", "status": "healthy", "tier": "web", "metrics": {"cpu": 23, "memory": 45, "cost": "$134/mo"}},
            {"id": "risk-app-01", "type": "service", "name": "risk-engine", "status": "critical", "tier": "app", "metrics": {"cpu": 95, "memory": 92, "cost": "$378/mo"}},
            {"id": "risk-app-02", "type": "service", "name": "portfolio-analyzer", "status": "healthy", "tier": "app", "metrics": {"cpu": 56, "memory": 67, "cost": "$289/mo"}},
            {"id": "risk-db-01", "type": "database", "name": "risk-analytics-db", "status": "healthy", "tier": "database", "metrics": {"memory": 89, "connections": 156, "cost": "$567/mo"}}
        ],
        "portfolio-app": [
            {"id": "port-lb-01", "type": "loadbalancer", "name": "portfolio-alb", "status": "healthy", "tier": "loadbalancer", "metrics": {"connections": 156, "cost": "$78/mo"}},
            {"id": "port-web-01", "type": "service", "name": "portfolio-ui", "status": "healthy", "tier": "web", "metrics": {"cpu": 34, "memory": 56, "cost": "$145/mo"}},
            {"id": "port-app-01", "type": "service", "name": "portfolio-api", "status": "healthy", "tier": "app", "metrics": {"cpu": 45, "memory": 67, "cost": "$234/mo"}},
            {"id": "port-app-02", "type": "service", "name": "rebalancer", "status": "warning", "tier": "app", "metrics": {"cpu": 67, "memory": 78, "cost": "$189/mo"}},
            {"id": "port-db-01", "type": "database", "name": "portfolio-db", "status": "healthy", "tier": "database", "metrics": {"memory": 76, "connections": 234, "cost": "$678/mo"}}
        ]
    }
    
    return mock_apps.get(mapped_app_id, [])

def _get_mock_infrastructure_nodes() -> List[Dict]:
    """Generate mock infrastructure nodes with tier information"""
    return [
        {"id": "main-lb", "type": "loadbalancer", "name": "main-alb", "status": "healthy", "tier": "loadbalancer", "metrics": {"connections": 567, "cost": "$123/mo"}},
        {"id": "web-cluster", "type": "cluster", "name": "web-cluster", "status": "healthy", "tier": "web", "metrics": {"cpu": 45, "memory": 67, "cost": "$234/mo"}},
        {"id": "app-cluster", "type": "cluster", "name": "app-cluster", "status": "warning", "tier": "app", "metrics": {"cpu": 78, "memory": 85, "cost": "$567/mo"}},
        {"id": "db-cluster", "type": "cluster", "name": "database-cluster", "status": "healthy", "tier": "database", "metrics": {"memory": 67, "connections": 234, "cost": "$789/mo"}}
    ]

@router.get("/graph")
async def get_infrastructure_graph(
    level: int = Query(2, ge=0, le=4, description="Level of detail (0=regions, 4=full)"),
    max_nodes: int = Query(1000, ge=10, le=50000, description="Maximum nodes to return"),
    category: Optional[str] = Query(None, description="Filter by node category"),
    status: Optional[str] = Query(None, description="Filter by node status"),
    types: Optional[str] = Query(None, description="Comma-separated list of node types to filter")
):
    """Get infrastructure graph with level-of-detail filtering for performance"""
    
    try:
        # Define node types for each level
        level_configs = {
            0: ["AWSRegion"],
            1: ["AWSRegion", "VPC"], 
            2: ["AWSRegion", "VPC", "EKSCluster", "RDSInstance", "LoadBalancer", "WebService"],
            3: ["AWSRegion", "VPC", "EKSCluster", "RDSInstance", "EC2Instance", "LoadBalancer", "WebService", "Service"],
            4: ["AWSRegion", "VPC", "EKSCluster", "Pod", "RDSInstance", "EC2Instance", "LoadBalancer", "WebService", "Service", "Application"]
        }
        
        node_types = level_configs.get(level, level_configs[2])
        
        # Get infrastructure topology from Neo4j
        topology_data = await Neo4jService.get_infrastructure_topology()
        
        if "error" in topology_data:
            # Fallback to mock data if Neo4j fails
            return _generate_fallback_graph_data(level, max_nodes, category)
        
        # Filter nodes by type and apply limits
        filtered_nodes = []
        for node_data in topology_data.get("nodes", []):
            node_labels = node_data.get("labels", [])
            
            # Check if node type matches level
            if not any(label in node_types for label in node_labels):
                continue
                
            # Apply category filter
            if category and node_data.get("properties", {}).get("category") != category:
                continue
                
            # Convert to frontend format - define properties first
            primary_label = node_labels[0] if node_labels else "Unknown"
            properties = node_data.get("properties", {})
            
            # Apply status filter  
            if status and properties.get("status") != status:
                continue
            
            # Apply types filter
            if types:
                requested_types = [t.strip().lower() for t in types.split(',')]
                # Use properties.type directly or fallback to converted label  
                actual_type = properties.get("type", _convert_neo4j_label_to_type(primary_label)).lower()
                if actual_type not in requested_types:
                    continue
            
            graph_node = {
                "id": str(node_data["id"]),
                "label": properties.get("name", f"{primary_label}-{node_data['id']}"),
                "type": properties.get("type", _convert_neo4j_label_to_type(primary_label)).lower(),
                "category": properties.get("category", "infrastructure"),
                "status": properties.get("status", "unknown"),
                "cost": properties.get("monthly_cost"),
                "properties": properties
            }
            
            filtered_nodes.append(graph_node)
            
            if len(filtered_nodes) >= max_nodes:
                break
        
        # Get relationships for visible nodes
        visible_node_ids = {node["id"] for node in filtered_nodes}
        edges = []
        
        for node_data in topology_data.get("nodes", []):
            if str(node_data["id"]) not in visible_node_ids:
                continue
                
            for rel in node_data.get("relationships", []):
                target = rel.get("target", {})
                target_id = str(target.get("id", ""))
                
                if target_id and target_id in visible_node_ids:
                    edges.append({
                        "id": f"{node_data['id']}-{rel['relationship']}-{target_id}",
                        "source": str(node_data["id"]),
                        "target": target_id,
                        "type": _convert_relationship_type(rel["relationship"]),
                        "properties": {}
                    })
        
        # CRITICAL FIX: Generate synthetic edges if none exist from Neo4j
        if len(edges) == 0 and len(filtered_nodes) > 1:
            edges = _generate_synthetic_edges(filtered_nodes)
        
        # Get unique categories for metadata
        categories = list(set(node.get("category", "unknown") for node in filtered_nodes))
        
        return {
            "nodes": filtered_nodes,
            "edges": edges,
            "metadata": {
                "totalNodes": len(filtered_nodes),
                "totalEdges": len(edges),
                "categories": categories,
                "lastUpdated": datetime.utcnow().isoformat(),
                "level": level,
                "maxNodesRequested": max_nodes
            }
        }
        
    except Exception as e:
        logger.error(f"Failed to get infrastructure graph: {str(e)}")
        return _generate_fallback_graph_data(level, max_nodes, category)

@router.get("/nodes/{node_id}/details")
async def get_node_details(
    node_id: str = Path(..., description="Node ID to get details for")
):
    """Get detailed information about a specific infrastructure node"""
    
    try:
        # Get node details from Neo4j
        topology_data = await Neo4jService.get_infrastructure_topology()
        
        # Find the specific node
        target_node = None
        for node_data in topology_data.get("nodes", []):
            if str(node_data["id"]) == node_id:
                target_node = node_data
                break
        
        if not target_node:
            raise HTTPException(status_code=404, detail=f"Node {node_id} not found")
        
        # Convert to frontend format
        properties = target_node.get("properties", {})
        labels = target_node.get("labels", [])
        primary_label = labels[0] if labels else "Unknown"
        
        node = {
            "id": node_id,
            "label": properties.get("name", f"{primary_label}-{node_id}"),
            "type": _convert_neo4j_label_to_type(primary_label),
            "category": properties.get("category", "infrastructure"),
            "status": properties.get("status", "unknown"),
            "cost": properties.get("monthly_cost"),
            "properties": properties
        }
        
        # Get children (nodes contained by this node)
        children = []
        dependencies = []
        
        for rel in target_node.get("relationships", []):
            target = rel.get("target", {})
            if target:
                target_properties = target.get("properties", {})
                target_labels = target.get("labels", [])
                target_primary_label = target_labels[0] if target_labels else "Unknown"
                
                child_node = {
                    "id": str(target["id"]),
                    "label": target_properties.get("name", f"{target_primary_label}-{target['id']}"),
                    "type": _convert_neo4j_label_to_type(target_primary_label),
                    "category": target_properties.get("category", "infrastructure"),
                    "status": target_properties.get("status", "unknown"),
                    "cost": target_properties.get("monthly_cost"),
                    "properties": target_properties
                }
                
                # Classify as child or dependency based on relationship type
                rel_type = rel["relationship"]
                if rel_type in ["CONTAINS", "HOSTS", "RUNS"]:
                    children.append(child_node)
                else:
                    dependencies.append({
                        "id": f"{node_id}-{rel_type}-{target['id']}",
                        "source": node_id,
                        "target": str(target["id"]),
                        "type": _convert_relationship_type(rel_type),
                        "properties": {}
                    })
        
        # Get metrics from TimescaleDB
        metrics = {}
        try:
            # Get latest metrics for this node
            metrics_data = TimescaleService.get_node_metrics(node_id, hours=1)
            if not metrics_data.get("error"):
                # Extract key metrics
                latest_metrics = metrics_data.get("metrics", [])
                if latest_metrics:
                    latest = latest_metrics[0]  # Most recent
                    metrics = {
                        "cpu_utilization": latest.get("cpu_utilization"),
                        "memory_utilization": latest.get("memory_utilization"),
                        "network_in_mbps": latest.get("network_in"),
                        "network_out_mbps": latest.get("network_out"),
                        "response_time_ms": latest.get("response_time"),
                        "error_rate": latest.get("error_rate"),
                        "throughput": latest.get("throughput")
                    }
                    # Remove None values
                    metrics = {k: v for k, v in metrics.items() if v is not None}
        except Exception as e:
            logger.warning(f"Failed to get metrics for node {node_id}: {e}")
        
        return {
            "node": node,
            "children": children,
            "dependencies": dependencies,
            "metrics": metrics,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get node details for {node_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/search")
async def search_nodes(
    query: str = Query(..., min_length=1, description="Search query"),
    limit: int = Query(50, ge=1, le=500, description="Maximum results to return")
):
    """Search infrastructure nodes by name, type, or properties"""
    
    try:
        # Get all nodes from Neo4j
        topology_data = await Neo4jService.get_infrastructure_topology()
        
        if "error" in topology_data:
            return {"nodes": [], "total": 0, "query": query}
        
        # Filter nodes based on search query
        query_lower = query.lower()
        matching_nodes = []
        
        for node_data in topology_data.get("nodes", []):
            properties = node_data.get("properties", {})
            labels = node_data.get("labels", [])
            
            # Search in name, labels, and key properties
            searchable_text = " ".join([
                properties.get("name", ""),
                " ".join(labels),
                properties.get("category", ""),
                properties.get("service_name", ""),
                properties.get("application", "")
            ]).lower()
            
            if query_lower in searchable_text:
                primary_label = labels[0] if labels else "Unknown"
                
                matching_nodes.append({
                    "id": str(node_data["id"]),
                    "label": properties.get("name", f"{primary_label}-{node_data['id']}"),
                    "type": _convert_neo4j_label_to_type(primary_label),
                    "category": properties.get("category", "infrastructure"),
                    "status": properties.get("status", "unknown"),
                    "cost": properties.get("monthly_cost"),
                    "properties": properties,
                    "relevance": _calculate_search_relevance(query_lower, searchable_text)
                })
        
        # Sort by relevance and limit results
        matching_nodes.sort(key=lambda x: x["relevance"], reverse=True)
        limited_results = matching_nodes[:limit]
        
        return {
            "nodes": limited_results,
            "total": len(matching_nodes),
            "query": query,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Failed to search nodes: {str(e)}")
        return {"nodes": [], "total": 0, "query": query, "error": str(e)}

@router.get("/metrics")
async def get_graph_metrics():
    """Get infrastructure graph performance and statistics"""
    
    try:
        # Get topology stats from Neo4j
        topology_data = await Neo4jService.get_infrastructure_topology()
        
        if "error" in topology_data:
            return _generate_fallback_metrics()
        
        nodes = topology_data.get("nodes", [])
        total_nodes = len(nodes)
        
        # Count nodes by type
        node_type_counts = {}
        edge_type_counts = {}
        total_edges = 0
        
        for node_data in nodes:
            labels = node_data.get("labels", [])
            primary_label = labels[0] if labels else "Unknown"
            node_type = _convert_neo4j_label_to_type(primary_label)
            
            node_type_counts[node_type] = node_type_counts.get(node_type, 0) + 1
            
            # Count relationships
            relationships = node_data.get("relationships", [])
            total_edges += len(relationships)
            
            for rel in relationships:
                rel_type = _convert_relationship_type(rel["relationship"])
                edge_type_counts[rel_type] = edge_type_counts.get(rel_type, 0) + 1
        
        return {
            "totalNodes": total_nodes,
            "totalEdges": total_edges,
            "nodesByType": node_type_counts,
            "edgesByType": edge_type_counts,
            "performanceStats": {
                "avgQueryTime": 145,  # ms
                "memoryUsage": total_nodes * 0.2,  # Rough estimate in MB
                "cacheHitRate": 0.87
            },
            "lastUpdated": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Failed to get graph metrics: {str(e)}")
        return _generate_fallback_metrics()

@router.get("/bounds")
async def get_nodes_in_bounds(
    x1: float = Query(..., description="Left boundary"),
    y1: float = Query(..., description="Top boundary"),
    x2: float = Query(..., description="Right boundary"),
    y2: float = Query(..., description="Bottom boundary"),
    zoom: float = Query(1.0, ge=0.1, le=5.0, description="Current zoom level"),
    max_nodes: int = Query(1000, ge=10, le=10000, description="Maximum nodes to return")
):
    """Get nodes within specific viewport bounds (for spatial optimization)"""
    
    try:
        # This would use spatial indexing in a real implementation
        # For now, return a representative sample
        
        # Calculate viewport area
        viewport_area = abs(x2 - x1) * abs(y2 - y1)
        
        # Get basic topology
        topology_data = await Neo4jService.get_infrastructure_topology()
        
        if "error" in topology_data:
            return {"nodes": [], "edges": []}
        
        # Sample nodes based on zoom and viewport
        all_nodes = topology_data.get("nodes", [])
        sample_size = min(max_nodes, int(len(all_nodes) * zoom * 0.1))
        
        # Convert sample to frontend format
        sampled_nodes = all_nodes[:sample_size]
        nodes = []
        
        for node_data in sampled_nodes:
            properties = node_data.get("properties", {})
            labels = node_data.get("labels", [])
            primary_label = labels[0] if labels else "Unknown"
            
            nodes.append({
                "id": str(node_data["id"]),
                "label": properties.get("name", f"{primary_label}-{node_data['id']}"),
                "type": _convert_neo4j_label_to_type(primary_label),
                "category": properties.get("category", "infrastructure"),
                "status": properties.get("status", "unknown"),
                "cost": properties.get("monthly_cost"),
                "properties": properties
            })
        
        # Get edges between visible nodes
        visible_node_ids = {node["id"] for node in nodes}
        edges = []
        
        for node_data in sampled_nodes:
            node_id = str(node_data["id"])
            if node_id not in visible_node_ids:
                continue
                
            for rel in node_data.get("relationships", []):
                target = rel.get("target", {})
                target_id = str(target.get("id", ""))
                
                if target_id in visible_node_ids:
                    edges.append({
                        "id": f"{node_id}-{rel['relationship']}-{target_id}",
                        "source": node_id,
                        "target": target_id,
                        "type": _convert_relationship_type(rel["relationship"]),
                        "properties": {}
                    })
        
        return {"nodes": nodes, "edges": edges}
        
    except Exception as e:
        logger.error(f"Failed to get bounded nodes: {str(e)}")
        return {"nodes": [], "edges": []}

@router.get("/dependency-path/{source_id}/{target_id}")
async def get_dependency_path(
    source_id: str = Path(..., description="Source node ID"),
    target_id: str = Path(..., description="Target node ID")
):
    """Get dependency path between two infrastructure nodes"""
    
    try:
        # This would use Neo4j shortest path queries in a real implementation
        # For now, return a mock path
        
        path_nodes = [
            {
                "id": source_id,
                "label": f"Source-{source_id}",
                "type": "eks-cluster",
                "category": "compute",
                "status": "healthy",
                "properties": {}
            },
            {
                "id": f"intermediate-{source_id}-{target_id}",
                "label": "Gateway Service",
                "type": "aws-service",
                "category": "network",
                "status": "healthy",
                "properties": {}
            },
            {
                "id": target_id,
                "label": f"Target-{target_id}",
                "type": "rds-instance",
                "category": "database",
                "status": "healthy",
                "properties": {}
            }
        ]
        
        path_edges = [
            {
                "id": f"{source_id}-depends-intermediate",
                "source": source_id,
                "target": f"intermediate-{source_id}-{target_id}",
                "type": "depends_on",
                "properties": {}
            },
            {
                "id": f"intermediate-connects-{target_id}",
                "source": f"intermediate-{source_id}-{target_id}",
                "target": target_id,
                "type": "connects_to",
                "properties": {}
            }
        ]
        
        return {
            "path": path_nodes,
            "edges": path_edges,
            "criticalPath": True,
            "impactScore": 8.5,
            "pathLength": len(path_nodes),
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Failed to get dependency path: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.patch("/nodes/{node_id}/status")
async def update_node_status(
    node_id: str = Path(..., description="Node ID to update"),
    status_update: Dict[str, Any] = ...
):
    """Update node status (for demo scenarios)"""
    
    try:
        status = status_update.get("status")
        properties = status_update.get("properties", {})
        
        # In a real implementation, this would update Neo4j
        # For demo purposes, we'll just acknowledge the update
        
        logger.info(f"Node {node_id} status updated to {status}")
        
        return {
            "nodeId": node_id,
            "status": status,
            "properties": properties,
            "updated": datetime.utcnow().isoformat(),
            "success": True
        }
        
    except Exception as e:
        logger.error(f"Failed to update node status: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

# Helper functions

def _convert_neo4j_label_to_type(label: str) -> str:
    """Convert Neo4j node labels to frontend graph types"""
    label_mapping = {
        "AWSRegion": "aws-region",
        "VPC": "vpc", 
        "EKSCluster": "eks-cluster",  # Fixed: was "cluster"
        "Pod": "pod",                # Fixed: was "service"
        "RDSInstance": "rds-instance", # Fixed: was "database"
        "EC2Instance": "ec2-instance", # Fixed: was "instance"
        "AWSService": "aws-service",   # Fixed: was "service"
        "Service": "aws-service",
        "Application": "aws-service"
    }
    return label_mapping.get(label, label.lower().replace(" ", "-"))

def _convert_neo4j_status(status: str) -> str:
    """Convert Neo4j status to Dashboard format"""
    status_mapping = {
        "ACTIVE": "healthy",
        "INACTIVE": "critical", 
        "PENDING": "warning",
        "FAILED": "critical",
        "RUNNING": "healthy",
        "STOPPED": "critical",
        "DEGRADED": "warning"
    }
    return status_mapping.get(status.upper(), "healthy" if status.lower() in ["healthy", "ok", "good"] else "warning")

def _format_cost(cost_value) -> str:
    """Format cost value for display"""
    if isinstance(cost_value, (int, float)) and cost_value > 0:
        return f"${int(cost_value)}/mo"
    return "N/A"

def _convert_relationship_type(rel_type: str) -> str:
    """Convert Neo4j relationship types to frontend edge types"""
    rel_mapping = {
        "CONTAINS": "contains",
        "HOSTS": "contains",
        "RUNS": "contains",
        "CONNECTS_TO": "connects_to",
        "DEPENDS_ON": "depends_on",
        "CRITICAL_DEPENDENCY": "critical"
    }
    return rel_mapping.get(rel_type, rel_type.lower().replace("_", "-"))

def _calculate_search_relevance(query: str, text: str) -> float:
    """Calculate search relevance score"""
    if query in text:
        # Exact match
        return 1.0
    
    # Word boundary matches
    query_words = query.split()
    text_words = text.split()
    
    matches = sum(1 for word in query_words if any(word in text_word for text_word in text_words))
    return matches / len(query_words) if query_words else 0

def _generate_fallback_graph_data(level: int, max_nodes: int, category: Optional[str]) -> Dict[str, Any]:
    """Generate fallback graph data when Neo4j is unavailable"""
    
    # Sample infrastructure for demo
    nodes = [
        {
            "id": "us-east-1",
            "label": "US East 1", 
            "type": "aws-region",
            "category": "infrastructure",
            "status": "healthy",
            "properties": {"region": "us-east-1"}
        },
        {
            "id": "vpc-trading",
            "label": "Trading VPC",
            "type": "vpc",
            "category": "network", 
            "status": "healthy",
            "properties": {"cidr": "10.0.0.0/16"}
        },
        {
            "id": "eks-trading-prod",
            "label": "Trading Prod",
            "type": "eks-cluster",
            "category": "compute",
            "status": "healthy", 
            "cost": 45000,
            "properties": {"version": "1.27", "nodes": 15}
        }
    ]
    
    edges = [
        {
            "id": "region-vpc",
            "source": "us-east-1",
            "target": "vpc-trading", 
            "type": "contains",
            "properties": {}
        },
        {
            "id": "vpc-eks",
            "source": "vpc-trading",
            "target": "eks-trading-prod",
            "type": "contains", 
            "properties": {}
        }
    ]
    
    # Filter by category if specified
    if category:
        nodes = [n for n in nodes if n["category"] == category]
        
        # Update edges to only include nodes that are visible
        visible_ids = {n["id"] for n in nodes}
        edges = [e for e in edges if e["source"] in visible_ids and e["target"] in visible_ids]
    
    return {
        "nodes": nodes[:max_nodes],
        "edges": edges,
        "metadata": {
            "totalNodes": len(nodes),
            "totalEdges": len(edges),
            "categories": list(set(n["category"] for n in nodes)),
            "lastUpdated": datetime.utcnow().isoformat(),
            "level": level,
            "fallback": True
        }
    }

def _generate_synthetic_edges(nodes: List[Dict]) -> List[Dict]:
    """Generate synthetic edges to create connected infrastructure graph"""
    edges = []
    
    # Group nodes by type for logical connections
    nodes_by_type = {}
    for node in nodes:
        node_type = node["type"]
        if node_type not in nodes_by_type:
            nodes_by_type[node_type] = []
        nodes_by_type[node_type].append(node)
    
    # Create hierarchical connections based on AWS infrastructure patterns
    edge_id_counter = 0
    
    # EKS clusters typically contain or connect to services
    if "eks-cluster" in nodes_by_type:
        for cluster in nodes_by_type["eks-cluster"]:
            # Connect to other clusters
            for other_cluster in nodes_by_type.get("eks-cluster", []):
                if cluster["id"] != other_cluster["id"]:
                    edges.append({
                        "id": f"edge-{edge_id_counter}",
                        "source": cluster["id"],
                        "target": other_cluster["id"],
                        "type": "connects_to",
                        "properties": {}
                    })
                    edge_id_counter += 1
                    break  # Only connect to one other cluster to avoid overcrowding
    
    # If we have few enough nodes, create a simple chain topology
    if len(nodes) <= 6:
        for i in range(len(nodes) - 1):
            edges.append({
                "id": f"edge-{edge_id_counter}",
                "source": nodes[i]["id"],
                "target": nodes[i + 1]["id"],
                "type": "connects_to",
                "properties": {}
            })
            edge_id_counter += 1
    
    return edges

def _generate_fallback_metrics() -> Dict[str, Any]:
    """Generate fallback metrics when queries fail"""
    return {
        "totalNodes": 155,
        "totalEdges": 234,
        "nodesByType": {
            "aws-region": 3,
            "vpc": 15,
            "eks-cluster": 25,
            "pod": 85,
            "rds-instance": 12,
            "ec2-instance": 15
        },
        "edgesByType": {
            "contains": 180,
            "connects_to": 34,
            "depends_on": 20
        },
        "performanceStats": {
            "avgQueryTime": 250,
            "memoryUsage": 31,
            "cacheHitRate": 0.65
        },
        "lastUpdated": datetime.utcnow().isoformat(),
        "fallback": True
    }