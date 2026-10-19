const fs = require('fs');
const path = require('path');

const FILE_PATH = path.join(__dirname, '..', 'database', 'groupSettings.json');

function loadAll() {
    try {
        const raw = fs.readFileSync(FILE_PATH, 'utf8');
        const parsed = JSON.parse(raw);
        return {
            welcome: parsed.welcome || {},
            goodbye: parsed.goodbye || {},
            antilink: parsed.antilink || {},
        };
    } catch {
        return { welcome: {}, goodbye: {}, antilink: {} };
    }
}

function saveAll(data) {
    try {
        fs.mkdirSync(path.dirname(FILE_PATH), { recursive: true });
        fs.writeFileSync(FILE_PATH, JSON.stringify(data, null, 2));
    } catch (err) {
        console.error(`[GROUP-SETTINGS] Gagal simpan ke ${FILE_PATH}: ${err.message}`);
    }
}

module.exports = { loadAll, saveAll, FILE_PATH };