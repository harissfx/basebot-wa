const fs = require('fs');
const config = require('../config');

if (global.botMode === undefined) global.botMode = config.botMode;
const plugins = require('../utils/PluginLoader');
const chalk = require('chalk');
const readline = require('readline');
const { getContentType } = require('@whiskeysockets/baileys');
const { sendButtons, sendListMessage, sendInteractiveMessage, sendButtonWithImage, sendInteractiveWithImage } = require('../utils/interactiveHelper');
const { fakeOrder } = require('../utils/fquoted');

const superOwnerLidCache = new Set();
const coOwnerLidCache = new Set();

const COOLDOWN_MS = 5000;
const COOLDOWN_EXEMPT = new Set([
    'menu', 'ping',
    'generalmenu', 'ownermenu', 'ffmpegmenu',
    'downloadmenu', 'toolsmenu', 'jadibotmenu',
    'funmenu', 'groupmenu',
    'afk', 'welcome', 'goodbye', 'antilink',
]);
const cooldownMap = new Map();

const welcomeGroups = new Map();
const goodbyeGroups = new Map();
const antilinkGroups = new Map();

global.welcomeGroups = welcomeGroups;
global.goodbyeGroups = goodbyeGroups;
global.antilinkGroups = antilinkGroups;

global.afkUsers = global.afkUsers || new Map(); // senderNumber -> { reason, time }

setInterval(() => {
    const now = Date.now();
    for (const [key, timestamp] of cooldownMap) {
        if (now - timestamp > COOLDOWN_MS) cooldownMap.delete(key);
    }
}, 5 * 60 * 1000);

async function resolveOwnerLids(Hanz) {
    const resolveList = [
        { numbers: [].concat(config.superOwner), cache: superOwnerLidCache, label: 'SUPER' },
        { numbers: [].concat(config.coOwner || []), cache: coOwnerLidCache, label: 'CO' },
    ];
    for (const { numbers, cache, label } of resolveList) {
        for (const nomor of numbers.map(n => n.replace(/\D/g, ''))) {
            try {
                const [result] = await Hanz.onWhatsApp(nomor);
                if (result?.exists && result?.lid) {
                    const lidNum = result.lid.replace(/\D/g, '').replace(/@.+$/, '').split(':')[0];
                    cache.add(lidNum);
                    console.log(chalk.cyan(`[${label}-OWNER-LID] ${nomor} -> ${lidNum}@lid`));
                }
            } catch (e) {
                console.log(chalk.yellow(`[${label}-OWNER-LID] Gagal resolve ${nomor}: ${e.message}`));
            }
        }
    }
}

function extractMessageText(message) {
    if (!message) return null;
    const type = getContentType(message);
    switch (type) {
        case 'conversation': return message.conversation;
        case 'extendedTextMessage': return message.extendedTextMessage?.text;
        case 'imageMessage': return message.imageMessage?.caption;
        case 'videoMessage': return message.videoMessage?.caption;
        case 'buttonsResponseMessage': return message.buttonsResponseMessage?.selectedButtonId;
        case 'listResponseMessage': return message.listResponseMessage?.singleSelectReply?.selectedRowId;
        case 'templateButtonReplyMessage': return message.templateButtonReplyMessage?.selectedId;
        case 'interactiveResponseMessage': {
            const paramsJson = message.interactiveResponseMessage?.nativeFlowResponseMessage?.paramsJson;
            if (paramsJson) {
                try {
                    const parsed = JSON.parse(paramsJson);
                    return parsed.id;
                } catch {
                    return null;
                }
            }
            return null;
        }
        default: return null;
    }
}

function isGroup(jid) { return jid.endsWith('@g.us'); }
function isFromMe(msg) { return msg.key.fromMe; }

function getSenderNumber(sender, msg) {
    const candidates = [
        msg?.key?.senderPn,
        msg?.key?.participantAlt,
        msg?.key?.remoteJidAlt,
        msg?.key?.participant,
        msg?.key?.remoteJid,
        sender,
    ];
    const raw = candidates.find(v => v && !v.endsWith('@lid')) || candidates.find(v => v) || '';
    return raw.replace(/\D/g, '').replace(/@.+$/, '').split(':')[0];
}

function isSuperOwner(sender, msg) {
    const superOwners = [].concat(config.superOwner).map(n => n.replace(/\D/g, ''));
    const senderNumber = getSenderNumber(sender, msg);
    const fromMe = msg?.key?.fromMe || false;
    return superOwners.some(n => n === senderNumber) || superOwnerLidCache.has(senderNumber) || fromMe;
}

function isCoOwner(sender, msg) {
    const coOwners = [].concat(config.coOwner || []).map(n => n.replace(/\D/g, ''));
    const senderNumber = getSenderNumber(sender, msg);
    return coOwners.some(n => n === senderNumber) || coOwnerLidCache.has(senderNumber);
}

function isOwner(sender, msg) {
    return isSuperOwner(sender, msg) || isCoOwner(sender, msg);
}

function parseCommand(text) {
    const { prefix } = config;

    if (text.startsWith(prefix)) {
        const args = text.slice(prefix.length).trim().split(/ +/);
        const name = args.shift().toLowerCase();
        return { name, args, fullArgs: args.join(' '), raw: text, hasPrefix: true };
    }

    const words = text.trim().split(/ +/);
    const name = words[0].toLowerCase();
    if (plugins.has(name)) {
        const args = words.slice(1);
        return { name, args, fullArgs: args.join(' '), raw: text, hasPrefix: false };
    }

    return null;
}

async function handleMessages(Hanz, m, isMain = true) {
    for (const msg of m.messages) {
        if (!msg.message) continue;

        const fromMe = isFromMe(msg);
        const sender = msg.key.remoteJid;

        const checkOwner = isOwner(sender, msg);
        const checkSuperOwner = isSuperOwner(sender, msg);
        const checkCoOwner = isCoOwner(sender, msg);

        if (!fromMe && global.botMode === 'self' && !checkOwner) continue;

        const text = extractMessageText(msg.message);
        if (!text) continue;

        if (!fromMe) {
            readline.clearLine(process.stdout, 0);
            readline.cursorTo(process.stdout, 0);

            console.log(
                chalk.blue(`[INBOUND] `) +
                chalk.cyan(sender) +
                chalk.white(`: ${text}`)
            );
        }

        if (config.autoRead) await Hanz.readMessages([msg.key]);
        if (config.autoTyping && !isGroup(sender)) await Hanz.sendPresenceUpdate('composing', sender);

        if (isGroup(sender) && global.antilinkGroups?.get(sender) && !checkOwner) {
            const linkRegex = /https?:\/\/|wa\.me\/|chat\.whatsapp\.com\/|bit\.ly\/|t\.me\//i;
            if (linkRegex.test(text)) {
                try {
                    await Hanz.sendMessage(sender, { delete: msg.key });
                    await Hanz.sendMessage(sender, {
                        text: `@${getSenderNumber(sender, msg)} dilarang mengirim link di grup ini!`,
                        mentions: [msg.key.participant || sender]
                    });
                } catch { }
                continue;
            }
        }

        if (isGroup(sender) && global.afkUsers?.size > 0) {
            const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
            for (const jid of mentioned) {
                const num = jid.split('@')[0];
                if (global.afkUsers.has(num)) {
                    const { reason, time } = global.afkUsers.get(num);
                    const elapsed = Math.floor((Date.now() - time) / 1000);
                    const dur = elapsed < 60 ? `${elapsed} detik` : elapsed < 3600 ? `${Math.floor(elapsed/60)} menit` : `${Math.floor(elapsed/3600)} jam`;
                    await Hanz.sendMessage(sender, {
                        text: `@${num} sedang AFK selama ${dur}\nAlasan: ${reason}`,
                        mentions: [jid]
                    });
                }
            }
        }

        if (!fromMe && global.afkUsers?.has(getSenderNumber(sender, msg))) {
            const num = getSenderNumber(sender, msg);
            global.afkUsers.delete(num);
            await Hanz.sendMessage(sender, {
                text: `Selamat datang kembali @${num}! Status AFK kamu telah dihapus.`,
                mentions: [msg.key.participant || sender]
            });
        }

        const command = parseCommand(text);

        if (command) {
            const handler = plugins.get(command.name);

            if (handler) {
                if (!checkSuperOwner && !checkOwner && !COOLDOWN_EXEMPT.has(command.name)) {
                    const cooldownKey = `${sender}:${command.name}`;
                    const lastUsed = cooldownMap.get(cooldownKey) || 0;
                    const remaining = COOLDOWN_MS - (Date.now() - lastUsed);

                    if (remaining > 0) {
                        await Hanz.sendMessage(sender, {
                            text: `⏳ Sabar dulu! Tunggu *${(remaining / 1000).toFixed(1)} detik* lagi sebelum pakai command ini.`
                        }, { quoted: msg });
                        continue;
                    }

                    cooldownMap.set(cooldownKey, Date.now());
                }

                const cmdArgs = command.args.length ? ' ' + command.args.join(' ') : '';

                readline.clearLine(process.stdout, 0);
                readline.cursorTo(process.stdout, 0);

                console.log(
                    chalk.green(`[EXECUTE] `) +
                    chalk.yellow(`${command.name}${cmdArgs}`)
                );

                try {
                    await handler({
                        Hanz, msg, sender,
                        senderNumber: getSenderNumber(sender, msg),
                        pushname: msg.pushName || 'Kak',
                        isGroup: isGroup(sender),
                        isOwner: checkOwner,
                        isSuperOwner: checkSuperOwner,
                        isCoOwner: checkCoOwner,
                        command, text,
                        fakeOrder,
                        isMain,
                        reply: (content) => Hanz.sendMessage(sender, content, { quoted: msg }),
                        replyFake: (content) => Hanz.sendMessage(sender, content, { quoted: fakeOrder }),
                        send: (content) => Hanz.sendMessage(sender, content),
                        sendButtons: (content) => sendButtons(Hanz, sender, content),
                        sendList: (content) => sendListMessage(Hanz, sender, content),
                        sendInteractive: (content) => sendInteractiveMessage(Hanz, sender, content),
                        sendButtonWithImage: (content) => sendButtonWithImage(Hanz, sender, content),
                        sendInteractiveWithImage: (content) => sendInteractiveWithImage(Hanz, sender, content),
                        react: (emoji) => Hanz.sendMessage(sender, { react: { text: emoji, key: msg.key } }),
                    });
                } catch (err) {
                    readline.clearLine(process.stdout, 0);
                    readline.cursorTo(process.stdout, 0);

                    console.error(
                        chalk.red(`[RUN-ERROR] `) +
                        chalk.yellow(`[${command.name}]: `) +
                        chalk.red(err.message)
                    );
                    await Hanz.sendMessage(sender, { text: '❌ Terjadi kesalahan saat menjalankan perintah.' });
                }
            } else {
                readline.clearLine(process.stdout, 0);
                readline.cursorTo(process.stdout, 0);

                console.log(
                    chalk.magenta(`[NOT-FOUND] `) +
                    chalk.white(`Command `) +
                    chalk.yellow(`*${command.name}*`) +
                    chalk.white(` tidak terdaftar.`)
                );
                await Hanz.sendMessage(sender, { text: `❓ Command *${command.name}* tidak ditemukan.` });
            }
        }

        if (config.autoTyping && !isGroup(sender)) await Hanz.sendPresenceUpdate('paused', sender);
    }
}

async function handleGroupParticipants(Hanz, update) {
    const { id: groupJid, participants, action } = update;

    for (const jid of participants) {
        const number = jid.split('@')[0];

        if (action === 'add' && global.welcomeGroups?.get(groupJid)) {
            await Hanz.sendMessage(groupJid, {
                text: `Selamat datang @${number} di grup ini!`,
                mentions: [jid]
            });
        }

        if (action === 'remove' && global.goodbyeGroups?.get(groupJid)) {
            await Hanz.sendMessage(groupJid, {
                text: `Sampai jumpa @${number}, semoga sukses!`,
                mentions: [jid]
            });
        }
    }
}

module.exports = handleMessages;
module.exports.resolveOwnerLids = resolveOwnerLids;
module.exports.handleGroupParticipants = handleGroupParticipants;