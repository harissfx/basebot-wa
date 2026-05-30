const config  = require('../config');
const plugins = require('../utils/PluginLoader');
const chalk   = require('chalk');
const readline = require('readline');
const { getContentType } = require('@whiskeysockets/baileys');
const { sendButtons, sendListMessage, sendInteractiveMessage, sendButtonWithImage, sendInteractiveWithImage } = require('../utils/interactiveHelper');
const { fakeOrder } = require('../utils/fquoted');

// Cache LID owner yang di-resolve saat bot connect
const ownerLidCache = new Set();

// Dipanggil dari index.js setelah connection 'open'
async function resolveOwnerLids(sock) {
    const owners = [].concat(config.ownerNumber).map(n => n.replace(/\D/g, ''));
    for (const nomor of owners) {
        try {
            const [result] = await sock.onWhatsApp(nomor);
            if (result?.exists && result?.lid) {
                const lidNum = result.lid.replace(/\D/g, '').replace(/@.+$/, '').split(':')[0];
                ownerLidCache.add(lidNum);
                console.log(chalk.cyan(`[OWNER-LID] ${nomor} -> ${lidNum}@lid`));
            }
        } catch (e) {
            console.log(chalk.yellow(`[OWNER-LID] Gagal resolve ${nomor}: ${e.message}`));
        }
    }
}

function extractMessageText(message) {
    if (!message) return null;
    const type = getContentType(message);
    switch (type) {
        case 'conversation':               return message.conversation;
        case 'extendedTextMessage':        return message.extendedTextMessage?.text;
        case 'imageMessage':               return message.imageMessage?.caption;
        case 'videoMessage':               return message.videoMessage?.caption;
        case 'buttonsResponseMessage':     return message.buttonsResponseMessage?.selectedButtonId;
        case 'listResponseMessage':        return message.listResponseMessage?.singleSelectReply?.selectedRowId;
        case 'templateButtonReplyMessage': return message.templateButtonReplyMessage?.selectedId;
        default:                           return null;
    }
}

function isGroup(jid)  { return jid.endsWith('@g.us'); }
function isFromMe(msg) { return msg.key.fromMe; }

function isOwner(sender, msg) {
    const owners = [].concat(config.ownerNumber).map(n => n.replace(/\D/g, ''));

    const rawSender    = msg?.key?.participant || msg?.key?.remoteJid || sender || '';
    const senderNumber = rawSender.replace(/\D/g, '').replace(/@.+$/, '').split(':')[0];

    const matchNumber = owners.some(n => n === senderNumber);
    const matchLid    = ownerLidCache.has(senderNumber);
    const fromMe      = msg?.key?.fromMe || false;

    return matchNumber || matchLid || fromMe;
}

function parseCommand(text) {
    const { prefix } = config;

    if (text.startsWith(prefix)) {
        const args = text.slice(prefix.length).trim().split(/ +/);
        const name = args.shift().toLowerCase();
        return { name, args, fullArgs: args.join(' '), raw: text, hasPrefix: true };
    }

    const words = text.trim().split(/ +/);
    const name  = words[0].toLowerCase();
    if (plugins.has(name)) {
        const args = words.slice(1);
        return { name, args, fullArgs: args.join(' '), raw: text, hasPrefix: false };
    }

    return null;
}

async function handleMessages(sock, m, isMain = true) {
    for (const msg of m.messages) {
        if (!msg.message) continue;

        const fromMe = isFromMe(msg);
        const sender = msg.key.remoteJid;

        const checkOwner = isOwner(sender, msg);

        if (!fromMe && config.botMode === 'self' && !checkOwner) continue;

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

        if (config.autoRead)   await sock.readMessages([msg.key]);
        if (config.autoTyping && !isGroup(sender)) await sock.sendPresenceUpdate('composing', sender);

        const command = parseCommand(text);

        if (command) {
            const handler = plugins.get(command.name);

            if (handler) {
                const cmdArgs = command.args.length ? ' ' + command.args.join(' ') : '';
                
                readline.clearLine(process.stdout, 0);
                readline.cursorTo(process.stdout, 0);

                console.log(
                    chalk.green(`[EXECUTE] `) + 
                    chalk.yellow(`${command.name}${cmdArgs}`)
                );

                try {
                    await handler({
                        sock, msg, sender,
                        isGroup:                     isGroup(sender),
                        isOwner:                     checkOwner,
                        command, text,
                        fakeOrder,
                        isMain,
                        reply:                       (content) => sock.sendMessage(sender, content, { quoted: msg }),
                        replyFake:                   (content) => sock.sendMessage(sender, content, { quoted: fakeOrder }),
                        send:                        (content) => sock.sendMessage(sender, content),
                        sendButtons:         (content) => sendButtons(sock, sender, content),
                        sendList:            (content) => sendListMessage(sock, sender, content),
                        sendInteractive:     (content) => sendInteractiveMessage(sock, sender, content),
                        sendButtonWithImage:         (content) => sendButtonWithImage(sock, sender, content),
                        sendInteractiveWithImage:    (content) => sendInteractiveWithImage(sock, sender, content),
                        react:               (emoji)   => sock.sendMessage(sender, { react: { text: emoji, key: msg.key } }),
                    });
                } catch (err) {
                    readline.clearLine(process.stdout, 0);
                    readline.cursorTo(process.stdout, 0);

                    console.error(
                        chalk.red(`[RUN-ERROR] `) + 
                        chalk.yellow(`[${command.name}]: `) + 
                        chalk.red(err.message)
                    );
                    await sock.sendMessage(sender, { text: '❌ Terjadi kesalahan saat menjalankan perintah.' });
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
                await sock.sendMessage(sender, { text: `❓ Command *${command.name}* tidak ditemukan.` });
            }
        }

        if (config.autoTyping && !isGroup(sender)) await sock.sendPresenceUpdate('paused', sender);
    }
}

module.exports = handleMessages;
module.exports.resolveOwnerLids = resolveOwnerLids;