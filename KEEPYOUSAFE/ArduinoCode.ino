#include <WiFi.h>
#include <Firebase_ESP_Client.h>
#include "addons/TokenHelper.h"
#include "addons/RTDBHelper.h"
#include <time.h>

// -------------------- Configuration --------------------
#define WIFI_SSID "CHAEYOUNG"
#define WIFI_PASSWORD "12345678"
#define API_KEY "AIzaSyDz6w52CBVze54koDqkftq0O0XhTRJrDbE"
#define DATABASE_URL "⁦https://safe-iot-cc63a-default-rtdb.firebaseio.com⁩"
#define USER_EMAIL "lylajanevillanueva@gmail.com"
#define USER_PASSWORD "Putangina120404"

// -------------------- Firebase Objects --------------------
FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

// -------------------- Pins --------------------
const int gasPin = 34;
const int airPin = 35;
const int relayPin = 32;
const int redLEDPin = 5;
const int yellowLEDPin = 2;
const int greenLEDPin = 4;

// -------------------- Thresholds --------------------
const int GAS_HIGH = 1500;
const int GAS_WARN = 800;
const int AIR_CLEAN = 750;
const int AIR_POLLUTED = 1000;

bool environmentWasDirty = false;
bool wasAirPolluted = false;

// -------------------- Blinking State --------------------
unsigned long lastBlinkTime = 0;
bool ledState = false;

// -------------------- Time Utilities --------------------
String getFormattedTime() {
  time_t now;
  struct tm timeinfo;
  time(&now);
  localtime_r(&now, &timeinfo);
  char buffer[25];
  strftime(buffer, sizeof(buffer), "%Y-%m-%d %H:%M:%S", &timeinfo);
  return String(buffer);
}

String getPathSafeTime() {
  time_t now;
  struct tm timeinfo;
  time(&now);
  localtime_r(&now, &timeinfo);
  char buffer[25];
  strftime(buffer, sizeof(buffer), "%Y-%m-%d_%H-%M-%S", &timeinfo);
  return String(buffer);
}

// -------------------- Firebase Write --------------------
void writeToFirebase(int gas, String gasStatus, int air, String airStatus, String datetime) {
  String path = "/logs/" + getPathSafeTime();

  FirebaseJson json;
  json.set("datetime", datetime);
  json.set("gas", gas);
  json.set("gasStatus", gasStatus);
  json.set("airQuality", air);
  json.set("airStatus", airStatus);
  json.set("timestamp", time(nullptr));

  if (Firebase.RTDB.setJSON(&fbdo, path.c_str(), &json)) {
    Serial.println("Firebase write: success");
  } else {
    Serial.printf("Firebase write: failed - %s\n", fbdo.errorReason().c_str());
  }
}

// -------------------- LED Status --------------------
void showStatus(String gasStatus, String airStatus) {
  int statusLEDPin;

  if (gasStatus == "Danger" || airStatus == "Polluted") {
    statusLEDPin = redLEDPin;
  } else if (gasStatus == "Warning" || airStatus == "Moderate") {
    statusLEDPin = yellowLEDPin;
  } else {
    statusLEDPin = greenLEDPin;
  }

  digitalWrite(redLEDPin, LOW);
  digitalWrite(yellowLEDPin, LOW);
  digitalWrite(greenLEDPin, LOW);

  if (statusLEDPin == greenLEDPin) {
    digitalWrite(greenLEDPin, HIGH);
    return;
  }

  if (millis() - lastBlinkTime >= 500) {
    lastBlinkTime = millis();
    ledState = !ledState;
    digitalWrite(statusLEDPin, ledState ? HIGH : LOW);
  }
}

// -------------------- Setup --------------------
void setup() {
  Serial.begin(115200);
  pinMode(relayPin, OUTPUT);
  pinMode(redLEDPin, OUTPUT);
  pinMode(yellowLEDPin, OUTPUT);
  pinMode(greenLEDPin, OUTPUT);

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected!");

  configTime(8 * 3600, 0, "⁦pool.ntp.org⁩", "⁦time.nist.gov⁩");
  while (time(nullptr) < 100000) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nTime synchronized!");

  config.api_key = API_KEY;
  config.database_url = DATABASE_URL;
  auth.user.email = USER_EMAIL;
  auth.user.password = USER_PASSWORD;
  config.token_status_callback = tokenStatusCallback;

  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);
}

// -------------------- Loop --------------------
void loop() {
  int gas = analogRead(gasPin);
  int air = analogRead(airPin);

  String gasStatus = (gas >= GAS_HIGH) ? "Danger" : (gas >= GAS_WARN) ? "Warning" : "Safe";
  String airStatus = (air < AIR_CLEAN) ? "Clean" : (air < AIR_POLLUTED) ? "Moderate" : "Polluted";
  bool dangerDetected = (gasStatus == "Danger" || airStatus == "Polluted");

  if (airStatus == "Polluted") {
    wasAirPolluted = true;
  }

  if (airStatus == "Clean" && wasAirPolluted) {
    String timestamp = getFormattedTime();
    writeToFirebase(gas, gasStatus, air, airStatus, timestamp);
    Serial.printf("\xF0\x9F\x8C\xBF Clean Air Detected After Pollution: gas=%d (%s), air=%d (%s), %s\n",
                  gas, gasStatus.c_str(), air, airStatus.c_str(), timestamp.c_str());
    wasAirPolluted = false;
  }

  String timestamp = getFormattedTime();
  Serial.printf("[%s] Gas: %d (%s), Air: %d (%s)\n", timestamp.c_str(), gas, gasStatus.c_str(), air, airStatus.c_str());

  showStatus(gasStatus, airStatus);
  digitalWrite(relayPin, dangerDetected ? HIGH : LOW);

  if (dangerDetected) {
    Serial.println("Danger detected!\xE2\x9A\xA0\xEF\xB8\x8F Monitoring for 3 seconds...");

    int maxGas = gas, maxAir = air;
    unsigned long start = millis();
    while (millis() - start < 3000) {
      int g = analogRead(gasPin);
      int a = analogRead(airPin);
      if (g > maxGas) maxGas = g;
      if (a > maxAir) maxAir = a;
      delay(200);
    }

    String maxGasStatus = (maxGas >= GAS_HIGH) ? "Danger" : (maxGas >= GAS_WARN) ? "Warning" : "Safe";
    String maxAirStatus = (maxAir < AIR_CLEAN) ? "Clean" : (maxAir < AIR_POLLUTED) ? "Moderate" : "Polluted";

    timestamp = getFormattedTime();
    writeToFirebase(maxGas, maxGasStatus, maxAir, maxAirStatus, timestamp);
    Serial.printf("Logged danger: gas=%d (%s), air=%d (%s), %s\n", maxGas, maxGasStatus.c_str(), maxAir, maxAirStatus.c_str(), timestamp.c_str());

    environmentWasDirty = true;

    Serial.println("DANGER ALERT!\xE2\x9A\xA0\xEF\xB8\x8F SCANNING IF EVERYTHING IS OKAY!\xE2\x9A\xA0\xEF\xB8\x8F");
    delay(4000);

    int finalGas = analogRead(gasPin);
    int finalAir = analogRead(airPin);

    if (finalGas < GAS_WARN && finalAir < AIR_CLEAN && environmentWasDirty) {
      String finalGasStatus = (finalGas >= GAS_HIGH) ? "Danger" : (finalGas >= GAS_WARN) ? "Warning" : "Safe";
      String finalAirStatus = (finalAir < AIR_CLEAN) ? "Clean" : (finalAir < AIR_POLLUTED) ? "Moderate" : "Polluted";

      timestamp = getFormattedTime();
      writeToFirebase(finalGas, finalGasStatus, finalAir, finalAirStatus, timestamp);
      Serial.printf("\xF0\x9F\x9B\xA1\xEF\xB8\x8F Environment clean\xE2\x9C\x85: gas=%d (%s), air=%d (%s), %s\n",
                    finalGas, finalGasStatus.c_str(), finalAir, finalAirStatus.c_str(), timestamp.c_str());
      delay(2000);
      environmentWasDirty = false;
    }
  }

  delay(1000);
}