const fs = require('fs');
const path = require('path');
const config = require('../config');

const KEYS = ['botMode', 'prefix', 'noPrefix', 'quoteStyle', 'menuStyle', 'autoTyping', 'autoRead', 'noSelfSync'];

function defaults() {
    return {
        botMode: config.botMode || 'public',
        prefix: config.prefix !== undefined ? config.prefix : '!',
        noPrefix: (config.noPrefix !== false),
        quoteStyle: (config.quoteStyle || 'pay'),
        menuStyle: parseInt(config.menuStyle, 10) || 1,
        autoTyping: (config.autoTyping !== false),
        autoRead: (config.autoRead !== false),
        noSelfSync: (config.noSelfSync === true),
    };
}

function settingsPath(Hanz) {
    if (!Hanz || !Hanz.authFolder) return null;
    try {
        return path.join(Hanz.authFolder, 'settings.json');
    } catch { return null; }
}

function loadCloneSettings(Hanz) {
    const d = defaults();
    d.botMode = 'public';
    if (!Hanz) return d;
    const p = settingsPath(Hanz);
    let fileData = {};
    if (p) {
        try {
            if (fs.existsSync(p)) fileData = JSON.parse(fs.readFileSync(p, 'utf-8')) || {};
        } catch { fileData = {}; }
    }
    for (const k of KEYS) {
        if (fileData[k] !== undefined) Hanz[k] = fileData[k];
        else if (Hanz[k] === undefined) Hanz[k] = d[k];
    }
    if (typeof Hanz.botMode === 'string') Hanz.botMode = Hanz.botMode.toLowerCase().trim() || 'public';
    if (typeof Hanz.quoteStyle === 'string') Hanz.quoteStyle = Hanz.quoteStyle.toLowerCase().trim() || 'pay';
    Hanz.menuStyle = parseInt(Hanz.menuStyle, 10) || 1;
    Hanz.noPrefix = Hanz.noPrefix !== false && Hanz.noPrefix !== 0 && Hanz.noPrefix !== 'off';
    Hanz.autoTyping = !!Hanz.autoTyping;
    Hanz.autoRead = !!Hanz.autoRead;
    Hanz.noSelfSync = !!Hanz.noSelfSync;
    return Hanz;
}

function saveCloneSettings(Hanz) {
    const p = settingsPath(Hanz);
    if (!p) return false;
    try {
        fs.mkdirSync(path.dirname(p), { recursive: true });
        const data = {};
        for (const k of KEYS) data[k] = Hanz[k];
        fs.writeFileSync(p, JSON.stringify(data, null, 2));
        return true;
    } catch (e) {
        console.error(`[CLONE-SETTINGS] Gagal simpan ${p}: ${e.message}`);
        return false;
    }
}

function getSetting(Hanz, isMain, key) {
    const d = defaults();
    if (!isMain && Hanz && Hanz[key] !== undefined) return Hanz[key];
    if (global[key] !== undefined) return global[key];
    if (config[key] !== undefined) return config[key];
    return d[key];
}

function setSetting(Hanz, isMain, key, value) {
    if (!isMain && Hanz) {
        Hanz[key] = value;
        saveCloneSettings(Hanz);
    } else {
        global[key] = value;
        try { config[key] = value; } catch (_) {}
    }
    return value;
}


function getOwnerDisplay(Hanz, isMain = true) {
    if (isMain !== false) {
        return { name: config.ownerName, number: [].concat(config.superOwner).join(', ') };
    }
    const number = String(Hanz?.instanceKey || Hanz?.user?.id || '').split(':')[0].split('@')[0].replace(/\D/g, '');
    const name = Hanz?.user?.name || Hanz?.authState?.creds?.me?.name || config.ownerName;
    return { name, number: number || '-' };
}

module.exports = {
    getOwnerDisplay,
    KEYS,
    defaults,
    settingsPath,
    loadCloneSettings,
    saveCloneSettings,
    getSetting,
    setSetting,
};