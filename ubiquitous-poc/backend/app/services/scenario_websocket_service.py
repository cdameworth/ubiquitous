"""
WebSocket service for real-time scenario management and event broadcasting
"""

import asyncio
import json
from typing import Dict, Any, List, Set
from datetime import datetime
from fastapi import WebSocket
import logging

logger = logging.getLogger(__name__)

class ScenarioWebSocketService:
    """Service for managing WebSocket connections and scenario event broadcasting"""
    
    def __init__(self):
        self.connections: Set[WebSocket] = set()
        self.subscribers: Dict[str, Set[WebSocket]] = {}
        self.connection_metadata: Dict[WebSocket, Dict[str, Any]] = {}
    
    async def add_connection(self, websocket: WebSocket, client_info: Dict[str, Any] = None):
        """Add a new WebSocket connection"""
        self.connections.add(websocket)
        self.connection_metadata[websocket] = {
            "connected_at": datetime.utcnow(),
            "client_info": client_info or {},
            "subscriptions": set()
        }
        logger.info(f"WebSocket connection added. Total connections: {len(self.connections)}")
    
    async def remove_connection(self, websocket: WebSocket):
        """Remove a WebSocket connection and clean up subscriptions"""
        if websocket in self.connections:
            self.connections.remove(websocket)
            
            # Remove from all subscriptions
            metadata = self.connection_metadata.get(websocket, {})
            subscriptions = metadata.get("subscriptions", set())
            
            for event_type in subscriptions:
                if event_type in self.subscribers:
                    self.subscribers[event_type].discard(websocket)
                    if not self.subscribers[event_type]:
                        del self.subscribers[event_type]
            
            # Remove metadata
            if websocket in self.connection_metadata:
                del self.connection_metadata[websocket]
            
            logger.info(f"WebSocket connection removed. Total connections: {len(self.connections)}")
    
    async def subscribe_to_event(self, websocket: WebSocket, event_type: str):
        """Subscribe a WebSocket connection to specific event types"""
        if event_type not in self.subscribers:
            self.subscribers[event_type] = set()
        
        self.subscribers[event_type].add(websocket)
        
        # Update connection metadata
        if websocket in self.connection_metadata:
            self.connection_metadata[websocket]["subscriptions"].add(event_type)
        
        logger.info(f"Connection subscribed to {event_type}. Subscribers: {len(self.subscribers[event_type])}")
    
    async def unsubscribe_from_event(self, websocket: WebSocket, event_type: str):
        """Unsubscribe a WebSocket connection from specific event types"""
        if event_type in self.subscribers:
            self.subscribers[event_type].discard(websocket)
            if not self.subscribers[event_type]:
                del self.subscribers[event_type]
        
        # Update connection metadata
        if websocket in self.connection_metadata:
            self.connection_metadata[websocket]["subscriptions"].discard(event_type)
        
        logger.info(f"Connection unsubscribed from {event_type}")
    
    async def broadcast_to_all(self, message: Dict[str, Any]):
        """Broadcast message to all connected WebSocket clients"""
        if not self.connections:
            return
        
        message_json = json.dumps(message, default=str)
        disconnected = set()
        
        for websocket in self.connections:
            try:
                await websocket.send_text(message_json)
            except Exception as e:
                logger.warning(f"Failed to send message to WebSocket: {e}")
                disconnected.add(websocket)
        
        # Clean up disconnected clients
        for websocket in disconnected:
            await self.remove_connection(websocket)
    
    async def broadcast_to_subscribers(self, event_type: str, message: Dict[str, Any]):
        """Broadcast message to subscribers of a specific event type"""
        if event_type not in self.subscribers:
            return
        
        message["type"] = event_type
        message_json = json.dumps(message, default=str)
        disconnected = set()
        
        for websocket in self.subscribers[event_type]:
            try:
                await websocket.send_text(message_json)
            except Exception as e:
                logger.warning(f"Failed to send {event_type} message to subscriber: {e}")
                disconnected.add(websocket)
        
        # Clean up disconnected clients
        for websocket in disconnected:
            await self.remove_connection(websocket)
    
    async def send_to_connection(self, websocket: WebSocket, message: Dict[str, Any]):
        """Send message to a specific WebSocket connection"""
        try:
            message_json = json.dumps(message, default=str)
            await websocket.send_text(message_json)
        except Exception as e:
            logger.warning(f"Failed to send message to specific connection: {e}")
            await self.remove_connection(websocket)
    
    async def broadcast_scenario_update(self, scenario_id: str, step_index: int, step_data: Dict[str, Any]):
        """Broadcast scenario step update to all connections"""
        update_message = {
            "type": "scenario_update",
            "scenarioId": scenario_id,
            "stepIndex": step_index,
            "timestamp": datetime.utcnow().isoformat(),
            "step": step_data,
            "isRunning": True,
            "isPaused": False
        }
        
        await self.broadcast_to_all(update_message)
        logger.info(f"Broadcasted scenario update for {scenario_id}, step {step_index}")
    
    async def broadcast_scenario_control(self, scenario_id: str, action: str, current_step: int = 0):
        """Broadcast scenario control event (start, pause, resume, stop)"""
        control_message = {
            "type": "scenario_control",
            "scenarioId": scenario_id,
            "action": action,
            "currentStep": current_step,
            "timestamp": datetime.utcnow().isoformat(),
            "isRunning": action in ["start", "resume"],
            "isPaused": action == "pause"
        }
        
        await self.broadcast_to_all(control_message)
        logger.info(f"Broadcasted scenario control: {scenario_id} - {action}")
    
    async def broadcast_metrics_update(self, metrics_type: str, metrics_data: Dict[str, Any]):
        """Broadcast real-time metrics updates"""
        metrics_message = {
            "type": "metrics_update",
            "metricsType": metrics_type,
            "data": metrics_data,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        await self.broadcast_to_subscribers("metrics_update", metrics_message)
    
    async def broadcast_alert(self, alert_type: str, severity: str, message: str, context: Dict[str, Any] = None):
        """Broadcast system alerts and notifications"""
        alert_message = {
            "type": "alert",
            "alertType": alert_type,
            "severity": severity,
            "message": message,
            "context": context or {},
            "timestamp": datetime.utcnow().isoformat()
        }
        
        await self.broadcast_to_subscribers("alert", alert_message)
        logger.info(f"Broadcasted {severity} alert: {alert_type}")
    
    def get_connection_stats(self) -> Dict[str, Any]:
        """Get statistics about current WebSocket connections"""
        subscriber_counts = {
            event_type: len(subscribers) 
            for event_type, subscribers in self.subscribers.items()
        }
        
        return {
            "total_connections": len(self.connections),
            "subscribers_by_event": subscriber_counts,
            "total_subscriptions": sum(subscriber_counts.values()),
            "active_events": list(self.subscribers.keys())
        }

# Global service instance
websocket_service = ScenarioWebSocketService()

# Real-time metrics generation task
class MetricsGenerator:
    """Generate realistic real-time metrics for demo scenarios"""
    
    def __init__(self, websocket_service: ScenarioWebSocketService):
        self.websocket_service = websocket_service
        self.metrics_task: asyncio.Task = None
        self.is_running = False
    
    async def start_metrics_generation(self):
        """Start background metrics generation"""
        if self.is_running:
            return
        
        self.is_running = True
        self.metrics_task = asyncio.create_task(self._generate_metrics_loop())
        logger.info("Started real-time metrics generation")
    
    async def stop_metrics_generation(self):
        """Stop background metrics generation"""
        self.is_running = False
        if self.metrics_task:
            self.metrics_task.cancel()
            try:
                await self.metrics_task
            except asyncio.CancelledError:
                pass
        logger.info("Stopped real-time metrics generation")
    
    async def _generate_metrics_loop(self):
        """Background loop for generating and broadcasting metrics"""
        try:
            while self.is_running:
                # Generate system metrics
                system_metrics = {
                    "cpu_utilization": round(random.uniform(30, 95), 1),
                    "memory_usage": round(random.uniform(45, 85), 1),
                    "network_throughput": round(random.uniform(850, 1200), 1),
                    "active_connections": random.randint(150, 320),
                    "requests_per_second": random.randint(2200, 4800),
                    "response_time": round(random.uniform(25, 180), 1),
                    "error_rate": round(random.uniform(0.1, 12.5), 2)
                }
                
                await self.websocket_service.broadcast_metrics_update("system", system_metrics)
                
                # Generate trading-specific metrics
                trading_metrics = {
                    "orders_per_second": random.randint(450, 890),
                    "trade_volume": round(random.uniform(2.1, 15.7), 2),  # millions
                    "latency_p99": round(random.uniform(12, 89), 1),
                    "market_data_lag": round(random.uniform(0.1, 2.3), 1),
                    "risk_exposure": round(random.uniform(0.8, 4.2), 2)  # millions
                }
                
                await self.websocket_service.broadcast_metrics_update("trading", trading_metrics)
                
                # Generate cost metrics
                import random
                cost_metrics = {
                    "daily_spend": round(random.uniform(38000, 52000), 0),
                    "efficiency_score": round(random.uniform(65, 89), 1),
                    "waste_detected": round(random.uniform(12000, 28000), 0),
                    "optimization_opportunities": random.randint(15, 47)
                }
                
                await self.websocket_service.broadcast_metrics_update("cost", cost_metrics)
                
                # Generate security metrics
                security_metrics = {
                    "threat_level": random.choice(["low", "medium", "high"]),
                    "active_scans": random.randint(5, 23),
                    "vulnerabilities_found": random.randint(0, 8),
                    "compliance_score": round(random.uniform(82, 96), 1),
                    "incidents_today": random.randint(0, 3)
                }
                
                await self.websocket_service.broadcast_metrics_update("security", security_metrics)
                
                # Wait before next update
                await asyncio.sleep(8)  # Update every 8 seconds
                
        except asyncio.CancelledError:
            logger.info("Metrics generation task cancelled")
        except Exception as e:
            logger.error(f"Error in metrics generation: {e}")

# Global metrics generator
metrics_generator = MetricsGenerator(websocket_service)

# Enhanced WebSocket message handler
async def handle_scenario_websocket_message(websocket: WebSocket, message_data: Dict[str, Any]):
    """Enhanced WebSocket message handler for scenario control"""
    try:
        message_type = message_data.get("type")
        scenario_id = message_data.get("scenarioId")
        
        if message_type == "start_scenario" and scenario_id:
            config = ScenarioStartRequest(
                auto_advance=message_data.get("autoAdvance", True),
                step_duration=message_data.get("stepDuration", 30),
                presenter_mode=message_data.get("presenterMode", False)
            )
            result = await orchestrator.start_scenario(scenario_id, config)
            
            # Start metrics generation if first scenario
            if len(orchestrator.active_scenarios) == 1:
                await metrics_generator.start_metrics_generation()
            
        elif message_type == "pause_scenario" and scenario_id:
            control = ScenarioControlRequest(action="pause")
            result = await orchestrator.control_scenario(scenario_id, control)
            
        elif message_type == "resume_scenario" and scenario_id:
            control = ScenarioControlRequest(action="resume")
            result = await orchestrator.control_scenario(scenario_id, control)
            
        elif message_type == "stop_scenario" and scenario_id:
            control = ScenarioControlRequest(action="stop")
            result = await orchestrator.control_scenario(scenario_id, control)
            
            # Stop metrics generation if no scenarios running
            if len(orchestrator.active_scenarios) == 0:
                await metrics_generator.stop_metrics_generation()
            
        elif message_type == "jump_to_step" and scenario_id:
            step_index = message_data.get("stepIndex", 0)
            control = ScenarioControlRequest(action="jump", step_index=step_index)
            result = await orchestrator.control_scenario(scenario_id, control)
            
        elif message_type == "subscribe_to_events":
            # Subscribe to specific event types
            events = message_data.get("events", [])
            for event_type in events:
                await websocket_service.subscribe_to_event(websocket, event_type)
            
            await websocket_service.send_to_connection(websocket, {
                "type": "subscription_success",
                "events": events,
                "timestamp": datetime.utcnow().isoformat()
            })
            
        elif message_type == "get_scenario_status":
            # Send current status of all scenarios
            all_scenarios = await orchestrator.get_all_scenarios_status()
            await websocket_service.send_to_connection(websocket, {
                "type": "scenario_status_response",
                "scenarios": all_scenarios,
                "timestamp": datetime.utcnow().isoformat()
            })
            
        elif message_type == "presenter_control":
            # Handle presenter-specific controls
            action = message_data.get("action")
            
            if action == "sync_all_to_step":
                step_index = message_data.get("stepIndex", 0)
                for active_scenario_id in orchestrator.active_scenarios.keys():
                    control = ScenarioControlRequest(action="jump", step_index=step_index)
                    await orchestrator.control_scenario(active_scenario_id, control)
                    
            elif action == "start_all":
                scenario_ids = ["trading-crisis", "cost-spiral", "security-breach", "executive-value"]
                for sid in scenario_ids:
                    if sid not in orchestrator.active_scenarios:
                        config = ScenarioStartRequest(
                            auto_advance=True,
                            step_duration=45,
                            presenter_mode=True
                        )
                        await orchestrator.start_scenario(sid, config)
                        await asyncio.sleep(1)  # Stagger starts
                        
            elif action == "pause_all":
                for scenario_id in list(orchestrator.active_scenarios.keys()):
                    control = ScenarioControlRequest(action="pause")
                    await orchestrator.control_scenario(scenario_id, control)
                    
            elif action == "resume_all":
                for scenario_id in list(orchestrator.active_scenarios.keys()):
                    control = ScenarioControlRequest(action="resume")
                    await orchestrator.control_scenario(scenario_id, control)
                    
            elif action == "stop_all":
                for scenario_id in list(orchestrator.active_scenarios.keys()):
                    control = ScenarioControlRequest(action="stop")
                    await orchestrator.control_scenario(scenario_id, control)
        
        # Send acknowledgment for all scenario commands
        await websocket_service.send_to_connection(websocket, {
            "type": "command_acknowledgment",
            "original_command": message_type,
            "scenario_id": scenario_id,
            "timestamp": datetime.utcnow().isoformat(),
            "success": True
        })
        
    except Exception as e:
        logger.error(f"Error handling WebSocket message: {e}")
        await websocket_service.send_to_connection(websocket, {
            "type": "error",
            "message": f"Error processing command: {str(e)}",
            "original_command": message_data.get("type"),
            "timestamp": datetime.utcnow().isoformat()
        })

# Event broadcasting utilities
async def broadcast_system_alert(alert_type: str, severity: str, message: str, context: Dict[str, Any] = None):
    """Broadcast system-wide alerts"""
    await websocket_service.broadcast_alert(alert_type, severity, message, context)

async def broadcast_scenario_metrics(scenario_id: str, metrics: Dict[str, Any]):
    """Broadcast scenario-specific metrics"""
    await websocket_service.broadcast_to_subscribers("scenario_metrics", {
        "scenarioId": scenario_id,
        "metrics": metrics,
        "timestamp": datetime.utcnow().isoformat()
    })

async def get_websocket_statistics():
    """Get comprehensive WebSocket service statistics"""
    return {
        "connections": websocket_service.get_connection_stats(),
        "scenarios": {
            "active_count": len(orchestrator.active_scenarios),
            "active_scenarios": list(orchestrator.active_scenarios.keys()),
            "background_tasks": len(orchestrator.scenario_tasks)
        },
        "metrics_generation": {
            "is_running": metrics_generator.is_running,
            "task_active": metrics_generator.metrics_task is not None and not metrics_generator.metrics_task.done()
        }
    }