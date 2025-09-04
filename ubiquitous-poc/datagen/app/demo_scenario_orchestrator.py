"""
Demo Scenario Orchestrator for Wizard of Oz MVP
Orchestrates specific demo scenarios that showcase $41.6M in value to executives
"""

import asyncio
import json
import random
import time
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
import logging
from neo4j import GraphDatabase
import redis

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DemoScenarioOrchestrator:
    """Orchestrates impressive demo scenarios for executive presentations"""
    
    def __init__(self, 
                 neo4j_uri: str = "bolt://graph:7687", 
                 neo4j_auth: tuple = ("neo4j", "ubiquitous123"),
                 redis_uri: str = "redis://cache:6379"):
        self.neo4j = GraphDatabase.driver(neo4j_uri, auth=neo4j_auth)
        self.redis_client = redis.Redis.from_url(redis_uri, decode_responses=True)
        
        # Demo scenario definitions
        self.scenarios = {
            "trading_crisis": {
                "name": "Trading System Crisis Prevention",
                "duration_seconds": 300,  # 5 minutes
                "value_demonstrated": "$2.1M saved",
                "executive_message": "Prevented $2.1M in trading losses through predictive failure detection"
            },
            "cost_spiral": {
                "name": "AWS Cost Spiral Detection & Fix", 
                "duration_seconds": 240,  # 4 minutes
                "value_demonstrated": "$780K monthly savings",
                "executive_message": "Identified and fixed 40% AWS cost increase saving $9.4M annually"
            },
            "security_breach": {
                "name": "Critical Security Breach Prevention",
                "duration_seconds": 180,  # 3 minutes
                "value_demonstrated": "$6.08M breach cost avoided",
                "executive_message": "Prevented critical security breach saving $6.08M and protecting reputation"
            },
            "executive_value": {
                "name": "Quarterly Executive Value Rollup",
                "duration_seconds": 120,  # 2 minutes
                "value_demonstrated": "$41.6M annual value",
                "executive_message": "Platform delivers $41.6M annual value with 218% ROI"
            }
        }

    def setup_trading_crisis_scenario(self):
        """Setup the trading crisis demo scenario"""
        logger.info("🎭 Setting up Trading Crisis scenario...")
        
        with self.neo4j.session() as session:
            # Set baseline healthy state
            session.run("""
            MATCH (p:Pod)
            WHERE p.service_name CONTAINS 'trading'
            SET p.status = 'Running',
                p.cpu_utilization = 35.0,
                p.memory_utilization = 42.0,
                p.response_time = 45.0,
                p.error_rate = 0.1,
                p.requests_per_second = 2500
            """)
            
            # Set database baseline
            session.run("""
            MATCH (d:RDSInstance)
            WHERE d.identifier CONTAINS 'trading-primary'
            SET d.cpu_utilization = 25.0,
                d.memory_utilization = 40.0,
                d.connections_active = 150,
                d.connections_max = 200,
                d.read_latency = 2.1,
                d.write_latency = 3.2
            """)
        
        # Store scenario state in Redis
        scenario_state = {
            "scenario": "trading_crisis",
            "phase": "setup",
            "start_time": datetime.utcnow().isoformat(),
            "timeline_position": 0,
            "value_at_risk": 2100000,
            "affected_users": 12847,
            "affected_services": ["trading-gateway", "execution-engine", "position-manager"],
            "current_metrics": {
                "trading_gateway": {"cpu": 35, "memory": 42, "response_time": 45, "error_rate": 0.1},
                "database": {"connections": 150, "cpu": 25, "memory": 40}
            }
        }
        
        self.redis_client.setex("demo:scenario:trading_crisis", 3600, json.dumps(scenario_state))
        logger.info("✅ Trading crisis scenario setup complete")

    def execute_trading_crisis_progression(self, step: int) -> Dict[str, Any]:
        """Execute trading crisis scenario progression"""
        
        steps = [
            {
                "time": "09:28:15",
                "description": "Market open volume spike",
                "changes": {
                    "trading_gateway": {"requests_per_second": 15000, "cpu": 65},
                    "database": {"connections_active": 180}
                },
                "alerts": [],
                "executive_note": "Normal market open activity"
            },
            {
                "time": "09:28:47", 
                "description": "Database connection pool stress",
                "changes": {
                    "database": {"connections_active": 195, "cpu": 78, "response_time": 125}
                },
                "alerts": ["⚠️ Database connection pool at 97% capacity"],
                "executive_note": "Early warning system detected potential issue"
            },
            {
                "time": "09:29:12",
                "description": "Connection pool exhausted",
                "changes": {
                    "trading_gateway": {"error_rate": 23.4, "response_time": 2300},
                    "database": {"connections_active": 200, "cpu": 95}
                },
                "alerts": ["🔴 CRITICAL: Trading system degraded", "🔴 Revenue at risk: $2.1M"],
                "executive_note": "Critical incident - immediate response required"
            },
            {
                "time": "09:29:25",
                "description": "Auto-scaling response triggered",
                "changes": {
                    "auto_scaling": {"status": "triggered", "action": "read_replica_scaling"}
                },
                "alerts": ["🔄 Auto-remediation in progress"],
                "executive_note": "Platform intelligence automatically responding"
            },
            {
                "time": "09:30:45",
                "description": "Emergency fix applied",
                "changes": {
                    "database": {"connections_max": 400, "connections_active": 250, "cpu": 55},
                    "trading_gateway": {"error_rate": 2.1, "response_time": 180}
                },
                "alerts": ["✅ System stabilizing"],
                "executive_note": "Automated remediation preventing major outage"
            },
            {
                "time": "09:32:10",
                "description": "Full recovery achieved",
                "changes": {
                    "trading_gateway": {"error_rate": 0.2, "response_time": 45, "cpu": 40},
                    "database": {"cpu": 30, "connections_active": 160}
                },
                "alerts": ["✅ RESOLVED: All systems normal"],
                "executive_note": "Crisis averted - $2.1M in revenue protected"
            }
        ]
        
        if step < len(steps):
            current_step = steps[step]
            
            # Update Neo4j with current state
            with self.neo4j.session() as session:
                if "trading_gateway" in current_step["changes"]:
                    changes = current_step["changes"]["trading_gateway"]
                    session.run("""
                    MATCH (p:Pod)
                    WHERE p.service_name CONTAINS 'trading-gateway'
                    SET p.cpu_utilization = $cpu,
                        p.memory_utilization = COALESCE($memory, p.memory_utilization),
                        p.response_time = COALESCE($response_time, p.response_time),
                        p.error_rate = COALESCE($error_rate, p.error_rate),
                        p.requests_per_second = COALESCE($requests_per_second, p.requests_per_second)
                    """, **{k: v for k, v in changes.items() if v is not None})
                
                if "database" in current_step["changes"]:
                    changes = current_step["changes"]["database"]
                    session.run("""
                    MATCH (d:RDSInstance)
                    WHERE d.identifier CONTAINS 'trading-primary'
                    SET d.cpu_utilization = COALESCE($cpu, d.cpu_utilization),
                        d.memory_utilization = COALESCE($memory, d.memory_utilization),
                        d.connections_active = COALESCE($connections_active, d.connections_active),
                        d.connections_max = COALESCE($connections_max, d.connections_max),
                        d.read_latency = COALESCE($response_time, d.read_latency) / 100.0
                    """, **{k: v for k, v in changes.items() if v is not None})
            
            # Update Redis with current scenario state
            self.redis_client.setex("demo:current_step", 60, json.dumps(current_step))
            
            return current_step
        else:
            return {"status": "completed", "message": "Trading crisis scenario completed successfully"}

    def setup_cost_spiral_scenario(self):
        """Setup the AWS cost spiral detection scenario"""
        logger.info("🎭 Setting up Cost Spiral scenario...")
        
        with self.neo4j.session() as session:
            # Set up cost anomalies
            session.run("""
            MATCH (e:EC2Instance)
            WHERE e.environment = 'prod'
            SET e.monthly_cost_baseline = e.cost_monthly,
                e.cost_monthly = e.cost_monthly * 1.4  // 40% increase
            """)
            
            # Mark specific waste sources
            session.run("""
            MATCH (s:AWSService)
            WHERE s.type = 'NATGateway'
            SET s.utilization = 15.0,  // Very low utilization
                s.waste_identified = true,
                s.monthly_waste = s.cost_monthly * 0.85
            """)
            
            # Mark oversized RDS instances
            session.run("""
            MATCH (d:RDSInstance)
            WHERE d.environment = 'staging'
            AND d.instance_class CONTAINS '4xlarge'
            SET d.cpu_utilization = 18.0,  // Very low usage
                d.recommended_size = 'db.r5.2xlarge',
                d.potential_savings = d.cost_monthly * 0.6
            """)
        
        cost_scenario_state = {
            "scenario": "cost_spiral",
            "phase": "setup",
            "baseline_cost": 5200000,  # $5.2M monthly
            "current_cost": 7280000,   # $7.28M monthly (40% increase)
            "increase_percentage": 40,
            "total_waste_identified": 780000,  # $780K monthly
            "optimization_opportunities": [
                {"type": "NAT Gateway elimination", "savings": 234000},
                {"type": "RDS rightsizing", "savings": 342000},
                {"type": "S3 lifecycle policies", "savings": 89000},
                {"type": "Unused load balancers", "savings": 115000}
            ]
        }
        
        self.redis_client.setex("demo:scenario:cost_spiral", 3600, json.dumps(cost_scenario_state))
        logger.info("✅ Cost spiral scenario setup complete")

    def setup_security_breach_scenario(self):
        """Setup the security breach prevention scenario"""
        logger.info("🎭 Setting up Security Breach Prevention scenario...")
        
        with self.neo4j.session() as session:
            # Inject critical vulnerability
            session.run("""
            MATCH (p:Pod)
            WHERE p.service_name CONTAINS 'trading'
            AND p.environment = 'production'
            SET p.vulnerabilities = [
                {
                    cve: 'CVE-2024-3094',
                    severity: 'CRITICAL', 
                    score: 10.0,
                    description: 'Remote code execution in XZ Utils compression library',
                    exploit_available: true,
                    patch_available: true,
                    affected_component: 'xz-utils-5.6.0'
                }
            ],
            p.security_status = 'critical',
            p.compliance_status = 'non_compliant',
            p.patch_required = true
            WITH p
            LIMIT 25  // Affect 25 trading pods
            """)
            
            # Calculate blast radius
            blast_radius = session.run("""
            MATCH (p:Pod {security_status: 'critical'})-[:DEPENDS_ON*1..3]-(affected)
            RETURN count(DISTINCT affected) as blast_radius_count,
                   collect(DISTINCT affected.service_name)[0..10] as affected_services
            """).single()
            
        security_scenario_state = {
            "scenario": "security_breach",
            "phase": "setup",
            "vulnerability": {
                "cve": "CVE-2024-3094",
                "severity": "CRITICAL",
                "cvss_score": 10.0,
                "description": "Remote code execution in XZ Utils",
                "exploit_probability": "HIGH",
                "business_impact": "CRITICAL"
            },
            "blast_radius": {
                "directly_affected": 25,
                "indirectly_affected": blast_radius["blast_radius_count"],
                "affected_services": blast_radius["affected_services"],
                "potential_breach_cost": 6080000,
                "reputation_impact": "Severe"
            },
            "remediation": {
                "patch_available": True,
                "auto_patch_enabled": True,
                "rollback_plan": "Blue-green deployment",
                "estimated_downtime": "5 minutes per service",
                "testing_required": True
            }
        }
        
        self.redis_client.setex("demo:scenario:security_breach", 3600, json.dumps(security_scenario_state))
        logger.info("✅ Security breach scenario setup complete")

    def setup_executive_value_scenario(self):
        """Setup the executive value demonstration scenario"""
        logger.info("🎭 Setting up Executive Value scenario...")
        
        # Generate comprehensive value metrics
        value_metrics = {
            "scenario": "executive_value",
            "reporting_period": "Q3 2025",
            "total_annual_value": 41600000,
            "total_investment": 28000000,
            "net_benefit": 13600000,
            "roi_percentage": 219,
            "payback_months": 17,
            
            "value_breakdown": {
                "incident_reduction": {
                    "savings": 18200000,
                    "description": "35% MTTR improvement",
                    "metrics": {
                        "mttr_before": 42,
                        "mttr_after": 12,
                        "incidents_this_quarter": 47,
                        "incidents_prevented": 15,
                        "downtime_hours_saved": 247
                    }
                },
                "cloud_optimization": {
                    "savings": 12100000,
                    "description": "22% cloud cost reduction",
                    "metrics": {
                        "monthly_baseline": 5200000,
                        "monthly_current": 4045000,
                        "optimization_percentage": 22.2,
                        "instances_optimized": 485,
                        "spot_adoption": 67
                    }
                },
                "security_prevention": {
                    "savings": 9100000,
                    "description": "1.5 breaches prevented",
                    "metrics": {
                        "vulnerabilities_detected": 1247,
                        "critical_vulns_patched": 89,
                        "breach_attempts_blocked": 23,
                        "compliance_score": 97.8
                    }
                },
                "developer_productivity": {
                    "savings": 10300000,
                    "description": "42% efficiency improvement",
                    "metrics": {
                        "deployment_frequency": 340,  # % increase
                        "cycle_time_reduction": 58,   # % reduction
                        "bug_reduction": 67,          # % reduction  
                        "developer_satisfaction": 4.3
                    }
                }
            },
            
            "industry_benchmarking": {
                "capital_group_roi": 219,
                "industry_average": 156,
                "financial_services_average": 174,
                "top_quartile": 195,
                "ranking": "Top 5%",
                "peer_comparison": {
                    "Company A": 187,
                    "Company B": 165, 
                    "Company C": 203,
                    "Company D": 156
                }
            },
            
            "quarterly_progression": [
                {"quarter": "Q1 2025", "value": 8400000, "cumulative": 8400000},
                {"quarter": "Q2 2025", "value": 10300000, "cumulative": 18700000},
                {"quarter": "Q3 2025", "value": 12500000, "cumulative": 31200000},
                {"quarter": "Q4 2025", "value": 10400000, "cumulative": 41600000}
            ],
            
            "business_unit_contributions": [
                {"unit": "Trading Technology", "savings": 15200000, "percentage": 36.5},
                {"unit": "Risk Technology", "savings": 8900000, "percentage": 21.4},
                {"unit": "Infrastructure", "savings": 7800000, "percentage": 18.7},
                {"unit": "Platform Engineering", "savings": 5400000, "percentage": 13.0},
                {"unit": "Security Operations", "savings": 4300000, "percentage": 10.3}
            ]
        }
        
        self.redis_client.setex("demo:scenario:executive_value", 3600, json.dumps(value_metrics))
        logger.info("✅ Executive value scenario setup complete")

    def play_scenario(self, scenario_name: str, step: int = 0) -> Dict[str, Any]:
        """Play a specific demo scenario step"""
        
        if scenario_name == "trading_crisis":
            return self.execute_trading_crisis_progression(step)
        elif scenario_name == "cost_spiral":
            return self.execute_cost_spiral_progression(step)
        elif scenario_name == "security_breach":
            return self.execute_security_breach_progression(step)
        elif scenario_name == "executive_value":
            return self.get_executive_value_data()
        else:
            return {"error": f"Unknown scenario: {scenario_name}"}

    def execute_cost_spiral_progression(self, step: int) -> Dict[str, Any]:
        """Execute cost spiral detection and resolution"""
        
        steps = [
            {
                "description": "Cost anomaly detected in monthly AWS bill",
                "data": {
                    "baseline_cost": 5200000,
                    "current_cost": 7280000,
                    "increase": 2080000,
                    "percentage_increase": 40,
                    "anomaly_score": 9.2
                },
                "executive_note": "40% cost increase detected automatically"
            },
            {
                "description": "Root cause analysis initiated",
                "data": {
                    "analysis_type": "resource_utilization",
                    "scanning_resources": 15247,
                    "optimization_engine": "active",
                    "time_to_analysis": "2 minutes"
                },
                "executive_note": "AI analyzing 15,000+ resources for waste"
            },
            {
                "description": "Major waste sources identified",
                "data": {
                    "waste_sources": [
                        {"type": "Unused NAT Gateways", "count": 12, "monthly_waste": 234000},
                        {"type": "Oversized RDS instances", "count": 8, "monthly_waste": 342000},
                        {"type": "Orphaned load balancers", "count": 23, "monthly_waste": 115000},
                        {"type": "Inefficient S3 storage", "size_gb": 890000, "monthly_waste": 89000}
                    ],
                    "total_monthly_waste": 780000,
                    "total_annual_impact": 9360000
                },
                "executive_note": "$780K monthly waste identified with specific fixes"
            },
            {
                "description": "Terraform optimization code generated",
                "data": {
                    "terraform_modules": 4,
                    "resources_to_modify": 43,
                    "estimated_implementation": "2 weeks",
                    "risk_assessment": "Low",
                    "testing_plan": "Non-prod first, then prod"
                },
                "executive_note": "Automated infrastructure code ready for deployment"
            },
            {
                "description": "Optimization deployed and validated",
                "data": {
                    "deployment_status": "successful",
                    "monthly_savings_realized": 780000,
                    "annual_savings_projected": 9360000,
                    "roi": "3344%",
                    "payback_period": "1.1 months"
                },
                "executive_note": "$9.4M annual savings realized with 3344% ROI"
            }
        ]
        
        if step < len(steps):
            return steps[step]
        else:
            return {"status": "completed", "total_savings": "$9.4M annually"}

    def execute_security_breach_progression(self, step: int) -> Dict[str, Any]:
        """Execute security breach prevention scenario"""
        
        steps = [
            {
                "description": "Critical vulnerability CVE-2024-3094 detected",
                "data": {
                    "cve": "CVE-2024-3094",
                    "cvss_score": 10.0,
                    "severity": "CRITICAL", 
                    "affected_systems": 247,
                    "exploit_available": True,
                    "patch_available": True,
                    "discovery_method": "Automated vulnerability scanning"
                },
                "executive_note": "Critical security vulnerability detected across trading systems"
            },
            {
                "description": "Blast radius analysis completed",
                "data": {
                    "directly_affected": 247,
                    "indirectly_affected": 1847,
                    "critical_services": ["trading-gateway", "execution-engine", "position-manager"],
                    "potential_breach_cost": 6080000,
                    "reputation_impact": "Severe",
                    "regulatory_impact": "SEC/FINRA reporting required"
                },
                "executive_note": "1,847 systems at risk - $6.08M potential breach cost"
            },
            {
                "description": "Automated remediation initiated",
                "data": {
                    "patch_strategy": "Blue-green rolling deployment",
                    "non_prod_testing": "In progress",
                    "estimated_downtime": "5 minutes per service",
                    "rollback_plan": "Immediate",
                    "security_team_notified": True
                },
                "executive_note": "Automated patching system responding to threat"
            },
            {
                "description": "Patch deployment successful",
                "data": {
                    "systems_patched": 247,
                    "deployment_success_rate": 100,
                    "total_downtime": "12 minutes",
                    "vulnerability_status": "RESOLVED",
                    "breach_cost_avoided": 6080000,
                    "compliance_status": "Maintained"
                },
                "executive_note": "Threat eliminated - $6.08M breach cost avoided"
            }
        ]
        
        if step < len(steps):
            return steps[step]
        else:
            return {"status": "completed", "breach_cost_avoided": "$6.08M"}

    def get_executive_value_data(self) -> Dict[str, Any]:
        """Get executive value reporting data"""
        
        value_data = json.loads(self.redis_client.get("demo:scenario:executive_value"))
        
        # Add real-time calculations
        current_quarter_savings = sum([
            value_data["value_breakdown"]["incident_reduction"]["savings"] / 4,
            value_data["value_breakdown"]["cloud_optimization"]["savings"] / 4,
            value_data["value_breakdown"]["security_prevention"]["savings"] / 4,
            value_data["value_breakdown"]["developer_productivity"]["savings"] / 4
        ])
        
        value_data["current_quarter"] = {
            "q3_2025_savings": current_quarter_savings,
            "q3_2025_target": 10400000,
            "percentage_of_target": (current_quarter_savings / 10400000) * 100,
            "trending": "Above target"
        }
        
        return value_data

    def reset_all_scenarios(self):
        """Reset all scenarios to baseline state"""
        logger.info("🔄 Resetting all demo scenarios to baseline...")
        
        with self.neo4j.session() as session:
            # Reset service metrics to healthy baselines
            session.run("""
            MATCH (p:Pod)
            SET p.cpu_utilization = 35.0 + rand() * 30,
                p.memory_utilization = 40.0 + rand() * 35,
                p.response_time = 45.0 + rand() * 55,
                p.error_rate = 0.1 + rand() * 0.4,
                p.status = 'Running',
                p.security_status = CASE 
                    WHEN rand() < 0.02 THEN 'medium'
                    ELSE 'clean' 
                END,
                p.vulnerabilities = CASE
                    WHEN rand() < 0.02 THEN [
                        {cve: 'CVE-2024-12345', severity: 'MEDIUM', score: 5.3}
                    ]
                    ELSE []
                END
            """)
            
            # Reset database metrics
            session.run("""
            MATCH (d:RDSInstance)
            SET d.cpu_utilization = 25.0 + rand() * 40,
                d.memory_utilization = 35.0 + rand() * 45,
                d.connections_active = toInteger(d.connections_max * (0.3 + rand() * 0.4)),
                d.read_latency = 1.5 + rand() * 3.0,
                d.write_latency = 2.0 + rand() * 4.0,
                d.cost_monthly = COALESCE(d.monthly_cost_baseline, d.cost_monthly)
            """)
            
            # Reset cost optimizations to identified but not applied
            session.run("""
            MATCH (n)
            WHERE n.optimization_opportunity IS NOT NULL
            SET n.status = 'identified'
            """)
        
        # Clear Redis scenario states
        for scenario in self.scenarios.keys():
            self.redis_client.delete(f"demo:scenario:{scenario}")
        
        logger.info("✅ All scenarios reset to baseline")

    def get_scenario_status(self, scenario_name: str) -> Dict[str, Any]:
        """Get current status of a demo scenario"""
        
        scenario_key = f"demo:scenario:{scenario_name}"
        scenario_data = self.redis_client.get(scenario_key)
        
        if scenario_data:
            return json.loads(scenario_data)
        else:
            return {"status": "not_setup", "scenario": scenario_name}

    def list_available_scenarios(self) -> Dict[str, Any]:
        """List all available demo scenarios"""
        return {
            "scenarios": self.scenarios,
            "current_states": {
                name: self.get_scenario_status(name) 
                for name in self.scenarios.keys()
            },
            "total_value_demonstrated": "$41.6M annually",
            "recommended_sequence": [
                "trading_crisis",      # Hook with immediate drama
                "cost_spiral",         # Show cost control
                "security_breach",     # Demonstrate security
                "executive_value"      # Close with comprehensive ROI
            ]
        }

    def generate_real_time_metrics(self, service_name: str) -> Dict[str, Any]:
        """Generate real-time metrics for WebSocket updates"""
        
        base_metrics = {
            "timestamp": datetime.utcnow().isoformat(),
            "service": service_name,
            "cpu_utilization": 35 + random.uniform(-10, 25),
            "memory_utilization": 45 + random.uniform(-15, 30),
            "requests_per_second": 1000 + random.randint(-200, 800),
            "response_time": 50 + random.uniform(-20, 150),
            "error_rate": 0.1 + random.uniform(0, 0.5),
            "active_connections": random.randint(50, 300),
            "queue_depth": random.randint(0, 100),
            "throughput_mbps": 10 + random.uniform(-5, 40)
        }
        
        # Add business hours patterns
        current_hour = datetime.utcnow().hour
        if 9 <= current_hour <= 17:  # Business hours
            base_metrics["requests_per_second"] *= 1.5
            base_metrics["cpu_utilization"] *= 1.2
            base_metrics["memory_utilization"] *= 1.1
        elif 22 <= current_hour or current_hour <= 6:  # Overnight
            base_metrics["requests_per_second"] *= 0.3
            base_metrics["cpu_utilization"] *= 0.7
        
        return base_metrics

    def simulate_incident_progression(self, incident_id: str, minutes_elapsed: int) -> Dict[str, Any]:
        """Simulate incident progression over time"""
        
        # Incident phases
        phases = [
            {"phase": "detection", "duration": 2, "description": "Alert triggered"},
            {"phase": "investigation", "duration": 5, "description": "Root cause analysis"},
            {"phase": "containment", "duration": 8, "description": "Impact containment"},
            {"phase": "resolution", "duration": 12, "description": "Fix implementation"},
            {"phase": "recovery", "duration": 5, "description": "Service restoration"},
            {"phase": "postmortem", "duration": 15, "description": "Learning and documentation"}
        ]
        
        current_phase = None
        elapsed_in_phase = 0
        total_elapsed = 0
        
        for phase in phases:
            if total_elapsed + phase["duration"] >= minutes_elapsed:
                current_phase = phase
                elapsed_in_phase = minutes_elapsed - total_elapsed
                break
            total_elapsed += phase["duration"]
        
        if not current_phase:
            current_phase = phases[-1]
            elapsed_in_phase = minutes_elapsed - sum(p["duration"] for p in phases[:-1])
        
        return {
            "incident_id": incident_id,
            "total_elapsed_minutes": minutes_elapsed,
            "current_phase": current_phase["phase"],
            "phase_description": current_phase["description"],
            "phase_progress": min(100, (elapsed_in_phase / current_phase["duration"]) * 100),
            "overall_progress": min(100, (minutes_elapsed / sum(p["duration"] for p in phases)) * 100),
            "estimated_completion": sum(p["duration"] for p in phases),
            "next_phase": phases[phases.index(current_phase) + 1]["phase"] if phases.index(current_phase) < len(phases) - 1 else "completed"
        }

    def generate_presenter_controls(self) -> Dict[str, Any]:
        """Generate presenter control interface data"""
        return {
            "available_scenarios": list(self.scenarios.keys()),
            "scenario_details": self.scenarios,
            "controls": {
                "playback_speed": ["0.5x", "1x", "2x", "5x", "Skip to End"],
                "annotations": ["Show Value Callouts", "Highlight Savings", "Display Metrics"],
                "presenter_notes": True,
                "auto_advance": False,
                "pause_on_savings": True,
                "show_calculations": True
            },
            "demo_flow": {
                "recommended_duration": "15 minutes total",
                "scenario_timing": {
                    "trading_crisis": "5 minutes",
                    "cost_spiral": "4 minutes", 
                    "security_breach": "3 minutes",
                    "executive_value": "2 minutes",
                    "qa_buffer": "1 minute"
                },
                "transition_slides": [
                    "platform_overview",
                    "roi_summary", 
                    "next_steps"
                ]
            },
            "backup_options": {
                "video_fallback": True,
                "static_screenshots": True,
                "offline_mode": True,
                "demo_data_export": True
            }
        }

    def close(self):
        """Clean up connections"""
        if self.neo4j:
            self.neo4j.close()
        if self.redis_client:
            self.redis_client.close()

if __name__ == "__main__":
    orchestrator = DemoScenarioOrchestrator()
    
    # Setup all scenarios
    orchestrator.reset_all_scenarios()
    orchestrator.setup_trading_crisis_scenario()
    orchestrator.setup_cost_spiral_scenario()
    orchestrator.setup_security_breach_scenario() 
    orchestrator.setup_executive_value_scenario()
    
    # Test scenario listing
    scenarios = orchestrator.list_available_scenarios()
    print(f"Demo scenarios ready: {json.dumps(scenarios, indent=2, default=str)}")
    
    orchestrator.close()