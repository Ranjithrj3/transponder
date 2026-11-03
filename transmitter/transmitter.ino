#include <SPI.h>
#include <LoRa.h>
#include <TinyGPS++.h>
#include <HardwareSerial.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

// ---------- LoRa ----------
#define SS_PIN    18
#define RST_PIN   23
#define DIO0_PIN  26
#define SCK_PIN   5
#define MISO_PIN  19
#define MOSI_PIN  27

// ---------- GPS ----------
#define GPS_RX_PIN 34
#define GPS_TX_PIN 12
#define GPS_BAUD   9600

// ---------- OLED ----------
#define SDA_PIN 21
#define SCL_PIN 22

#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64

Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, -1);

HardwareSerial GPSSerial(1);
TinyGPSPlus gps;

unsigned long lastSend = 0;

void setup() {

  Serial.begin(115200);

  Wire.begin(SDA_PIN, SCL_PIN);

  if(!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)){
    Serial.println("OLED Failed");
    while(1);
  }

  display.clearDisplay();
  display.setTextColor(SSD1306_WHITE);
  display.setTextSize(1);
  display.setCursor(0,0);
  display.println("LILYGO T-Beam");
  display.println("Starting...");
  display.display();

  GPSSerial.begin(GPS_BAUD, SERIAL_8N1, GPS_RX_PIN, GPS_TX_PIN);

  SPI.begin(SCK_PIN, MISO_PIN, MOSI_PIN, SS_PIN);

  LoRa.setPins(SS_PIN, RST_PIN, DIO0_PIN);

  if(!LoRa.begin(433E6)){
      Serial.println("LoRa Failed");
      display.clearDisplay();
      display.println("LoRa Failed");
      display.display();
      while(1);
  }

  Serial.println("LoRa Ready");

  display.clearDisplay();
  display.println("LoRa Ready");
  display.display();
}

void loop() {

  while (GPSSerial.available()) {
    gps.encode(GPSSerial.read());
  }

  if (millis() - lastSend > 3000) {

    lastSend = millis();

    String packet = "";

    // Device ID
    packet += "ID=DRONE01,";

    // Location
    packet += "LAT=";
    packet += gps.location.isValid() ? String(gps.location.lat(), 6) : "0";
    packet += ",";

    packet += "LON=";
    packet += gps.location.isValid() ? String(gps.location.lng(), 6) : "0";
    packet += ",";

    // Altitude
    packet += "ALT=";
    packet += gps.altitude.isValid() ? String(gps.altitude.meters(), 2) : "0";
    packet += ",";

    // Speed
    packet += "SPD=";
    packet += gps.speed.isValid() ? String(gps.speed.kmph(), 2) : "0";
    packet += ",";

    // Course
    packet += "CRS=";
    packet += gps.course.isValid() ? String(gps.course.deg(), 2) : "0";
    packet += ",";

    // Satellites
    packet += "SAT=";
    packet += String(gps.satellites.value());
    packet += ",";

    // HDOP
    packet += "HDOP=";
    packet += gps.hdop.isValid() ? String(gps.hdop.hdop(), 1) : "0";
    packet += ",";

    // Date
    packet += "DATE=";
    if (gps.date.isValid()) {
      packet += String(gps.date.day()) + "/";
      packet += String(gps.date.month()) + "/";
      packet += String(gps.date.year());
    } else {
      packet += "0";
    }
    packet += "\n";

    // Time
    packet += "TIME=";
    if (gps.time.isValid()) {
      char buf[12];
      sprintf(buf, "%02d:%02d:%02d",
              gps.time.hour(),
              gps.time.minute(),
              gps.time.second());
      packet += buf;
    } else {
      packet += "0";
    }

    // Send packet via LoRa
    LoRa.beginPacket();
    LoRa.print(packet);
    LoRa.endPacket();

    String debugPacket = packet;
    debugPacket.replace(",", "\n");

    // Print to Serial Monitor
    Serial.println("========== DRONE DATA ==========");
    Serial.println(debugPacket);
    Serial.println("===============================");

    // OLED Display
    display.clearDisplay();
    display.setCursor(0, 0);

    display.println("433 MHz TX");

    if (gps.location.isValid()) {
      display.println("GPS FIX");
      display.print("Lat: ");
      display.println(gps.location.lat(), 4);

      display.print("Lon: ");
      display.println(gps.location.lng(), 4);
    } else {
      display.println("Waiting GPS...");
    }

    display.print("Sat: ");
    display.println(gps.satellites.value());

    display.display();
  }
}
