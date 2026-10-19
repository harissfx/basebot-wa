'use strict';

const fs = require('fs');
const path = require('path');

const STORE_PATH = path.join(__dirname, '..', 'database', 'stickerCmd.json');

function load() {
    try {
        if (!fs.existsSync(STORE_PATH)) return {};
        const data = JSON.parse(fs.readFileSync(STORE_PATH, 'utf8'));
        return data && typeof data === 'object' ? data : {};
    } catch {
        return {};
    }
}

function save(data) {
    try {
        fs.mkdirSync(path.dirname(STORE_PATH), { recursive: true });
        fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2));
    } catch (err) {
        console.error('[stickerCmdStore] Gagal simpan:', err.message);
    }
}

function get(hash) {
    if (!hash) return null;
    const db = load();
    return db[hash] || null;
}

function lookup(message) {
    const hashes = hashesFromMessage(message);
    if (!hashes.length) return null;
    const db = load();
    for (const h of hashes) {
        if (db[h]) return { hash: h, entry: db[h] };
    }
    for (const [key, entry] of Object.entries(db)) {
        const aliases = Array.isArray(entry?.aliases) ? entry.aliases : [];
        if (hashes.some((h) => aliases.includes(h))) return { hash: key, entry };
    }
    return null;
}

function set(hash, entry) {
    const db = load();
    db[hash] = entry;
    save(db);
    return entry;
}

function remove(hash) {
    const db = load();
    if (!(hash in db)) return false;
    delete db[hash];
    save(db);
    return true;
}

function list() {
    return load();
}

const PENDING_TTL_MS = 2 * 60 * 1000;
const pending = new Map();

function setPending(senderKey, text) {
    pending.set(String(senderKey), { text, expires: Date.now() + PENDING_TTL_MS });
}

function takePending(senderKey) {
    const key = String(senderKey);
    const p = pending.get(key);
    if (!p) return null;
    pending.delete(key);
    return p.expires >= Date.now() ? p : null;
}

function hasPending(senderKey) {
    const p = pending.get(String(senderKey));
    return !!p && p.expires >= Date.now();
}

function normalizeSha256(raw) {
    if (!raw) return null;
    try {
        if (Buffer.isBuffer(raw)) {
            return raw.toString('base64');
        }
        if (raw instanceof Uint8Array) {
            return Buffer.from(raw).toString('base64');
        }
        if (Array.isArray(raw)) {
            return Buffer.from(raw).toString('base64');
        }
        if (typeof raw === 'object' && Array.isArray(raw.data)) {
            return Buffer.from(raw.data).toString('base64');
        }
        if (typeof raw === 'object' && raw !== null) {
            const keys = Object.keys(raw);
            if (keys.length && keys.every((k) => /^\d+$/.test(k))) {
                const arr = keys.sort((a, b) => a - b).map((k) => raw[k]);
                return Buffer.from(arr).toString('base64');
            }
        }
        if (typeof raw === 'string') {
            if (/^[A-Za-z0-9+/=]+$/.test(raw) && raw.length >= 20) {
                return raw;
            }
            return Buffer.from(raw, 'binary').toString('base64');
        }
        if (typeof raw.toString === 'function') {
            const s = raw.toString('base64');
            if (s && s !== '[object Object]') return s;
        }
    } catch (e) {
        console.warn('[stickerCmdStore] normalizeSha256 gagal:', e.message);
    }
    return null;
}

function unwrapMessage(message, depth = 0) {
    if (!message || typeof message !== 'object' || depth > 6) return null;

    if (message.stickerMessage) return message;

    const nestedKeys = [
        'ephemeralMessage',
        'viewOnceMessage',
        'viewOnceMessageV2',
        'viewOnceMessageV2Extension',
        'documentWithCaptionMessage',
        'editedMessage',
        'groupMentionedMessage',
        'botInvokeMessage',
        'lottieStickerMessage',
    ];

    for (const key of nestedKeys) {
        const inner = message[key]?.message;
        if (inner) {
            const found = unwrapMessage(inner, depth + 1);
            if (found) return found;
        }
    }

    return message;
}

function findStickerMessage(message) {
    const unwrapped = unwrapMessage(message);
    if (!unwrapped) return null;
    return unwrapped.stickerMessage || null;
}

function hashFromMessage(message) {
    if (!message) return null;
    const sticker = findStickerMessage(message);
    if (!sticker) return null;

    const hash =
        normalizeSha256(sticker.fileSha256) ||
        normalizeSha256(sticker.fileEncSha256) ||
        null;

    return hash;
}

function hashesFromMessage(message) {
    const sticker = findStickerMessage(message);
    if (!sticker) return [];
    const out = [];
    for (const raw of [sticker.fileSha256, sticker.fileEncSha256]) {
        const h = normalizeSha256(raw);
        if (h && !out.includes(h)) out.push(h);
    }
    return out;
}

function extractQuotedMessage(msg) {
    if (!msg?.message) return null;

    const root = unwrapMessage(msg.message) || msg.message;

    const candidates = [
        root.extendedTextMessage?.contextInfo?.quotedMessage,
        root.imageMessage?.contextInfo?.quotedMessage,
        root.videoMessage?.contextInfo?.quotedMessage,
        root.stickerMessage?.contextInfo?.quotedMessage,
        root.documentMessage?.contextInfo?.quotedMessage,
        root.buttonsResponseMessage?.contextInfo?.quotedMessage,
        root.templateButtonReplyMessage?.contextInfo?.quotedMessage,
        root.listResponseMessage?.contextInfo?.quotedMessage,
        root.interactiveResponseMessage?.contextInfo?.quotedMessage,
        root.contextInfo?.quotedMessage,
        msg.message.extendedTextMessage?.contextInfo?.quotedMessage,
        msg.message.ephemeralMessage?.message?.extendedTextMessage?.contextInfo?.quotedMessage,
    ];

    for (const q of candidates) {
        if (q) return q;
    }
    return null;
}

function hashFromQuoted(msg) {
    const quoted = extractQuotedMessage(msg);
    return hashFromMessage(quoted);
}

function inspectSticker(message) {
    const sticker = findStickerMessage(message);
    if (!sticker) return null;
    return {
        isAnimated: !!sticker.isAnimated,
        mimetype: sticker.mimetype || null,
        hash: normalizeSha256(sticker.fileSha256),
        hasSha: !!sticker.fileSha256,
    };
}

module.exports = {
    load,
    save,
    get,
    lookup,
    hashesFromMessage,
    setPending,
    takePending,
    hasPending,
    set,
    remove,
    list,
    hashFromMessage,
    hashFromQuoted,
    findStickerMessage,
    inspectSticker,
    normalizeSha256,
};