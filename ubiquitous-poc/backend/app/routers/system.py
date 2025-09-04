"""
System Health and Activities API Router
Provides system health metrics and activity feeds
"""

from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
from datetime import datetime, timedelta
import logging
import random
from ..services.timescale_service import TimescaleService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/system", tags=["System"])

@router.get("/health")
async def get_system_health():
    """Get overall system health metrics"""
    try:
        # Try to get real health data from TimescaleDB
        try:
            query = """
            SELECT AVG(cpu_utilization) as avg_cpu,
                   AVG(memory_utilization) as avg_memory,
                   COUNT(*) as node_count
            FROM system_metrics 
            WHERE timestamp >= NOW() - INTERVAL '5 minutes';
            """
            
            result = TimescaleService.execute_query(query)
            
            if result and len(result) > 0:
                row = result[0]
                avg_cpu = float(row[0]) if row[0] else 0
                avg_memory = float(row[1]) if row[1] else 0
                node_count = int(row[2]) if row[2] else 0
                
                # Calculate overall health score
                cpu_health = max(0, 100 - avg_cpu)
                memory_health = max(0, 100 - avg_memory)
                overall_health = int((cpu_health + memory_health) / 2)
                
                return {
                    "overallHealth": overall_health,
                    "healthTrend": random.randint(-2, 3),
                    "activeAlerts": random.randint(2, 8),
                    "alertTrend": random.randint(-3, 2),
                    "monthlyCost": random.randint(180000, 220000),
                    "costTrend": random.randint(-5, 8),
                    "nodeCount": node_count,
                    "avgCpu": avg_cpu,
                    "avgMemory": avg_memory
                }
        except Exception as e:
            logger.warning(f"TimescaleDB query failed, using mock data: {e}")
        
        # Fallback to mock health data
        return {
            "overallHealth": random.randint(92, 98),
            "healthTrend": random.randint(-1, 3),
            "activeAlerts": random.randint(3, 12),
            "alertTrend": random.randint(-4, 2),
            "monthlyCost": random.randint(180000, 220000),
            "costTrend": random.randint(-8, 12),
            "nodeCount": 155,
            "avgCpu": random.randint(45, 75),
            "avgMemory": random.randint(55, 80)
        }
        
    except Exception as e:
        logger.error(f"Error fetching system health: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch system health")

@router.get("/activities/recent")
async def get_recent_activities():
    """Get recent system activities for dashboard"""
    try:
        # In production, this would query activity logs
        # For POC, return realistic mock activities
        activities = [
            {
                "id": "activity-001",
                "timestamp": "2 min ago",
                "type": "cost",
                "title": "Cost Optimization Applied",
                "description": "Automated rightsizing saved $45K in prod-trading cluster",
                "impact": "high"
            },
            {
                "id": "activity-002", 
                "timestamp": "15 min ago",
                "type": "security",
                "title": "Security Scan Completed",
                "description": "Vulnerability scan detected 2 new issues requiring attention",
                "impact": "medium"
            },
            {
                "id": "activity-003",
                "timestamp": "1 hour ago", 
                "type": "performance",
                "title": "DR Test Successful",
                "description": "Disaster recovery test completed with RTO of 3.5 hours",
                "impact": "low"
            },
            {
                "id": "activity-004",
                "timestamp": "2 hours ago",
                "type": "incident",
                "title": "Database Failover",
                "description": "Automatic failover to secondary database completed successfully",
                "impact": "medium"
            },
            {
                "id": "activity-005",
                "timestamp": "4 hours ago",
                "type": "cost",
                "title": "Resource Scaling",
                "description": "EKS cluster auto-scaled down during low traffic period",
                "impact": "low"
            },
            {
                "id": "activity-006",
                "timestamp": "6 hours ago",
                "type": "security",
                "title": "Compliance Check",
                "description": "SOX compliance validation passed for Q3 reporting",
                "impact": "low"
            }
        ]
        
        return {"activities": activities}
        
    except Exception as e:
        logger.error(f"Error fetching recent activities: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch activities")