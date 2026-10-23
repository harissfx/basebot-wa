"use strict";

/**
 * mqttClient.js — jembatan antara bot WhatsApp dan broker MQTT (HiveMQ dkk)
 *
 * Versi ini fokus ke kontrol ON/OFF doang (relay, LED) — fire-and-forget,
 * gak nunggu balasan device. Monitoring sensor (dht/status) sengaja belum
 * ada, nanti ditambah lagi kalau sudah pasang sensor beneran.
 *
 * Tanggung jawab modul ini:
 *   1. Simpan & baca konfigurasi broker (broker url, user, pass, topic) di file JSON
 *   2. Connect/reconnect ke broker
 *   3. publish() -> kirim perintah satu arah ke topic {topic}/control
 */

const mqtt = require("mqtt");
const fs = require("fs");
const path = require("path");

const CONFIG_PATH = path.join(__dirname, "..", "database", "mqttConfig.json");

let client = null;

function loadConfig() {
  try {
    return JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));
  } catch {
    return null;
  }
}

function saveConfig(cfg) {
  fs.mkdirSync(path.dirname(CONFIG_PATH), { recursive: true });
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2));
}

function smartAutoProtocol(brokerUrl) {
  if (/^(mqtt|mqtts|ws|wss):\/\//i.test(brokerUrl)) return brokerUrl;

  if (brokerUrl.includes(":8883")) return `mqtts://${brokerUrl}`;
  if (brokerUrl.includes(":1883")) return `mqtt://${brokerUrl}`;

  const privateHosts = [
    "hivemq.cloud",
    "emqx.cloud",
    "aws",
    "azure",
    "googleapis",
  ];
  if (privateHosts.some((h) => brokerUrl.includes(h))) {
    return `mqtts://${brokerUrl}:8883`;
  }

  return `mqtt://${brokerUrl}:1883`;
}

function generateClientId() {
  return "wa-bot-" + Math.random().toString(36).slice(2, 8);
}

function setConfig({ brokerUrl, username, password, topic }) {
  const cfg = {
    brokerUrl: smartAutoProtocol(brokerUrl),
    username: username || null,
    password: password || null,
    topic,
  };
  saveConfig(cfg);

  if (client) {
    try {
      client.end(true);
    } catch (_) {}
    client = null;
  }
  connect();
  return cfg;
}

function getConfig() {
  return loadConfig();
}

function mainPrefix() {
  return require("./cloneSettings").getSetting(null, true, "prefix");
}

function connect() {
  const cfg = loadConfig();
  if (!cfg || !cfg.brokerUrl || !cfg.topic) {
    console.log(
      `[MQTT] Belum dikonfigurasi. Gunakan ${mainPrefix()}setmqtt <brokerUrl> <topic> dulu.`,
    );
    return;
  }

  if (client) {
    try {
      client.end(true);
    } catch (_) {}
    client = null;
  }

  client = mqtt.connect(cfg.brokerUrl, {
    clientId: generateClientId(),
    clean: true,
    username: cfg.username || undefined,
    password: cfg.password || undefined,
    reconnectPeriod: 5000,
    connectTimeout: 15000,
  });

  client.on("connect", () => {
    console.log(`[MQTT] Terhubung ke ${cfg.brokerUrl}`);
  });

  client.on("error", (err) => console.error("[MQTT] Error:", err.message));
  client.on("close", () =>
    console.log("[MQTT] Terputus dari broker, menunggu reconnect otomatis..."),
  );
}

function publish(subtopic, payloadObj) {
  const cfg = loadConfig();
  if (!client || !client.connected) {
    throw new Error(
      `MQTT belum terhubung. Cek konfigurasi dengan ${mainPrefix()}mqttinfo, atau set ulang dengan ${mainPrefix()}setmqtt.`,
    );
  }
  if (!cfg || !cfg.topic) {
    throw new Error("Topic MQTT belum diatur.");
  }

  const fullTopic = `${cfg.topic}/${subtopic}`;
  client.publish(fullTopic, JSON.stringify(payloadObj));
  return fullTopic;
}

module.exports = {
  connect,
  setConfig,
  getConfig,
  publish,
  smartAutoProtocol,
};
