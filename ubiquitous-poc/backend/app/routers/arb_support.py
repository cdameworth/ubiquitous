from fastapi import APIRouter, Query, HTTPException
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import random
import uuid

router = APIRouter(prefix="/api/arb", tags=["ARB Decision Support"])

@router.get("/architecture-review")
async def get_architecture_review(
    proposal_id: Optional[str] = Query(None, description="Specific proposal ID"),
    status: Optional[str] = Query(None, description="Filter by status: pending, in_review, approved, rejected"),
    priority: Optional[str] = Query(None, description="Filter by priority: high, medium, low")
):
    """Data to help Architecture Review Board decisions"""
    
    # Generate architecture proposals
    proposal_types = [
        {
            "title": "Microservices Migration for Payment System",
            "description": "Migrate monolithic payment system to microservices architecture",
            "category": "architectural_pattern",
            "complexity": "high",
            "timeline_months": 8,
            "estimated_cost": 850000
        },
        {
            "title": "Multi-Cloud Strategy Implementation", 
            "description": "Implement multi-cloud deployment strategy using AWS and Azure",
            "category": "infrastructure",
            "complexity": "very_high",
            "timeline_months": 12,
            "estimated_cost": 1200000
        },
        {
            "title": "Event-Driven Architecture for Order Processing",
            "description": "Implement event-driven architecture using Apache Kafka",
            "category": "integration_pattern",
            "complexity": "medium",
            "timeline_months": 4,
            "estimated_cost": 320000
        },
        {
            "title": "GraphQL API Gateway Implementation",
            "description": "Replace REST APIs with GraphQL federation approach",
            "category": "api_strategy",
            "complexity": "medium",
            "timeline_months": 6,
            "estimated_cost": 450000
        },
        {
            "title": "Real-time Analytics Platform",
            "description": "Build real-time analytics platform using stream processing",
            "category": "data_architecture",
            "complexity": "high", 
            "timeline_months": 10,
            "estimated_cost": 950000
        }
    ]
    
    proposals = []
    for i, proposal_type in enumerate(random.sample(proposal_types, random.randint(2, 4))):
        proposal_status = random.choice(["pending", "in_review", "approved", "rejected"])
        proposal_priority = random.choice(["high", "medium", "low"])
        
        if status and proposal_status != status:
            continue
        if priority and proposal_priority != priority:
            continue
            
        submission_date = datetime.utcnow() - timedelta(days=random.randint(1, 60))
        
        # Generate technical assessment
        technical_score = random.randint(60, 95)
        business_score = random.randint(55, 90)
        risk_score = random.randint(30, 80)
        
        proposals.append({
            "id": proposal_id or str(uuid.uuid4()),
            "title": proposal_type["title"],
            "description": proposal_type["description"],
            "category": proposal_type["category"],
            "status": proposal_status,
            "priority": proposal_priority,
            "complexity": proposal_type["complexity"],
            "submitted_by": random.choice(["Platform Team", "Development Team", "Architecture Team"]),
            "submitted_date": submission_date.isoformat(),
            "estimated_timeline_months": proposal_type["timeline_months"],
            "estimated_cost": proposal_type["estimated_cost"],
            "business_justification": {
                "primary_drivers": random.sample([
                    "Cost reduction", "Performance improvement", "Scalability requirements",
                    "Technology modernization", "Compliance requirements", "Developer productivity"
                ], random.randint(2, 3)),
                "expected_benefits": [
                    f"{random.randint(20, 60)}% improvement in system performance",
                    f"{random.randint(30, 70)}% reduction in operational costs",
                    f"Support for {random.randint(5, 20)}x traffic growth"
                ],
                "business_impact": random.choice(["high", "medium", "low"]),
                "roi_months": random.randint(12, 36)
            },
            "technical_assessment": {
                "feasibility_score": technical_score,
                "technical_risks": [
                    {
                        "risk": random.choice([
                            "Technology learning curve", "Integration complexity",
                            "Data migration challenges", "Performance degradation risk"
                        ]),
                        "probability": random.choice(["high", "medium", "low"]),
                        "impact": random.choice(["high", "medium", "low"]),
                        "mitigation": "Detailed planning and proof of concept development"
                    }
                    for _ in range(random.randint(2, 4))
                ],
                "dependencies": [
                    f"Integration with {random.choice(['payment', 'user', 'notification', 'analytics'])} service",
                    "Database schema migration",
                    "Third-party service integration"
                ],
                "alternatives_considered": [
                    "Incremental refactoring approach",
                    "Third-party solution adoption", 
                    "Hybrid implementation strategy"
                ]
            },
            "resource_requirements": {
                "team_size": random.randint(4, 12),
                "specialized_skills_needed": random.sample([
                    "Microservices architecture", "Cloud platforms", "DevOps automation",
                    "Security architecture", "Data engineering", "Frontend development"
                ], random.randint(2, 4)),
                "external_consultants": random.choice([True, False]),
                "infrastructure_costs_monthly": random.randint(5000, 25000),
                "training_budget": random.randint(20000, 80000)
            },
            "security_considerations": {
                "security_review_completed": random.choice([True, False]),
                "compliance_impact": random.choice(["none", "minor", "major"]),
                "data_classification": random.choice(["public", "internal", "confidential", "restricted"]),
                "security_requirements": [
                    "Data encryption in transit and at rest",
                    "Role-based access control implementation",
                    "Audit logging and monitoring"
                ]
            },
            "review_scores": {
                "technical_viability": technical_score,
                "business_value": business_score,
                "implementation_risk": risk_score,
                "overall_score": round((technical_score + business_score + (100 - risk_score)) / 3, 1)
            },
            "review_comments": [
                {
                    "reviewer": "Chief Architect",
                    "date": (submission_date + timedelta(days=3)).isoformat(),
                    "comment": "Strong technical approach, concerns about timeline estimates",
                    "score": random.randint(70, 90)
                },
                {
                    "reviewer": "Security Architect",
                    "date": (submission_date + timedelta(days=5)).isoformat(), 
                    "comment": "Security considerations well addressed, recommend additional penetration testing",
                    "score": random.randint(75, 95)
                }
            ],
            "next_review_date": (datetime.utcnow() + timedelta(days=random.randint(7, 30))).isoformat() if proposal_status == "in_review" else None
        })
    
    # Sort by overall score
    proposals.sort(key=lambda x: x["review_scores"]["overall_score"], reverse=True)
    
    return {
        "timestamp": datetime.utcnow().isoformat(),
        "total_proposals": len(proposals),
        "summary": {
            "by_status": {
                stat: len([p for p in proposals if p["status"] == stat])
                for stat in ["pending", "in_review", "approved", "rejected"]
            },
            "by_priority": {
                pri: len([p for p in proposals if p["priority"] == pri])
                for pri in ["high", "medium", "low"]
            },
            "avg_overall_score": round(sum(p["review_scores"]["overall_score"] for p in proposals) / len(proposals), 1) if proposals else 0,
            "total_estimated_investment": sum(p["estimated_cost"] for p in proposals)
        },
        "proposals": proposals
    }

@router.get("/decision-matrix")
async def get_decision_matrix(
    proposal_ids: str = Query(..., description="Comma-separated proposal IDs to compare")
):
    """Multi-criteria decision matrix for comparing architecture proposals"""
    
    ids = [id.strip() for id in proposal_ids.split(",")]
    
    # Decision criteria with weights
    criteria = {
        "technical_feasibility": {
            "weight": 0.25,
            "description": "Technical viability and implementation complexity",
            "scale": "1-10 (higher is better)"
        },
        "business_value": {
            "weight": 0.30,
            "description": "Expected business impact and ROI",
            "scale": "1-10 (higher is better)"
        },
        "implementation_risk": {
            "weight": 0.20,
            "description": "Risk of project failure or issues",
            "scale": "1-10 (lower is better)"
        },
        "resource_requirements": {
            "weight": 0.15,
            "description": "Required team size, skills, and timeline",
            "scale": "1-10 (lower is better)"
        },
        "strategic_alignment": {
            "weight": 0.10,
            "description": "Alignment with company technology strategy",
            "scale": "1-10 (higher is better)"
        }
    }
    
    # Generate comparison data for each proposal
    proposals_comparison = []
    
    for proposal_id in ids:
        # In real implementation, would fetch actual proposal data
        proposal_data = {
            "id": proposal_id,
            "title": f"Architecture Proposal {proposal_id[:8]}",
            "scores": {
                "technical_feasibility": random.randint(6, 10),
                "business_value": random.randint(5, 9),
                "implementation_risk": random.randint(3, 8),  # Lower is better
                "resource_requirements": random.randint(4, 9),  # Lower is better  
                "strategic_alignment": random.randint(6, 10)
            },
            "details": {
                "estimated_cost": random.randint(200000, 1500000),
                "timeline_months": random.randint(4, 18),
                "team_size": random.randint(3, 15),
                "complexity": random.choice(["low", "medium", "high", "very_high"])
            }
        }
        
        # Calculate weighted score
        weighted_score = 0
        for criterion, score in proposal_data["scores"].items():
            weight = criteria[criterion]["weight"]
            # Invert scores for "lower is better" criteria
            if criterion in ["implementation_risk", "resource_requirements"]:
                normalized_score = 11 - score  # Convert to "higher is better"
            else:
                normalized_score = score
            weighted_score += normalized_score * weight
        
        proposal_data["weighted_score"] = round(weighted_score, 2)
        proposal_data["rank"] = 0  # Will be set after sorting
        
        proposals_comparison.append(proposal_data)
    
    # Sort by weighted score and assign ranks
    proposals_comparison.sort(key=lambda x: x["weighted_score"], reverse=True)
    for i, proposal in enumerate(proposals_comparison):
        proposal["rank"] = i + 1
    
    # Generate decision recommendations
    top_proposal = proposals_comparison[0]
    recommendations = [
        f"Recommend {top_proposal['title']} based on highest weighted score ({top_proposal['weighted_score']})",
        f"Consider risk mitigation strategies for implementation risk factors",
        f"Ensure adequate resource allocation for selected proposal"
    ]
    
    # Add specific recommendations based on scores
    if any(p["scores"]["implementation_risk"] > 7 for p in proposals_comparison):
        recommendations.append("High implementation risk detected - recommend detailed risk mitigation planning")
    
    if any(p["details"]["timeline_months"] > 12 for p in proposals_comparison):
        recommendations.append("Long timeline proposals should consider phased delivery approach")
    
    return {
        "timestamp": datetime.utcnow().isoformat(),
        "comparison_id": str(uuid.uuid4()),
        "proposals_compared": len(proposals_comparison),
        "decision_criteria": criteria,
        "comparison_results": proposals_comparison,
        "summary": {
            "recommended_proposal": top_proposal["id"],
            "score_range": f"{proposals_comparison[-1]['weighted_score']} - {proposals_comparison[0]['weighted_score']}",
            "avg_estimated_cost": round(sum(p["details"]["estimated_cost"] for p in proposals_comparison) / len(proposals_comparison)),
            "avg_timeline_months": round(sum(p["details"]["timeline_months"] for p in proposals_comparison) / len(proposals_comparison), 1)
        },
        "recommendations": recommendations
    }

@router.get("/compliance-check")
async def get_compliance_check(
    proposal_id: str = Query(..., description="Proposal ID to check compliance")
):
    """Check architecture proposal compliance with enterprise standards"""
    
    # Enterprise architecture standards
    standards = {
        "security": [
            "Data encryption in transit and at rest",
            "Role-based access control (RBAC)",
            "Security audit logging",
            "Vulnerability scanning integration",
            "Secrets management (no hardcoded credentials)"
        ],
        "scalability": [
            "Horizontal scaling capability",
            "Load balancing implementation",
            "Auto-scaling configuration",
            "Performance monitoring",
            "Caching strategy defined"
        ],
        "reliability": [
            "High availability design (99.9%+ uptime)",
            "Disaster recovery plan",
            "Health check endpoints",
            "Circuit breaker pattern",
            "Graceful degradation handling"
        ],
        "observability": [
            "Structured logging implementation",
            "Distributed tracing",
            "Business metrics collection",
            "Alerting and monitoring",
            "Performance metrics tracking"
        ],
        "technology": [
            "Use approved technology stack",
            "API-first design approach",
            "Container deployment ready",
            "Infrastructure as code",
            "Automated testing strategy"
        ]
    }
    
    # Generate compliance assessment
    compliance_results = {}
    overall_compliance_score = 0
    total_checks = 0
    
    for category, checks in standards.items():
        category_results = []
        category_score = 0
        
        for check in checks:
            compliant = random.choice([True, False, None])  # None = Not Applicable
            status = "compliant" if compliant is True else "non_compliant" if compliant is False else "not_applicable"
            
            if compliant is not None:
                category_score += 1 if compliant else 0
                total_checks += 1
                overall_compliance_score += 1 if compliant else 0
            
            category_results.append({
                "requirement": check,
                "status": status,
                "details": random.choice([
                    "Implementation meets enterprise standards",
                    "Partial implementation, requires enhancement",
                    "Not implemented, must be addressed",
                    "Not applicable for this architecture type"
                ]) if compliant is not None else "Not applicable for this proposal",
                "priority": random.choice(["high", "medium", "low"]) if not compliant and compliant is not None else None,
                "remediation_effort": random.choice(["low", "medium", "high"]) if not compliant and compliant is not None else None
            })
        
        applicable_checks = len([r for r in category_results if r["status"] != "not_applicable"])
        compliance_percentage = (category_score / applicable_checks * 100) if applicable_checks > 0 else 100
        
        compliance_results[category] = {
            "compliance_percentage": round(compliance_percentage, 1),
            "checks_passed": category_score,
            "total_applicable_checks": applicable_checks,
            "requirements": category_results
        }
    
    overall_percentage = (overall_compliance_score / total_checks * 100) if total_checks > 0 else 0
    
    # Generate non-compliance issues
    non_compliance_issues = []
    for category, result in compliance_results.items():
        for req in result["requirements"]:
            if req["status"] == "non_compliant":
                non_compliance_issues.append({
                    "category": category,
                    "requirement": req["requirement"],
                    "priority": req["priority"],
                    "remediation_effort": req["remediation_effort"],
                    "recommendation": f"Address {req['requirement'].lower()} before implementation"
                })
    
    # Sort issues by priority
    priority_order = {"high": 3, "medium": 2, "low": 1}
    non_compliance_issues.sort(key=lambda x: priority_order[x["priority"]], reverse=True)
    
    return {
        "timestamp": datetime.utcnow().isoformat(),
        "proposal_id": proposal_id,
        "overall_compliance": {
            "percentage": round(overall_percentage, 1),
            "status": "compliant" if overall_percentage >= 90 else "partially_compliant" if overall_percentage >= 70 else "non_compliant",
            "total_checks": total_checks,
            "passed_checks": overall_compliance_score,
            "failed_checks": total_checks - overall_compliance_score
        },
        "category_results": compliance_results,
        "non_compliance_issues": non_compliance_issues,
        "recommendations": [
            "Address all high-priority compliance issues before ARB review",
            "Create detailed implementation plan for non-compliant requirements",
            "Schedule architecture review meeting with compliance team"
        ] if non_compliance_issues else [
            "Proposal meets enterprise architecture standards",
            "Proceed with detailed technical design",
            "Schedule final ARB approval meeting"
        ],
        "approval_readiness": {
            "ready_for_arb": overall_percentage >= 85,
            "blocking_issues": len([i for i in non_compliance_issues if i["priority"] == "high"]),
            "estimated_remediation_effort": "high" if len(non_compliance_issues) > 5 else "medium" if len(non_compliance_issues) > 2 else "low"
        }
    }