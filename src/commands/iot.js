'use strict';

/**
 * iot.js — command Smart Home (relay, LED) via MQTT.
 *
 * Dua cara kontrol yang tersedia:
 *   1. Text command manual:  !relay1 on / !relay2 off / !led on
 *   2. Menu list interaktif: !iotcontrol -> pilih dari daftar (single_select)
 *
 * Jumlah relay yang muncul di !iotcontrol itu KONFIGURABEL lewat !setrelay,
 * disimpan di src/database/relayConfig.json. Batas maksimal 8 slot — ini
 * bukan batas MQTT, tapi karena setiap slot butuh baris `case` literal di
 * file ini biar ke-detect otomatis sama PluginLoader (dia baca teks file,
 * bukan generate case secara dinamis). Kalau suatu saat butuh lebih dari 8,
 * tinggal tambah baris case-nya manual (lihat MAX_RELAY di bawah).
 *
 * KEAMANAN: semua command di sini (kecuali !iotmenu) di-lock ke Owner.
 */

const fs = require('fs');
const path = require('path');
const config = require('../config');
const mess = config.mess;
const mqttClient = require('../utils/mqttClient');
const { generateEsp32Ino } = require('../utils/inoGenerator');

const MAX_RELAY = 8;
const RELAY_CONFIG_PATH = path.join(__dirname, '..', 'database', 'relayConfig.json');

function getRelayConfig() {
    try {
        const cfg = JSON.parse(fs.readFileSync(RELAY_CONFIG_PATH, 'utf8'));
        return { count: typeof cfg.count === 'number' ? cfg.count : 1, labels: cfg.labels || {}, pins: cfg.pins || {} };
    } catch {
        return { count: 1, labels: {}, pins: {} };
    }
}

function saveRelayConfig(cfg) {
    fs.mkdirSync(path.dirname(RELAY_CONFIG_PATH), { recursive: true });
    fs.writeFileSync(RELAY_CONFIG_PATH, JSON.stringify(cfg, null, 2));
}

function relayLabel(cfg, relayId) {
    return cfg.labels[relayId] || `Relay ${relayId.replace('relay', '')}`;
}

async function handleDeviceToggle(m, deviceId, state) {
    if (deviceId.startsWith('relay')) {
        const num = parseInt(deviceId.replace('relay', ''), 10);
        const cfg = getRelayConfig();
        if (num > cfg.count) {
            return m.reply({
                text: `⚠️ ${relayLabel(cfg, deviceId)} belum diaktifkan.\nAktifkan dulu dengan ${m.prefix}setrelay ${num} (atau lebih).`
            });
        }
    }

    try {
        mqttClient.publish('control', { command: deviceId, state });
        const label = deviceId === 'led' ? 'LED' : relayLabel(getRelayConfig(), deviceId);
        await m.reply({ text: `✅ *${label}* di-set ke *${state.toUpperCase()}*.` });
    } catch (err) {
        await m.reply({ text: `❌ Gagal kirim perintah: ${err.message}` });
    }
}

const IOT_COMMANDS = ['setmqtt', 'mqttinfo', 'relay1', 'relay2', 'led', 'setrelay', 'relaylabel', 'relaypin', 'delrelay', 'dellabel', 'iotcontrol', 'getino'];

const handler = async (m) => {
    const { command, isOwner, isSuperOwner } = m;
    const p = m.prefix;

    const isDeviceToggle = /^(relay\d+|led)_(on|off)$/.test(command.name);

    if ((IOT_COMMANDS.includes(command.name) || isDeviceToggle) && !isOwner && !isSuperOwner) {
        return m.reply(mess.owner);
    }

    switch (command.name) {
        case 'iotmenu':
            await m.reply({
                text: `🏠 *SMART HOME (MQTT)*\n\n` +
                    `📡 *Setup broker* (Super Owner):\n` +
                    `${p}setmqtt <brokerUrl> <topic>\n` +
                    `${p}setmqtt <brokerUrl> <user> <pass> <topic>\n` +
                    `${p}mqttinfo\n\n` +
                    `⚙️ *Konfigurasi relay:*\n` +
                    `${p}setrelay <jumlah 1-${MAX_RELAY}>\n` +
                    `${p}relaylabel <nomor> <nama>\n` +
                    `${p}relaypin <nomor> <pin GPIO>\n` +
                    `${p}delrelay <nomor>\n` +
                    `${p}dellabel <nomor>\n\n` +
                    `📥 *Firmware:*\n` +
                    `${p}getino  (generate & kirim file .ino sesuai konfigurasi)\n\n` +
                    `🔌 *Kontrol lewat text:*\n` +
                    `${p}relay1 <on/off>\n` +
                    `${p}relay2 <on/off>\n` +
                    `${p}led <on/off>\n\n` +
                    `📋 *Kontrol lewat menu list:*\n` +
                    `${p}iotcontrol\n\n` +
                    `⚠️ Semua command di atas khusus *Owner*.`
            });
            break;

        case 'setmqtt': {
            if (!isSuperOwner) {
                return m.reply(mess.superOwner);
            }

            const args = command.args;
            if (args.length !== 2 && args.length !== 4) {
                return m.reply({
                    text: `⚠️ Format:\n` +
                        `${p}setmqtt <brokerUrl> <topic>  (broker publik)\n` +
                        `${p}setmqtt <brokerUrl> <username> <password> <topic>  (broker privat)\n\n` +
                        `Contoh:\n` +
                        `${p}setmqtt broker.hivemq.com rumah/budi\n` +
                        `${p}setmqtt xxxx.s1.eu.hivemq.cloud user123 pass123 rumah/budi`
                });
            }

            const [brokerUrl, a1, a2, a3] = args;
            const username = args.length === 4 ? a1 : null;
            const password = args.length === 4 ? a2 : null;
            const topic = args.length === 4 ? a3 : a1;

            try {
                const cfg = mqttClient.setConfig({ brokerUrl, username, password, topic });
                await m.reply({
                    text: `✅ *Konfigurasi MQTT disimpan!*\n\n` +
                        `🌐 Broker: ${cfg.brokerUrl}\n📦 Topic: ${cfg.topic}\n🔐 Mode: ${username ? 'Private' : 'Public'}\n\n` +
                        `Mencoba menghubungkan ke broker...`
                });
            } catch (err) {
                await m.reply({ text: `❌ Gagal set konfigurasi: ${err.message}` });
            }
        }
            break;

        case 'mqttinfo': {
            const cfg = mqttClient.getConfig();
            if (!cfg) {
                return m.reply({ text: `⚠️ Belum ada konfigurasi MQTT. Gunakan ${p}setmqtt dulu.` });
            }
            await m.reply({
                text: `📡 *Konfigurasi MQTT saat ini*\n\n` +
                    `🌐 Broker: ${cfg.brokerUrl}\n📦 Topic: ${cfg.topic}\n🔐 Mode: ${cfg.username ? 'Private' : 'Public'}`
            });
        }
            break;

        case 'setrelay': {
            const n = parseInt(command.args[0], 10);
            if (!n || n < 1 || n > MAX_RELAY) {
                return m.reply({ text: `⚠️ Format: ${p}setrelay <jumlah 1-${MAX_RELAY}>` });
            }
            const cfg = getRelayConfig();
            cfg.count = n;
            saveRelayConfig(cfg);
            await m.reply({ text: `✅ Jumlah relay aktif diset ke *${n}*.\nCek daftarnya lewat ${p}iotcontrol.` });
        }
            break;

        case 'relaylabel': {
            const n = parseInt(command.args[0], 10);
            const label = command.args.slice(1).join(' ');
            if (!n || n < 1 || n > MAX_RELAY || !label) {
                return m.reply({
                    text: `⚠️ Format: ${p}relaylabel <nomor 1-${MAX_RELAY}> <nama>\nContoh: ${p}relaylabel 1 Lampu Ruang Tamu`
                });
            }
            const cfg = getRelayConfig();
            cfg.labels[`relay${n}`] = label;
            saveRelayConfig(cfg);
            await m.reply({ text: `✅ Relay ${n} sekarang diberi nama *${label}*.` });
        }
            break;

        case 'delrelay': {
            const cfg = getRelayConfig();
            const arg = (command.args[0] || '').toLowerCase();

            if (arg === 'all') {
                saveRelayConfig({ count: 0, labels: {} });
                return m.reply({ text: '🗑️ Semua relay dihapus dari daftar. Jumlah aktif sekarang 0.' });
            }

            const n = parseInt(arg, 10);
            if (!n || n < 1 || n > MAX_RELAY) {
                return m.reply({ text: `⚠️ Format: ${p}delrelay <nomor> atau ${p}delrelay all` });
            }
            if (n !== cfg.count) {
                return m.reply({
                    text: `⚠️ Cuma bisa hapus dari yang paling akhir.\nSekarang aktif ${cfg.count} relay, jadi yang bisa dihapus cuma relay ${cfg.count}.`
                });
            }

            delete cfg.labels[`relay${n}`];
            cfg.count = n - 1;
            saveRelayConfig(cfg);
            await m.reply({ text: `✅ Relay ${n} dihapus. Sekarang aktif ${cfg.count} relay.` });
        }
            break;

        case 'dellabel': {
            const n = parseInt(command.args[0], 10);
            if (!n || n < 1 || n > MAX_RELAY) {
                return m.reply({ text: `⚠️ Format: ${p}dellabel <nomor>` });
            }
            const cfg = getRelayConfig();
            delete cfg.labels[`relay${n}`];
            saveRelayConfig(cfg);
            await m.reply({ text: `✅ Label relay ${n} direset ke default (Relay ${n}).` });
        }
            break;

        case 'relaypin': {
            const n = parseInt(command.args[0], 10);
            const pin = parseInt(command.args[1], 10);
            if (!n || n < 1 || n > MAX_RELAY || Number.isNaN(pin)) {
                return m.reply({
                    text: `⚠️ Format: ${p}relaypin <nomor 1-${MAX_RELAY}> <pin GPIO>\nContoh: ${p}relaypin 1 26\n\nPin yang belum diisi akan jadi -1 di firmware (harus kamu set dulu).`
                });
            }
            const cfg = getRelayConfig();
            if (!cfg.pins) cfg.pins = {};
            cfg.pins[`relay${n}`] = pin;
            saveRelayConfig(cfg);
            await m.reply({ text: `✅ Relay ${n} sekarang dipetakan ke *GPIO ${pin}*.\nJangan lupa generate ulang firmware: ${p}getino` });
        }
            break;

        case 'getino': {
            const relayCfg = getRelayConfig();
            const mqttCfg = mqttClient.getConfig();

            if (relayCfg.count < 1) {
                return m.reply({ text: `⚠️ Belum ada relay yang aktif. Set dulu dengan ${p}setrelay.` });
            }

            const inoText = generateEsp32Ino(relayCfg, mqttCfg);
            const buffer = Buffer.from(inoText, 'utf8');

            await m.send({
                document: buffer,
                mimetype: 'text/x-arduino',
                fileName: 'esp32_smarthome.ino',
                caption: `📥 Firmware untuk ${relayCfg.count} relay + LED.\n` +
                    `⚠️ Buka file-nya dulu, isi WIFI_SSID/WIFI_PASSWORD` +
                    `${mqttCfg && mqttCfg.username ? ' dan MQTT_USERNAME/MQTT_PASSWORD' : ''} sebelum di-upload.`
            });
        }
            break;

        case 'relay1':
        case 'relay2':
        case 'relay3':
        case 'relay4':
        case 'relay5':
        case 'relay6':
        case 'relay7':
        case 'relay8':
        case 'led': {
            const state = (command.args[0] || '').toLowerCase();
            if (!['on', 'off'].includes(state)) {
                return m.reply({ text: `⚠️ Format: ${p}${command.name} <on/off>` });
            }
            try {
                mqttClient.publish('control', { command: command.name, state });
                await m.reply({ text: `✅ Perintah *${command.name} ${state.toUpperCase()}* terkirim ke device.` });
            } catch (err) {
                await m.reply({ text: `❌ Gagal kirim perintah: ${err.message}` });
            }
        }
            break;

        case 'iotcontrol': {
            const cfg = getRelayConfig();
            const relayRows = [];
            for (let i = 1; i <= cfg.count; i++) {
                const id = `relay${i}`;
                const label = relayLabel(cfg, id);
                relayRows.push({ id: `${id}_on`, title: `🟢 ${label} - ON`, description: 'Nyalakan' });
                relayRows.push({ id: `${id}_off`, title: `🔴 ${label} - OFF`, description: 'Matikan' });
            }

            const sections = [];
            if (relayRows.length > 0) {
                sections.push({ title: `🔌 Relay (${cfg.count} aktif)`, rows: relayRows });
            }
            sections.push({
                title: '💡 LED Indikator',
                rows: [
                    { id: 'led_on', title: '🟢 LED - ON', description: 'Nyalakan LED' },
                    { id: 'led_off', title: '🔴 LED - OFF', description: 'Matikan LED' },
                ]
            });

            await m.sendInteractive({
                text: '🏠 Pilih perangkat yang mau dikontrol:',
                footer: config.footerTxt,
                quoted: m.msg,
                buttons: [{
                    name: 'single_select',
                    buttonParamsJson: JSON.stringify({ title: '📂 Buka Kontrol', sections })
                }]
            });
        }
            break;

        case 'relay1_on': case 'relay1_off':
        case 'relay2_on': case 'relay2_off':
        case 'relay3_on': case 'relay3_off':
        case 'relay4_on': case 'relay4_off':
        case 'relay5_on': case 'relay5_off':
        case 'relay6_on': case 'relay6_off':
        case 'relay7_on': case 'relay7_off':
        case 'relay8_on': case 'relay8_off':
        case 'led_on': case 'led_off': {
            const [, deviceId, state] = command.name.match(/^(.+)_(on|off)$/);
            await handleDeviceToggle(m, deviceId, state);
        }
            break;
    }
};

module.exports = handler;