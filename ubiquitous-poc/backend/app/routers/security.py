from fastapi import APIRouter, Query, HTTPException
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import random
import uuid

router = APIRouter(prefix="/api/security", tags=["Security Analysis"])

@router.get("/vulnerability-scan")
async def get_vulnerability_scan(
    severity: Optional[str] = Query(None, description="Filter by severity: critical, high, medium, low"),
    service: Optional[str] = Query(None, description="Filter by service"),
    status: Optional[str] = Query(None, description="Filter by status: open, in_progress, resolved")
):
    """Tiered flags and rich dependency visuals for security vulnerabilities"""
    
    services = ["auth-service", "payment-api", "user-management", "notification-service", "analytics-engine"]
    if service and service not in services:
        raise HTTPException(status_code=404, detail="Service not found")
    
    target_services = [service] if service else services
    vulnerabilities = []
    
    # Common vulnerability types
    vuln_types = [
        {
            "cve": "CVE-2024-12345",
            "title": "SQL Injection vulnerability in authentication module",
            "description": "Unsanitized input parameters allow SQL injection attacks",
            "category": "injection",
            "cvss_score": 8.2
        },
        {
            "cve": "CVE-2024-12346", 
            "title": "Cross-Site Scripting (XSS) in user input fields",
            "description": "Reflected XSS vulnerability in search functionality",
            "category": "xss",
            "cvss_score": 6.1
        },
        {
            "cve": "CVE-2024-12347",
            "title": "Insecure Direct Object Reference",
            "description": "Users can access unauthorized data through parameter manipulation",
            "category": "broken_access_control",
            "cvss_score": 7.5
        },
        {
            "cve": "CVE-2024-12348",
            "title": "Sensitive data exposure in logs",
            "description": "PII and credentials being logged in plain text",
            "category": "sensitive_data_exposure",
            "cvss_score": 5.3
        },
        {
            "cve": "CVE-2024-12349",
            "title": "Insufficient transport layer protection",
            "description": "Weak TLS configuration allows downgrade attacks",
            "category": "crypto_failures",
            "cvss_score": 7.8
        },
        {
            "cve": "CVE-2024-12350",
            "title": "Dependency with known vulnerabilities",
            "description": "Outdated third-party library contains security flaws",
            "category": "vulnerable_components",
            "cvss_score": 9.1
        }
    ]
    
    for svc in target_services:
        # Generate 2-4 vulnerabilities per service
        selected_vulns = random.sample(vuln_types, random.randint(2, 4))
        
        for vuln in selected_vulns:
            # Determine severity based on CVSS score
            if vuln["cvss_score"] >= 9.0:
                vuln_severity = "critical"
            elif vuln["cvss_score"] >= 7.0:
                vuln_severity = "high"
            elif vuln["cvss_score"] >= 4.0:
                vuln_severity = "medium"
            else:
                vuln_severity = "low"
                
            if severity and vuln_severity != severity:
                continue
                
            vuln_status = random.choice(["open", "in_progress", "resolved"])
            if status and vuln_status != status:
                continue
            
            discovered_date = datetime.utcnow() - timedelta(days=random.randint(1, 90))
            
            vulnerabilities.append({
                "id": str(uuid.uuid4()),
                "service": svc,
                "cve": vuln["cve"],
                "title": vuln["title"],
                "description": vuln["description"],
                "severity": vuln_severity,
                "category": vuln["category"],
                "cvss_score": vuln["cvss_score"],
                "status": vuln_status,
                "discovered_date": discovered_date.isoformat(),
                "last_updated": datetime.utcnow().isoformat(),
                "affected_components": [
                    f"{svc}-{random.choice(['database', 'api', 'frontend', 'middleware'])}",
                    f"{svc}-{random.choice(['auth', 'validation', 'logging', 'cache'])}"
                ],
                "dependencies": [
                    {
                        "service": random.choice([s for s in services if s != svc]),
                        "relationship": random.choice(["calls", "depends_on", "shares_data"]),
                        "risk_propagation": random.choice(["high", "medium", "low"])
                    }
                ],
                "remediation": {
                    "priority": "immediate" if vuln_severity in ["critical", "high"] else "scheduled",
                    "estimated_effort_hours": random.randint(4, 40),
                    "steps": [
                        "Analyze vulnerability impact",
                        "Develop and test fix",
                        "Deploy security patch",
                        "Verify remediation",
                        "Update security documentation"
                    ],
                    "patch_available": random.choice([True, False]),
                    "workaround_available": random.choice([True, False])
                },
                "compliance_impact": {
                    "pci_dss": random.choice([True, False]),
                    "gdpr": random.choice([True, False]),
                    "sox": random.choice([True, False])
                }
            })
    
    # Sort by severity and CVSS score
    severity_order = {"critical": 4, "high": 3, "medium": 2, "low": 1}
    vulnerabilities.sort(key=lambda x: (severity_order[x["severity"]], x["cvss_score"]), reverse=True)
    
    return {
        "timestamp": datetime.utcnow().isoformat(),
        "scan_summary": {
            "total_vulnerabilities": len(vulnerabilities),
            "by_severity": {
                sev: len([v for v in vulnerabilities if v["severity"] == sev])
                for sev in ["critical", "high", "medium", "low"]
            },
            "by_status": {
                stat: len([v for v in vulnerabilities if v["status"] == stat])
                for stat in ["open", "in_progress", "resolved"]
            },
            "avg_cvss_score": round(sum(v["cvss_score"] for v in vulnerabilities) / len(vulnerabilities), 1) if vulnerabilities else 0,
            "compliance_violations": len([v for v in vulnerabilities if any(v["compliance_impact"].values())])
        },
        "risk_assessment": {
            "overall_risk_score": round(random.uniform(6.0, 8.5), 1),
            "trending": random.choice(["improving", "degrading", "stable"]),
            "critical_exposure": len([v for v in vulnerabilities if v["severity"] == "critical" and v["status"] == "open"]) > 0
        },
        "vulnerabilities": vulnerabilities
    }

@router.get("/compliance-status")
async def get_compliance_status(
    framework: Optional[str] = Query(None, description="Filter by framework: pci_dss, gdpr, sox, iso27001")
):
    """Compliance framework status and requirements tracking"""
    
    frameworks = {
        "pci_dss": {
            "name": "PCI DSS",
            "version": "4.0",
            "requirements": 12,
            "controls": 250
        },
        "gdpr": {
            "name": "GDPR",
            "version": "2018",
            "requirements": 7,
            "controls": 35
        },
        "sox": {
            "name": "Sarbanes-Oxley",
            "version": "2024",
            "requirements": 11,
            "controls": 180
        },
        "iso27001": {
            "name": "ISO 27001",
            "version": "2022",
            "requirements": 14,
            "controls": 93
        }
    }
    
    if framework and framework not in frameworks:
        raise HTTPException(status_code=404, detail="Compliance framework not found")
    
    target_frameworks = [framework] if framework else list(frameworks.keys())
    compliance_data = []
    
    for fw in target_frameworks:
        fw_info = frameworks[fw]
        
        # Generate compliance status
        compliant_controls = random.randint(int(fw_info["controls"] * 0.7), fw_info["controls"])
        compliance_percentage = (compliant_controls / fw_info["controls"]) * 100
        
        # Generate findings
        total_findings = fw_info["controls"] - compliant_controls
        findings = []
        
        finding_types = [
            "Missing encryption at rest",
            "Inadequate access controls",
            "Insufficient logging and monitoring", 
            "Weak authentication mechanisms",
            "Missing data retention policies",
            "Inadequate network segmentation",
            "Insufficient vulnerability management",
            "Missing incident response procedures"
        ]
        
        for i in range(min(total_findings, 8)):
            findings.append({
                "id": str(uuid.uuid4()),
                "control_id": f"{fw.upper()}-{random.randint(1, fw_info['requirements'])}.{random.randint(1, 20)}",
                "title": random.choice(finding_types),
                "description": f"Control implementation does not meet {fw_info['name']} requirements",
                "severity": random.choice(["high", "medium", "low"]),
                "status": random.choice(["open", "in_remediation", "pending_review"]),
                "owner": random.choice(["Security Team", "Platform Team", "Development Team"]),
                "due_date": (datetime.utcnow() + timedelta(days=random.randint(30, 120))).isoformat(),
                "remediation_plan": "Implement required controls and update documentation",
                "evidence_required": random.choice([True, False])
            })
        
        compliance_data.append({
            "framework": fw,
            "name": fw_info["name"],
            "version": fw_info["version"],
            "compliance_percentage": round(compliance_percentage, 1),
            "status": "compliant" if compliance_percentage >= 95 else "non_compliant",
            "last_assessment": (datetime.utcnow() - timedelta(days=random.randint(30, 90))).isoformat(),
            "next_assessment": (datetime.utcnow() + timedelta(days=random.randint(30, 90))).isoformat(),
            "controls": {
                "total": fw_info["controls"],
                "compliant": compliant_controls,
                "non_compliant": total_findings,
                "not_applicable": random.randint(0, 10)
            },
            "findings": findings,
            "remediation_timeline": {
                "high_priority": random.randint(15, 45),
                "medium_priority": random.randint(30, 90),
                "low_priority": random.randint(60, 180)
            },
            "certification_status": {
                "certified": random.choice([True, False]),
                "expiry_date": (datetime.utcnow() + timedelta(days=random.randint(180, 365))).isoformat() if random.choice([True, False]) else None,
                "auditor": random.choice(["Ernst & Young", "Deloitte", "KPMG", "PwC"]) if random.choice([True, False]) else None
            }
        })
    
    overall_compliance = sum(d["compliance_percentage"] for d in compliance_data) / len(compliance_data) if compliance_data else 0
    
    return {
        "timestamp": datetime.utcnow().isoformat(),
        "overall_compliance_score": round(overall_compliance, 1),
        "frameworks_assessed": len(compliance_data),
        "summary": {
            "compliant_frameworks": len([d for d in compliance_data if d["status"] == "compliant"]),
            "total_findings": sum(len(d["findings"]) for d in compliance_data),
            "high_priority_findings": sum(len([f for f in d["findings"] if f["severity"] == "high"]) for d in compliance_data),
            "overdue_findings": sum(len([f for f in d["findings"] if datetime.fromisoformat(f["due_date"].replace('Z', '+00:00')) < datetime.utcnow().replace(tzinfo=None)]) for d in compliance_data)
        },
        "frameworks": compliance_data
    }

@router.get("/security-metrics")
async def get_security_metrics(
    timeframe: str = Query("30d", description="Metrics period: 7d, 30d, 90d"),
    metric_type: Optional[str] = Query(None, description="Filter by type: incidents, threats, vulnerabilities")
):
    """Security KPIs and trend analysis"""
    
    # Generate time series security metrics
    now = datetime.utcnow()
    days = {"7d": 7, "30d": 30, "90d": 90}[timeframe]
    
    metrics = []
    for i in range(min(days, 30)):  # Limit to 30 data points for readability
        date = now - timedelta(days=(days - i))
        
        metrics.append({
            "date": date.isoformat()[:10],
            "security_incidents": random.randint(0, 8),
            "vulnerabilities_discovered": random.randint(2, 15),
            "vulnerabilities_resolved": random.randint(1, 12),
            "threat_detections": random.randint(50, 200),
            "false_positives": random.randint(10, 80),
            "mean_time_to_detect_hours": round(random.uniform(2, 24), 1),
            "mean_time_to_respond_hours": round(random.uniform(4, 48), 1),
            "security_score": round(random.uniform(75, 95), 1),
            "compliance_score": round(random.uniform(85, 98), 1)
        })
    
    # Calculate trends and aggregates
    total_incidents = sum(m["security_incidents"] for m in metrics)
    total_vulns_discovered = sum(m["vulnerabilities_discovered"] for m in metrics)
    total_vulns_resolved = sum(m["vulnerabilities_resolved"] for m in metrics)
    avg_mttr = sum(m["mean_time_to_respond_hours"] for m in metrics) / len(metrics)
    avg_mttd = sum(m["mean_time_to_detect_hours"] for m in metrics) / len(metrics)
    
    return {
        "timestamp": datetime.utcnow().isoformat(),
        "timeframe": timeframe,
        "summary": {
            "total_incidents": total_incidents,
            "incident_rate": round(total_incidents / days, 2),
            "vulnerability_discovery_rate": round(total_vulns_discovered / days, 2),
            "vulnerability_resolution_rate": round(total_vulns_resolved / days, 2),
            "vulnerability_backlog": max(0, total_vulns_discovered - total_vulns_resolved),
            "avg_mean_time_to_detect_hours": round(avg_mttd, 1),
            "avg_mean_time_to_respond_hours": round(avg_mttr, 1),
            "overall_security_score": round(sum(m["security_score"] for m in metrics) / len(metrics), 1),
            "overall_compliance_score": round(sum(m["compliance_score"] for m in metrics) / len(metrics), 1)
        },
        "trends": {
            "incidents": "decreasing" if metrics[-1]["security_incidents"] < metrics[0]["security_incidents"] else "increasing",
            "vulnerabilities": "improving" if total_vulns_resolved > total_vulns_discovered else "degrading",
            "response_time": "improving" if metrics[-1]["mean_time_to_respond_hours"] < metrics[0]["mean_time_to_respond_hours"] else "degrading"
        },
        "benchmarks": {
            "industry_avg_mttd_hours": 24,
            "industry_avg_mttr_hours": 72,
            "target_security_score": 90,
            "target_compliance_score": 95
        },
        "metrics": metrics if metric_type is None else [
            {k: v for k, v in m.items() if k == "date" or metric_type in k}
            for m in metrics
        ]
    }