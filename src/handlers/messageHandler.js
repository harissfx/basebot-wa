const config = require('../settings');
const { getContentType } = require('@whiskeysockets/baileys');
const { sendButtons, sendListMessage, sendInteractiveMessage, sendButtonWithImage } = require('../utils/interactiveHelper');

const generalCommands   = require('../commands/general');
const interactiveCommands = require('../commands/interactive');
const adminCommands     = require('../commands/admin');
const funCommands       = require('../commands/fun');

const commands = {
    ...generalCommands,
    ...interactiveCommands,
    ...adminCommands,
    ...funCommands,
};

const commandNames = Object.keys(commands);

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

function isGroup(jid)    { return jid.endsWith('@g.us'); }
function isFromMe(msg)   { return msg.key.fromMe; }

// FIX: Pakai exact match, bukan includes() untuk hindari false positive
// Contoh bug lama: ownerNumber '628123' akan cocok dengan sender '6281234567890'
function isOwner(sender) {
    const ownerNumber = config.ownerNumber.replace(/\D/g, '');
    const senderNumber = sender.replace(/\D/g, '').replace(/@.+$/, '');
    return ownerNumber && ownerNumber === senderNumber;
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
    if (commandNames.includes(name)) {
        const args = words.slice(1);
        return { name, args, fullArgs: args.join(' '), raw: text, hasPrefix: false };
    }

    return null;
}

async function handleMessages(sock, m) {
    for (const msg of m.messages) {
        if (!msg.message) continue;

        const fromMe  = isFromMe(msg);
        const sender  = msg.key.remoteJid;

        if (!fromMe && config.botMode === 'self' && !isOwner(sender)) continue;

        const text = extractMessageText(msg.message);
        if (!text) continue;

        console.log(`📩 ${sender}: ${text}`);

        if (config.autoRead)   await sock.readMessages([msg.key]);
        if (config.autoTyping && !isGroup(sender)) await sock.sendPresenceUpdate('composing', sender);

        const command = parseCommand(text);

        if (command) {
            console.log(`⚡ ${command.name}${command.args.length ? ' ' + command.args.join(' ') : ''}`);

            const handler = commands[command.name];
            if (handler) {
                try {
                    await handler({
                        sock, msg, sender,
                        isGroup: isGroup(sender),
                        isOwner: isOwner(sender),
                        command, text,
                        reply:               (content) => sock.sendMessage(sender, content, { quoted: msg }),
                        send:                (content) => sock.sendMessage(sender, content),
                        sendButtons:         (content) => sendButtons(sock, sender, content),
                        sendList:            (content) => sendListMessage(sock, sender, content),
                        sendInteractive:     (content) => sendInteractiveMessage(sock, sender, content),
                        sendButtonWithImage: (content) => sendButtonWithImage(sock, sender, content),
                        react:               (emoji)   => sock.sendMessage(sender, { react: { text: emoji, key: msg.key } }),
                    });
                } catch (err) {
                    console.error(`❌ Error [${command.name}]:`, err.message);
                    await sock.sendMessage(sender, { text: '❌ Terjadi kesalahan saat menjalankan perintah.' });
                }
            } else {
                await sock.sendMessage(sender, { text: `❓ Command *${command.name}* tidak ditemukan.` });
            }
        }

        if (config.autoTyping && !isGroup(sender)) await sock.sendPresenceUpdate('paused', sender);
    }
}

module.exports = handleMessages;
