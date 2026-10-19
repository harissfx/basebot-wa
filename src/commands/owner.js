const fs = require('fs');
const path = require('path');
const config = require('../config');
const mess = require('../config').mess;
const plugins = require('../utils/PluginLoader');
const { getDevice, proto, generateWAMessageFromContent } = require('baileys');
const { delay } = require('../utils/helper');
const { downloadMedia } = require('../../lib/ffmpeg');
const stickerCmdStore = require('../utils/stickerCmdStore');
const msgDbStore = require('../utils/msgDbStore');
const { sendSfxProbe } = require('../../lib/htmlrich/sfxProbe');
const { getSetting, setSetting, getOwnerDisplay } = require('../utils/cloneSettings');

function buildInteractiveNodes(buttonType = 'mixed') {
    return [
        {
            tag: 'biz',
            attrs: {},
            content: [
                {
                    tag: 'interactive',
                    attrs: { type: 'native_flow', v: '1' },
                    content: [{ tag: 'native_flow', attrs: { v: '9', name: buttonType } }]
                }
            ]
        }
    ];
}

const SAVED_ROOT = path.join(__dirname, '../database/saved');
const SAVED_INDEX = path.join(SAVED_ROOT, 'index.json');
const SAVED_TYPES = ['image', 'video', 'document', 'audio', 'sticker'];

function ensureSavedDirs() {
    for (const t of SAVED_TYPES) {
        fs.mkdirSync(path.join(SAVED_ROOT, t), { recursive: true });
    }
}

function loadSavedIndex() {
    ensureSavedDirs();
    if (!fs.existsSync(SAVED_INDEX)) return [];
    try {
        const data = JSON.parse(fs.readFileSync(SAVED_INDEX, 'utf8'));
        return Array.isArray(data) ? data : [];
    } catch {
        return [];
    }
}

function writeSavedIndex(list) {
    ensureSavedDirs();
    fs.writeFileSync(SAVED_INDEX, JSON.stringify(list, null, 2));
}

function nextSavedId(list) {
    if (!list.length) return 1;
    return Math.max(...list.map((x) => Number(x.id) || 0)) + 1;
}

function formatBytes(n) {
    const b = Number(n) || 0;
    if (b < 1024) return b + ' B';
    if (b < 1024 * 1024) return (b / 1024).toFixed(1) + ' KB';
    return (b / (1024 * 1024)).toFixed(2) + ' MB';
}

function guessExt(mediaType, mimetype, originalName) {
    if (originalName) {
        const e = path.extname(originalName).replace('.', '').toLowerCase();
        if (e) return e;
    }
    const mime = (mimetype || '').toLowerCase();
    if (mime.includes('png')) return 'png';
    if (mime.includes('jpeg') || mime.includes('jpg')) return 'jpg';
    if (mime.includes('webp')) return 'webp';
    if (mime.includes('gif')) return 'gif';
    if (mime.includes('mp4')) return 'mp4';
    if (mime.includes('webm')) return 'webm';
    if (mime.includes('pdf')) return 'pdf';
    if (mime.includes('mpeg') || mime.includes('mp3')) return 'mp3';
    if (mime.includes('ogg') || mime.includes('opus')) return 'ogg';
    if (mime.includes('wav')) return 'wav';
    if (mime.includes('zip')) return 'zip';
    if (mime.includes('rar')) return 'rar';
    const fallback = { image: 'jpg', video: 'mp4', sticker: 'webp', audio: 'ogg', document: 'bin' };
    return fallback[mediaType] || 'bin';
}

function typeEmoji(type) {
    return ({ image: '🖼', video: '🎬', document: '📄', audio: '🎵', sticker: '🧩' })[type] || '📁';
}

const handler = async (m) => {

    const { command, Hanz, isOwner, isSuperOwner, isMain, msg, senderNumber, pushname } = m;
    const p = m.prefix;
    const nomorUser = senderNumber;

    switch (command.name) {
        case 'ownermenu':
            const device = getDevice(msg.key.id);
            const ownerCmds = (plugins.commandsByFile()['owner'] || [])
            .filter(cmd => !['ownermenu'].includes(cmd));
            const role = isSuperOwner ? 'Super Owner' : (isOwner ? 'Co-Owner' : 'User biasa');
            let menu = `┌─❖「 𝗜𝗡𝗙𝗢 𝗨𝗦𝗘𝗥 」
│● 𝘕𝘢𝘮𝘢: ${pushname}
│● 𝘕𝘰𝘮𝘰𝘳: ${nomorUser}
│● 𝘚𝘵𝘢𝘵𝘶𝘴: ${role}
│● 𝘗𝘦𝘳𝘢𝘯𝘨𝘬𝘢𝘵: ${device}
│
└┬❖ 
┌┤𝖧𝖺𝗒 𝗄𝖺𝗄 ${pushname} 👋
│└────────────┈ ⳹
│「 𝗢𝗪𝗡𝗘𝗥 𝗠𝗘𝗡𝗨 」
│
${ownerCmds.map(cmd => `│⪩ \`${p}${cmd}\``).join('\n')}
│
└────────────┈ ⳹`
            await m.sendInteractive({
                text: menu,
                footer: config.footerTxt,
                quoted: m.fakePay,
                contextInfo: {
                    mentionedJid: ["0@s.whatsapp.net"],
                    forwardingScore: 111,
                    isForwarded: true
                },
                buttons: [
                    { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: 'Kembali ke Menu', id: 'menu' }) },
                    { name: 'single_select', buttonParamsJson: JSON.stringify({
                            title: '『 Simpel Menu 』',
                            sections: [{
                                title: '『 Simpel Menu 』',
                                highlight_label: "",
                                rows: [{ title: "General Menu", description: "Select to display general menu", id: "generalmenu" }]
                            }, {
                                highlight_label: "",
                                rows: [{ title: "Owner Menu", description: "Select to display owner menu", id: "ownermenu" }]
                            }, {
                                highlight_label: "",
                                rows: [{ title: "Ffmpeg Menu", description: "Select to display ffmpeg menu", id: "ffmpegmenu" }]
                            }, {
                                highlight_label: "",
                                rows: [{ title: "Downloader Menu", description: "Select to display downloader menu", id: "downloadmenu" }]
                            }, {
                                highlight_label: "",
                                rows: [{ title: "Tools Menu", description: "Select to display tools menu", id: "toolsmenu" }]
                            }, {
                                highlight_label: "Khusus Owner Utama",
                                rows: [{ title: "JadiBot Menu", description: "Select to display jadi bot menu", id: "jadibotmenu" }]
                            }, {
                                highlight_label: "",
                                rows: [{ title: "Fun Menu", description: "Select to display fun menu", id: "funmenu" }]
                            }, {
                                highlight_label: "",
                                rows: [{ title: "Group Menu", description: "Select to display group menu ", id: "groupmenu" }]
                            }, {
                                highlight_label: "",
                                rows: [{ title: "Extra Menu", description: "Select to display extra menu", id: "extramenu" }]
                            }]
                        })
                    }]
            });
            break;
        case 'sfxtest':
        case 'tesukuran': {
            if (!isOwner) return m.reply(mess.owner);
            const kbTest = Math.min(Math.max(parseInt(command.args[0]) || 100, 1), 4000);
            try {
                await sendSfxProbe(Hanz, m.chat, kbTest);
                await m.reply({ text: `📦 Tes ${kbTest} KB dikirim.\n\nKalau bubble game muncul dan teksnya bilang "Muatan diterima", ukuran ini aman.\nKalau tidak muncul / kosong / gagal terbuka, batasnya di bawah ${kbTest} KB.\n\nCoba naik bertahap: ${p}sfxtest 50, 100, 200, 400, 800.` });
            } catch (err) {
                console.error('[sfxtest]', err);
                await m.reply({ text: `❌ Gagal kirim tes ${kbTest} KB: ` + (err.message || err) });
            }
        }
            break;
                    case 'setpp':
        case 'setppbot': {
            if (!isOwner) return m.reply(mess.owner);

            const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            const targetImg = quotedMsg?.imageMessage ? quotedMsg : msg.message;
            const imgMimetype = targetImg?.imageMessage?.mimetype;

            if (!targetImg?.imageMessage) {
                return m.reply({
                    text: `❌ Reply/kirim gambar dengan caption *${p}${command.name}* atau *${p}${command.name} full*`
                });
            }
            if (/webp/.test(imgMimetype || '')) {
                return m.reply({ text: '❌ Tidak bisa pakai stiker. Kirim gambar biasa (JPG/PNG).' });
            }

            await m.react('⏳');

            try {
                const mediaResult = await downloadMedia(targetImg);
                if (!mediaResult?.buffer || mediaResult.mediaType !== 'image') {
                    return m.reply({ text: '❌ Gagal download gambar.' });
                }

                const arg = (command.args?.[0] || '').toLowerCase().replace('/', '');
                const isFull = arg === 'full';

                const sharp = require('sharp');
                let imgBuffer;

                if (isFull) {
                    imgBuffer = await sharp(mediaResult.buffer)
                        .resize(720, 720, {
                            fit: 'inside',
                            withoutEnlargement: false
                        })
                        .jpeg({ quality: 92 })
                        .toBuffer();
                } else {
                    imgBuffer = await sharp(mediaResult.buffer)
                        .resize(720, 720, { fit: 'cover' })
                        .jpeg({ quality: 92 })
                        .toBuffer();
                }

                await Hanz.query({
                    tag: 'iq',
                    attrs: {
                        to: 's.whatsapp.net',
                        type: 'set',
                        xmlns: 'w:profile:picture'
                    },
                    content: [{
                        tag: 'picture',
                        attrs: { type: 'image' },
                        content: imgBuffer
                    }]
                });

                await m.reply({
                    text: isFull
                        ? '✅ Foto profil bot berhasil diubah (mode FULL).'
                        : '✅ Foto profil bot berhasil diubah.'
                });
            } catch (e) {
                console.error('[setppbot ERROR]', e?.message || e);
                await m.reply({
                    text: `❌ Gagal ganti foto profil bot.\nAlasan: ${e?.message || 'unknown error'}`
                });
            }
        }
            break;
        case 'getiduser':
        case 'iduser':
        case 'cekno': {
            if (!isSuperOwner) return m.reply(mess.superOwner);
            let nomorInput = command.fullArgs.replace(/\D/g, '');

            if (!nomorInput) {
                return m.reply({
                    text: `❌ *Format Salah!*\n\nFormat: \`${p}getiduser <nomor-hp>\`\nContoh: \`${p}getiduser 0857123xxxxx\` atau \`${p}getiduser 6212345xxxxx\``
                });
            }

            if (nomorInput.startsWith('0')) {
                nomorInput = '62' + nomorInput.slice(1);
            }

            try {
                const [result] = await Hanz.onWhatsApp(nomorInput);

                if (!result || !result.exists) {
                    return m.reply({ text: `❌ Nomor *${nomorInput}* tidak terdaftar di WhatsApp.` });
                }

                const jidKlasik = result.jid;
                const lid = result.lid || "Tidak tersedia";

                let hasil = `🔍 *DATA USER WHATSAPP* 🔍\n\n`;
                hasil += ` • *Nomor Asli* : +${nomorInput}\n`;
                hasil += ` • *JID Klasik* : \`${jidKlasik}\`\n`;
                hasil += ` • *LID Privasi* : \`${lid}\``;

                await m.sendInteractive({
                    text: hasil,
                    footer: config.footerTxt,
                    quoted: m.msg,
                    buttons: [
                        { name: 'cta_copy', buttonParamsJson: JSON.stringify({ display_text: 'Copy JID Klasik', copy_code: jidKlasik }) },
                        { name: 'cta_copy', buttonParamsJson: JSON.stringify({ display_text: 'Copy LID', copy_code: lid }) },
                    ]
                });
            } catch (error) {
                console.error("Gagal melacak nomor:", error);
                await m.reply({ text: `❌ Terjadi kesalahan saat memeriksa nomor tersebut.` });
            }
        }
            break;

        case 'getidch':
        case 'idch':
        case 'cekchannel': {
            if (!isSuperOwner) return m.reply(mess.superOwner);
            const textInput = command.fullArgs;
            const channelRegex = /whatsapp\.com\/channel\/([a-zA-Z0-9]+)/i;

            if (!textInput || !channelRegex.test(textInput)) {
                return m.reply({
                    text: `❌ *Format Salah!*\n\nFormat: \`${p}getidch <link-channel>\`\nContoh: \`${p}getidch https://whatsapp.com/channel/0029VaXXXXX\``
                });
            }

            const match = textInput.match(channelRegex);
            const inviteCode = match[1];

            try {
                const metadata = await Hanz.newsletterMetadata("invite", inviteCode);
                const jidAsli = metadata.id;
                const metaDataThread = metadata.thread_metadata || {};
                const namaChannel = metaDataThread.name?.text || "Tidak diketahui";
                const totalPengikut = metaDataThread.subscribers_count || "0";
                const deskripsi = metaDataThread.description?.text || "Tidak ada deskripsi.";

                let hasil = `🔍 *DATA WHATSAPP CHANNEL* 🔍\n\n`;
                hasil += ` • *Nama Channel* : ${namaChannel}\n`;
                hasil += ` • *ID Internal* : \`${jidAsli}\`\n`;
                hasil += ` • *Followers* : ${totalPengikut} pengikut\n`;
                hasil += ` • *Deskripsi* : ${deskripsi}`;

                await m.sendInteractive({
                    text: hasil,
                    footer: config.footerTxt,
                    quoted: m.msg,
                    buttons: [
                        { name: 'cta_copy', buttonParamsJson: JSON.stringify({ display_text: 'Copy ID Channel', copy_code: jidAsli }) },
                    ]
                });
            } catch (error) {
                console.error("Gagal melacak channel:", error);
                await m.reply({
                    text: `❌ *Gagal Mendapatkan Data!*\n\nPastikan link channel valid, publik, dan bot sedang tidak terkena limit query.`
                });
            }
        }
            break;

        case 'setquote':
        case 'quotestyle': {
            if (!isSuperOwner) return m.reply(mess.superOwner);
            const { setQuoteStyleFor, getCurrentStyleFor, getActiveQuoteFor } = require('../utils/fquoted');
            const qInput = (command.fullArgs || '').trim().toLowerCase();
            const curQ = getCurrentStyleFor(Hanz, isMain);

            if (!['pay', 'meta', 'status'].includes(qInput)) {
                return m.sendInteractive({
                    text: `┌─❖「 𝗤𝗨𝗢𝗧𝗘 𝗦𝗧𝗬𝗟𝗘 」
│
│● 𝘚𝘵𝘺𝘭𝘦 𝘴𝘢𝘢𝘵 𝘪𝘯𝘪 : *${curQ.toUpperCase()}*
│
└────────────┈ ⳹

• *pay*  → request payment (default lama)
• *meta*   → kontak Meta AI
• *status* → sticker pack dari status@broadcast

Berlaku untuk semua pesan yang pakai \`m.fakePay\`
(menu, ownermenu, button, list, dll).

${isMain ? '⚠️ Ganti style hanya di runtime (tanpa reload bot).\nSetelah restart, kembali ke nilai di config.js.' : 'ℹ️ Berlaku khusus untuk clone bot ini dan tersimpan permanen.'}`,
                    footer: config.footerTxt,
                    quoted: m.msg,
                    buttons: [
                        { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: 'Quote: ORDER', id: 'setquote pay' }) },
                        { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: 'Quote: META', id: 'setquote meta' }) },
                        { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: 'Quote: STATUS', id: 'setquote status' }) },
                    ]
                });
            }

            if (qInput === curQ) {
                return m.reply({ text: `Quote style sudah *${qInput.toUpperCase()}*.` });
            }

            setQuoteStyleFor(Hanz, isMain, qInput);

            const active = getActiveQuoteFor(Hanz, isMain);
            const activeKind = active?.message?.stickerPackMessage
                ? 'status'
                : active?.message?.viewOnceMessage
                    ? 'meta'
                    : active?.message?.requestPaymentMessage
                        ? 'pay'
                        : 'unknown';

            const desc = {
                pay: 'Pesan yang pakai fakePay kembali ke style pay (default).',
                meta: 'Pesan yang pakai fakePay sekarang quoted Meta AI.',
                status: 'Pesan yang pakai fakePay sekarang quoted sticker pack (status@broadcast).',
            };

            await m.reply({
                text: `✅ Quote style diubah ke *${qInput.toUpperCase()}*!\n` +
                    `Aktif sekarang: *${getCurrentStyleFor(Hanz, isMain).toUpperCase()}* (detect: ${activeKind})\n\n` +
                    `${desc[qInput] || ''}\n\n` +
                    `${isMain ? '_Tanpa reload. Setelah restart bot, style mengikuti config.js._' : '_Tersimpan khusus untuk clone bot ini._'}\n` +
                    `Coba ketik *${p}menu*`
            });
        }
            break;
case 'setmode':
case 'mode': {
    if (!isSuperOwner) return m.reply(mess.superOwner);
    const modeInput = (command.fullArgs || '').trim().toLowerCase();

    if (!['public', 'self'].includes(modeInput)) {
        let curQ = 'pay';
        try {
            const { getCurrentStyleFor } = require('../utils/fquoted');
            curQ = getCurrentStyleFor(Hanz, isMain);
        } catch (_) {
            curQ = getSetting(Hanz, isMain, 'quoteStyle').toLowerCase();
        }
        const curBotMode = getSetting(Hanz, isMain, 'botMode');
        const curNp = getSetting(Hanz, isMain, 'noPrefix');
        const curPfx = getSetting(Hanz, isMain, 'prefix');
        const curTyping = getSetting(Hanz, isMain, 'autoTyping');
        const curRead = getSetting(Hanz, isMain, 'autoRead');
        const curNoSelf = getSetting(Hanz, isMain, 'noSelfSync');
        const curMenu = parseInt(getSetting(Hanz, isMain, 'menuStyle'), 10) || 1;
        const mark = (on) => (on ? '✅' : '▫️');

        const contentText =
            `*Settings Bot${isMain ? '' : ' (Clone)'}*\n\n` +
            `• Akses: *${String(curBotMode).toUpperCase()}*\n` +
            `• No-Prefix: *${curNp ? 'ON' : 'OFF'}*\n` +
            `• Prefix: *${curPfx}*\n` +
            `• Quote: *${String(curQ).toUpperCase()}*\n` +
            `• Auto-Typing: *${curTyping ? 'ON' : 'OFF'}*\n` +
            `• Auto-Read: *${curRead ? 'ON' : 'OFF'}*\n` +
            `• No-SelfSync: *${curNoSelf ? 'ON' : 'OFF'}*\n` +
            `• Tampilan Menu: *${curMenu}*\n\n` +
            `Pilih pengaturan di list di bawah 👇`;

        const footerText = config.footerTxt;

        const interactiveMsg = proto.Message.InteractiveMessage.fromObject({
            body: { text: contentText },
            footer: { text: footerText },
            header: {
                title: config.botName,
                subtitle: 'Bot Settings',
                hasMediaAttachment: false
            },
            nativeFlowMessage: {
                messageParamsJson: JSON.stringify({
                    bottom_sheet: {
                        in_thread_buttons_limit: 1,
                        divider_indices: [1, 2, 3, 4, 5, 999],
                        list_title: config.botName,
                        button_icon: 'REVIEW',
                        button_title: 'Buka Settings'
                    }
                }),
                buttons: [
                    {
                        name: 'single_select',
                        buttonParamsJson: JSON.stringify({
                            title: '📋 Tampilan Menu',
                            sections: [{
                                title: '📋 Tampilan Menu (2 pilihan)',
                                rows: [
                                    { id: `${p}setmenu 1`, title: `${mark(curMenu === 1)} Menu 1`, description: 'List lengkap semua command + gambar' },
                                    { id: `${p}setmenu 2`, title: `${mark(curMenu === 2)} Menu 2`, description: 'Gaya product + tombol pilihan kategori' }
                                ]
                            }],
                            has_multiple_buttons: true
                        })
                    },
                    {
                        name: 'single_select',
                        buttonParamsJson: JSON.stringify({
                            title: '💬 Quote Style',
                            sections: [{
                                title: '💬 Quote Style (3 pilihan)',
                                rows: [
                                    { id: `${p}setquote pay`, title: `${mark(curQ === 'pay')} Pay`, description: 'Quoted request payment (default)' },
                                    { id: `${p}setquote meta`, title: `${mark(curQ === 'meta')} Meta`, description: 'Quoted kontak Meta AI' },
                                    { id: `${p}setquote status`, title: `${mark(curQ === 'status')} Status`, description: 'Quoted sticker pack status@broadcast' }
                                ]
                            }],
                            has_multiple_buttons: true
                        })
                    },
                    {
                        name: 'single_select',
                        buttonParamsJson: JSON.stringify({
                            title: '🔐 Akses Bot',
                            sections: [{
                                title: '🔐 Akses Bot',
                                rows: [
                                    { id: `${p}setmode public`, title: `${mark(curBotMode === 'public')} Public`, description: 'Semua orang bisa pakai bot' },
                                    { id: `${p}setmode self`, title: `${mark(curBotMode === 'self')} Self`, description: 'Hanya owner yang bisa pakai bot'  }
                                ]
                            }],
                            has_multiple_buttons: true
                        })
                    },
                    {
                        name: 'single_select',
                        buttonParamsJson: JSON.stringify({
                            title: '⌨️ No-Prefix',
                            sections: [{
                                title: '⌨️ No-Prefix',
                                rows: [
                                    { id: `${p}noprefix on`, title: `${mark(!!curNp)} ON`, description: 'Command bisa dengan/tanpa prefix' },
                                    { id: `${p}noprefix off`, title: `${mark(!curNp)} OFF`, description: 'Command wajib pakai prefix' }
                                ]
                            }],
                            has_multiple_buttons: true
                        })
                    },
                    {
                        name: 'single_select',
                        buttonParamsJson: JSON.stringify({
                            title: '⌨️ Auto-Typing',
                            sections: [{
                                title: '⌨️ Auto-Typing',
                                rows: [
                                    { id: `${p}autotyping on`, title: `${mark(curTyping)} ON`, description: 'Tampilkan "mengetik..." sebelum bot balas' },
                                    { id: `${p}autotyping off`, title: `${mark(!curTyping)} OFF`, description: 'Bot balas tanpa indikator mengetik' }
                                ]
                            }],
                            has_multiple_buttons: true
                        })
                    },
                    {
                        name: 'single_select',
                        buttonParamsJson: JSON.stringify({
                            title: '👁️ Auto-Read',
                            sections: [{
                                title: '👁️ Auto-Read',
                                rows: [
                                    { id: `${p}autoread on`, title: `${mark(curRead)} ON`, description: 'Pesan masuk otomatis dicentang biru' },
                                    { id: `${p}autoread off`, title: `${mark(!curRead)} OFF`, description: 'Pesan masuk dibiarkan belum dibaca' }
                                ]
                            }],
                            has_multiple_buttons: true
                        })
                    },
                    {
                        name: 'single_select',
                        buttonParamsJson: JSON.stringify({
                            title: '📵 No-SelfSync',
                            sections: [{
                                title: '📵 No-SelfSync',
                                rows: [
                                    { id: `${p}noselfsync on`, title: `${mark(curNoSelf)} ON`, description: 'Pesan bot tidak sync ke device lain akun bot' },
                                    { id: `${p}noselfsync off`, title: `${mark(!curNoSelf)} OFF`, description: 'Perilaku normal — muncul di semua device' }
                                ]
                            }],
                            has_multiple_buttons: true
                        })
                    }
                ]
            }
        });

        const waMsg = generateWAMessageFromContent(
            m.chat,
            proto.Message.fromObject({
                viewOnceMessage: {
                    message: {
                        messageContextInfo: {
                            deviceListMetadata: {},
                            deviceListMetadataVersion: 2
                        },
                        interactiveMessage: interactiveMsg
                    }
                }
            }),
            { userJid: Hanz.user?.id, quoted: msg }
        );

        const additionalNodes = buildInteractiveNodes('mixed');
        if (!m.isGroup) {
            additionalNodes.push({ tag: 'bot', attrs: { biz_bot: '1' } });
        }

        await Hanz.relayMessage(m.chat, waMsg.message, {
            messageId: waMsg.key.id,
            additionalNodes
        });
        return;
    }

    if (modeInput === (getSetting(Hanz, isMain, 'botMode'))) {
        return m.reply({ text: `Mode bot sudah *${modeInput.toUpperCase()}*.` });
    }

    setSetting(Hanz, isMain, 'botMode', modeInput);

    await m.reply({
        text: `✅ Akses bot: *${modeInput.toUpperCase()}*\n\n` +
            `${modeInput === 'self' ? 'Sekarang hanya owner yang bisa pakai bot.' : 'Sekarang semua orang bisa pakai bot.'}\n\n` +
            `${isMain ? '_Runtime saja. Setelah restart mengikuti config.js._' : '_Tersimpan khusus untuk clone bot ini._'}`
    });
}
    break;
        case 'setprefix': {
            if (!isSuperOwner) return m.reply(mess.superOwner);
            const newPrefix = command.fullArgs.trim();
            const curPrefix = getSetting(Hanz, isMain, 'prefix');

            if (!newPrefix) {
                return m.reply({
                    text: `❌ *Format Salah!*\n\nFormat: \`${p}setprefix <prefix-baru>\`\nContoh: \`${p}setprefix .\`\n\nPrefix saat ini: *${curPrefix}*`
                });
            }

            if (/\s/.test(newPrefix)) {
                return m.reply({ text: '❌ Prefix tidak boleh mengandung spasi.' });
            }

            if (newPrefix.length > 5) {
                return m.reply({ text: '❌ Prefix maksimal 5 karakter.' });
            }

            const oldPrefix = curPrefix;
            setSetting(Hanz, isMain, 'prefix', newPrefix);

            if (isMain) try {
                const configPath = require('path').join(__dirname, '..', 'config.js');
                let configFile = require('fs').readFileSync(configPath, 'utf8');
                configFile = configFile.replace(/prefix:\s*'(?:[^'\\]|\\.)*'/, `prefix: '${newPrefix.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`);
                require('fs').writeFileSync(configPath, configFile, 'utf8');
            } catch (e) { }

            await m.reply({
                text: `✅ Prefix berhasil diubah dari *${oldPrefix}* menjadi *${newPrefix}*!\n\nContoh pemakaian: \`${newPrefix}menu\``
            });
        }
            break;

        case 'setnoprefix':
        case 'noprefix': {
            if (!isSuperOwner) return m.reply(mess.superOwner);
            const npInput = command.fullArgs.trim().toLowerCase();
            const curPrefixNow = getSetting(Hanz, isMain, 'prefix');

            if (!['on', 'off'].includes(npInput)) {
                const currentNp = getSetting(Hanz, isMain, 'noPrefix');
                const curBotMode = getSetting(Hanz, isMain, 'botMode');
                return m.sendInteractive({
                    text: `┌─❖「 𝗠𝗢𝗗𝗘 𝗕𝗢𝗧 」
│
│● 𝘕𝘰-𝘗𝘳𝘦𝘧𝘪𝘹 : ${currentNp ? 'ON' : 'OFF'}
│● 𝘈𝘬𝘴𝘦𝘴   : ${curBotMode.toUpperCase()}
│● 𝘗𝘳𝘦𝘧𝘪𝘹  : ${curPrefixNow}
│
└────────────┈ ⳹

• *on* → command bisa dipanggil pakai prefix *ATAU* tanpa prefix
• *off* → command *HANYA* bisa dipanggil kalau pakai prefix
• *public/self* → atur siapa yang boleh pakai bot`,
                    footer: config.footerTxt,
                    quoted: m.msg,
                    buttons: [
                        { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: 'No-Prefix ON', id: 'noprefix on' }) },
                        { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: 'No-Prefix OFF', id: 'noprefix off' }) },
                        { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: 'Set Public', id: 'setmode public' }) },
                        { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: 'Set Self', id: 'setmode self' }) },
                    ]
                });
            }

            const newNp = npInput === 'on';
            const currentNp = getSetting(Hanz, isMain, 'noPrefix');

            if (newNp === currentNp) {
                return m.reply({ text: `Mode no-prefix sudah *${npInput.toUpperCase()}*.` });
            }

            setSetting(Hanz, isMain, 'noPrefix', newNp);

            await m.reply({
                text: `✅ No-Prefix: *${npInput.toUpperCase()}*\n\n` +
                    `${newNp
                        ? 'Command bisa dipanggil pakai prefix maupun tanpa prefix.'
                        : `Command *HANYA* bisa dipanggil pakai prefix *${curPrefixNow}*.`}\n\n` +
                    `${isMain ? '_Runtime saja. Setelah restart mengikuti config.js._' : '_Tersimpan khusus untuk clone bot ini._'}`
            });
        }
            break;

        case 'autotyping': {
            if (!isSuperOwner) return m.reply(mess.superOwner);
            const typingInput = command.fullArgs.trim().toLowerCase();

            if (!['on', 'off'].includes(typingInput)) {
                const currentTyping = getSetting(Hanz, isMain, 'autoTyping');
                return m.sendInteractive({
                    text: `┌─❖「 𝗔𝗨𝗧𝗢-𝗧𝗬𝗣𝗜𝗡𝗚 」\n` +
                        `│\n` +
                        `│● 𝘚𝘵𝘢𝘵𝘶𝘴 : ${currentTyping ? 'ON' : 'OFF'}\n` +
                        `│\n` +
                        `└────────────┈ ⳹\n\n` +
                        `• *on* → tampilkan "mengetik..." sebelum bot balas chat pribadi\n` +
                        `• *off* → bot langsung balas tanpa indikator mengetik`,
                    footer: config.footerTxt,
                    quoted: m.msg,
                    buttons: [
                        { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: 'Typing ON', id: 'autotyping on' }) },
                        { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: 'Typing OFF', id: 'autotyping off' }) },
                    ]
                });
            }

            const newTyping = typingInput === 'on';
            const currentTyping = getSetting(Hanz, isMain, 'autoTyping');

            if (newTyping === currentTyping) {
                return m.reply({ text: `Auto-typing sudah *${typingInput.toUpperCase()}*.` });
            }

            setSetting(Hanz, isMain, 'autoTyping', newTyping);

            await m.reply({
                text: `✅ Auto-Typing: *${typingInput.toUpperCase()}*\n\n` +
                    `${newTyping
                        ? 'Bot akan menampilkan "mengetik..." sebelum membalas chat pribadi.'
                        : 'Bot akan langsung membalas tanpa indikator "mengetik...".'}\n\n` +
                    `${isMain ? '_Runtime saja. Setelah restart mengikuti config.js._' : '_Tersimpan khusus untuk clone bot ini._'}`
            });
        }
            break;

        case 'autoread': {
            if (!isSuperOwner) return m.reply(mess.superOwner);
            const readInput = command.fullArgs.trim().toLowerCase();

            if (!['on', 'off'].includes(readInput)) {
                const currentRead = getSetting(Hanz, isMain, 'autoRead');
                return m.sendInteractive({
                    text: `┌─❖「 𝗔𝗨𝗧𝗢-𝗥𝗘𝗔𝗗 」\n` +
                        `│\n` +
                        `│● 𝘚𝘵𝘢𝘵𝘶𝘴 : ${currentRead ? 'ON' : 'OFF'}\n` +
                        `│\n` +
                        `└────────────┈ ⳹\n\n` +
                        `• *on* → pesan masuk otomatis dicentang biru\n` +
                        `• *off* → pesan masuk dibiarkan belum dibaca`,
                    footer: config.footerTxt,
                    quoted: m.msg,
                    buttons: [
                        { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: 'Auto-Read ON', id: 'autoread on' }) },
                        { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: 'Auto-Read OFF', id: 'autoread off' }) },
                    ]
                });
            }

            const newRead = readInput === 'on';
            const currentRead = getSetting(Hanz, isMain, 'autoRead');

            if (newRead === currentRead) {
                return m.reply({ text: `Auto-read sudah *${readInput.toUpperCase()}*.` });
            }

            setSetting(Hanz, isMain, 'autoRead', newRead);

            await m.reply({
                text: `✅ Auto-Read: *${readInput.toUpperCase()}*\n\n` +
                    `${newRead
                        ? 'Pesan yang masuk akan otomatis dicentang biru.'
                        : 'Pesan yang masuk tidak akan dicentang biru lagi.'}\n\n` +
                    `${isMain ? '_Runtime saja. Setelah restart mengikuti config.js._' : '_Tersimpan khusus untuk clone bot ini._'}`
            });
        }
            break;

        case 'noselfsync': {
            if (!isSuperOwner) return m.reply(mess.superOwner);
            const nsInput = command.fullArgs.trim().toLowerCase();

            if (!['on', 'off'].includes(nsInput)) {
                const currentNs = getSetting(Hanz, isMain, 'noSelfSync');
                return m.sendInteractive({
                    text: `┌─❖「 𝗡𝗢-𝗦𝗘𝗟𝗙𝗦𝗬𝗡𝗖 」\n` +
                        `│\n` +
                        `│● 𝘚𝘵𝘢𝘵𝘶𝘴 : ${currentNs ? 'ON' : 'OFF'}\n` +
                        `│\n` +
                        `└────────────┈ ⳹\n\n` +
                        `• *on* → pesan bot tidak di-sync ke device lain akun bot\n` +
                        `• *off* → perilaku normal (muncul di semua device)`,
                    footer: config.footerTxt,
                    quoted: m.msg,
                    buttons: [
                        { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: 'No-SelfSync ON', id: 'noselfsync on' }) },
                        { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: 'No-SelfSync OFF', id: 'noselfsync off' }) },
                    ]
                });
            }

            const newNs = nsInput === 'on';
            const currentNs = getSetting(Hanz, isMain, 'noSelfSync');

            if (newNs === currentNs) {
                return m.reply({ text: `No-SelfSync sudah *${nsInput.toUpperCase()}*.` });
            }

            setSetting(Hanz, isMain, 'noSelfSync', newNs);

            await m.reply({
                text: `✅ No-SelfSync: *${nsInput.toUpperCase()}*\n\n` +
                    `${newNs
                        ? 'Pesan bot (reply/send) tidak di-sync ke device lain milik akun bot.'
                        : 'Pesan bot kembali normal — muncul di semua device akun bot.'}\n\n` +
                    `${isMain ? '_Runtime saja. Setelah restart mengikuti config.js._' : '_Tersimpan khusus untuk clone bot ini._'}`
            });
        }
            break;

        case 'setmenu': {
            if (!isSuperOwner) return m.reply(mess.superOwner);
            const menuInput = command.fullArgs.trim();
            const currentMenu = parseInt(getSetting(Hanz, isMain, 'menuStyle'), 10) || 1;
            const menuDesc = {
                1: 'List lengkap semua command + gambar (default).',
                2: 'Gaya product message dengan tombol pilihan kategori.',
            };

            if (!['1', '2'].includes(menuInput)) {
                const mk = (n) => (currentMenu === n ? '✅' : '▫️');
                return m.sendInteractive({
                    text: `┌─❖「 𝗧𝗔𝗠𝗣𝗜𝗟𝗔𝗡 𝗠𝗘𝗡𝗨 」\n` +
                        `│\n` +
                        `│● 𝘈𝘬𝘵𝘪𝘧 : Menu ${currentMenu}\n` +
                        `│\n` +
                        `└────────────┈ ⳹\n\n` +
                        `${mk(1)} *1* → ${menuDesc[1]}\n` +
                        `${mk(2)} *2* → ${menuDesc[2]}\n` +
                        `\n` +
                        `Command *${p}menu* tetap sama, cuma tampilannya yang ganti.\n` +
                        `Mau coba tanpa mengubah setting? Ketik *${p}menu1* atau *${p}menu2*.`,
                    footer: config.footerTxt,
                    quoted: m.msg,
                    buttons: [
                        { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: 'Menu 1', id: 'setmenu 1' }) },
                        { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: 'Menu 2', id: 'setmenu 2' }) },
                    ]
                });
            }

            const newMenu = parseInt(menuInput, 10);

            if (newMenu === currentMenu) {
                return m.reply({ text: `Tampilan menu sudah *Menu ${newMenu}*.` });
            }

            setSetting(Hanz, isMain, 'menuStyle', newMenu);

            await m.reply({
                text: `✅ Tampilan Menu: *Menu ${newMenu}*\n\n` +
                    `${menuDesc[newMenu]}\n\n` +
                    `Coba ketik *${p}menu*\n\n` +
                    `${isMain ? '_Runtime saja. Setelah restart mengikuti config.js._' : '_Tersimpan khusus untuk clone bot ini._'}`
            });
        }
            break;

        case 'info': {
    const u = process.uptime();
    const hari = Math.floor(u / 86400);
    const jam = Math.floor((u % 86400) / 3600);
    const menit = Math.floor((u % 3600) / 60);
    const detik = Math.floor(u % 60);
    await m.reply({
        text: `┌─❖「 𝗜𝗡𝗙𝗢 𝗕𝗢𝗧 」
│
│● 𝘕𝘢𝘮𝘢    : ${config.botName}
│● 𝘖𝘸𝘯𝘦𝘳   : ${getOwnerDisplay(Hanz, isMain).number}
│● 𝘗𝘳𝘦𝘧𝘪𝘹  : ${getSetting(Hanz, isMain, 'prefix')}
│● 𝘕𝘰-𝘗𝘳𝘦𝘧𝘪𝘹 : ${(getSetting(Hanz, isMain, 'noPrefix')) ? 'ON' : 'OFF'}
│● 𝘜𝘱𝘵𝘪𝘮𝘦  : ${hari}h ${jam}j ${menit}m ${detik}d
│● 𝘕𝘰𝘥𝘦    : ${process.version}
│● 𝘗𝘭𝘢𝘵𝘧𝘰𝘳𝘮 : ${process.platform}
│● 𝘔𝘰𝘥𝘦    : ${(getSetting(Hanz, isMain, 'botMode')).toUpperCase()}
│● 𝘈𝘶𝘵𝘰-𝘛𝘺𝘱𝘦 : ${(getSetting(Hanz, isMain, 'autoTyping')) ? 'ON' : 'OFF'}
│● 𝘈𝘶𝘵𝘰-𝘙𝘦𝘢𝘥 : ${(getSetting(Hanz, isMain, 'autoRead')) ? 'ON' : 'OFF'}
│● 𝘕𝘰-𝘚𝘦𝘭𝘧𝘚𝘺𝘯𝘤 : ${(getSetting(Hanz, isMain, 'noSelfSync')) ? 'ON' : 'OFF'}
│● 𝘊𝘰𝘮𝘮𝘢𝘯𝘥  : ${plugins.commandList().length} fitur aktif
│
└────────────┈ ⳹`
    });
}
    break;

        case 'block': {
            if (!isOwner) return m.reply(mess.owner);
            const getMentioned = () =>
                msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
            let targets = getMentioned();
            if (!targets.length && command.args?.[0]) {
                const n = String(command.args[0]).replace(/\D/g, '');
                if (n.length >= 8) targets = [n + '@s.whatsapp.net'];
            }
            if (!targets.length) {
                const q = msg.message?.extendedTextMessage?.contextInfo;
                const qJid = q?.participant || q?.remoteJid;
                if (qJid && !qJid.endsWith('@g.us')) targets = [qJid];
            }
            if (!targets.length) {
                return m.reply({
                    text: `❌ Tag user, reply pesan, atau masukkan nomor.\nContoh:\n${p}block @user\n${p}block 628123456789`
                });
            }
            try {
                for (const jid of targets) {
                    await Hanz.updateBlockStatus(jid, 'block');
                }
                await m.reply({
                    text: `✅ Berhasil *block* ${targets.length} user:\n` +
                        targets.map(j => `• @${j.split('@')[0]}`).join('\n'),
                    mentions: targets
                });
            } catch (err) {
                await m.reply({ text: '❌ Gagal block:\n' + (err?.message || String(err)) });
            }
        }
            break;

        case 'unblock': {
            if (!isOwner) return m.reply(mess.owner);
            const getMentioned = () =>
                msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
            let targets = getMentioned();
            if (!targets.length && command.args?.[0]) {
                const n = String(command.args[0]).replace(/\D/g, '');
                if (n.length >= 8) targets = [n + '@s.whatsapp.net'];
            }
            if (!targets.length) {
                const q = msg.message?.extendedTextMessage?.contextInfo;
                const qJid = q?.participant || q?.remoteJid;
                if (qJid && !qJid.endsWith('@g.us')) targets = [qJid];
            }
            if (!targets.length) {
                return m.reply({
                    text: `❌ Tag user, reply pesan, atau masukkan nomor.\nContoh:\n${p}unblock @user\n${p}unblock 628123456789`
                });
            }
            try {
                for (const jid of targets) {
                    await Hanz.updateBlockStatus(jid, 'unblock');
                }
                await m.reply({
                    text: `✅ Berhasil *unblock* ${targets.length} user:\n` +
                        targets.map(j => `• @${j.split('@')[0]}`).join('\n'),
                    mentions: targets
                });
            } catch (err) {
                await m.reply({ text: '❌ Gagal unblock:\n' + (err?.message || String(err)) });
            }
        }
            break;

        case 'blocklist': {
            if (!isOwner) return m.reply(mess.owner);
            try {
                const list = await Hanz.fetchBlocklist();
                if (!list || !list.length) {
                    return m.reply({ text: '✅ Blocklist kosong.' });
                }
                const lines = list.map((jid, i) => `${i + 1}. @${String(jid).split('@')[0]}`);
                await m.reply({
                    text: `🚫 *Blocklist* (${list.length})\n\n${lines.join('\n')}`,
                    mentions: list
                });
            } catch (err) {
                await m.reply({ text: '❌ Gagal ambil blocklist:\n' + (err?.message || String(err)) });
            }
        }
            break;

        case 'privacy':
        case 'privacysettings': {
            if (!isSuperOwner) return m.reply(mess.superOwner);
            try {
                const s = await Hanz.fetchPrivacySettings(true);
                const fmt = (v) => (v == null ? '-' : String(v));
                await m.reply({
                    text:
`┌─❖「 𝗣𝗥𝗜𝗩𝗔𝗖𝗬 𝗦𝗘𝗧𝗧𝗜𝗡𝗚𝗦 」
│
│● Last Seen     : ${fmt(s?.last || s?.lastSeen)}
│● Online        : ${fmt(s?.online)}
│● Profile Pic   : ${fmt(s?.profile || s?.profilePicture)}
│● Status        : ${fmt(s?.status)}
│● Read Receipts : ${fmt(s?.readreceipts || s?.readReceipts)}
│● Group Add     : ${fmt(s?.groupadd || s?.groupAdd)}
│● Default Vanish: ${fmt(s?.disappearing || s?.defaultDisappearingMode)}
│
└────────────┈ ⳹

Atur dengan:
${p}setlastseen · ${p}setonline · ${p}setppprivacy
${p}setstatusprivacy · ${p}setreadreceipt
${p}setgroupadd · ${p}setdefaultvanish`
                });
            } catch (err) {
                await m.reply({ text: '❌ Gagal ambil privacy settings:\n' + (err?.message || String(err)) });
            }
        }
            break;

        case 'setlastseen': {
            if (!isSuperOwner) return m.reply(mess.superOwner);
            const val = (command.args?.[0] || '').toLowerCase();
            const allowed = ['all', 'contacts', 'contact_blacklist', 'none'];
            if (!allowed.includes(val)) {
                return m.reply({
                    text: `❌ Nilai: all | contacts | contact_blacklist | none\nContoh: ${p}setlastseen contacts`
                });
            }
            try {
                await Hanz.updateLastSeenPrivacy(val);
                await m.reply({ text: `✅ Last Seen privacy → *${val}*` });
            } catch (err) {
                await m.reply({ text: '❌ Gagal:\n' + (err?.message || String(err)) });
            }
        }
            break;

        case 'setonline': {
            if (!isSuperOwner) return m.reply(mess.superOwner);
            const val = (command.args?.[0] || '').toLowerCase();
            const allowed = ['all', 'match_last_seen'];
            if (!allowed.includes(val)) {
                return m.reply({
                    text: `❌ Nilai: all | match_last_seen\nContoh: ${p}setonline match_last_seen`
                });
            }
            try {
                await Hanz.updateOnlinePrivacy(val);
                await m.reply({ text: `✅ Online privacy → *${val}*` });
            } catch (err) {
                await m.reply({ text: '❌ Gagal:\n' + (err?.message || String(err)) });
            }
        }
            break;

        case 'setppprivacy': {
            if (!isSuperOwner) return m.reply(mess.superOwner);
            const val = (command.args?.[0] || '').toLowerCase();
            const allowed = ['all', 'contacts', 'contact_blacklist', 'none'];
            if (!allowed.includes(val)) {
                return m.reply({
                    text: `❌ Nilai: all | contacts | contact_blacklist | none\nContoh: ${p}setppprivacy contacts`
                });
            }
            try {
                await Hanz.updateProfilePicturePrivacy(val);
                await m.reply({ text: `✅ Profile Picture privacy → *${val}*` });
            } catch (err) {
                await m.reply({ text: '❌ Gagal:\n' + (err?.message || String(err)) });
            }
        }
            break;

        case 'setstatusprivacy': {
            if (!isSuperOwner) return m.reply(mess.superOwner);
            const val = (command.args?.[0] || '').toLowerCase();
            const allowed = ['all', 'contacts', 'contact_blacklist', 'none'];
            if (!allowed.includes(val)) {
                return m.reply({
                    text: `❌ Nilai: all | contacts | contact_blacklist | none\nContoh: ${p}setstatusprivacy contacts`
                });
            }
            try {
                await Hanz.updateStatusPrivacy(val);
                await m.reply({ text: `✅ Status privacy → *${val}*` });
            } catch (err) {
                await m.reply({ text: '❌ Gagal:\n' + (err?.message || String(err)) });
            }
        }
            break;

        case 'setreadreceipt':
        case 'setreadreceipts': {
            if (!isSuperOwner) return m.reply(mess.superOwner);
            const val = (command.args?.[0] || '').toLowerCase();
            const allowed = ['all', 'none'];
            if (!allowed.includes(val)) {
                return m.reply({
                    text: `❌ Nilai: all | none\nContoh: ${p}setreadreceipt none\n_(none = centang biru dimatikan)_`
                });
            }
            try {
                await Hanz.updateReadReceiptsPrivacy(val);
                await m.reply({ text: `✅ Read Receipts privacy → *${val}*` });
            } catch (err) {
                await m.reply({ text: '❌ Gagal:\n' + (err?.message || String(err)) });
            }
        }
            break;

        case 'setgroupadd': {
            if (!isSuperOwner) return m.reply(mess.superOwner);
            const val = (command.args?.[0] || '').toLowerCase();
            const allowed = ['all', 'contacts', 'contact_blacklist'];
            if (!allowed.includes(val)) {
                return m.reply({
                    text: `❌ Nilai: all | contacts | contact_blacklist\nContoh: ${p}setgroupadd contacts\n_(siapa yang boleh menambahkan bot ke grup)_`
                });
            }
            try {
                await Hanz.updateGroupsAddPrivacy(val);
                await m.reply({ text: `✅ Groups Add privacy → *${val}*` });
            } catch (err) {
                await m.reply({ text: '❌ Gagal:\n' + (err?.message || String(err)) });
            }
        }
            break;

        case 'setdefaultvanish':
        case 'setdefaultephemeral': {
            if (!isSuperOwner) return m.reply(mess.superOwner);
            const arg = (command.args?.[0] || '').toLowerCase();
            const map = {
                off: 0, '0': 0, remove: 0, mati: 0,
                '24h': 86400, '24': 86400, '1d': 86400,
                '7d': 604800, '7': 604800,
                '90d': 7776000, '90': 7776000
            };
            if (!(arg in map)) {
                return m.reply({
                    text:
`⏱ *Default Disappearing Mode* (akun bot)

• ${p}setdefaultvanish off
• ${p}setdefaultvanish 24h
• ${p}setdefaultvanish 7d
• ${p}setdefaultvanish 90d`
                });
            }
            try {
                const seconds = map[arg];
                await Hanz.updateDefaultDisappearingMode(seconds);
                await m.reply({ text: `✅ Default vanishing mode → *${arg === '0' ? 'off' : arg}*` });
            } catch (err) {
                await m.reply({ text: '❌ Gagal:\n' + (err?.message || String(err)) });
            }
        }
            break;

        case 'upstatus':
        case 'story': {
            if (!isOwner) return m.reply(mess.owner);
            const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            const srcMsg = quotedMsg || msg.message;
            const caption = (command.fullArgs || '').trim();
            const collectStatusJids = async () => {
                const set = new Set();
                try {
                    const all = await Hanz.groupFetchAllParticipating();
                    for (const g of Object.values(all || {})) {
                        for (const p of g.participants || []) {
                            const id = p.id || p.jid;
                            if (id && id.endsWith('@s.whatsapp.net')) set.add(id);
                        }
                    }
                } catch {}

                const me = Hanz.user?.id?.replace(/:[0-9]+/, '');
                if (me) set.add(me);
                return [...set];
            };

            try {
                await m.react('⏳').catch(() => {});
                const statusJidList = await collectStatusJids();
                const opts = {
                    statusJidList,
                    broadcast: true
                };
                if (srcMsg?.imageMessage) {
                    const mediaResult = await downloadMedia(srcMsg);
                    if (!mediaResult?.buffer) {
                        return m.reply({ text: '❌ Gagal download gambar.' });
                    }
                    await Hanz.sendMessage(
                        'status@broadcast',
                        {
                            image: mediaResult.buffer,
                            caption: caption || undefined
                        },
                        opts
                    );
                    await m.reply({ text: `✅ Status *gambar* terkirim ke ~${statusJidList.length} kontak.` });
                    break;
                }
                if (srcMsg?.videoMessage) {
                    const mediaResult = await downloadMedia(srcMsg);
                    if (!mediaResult?.buffer) {
                        return m.reply({ text: '❌ Gagal download video.' });
                    }
                    await Hanz.sendMessage(
                        'status@broadcast',
                        {
                            video: mediaResult.buffer,
                            caption: caption || undefined
                        },
                        opts
                    );
                    await m.reply({ text: `✅ Status *video* terkirim ke ~${statusJidList.length} kontak.` });
                    break;
                }
                if (srcMsg?.audioMessage) {
                    const mediaResult = await downloadMedia(srcMsg);
                    if (!mediaResult?.buffer) {
                        return m.reply({ text: '❌ Gagal download audio.' });
                    }
                    await Hanz.sendMessage(
                        'status@broadcast',
                        {
                            audio: mediaResult.buffer,
                            mimetype: srcMsg.audioMessage.mimetype || 'audio/ogg; codecs=opus',
                            ptt: !!srcMsg.audioMessage.ptt
                        },
                        opts
                    );
                    await m.reply({ text: `✅ Status *audio* terkirim ke ~${statusJidList.length} kontak.` });
                    break;
                }
                if (caption) {
                    let textBody = caption;
                    let backgroundColor;
                    let font;
                    if (caption.includes('|')) {
                        const parts = caption.split('|').map(s => s.trim());
                        textBody = parts[0] || caption;
                        if (parts[1] && /^#?[0-9A-Fa-f]{6}$/.test(parts[1].replace('#', ''))) {
                            backgroundColor = parts[1].startsWith('#') ? parts[1] : '#' + parts[1];
                        }
                        if (parts[2] && !isNaN(Number(parts[2]))) font = Number(parts[2]);
                    }
                    await Hanz.sendMessage(
                        'status@broadcast',
                        { text: textBody },
                        {
                            ...opts,
                            ...(backgroundColor ? { backgroundColor } : {}),
                            ...(font != null ? { font } : {})
                        }
                    );
                    await m.reply({ text: `✅ Status *teks* terkirim ke ~${statusJidList.length} kontak.` });
                    break;
                }

                await m.reply({
                    text:
`📸 *Upload Status / Stories*

• Teks:
  ${p}upstatus Halo semua!
  ${p}upstatus Halo | #FF5733 | 1
    _(teks | warna hex | font number)_

• Gambar / Video / Audio:
  Kirim atau *reply* media + caption:
  ${p}upstatus caption opsional

Status dikirim ke peserta grup yang diikuti bot.`
                });
            } catch (err) {
                console.error('[upstatus]', err);
                await m.reply({ text: '❌ Gagal upload status:\n' + (err?.message || String(err)) });
            }
        }
            break;

        case 'broadcast':
        case 'bc': {
            if (!isOwner) return m.reply(mess.owner);
            const full = (command.fullArgs || '').trim();
            if (!full) {
                return m.reply({
                    text:
`📢 *Broadcast*

Format:
• ${p}broadcast 628xxx,628yyy | Pesan di sini
• ${p}broadcast 12345678@broadcast | Pesan
• Reply media + ${p}broadcast 628xxx,628yyy

Pisahkan nomor dengan koma/spasi. Bisa pakai ID broadcast (\`xxx@broadcast\`).`
                });
            }
            let targetsRaw = full;
            let textBody = '';
            if (full.includes('|')) {
                const idx = full.indexOf('|');
                targetsRaw = full.slice(0, idx).trim();
                textBody = full.slice(idx + 1).trim();
            }

            const targets = targetsRaw
                .split(/[\s,;]+/)
                .map(t => t.trim())
                .filter(Boolean)
                .map(t => {
                    if (t.includes('@')) return t;
                    const n = t.replace(/\D/g, '');
                    return n.length >= 8 ? n + '@s.whatsapp.net' : null;
                })
                .filter(Boolean);

            if (!targets.length) {
                return m.reply({ text: '❌ Tidak ada target valid.' });
            }

            const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            const srcMsg = quotedMsg || msg.message;

            try {
                await m.reply({ text: `⏳ Broadcast ke ${targets.length} target...` });
                let ok = 0;
                let fail = 0;

                for (const jid of targets) {
                    try {
                        if (srcMsg?.imageMessage && !textBody) {
                            const mediaResult = await downloadMedia(srcMsg);
                            if (mediaResult?.buffer) {
                                await Hanz.sendMessage(jid, {
                                    image: mediaResult.buffer,
                                    caption: textBody || undefined
                                }, { broadcast: jid.endsWith('@broadcast') });
                            }
                        } else if (srcMsg?.videoMessage && !textBody) {
                            const mediaResult = await downloadMedia(srcMsg);
                            if (mediaResult?.buffer) {
                                await Hanz.sendMessage(jid, {
                                    video: mediaResult.buffer,
                                    caption: textBody || undefined
                                }, { broadcast: jid.endsWith('@broadcast') });
                            }
                        } else {
                            await Hanz.sendMessage(jid, {
                                text: textBody || full
                            }, { broadcast: jid.endsWith('@broadcast') });
                        }
                        ok++;
                    } catch {
                        fail++;
                    }
                    await delay(400);
                }
                await m.reply({
                    text: `✅ Broadcast selesai.\n• Sukses: ${ok}\n• Gagal: ${fail}\n• Total: ${targets.length}`
                });
            } catch (err) {
                await m.reply({ text: '❌ Gagal broadcast:\n' + (err?.message || String(err)) });
            }
        }
            break;

        case 'bcinfo':
        case 'broadcastinfo': {
            if (!isOwner) return m.reply(mess.owner);
            const bcId = (command.args?.[0] || '').trim();
            if (!bcId || !bcId.includes('@broadcast')) {
                return m.reply({
                    text: `❌ Masukkan ID broadcast.\nContoh: ${p}bcinfo 12345678@broadcast`
                });
            }
            try {
                if (typeof Hanz.getBroadcastListInfo !== 'function') {
                    return m.reply({ text: '❌ API getBroadcastListInfo tidak tersedia di Baileys3 ini.' });
                }
                const info = await Hanz.getBroadcastListInfo(bcId);
                const recps = info?.recipients || info?.users || [];
                const lines = (Array.isArray(recps) ? recps : []).map((r, i) => {
                    const j = typeof r === 'string' ? r : (r.jid || r.id || String(r));
                    return `${i + 1}. @${String(j).split('@')[0]}`;
                });
                await m.reply({
                    text: `📢 *Broadcast List*\n📛 Nama: ${info?.name || '-'}\n👥 Recipients (${lines.length}):\n${lines.join('\n') || '-'}`,
                    mentions: (Array.isArray(recps) ? recps : []).map(r => typeof r === 'string' ? r : (r.jid || r.id)).filter(Boolean)
                });
            } catch (err) {
                await m.reply({ text: '❌ Gagal ambil info broadcast:\n' + (err?.message || String(err)) });
            }
        }
            break;

        case 'setbio':
        case 'setstatus': {
            if (!isOwner) return m.reply(mess.owner);
            const bio = (command.fullArgs || '').trim();
            if (!bio) {
                return m.reply({ text: `❌ Contoh: ${p}setbio Halo, ini bot WA` });
            }
            try {
                await Hanz.updateProfileStatus(bio);
                await m.reply({ text: `✅ Bio / status profil diubah:\n_${bio}_` });
            } catch (err) {
                await m.reply({ text: '❌ Gagal set bio:\n' + (err?.message || String(err)) });
            }
        }
            break;

        case 'setname':
        case 'setprofilname': {
            if (!isOwner) return m.reply(mess.owner);
            const name = (command.fullArgs || '').trim();
            if (!name) {
                return m.reply({ text: `❌ Contoh: ${p}setname Hanz Ofc Bot` });
            }
            try {
                await Hanz.updateProfileName(name);
                await m.reply({ text: `✅ Nama profil diubah menjadi: *${name}*` });
            } catch (err) {
                await m.reply({ text: '❌ Gagal set nama:\n' + (err?.message || String(err)) });
            }
        }
            break;

        case 'delpp':
        case 'removepp': {
            if (!isOwner) return m.reply(mess.owner);
            try {
                const me = Hanz.user?.id;
                if (!me) return m.reply({ text: '❌ User bot tidak ditemukan.' });
                await Hanz.removeProfilePicture(me);
                await m.reply({ text: '✅ Foto profil bot berhasil dihapus.' });
            } catch (err) {
                await m.reply({ text: '❌ Gagal hapus PP:\n' + (err?.message || String(err)) });
            }
        }
            break;

        case 'mute': {
            if (!isOwner) return m.reply(mess.owner);
            const arg = (command.args?.[0] || '8h').toLowerCase();
            const mapMs = {
                '8h': 8 * 60 * 60 * 1000,
                '8': 8 * 60 * 60 * 1000,
                '7d': 7 * 24 * 60 * 60 * 1000,
                '7': 7 * 24 * 60 * 60 * 1000
            };
            const duration = mapMs[arg] ?? mapMs['8h'];
            try {
                await Hanz.chatModify({ mute: duration }, m.chat);
                await m.reply({ text: `✅ Chat di-mute selama *${arg}* (${duration} ms).` });
            } catch (err) {
                await m.reply({ text: '❌ Gagal mute:\n' + (err?.message || String(err)) });
            }
        }
            break;

        case 'unmute': {
            if (!isOwner) return m.reply(mess.owner);
            try {
                await Hanz.chatModify({ mute: null }, m.chat);
                await m.reply({ text: '✅ Chat di-unmute.' });
            } catch (err) {
                await m.reply({ text: '❌ Gagal unmute:\n' + (err?.message || String(err)) });
            }
        }
            break;

        case 'archive':
        case 'arsip': {
            if (!isOwner) return m.reply(mess.owner);
            try {
                await Hanz.chatModify({ archive: true, lastMessages: [] }, m.chat);
                await m.reply({ text: '✅ Chat di-arsipkan.' });
            } catch (err) {
                await m.reply({ text: '❌ Gagal archive (mungkin butuh lastMessages dari store):\n' + (err?.message || String(err)) });
            }
        }
            break;

        case 'unarchive': {
            if (!isOwner) return m.reply(mess.owner);
            try {
                await Hanz.chatModify({ archive: false, lastMessages: [] }, m.chat);
                await m.reply({ text: '✅ Chat di-unarchive.' });
            } catch (err) {
                await m.reply({ text: '❌ Gagal unarchive:\n' + (err?.message || String(err)) });
            }
        }
            break;

        case 'pinchat': {
            if (!isOwner) return m.reply(mess.owner);
            const on = (command.args?.[0] || 'on').toLowerCase() !== 'off';
            try {
                await Hanz.chatModify({ pin: on }, m.chat);
                await m.reply({ text: on ? '✅ Chat di-pin.' : '✅ Chat di-unpin.' });
            } catch (err) {
                await m.reply({ text: '❌ Gagal pin chat:\n' + (err?.message || String(err)) });
            }
        }
            break;

        case 'star': {
            if (!isOwner) return m.reply(mess.owner);
            const ctx = msg.message?.extendedTextMessage?.contextInfo;
            const qKey = ctx?.stanzaId ? {
                id: ctx.stanzaId,
                fromMe: ctx.participant ? false : !!msg.key.fromMe,
                remoteJid: m.chat
            } : null;
            const quotedKey = msg.message?.extendedTextMessage?.contextInfo;
            if (!quotedKey?.stanzaId) {
                return m.reply({ text: `❌ Reply pesan yang ingin di-star.\nContoh: reply pesan lalu ketik ${p}star` });
            }
            try {
                await Hanz.chatModify({
                    star: {
                        messages: [{
                            id: quotedKey.stanzaId,
                            fromMe: msg.key.fromMe || false
                        }],
                        star: true
                    }
                }, m.chat);
                await m.reply({ text: '✅ Pesan di-star.' });
            } catch (err) {
                await m.reply({ text: '❌ Gagal star:\n' + (err?.message || String(err)) });
            }
        }
            break;

        case 'unstar': {
            if (!isOwner) return m.reply(mess.owner);
            const quotedKey = msg.message?.extendedTextMessage?.contextInfo;
            if (!quotedKey?.stanzaId) {
                return m.reply({ text: `❌ Reply pesan yang ingin di-unstar.` });
            }
            try {
                await Hanz.chatModify({
                    star: {
                        messages: [{ id: quotedKey.stanzaId, fromMe: msg.key.fromMe || false }],
                        star: false
                    }
                }, m.chat);
                await m.reply({ text: '✅ Star dihapus dari pesan.' });
            } catch (err) {
                await m.reply({ text: '❌ Gagal unstar:\n' + (err?.message || String(err)) });
            }
        }
            break;

        case 'vanish':
        case 'disappearing': {
            if (!isOwner) return m.reply(mess.owner);
            const arg = (command.args?.[0] || '').toLowerCase();
            const map = {
                off: false, '0': false, mati: false,
                '24h': 86400, '24': 86400,
                '7d': 604800, '7': 604800,
                '90d': 7776000, '90': 7776000
            };
            if (!(arg in map)) {
                return m.reply({
                    text:
`⏱ *Disappearing Messages* (chat ini)

• ${p}vanish off
• ${p}vanish 24h
• ${p}vanish 7d
• ${p}vanish 90d`
                });
            }
            try {
                const val = map[arg];
                await Hanz.sendMessage(m.chat, {
                    disappearingMessagesInChat: val === false ? false : val
                });
                await m.reply({ text: `✅ Disappearing messages → *${arg}*` });
            } catch (err) {
                await m.reply({ text: '❌ Gagal set vanishing:\n' + (err?.message || String(err)) });
            }
        }
            break;
        case 'checkuser':
        case 'cekuser': {
            const username = (command.args?.[0] || command.fullArgs || '').replace(/^@/, '').trim();
            if (!username) {
                await m.reply({ text: `Contoh: ${p}checkuser namauser` });
                break;
            }
            if (typeof Hanz.checkUsername !== 'function') {
                await m.reply({ text: '❌ Fitur username belum ada di build Baileys ini. Pastikan sudah rebuild Baileys3.' });
                break;
            }
            try {
                const res = await Hanz.checkUsername(username);
                if (res?.available) {
                    await m.reply({ text: `✅ Username *@${username}* tersedia.` });
                } else {
                    const sugg = (res?.suggestions || []).slice(0, 5).map((s) => `• @${s}`).join('\n');
                    const reasons = (res?.rejectionReasons || []).join(', ');
                    await m.reply({
                        text:
                            `❌ Username *@${username}* tidak tersedia.\n` +
                            (reasons ? `Alasan: ${reasons}\n` : '') +
                            (sugg ? `\nSaran:\n${sugg}` : '')
                    });
                }
            } catch (e) {
                await m.reply({
                    text:
                        '❌ Gagal cek username:\n' +
                        (e?.message || String(e)) +
                        '\n\nCatatan: fitur @username tergantung dukungan server WA / akun.'
                });
            }
        }
            break;

        case 'setuser':
        case 'setusername': {
            if (!isOwner && !isSuperOwner) {
                await m.reply(mess.owner);
                break;
            }
            const username = (command.args?.[0] || command.fullArgs || '').replace(/^@/, '').trim();
            if (!username) {
                await m.reply({ text: `Contoh: ${p}setuser namabot` });
                break;
            }
            if (typeof Hanz.setUsername !== 'function') {
                await m.reply({ text: '❌ Fitur username belum ada di build Baileys ini.' });
                break;
            }
            try {
                await Hanz.setUsername(username);
                await m.reply({ text: `✅ Username di-set ke *@${username}*` });
            } catch (e) {
                await m.reply({ text: '❌ Gagal set username:\n' + (e?.message || String(e)) });
            }
        }
            break;

        case 'deluser':
        case 'deleteusername': {
            if (!isOwner && !isSuperOwner) {
                await m.reply(mess.owner);
                break;
            }
            if (typeof Hanz.deleteUsername !== 'function') {
                await m.reply({ text: '❌ Fitur username belum ada di build Baileys ini.' });
                break;
            }
            try {
                await Hanz.deleteUsername();
                await m.reply({ text: '✅ Username akun bot dihapus.' });
            } catch (e) {
                await m.reply({ text: '❌ Gagal hapus username:\n' + (e?.message || String(e)) });
            }
        }
            break;

        case 'myuser':
        case 'myusername': {
            if (typeof Hanz.getMyUsername !== 'function') {
                await m.reply({ text: '❌ Fitur username belum ada di build Baileys ini.' });
                break;
            }
            try {
                const u = await Hanz.getMyUsername();
                await m.reply({
                    text: u
                        ? `👤 Username akun bot: *@${u}*`
                        : 'ℹ️ Akun bot belum punya username.'
                });
            } catch (e) {
                await m.reply({ text: '❌ Gagal ambil username:\n' + (e?.message || String(e)) });
            }
        }
            break;

        case 'save':
        case 'sv': {
            if (!isOwner) return m.reply(mess.owner);

            const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage
                || msg.message;
            const mediaResult = await downloadMedia(quotedMsg);
            if (!mediaResult) {
                return m.reply({
                    text: [
                        '❌ *Tidak ada media yang dideteksi!*',
                        '',
                        'Cara pakai:',
                        `• Reply foto / video / dokumen / audio / sticker → \`${p}save\``,
                        `• Atau kasih nama custom: \`${p}save nama_file\``,
                    ].join('\n')
                });
            }

            try {
                await m.react('⏳').catch(() => {});
                const { buffer, mediaType, content } = mediaResult;
                const mimetype = content?.mimetype || '';
                const originalName = content?.fileName
                    || content?.title
                    || null;
                const customName = (command.fullArgs || '').trim();
                const displayName = customName
                    || originalName
                    || `${mediaType}_${Date.now()}`;

                const id = nextSavedId(loadSavedIndex());
                const ext = guessExt(mediaType, mimetype, originalName || customName);
                const safeBase = String(displayName)
                    .replace(/[^\w.\-()\[\] ]+/g, '_')
                    .replace(/\s+/g, '_')
                    .slice(0, 80);
                const storedName = `${id}_${safeBase}${safeBase.toLowerCase().endsWith('.' + ext) ? '' : '.' + ext}`;
                const typeDir = path.join(SAVED_ROOT, mediaType);
                ensureSavedDirs();
                const filePath = path.join(typeDir, storedName);
                fs.writeFileSync(filePath, buffer);

                const entry = {
                    id,
                    type: mediaType,
                    filename: storedName,
                    originalName: displayName,
                    mimetype: mimetype || '',
                    size: buffer.length,
                    savedBy: senderNumber,
                    savedAt: new Date().toISOString(),
                };

                const list = loadSavedIndex();
                list.push(entry);
                writeSavedIndex(list);

                await m.reply({
                    text: [
                        `✅ *Media tersimpan!*`,
                        '',
                        `${typeEmoji(mediaType)} Tipe: *${mediaType}*`,
                        `🆔 ID: *${id}*`,
                        `📁 Nama: ${displayName}`,
                        `📦 Ukuran: ${formatBytes(buffer.length)}`,
                        '',
                        `Kirim ulang: \`${p}getsave ${id}\``,
                        `Lihat semua: \`${p}listsave\``,
                    ].join('\n')
                });
            } catch (err) {
                console.error('[save]', err);
                await m.reply({ text: '❌ Gagal menyimpan media:\n' + (err?.message || String(err)) });
            }
        }
            break;

        case 'listsave':
        case 'lsave':
        case 'saved': {
            if (!isOwner) return m.reply(mess.owner);

            const filterArg = (command.args?.[0] || '').toLowerCase();
            let list = loadSavedIndex();

            if (filterArg && SAVED_TYPES.includes(filterArg)) {
                list = list.filter((x) => x.type === filterArg);
            }

            if (!list.length) {
                return m.reply({
                    text: filterArg
                        ? `📂 Belum ada media bertipe *${filterArg}*.`
                        : `📂 Database masih kosong.\n\nReply media + \`${p}save\` untuk menyimpan.`
                });
            }

            const pageSize = 15;
            const pageArg = filterArg && !SAVED_TYPES.includes(filterArg)
                ? parseInt(filterArg, 10)
                : parseInt(command.args?.[1] || '1', 10);
            const page = Number.isFinite(pageArg) && pageArg > 0 ? pageArg : 1;
            const totalPages = Math.max(1, Math.ceil(list.length / pageSize));
            const safePage = Math.min(page, totalPages);
            const slice = list.slice((safePage - 1) * pageSize, safePage * pageSize);

            const counts = {};
            for (const t of SAVED_TYPES) counts[t] = 0;
            for (const x of loadSavedIndex()) {
                if (counts[x.type] != null) counts[x.type]++;
            }

            const lines = slice.map((x) => {
                const name = (x.originalName || x.filename || '-').slice(0, 40);
                return `${x.id}. ${typeEmoji(x.type)} [${x.type}] ${name} (${formatBytes(x.size)})`;
            });

            const header = filterArg && SAVED_TYPES.includes(filterArg)
                ? `📁 *Saved Media — ${filterArg}* (${list.length})`
                : `📁 *Saved Media* (${list.length} item)`;

            const summary = SAVED_TYPES
                .filter((t) => counts[t] > 0)
                .map((t) => `${typeEmoji(t)} ${t}: ${counts[t]}`)
                .join(' · ');

            await m.reply({
                text: [
                    header,
                    summary ? summary : '',
                    '',
                    ...lines,
                    '',
                    `Halaman ${safePage}/${totalPages}`,
                    '',
                    `• \`${p}getsave <id>\` — kirim media`,
                    `• \`${p}delsave <id>\` — hapus`,
                    `• \`${p}listsave image\` — filter tipe`,
                    totalPages > 1 ? `• \`${p}listsave ${safePage + 1 <= totalPages ? safePage + 1 : 1}\` — halaman lain` : '',
                ].filter(Boolean).join('\n')
            });
        }
            break;

        case 'getsave':
        case 'gs':
        case 'sendmedia': {
            if (!isOwner) return m.reply(mess.owner);

            const idArg = parseInt(command.args?.[0], 10);
            if (!idArg || idArg < 1) {
                return m.reply({
                    text: [
                        '❌ Masukkan ID media.',
                        '',
                        `Contoh: \`${p}getsave 3\``,
                        `Lihat daftar: \`${p}listsave\``,
                    ].join('\n')
                });
            }

            const list = loadSavedIndex();
            const entry = list.find((x) => Number(x.id) === idArg);
            if (!entry) {
                return m.reply({ text: `❌ Media ID *${idArg}* tidak ditemukan.\nCek \`${p}listsave\`.` });
            }

            const filePath = path.join(SAVED_ROOT, entry.type, entry.filename);
            if (!fs.existsSync(filePath)) {
                return m.reply({ text: `❌ File fisik ID *${idArg}* hilang dari disk.` });
            }

            try {
                await m.react('⏳').catch(() => {});
                const buffer = fs.readFileSync(filePath);
                const caption = `🆔 ${entry.id} · ${entry.originalName || entry.filename}`;
                const mime = entry.mimetype || '';

                if (entry.type === 'image') {
                    await Hanz.sendMessage(m.chat, { image: buffer, caption }, { quoted: msg });
                } else if (entry.type === 'video') {
                    await Hanz.sendMessage(m.chat, { video: buffer, caption }, { quoted: msg });
                } else if (entry.type === 'sticker') {
                    await Hanz.sendMessage(m.chat, { sticker: buffer }, { quoted: msg });
                } else if (entry.type === 'audio') {
                    await Hanz.sendMessage(m.chat, {
                        audio: buffer,
                        mimetype: mime || 'audio/ogg; codecs=opus',
                        ptt: false,
                    }, { quoted: msg });
                } else {
                    await Hanz.sendMessage(m.chat, {
                        document: buffer,
                        mimetype: mime || 'application/octet-stream',
                        fileName: entry.originalName || entry.filename,
                    }, { quoted: msg });
                }
            } catch (err) {
                console.error('[getsave]', err);
                await m.reply({ text: '❌ Gagal mengirim media:\n' + (err?.message || String(err)) });
            }
        }
            break;

        case 'delsave':
        case 'ds': {
            if (!isOwner) return m.reply(mess.owner);

            const idArg = parseInt(command.args?.[0], 10);
            if (!idArg || idArg < 1) {
                return m.reply({
                    text: [
                        '❌ Masukkan ID media yang mau dihapus.',
                        '',
                        `Contoh: \`${p}delsave 3\``,
                    ].join('\n')
                });
            }

            const list = loadSavedIndex();
            const idx = list.findIndex((x) => Number(x.id) === idArg);
            if (idx === -1) {
                return m.reply({ text: `❌ Media ID *${idArg}* tidak ditemukan.` });
            }

            const entry = list[idx];
            const filePath = path.join(SAVED_ROOT, entry.type, entry.filename);
            try {
                if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            } catch (e) {
                console.warn('[delsave] unlink:', e.message);
            }

            list.splice(idx, 1);
            writeSavedIndex(list);

            await m.reply({
                text: `🗑 Media ID *${idArg}* (${entry.type}: ${entry.originalName || entry.filename}) dihapus.`
            });
        }
            break;
case 'stickercmd': {
            const { proto, generateWAMessageFromContent } = require('baileys');

            const fileNames = [
                '2dOgOU-JP3aSe-ZNA5YrVQ8n-n7dIdFfqkigpF1bSDA=.webp',
                '6TQCiMuABD-rRa0GWyJ+iLXQm7DhdvJK+3PXCAjDrWE=.webp',
                '5myfFCfk0EIGHZK5lGKh9hPyFCTdQ6f8JH5J3lTYOKw=.webp',
                'TlmZKq3qYg08hpxnEt-7Qhx1mUKH97MYqz92-+qe-68=.webp',
                'fwMIE+DlgCP-vzGB1kos4OZpVUb-UUWytojKq4sFZWc=.webp',
                'ABTxC0VuqDD-VnW-mfDlSsdcXeV4N8Mf4OAu6A0c-rE=.webp',
                'hiuu-Va4rvoYhMbM2clFjlcsAwPAsrC4RrfIMOyLdKg=.webp',
                'EeCBxUDqTUNUm6SE6A7PTnJLV5WgO303OjovoPVTtbs=.webp',
                'rb+EmtScKA+OSi3ZZbGSczRQLtyA1mGVo+YTjuJHbJg=.webp',
                'KInwic5tvMBrJb+Q9WzCltexGheikABQ9wVNm2McdR8=.webp',
                'FYEbA68BymYn7hpMYc6d0UF0KM2m-c6X53TBFG0UA3k=.webp',
                '03BJzgGfrhfT9HBH+j5zVKb+9rMVH7WiAv-aSQ+Nbyc=.webp',
            ];

            const stickerPack = {
                stickerPackId: '1c822b89-77de-485d-8587-f8379afed3bc',
                name: 'Sticker CMD-Bot HanzOfc',
                publisher: '',
                stickers: fileNames.map((fileName) => ({
                    fileName,
                    isAnimated: false,
                    emojis: ['🤖'],
                    accessibilityLabel: '',
                    isLottie: false,
                    mimetype: 'image/webp',
                })),
                fileLength: '801718',
                fileSha256: 'TtCWVqBAQgu/0kdAlZBYsASKKI38wx7Cjd/3fTnJRDo=',
                fileEncSha256: 'N1lRJcSBVl9gRAIofZA/4PKvkeLDBmIomkz6CPuTMSM=',
                mediaKey: 'OAP/8jZfy4nz6sR0euPLj08dIxm9FYuUOsz4wUc/a2c=',
                directPath: '/v/t62.15575-24/851045214_1664091018395505_3396730879250531494_n.enc?ccb=11-4&oh=01_Q5Aa5wGwkQcWFvHTq5ICfRTEUblzHAmC5yj1Jw2NTEeKq7R7OA&oe=6AFD10B8&_nc_sid=5e03e0',
                trayIconFileName: '1c822b89-77de-485d-8587-f8379afed3bc.png',
                thumbnailDirectPath: '/v/t62.15575-24/851713875_30048641558058401_2674727704513544984_n.enc?ccb=11-4&oh=01_Q5Aa5wFJc-JdtVupBKg8mlLXmdidSHYF0p991a5ccf_sPhQFzQ&oe=6AFD06DA&_nc_sid=5e03e0',
                stickerPackSize: '799201',
            };

            const waMsg = generateWAMessageFromContent(
                m.chat,
                proto.Message.fromObject({ stickerPackMessage: stickerPack }),
                { userJid: Hanz.user?.id, quoted: m.msg }
            );

            await Hanz.relayMessage(m.chat, waMsg.message, { messageId: waMsg.key.id });
        }
            break;
        case 'setcmd': {
            if (!isOwner) return m.reply(mess.owner);
            if (!isMain) return m.reply({ text: '❌ Fitur ini hanya bisa dipakai di *bot utama*, tidak di clone bot.' });

            const cmdText = (command.fullArgs || '').trim();
            if (!cmdText) {
                return m.reply({
                    text: [
                        '❌ Masukkan command yang mau diikat ke sticker.',
                        '',
                        'Cara pakai:',
                        `1. Reply sebuah *sticker*`,
                        `2. Ketik \`${p}setcmd menu\``,
                        '',
                        'Setelah itu, setiap kali sticker itu dikirim, bot akan menjalankan command tersebut.',
                        `Tips: pakai tanpa prefix kalau noPrefix aktif, contoh: \`${p}setcmd menu\``,
                    ].join('\n')
                });
            }

            const hash = stickerCmdStore.hashFromQuoted(msg);
            if (!hash) {
                const quoted =
                    msg.message?.extendedTextMessage?.contextInfo?.quotedMessage ||
                    msg.message?.ephemeralMessage?.message?.extendedTextMessage?.contextInfo?.quotedMessage ||
                    null;
                if (!quoted) {
                
                    stickerCmdStore.setPending(senderNumber, cmdText);
                    return m.reply({
                        text: [
                            `⏳ Oke! Sekarang *kirim sticker-nya* (dalam 2 menit) untuk diikat ke \`${cmdText}\`.`,
                            '',
                            'Kirim dari tray/favorit yang sama dengan yang nanti kamu pakai.',
                        ].join('\n')
                    });
                }
                const info = quoted ? stickerCmdStore.inspectSticker(quoted) : null;
                const keys = quoted ? Object.keys(quoted).join(', ') : 'tidak ada quoted';
                return m.reply({
                    text: [
                        '❌ Hash sticker tidak terbaca.',
                        '',
                        'Pastikan kamu *reply sticker* (bukan forward sebagai gambar).',
                        'Support sticker biasa & sticker gerak (animasi).',
                        '',
                        `Debug: quoted keys = ${keys}`,
                        info
                            ? `Debug: isAnimated=${info.isAnimated}, hasSha=${info.hasSha}, mime=${info.mimetype || '-'}`
                            : 'Debug: bukan stickerMessage / wrapper tidak dikenali',
                    ].join('\n')
                });
            }

            const existing = stickerCmdStore.get(hash);
            if (existing?.locked) {
                return m.reply({ text: '🔒 Sticker command ini *terkunci*. Unlock dulu dengan `' + m.prefix + 'unlockcmd` (reply sticker yang sama).' });
            }

            const quotedForInfo =
                msg.message?.extendedTextMessage?.contextInfo?.quotedMessage || null;
            const info = quotedForInfo ? stickerCmdStore.inspectSticker(quotedForInfo) : null;

            stickerCmdStore.set(hash, {
                text: cmdText,
                creator: senderNumber,
                at: Date.now(),
                locked: false,
                isAnimated: !!(info && info.isAnimated),
            });

            await m.reply({
                text: [
                    '✅ *Sticker command tersimpan!*',
                    '',
                    `🧩 Hash: \`${hash.slice(0, 16)}…\``,
                    `⚡ Command: \`${cmdText}\``,
                    info?.isAnimated ? '🎞 Tipe: *sticker gerak (animasi)*' : '🖼 Tipe: *sticker biasa*',
                    '',
                    'Kirim sticker tersebut kapan saja untuk menjalankan command-nya.',
                ].join('\n')
            });
        }
            break;

        case 'delcmd': {
            if (!isOwner) return m.reply(mess.owner);
            if (!isMain) return m.reply({ text: '❌ Fitur ini hanya bisa dipakai di *bot utama*, tidak di clone bot.' });

            const hash = stickerCmdStore.hashFromQuoted(msg);
            if (!hash) {
                return m.reply({ text: '❌ Reply *sticker* yang sudah di-setcmd!' });
            }

            const existing = stickerCmdStore.get(hash);
            if (!existing) {
                return m.reply({ text: '❌ Sticker ini belum terdaftar di database cmd.' });
            }
            if (existing.locked) {
                return m.reply({ text: '🔒 Sticker command ini *terkunci*. Unlock dulu sebelum hapus.' });
            }

            stickerCmdStore.remove(hash);
            await m.reply({ text: `🗑 Sticker command dihapus.\nSebelumnya: \`${existing.text}\`` });
        }
            break;

        case 'listcmd': {
            if (!isOwner) return m.reply(mess.owner);

            const db = stickerCmdStore.list();
            const entries = Object.entries(db);
            if (!entries.length) {
                return m.reply({
                    text: `📂 Belum ada sticker command.\n\nCara set:\nReply sticker + \`${p}setcmd menu\``
                });
            }

            const lines = entries.map(([hash, val], i) => {
                const lock = val.locked ? '🔒' : '🔓';
                const short = hash.slice(0, 12) + '…';
                return `${i + 1}. ${lock} \`${short}\` → *${val.text}*`;
            });

            await m.reply({
                text: [
                    `🧩 *List Sticker Command* (${entries.length})`,
                    '',
                    ...lines,
                    '',
                    `• \`${p}setcmd <cmd>\` — reply sticker`,
                    `• \`${p}delcmd\` — reply sticker`,
                    `• \`${p}lockcmd\` / \`${p}unlockcmd\` — reply sticker`,
                ].join('\n')
            });
        }
            break;

        case 'lockcmd':
        case 'unlockcmd': {
            if (!isOwner) return m.reply(mess.owner);
            if (!isMain) return m.reply({ text: '❌ Fitur ini hanya bisa dipakai di *bot utama*, tidak di clone bot.' });

            const hash = stickerCmdStore.hashFromQuoted(msg);
            if (!hash) {
                return m.reply({ text: '❌ Reply *sticker* yang sudah di-setcmd!' });
            }

            const existing = stickerCmdStore.get(hash);
            if (!existing) {
                return m.reply({ text: '❌ Sticker ini belum terdaftar di database cmd.' });
            }

            const wantLock = command.name === 'lockcmd';
            existing.locked = wantLock;
            stickerCmdStore.set(hash, existing);

            await m.reply({
                text: wantLock
                    ? `🔒 Sticker command *${existing.text}* dikunci.`
                    : `🔓 Sticker command *${existing.text}* dibuka.`
            });
        }
            break;

        case 'addmsg': {
            if (!isOwner) return m.reply(mess.owner);

            const name = (command.fullArgs || '').trim().toLowerCase();
            if (!name) {
                return m.reply({
                    text: [
                        '❌ Masukkan nama pesan.',
                        '',
                        `Contoh: reply pesan + \`${p}addmsg sapaan\``,
                        `Lalu ambil dengan \`${p}getmsg sapaan\``,
                    ].join('\n')
                });
            }

            const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            if (!quotedMsg) {
                return m.reply({ text: '❌ Reply pesan yang mau disimpan ke database!' });
            }

            if (msgDbStore.get(name)) {
                return m.reply({ text: `❌ Nama *${name}* sudah terdaftar. Hapus dulu dengan \`${p}delmsg ${name}\`.` });
            }

            try {
                await m.react('⏳').catch(() => {});
                const mediaResult = await downloadMedia(quotedMsg);
                let entry = {
                    name,
                    type: 'text',
                    text: null,
                    mediaType: null,
                    mediaFile: null,
                    mimetype: '',
                    fileName: '',
                    savedBy: senderNumber,
                    savedAt: new Date().toISOString(),
                };

                if (mediaResult) {
                    const { buffer, mediaType, content } = mediaResult;
                    const mime = content?.mimetype || '';
                    const origName = content?.fileName || `${name}.${mediaType}`;
                    const ext = path.extname(origName) || ({
                        image: '.jpg', video: '.mp4', sticker: '.webp',
                        audio: '.ogg', document: '.bin',
                    })[mediaType] || '.bin';
                    const stored = `${Date.now()}_${name.replace(/[^\w\-]+/g, '_')}${ext}`;
                    fs.writeFileSync(msgDbStore.mediaPath(stored), buffer);
                    entry.type = 'media';
                    entry.mediaType = mediaType;
                    entry.mediaFile = stored;
                    entry.mimetype = mime;
                    entry.fileName = origName;
                    entry.text = quotedMsg?.imageMessage?.caption
                        || quotedMsg?.videoMessage?.caption
                        || null;
                } else {
                    const t =
                        quotedMsg.conversation ||
                        quotedMsg.extendedTextMessage?.text ||
                        null;
                    if (!t) {
                        return m.reply({ text: '❌ Pesan yang di-reply tidak punya teks/media yang bisa disimpan.' });
                    }
                    entry.type = 'text';
                    entry.text = t;
                }

                msgDbStore.set(name, entry);
                await m.reply({
                    text: [
                        `✅ Pesan *${name}* tersimpan!`,
                        '',
                        `Tipe: ${entry.type}${entry.mediaType ? ' (' + entry.mediaType + ')' : ''}`,
                        `Ambil: \`${p}getmsg ${name}\``,
                        `List: \`${p}listmsg\``,
                    ].join('\n')
                });
            } catch (err) {
                console.error('[addmsg]', err);
                await m.reply({ text: '❌ Gagal menyimpan pesan:\n' + (err?.message || String(err)) });
            }
        }
            break;

        case 'getmsg': {
            if (!isOwner) return m.reply(mess.owner);

            const name = (command.fullArgs || '').trim().toLowerCase();
            if (!name) {
                return m.reply({
                    text: `❌ Masukkan nama pesan.\nContoh: \`${p}getmsg sapaan\`\nList: \`${p}listmsg\``
                });
            }

            const entry = msgDbStore.get(name);
            if (!entry) {
                return m.reply({ text: `❌ *${name}* tidak ada di database.\nCek \`${p}listmsg\`.` });
            }

            try {
                if (entry.type === 'text') {
                    await Hanz.sendMessage(m.chat, { text: entry.text }, { quoted: msg });
                    break;
                }

                const filePath = msgDbStore.mediaPath(entry.mediaFile);
                if (!fs.existsSync(filePath)) {
                    return m.reply({ text: `❌ File media *${name}* hilang dari disk.` });
                }
                const buffer = fs.readFileSync(filePath);
                const caption = entry.text || undefined;

                if (entry.mediaType === 'image') {
                    await Hanz.sendMessage(m.chat, { image: buffer, caption }, { quoted: msg });
                } else if (entry.mediaType === 'video') {
                    await Hanz.sendMessage(m.chat, { video: buffer, caption }, { quoted: msg });
                } else if (entry.mediaType === 'sticker') {
                    await Hanz.sendMessage(m.chat, { sticker: buffer }, { quoted: msg });
                } else if (entry.mediaType === 'audio') {
                    await Hanz.sendMessage(m.chat, {
                        audio: buffer,
                        mimetype: entry.mimetype || 'audio/ogg; codecs=opus',
                    }, { quoted: msg });
                } else {
                    await Hanz.sendMessage(m.chat, {
                        document: buffer,
                        mimetype: entry.mimetype || 'application/octet-stream',
                        fileName: entry.fileName || name,
                    }, { quoted: msg });
                }
            } catch (err) {
                console.error('[getmsg]', err);
                await m.reply({ text: '❌ Gagal mengirim pesan:\n' + (err?.message || String(err)) });
            }
        }
            break;

        case 'listmsg': {
            if (!isOwner) return m.reply(mess.owner);

            const db = msgDbStore.list();
            const entries = Object.entries(db);
            if (!entries.length) {
                return m.reply({
                    text: `📂 Database pesan kosong.\n\nReply pesan + \`${p}addmsg namanya\``
                });
            }

            const lines = entries.map(([key, val], i) => {
                const kind = val.type === 'media'
                    ? `${val.mediaType || 'media'}`
                    : 'text';
                return `${i + 1}. *${key}* [${kind}]`;
            });

            await m.reply({
                text: [
                    `📋 *List Pesan Database* (${entries.length})`,
                    '',
                    ...lines,
                    '',
                    `• \`${p}getmsg <nama>\` — ambil pesan`,
                    `• \`${p}delmsg <nama>\` — hapus`,
                ].join('\n')
            });
        }
            break;

        case 'delmsg': {
            if (!isOwner) return m.reply(mess.owner);

            const name = (command.fullArgs || '').trim().toLowerCase();
            if (!name) {
                return m.reply({ text: `❌ Masukkan nama pesan.\nContoh: \`${p}delmsg sapaan\`` });
            }

            if (!msgDbStore.get(name)) {
                return m.reply({ text: `❌ *${name}* tidak ada di database.` });
            }

            msgDbStore.remove(name);
            await m.reply({ text: `🗑 Pesan *${name}* dihapus dari database.` });
        }
            break;

    }
};

module.exports = handler;