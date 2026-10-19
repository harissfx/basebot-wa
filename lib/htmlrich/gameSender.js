const { randomUUID } = require('crypto');

/**
 * Bank sampel suara (opsional). File sfxBank.js dibuat oleh `npm run sfx` dari folder
 * lib/htmlrich/samples. Hanya sampel yang benar-benar dipakai sebuah game yang disisipkan ke
 * HTML-nya, supaya ukuran pesan tetap kecil. Kalau sfxBank.js belum ada atau kosong, game
 * memakai suara sintetis seperti biasa.
 * Batas ukuran opsional: set env HTMLRICH_MAX_KB (mis. 400). Kalau HTML + sampel melebihi batas,
 * sampel dibuang dan game dikirim dengan suara sintetis.
 */
let _bank = null;
function loadBank() {
    if (_bank) return _bank;
    try { _bank = require('./sfxBank'); } catch (_) { _bank = {}; }
    return _bank;
}

function fillSamples(html) {
    const bank = loadBank();
    const names = Object.keys(bank);
    if (!names.length || !html.includes('var SFXBANK=null;')) return html;
    const isShell = html.includes('var G=(function');
    const used = {};
    for (const n of names) {
        const re = isShell
            ? new RegExp("sfx\\([\\s\\S]{0,80}?['\"]" + n + "['\"]")
            : new RegExp('SFX\\.' + n + '\\b');
        if (re.test(html)) used[n] = bank[n];
    }
    if (!Object.keys(used).length) return html;
    const filled = html.replace('var SFXBANK=null;', () => 'var SFXBANK=' + JSON.stringify(used) + ';');
    const maxKb = parseInt(process.env.HTMLRICH_MAX_KB || '0', 10);
    const kb = Buffer.byteLength(filled) / 1024;
    if (maxKb && kb > maxKb) {
        console.warn('[htmlrich] HTML ' + kb.toFixed(0) + ' KB melebihi HTMLRICH_MAX_KB=' + maxKb + ', sampel dibuang');
        return html;
    }
    return filled;
}

/**
 * Musik latar (opsional). File musicBank.js dibuat oleh `npm run music` dari folder lib/htmlrich/music.
 * Game memilih trek lewat satu baris: SFX.music('*') atau G.music('*') (acak dari semua trek), atau nama trek tertentu
 * seperti SFX.music('bgm'). Hanya trek terpilih yang disisipkan ke HTML. Kalau trek tidak ada di bank, atau ukuran melebihi HTMLRICH_MAX_KB, game dikirim tanpa musik.
 */
let _music = null;
function loadMusicBank() {
    if (_music) return _music;
    try { _music = require('./musicBank'); } catch (_) { _music = {}; }
    return _music;
}

function fillMusic(html) {
    if (!html.includes('var SFXMUSIC=null;')) return html;
    const m = /(?:SFX|G)\.music\(\s*['"](\*|[A-Za-z][A-Za-z0-9]*)['"]/.exec(html);
    if (!m) return html;
    const bank = loadMusicBank();
    const names = Object.keys(bank);
    if (!names.length) return html;
    let pick;
    if (m[1] === '*') pick = process.env.HTMLRICH_MUSIC_ALL === '1' ? names : [names[Math.floor(Math.random() * names.length)]];
    else pick = bank[m[1]] ? [m[1]] : [];
    if (!pick.length) return html;
    const used = {};
    pick.forEach(n => { used[n] = bank[n]; });
    const filled = html.replace('var SFXMUSIC=null;', () => 'var SFXMUSIC=' + JSON.stringify(used) + ';');
    const maxKb = parseInt(process.env.HTMLRICH_MAX_KB || '0', 10);
    const kb = Buffer.byteLength(filled) / 1024;
    if (maxKb && kb > maxKb) {
        console.warn('[htmlrich] HTML ' + kb.toFixed(0) + ' KB melebihi HTMLRICH_MAX_KB=' + maxKb + ', musik latar dibuang');
        return html;
    }
    return filled;
}

function fillSfxBank(html) {
    return fillMusic(fillSamples(html));
}

/**
 * Pengirim bersama untuk game HTML (2048, Memory, Wordle).
 * Pola sama dengan snakeGame.js: pakai sock.sendHtml kalau ada di build Baileys,
 * kalau tidak ada fallback ke richResponseMessage.
 */
function buildHtmlMessage(html) {
    html = fillSfxBank(html);
    return {
        botForwardedMessage: {
            message: {
                richResponseMessage: {
                    messageType: 1,
                    unifiedResponse: {
                        data: Buffer.from(
                            JSON.stringify({
                                __typename: 'GenAIUnifiedResponse',
                                response_id: randomUUID(),
                                sections: [
                                    {
                                        __typename: 'GenAIUnifiedResponseSection',
                                        view_model: {
                                            __typename: 'GenAISingleLayoutViewModel',
                                            primitive: {
                                                __typename: 'FOAHtmlPrimitiveDemoDONOTUSE',
                                                trusted_sources: [],
                                                payload: html
                                            }
                                        }
                                    }
                                ]
                            })
                        ).toString('base64')
                    },
                    contextInfo: {
                        isForwarded: true,
                        forwardOrigin: 4
                    }
                }
            }
        }
    };
}

async function sendHtmlGame(sock, jid, html) {
    html = fillSfxBank(html);
    if (typeof sock.sendHtml === 'function') {
        return sock.sendHtml(jid, html);
    }
    const { generateWAMessageFromContent } = require('baileys');
    const msg = generateWAMessageFromContent(jid, buildHtmlMessage(html), {});
    await sock.relayMessage(jid, msg.message, { messageId: msg.key.id });
    return msg;
}

module.exports = { buildHtmlMessage, sendHtmlGame, fillSfxBank };