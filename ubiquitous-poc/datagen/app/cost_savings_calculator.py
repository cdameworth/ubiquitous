"""
Cost Savings Calculation Engine
Advanced cost optimization and ROI calculation system for enterprise infrastructure
"""

import logging
import json
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass
import math

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class CostOptimization:
    """Represents a single cost optimization opportunity"""
    id: str
    category: str
    resource_type: str
    current_monthly_cost: float
    optimized_monthly_cost: float
    implementation_effort: str  # Low, Medium, High
    risk_level: str  # Low, Medium, High
    confidence: float  # 0.0 to 1.0
    implementation_weeks: int
    business_unit: str
    description: str
    terraform_changes: Optional[str] = None
    
    @property
    def monthly_savings(self) -> float:
        return self.current_monthly_cost - self.optimized_monthly_cost
    
    @property
    def annual_savings(self) -> float:
        return self.monthly_savings * 12
    
    @property
    def roi_percentage(self) -> float:
        implementation_cost = self.implementation_weeks * 15000  # $15K per week implementation
        return (self.annual_savings / implementation_cost * 100) if implementation_cost > 0 else 999

class CostSavingsCalculator:
    """Advanced cost savings calculation and optimization engine"""
    
    def __init__(self):
        self.base_costs = {
            "ec2": {"base_hourly": 0.096, "compute_factor": 1.0},
            "rds": {"base_hourly": 0.145, "storage_factor": 0.10},
            "s3": {"per_gb_month": 0.023, "requests_per_1000": 0.0004},
            "ebs": {"per_gb_month": 0.10, "iops_cost": 0.065},
            "nat_gateway": {"hourly": 0.045, "per_gb": 0.045},
            "load_balancer": {"hourly": 0.0225, "lcu_hour": 0.008},
            "eks": {"cluster_hour": 0.10, "node_hour": 0.05}
        }
        
        self.financial_impact_models = {
            "trading_downtime": {
                "revenue_per_minute": 425000,  # $425K per minute during market hours
                "reputation_cost_multiplier": 1.5,
                "regulatory_fine_risk": 2000000
            },
            "client_impact": {
                "client_value_average": 850000,  # Average client AUM
                "churn_cost_multiplier": 2.5,
                "acquisition_cost": 12000
            },
            "compliance_violation": {
                "base_fine": 500000,
                "severity_multiplier": {"low": 1, "medium": 3, "high": 10, "critical": 25},
                "investigation_cost": 75000
            },
            "data_breach": {
                "per_record": 164,  # Industry average per record
                "investigation_cost": 1500000,
                "legal_cost": 3200000,
                "regulatory_fine": 5000000
            }
        }
    
    def calculate_current_infrastructure_costs(self, topology_data: Dict[str, Any]) -> Dict[str, float]:
        """Calculate current monthly costs for all infrastructure components"""
        
        costs = {
            "ec2_compute": 0,
            "rds_databases": 0,
            "s3_storage": 0,
            "kubernetes": 0,
            "networking": 0,
            "security": 0,
            "monitoring": 0,
            "total": 0
        }
        
        # EC2 instance costs
        if "ec2_instances" in topology_data:
            for instance in topology_data["ec2_instances"]:
                instance_type = instance.get("instance_type", "m5.large")
                hours_per_month = 730
                
                # Calculate base cost based on instance type
                if "nano" in instance_type:
                    hourly_cost = 0.0058
                elif "micro" in instance_type:
                    hourly_cost = 0.0116  
                elif "small" in instance_type:
                    hourly_cost = 0.023
                elif "medium" in instance_type:
                    hourly_cost = 0.046
                elif "large" in instance_type:
                    hourly_cost = 0.096
                elif "xlarge" in instance_type and "2x" not in instance_type:
                    hourly_cost = 0.192
                elif "2xlarge" in instance_type:
                    hourly_cost = 0.384
                elif "4xlarge" in instance_type:
                    hourly_cost = 0.768
                elif "8xlarge" in instance_type:
                    hourly_cost = 1.536
                else:
                    hourly_cost = 0.096  # Default
                
                monthly_cost = hourly_cost * hours_per_month
                costs["ec2_compute"] += monthly_cost
        
        # RDS database costs
        if "rds_instances" in topology_data:
            for db in topology_data["rds_instances"]:
                engine = db.get("engine", "postgres")
                instance_class = db.get("instance_class", "db.t3.medium")
                storage_gb = db.get("allocated_storage", 100)
                
                # Base RDS pricing
                if "micro" in instance_class:
                    hourly_cost = 0.017
                elif "small" in instance_class:
                    hourly_cost = 0.034
                elif "medium" in instance_class:
                    hourly_cost = 0.068
                elif "large" in instance_class:
                    hourly_cost = 0.136
                elif "xlarge" in instance_class and "2x" not in instance_class:
                    hourly_cost = 0.272
                elif "2xlarge" in instance_class:
                    hourly_cost = 0.544
                elif "4xlarge" in instance_class:
                    hourly_cost = 1.088
                else:
                    hourly_cost = 0.068
                
                # Oracle premium pricing
                if engine == "oracle":
                    hourly_cost *= 3.5
                elif engine == "sql-server":
                    hourly_cost *= 2.2
                
                monthly_cost = (hourly_cost * 730) + (storage_gb * 0.115)
                costs["rds_databases"] += monthly_cost
        
        # EKS and Kubernetes costs
        if "eks_clusters" in topology_data:
            cluster_count = len(topology_data["eks_clusters"])
            costs["kubernetes"] = cluster_count * 73  # $0.10/hour per cluster
            
            # Add worker node costs (estimated)
            total_nodes = sum(cluster.get("node_count", 3) for cluster in topology_data["eks_clusters"])
            costs["kubernetes"] += total_nodes * 70  # Average $70/month per worker node
        
        # S3 storage costs (estimated)
        costs["s3_storage"] = 45000  # Estimated $45K/month for enterprise storage
        
        # Networking costs (NAT Gateways, Load Balancers, etc.)
        costs["networking"] = 28000  # Estimated $28K/month
        
        # Security and monitoring costs
        costs["security"] = 18000   # Security tools and compliance
        costs["monitoring"] = 12000  # CloudWatch, Datadog, etc.
        
        costs["total"] = sum(costs.values())
        
        logger.info(f"💰 Current monthly infrastructure cost: ${costs['total']:,.0f}")
        return costs
    
    def identify_optimization_opportunities(self, 
                                         current_costs: Dict[str, float],
                                         topology_data: Dict[str, Any]) -> List[CostOptimization]:
        """Identify specific cost optimization opportunities"""
        
        optimizations = []
        
        # EC2 rightsizing opportunities
        if current_costs["ec2_compute"] > 50000:
            optimizations.append(CostOptimization(
                id="OPT-EC2-001",
                category="rightsizing",
                resource_type="EC2",
                current_monthly_cost=current_costs["ec2_compute"],
                optimized_monthly_cost=current_costs["ec2_compute"] * 0.68,  # 32% savings
                implementation_effort="Low",
                risk_level="Low",
                confidence=0.92,
                implementation_weeks=2,
                business_unit="Technology & Operations",
                description="Rightsize over-provisioned EC2 instances in dev/staging environments",
                terraform_changes="""
# Rightsize development instances
resource "aws_instance" "dev_servers" {
  count         = 150
- instance_type = "m5.4xlarge"
+ instance_type = "m5.2xlarge"
  ami           = data.aws_ami.amazon_linux.id
}"""
            ))
        
        # RDS optimization
        if current_costs["rds_databases"] > 80000:
            optimizations.append(CostOptimization(
                id="OPT-RDS-001", 
                category="reserved_instances",
                resource_type="RDS",
                current_monthly_cost=current_costs["rds_databases"],
                optimized_monthly_cost=current_costs["rds_databases"] * 0.62,  # 38% savings
                implementation_effort="Low",
                risk_level="Low", 
                confidence=0.98,
                implementation_weeks=1,
                business_unit="Trading Operations",
                description="Purchase RDS Reserved Instances for predictable production workloads",
                terraform_changes="""
# RDS Reserved Instance configuration
resource "aws_db_instance" "trading_primary" {
  instance_class        = "db.r5.4xlarge"
+ reserved_instance_id  = aws_rds_reserved_instance.trading_ri.id
  allocated_storage     = 1000
}"""
            ))
        
        # S3 lifecycle optimization
        if current_costs["s3_storage"] > 30000:
            optimizations.append(CostOptimization(
                id="OPT-S3-001",
                category="storage_optimization",
                resource_type="S3",
                current_monthly_cost=current_costs["s3_storage"],
                optimized_monthly_cost=current_costs["s3_storage"] * 0.45,  # 55% savings
                implementation_effort="Low",
                risk_level="Very Low",
                confidence=0.95,
                implementation_weeks=1,
                business_unit="Data & Analytics",
                description="Implement S3 Intelligent Tiering and lifecycle policies for archival data",
                terraform_changes="""
# S3 Lifecycle and Intelligent Tiering
resource "aws_s3_bucket_lifecycle_configuration" "archive_policy" {
  bucket = aws_s3_bucket.data_lake.id
  
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
  }
}"""
            ))
        
        # Spot instance opportunities
        optimizations.append(CostOptimization(
            id="OPT-SPOT-001",
            category="spot_instances",
            resource_type="EC2",
            current_monthly_cost=125000,  # Batch processing workloads
            optimized_monthly_cost=37500,  # 70% savings with spot
            implementation_effort="Medium",
            risk_level="Low",
            confidence=0.85,
            implementation_weeks=4,
            business_unit="Risk Management",
            description="Migrate batch processing workloads to EC2 Spot Instances",
            terraform_changes="""
# Spot Fleet for batch processing
resource "aws_spot_fleet_request" "risk_batch" {
  iam_fleet_role      = aws_iam_role.fleet_role.arn
  allocation_strategy = "diversified"
  target_capacity     = 50
  spot_price         = "0.25"
  
  launch_specification {
    image_id      = data.aws_ami.risk_processing.id
    instance_type = "m5.2xlarge"
  }
}"""
        ))
        
        # Kubernetes resource optimization
        if current_costs["kubernetes"] > 40000:
            optimizations.append(CostOptimization(
                id="OPT-K8S-001",
                category="resource_optimization",
                resource_type="EKS",
                current_monthly_cost=current_costs["kubernetes"],
                optimized_monthly_cost=current_costs["kubernetes"] * 0.72,  # 28% savings
                implementation_effort="Medium",
                risk_level="Medium",
                confidence=0.87,
                implementation_weeks=3,
                business_unit="Platform Engineering",
                description="Optimize Kubernetes resource requests and implement cluster autoscaling",
                terraform_changes="""
# EKS Cluster Autoscaler configuration
resource "aws_autoscaling_group" "eks_nodes" {
  min_size         = 3
- max_size         = 20
+ max_size         = 50
- desired_capacity = 15
+ desired_capacity = 8
  
  tag {
    key                 = "k8s.io/cluster-autoscaler/enabled"
    value               = "true"
    propagate_at_launch = false
  }
}"""
            ))
        
        logger.info(f"🎯 Identified {len(optimizations)} cost optimization opportunities")
        return optimizations
    
    def calculate_roi_metrics(self, optimizations: List[CostOptimization]) -> Dict[str, Any]:
        """Calculate comprehensive ROI metrics for optimization portfolio"""
        
        total_monthly_savings = sum(opt.monthly_savings for opt in optimizations)
        total_annual_savings = sum(opt.annual_savings for opt in optimizations)
        total_implementation_cost = sum(opt.implementation_weeks * 15000 for opt in optimizations)
        
        # Risk-adjusted savings (apply confidence multiplier)
        risk_adjusted_annual = sum(opt.annual_savings * opt.confidence for opt in optimizations)
        
        # Calculate payback period
        if total_monthly_savings > 0:
            payback_months = total_implementation_cost / total_monthly_savings
        else:
            payback_months = float('inf')
        
        # ROI calculation
        roi_percentage = (risk_adjusted_annual / total_implementation_cost * 100) if total_implementation_cost > 0 else 999
        
        # NPV calculation (3 year horizon, 8% discount rate)
        discount_rate = 0.08
        npv = -total_implementation_cost
        for year in range(1, 4):
            npv += risk_adjusted_annual / (1 + discount_rate) ** year
        
        # Categorize savings by type
        savings_by_category = {}
        for opt in optimizations:
            if opt.category not in savings_by_category:
                savings_by_category[opt.category] = {
                    "count": 0,
                    "monthly_savings": 0,
                    "annual_savings": 0,
                    "avg_confidence": 0
                }
            
            savings_by_category[opt.category]["count"] += 1
            savings_by_category[opt.category]["monthly_savings"] += opt.monthly_savings
            savings_by_category[opt.category]["annual_savings"] += opt.annual_savings
            savings_by_category[opt.category]["avg_confidence"] += opt.confidence
        
        # Calculate average confidence by category
        for category in savings_by_category:
            count = savings_by_category[category]["count"]
            savings_by_category[category]["avg_confidence"] /= count
            savings_by_category[category]["avg_confidence"] = round(savings_by_category[category]["avg_confidence"], 2)
        
        # Risk analysis
        risk_distribution = {"Low": 0, "Medium": 0, "High": 0}
        effort_distribution = {"Low": 0, "Medium": 0, "High": 0}
        
        for opt in optimizations:
            risk_distribution[opt.risk_level] += opt.annual_savings
            effort_distribution[opt.implementation_effort] += opt.annual_savings
        
        return {
            "financial_summary": {
                "total_monthly_savings": total_monthly_savings,
                "total_annual_savings": total_annual_savings,
                "risk_adjusted_annual": risk_adjusted_annual,
                "total_implementation_cost": total_implementation_cost,
                "net_annual_benefit": risk_adjusted_annual - (total_implementation_cost / 3),  # Amortized over 3 years
                "roi_percentage": roi_percentage,
                "payback_months": min(payback_months, 60),  # Cap at 5 years for display
                "npv_3_year": npv
            },
            "optimization_portfolio": {
                "total_opportunities": len(optimizations),
                "high_confidence_count": len([o for o in optimizations if o.confidence > 0.8]),
                "low_risk_savings": risk_distribution["Low"],
                "medium_risk_savings": risk_distribution["Medium"],
                "high_risk_savings": risk_distribution["High"],
                "quick_wins": len([o for o in optimizations if o.implementation_weeks <= 2 and o.risk_level == "Low"]),
                "total_implementation_weeks": sum(opt.implementation_weeks for opt in optimizations)
            },
            "savings_by_category": savings_by_category,
            "risk_analysis": {
                "risk_distribution": risk_distribution,
                "effort_distribution": effort_distribution,
                "confidence_weighted_savings": risk_adjusted_annual,
                "worst_case_scenario": total_annual_savings * 0.6,  # 40% pessimistic adjustment
                "best_case_scenario": total_annual_savings * 1.15   # 15% optimistic adjustment
            },
            "quarterly_projection": self._calculate_quarterly_progression(optimizations),
            "business_impact": self._calculate_business_impact(total_annual_savings)
        }
    
    def _calculate_quarterly_progression(self, optimizations: List[CostOptimization]) -> List[Dict[str, Any]]:
        """Calculate realistic quarterly rollout progression"""
        
        # Sort optimizations by implementation ease (low risk, high confidence first)
        sorted_opts = sorted(optimizations, key=lambda x: (
            {"Low": 1, "Medium": 2, "High": 3}[x.risk_level] +
            {"Low": 1, "Medium": 2, "High": 3}[x.implementation_effort] +
            (1 - x.confidence)
        ))
        
        quarters = []
        cumulative_savings = 0
        current_week = 0
        
        for quarter in range(1, 5):  # Q1-Q4
            quarter_opts = []
            quarter_weeks = 13  # Quarterly capacity
            available_weeks = quarter_weeks
            
            # Allocate optimizations to this quarter
            for opt in sorted_opts:
                if opt.implementation_weeks <= available_weeks and opt not in [item for q in quarters for item in q.get("optimizations", [])]:
                    quarter_opts.append(opt)
                    available_weeks -= opt.implementation_weeks
                    cumulative_savings += opt.annual_savings
            
            quarter_savings = sum(opt.annual_savings for opt in quarter_opts)
            
            quarters.append({
                "quarter": f"Q{quarter} 2025",
                "quarter_savings": quarter_savings,
                "cumulative_savings": cumulative_savings,
                "optimizations": quarter_opts,
                "optimization_count": len(quarter_opts),
                "weeks_utilized": quarter_weeks - available_weeks,
                "capacity_utilization": round((quarter_weeks - available_weeks) / quarter_weeks * 100, 1),
                "confidence_score": round(sum(opt.confidence for opt in quarter_opts) / len(quarter_opts) if quarter_opts else 0, 2)
            })
        
        return quarters
    
    def _calculate_business_impact(self, annual_savings: float) -> Dict[str, Any]:
        """Calculate broader business impact metrics"""
        
        return {
            "equivalent_metrics": {
                "developer_salaries": math.floor(annual_savings / 180000),  # $180K avg developer salary
                "trading_revenue_days": round(annual_savings / (425000 * 60 * 8), 1),  # Days of trading revenue
                "client_accounts": math.floor(annual_savings / 850000),  # Average client AUM
                "compliance_audits": math.floor(annual_savings / 2500000)  # Cost per major audit
            },
            "strategic_value": {
                "innovation_reinvestment": annual_savings * 0.30,  # 30% reinvested in innovation
                "talent_acquisition": annual_savings * 0.15,      # 15% for talent
                "technology_debt_reduction": annual_savings * 0.25, # 25% for tech debt
                "business_growth": annual_savings * 0.30          # 30% for growth initiatives
            },
            "competitive_advantage": {
                "cost_per_transaction_improvement": "31%",
                "time_to_market_acceleration": "34%",
                "operational_efficiency_gain": "47%",
                "customer_satisfaction_impact": "+12.4 NPS points"
            }
        }
    
    def generate_cost_reduction_scenarios(self, topology_data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate complete cost reduction analysis for the demo"""
        
        logger.info("💡 Generating comprehensive cost reduction scenarios...")
        
        # Calculate current state
        current_costs = self.calculate_current_infrastructure_costs(topology_data)
        
        # Identify optimization opportunities
        optimizations = self.identify_optimization_opportunities(current_costs, topology_data)
        
        # Calculate ROI and business impact
        roi_metrics = self.calculate_roi_metrics(optimizations)
        
        # Generate executive summary
        executive_summary = {
            "total_annual_opportunity": roi_metrics["financial_summary"]["total_annual_savings"],
            "implementation_investment": roi_metrics["financial_summary"]["total_implementation_cost"],
            "net_annual_benefit": roi_metrics["financial_summary"]["net_annual_benefit"],
            "roi_percentage": roi_metrics["financial_summary"]["roi_percentage"],
            "payback_period": f"{roi_metrics['financial_summary']['payback_months']:.1f} months",
            "confidence_level": round(sum(opt.confidence for opt in optimizations) / len(optimizations), 2),
            "quick_wins_available": roi_metrics["optimization_portfolio"]["quick_wins"],
            "total_optimizations": len(optimizations)
        }
        
        # Demo-ready presentation data
        presentation_data = {
            "headline_savings": f"${roi_metrics['financial_summary']['total_annual_savings']:,.0f}",
            "roi_headline": f"{roi_metrics['financial_summary']['roi_percentage']:.0f}% ROI",
            "payback_headline": f"{roi_metrics['financial_summary']['payback_months']:.0f} month payback",
            "quick_wins": f"{roi_metrics['optimization_portfolio']['quick_wins']} immediate opportunities",
            "top_3_optimizations": sorted(optimizations, key=lambda x: x.annual_savings, reverse=True)[:3]
        }
        
        return {
            "executive_summary": executive_summary,
            "current_costs": current_costs,
            "optimizations": [opt.__dict__ for opt in optimizations],
            "roi_analysis": roi_metrics,
            "presentation_data": presentation_data,
            "generated_timestamp": datetime.utcnow().isoformat()
        }

    def calculate_incident_cost_impact(self, incident_data: Dict[str, Any]) -> Dict[str, float]:
        """Calculate the financial impact of infrastructure incidents"""
        
        impact = {
            "direct_revenue_loss": 0,
            "productivity_cost": 0,
            "reputation_cost": 0,
            "compliance_cost": 0,
            "recovery_cost": 0,
            "total_impact": 0
        }
        
        duration_minutes = incident_data.get("duration_minutes", 30)
        severity = incident_data.get("severity", "medium").lower()
        category = incident_data.get("category", "performance").lower()
        affected_services = incident_data.get("affected_services", [])
        
        # Direct revenue impact based on affected services
        if any("trading" in service for service in affected_services):
            # Trading systems - very high revenue impact
            impact["direct_revenue_loss"] = duration_minutes * self.financial_impact_models["trading_downtime"]["revenue_per_minute"]
            
            # Add regulatory risk for trading outages
            if severity in ["critical", "high"]:
                impact["compliance_cost"] = self.financial_impact_models["trading_downtime"]["regulatory_fine_risk"] * 0.1
        
        elif any("client" in service for service in affected_services):
            # Client-facing systems
            client_count = incident_data.get("users_affected", 1000)
            avg_client_value = self.financial_impact_models["client_impact"]["client_value_average"]
            
            # Revenue at risk calculation
            impact["direct_revenue_loss"] = (client_count * avg_client_value * 0.0001) * (duration_minutes / 60)
            
            # Reputation cost
            if severity in ["critical", "high"]:
                impact["reputation_cost"] = client_count * 45  # $45 per affected client
        
        # Productivity cost (engineering time)
        engineers_involved = {"critical": 8, "high": 5, "medium": 3, "low": 1}.get(severity, 1)
        hourly_rate = 125  # Blended engineering rate
        impact["productivity_cost"] = duration_minutes / 60 * engineers_involved * hourly_rate
        
        # Recovery and investigation costs
        impact["recovery_cost"] = {"critical": 25000, "high": 15000, "medium": 8000, "low": 2000}.get(severity, 5000)
        
        # Total impact
        impact["total_impact"] = sum(impact.values())
        
        return impact

    def generate_savings_dashboard_data(self, topology_data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate comprehensive data for the savings dashboard visualization"""
        
        # Get cost reduction scenarios
        cost_analysis = self.generate_cost_reduction_scenarios(topology_data)
        
        # Generate monthly progression data
        monthly_data = []
        cumulative_savings = 0
        
        for month in range(1, 13):  # 12 months
            # Simulate realistic rollout progression
            if month <= 3:
                monthly_new_savings = cost_analysis["roi_analysis"]["financial_summary"]["total_monthly_savings"] * 0.15
            elif month <= 6:
                monthly_new_savings = cost_analysis["roi_analysis"]["financial_summary"]["total_monthly_savings"] * 0.25
            elif month <= 9:
                monthly_new_savings = cost_analysis["roi_analysis"]["financial_summary"]["total_monthly_savings"] * 0.35
            else:
                monthly_new_savings = cost_analysis["roi_analysis"]["financial_summary"]["total_monthly_savings"] * 0.25
            
            cumulative_savings += monthly_new_savings
            
            monthly_data.append({
                "month": f"Month {month}",
                "new_savings": monthly_new_savings,
                "cumulative_savings": cumulative_savings,
                "optimization_count": len([o for o in cost_analysis["optimizations"] if o["implementation_weeks"] <= month * 4.33]),
                "confidence_score": 0.85 + (month * 0.01)  # Confidence increases over time
            })
        
        # Generate optimization matrix (effort vs savings)
        optimization_matrix = []
        for opt_dict in cost_analysis["optimizations"]:
            effort_score = {"Low": 1, "Medium": 2, "High": 3}[opt_dict["implementation_effort"]]
            risk_score = {"Low": 1, "Medium": 2, "High": 3}[opt_dict["risk_level"]]
            
            optimization_matrix.append({
                "id": opt_dict["id"],
                "name": opt_dict["description"],
                "effort_score": effort_score,
                "risk_score": risk_score,
                "annual_savings": opt_dict["annual_savings"],
                "confidence": opt_dict["confidence"],
                "category": opt_dict["category"],
                "business_unit": opt_dict["business_unit"],
                "priority_score": (opt_dict["annual_savings"] / 1000000) * opt_dict["confidence"] / (effort_score + risk_score)
            })
        
        return {
            "cost_analysis": cost_analysis,
            "monthly_progression": monthly_data,
            "optimization_matrix": optimization_matrix,
            "dashboard_widgets": {
                "total_annual_savings": cost_analysis["executive_summary"]["total_annual_opportunity"],
                "roi_percentage": cost_analysis["executive_summary"]["roi_percentage"],
                "payback_months": cost_analysis["executive_summary"]["payback_period"],
                "quick_wins_count": cost_analysis["executive_summary"]["quick_wins_available"],
                "high_confidence_opportunities": len([o for o in cost_analysis["optimizations"] if o["confidence"] > 0.85]),
                "low_risk_savings": cost_analysis["roi_analysis"]["risk_analysis"]["risk_distribution"]["Low"]
            },
            "generated_timestamp": datetime.utcnow().isoformat()
        }

if __name__ == "__main__":
    # Test the cost savings calculator
    calculator = CostSavingsCalculator()
    
    # Sample topology data for testing
    sample_topology = {
        "ec2_instances": [{"instance_type": "m5.4xlarge"} for _ in range(150)],
        "rds_instances": [{"engine": "postgres", "instance_class": "db.r5.4xlarge", "allocated_storage": 1000} for _ in range(15)],
        "eks_clusters": [{"name": f"cluster-{i}", "node_count": 5} for i in range(8)]
    }
    
    # Generate cost reduction analysis
    savings_data = calculator.generate_savings_dashboard_data(sample_topology)
    
    logger.info(f"💰 Total Annual Savings Opportunity: ${savings_data['dashboard_widgets']['total_annual_savings']:,.0f}")
    logger.info(f"📈 ROI: {savings_data['dashboard_widgets']['roi_percentage']:.0f}%")
    logger.info(f"⏱️ Payback: {savings_data['dashboard_widgets']['payback_months']} months")
    logger.info(f"🎯 Quick Wins: {savings_data['dashboard_widgets']['quick_wins_count']} opportunities")