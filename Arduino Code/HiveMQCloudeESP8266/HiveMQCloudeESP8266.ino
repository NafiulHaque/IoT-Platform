#include <ESP8266WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <OneWire.h>
#include <DallasTemperature.h>

#define ONE_WIRE_BUS 2

OneWire oneWire(ONE_WIRE_BUS);
DallasTemperature sensors(&oneWire);

// ─── WiFi ───────────────────────────────────────────
const char* ssid     = "WiFi";
const char* password = "WiFi@987654321";

// ─── HiveMQ Cloud ───────────────────────────────────
const char* mqtt_host = "b97f2e41b9544425ab8ca239071f0ddf.s1.eu.hivemq.cloud";
const int   mqtt_port = 8883;
const char* mqtt_user = "esp8266_device_01";
const char* mqtt_pass = "StrongPass456";
const char* client_id = "esp8266_device_01";

// ─── Topics ─────────────────────────────────────────
const char* topic_temp    = "factory/line1/esp8266_01/temperature";
const char* topic_status  = "factory/line1/esp8266_01/status";

// ─── HiveMQ Cloud CA Certificate (Let's Encrypt) ────
// Valid until 2035 — no need to change soon
const char* root_ca PROGMEM = R"EOF(
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

// ─── Objects ─────────────────────────────────────────
BearSSL::WiFiClientSecure espClient;
BearSSL::X509List          certList(root_ca);
PubSubClient               client(espClient);

// ─── Timing ──────────────────────────────────────────
unsigned long lastPublish    = 0;
const long    publishInterval = 10000; // 10 seconds

// ────────────────────────────────────────────────────
void connectWiFi() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  } 
  Serial.println();
  Serial.print("WiFi connected. IP: ");
  Serial.println(WiFi.localIP());
}

void syncTime() {
  // ESP8266 BearSSL requires correct system time for TLS cert validation
  configTime(6 * 3600, 0, "pool.ntp.org", "time.nist.gov"); // UTC+6 for Bangladesh
  Serial.print("Syncing time");
  time_t now = time(nullptr);
  while (now < 8 * 3600 * 2) {
    delay(500);
    Serial.print(".");
    now = time(nullptr);
  }
  Serial.println();
  Serial.print("Time synced: ");
  Serial.println(ctime(&now));
}

void connectMQTT() {
  espClient.setTrustAnchors(&certList);

  client.setServer(mqtt_host, mqtt_port);
  client.setCallback(onMessageReceived);
  client.setBufferSize(512); // increase buffer for JSON payloads

  while (!client.connected()) {
    Serial.print("Connecting to HiveMQ Cloud...");

    if (client.connect(client_id, mqtt_user, mqtt_pass)) {
      Serial.println(" Connected!");

      // Publish online status with retain flag = true
      // (broker remembers last status for late subscribers)
      client.publish(topic_status, "{\"status\":\"online\"}", true);

    } else {
      Serial.print(" Failed. rc=");
      Serial.print(client.state());
      Serial.println(" — retrying in 5s");
      delay(5000);
    }
  }
}

void onMessageReceived(char* topic, byte* payload, unsigned int length) {
  // Handle any incoming messages (e.g. commands from your dashboard)
  String msg;
  for (unsigned int i = 0; i < length; i++) msg += (char)payload[i];
  Serial.print("Message received [");
  Serial.print(topic);
  Serial.print("]: ");
  Serial.println(msg);
}

void publishSensorData() {
  // ── Replace these with your actual sensor reads ──
  
  float humidity    = 65.2;  // e.g. DHT22: dht.readHumidity()
  int   rssi        = WiFi.RSSI();  // WiFi signal strength — useful for diagnostics
  
  sensors.requestTemperatures();
  
  float temperature = sensors.getTempCByIndex(0);

  // Build JSON payload
  StaticJsonDocument<200> doc;
  doc["device_id"]  = "esp8266_01";
  doc["temp_c"]       = serialized(String(temperature, 1));
  doc["humidity"]   = serialized(String(humidity, 1));
  doc["rssi"]       = rssi;
  doc["uptime_ms"]  = millis();

  char payload[200];
  serializeJson(doc, payload);

  bool success = client.publish(topic_temp, payload);

  Serial.print(success ? "Published: " : "Publish FAILED: ");
  Serial.println(payload);
}

// ────────────────────────────────────────────────────
void setup() {
  Serial.begin(115200);
  delay(100);
  Serial.println("\n\n=== ESP8266 IoT Node Starting ===");
  sensors.begin();
  connectWiFi();
  syncTime();     // MUST happen before TLS connection
  connectMQTT();
}

void loop() {
  // Auto-reconnect if broker connection drops
  if (!client.connected()) {
    Serial.println("MQTT disconnected — reconnecting...");
    connectMQTT();
  }

  client.loop(); // keep connection alive + handle incoming messages

  // Publish on interval (non-blocking — no delay() in loop)
  unsigned long now = millis();
  if (now - lastPublish >= publishInterval) {
    lastPublish = now;
    publishSensorData();
  }
}