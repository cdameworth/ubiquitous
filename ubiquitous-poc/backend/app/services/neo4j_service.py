"""
Neo4j Query Service for Infrastructure Dependency Mapping
Provides comprehensive queries for AWS infrastructure relationships and dependencies
"""

from typing import List, Dict, Any, Optional, Tuple
from neo4j import Session
from ..database import get_neo4j_session
import logging
import asyncio
from functools import wraps
import time

logger = logging.getLogger(__name__)

def neo4j_error_handler(func):
    """Decorator for Neo4j error handling with retries and logging"""
    @wraps(func)
    async def wrapper(*args, **kwargs):
        max_retries = 3
        retry_delay = 1  # seconds
        
        for attempt in range(max_retries):
            try:
                start_time = time.time()
                result = await func(*args, **kwargs)
                execution_time = time.time() - start_time
                
                logger.info(f"Neo4j query {func.__name__} completed in {execution_time:.2f}s")
                return result
                
            except Exception as e:
                logger.warning(f"Neo4j query {func.__name__} failed on attempt {attempt + 1}: {str(e)}")
                
                if attempt == max_retries - 1:  # Last attempt
                    logger.error(f"Neo4j query {func.__name__} failed after {max_retries} attempts")
                    # Return empty result structure instead of raising
                    return {
                        "error": str(e),
                        "query_name": func.__name__,
                        "attempts": max_retries,
                        "nodes": [],
                        "relationships": [],
                        "total_count": 0
                    }
                
                time.sleep(retry_delay * (attempt + 1))  # Exponential backoff
        
    return wrapper

class Neo4jService:
    """Service for querying Neo4j infrastructure graph database"""
    
    @staticmethod
    @neo4j_error_handler
    async def get_infrastructure_topology() -> Dict[str, Any]:
        """Get complete infrastructure topology with all nodes and synthetic relationships"""
        try:
            session = await get_neo4j_session()
            try:
                # First get all nodes
                nodes_query = """
                MATCH (n)
                RETURN {
                    id: id(n),
                    labels: labels(n),
                    properties: properties(n)
                } as node
                ORDER BY n.name
                """
                
                result = session.run(nodes_query)
                nodes = [record["node"] for record in result]
                
                # Get all relationships from the database
                all_relationships_query = """
                MATCH (n1)-[r]->(n2)
                RETURN {
                    source_id: id(n1),
                    target_id: id(n2),
                    source_name: coalesce(n1.name, n1.identifier, n1.vpc_id, toString(id(n1))),
                    target_name: coalesce(n2.name, n2.identifier, n2.vpc_id, toString(id(n2))),
                    relationship_type: type(r)
                } as relationship
                """
                
                result = session.run(all_relationships_query)
                all_relationships = [record["relationship"] for record in result]
                
                logger.info(f"Found {len(nodes)} nodes and {len(all_relationships)} actual relationships in database")
                
                return {
                    "nodes": nodes,
                    "relationships": all_relationships,
                    "total_count": len(nodes),
                    "node_types": _get_node_type_counts(nodes)
                }
            finally:
                session.close()
                
        except Exception as e:
            logger.error(f"Failed to get infrastructure topology: {str(e)}")
            return {"nodes": [], "total_count": 0, "node_types": {}}

    @staticmethod
    @neo4j_error_handler
    async def get_eks_clusters_with_services() -> List[Dict[str, Any]]:
        """Get all EKS clusters with their deployed services and dependencies"""
        try:
            session = await get_neo4j_session()
            try:
                query = """
                MATCH (c:EKSCluster)
                OPTIONAL MATCH (c)<-[:DEPLOYED_ON]-(s:Service)
                OPTIONAL MATCH (s)-[:DEPENDS_ON]->(dep_s:Service)
                OPTIONAL MATCH (s)-[:CONNECTS_TO|READS_FROM]->(db)
                WHERE db:RDSInstance OR db:EC2Instance
                WITH c, s, 
                     collect(DISTINCT {
                         service_name: dep_s.name,
                         service_type: dep_s.type,
                         dependency_type: 'service'
                     }) as service_dependencies,
                     collect(DISTINCT {
                         db_identifier: COALESCE(db.identifier, db.name),
                         db_type: CASE WHEN db:RDSInstance THEN db.engine ELSE 'sqlserver' END,
                         dependency_type: 'database'
                     }) as database_dependencies
                WITH c, 
                     collect(DISTINCT {
                         id: s.id,
                         name: s.name,
                         type: s.type,
                         status: s.status,
                         version: s.version,
                         replicas: s.replicas,
                         cpu_request: s.cpu_request,
                         memory_request: s.memory_request,
                         service_dependencies: service_dependencies,
                         database_dependencies: database_dependencies
                     }) as services
                RETURN {
                    name: c.name,
                    region: c.region,
                    status: c.status,
                    version: c.version,
                    total_nodes: c.total_nodes,
                    node_groups: c.node_groups,
                    instance_types: c.instance_types,
                    cost_monthly: c.cost_monthly,
                    services: services,
                    service_count: size(services)
                } as cluster
                ORDER BY c.cost_monthly DESC
                """
                
                result = session.run(query)
                return [record["cluster"] for record in result]
            finally:
                session.close()
                
        except Exception as e:
            logger.error(f"Failed to get EKS clusters: {str(e)}")
            return []

    @staticmethod
    @neo4j_error_handler
    async def get_service_dependency_map() -> Dict[str, Any]:
        """Get comprehensive service dependency mapping with impact analysis"""
        session = await get_neo4j_session()
        try:
                query = """
                MATCH (s:Service)
                OPTIONAL MATCH (s)-[:DEPENDS_ON]->(dep:Service)
                OPTIONAL MATCH (dependent:Service)-[:DEPENDS_ON]->(s)
                OPTIONAL MATCH (s)-[:DEPLOYED_ON]->(c:EKSCluster)
                OPTIONAL MATCH (s)-[:CONNECTS_TO|READS_FROM]->(db)
                WHERE db:RDSInstance OR db:EC2Instance
                WITH s, c,
                     collect(DISTINCT {
                         name: dep.name,
                         type: dep.type,
                         status: dep.status
                     }) as dependencies,
                     collect(DISTINCT {
                         name: dependent.name,
                         type: dependent.type,
                         status: dependent.status
                     }) as dependents,
                     collect(DISTINCT {
                         identifier: COALESCE(db.identifier, db.name),
                         type: CASE WHEN db:RDSInstance THEN db.engine ELSE 'sqlserver' END,
                         status: db.status
                     }) as databases
                RETURN {
                    service: {
                        id: s.id,
                        name: s.name,
                        type: s.type,
                        status: s.status,
                        environment: s.environment,
                        version: s.version
                    },
                    cluster: {
                        name: c.name,
                        region: c.region
                    },
                    dependencies: dependencies,
                    dependents: dependents,
                    databases: databases,
                    impact_score: size(dependents) * 2 + size(dependencies),
                    criticality: CASE 
                        WHEN size(dependents) >= 3 THEN 'critical'
                        WHEN size(dependents) >= 2 THEN 'high'
                        WHEN size(dependents) >= 1 THEN 'medium'
                        ELSE 'low'
                    END
                } as service_map
                ORDER BY service_map.impact_score DESC
                """
                
                result = session.run(query)
                service_maps = [record["service_map"] for record in result]
                
                # Calculate dependency graph metrics
                total_services = len(service_maps)
                total_dependencies = sum(len(s["dependencies"]) for s in service_maps)
                critical_services = len([s for s in service_maps if s["criticality"] == "critical"])
                
                return {
                    "services": service_maps,
                    "metrics": {
                        "total_services": total_services,
                        "total_dependencies": total_dependencies,
                        "critical_services": critical_services,
                        "dependency_density": total_dependencies / total_services if total_services > 0 else 0
                    }
                }
        finally:
            await session.close()

    @staticmethod
    @neo4j_error_handler
    async def get_database_connections() -> List[Dict[str, Any]]:
        """Get all database instances with their connecting services"""
        session = await get_neo4j_session()
        try:
                query = """
                // RDS Instances
                MATCH (db:RDSInstance)
                OPTIONAL MATCH (s:Service)-[:CONNECTS_TO|READS_FROM]->(db)
                WITH db, collect(DISTINCT {
                    service_name: s.name,
                    service_type: s.type,
                    connection_type: 'read_write'
                }) as connections,
                'rds' as db_type
                
                UNION
                
                // EC2 SQL Server Instances
                MATCH (ec2:EC2Instance)
                WHERE ec2.sqlserver_edition IS NOT NULL
                OPTIONAL MATCH (ec2)-[:HOSTS_DATABASE_FOR]->(app:Application)
                WITH ec2 as db, collect(DISTINCT {
                    service_name: app.name,
                    service_type: 'application',
                    connection_type: 'application_db'
                }) as connections,
                'ec2_sqlserver' as db_type
                
                RETURN {
                    identifier: COALESCE(db.identifier, db.name),
                    type: db_type,
                    engine: COALESCE(db.engine, 'sqlserver'),
                    status: db.status,
                    region: db.region,
                    instance_class: COALESCE(db.instance_class, db.instance_type),
                    cost_monthly: db.cost_monthly,
                    connections: connections,
                    connection_count: size(connections),
                    utilization: CASE 
                        WHEN db_type = 'ec2_sqlserver' THEN db.cpu_utilization
                        ELSE null
                    END,
                    storage_gb: CASE 
                        WHEN db_type = 'rds' THEN db.allocated_storage
                        ELSE db.storage_gb
                    END
                } as database
                ORDER BY database.cost_monthly DESC
                """
                
                result = session.run(query)
                return [record["database"] for record in result]
        finally:
            await session.close()

    @staticmethod
    @neo4j_error_handler
    async def get_cost_optimization_candidates() -> Dict[str, Any]:
        """Identify infrastructure components that are candidates for cost optimization"""
        session = await get_neo4j_session()
        try:
                query = """
                // Under-utilized EKS clusters
                MATCH (c:EKSCluster)
                OPTIONAL MATCH (c)<-[:DEPLOYED_ON]-(s:Service)
                WITH c, count(s) as service_count,
                     c.total_nodes as total_nodes,
                     c.cost_monthly as cost_monthly
                WHERE service_count < (total_nodes / 10) // Low service density
                
                RETURN {
                    type: 'eks_cluster',
                    name: c.name,
                    region: c.region,
                    current_cost: cost_monthly,
                    optimization_type: 'right_sizing',
                    potential_savings: cost_monthly * 0.3,
                    reason: 'Low service density: ' + toString(service_count) + ' services on ' + toString(total_nodes) + ' nodes',
                    confidence: 'high'
                } as candidate
                
                UNION
                
                // Over-provisioned EC2 SQL Server instances
                MATCH (ec2:EC2Instance)
                WHERE ec2.sqlserver_edition IS NOT NULL 
                  AND ec2.cpu_utilization < 30 
                  AND ec2.memory_utilization < 50
                
                RETURN {
                    type: 'ec2_sqlserver',
                    name: ec2.name,
                    region: ec2.region,
                    current_cost: ec2.cost_monthly,
                    optimization_type: 'instance_downsizing',
                    potential_savings: ec2.cost_monthly * 0.4,
                    reason: 'Low utilization: ' + toString(ec2.cpu_utilization) + '% CPU, ' + toString(ec2.memory_utilization) + '% memory',
                    confidence: 'medium'
                } as candidate
                
                UNION
                
                // Expensive Oracle instances with PostgreSQL migration potential
                MATCH (oracle:RDSInstance)
                WHERE oracle.engine = 'oracle-ee' 
                  AND oracle.cost_monthly > 5000
                OPTIONAL MATCH (postgres:RDSInstance)
                WHERE postgres.engine = 'postgres' 
                  AND postgres.region = oracle.region
                WITH oracle, min(postgres.cost_monthly) as min_postgres_cost
                
                RETURN {
                    type: 'rds_oracle',
                    name: oracle.identifier,
                    region: oracle.region,
                    current_cost: oracle.cost_monthly,
                    optimization_type: 'engine_migration',
                    potential_savings: oracle.cost_monthly - COALESCE(min_postgres_cost, oracle.cost_monthly * 0.6),
                    reason: 'Oracle to PostgreSQL migration opportunity',
                    confidence: 'medium'
                } as candidate
                
                ORDER BY candidate.potential_savings DESC
                """
                
                result = session.run(query)
                candidates = [record["candidate"] for record in result]
                
                total_current_cost = sum(c["current_cost"] for c in candidates)
                total_potential_savings = sum(c["potential_savings"] for c in candidates)
                
                return {
                    "candidates": candidates,
                    "summary": {
                        "total_candidates": len(candidates),
                        "total_current_cost": total_current_cost,
                        "total_potential_savings": total_potential_savings,
                        "potential_savings_percentage": (total_potential_savings / total_current_cost * 100) if total_current_cost > 0 else 0
                    }
                }
        finally:
            await session.close()

    @staticmethod
    @neo4j_error_handler
    async def get_application_architecture(app_name: str) -> Dict[str, Any]:
        """Get detailed architecture view for a specific application"""
        session = await get_neo4j_session()
        try:
                query = """
                MATCH (app:Application {name: $app_name})
                OPTIONAL MATCH (app)-[:USES]->(s:Service)
                OPTIONAL MATCH (s)-[:DEPLOYED_ON]->(c:EKSCluster)
                OPTIONAL MATCH (s)-[:DEPENDS_ON]->(dep_s:Service)
                OPTIONAL MATCH (s)-[:CONNECTS_TO|READS_FROM]->(db)
                WHERE db:RDSInstance OR db:EC2Instance
                OPTIONAL MATCH (ec2:EC2Instance)-[:HOSTS_DATABASE_FOR]->(app)
                
                WITH app, s, c, 
                     collect(DISTINCT {
                         name: dep_s.name,
                         type: dep_s.type
                     }) as service_deps,
                     collect(DISTINCT {
                         identifier: COALESCE(db.identifier, db.name),
                         engine: COALESCE(db.engine, 'sqlserver'),
                         type: CASE WHEN db:RDSInstance THEN 'rds' ELSE 'ec2_sqlserver' END
                     }) as service_databases,
                     collect(DISTINCT {
                         name: ec2.name,
                         instance_type: ec2.instance_type,
                         sqlserver_edition: ec2.sqlserver_edition
                     }) as app_databases
                
                WITH app,
                     collect(DISTINCT {
                         service: {
                             id: s.id,
                             name: s.name,
                             type: s.type,
                             status: s.status,
                             replicas: s.replicas
                         },
                         cluster: {
                             name: c.name,
                             region: c.region
                         },
                         dependencies: service_deps,
                         databases: service_databases
                     }) as services,
                     app_databases
                
                RETURN {
                    application: {
                        name: app.name,
                        type: app.type,
                        environment: app.environment,
                        status: app.status,
                        business_criticality: app.business_criticality,
                        compliance_requirements: app.compliance_requirements,
                        team_owner: app.team_owner
                    },
                    services: services,
                    databases: app_databases,
                    metrics: {
                        service_count: size(services),
                        database_count: size(app_databases),
                        total_replicas: reduce(total = 0, svc IN services | total + svc.service.replicas)
                    }
                } as architecture
                """
                
                result = session.run(query, app_name=app_name)
                record = result.single()
                return record["architecture"] if record else {}
        finally:
            await session.close()

    @staticmethod
    @neo4j_error_handler
    async def get_application_infrastructure(app_name: str) -> Dict[str, Any]:
        """Get complete infrastructure stack for an application including web services and load balancers"""
        session = await get_neo4j_session()
        try:
            query = """
            MATCH (app:Application {name: $app_name})
            OPTIONAL MATCH (app)-[:HAS_FRONTEND]->(ws:WebService)
            OPTIONAL MATCH (lb:LoadBalancer)-[:ROUTES_TO]->(ws)
            OPTIONAL MATCH (app)-[:USES]->(s:Service)
            OPTIONAL MATCH (s)-[:DEPLOYED_ON]->(c:EKSCluster)
            OPTIONAL MATCH (s)-[:QUERIES]->(db:RDSInstance)
            OPTIONAL MATCH (s)-[:QUERIES]->(ec2:EC2Instance)
            
            WITH app, ws, lb, s, c, db, ec2
            
            RETURN {
                load_balancers: collect(DISTINCT {
                    id: id(lb),
                    name: lb.name,
                    type: lb.type,
                    dns_name: lb.dns_name,
                    state: lb.state,
                    tier: "loadbalancer",
                    cost_monthly: lb.cost_monthly
                }),
                web_services: collect(DISTINCT {
                    id: id(ws),
                    name: ws.name,
                    technology: ws.technology,
                    framework: ws.framework,
                    status: ws.status,
                    tier: "web",
                    cost_monthly: ws.cost_monthly
                }),
                services: collect(DISTINCT {
                    id: id(s),
                    name: s.name,
                    type: s.type,
                    status: s.status,
                    tier: "app",
                    cluster_name: c.name,
                    replicas: s.replicas
                }),
                databases: collect(DISTINCT {
                    id: id(db),
                    name: coalesce(db.identifier, ec2.name),
                    engine: coalesce(db.engine, 'sqlserver'),
                    status: coalesce(db.status, ec2.status),
                    tier: "database",
                    cost_monthly: coalesce(db.cost_monthly, ec2.cost_monthly)
                }),
                clusters: collect(DISTINCT {
                    id: id(c),
                    name: c.name,
                    region: c.region,
                    status: c.status,
                    tier: "infrastructure",
                    cost_monthly: c.cost_monthly
                })
            } as infrastructure
            """
            
            result = session.run(query, app_name=app_name)
            record = result.single()
            
            if not record:
                return {"nodes": []}
            
            infrastructure = record["infrastructure"]
            
            # Flatten all nodes into a single list with proper formatting
            nodes = []
            
            # Add load balancers
            for lb in infrastructure.get("load_balancers", []):
                if lb["name"]:  # Only add if not null
                    nodes.append({
                        "id": str(lb["id"]),
                        "type": "LoadBalancer",
                        "name": lb["name"],
                        "status": lb["state"] or "active",
                        "tier": "loadbalancer",
                        "metrics": {
                            "cpu": 0,
                            "memory": 0,
                            "connections": 0,
                            "cost": lb["cost_monthly"]
                        }
                    })
            
            # Add web services
            for ws in infrastructure.get("web_services", []):
                if ws["name"]:  # Only add if not null
                    nodes.append({
                        "id": str(ws["id"]),
                        "type": "WebService",
                        "name": ws["name"],
                        "status": ws["status"] or "running",
                        "tier": "web",
                        "metrics": {
                            "cpu": 0,
                            "memory": 0,
                            "connections": 0,
                            "cost": ws["cost_monthly"]
                        }
                    })
            
            # Add services
            for svc in infrastructure.get("services", []):
                if svc["name"]:  # Only add if not null
                    nodes.append({
                        "id": str(svc["id"]),
                        "type": "Service", 
                        "name": svc["name"],
                        "status": svc["status"] or "healthy",
                        "tier": "app",
                        "metrics": {
                            "cpu": 0,
                            "memory": 0,
                            "connections": svc["replicas"] or 0,
                            "cost": "N/A"
                        },
                        "cluster": svc["cluster_name"]
                    })
            
            # Add databases
            for db in infrastructure.get("databases", []):
                if db["name"]:  # Only add if not null
                    nodes.append({
                        "id": str(db["id"]),
                        "type": "Database",
                        "name": db["name"],
                        "status": db["status"] or "available",
                        "tier": "database",
                        "metrics": {
                            "cpu": 0,
                            "memory": 0,
                            "connections": 0,
                            "cost": db["cost_monthly"]
                        }
                    })
            
            # Add clusters
            for cluster in infrastructure.get("clusters", []):
                if cluster["name"]:  # Only add if not null
                    nodes.append({
                        "id": str(cluster["id"]),
                        "type": "EKSCluster",
                        "name": cluster["name"],
                        "status": cluster["status"] or "ACTIVE",
                        "tier": "infrastructure",
                        "metrics": {
                            "cpu": 0,
                            "memory": 0,
                            "connections": 0,
                            "cost": cluster["cost_monthly"]
                        }
                    })
                    
            return {"nodes": nodes}
            
        finally:
            session.close()

    @staticmethod
    @neo4j_error_handler
    async def get_critical_path_analysis() -> Dict[str, Any]:
        """Analyze critical paths and single points of failure in the infrastructure"""
        session = await get_neo4j_session()
        try:
                query = """
                // Find services with no redundancy (single points of failure)
                MATCH (s:Service)
                WHERE s.replicas <= 1
                OPTIONAL MATCH (dependent:Service)-[:DEPENDS_ON]->(s)
                WITH s, count(dependent) as dependent_count
                WHERE dependent_count > 0
                
                WITH collect({
                    service_name: s.name,
                    service_type: s.type,
                    dependent_services: dependent_count,
                    risk_level: CASE 
                        WHEN dependent_count >= 3 THEN 'critical'
                        WHEN dependent_count >= 2 THEN 'high'
                        ELSE 'medium'
                    END
                }) as single_points
                
                // Find database bottlenecks
                MATCH (db)-[:CONNECTS_TO|READS_FROM|HOSTS_DATABASE_FOR]-(connected)
                WHERE db:RDSInstance OR db:EC2Instance
                WITH db, count(connected) as connection_count,
                     single_points
                WHERE connection_count >= 2
                
                WITH single_points, collect({
                    database_name: COALESCE(db.identifier, db.name),
                    database_type: CASE WHEN db:RDSInstance THEN db.engine ELSE 'sqlserver' END,
                    connection_count: connection_count,
                    bottleneck_risk: CASE 
                        WHEN connection_count >= 4 THEN 'high'
                        WHEN connection_count >= 3 THEN 'medium'
                        ELSE 'low'
                    END
                }) as database_bottlenecks
                
                // Find cluster concentration risks
                MATCH (c:EKSCluster)<-[:DEPLOYED_ON]-(s:Service)
                WITH c, count(s) as service_count,
                     single_points, database_bottlenecks
                WHERE service_count >= 3
                
                WITH single_points, database_bottlenecks, 
                     collect({
                         cluster_name: c.name,
                         region: c.region,
                         service_count: service_count,
                         concentration_risk: CASE 
                             WHEN service_count >= 5 THEN 'high'
                             WHEN service_count >= 4 THEN 'medium'
                             ELSE 'low'
                         END
                     }) as cluster_concentrations
                
                RETURN {
                    single_points_of_failure: single_points,
                    database_bottlenecks: database_bottlenecks,
                    cluster_concentrations: cluster_concentrations,
                    risk_summary: {
                        critical_single_points: size([sp IN single_points WHERE sp.risk_level = 'critical']),
                        high_risk_databases: size([db IN database_bottlenecks WHERE db.bottleneck_risk = 'high']),
                        high_concentration_clusters: size([cc IN cluster_concentrations WHERE cc.concentration_risk = 'high'])
                    }
                } as analysis
                """
                
                result = session.run(query)
                record = result.single()
                return record["analysis"] if record else {}
        finally:
            await session.close()

    @staticmethod
    @neo4j_error_handler
    async def get_network_latency_heatmap_data() -> Dict[str, Any]:
        """Get service-to-service communication patterns for latency analysis"""
        session = await get_neo4j_session()
        try:
                query = """
                // Service-to-service communication patterns
                MATCH (source:Service)-[rel:DEPENDS_ON|CONNECTS_TO]->(target)
                WHERE target:Service OR target:RDSInstance OR target:EC2Instance
                OPTIONAL MATCH (source)-[:DEPLOYED_ON]->(source_cluster:EKSCluster)
                OPTIONAL MATCH (target)-[:DEPLOYED_ON]->(target_cluster:EKSCluster)
                
                WITH source, target, source_cluster, target_cluster,
                     CASE 
                         WHEN target:Service THEN target.name
                         WHEN target:RDSInstance THEN target.identifier  
                         ELSE target.name
                     END as target_name,
                     CASE
                         WHEN target:Service THEN 'service'
                         WHEN target:RDSInstance THEN 'rds'
                         ELSE 'ec2_sqlserver'
                     END as target_type,
                     type(rel) as relationship_type
                
                RETURN {
                    source_service: source.name,
                    source_cluster: source_cluster.name,
                    source_region: source_cluster.region,
                    target_name: target_name,
                    target_type: target_type,
                    target_cluster: target_cluster.name,
                    target_region: COALESCE(target_cluster.region, target.region),
                    connection_type: relationship_type,
                    cross_region: source_cluster.region <> COALESCE(target_cluster.region, target.region),
                    estimated_latency: CASE 
                        WHEN source_cluster.region <> COALESCE(target_cluster.region, target.region) THEN 50 + random() * 100
                        WHEN target_type = 'rds' OR target_type = 'ec2_sqlserver' THEN 5 + random() * 15
                        ELSE 2 + random() * 8
                    END
                } as connection
                ORDER BY connection.source_service, connection.target_name
                """
                
                result = session.run(query)
                connections = [record["connection"] for record in result]
                
                # Generate heatmap matrix
                services = list(set([c["source_service"] for c in connections] + 
                                  [c["target_name"] for c in connections if c["target_type"] == "service"]))
                
                matrix = []
                for source in services:
                    row = []
                    for target in services:
                        if source == target:
                            row.append(0)
                        else:
                            # Find connection latency
                            connection = next((c for c in connections 
                                             if c["source_service"] == source and c["target_name"] == target), None)
                            row.append(connection["estimated_latency"] if connection else None)
                    matrix.append(row)
                
                return {
                    "connections": connections,
                    "heatmap": {
                        "services": services,
                        "matrix": matrix
                    },
                    "metrics": {
                        "total_connections": len(connections),
                        "cross_region_connections": len([c for c in connections if c["cross_region"]]),
                        "database_connections": len([c for c in connections if c["target_type"] in ["rds", "ec2_sqlserver"]])
                    }
                }
        finally:
            await session.close()

def _get_node_type_counts(nodes: List[Dict[str, Any]]) -> Dict[str, int]:
    """Helper function to count nodes by type"""
    type_counts = {}
    for node in nodes:
        labels = node.get("labels", [])
        for label in labels:
            type_counts[label] = type_counts.get(label, 0) + 1
    return type_counts