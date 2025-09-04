"""
Metrics Generator for Ubiquitous POC
Generates realistic time-series metrics and populates TimescaleDB
"""

import asyncio
import asyncpg
import random
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
import math
import json

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class MetricsGenerator:
    """Generates synthetic time-series metrics for AWS infrastructure"""
    
    def __init__(self, database_url: str = "postgresql://postgres:ubiquitous123@timeseries:5432/ubiquitous"):
        self.database_url = database_url
        self.pool = None
        
        # Service templates with realistic performance characteristics
        self.service_profiles = {
            "auth-service": {
                "base_cpu": 25, "cpu_variance": 15, "base_memory": 40, "memory_variance": 20,
                "base_response_time": 85, "response_variance": 30, "base_error_rate": 0.2,
                "base_throughput": 150, "throughput_variance": 50, "typical_load_pattern": "steady"
            },
            "payment-api": {
                "base_cpu": 45, "cpu_variance": 25, "base_memory": 60, "memory_variance": 25, 
                "base_response_time": 120, "response_variance": 60, "base_error_rate": 0.5,
                "base_throughput": 80, "throughput_variance": 30, "typical_load_pattern": "business_hours"
            },
            "user-management": {
                "base_cpu": 35, "cpu_variance": 20, "base_memory": 50, "memory_variance": 25,
                "base_response_time": 95, "response_variance": 40, "base_error_rate": 0.3,
                "base_throughput": 120, "throughput_variance": 40, "typical_load_pattern": "steady"
            },
            "notification-service": {
                "base_cpu": 20, "cpu_variance": 10, "base_memory": 30, "memory_variance": 15,
                "base_response_time": 45, "response_variance": 20, "base_error_rate": 0.1,
                "base_throughput": 200, "throughput_variance": 60, "typical_load_pattern": "event_driven"
            },
            "analytics-engine": {
                "base_cpu": 70, "cpu_variance": 20, "base_memory": 75, "memory_variance": 15,
                "base_response_time": 850, "response_variance": 300, "base_error_rate": 1.2,
                "base_throughput": 25, "throughput_variance": 15, "typical_load_pattern": "batch_processing"
            },
            "trading-gateway": {
                "base_cpu": 55, "cpu_variance": 30, "base_memory": 65, "memory_variance": 20,
                "base_response_time": 65, "response_variance": 25, "base_error_rate": 0.8,
                "base_throughput": 300, "throughput_variance": 100, "typical_load_pattern": "market_hours"
            },
            "risk-calculator": {
                "base_cpu": 80, "cpu_variance": 15, "base_memory": 85, "memory_variance": 10,
                "base_response_time": 450, "response_variance": 150, "base_error_rate": 0.4,
                "base_throughput": 45, "throughput_variance": 20, "typical_load_pattern": "batch_processing"
            },
            "portfolio-manager": {
                "base_cpu": 40, "cpu_variance": 25, "base_memory": 55, "memory_variance": 30,
                "base_response_time": 180, "response_variance": 80, "base_error_rate": 0.6,
                "base_throughput": 90, "throughput_variance": 35, "typical_load_pattern": "business_hours"
            },
            "compliance-monitor": {
                "base_cpu": 30, "cpu_variance": 15, "base_memory": 45, "memory_variance": 20,
                "base_response_time": 120, "response_variance": 50, "base_error_rate": 0.2,
                "base_throughput": 60, "throughput_variance": 25, "typical_load_pattern": "steady"
            },
            "data-pipeline": {
                "base_cpu": 65, "cpu_variance": 25, "base_memory": 70, "memory_variance": 20,
                "base_response_time": 2200, "response_variance": 800, "base_error_rate": 2.1,
                "base_throughput": 15, "throughput_variance": 10, "typical_load_pattern": "batch_processing"
            }
        }
        
        # Database profiles
        self.database_profiles = {
            "trading-primary-postgres": {
                "base_cpu": 55, "cpu_variance": 25, "base_connections": 180, "connection_variance": 60,
                "base_read_iops": 1200, "base_write_iops": 800, "base_read_latency": 2.5, "base_write_latency": 5.2
            },
            "trading-replica-postgres": {
                "base_cpu": 35, "cpu_variance": 20, "base_connections": 95, "connection_variance": 30,
                "base_read_iops": 800, "base_write_iops": 50, "base_read_latency": 3.1, "base_write_latency": 8.5
            },
            "risk-analytics-postgres": {
                "base_cpu": 70, "cpu_variance": 20, "base_connections": 120, "connection_variance": 40,
                "base_read_iops": 2200, "base_write_iops": 400, "base_read_latency": 4.8, "base_write_latency": 12.1
            },
            "portfolio-data-postgres": {
                "base_cpu": 25, "cpu_variance": 15, "base_connections": 60, "connection_variance": 25,
                "base_read_iops": 400, "base_write_iops": 150, "base_read_latency": 1.8, "base_write_latency": 4.2
            },
            "staging-shared-postgres": {
                "base_cpu": 15, "cpu_variance": 10, "base_connections": 25, "connection_variance": 15,
                "base_read_iops": 150, "base_write_iops": 80, "base_read_latency": 2.2, "base_write_latency": 6.8
            },
            "legacy-financial-oracle": {
                "base_cpu": 85, "cpu_variance": 10, "base_connections": 250, "connection_variance": 50,
                "base_read_iops": 3500, "base_write_iops": 1200, "base_read_latency": 8.5, "base_write_latency": 22.4
            },
            "compliance-reporting-oracle": {
                "base_cpu": 45, "cpu_variance": 20, "base_connections": 80, "connection_variance": 30,
                "base_read_iops": 800, "base_write_iops": 200, "base_read_latency": 6.2, "base_write_latency": 18.1
            }
        }
        
        # EKS cluster profiles
        self.cluster_profiles = {
            "prod-trading-cluster": {"regions": ["us-east-1"], "environments": ["production"], "node_count": 45},
            "prod-risk-cluster": {"regions": ["us-east-1"], "environments": ["production"], "node_count": 28},
            "prod-portfolio-cluster": {"regions": ["us-east-1"], "environments": ["production"], "node_count": 52},
            "staging-apps-cluster": {"regions": ["us-west-2"], "environments": ["staging"], "node_count": 18},
            "dev-microservices-cluster": {"regions": ["us-west-2"], "environments": ["development"], "node_count": 12},
            "prod-compliance-cluster": {"regions": ["us-east-1"], "environments": ["production"], "node_count": 22}
        }

    async def initialize_connection(self):
        """Initialize database connection pool"""
        if self.pool is None:
            self.pool = await asyncpg.create_pool(
                self.database_url,
                min_size=2,
                max_size=10,
                command_timeout=60
            )
            logger.info("✅ Database connection pool initialized")

    async def close_connection(self):
        """Close database connection pool"""
        if self.pool:
            await self.pool.close()
            logger.info("📦 Database connection pool closed")

    def apply_load_pattern(self, base_value: float, pattern: str, current_time: datetime) -> float:
        """Apply realistic load patterns based on time of day"""
        hour = current_time.hour
        day_of_week = current_time.weekday()  # 0 = Monday, 6 = Sunday
        
        multiplier = 1.0
        
        if pattern == "business_hours":
            # Higher load during business hours (9 AM - 5 PM EST)
            if 9 <= hour <= 17 and day_of_week < 5:  # Weekdays
                multiplier = 1.8 + 0.3 * math.sin((hour - 9) * math.pi / 8)
            elif 7 <= hour <= 19 and day_of_week < 5:
                multiplier = 1.2
            else:
                multiplier = 0.4
                
        elif pattern == "market_hours":
            # Peak during market hours (9:30 AM - 4 PM EST)
            if day_of_week < 5:  # Weekdays only
                if 9.5 <= hour <= 16:
                    multiplier = 2.5 + 0.5 * math.sin((hour - 9.5) * math.pi / 6.5)
                elif 7 <= hour <= 9.5 or 16 <= hour <= 18:
                    multiplier = 1.5
                else:
                    multiplier = 0.3
            else:
                multiplier = 0.1
                
        elif pattern == "batch_processing":
            # Higher load during off-hours batch processing
            if hour < 6 or hour > 20:
                multiplier = 2.2 + 0.4 * random.random()
            elif 6 <= hour <= 8 or 18 <= hour <= 20:
                multiplier = 1.5
            else:
                multiplier = 0.6
                
        elif pattern == "event_driven":
            # Random spikes throughout the day
            base_multiplier = 0.8 if 22 <= hour or hour <= 6 else 1.2
            spike_chance = random.random()
            if spike_chance < 0.05:  # 5% chance of spike
                multiplier = base_multiplier * random.uniform(3, 8)
            else:
                multiplier = base_multiplier
                
        elif pattern == "steady":
            # Consistent load with minor variations
            multiplier = 1.0 + 0.2 * math.sin(hour * math.pi / 12) + 0.1 * random.random()
            
        # Add weekend reduction for business patterns
        if pattern in ["business_hours", "market_hours"] and day_of_week >= 5:
            multiplier *= 0.2
            
        return base_value * max(0.1, multiplier)

    def generate_system_metrics(self, timestamp: datetime, count: int = 100) -> List[Dict[str, Any]]:
        """Generate system metrics for services"""
        metrics = []
        
        for _ in range(count):
            service_name = random.choice(list(self.service_profiles.keys()))
            cluster_name = random.choice(list(self.cluster_profiles.keys()))
            
            profile = self.service_profiles[service_name]
            cluster_info = self.cluster_profiles[cluster_name]
            
            # Apply load patterns
            cpu_base = self.apply_load_pattern(profile["base_cpu"], profile["typical_load_pattern"], timestamp)
            response_time_base = self.apply_load_pattern(profile["base_response_time"], profile["typical_load_pattern"], timestamp)
            throughput_base = self.apply_load_pattern(profile["base_throughput"], profile["typical_load_pattern"], timestamp)
            
            # Add realistic correlations (high CPU -> high response time)
            cpu_utilization = max(5, min(95, cpu_base + random.gauss(0, profile["cpu_variance"])))
            cpu_factor = cpu_utilization / profile["base_cpu"]
            
            memory_utilization = max(10, min(90, profile["base_memory"] * cpu_factor + random.gauss(0, profile["memory_variance"])))
            response_time = max(10, response_time_base * (1 + (cpu_factor - 1) * 0.5) + random.gauss(0, profile["response_variance"]))
            error_rate = max(0, profile["base_error_rate"] * cpu_factor + random.gauss(0, 0.1))
            throughput = max(1, throughput_base / cpu_factor + random.gauss(0, profile["throughput_variance"]))
            
            metric = {
                "time": timestamp,
                "service_name": service_name,
                "cluster_name": cluster_name,
                "region": random.choice(cluster_info["regions"]),
                "environment": random.choice(cluster_info["environments"]),
                "cpu_utilization": round(cpu_utilization, 2),
                "memory_utilization": round(memory_utilization, 2),
                "disk_utilization": round(random.uniform(15, 85), 2),
                "network_in_bytes": random.randint(100000, 10000000),
                "network_out_bytes": random.randint(80000, 8000000),
                "request_count": int(throughput * 60),  # Convert RPS to per-minute
                "response_time_ms": round(response_time, 2),
                "error_rate": round(error_rate, 3),
                "throughput_rps": round(throughput, 2),
                "active_connections": random.randint(10, 200),
                "pod_count": random.randint(2, 12),
                "replica_count": random.randint(2, 12),
                "pending_pods": random.randint(0, 3),
                "failed_pods": random.randint(0, 2)
            }
            metrics.append(metric)
            
        return metrics

    def generate_database_metrics(self, timestamp: datetime, count: int = 50) -> List[Dict[str, Any]]:
        """Generate database performance metrics"""
        metrics = []
        
        for _ in range(count):
            db_identifier = random.choice(list(self.database_profiles.keys()))
            profile = self.database_profiles[db_identifier]
            
            # Simulate database load patterns
            is_oracle = "oracle" in db_identifier
            engine = "oracle-ee" if is_oracle else "postgres"
            
            # Oracle tends to have different performance characteristics
            if is_oracle:
                instance_class = random.choice(["db.r5.2xlarge", "db.r5.4xlarge"])
                base_cpu_load = 1.3
            else:
                instance_class = random.choice(["db.r6g.large", "db.r6g.xlarge", "db.r6g.2xlarge"])
                base_cpu_load = 1.0
            
            cpu_utilization = max(5, min(95, profile["base_cpu"] * base_cpu_load + random.gauss(0, profile["cpu_variance"])))
            
            # Database-specific correlations
            cpu_factor = cpu_utilization / (profile["base_cpu"] * base_cpu_load)
            connections = max(5, int(profile["base_connections"] * cpu_factor + random.gauss(0, profile["connection_variance"])))
            
            read_iops = max(10, profile["base_read_iops"] * (0.8 + 0.4 * cpu_factor))
            write_iops = max(5, profile["base_write_iops"] * (0.8 + 0.4 * cpu_factor))
            
            # Latency increases with higher load
            read_latency = profile["base_read_latency"] * (1 + (cpu_factor - 1) * 0.6)
            write_latency = profile["base_write_latency"] * (1 + (cpu_factor - 1) * 0.6)
            
            metric = {
                "time": timestamp,
                "db_identifier": db_identifier,
                "db_engine": engine,
                "instance_class": instance_class,
                "region": "us-east-1" if "oracle" in db_identifier or "trading" in db_identifier or "risk" in db_identifier else random.choice(["us-east-1", "us-west-2"]),
                "cpu_utilization": round(cpu_utilization, 2),
                "database_connections": connections,
                "read_iops": round(read_iops, 2),
                "write_iops": round(write_iops, 2),
                "read_latency_ms": round(read_latency, 2),
                "write_latency_ms": round(write_latency, 2),
                "read_throughput_bytes": random.randint(1000000, 50000000),
                "write_throughput_bytes": random.randint(500000, 25000000),
                "free_storage_bytes": random.randint(100000000, 1000000000),
                "free_memory_bytes": random.randint(500000000, 8000000000),
                "swap_usage_bytes": random.randint(0, 100000000),
                "slow_queries": random.randint(0, 25),
                "deadlocks": random.randint(0, 5),
                "lock_waits": random.randint(0, 15),
                "buffer_cache_hit_ratio": round(random.uniform(85, 99.5), 2)
            }
            metrics.append(metric)
            
        return metrics

    def generate_network_metrics(self, timestamp: datetime, count: int = 80) -> List[Dict[str, Any]]:
        """Generate network performance metrics between services"""
        metrics = []
        services = list(self.service_profiles.keys())
        
        # Common service communication patterns
        connections = [
            ("payment-api", "auth-service", "HTTP"),
            ("user-management", "auth-service", "HTTP"),
            ("trading-gateway", "payment-api", "HTTP"),
            ("analytics-engine", "data-pipeline", "gRPC"),
            ("risk-calculator", "analytics-engine", "gRPC"),
            ("portfolio-manager", "user-management", "HTTP"),
            ("compliance-monitor", "data-pipeline", "gRPC"),
            ("notification-service", "user-management", "HTTP")
        ]
        
        # Add some random connections
        for _ in range(count - len(connections) * 8):  # Multiply by 8 to create multiple entries per connection
            source = random.choice(services)
            target = random.choice([s for s in services if s != source])
            connection_type = random.choice(["HTTP", "gRPC", "Database"])
            connections.append((source, target, connection_type))
        
        for source_service, target_service, conn_type in connections:
            # Get load patterns for both services
            source_profile = self.service_profiles.get(source_service, self.service_profiles["auth-service"])
            target_profile = self.service_profiles.get(target_service, self.service_profiles["auth-service"])
            
            # Base latency depends on connection type and geographic distance
            if conn_type == "Database":
                base_latency = random.uniform(2, 15)
            elif conn_type == "gRPC":
                base_latency = random.uniform(1, 8)
            else:  # HTTP
                base_latency = random.uniform(3, 25)
            
            # Apply load-based latency increase
            source_load = self.apply_load_pattern(source_profile["base_cpu"], source_profile["typical_load_pattern"], timestamp) / source_profile["base_cpu"]
            target_load = self.apply_load_pattern(target_profile["base_cpu"], target_profile["typical_load_pattern"], timestamp) / target_profile["base_cpu"]
            load_factor = (source_load + target_load) / 2
            
            latency = base_latency * (1 + (load_factor - 1) * 0.3)
            
            # Generate realistic percentile distributions
            avg_latency = max(0.5, latency + random.gauss(0, latency * 0.2))
            p50_latency = avg_latency * random.uniform(0.7, 0.9)
            p95_latency = avg_latency * random.uniform(2.5, 4.0)
            p99_latency = p95_latency * random.uniform(1.5, 3.0)
            
            request_count = int(100 * load_factor + random.gauss(0, 50))
            error_count = max(0, int(request_count * random.uniform(0.001, 0.02)))
            
            metric = {
                "time": timestamp,
                "source_service": source_service,
                "target_service": target_service,
                "source_cluster": random.choice(list(self.cluster_profiles.keys())),
                "target_cluster": random.choice(list(self.cluster_profiles.keys())),
                "connection_type": conn_type,
                "region": random.choice(["us-east-1", "us-west-2"]),
                "avg_latency_ms": round(avg_latency, 2),
                "p50_latency_ms": round(p50_latency, 2),
                "p95_latency_ms": round(p95_latency, 2),
                "p99_latency_ms": round(p99_latency, 2),
                "request_count": max(0, request_count),
                "byte_count": random.randint(10000, 5000000),
                "error_count": error_count,
                "timeout_count": max(0, int(error_count * random.uniform(0.1, 0.4))),
                "active_connections": random.randint(5, 100),
                "connection_pool_utilization": round(random.uniform(0.2, 0.9), 3),
                "tcp_retransmissions": random.randint(0, 10),
                "packet_loss_rate": round(random.uniform(0, 0.5), 4)
            }
            metrics.append(metric)
            
        return metrics[:count]

    def generate_cost_metrics(self, timestamp: datetime, count: int = 30) -> List[Dict[str, Any]]:
        """Generate AWS cost metrics"""
        metrics = []
        
        # AWS resources with realistic costs
        resources = [
            {"id": "prod-trading-cluster", "type": "EKS", "name": "prod-trading-cluster", "base_hourly": 3.50},
            {"id": "prod-risk-cluster", "type": "EKS", "name": "prod-risk-cluster", "base_hourly": 2.33},
            {"id": "trading-primary-postgres", "type": "RDS", "name": "trading-primary-postgres", "base_hourly": 3.89},
            {"id": "legacy-financial-oracle", "type": "RDS", "name": "legacy-financial-oracle", "base_hourly": 17.78},
            {"id": "reporting-sqlserver-01", "type": "EC2", "name": "reporting-sqlserver-01", "base_hourly": 2.92},
            {"id": "s3-trading-data", "type": "S3", "name": "trading-data-bucket", "base_hourly": 0.15},
            {"id": "cloudwatch-logs", "type": "CloudWatch", "name": "application-logs", "base_hourly": 0.08}
        ]
        
        for _ in range(count):
            resource = random.choice(resources)
            
            # Add some variation to costs
            hourly_cost = resource["base_hourly"] * random.uniform(0.8, 1.2)
            daily_cost = hourly_cost * 24
            monthly_cost = daily_cost * 30.44  # Average days per month
            
            # Calculate usage and waste
            usage_quantity = random.uniform(50, 100) if resource["type"] != "S3" else random.uniform(1000, 50000)
            usage_unit = "hours" if resource["type"] in ["EKS", "RDS", "EC2"] else "GB" if resource["type"] == "S3" else "requests"
            
            # Estimate waste based on resource type
            if resource["type"] == "EKS":
                waste_percent = random.uniform(15, 35)  # Kubernetes often has unused capacity
            elif resource["type"] == "RDS":
                waste_percent = random.uniform(5, 25)   # Databases tend to be rightsized
            else:
                waste_percent = random.uniform(10, 30)
            
            estimated_waste = daily_cost * (waste_percent / 100)
            optimization_potential = estimated_waste * random.uniform(0.6, 0.9)
            
            # Rightsizing recommendations
            rightsizing_options = [
                "downsize_instance_type", "reduce_storage", "optimize_scheduling", 
                "implement_auto_scaling", "review_licensing", "consolidate_resources"
            ]
            
            metric = {
                "time": timestamp,
                "resource_id": resource["id"],
                "resource_type": resource["type"],
                "resource_name": resource["name"],
                "region": random.choice(["us-east-1", "us-west-2"]),
                "environment": random.choice(["production", "staging", "development"]),
                "cost_center": f"{resource['type']}-{random.randint(100, 999)}",
                "hourly_cost": round(hourly_cost, 4),
                "daily_cost": round(daily_cost, 2),
                "monthly_cost": round(monthly_cost, 2),
                "usage_quantity": round(usage_quantity, 2),
                "usage_unit": usage_unit,
                "estimated_waste": round(estimated_waste, 2),
                "optimization_potential": round(optimization_potential, 2),
                "rightsizing_recommendation": random.choice(rightsizing_options) if waste_percent > 20 else None
            }
            metrics.append(metric)
            
        return metrics

    def generate_business_value_metrics(self, timestamp: datetime, count: int = 20) -> List[Dict[str, Any]]:
        """Generate business value and ROI metrics"""
        metrics = []
        
        value_categories = [
            {"type": "cost_savings", "category": "infrastructure_optimization", "base_value": 5000},
            {"type": "cost_savings", "category": "automation_efficiency", "base_value": 3000},
            {"type": "time_savings", "category": "incident_resolution", "base_value": 40},
            {"type": "time_savings", "category": "deployment_automation", "base_value": 25},
            {"type": "efficiency", "category": "system_performance", "base_value": 15},
            {"type": "risk_reduction", "category": "security_improvements", "base_value": 8}
        ]
        
        for _ in range(count):
            category = random.choice(value_categories)
            
            if category["type"] == "cost_savings":
                value = category["base_value"] * random.uniform(0.7, 1.5)
                metric = {
                    "time": timestamp,
                    "metric_type": category["type"],
                    "category": category["category"],
                    "service_name": random.choice(list(self.service_profiles.keys())),
                    "cluster_name": random.choice(list(self.cluster_profiles.keys())),
                    "region": random.choice(["us-east-1", "us-west-2"]),
                    "team": random.choice(["Platform Team", "Development Team", "SRE Team"]),
                    "cost_savings_usd": round(value, 2),
                    "time_savings_hours": None,
                    "efficiency_gain_percent": None,
                    "risk_reduction_score": None,
                    "initiative_name": f"{category['category'].replace('_', ' ').title()} Initiative",
                    "description": f"Monthly cost savings from {category['category'].replace('_', ' ')}",
                    "measurement_method": "automated_calculation",
                    "confidence_level": random.choice(["high", "medium"])
                }
            elif category["type"] == "time_savings":
                value = category["base_value"] * random.uniform(0.8, 1.3)
                metric = {
                    "time": timestamp,
                    "metric_type": category["type"],
                    "category": category["category"],
                    "service_name": random.choice(list(self.service_profiles.keys())),
                    "cluster_name": random.choice(list(self.cluster_profiles.keys())),
                    "region": random.choice(["us-east-1", "us-west-2"]),
                    "team": random.choice(["Platform Team", "Development Team", "SRE Team"]),
                    "cost_savings_usd": None,
                    "time_savings_hours": round(value, 1),
                    "efficiency_gain_percent": None,
                    "risk_reduction_score": None,
                    "initiative_name": f"{category['category'].replace('_', ' ').title()} Improvement",
                    "description": f"Time saved through {category['category'].replace('_', ' ')} improvements",
                    "measurement_method": "time_tracking",
                    "confidence_level": random.choice(["high", "medium"])
                }
            else:  # efficiency or risk_reduction
                value = category["base_value"] * random.uniform(0.9, 1.2)
                metric = {
                    "time": timestamp,
                    "metric_type": category["type"],
                    "category": category["category"],
                    "service_name": random.choice(list(self.service_profiles.keys())),
                    "cluster_name": random.choice(list(self.cluster_profiles.keys())),
                    "region": random.choice(["us-east-1", "us-west-2"]),
                    "team": random.choice(["Platform Team", "Security Team", "SRE Team"]),
                    "cost_savings_usd": None,
                    "time_savings_hours": None,
                    "efficiency_gain_percent": round(value, 1) if category["type"] == "efficiency" else None,
                    "risk_reduction_score": round(value, 1) if category["type"] == "risk_reduction" else None,
                    "initiative_name": f"{category['category'].replace('_', ' ').title()} Program",
                    "description": f"{category['type'].replace('_', ' ').title()} from {category['category'].replace('_', ' ')}",
                    "measurement_method": "performance_metrics" if category["type"] == "efficiency" else "risk_assessment",
                    "confidence_level": random.choice(["high", "medium", "low"])
                }
            
            metrics.append(metric)
            
        return metrics

    async def insert_system_metrics(self, metrics: List[Dict[str, Any]]):
        """Insert system metrics into TimescaleDB"""
        if not metrics:
            return
            
        async with self.pool.acquire() as conn:
            await conn.executemany("""
                INSERT INTO system_metrics (
                    time, service_name, cluster_name, region, environment,
                    cpu_utilization, memory_utilization, disk_utilization,
                    network_in_bytes, network_out_bytes, request_count,
                    response_time_ms, error_rate, throughput_rps, active_connections,
                    pod_count, replica_count, pending_pods, failed_pods
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19
                )
            """, [
                (m["time"], m["service_name"], m["cluster_name"], m["region"], m["environment"],
                 m["cpu_utilization"], m["memory_utilization"], m["disk_utilization"],
                 m["network_in_bytes"], m["network_out_bytes"], m["request_count"],
                 m["response_time_ms"], m["error_rate"], m["throughput_rps"], m["active_connections"],
                 m["pod_count"], m["replica_count"], m["pending_pods"], m["failed_pods"])
                for m in metrics
            ])

    async def insert_database_metrics(self, metrics: List[Dict[str, Any]]):
        """Insert database metrics into TimescaleDB"""
        if not metrics:
            return
            
        async with self.pool.acquire() as conn:
            await conn.executemany("""
                INSERT INTO database_metrics (
                    time, db_identifier, db_engine, instance_class, region,
                    cpu_utilization, database_connections, read_iops, write_iops,
                    read_latency_ms, write_latency_ms, read_throughput_bytes, write_throughput_bytes,
                    free_storage_bytes, free_memory_bytes, swap_usage_bytes,
                    slow_queries, deadlocks, lock_waits, buffer_cache_hit_ratio
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20
                )
            """, [
                (m["time"], m["db_identifier"], m["db_engine"], m["instance_class"], m["region"],
                 m["cpu_utilization"], m["database_connections"], m["read_iops"], m["write_iops"],
                 m["read_latency_ms"], m["write_latency_ms"], m["read_throughput_bytes"], m["write_throughput_bytes"],
                 m["free_storage_bytes"], m["free_memory_bytes"], m["swap_usage_bytes"],
                 m["slow_queries"], m["deadlocks"], m["lock_waits"], m["buffer_cache_hit_ratio"])
                for m in metrics
            ])

    async def insert_network_metrics(self, metrics: List[Dict[str, Any]]):
        """Insert network metrics into TimescaleDB"""
        if not metrics:
            return
            
        async with self.pool.acquire() as conn:
            await conn.executemany("""
                INSERT INTO network_metrics (
                    time, source_service, target_service, source_cluster, target_cluster,
                    connection_type, region, avg_latency_ms, p50_latency_ms, p95_latency_ms, p99_latency_ms,
                    request_count, byte_count, error_count, timeout_count,
                    active_connections, connection_pool_utilization, tcp_retransmissions, packet_loss_rate
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19
                )
            """, [
                (m["time"], m["source_service"], m["target_service"], m["source_cluster"], m["target_cluster"],
                 m["connection_type"], m["region"], m["avg_latency_ms"], m["p50_latency_ms"], m["p95_latency_ms"], m["p99_latency_ms"],
                 m["request_count"], m["byte_count"], m["error_count"], m["timeout_count"],
                 m["active_connections"], m["connection_pool_utilization"], m["tcp_retransmissions"], m["packet_loss_rate"])
                for m in metrics
            ])

    async def insert_cost_metrics(self, metrics: List[Dict[str, Any]]):
        """Insert cost metrics into TimescaleDB"""
        if not metrics:
            return
            
        async with self.pool.acquire() as conn:
            await conn.executemany("""
                INSERT INTO cost_metrics (
                    time, resource_id, resource_type, resource_name, region, environment, cost_center,
                    hourly_cost, daily_cost, monthly_cost, usage_quantity, usage_unit,
                    estimated_waste, optimization_potential, rightsizing_recommendation
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
                )
            """, [
                (m["time"], m["resource_id"], m["resource_type"], m["resource_name"], m["region"], m["environment"], m["cost_center"],
                 m["hourly_cost"], m["daily_cost"], m["monthly_cost"], m["usage_quantity"], m["usage_unit"],
                 m["estimated_waste"], m["optimization_potential"], m["rightsizing_recommendation"])
                for m in metrics
            ])

    async def insert_business_value_metrics(self, metrics: List[Dict[str, Any]]):
        """Insert business value metrics into TimescaleDB"""
        if not metrics:
            return
            
        async with self.pool.acquire() as conn:
            await conn.executemany("""
                INSERT INTO business_value_metrics (
                    time, metric_type, category, service_name, cluster_name, region, team,
                    cost_savings_usd, time_savings_hours, efficiency_gain_percent, risk_reduction_score,
                    initiative_name, description, measurement_method, confidence_level
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
                )
            """, [
                (m["time"], m["metric_type"], m["category"], m["service_name"], m["cluster_name"], m["region"], m["team"],
                 m["cost_savings_usd"], m["time_savings_hours"], m["efficiency_gain_percent"], m["risk_reduction_score"],
                 m["initiative_name"], m["description"], m["measurement_method"], m["confidence_level"])
                for m in metrics
            ])

    async def generate_historical_data(self, hours: int = 72):
        """Generate historical data for the last N hours"""
        await self.initialize_connection()
        
        try:
            logger.info(f"Generating {hours} hours of historical metrics data...")
            
            current_time = datetime.utcnow()
            batch_size = 10  # Generate data in 10-minute intervals
            
            for i in range(hours * 6):  # 6 intervals per hour (10 minutes each)
                timestamp = current_time - timedelta(minutes=i * 10)
                
                # Generate metrics for this timestamp
                system_metrics = self.generate_system_metrics(timestamp, 30)
                database_metrics = self.generate_database_metrics(timestamp, 15)
                network_metrics = self.generate_network_metrics(timestamp, 25)
                cost_metrics = self.generate_cost_metrics(timestamp, 10)
                business_metrics = self.generate_business_value_metrics(timestamp, 8)
                
                # Insert into database
                await self.insert_system_metrics(system_metrics)
                await self.insert_database_metrics(database_metrics)
                await self.insert_network_metrics(network_metrics)
                await self.insert_cost_metrics(cost_metrics)
                await self.insert_business_value_metrics(business_metrics)
                
                if i % 36 == 0:  # Log progress every 6 hours
                    hours_completed = i // 6
                    logger.info(f"Generated {hours_completed}/{hours} hours of data...")
            
            logger.info(f"✅ Historical data generation complete: {hours} hours of metrics")
            
        except Exception as e:
            logger.error(f"❌ Historical data generation failed: {e}")
            raise
        finally:
            await self.close_connection()

    def generate_realtime_metrics(self, components: List[Dict[str, Any]]) -> Dict[str, List[Dict[str, Any]]]:
        """Generate real-time metrics for the current timestamp"""
        timestamp = datetime.utcnow()
        
        # Generate smaller batches for real-time
        system_metrics = self.generate_system_metrics(timestamp, 15)
        database_metrics = self.generate_database_metrics(timestamp, 8)
        network_metrics = self.generate_network_metrics(timestamp, 12)
        cost_metrics = self.generate_cost_metrics(timestamp, 5)
        business_metrics = self.generate_business_value_metrics(timestamp, 3)
        
        return {
            'system_metrics': system_metrics,
            'database_metrics': database_metrics,
            'network_metrics': network_metrics,
            'cost_metrics': cost_metrics,
            'business_value_metrics': business_metrics
        }

    async def generate_realtime_data(self, duration_minutes: int = 60):
        """Generate real-time metrics data"""
        await self.initialize_connection()
        
        try:
            logger.info(f"Starting real-time data generation for {duration_minutes} minutes...")
            
            for minute in range(duration_minutes):
                timestamp = datetime.utcnow()
                
                # Generate smaller batches for real-time
                system_metrics = self.generate_system_metrics(timestamp, 15)
                database_metrics = self.generate_database_metrics(timestamp, 8)
                network_metrics = self.generate_network_metrics(timestamp, 12)
                cost_metrics = self.generate_cost_metrics(timestamp, 5)
                business_metrics = self.generate_business_value_metrics(timestamp, 3)
                
                # Insert into database
                await self.insert_system_metrics(system_metrics)
                await self.insert_database_metrics(database_metrics)
                await self.insert_network_metrics(network_metrics)
                await self.insert_cost_metrics(cost_metrics)
                await self.insert_business_value_metrics(business_metrics)
                
                logger.info(f"Generated real-time data for minute {minute + 1}/{duration_minutes}")
                
                # Wait for next minute
                await asyncio.sleep(60)
                
        except Exception as e:
            logger.error(f"❌ Real-time data generation failed: {e}")
            raise
        finally:
            await self.close_connection()

if __name__ == "__main__":
    generator = MetricsGenerator()
    
    # Generate 72 hours of historical data
    asyncio.run(generator.generate_historical_data(72))