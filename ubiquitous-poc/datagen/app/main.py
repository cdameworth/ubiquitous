#!/usr/bin/env python3
"""
Ubiquitous Data Generator Main Entry Point
Orchestrates continuous data generation for the POC environment
"""

import asyncio
import logging
import signal
import sys
from datetime import datetime
from typing import Optional, Dict, Any

from database_populator import DatabasePopulator
from enterprise_topology_generator import EnterpriseTopologyGenerator
from capital_group_generator import CapitalGroupDataGenerator
from cost_savings_calculator import CostSavingsCalculator
from demo_scenario_orchestrator import DemoScenarioOrchestrator


class DataGeneratorService:
    """Main service for continuous data generation"""
    
    def __init__(self):
        self.logger = self._setup_logging()
        self.populator = DatabasePopulator()
        self.enterprise_generator = EnterpriseTopologyGenerator()
        self.capital_group_generator = CapitalGroupDataGenerator()
        self.cost_calculator = CostSavingsCalculator()
        self.demo_orchestrator = DemoScenarioOrchestrator()
        self.running = False
        self.tasks: Dict[str, asyncio.Task] = {}
        
        # Service configuration
        self.config = {
            'historical_days': 90,
            'realtime_interval': 60,  # seconds
            'health_check_interval': 300,  # 5 minutes
            'status_report_interval': 1800,  # 30 minutes
            'use_enterprise_generator': False,  # Use AWS generator with Load Balancers and Web Services
        }
    
    def _setup_logging(self) -> logging.Logger:
        """Configure logging for the service"""
        logger = logging.getLogger('datagen_service')
        logger.setLevel(logging.INFO)
        
        if not logger.handlers:
            # Console handler
            console_handler = logging.StreamHandler()
            console_formatter = logging.Formatter(
                '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
            )
            console_handler.setFormatter(console_formatter)
            logger.addHandler(console_handler)
            
            # File handler
            try:
                file_handler = logging.FileHandler('/app/logs/datagen.log')
                file_handler.setFormatter(console_formatter)
                logger.addHandler(file_handler)
            except:
                # Fallback if log directory doesn't exist
                pass
        
        return logger
    
    async def initialize(self) -> bool:
        """Initialize the data generation service"""
        try:
            self.logger.info("🚀 Initializing Ubiquitous Data Generator Service")
            
            # Connect to databases
            self.logger.info("Connecting to databases...")
            if not await self.populator.connect_databases():
                self.logger.error("Failed to connect to databases")
                return False
            
            self.logger.info("✅ Database connections established")
            
            # Check if this is first run or continuation
            status = await self.populator.get_population_status()
            total_nodes = status.get('infrastructure', {}).get('total_nodes', 0)
            total_records = status.get('metrics', {}).get('total_records', 0)
            
            if total_nodes == 0:
                self.logger.info("First run detected - populating infrastructure...")
                await self._initial_population()
            else:
                self.logger.info(f"Existing data detected: {total_nodes} nodes, {total_records} records")
                # Force regeneration to ensure latest infrastructure updates
                self.logger.info("🔄 Force regenerating infrastructure with latest updates...")
                await self._initial_population()
            
            return True
            
        except Exception as e:
            self.logger.error(f"Initialization failed: {e}")
            return False
    
    async def _initial_population(self):
        """Perform initial data population using enhanced enterprise generator"""
        try:
            if self.config['use_enterprise_generator']:
                self.logger.info("🏗️ Using enhanced enterprise topology generator...")
                
                # Generate enterprise-scale topology (50,000+ nodes)
                self.logger.info("Generating enterprise-scale infrastructure topology...")
                enterprise_topology = self.enterprise_generator.generate_enterprise_topology()
                
                # Generate Capital Group specific data
                self.logger.info("🏦 Generating Capital Group specific data patterns...")
                capital_group_data = self.capital_group_generator.generate_capital_group_complete_dataset()
                
                # Calculate cost optimization opportunities
                self.logger.info("💰 Calculating cost optimization scenarios...")
                cost_savings_data = self.cost_calculator.generate_savings_dashboard_data(enterprise_topology)
                
                # Setup demo scenarios
                self.logger.info("🎭 Setting up demo scenarios...")
                await self.demo_orchestrator.setup_all_scenarios()
                
                self.logger.info(f"✅ Enterprise infrastructure generated: 50,000+ nodes")
                self.logger.info(f"✅ Capital Group data: {len(capital_group_data['services'])} services")
                self.logger.info(f"✅ Cost savings: ${cost_savings_data['dashboard_widgets']['total_annual_savings']:,.0f} opportunity")
                
            else:
                # Use original infrastructure generator
                self.logger.info("🏗️ Populating AWS infrastructure topology...")
                infrastructure = await self.populator.populate_infrastructure()
                node_count = len(infrastructure.get('nodes', []))
                self.logger.info(f"✅ Infrastructure populated: {node_count} nodes")
            
            # Populate historical metrics
            days_back = self.config['historical_days']
            self.logger.info(f"📊 Populating {days_back} days of historical metrics...")
            success = await self.populator.populate_historical_metrics(days_back)
            
            if success:
                self.logger.info("✅ Historical metrics population complete")
            else:
                self.logger.warning("⚠️ Historical metrics population had issues")
            
            # Show final status
            status = await self.populator.get_population_status()
            self.logger.info(f"📋 Initial population complete:")
            self.logger.info(f"  Infrastructure nodes: {status['infrastructure'].get('total_nodes', 0)}")
            self.logger.info(f"  Metrics records: {status['metrics'].get('total_records', 0)}")
            self.logger.info(f"  Cache keys: {status['cache'].get('keys', 0)}")
            
        except Exception as e:
            self.logger.error(f"Initial population failed: {e}")
            raise
    
    async def start(self):
        """Start the data generation service"""
        try:
            self.running = True
            self.logger.info("🎯 Starting continuous data generation...")
            
            # Start background tasks
            self.tasks['realtime_metrics'] = asyncio.create_task(
                self._realtime_metrics_task()
            )
            
            self.tasks['health_check'] = asyncio.create_task(
                self._health_check_task()
            )
            
            self.tasks['status_report'] = asyncio.create_task(
                self._status_report_task()
            )
            
            self.logger.info("✅ All background tasks started")
            
            # Wait for tasks to complete or service to stop
            await self._wait_for_completion()
            
        except Exception as e:
            self.logger.error(f"Service error: {e}")
            raise
    
    async def _realtime_metrics_task(self):
        """Background task for real-time metrics generation"""
        self.logger.info("🔄 Real-time metrics generation started")
        
        # Get infrastructure components once
        components = await self.populator._get_infrastructure_components()
        
        while self.running:
            try:
                # Generate current metrics
                current_metrics = self.populator.metrics_generator.generate_realtime_metrics(components)
                
                # Insert into database
                await self.populator._insert_metrics_batch(current_metrics)
                
                # Cache latest metrics in Redis
                await self.populator._cache_latest_metrics(current_metrics)
                
                # Calculate total records generated this cycle
                total_records = sum(len(records) for records in current_metrics.values())
                self.logger.debug(f"Generated {total_records} metrics records")
                
                # Wait for next interval
                await asyncio.sleep(self.config['realtime_interval'])
                
            except Exception as e:
                self.logger.error(f"Real-time metrics error: {e}")
                await asyncio.sleep(10)  # Short retry delay
    
    async def _health_check_task(self):
        """Background task for health monitoring"""
        self.logger.info("🏥 Health check monitoring started")
        
        while self.running:
            try:
                # Test database connections
                await self.populator._test_connections()
                
                # Check for any stuck processes
                status = await self.populator.get_population_status()
                
                # Log health status
                self.logger.debug("Health check passed - all systems operational")
                
                await asyncio.sleep(self.config['health_check_interval'])
                
            except Exception as e:
                self.logger.warning(f"Health check failed: {e}")
                # Attempt reconnection
                try:
                    await self.populator.connect_databases()
                    self.logger.info("Database reconnection successful")
                except Exception as reconnect_error:
                    self.logger.error(f"Reconnection failed: {reconnect_error}")
                
                await asyncio.sleep(30)  # Shorter interval after failure
    
    async def _status_report_task(self):
        """Background task for periodic status reporting"""
        self.logger.info("📊 Status reporting started")
        
        while self.running:
            try:
                status = await self.populator.get_population_status()
                
                # Log comprehensive status
                self.logger.info("=== DATA GENERATION STATUS REPORT ===")
                self.logger.info(f"Timestamp: {status.get('timestamp', 'unknown')}")
                
                infra = status.get('infrastructure', {})
                self.logger.info(f"Infrastructure nodes: {infra.get('total_nodes', 0)}")
                for node_type, count in infra.get('nodes', {}).items():
                    self.logger.info(f"  {node_type}: {count}")
                
                metrics = status.get('metrics', {})
                self.logger.info(f"Total metrics records: {metrics.get('total_records', 0)}")
                for table, count in metrics.get('table_counts', {}).items():
                    if count > 0:
                        self.logger.info(f"  {table}: {count:,}")
                
                cache = status.get('cache', {})
                self.logger.info(f"Cache keys: {cache.get('keys', 0)}")
                self.logger.info(f"Memory usage: {cache.get('memory_usage', 'unknown')}")
                self.logger.info("=====================================")
                
                await asyncio.sleep(self.config['status_report_interval'])
                
            except Exception as e:
                self.logger.error(f"Status report error: {e}")
                await asyncio.sleep(60)  # Retry in 1 minute
    
    async def _wait_for_completion(self):
        """Wait for all tasks to complete or service to stop"""
        try:
            # Wait for any task to complete (shouldn't happen in normal operation)
            done, pending = await asyncio.wait(
                self.tasks.values(),
                return_when=asyncio.FIRST_COMPLETED
            )
            
            # If any task completed unexpectedly, log it
            for task in done:
                if task.exception():
                    self.logger.error(f"Task failed: {task.exception()}")
                else:
                    self.logger.warning("Task completed unexpectedly")
            
            # Cancel remaining tasks
            for task in pending:
                task.cancel()
                
        except Exception as e:
            self.logger.error(f"Wait completion error: {e}")
    
    async def stop(self):
        """Stop the data generation service"""
        self.logger.info("🛑 Stopping data generation service...")
        self.running = False
        
        # Cancel all tasks
        for name, task in self.tasks.items():
            if not task.done():
                self.logger.info(f"Cancelling {name} task...")
                task.cancel()
                try:
                    await task
                except asyncio.CancelledError:
                    pass
        
        # Cleanup database connections
        await self.populator.cleanup()
        
        self.logger.info("✅ Data generation service stopped")
    
    def setup_signal_handlers(self):
        """Setup signal handlers for graceful shutdown"""
        def signal_handler(signum, frame):
            self.logger.info(f"Received signal {signum}, initiating shutdown...")
            asyncio.create_task(self.stop())
        
        signal.signal(signal.SIGINT, signal_handler)
        signal.signal(signal.SIGTERM, signal_handler)


async def main():
    """Main entry point"""
    service = DataGeneratorService()
    
    try:
        # Setup signal handlers
        service.setup_signal_handlers()
        
        # Initialize service
        if not await service.initialize():
            print("❌ Service initialization failed")
            sys.exit(1)
        
        print("✅ Data Generator Service initialized")
        print("🎯 Starting continuous data generation...")
        print("Press Ctrl+C to stop")
        
        # Start service
        await service.start()
        
    except KeyboardInterrupt:
        print("\n⚠️ Service interrupted by user")
    except Exception as e:
        print(f"❌ Service failed: {e}")
        sys.exit(1)
    finally:
        await service.stop()


if __name__ == "__main__":
    # Check for command line arguments
    if len(sys.argv) > 1:
        if sys.argv[1] == "--help":
            print("""
Ubiquitous Data Generator Service

Usage:
  python main.py              # Run full service with initialization
  python main.py --populate   # Run population only (no real-time)
  python main.py --realtime   # Run real-time generation only
  python main.py --status     # Show current status and exit
  python main.py --help       # Show this help

Environment Variables:
  HISTORICAL_DAYS=90          # Days of historical data to generate
  REALTIME_INTERVAL=60        # Seconds between real-time updates
  LOG_LEVEL=INFO              # Logging level
            """)
            sys.exit(0)
        
        elif sys.argv[1] == "--populate":
            # Run population only
            async def populate_only():
                service = DataGeneratorService()
                await service.initialize()
                print("✅ Population complete")
            
            asyncio.run(populate_only())
            sys.exit(0)
        
        elif sys.argv[1] == "--enterprise":
            # Run enterprise generator only
            async def generate_enterprise_only():
                logger = logging.getLogger('enterprise_gen')
                logger.setLevel(logging.INFO)
                
                # Setup console handler
                console_handler = logging.StreamHandler()
                console_formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
                console_handler.setFormatter(console_formatter)
                logger.addHandler(console_handler)
                
                logger.info("🏗️ Running enterprise topology generator...")
                generator = EnterpriseTopologyGenerator()
                topology = generator.generate_enterprise_topology()
                
                logger.info("🏦 Generating Capital Group data...")
                cg_generator = CapitalGroupDataGenerator()
                cg_data = cg_generator.generate_capital_group_complete_dataset()
                
                logger.info("💰 Calculating cost optimizations...")
                calculator = CostSavingsCalculator()
                savings_data = calculator.generate_savings_dashboard_data(topology)
                
                print(f"✅ Enterprise generation complete:")
                print(f"  Infrastructure nodes: 50,000+")
                print(f"  Capital Group services: {len(cg_data['services'])}")
                print(f"  Annual savings opportunity: ${savings_data['dashboard_widgets']['total_annual_savings']:,.0f}")
            
            asyncio.run(generate_enterprise_only())
            sys.exit(0)
        
        elif sys.argv[1] == "--status":
            # Show status only
            async def show_status():
                populator = DatabasePopulator()
                await populator.connect_databases()
                status = await populator.get_population_status()
                
                print("=== UBIQUITOUS DATA GENERATOR STATUS ===")
                print(f"Timestamp: {status.get('timestamp')}")
                print(f"Infrastructure nodes: {status['infrastructure'].get('total_nodes', 0)}")
                print(f"Metrics records: {status['metrics'].get('total_records', 0)}")
                print(f"Cache keys: {status['cache'].get('keys', 0)}")
                print("========================================")
                
                await populator.cleanup()
            
            asyncio.run(show_status())
            sys.exit(0)
    
    # Run full service
    asyncio.run(main())