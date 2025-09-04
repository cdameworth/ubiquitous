#!/usr/bin/env python3
"""
Simple WebSocket test script to verify real-time scenario updates
"""

import asyncio
import websockets
import json
from datetime import datetime

async def test_websocket():
    uri = "ws://localhost:8000/ws"
    
    try:
        async with websockets.connect(uri) as websocket:
            print(f"Connected to {uri}")
            
            # Send start scenario command
            start_command = {
                "type": "start_scenario",
                "scenarioId": "trading-crisis",
                "autoAdvance": True,
                "stepDuration": 10,  # Faster for testing
                "presenterMode": False
            }
            
            await websocket.send(json.dumps(start_command))
            print("Sent start scenario command")
            
            # Listen for messages for 60 seconds
            timeout = 60
            start_time = datetime.now()
            
            while (datetime.now() - start_time).seconds < timeout:
                try:
                    message = await asyncio.wait_for(websocket.recv(), timeout=15.0)
                    data = json.loads(message)
                    
                    msg_type = data.get("type")
                    timestamp = data.get("timestamp", "")
                    
                    if msg_type == "scenario_update":
                        scenario_id = data.get("scenarioId")
                        step_index = data.get("stepIndex")
                        print(f"📊 Scenario Update: {scenario_id} -> Step {step_index} at {timestamp}")
                        
                    elif msg_type == "system_update":
                        system_data = data.get("data", {})
                        cpu = system_data.get("cpu_utilization", 0)
                        print(f"💻 System Update: CPU {cpu}% at {timestamp}")
                        
                    elif msg_type == "metrics_update":
                        metrics_type = data.get("metricsType")
                        print(f"📈 Metrics Update: {metrics_type} at {timestamp}")
                        
                    elif msg_type == "command_acknowledgment":
                        command = data.get("original_command")
                        print(f"✅ Command Ack: {command} at {timestamp}")
                        
                    elif msg_type == "error":
                        error_msg = data.get("message")
                        print(f"❌ Error: {error_msg}")
                        
                    else:
                        print(f"🔄 Message: {msg_type} at {timestamp}")
                        
                except asyncio.TimeoutError:
                    print("No message received in 15 seconds, continuing...")
                    continue
                except json.JSONDecodeError as e:
                    print(f"JSON decode error: {e}")
                    continue
                    
            print("Test completed - closing connection")
            
    except Exception as e:
        print(f"WebSocket test failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_websocket())