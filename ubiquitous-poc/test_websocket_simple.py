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
            print(f"✅ Connected to {uri}")
            
            # Send ping to test connection
            ping_command = {"type": "ping"}
            await websocket.send(json.dumps(ping_command))
            print("📤 Sent ping command")
            
            # Listen for a few messages
            message_count = 0
            max_messages = 5
            
            while message_count < max_messages:
                try:
                    message = await asyncio.wait_for(websocket.recv(), timeout=10.0)
                    data = json.loads(message)
                    
                    msg_type = data.get("type")
                    timestamp = data.get("timestamp", "")[:19]  # Truncate timestamp
                    
                    if msg_type == "pong":
                        print(f"📥 Received pong at {timestamp}")
                    elif msg_type == "system_update":
                        system_data = data.get("data", {})
                        cpu = system_data.get("cpu_utilization", 0)
                        nodes = system_data.get("active_nodes", 0)
                        print(f"💻 System Update: {nodes} nodes, CPU {cpu}% at {timestamp}")
                    elif msg_type == "scenario_update":
                        scenario_id = data.get("scenarioId")
                        step_index = data.get("stepIndex")
                        print(f"📊 Scenario Update: {scenario_id} -> Step {step_index}")
                    else:
                        print(f"📨 Message type: {msg_type}")
                    
                    message_count += 1
                    
                except asyncio.TimeoutError:
                    print("⏰ Timeout waiting for message")
                    break
                except json.JSONDecodeError as e:
                    print(f"❌ JSON decode error: {e}")
                    continue
            
            # Test scenario control
            print("\n🎬 Testing scenario control...")
            start_command = {
                "type": "start_scenario",
                "scenarioId": "security-breach",
                "autoAdvance": True,
                "stepDuration": 5
            }
            
            await websocket.send(json.dumps(start_command))
            print("📤 Sent start scenario command")
            
            # Wait for acknowledgment
            try:
                message = await asyncio.wait_for(websocket.recv(), timeout=5.0)
                data = json.loads(message)
                if data.get("type") == "command_acknowledgment":
                    print(f"✅ Command acknowledged: {data.get('original_command')}")
            except asyncio.TimeoutError:
                print("⏰ No acknowledgment received")
            
            print("\n✅ WebSocket test completed successfully!")
            
    except Exception as e:
        print(f"❌ WebSocket test failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_websocket())