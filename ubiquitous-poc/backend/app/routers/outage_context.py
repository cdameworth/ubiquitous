from fastapi import APIRouter, Query, HTTPException
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import random
import uuid

router = APIRouter(prefix="/api/outage", tags=["Outage Context Intelligence"])

@router.get("/current-incidents")
async def get_current_incidents(
    severity: Optional[str] = Query(None, description="Filter by severity: critical, high, medium, low"),
    status: Optional[str] = Query(None, description="Filter by status: investigating, identified, monitoring, resolved")
):
    """Real-time telemetry across dependent apps during outages"""
    
    # Generate current incidents
    incidents = []
    incident_types = [
        {
            "title": "Database connection timeout",
            "description": "Multiple services experiencing database connectivity issues",
            "impact": "Service degradation across payment and user management systems",
            "root_cause": "Database connection pool exhaustion"
        },
        {
            "title": "API Gateway high latency",
            "description": "Increased response times for all API endpoints",
            "impact": "User experience degradation, potential timeouts",
            "root_cause": "Traffic surge beyond capacity limits"
        },
        {
            "title": "Authentication service outage",
            "description": "Users unable to login or authenticate",
            "impact": "Complete service unavailability for new sessions",
            "root_cause": "Redis cache cluster failure"
        },
        {
            "title": "Payment processing failures",
            "description": "Transaction failures and payment gateway errors",
            "impact": "Revenue impact, customer complaints",
            "root_cause": "Third-party payment provider issues"
        },
        {
            "title": "Data pipeline stall",
            "description": "Real-time analytics and reporting delayed",
            "impact": "Delayed insights and dashboard updates",
            "root_cause": "Kafka cluster partition rebalancing"
        }
    ]
    
    for i, incident_type in enumerate(random.sample(incident_types, random.randint(1, 3))):
        incident_severity = random.choice(["critical", "high", "medium", "low"])
        incident_status = random.choice(["investigating", "identified", "monitoring", "resolved"])
        
        if severity and incident_severity != severity:
            continue
        if status and incident_status != status:
            continue
            
        start_time = datetime.utcnow() - timedelta(hours=random.randint(1, 24))
        
        # Generate affected services
        affected_services = random.sample(
            ["auth-service", "payment-api", "user-management", "notification-service", "analytics-engine"],
            random.randint(2, 4)
        )
        
        incidents.append({
            "id": str(uuid.uuid4()),
            "title": incident_type["title"],
            "description": incident_type["description"],
            "severity": incident_severity,
            "status": incident_status,
            "impact": incident_type["impact"],
            "root_cause": incident_type["root_cause"],
            "started_at": start_time.isoformat(),
            "duration_minutes": int((datetime.utcnow() - start_time).total_seconds() / 60),
            "affected_services": affected_services,
            "affected_users": random.randint(100, 10000),
            "estimated_revenue_impact": random.randint(5000, 100000),
            "timeline": [
                {
                    "timestamp": start_time.isoformat(),
                    "event": "Incident detected",
                    "details": "Automated monitoring triggered alert"
                },
                {
                    "timestamp": (start_time + timedelta(minutes=5)).isoformat(),
                    "event": "Investigation started",
                    "details": "On-call engineer notified and responding"
                },
                {
                    "timestamp": (start_time + timedelta(minutes=15)).isoformat(),
                    "event": "Root cause identified",
                    "details": incident_type["root_cause"]
                }
            ],
            "metrics": {
                "cpu": random.randint(85, 98),
                "memory": random.randint(70, 95),
                "requests": {
                    "current": random.randint(500, 3000),
                    "baseline": random.randint(8000, 15000)
                },
                "errors": {
                    "current": round(random.uniform(5, 45), 1),
                    "baseline": round(random.uniform(0.1, 1.0), 1)
                },
                "latency": {
                    "current": random.randint(1500, 5000),
                    "baseline": random.randint(30, 100)
                },
                "connections": {
                    "current": random.randint(15000, 30000),
                    "baseline": random.randint(5000, 12000)
                },
                "dbQueries": random.choice(["Normal", "Slow", "Critical"]),
                "cacheHit": random.randint(5, 35)
            },
            "dependencies": [
                {
                    "service": service,
                    "status": random.choice(["healthy", "degraded", "unhealthy"]),
                    "impact_level": random.choice(["high", "medium", "low"])
                }
                for service in affected_services
            ]
        })
    
    return {
        "timestamp": datetime.utcnow().isoformat(),
        "total_incidents": len(incidents),
        "summary": {
            "by_severity": {
                sev: len([i for i in incidents if i["severity"] == sev])
                for sev in ["critical", "high", "medium", "low"]
            },
            "by_status": {
                stat: len([i for i in incidents if i["status"] == stat]) 
                for stat in ["investigating", "identified", "monitoring", "resolved"]
            },
            "total_affected_users": sum(i["affected_users"] for i in incidents),
            "total_estimated_impact": sum(i["estimated_revenue_impact"] for i in incidents)
        },
        "incidents": incidents
    }

@router.get("/dependency-analysis")
async def get_dependency_analysis(
    service: str = Query(..., description="Service to analyze dependencies for"),
    depth: int = Query(3, description="Dependency analysis depth")
):
    """Analyze service dependencies and their current health status"""
    
    services = ["auth-service", "payment-api", "user-management", "notification-service", "analytics-engine"]
    if service not in services:
        raise HTTPException(status_code=404, detail="Service not found")
    
    # Generate dependency graph
    dependencies = {
        "auth-service": ["user-management", "notification-service"],
        "payment-api": ["auth-service", "user-management"],
        "user-management": ["auth-service"],
        "notification-service": ["user-management"],
        "analytics-engine": ["auth-service", "payment-api", "user-management"]
    }
    
    # Build dependency tree
    def get_dependencies(svc, current_depth, max_depth, visited=None):
        if visited is None:
            visited = set()
        if current_depth >= max_depth or svc in visited:
            return []
        
        visited.add(svc)
        deps = dependencies.get(svc, [])
        result = []
        
        for dep in deps:
            dep_info = {
                "service": dep,
                "depth": current_depth + 1,
                "status": random.choice(["healthy", "degraded", "unhealthy"]),
                "response_time_ms": random.randint(50, 2000),
                "error_rate": round(random.uniform(0, 10), 2),
                "availability": round(random.uniform(85, 99.9), 2),
                "last_health_check": datetime.utcnow().isoformat(),
                "dependencies": get_dependencies(dep, current_depth + 1, max_depth, visited.copy())
            }
            result.append(dep_info)
        
        return result
    
    dependency_tree = get_dependencies(service, 0, depth)
    
    # Calculate risk assessment
    all_deps = []
    def collect_deps(deps):
        for dep in deps:
            all_deps.append(dep)
            collect_deps(dep["dependencies"])
    
    collect_deps(dependency_tree)
    
    unhealthy_deps = [d for d in all_deps if d["status"] == "unhealthy"]
    degraded_deps = [d for d in all_deps if d["status"] == "degraded"]
    
    risk_score = (len(unhealthy_deps) * 10 + len(degraded_deps) * 5) / max(len(all_deps), 1)
    
    return {
        "timestamp": datetime.utcnow().isoformat(),
        "service": service,
        "analysis_depth": depth,
        "dependency_tree": dependency_tree,
        "summary": {
            "total_dependencies": len(all_deps),
            "healthy": len([d for d in all_deps if d["status"] == "healthy"]),
            "degraded": len(degraded_deps),
            "unhealthy": len(unhealthy_deps),
            "avg_response_time_ms": round(sum(d["response_time_ms"] for d in all_deps) / len(all_deps), 1) if all_deps else 0,
            "avg_availability": round(sum(d["availability"] for d in all_deps) / len(all_deps), 2) if all_deps else 0
        },
        "risk_assessment": {
            "risk_score": round(risk_score, 1),
            "risk_level": "high" if risk_score > 7 else "medium" if risk_score > 3 else "low",
            "potential_impact": "Service degradation likely" if len(unhealthy_deps) > 0 else "Minimal impact expected",
            "recommendations": [
                f"Monitor {dep['service']} closely - unhealthy status detected"
                for dep in unhealthy_deps
            ] + [
                f"Consider failover options for {dep['service']} - degraded performance"
                for dep in degraded_deps
            ]
        }
    }

@router.get("/impact-analysis")
async def get_impact_analysis(
    incident_id: Optional[str] = Query(None, description="Specific incident ID to analyze"),
    service: Optional[str] = Query(None, description="Service experiencing issues")
):
    """Analyze business and technical impact of outages"""
    
    if not incident_id and not service:
        raise HTTPException(status_code=400, detail="Either incident_id or service must be provided")
    
    # Generate impact analysis
    affected_services = random.sample(
        ["auth-service", "payment-api", "user-management", "notification-service", "analytics-engine"],
        random.randint(2, 4)
    )
    
    if service:
        affected_services = [service] + [s for s in affected_services if s != service][:2]
    
    impact_analysis = {
        "incident_id": incident_id or str(uuid.uuid4()),
        "primary_service": service or affected_services[0],
        "analysis_timestamp": datetime.utcnow().isoformat(),
        "business_impact": {
            "affected_users": random.randint(500, 50000),
            "estimated_revenue_loss": random.randint(10000, 500000),
            "customer_complaints": random.randint(10, 200),
            "sla_breaches": random.randint(1, 10),
            "reputation_score_impact": round(random.uniform(-5, -0.5), 1)
        },
        "technical_impact": {
            "services_affected": len(affected_services),
            "average_response_time_increase": f"{random.randint(200, 2000)}%",
            "error_rate_increase": f"{round(random.uniform(5, 50), 1)}%",
            "throughput_reduction": f"{random.randint(30, 80)}%",
            "cascade_failures": random.randint(0, 5)
        },
        "affected_services": [
            {
                "service": svc,
                "impact_level": random.choice(["high", "medium", "low"]),
                "status": random.choice(["down", "degraded", "recovering"]),
                "users_affected": random.randint(100, 10000),
                "critical_functions_impacted": random.sample([
                    "authentication", "payment_processing", "data_access", 
                    "notifications", "reporting", "search"
                ], random.randint(1, 3))
            }
            for svc in affected_services
        ],
        "downstream_effects": [
            {
                "system": random.choice(["mobile_app", "web_portal", "partner_api", "internal_tools"]),
                "effect": random.choice(["timeouts", "errors", "degraded_performance", "unavailable"]),
                "severity": random.choice(["critical", "high", "medium"])
            }
            for _ in range(random.randint(2, 4))
        ],
        "recovery_metrics": {
            "estimated_recovery_time_minutes": random.randint(30, 240),
            "recovery_confidence": random.choice(["high", "medium", "low"]),
            "manual_intervention_required": random.choice([True, False]),
            "rollback_available": random.choice([True, False])
        },
        "lessons_learned": [
            "Improve monitoring coverage for early detection",
            "Implement circuit breakers to prevent cascade failures", 
            "Review and update incident response procedures",
            "Consider redundancy for critical service dependencies"
        ]
    }
    
    return {
        "timestamp": datetime.utcnow().isoformat(),
        "impact_analysis": impact_analysis,
        "recommendations": {
            "immediate": [
                "Focus on primary service restoration",
                "Communicate with affected users",
                "Implement temporary workarounds where possible"
            ],
            "short_term": [
                "Conduct post-incident review",
                "Update monitoring and alerting rules",
                "Test recovery procedures"
            ],
            "long_term": [
                "Improve system resilience",
                "Implement chaos engineering practices",
                "Review architecture for single points of failure"
            ]
        }
    }

@router.get("/recovery-status")
async def get_recovery_status(
    timeframe: str = Query("24h", description="Recovery timeline: 1h, 6h, 24h, 7d")
):
    """Track recovery progress and system restoration"""
    
    # Generate recovery timeline
    now = datetime.utcnow()
    intervals = {"1h": 5, "6h": 30, "24h": 120, "7d": 840}  # minutes between points
    interval_minutes = intervals.get(timeframe, 120)
    
    recovery_timeline = []
    for i in range(12):  # 12 data points
        timestamp = now - timedelta(minutes=interval_minutes * (11 - i))
        
        # Simulate recovery progress
        recovery_percent = min(100, max(0, 20 + (i * 8) + random.randint(-10, 10)))
        
        recovery_timeline.append({
            "timestamp": timestamp.isoformat(),
            "overall_recovery_percent": recovery_percent,
            "services_online": random.randint(3, 5),
            "services_total": 5,
            "average_response_time_ms": max(100, 2000 - (i * 150) + random.randint(-50, 50)),
            "error_rate": max(0.1, 15 - (i * 1.2) + random.uniform(-0.5, 0.5)),
            "user_sessions_restored": min(100, (i * 9) + random.randint(-5, 5))
        })
    
    current_status = recovery_timeline[-1]
    
    return {
        "timestamp": datetime.utcnow().isoformat(),
        "timeframe": timeframe,
        "current_status": {
            "recovery_percent": current_status["overall_recovery_percent"],
            "system_health": "recovering" if current_status["overall_recovery_percent"] < 90 else "healthy",
            "estimated_full_recovery": (datetime.utcnow() + timedelta(
                minutes=max(0, (100 - current_status["overall_recovery_percent"]) * 2)
            )).isoformat() if current_status["overall_recovery_percent"] < 100 else None
        },
        "recovery_timeline": recovery_timeline,
        "service_status": [
            {
                "service": service,
                "status": random.choice(["online", "degraded", "recovering", "offline"]),
                "recovery_percent": random.randint(70, 100),
                "last_health_check": datetime.utcnow().isoformat()
            }
            for service in ["auth-service", "payment-api", "user-management", "notification-service", "analytics-engine"]
        ],
        "key_metrics": {
            "mttr_minutes": random.randint(45, 180),  # Mean Time To Recovery
            "services_fully_restored": random.randint(3, 5),
            "users_able_to_access": f"{random.randint(80, 95)}%",
            "data_integrity": "verified" if random.choice([True, False]) else "verifying"
        }
    }