"""
Capital Group Specific Data Generator
Creates realistic financial services infrastructure with authentic naming and patterns
"""

import random
import uuid
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
import logging
import json

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class CapitalGroupDataGenerator:
    """Generates Capital Group specific infrastructure data for convincing demo"""
    
    def __init__(self):
        # Capital Group organizational structure
        self.divisions = {
            "American Funds": {
                "teams": ["Equity Research", "Fixed Income", "Asset Allocation", "Fund Operations"],
                "applications": ["Portfolio Management", "Research Platform", "Client Reporting", "Fund Administration"]
            },
            "Capital Group Private Client Services": {
                "teams": ["Wealth Management", "Estate Planning", "Tax Strategy", "Client Services"],
                "applications": ["Client Portal", "Wealth Platform", "Document Management", "Communication Hub"]
            },
            "Capital International": {
                "teams": ["Global Equity", "Emerging Markets", "International Fixed Income", "Currency Hedging"],
                "applications": ["Global Trading", "Currency Management", "International Settlement", "Regulatory Reporting"]
            },
            "Institutional Business": {
                "teams": ["Pension Funds", "Endowments", "Sovereign Wealth", "Corporate Plans"],
                "applications": ["Institutional Portal", "Custom Reporting", "Risk Analytics", "Performance Attribution"]
            },
            "Technology & Operations": {
                "teams": ["Platform Engineering", "Data Engineering", "Cybersecurity", "Infrastructure"],
                "applications": ["Core Platform", "Data Lake", "Security Operations", "Monitoring"]
            }
        }
        
        # Financial services specific technology patterns
        self.technology_patterns = {
            "trading_systems": {
                "languages": ["Java", "C++", "Python", "Scala"],
                "frameworks": ["Spring Boot", "Akka", "Apache Kafka", "Apache Spark"],
                "databases": ["Oracle", "PostgreSQL", "TimescaleDB", "Redis"],
                "middleware": ["MQ Series", "Apache Kafka", "RabbitMQ", "ActiveMQ"],
                "protocols": ["FIX", "SWIFT", "REST", "WebSocket", "gRPC"]
            },
            "risk_systems": {
                "languages": ["Python", "R", "Java", "MATLAB"],
                "frameworks": ["NumPy", "Pandas", "Scikit-learn", "Apache Spark"],
                "databases": ["PostgreSQL", "ClickHouse", "InfluxDB", "MongoDB"],
                "compute": ["Apache Spark", "Dask", "Ray", "Kubernetes Jobs"]
            },
            "client_systems": {
                "languages": ["TypeScript", "Java", "C#", "Python"],
                "frameworks": ["React", "Angular", ".NET Core", "Spring Boot"],
                "databases": ["PostgreSQL", "SQL Server", "MongoDB", "DynamoDB"],
                "apis": ["REST", "GraphQL", "gRPC"]
            }
        }
        
        # Realistic Capital Group service names
        self.service_catalog = {
            "trading": {
                "core": ["equity-order-management", "fixed-income-trader", "fx-trading-engine", "execution-management-system"],
                "support": ["trade-validation", "settlement-engine", "position-reconciliation", "market-data-gateway"],
                "analytics": ["trade-cost-analysis", "execution-quality", "slippage-monitor", "volume-predictor"]
            },
            "portfolio": {
                "core": ["portfolio-construction", "asset-allocation-engine", "rebalancing-service", "performance-attribution"],
                "support": ["benchmark-service", "index-tracking", "cash-management", "dividend-processing"],
                "analytics": ["risk-attribution", "factor-analysis", "style-analysis", "peer-comparison"]
            },
            "risk": {
                "core": ["var-calculation-engine", "stress-testing-platform", "scenario-generator", "monte-carlo-engine"],
                "support": ["limit-monitoring", "exposure-aggregation", "correlation-calculator", "volatility-forecaster"],
                "analytics": ["back-testing-engine", "model-validation", "sensitivity-analysis", "tail-risk-analyzer"]
            },
            "client": {
                "core": ["account-management", "client-onboarding", "kyc-validation", "document-vault"],
                "support": ["statement-generator", "tax-reporting", "communication-hub", "preference-manager"],
                "analytics": ["client-analytics", "behavior-analysis", "retention-predictor", "satisfaction-scorer"]
            },
            "compliance": {
                "core": ["regulatory-reporting", "aml-monitoring", "trade-surveillance", "audit-trail"],
                "support": ["compliance-dashboard", "policy-engine", "workflow-manager", "exception-handler"],
                "analytics": ["risk-scoring", "pattern-detection", "anomaly-detection", "trend-analysis"]
            },
            "operations": {
                "core": ["incident-management", "change-management", "capacity-planning", "performance-monitoring"],
                "support": ["alerting-engine", "escalation-manager", "runbook-automation", "health-checker"],
                "analytics": ["sla-tracker", "trend-analyzer", "forecast-engine", "optimization-recommender"]
            }
        }
        
        # Cost centers and financial mapping
        self.cost_centers = {
            "CC-1001": {"name": "Equity Research", "budget": 12500000, "allocation": "American Funds"},
            "CC-1002": {"name": "Fixed Income", "budget": 8900000, "allocation": "American Funds"},
            "CC-1003": {"name": "Technology Infrastructure", "budget": 45000000, "allocation": "Technology & Operations"},
            "CC-1004": {"name": "Trading Operations", "budget": 15600000, "allocation": "Institutional Business"},
            "CC-1005": {"name": "Risk Management", "budget": 8200000, "allocation": "Enterprise Risk"},
            "CC-1006": {"name": "Client Services", "budget": 6700000, "allocation": "Capital Group Private Client Services"},
            "CC-1007": {"name": "Compliance", "budget": 4200000, "allocation": "Compliance & Legal"},
            "CC-1008": {"name": "Data & Analytics", "budget": 18900000, "allocation": "Technology & Operations"},
            "CC-1009": {"name": "Cybersecurity", "budget": 12100000, "allocation": "Technology & Operations"},
            "CC-1010": {"name": "International Operations", "budget": 9800000, "allocation": "Capital International"}
        }

    def generate_capital_group_services(self, count: int = 500) -> List[Dict[str, Any]]:
        """Generate realistic Capital Group microservices"""
        services = []
        
        for category, service_groups in self.service_catalog.items():
            for group_type, service_list in service_groups.items():
                for service_base_name in service_list:
                    for env in ["prod", "staging", "dev"]:
                        # Not all services exist in all environments
                        if env == "dev" and random.random() < 0.3:
                            continue
                        if env == "staging" and random.random() < 0.2:
                            continue
                            
                        # Get cost center
                        cost_center_id = random.choice(list(self.cost_centers.keys()))
                        cost_center = self.cost_centers[cost_center_id]
                        
                        # Technology stack based on service category
                        if category in ["trading", "risk"]:
                            tech = self.technology_patterns["trading_systems"]
                        elif category == "client":
                            tech = self.technology_patterns["client_systems"]
                        else:
                            tech = self.technology_patterns["risk_systems"]
                        
                        # Instance configuration based on criticality
                        if category == "trading" and env == "prod":
                            replicas = random.randint(8, 20)
                            cpu_request, cpu_limit = "1000m", "4000m"
                            memory_request, memory_limit = "2Gi", "8Gi"
                            sla = "99.99%"
                        elif category in ["risk", "compliance"] and env == "prod":
                            replicas = random.randint(4, 12)
                            cpu_request, cpu_limit = "500m", "2000m"
                            memory_request, memory_limit = "1Gi", "4Gi"
                            sla = "99.95%"
                        elif env == "prod":
                            replicas = random.randint(3, 8)
                            cpu_request, cpu_limit = "300m", "1000m"
                            memory_request, memory_limit = "512Mi", "2Gi"
                            sla = "99.9%"
                        else:
                            replicas = random.randint(1, 4)
                            cpu_request, cpu_limit = "100m", "500m"
                            memory_request, memory_limit = "256Mi", "1Gi"
                            sla = "99%"
                        
                        service = {
                            "name": f"{service_base_name}-{env}",
                            "display_name": f"{service_base_name.replace('-', ' ').title()} ({env.upper()})",
                            "category": category,
                            "group_type": group_type,
                            "environment": "production" if env == "prod" else env,
                            "business_criticality": "critical" if category == "trading" and env == "prod" else "high" if env == "prod" else "medium",
                            "division": random.choice(list(self.divisions.keys())),
                            "cost_center": cost_center_id,
                            "cost_center_name": cost_center["name"],
                            "budget_allocation": cost_center["allocation"],
                            "annual_budget": cost_center["budget"],
                            "technology_stack": {
                                "primary_language": random.choice(tech["languages"]),
                                "framework": random.choice(tech["frameworks"]),
                                "database": random.choice(tech["databases"]) if "databases" in tech else "PostgreSQL",
                                "middleware": random.choice(tech.get("middleware", ["HTTP"])),
                                "protocol": random.choice(tech.get("protocols", ["HTTP"]))
                            },
                            "deployment": {
                                "replicas": replicas,
                                "cpu_request": cpu_request,
                                "cpu_limit": cpu_limit,
                                "memory_request": memory_request,
                                "memory_limit": memory_limit,
                                "storage_request": f"{random.choice([1, 2, 5, 10, 20])}Gi",
                                "network_policy": True if env == "prod" else random.choice([True, False]),
                                "resource_quota": True if env == "prod" else False
                            },
                            "monitoring": {
                                "sla_target": sla,
                                "health_check_path": f"/{random.choice(['health', 'status', 'ping', 'ready'])}",
                                "metrics_enabled": True,
                                "logging_level": "INFO" if env == "prod" else "DEBUG",
                                "alerting_enabled": True if env == "prod" else random.choice([True, False]),
                                "apm_enabled": True if env == "prod" else False
                            },
                            "security": {
                                "authentication": "OAuth2" if category == "client" else "mTLS",
                                "authorization": "RBAC",
                                "encryption_in_transit": True,
                                "encryption_at_rest": True if env == "prod" else random.choice([True, False]),
                                "secrets_management": "AWS Secrets Manager",
                                "vulnerability_scan": True if env == "prod" else False
                            },
                            "compliance": {
                                "sox_applicable": True if category in ["trading", "risk", "compliance"] else False,
                                "pci_applicable": True if category == "client" else False,
                                "gdpr_applicable": True if category == "client" else False,
                                "audit_logging": True if env == "prod" else False,
                                "data_classification": "confidential" if category in ["trading", "client"] else "internal"
                            },
                            "performance": {
                                "requests_per_second": random.randint(10, 5000) if category == "trading" else random.randint(1, 1000),
                                "avg_response_time": random.uniform(50, 500),
                                "p95_response_time": random.uniform(100, 1000),
                                "error_rate": random.uniform(0.01, 1.0),
                                "throughput_mbps": random.uniform(1, 100),
                                "concurrent_users": random.randint(10, 1000)
                            },
                            "business_metrics": {
                                "transactions_per_day": random.randint(1000, 500000) if category == "trading" else random.randint(100, 50000),
                                "revenue_impact": random.uniform(100000, 50000000) if category == "trading" else random.uniform(10000, 5000000),
                                "user_count": random.randint(50, 5000),
                                "data_volume_gb": random.randint(10, 10000)
                            },
                            "metadata": {
                                "version": f"{random.randint(1, 5)}.{random.randint(0, 20)}.{random.randint(0, 50)}",
                                "build_number": random.randint(1000, 9999),
                                "deployment_date": (datetime.utcnow() - timedelta(days=random.randint(1, 30))).isoformat(),
                                "last_updated": (datetime.utcnow() - timedelta(hours=random.randint(1, 48))).isoformat(),
                                "repository": f"github.com/capitalgroup/{service_base_name}",
                                "documentation": f"https://docs.capitalgroup.com/{category}/{service_base_name}",
                                "runbook": f"https://runbooks.capitalgroup.com/{category}/{service_base_name}"
                            }
                        }
                        
                        if len(services) < count:
                            services.append(service)
        
        logger.info(f"✅ Generated {len(services)} Capital Group services")
        return services

    def generate_realistic_incidents(self, count: int = 50) -> List[Dict[str, Any]]:
        """Generate realistic incident patterns for demo scenarios"""
        incidents = []
        
        # Incident templates based on real financial services scenarios
        incident_templates = [
            {
                "title": "Trading Platform Latency Spike",
                "category": "performance",
                "severity": "critical",
                "business_impact": "high",
                "affected_services": ["equity-order-management", "execution-management-system", "market-data-gateway"],
                "root_cause": "Database connection pool exhaustion during market open",
                "resolution": "Increased connection pool size and implemented circuit breakers",
                "duration_minutes": random.randint(15, 45),
                "revenue_impact": random.randint(500000, 2000000),
                "users_affected": random.randint(2000, 10000)
            },
            {
                "title": "Portfolio Calculation Service Timeout",
                "category": "availability",
                "severity": "high", 
                "business_impact": "medium",
                "affected_services": ["portfolio-construction", "performance-attribution", "risk-attribution"],
                "root_cause": "Large portfolio calculation overwhelming compute resources",
                "resolution": "Implemented async processing and resource scaling",
                "duration_minutes": random.randint(30, 90),
                "revenue_impact": random.randint(100000, 500000),
                "users_affected": random.randint(500, 2000)
            },
            {
                "title": "Client Portal Authentication Failure",
                "category": "security",
                "severity": "high",
                "business_impact": "high",
                "affected_services": ["account-management", "client-onboarding", "document-vault"],
                "root_cause": "SSO provider certificate expiration",
                "resolution": "Emergency certificate renewal and cache refresh",
                "duration_minutes": random.randint(20, 60),
                "revenue_impact": random.randint(200000, 800000),
                "users_affected": random.randint(5000, 15000)
            },
            {
                "title": "Risk Calculation Memory Leak",
                "category": "performance",
                "severity": "medium",
                "business_impact": "medium",
                "affected_services": ["var-calculation-engine", "stress-testing-platform", "monte-carlo-engine"],
                "root_cause": "Memory leak in matrix calculation library",
                "resolution": "Library upgrade and memory monitoring enhancement",
                "duration_minutes": random.randint(60, 180),
                "revenue_impact": random.randint(50000, 200000),
                "users_affected": random.randint(100, 500)
            },
            {
                "title": "Market Data Feed Interruption",
                "category": "availability",
                "severity": "critical",
                "business_impact": "critical",
                "affected_services": ["market-data-gateway", "price-service", "reference-data", "trading-systems"],
                "root_cause": "Third-party data provider network connectivity issues",
                "resolution": "Failover to backup data provider and enhanced monitoring",
                "duration_minutes": random.randint(5, 20),
                "revenue_impact": random.randint(1000000, 5000000),
                "users_affected": random.randint(1000, 8000)
            }
        ]
        
        for i in range(count):
            template = random.choice(incident_templates)
            
            # Generate incident with variations
            incident_time = datetime.utcnow() - timedelta(days=random.randint(1, 90))
            
            incident = {
                "incident_id": f"INC-{random.randint(100000, 999999)}",
                "title": template["title"],
                "category": template["category"],
                "severity": template["severity"],
                "business_impact": template["business_impact"],
                "status": random.choices(["resolved", "investigating", "monitoring"], weights=[85, 10, 5])[0],
                "affected_services": template["affected_services"],
                "root_cause": template["root_cause"],
                "resolution": template["resolution"] if random.random() < 0.85 else "Under investigation",
                "start_time": incident_time.isoformat(),
                "end_time": (incident_time + timedelta(minutes=template["duration_minutes"])).isoformat() if random.random() < 0.85 else None,
                "duration_minutes": template["duration_minutes"] if random.random() < 0.85 else None,
                "revenue_impact": template["revenue_impact"],
                "users_affected": template["users_affected"],
                "assigned_team": random.choice(["Infrastructure", "Platform Engineering", "Trading Support", "Risk Technology"]),
                "priority": random.choices(["P1", "P2", "P3"], weights=[20, 60, 20])[0],
                "escalated": random.choice([True, False]),
                "communication_sent": True,
                "post_mortem_required": True if template["severity"] in ["critical", "high"] else False,
                "lessons_learned": random.choice([True, False]),
                "follow_up_actions": random.randint(0, 5),
                "similar_incidents": random.randint(0, 3),
                "mttr_target": "30 minutes" if template["severity"] == "critical" else "2 hours",
                "sla_met": random.choice([True, False]),
                "customer_facing": template["category"] == "client",
                "regulatory_impact": True if template["category"] == "compliance" else False
            }
            
            incidents.append(incident)
        
        logger.info(f"✅ Generated {len(incidents)} realistic incidents")
        return incidents

    def generate_cost_optimization_scenarios(self) -> List[Dict[str, Any]]:
        """Generate specific cost optimization opportunities for demo"""
        optimizations = []
        
        # EC2 rightsizing opportunities
        rightsizing_scenarios = [
            {
                "resource_type": "EC2",
                "current_config": "150x m5.4xlarge instances (Development environments)",
                "recommended_config": "150x m5.2xlarge instances",
                "monthly_savings": 342000,
                "annual_savings": 4104000,
                "effort": "Low - Automated with Terraform",
                "risk": "Low - Non-production workloads",
                "implementation_time": "2 weeks",
                "terraform_change": """
# Current configuration
resource "aws_instance" "dev_servers" {
  count         = 150
- instance_type = "m5.4xlarge"
+ instance_type = "m5.2xlarge"
  ami           = data.aws_ami.amazon_linux.id
}""",
                "business_unit": "Technology & Operations",
                "category": "rightsizing"
            },
            {
                "resource_type": "RDS",
                "current_config": "25x db.r5.4xlarge instances (Staging databases)",
                "recommended_config": "25x db.r5.2xlarge instances", 
                "monthly_savings": 198000,
                "annual_savings": 2376000,
                "effort": "Medium - Requires testing and validation",
                "risk": "Medium - Database performance impact",
                "implementation_time": "6 weeks",
                "terraform_change": """
# Staging database rightsizing
resource "aws_db_instance" "staging_dbs" {
  count = 25
- instance_class = "db.r5.4xlarge"
+ instance_class = "db.r5.2xlarge"
  allocated_storage = 1000
}""",
                "business_unit": "Technology & Operations",
                "category": "rightsizing"
            }
        ]
        
        # Spot instance opportunities
        spot_scenarios = [
            {
                "resource_type": "EC2",
                "current_config": "200x m5.xlarge instances (Batch processing)",
                "recommended_config": "200x Spot instances with auto-recovery",
                "monthly_savings": 156000,
                "annual_savings": 1872000,
                "effort": "Medium - Fault-tolerant application design",
                "risk": "Low - Batch workloads can handle interruptions",
                "implementation_time": "4 weeks",
                "terraform_change": """
# Implement spot instances for batch processing
resource "aws_spot_fleet_request" "batch_processing" {
  iam_fleet_role                      = aws_iam_role.fleet_role.arn
  allocation_strategy                 = "diversified"
  target_capacity                     = 200
  terminate_instances_with_expiration = true
  
  launch_specification {
    image_id      = data.aws_ami.amazon_linux.id
    instance_type = "m5.xlarge"
    spot_price    = "0.0464"
  }
}""",
                "business_unit": "Data & Analytics",
                "category": "spot_instances"
            }
        ]
        
        # Reserved instance opportunities  
        reserved_scenarios = [
            {
                "resource_type": "RDS",
                "current_config": "15x Production Oracle databases (On-demand)",
                "recommended_config": "15x 3-year Reserved Instances",
                "monthly_savings": 89000,
                "annual_savings": 1068000,
                "effort": "Low - Financial commitment only",
                "risk": "Low - Predictable production workloads",
                "implementation_time": "1 week",
                "business_unit": "Trading Operations",
                "category": "reserved_instances",
                "reservation_details": {
                    "term": "3 years",
                    "payment_option": "Partial Upfront",
                    "upfront_cost": 156000,
                    "discount_percentage": 62
                }
            }
        ]
        
        # S3 storage optimization
        storage_scenarios = [
            {
                "resource_type": "S3",
                "current_config": "500TB of Standard storage (Old backups and logs)",
                "recommended_config": "Intelligent Tiering + Glacier Deep Archive",
                "monthly_savings": 45000,
                "annual_savings": 540000,
                "effort": "Low - Automated lifecycle policies",
                "risk": "Very Low - Backup and archival data",
                "implementation_time": "2 weeks",
                "terraform_change": """
# S3 Intelligent Tiering and Lifecycle
resource "aws_s3_bucket_lifecycle_configuration" "backup_lifecycle" {
  bucket = aws_s3_bucket.backups.id
  
  rule {
    id     = "intelligent_tiering"
    status = "Enabled"
    
    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }
    
    transition {
      days          = 90
      storage_class = "GLACIER"
    }
    
    transition {
      days          = 365
      storage_class = "DEEP_ARCHIVE"
    }
  }
}""",
                "business_unit": "Technology & Operations",
                "category": "storage_optimization"
            }
        ]
        
        all_scenarios = rightsizing_scenarios + spot_scenarios + reserved_scenarios + storage_scenarios
        
        for scenario in all_scenarios:
            optimizations.append({
                **scenario,
                "id": f"OPT-{random.randint(10000, 99999)}",
                "priority": random.choices(["High", "Medium", "Low"], weights=[30, 50, 20])[0],
                "status": random.choices(["identified", "approved", "in_progress", "completed"], weights=[40, 30, 20, 10])[0],
                "identified_date": (datetime.utcnow() - timedelta(days=random.randint(1, 60))).isoformat(),
                "target_completion": (datetime.utcnow() + timedelta(weeks=random.randint(2, 12))).isoformat(),
                "confidence_level": random.choices(["High", "Medium", "Low"], weights=[60, 30, 10])[0],
                "validation_required": True if scenario["risk"] in ["Medium", "High"] else False,
                "stakeholder_approval": "Required" if scenario["annual_savings"] > 1000000 else "Not Required",
                "tags": [scenario["category"], scenario["business_unit"].lower().replace(" ", "_"), scenario["resource_type"].lower()]
            })
        
        logger.info(f"✅ Generated {len(optimizations)} cost optimization scenarios")
        return optimizations

    def generate_executive_value_metrics(self) -> Dict[str, Any]:
        """Generate executive-level value tracking metrics"""
        
        # Calculate cumulative savings by category
        savings_by_category = {
            "incident_reduction": {
                "annual_savings": 18200000,
                "description": "35% MTTR improvement reducing $51M annual downtime cost",
                "metrics": {
                    "mttr_before": "45 minutes",
                    "mttr_after": "12 minutes", 
                    "improvement_percentage": 73,
                    "incidents_prevented": 15,
                    "downtime_hours_saved": 2847
                }
            },
            "cloud_optimization": {
                "annual_savings": 12100000,
                "description": "22% cost reduction through rightsizing and reserved instances",
                "metrics": {
                    "cost_before": 60000000,
                    "cost_after": 47900000,
                    "optimization_percentage": 20,
                    "instances_optimized": 485,
                    "reserved_instance_coverage": 78
                }
            },
            "security_prevention": {
                "annual_savings": 9100000,
                "description": "1.5 security breaches prevented through proactive detection",
                "metrics": {
                    "breach_cost_average": 6080000,
                    "breaches_prevented": 1.5,
                    "vulnerability_detection_improvement": 85,
                    "compliance_score_improvement": 23,
                    "false_positive_reduction": 67
                }
            },
            "developer_productivity": {
                "annual_savings": 10300000,
                "description": "42% efficiency gain through automation and tooling",
                "metrics": {
                    "development_cycle_time_before": "6 weeks",
                    "development_cycle_time_after": "3.5 weeks",
                    "deployment_frequency_increase": 340,
                    "bug_reduction_percentage": 58,
                    "developer_satisfaction_score": 4.2
                }
            },
            "infrastructure_efficiency": {
                "annual_savings": 8400000,
                "description": "30% waste reduction through automated resource optimization",
                "metrics": {
                    "resource_utilization_before": 45,
                    "resource_utilization_after": 73,
                    "idle_resource_elimination": 89,
                    "auto_scaling_adoption": 95,
                    "capacity_planning_accuracy": 92
                }
            },
            "compliance_automation": {
                "annual_savings": 4200000,
                "description": "58% audit time reduction through automated controls",
                "metrics": {
                    "audit_hours_before": 8760,
                    "audit_hours_after": 3679,
                    "automated_controls_percentage": 78,
                    "compliance_violations_reduction": 84,
                    "reporting_automation": 92
                }
            }
        }
        
        # Quarter-over-quarter progression
        quarterly_progression = [
            {"quarter": "Q1 2025", "cumulative_savings": 8400000, "new_capabilities": 2},
            {"quarter": "Q2 2025", "cumulative_savings": 18700000, "new_capabilities": 4},
            {"quarter": "Q3 2025", "cumulative_savings": 31200000, "new_capabilities": 6},
            {"quarter": "Q4 2025", "cumulative_savings": 41600000, "new_capabilities": 8}
        ]
        
        # Industry benchmarking
        industry_benchmark = {
            "capital_group_roi": 218,
            "financial_services_average": 174,
            "industry_average": 156,
            "top_quartile_threshold": 195,
            "ranking_percentile": 95,
            "peer_comparison": {
                "fidelity": 187,
                "vanguard": 165,
                "blackrock": 203,
                "state_street": 156,
                "northern_trust": 142
            }
        }
        
        # Team-level contribution tracking
        team_contributions = []
        teams = [
            "Platform Engineering", "Trading Technology", "Risk Technology", 
            "Client Technology", "Data Engineering", "Infrastructure", 
            "Security Operations", "DevOps", "Quality Assurance"
        ]
        
        for team in teams:
            contribution = {
                "team_name": team,
                "monthly_savings": random.randint(200000, 1500000),
                "time_saved_hours": random.randint(100, 800),
                "incidents_prevented": random.randint(0, 5),
                "efficiency_gain_percentage": random.randint(15, 65),
                "recommendations_implemented": random.randint(5, 25),
                "automation_projects": random.randint(2, 8),
                "team_size": random.randint(8, 25),
                "productivity_score": random.uniform(3.8, 4.9),
                "satisfaction_score": random.uniform(3.5, 4.8),
                "skill_development_hours": random.randint(40, 200)
            }
            team_contributions.append(contribution)
        
        return {
            "total_annual_savings": 62300000,
            "total_annual_investment": 28000000,
            "net_annual_benefit": 34300000,
            "roi_percentage": 223,
            "payback_months": 16,
            "savings_by_category": savings_by_category,
            "quarterly_progression": quarterly_progression,
            "industry_benchmark": industry_benchmark,
            "team_contributions": team_contributions,
            "key_metrics": {
                "system_uptime": 99.97,
                "mttr_minutes": 8.2,
                "security_incidents_reduction": 89,
                "cost_per_transaction_reduction": 31,
                "developer_productivity_increase": 67,
                "customer_satisfaction": 97.2
            },
            "strategic_outcomes": {
                "digital_transformation_score": 87,
                "operational_excellence_improvement": 47,
                "cost_competitiveness_ranking": "Top 10%",
                "innovation_enablement": "High",
                "risk_reduction_percentage": 78,
                "time_to_market_improvement": 34
            }
        }

    def generate_demo_timeline(self) -> List[Dict[str, Any]]:
        """Generate realistic timeline events for demo scenarios"""
        
        # Base timeline for trading crisis scenario
        trading_crisis_timeline = [
            {
                "timestamp": "09:28:15",
                "event": "Market open - Trading volume spike detected",
                "component": "trading-gateway-prod",
                "severity": "info",
                "metric_change": {"requests_per_second": 15000, "cpu_utilization": 45}
            },
            {
                "timestamp": "09:28:47",
                "event": "Database connection pool approaching limit",
                "component": "trading-primary-postgres",
                "severity": "warning",
                "metric_change": {"active_connections": 180, "max_connections": 200}
            },
            {
                "timestamp": "09:29:12",
                "event": "Connection pool exhausted - new requests failing",
                "component": "trading-primary-postgres", 
                "severity": "critical",
                "metric_change": {"active_connections": 200, "error_rate": 23.4}
            },
            {
                "timestamp": "09:29:18",
                "event": "Cascade failure - execution engine degraded",
                "component": "execution-management-system",
                "severity": "critical", 
                "metric_change": {"response_time": 2300, "error_rate": 45.2}
            },
            {
                "timestamp": "09:29:25",
                "event": "Auto-scaling triggered for database read replicas",
                "component": "trading-replica-postgres-02",
                "severity": "info",
                "metric_change": {"status": "creating"}
            },
            {
                "timestamp": "09:30:45",
                "event": "Emergency connection pool increase applied",
                "component": "trading-primary-postgres",
                "severity": "info", 
                "metric_change": {"max_connections": 400, "error_rate": 12.1}
            },
            {
                "timestamp": "09:32:10",
                "event": "System performance restored to normal",
                "component": "trading-gateway-prod",
                "severity": "info",
                "metric_change": {"response_time": 45, "error_rate": 0.2}
            },
            {
                "timestamp": "09:35:00",
                "event": "Incident closed - Revenue impact calculated",
                "component": "incident-management",
                "severity": "resolved",
                "business_impact": {
                    "revenue_at_risk": 2100000,
                    "revenue_saved": 2100000,
                    "trades_affected": 12847,
                    "clients_impacted": 0,
                    "resolution_time": "6 minutes 45 seconds"
                }
            }
        ]
        
        return {
            "trading_crisis": trading_crisis_timeline,
            "cost_spiral": self._generate_cost_spiral_timeline(),
            "security_breach": self._generate_security_timeline(),
            "compliance_audit": self._generate_compliance_timeline()
        }
    
    def _generate_cost_spiral_timeline(self) -> List[Dict[str, Any]]:
        """Generate AWS cost spiral scenario timeline"""
        return [
            {"timestamp": "Day 1", "event": "Monthly AWS bill shows 40% increase", "impact": "$800K over budget"},
            {"timestamp": "Day 1 + 1h", "event": "Cost anomaly detection triggered", "component": "finops-analyzer"},
            {"timestamp": "Day 1 + 2h", "event": "Root cause identified: Unused NAT Gateways", "savings": "$234K/month"},
            {"timestamp": "Day 1 + 3h", "event": "Additional waste found: Oversized RDS instances", "savings": "$342K/month"},
            {"timestamp": "Day 1 + 4h", "event": "S3 lifecycle policies recommended", "savings": "$89K/month"},
            {"timestamp": "Day 2", "event": "Terraform optimization code generated", "total_savings": "$665K/month"},
            {"timestamp": "Day 3", "event": "Changes applied to non-production first", "validation": "successful"},
            {"timestamp": "Day 7", "event": "Production deployment completed", "realized_savings": "$665K/month"}
        ]
    
    def _generate_security_timeline(self) -> List[Dict[str, Any]]:
        """Generate security breach prevention timeline"""
        return [
            {"timestamp": "14:23:00", "event": "Critical vulnerability CVE-2024-3094 detected", "cvss": 10.0},
            {"timestamp": "14:23:15", "event": "Affected systems identified: 247 containers", "exposure": "critical"},
            {"timestamp": "14:24:30", "event": "Dependency graph shows blast radius", "affected_services": 12},
            {"timestamp": "14:26:45", "event": "Auto-patching initiated on non-production", "status": "in_progress"},
            {"timestamp": "14:32:12", "event": "Patch validation successful", "status": "validated"},
            {"timestamp": "14:35:00", "event": "Production rolling update started", "strategy": "blue_green"},
            {"timestamp": "14:41:30", "event": "All systems patched and secured", "breach_cost_avoided": "$6,080,000"}
        ]
    
    def _generate_compliance_timeline(self) -> List[Dict[str, Any]]:
        """Generate compliance automation timeline"""
        return [
            {"timestamp": "Week 1", "event": "SOX audit preparation initiated", "scope": "Trading systems"},
            {"timestamp": "Week 1 + 2d", "event": "Automated evidence collection", "controls": 247},
            {"timestamp": "Week 1 + 4d", "event": "Control testing automated", "pass_rate": "98.7%"},
            {"timestamp": "Week 2", "event": "Audit documentation generated", "pages": 1247},
            {"timestamp": "Week 2 + 3d", "event": "Auditor review completed", "findings": 2},
            {"timestamp": "Week 3", "event": "Remediation completed", "time_saved": "67%"}
        ]

    def generate_capital_group_complete_dataset(self):
        """Generate the complete Capital Group dataset for the demo"""
        logger.info("🏦 Generating complete Capital Group dataset for Wizard of Oz demo...")
        
        dataset = {
            "metadata": {
                "generated_date": datetime.utcnow().isoformat(),
                "target_node_count": 50000,
                "demo_scenarios": 4,
                "executive_value": "$41.6M annually"
            },
            "services": self.generate_capital_group_services(500),
            "incidents": self.generate_realistic_incidents(50),
            "cost_optimizations": self.generate_cost_optimization_scenarios(),
            "executive_metrics": self.generate_executive_value_metrics(),
            "demo_timelines": self.generate_demo_timeline()
        }
        
        # Save to file for backend consumption
        output_file = "/app/data/capital_group_dataset.json"
        try:
            with open(output_file, 'w') as f:
                json.dump(dataset, f, indent=2, default=str)
            logger.info(f"✅ Capital Group dataset saved to {output_file}")
        except Exception as e:
            logger.warning(f"Could not save to {output_file}: {e}")
        
        return dataset

if __name__ == "__main__":
    generator = CapitalGroupDataGenerator()
    dataset = generator.generate_capital_group_complete_dataset()
    print(f"Capital Group dataset generated with {len(dataset['services'])} services and {len(dataset['incidents'])} incidents")