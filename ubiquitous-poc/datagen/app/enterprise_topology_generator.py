"""
Enterprise-Scale Infrastructure Topology Generator
Creates 50,000+ nodes for Wizard of Oz MVP demo that will impress executives
"""

from neo4j import GraphDatabase
import random
import uuid
import string
import itertools
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional, Tuple
import logging
import time
import json

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class EnterpriseTopologyGenerator:
    """Generates enterprise-scale infrastructure topology with 50,000+ nodes"""
    
    def __init__(self, neo4j_uri: str = "bolt://graph:7687", auth: tuple = ("neo4j", "ubiquitous123")):
        self.driver = GraphDatabase.driver(neo4j_uri, auth=auth)
        
        # Capital Group specific organizational structure
        self.business_units = [
            "Trading", "Risk", "Portfolio", "Compliance", "Client-Services", 
            "Market-Data", "Settlement", "Operations", "Analytics", "Research"
        ]
        
        self.environments = ["prod", "staging", "qa", "dev", "sandbox", "perf"]
        
        # AWS regions with realistic distribution
        self.regions = {
            "us-east-1": {"weight": 40, "azs": ["us-east-1a", "us-east-1b", "us-east-1c", "us-east-1d", "us-east-1e", "us-east-1f"]},
            "us-west-2": {"weight": 30, "azs": ["us-west-2a", "us-west-2b", "us-west-2c", "us-west-2d"]},
            "eu-west-1": {"weight": 20, "azs": ["eu-west-1a", "eu-west-1b", "eu-west-1c"]},
            "ap-southeast-1": {"weight": 10, "azs": ["ap-southeast-1a", "ap-southeast-1b", "ap-southeast-1c"]}
        }
        
        # Enterprise-scale instance type distribution
        self.instance_types = {
            "eks_nodes": {
                "small": ["t3.medium", "t3.large", "m5.large"],
                "medium": ["m5.xlarge", "m5.2xlarge", "c5.xlarge", "c5.2xlarge"],
                "large": ["m5.4xlarge", "m5.8xlarge", "c5.4xlarge", "c5.9xlarge", "r5.2xlarge", "r5.4xlarge"],
                "xlarge": ["m5.12xlarge", "m5.16xlarge", "c5.12xlarge", "c5.18xlarge", "r5.8xlarge", "r5.12xlarge"]
            },
            "rds": {
                "small": ["db.t3.micro", "db.t3.small", "db.t3.medium", "db.t3.large"],
                "medium": ["db.r6g.large", "db.r6g.xlarge", "db.r5.large", "db.r5.xlarge"],
                "large": ["db.r6g.2xlarge", "db.r6g.4xlarge", "db.r5.2xlarge", "db.r5.4xlarge"],
                "xlarge": ["db.r6g.8xlarge", "db.r6g.12xlarge", "db.r5.8xlarge", "db.r5.12xlarge"]
            },
            "ec2": {
                "small": ["t3.micro", "t3.small", "t3.medium", "t3.large"],
                "medium": ["m5.large", "m5.xlarge", "c5.large", "c5.xlarge"],
                "large": ["m5.2xlarge", "m5.4xlarge", "c5.2xlarge", "c5.4xlarge"],
                "xlarge": ["m5.8xlarge", "m5.12xlarge", "c5.9xlarge", "c5.18xlarge"]
            }
        }
        
        # Capital Group technology stack patterns
        self.technology_stacks = {
            "java_spring": {"languages": ["Java"], "frameworks": ["Spring Boot", "Spring Cloud"], "build": ["Maven", "Gradle"]},
            "node_express": {"languages": ["TypeScript", "JavaScript"], "frameworks": ["Express.js", "NestJS"], "build": ["npm", "yarn"]},
            "python_django": {"languages": ["Python"], "frameworks": ["Django", "FastAPI"], "build": ["pip", "poetry"]},
            "dotnet_core": {"languages": ["C#"], "frameworks": [".NET Core", "ASP.NET"], "build": ["MSBuild", "dotnet"]},
            "golang": {"languages": ["Go"], "frameworks": ["Gin", "Echo"], "build": ["go mod"]},
            "scala_akka": {"languages": ["Scala"], "frameworks": ["Akka", "Play"], "build": ["sbt"]}
        }
        
        # Financial services specific service types
        self.financial_service_types = [
            {"prefix": "trading", "services": ["order-gateway", "execution-engine", "market-connector", "position-manager", "risk-engine"]},
            {"prefix": "portfolio", "services": ["allocation-service", "rebalancer", "performance-calculator", "benchmark-service", "attribution-engine"]},
            {"prefix": "risk", "services": ["var-calculator", "stress-tester", "compliance-checker", "exposure-analyzer", "limit-monitor"]},
            {"prefix": "client", "services": ["account-service", "onboarding-api", "document-manager", "communication-hub", "preference-service"]},
            {"prefix": "market", "services": ["data-feed", "price-service", "reference-data", "corporate-actions", "calendar-service"]},
            {"prefix": "settlement", "services": ["trade-settlement", "reconciliation", "corporate-action-processor", "cash-manager", "transfer-agent"]},
            {"prefix": "compliance", "services": ["aml-scanner", "kyc-validator", "trade-surveillance", "reporting-engine", "audit-trail"]},
            {"prefix": "ops", "services": ["monitoring", "alerting", "logging", "metrics-collector", "incident-manager"]}
        ]

    def clear_existing_data(self):
        """Clear existing infrastructure data"""
        with self.driver.session() as session:
            logger.info("Clearing existing infrastructure data...")
            session.run("MATCH (n) DETACH DELETE n")
            logger.info("✅ Existing data cleared")

    def create_enhanced_constraints_and_indexes(self):
        """Create comprehensive database constraints and indexes for 50K+ nodes"""
        with self.driver.session() as session:
            logger.info("Creating enhanced constraints and indexes...")
            
            constraints = [
                "CREATE CONSTRAINT service_name IF NOT EXISTS FOR (s:Service) REQUIRE s.name IS UNIQUE",
                "CREATE CONSTRAINT service_id IF NOT EXISTS FOR (s:Service) REQUIRE s.id IS UNIQUE",
                "CREATE CONSTRAINT resource_arn IF NOT EXISTS FOR (r:AWSResource) REQUIRE r.arn IS UNIQUE",
                "CREATE CONSTRAINT cluster_name IF NOT EXISTS FOR (c:EKSCluster) REQUIRE c.name IS UNIQUE",
                "CREATE CONSTRAINT db_identifier IF NOT EXISTS FOR (d:RDSInstance) REQUIRE d.identifier IS UNIQUE",
                "CREATE CONSTRAINT ec2_instance_id IF NOT EXISTS FOR (e:EC2Instance) REQUIRE e.instance_id IS UNIQUE",
                "CREATE CONSTRAINT app_name IF NOT EXISTS FOR (a:Application) REQUIRE a.name IS UNIQUE",
                "CREATE CONSTRAINT vpc_id IF NOT EXISTS FOR (v:VPC) REQUIRE v.vpc_id IS UNIQUE",
                "CREATE CONSTRAINT pod_name IF NOT EXISTS FOR (p:Pod) REQUIRE p.name IS UNIQUE",
                "CREATE CONSTRAINT namespace_name IF NOT EXISTS FOR (n:Namespace) REQUIRE n.name IS UNIQUE",
                "CREATE CONSTRAINT loadbalancer_arn IF NOT EXISTS FOR (l:LoadBalancer) REQUIRE l.arn IS UNIQUE",
                "CREATE CONSTRAINT lambda_arn IF NOT EXISTS FOR (f:LambdaFunction) REQUIRE f.arn IS UNIQUE"
            ]
            
            indexes = [
                "CREATE INDEX service_status IF NOT EXISTS FOR (s:Service) ON (s.status)",
                "CREATE INDEX service_environment IF NOT EXISTS FOR (s:Service) ON (s.environment)",
                "CREATE INDEX service_business_unit IF NOT EXISTS FOR (s:Service) ON (s.business_unit)",
                "CREATE INDEX resource_region IF NOT EXISTS FOR (r:AWSResource) ON (r.region)",
                "CREATE INDEX resource_type IF NOT EXISTS FOR (r:AWSResource) ON (r.type)",
                "CREATE INDEX resource_environment IF NOT EXISTS FOR (r:AWSResource) ON (r.environment)",
                "CREATE INDEX cluster_status IF NOT EXISTS FOR (c:EKSCluster) ON (c.status)",
                "CREATE INDEX db_status IF NOT EXISTS FOR (d:RDSInstance) ON (d.status)",
                "CREATE INDEX app_environment IF NOT EXISTS FOR (a:Application) ON (a.environment)",
                "CREATE INDEX app_criticality IF NOT EXISTS FOR (a:Application) ON (a.business_criticality)",
                "CREATE INDEX pod_status IF NOT EXISTS FOR (p:Pod) ON (p.status)",
                "CREATE INDEX pod_namespace IF NOT EXISTS FOR (p:Pod) ON (p.namespace)"
            ]
            
            for constraint in constraints:
                try:
                    session.run(constraint)
                except Exception as e:
                    logger.debug(f"Constraint might already exist: {e}")
            
            for index in indexes:
                try:
                    session.run(index)
                except Exception as e:
                    logger.debug(f"Index might already exist: {e}")
            
            logger.info("✅ Enhanced constraints and indexes created")

    def generate_enterprise_vpcs(self, count: int = 15) -> List[Dict[str, Any]]:
        """Generate enterprise-scale VPC infrastructure"""
        vpcs = []
        
        # Core production VPCs
        prod_vpcs = [
            {"name": "prod-trading-vpc", "cidr": "10.10.0.0/16", "criticality": "critical"},
            {"name": "prod-risk-vpc", "cidr": "10.11.0.0/16", "criticality": "critical"},
            {"name": "prod-portfolio-vpc", "cidr": "10.12.0.0/16", "criticality": "high"},
            {"name": "prod-client-vpc", "cidr": "10.13.0.0/16", "criticality": "critical"},
            {"name": "prod-market-data-vpc", "cidr": "10.14.0.0/16", "criticality": "critical"},
            {"name": "prod-settlement-vpc", "cidr": "10.15.0.0/16", "criticality": "high"},
            {"name": "prod-compliance-vpc", "cidr": "10.16.0.0/16", "criticality": "high"},
            {"name": "prod-ops-vpc", "cidr": "10.17.0.0/16", "criticality": "medium"}
        ]
        
        # Non-production VPCs
        non_prod_vpcs = [
            {"name": "staging-shared-vpc", "cidr": "10.20.0.0/16", "criticality": "medium"},
            {"name": "qa-testing-vpc", "cidr": "10.21.0.0/16", "criticality": "low"},
            {"name": "dev-shared-vpc", "cidr": "10.22.0.0/16", "criticality": "low"},
            {"name": "sandbox-vpc", "cidr": "10.23.0.0/16", "criticality": "low"},
            {"name": "perf-testing-vpc", "cidr": "10.24.0.0/16", "criticality": "medium"},
            {"name": "dr-replica-vpc", "cidr": "10.30.0.0/16", "criticality": "high"},
            {"name": "security-tools-vpc", "cidr": "10.31.0.0/16", "criticality": "high"}
        ]
        
        all_vpc_templates = prod_vpcs + non_prod_vpcs
        
        for i, template in enumerate(all_vpc_templates[:count]):
            # Weighted region selection
            region_weights = [(region, data["weight"]) for region, data in self.regions.items()]
            regions, weights = zip(*region_weights)
            region = random.choices(regions, weights=weights)[0]
            
            environment = "production" if "prod" in template["name"] else template["name"].split("-")[0]
            
            vpc = {
                "vpc_id": f"vpc-{random.randint(10000000, 99999999):08x}",
                "name": template["name"],
                "cidr_block": template["cidr"],
                "region": region,
                "availability_zones": self.regions[region]["azs"][:random.randint(3, len(self.regions[region]["azs"]))],
                "environment": environment,
                "business_criticality": template["criticality"],
                "dns_hostnames": True,
                "dns_resolution": True,
                "created_at": (datetime.utcnow() - timedelta(days=random.randint(180, 800))).isoformat(),
                "tags": {
                    "Environment": environment,
                    "BusinessUnit": random.choice(self.business_units),
                    "CostCenter": f"CC-{random.randint(1000, 9999)}",
                    "Owner": f"{random.choice(['trading', 'risk', 'portfolio', 'ops'])}-team@capitalgroup.com"
                }
            }
            vpcs.append(vpc)
            
        return vpcs

    def generate_enterprise_eks_clusters(self, vpcs: List[Dict], count: int = 25) -> List[Dict[str, Any]]:
        """Generate 25 EKS clusters across business units"""
        clusters = []
        
        # Generate cluster names by business unit and environment
        cluster_patterns = []
        for bu in self.business_units:
            for env in ["prod", "staging", "dev"]:
                if env == "prod" or random.random() < 0.7:  # Not all BUs have all environments
                    cluster_patterns.append(f"{env}-{bu.lower()}-cluster")
        
        for i, cluster_name in enumerate(cluster_patterns[:count]):
            vpc = random.choice([v for v in vpcs if cluster_name.startswith(v["environment"])])
            
            # Realistic node group configuration
            if "prod" in cluster_name:
                node_groups = random.randint(3, 8)
                nodes_per_group = random.randint(10, 50)
                instance_sizes = ["medium", "large", "xlarge"]
            elif "staging" in cluster_name:
                node_groups = random.randint(2, 4)
                nodes_per_group = random.randint(5, 20)
                instance_sizes = ["small", "medium"]
            else:  # dev
                node_groups = random.randint(1, 3)
                nodes_per_group = random.randint(3, 10)
                instance_sizes = ["small"]
            
            total_nodes = node_groups * nodes_per_group
            instance_type = random.choice(self.instance_types["eks_nodes"][random.choice(instance_sizes)])
            
            # Calculate realistic costs
            cost_per_node = {
                "t3.medium": 35, "t3.large": 70, "m5.large": 90, "m5.xlarge": 180,
                "m5.2xlarge": 360, "m5.4xlarge": 720, "c5.xlarge": 160, "c5.2xlarge": 320,
                "c5.4xlarge": 640, "r5.2xlarge": 480, "r5.4xlarge": 960
            }.get(instance_type, 100)
            
            monthly_cost = total_nodes * cost_per_node
            
            cluster = {
                "name": cluster_name,
                "arn": f"arn:aws:eks:{vpc['region']}:123456789012:cluster/{cluster_name}",
                "region": vpc["region"],
                "vpc_id": vpc["vpc_id"],
                "version": random.choices(["1.27", "1.28", "1.29", "1.30"], weights=[10, 30, 50, 10])[0],
                "status": random.choices(["ACTIVE", "CREATING", "UPDATING", "DELETING"], weights=[85, 8, 6, 1])[0],
                "endpoint": f"https://{uuid.uuid4().hex[:12].upper()}.yl4.{vpc['region']}.eks.amazonaws.com",
                "created_at": (datetime.utcnow() - timedelta(days=random.randint(60, 400))).isoformat(),
                "node_groups": node_groups,
                "total_nodes": total_nodes,
                "primary_instance_type": instance_type,
                "cost_monthly": monthly_cost,
                "environment": vpc["environment"],
                "business_unit": cluster_name.split("-")[1].title(),
                "subnet_ids": [f"subnet-{random.randint(10000, 99999):05x}" for _ in range(random.randint(4, 8))],
                "security_groups": [f"sg-eks-{random.randint(10000000, 99999999):08x}" for _ in range(random.randint(2, 4))],
                "logging": {
                    "api": random.choice([True, False]),
                    "audit": True if "prod" in cluster_name else random.choice([True, False]),
                    "authenticator": True,
                    "controllerManager": True if "prod" in cluster_name else random.choice([True, False]),
                    "scheduler": True if "prod" in cluster_name else random.choice([True, False])
                },
                "addons": random.sample(["vpc-cni", "kube-proxy", "coredns", "aws-ebs-csi-driver", "aws-efs-csi-driver"], random.randint(3, 5))
            }
            clusters.append(cluster)
            
        return clusters

    def generate_massive_pod_topology(self, clusters: List[Dict], target_pods: int = 15000) -> List[Dict[str, Any]]:
        """Generate 15,000+ Kubernetes pods across clusters"""
        pods = []
        pods_generated = 0
        
        # Create namespaces first
        namespaces = []
        for bu in self.business_units:
            for env in ["prod", "staging", "dev"]:
                namespaces.extend([
                    f"{bu.lower()}-{env}",
                    f"{bu.lower()}-{env}-system",
                    f"{bu.lower()}-{env}-monitoring"
                ])
        
        # Generate pods distributed across clusters
        for cluster in clusters:
            cluster_pod_count = int(target_pods * (cluster["total_nodes"] / sum(c["total_nodes"] for c in clusters)))
            cluster_pods_created = 0
            
            while cluster_pods_created < cluster_pod_count and pods_generated < target_pods:
                # Choose service type based on business unit
                bu_services = next((fs for fs in self.financial_service_types if cluster["business_unit"].lower().startswith(fs["prefix"])), 
                                 random.choice(self.financial_service_types))
                
                service_name = random.choice(bu_services["services"])
                namespace = f"{cluster['business_unit'].lower()}-{cluster['environment']}"
                
                # Create multiple pods for the same service (replicas)
                replicas = random.randint(2, 20) if "prod" in cluster["name"] else random.randint(1, 8)
                
                for replica in range(replicas):
                    if pods_generated >= target_pods:
                        break
                        
                    pod_name = f"{service_name}-{random.randint(1000, 9999)}-{random.choice(string.ascii_lowercase)}{random.choice(string.ascii_lowercase)}{random.randint(10, 99)}"
                    
                    # Select technology stack
                    tech_stack = random.choice(list(self.technology_stacks.keys()))
                    stack_info = self.technology_stacks[tech_stack]
                    
                    # Resource allocation based on service type
                    if "engine" in service_name or "calculator" in service_name:
                        cpu_request, cpu_limit = "500m", "2000m"
                        memory_request, memory_limit = "1Gi", "4Gi"
                    elif "gateway" in service_name or "api" in service_name:
                        cpu_request, cpu_limit = "200m", "1000m"
                        memory_request, memory_limit = "512Mi", "2Gi"
                    else:
                        cpu_request, cpu_limit = "100m", "500m"
                        memory_request, memory_limit = "256Mi", "1Gi"
                    
                    pod = {
                        "name": pod_name,
                        "namespace": namespace,
                        "cluster_name": cluster["name"],
                        "status": random.choices(["Running", "Pending", "Succeeded", "Failed", "Unknown"], 
                                               weights=[85, 5, 5, 3, 2])[0],
                        "phase": random.choices(["Running", "Pending", "Succeeded", "Failed"], 
                                              weights=[85, 8, 4, 3])[0],
                        "service_name": service_name,
                        "business_unit": cluster["business_unit"],
                        "environment": cluster["environment"],
                        "node_name": f"ip-{random.randint(10,192)}-{random.randint(0,255)}-{random.randint(0,255)}-{random.randint(1,254)}.{cluster['region']}.compute.internal",
                        "pod_ip": f"{random.randint(10,192)}.{random.randint(0,255)}.{random.randint(0,255)}.{random.randint(1,254)}",
                        "host_ip": f"{random.randint(10,192)}.{random.randint(0,255)}.{random.randint(0,255)}.{random.randint(1,254)}",
                        "start_time": (datetime.utcnow() - timedelta(days=random.randint(1, 30), hours=random.randint(0, 23))).isoformat(),
                        "restart_count": random.choices([0, 1, 2, 3, 4, 5], weights=[60, 20, 10, 5, 3, 2])[0],
                        "cpu_request": cpu_request,
                        "cpu_limit": cpu_limit,
                        "memory_request": memory_request,
                        "memory_limit": memory_limit,
                        "technology_stack": tech_stack,
                        "language": random.choice(stack_info["languages"]),
                        "framework": random.choice(stack_info["frameworks"]),
                        "container_image": f"capital-registry.com/{service_name}:{random.randint(1,5)}.{random.randint(0,20)}.{random.randint(0,50)}",
                        "container_port": random.choice([8080, 8000, 9000, 3000, 4000, 8443]),
                        "liveness_probe": random.choice([True, False]),
                        "readiness_probe": True,
                        "volumes": random.randint(0, 3),
                        "labels": {
                            "app": service_name,
                            "version": f"v{random.randint(1,5)}.{random.randint(0,20)}",
                            "tier": random.choice(["frontend", "backend", "database", "cache"]),
                            "business-unit": cluster["business_unit"].lower()
                        }
                    }
                    pods.append(pod)
                    pods_generated += 1
                    cluster_pods_created += 1
        
        logger.info(f"✅ Generated {pods_generated} pods across {len(clusters)} clusters")
        return pods

    def generate_enterprise_databases(self, vpcs: List[Dict], count: int = 50) -> List[Dict[str, Any]]:
        """Generate 50 database instances across environments"""
        databases = []
        
        # PostgreSQL templates for different use cases
        pg_templates = [
            {"purpose": "trading-primary", "engine": "postgres", "version": "15.4", "size": "xlarge", "storage": 3000, "replica_count": 2},
            {"purpose": "trading-analytics", "engine": "postgres", "version": "15.4", "size": "large", "storage": 2000, "replica_count": 1},
            {"purpose": "risk-calculation", "engine": "postgres", "version": "14.9", "size": "xlarge", "storage": 1500, "replica_count": 2},
            {"purpose": "portfolio-data", "engine": "postgres", "version": "15.4", "size": "medium", "storage": 1000, "replica_count": 1},
            {"purpose": "client-data", "engine": "postgres", "version": "15.4", "size": "large", "storage": 2500, "replica_count": 2},
            {"purpose": "market-feed", "engine": "postgres", "version": "14.9", "size": "xlarge", "storage": 5000, "replica_count": 3},
            {"purpose": "compliance-reports", "engine": "postgres", "version": "15.4", "size": "medium", "storage": 800, "replica_count": 1},
            {"purpose": "settlement-data", "engine": "postgres", "version": "15.4", "size": "large", "storage": 1200, "replica_count": 1}
        ]
        
        # Oracle templates for legacy systems
        oracle_templates = [
            {"purpose": "legacy-trading", "engine": "oracle-ee", "version": "19.0.0.0.ru-2024-04.rur-2024-04.r1", "size": "xlarge", "storage": 8000, "replica_count": 1},
            {"purpose": "legacy-portfolio", "engine": "oracle-ee", "version": "19.0.0.0.ru-2024-04.rur-2024-04.r1", "size": "large", "storage": 5000, "replica_count": 1},
            {"purpose": "regulatory-reporting", "engine": "oracle-ee", "version": "12.2.0.1.ru-2024-01.rur-2024-01.r1", "size": "xlarge", "storage": 3000, "replica_count": 0}
        ]
        
        # MySQL templates for specific applications
        mysql_templates = [
            {"purpose": "session-store", "engine": "mysql", "version": "8.0.35", "size": "medium", "storage": 500, "replica_count": 2},
            {"purpose": "cms-backend", "engine": "mysql", "version": "8.0.35", "size": "small", "storage": 200, "replica_count": 1},
            {"purpose": "analytics-cache", "engine": "mysql", "version": "8.0.35", "size": "medium", "storage": 800, "replica_count": 1}
        ]
        
        all_templates = pg_templates * 4 + oracle_templates * 2 + mysql_templates * 3  # Repeat to reach 50
        
        for i, template in enumerate(all_templates[:count]):
            vpc = random.choice([v for v in vpcs if v["environment"] == ("production" if "prod" in template["purpose"] or "legacy" in template["purpose"] else random.choice(["staging", "dev"]))])
            
            # Instance class selection
            size_mapping = {
                "small": random.choice(self.instance_types["rds"]["small"]),
                "medium": random.choice(self.instance_types["rds"]["medium"]),
                "large": random.choice(self.instance_types["rds"]["large"]),
                "xlarge": random.choice(self.instance_types["rds"]["xlarge"])
            }
            instance_class = size_mapping[template["size"]]
            
            # Cost calculation
            base_costs = {
                "small": 120, "medium": 350, "large": 800, "xlarge": 1500
            }
            storage_cost = template["storage"] * 0.115
            
            if template["engine"] == "oracle-ee":
                compute_cost = base_costs[template["size"]] * 3.5  # Oracle licensing premium
                license_cost = random.randint(2000, 8000)
            elif template["engine"] == "mysql":
                compute_cost = base_costs[template["size"]] * 0.8  # MySQL is cheaper
                license_cost = 0
            else:  # PostgreSQL
                compute_cost = base_costs[template["size"]]
                license_cost = 0
            
            monthly_cost = compute_cost + storage_cost + license_cost
            
            # Generate primary database
            db_name = f"{template['purpose']}-{vpc['environment']}-{random.randint(1, 99):02d}"
            
            database = {
                "identifier": db_name,
                "arn": f"arn:aws:rds:{vpc['region']}:123456789012:db:{db_name}",
                "engine": template["engine"],
                "engine_version": template["version"],
                "instance_class": instance_class,
                "status": random.choices(["available", "backing-up", "modifying", "upgrading", "rebooting"], 
                                       weights=[82, 8, 5, 3, 2])[0],
                "region": vpc["region"],
                "vpc_id": vpc["vpc_id"],
                "allocated_storage": template["storage"],
                "storage_type": random.choices(["gp3", "gp2", "io1", "io2"], weights=[60, 25, 10, 5])[0],
                "multi_az": template["purpose"].startswith(("trading", "risk", "client")) and "prod" in vpc["environment"],
                "backup_retention": 30 if "prod" in vpc["environment"] else random.choice([7, 14]),
                "cost_monthly": round(monthly_cost, 2),
                "environment": vpc["environment"],
                "business_unit": random.choice(self.business_units),
                "purpose": template["purpose"],
                "subnet_group": f"{template['purpose'].split('-')[0]}-db-subnet-group",
                "parameter_group": f"{template['engine']}-{template['size']}-{random.randint(1, 5)}",
                "option_group": f"{template['engine']}-{template['version'].split('.')[0]}-{random.randint(1, 3)}" if template["engine"] == "oracle-ee" else None,
                "created_at": (datetime.utcnow() - timedelta(days=random.randint(90, 600))).isoformat(),
                "connections_active": random.randint(5, 200),
                "connections_max": random.randint(200, 1000),
                "cpu_utilization": random.uniform(10, 85),
                "memory_utilization": random.uniform(20, 90),
                "storage_utilization": random.uniform(30, 85),
                "iops_used": random.randint(100, 10000),
                "read_latency": random.uniform(1.2, 25.8),
                "write_latency": random.uniform(2.1, 45.3)
            }
            
            if template["engine"] == "oracle-ee":
                database["license_model"] = "bring-your-own-license"
                database["character_set"] = "AL32UTF8"
                database["national_character_set"] = "AL16UTF16"
            
            databases.append(database)
            
            # Generate read replicas
            for replica_num in range(template["replica_count"]):
                replica_name = f"{db_name}-replica-{replica_num + 1:02d}"
                replica = database.copy()
                replica.update({
                    "identifier": replica_name,
                    "arn": f"arn:aws:rds:{vpc['region']}:123456789012:db:{replica_name}",
                    "multi_az": False,
                    "backup_retention": 0,
                    "cost_monthly": round(monthly_cost * 0.7, 2),  # Replicas are cheaper
                    "read_replica_source": db_name,
                    "replica_lag": random.uniform(0.1, 5.2)
                })
                databases.append(replica)
        
        logger.info(f"✅ Generated {len(databases)} database instances")
        return databases

    def generate_massive_ec2_fleet(self, vpcs: List[Dict], target_instances: int = 8000) -> List[Dict[str, Any]]:
        """Generate 8,000+ EC2 instances for enterprise scale"""
        instances = []
        
        # EC2 instance purposes in financial services
        instance_purposes = [
            {"type": "web-server", "count_ratio": 0.25, "sizes": ["small", "medium"]},
            {"type": "application-server", "count_ratio": 0.30, "sizes": ["medium", "large"]},
            {"type": "batch-processor", "count_ratio": 0.15, "sizes": ["large", "xlarge"]},
            {"type": "cache-server", "count_ratio": 0.10, "sizes": ["medium", "large"]},
            {"type": "monitoring-agent", "count_ratio": 0.08, "sizes": ["small"]},
            {"type": "security-scanner", "count_ratio": 0.05, "sizes": ["medium"]},
            {"type": "backup-server", "count_ratio": 0.04, "sizes": ["large"]},
            {"type": "jump-host", "count_ratio": 0.02, "sizes": ["small"]},
            {"type": "sql-server", "count_ratio": 0.01, "sizes": ["large", "xlarge"]}
        ]
        
        for purpose_config in instance_purposes:
            purpose = purpose_config["type"]
            instance_count = int(target_instances * purpose_config["count_ratio"])
            
            for i in range(instance_count):
                vpc = random.choice(vpcs)
                size = random.choice(purpose_config["sizes"])
                instance_type = random.choice(self.instance_types["ec2"][size])
                
                # Operating system distribution
                if purpose == "sql-server":
                    os_type = "Windows Server 2019"
                    ami = f"ami-{random.randint(0, 2**64):016x}"
                else:
                    os_type = random.choices(["Amazon Linux 2", "Ubuntu 22.04", "RHEL 8", "Windows Server 2019"], 
                                           weights=[40, 30, 20, 10])[0]
                    ami = f"ami-{random.randint(0, 2**64):016x}"
                
                # Cost calculation
                cost_mapping = {
                    "t3.micro": 8, "t3.small": 16, "t3.medium": 35, "t3.large": 70,
                    "m5.large": 90, "m5.xlarge": 180, "m5.2xlarge": 360, "m5.4xlarge": 720,
                    "c5.large": 80, "c5.xlarge": 160, "c5.2xlarge": 320, "c5.4xlarge": 640,
                    "m5.8xlarge": 1440, "c5.9xlarge": 1440, "c5.18xlarge": 2880
                }
                base_cost = cost_mapping.get(instance_type, 100)
                
                # Windows licensing adds cost
                license_cost = 50 if "Windows" in os_type else 0
                storage_cost = random.randint(20, 200)  # EBS storage
                monthly_cost = base_cost + license_cost + storage_cost
                
                instance_name = f"{purpose}-{vpc['environment']}-{random.randint(1, 999):03d}"
                
                instance = {
                    "instance_id": f"i-{random.randint(0, 2**64):016x}",
                    "name": instance_name,
                    "instance_type": instance_type,
                    "region": vpc["region"],
                    "vpc_id": vpc["vpc_id"],
                    "availability_zone": random.choice(vpc["availability_zones"]),
                    "status": random.choices(["running", "stopped", "pending", "stopping", "terminated"], 
                                           weights=[75, 15, 5, 3, 2])[0],
                    "private_ip": f"10.{random.randint(10, 30)}.{random.randint(1, 254)}.{random.randint(10, 250)}",
                    "public_ip": f"{random.randint(1, 223)}.{random.randint(0, 255)}.{random.randint(0, 255)}.{random.randint(1, 254)}" if random.random() < 0.1 else None,
                    "subnet_id": f"subnet-{random.randint(10000, 99999):05x}",
                    "security_groups": [f"sg-{purpose}-{random.randint(10000000, 99999999):08x}"],
                    "key_pair": f"capital-{vpc['environment']}-keypair",
                    "iam_role": f"EC2-{purpose.title()}-Role",
                    "purpose": purpose,
                    "os_type": os_type,
                    "ami_id": ami,
                    "cost_monthly": round(monthly_cost, 2),
                    "cpu_utilization": random.uniform(5, 85),
                    "memory_utilization": random.uniform(15, 90),
                    "disk_utilization": random.uniform(20, 80),
                    "environment": vpc["environment"],
                    "business_unit": random.choice(self.business_units),
                    "patch_group": f"{purpose}-{vpc['environment']}-patches",
                    "monitoring_enabled": True if "prod" in vpc["environment"] else random.choice([True, False]),
                    "created_at": (datetime.utcnow() - timedelta(days=random.randint(30, 400))).isoformat(),
                    "ebs_volumes": [
                        {
                            "volume_id": f"vol-{random.randint(0, 2**64):016x}",
                            "size": random.choice([50, 100, 200, 500, 1000]),
                            "volume_type": random.choice(["gp3", "gp2", "io1"]),
                            "iops": random.randint(100, 5000),
                            "encrypted": True if "prod" in vpc["environment"] else random.choice([True, False])
                        }
                    ]
                }
                
                # Add SQL Server specific fields
                if purpose == "sql-server":
                    instance.update({
                        "sqlserver_edition": random.choice(["Enterprise", "Standard", "Web", "Express"]),
                        "sqlserver_version": random.choice(["2019", "2017", "2016"]),
                        "license_type": random.choice(["license-included", "bring-your-own-license"]),
                        "collation": "SQL_Latin1_General_CP1_CI_AS"
                    })
                
                instances.append(instance)
        
        logger.info(f"✅ Generated {len(instances)} EC2 instances")
        return instances

    def generate_aws_services(self, vpcs: List[Dict], count: int = 1000) -> List[Dict[str, Any]]:
        """Generate 1,000+ AWS managed services (Lambda, S3, etc.)"""
        services = []
        
        # Lambda functions
        lambda_patterns = [
            {"prefix": "trading", "functions": ["order-validator", "trade-enricher", "position-updater", "risk-checker", "notification-sender"]},
            {"prefix": "portfolio", "functions": ["rebalance-trigger", "performance-calc", "allocation-adjuster", "benchmark-updater"]},
            {"prefix": "risk", "functions": ["var-calculator", "stress-processor", "limit-checker", "exposure-aggregator"]},
            {"prefix": "client", "functions": ["account-creator", "document-processor", "notification-router", "preference-updater"]},
            {"prefix": "ops", "functions": ["log-processor", "metric-aggregator", "alert-router", "backup-trigger", "cleanup-job"]}
        ]
        
        lambda_count = int(count * 0.4)  # 40% Lambda functions
        for pattern in lambda_patterns:
            for func in pattern["functions"]:
                for env in ["prod", "staging", "dev"]:
                    if len(services) >= lambda_count:
                        break
                    
                    vpc = random.choice([v for v in vpcs if v["environment"] == ("production" if env == "prod" else env)])
                    
                    lambda_func = {
                        "name": f"{pattern['prefix']}-{func}-{env}",
                        "arn": f"arn:aws:lambda:{vpc['region']}:123456789012:function:{pattern['prefix']}-{func}-{env}",
                        "type": "Lambda",
                        "runtime": random.choice(["python3.11", "python3.10", "nodejs18.x", "nodejs20.x", "java17", "dotnet8"]),
                        "memory": random.choice([128, 256, 512, 1024, 1536, 2048, 3008]),
                        "timeout": random.randint(3, 900),
                        "region": vpc["region"],
                        "vpc_id": vpc["vpc_id"] if random.random() < 0.3 else None,  # Some Lambdas not in VPC
                        "environment": vpc["environment"],
                        "business_unit": pattern["prefix"].title(),
                        "invocations_per_day": random.randint(100, 100000),
                        "avg_duration": random.randint(50, 5000),
                        "error_rate": random.uniform(0.01, 2.5),
                        "cost_monthly": random.uniform(5, 500),
                        "last_modified": (datetime.utcnow() - timedelta(days=random.randint(1, 90))).isoformat(),
                        "concurrent_executions": random.randint(1, 100),
                        "dead_letter_queue": random.choice([True, False]),
                        "layers": random.randint(0, 3)
                    }
                    services.append(lambda_func)
        
        # S3 Buckets
        s3_count = int(count * 0.2)  # 20% S3 buckets
        s3_purposes = ["backups", "logs", "data-lake", "static-assets", "reports", "archives", "temp-storage", "compliance-docs"]
        
        for i in range(s3_count):
            vpc = random.choice(vpcs)
            purpose = random.choice(s3_purposes)
            
            bucket = {
                "name": f"capital-{purpose}-{vpc['environment']}-{random.randint(1000, 9999)}",
                "arn": f"arn:aws:s3:::capital-{purpose}-{vpc['environment']}-{random.randint(1000, 9999)}",
                "type": "S3",
                "region": vpc["region"],
                "environment": vpc["environment"],
                "business_unit": random.choice(self.business_units),
                "purpose": purpose,
                "storage_class": random.choice(["STANDARD", "STANDARD_IA", "GLACIER", "DEEP_ARCHIVE"]),
                "object_count": random.randint(1000, 10000000),
                "size_gb": random.randint(100, 50000),
                "cost_monthly": random.uniform(50, 5000),
                "versioning": random.choice([True, False]),
                "encryption": True if "prod" in vpc["environment"] else random.choice([True, False]),
                "lifecycle_policy": random.choice([True, False]),
                "public_access": False,  # Financial services security
                "replication": random.choice([True, False]) if purpose in ["backups", "compliance-docs"] else False,
                "created_at": (datetime.utcnow() - timedelta(days=random.randint(30, 500))).isoformat()
            }
            services.append(bucket)
        
        # API Gateway
        api_count = int(count * 0.1)  # 10% API Gateways
        for i in range(api_count):
            vpc = random.choice(vpcs)
            bu = random.choice(self.business_units)
            
            api = {
                "name": f"{bu.lower()}-api-{vpc['environment']}",
                "arn": f"arn:aws:apigateway:{vpc['region']}::/restapis/{uuid.uuid4().hex}",
                "type": "APIGateway",
                "region": vpc["region"],
                "environment": vpc["environment"],
                "business_unit": bu,
                "api_type": random.choice(["REST", "HTTP", "WebSocket"]),
                "stage": vpc["environment"],
                "requests_per_day": random.randint(10000, 1000000),
                "avg_latency": random.uniform(50, 500),
                "error_rate": random.uniform(0.1, 3.0),
                "cost_monthly": random.uniform(100, 2000),
                "throttling_enabled": True,
                "caching_enabled": random.choice([True, False]),
                "cors_enabled": True,
                "custom_domain": f"{bu.lower()}-api.capitalgroup.com" if vpc["environment"] == "production" else None,
                "created_at": (datetime.utcnow() - timedelta(days=random.randint(60, 300))).isoformat()
            }
            services.append(api)
        
        # Load Balancers
        alb_count = int(count * 0.15)  # 15% Load Balancers
        for i in range(alb_count):
            vpc = random.choice(vpcs)
            
            alb = {
                "name": f"alb-{random.choice(self.business_units).lower()}-{vpc['environment']}-{random.randint(1, 99):02d}",
                "arn": f"arn:aws:elasticloadbalancing:{vpc['region']}:123456789012:loadbalancer/app/{uuid.uuid4().hex[:16]}/{uuid.uuid4().hex}",
                "type": "ApplicationLoadBalancer",
                "region": vpc["region"],
                "vpc_id": vpc["vpc_id"],
                "environment": vpc["environment"],
                "scheme": random.choice(["internet-facing", "internal"]),
                "load_balancer_type": "application",
                "state": random.choices(["active", "provisioning", "failed"], weights=[90, 8, 2])[0],
                "availability_zones": random.sample(vpc["availability_zones"], random.randint(2, len(vpc["availability_zones"]))),
                "target_groups": random.randint(1, 8),
                "listeners": random.randint(1, 4),
                "requests_per_second": random.randint(100, 10000),
                "active_connections": random.randint(50, 5000),
                "cost_monthly": random.uniform(25, 300),
                "ssl_cert": f"arn:aws:acm:{vpc['region']}:123456789012:certificate/{uuid.uuid4()}",
                "created_at": (datetime.utcnow() - timedelta(days=random.randint(30, 200))).isoformat()
            }
            services.append(alb)
        
        # Additional AWS services to reach target count
        remaining_count = count - len(services)
        other_services = ["ElastiCache", "SQS", "SNS", "CloudWatch", "KMS", "Secrets Manager", "Parameter Store"]
        
        for i in range(remaining_count):
            vpc = random.choice(vpcs)
            service_type = random.choice(other_services)
            
            service = {
                "name": f"{service_type.lower()}-{random.choice(self.business_units).lower()}-{vpc['environment']}-{random.randint(1, 999):03d}",
                "type": service_type,
                "region": vpc["region"],
                "environment": vpc["environment"],
                "business_unit": random.choice(self.business_units),
                "cost_monthly": random.uniform(10, 1000),
                "created_at": (datetime.utcnow() - timedelta(days=random.randint(10, 365))).isoformat()
            }
            services.append(service)
        
        logger.info(f"✅ Generated {len(services)} AWS managed services")
        return services

    def create_enterprise_nodes_batch(self):
        """Create all enterprise infrastructure nodes in batches for performance"""
        logger.info("🚀 Generating enterprise-scale topology (50,000+ nodes)...")
        
        # Generate all components
        logger.info("Generating VPCs...")
        vpcs = self.generate_enterprise_vpcs(15)
        
        logger.info("Generating EKS clusters...")
        clusters = self.generate_enterprise_eks_clusters(vpcs, 25)
        
        logger.info("Generating pods...")
        pods = self.generate_massive_pod_topology(clusters, 15000)
        
        logger.info("Generating databases...")
        databases = self.generate_enterprise_databases(vpcs, 50)
        
        logger.info("Generating EC2 instances...")
        ec2_instances = self.generate_massive_ec2_fleet(vpcs, 8000)
        
        logger.info("Generating AWS services...")
        aws_services = self.generate_aws_services(vpcs, 1000)
        
        # Create nodes in batches for performance
        batch_size = 1000
        
        with self.driver.session() as session:
            # Create VPCs
            session.run("""
            UNWIND $vpcs as vpc
            CREATE (v:VPC:AWSResource {
                vpc_id: vpc.vpc_id, name: vpc.name, cidr_block: vpc.cidr_block,
                region: vpc.region, environment: vpc.environment, type: 'VPC',
                availability_zones: vpc.availability_zones, created_at: vpc.created_at,
                business_criticality: vpc.business_criticality, dns_hostnames: vpc.dns_hostnames,
                dns_resolution: vpc.dns_resolution, tags: vpc.tags
            })
            """, vpcs=vpcs)
            
            # Create EKS clusters
            session.run("""
            UNWIND $clusters as cluster
            CREATE (c:EKSCluster:AWSResource {
                name: cluster.name, arn: cluster.arn, region: cluster.region, vpc_id: cluster.vpc_id,
                version: cluster.version, status: cluster.status, endpoint: cluster.endpoint,
                created_at: cluster.created_at, node_groups: cluster.node_groups,
                total_nodes: cluster.total_nodes, primary_instance_type: cluster.primary_instance_type,
                cost_monthly: cluster.cost_monthly, environment: cluster.environment,
                business_unit: cluster.business_unit, subnet_ids: cluster.subnet_ids,
                security_groups: cluster.security_groups, logging: cluster.logging,
                addons: cluster.addons, type: 'EKS'
            })
            """, clusters=clusters)
            
            # Create pods in batches
            for i in range(0, len(pods), batch_size):
                batch = pods[i:i + batch_size]
                session.run("""
                UNWIND $pods as pod
                CREATE (p:Pod {
                    name: pod.name, namespace: pod.namespace, cluster_name: pod.cluster_name,
                    status: pod.status, phase: pod.phase, service_name: pod.service_name,
                    business_unit: pod.business_unit, environment: pod.environment,
                    node_name: pod.node_name, pod_ip: pod.pod_ip, host_ip: pod.host_ip,
                    start_time: pod.start_time, restart_count: pod.restart_count,
                    cpu_request: pod.cpu_request, cpu_limit: pod.cpu_limit,
                    memory_request: pod.memory_request, memory_limit: pod.memory_limit,
                    technology_stack: pod.technology_stack, language: pod.language,
                    framework: pod.framework, container_image: pod.container_image,
                    container_port: pod.container_port, liveness_probe: pod.liveness_probe,
                    readiness_probe: pod.readiness_probe, volumes: pod.volumes, labels: pod.labels
                })
                """, pods=batch)
                logger.info(f"Created pod batch {i//batch_size + 1}/{(len(pods)//batch_size) + 1}")
            
            # Create databases in batches
            for i in range(0, len(databases), batch_size):
                batch = databases[i:i + batch_size]
                session.run("""
                UNWIND $databases as db
                CREATE (d:RDSInstance:AWSResource {
                    identifier: db.identifier, arn: db.arn, engine: db.engine,
                    engine_version: db.engine_version, instance_class: db.instance_class,
                    status: db.status, region: db.region, vpc_id: db.vpc_id,
                    allocated_storage: db.allocated_storage, storage_type: db.storage_type,
                    multi_az: db.multi_az, backup_retention: db.backup_retention,
                    cost_monthly: db.cost_monthly, environment: db.environment,
                    business_unit: db.business_unit, purpose: db.purpose,
                    subnet_group: db.subnet_group, parameter_group: db.parameter_group,
                    option_group: db.option_group, created_at: db.created_at,
                    connections_active: db.connections_active, connections_max: db.connections_max,
                    cpu_utilization: db.cpu_utilization, memory_utilization: db.memory_utilization,
                    storage_utilization: db.storage_utilization, iops_used: db.iops_used,
                    read_latency: db.read_latency, write_latency: db.write_latency,
                    read_replica_source: db.read_replica_source, replica_lag: db.replica_lag,
                    license_model: db.license_model, character_set: db.character_set,
                    national_character_set: db.national_character_set, type: 'RDS'
                })
                """, databases=batch)
                logger.info(f"Created database batch {i//batch_size + 1}/{(len(databases)//batch_size) + 1}")
            
            # Create EC2 instances in batches
            for i in range(0, len(ec2_instances), batch_size):
                batch = ec2_instances[i:i + batch_size]
                session.run("""
                UNWIND $instances as inst
                CREATE (e:EC2Instance:AWSResource {
                    instance_id: inst.instance_id, name: inst.name, instance_type: inst.instance_type,
                    region: inst.region, vpc_id: inst.vpc_id, availability_zone: inst.availability_zone,
                    status: inst.status, private_ip: inst.private_ip, public_ip: inst.public_ip,
                    subnet_id: inst.subnet_id, security_groups: inst.security_groups,
                    key_pair: inst.key_pair, iam_role: inst.iam_role, purpose: inst.purpose,
                    os_type: inst.os_type, ami_id: inst.ami_id, cost_monthly: inst.cost_monthly,
                    cpu_utilization: inst.cpu_utilization, memory_utilization: inst.memory_utilization,
                    disk_utilization: inst.disk_utilization, environment: inst.environment,
                    business_unit: inst.business_unit, patch_group: inst.patch_group,
                    monitoring_enabled: inst.monitoring_enabled, created_at: inst.created_at,
                    ebs_volumes: inst.ebs_volumes, sqlserver_edition: inst.sqlserver_edition,
                    sqlserver_version: inst.sqlserver_version, license_type: inst.license_type,
                    collation: inst.collation, type: 'EC2'
                })
                """, instances=batch)
                logger.info(f"Created EC2 batch {i//batch_size + 1}/{(len(ec2_instances)//batch_size) + 1}")
            
            # Create AWS services in batches
            for i in range(0, len(aws_services), batch_size):
                batch = aws_services[i:i + batch_size]
                
                # Separate Lambda functions from other services due to different schemas
                lambda_batch = [s for s in batch if s.get("type") == "Lambda"]
                other_batch = [s for s in batch if s.get("type") != "Lambda"]
                
                if lambda_batch:
                    session.run("""
                    UNWIND $lambdas as func
                    CREATE (f:LambdaFunction:AWSResource {
                        name: func.name, arn: func.arn, type: func.type, runtime: func.runtime,
                        memory: func.memory, timeout: func.timeout, region: func.region,
                        vpc_id: func.vpc_id, environment: func.environment, business_unit: func.business_unit,
                        invocations_per_day: func.invocations_per_day, avg_duration: func.avg_duration,
                        error_rate: func.error_rate, cost_monthly: func.cost_monthly,
                        last_modified: func.last_modified, concurrent_executions: func.concurrent_executions,
                        dead_letter_queue: func.dead_letter_queue, layers: func.layers
                    })
                    """, lambdas=lambda_batch)
                
                if other_batch:
                    session.run("""
                    UNWIND $services as svc
                    CREATE (s:AWSService:AWSResource {
                        name: svc.name, arn: svc.arn, type: svc.type, region: svc.region,
                        environment: svc.environment, business_unit: svc.business_unit,
                        cost_monthly: svc.cost_monthly, created_at: svc.created_at,
                        storage_class: svc.storage_class, object_count: svc.object_count,
                        size_gb: svc.size_gb, versioning: svc.versioning, encryption: svc.encryption,
                        lifecycle_policy: svc.lifecycle_policy, public_access: svc.public_access,
                        replication: svc.replication, purpose: svc.purpose,
                        api_type: svc.api_type, stage: svc.stage, requests_per_day: svc.requests_per_day,
                        avg_latency: svc.avg_latency, error_rate: svc.error_rate,
                        throttling_enabled: svc.throttling_enabled, caching_enabled: svc.caching_enabled,
                        cors_enabled: svc.cors_enabled, custom_domain: svc.custom_domain
                    })
                    """, services=other_batch)
                
                logger.info(f"Created AWS services batch {i//batch_size + 1}/{(len(aws_services)//batch_size) + 1}")
        
        logger.info(f"✅ Created {len(vpcs)} VPCs, {len(clusters)} clusters, {len(pods)} pods, {len(databases)} databases, {len(ec2_instances)} EC2 instances, {len(aws_services)} AWS services")
        return {
            "vpcs": len(vpcs),
            "clusters": len(clusters), 
            "pods": len(pods),
            "databases": len(databases),
            "ec2_instances": len(ec2_instances),
            "aws_services": len(aws_services),
            "total_nodes": len(vpcs) + len(clusters) + len(pods) + len(databases) + len(ec2_instances) + len(aws_services)
        }

    def create_enterprise_relationships_batch(self):
        """Create enterprise-scale relationships with optimized queries"""
        logger.info("Creating enterprise-scale relationships...")
        
        with self.driver.session() as session:
            # VPC relationships
            logger.info("Creating VPC relationships...")
            session.run("""
            MATCH (v:VPC), (c:EKSCluster)
            WHERE c.vpc_id = v.vpc_id
            CREATE (c)-[:DEPLOYED_IN]->(v)
            """)
            
            session.run("""
            MATCH (v:VPC), (r:RDSInstance) 
            WHERE r.vpc_id = v.vpc_id
            CREATE (r)-[:DEPLOYED_IN]->(v)
            """)
            
            session.run("""
            MATCH (v:VPC), (e:EC2Instance)
            WHERE e.vpc_id = v.vpc_id  
            CREATE (e)-[:DEPLOYED_IN]->(v)
            """)
            
            # Pod to cluster relationships
            logger.info("Creating pod-cluster relationships...")
            session.run("""
            MATCH (p:Pod), (c:EKSCluster)
            WHERE p.cluster_name = c.name
            CREATE (p)-[:RUNS_ON]->(c)
            """)
            
            # Service dependencies based on business logic
            logger.info("Creating service dependencies...")
            
            # Trading system dependencies
            trading_deps = [
                ("order-gateway", "market-connector"),
                ("execution-engine", "order-gateway"),
                ("position-manager", "execution-engine"),
                ("risk-engine", "position-manager"),
                ("trade-settlement", "execution-engine")
            ]
            
            # Portfolio management dependencies
            portfolio_deps = [
                ("allocation-service", "performance-calculator"),
                ("rebalancer", "allocation-service"),
                ("benchmark-service", "performance-calculator"),
                ("attribution-engine", "benchmark-service")
            ]
            
            # Risk management dependencies
            risk_deps = [
                ("var-calculator", "exposure-analyzer"),
                ("stress-tester", "var-calculator"),
                ("compliance-checker", "stress-tester"),
                ("limit-monitor", "exposure-analyzer")
            ]
            
            all_deps = trading_deps + portfolio_deps + risk_deps
            
            for dependent, dependency in all_deps:
                session.run("""
                MATCH (s1:Pod), (s2:Pod)
                WHERE s1.service_name CONTAINS $dependent AND s2.service_name CONTAINS $dependency
                AND s1.environment = s2.environment
                CREATE (s1)-[:DEPENDS_ON]->(s2)
                """, dependent=dependent, dependency=dependency)
            
            # Database connections
            logger.info("Creating database connections...")
            session.run("""
            MATCH (p:Pod), (d:RDSInstance)
            WHERE p.business_unit = d.business_unit 
            AND p.environment = d.environment
            AND p.service_name IN ['order-gateway', 'execution-engine', 'position-manager']
            CREATE (p)-[:CONNECTS_TO]->(d)
            """)
            
            # Load balancer relationships
            logger.info("Creating load balancer relationships...")
            session.run("""
            MATCH (alb:AWSService), (p:Pod)
            WHERE alb.type = 'ApplicationLoadBalancer' 
            AND alb.environment = p.environment
            AND alb.business_unit = p.business_unit
            AND p.service_name CONTAINS 'gateway'
            CREATE (alb)-[:ROUTES_TO]->(p)
            """)
            
            # Lambda trigger relationships
            logger.info("Creating Lambda relationships...")
            session.run("""
            MATCH (l:LambdaFunction), (s:AWSService)
            WHERE l.business_unit = s.business_unit
            AND s.type IN ['SQS', 'SNS']
            AND rand() < 0.3
            CREATE (s)-[:TRIGGERS]->(l)
            """)
            
        logger.info("✅ Enterprise relationships created")

    def add_cost_optimization_opportunities(self):
        """Add specific cost optimization scenarios for demo"""
        logger.info("Adding cost optimization opportunities...")
        
        with self.driver.session() as session:
            # Mark oversized instances for rightsizing
            session.run("""
            MATCH (e:EC2Instance)
            WHERE e.instance_type IN ['m5.4xlarge', 'm5.8xlarge', 'c5.4xlarge', 'c5.9xlarge']
            AND e.cpu_utilization < 40
            SET e.optimization_opportunity = 'rightsize',
                e.recommended_instance_type = CASE
                    WHEN e.instance_type = 'm5.8xlarge' THEN 'm5.4xlarge'
                    WHEN e.instance_type = 'm5.4xlarge' THEN 'm5.2xlarge'
                    WHEN e.instance_type = 'c5.9xlarge' THEN 'c5.4xlarge'
                    WHEN e.instance_type = 'c5.4xlarge' THEN 'c5.2xlarge'
                    ELSE 'm5.large'
                END,
                e.potential_monthly_savings = e.cost_monthly * 0.4
            """)
            
            # Mark development instances for spot
            session.run("""
            MATCH (e:EC2Instance)
            WHERE e.environment IN ['dev', 'qa', 'staging']
            AND e.status = 'running'
            SET e.optimization_opportunity = 'spot_instance',
                e.potential_monthly_savings = e.cost_monthly * 0.7
            """)
            
            # Mark underutilized RDS instances
            session.run("""
            MATCH (d:RDSInstance)
            WHERE d.cpu_utilization < 25
            AND d.connections_active < (d.connections_max * 0.2)
            SET d.optimization_opportunity = 'downsize',
                d.potential_monthly_savings = d.cost_monthly * 0.3
            """)
            
            # Calculate total savings
            result = session.run("""
            MATCH (n)
            WHERE n.potential_monthly_savings IS NOT NULL
            RETURN 
                count(n) as optimization_count,
                sum(n.potential_monthly_savings) as total_monthly_savings,
                sum(n.potential_monthly_savings) * 12 as total_annual_savings
            """).single()
            
            logger.info(f"✅ Added {result['optimization_count']} optimization opportunities worth ${result['total_annual_savings']:,.0f} annually")

    def add_security_vulnerabilities(self):
        """Add security vulnerabilities for demo scenarios"""
        logger.info("Adding security vulnerabilities for demo...")
        
        with self.driver.session() as session:
            # Critical vulnerabilities
            session.run("""
            MATCH (p:Pod)
            WHERE rand() < 0.02  // 2% have critical vulnerabilities
            SET p.security_status = 'critical',
                p.vulnerabilities = [
                    {cve: 'CVE-2024-3094', severity: 'CRITICAL', score: 10.0, description: 'Remote code execution in XZ Utils'},
                    {cve: 'CVE-2024-6387', severity: 'HIGH', score: 8.1, description: 'SSH vulnerability allowing privilege escalation'}
                ],
                p.compliance_status = 'non_compliant',
                p.last_scan: datetime().isoformat()
            """)
            
            # High vulnerabilities
            session.run("""
            MATCH (p:Pod)
            WHERE rand() < 0.08  // 8% have high vulnerabilities
            AND p.security_status IS NULL
            SET p.security_status = 'high',
                p.vulnerabilities = [
                    {cve: 'CVE-2024-22195', severity: 'HIGH', score: 7.5, description: 'Jinja2 template injection vulnerability'},
                    {cve: 'CVE-2024-35195', severity: 'MEDIUM', score: 6.2, description: 'Information disclosure in HTTP headers'}
                ],
                p.compliance_status = 'review_required',
                p.last_scan: datetime().isoformat()
            """)
            
            # Medium vulnerabilities  
            session.run("""
            MATCH (p:Pod)
            WHERE rand() < 0.15  // 15% have medium vulnerabilities
            AND p.security_status IS NULL
            SET p.security_status = 'medium',
                p.vulnerabilities = [
                    {cve: 'CVE-2024-12345', severity: 'MEDIUM', score: 5.3, description: 'Outdated dependency with known issues'}
                ],
                p.compliance_status = 'compliant',
                p.last_scan: datetime().isoformat()
            """)
            
            # Clean/compliant pods
            session.run("""
            MATCH (p:Pod)
            WHERE p.security_status IS NULL
            SET p.security_status = 'clean',
                p.vulnerabilities = [],
                p.compliance_status = 'compliant',
                p.last_scan: datetime().isoformat()
            """)
            
        logger.info("✅ Security vulnerabilities added for demo scenarios")

    def generate_enterprise_topology(self, clear_existing: bool = True):
        """Generate complete enterprise topology with 50,000+ nodes"""
        start_time = time.time()
        
        try:
            if clear_existing:
                self.clear_existing_data()
            
            self.create_enhanced_constraints_and_indexes()
            time.sleep(3)  # Give Neo4j time to process constraints
            
            # Generate and create all components
            node_counts = self.create_enterprise_nodes_batch()
            
            # Create relationships
            self.create_enterprise_relationships_batch()
            
            # Add demo-specific enhancements
            self.add_cost_optimization_opportunities()
            self.add_security_vulnerabilities()
            
            # Final verification
            with self.driver.session() as session:
                node_count = session.run("MATCH (n) RETURN count(n) as count").single()["count"]
                rel_count = session.run("MATCH ()-[r]->() RETURN count(r) as count").single()["count"]
                
                # Performance stats
                avg_degree = session.run("""
                MATCH (n)
                OPTIONAL MATCH (n)-[r]-()
                RETURN avg(count(r)) as avg_degree
                """).single()["avg_degree"]
                
                execution_time = time.time() - start_time
                
            logger.info(f"🎯 Enterprise topology generation complete!")
            logger.info(f"   📊 Nodes: {node_count:,}")
            logger.info(f"   🔗 Relationships: {rel_count:,}")
            logger.info(f"   📈 Avg Degree: {avg_degree:.1f}")
            logger.info(f"   ⏱️  Execution Time: {execution_time:.1f}s")
            
            result = {
                "status": "success",
                "execution_time_seconds": execution_time,
                "total_nodes": node_count,
                "total_relationships": rel_count,
                "node_breakdown": node_counts,
                "average_degree": avg_degree,
                "timestamp": datetime.utcnow().isoformat()
            }
            
            return result
            
        except Exception as e:
            logger.error(f"❌ Enterprise topology generation failed: {e}")
            raise
        finally:
            self.driver.close()

if __name__ == "__main__":
    generator = EnterpriseTopologyGenerator()
    result = generator.generate_enterprise_topology()
    print(f"Enterprise topology generation result: {json.dumps(result, indent=2)}")