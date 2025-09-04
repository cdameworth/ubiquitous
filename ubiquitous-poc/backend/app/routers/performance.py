"""
Performance Metrics API Router
Provides Grafana-style performance monitoring endpoints
"""

from fastapi import APIRouter, Query, HTTPException
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import logging
import random
import math
from ..services.timescale_service import TimescaleService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/performance", tags=["Performance"])

@router.get("/request-rate")
async def get_request_rate(timeRange: str = Query("24h", description="Time range: 1h, 24h, 7d, 30d")):
    """Get request rate metrics over time"""
    try:
        # Parse time range
        hours = _parse_time_range(timeRange)
        
        # Try to get real data from TimescaleDB
        try:
            query = """
            SELECT time_bucket('5 minutes', timestamp) as bucket,
                   AVG(requests_per_second) as avg_requests
            FROM performance_metrics 
            WHERE timestamp >= NOW() - INTERVAL '%s hours'
            GROUP BY bucket
            ORDER BY bucket;
            """
            
            result = TimescaleService.execute_query(query, (hours,))
            
            if result and len(result) > 0:
                metrics = []
                for row in result:
                    metrics.append({
                        "timestamp": row[0].isoformat(),
                        "value": float(row[1]) if row[1] else 0
                    })
                return {"metrics": metrics}
            else:
                return {"metrics": []}
        except Exception as e:
            logger.warning(f"TimescaleDB query failed, using mock data: {e}")
        
        # Fallback to mock data
        return {"metrics": _generate_request_rate_data(hours)}
        
    except Exception as e:
        logger.error(f"Error fetching request rate: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch request rate data")

@router.get("/response-time")
async def get_response_time(timeRange: str = Query("24h", description="Time range: 1h, 24h, 7d, 30d")):
    """Get response time metrics (p95) over time"""
    try:
        hours = _parse_time_range(timeRange)
        
        # Try to get real data from TimescaleDB
        try:
            query = """
            SELECT time_bucket('5 minutes', timestamp) as bucket,
                   percentile_cont(0.95) WITHIN GROUP (ORDER BY response_time_ms) as p95_response_time
            FROM performance_metrics 
            WHERE timestamp >= NOW() - INTERVAL '%s hours'
            GROUP BY bucket
            ORDER BY bucket;
            """
            
            result = TimescaleService.execute_query(query, (hours,))
            
            if result and len(result) > 0:
                metrics = []
                for row in result:
                    metrics.append({
                        "timestamp": row[0].isoformat(),
                        "value": float(row[1]) if row[1] else 0
                    })
                return {"metrics": metrics}
            else:
                return {"metrics": []}
        except Exception as e:
            logger.warning(f"TimescaleDB query failed, using mock data: {e}")
        
        # Fallback to mock data
        return {"metrics": _generate_response_time_data(hours)}
        
    except Exception as e:
        logger.error(f"Error fetching response time: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch response time data")

@router.get("/error-rate")
async def get_error_rate(timeRange: str = Query("24h", description="Time range: 1h, 24h, 7d, 30d")):
    """Get error rate metrics over time"""
    try:
        hours = _parse_time_range(timeRange)
        
        # Try to get real data from TimescaleDB
        try:
            query = """
            SELECT time_bucket('5 minutes', timestamp) as bucket,
                   AVG(error_rate) as avg_error_rate
            FROM performance_metrics 
            WHERE timestamp >= NOW() - INTERVAL '%s hours'
            GROUP BY bucket
            ORDER BY bucket;
            """
            
            result = TimescaleService.execute_query(query, (hours,))
            
            if result and len(result) > 0:
                metrics = []
                for row in result:
                    metrics.append({
                        "timestamp": row[0].isoformat(),
                        "value": float(row[1]) if row[1] else 0
                    })
                return {"metrics": metrics}
            else:
                return {"metrics": []}
        except Exception as e:
            logger.warning(f"TimescaleDB query failed, using mock data: {e}")
        
        # Fallback to mock data
        return {"metrics": _generate_error_rate_data(hours)}
        
    except Exception as e:
        logger.error(f"Error fetching error rate: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch error rate data")

@router.get("/saturation")
async def get_saturation():
    """Get current CPU and memory saturation"""
    try:
        # Try to get real data from TimescaleDB
        try:
            query = """
            SELECT AVG(cpu_utilization) as avg_cpu,
                   AVG(memory_utilization) as avg_memory
            FROM system_metrics 
            WHERE timestamp >= NOW() - INTERVAL '5 minutes';
            """
            
            result = TimescaleService.execute_query(query)
            
            if result and len(result) > 0:
                row = result[0]
                return {
                    "cpu": int(row[0]) if row[0] else 0,
                    "memory": int(row[1]) if row[1] else 0
                }
            else:
                return {
                    "cpu": random.randint(70, 90),
                    "memory": random.randint(60, 80)
                }
        except Exception as e:
            logger.warning(f"TimescaleDB query failed, using mock data: {e}")
        
        # Fallback to mock data
        return {
            "cpu": random.randint(70, 90),
            "memory": random.randint(60, 80)
        }
        
    except Exception as e:
        logger.error(f"Error fetching saturation: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch saturation data")

@router.get("/alerts")
async def get_performance_alerts():
    """Get active performance alerts"""
    try:
        # In production, this would query alert management system
        # For POC, return realistic mock alerts
        alerts = [
            {
                "id": "alert-cpu-01",
                "severity": "warning",
                "title": "High CPU on prod-db-01 (87%)",
                "description": "Database server experiencing sustained high CPU utilization",
                "value": "87%",
                "threshold": "> 85%",
                "status": "active"
            },
            {
                "id": "alert-disk-01", 
                "severity": "warning",
                "title": "Disk space warning on logs-02 (85%)",
                "description": "Log server disk usage approaching critical threshold",
                "value": "85%",
                "threshold": "> 80%",
                "status": "active"
            },
            {
                "id": "alert-latency-01",
                "severity": "critical",
                "title": "API latency spike detected (>500ms)",
                "description": "Trading API response times exceeding SLA threshold",
                "value": "743ms",
                "threshold": "> 500ms",
                "status": "active"
            },
            {
                "id": "alert-memory-01",
                "severity": "info",
                "title": "Memory usage trending up on app-cluster",
                "description": "Application cluster showing gradual memory increase",
                "value": "74%",
                "threshold": "> 80%",
                "status": "resolved"
            }
        ]
        
        return {"alerts": alerts}
        
    except Exception as e:
        logger.error(f"Error fetching alerts: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch alerts")

def _parse_time_range(time_range: str) -> int:
    """Convert time range string to hours"""
    time_map = {
        "1h": 1,
        "24h": 24,
        "7d": 168,  # 7 * 24
        "30d": 720  # 30 * 24
    }
    return time_map.get(time_range, 24)

def _generate_request_rate_data(hours: int) -> List[Dict]:
    """Generate realistic request rate data with business hours patterns"""
    points = min(hours * 12, 288)  # 5-minute intervals, max 24 hours
    data = []
    
    now = datetime.now()
    
    for i in range(points):
        timestamp = now - timedelta(minutes=i * 5)
        
        # Business hours pattern (higher during 9-5)
        hour = timestamp.hour
        business_multiplier = 1.5 if 9 <= hour <= 17 else 0.7
        
        # Base rate with some noise
        base_rate = 45000  # 45K req/s base
        noise = random.uniform(0.8, 1.2)
        spike = 1.8 if random.random() < 0.05 else 1.0  # 5% chance of spike
        
        value = base_rate * business_multiplier * noise * spike
        
        data.append({
            "timestamp": timestamp.isoformat(),
            "value": int(value)
        })
    
    return list(reversed(data))

def _generate_response_time_data(hours: int) -> List[Dict]:
    """Generate realistic response time data"""
    points = min(hours * 12, 288)
    data = []
    
    now = datetime.now()
    
    for i in range(points):
        timestamp = now - timedelta(minutes=i * 5)
        
        # Base response time with load correlation
        base_time = 120  # 120ms base
        load_factor = random.uniform(0.8, 1.4)
        spike = 3.0 if random.random() < 0.03 else 1.0  # 3% chance of latency spike
        
        value = base_time * load_factor * spike
        
        data.append({
            "timestamp": timestamp.isoformat(),
            "value": value
        })
    
    return list(reversed(data))

def _generate_error_rate_data(hours: int) -> List[Dict]:
    """Generate realistic error rate data"""
    points = min(hours * 12, 288)
    data = []
    
    now = datetime.now()
    
    for i in range(points):
        timestamp = now - timedelta(minutes=i * 5)
        
        # Very low base error rate with occasional spikes
        base_rate = 0.0002  # 0.02% base
        spike = 0.02 if random.random() < 0.02 else 1.0  # 2% chance of error spike
        noise = random.uniform(0.5, 1.5)
        
        value = base_rate * spike * noise
        
        data.append({
            "timestamp": timestamp.isoformat(),
            "value": value
        })
    
    return list(reversed(data))