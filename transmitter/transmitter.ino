/*
=========================================================
LILYGO T-Beam GPS LoRa Transmitter
Part 1
=========================================================
Features
---------
- GPS (NEO-6M)
- LoRa SX1278 433 MHz
- ACK Protocol
- OLED Status
- Light Sleep
=========================================================
*/

#include <SPI.h>
#include <LoRa.h>
#include <TinyGPS++.h>
#include <HardwareSerial.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <esp_sleep.h>

//------------------------------------------------------
// LoRa Pins
//------------------------------------------------------
#define SS_PIN      18
#define RST_PIN     23
#define DIO0_PIN    26

#define SCK_PIN      5
#define MISO_PIN    19
#define MOSI_PIN    27

//------------------------------------------------------
// GPS
//------------------------------------------------------
#define GPS_RX_PIN 34
#define GPS_TX_PIN 12
#define GPS_BAUD   9600

//------------------------------------------------------
// OLED
//------------------------------------------------------
#define SDA_PIN 21
#define SCL_PIN 22

#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64

//------------------------------------------------------
// Sleep
//------------------------------------------------------
#define SLEEP_DURATION_US (9ULL * 1000000ULL)

//------------------------------------------------------
// ACK
//------------------------------------------------------
#define ACK_TIMEOUT_MS 300

//------------------------------------------------------
// Objects
//------------------------------------------------------
Adafruit_SSD1306 display(
    SCREEN_WIDTH,
    SCREEN_HEIGHT,
    &Wire,
    -1);

HardwareSerial GPSSerial(1);
TinyGPSPlus gps;

//------------------------------------------------------
// Globals
//------------------------------------------------------
uint32_t sequenceNumber = 0;

bool ackReceived = false;

String ackStatus = "WAIT";

//------------------------------------------------------
// Function Prototypes
//------------------------------------------------------
void pollGPS();
String buildPacket();
bool waitForACK(uint32_t expectedSeq);
void sendPacket();
void updateOLED(float lat,float lon);

//======================================================
// GPS Polling
//======================================================

void pollGPS()
{
    while(GPSSerial.available())
    {
        gps.encode(GPSSerial.read());
    }
}

//======================================================
// Packet Builder
//======================================================

String buildPacket()
{
    String packet;

    packet.reserve(180);

    packet += "TYPE=DATA,";

    packet += "ID=DRONE01,";

    packet += "SEQ=";
    packet += String(sequenceNumber);
    packet += ",";

    packet += "LAT=";
    packet += gps.location.isValid() ?
              String(gps.location.lat(),6) :
              "0";
    packet += ",";

    packet += "LON=";
    packet += gps.location.isValid() ?
              String(gps.location.lng(),6) :
              "0";
    packet += ",";

    packet += "ALT=";
    packet += gps.altitude.isValid() ?
              String(gps.altitude.meters(),2) :
              "0";
    packet += ",";

    packet += "SPD=";
    packet += gps.speed.isValid() ?
              String(gps.speed.kmph(),2) :
              "0";
    packet += ",";

    packet += "CRS=";
    packet += gps.course.isValid() ?
              String(gps.course.deg(),2) :
              "0";
    packet += ",";

    packet += "SAT=";
    packet += gps.satellites.value();
    packet += ",";

    packet += "HDOP=";
    packet += gps.hdop.isValid() ?
              String(gps.hdop.hdop(),1) :
              "0";
    packet += ",";

    packet += "DATE=";

    if(gps.date.isValid())
    {
        packet += String(gps.date.day());
        packet += "/";
        packet += String(gps.date.month());
        packet += "/";
        packet += String(gps.date.year());
    }
    else
    {
        packet += "0";
    }

    packet += ",";

    packet += "TIME=";

    if(gps.time.isValid())
    {
        char buf[12];

        sprintf(
            buf,
            "%02d:%02d:%02d",
            gps.time.hour(),
            gps.time.minute(),
            gps.time.second());

        packet += buf;
    }
    else
    {
        packet += "0";
    }

    return packet;
}

//======================================================
// Wait for ACK
//======================================================

bool waitForACK(uint32_t expectedSeq)
{
    ackReceived = false;
    ackStatus = "WAIT";

    LoRa.receive();

    delay(5);

    unsigned long start = millis();

    while(millis()-start < ACK_TIMEOUT_MS)
    {
        int packetSize = LoRa.parsePacket();

        if(packetSize)
        {
            String rx="";

            while(LoRa.available())
            {
                rx += (char)LoRa.read();
            }

            Serial.print("RX : ");
            Serial.println(rx);

            if(rx.startsWith("TYPE=ACK"))
            {
                int pos = rx.indexOf("SEQ=");

                if(pos!=-1)
                {
                    uint32_t seq =
                    rx.substring(pos+4).toInt();

                    if(seq==expectedSeq)
                    {
                        ackReceived=true;
                        ackStatus="OK";

                        Serial.println("ACK RECEIVED");

                        return true;
                    }
                }
            }
        }
    }

    ackStatus="TIMEOUT";

    Serial.println("ACK TIMEOUT");

    return false;
}

//======================================================
// Send Packet
//======================================================

void sendPacket()
{
    String packet = buildPacket();

    uint32_t currentSeq = sequenceNumber;

    LoRa.idle();

    LoRa.beginPacket();

    LoRa.print(packet);

    LoRa.endPacket();

    Serial.println();
    Serial.println("================================");

    Serial.println(packet);

    Serial.println("================================");

    Serial.print("TX SEQ : ");

    Serial.println(currentSeq);

    waitForACK(currentSeq);

    sequenceNumber++;

    float lat =
        gps.location.isValid() ?
        gps.location.lat() : 0;

    float lon =
        gps.location.isValid() ?
        gps.location.lng() : 0;

    updateOLED(lat,lon);
}

//======================================================
// OLED Update
//======================================================

void updateOLED(float lat, float lon)
{
    display.clearDisplay();

    display.setTextColor(SSD1306_WHITE);
    display.setTextSize(1);

    display.setCursor(0,0);

    display.println("433 MHz TELEMETRY");

    if(gps.location.isValid())
        display.println("GPS FIX");
    else
        display.println("NO GPS");

    display.print("LAT:");
    display.println(lat,4);

    display.print("LON:");
    display.println(lon,4);

    display.print("SAT:");
    display.println(gps.satellites.value());

    display.print("SEQ:");
    display.println(sequenceNumber);

    display.print("ACK:");

    if(ackReceived)
        display.println("OK");
    else
        display.println(ackStatus);

    display.display();
}

//======================================================
// SETUP
//======================================================

void setup()
{
    Serial.begin(115200);

    Wire.begin(SDA_PIN,SCL_PIN);

    if(!display.begin(
        SSD1306_SWITCHCAPVCC,
        0x3C))
    {
        while(1);
    }

    display.clearDisplay();

    display.setTextColor(SSD1306_WHITE);
    display.setTextSize(1);

    display.setCursor(0,0);

    display.println("LILYGO T-BEAM");
    display.println("Starting...");

    display.display();

    GPSSerial.begin(
        GPS_BAUD,
        SERIAL_8N1,
        GPS_RX_PIN,
        GPS_TX_PIN);

    SPI.begin(
        SCK_PIN,
        MISO_PIN,
        MOSI_PIN,
        SS_PIN);

    LoRa.setPins(
        SS_PIN,
        RST_PIN,
        DIO0_PIN);

    Serial.println("Initializing LoRa...");

    if (!LoRa.begin(433E6))
    {
        Serial.println("ERROR: LoRa initialization FAILED!");

        display.clearDisplay();
        display.setCursor(0,0);
        display.println("LoRa Failed");
        display.println("Check Module");
        display.display();

        while (1)
        {
            delay(1000);
        }
    }

    LoRa.enableCrc();

    LoRa.setSyncWord(0x34);   // must match receiver's LoRa.setSyncWord(0x34)

    Serial.println("LoRa initialized successfully.");

    display.clearDisplay();
    display.setCursor(0,0);
    display.println("LoRa Ready");
    display.display();

    esp_sleep_enable_timer_wakeup(
        SLEEP_DURATION_US);
}

//======================================================
// LOOP
//======================================================

void loop()
{
    //--------------------------------------------------
    // Collect fresh GPS data for ~200 ms
    //--------------------------------------------------

    unsigned long gpsStart = millis();

    while(millis()-gpsStart < 200)
    {
        pollGPS();
    }

    //--------------------------------------------------
    // Send one telemetry packet
    //--------------------------------------------------

    sendPacket();

    //--------------------------------------------------
    // Allow serial to finish printing
    //--------------------------------------------------

    delay(20);

    //--------------------------------------------------
    // Sleep Screen
    //--------------------------------------------------

    display.clearDisplay();

    display.setCursor(0,0);

    display.println("Sleeping...");

    display.print("SEQ:");

    display.println(sequenceNumber);

    display.print("ACK:");

    if(ackReceived)
        display.println("OK");
    else
        display.println(ackStatus);

    display.display();

    Serial.println();
    Serial.println("Entering Light Sleep");

    Serial.flush();

    //--------------------------------------------------
    // Sleep
    //--------------------------------------------------

    esp_light_sleep_start();

    //--------------------------------------------------
    // Wake
    //--------------------------------------------------

    Serial.println("Wake Up");
}
