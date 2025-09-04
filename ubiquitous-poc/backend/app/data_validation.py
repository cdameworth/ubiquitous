"""
Data Validation Service for Ubiquitous Platform
Ensures data consistency, integrity, and proper error handling across all services
"""

from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime, timedelta
import asyncio
from dataclasses import dataclass
from enum import Enum
import logging

from .services.neo4j_service import Neo4jService
from .services.timescale_service import TimescaleService
from .database import get_timescale_connection, release_timescale_connection, get_neo4j_session

logger = logging.getLogger(__name__)

class ValidationSeverity(Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

@dataclass
class ValidationResult:
    """Result of a data validation check"""
    check_name: str
    status: str  # passed, failed, warning, error
    severity: ValidationSeverity
    message: str
    details: Dict[str, Any]
    timestamp: datetime
    recommendations: List[str]

class DataValidationService:
    """Comprehensive data validation and consistency checking service"""
    
    def __init__(self):
        self.neo4j_service = Neo4jService()
        self.timescale_service = TimescaleService()
        self.validation_results: List[ValidationResult] = []
    
    async def run_full_validation(self) -> Dict[str, Any]:
        """Run complete data validation suite"""
        
        logger.info("🔍 Starting comprehensive data validation")
        
        self.validation_results = []
        
        # Validation categories
        validation_categories = [
            ("Database Connectivity", self._validate_database_connectivity),
            ("Data Schema Integrity", self._validate_schema_integrity),
            ("Cross-Database Consistency", self._validate_cross_database_consistency),
            ("Time Series Data Quality", self._validate_timeseries_quality),
            ("Graph Data Relationships", self._validate_graph_relationships),
            ("API Response Consistency", self._validate_api_consistency),
            ("Performance Thresholds", self._validate_performance_thresholds),
            ("Error Handling Coverage", self._validate_error_handling)
        ]
        
        for category_name, validation_function in validation_categories:
            logger.info(f"🔍 Validating: {category_name}")
            try:
                await validation_function()
            except Exception as e:
                self._record_validation(
                    f"{category_name} - System Error",
                    "error",
                    ValidationSeverity.CRITICAL,
                    f"Validation category failed: {str(e)}",
                    {"exception": str(e)},
                    ["Check system logs", "Verify database connections"]
                )
        
        # Generate summary report
        return self._generate_validation_report()
    
    async def _validate_database_connectivity(self):
        """Validate database connections and basic functionality"""
        
        # Test Neo4j connectivity
        try:
            result = self.neo4j_service.get_infrastructure_topology()
            if isinstance(result, dict) and ("nodes" in result or "error" in result):
                self._record_validation(
                    "Neo4j Connectivity",
                    "passed" if "nodes" in result else "warning",
                    ValidationSeverity.HIGH,
                    "Neo4j database is accessible and responsive",
                    {"node_count": result.get("total_count", 0)},
                    []
                )
            else:
                self._record_validation(
                    "Neo4j Connectivity",
                    "failed",
                    ValidationSeverity.CRITICAL,
                    "Neo4j connectivity test returned unexpected result",
                    {"result_type": type(result).__name__},
                    ["Check Neo4j service status", "Verify connection configuration"]
                )
        except Exception as e:
            self._record_validation(
                "Neo4j Connectivity",
                "failed",
                ValidationSeverity.CRITICAL,
                f"Neo4j connection failed: {str(e)}",
                {"error": str(e)},
                ["Check Neo4j service", "Verify credentials", "Check network connectivity"]
            )
        
        # Test TimescaleDB connectivity
        try:
            result = await self.timescale_service.get_system_metrics_summary()
            if isinstance(result, dict) and ("services" in result or "error" in result):
                self._record_validation(
                    "TimescaleDB Connectivity",
                    "passed" if "services" in result else "warning",
                    ValidationSeverity.HIGH,
                    "TimescaleDB is accessible and responsive",
                    {"metrics_available": len(result.get("services", []))},
                    []
                )
            else:
                self._record_validation(
                    "TimescaleDB Connectivity",
                    "failed",
                    ValidationSeverity.CRITICAL,
                    "TimescaleDB connectivity test returned unexpected result",
                    {"result_type": type(result).__name__},
                    ["Check PostgreSQL/TimescaleDB service", "Verify connection pool"]
                )
        except Exception as e:
            self._record_validation(
                "TimescaleDB Connectivity",
                "failed",
                ValidationSeverity.CRITICAL,
                f"TimescaleDB connection failed: {str(e)}",
                {"error": str(e)},
                ["Check PostgreSQL service", "Verify credentials", "Check connection pool"]
            )
    
    async def _validate_schema_integrity(self):
        """Validate database schema integrity and required tables/nodes"""
        
        # Validate TimescaleDB schema
        try:
            conn = await get_timescale_connection()
            try:
                # Check for required tables
                required_tables = [
                    "system_metrics", "database_metrics", "network_metrics",
                    "cost_metrics", "security_events", "incident_metrics",
                    "business_value_metrics", "compliance_metrics"
                ]
                
                query = """
                SELECT tablename 
                FROM pg_tables 
                WHERE schemaname = 'public' 
                  AND tablename = ANY($1)
                """
                
                rows = await conn.fetch(query, required_tables)
                existing_tables = [row["tablename"] for row in rows]
                missing_tables = set(required_tables) - set(existing_tables)
                
                if not missing_tables:
                    self._record_validation(
                        "TimescaleDB Schema Integrity",
                        "passed",
                        ValidationSeverity.MEDIUM,
                        "All required tables exist",
                        {"tables_found": len(existing_tables)},
                        []
                    )
                else:
                    self._record_validation(
                        "TimescaleDB Schema Integrity",
                        "failed",
                        ValidationSeverity.HIGH,
                        f"Missing required tables: {', '.join(missing_tables)}",
                        {"missing_tables": list(missing_tables)},
                        ["Run database initialization script", "Check schema migration"]
                    )
                    
            finally:
                await release_timescale_connection(conn)
                
        except Exception as e:
            self._record_validation(
                "TimescaleDB Schema Integrity",
                "error",
                ValidationSeverity.CRITICAL,
                f"Schema validation failed: {str(e)}",
                {"error": str(e)},
                ["Check database permissions", "Verify table existence"]
            )
        
        # Validate Neo4j schema
        try:
            with get_neo4j_session() as session:
                # Check for required node types
                node_query = "CALL db.labels() YIELD label RETURN label"
                result = session.run(node_query)
                existing_labels = [record["label"] for record in result]
                
                required_labels = ["EKSCluster", "Service", "Database", "RDSInstance", "EC2SQLServer"]
                missing_labels = set(required_labels) - set(existing_labels)
                
                if not missing_labels:
                    self._record_validation(
                        "Neo4j Schema Integrity",
                        "passed",
                        ValidationSeverity.MEDIUM,
                        "All required node types exist",
                        {"labels_found": len(existing_labels)},
                        []
                    )
                else:
                    self._record_validation(
                        "Neo4j Schema Integrity",
                        "failed",
                        ValidationSeverity.HIGH,
                        f"Missing required node types: {', '.join(missing_labels)}",
                        {"missing_labels": list(missing_labels)},
                        ["Run Neo4j data initialization", "Check data import process"]
                    )
                    
        except Exception as e:
            self._record_validation(
                "Neo4j Schema Integrity",
                "error",
                ValidationSeverity.CRITICAL,
                f"Neo4j schema validation failed: {str(e)}",
                {"error": str(e)},
                ["Check Neo4j service", "Verify database permissions"]
            )
    
    async def _validate_cross_database_consistency(self):
        """Validate data consistency between Neo4j and TimescaleDB"""
        
        try:
            # Get service list from Neo4j
            neo4j_result = self.neo4j_service.get_eks_clusters_with_services()
            neo4j_services = set()
            
            if isinstance(neo4j_result, dict) and "clusters" in neo4j_result:
                for cluster in neo4j_result["clusters"]:
                    neo4j_services.update(cluster.get("services", []))
            
            # Get service list from TimescaleDB
            timescale_result = await self.timescale_service.get_system_metrics_summary()
            timescale_services = set()
            
            if isinstance(timescale_result, dict) and "services" in timescale_result:
                for service in timescale_result["services"]:
                    timescale_services.add(service.get("service_name", ""))
            
            # Compare service lists
            if neo4j_services and timescale_services:
                common_services = neo4j_services.intersection(timescale_services)
                missing_from_timescale = neo4j_services - timescale_services
                missing_from_neo4j = timescale_services - neo4j_services
                
                consistency_score = len(common_services) / max(len(neo4j_services), len(timescale_services)) * 100 if neo4j_services or timescale_services else 0
                
                if consistency_score >= 80:
                    status = "passed"
                    severity = ValidationSeverity.LOW
                elif consistency_score >= 60:
                    status = "warning"
                    severity = ValidationSeverity.MEDIUM
                else:
                    status = "failed"
                    severity = ValidationSeverity.HIGH
                
                self._record_validation(
                    "Cross-Database Service Consistency",
                    status,
                    severity,
                    f"Service consistency score: {consistency_score:.1f}%",
                    {
                        "consistency_score": consistency_score,
                        "common_services": len(common_services),
                        "missing_from_timescale": list(missing_from_timescale),
                        "missing_from_neo4j": list(missing_from_neo4j)
                    },
                    ["Sync service data between databases", "Check data ingestion pipelines"] if consistency_score < 80 else []
                )
            else:
                self._record_validation(
                    "Cross-Database Service Consistency",
                    "failed",
                    ValidationSeverity.HIGH,
                    "Unable to retrieve service data from one or both databases",
                    {"neo4j_services": len(neo4j_services), "timescale_services": len(timescale_services)},
                    ["Check data availability in both databases", "Verify query functionality"]
                )
                
        except Exception as e:
            self._record_validation(
                "Cross-Database Service Consistency",
                "error",
                ValidationSeverity.HIGH,
                f"Consistency check failed: {str(e)}",
                {"error": str(e)},
                ["Check database connectivity", "Verify query permissions"]
            )
    
    async def _validate_timeseries_quality(self):
        """Validate time series data quality and completeness"""
        
        try:
            conn = await get_timescale_connection()
            try:
                # Check data freshness (data within last hour)
                freshness_query = """
                SELECT 
                    COUNT(*) as recent_records,
                    MAX(time) as latest_timestamp
                FROM system_metrics 
                WHERE time >= NOW() - INTERVAL '1 hour'
                """
                
                result = await conn.fetchrow(freshness_query)
                recent_records = result["recent_records"]
                latest_timestamp = result["latest_timestamp"]
                
                if recent_records > 0:
                    age_minutes = (datetime.utcnow() - latest_timestamp).total_seconds() / 60 if latest_timestamp else float('inf')
                    
                    if age_minutes <= 10:
                        status, severity = "passed", ValidationSeverity.LOW
                    elif age_minutes <= 60:
                        status, severity = "warning", ValidationSeverity.MEDIUM  
                    else:
                        status, severity = "failed", ValidationSeverity.HIGH
                    
                    self._record_validation(
                        "Time Series Data Freshness",
                        status,
                        severity,
                        f"Latest data is {age_minutes:.1f} minutes old",
                        {"recent_records": recent_records, "age_minutes": age_minutes},
                        ["Check data ingestion pipeline", "Verify metric collection"] if age_minutes > 10 else []
                    )
                else:
                    self._record_validation(
                        "Time Series Data Freshness",
                        "failed",
                        ValidationSeverity.CRITICAL,
                        "No recent data found in last hour",
                        {"recent_records": 0},
                        ["Check data ingestion", "Verify metric collection services", "Check database permissions"]
                    )
                
                # Check for data gaps
                gap_query = """
                WITH time_buckets AS (
                    SELECT time_bucket('5 minutes', time) as bucket, COUNT(*) as records
                    FROM system_metrics 
                    WHERE time >= NOW() - INTERVAL '1 hour'
                    GROUP BY bucket
                    ORDER BY bucket
                )
                SELECT 
                    COUNT(*) as total_buckets,
                    COUNT(*) FILTER (WHERE records = 0) as empty_buckets,
                    AVG(records) as avg_records_per_bucket
                FROM time_buckets
                """
                
                gap_result = await conn.fetchrow(gap_query)
                empty_buckets = gap_result["empty_buckets"] or 0
                total_buckets = gap_result["total_buckets"] or 1
                gap_percentage = (empty_buckets / total_buckets) * 100
                
                if gap_percentage < 5:
                    status, severity = "passed", ValidationSeverity.LOW
                elif gap_percentage < 20:
                    status, severity = "warning", ValidationSeverity.MEDIUM
                else:
                    status, severity = "failed", ValidationSeverity.HIGH
                
                self._record_validation(
                    "Time Series Data Completeness",
                    status,
                    severity,
                    f"Data gaps: {gap_percentage:.1f}% of time buckets empty",
                    {"gap_percentage": gap_percentage, "empty_buckets": empty_buckets, "total_buckets": total_buckets},
                    ["Investigate data collection interruptions", "Check metric pipeline reliability"] if gap_percentage >= 5 else []
                )
                
            finally:
                await release_timescale_connection(conn)
                
        except Exception as e:
            self._record_validation(
                "Time Series Data Quality",
                "error",
                ValidationSeverity.HIGH,
                f"Data quality check failed: {str(e)}",
                {"error": str(e)},
                ["Check database connectivity", "Verify table structure"]
            )
    
    async def _validate_graph_relationships(self):
        """Validate Neo4j graph relationships and data integrity"""
        
        try:
            with get_neo4j_session() as session:
                # Check for orphaned nodes (nodes with no relationships)
                orphan_query = """
                MATCH (n)
                WHERE NOT (n)--()
                RETURN labels(n) as node_types, count(n) as orphan_count
                """
                
                result = session.run(orphan_query)
                orphaned_nodes = list(result)
                total_orphans = sum(record["orphan_count"] for record in orphaned_nodes)
                
                if total_orphans == 0:
                    self._record_validation(
                        "Graph Relationship Integrity",
                        "passed",
                        ValidationSeverity.LOW,
                        "No orphaned nodes found - all nodes have relationships",
                        {"orphaned_nodes": 0},
                        []
                    )
                elif total_orphans < 10:
                    self._record_validation(
                        "Graph Relationship Integrity",
                        "warning",
                        ValidationSeverity.MEDIUM,
                        f"Found {total_orphans} orphaned nodes",
                        {"orphaned_nodes": total_orphans, "orphan_types": {r["node_types"]: r["orphan_count"] for r in orphaned_nodes}},
                        ["Review data model", "Check relationship creation process"]
                    )
                else:
                    self._record_validation(
                        "Graph Relationship Integrity",
                        "failed",
                        ValidationSeverity.HIGH,
                        f"High number of orphaned nodes: {total_orphans}",
                        {"orphaned_nodes": total_orphans, "orphan_types": {r["node_types"]: r["orphan_count"] for r in orphaned_nodes}},
                        ["Review data ingestion process", "Fix relationship mapping", "Clean up orphaned data"]
                    )
                
                # Check relationship consistency
                relationship_query = """
                CALL db.relationshipTypes() YIELD relationshipType as rel_type
                WITH rel_type
                CALL apoc.cypher.run('MATCH ()-[r:' + rel_type + ']->() RETURN count(r) as count', {}) 
                YIELD value
                RETURN rel_type, value.count as relationship_count
                ORDER BY relationship_count DESC
                """
                
                # Simplified version without APOC
                simple_rel_query = """
                MATCH ()-[r]->()
                RETURN type(r) as relationship_type, count(r) as count
                ORDER BY count DESC
                """
                
                rel_result = session.run(simple_rel_query)
                relationships = list(rel_result)
                
                if relationships:
                    total_relationships = sum(record["count"] for record in relationships)
                    self._record_validation(
                        "Graph Relationship Distribution",
                        "passed",
                        ValidationSeverity.LOW,
                        f"Found {total_relationships} relationships across {len(relationships)} types",
                        {"total_relationships": total_relationships, "relationship_types": len(relationships)},
                        []
                    )
                else:
                    self._record_validation(
                        "Graph Relationship Distribution", 
                        "failed",
                        ValidationSeverity.CRITICAL,
                        "No relationships found in graph database",
                        {"total_relationships": 0},
                        ["Check data import process", "Verify relationship creation", "Review data model"]
                    )
                    
        except Exception as e:
            self._record_validation(
                "Graph Relationship Validation",
                "error",
                ValidationSeverity.HIGH,
                f"Graph validation failed: {str(e)}",
                {"error": str(e)},
                ["Check Neo4j service", "Verify query permissions", "Check database connectivity"]
            )
    
    async def _validate_api_consistency(self):
        """Validate API response consistency and data integrity"""
        
        try:
            # Test executive reporting endpoints
            from .routers.executive_reporting import get_value_metrics, get_dashboard_data, get_infrastructure_overview
            
            # Test value metrics endpoint
            value_result = await get_value_metrics(period="current_month")
            if isinstance(value_result, dict) and "value_summary" in value_result:
                self._record_validation(
                    "API Value Metrics Consistency",
                    "passed",
                    ValidationSeverity.MEDIUM,
                    "Value metrics endpoint returns consistent structure",
                    {"response_keys": len(value_result.keys())},
                    []
                )
            else:
                self._record_validation(
                    "API Value Metrics Consistency",
                    "failed",
                    ValidationSeverity.HIGH,
                    "Value metrics endpoint returns inconsistent structure",
                    {"response_type": type(value_result).__name__},
                    ["Check endpoint implementation", "Verify data service integration"]
                )
            
            # Test dashboard data endpoint
            dashboard_result = await get_dashboard_data(level="ceo", timeframe="7d")
            if isinstance(dashboard_result, dict) and "dashboard_config" in dashboard_result:
                self._record_validation(
                    "API Dashboard Data Consistency",
                    "passed",
                    ValidationSeverity.MEDIUM,
                    "Dashboard data endpoint returns consistent structure",
                    {"response_keys": len(dashboard_result.keys())},
                    []
                )
            else:
                self._record_validation(
                    "API Dashboard Data Consistency",
                    "failed",
                    ValidationSeverity.HIGH,
                    "Dashboard data endpoint returns inconsistent structure",
                    {"response_type": type(dashboard_result).__name__},
                    ["Check endpoint implementation", "Verify response structure"]
                )
            
            # Test infrastructure overview endpoint
            infra_result = await get_infrastructure_overview()
            if isinstance(infra_result, dict) and "infrastructure_summary" in infra_result:
                self._record_validation(
                    "API Infrastructure Overview Consistency",
                    "passed",
                    ValidationSeverity.MEDIUM,
                    "Infrastructure overview endpoint returns consistent structure", 
                    {"response_keys": len(infra_result.keys())},
                    []
                )
            else:
                self._record_validation(
                    "API Infrastructure Overview Consistency",
                    "failed",
                    ValidationSeverity.HIGH,
                    "Infrastructure overview endpoint returns inconsistent structure",
                    {"response_type": type(infra_result).__name__, "has_error": "error" in infra_result if isinstance(infra_result, dict) else False},
                    ["Check endpoint implementation", "Verify database service integration"]
                )
                
        except Exception as e:
            self._record_validation(
                "API Consistency Validation",
                "error",
                ValidationSeverity.HIGH,
                f"API validation failed: {str(e)}",
                {"error": str(e)},
                ["Check API service", "Verify endpoint availability", "Check dependencies"]
            )
    
    async def _validate_performance_thresholds(self):
        """Validate system performance against defined thresholds"""
        
        try:
            # Test query performance
            import time
            
            # Neo4j query performance
            start_time = time.time()
            neo4j_result = self.neo4j_service.get_infrastructure_topology()
            neo4j_time = time.time() - start_time
            
            if neo4j_time < 2.0:
                self._record_validation(
                    "Neo4j Query Performance",
                    "passed",
                    ValidationSeverity.MEDIUM,
                    f"Neo4j query completed in {neo4j_time:.2f}s",
                    {"execution_time": neo4j_time},
                    []
                )
            elif neo4j_time < 5.0:
                self._record_validation(
                    "Neo4j Query Performance",
                    "warning",
                    ValidationSeverity.MEDIUM,
                    f"Neo4j query slow: {neo4j_time:.2f}s",
                    {"execution_time": neo4j_time},
                    ["Optimize Neo4j queries", "Check database performance", "Review indexing"]
                )
            else:
                self._record_validation(
                    "Neo4j Query Performance",
                    "failed",
                    ValidationSeverity.HIGH,
                    f"Neo4j query very slow: {neo4j_time:.2f}s",
                    {"execution_time": neo4j_time},
                    ["Investigate database performance", "Optimize queries", "Check system resources"]
                )
            
            # TimescaleDB query performance
            start_time = time.time()
            timescale_result = await self.timescale_service.get_system_metrics_summary()
            timescale_time = time.time() - start_time
            
            if timescale_time < 2.0:
                self._record_validation(
                    "TimescaleDB Query Performance",
                    "passed",
                    ValidationSeverity.MEDIUM,
                    f"TimescaleDB query completed in {timescale_time:.2f}s",
                    {"execution_time": timescale_time},
                    []
                )
            elif timescale_time < 5.0:
                self._record_validation(
                    "TimescaleDB Query Performance",
                    "warning",
                    ValidationSeverity.MEDIUM,
                    f"TimescaleDB query slow: {timescale_time:.2f}s",
                    {"execution_time": timescale_time},
                    ["Optimize TimescaleDB queries", "Check connection pool", "Review indexes"]
                )
            else:
                self._record_validation(
                    "TimescaleDB Query Performance",
                    "failed",
                    ValidationSeverity.HIGH,
                    f"TimescaleDB query very slow: {timescale_time:.2f}s",
                    {"execution_time": timescale_time},
                    ["Investigate database performance", "Optimize queries", "Check system resources"]
                )
                
        except Exception as e:
            self._record_validation(
                "Performance Threshold Validation",
                "error",
                ValidationSeverity.HIGH,
                f"Performance validation failed: {str(e)}",
                {"error": str(e)},
                ["Check system health", "Verify database connectivity"]
            )
    
    async def _validate_error_handling(self):
        """Validate error handling and resilience"""
        
        # Test error scenarios
        error_scenarios = [
            {
                "name": "Invalid Time Range",
                "test": lambda: self.timescale_service.get_system_metrics_summary(
                    start_time=datetime(2030, 1, 1),
                    end_time=datetime(2030, 1, 2)
                )
            },
            {
                "name": "Non-existent Application", 
                "test": lambda: self.neo4j_service.get_application_architecture("non-existent-app")
            }
        ]
        
        handled_errors = 0
        total_scenarios = len(error_scenarios)
        
        for scenario in error_scenarios:
            try:
                if asyncio.iscoroutinefunction(scenario["test"]):
                    result = await scenario["test"]()
                else:
                    result = scenario["test"]()
                
                # Check if error was handled gracefully (returned structured result instead of raising)
                if isinstance(result, dict) and ("error" in result or result.get("total_count", -1) >= 0):
                    handled_errors += 1
                    
            except Exception:
                # Unhandled exception - error handling needs improvement
                pass
        
        error_handling_score = (handled_errors / total_scenarios) * 100 if total_scenarios > 0 else 0
        
        if error_handling_score >= 90:
            status, severity = "passed", ValidationSeverity.LOW
        elif error_handling_score >= 70:
            status, severity = "warning", ValidationSeverity.MEDIUM
        else:
            status, severity = "failed", ValidationSeverity.HIGH
        
        self._record_validation(
            "Error Handling Coverage",
            status,
            severity,
            f"Error handling score: {error_handling_score:.0f}%",
            {"handled_errors": handled_errors, "total_scenarios": total_scenarios, "coverage_score": error_handling_score},
            ["Improve error handling in services", "Add try-catch blocks", "Return structured error responses"] if error_handling_score < 90 else []
        )
    
    def _record_validation(self, check_name: str, status: str, severity: ValidationSeverity, 
                          message: str, details: Dict[str, Any], recommendations: List[str]):
        """Record a validation result"""
        
        result = ValidationResult(
            check_name=check_name,
            status=status,
            severity=severity,
            message=message,
            details=details,
            timestamp=datetime.utcnow(),
            recommendations=recommendations
        )
        
        self.validation_results.append(result)
        
        # Log based on severity
        if severity == ValidationSeverity.CRITICAL:
            logger.error(f"🚨 CRITICAL: {check_name} - {message}")
        elif severity == ValidationSeverity.HIGH:
            logger.warning(f"🔴 HIGH: {check_name} - {message}")
        elif severity == ValidationSeverity.MEDIUM:
            logger.info(f"🟡 MEDIUM: {check_name} - {message}")
        else:
            logger.debug(f"🟢 LOW: {check_name} - {message}")
    
    def _generate_validation_report(self) -> Dict[str, Any]:
        """Generate comprehensive validation report"""
        
        # Count results by status and severity
        status_counts = {"passed": 0, "warning": 0, "failed": 0, "error": 0}
        severity_counts = {severity.value: 0 for severity in ValidationSeverity}
        
        for result in self.validation_results:
            status_counts[result.status] = status_counts.get(result.status, 0) + 1
            severity_counts[result.severity.value] = severity_counts.get(result.severity.value, 0) + 1
        
        # Calculate overall health score
        total_checks = len(self.validation_results)
        if total_checks > 0:
            # Weight scores: passed=1, warning=0.7, failed=0.3, error=0
            weighted_score = (
                status_counts["passed"] * 1.0 +
                status_counts["warning"] * 0.7 +
                status_counts["failed"] * 0.3 +
                status_counts["error"] * 0.0
            ) / total_checks * 100
        else:
            weighted_score = 0
        
        # Determine overall health status
        if weighted_score >= 90:
            overall_status = "excellent"
        elif weighted_score >= 75:
            overall_status = "good"
        elif weighted_score >= 60:
            overall_status = "fair"
        elif weighted_score >= 40:
            overall_status = "poor"
        else:
            overall_status = "critical"
        
        # Collect all recommendations
        all_recommendations = []
        high_priority_issues = []
        
        for result in self.validation_results:
            if result.recommendations:
                all_recommendations.extend(result.recommendations)
            
            if result.severity in [ValidationSeverity.HIGH, ValidationSeverity.CRITICAL] and result.status in ["failed", "error"]:
                high_priority_issues.append({
                    "check": result.check_name,
                    "severity": result.severity.value,
                    "message": result.message,
                    "recommendations": result.recommendations
                })
        
        # Remove duplicate recommendations
        unique_recommendations = list(dict.fromkeys(all_recommendations))
        
        return {
            "validation_completed": datetime.utcnow().isoformat(),
            "overall_status": overall_status,
            "health_score": round(weighted_score, 1),
            "summary": {
                "total_checks": total_checks,
                "status_distribution": status_counts,
                "severity_distribution": severity_counts,
                "high_priority_issues": len(high_priority_issues)
            },
            "detailed_results": [
                {
                    "check_name": result.check_name,
                    "status": result.status,
                    "severity": result.severity.value,
                    "message": result.message,
                    "details": result.details,
                    "recommendations": result.recommendations,
                    "timestamp": result.timestamp.isoformat()
                }
                for result in self.validation_results
            ],
            "high_priority_issues": high_priority_issues,
            "recommendations": {
                "immediate_actions": [rec for rec in unique_recommendations if any(word in rec.lower() for word in ["critical", "fix", "check", "verify"])],
                "optimization_opportunities": [rec for rec in unique_recommendations if any(word in rec.lower() for word in ["optimize", "improve", "review", "enhance"])],
                "monitoring_suggestions": [rec for rec in unique_recommendations if any(word in rec.lower() for word in ["monitor", "track", "observe", "alert"])]
            },
            "system_health_indicators": {
                "database_connectivity": "healthy" if all(r.status == "passed" for r in self.validation_results if "Connectivity" in r.check_name) else "issues_detected",
                "data_quality": "healthy" if all(r.status in ["passed", "warning"] for r in self.validation_results if "Quality" in r.check_name or "Integrity" in r.check_name) else "issues_detected",
                "performance": "healthy" if all(r.status in ["passed", "warning"] for r in self.validation_results if "Performance" in r.check_name) else "issues_detected",
                "error_handling": "healthy" if all(r.status in ["passed", "warning"] for r in self.validation_results if "Error" in r.check_name) else "needs_improvement"
            }
        }

# Convenience functions
async def run_data_validation() -> Dict[str, Any]:
    """Run complete data validation suite"""
    validator = DataValidationService()
    return await validator.run_full_validation()

async def quick_health_check() -> Dict[str, Any]:
    """Run quick health check"""
    validator = DataValidationService()
    
    # Run only critical validations
    await validator._validate_database_connectivity()
    await validator._validate_schema_integrity()
    
    return validator._generate_validation_report()

if __name__ == "__main__":
    # Run validation if script is executed directly
    import asyncio
    import json
    
    async def main():
        print("🔍 Running Ubiquitous Data Validation Suite")
        results = await run_data_validation()
        
        print(f"\n📊 Validation Results:")
        print(f"Overall Status: {results['overall_status'].upper()}")
        print(f"Health Score: {results['health_score']}%")
        print(f"Total Checks: {results['summary']['total_checks']}")
        print(f"Passed: {results['summary']['status_distribution']['passed']}")
        print(f"Warnings: {results['summary']['status_distribution']['warning']}")
        print(f"Failed: {results['summary']['status_distribution']['failed']}")
        print(f"Errors: {results['summary']['status_distribution']['error']}")
        
        if results['high_priority_issues']:
            print(f"\n🚨 High Priority Issues ({len(results['high_priority_issues'])}):")
            for issue in results['high_priority_issues'][:5]:  # Show first 5
                print(f"  - {issue['check']}: {issue['message']}")
        
        # Save results to file
        with open('data_validation_results.json', 'w') as f:
            json.dump(results, f, indent=2, default=str)
        
        print(f"\n📁 Full results saved to: data_validation_results.json")
    
    asyncio.run(main())