#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <DHT.h>

#include <SPI.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>



#define SCREEN_WIDTH 128 // OLED display width, in pixels
#define SCREEN_HEIGHT 32 // OLED display height, in pixels


#define OLED_RESET     -1 // Reset pin # (or -1 if sharing Arduino reset pin)
#define OLED_ADDRESS 0x3C ///< See datasheet for Address; 0x3D for 128x64, 0x3C for 128x32
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

#define NUMFLAKES     10 // Number of snowflakes in the animation example

#define LOGO_HEIGHT   16
#define LOGO_WIDTH    16

static const unsigned char PROGMEM logo_bmp[] =
{ 0b00000000, 0b11000000,
  0b00000001, 0b11000000,
  0b00000001, 0b11000000,
  0b00000011, 0b11100000,
  0b11110011, 0b11100000,
  0b11111110, 0b11111000,
  0b01111110, 0b11111111,
  0b00110011, 0b10011111,
  0b00011111, 0b11111100,
  0b00001101, 0b01110000,
  0b00011011, 0b10100000,
  0b00111111, 0b11100000,
  0b00111111, 0b11110000,
  0b01111100, 0b11110000,
  0b01110000, 0b01110000,
  0b00000000, 0b00110000 };

// ─── WiFi ───────────────────────────────────────────
const char* ssid     = "WiFi";
const char* password = "WiFi@987654321";

// ─── HiveMQ Cloud ───────────────────────────────────
const char* mqtt_host = "b97f2e41b9544425ab8ca239071f0ddf.s1.eu.hivemq.cloud";
const int   mqtt_port = 8883;
const char* mqtt_user = "esp32_device_01";
const char* mqtt_pass = "StrongPass123";
const char* client_id = "esp32_device_01";

// HiveMQ Cloud root CA certificate
// Download from: https://letsencrypt.org/certs/isrgrootx1.pem
// (HiveMQ uses Let's Encrypt — paste the cert below)
const char* root_ca = R"EOF(
-----BEGIN CERTIFICATE-----
MIIFazCCA1OgAwIBAgIRAIIQz7DSQONZRGPgu2OCiwAwDQYJKoZIhvcNAQELBQAw
TzELMAkGA1UEBhMCVVMxKTAnBgNVBAoTIEludGVybmV0IFNlY3VyaXR5IFJlc2Vh
cmNoIEdyb3VwMRUwEwYDVQQDEwxJU1JHIFJvb3QgWDEwHhcNMTUwNjA0MTEwNDM4
WhcNMzUwNjA0MTEwNDM4WjBPMQswCQYDVQQGEwJVUzEpMCcGA1UEChMgSW50ZXJu
ZXQgU2VjdXJpdHkgUmVzZWFyY2ggR3JvdXAxFTATBgNVBAMTDElTUkcgUm9vdCBY
MTCCAiIwDQYJKoZIhvcNAQEBBQADggIPADCCAgoCggIBAK3oJHP0FDfzm54rVygc
h77ct984kIxuPOZXoHj3dcKi/vVqbvYATyjb3miGbESTtrFj/RQSa78f0uoxmyF+
0TM8ukj13Xnfs7j/EvEhmkvBioZxaUpmZmyPfjxwv60pIgbz5MDmgK7iS4+3mX6U
A5/TR5d8mUgjU+g4rk8Kb4Mu0UlXjIB0ttov0DiNewNwIRt18jA8+o+u3dpjq+sW
T8KOEUt+zwvo/7V3LvSye0rgTBIlDHCNAymg4VMk7BPZ7hm/ELNKjD+Jo2FR3qyH
B5T0Y3HsLuJvW5iB4YlcNHlsdu87kGJ55tukmi8mxdAQ4Q7e2RCOFvu396j3x+UC
B5iPNgiV5+I3lg02dZ77DnKxHZu8A/lJBdiB3QW0KtZB6awBdpUKD9jf1b0SHzUv
KBds0pjBqAlkd25HN7rOrFleaJ1/ctaJxQZBKT5ZPt0m9STJEadao0xAH0ahmbWn
OlFuhjuefXKnEgV4We0+UXgVCwOPjdAvBbI+e0ocS3MFEvzG6uBQE3xDk3SzynTn
jh8BCNAw1FtxNrQHusEwMFxIt4I7mKZ9YIqioymCzLq9gwQbooMDQaHWBfEbwrbw
qHyGO0aoSCqI3Haadr8faqU9GY/rOPNk3sgrDQoo//fb4hVC1CLQJ13hef4Y53CI
rU7m2Ys6xt0nUW7/vGT1M0NPAgMBAAGjQjBAMA4GA1UdDwEB/wQEAwIBBjAPBgNV
HRMBAf8EBTADAQH/MB0GA1UdDgQWBBR5tFnme7bl5AFzgAiIyBpY9umbbjANBgkq
hkiG9w0BAQsFAAOCAgEAVR9YqbyyqFDQDLHYGmkgJykIrGF1XIpu+ILlaS/V9lZL
ubhzEFnTIZd+50xx+7LSYK05qAvqFyFWhfFQDlnrzuBZ6brJFe+GnY+EgPbk6ZGQ
3BebYhtF8GaV0nxvwuo77x/Py9auJ/GpsMiu/X1+mvoiBOv/2X/qkSsisRcOj/KK
NFtY2PwByVS5uCbMiogziUwthDyC3+6WVwW6LLv3xLfHTjuCvjHIInNzktHCgKQ5
ORAzI4JMPJ+GslWYHb4phowim57iaztXOoJwTdwJx4nLCgdNbOhdjsnvzqvHu7Ur
TkXWStAmzOVyyghqpZXjFaH3pO3JLF+l+/+sKAIuvtd7u+Nxe5AW0wdeRlN8NwdC
jNPElpzVmbUq4JUagEiuTDkHzsxHpFKVK7q4+63SM1N95R1NbdWhscdCb+ZAJzVc
oyi3B43njTOQ5yOf+1CceWxG1bQVs5ZufpsMljq4Ui0/1lvh+wjChP4kqKOJ2qxq
4RgqsahDYVvTH9w7jXbyLeiNdd8XM2w9U/t7y0Ff/9yi0GE44Za4rF2LN9d11TPA
mRGunUHBcnWEvgJBQl9nJEiU0Zsnvgc/ubhPgXRR4Xq37Z0j4r7g1SgEEzwxA57d
emyPxgcYxn/eR44/KJ4EBs+lVDR3veyJm+kXQ99b21/+jh5Xos1AnX5iItreGCc=
-----END CERTIFICATE-----
)EOF";

// Topic
const char* topic_dht    = "factory/line1/esp32_01/dht";  
const char* topic_status   = "factory/line1/esp32_01/status";


// ─── DHT11 ──────────────────────────────────────────
#define DHT_PIN  4                      
#define DHT_TYPE DHT11                 
DHT dht(DHT_PIN, DHT_TYPE); 

WiFiClientSecure espClient;
PubSubClient client(espClient);


unsigned long lastPublish    = 0;
const long    publishInterval = 10000;  // 10 seconds

// ─── OLED Helper Functions ───────────────────────────

void oledSplash() {                      // ★ NEW — startup screen
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(20, 5);
  display.println("IoT Sensor Node");
  display.setCursor(28, 18);
  display.println("Starting...");
  display.display();
  delay(2000);
}

void oledStatus(String line1, String line2) { // ★ NEW — two-line status screen
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(0, 5);
  display.println(line1);
  display.setCursor(0, 18);
  display.println(line2);
  display.display();
}

void oledSensorData(float temp, float hum) { // ★ NEW — main data screen
  display.clearDisplay();

  // ── Temperature (large, left side) ──
  display.setTextSize(2);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(0, 0);
  display.print(temp, 1);
  display.setTextSize(1);
  display.setCursor(52, 0);
  display.println("C");

  // ── Divider line ──
  display.drawLine(63, 0, 63, 31, SSD1306_WHITE);

  // ── Humidity (right side) ──
  display.setTextSize(2);
  display.setCursor(68, 0);
  display.print(hum, 0);
  display.setTextSize(1);
  display.setCursor(110, 0);
  display.println("%");

  // ── Labels at bottom ──
  display.setTextSize(1);
  display.setCursor(8, 22);
  display.println("Temp");
  display.setCursor(72, 22);
  display.println("Humid");

  display.display();
}

void oledError(String msg) {             // ★ NEW — error screen
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(0, 5);
  display.println("! ERROR");
  display.setCursor(0, 18);
  display.println(msg);
  display.display();
}



void connectWiFi() {
  oledStatus("Connecting WiFi", ssid);
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500); Serial.print(".");
  }
  Serial.println();
  Serial.print("WiFi connected. IP: ");
  Serial.println(WiFi.localIP());
  oledStatus("WiFi Connected", WiFi.localIP().toString()); // ★ NEW
  delay(1500);
}

void connectMQTT() {
  espClient.setCACert(root_ca);
  client.setServer(mqtt_host, mqtt_port);
  client.setBufferSize(512);

  while (!client.connected()) {
    Serial.print("Connecting to MQTT...");
     oledStatus("Connecting MQTT", "HiveMQ Cloud...");
    if (client.connect(client_id, mqtt_user, mqtt_pass)) {
      Serial.println(" Connected!");
      // Publish online status
      client.publish(topic_status, "{\"status\":\"online\"}", true);
       oledStatus("MQTT Connected!", mqtt_host); 
    } else {
      Serial.print(" Failed, rc=");
      Serial.println(client.state());
       oledError("MQTT rc=" + String(client.state())); 
      delay(5000); // wait before retry
    }
  }
}


void publishDHT() {                     // ★ NEW — replaces old publishSensorData()
  float temperature = dht.readTemperature();   // Celsius by default
  float humidity    = dht.readHumidity();
  int   rssi        = WiFi.RSSI(); 

  // DHT11 sometimes returns NaN on bad reads — always validate
  if (isnan(temperature) || isnan(humidity)) {
    Serial.println("DHT11 read failed — skipping publish");
    oledError("DHT11 Read Fail");  
    return;                             // skip this cycle, try next interval
  }
  oledSensorData(temperature, humidity);  
 // Build JSON payload
  StaticJsonDocument<200> doc;
  doc["device_id"]  = "esp32_01";
  doc["temp_c"]     = serialized(String(temperature, 1));
  doc["humidity"]   = serialized(String(humidity, 1));
  doc["heat_index"] = serialized(String(dht.computeHeatIndex(temperature, humidity, false), 1));
  doc["uptime_ms"]  = millis();
  doc["rssi"] = serialized(String(rssi));

  char payload[200];
  serializeJson(doc, payload);

  bool success = client.publish(topic_dht, payload);
  Serial.print(success ? "Published: " : "Publish FAILED: ");
  Serial.println(payload);
}

// ────────────────────────────────────────────────────
void setup() {
  Serial.begin(115200);
  delay(100);

    Wire.begin(); 
 if (!display.begin(SSD1306_SWITCHCAPVCC, OLED_ADDRESS)) { // ★ NEW
    Serial.println("OLED init failed — check wiring and address");
    while (true); // halt — no point continuing without display
  }

   display.clearDisplay();
  display.display();
  oledSplash(); 

  Serial.println("\n\n=== ESP32 DHT11 IoT Node ===");

  dht.begin();                          // ★ NEW — initialize DHT sensor
  delay(2000);                          // ★ NEW — DHT11 needs 2s after power-on to stabilize

  connectWiFi();
  connectMQTT();
}

void loop() {
  if (!client.connected()) {
    Serial.println("MQTT disconnected — reconnecting...");
    connectMQTT();
  }
  client.loop();

  unsigned long now = millis();
  if (now - lastPublish >= publishInterval) {
    lastPublish = now;
    publishDHT();                       // ★ NEW
  }
}