export const PYTHON_BRIDGE_CODE = `#!/usr/bin/env python3
"""
===================================================================
 LoRa Telemetry Ground Station - Serial to WebSocket Python Bridge
 Compatible with ESP32 LoRa Ground Receiver (COM5 @ 115200)
===================================================================

Installation:
  pip install pyserial websocket-client

Usage:
  python bridge.py --port COM5 --baud 115200 --url ws://localhost:3000/ws
"""

import sys
import time
import argparse
import logging
import json

try:
    import serial
except ImportError:
    print("ERR: 'pyserial' package is required. Install using: pip install pyserial")
    sys.exit(1)

try:
    import websocket
except ImportError:
    print("ERR: 'websocket-client' package is required. Install using: pip install websocket-client")
    sys.exit(1)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S"
)

def run_bridge(port, baud, ws_url, test_mode):
    logging.info("==================================================")
    logging.info(" LoRa Ground Station - Python Serial Bridge")
    logging.info(f" Serial Port: {port} @ {baud} baud")
    logging.info(f" Target GCS : {ws_url}")
    logging.info("==================================================")

    ws = None
    packet_count = 0

    def connect_ws():
        nonlocal ws
        while True:
            try:
                logging.info(f"Connecting to GCS WebSocket at {ws_url}...")
                ws = websocket.WebSocket()
                ws.connect(ws_url)
                logging.info("Successfully connected to Ground Station WebSocket!")
                ws.send(json.dumps({
                    "type": "HANDSHAKE",
                    "client": "PythonSerialBridge",
                    "port": port,
                    "baud": baud
                }))
                return
            except Exception as e:
                logging.warning(f"WebSocket connection failed: {e}. Retrying in 3s...")
                time.sleep(3)

    connect_ws()

    if test_mode:
        logging.info("Running in SIMULATED TEST MODE...")
        seq = 1
        lat = 37.774900
        lon = -122.419400
        alt = 100.0

        while True:
            try:
                lat += 0.00005
                lon += 0.00003
                alt += 0.2
                packet_str = (
                    f"ID=DRONE01,SEQ={seq},LAT={lat:.6f},LON={lon:.6f},"
                    f"ALT={alt:.2f},SPD=12.50,CRS=45.00,SAT=12,HDOP=0.8,"
                    f"DATE=2026-08-11,TIME=14:30:00,RSSI=-82,SNR=8.50"
                )
                logging.info(f"[TEST RX #{seq}] {packet_str}")
                ws.send(json.dumps({"type": "TELEMETRY", "raw": packet_str}))
                seq += 1
                time.sleep(1)
            except Exception as e:
                logging.error(f"WebSocket send error: {e}")
                connect_ws()

    ser = None
    while True:
        try:
            if ser is None or not ser.is_open:
                logging.info(f"Opening Serial port {port} at {baud} baud...")
                ser = serial.Serial(port, baud, timeout=1)
                logging.info(f"Serial port {port} connected! Listening for telemetry...")

            line = ser.readline().decode('utf-8', errors='replace').strip()
            if line:
                packet_count += 1
                logging.info(f"[RX #{packet_count}] {line}")

                try:
                    payload = json.dumps({
                        "type": "TELEMETRY",
                        "raw": line,
                        "port": port,
                        "timestamp": int(time.time() * 1000)
                    })
                    ws.send(payload)
                except Exception as ws_err:
                    logging.warning(f"WebSocket send failed ({ws_err}). Reconnecting...")
                    connect_ws()

        except serial.SerialException as s_err:
            logging.error(f"Serial port error on {port}: {s_err}. Retrying in 2s...")
            if ser and ser.is_open:
                ser.close()
            ser = None
            time.sleep(2)
        except KeyboardInterrupt:
            logging.info("Bridge terminated by user.")
            if ser and ser.is_open:
                ser.close()
            if ws:
                ws.close()
            sys.exit(0)
        except Exception as err:
            logging.error(f"Unexpected error: {err}")
            time.sleep(1)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="ESP32 LoRa Serial to WebSocket Bridge")
    parser.add_argument("--port", default="COM5", help="Serial COM port (default: COM5)")
    parser.add_argument("--baud", type=int, default=115200, help="Baud rate (default: 115200)")
    parser.add_argument("--url", default="ws://localhost:3000/ws", help="GCS WebSocket server URL")
    parser.add_argument("--test", action="store_true", help="Run in test mode")

    args = parser.parse_args()
    run_bridge(args.port, args.baud, args.url, args.test)
`;
