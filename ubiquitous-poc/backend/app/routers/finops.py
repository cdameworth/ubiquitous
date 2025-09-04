from fastapi import APIRouter, Query, HTTPException
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import random
import uuid

router = APIRouter(prefix="/api/finops", tags=["FinOps Analysis"])

@router.get("/cost-analysis")
async def get_cost_analysis(
    timeframe: str = Query("30d", description="Analysis period: 7d, 30d, 90d"),
    service: Optional[str] = Query(None, description="Filter by service"),
    environment: Optional[str] = Query(None, description="Filter by environment: prod, staging, dev")
):
    """Usage + cost analysis with Terraform recommendations"""
    
    environments = ["prod", "staging", "dev"] if not environment else [environment]
    services = ["auth-service", "payment-api", "user-management", "notification-service", "analytics-engine"]
    
    if service and service not in services:
        raise HTTPException(status_code=404, detail="Service not found")
    
    target_services = [service] if service else services
    
    cost_data = []
    total_cost = 0
    
    for env in environments:
        for svc in target_services:
            # Generate realistic AWS costs
            compute_cost = round(random.uniform(500, 3000) * (2 if env == "prod" else 0.5), 2)
            storage_cost = round(random.uniform(100, 800) * (1.5 if env == "prod" else 0.3), 2)
            network_cost = round(random.uniform(50, 400) * (1.8 if env == "prod" else 0.2), 2)
            service_total = compute_cost + storage_cost + network_cost
            total_cost += service_total
            
            cost_data.append({
                "service": svc,
                "environment": env,
                "period": timeframe,
                "costs": {
                    "compute": {
                        "ec2": compute_cost * 0.6,
                        "eks": compute_cost * 0.3,
                        "lambda": compute_cost * 0.1,
                        "total": compute_cost
                    },
                    "storage": {
                        "ebs": storage_cost * 0.4,
                        "s3": storage_cost * 0.4,
                        "rds": storage_cost * 0.2,
                        "total": storage_cost
                    },
                    "network": {
                        "data_transfer": network_cost * 0.7,
                        "load_balancer": network_cost * 0.2,
                        "nat_gateway": network_cost * 0.1,
                        "total": network_cost
                    },
                    "total": service_total
                },
                "usage_metrics": {
                    "cpu_hours": random.randint(1000, 5000),
                    "memory_gb_hours": random.randint(2000, 8000),
                    "storage_gb": random.randint(500, 2000),
                    "network_gb": random.randint(100, 1000),
                    "requests": random.randint(1000000, 10000000)
                },
                "efficiency_score": round(random.uniform(60, 95), 1),
                "waste_indicators": {
                    "idle_compute": round(random.uniform(10, 40), 1),
                    "oversized_instances": random.randint(0, 5),
                    "unused_storage": round(random.uniform(5, 25), 1)
                }
            })
    
    # Calculate trends
    previous_period_cost = total_cost * random.uniform(0.8, 1.2)
    cost_change = ((total_cost - previous_period_cost) / previous_period_cost) * 100
    
    return {
        "timestamp": datetime.utcnow().isoformat(),
        "timeframe": timeframe,
        "total_services": len(target_services),
        "total_environments": len(environments),
        "summary": {
            "total_cost": round(total_cost, 2),
            "previous_period_cost": round(previous_period_cost, 2),
            "cost_change_percent": round(cost_change, 2),
            "cost_per_request": round(total_cost / sum(s["usage_metrics"]["requests"] for s in cost_data), 6),
            "avg_efficiency_score": round(sum(s["efficiency_score"] for s in cost_data) / len(cost_data), 1)
        },
        "breakdown": {
            "by_category": {
                "compute": round(sum(s["costs"]["compute"]["total"] for s in cost_data), 2),
                "storage": round(sum(s["costs"]["storage"]["total"] for s in cost_data), 2),
                "network": round(sum(s["costs"]["network"]["total"] for s in cost_data), 2)
            },
            "by_environment": {
                env: round(sum(s["costs"]["total"] for s in cost_data if s["environment"] == env), 2)
                for env in environments
            }
        },
        "services": cost_data
    }

@router.get("/terraform-recommendations")
async def get_terraform_recommendations(
    service: Optional[str] = Query(None, description="Service to analyze"),
    priority: Optional[str] = Query(None, description="Priority filter: high, medium, low")
):
    """Infrastructure optimization recommendations via Terraform"""
    
    services = ["auth-service", "payment-api", "user-management", "notification-service", "analytics-engine"]
    if service and service not in services:
        raise HTTPException(status_code=404, detail="Service not found")
    
    target_services = [service] if service else services
    recommendations = []
    
    terraform_recs = [
        {
            "type": "rightsizing",
            "title": "EC2 instance rightsizing",
            "description": "Reduce instance sizes based on actual utilization",
            "terraform_changes": [
                "instance_type = \"t3.medium\" -> \"t3.small\"",
                "Update autoscaling group min/max/desired capacity"
            ],
            "estimated_savings_monthly": random.randint(200, 800),
            "risk": "low"
        },
        {
            "type": "reserved_instances",
            "title": "Reserved Instance opportunities",
            "description": "Convert On-Demand to Reserved Instances for consistent workloads",
            "terraform_changes": [
                "Add reserved instance purchase in terraform",
                "Update instance allocation strategy"
            ],
            "estimated_savings_monthly": random.randint(500, 1500),
            "risk": "low"
        },
        {
            "type": "storage_optimization",
            "title": "EBS volume optimization",
            "description": "Migrate to gp3 volumes and optimize IOPS allocation",
            "terraform_changes": [
                "volume_type = \"gp2\" -> \"gp3\"",
                "Optimize iops and throughput parameters"
            ],
            "estimated_savings_monthly": random.randint(100, 400),
            "risk": "medium"
        },
        {
            "type": "load_balancer_optimization",
            "title": "Load balancer consolidation",
            "description": "Consolidate multiple ALBs into single ALB with host-based routing",
            "terraform_changes": [
                "Merge multiple aws_lb resources",
                "Update listener rules for host routing"
            ],
            "estimated_savings_monthly": random.randint(50, 200),
            "risk": "medium"
        },
        {
            "type": "auto_scaling",
            "title": "Auto-scaling optimization",
            "description": "Implement predictive scaling and schedule-based scaling",
            "terraform_changes": [
                "Add aws_autoscaling_policy with target tracking",
                "Implement scheduled scaling actions"
            ],
            "estimated_savings_monthly": random.randint(300, 900),
            "risk": "low"
        }
    ]
    
    for svc in target_services:
        # Select 2-3 recommendations per service
        selected_recs = random.sample(terraform_recs, random.randint(2, 3))
        
        for rec in selected_recs:
            rec_priority = random.choice(["high", "medium", "low"])
            if priority and rec_priority != priority:
                continue
                
            recommendations.append({
                "id": str(uuid.uuid4()),
                "service": svc,
                "priority": rec_priority,
                "category": rec["type"],
                "title": f"{svc}: {rec['title']}",
                "description": rec["description"],
                "estimated_monthly_savings": rec["estimated_savings_monthly"],
                "estimated_annual_savings": rec["estimated_savings_monthly"] * 12,
                "implementation_risk": rec["risk"],
                "effort_level": random.choice(["low", "medium", "high"]),
                "terraform_changes": rec["terraform_changes"],
                "prerequisites": [
                    "Backup current infrastructure state",
                    "Test changes in staging environment",
                    "Schedule maintenance window"
                ],
                "rollback_plan": "Maintain previous terraform state for quick rollback",
                "impact_assessment": {
                    "performance": random.choice(["positive", "neutral", "negative"]),
                    "availability": random.choice(["improved", "no_change", "risk"]),
                    "security": "no_change"
                },
                "created_at": datetime.utcnow().isoformat()
            })
    
    # Sort by potential savings
    recommendations.sort(key=lambda x: x["estimated_monthly_savings"], reverse=True)
    
    return {
        "timestamp": datetime.utcnow().isoformat(),
        "total_recommendations": len(recommendations),
        "potential_monthly_savings": sum(r["estimated_monthly_savings"] for r in recommendations),
        "potential_annual_savings": sum(r["estimated_annual_savings"] for r in recommendations),
        "summary": {
            "by_priority": {
                "high": len([r for r in recommendations if r["priority"] == "high"]),
                "medium": len([r for r in recommendations if r["priority"] == "medium"]), 
                "low": len([r for r in recommendations if r["priority"] == "low"])
            },
            "by_risk": {
                "low": len([r for r in recommendations if r["implementation_risk"] == "low"]),
                "medium": len([r for r in recommendations if r["implementation_risk"] == "medium"]),
                "high": len([r for r in recommendations if r["implementation_risk"] == "high"])
            },
            "top_categories": {
                cat: len([r for r in recommendations if r["category"] == cat])
                for cat in set(r["category"] for r in recommendations)
            }
        },
        "recommendations": recommendations
    }

@router.get("/budget-tracking")
async def get_budget_tracking(
    timeframe: str = Query("current_month", description="Period: current_month, last_month, ytd")
):
    """Budget vs actual spending tracking"""
    
    # Generate budget data
    services = ["auth-service", "payment-api", "user-management", "notification-service", "analytics-engine"]
    budget_data = []
    
    total_budget = 0
    total_actual = 0
    
    for service in services:
        monthly_budget = random.randint(2000, 8000)
        if timeframe == "ytd":
            budget = monthly_budget * 12
        else:
            budget = monthly_budget
            
        actual_spend = budget * random.uniform(0.7, 1.3)  # 70% to 130% of budget
        
        total_budget += budget
        total_actual += actual_spend
        
        budget_data.append({
            "service": service,
            "budget": round(budget, 2),
            "actual": round(actual_spend, 2),
            "variance": round(actual_spend - budget, 2),
            "variance_percent": round(((actual_spend - budget) / budget) * 100, 1),
            "forecast": round(actual_spend * 1.1, 2) if timeframe != "ytd" else round(actual_spend, 2),
            "trend": random.choice(["increasing", "decreasing", "stable"]),
            "alerts": [
                {
                    "type": "budget_exceeded" if actual_spend > budget else "budget_warning",
                    "message": f"Spending {'exceeded' if actual_spend > budget else 'approaching'} budget threshold",
                    "threshold": budget * (1.0 if actual_spend > budget else 0.9)
                }
            ] if actual_spend > budget * 0.9 else []
        })
    
    overall_variance_percent = ((total_actual - total_budget) / total_budget) * 100
    
    return {
        "timestamp": datetime.utcnow().isoformat(),
        "period": timeframe,
        "summary": {
            "total_budget": round(total_budget, 2),
            "total_actual": round(total_actual, 2),
            "total_variance": round(total_actual - total_budget, 2),
            "variance_percent": round(overall_variance_percent, 1),
            "services_over_budget": len([s for s in budget_data if s["actual"] > s["budget"]]),
            "services_under_budget": len([s for s in budget_data if s["actual"] < s["budget"]]),
            "budget_utilization": round((total_actual / total_budget) * 100, 1)
        },
        "services": budget_data,
        "alerts": [
            alert for service in budget_data for alert in service["alerts"]
        ],
        "recommendations": [
            {
                "type": "budget_reallocation",
                "description": "Consider reallocating budget from under-utilized services to those exceeding limits",
                "services_affected": [s["service"] for s in budget_data if abs(s["variance_percent"]) > 20]
            }
        ] if any(abs(s["variance_percent"]) > 20 for s in budget_data) else []
    }