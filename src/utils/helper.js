/** Format detik ke string human-readable (1 hari 2 jam 3 menit) */
function formatUptime(seconds) {
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const parts = [];
    if (d > 0) parts.push(`${d} hari`);
    if (h > 0) parts.push(`${h} jam`);
    if (m > 0) parts.push(`${m} menit`);
    if (s > 0 || parts.length === 0) parts.push(`${s} detik`);
    return parts.join(' ');
}

/** Format nomor ke JID WhatsApp (support: 08xx, 628xx, atau tanpa prefix) */
function formatJid(number) {
    let n = number.replace(/\D/g, '');
    if (n.startsWith('0'))  n = '62' + n.slice(1);
    if (!n.startsWith('62')) n = '62' + n;
    return n + '@s.whatsapp.net';
}

/** Delay/pause execution */
function delay(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

/** Format bytes ke string human-readable */
function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/** Generate random string */
function randomString(length = 8) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

/** Ambil metadata grup */
async function getGroupInfo(Hanz, jid) {
    try {
        return await Hanz.groupMetadata(jid);
    } catch {
        return null;
    }
}

/** Cek apakah user adalah admin di grup */
async function isGroupAdmin(Hanz, groupJid, userJid) {
    try {
        const { participants } = await Hanz.groupMetadata(groupJid);
        const norm = (jid) => jid?.replace(/:[0-9]+/, '').split('@')[0];
        const target = norm(userJid);
        const p = participants.find((p) => {
            const pIds = [p.id, p.lid, p.jid].filter(Boolean).map(norm);
            return pIds.includes(target);
        });
        return p?.admin === 'admin' || p?.admin === 'superadmin';
    } catch {
        return false;
    }
}


const fs = require('fs');
const path = require('path');

// Daftar gambar yang tersedia di folder media/
const MEDIA = {
    logo:    path.join(__dirname, '../media/logo.png'),
    // tambah gambar lain di sini kalau perlu:
    // banner: path.join(__dirname, '../../media/banner.png'),
};

/**
 * Ambil buffer gambar dari media/ — tinggal tulis: getImage('logo')
 * Langsung siap dipakai di imageSource atau readFileSync
 */
function getImage(name = 'logo') {
    const imgPath = MEDIA[name];
    if (!imgPath || !fs.existsSync(imgPath)) return null;
    return fs.readFileSync(imgPath);
}

module.exports = { formatUptime, formatJid, delay, formatBytes, randomString, getGroupInfo, isGroupAdmin, getImage, MEDIA };