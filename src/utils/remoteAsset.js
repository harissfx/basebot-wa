'use strict';

const axios = require('axios');
const fs = require('fs');
const os = require('os');
const path = require('path');

const memCache = new Map();
const pending = new Map();
const CACHE_DIR = path.join(os.tmpdir(), 'wabot-assets');

const ASSET_URLS = {
    bahanProfile: 'https://files.catbox.moe/nbwjaw.jpeg',
    noProfile:    'https://files.catbox.moe/bjl8j1.png',
    magerNulis:   'https://files.catbox.moe/b33df9.jpg',
    welcome:      'https://files.catbox.moe/q53o2s.png',
};

function getUrl(key) {
    const url = ASSET_URLS[key];
    if (!url) throw new Error(`Asset "${key}" tidak terdaftar di ASSET_URLS.`);
    return url;
}

function tryGetUrl(key) {
    try { return getUrl(key); } catch { return null; }
}

function diskPath(key, url) {
    const ext = path.extname(new URL(url).pathname) || '.bin';
    return path.join(CACHE_DIR, `${key}${ext}`);
}

async function download(key) {
    const url = getUrl(key);
    const file = diskPath(key, url);
    try {
        const { data } = await axios.get(url, { responseType: 'arraybuffer', timeout: 20000 });
        const buf = Buffer.from(data);
        fs.mkdirSync(CACHE_DIR, { recursive: true });
        fs.writeFileSync(file, buf);
        return buf;
    } catch (err) {
        if (fs.existsSync(file)) {
            console.warn(`[ASSET] Gagal download ${key} (${err.message}), pakai cache lama.`);
            return fs.readFileSync(file);
        }
        throw new Error(`Gagal download asset "${key}" dari ${url}: ${err.message}`);
    }
}

async function getAssetBuffer(key) {
    if (memCache.has(key)) return memCache.get(key);
    if (!pending.has(key)) {
        pending.set(key, download(key).finally(() => pending.delete(key)));
    }
    const buf = await pending.get(key);
    memCache.set(key, buf);
    return buf;
}

async function getAssetPath(key) {
    await getAssetBuffer(key);
    return diskPath(key, getUrl(key));
}

module.exports = { getAssetBuffer, getAssetPath, tryGetUrl };