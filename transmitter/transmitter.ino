#include <SPI.h>
#include <LoRa.h>
#include <TinyGPS++.h>
#include <HardwareSerial.h>

// ---------- LoRa pins ----------
#define SS_PIN   5
#define RST_PIN  14
#define DIO0_PIN 26
#define MOSI_PIN 23
#define MISO_PIN 19
#define SCK_PIN  18

// ---------- GPS pins ----------
#define GPS_RX_PIN 16   // ESP32 RX2 <- GPS TX
#define GPS_TX_PIN 17   // ESP32 TX2 -> GPS RX
#define GPS_BAUD   9600

HardwareSerial GPSSerial(2);   // Use UART2
TinyGPSPlus gps;

unsigned long lastSend = 0;
const unsigned long sendInterval = 3000; // send every 3 seconds

void setup() {
  Serial.begin(115200);
  while (!Serial);

  Serial.println("Starting LoRa + GPS transmitter...");

  // Start GPS serial
  GPSSerial.begin(GPS_BAUD, SERIAL_8N1, GPS_RX_PIN, GPS_TX_PIN);

  // Set up custom SPI pins
  SPI.begin(SCK_PIN, MISO_PIN, MOSI_PIN, SS_PIN);

  // Tell the library which pins to use
  LoRa.setPins(SS_PIN, RST_PIN, DIO0_PIN);

  // Try to start LoRa at 433MHz (change to 868E6 or 915E6 depending on your module/region!)
  if (!LoRa.begin(433E6)) {
    Serial.println("LoRa init FAILED. Check your wiring!");
    while (1); // stop here
  }

  Serial.println("LoRa init SUCCESS! Module detected.");
}

void loop() {
  // Continuously feed GPS data to TinyGPS++ parser
  while (GPSSerial.available() > 0) {
    gps.encode(GPSSerial.read());
  }

  // Every sendInterval ms, send a packet
  if (millis() - lastSend >= sendInterval) {
    lastSend = millis();
    sendGPSPacket();
  }
}

void sendGPSPacket() {
  // Build a compact data string: LAT,LON,ALT,SATS,SPEED
  String data = "GPS,";

  if (gps.location.isValid()) {
    data += String(gps.location.lat(), 6) + ",";
    data += String(gps.location.lng(), 6) + ",";
  } else {
    data += "0.0,0.0,";
  }

  if (gps.altitude.isValid()) {
    data += String(gps.altitude.meters(), 2) + ",";
  } else {
    data += "0.0,";
  }

  data += String(gps.satellites.value()) + ",";

  if (gps.speed.isValid()) {
    data += String(gps.speed.kmph(), 2);
  } else {
    data += "0.0";
  }

  // Print locally for debugging
  Serial.print("Sending: ");
  Serial.println(data);

  // Send over LoRa
  LoRa.beginPacket();
  LoRa.print(data);
  LoRa.endPacket();

  if (!gps.location.isValid()) {
    Serial.println("Warning: No GPS fix yet. Sending zeros.");
  }
}
