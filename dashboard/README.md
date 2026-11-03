# LoRa Ground Control Station (GCS)

An **Elegant Dark** Ground Control Station (GCS) dashboard built with **React**, **TypeScript**, **Tailwind CSS**, and **Leaflet**. Designed for real-time telemetry tracking and hardware interfacing with ESP32 / LILYGO LoRa radio receiver modules connected via USB or WebSocket.

---

## 🚁 Key Features

- **Interactive Leaflet Flight Map**
  - Live drone tracking marker with directional heading indicator.
  - Multi-tile layer support (OpenStreetMap, Esri Satellite, CartoDB Dark, Topographic).
  - Breadcrumb path trail rendering, home launch marker, and distance radius rings.
  - Auto-follow mode and one-click re-center controls.

- **Primary Flight Display (HUD)**
  - Simulated artificial horizon and climb/descent rate indicator.
  - Real-time airspeed ladder ($m/s$) and AMSL altitude ladder ($m$).

- **Live Telemetry Matrix**
  - Instant visualization of Altitude, Ground Speed, Latitude, Longitude, Satellites (3D Fix), HDOP accuracy, Sequence packet counter, RSSI ($dBm$), SNR ($dB$), and UTC Date/Time.

- **Signal Integrity & Link Health Meter**
  - Visual RF bar indicators, link quality percentage, packet reception rate, and dropped packet counter.

- **Raw Packet Terminal**
  - Real-time console log stream with filtering and auto-scroll options.
  - Built-in ESP32 Telemetry String Parser Bench for testing raw packet lines.

- **Data Export**
  - Export recorded telemetry logs to **CSV**, **KML** (Google Earth track with 3D path extrusion), or **JSON**.

---

## 📡 Hardware & Telemetry Format

### Supported Hardware
- **Ground Receiver:** ESP32 with LoRa transceiver (e.g., LILYGO T-Beam, TTGO T-Call, Heltec WiFi LoRa 32, or custom ESP32 + SX1276/78 module).
- **Onboard Transmitter:** Drone / UAV equipped with LoRa radio transmitter + GPS module (NEO-6M / NEO-M8N).

### Serial Baud Rate
- **115200 Baud** over USB Serial (e.g., `COM5` on Windows or `/dev/ttyUSB0` on Linux/macOS).

### Telemetry Packet String Schema
The ESP32 Ground Receiver outputs key-value telemetry lines separated by commas over serial:

```text
ID=DRONE01,SEQ=1245,LAT=40.712800,LON=-74.006000,ALT=124.50,SPD=15.20,CRS=185.00,SAT=9,HDOP=1.2,DATE=2026-08-11,TIME=14:20:55,RSSI=-85,SNR=9.50
```

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `ID` | String | Drone identifier string |
| `SEQ` | Integer | Incremental packet sequence number |
| `LAT` | Float | GPS Latitude (decimal degrees) |
| `LON` | Float | GPS Longitude (decimal degrees) |
| `ALT` | Float | Altitude above mean sea level ($m$) |
| `SPD` | Float | Ground speed ($m/s$) |
| `CRS` | Float | Flight course / heading ($0-360^\circ$) |
| `SAT` | Integer | Number of locked satellites |
| `HDOP` | Float | Horizontal Dilution of Precision |
| `DATE` | String | UTC Date (`YYYY-MM-DD` or `YYYYMMDD`) |
| `TIME` | String | UTC Time (`HH:MM:SS` or `HHMMSS`) |
| `RSSI` | Integer | Received Signal Strength Indicator ($dBm$) |
| `SNR` | Float | Signal-to-Noise Ratio ($dB$) |

---

## 🔌 How to Connect Your Hardware

### Option 1: Direct WebSerial Connection (Recommended)
If using Google Chrome, Microsoft Edge, or Opera:
1. Connect your ESP32 Ground Receiver to your PC via USB.
2. Click the **`COM5 (115200)`** button in the GCS top navigation bar.
3. In the browser prompt, select your USB-Serial device (e.g., CP210x, CH340, or FTDI) and click **Connect**.

---

### Option 2: Python Serial Bridge (`bridge.py`)
If WebSerial is unavailable or running in a sandboxed browser environment:

1. **Install dependencies:**
   ```bash
   pip install pyserial websocket-client
   ```

2. **Run the bridge script:**
   ```bash
   python bridge.py --port COM5 --baud 115200
   ```
   *(Replace `COM5` with your USB port name, e.g., `/dev/ttyUSB0` on Linux)*

3. Click **`PYTHON BRIDGE`** in the GCS header bar to verify connection state.

---

## 🛠️ Software Development

### Prerequisites
- **Node.js** v18+ & **npm**

### Getting Started

```bash
# Install dependencies
npm install

# Run Vite local development server
npm run dev

# Build production bundle
npm run build
```

---

## 📄 License
MIT License
