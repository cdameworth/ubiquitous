"""
AWS Infrastructure Generator for Ubiquitous POC
Generates realistic AWS infrastructure data and populates Neo4j graph database
"""

from neo4j import GraphDatabase
import random
import uuid
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
import logging
import time
import json

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AWSInfrastructureGenerator:
    """Generates realistic AWS infrastructure topology and relationships"""
    
    def __init__(self, neo4j_uri: str = "bolt://graph:7687", auth: tuple = ("neo4j", "ubiquitous123")):
        self.driver = GraphDatabase.driver(neo4j_uri, auth=auth)
        
        # AWS regions and availability zones
        self.regions = {
            "us-east-1": ["us-east-1a", "us-east-1b", "us-east-1c", "us-east-1d"],
            "us-west-2": ["us-west-2a", "us-west-2b", "us-west-2c"],
            "eu-west-1": ["eu-west-1a", "eu-west-1b", "eu-west-1c"]
        }
        
        # AWS instance types by category
        self.instance_types = {
            "eks_nodes": ["m5.large", "m5.xlarge", "m5.2xlarge", "c5.large", "c5.xlarge", "c5.2xlarge", "r5.large", "r5.xlarge"],
            "rds": ["db.t3.micro", "db.t3.small", "db.t3.medium", "db.t3.large", "db.t3.xlarge", "db.r6g.large", "db.r6g.xlarge", "db.r6g.2xlarge", "db.r5.large", "db.r5.xlarge", "db.r5.2xlarge", "db.r5.4xlarge"],
            "ec2": ["t3.micro", "t3.small", "t3.medium", "t3.large", "t3.xlarge", "m5.large", "m5.xlarge", "m5.2xlarge", "c5.large", "c5.xlarge"]
        }
        
        # Comprehensive service templates with cluster assignments
        self.service_templates = [
            # Trading Cluster Services
            {"name": "trading-api", "type": "api", "cluster": "prod-trading-cluster", "port": 8080, "replicas": (8, 20), "cpu": ("500m", "2000m"), "memory": ("1Gi", "4Gi"), "criticality": "critical"},
            {"name": "order-execution-engine", "type": "computation", "cluster": "prod-trading-cluster", "port": 8081, "replicas": (12, 30), "cpu": ("1000m", "4000m"), "memory": ("2Gi", "8Gi"), "criticality": "critical"},
            {"name": "market-data-ingestion", "type": "stream_processor", "cluster": "prod-trading-cluster", "port": 8082, "replicas": (6, 15), "cpu": ("800m", "3000m"), "memory": ("2Gi", "6Gi"), "criticality": "critical"},
            {"name": "trading-gateway", "type": "api_gateway", "cluster": "prod-trading-cluster", "port": 443, "replicas": (4, 12), "cpu": ("300m", "1500m"), "memory": ("512Mi", "3Gi"), "criticality": "high"},
            {"name": "position-tracker", "type": "microservice", "cluster": "prod-trading-cluster", "port": 8083, "replicas": (4, 10), "cpu": ("400m", "1200m"), "memory": ("1Gi", "3Gi"), "criticality": "high"},
            
            # Risk Cluster Services
            {"name": "risk-calculator", "type": "computation", "cluster": "prod-risk-cluster", "port": 8001, "replicas": (6, 16), "cpu": ("1500m", "4000m"), "memory": ("4Gi", "12Gi"), "criticality": "critical"},
            {"name": "stress-testing-engine", "type": "batch_processor", "cluster": "prod-risk-cluster", "port": 8010, "replicas": (4, 12), "cpu": ("2000m", "6000m"), "memory": ("8Gi", "24Gi"), "criticality": "high"},
            {"name": "var-calculator", "type": "computation", "cluster": "prod-risk-cluster", "port": 8011, "replicas": (3, 8), "cpu": ("1000m", "3000m"), "memory": ("2Gi", "8Gi"), "criticality": "high"},
            {"name": "basel-compliance-api", "type": "api", "cluster": "prod-risk-cluster", "port": 8012, "replicas": (2, 6), "cpu": ("400m", "1000m"), "memory": ("1Gi", "2Gi"), "criticality": "medium"},
            {"name": "risk-reporting-service", "type": "microservice", "cluster": "prod-risk-cluster", "port": 8013, "replicas": (3, 8), "cpu": ("500m", "1500m"), "memory": ("1Gi", "4Gi"), "criticality": "high"},
            
            # Portfolio Cluster Services
            {"name": "portfolio-api", "type": "api", "cluster": "prod-portfolio-cluster", "port": 8002, "replicas": (4, 12), "cpu": ("600m", "2000m"), "memory": ("1Gi", "4Gi"), "criticality": "high"},
            {"name": "rebalancing-engine", "type": "batch_processor", "cluster": "prod-portfolio-cluster", "port": 8020, "replicas": (3, 10), "cpu": ("1500m", "4000m"), "memory": ("4Gi", "12Gi"), "criticality": "high"},
            {"name": "performance-attribution", "type": "computation", "cluster": "prod-portfolio-cluster", "port": 8021, "replicas": (2, 6), "cpu": ("1000m", "2500m"), "memory": ("2Gi", "6Gi"), "criticality": "medium"},
            {"name": "benchmark-comparison", "type": "analytics", "cluster": "prod-portfolio-cluster", "port": 8022, "replicas": (2, 5), "cpu": ("800m", "2000m"), "memory": ("2Gi", "4Gi"), "criticality": "medium"},
            {"name": "client-reporting-api", "type": "api", "cluster": "prod-portfolio-cluster", "port": 8023, "replicas": (3, 8), "cpu": ("400m", "1200m"), "memory": ("1Gi", "3Gi"), "criticality": "high"},
            
            # Shared Infrastructure Services
            {"name": "auth-service", "type": "microservice", "cluster": "staging-apps-cluster", "port": 8080, "replicas": (6, 15), "cpu": ("300m", "1500m"), "memory": ("512Mi", "3Gi"), "criticality": "critical"},
            {"name": "notification-service", "type": "microservice", "cluster": "staging-apps-cluster", "port": 7000, "replicas": (4, 10), "cpu": ("200m", "800m"), "memory": ("512Mi", "2Gi"), "criticality": "high"},
            {"name": "audit-logging-service", "type": "logging", "cluster": "staging-apps-cluster", "port": 8030, "replicas": (3, 8), "cpu": ("400m", "1000m"), "memory": ("1Gi", "2Gi"), "criticality": "high"},
            {"name": "session-manager", "type": "microservice", "cluster": "staging-apps-cluster", "port": 8031, "replicas": (4, 10), "cpu": ("300m", "1000m"), "memory": ("512Mi", "2Gi"), "criticality": "high"},
            
            # Development and Testing Services
            {"name": "test-automation-runner", "type": "ci_cd", "cluster": "dev-microservices-cluster", "port": 8040, "replicas": (2, 8), "cpu": ("500m", "2000m"), "memory": ("1Gi", "4Gi"), "criticality": "low"},
            {"name": "dev-database-seeder", "type": "utility", "cluster": "dev-microservices-cluster", "port": 8041, "replicas": (1, 3), "cpu": ("200m", "800m"), "memory": ("512Mi", "2Gi"), "criticality": "low"}
        ]
        
        self.application_templates = [
            # Core Trading Applications
            {"name": "trading-platform", "type": "web_application", "criticality": "critical", "compliance": ["SOX", "FINRA", "MiFID II"], "team": "Trading Platform Team", "cluster": "prod-trading-cluster"},
            {"name": "order-management-system", "type": "transactional_system", "criticality": "critical", "compliance": ["SOX", "FINRA"], "team": "Trading Operations", "cluster": "prod-trading-cluster"},
            {"name": "market-data-platform", "type": "data_platform", "criticality": "critical", "compliance": ["SOX"], "team": "Market Data Team", "cluster": "prod-trading-cluster"},
            
            # Risk & Compliance Applications
            {"name": "risk-management-system", "type": "analytical_platform", "criticality": "critical", "compliance": ["SOX", "Basel III", "CCAR"], "team": "Risk Analytics Team", "cluster": "prod-risk-cluster"},
            {"name": "regulatory-reporting", "type": "reporting_system", "criticality": "high", "compliance": ["SOX", "GDPR", "FINRA"], "team": "Compliance Team", "cluster": "prod-risk-cluster"},
            {"name": "aml-monitoring-system", "type": "security_platform", "criticality": "critical", "compliance": ["AML", "BSA", "OFAC"], "team": "AML Team", "cluster": "prod-risk-cluster"},
            
            # Portfolio & Client Applications
            {"name": "portfolio-management", "type": "web_application", "criticality": "high", "compliance": ["SOX", "GDPR"], "team": "Portfolio Management Team", "cluster": "prod-portfolio-cluster"},
            {"name": "client-portal", "type": "web_application", "criticality": "high", "compliance": ["PCI_DSS", "GDPR", "SOX"], "team": "Client Experience Team", "cluster": "prod-portfolio-cluster"},
            {"name": "performance-analytics", "type": "analytical_platform", "criticality": "medium", "compliance": ["SOX"], "team": "Investment Analytics", "cluster": "prod-portfolio-cluster"},
            
            # Operational Applications
            {"name": "operational-dashboard", "type": "monitoring_platform", "criticality": "high", "compliance": ["SOX"], "team": "Platform Operations", "cluster": "staging-apps-cluster"},
            {"name": "audit-trail-system", "type": "security_platform", "criticality": "critical", "compliance": ["SOX", "GDPR", "FINRA"], "team": "Security Team", "cluster": "staging-apps-cluster"},
            {"name": "backup-orchestrator", "type": "infrastructure_service", "criticality": "high", "compliance": ["SOX"], "team": "Platform Operations", "cluster": "staging-apps-cluster"}
        ]
        
        # External SaaS Dependencies with monitoring capabilities
        self.external_saas_services = [
            # Financial Market Data Providers
            {"name": "bloomberg-terminal-api", "type": "market_data", "provider": "Bloomberg", "endpoint": "api.bloomberg.com", "sla": "99.95%", "cost_monthly": 24000, "criticality": "critical", "compliance": ["SOX"], "monitoring_metrics": ["latency", "availability", "data_freshness", "connection_count"]},
            {"name": "refinitiv-eikon-api", "type": "market_data", "provider": "Refinitiv", "endpoint": "api.refinitiv.com", "sla": "99.9%", "cost_monthly": 18000, "criticality": "high", "compliance": ["SOX"], "monitoring_metrics": ["latency", "availability", "data_quality", "feed_lag"]},
            {"name": "ice-data-services", "type": "market_data", "provider": "ICE", "endpoint": "api.ice.com", "sla": "99.8%", "cost_monthly": 12000, "criticality": "medium", "compliance": ["SOX"], "monitoring_metrics": ["latency", "availability", "data_accuracy"]},
            
            # Payment & Settlement Systems
            {"name": "dtcc-settlement-api", "type": "settlement", "provider": "DTCC", "endpoint": "api.dtcc.com", "sla": "99.99%", "cost_monthly": 35000, "criticality": "critical", "compliance": ["SOX", "FINRA"], "monitoring_metrics": ["latency", "availability", "transaction_success_rate", "settlement_time"]},
            {"name": "fedwire-interface", "type": "payment_rail", "provider": "Federal Reserve", "endpoint": "fedwire.frb.gov", "sla": "99.99%", "cost_monthly": 8000, "criticality": "critical", "compliance": ["SOX", "Fed Regulations"], "monitoring_metrics": ["latency", "availability", "transaction_volume", "error_rate"]},
            {"name": "swift-network", "type": "messaging", "provider": "SWIFT", "endpoint": "api.swift.com", "sla": "99.95%", "cost_monthly": 15000, "criticality": "critical", "compliance": ["SOX", "ISO 20022"], "monitoring_metrics": ["latency", "availability", "message_integrity", "delivery_time"]},
            
            # Cloud Infrastructure Services
            {"name": "aws-cloudwatch", "type": "monitoring", "provider": "AWS", "endpoint": "monitoring.us-east-1.amazonaws.com", "sla": "99.99%", "cost_monthly": 3500, "criticality": "high", "compliance": ["SOC 2"], "monitoring_metrics": ["api_latency", "data_retention", "alert_delivery", "dashboard_load_time"]},
            {"name": "aws-secretsmanager", "type": "secrets_management", "provider": "AWS", "endpoint": "secretsmanager.us-east-1.amazonaws.com", "sla": "99.99%", "cost_monthly": 800, "criticality": "critical", "compliance": ["SOC 2", "FedRAMP"], "monitoring_metrics": ["secret_retrieval_time", "rotation_success", "access_latency"]},
            {"name": "aws-iam", "type": "identity_management", "provider": "AWS", "endpoint": "iam.amazonaws.com", "sla": "99.99%", "cost_monthly": 500, "criticality": "critical", "compliance": ["SOC 2", "ISO 27001"], "monitoring_metrics": ["authentication_latency", "policy_evaluation_time", "token_validation_time"]},
            
            # Security & Compliance SaaS
            {"name": "splunk-enterprise", "type": "security_monitoring", "provider": "Splunk", "endpoint": "api.splunk.com", "sla": "99.9%", "cost_monthly": 25000, "criticality": "high", "compliance": ["SOX", "PCI_DSS"], "monitoring_metrics": ["log_ingestion_rate", "search_latency", "alert_accuracy", "data_retention"]},
            {"name": "okta-identity", "type": "identity_provider", "provider": "Okta", "endpoint": "api.okta.com", "sla": "99.99%", "cost_monthly": 12000, "criticality": "critical", "compliance": ["SOC 2", "ISO 27001"], "monitoring_metrics": ["sso_latency", "mfa_success_rate", "user_provisioning_time", "directory_sync_lag"]},
            {"name": "crowdstrike-falcon", "type": "endpoint_security", "provider": "CrowdStrike", "endpoint": "api.crowdstrike.com", "sla": "99.9%", "cost_monthly": 8000, "criticality": "high", "compliance": ["SOC 2"], "monitoring_metrics": ["threat_detection_time", "false_positive_rate", "agent_connectivity", "policy_deployment_time"]},
            
            # Communication & Collaboration
            {"name": "slack-api", "type": "communication", "provider": "Slack", "endpoint": "api.slack.com", "sla": "99.99%", "cost_monthly": 2000, "criticality": "medium", "compliance": ["SOC 2"], "monitoring_metrics": ["message_delivery_time", "webhook_latency", "channel_load_time", "file_upload_speed"]},
            {"name": "sendgrid-email", "type": "email_service", "provider": "SendGrid", "endpoint": "api.sendgrid.com", "sla": "99.9%", "cost_monthly": 1500, "criticality": "medium", "compliance": ["SOC 2", "GDPR"], "monitoring_metrics": ["email_delivery_time", "deliverability_rate", "bounce_rate", "api_response_time"]},
            {"name": "zoom-video-api", "type": "video_conferencing", "provider": "Zoom", "endpoint": "api.zoom.us", "sla": "99.99%", "cost_monthly": 3000, "criticality": "low", "compliance": ["SOC 2"], "monitoring_metrics": ["meeting_join_time", "video_quality", "audio_quality", "connection_stability"]},
            
            # Data & Analytics SaaS
            {"name": "snowflake-datawarehouse", "type": "data_warehouse", "provider": "Snowflake", "endpoint": "api.snowflake.com", "sla": "99.9%", "cost_monthly": 45000, "criticality": "high", "compliance": ["SOC 2", "ISO 27001"], "monitoring_metrics": ["query_latency", "data_freshness", "warehouse_uptime", "credit_consumption"]},
            {"name": "tableau-server", "type": "business_intelligence", "provider": "Tableau", "endpoint": "api.tableau.com", "sla": "99.9%", "cost_monthly": 15000, "criticality": "medium", "compliance": ["SOC 2"], "monitoring_metrics": ["dashboard_load_time", "data_refresh_time", "user_session_time", "extract_generation_time"]},
            {"name": "datadog-apm", "type": "application_monitoring", "provider": "Datadog", "endpoint": "api.datadoghq.com", "sla": "99.95%", "cost_monthly": 8000, "criticality": "high", "compliance": ["SOC 2"], "monitoring_metrics": ["metric_ingestion_lag", "dashboard_responsiveness", "alert_delivery_time", "trace_completeness"]},
            
            # Development & DevOps SaaS
            {"name": "github-enterprise", "type": "source_control", "provider": "GitHub", "endpoint": "api.github.com", "sla": "99.95%", "cost_monthly": 5000, "criticality": "high", "compliance": ["SOC 2"], "monitoring_metrics": ["git_operation_time", "webhook_delivery", "api_rate_limits", "actions_queue_time"]},
            {"name": "jenkins-cloud", "type": "ci_cd", "provider": "CloudBees", "endpoint": "api.cloudbees.com", "sla": "99.9%", "cost_monthly": 4000, "criticality": "medium", "compliance": ["SOC 2"], "monitoring_metrics": ["build_queue_time", "deployment_success_rate", "pipeline_duration", "artifact_upload_time"]},
            {"name": "sonarqube-cloud", "type": "code_quality", "provider": "SonarSource", "endpoint": "api.sonarcloud.io", "sla": "99.5%", "cost_monthly": 2000, "criticality": "low", "compliance": ["SOC 2"], "monitoring_metrics": ["scan_duration", "quality_gate_time", "coverage_analysis_time"]}
        ]

    def clear_existing_data(self):
        """Clear existing infrastructure data"""
        with self.driver.session() as session:
            logger.info("Clearing existing infrastructure data...")
            session.run("MATCH (n) DETACH DELETE n")
            logger.info("✅ Existing data cleared")

    def create_constraints_and_indexes(self):
        """Create database constraints and indexes"""
        with self.driver.session() as session:
            logger.info("Creating constraints and indexes...")
            
            constraints = [
                "CREATE CONSTRAINT service_name IF NOT EXISTS FOR (s:Service) REQUIRE s.name IS UNIQUE",
                "CREATE CONSTRAINT service_id IF NOT EXISTS FOR (s:Service) REQUIRE s.id IS UNIQUE",
                "CREATE CONSTRAINT resource_arn IF NOT EXISTS FOR (r:AWSResource) REQUIRE r.arn IS UNIQUE",
                "CREATE CONSTRAINT cluster_name IF NOT EXISTS FOR (c:EKSCluster) REQUIRE c.name IS UNIQUE",
                "CREATE CONSTRAINT db_identifier IF NOT EXISTS FOR (d:RDSInstance) REQUIRE d.identifier IS UNIQUE",
                "CREATE CONSTRAINT ec2_instance_id IF NOT EXISTS FOR (e:EC2Instance) REQUIRE e.instance_id IS UNIQUE",
                "CREATE CONSTRAINT app_name IF NOT EXISTS FOR (a:Application) REQUIRE a.name IS UNIQUE",
                "CREATE CONSTRAINT vpc_id IF NOT EXISTS FOR (v:VPC) REQUIRE v.vpc_id IS UNIQUE",
                "CREATE CONSTRAINT lb_arn IF NOT EXISTS FOR (lb:LoadBalancer) REQUIRE lb.arn IS UNIQUE",
                "CREATE CONSTRAINT ws_service_id IF NOT EXISTS FOR (ws:WebService) REQUIRE ws.service_id IS UNIQUE"
            ]
            
            indexes = [
                "CREATE INDEX service_status IF NOT EXISTS FOR (s:Service) ON (s.status)",
                "CREATE INDEX resource_region IF NOT EXISTS FOR (r:AWSResource) ON (r.region)",
                "CREATE INDEX resource_type IF NOT EXISTS FOR (r:AWSResource) ON (r.type)",
                "CREATE INDEX cluster_status IF NOT EXISTS FOR (c:EKSCluster) ON (c.status)",
                "CREATE INDEX db_status IF NOT EXISTS FOR (d:RDSInstance) ON (d.status)",
                "CREATE INDEX app_environment IF NOT EXISTS FOR (a:Application) ON (a.environment)",
                "CREATE INDEX lb_state IF NOT EXISTS FOR (lb:LoadBalancer) ON (lb.state)",
                "CREATE INDEX ws_status IF NOT EXISTS FOR (ws:WebService) ON (ws.status)"
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
            
            logger.info("✅ Constraints and indexes created")

    def generate_vpcs(self, count: int = 4) -> List[Dict[str, Any]]:
        """Generate VPC infrastructure"""
        vpcs = []
        vpc_names = ["prod-main", "prod-secondary", "staging", "dev"]
        
        for i in range(min(count, len(vpc_names))):
            region = random.choice(list(self.regions.keys()))
            vpc = {
                "vpc_id": f"vpc-{random.randint(10000000, 99999999):08x}",
                "name": vpc_names[i],
                "cidr_block": f"10.{i}.0.0/16",
                "region": region,
                "availability_zones": self.regions[region][:random.randint(2, 4)],
                "environment": "production" if "prod" in vpc_names[i] else vpc_names[i],
                "created_at": (datetime.utcnow() - timedelta(days=random.randint(30, 365))).isoformat()
            }
            vpcs.append(vpc)
            
        return vpcs

    def generate_eks_clusters(self, vpcs: List[Dict], count: int = 6) -> List[Dict[str, Any]]:
        """Generate EKS clusters with realistic configuration"""
        clusters = []
        cluster_names = [
            "prod-trading-cluster", "prod-risk-cluster", "prod-portfolio-cluster", 
            "staging-apps-cluster", "dev-microservices-cluster", "prod-compliance-cluster"
        ]
        
        for i in range(min(count, len(cluster_names))):
            vpc = random.choice([v for v in vpcs if v["environment"] in ["production", "staging", "dev"]])
            node_groups = random.randint(2, 5)
            total_nodes = sum(random.randint(8, 25) for _ in range(node_groups))
            
            # Calculate realistic costs
            avg_cost_per_node = random.randint(120, 280)  # Monthly cost per node
            monthly_cost = total_nodes * avg_cost_per_node
            
            cluster = {
                "name": cluster_names[i],
                "arn": f"arn:aws:eks:{vpc['region']}:123456789012:cluster/{cluster_names[i]}",
                "region": vpc["region"],
                "vpc_id": vpc["vpc_id"],
                "version": random.choice(["1.27", "1.28", "1.29"]),
                "status": random.choices(["ACTIVE", "CREATING", "UPDATING"], weights=[85, 10, 5])[0],
                "endpoint": f"https://{uuid.uuid4().hex[:8].upper()}.gr7.{vpc['region']}.eks.amazonaws.com",
                "created_at": (datetime.utcnow() - timedelta(days=random.randint(60, 400))).isoformat(),
                "node_groups": node_groups,
                "total_nodes": total_nodes,
                "instance_types": random.sample(self.instance_types["eks_nodes"], random.randint(2, 4)),
                "cost_monthly": monthly_cost,
                "environment": vpc["environment"],
                "subnet_ids": [f"subnet-{random.randint(10000, 99999):05x}" for _ in range(random.randint(2, 4))],
                "security_groups": [f"sg-{random.randint(10000000, 99999999):08x}" for _ in range(random.randint(1, 3))]
            }
            clusters.append(cluster)
            
        return clusters

    def generate_rds_instances(self, vpcs: List[Dict], count: int = 8) -> List[Dict[str, Any]]:
        """Generate RDS database instances"""
        instances = []
        
        # PostgreSQL instances
        pg_instances = [
            {"name": "trading-primary-postgres", "engine": "postgres", "version": "15.4", "multi_az": True, "storage": 2000},
            {"name": "trading-replica-postgres", "engine": "postgres", "version": "15.4", "multi_az": False, "storage": 2000},
            {"name": "risk-analytics-postgres", "engine": "postgres", "version": "15.4", "multi_az": True, "storage": 1000},
            {"name": "portfolio-data-postgres", "engine": "postgres", "version": "14.9", "multi_az": False, "storage": 500},
            {"name": "staging-shared-postgres", "engine": "postgres", "version": "15.4", "multi_az": False, "storage": 200}
        ]
        
        # Oracle instances
        oracle_instances = [
            {"name": "legacy-financial-oracle", "engine": "oracle-ee", "version": "19.0.0.0.ru-2023-07.rur-2023-07.r1", "multi_az": True, "storage": 5000},
            {"name": "compliance-reporting-oracle", "engine": "oracle-ee", "version": "19.0.0.0.ru-2023-07.rur-2023-07.r1", "multi_az": False, "storage": 2000}
        ]
        
        all_templates = pg_instances + oracle_instances
        
        for i, template in enumerate(all_templates[:count]):
            vpc = random.choice([v for v in vpcs if v["environment"] == ("production" if "prod" in template["name"] or "legacy" in template["name"] else v["environment"])])
            
            # Determine instance class based on workload
            if "legacy" in template["name"] or "primary" in template["name"]:
                instance_class = random.choice(["db.r6g.2xlarge", "db.r6g.4xlarge", "db.r5.2xlarge", "db.r5.4xlarge"])
            elif "replica" in template["name"] or "analytics" in template["name"]:
                instance_class = random.choice(["db.r6g.xlarge", "db.r6g.2xlarge", "db.r5.xlarge", "db.r5.2xlarge"])
            else:
                instance_class = random.choice(["db.t3.large", "db.t3.xlarge", "db.r6g.large", "db.r5.large"])
            
            # Calculate realistic costs
            storage_cost = template["storage"] * 0.115  # $0.115 per GB per month for gp3
            if template["engine"] == "oracle-ee":
                compute_cost = random.randint(3000, 8000)  # Oracle licensing is expensive
                license_cost = random.randint(2000, 5000)
            else:
                compute_cost = random.randint(200, 2000)
                license_cost = 0
            
            monthly_cost = compute_cost + storage_cost + license_cost
            
            instance = {
                "identifier": template["name"],
                "arn": f"arn:aws:rds:{vpc['region']}:123456789012:db:{template['name']}",
                "engine": template["engine"],
                "engine_version": template["version"],
                "instance_class": instance_class,
                "status": random.choices(["available", "backing-up", "modifying"], weights=[90, 7, 3])[0],
                "region": vpc["region"],
                "vpc_id": vpc["vpc_id"],
                "allocated_storage": template["storage"],
                "storage_type": random.choice(["gp3", "gp2", "io1"]),
                "multi_az": template["multi_az"],
                "backup_retention": random.choice([7, 14, 30]) if template["multi_az"] else random.choice([0, 7]),
                "cost_monthly": round(monthly_cost, 2),
                "environment": vpc["environment"],
                "subnet_group": f"{template['name'].split('-')[0]}-db-subnet-group",
                "parameter_group": f"{template['engine']}-custom-{random.randint(1, 3)}",
                "created_at": (datetime.utcnow() - timedelta(days=random.randint(90, 500))).isoformat()
            }
            
            if template["engine"] == "oracle-ee":
                instance["license_model"] = "bring-your-own-license"
                instance["iops"] = random.randint(5000, 20000)
            
            instances.append(instance)
            
        return instances

    def generate_ec2_sql_server_instances(self, vpcs: List[Dict], count: int = 4) -> List[Dict[str, Any]]:
        """Generate EC2 instances running SQL Server"""
        instances = []
        
        sql_server_templates = [
            {"name": "reporting-sqlserver-01", "edition": "Enterprise", "version": "2019", "license": "dedicated_host"},
            {"name": "analytics-sqlserver-01", "edition": "Standard", "version": "2019", "license": "license_included"},
            {"name": "legacy-sqlserver-01", "edition": "Standard", "version": "2017", "license": "dedicated_host"},
            {"name": "dev-sqlserver-01", "edition": "Express", "version": "2019", "license": "license_included"}
        ]
        
        for i, template in enumerate(sql_server_templates[:count]):
            vpc = random.choice([v for v in vpcs if v["environment"] == ("production" if "prod" in template["name"] or i < 3 else "dev")])
            
            # Instance sizing based on edition
            if template["edition"] == "Enterprise":
                instance_type = random.choice(["m5.2xlarge", "m5.4xlarge", "r5.2xlarge"])
                storage_gb = random.randint(800, 2000)
                license_cost = random.randint(1500, 3000)
            elif template["edition"] == "Standard":
                instance_type = random.choice(["m5.large", "m5.xlarge", "m5.2xlarge"])
                storage_gb = random.randint(300, 1000)
                license_cost = random.randint(400, 1200) if template["license"] == "dedicated_host" else 0
            else:  # Express
                instance_type = random.choice(["t3.medium", "t3.large", "t3.xlarge"])
                storage_gb = random.randint(100, 300)
                license_cost = 0
            
            # Calculate costs
            compute_cost = {"t3.medium": 40, "t3.large": 80, "t3.xlarge": 160, "m5.large": 90, "m5.xlarge": 180, "m5.2xlarge": 360, "m5.4xlarge": 720, "r5.2xlarge": 500}[instance_type]
            storage_cost = storage_gb * 0.10  # $0.10 per GB per month
            monthly_cost = compute_cost + storage_cost + license_cost
            
            instance = {
                "instance_id": f"i-{random.randint(0, 2**64):016x}",
                "name": template["name"],
                "instance_type": instance_type,
                "region": vpc["region"],
                "vpc_id": vpc["vpc_id"],
                "availability_zone": random.choice(vpc["availability_zones"]),
                "status": random.choices(["running", "stopped", "pending"], weights=[85, 10, 5])[0],
                "private_ip": f"10.{random.randint(0, 255)}.{random.randint(1, 254)}.{random.randint(10, 250)}",
                "subnet_id": f"subnet-{random.randint(10000, 99999):05x}",
                "security_groups": [f"sg-sqlserver-{random.choice(['prod', 'staging', 'dev'])}"],
                "sqlserver_edition": template["edition"],
                "sqlserver_version": template["version"],
                "license_type": template["license"],
                "cost_monthly": round(monthly_cost, 2),
                "cpu_utilization": random.uniform(15, 80),
                "memory_utilization": random.uniform(25, 85),
                "storage_gb": storage_gb,
                "environment": vpc["environment"],
                "created_at": (datetime.utcnow() - timedelta(days=random.randint(120, 600))).isoformat()
            }
            instances.append(instance)
            
        return instances

    def generate_load_balancers(self, vpcs: List[Dict], count: int = 8) -> List[Dict[str, Any]]:
        """Generate AWS Application Load Balancers"""
        load_balancers = []
        
        lb_templates = [
            {"name": "trading-alb", "scheme": "internet-facing", "type": "application"},
            {"name": "risk-mgmt-alb", "scheme": "internet-facing", "type": "application"},
            {"name": "portfolio-alb", "scheme": "internet-facing", "type": "application"},
            {"name": "api-gateway-alb", "scheme": "internet-facing", "type": "application"},
            {"name": "internal-services-alb", "scheme": "internal", "type": "application"},
            {"name": "analytics-nlb", "scheme": "internal", "type": "network"},
            {"name": "legacy-elb", "scheme": "internet-facing", "type": "classic"},
            {"name": "monitoring-alb", "scheme": "internal", "type": "application"}
        ]
        
        for i, template in enumerate(lb_templates[:count]):
            vpc = random.choice([v for v in vpcs if v["environment"] == ("production" if "prod" in template["name"] or i < 5 else "dev")])
            
            # Calculate costs based on load balancer type
            if template["type"] == "application":
                hourly_cost = 0.0225  # $0.0225 per ALB hour
                lcu_cost = 0.008  # $0.008 per LCU hour
                lcus = random.randint(10, 100)
                monthly_cost = (hourly_cost + (lcu_cost * lcus)) * 24 * 30
            elif template["type"] == "network":
                hourly_cost = 0.0225  # Same as ALB
                nlcu_cost = 0.006  # $0.006 per NLCU hour
                nlcus = random.randint(5, 50)
                monthly_cost = (hourly_cost + (nlcu_cost * nlcus)) * 24 * 30
            else:  # classic
                hourly_cost = 0.025  # $0.025 per ELB hour
                data_cost = random.uniform(5, 25)  # Data processing costs
                monthly_cost = (hourly_cost * 24 * 30) + data_cost
            
            load_balancer = {
                "arn": f"arn:aws:elasticloadbalancing:{vpc['region']}:123456789012:loadbalancer/app/{template['name']}/{random.randint(10000000000, 99999999999)}",
                "name": template["name"],
                "dns_name": f"{template['name']}-{random.randint(1000000, 9999999)}.{vpc['region']}.elb.amazonaws.com",
                "type": template["type"],
                "scheme": template["scheme"],
                "region": vpc["region"],
                "vpc_id": vpc["vpc_id"],
                "availability_zones": random.sample(vpc["availability_zones"], min(2, len(vpc["availability_zones"]))),
                "subnets": [f"subnet-{random.randint(10000, 99999):05x}" for _ in range(2)],
                "security_groups": [f"sg-{template['name']}-lb"],
                "state": random.choices(["active", "provisioning", "failed"], weights=[90, 8, 2])[0],
                "ip_address_type": random.choice(["ipv4", "dualstack"]),
                "listeners_json": json.dumps([
                    {
                        "port": 443,
                        "protocol": "HTTPS",
                        "ssl_policy": "ELBSecurityPolicy-TLS-1-2-2017-01"
                    },
                    {
                        "port": 80,
                        "protocol": "HTTP"
                    }
                ]),
                "target_groups": random.randint(2, 5),
                "targets_healthy": random.randint(2, 8),
                "targets_total": random.randint(4, 10),
                "request_count": random.randint(10000, 500000),
                "cost_monthly": round(monthly_cost, 2),
                "environment": vpc["environment"],
                "tier": "loadbalancer",
                "created_at": (datetime.utcnow() - timedelta(days=random.randint(30, 365))).isoformat()
            }
            load_balancers.append(load_balancer)
            
        return load_balancers

    def generate_web_services(self, vpcs: List[Dict], count: int = 12) -> List[Dict[str, Any]]:
        """Generate Web Services and Frontend applications"""
        web_services = []
        
        web_service_templates = [
            {"name": "trading-frontend", "technology": "React", "framework": "Next.js", "port": 3000},
            {"name": "portfolio-dashboard", "technology": "Angular", "framework": "Angular 15", "port": 4200},
            {"name": "risk-analytics-ui", "technology": "Vue.js", "framework": "Nuxt 3", "port": 3000},
            {"name": "admin-portal", "technology": "React", "framework": "Create React App", "port": 3001},
            {"name": "api-documentation", "technology": "Node.js", "framework": "Swagger UI", "port": 8080},
            {"name": "monitoring-dashboard", "technology": "React", "framework": "Grafana Custom", "port": 3002},
            {"name": "user-onboarding", "technology": "Vue.js", "framework": "Vue 3", "port": 8081},
            {"name": "compliance-reports", "technology": "Angular", "framework": "Angular Material", "port": 4201},
            {"name": "mobile-api-gateway", "technology": "Node.js", "framework": "Express.js", "port": 3003},
            {"name": "legacy-web-interface", "technology": "jQuery", "framework": "Bootstrap 4", "port": 8082},
            {"name": "real-time-notifications", "technology": "React", "framework": "Socket.io + React", "port": 3004},
            {"name": "data-visualization", "technology": "D3.js", "framework": "Observable", "port": 3005}
        ]
        
        for i, template in enumerate(web_service_templates[:count]):
            vpc = random.choice([v for v in vpcs if v["environment"] == ("production" if i < 8 else "dev")])
            
            # Calculate costs based on service type and technology
            if template["technology"] in ["React", "Angular", "Vue.js"]:
                # Frontend apps - typically served via CDN + small compute
                compute_cost = random.uniform(50, 200)  # Smaller compute for SPAs
                cdn_cost = random.uniform(20, 100)
                monthly_cost = compute_cost + cdn_cost
            elif template["technology"] == "Node.js":
                # Backend services - more compute intensive
                compute_cost = random.uniform(150, 500)
                monthly_cost = compute_cost
            else:
                # Legacy or specialized services
                compute_cost = random.uniform(80, 300)
                monthly_cost = compute_cost
            
            web_service = {
                "service_id": f"ws-{random.randint(100000, 999999)}",
                "name": template["name"],
                "technology": template["technology"],
                "framework": template["framework"],
                "port": template["port"],
                "region": vpc["region"],
                "vpc_id": vpc["vpc_id"],
                "availability_zones": random.sample(vpc["availability_zones"], min(2, len(vpc["availability_zones"]))),
                "deployment_type": random.choice(["ECS", "EKS", "EC2", "Lambda"]),
                "container_image": f"{template['name']}:latest",
                "instance_count": random.randint(2, 8),
                "cpu_cores": random.uniform(0.5, 4.0),
                "memory_gb": random.randint(1, 8),
                "storage_gb": random.randint(10, 100),
                "auto_scaling_json": json.dumps({
                    "enabled": random.choice([True, False]),
                    "min_instances": random.randint(1, 3),
                    "max_instances": random.randint(5, 15),
                    "target_cpu": random.randint(60, 80)
                }),
                "health_check_json": json.dumps({
                    "path": "/health",
                    "interval": 30,
                    "timeout": 5,
                    "healthy_threshold": 2,
                    "unhealthy_threshold": 3
                }),
                "ssl_certificate": f"arn:aws:acm:{vpc['region']}:123456789012:certificate/{random.randint(10000000, 99999999)}",
                "domain": f"{template['name']}.{random.choice(['internal', 'api', 'app'])}.capitalgroupcorp.com",
                "status": random.choices(["running", "stopped", "updating", "failed"], weights=[80, 10, 8, 2])[0],
                "cpu_utilization": random.uniform(10, 85),
                "memory_utilization": random.uniform(20, 90),
                "request_count": random.randint(1000, 100000),
                "error_rate": random.uniform(0.1, 5.0),
                "response_time_ms": random.uniform(50, 500),
                "cost_monthly": round(monthly_cost, 2),
                "environment": vpc["environment"],
                "tier": "web",
                "created_at": (datetime.utcnow() - timedelta(days=random.randint(30, 180))).isoformat()
            }
            web_services.append(web_service)
            
        return web_services

    def generate_services(self, clusters: List[Dict], count: int = 22) -> List[Dict[str, Any]]:
        """Generate microservices and applications with proper cluster assignments"""
        services = []
        
        for i, template in enumerate(self.service_templates[:count]):
            # Find the specific cluster for this service
            target_cluster = next((c for c in clusters if c["name"] == template["cluster"]), None)
            if not target_cluster:
                target_cluster = random.choice([c for c in clusters if c["status"] == "ACTIVE"])
            
            min_replicas, max_replicas = template["replicas"]
            min_cpu, max_cpu = template["cpu"]
            min_memory, max_memory = template["memory"]
            
            # Generate realistic metrics based on criticality
            if template["criticality"] == "critical":
                cpu_usage = random.uniform(60, 95)
                memory_usage = random.uniform(65, 90)
                latency = random.uniform(5, 25)
            elif template["criticality"] == "high":
                cpu_usage = random.uniform(40, 80)
                memory_usage = random.uniform(45, 75)
                latency = random.uniform(8, 35)
            else:
                cpu_usage = random.uniform(20, 60)
                memory_usage = random.uniform(25, 60)
                latency = random.uniform(10, 50)
            
            service = {
                "id": f"{template['name']}-v{random.randint(1, 5)}.{random.randint(0, 9)}.{random.randint(0, 9)}",
                "name": template["name"],
                "type": template["type"],
                "environment": target_cluster["environment"],
                "status": random.choices(["healthy", "warning", "critical"], weights=[75, 20, 5])[0],
                "version": f"{random.randint(1, 5)}.{random.randint(0, 9)}.{random.randint(0, 9)}",
                "port": template["port"],
                "protocol": random.choice(["HTTP/2", "HTTPS", "gRPC", "WebSocket"]),
                "health_endpoint": random.choice(["/health", "/status", "/ping", "/api/health"]),
                "replicas": random.randint(min_replicas, max_replicas),
                "cpu_request": min_cpu,
                "cpu_limit": max_cpu,
                "memory_request": min_memory,
                "memory_limit": max_memory,
                "cpu_usage": round(cpu_usage, 1),
                "memory_usage": round(memory_usage, 1),
                "latency": round(latency, 1),
                "cluster_name": template["cluster"],
                "namespace": template["cluster"].split("-")[1] if "-" in template["cluster"] else "default",
                "criticality": template["criticality"],
                "created_at": (datetime.utcnow() - timedelta(days=random.randint(30, 200))).isoformat(),
                "dependencies": []  # Will be populated in relationships
            }
            services.append(service)
            
        return services
    
    def generate_external_saas_services(self) -> List[Dict[str, Any]]:
        """Generate external SaaS service dependencies with monitoring data"""
        external_services = []
        
        for template in self.external_saas_services:
            # Generate realistic SLA performance
            sla_target = float(template["sla"].rstrip("%")) / 100
            actual_availability = random.uniform(sla_target - 0.002, min(sla_target + 0.001, 0.9999))
            
            # Generate monitoring metrics
            monitoring_data = {}
            for metric in template["monitoring_metrics"]:
                if metric == "latency":
                    monitoring_data[metric] = round(random.uniform(10, 200), 2)
                elif metric == "availability":
                    monitoring_data[metric] = round(actual_availability * 100, 3)
                elif metric == "error_rate":
                    monitoring_data[metric] = round(random.uniform(0.001, 0.05), 4)
                elif "time" in metric:
                    monitoring_data[metric] = round(random.uniform(50, 500), 2)
                elif "rate" in metric:
                    monitoring_data[metric] = round(random.uniform(0.95, 0.999), 4)
                else:
                    monitoring_data[metric] = round(random.uniform(0.8, 1.0), 3)
            
            external_service = {
                "id": f"external-{template['name']}-{uuid.uuid4().hex[:8]}",
                "name": template["name"],
                "type": template["type"],
                "provider": template["provider"],
                "endpoint": template["endpoint"],
                "status": "external_healthy" if actual_availability > sla_target - 0.001 else "external_degraded",
                "sla_target": template["sla"],
                "actual_availability": round(actual_availability * 100, 3),
                "cost_monthly": template["cost_monthly"],
                "criticality": template["criticality"],
                "compliance": template["compliance"],
                "monitoring_metrics_json": json.dumps(monitoring_data),
                "last_health_check": datetime.utcnow().isoformat(),
                "response_time_p95": round(random.uniform(20, 300), 2),
                "dependency_risk_score": round(random.uniform(0.1, 0.8), 2),
                "data_sovereignty": random.choice(["US", "EU", "Global"]),
                "security_grade": random.choice(["A+", "A", "A-", "B+", "B"]),
                "created_at": (datetime.utcnow() - timedelta(days=random.randint(180, 1000))).isoformat()
            }
            external_services.append(external_service)
            
        return external_services

    def generate_applications(self, count: int = 6) -> List[Dict[str, Any]]:
        """Generate business applications"""
        applications = []
        
        for i, template in enumerate(self.application_templates[:count]):
            app = {
                "name": template["name"],
                "type": template["type"],
                "environment": random.choices(["production", "staging", "development"], weights=[70, 20, 10])[0],
                "status": random.choices(["active", "maintenance", "deprecated"], weights=[85, 10, 5])[0],
                "version": f"{random.randint(1, 10)}.{random.randint(0, 20)}.{random.randint(0, 50)}",
                "business_criticality": template["criticality"],
                "compliance_requirements": template["compliance"],
                "team_owner": template["team"],
                "cost_center": f"{template['name'][:2].upper()}-{random.randint(100, 999)}",
                "users": random.randint(50, 5000),
                "transactions_per_day": random.randint(10000, 1000000),
                "created_at": (datetime.utcnow() - timedelta(days=random.randint(200, 1000))).isoformat()
            }
            applications.append(app)
            
        return applications

    def create_infrastructure_nodes(self):
        """Create all infrastructure nodes in Neo4j"""
        logger.info("Generating AWS infrastructure topology...")
        
        # Generate all infrastructure components
        vpcs = self.generate_vpcs(4)
        clusters = self.generate_eks_clusters(vpcs, 6)
        rds_instances = self.generate_rds_instances(vpcs, 8)
        ec2_instances = self.generate_ec2_sql_server_instances(vpcs, 4)
        load_balancers = self.generate_load_balancers(vpcs, 8)
        web_services = self.generate_web_services(vpcs, 12)
        services = self.generate_services(clusters, 22)  # Increased to cover all service templates
        applications = self.generate_applications(12)  # Increased to cover all application templates
        external_services = self.generate_external_saas_services()
        
        with self.driver.session() as session:
            # Create VPCs
            for vpc in vpcs:
                session.run("""
                CREATE (v:VPC:AWSResource {
                    vpc_id: $vpc_id, name: $name, cidr_block: $cidr_block,
                    region: $region, environment: $environment, type: 'VPC',
                    availability_zones: $availability_zones, created_at: $created_at
                })
                """, **vpc)
            
            # Create EKS Clusters
            for cluster in clusters:
                session.run("""
                CREATE (c:EKSCluster:AWSResource {
                    name: $name, arn: $arn, region: $region, vpc_id: $vpc_id,
                    version: $version, status: $status, endpoint: $endpoint,
                    created_at: $created_at, node_groups: $node_groups,
                    total_nodes: $total_nodes, instance_types: $instance_types,
                    cost_monthly: $cost_monthly, environment: $environment,
                    subnet_ids: $subnet_ids, security_groups: $security_groups,
                    type: 'EKS'
                })
                """, **cluster)
            
            # Create RDS Instances
            for instance in rds_instances:
                session.run("""
                CREATE (r:RDSInstance:AWSResource {
                    identifier: $identifier, arn: $arn, engine: $engine,
                    engine_version: $engine_version, instance_class: $instance_class,
                    status: $status, region: $region, vpc_id: $vpc_id,
                    allocated_storage: $allocated_storage, storage_type: $storage_type,
                    multi_az: $multi_az, backup_retention: $backup_retention,
                    cost_monthly: $cost_monthly, environment: $environment,
                    subnet_group: $subnet_group, parameter_group: $parameter_group,
                    created_at: $created_at, type: 'RDS',
                    license_model: $license_model, iops: $iops
                })
                """, {**instance, 'license_model': instance.get('license_model'), 'iops': instance.get('iops')})
            
            # Create EC2 SQL Server Instances
            for instance in ec2_instances:
                session.run("""
                CREATE (e:EC2Instance:AWSResource {
                    instance_id: $instance_id, name: $name, instance_type: $instance_type,
                    region: $region, vpc_id: $vpc_id, availability_zone: $availability_zone,
                    status: $status, private_ip: $private_ip, subnet_id: $subnet_id,
                    security_groups: $security_groups, sqlserver_edition: $sqlserver_edition,
                    sqlserver_version: $sqlserver_version, license_type: $license_type,
                    cost_monthly: $cost_monthly, cpu_utilization: $cpu_utilization,
                    memory_utilization: $memory_utilization, storage_gb: $storage_gb,
                    environment: $environment, created_at: $created_at, type: 'EC2'
                })
                """, **instance)
            
            # Create Load Balancers
            for lb in load_balancers:
                session.run("""
                CREATE (lb:LoadBalancer:AWSResource {
                    arn: $arn, name: $name, dns_name: $dns_name, type: $type,
                    scheme: $scheme, region: $region, vpc_id: $vpc_id,
                    availability_zones: $availability_zones, subnets: $subnets,
                    security_groups: $security_groups, state: $state,
                    ip_address_type: $ip_address_type, listeners_json: $listeners_json,
                    target_groups: $target_groups, targets_healthy: $targets_healthy,
                    targets_total: $targets_total, request_count: $request_count,
                    cost_monthly: $cost_monthly, environment: $environment,
                    tier: $tier, created_at: $created_at
                })
                """, **lb)
            
            # Create Web Services
            for ws in web_services:
                session.run("""
                CREATE (ws:WebService:AWSResource {
                    service_id: $service_id, name: $name, technology: $technology,
                    framework: $framework, port: $port, region: $region,
                    vpc_id: $vpc_id, availability_zones: $availability_zones,
                    deployment_type: $deployment_type, container_image: $container_image,
                    instance_count: $instance_count, cpu_cores: $cpu_cores,
                    memory_gb: $memory_gb, storage_gb: $storage_gb,
                    auto_scaling_json: $auto_scaling_json, health_check_json: $health_check_json,
                    ssl_certificate: $ssl_certificate, domain: $domain,
                    status: $status, cpu_utilization: $cpu_utilization,
                    memory_utilization: $memory_utilization, request_count: $request_count,
                    error_rate: $error_rate, response_time_ms: $response_time_ms,
                    cost_monthly: $cost_monthly, environment: $environment,
                    tier: $tier, created_at: $created_at
                })
                """, **ws)

            # Create Services
            for service in services:
                session.run("""
                CREATE (s:Service {
                    id: $id, name: $name, type: $type, environment: $environment,
                    status: $status, version: $version, port: $port,
                    protocol: $protocol, health_endpoint: $health_endpoint,
                    replicas: $replicas, cpu_request: $cpu_request,
                    cpu_limit: $cpu_limit, memory_request: $memory_request,
                    memory_limit: $memory_limit, cluster_name: $cluster_name,
                    namespace: $namespace, created_at: $created_at
                })
                """, **service)
            
            # Create Applications
            for app in applications:
                session.run("""
                CREATE (a:Application {
                    name: $name, type: $type, environment: $environment,
                    status: $status, version: $version, business_criticality: $business_criticality,
                    compliance_requirements: $compliance_requirements, team_owner: $team_owner,
                    cost_center: $cost_center, users: $users,
                    transactions_per_day: $transactions_per_day, created_at: $created_at
                })
                """, **app)
            
            # Create External SaaS Services
            for ext_service in external_services:
                session.run("""
                CREATE (e:ExternalService:SaaS {
                    id: $id, name: $name, type: $type, provider: $provider,
                    endpoint: $endpoint, status: $status, sla_target: $sla_target,
                    actual_availability: $actual_availability, cost_monthly: $cost_monthly,
                    criticality: $criticality, compliance: $compliance,
                    monitoring_metrics_json: $monitoring_metrics_json, last_health_check: $last_health_check,
                    response_time_p95: $response_time_p95, dependency_risk_score: $dependency_risk_score,
                    data_sovereignty: $data_sovereignty, security_grade: $security_grade,
                    created_at: $created_at
                })
                """, **ext_service)
            
        logger.info(f"✅ Created infrastructure nodes: {len(vpcs)} VPCs, {len(clusters)} EKS clusters, {len(rds_instances)} RDS instances, {len(ec2_instances)} EC2 instances, {len(load_balancers)} Load Balancers, {len(web_services)} Web Services, {len(services)} services, {len(applications)} applications, {len(external_services)} external SaaS services")

    def create_relationships(self):
        """Create relationships between infrastructure components"""
        logger.info("Creating infrastructure relationships...")
        
        with self.driver.session() as session:
            # VPC relationships
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
            
            session.run("""
            MATCH (v:VPC), (lb:LoadBalancer)
            WHERE lb.vpc_id = v.vpc_id
            CREATE (lb)-[:DEPLOYED_IN]->(v)
            """)
            
            session.run("""
            MATCH (v:VPC), (ws:WebService)
            WHERE ws.vpc_id = v.vpc_id
            CREATE (ws)-[:DEPLOYED_IN]->(v)
            """)
            
            # Service to cluster relationships
            session.run("""
            MATCH (s:Service), (c:EKSCluster)
            WHERE s.cluster_name = c.name
            CREATE (s)-[:DEPLOYED_ON]->(c)
            """)
            
            # Enhanced service dependencies with cluster-aware relationships
            dependencies = [
                # Trading cluster internal dependencies
                ("trading-api", "auth-service"),
                ("trading-api", "position-tracker"),
                ("order-execution-engine", "trading-api"),
                ("order-execution-engine", "position-tracker"),
                ("market-data-ingestion", "trading-api"),
                ("trading-gateway", "trading-api"),
                ("trading-gateway", "order-execution-engine"),
                ("position-tracker", "auth-service"),
                
                # Risk cluster internal dependencies
                ("risk-calculator", "auth-service"),
                ("stress-testing-engine", "risk-calculator"),
                ("var-calculator", "risk-calculator"),
                ("basel-compliance-api", "risk-calculator"),
                ("risk-reporting-service", "var-calculator"),
                ("risk-reporting-service", "basel-compliance-api"),
                
                # Portfolio cluster internal dependencies
                ("portfolio-api", "auth-service"),
                ("rebalancing-engine", "portfolio-api"),
                ("performance-attribution", "portfolio-api"),
                ("benchmark-comparison", "performance-attribution"),
                ("client-reporting-api", "portfolio-api"),
                ("client-reporting-api", "performance-attribution"),
                
                # Cross-cluster dependencies (minimal for isolation)
                ("portfolio-api", "trading-api"),  # Portfolio needs trading data
                ("risk-calculator", "trading-api"),  # Risk needs trading positions
                ("stress-testing-engine", "portfolio-api"),  # Stress testing needs portfolio data
                
                # Shared infrastructure dependencies
                ("notification-service", "auth-service"),
                ("audit-logging-service", "auth-service"),
                ("session-manager", "auth-service")
            ]
            
            for dependent, dependency in dependencies:
                session.run("""
                MATCH (s1:Service {name: $dependent}), (s2:Service {name: $dependency})
                MERGE (s1)-[:DEPENDS_ON]->(s2)
                """, dependent=dependent, dependency=dependency)
            
            # Service to database connections (enhanced)
            db_connections = [
                # Trading cluster databases
                ("trading-api", "trading-primary-postgres"),
                ("order-execution-engine", "trading-primary-postgres"),
                ("market-data-ingestion", "trading-primary-postgres"),
                ("position-tracker", "trading-primary-postgres"),
                
                # Risk cluster databases
                ("risk-calculator", "risk-analytics-postgres"),
                ("stress-testing-engine", "risk-analytics-postgres"),
                ("var-calculator", "risk-analytics-postgres"),
                ("basel-compliance-api", "compliance-reporting-oracle"),
                ("risk-reporting-service", "compliance-reporting-oracle"),
                
                # Portfolio cluster databases
                ("portfolio-api", "portfolio-data-postgres"),
                ("rebalancing-engine", "portfolio-data-postgres"),
                ("performance-attribution", "portfolio-data-postgres"),
                ("benchmark-comparison", "portfolio-data-postgres"),
                ("client-reporting-api", "portfolio-data-postgres"),
                
                # Shared services
                ("auth-service", "trading-primary-postgres"),
                ("notification-service", "trading-primary-postgres"),
                ("audit-logging-service", "legacy-financial-oracle"),  # Audit needs all historical data
                ("session-manager", "trading-primary-postgres")
            ]
            
            for service, db in db_connections:
                session.run("""
                MATCH (s:Service {name: $service}), (d:RDSInstance {identifier: $db})
                MERGE (s)-[:QUERIES]->(d)
                """, service=service, db=db)
            
            # External SaaS dependencies for applications and services
            external_dependencies = [
                # Market data dependencies
                ("market-data-ingestion", "bloomberg-terminal-api"),
                ("market-data-ingestion", "refinitiv-eikon-api"),
                ("market-data-ingestion", "ice-data-services"),
                ("trading-api", "bloomberg-terminal-api"),
                ("risk-calculator", "refinitiv-eikon-api"),
                
                # Settlement and payment dependencies
                ("order-execution-engine", "dtcc-settlement-api"),
                ("trading-api", "fedwire-interface"),
                ("risk-reporting-service", "swift-network"),
                
                # Infrastructure and monitoring dependencies
                ("trading-api", "aws-cloudwatch"),
                ("risk-calculator", "aws-cloudwatch"),
                ("portfolio-api", "aws-cloudwatch"),
                ("auth-service", "aws-iam"),
                ("auth-service", "aws-secretsmanager"),
                ("session-manager", "okta-identity"),
                ("audit-logging-service", "splunk-enterprise"),
                ("notification-service", "sendgrid-email"),
                ("notification-service", "slack-api"),
                
                # Analytics and reporting dependencies
                ("performance-attribution", "snowflake-datawarehouse"),
                ("benchmark-comparison", "snowflake-datawarehouse"),
                ("client-reporting-api", "tableau-server"),
                ("risk-reporting-service", "tableau-server"),
                
                # Security dependencies
                ("trading-api", "crowdstrike-falcon"),
                ("risk-calculator", "crowdstrike-falcon"),
                ("portfolio-api", "crowdstrike-falcon"),
                
                # Development dependencies
                ("test-automation-runner", "github-enterprise"),
                ("test-automation-runner", "jenkins-cloud"),
                ("dev-database-seeder", "sonarqube-cloud")
            ]
            
            for service, external in external_dependencies:
                session.run("""
                MATCH (s:Service {name: $service}), (e:ExternalService {name: $external})
                MERGE (s)-[:INTEGRATES_WITH]->(e)
                """, service=service, external=external)
            
            # Application to external SaaS relationships
            app_external_mappings = [
                ("trading-platform", ["bloomberg-terminal-api", "dtcc-settlement-api", "aws-cloudwatch", "splunk-enterprise"]),
                ("order-management-system", ["dtcc-settlement-api", "fedwire-interface", "swift-network"]),
                ("market-data-platform", ["bloomberg-terminal-api", "refinitiv-eikon-api", "ice-data-services"]),
                ("risk-management-system", ["refinitiv-eikon-api", "snowflake-datawarehouse", "tableau-server"]),
                ("regulatory-reporting", ["swift-network", "tableau-server", "splunk-enterprise"]),
                ("aml-monitoring-system", ["splunk-enterprise", "crowdstrike-falcon"]),
                ("portfolio-management", ["snowflake-datawarehouse", "tableau-server"]),
                ("client-portal", ["okta-identity", "sendgrid-email", "crowdstrike-falcon"]),
                ("performance-analytics", ["snowflake-datawarehouse", "tableau-server"]),
                ("operational-dashboard", ["datadog-apm", "aws-cloudwatch", "splunk-enterprise"]),
                ("audit-trail-system", ["splunk-enterprise", "aws-iam", "okta-identity"]),
                ("backup-orchestrator", ["aws-secretsmanager", "aws-cloudwatch"])
            ]
            
            for app, external_list in app_external_mappings:
                for external in external_list:
                    session.run("""
                    MATCH (a:Application {name: $app}), (e:ExternalService {name: $external})
                    MERGE (a)-[:DEPENDS_ON_EXTERNAL]->(e)
                    """, app=app, external=external)
            
            # Read replica relationships
            session.run("""
            MATCH (primary:RDSInstance {identifier: 'trading-primary-postgres'}),
                  (replica:RDSInstance {identifier: 'trading-replica-postgres'})
            MERGE (primary)-[:REPLICATES_TO]->(replica)
            """)
            
            # Enhanced application to service relationships
            app_service_mappings = [
                # Trading applications
                ("trading-platform", ["trading-api", "trading-gateway", "order-execution-engine", "position-tracker", "auth-service"]),
                ("order-management-system", ["order-execution-engine", "trading-api", "position-tracker", "auth-service"]),
                ("market-data-platform", ["market-data-ingestion", "trading-api", "auth-service"]),
                
                # Risk applications
                ("risk-management-system", ["risk-calculator", "stress-testing-engine", "var-calculator", "auth-service"]),
                ("regulatory-reporting", ["basel-compliance-api", "risk-reporting-service", "audit-logging-service", "auth-service"]),
                ("aml-monitoring-system", ["audit-logging-service", "auth-service"]),
                
                # Portfolio applications
                ("portfolio-management", ["portfolio-api", "rebalancing-engine", "performance-attribution", "auth-service"]),
                ("client-portal", ["client-reporting-api", "portfolio-api", "auth-service", "notification-service"]),
                ("performance-analytics", ["performance-attribution", "benchmark-comparison", "portfolio-api", "auth-service"]),
                
                # Operational applications
                ("operational-dashboard", ["auth-service", "audit-logging-service"]),
                ("audit-trail-system", ["audit-logging-service", "session-manager", "auth-service"]),
                ("backup-orchestrator", ["auth-service"])
            ]
            
            for app, service_list in app_service_mappings:
                for service in service_list:
                    session.run("""
                    MATCH (a:Application {name: $app}), (s:Service {name: $service})
                    MERGE (a)-[:USES]->(s)
                    """, app=app, service=service)
            
            # Load Balancer to Web Service relationships (traffic flow)
            lb_web_mappings = [
                ("trading-alb", ["trading-frontend", "api-documentation"]),
                ("risk-mgmt-alb", ["risk-analytics-ui", "compliance-reports"]),
                ("portfolio-alb", ["portfolio-dashboard", "admin-portal"]),
                ("api-gateway-alb", ["mobile-api-gateway", "api-documentation"]),
                ("internal-services-alb", ["monitoring-dashboard", "admin-portal"]),
                ("analytics-nlb", ["data-visualization", "risk-analytics-ui"]),
                ("legacy-elb", ["legacy-web-interface"]),
                ("monitoring-alb", ["monitoring-dashboard"])
            ]
            
            for lb_name, web_service_names in lb_web_mappings:
                for ws_name in web_service_names:
                    session.run("""
                    MATCH (lb:LoadBalancer {name: $lb_name}), (ws:WebService {name: $ws_name})
                    MERGE (lb)-[:ROUTES_TO]->(ws)
                    """, lb_name=lb_name, ws_name=ws_name)
            
            # Web Service to Service relationships (API calls)
            web_service_mappings = [
                ("trading-frontend", ["trading-api", "trading-gateway", "auth-service"]),
                ("portfolio-dashboard", ["portfolio-api", "client-reporting-api", "auth-service"]),
                ("risk-analytics-ui", ["risk-calculator", "var-calculator", "auth-service"]),
                ("admin-portal", ["auth-service", "audit-logging-service", "session-manager"]),
                ("api-documentation", ["trading-api", "portfolio-api", "risk-calculator"]),
                ("monitoring-dashboard", ["auth-service"]),
                ("user-onboarding", ["auth-service", "notification-service"]),
                ("compliance-reports", ["basel-compliance-api", "risk-reporting-service", "auth-service"]),
                ("mobile-api-gateway", ["trading-api", "portfolio-api", "auth-service"]),
                ("legacy-web-interface", ["auth-service"]),
                ("real-time-notifications", ["notification-service", "auth-service"]),
                ("data-visualization", ["portfolio-api", "risk-calculator", "auth-service"])
            ]
            
            for ws_name, service_names in web_service_mappings:
                for service_name in service_names:
                    session.run("""
                    MATCH (ws:WebService {name: $ws_name}), (s:Service {name: $service_name})
                    MERGE (ws)-[:CALLS_API]->(s)
                    """, ws_name=ws_name, service_name=service_name)
            
            # Application to Web Service relationships (frontend connections)
            app_web_mappings = [
                ("market-data-platform", ["trading-frontend", "api-documentation", "data-visualization"]),
                ("trading-platform", ["trading-frontend", "real-time-notifications"]),
                ("order-management-system", ["trading-frontend", "admin-portal"]),
                ("portfolio-management", ["portfolio-dashboard", "data-visualization"]),
                ("risk-management-system", ["risk-analytics-ui", "compliance-reports"]),
                ("client-portal", ["portfolio-dashboard", "user-onboarding"]),
                ("regulatory-reporting", ["compliance-reports", "admin-portal"]),
                ("aml-monitoring-system", ["monitoring-dashboard", "admin-portal"]),
                ("performance-analytics", ["data-visualization", "portfolio-dashboard"]),
                ("operational-dashboard", ["monitoring-dashboard", "admin-portal"]),
                ("audit-trail-system", ["admin-portal", "monitoring-dashboard"]),
                ("backup-orchestrator", ["admin-portal"])
            ]
            
            for app_name, web_service_names in app_web_mappings:
                for ws_name in web_service_names:
                    session.run("""
                    MATCH (a:Application {name: $app_name}), (ws:WebService {name: $ws_name})
                    MERGE (a)-[:HAS_FRONTEND]->(ws)
                    """, app_name=app_name, ws_name=ws_name)
            
        logger.info("✅ Infrastructure relationships created")

    def generate_full_infrastructure(self, clear_existing: bool = True):
        """Generate complete AWS infrastructure topology"""
        try:
            if clear_existing:
                self.clear_existing_data()
            
            self.create_constraints_and_indexes()
            time.sleep(2)  # Give Neo4j time to process constraints
            
            self.create_infrastructure_nodes()
            self.create_relationships()
            
            # Verify creation
            with self.driver.session() as session:
                node_count = session.run("MATCH (n) RETURN count(n) as count").single()["count"]
                rel_count = session.run("MATCH ()-[r]->() RETURN count(r) as count").single()["count"]
                
            logger.info(f"🎯 Infrastructure generation complete: {node_count} nodes, {rel_count} relationships")
            
            return {
                "status": "success",
                "nodes_created": node_count,
                "relationships_created": rel_count,
                "timestamp": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"❌ Infrastructure generation failed: {e}")
            raise
        finally:
            self.driver.close()

if __name__ == "__main__":
    generator = AWSInfrastructureGenerator()
    result = generator.generate_full_infrastructure()
    print(f"Infrastructure generation result: {result}")