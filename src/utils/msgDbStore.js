'use strict';

const fs = require('fs');
const path = require('path');

const STORE_PATH = path.join(__dirname, '..', 'database', 'msgDatabase.json');
const MEDIA_ROOT = path.join(__dirname, '..', 'database', 'msgMedia');

function ensureDirs() {
    fs.mkdirSync(MEDIA_ROOT, { recursive: true });
}

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
        ensureDirs();
        fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2));
    } catch (err) {
        console.error('[msgDbStore] Gagal simpan:', err.message);
    }
}

function get(name) {
    if (!name) return null;
    const db = load();
    return db[name.toLowerCase()] || null;
}

function set(name, entry) {
    const db = load();
    db[name.toLowerCase()] = entry;
    save(db);
    return entry;
}

function remove(name) {
    const db = load();
    const key = name.toLowerCase();
    if (!(key in db)) return false;
    const entry = db[key];
    if (entry?.mediaFile) {
        const p = path.join(MEDIA_ROOT, entry.mediaFile);
        try { if (fs.existsSync(p)) fs.unlinkSync(p); } catch {}
    }
    delete db[key];
    save(db);
    return true;
}

function list() {
    return load();
}

function mediaPath(filename) {
    ensureDirs();
    return path.join(MEDIA_ROOT, filename);
}

module.exports = {
    load,
    save,
    get,
    set,
    remove,
    list,
    mediaPath,
    MEDIA_ROOT,
};
