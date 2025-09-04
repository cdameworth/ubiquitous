from fastapi import APIRouter, HTTPException, BackgroundTasks
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
import asyncio
import json
import uuid
from pydantic import BaseModel

# Import Redis for state management
from app.database import get_redis_client

router = APIRouter(prefix="/api/demo/scenarios", tags=["Demo Scenarios"])

# Pydantic models for request/response
class ScenarioStartRequest(BaseModel):
    auto_advance: bool = True
    step_duration: int = 30  # seconds per step
    presenter_mode: bool = False

class ScenarioControlRequest(BaseModel):
    action: str  # start, pause, resume, stop, jump
    step_index: Optional[int] = None

class ScenarioResponse(BaseModel):
    success: bool
    message: str
    scenario_id: Optional[str] = None
    current_step: Optional[int] = None

# Global scenario state management
class ScenarioOrchestrator:
    def __init__(self):
        self.active_scenarios: Dict[str, Dict[str, Any]] = {}
        self.scenario_tasks: Dict[str, asyncio.Task] = {}
        
    async def start_scenario(self, scenario_id: str, config: ScenarioStartRequest) -> ScenarioResponse:
        if scenario_id in self.active_scenarios:
            return ScenarioResponse(
                success=False, 
                message=f"Scenario {scenario_id} is already running"
            )
        
        # Initialize scenario state
        scenario_state = {
            "id": scenario_id,
            "status": "running",
            "current_step": 0,
            "total_steps": self._get_scenario_step_count(scenario_id),
            "start_time": datetime.utcnow(),
            "elapsed_time": 0,
            "config": config.dict(),
            "session_id": str(uuid.uuid4())
        }
        
        self.active_scenarios[scenario_id] = scenario_state
        
        # Store in Redis for persistence
        redis_client = get_redis_client()
        redis_client.setex(
            f"scenario:{scenario_id}", 
            3600,  # 1 hour expiry
            json.dumps(scenario_state, default=str)
        )
        
        # Start background task for scenario progression
        if config.auto_advance:
            task = asyncio.create_task(
                self._run_scenario_progression(scenario_id, config.step_duration)
            )
            self.scenario_tasks[scenario_id] = task
        
        return ScenarioResponse(
            success=True,
            message=f"Scenario {scenario_id} started successfully",
            scenario_id=scenario_id,
            current_step=0
        )
    
    async def control_scenario(self, scenario_id: str, control: ScenarioControlRequest) -> ScenarioResponse:
        if scenario_id not in self.active_scenarios:
            return ScenarioResponse(
                success=False,
                message=f"Scenario {scenario_id} is not active"
            )
        
        scenario = self.active_scenarios[scenario_id]
        
        if control.action == "pause":
            scenario["status"] = "paused"
            # Cancel progression task if running
            if scenario_id in self.scenario_tasks:
                self.scenario_tasks[scenario_id].cancel()
                del self.scenario_tasks[scenario_id]
                
        elif control.action == "resume":
            scenario["status"] = "running"
            # Restart progression task
            config = ScenarioStartRequest(**scenario["config"])
            if config.auto_advance:
                task = asyncio.create_task(
                    self._run_scenario_progression(scenario_id, config.step_duration)
                )
                self.scenario_tasks[scenario_id] = task
                
        elif control.action == "stop":
            scenario["status"] = "stopped"
            # Cancel progression task
            if scenario_id in self.scenario_tasks:
                self.scenario_tasks[scenario_id].cancel()
                del self.scenario_tasks[scenario_id]
            # Remove from active scenarios
            del self.active_scenarios[scenario_id]
            # Remove from Redis
            redis_client = get_redis_client()
            redis_client.delete(f"scenario:{scenario_id}")
            
        elif control.action == "jump" and control.step_index is not None:
            if 0 <= control.step_index < scenario["total_steps"]:
                scenario["current_step"] = control.step_index
                # Broadcast step update immediately
                await self._broadcast_step_update(scenario_id, control.step_index)
            else:
                return ScenarioResponse(
                    success=False,
                    message=f"Invalid step index: {control.step_index}"
                )
        
        # Update Redis
        redis_client = get_redis_client()
        redis_client.setex(
            f"scenario:{scenario_id}", 
            3600,
            json.dumps(scenario, default=str)
        )
        
        return ScenarioResponse(
            success=True,
            message=f"Scenario {scenario_id} {control.action} successful",
            scenario_id=scenario_id,
            current_step=scenario["current_step"]
        )
    
    async def get_scenario_status(self, scenario_id: str) -> Optional[Dict[str, Any]]:
        if scenario_id in self.active_scenarios:
            return self.active_scenarios[scenario_id]
        
        # Check Redis for persistent state
        redis_client = get_redis_client()
        cached_state = redis_client.get(f"scenario:{scenario_id}")
        if cached_state:
            return json.loads(cached_state)
        
        return None
    
    async def get_all_scenarios_status(self) -> List[Dict[str, Any]]:
        return list(self.active_scenarios.values())
    
    def _get_scenario_step_count(self, scenario_id: str) -> int:
        step_counts = {
            "trading-crisis": 8,
            "cost-spiral": 6,
            "security-breach": 7,
            "executive-value": 5
        }
        return step_counts.get(scenario_id, 5)
    
    async def _run_scenario_progression(self, scenario_id: str, step_duration: int):
        """Background task to automatically advance scenario steps"""
        try:
            while scenario_id in self.active_scenarios:
                scenario = self.active_scenarios[scenario_id]
                
                if scenario["status"] != "running":
                    await asyncio.sleep(1)
                    continue
                
                # Wait for step duration
                await asyncio.sleep(step_duration)
                
                # Advance to next step
                if scenario["current_step"] < scenario["total_steps"] - 1:
                    scenario["current_step"] += 1
                    scenario["elapsed_time"] = int((datetime.utcnow() - datetime.fromisoformat(scenario["start_time"])).total_seconds())
                    
                    # Broadcast step update
                    await self._broadcast_step_update(scenario_id, scenario["current_step"])
                    
                    # Update Redis
                    redis_client = get_redis_client()
                    redis_client.setex(
                        f"scenario:{scenario_id}", 
                        3600,
                        json.dumps(scenario, default=str)
                    )
                else:
                    # Scenario completed
                    scenario["status"] = "completed"
                    await self._broadcast_scenario_complete(scenario_id)
                    break
                    
        except asyncio.CancelledError:
            # Task was cancelled (pause/stop)
            pass
        except Exception as e:
            print(f"Error in scenario progression for {scenario_id}: {e}")
    
    async def _broadcast_step_update(self, scenario_id: str, step_index: int):
        """Broadcast step update to all WebSocket connections"""
        update_data = {
            "type": "scenario_update",
            "scenarioId": scenario_id,
            "stepIndex": step_index,
            "timestamp": datetime.utcnow().isoformat(),
            "step": self._get_step_data(scenario_id, step_index)
        }
        
        # Import manager from main app - use global reference
        import app.main as main_module
        await main_module.manager.broadcast(json.dumps(update_data))
    
    async def _broadcast_scenario_complete(self, scenario_id: str):
        """Broadcast scenario completion"""
        completion_data = {
            "type": "scenario_complete",
            "scenarioId": scenario_id,
            "timestamp": datetime.utcnow().isoformat(),
            "summary": self._get_scenario_summary(scenario_id)
        }
        
        import app.main as main_module
        await main_module.manager.broadcast(json.dumps(completion_data))
    
    def _get_step_data(self, scenario_id: str, step_index: int) -> Dict[str, Any]:
        """Get specific step data with metrics and updates"""
        step_data_map = {
            "trading-crisis": [
                {
                    "metrics": {"requests_per_second": 2800, "cpu_utilization": 45, "error_rate": 0.2},
                    "impact": {"financial": 350000, "systems": "EKS Cluster Alpha"}
                },
                {
                    "metrics": {"requests_per_second": 3200, "cpu_utilization": 65, "error_rate": 2.1},
                    "impact": {"financial": 750000, "systems": "Trading API Gateway"}
                },
                {
                    "metrics": {"requests_per_second": 4100, "cpu_utilization": 85, "error_rate": 8.7},
                    "impact": {"financial": 1200000, "systems": "Order Processing"}
                },
                {
                    "metrics": {"requests_per_second": 4800, "cpu_utilization": 92, "error_rate": 15.3},
                    "impact": {"financial": 1800000, "systems": "Critical Trading Systems"}
                },
                {
                    "metrics": {"requests_per_second": 4200, "cpu_utilization": 78, "error_rate": 9.2},
                    "impact": {"financial": 1500000, "systems": "Auto-scaling Initiated"}
                },
                {
                    "metrics": {"requests_per_second": 3600, "cpu_utilization": 58, "error_rate": 3.1},
                    "impact": {"financial": 950000, "systems": "Capacity Increased"}
                },
                {
                    "metrics": {"requests_per_second": 2900, "cpu_utilization": 42, "error_rate": 0.8},
                    "impact": {"financial": 400000, "systems": "Systems Stabilizing"}
                },
                {
                    "metrics": {"requests_per_second": 2500, "cpu_utilization": 35, "error_rate": 0.1},
                    "impact": {"financial": 2100000, "systems": "Full Recovery Complete"}
                }
            ],
            "cost-spiral": [
                {
                    "metrics": {"totalMonthlyCost": 1450000, "costIncrease": 52.1, "optimizationPotential": 890000},
                    "impact": {"financial": 120000, "systems": "EC2 Analysis"}
                },
                {
                    "metrics": {"totalMonthlyCost": 1380000, "costIncrease": 47.8, "optimizationPotential": 850000},
                    "impact": {"financial": 280000, "systems": "RDS Optimization"}
                },
                {
                    "metrics": {"totalMonthlyCost": 1290000, "costIncrease": 42.3, "optimizationPotential": 780000},
                    "impact": {"financial": 450000, "systems": "S3 Lifecycle Policies"}
                },
                {
                    "metrics": {"totalMonthlyCost": 1180000, "costIncrease": 35.1, "optimizationPotential": 650000},
                    "impact": {"financial": 620000, "systems": "Lambda Memory Optimization"}
                },
                {
                    "metrics": {"totalMonthlyCost": 1050000, "costIncrease": 26.7, "optimizationPotential": 480000},
                    "impact": {"financial": 720000, "systems": "VPC Endpoint Consolidation"}
                },
                {
                    "metrics": {"totalMonthlyCost": 920000, "costIncrease": 15.2, "optimizationPotential": 280000},
                    "impact": {"financial": 780000, "systems": "Full Optimization Complete"}
                }
            ],
            "security-breach": [
                {
                    "metrics": {"riskScore": 92, "criticalVulns": 5, "exposedServices": 15},
                    "impact": {"financial": 850000, "systems": "Initial Threat Detection"}
                },
                {
                    "metrics": {"riskScore": 87, "criticalVulns": 4, "exposedServices": 12},
                    "impact": {"financial": 1200000, "systems": "Vulnerability Assessment"}
                },
                {
                    "metrics": {"riskScore": 78, "criticalVulns": 3, "exposedServices": 10},
                    "impact": {"financial": 2100000, "systems": "Critical Path Analysis"}
                },
                {
                    "metrics": {"riskScore": 65, "criticalVulns": 2, "exposedServices": 7},
                    "impact": {"financial": 3400000, "systems": "Containment Actions"}
                },
                {
                    "metrics": {"riskScore": 45, "criticalVulns": 1, "exposedServices": 4},
                    "impact": {"financial": 4800000, "systems": "Patch Deployment"}
                },
                {
                    "metrics": {"riskScore": 28, "criticalVulns": 0, "exposedServices": 2},
                    "impact": {"financial": 5600000, "systems": "Security Hardening"}
                },
                {
                    "metrics": {"riskScore": 15, "criticalVulns": 0, "exposedServices": 0},
                    "impact": {"financial": 6080000, "systems": "Full Security Restoration"}
                }
            ],
            "executive-value": [
                {
                    "metrics": {"totalAnnualValue": 12400000, "roiPercentage": 85},
                    "impact": {"financial": 12400000, "systems": "Cost Optimization Value"}
                },
                {
                    "metrics": {"totalAnnualValue": 24800000, "roiPercentage": 165},
                    "impact": {"financial": 24800000, "systems": "Risk Mitigation Value"}
                },
                {
                    "metrics": {"totalAnnualValue": 32100000, "roiPercentage": 215},
                    "impact": {"financial": 32100000, "systems": "Operational Efficiency Value"}
                },
                {
                    "metrics": {"totalAnnualValue": 38900000, "roiPercentage": 285},
                    "impact": {"financial": 38900000, "systems": "Innovation Acceleration Value"}
                },
                {
                    "metrics": {"totalAnnualValue": 41600000, "roiPercentage": 340},
                    "impact": {"financial": 41600000, "systems": "Complete Platform Value"}
                }
            ]
        }
        
        return step_data_map.get(scenario_id, [{}])[min(step_index, len(step_data_map.get(scenario_id, [])) - 1)]
    
    def _get_scenario_summary(self, scenario_id: str) -> Dict[str, Any]:
        """Get scenario completion summary"""
        summaries = {
            "trading-crisis": {
                "title": "Trading Crisis Resolution Complete",
                "total_value": 2100000,
                "key_metrics": ["6m 45s resolution", "12,847 trades protected", "73% MTTR improvement"],
                "business_impact": "Critical trading system failure resolved with zero revenue loss"
            },
            "cost-spiral": {
                "title": "AWS Cost Optimization Complete", 
                "total_value": 780000,
                "key_metrics": ["$780K monthly savings", "47 services optimized", "3-month ROI"],
                "business_impact": "Infrastructure costs reduced by 42% through intelligent optimization"
            },
            "security-breach": {
                "title": "Security Breach Response Complete",
                "total_value": 6080000,
                "key_metrics": ["18h response time", "47 vulnerabilities fixed", "98% compliance"],
                "business_impact": "Critical security vulnerabilities resolved, $6.08M breach cost avoided"
            },
            "executive-value": {
                "title": "Executive Value Demonstration Complete",
                "total_value": 41600000,
                "key_metrics": ["$41.6M annual value", "340% ROI", "18-month payback"],
                "business_impact": "Comprehensive platform value validated across all business dimensions"
            }
        }
        return summaries.get(scenario_id, {})

# Global orchestrator instance
orchestrator = ScenarioOrchestrator()

# API Endpoints
@router.post("/{scenario_id}/start")
async def start_scenario(scenario_id: str, config: ScenarioStartRequest = ScenarioStartRequest()):
    """Start a demo scenario with real-time progression"""
    try:
        result = await orchestrator.start_scenario(scenario_id, config)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start scenario: {str(e)}")

@router.post("/{scenario_id}/control")
async def control_scenario(scenario_id: str, control: ScenarioControlRequest):
    """Control scenario execution (pause, resume, stop, jump)"""
    try:
        result = await orchestrator.control_scenario(scenario_id, control)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to control scenario: {str(e)}")

@router.get("/{scenario_id}/status")
async def get_scenario_status(scenario_id: str):
    """Get current status of a specific scenario"""
    try:
        status = await orchestrator.get_scenario_status(scenario_id)
        if status:
            return {
                "success": True,
                "scenario": status
            }
        else:
            return {
                "success": False,
                "message": f"Scenario {scenario_id} not found or not active"
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get scenario status: {str(e)}")

@router.get("/")
async def get_all_scenarios_status():
    """Get status of all active scenarios"""
    try:
        scenarios = await orchestrator.get_all_scenarios_status()
        return {
            "success": True,
            "scenarios": scenarios,
            "total_active": len(scenarios)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get scenarios status: {str(e)}")

@router.post("/batch/start")
async def start_all_scenarios():
    """Start all available demo scenarios for presentation mode"""
    try:
        scenario_ids = ["cost-spiral", "security-breach", "executive-value"]  # Skip trading-crisis as it's already running
        results = []
        
        for scenario_id in scenario_ids:
            # Skip if already running
            if scenario_id in orchestrator.active_scenarios:
                results.append({
                    "scenario_id": scenario_id, 
                    "result": ScenarioResponse(success=False, message=f"Scenario {scenario_id} already running")
                })
                continue
                
            config = ScenarioStartRequest(
                auto_advance=True,
                step_duration=45,  # Longer duration for presentation
                presenter_mode=True
            )
            result = await orchestrator.start_scenario(scenario_id, config)
            results.append({"scenario_id": scenario_id, "result": result.dict()})
            
            # Stagger starts for better presentation flow
            await asyncio.sleep(2)
        
        return {
            "success": True,
            "message": f"Started {len([r for r in results if r['result']['success']])} new scenarios",
            "results": results
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start all scenarios: {str(e)}")

@router.post("/batch/stop")
async def stop_all_scenarios():
    """Stop all active scenarios"""
    try:
        active_scenarios = list(orchestrator.active_scenarios.keys())
        results = []
        
        for scenario_id in active_scenarios:
            control = ScenarioControlRequest(action="stop")
            result = await orchestrator.control_scenario(scenario_id, control)
            results.append({"scenario_id": scenario_id, "result": result})
        
        return {
            "success": True,
            "message": f"Stopped {len(active_scenarios)} scenarios",
            "results": results
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to stop all scenarios: {str(e)}")

@router.post("/batch/pause")
async def pause_all_scenarios():
    """Pause all active scenarios"""
    try:
        active_scenarios = [
            scenario_id for scenario_id, scenario in orchestrator.active_scenarios.items()
            if scenario["status"] == "running"
        ]
        results = []
        
        for scenario_id in active_scenarios:
            control = ScenarioControlRequest(action="pause")
            result = await orchestrator.control_scenario(scenario_id, control)
            results.append({"scenario_id": scenario_id, "result": result})
        
        return {
            "success": True,
            "message": f"Paused {len(active_scenarios)} scenarios",
            "results": results
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to pause all scenarios: {str(e)}")

@router.post("/batch/resume")
async def resume_all_scenarios():
    """Resume all paused scenarios"""
    try:
        paused_scenarios = [
            scenario_id for scenario_id, scenario in orchestrator.active_scenarios.items()
            if scenario["status"] == "paused"
        ]
        results = []
        
        for scenario_id in paused_scenarios:
            control = ScenarioControlRequest(action="resume")
            result = await orchestrator.control_scenario(scenario_id, control)
            results.append({"scenario_id": scenario_id, "result": result})
        
        return {
            "success": True,
            "message": f"Resumed {len(paused_scenarios)} scenarios",
            "results": results
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to resume all scenarios: {str(e)}")

# Advanced presenter controls
@router.post("/presenter/sync-to-step")
async def sync_all_to_step(step_index: int):
    """Sync all active scenarios to the same step for coordinated presentation"""
    try:
        active_scenarios = list(orchestrator.active_scenarios.keys())
        results = []
        
        for scenario_id in active_scenarios:
            control = ScenarioControlRequest(action="jump", step_index=step_index)
            result = await orchestrator.control_scenario(scenario_id, control)
            results.append({"scenario_id": scenario_id, "result": result})
        
        return {
            "success": True,
            "message": f"Synced {len(active_scenarios)} scenarios to step {step_index}",
            "results": results
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to sync scenarios: {str(e)}")

@router.get("/presenter/metrics")
async def get_presentation_metrics():
    """Get comprehensive metrics for presentation mode"""
    try:
        active_scenarios = await orchestrator.get_all_scenarios_status()
        
        total_value = sum([
            2100000,  # trading-crisis
            780000 * 12,  # cost-spiral annual
            6080000,  # security-breach
            41600000  # executive-value
        ])
        
        return {
            "success": True,
            "metrics": {
                "total_demo_value": total_value,
                "active_scenarios": len(active_scenarios),
                "scenarios_running": len([s for s in active_scenarios if s["status"] == "running"]),
                "scenarios_paused": len([s for s in active_scenarios if s["status"] == "paused"]),
                "total_steps_completed": sum([s["current_step"] for s in active_scenarios]),
                "credibility_score": 94,
                "audience_engagement": min(len(active_scenarios) * 25 + 10, 100)
            },
            "scenario_details": active_scenarios
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get presentation metrics: {str(e)}")

# WebSocket message handler for scenario commands
async def handle_scenario_websocket_message(websocket, message_data: Dict[str, Any]):
    """Handle WebSocket messages related to scenario control"""
    try:
        message_type = message_data.get("type")
        scenario_id = message_data.get("scenarioId")
        
        if message_type == "start_scenario" and scenario_id:
            config = ScenarioStartRequest()
            result = await orchestrator.start_scenario(scenario_id, config)
            
        elif message_type == "pause_scenario" and scenario_id:
            control = ScenarioControlRequest(action="pause")
            result = await orchestrator.control_scenario(scenario_id, control)
            
        elif message_type == "resume_scenario" and scenario_id:
            control = ScenarioControlRequest(action="resume")
            result = await orchestrator.control_scenario(scenario_id, control)
            
        elif message_type == "stop_scenario" and scenario_id:
            control = ScenarioControlRequest(action="stop")
            result = await orchestrator.control_scenario(scenario_id, control)
            
        elif message_type == "jump_to_step" and scenario_id:
            step_index = message_data.get("stepIndex", 0)
            control = ScenarioControlRequest(action="jump", step_index=step_index)
            result = await orchestrator.control_scenario(scenario_id, control)
            
        # Send acknowledgment back to client
        await websocket.send_text(json.dumps({
            "type": "scenario_command_ack",
            "original_message": message_type,
            "scenario_id": scenario_id,
            "timestamp": datetime.utcnow().isoformat()
        }))
        
    except Exception as e:
        await websocket.send_text(json.dumps({
            "type": "error",
            "message": f"Error handling scenario command: {str(e)}",
            "timestamp": datetime.utcnow().isoformat()
        }))