/**
 * Utility Helper Functions
 */

/** Format nomor ke JID WhatsApp (support: 08xx, 628xx, atau tanpa prefix) */
function formatJid(number) {
    let n = number.replace(/\D/g, '');
    if (n.startsWith('0'))  n = '62' + n.slice(1);
    if (!n.startsWith('62')) n = '62' + n;
    return n + '@s.whatsapp.net';
}

/** Format group ID ke JID grup */
function formatGroupJid(groupId) {
    return groupId.endsWith('@g.us') ? groupId : groupId + '@g.us';
}

/** Cek apakah JID adalah grup */
function isGroupJid(jid) { return jid.endsWith('@g.us'); }

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
async function getGroupInfo(sock, jid) {
    try {
        return await sock.groupMetadata(jid);
    } catch {
        return null;
    }
}

/** Cek apakah user adalah admin di grup */
async function isGroupAdmin(sock, groupJid, userJid) {
    try {
        const { participants } = await sock.groupMetadata(groupJid);
        const p = participants.find(p => p.id === userJid);
        return p?.admin === 'admin' || p?.admin === 'superadmin';
    } catch {
        return false;
    }
}

/** Ambil JID bot sendiri */
function getBotJid(sock) { return sock.user?.id || ''; }

module.exports = { formatJid, formatGroupJid, delay, formatBytes, randomString, isGroupJid, getGroupInfo, isGroupAdmin, getBotJid };
