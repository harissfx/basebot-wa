'use strict';

const LED_PIN = 2;

function pinFor(cfg, relayIndex) {
    const key = `relay${relayIndex}`;
    if (cfg.pins && cfg.pins[key] != null) return cfg.pins[key];
    return null; 
}

function labelFor(cfg, relayIndex) {
    const key = `relay${relayIndex}`;
    return (cfg.labels && cfg.labels[key]) || `Relay ${relayIndex}`;
}

/**
 * @param {{count:number, labels?:object, pins?:object}} relayCfg
 * @param {{brokerUrl?:string, topic?:string, username?:string}|null} mqttCfg
 */
function generateEsp32Ino(relayCfg, mqttCfg) {
    const count = relayCfg.count || 0;

    const pins = [];
    const labelComments = [];
    const unconfigured = [];
    for (let i = 1; i <= count; i++) {
        const pin = pinFor(relayCfg, i);
        pins.push(pin === null ? -1 : pin);
        if (pin === null) {
            unconfigured.push(i);
            labelComments.push(`  // relayPins[${i - 1}] -> ${labelFor(relayCfg, i)} — ⚠️ BELUM DIKONFIGURASI (pin -1, nonaktif). Set lewat !relaypin ${i} <pin>`);
        } else {
            labelComments.push(`  // relayPins[${i - 1}] -> ${labelFor(relayCfg, i)} (GPIO ${pin})`);
        }
    }

    const isPrivate = !!(mqttCfg && mqttCfg.username);
    let host = 'broker.hivemq.com';
    let port = 1883;
    if (mqttCfg && mqttCfg.brokerUrl) {
        const m = mqttCfg.brokerUrl.match(/^mqtts?:\/\/([^:/]+)(?::(\d+))?/);
        if (m) {
            host = m[1];
            if (m[2]) port = parseInt(m[2], 10);
            else port = isPrivate ? 8883 : 1883;
        }
    }
    const topic = (mqttCfg && mqttCfg.topic) || 'rumah/kamar';

    return `/*
 * =======================================================
 * ESP32 Smart Home — auto-generated dari WhatsApp bot
 * =======================================================
 *
 * File ini di-generate otomatis berdasarkan konfigurasi kamu:
 *   - Jumlah relay : ${count}
 *   - Broker       : ${host}:${port} (${isPrivate ? 'private, isi ulang username/password di bawah' : 'public, tanpa auth'})
 *   - Topic        : ${topic}
 *${unconfigured.length ? `\n * ⚠️ PERHATIAN: relay ${unconfigured.join(', ')} belum ada pin GPIO-nya.\n * Sebelum upload, set dulu lewat !relaypin <nomor> <pin> di WA, lalu !getino ulang.\n * Kalau tetap diupload apa adanya, relay itu nonaktif (pin -1) dan gak akan berfungsi.\n *` : ''}
 * WAJIB diisi manual (sengaja tidak di-generate demi keamanan):
 *   - WIFI_SSID / WIFI_PASSWORD
 *   - MQTT_USERNAME / MQTT_PASSWORD (kalau broker private)
 *
 * Library yang perlu diinstall lewat Library Manager:
 *   - PubSubClient (by Nick O'Leary)
 *   - ArduinoJson (versi 6.x, by Benoit Blanchon)
 */

#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

// ==========================================
// KONFIGURASI — edit di sini saja
// ==========================================

const char* WIFI_SSID     = "NAMA_WIFI_KAMU";
const char* WIFI_PASSWORD = "PASSWORD_WIFI_KAMU";

#define USE_PRIVATE_BROKER ${isPrivate ? 'true' : 'false'}

const char* MQTT_HOST = "${host}";
const int   MQTT_PORT = ${port};

// Isi ini kalau USE_PRIVATE_BROKER true (jangan commit ke git ya!)
const char* MQTT_USERNAME = "ISI_USERNAME_MQTT";
const char* MQTT_PASSWORD = "ISI_PASSWORD_MQTT";

const char* BASE_TOPIC = "${topic}";

#define LED_PIN ${LED_PIN}
#define RELAY_COUNT ${count}

// Pin relay, urut relay1..relay${count || 'N'}. Ganti sesuai wiring kamu.
const int relayPins[RELAY_COUNT > 0 ? RELAY_COUNT : 1] = {${pins.length ? pins.join(', ') : '/* belum ada relay dikonfigurasi */'}};
${labelComments.join('\n')}

// ==========================================
// Jangan perlu diubah di bawah ini
// ==========================================

WiFiClient plainClient;
WiFiClientSecure secureClient;
PubSubClient client(USE_PRIVATE_BROKER ? (Client&)secureClient : (Client&)plainClient);

String topicControl = String(BASE_TOPIC) + "/control";

bool ledState = false;
bool relayState[RELAY_COUNT > 0 ? RELAY_COUNT : 1];

void setLed(bool on) {
    ledState = on;
    digitalWrite(LED_PIN, on ? HIGH : LOW);
}

void setRelay(int index, bool on) {
    if (index < 0 || index >= RELAY_COUNT) return;
    if (relayPins[index] < 0) {
        Serial.printf("relay%d belum dikonfigurasi pin-nya (skip)\\n", index + 1);
        return;
    }
    relayState[index] = on;
    digitalWrite(relayPins[index], on ? HIGH : LOW);
}

void handleMessage(char* topicC, byte* payload, unsigned int length) {
    StaticJsonDocument<256> doc;
    DeserializationError err = deserializeJson(doc, payload, length);
    if (err) {
        Serial.println("Payload bukan JSON valid, diabaikan.");
        return;
    }

    String command = doc["command"] | "";
    String state = doc["state"] | "";
    bool on = (state == "on");

    if (command == "led") {
        setLed(on);
        Serial.printf("LED di-set: %s\\n", ledState ? "ON" : "OFF");
        return;
    }

    if (command.startsWith("relay")) {
        int idx = command.substring(5).toInt() - 1; // "relay1" -> index 0
        setRelay(idx, on);
        Serial.printf("%s di-set: %s\\n", command.c_str(), on ? "ON" : "OFF");
    }
}

void connectWifi() {
    Serial.printf("Menghubungkan ke WiFi: %s", WIFI_SSID);
    WiFi.mode(WIFI_STA);
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    while (WiFi.status() != WL_CONNECTED) {
        delay(400);
        Serial.print(".");
    }
    Serial.printf("\\nWiFi terhubung, IP: %s\\n", WiFi.localIP().toString().c_str());
}

void connectMqtt() {
    if (USE_PRIVATE_BROKER) {
        secureClient.setInsecure(); // simpel: skip validasi sertifikat (cukup buat testing/rumahan)
    }

    client.setServer(MQTT_HOST, MQTT_PORT);
    client.setCallback(handleMessage);

    while (!client.connected()) {
        Serial.printf("Menghubungkan ke broker MQTT %s:%d ...\\n", MQTT_HOST, MQTT_PORT);

        String clientId = "esp32-" + String((uint32_t)ESP.getEfuseMac(), HEX);
        bool ok;

        if (USE_PRIVATE_BROKER) {
            ok = client.connect(clientId.c_str(), MQTT_USERNAME, MQTT_PASSWORD);
        } else {
            ok = client.connect(clientId.c_str());
        }

        if (ok) {
            Serial.println("Terhubung ke broker MQTT!");
            client.subscribe(topicControl.c_str());
            Serial.printf("Subscribe: %s\\n", topicControl.c_str());
        } else {
            Serial.printf("Gagal, rc=%d. Coba lagi 3 detik...\\n", client.state());
            delay(3000);
        }
    }
}

void setup() {
    Serial.begin(115200);

    pinMode(LED_PIN, OUTPUT);
    setLed(false);

    for (int i = 0; i < RELAY_COUNT; i++) {
        if (relayPins[i] < 0) continue; // belum dikonfigurasi, skip
        pinMode(relayPins[i], OUTPUT);
        setRelay(i, false);
    }

    connectWifi();
    connectMqtt();
}

void loop() {
    if (WiFi.status() != WL_CONNECTED) {
        connectWifi();
    }
    if (!client.connected()) {
        connectMqtt();
    }
    client.loop();
}
`;
}

module.exports = { generateEsp32Ino };