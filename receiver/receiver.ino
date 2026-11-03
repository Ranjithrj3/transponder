/*
=========================================================
LoRa Ground Receiver
PART 1
Compatible with:
- LILYGO T-Beam Transmitter
- SX1278 433 MHz
=========================================================
*/

#include <SPI.h>
#include <LoRa.h>

//======================================================
// LoRa Pins
//======================================================

#define LORA_SS      5
#define LORA_RST     14
#define LORA_DIO0    26

//======================================================
// LoRa Settings
//======================================================

#define LORA_FREQ 433E6

//======================================================
// Telemetry Structure
//======================================================

struct Telemetry
{
    String type;
    String id;

    uint32_t seq;

    float lat;
    float lon;

    float alt;
    float spd;
    float crs;

    int sat;

    float hdop;

    String date;
    String time;

    int rssi;
    float snr;
};

Telemetry drone;

//======================================================
// Function Prototypes
//======================================================

void parsePacket(String packet);
String getValue(String data,String key);
void printTelemetry();
void sendACK(uint32_t seq);

//======================================================
// Extract Value
//======================================================

String getValue(String data,String key)
{
    key += "=";

    int start = data.indexOf(key);

    if(start==-1)
        return "";

    start += key.length();

    int end = data.indexOf(",",start);

    if(end==-1)
        end = data.length();

    return data.substring(start,end);
}

//======================================================
// Parse Packet
//======================================================

void parsePacket(String packet)
{
    drone.type = getValue(packet,"TYPE");

    drone.id = getValue(packet,"ID");

    drone.seq = getValue(packet,"SEQ").toInt();

    drone.lat = getValue(packet,"LAT").toFloat();

    drone.lon = getValue(packet,"LON").toFloat();

    drone.alt = getValue(packet,"ALT").toFloat();

    drone.spd = getValue(packet,"SPD").toFloat();

    drone.crs = getValue(packet,"CRS").toFloat();

    drone.sat = getValue(packet,"SAT").toInt();

    drone.hdop = getValue(packet,"HDOP").toFloat();

    drone.date = getValue(packet,"DATE");

    drone.time = getValue(packet,"TIME");
}

//======================================================
// ACK
//======================================================

void sendACK(uint32_t seq)
{
    String ack =
        "TYPE=ACK,"
        "ID=GROUND01,"
        "SEQ=" +
        String(seq);

    delay(5);

    LoRa.idle();

    LoRa.beginPacket();

    LoRa.print(ack);

    LoRa.endPacket();

    LoRa.receive();
}

//======================================================
// Print Telemetry
//======================================================

void printTelemetry()
{
    Serial.print("ID=");
    Serial.print(drone.id);

    Serial.print(",SEQ=");
    Serial.print(drone.seq);

    Serial.print(",LAT=");
    Serial.print(drone.lat,6);

    Serial.print(",LON=");
    Serial.print(drone.lon,6);

    Serial.print(",ALT=");
    Serial.print(drone.alt,2);

    Serial.print(",SPD=");
    Serial.print(drone.spd,2);

    Serial.print(",CRS=");
    Serial.print(drone.crs,2);

    Serial.print(",SAT=");
    Serial.print(drone.sat);

    Serial.print(",HDOP=");
    Serial.print(drone.hdop,1);

    Serial.print(",DATE=");
    Serial.print(drone.date);

    Serial.print(",TIME=");
    Serial.print(drone.time);

    Serial.print(",RSSI=");
    Serial.print(drone.rssi);

    Serial.print(",SNR=");
    Serial.println(drone.snr,2);
}
//======================================================
// SETUP
//======================================================

void setup()
{
    Serial.begin(115200);

    while (!Serial);

    Serial.println();
    Serial.println("================================");
    Serial.println(" LoRa Ground Receiver");
    Serial.println("================================");

    SPI.begin();

    LoRa.setPins(LORA_SS, LORA_RST, LORA_DIO0);

    if (!LoRa.begin(LORA_FREQ))
    {
        Serial.println("LoRa Init Failed");

        while (1);
    }

    //-----------------------------
    // LoRa Configuration
    //-----------------------------

    LoRa.enableCrc();

    LoRa.setSyncWord(0x34);

    LoRa.receive();

    Serial.println("Receiver Ready");
    Serial.println();
}

//======================================================
// LOOP
//======================================================

void loop()
{
    int packetSize = LoRa.parsePacket();

    if (packetSize)
    {
        String incoming = "";

        while (LoRa.available())
        {
            incoming += (char)LoRa.read();
        }

        //-------------------------
        // Ignore non DATA packets
        //-------------------------

        if (!incoming.startsWith("TYPE=DATA"))
        {
            LoRa.receive();
            return;
        }

        //-------------------------
        // Parse packet
        //-------------------------

        parsePacket(incoming);

        //-------------------------
        // Read Link Quality
        //-------------------------

        drone.rssi = LoRa.packetRssi();

        drone.snr = LoRa.packetSnr();

        //-------------------------
        // Print Telemetry
        //-------------------------

        printTelemetry();

        //-------------------------
        // Send ACK
        //-------------------------

        sendACK(drone.seq);

        //-------------------------
        // Back to RX
        //-------------------------

        LoRa.receive();
    }
}
