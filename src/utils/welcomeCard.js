const sharp = require('sharp');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const config = require('../config');
const { getAssetBuffer } = require('./remoteAsset');
const { normJid } = require('./helper');

const CONFIG = {
    avatar: {
        size: 220,
        x: 180,
        y: 180,
        shape: 'circle',
        borderRadius: 0,
        borderWidth: 0,
        borderColor: '#ffffff',
    },

    text: {
        title: {
            x: 400, y: 75, size: 36, color: '#ffcc00',
            weight: 'bold', anchor: 'start',
        },
        name: {
            x: 400, y: 160, size: 34, minSize: 22, color: '#ffffff',
            weight: 'bold', maxChars: 34, anchor: 'start', lineGap: 50,
        },
        number: {
            x: 400, size: 22, color: '#cfcfcf',
            weight: 'normal', maxChars: 24, anchor: 'start', lineGap: 42,
        },
        bio: {
            x: 400, size: 20, color: '#b8b8b8',
            weight: 'normal', maxChars: 44, anchor: 'start', lineGap: 42,
        },
        memberCount: {
            x: 400, size: 20, color: '#b8b8b8',
            weight: 'normal', anchor: 'start',
        },
    },

    panelRightEdge: 940,
    panelBottom: 330,
    watermark: {
        enabled: true,
        text: null,
        size: 16,
        color: 'rgba(255,255,255,0.45)',
        weight: 'normal',
        marginX: 0,
        marginY: 6,
    },

    badge: {
        enabled: true,
        x: 180, y: 313, size: 15, color: '#ffffff',
        weight: 'bold', anchor: 'middle',
    },

    outputWidth: null,
    outputHeight: null,
};

const TYPE_META = {
    welcome: { title: 'SELAMAT DATANG', badge: 'GABUNG' },
    goodbye: { title: 'SAMPAI JUMPA', badge: 'KELUAR' },
    promote: { title: 'NAIK JABATAN', badge: 'ADMIN' },
    demote: { title: 'TURUN JABATAN', badge: 'MEMBER' },
};

function escapeXml(str = '') {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

function splitGraphemes(str = '') {
    try {
        const seg = new Intl.Segmenter('id', { granularity: 'grapheme' });
        return Array.from(seg.segment(str), (s) => s.segment);
    } catch {
        return Array.from(str);
    }
}

function truncate(str = '', max = 30) {
    if (!str) return '';
    const graphemes = splitGraphemes(str);
    if (graphemes.length <= max) return str;
    return graphemes.slice(0, max - 1).join('') + '…';
}

async function measureTextWidth(text, fontSize, weight = 'normal') {
    if (!text) return 0;
    const probe = `<svg xmlns="http://www.w3.org/2000/svg" width="4000" height="${fontSize * 2}">
        <text x="0" y="${fontSize}" font-size="${fontSize}" font-weight="${weight}"
            font-family="sans-serif">${escapeXml(text)}</text>
    </svg>`;
    try {
        const { info } = await sharp(Buffer.from(probe)).trim().toBuffer({ resolveWithObject: true });
        return info.width;
    } catch {
        return 0;
    }
}

async function fitTextToWidth(text, fieldCfg, maxWidth) {
    if (!text) return { text: '', size: fieldCfg.size };

    const minSize = fieldCfg.minSize || fieldCfg.size;
    let size = fieldCfg.size;
    let width = await measureTextWidth(text, size, fieldCfg.weight);

    if (width > maxWidth && size > minSize) {
        const scale = maxWidth / width;
        size = Math.max(minSize, Math.floor(size * scale));
        width = await measureTextWidth(text, size, fieldCfg.weight);
    }

    if (width <= maxWidth) {
        return { text, size };
    }

    const graphemes = splitGraphemes(text);
    let lo = 1;
    let hi = graphemes.length;
    let best = (graphemes[0] || '') + '…';

    while (lo <= hi) {
        const mid = Math.ceil((lo + hi) / 2);
        const candidate = graphemes.slice(0, mid).join('') + '…';
        const w = await measureTextWidth(candidate, size, fieldCfg.weight);
        if (w <= maxWidth) {
            best = candidate;
            lo = mid + 1;
        } else {
            hi = mid - 1;
        }
    }

    return { text: best, size };
}

async function fetchAvatarBuffer(Hanz, jid) {
    try {
        const url = await Hanz.profilePictureUrl(jid, 'image');
        const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 10000 });
        return Buffer.from(res.data);
    } catch {
        return null;
    }
}

async function fetchBio(Hanz, jid) {
    try {
        const status = await Hanz.fetchStatus(jid);
        return status?.status || status?.[0]?.status?.status || '';
    } catch {
        return '';
    }
}

function buildAvatarMaskSvg(size, shape, radius) {
    if (shape === 'circle') {
        return `<svg width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="#fff"/></svg>`;
    }
    if (shape === 'rounded') {
        return `<svg width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${radius}" ry="${radius}" fill="#fff"/></svg>`;
    }
    return `<svg width="${size}" height="${size}"><rect width="${size}" height="${size}" fill="#fff"/></svg>`;
}

async function processAvatar(rawBuffer, avatarCfg) {
    const { size, shape, borderRadius } = avatarCfg;

    let img = sharp(rawBuffer).resize(size, size, { fit: 'cover' });

    const mask = Buffer.from(buildAvatarMaskSvg(size, shape, borderRadius));
    img = img.composite([{ input: mask, blend: 'dest-in' }]);

    return img.png().toBuffer();
}

async function buildFallbackAvatar(size, avatarCfg) {
    const svg = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
        <rect width="${size}" height="${size}" fill="#3a3550"/>
        <circle cx="${size / 2}" cy="${size * 0.38}" r="${size * 0.18}" fill="#8a84a8"/>
        <ellipse cx="${size / 2}" cy="${size * 0.84}" rx="${size * 0.32}" ry="${size * 0.26}" fill="#8a84a8"/>
    </svg>`;
    const buf = await sharp(Buffer.from(svg)).png().toBuffer();

    if (avatarCfg) {
        const mask = Buffer.from(buildAvatarMaskSvg(size, avatarCfg.shape, avatarCfg.borderRadius));
        return sharp(buf).composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer();
    }
    return buf;
}

function drawText(c, value, y, sizeOverride) {
    if (!c || !value) return '';
    const size = sizeOverride || c.size;
    return `<text x="${c.x}" y="${y}" font-size="${size}" fill="${c.color}"
        font-weight="${c.weight}" text-anchor="${c.anchor}"
        font-family="sans-serif">${escapeXml(value)}</text>`;
}

async function buildTextOverlaySvg(cfg, data) {
    const { text } = cfg;
    const lines = [];

    lines.push(drawText(text.title, data.title, text.title.y));
    const stack = [
        ['name', data.name || '', text.name],
        ['number', truncate(data.number, text.number.maxChars), text.number],
        ['bio', truncate(data.bio, text.bio.maxChars), text.bio],
        ['memberCount', data.memberCount, text.memberCount],
    ].filter(([, value]) => !!value);

    const sparse = stack.length <= 2;

    let cursorY = sparse ? 130 : text.name.y;
    const gapScale = sparse ? 0.85 : 1;

    const maxNameWidth = cfg.panelRightEdge - text.name.x;

    for (let i = 0; i < stack.length; i++) {
        const [key, value, c] = stack[i];
        let renderValue = value;
        let renderSize = c.size;

        if (key === 'name') {

            const sizeBoost = sparse ? 4 : 0;
            const fitted = await fitTextToWidth(value, { ...c, size: c.size + sizeBoost }, maxNameWidth);
            renderValue = fitted.text;
            renderSize = fitted.size;
        }

        lines.push(drawText(c, renderValue, cursorY, renderSize));
        const gap = (c.lineGap || Math.round(c.size * 1.4)) * gapScale;
        cursorY += gap;
    }

    if (cfg.watermark && cfg.watermark.enabled) {
        const wm = cfg.watermark;
        const wmText = wm.text || data.botName || '';
        if (wmText) {
            lines.push(`<text x="${cfg.panelRightEdge - wm.marginX}" y="${cfg.panelBottom - wm.marginY}"
                font-size="${wm.size}" fill="${wm.color}" font-weight="${wm.weight}"
                text-anchor="end" font-family="sans-serif">${escapeXml(wmText)}</text>`);
        }
    }

    if (cfg.badge && cfg.badge.enabled && data.badgeText) {
        const b = cfg.badge;
        lines.push(`<text x="${b.x}" y="${b.y}" font-size="${b.size}" fill="${b.color}"
            font-weight="${b.weight}" text-anchor="${b.anchor}"
            font-family="sans-serif">${escapeXml(data.badgeText)}</text>`);
    }

    return `<svg width="${data.width}" height="${data.height}" xmlns="http://www.w3.org/2000/svg">
        ${lines.join('\n')}
    </svg>`;
}

/**
 * Fungsi utama. Panggil ini dari messageHandler.
 *
 * @param {object} params
 * @param {object} params.Hanz - instance baileys
 * @param {string} params.jid - jid user yang masuk/keluar
 * @param {string} params.groupJid
 * @param {'welcome'|'goodbye'|'promote'|'demote'} params.type
 * @param {string} params.name - pushname / fallback nomor
 * @param {number} params.memberCount
 * @returns {Promise<Buffer>} buffer gambar JPEG siap kirim
 */
async function generateCard({ Hanz, jid, groupJid, type, name, memberCount }) {
    const frameBuffer = await getAssetBuffer('welcome');

    const number = normJid(jid);

    const [rawAvatar, bio] = await Promise.all([
        fetchAvatarBuffer(Hanz, jid),
        fetchBio(Hanz, jid),
    ]);

    const frame = sharp(frameBuffer);
    const meta = await frame.metadata();
    const width = CONFIG.outputWidth || meta.width;
    const height = CONFIG.outputHeight || meta.height;

    const composites = [];

    {
        const avatarBuf = rawAvatar
            ? await processAvatar(rawAvatar, CONFIG.avatar)
            : await buildFallbackAvatar(CONFIG.avatar.size, CONFIG.avatar);
        const { size, x, y } = CONFIG.avatar;
        composites.push({
            input: avatarBuf,
            left: Math.round(x - size / 2),
            top: Math.round(y - size / 2),
        });
    }

    const hasRealName = !!name;
    const typeMeta = TYPE_META[type] || { title: type.toUpperCase(), badge: '' };
    const textSvg = await buildTextOverlaySvg(CONFIG, {
        title: typeMeta.title,
        name: hasRealName ? name : `+${number}`,
        number: hasRealName ? `+${number}` : '',
        bio,
        memberCount: memberCount ? `Total ${memberCount} member di grup ini` : '',
        botName: config.botName,
        badgeText: typeMeta.badge,
        width,
        height,
    });
    composites.push({ input: Buffer.from(textSvg), left: 0, top: 0 });

    return frame.composite(composites).jpeg({ quality: 90 }).toBuffer();
}

module.exports = { generateCard, CONFIG };