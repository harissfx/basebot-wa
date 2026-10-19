const config = require('../config');

/** Style 1 — request payment (default) */
const quotePay = {
    key: {
        remoteJid: '13135550002@s.whatsapp.net',
        id: 'quotednjirr',
        participant: '13135550002@s.whatsapp.net'
    },
    message: {
        requestPaymentMessage: {
            currencyCodeIso4217: 'IDR',
            amount1000: 999999000,
            requestFrom: '0@s.whatsapp.net',
            noteMessage: {
                extendedTextMessage: {
                    text: config.botName,
                }
            }
        }
    }
};

/** Style 2 — quoted kontak Meta AI */
const quoteMeta = {
    key: {
        remoteJid: '13135550002@s.whatsapp.net',
        fromMe: false,
        id: 'QUOTEMETA',
        participant: '13135550002@s.whatsapp.net',
    },
    message: {
        viewOnceMessage: {
            message: {
                contactMessage: {
                    displayName: 'Meta AI',
                    vcard:
                        'BEGIN:VCARD\n' +
                        'VERSION:3.0\n' +
                        'N:;;;;\n' +
                        'FN:Meta AI\n' +
                        'item1.TEL;waid=13135550002:+13135550002\n' +
                        'item1.X-ABLabel:Ponsel\n' +
                        'END:VCARD',
                },
            },
        },
    },
};

/** Style 3 — quoted sticker pack dari status@broadcast */
const quoteStatus = {
    key: {
        remoteJid: '13135550002@s.whatsapp.net',
        fromMe: false,
        id: 'QUOTESTATUS',
        participant: '13135550002@s.whatsapp.net',
    },
    message: {
        stickerPackMessage: {
            name: config.botName,
        }
    }
};

/** Style aktif untuk bot utama (global) */
function getCurrentStyle() {
    const raw = global.quoteStyle != null ? global.quoteStyle : config.quoteStyle;
    return String(raw || 'pay').toLowerCase().trim();
}

function getCurrentStyleFor(Hanz, isMain) {
    const { getSetting } = require('./cloneSettings');
    return String(getSetting(Hanz, isMain, 'quoteStyle') || 'pay').toLowerCase().trim();
}

/**
 * Ambil quoted aktif
 * - pay  → quotePay
 * - meta   → quoteMeta
 * - status → quoteStatus
 */
function getActiveQuote() {
    const style = getCurrentStyle();
    if (style === 'meta') return quoteMeta;
    if (style === 'status') return quoteStatus;
    return quotePay;
}

function getActiveQuoteFor(Hanz, isMain) {
    const style = getCurrentStyleFor(Hanz, isMain);
    if (style === 'meta') return quoteMeta;
    if (style === 'status') return quoteStatus;
    return quotePay;
}

function setQuoteStyle(style) {
    const s = String(style || 'pay').toLowerCase().trim();
    if (!['pay', 'meta', 'status'].includes(s)) return false;
    global.quoteStyle = s;
    try { config.quoteStyle = s; } catch (_) {}
    return true;
}

function setQuoteStyleFor(Hanz, isMain, style) {
    const s = String(style || 'pay').toLowerCase().trim();
    if (!['pay', 'meta', 'status'].includes(s)) return false;
    if (!isMain && Hanz) {
        Hanz.quoteStyle = s;
        try {
            const { saveCloneSettings } = require('./cloneSettings');
            saveCloneSettings(Hanz);
        } catch (_) {}
    } else {
        global.quoteStyle = s;
        try { config.quoteStyle = s; } catch (_) {}
    }
    return true;
}

const fakePay = quotePay;
const hideSenderQuote = quoteMeta;

module.exports = {
    quotePay,
    quoteMeta,
    quoteStatus,
    getActiveQuote,
    getActiveQuoteFor,
    getCurrentStyle,
    getCurrentStyleFor,
    setQuoteStyle,
    setQuoteStyleFor,
    fakePay,
    hideSenderQuote,
};