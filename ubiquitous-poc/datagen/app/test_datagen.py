#!/usr/bin/env python3
"""
Data Generator Test Suite
Validates all components of the data generation system
"""

import asyncio
import logging
from datetime import datetime, timedelta
from typing import Dict, Any

from aws_infrastructure_generator import AWSInfrastructureGenerator
from metrics_generator import MetricsGenerator
from database_populator import DatabasePopulator


class DataGeneratorTester:
    """Test suite for data generation components"""
    
    def __init__(self):
        self.logger = self._setup_logging()
        self.results: Dict[str, Any] = {
            'tests': {},
            'summary': {},
            'timestamp': datetime.utcnow().isoformat()
        }
    
    def _setup_logging(self) -> logging.Logger:
        """Setup test logging"""
        logger = logging.getLogger('datagen_test')
        logger.setLevel(logging.INFO)
        
        if not logger.handlers:
            handler = logging.StreamHandler()
            formatter = logging.Formatter('%(levelname)s - %(message)s')
            handler.setFormatter(formatter)
            logger.addHandler(handler)
        
        return logger
    
    async def run_all_tests(self) -> bool:
        """Run complete test suite"""
        self.logger.info("🧪 Starting Data Generator Test Suite")
        
        tests = [
            ('infrastructure_generation', self.test_infrastructure_generation),
            ('metrics_generation', self.test_metrics_generation),
            ('database_connections', self.test_database_connections),
            ('data_population', self.test_data_population),
            ('realtime_generation', self.test_realtime_generation)
        ]
        
        passed = 0
        total = len(tests)
        
        for test_name, test_func in tests:
            try:
                self.logger.info(f"Running {test_name}...")
                result = await test_func()
                
                if result:
                    self.logger.info(f"✅ {test_name} PASSED")
                    passed += 1
                else:
                    self.logger.error(f"❌ {test_name} FAILED")
                
                self.results['tests'][test_name] = result
                
            except Exception as e:
                self.logger.error(f"❌ {test_name} ERROR: {e}")
                self.results['tests'][test_name] = False
        
        # Summary
        self.results['summary'] = {
            'passed': passed,
            'total': total,
            'success_rate': (passed / total) * 100
        }
        
        self.logger.info(f"🎯 Test Results: {passed}/{total} passed ({self.results['summary']['success_rate']:.1f}%)")
        
        return passed == total
    
    async def test_infrastructure_generation(self) -> bool:
        """Test AWS infrastructure generation"""
        try:
            generator = AWSInfrastructureGenerator()
            
            # Test VPC generation
            vpcs = generator.generate_vpcs(count=3)
            if len(vpcs) != 3:
                return False
            
            # Test EKS generation
            clusters = generator.generate_eks_clusters(vpcs, count=5)
            if len(clusters) != 5:
                return False
            
            # Test RDS generation
            rds_instances = generator.generate_rds_instances(vpcs, count=7)
            if len(rds_instances) != 7:
                return False
            
            # Test complete topology
            topology = generator.generate_complete_topology()
            
            # Validate topology structure
            required_keys = ['nodes', 'relationships']
            if not all(key in topology for key in required_keys):
                return False
            
            # Check minimum node counts
            node_count = len(topology['nodes'])
            if node_count < 100:  # Should have 155+ nodes
                self.logger.warning(f"Low node count: {node_count}")
                return False
            
            # Check for required node types
            node_types = {node['type'] for node in topology['nodes']}
            required_types = {'VPC', 'EKSCluster', 'RDSInstance', 'EC2Instance', 'Service', 'Application'}
            if not required_types.issubset(node_types):
                missing = required_types - node_types
                self.logger.error(f"Missing node types: {missing}")
                return False
            
            self.logger.info(f"Generated topology: {node_count} nodes, {len(topology['relationships'])} relationships")
            return True
            
        except Exception as e:
            self.logger.error(f"Infrastructure generation test failed: {e}")
            return False
    
    async def test_metrics_generation(self) -> bool:
        """Test metrics generation functionality"""
        try:
            generator = MetricsGenerator()
            
            # Test load pattern calculations
            current_time = datetime.utcnow()
            
            # Business hours pattern
            business_value = generator.apply_load_pattern(1.0, "business_hours", current_time)
            if business_value <= 0:
                return False
            
            # Test service metrics generation
            test_component = {
                'name': 'test-service',
                'type': 'Service',
                'region': 'us-east-1'
            }
            
            system_metrics = generator.generate_system_metrics([test_component], current_time)
            if not system_metrics or 'system_metrics' not in system_metrics:
                return False
            
            # Validate metrics structure
            metrics_record = system_metrics['system_metrics'][0]
            required_fields = ['time', 'service_name', 'cpu_utilization', 'memory_utilization']
            if not all(field in metrics_record for field in required_fields):
                return False
            
            # Test historical batch generation
            start_time = current_time - timedelta(hours=1)
            historical_batch = generator.generate_historical_batch(
                components=[test_component],
                start_time=start_time,
                end_time=current_time,
                interval_minutes=15
            )
            
            if not historical_batch:
                return False
            
            # Test real-time generation
            realtime_metrics = generator.generate_realtime_metrics([test_component])
            if not realtime_metrics:
                return False
            
            self.logger.info("Metrics generation validation successful")
            return True
            
        except Exception as e:
            self.logger.error(f"Metrics generation test failed: {e}")
            return False
    
    async def test_database_connections(self) -> bool:
        """Test database connectivity"""
        try:
            populator = DatabasePopulator()
            
            # Test connection establishment
            connected = await populator.connect_databases()
            if not connected:
                return False
            
            # Test connection validity
            await populator._test_connections()
            
            # Cleanup
            await populator.cleanup()
            
            self.logger.info("Database connections validated")
            return True
            
        except Exception as e:
            self.logger.error(f"Database connection test failed: {e}")
            return False
    
    async def test_data_population(self) -> bool:
        """Test data population functionality"""
        try:
            populator = DatabasePopulator()
            
            # Connect
            if not await populator.connect_databases():
                return False
            
            # Test infrastructure population (small dataset)
            self.logger.info("Testing infrastructure population...")
            
            # Generate small test infrastructure
            infra_generator = AWSInfrastructureGenerator()
            test_infrastructure = {
                'nodes': [
                    {'id': 'vpc-test', 'type': 'VPC', 'name': 'test-vpc', 'region': 'us-east-1', 'cost_monthly': 0},
                    {'id': 'cluster-test', 'type': 'EKSCluster', 'name': 'test-cluster', 'region': 'us-east-1', 'cost_monthly': 100}
                ],
                'relationships': [
                    {'from': 'cluster-test', 'to': 'vpc-test', 'type': 'DEPLOYED_IN', 'properties': {}}
                ]
            }
            
            # Clear and populate test data
            async with populator.neo4j_driver.session() as session:
                await session.run("MATCH (n) DETACH DELETE n")
            
            await populator._insert_infrastructure_components(test_infrastructure)
            
            # Verify data was inserted
            async with populator.neo4j_driver.session() as session:
                result = await session.run("MATCH (n) RETURN count(n) as count")
                record = await result.single()
                if record['count'] != 2:
                    return False
            
            # Test metrics population (small batch)
            components = [{'name': 'test-service', 'type': 'Service', 'region': 'us-east-1'}]
            
            metrics_generator = MetricsGenerator()
            current_time = datetime.utcnow()
            start_time = current_time - timedelta(hours=1)
            
            test_batch = metrics_generator.generate_historical_batch(
                components=components,
                start_time=start_time,
                end_time=current_time,
                interval_minutes=30
            )
            
            await populator._insert_metrics_batch(test_batch)
            
            # Verify metrics data
            async with populator.pg_pool.acquire() as conn:
                count = await conn.fetchval("SELECT COUNT(*) FROM system_metrics")
                if count == 0:
                    return False
            
            await populator.cleanup()
            
            self.logger.info("Data population validation successful")
            return True
            
        except Exception as e:
            self.logger.error(f"Data population test failed: {e}")
            return False
    
    async def test_realtime_generation(self) -> bool:
        """Test real-time generation functionality"""
        try:
            populator = DatabasePopulator()
            
            if not await populator.connect_databases():
                return False
            
            # Test real-time metrics generation
            components = [
                {'name': 'test-service-1', 'type': 'Service', 'region': 'us-east-1'},
                {'name': 'test-service-2', 'type': 'Service', 'region': 'us-west-2'}
            ]
            
            # Generate real-time batch
            current_metrics = populator.metrics_generator.generate_realtime_metrics(components)
            
            if not current_metrics:
                return False
            
            # Test caching
            await populator._cache_latest_metrics(current_metrics)
            
            # Verify cache
            cached_data = await populator.redis_client.keys("latest:*")
            if not cached_data:
                return False
            
            await populator.cleanup()
            
            self.logger.info("Real-time generation validation successful")
            return True
            
        except Exception as e:
            self.logger.error(f"Real-time generation test failed: {e}")
            return False
    
    def print_detailed_results(self):
        """Print detailed test results"""
        print("\n" + "="*50)
        print("DATA GENERATOR TEST RESULTS")
        print("="*50)
        print(f"Timestamp: {self.results['timestamp']}")
        print(f"Overall Success Rate: {self.results['summary']['success_rate']:.1f}%")
        print(f"Tests Passed: {self.results['summary']['passed']}/{self.results['summary']['total']}")
        print("\nIndividual Test Results:")
        
        for test_name, result in self.results['tests'].items():
            status = "✅ PASS" if result else "❌ FAIL"
            print(f"  {test_name}: {status}")
        
        print("="*50)


async def main():
    """Main test execution"""
    tester = DataGeneratorTester()
    
    try:
        success = await tester.run_all_tests()
        tester.print_detailed_results()
        
        if success:
            print("\n🎉 All tests passed! Data generator is ready for deployment.")
            return 0
        else:
            print("\n⚠️ Some tests failed. Check logs for details.")
            return 1
            
    except Exception as e:
        print(f"\n❌ Test suite failed: {e}")
        return 1


if __name__ == "__main__":
    import sys
    exit_code = asyncio.run(main())
    sys.exit(exit_code)