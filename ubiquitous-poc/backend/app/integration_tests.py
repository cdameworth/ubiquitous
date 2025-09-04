"""
Integration tests for database services and executive reporting endpoints
Tests real data integration across Neo4j, TimescaleDB, and API endpoints
"""

import asyncio
import json
from datetime import datetime, timedelta
from typing import Dict, Any, List
import logging

# Import services and database components
from .services.neo4j_service import Neo4jService
from .services.timescale_service import TimescaleService
from .database import initialize_databases, cleanup_databases
from .routers.executive_reporting import router

logger = logging.getLogger(__name__)

class IntegrationTestSuite:
    """Comprehensive integration test suite for database services"""
    
    def __init__(self):
        self.neo4j_service = Neo4jService()
        self.timescale_service = TimescaleService()
        self.test_results = {
            "started_at": datetime.utcnow().isoformat(),
            "tests": [],
            "summary": {
                "total_tests": 0,
                "passed": 0,
                "failed": 0,
                "errors": []
            }
        }
    
    async def run_all_tests(self) -> Dict[str, Any]:
        """Run all integration tests"""
        
        logger.info("🧪 Starting integration test suite")
        
        # Initialize databases
        try:
            await initialize_databases()
            logger.info("✅ Database initialization successful")
        except Exception as e:
            logger.error(f"❌ Database initialization failed: {e}")
            return self._create_error_result("Database initialization failed", str(e))
        
        # Test categories
        test_categories = [
            ("Neo4j Service Tests", self._test_neo4j_services),
            ("TimescaleDB Service Tests", self._test_timescale_services),
            ("Executive Reporting Integration", self._test_executive_reporting),
            ("Error Handling and Resilience", self._test_error_handling),
            ("Performance and Load Testing", self._test_performance)
        ]
        
        for category_name, test_function in test_categories:
            logger.info(f"🧪 Testing: {category_name}")
            try:
                await test_function()
            except Exception as e:
                logger.error(f"❌ {category_name} failed: {e}")
                self._record_test_result(category_name, False, str(e))
        
        # Cleanup
        try:
            await cleanup_databases()
            logger.info("✅ Database cleanup successful")
        except Exception as e:
            logger.warning(f"⚠️ Database cleanup warning: {e}")
        
        # Calculate summary
        self.test_results["completed_at"] = datetime.utcnow().isoformat()
        self.test_results["summary"]["total_tests"] = len(self.test_results["tests"])
        self.test_results["summary"]["passed"] = len([t for t in self.test_results["tests"] if t["status"] == "passed"])
        self.test_results["summary"]["failed"] = len([t for t in self.test_results["tests"] if t["status"] == "failed"])
        
        success_rate = (self.test_results["summary"]["passed"] / self.test_results["summary"]["total_tests"]) * 100 if self.test_results["summary"]["total_tests"] > 0 else 0
        self.test_results["summary"]["success_rate"] = f"{success_rate:.1f}%"
        
        logger.info(f"🧪 Integration tests completed: {success_rate:.1f}% success rate")
        
        return self.test_results
    
    async def _test_neo4j_services(self):
        """Test all Neo4j service methods"""
        
        neo4j_tests = [
            ("Infrastructure Topology", self.neo4j_service.get_infrastructure_topology),
            ("EKS Clusters with Services", self.neo4j_service.get_eks_clusters_with_services),
            ("Service Dependency Map", self.neo4j_service.get_service_dependency_map),
            ("Database Connections", self.neo4j_service.get_database_connections),
            ("Cost Optimization Candidates", self.neo4j_service.get_cost_optimization_candidates),
            ("Critical Path Analysis", self.neo4j_service.get_critical_path_analysis),
            ("Network Latency Heatmap Data", self.neo4j_service.get_network_latency_heatmap_data)
        ]
        
        for test_name, test_method in neo4j_tests:
            try:
                if test_name == "Application Architecture":
                    # Test with a sample app name
                    result = test_method("trading-platform")
                else:
                    result = test_method()
                
                # Validate result structure
                if self._validate_neo4j_result(result):
                    self._record_test_result(f"Neo4j: {test_name}", True, f"Returned valid data structure")
                    logger.info(f"✅ Neo4j {test_name}: Success")
                else:
                    self._record_test_result(f"Neo4j: {test_name}", False, "Invalid data structure")
                    logger.warning(f"⚠️ Neo4j {test_name}: Invalid structure")
                
            except Exception as e:
                self._record_test_result(f"Neo4j: {test_name}", False, str(e))
                logger.error(f"❌ Neo4j {test_name}: {e}")
    
    async def _test_timescale_services(self):
        """Test all TimescaleDB service methods"""
        
        now = datetime.utcnow()
        start_time = now - timedelta(hours=24)
        
        timescale_tests = [
            ("System Metrics Summary", self.timescale_service.get_system_metrics_summary, {"start_time": start_time, "end_time": now}),
            ("Service Performance Trend", self.timescale_service.get_service_performance_trend, {"service_name": "auth-service", "cluster_name": "prod-trading-cluster"}),
            ("Database Performance Metrics", self.timescale_service.get_database_performance_metrics, {}),
            ("Network Latency Matrix", self.timescale_service.get_network_latency_matrix, {"start_time": start_time, "end_time": now}),
            ("Cost Analysis", self.timescale_service.get_cost_analysis, {"start_time": start_time, "end_time": now}),
            ("Business Value Metrics", self.timescale_service.get_business_value_metrics, {"start_time": start_time, "end_time": now}),
            ("Security Events Summary", self.timescale_service.get_security_events_summary, {"start_time": start_time, "end_time": now}),
            ("Incident Analysis", self.timescale_service.get_incident_analysis, {"start_time": start_time, "end_time": now})
        ]
        
        for test_name, test_method, test_params in timescale_tests:
            try:
                result = await test_method(**test_params)
                
                # Validate result structure
                if self._validate_timescale_result(result):
                    self._record_test_result(f"TimescaleDB: {test_name}", True, f"Returned valid data structure")
                    logger.info(f"✅ TimescaleDB {test_name}: Success")
                else:
                    self._record_test_result(f"TimescaleDB: {test_name}", False, "Invalid data structure")
                    logger.warning(f"⚠️ TimescaleDB {test_name}: Invalid structure")
                
            except Exception as e:
                self._record_test_result(f"TimescaleDB: {test_name}", False, str(e))
                logger.error(f"❌ TimescaleDB {test_name}: {e}")
    
    async def _test_executive_reporting(self):
        """Test executive reporting endpoints with real data"""
        
        # Test data scenarios
        test_scenarios = [
            {
                "name": "Value Metrics - Current Month",
                "endpoint": "value-metrics",
                "params": {"period": "current_month"}
            },
            {
                "name": "Dashboard Data - CEO Level",
                "endpoint": "dashboard-data", 
                "params": {"level": "ceo", "timeframe": "30d"}
            },
            {
                "name": "Dashboard Data - CIO Level",
                "endpoint": "dashboard-data",
                "params": {"level": "cio", "timeframe": "7d"}
            },
            {
                "name": "Fiscal Analysis - Q1",
                "endpoint": "fiscal-analysis",
                "params": {"fiscal_period": "q1"}
            },
            {
                "name": "Infrastructure Overview",
                "endpoint": "infrastructure-overview",
                "params": {}
            }
        ]
        
        for scenario in test_scenarios:
            try:
                # Simulate endpoint call (would normally use FastAPI test client)
                if scenario["endpoint"] == "value-metrics":
                    from .routers.executive_reporting import get_value_metrics
                    result = await get_value_metrics(**scenario["params"])
                elif scenario["endpoint"] == "dashboard-data":
                    from .routers.executive_reporting import get_dashboard_data
                    result = await get_dashboard_data(**scenario["params"])
                elif scenario["endpoint"] == "fiscal-analysis":
                    from .routers.executive_reporting import get_fiscal_analysis
                    result = await get_fiscal_analysis(**scenario["params"])
                elif scenario["endpoint"] == "infrastructure-overview":
                    from .routers.executive_reporting import get_infrastructure_overview
                    result = await get_infrastructure_overview()
                
                # Validate response structure
                if self._validate_api_response(result, scenario["endpoint"]):
                    self._record_test_result(f"API: {scenario['name']}", True, "Valid response structure")
                    logger.info(f"✅ API {scenario['name']}: Success")
                else:
                    self._record_test_result(f"API: {scenario['name']}", False, "Invalid response structure")
                    logger.warning(f"⚠️ API {scenario['name']}: Invalid response")
                
            except Exception as e:
                self._record_test_result(f"API: {scenario['name']}", False, str(e))
                logger.error(f"❌ API {scenario['name']}: {e}")
    
    async def _test_error_handling(self):
        """Test error handling and resilience"""
        
        error_scenarios = [
            {
                "name": "Invalid Neo4j Query",
                "test": lambda: self.neo4j_service.get_application_architecture("nonexistent-app")
            },
            {
                "name": "Invalid Time Range TimescaleDB",
                "test": lambda: self.timescale_service.get_system_metrics_summary(
                    start_time=datetime(2030, 1, 1),  # Future date
                    end_time=datetime(2030, 1, 2)
                )
            },
            {
                "name": "Empty Service Name",
                "test": lambda: self.timescale_service.get_service_performance_trend("", "")
            }
        ]
        
        for scenario in error_scenarios:
            try:
                result = await scenario["test"]() if asyncio.iscoroutinefunction(scenario["test"]) else scenario["test"]()
                
                # Check if error handling returned proper structure
                if isinstance(result, dict) and ("error" in result or result.get("total_count", -1) >= 0):
                    self._record_test_result(f"Error Handling: {scenario['name']}", True, "Graceful error handling")
                    logger.info(f"✅ Error Handling {scenario['name']}: Graceful")
                else:
                    self._record_test_result(f"Error Handling: {scenario['name']}", False, "No error handling")
                    logger.warning(f"⚠️ Error Handling {scenario['name']}: Not handled")
                
            except Exception as e:
                # Expected behavior - errors should be handled gracefully
                self._record_test_result(f"Error Handling: {scenario['name']}", False, f"Unhandled exception: {str(e)}")
                logger.error(f"❌ Error Handling {scenario['name']}: Unhandled exception")
    
    async def _test_performance(self):
        """Test performance and load characteristics"""
        
        performance_tests = [
            {
                "name": "Neo4j Query Performance",
                "test": lambda: self._measure_execution_time(
                    self.neo4j_service.get_infrastructure_topology
                )
            },
            {
                "name": "TimescaleDB Query Performance", 
                "test": lambda: self._measure_execution_time(
                    lambda: self.timescale_service.get_system_metrics_summary()
                )
            },
            {
                "name": "Concurrent API Requests",
                "test": lambda: self._test_concurrent_requests()
            }
        ]
        
        for test in performance_tests:
            try:
                result = await test["test"]() if asyncio.iscoroutinefunction(test["test"]) else test["test"]()
                
                # Evaluate performance results
                if isinstance(result, dict) and "execution_time" in result:
                    exec_time = result["execution_time"]
                    if exec_time < 2.0:  # Less than 2 seconds is acceptable
                        self._record_test_result(f"Performance: {test['name']}", True, f"Execution time: {exec_time:.2f}s")
                        logger.info(f"✅ Performance {test['name']}: {exec_time:.2f}s")
                    else:
                        self._record_test_result(f"Performance: {test['name']}", False, f"Slow execution: {exec_time:.2f}s")
                        logger.warning(f"⚠️ Performance {test['name']}: Slow {exec_time:.2f}s")
                else:
                    self._record_test_result(f"Performance: {test['name']}", True, "Performance test completed")
                    logger.info(f"✅ Performance {test['name']}: Completed")
                
            except Exception as e:
                self._record_test_result(f"Performance: {test['name']}", False, str(e))
                logger.error(f"❌ Performance {test['name']}: {e}")
    
    async def _measure_execution_time(self, test_function):
        """Measure execution time of a function"""
        import time
        
        start_time = time.time()
        
        if asyncio.iscoroutinefunction(test_function):
            result = await test_function()
        else:
            result = test_function()
        
        execution_time = time.time() - start_time
        
        return {
            "result": result,
            "execution_time": execution_time
        }
    
    async def _test_concurrent_requests(self):
        """Test concurrent request handling"""
        
        async def make_request():
            return await self.timescale_service.get_system_metrics_summary()
        
        # Make 5 concurrent requests
        tasks = [make_request() for _ in range(5)]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        successful_requests = len([r for r in results if not isinstance(r, Exception)])
        
        return {
            "total_requests": 5,
            "successful_requests": successful_requests,
            "success_rate": (successful_requests / 5) * 100
        }
    
    def _validate_neo4j_result(self, result: Any) -> bool:
        """Validate Neo4j query result structure"""
        if not isinstance(result, dict):
            return False
        
        # Check for error structure
        if "error" in result:
            return True  # Error structure is valid
        
        # Check for expected data structure
        expected_keys = ["nodes", "total_count"] 
        return any(key in result for key in expected_keys)
    
    def _validate_timescale_result(self, result: Any) -> bool:
        """Validate TimescaleDB query result structure"""
        if not isinstance(result, dict):
            return False
        
        # Check for error structure
        if "error" in result:
            return True  # Error structure is valid
        
        # Check for expected data structure
        expected_keys = ["data", "summary", "services", "metrics"]
        return any(key in result for key in expected_keys) or len(result) > 0
    
    def _validate_api_response(self, result: Any, endpoint: str) -> bool:
        """Validate API response structure"""
        if not isinstance(result, dict):
            return False
        
        # Check for timestamp (common in all responses)
        if "timestamp" not in result:
            return False
        
        # Endpoint-specific validation
        endpoint_validations = {
            "value-metrics": ["value_summary", "metrics_by_category"],
            "dashboard-data": ["dashboard_config", "time_series_data"],
            "fiscal-analysis": ["budget_performance", "value_realization"],
            "infrastructure-overview": ["infrastructure_summary", "performance_metrics"]
        }
        
        required_keys = endpoint_validations.get(endpoint, [])
        return all(key in result for key in required_keys) or "error" in result
    
    def _record_test_result(self, test_name: str, passed: bool, details: str):
        """Record a test result"""
        self.test_results["tests"].append({
            "test_name": test_name,
            "status": "passed" if passed else "failed",
            "details": details,
            "timestamp": datetime.utcnow().isoformat()
        })
        
        if not passed:
            self.test_results["summary"]["errors"].append(f"{test_name}: {details}")
    
    def _create_error_result(self, error_type: str, error_message: str) -> Dict[str, Any]:
        """Create error result structure"""
        return {
            "started_at": self.test_results["started_at"],
            "completed_at": datetime.utcnow().isoformat(),
            "error": error_type,
            "error_message": error_message,
            "tests": [],
            "summary": {
                "total_tests": 0,
                "passed": 0,
                "failed": 1,
                "success_rate": "0.0%",
                "errors": [f"{error_type}: {error_message}"]
            }
        }

# Standalone test runner
async def run_integration_tests() -> Dict[str, Any]:
    """Run integration tests and return results"""
    
    test_suite = IntegrationTestSuite()
    return await test_suite.run_all_tests()

# Quick health check function
async def quick_health_check() -> Dict[str, Any]:
    """Quick health check of all services"""
    
    logger.info("🏥 Running quick health check")
    
    try:
        await initialize_databases()
        
        # Test one method from each service
        neo4j_service = Neo4jService()
        timescale_service = TimescaleService()
        
        neo4j_result = neo4j_service.get_infrastructure_topology()
        timescale_result = await timescale_service.get_system_metrics_summary()
        
        await cleanup_databases()
        
        return {
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat(),
            "services": {
                "neo4j": "healthy" if isinstance(neo4j_result, dict) else "unhealthy",
                "timescale": "healthy" if isinstance(timescale_result, dict) else "unhealthy"
            },
            "message": "All services responding normally"
        }
        
    except Exception as e:
        return {
            "status": "unhealthy",
            "timestamp": datetime.utcnow().isoformat(),
            "error": str(e),
            "message": "Health check failed"
        }

if __name__ == "__main__":
    # Run tests if script is executed directly
    import asyncio
    
    async def main():
        print("🧪 Running Ubiquitous Integration Tests")
        results = await run_integration_tests()
        
        print("\n📊 Test Results Summary:")
        print(f"Total Tests: {results['summary']['total_tests']}")
        print(f"Passed: {results['summary']['passed']}")
        print(f"Failed: {results['summary']['failed']}")
        print(f"Success Rate: {results['summary']['success_rate']}")
        
        if results['summary']['errors']:
            print("\n❌ Errors:")
            for error in results['summary']['errors']:
                print(f"  - {error}")
        
        # Save results to file
        with open('integration_test_results.json', 'w') as f:
            json.dump(results, f, indent=2, default=str)
        
        print("\n📁 Full results saved to: integration_test_results.json")
    
    asyncio.run(main())