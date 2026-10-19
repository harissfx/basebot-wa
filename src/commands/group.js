const { isGroupAdmin, getGroupInfo, normJid } = require('../utils/helper');
const { generateCard } = require('../utils/welcomeCard');
const { resolveMember } = require('../utils/identity');
const config = require('../config');
const mess = require('../config').mess;
const plugins = require('../utils/PluginLoader');
const { getDevice, proto, generateWAMessageFromContent } = require('baileys');
const { downloadMedia } = require('../../lib/ffmpeg');
const { generateProfilePic } = require('../utils/profileMaker');

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

const handler = async (m) => {
    const { command, isSuperOwner, Hanz, msg, senderNumber, pushname, isOwner } = m;
    const p = m.prefix;
    const nomorUser = senderNumber;
    let metadata, mentions, text, isAdmin, mentioned, number, subject, desc, code;

    const PRIVATE_OK = new Set([
        'groupmenu',
        'joingc', 'join',
        'cekinvite', 'inspect',
        'listgc', 'listgrup',
        'creategc', 'buatgrup'
    ]);

    if (!m.isGroup && !PRIVATE_OK.has(command.name)) {
        await m.reply(mess.group);
        return;
    }

    const getMentioned = () => msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    const senderJid = m.sender;
    const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;

    const norm = normJid;
    const botIds = () => [Hanz.user?.id, Hanz.user?.lid].filter(Boolean).map(norm);
    const isBotJid = (jid) => botIds().includes(norm(jid));

    const sendRoleCard = async (type, jids) => {
        const groupMeta = await getGroupInfo(Hanz, m.chat);
        const memberCount = groupMeta?.participants?.length || null;

        for (const jid of jids) {
            try {
                const { phoneJid, name } = await resolveMember(Hanz, m.chat, jid);
                const number = norm(phoneJid);

                const imageBuffer = await generateCard({
                    Hanz,
                    jid: phoneJid,
                    groupJid: m.chat,
                    type,
                    name,
                    memberCount,
                });

                await m.sendInteractiveWithImage({
                    text: type === 'promote'
                        ? `🎉 @${number} sekarang jadi admin grup!`
                        : `📉 @${number} bukan admin grup lagi.`,
                    footer: config.footerTxt || config.botName || '',
                    imageSource: imageBuffer,
                    quoted: m.fakePay,
                    contextInfo: {
                        mentionedJid: [phoneJid],
                        forwardingScore: 999,
                        isForwarded: true,
                    },
                    buttons: [
                        {
                            name: 'quick_reply',
                            buttonParamsJson: JSON.stringify({
                                display_text: type === 'promote' ? 'Terimakasih Admin! 🙌' : 'Siap, dicatat 👍',
                                id: type === 'promote' ? 'promotecik' : 'demotecik',
                            }),
                        },
                    ],
                });
            } catch {
            }
        }
    };

    const resolveToggleState = (current, arg) => {
        const a = arg?.toLowerCase();
        if (a === 'on') return true;
        if (a === 'off') return false;
        return !current;
    };

    const isBotAdmin = async (groupJid = m.chat) => {
        const meta = await getGroupInfo(Hanz, groupJid);
        if (!meta) return false;
        const bot = meta.participants.find((p) => {
            const pIds = [p.id, p.lid, p.jid].filter(Boolean).map(norm);
            return pIds.some((id) => botIds().includes(id));
        });

        return bot?.admin === 'admin' || bot?.admin === 'superadmin';
    };

    const parseInviteCode = (raw) => {
        if (!raw) return null;
        const s = String(raw).trim();
        const m = s.match(/(?:chat\.whatsapp\.com\/)?([A-Za-z0-9_-]{10,})/);
        return m ? m[1] : null;
    };

    switch (command.name) {
        case 'groupmenu':
            const device = getDevice(msg.key.id);
            const groupCmds = (plugins.commandsByFile()['group'] || [])
            .filter(cmd => !['groupmenu'].includes(cmd));
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
│「 𝗚𝗥𝗢𝗨𝗣 𝗠𝗘𝗡𝗨 」
│
${groupCmds.map(cmd => `│⪩ \`${p}${cmd}\``).join('\n')}
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
        case 'tagall':
            isAdmin = await isGroupAdmin(Hanz, m.chat, senderJid);
            if (!isAdmin && !isOwner) return m.reply(mess.admin);
            metadata = await getGroupInfo(Hanz, m.chat);
            if (!metadata) return m.reply({ text: '❌ Gagal mendapatkan info grup.' });
            mentions = metadata.participants.map(p => p.id);
            text = `📢 *Tag All Members*\n\n` + metadata.participants.map((p, i) => `${i + 1}. @${p.id.split('@')[0]}`).join('\n');
            await Hanz.sendMessage(m.chat, { text, mentions });
            break;
        case 'hidetag':
            isAdmin = await isGroupAdmin(Hanz, m.chat, senderJid);
            if (!isAdmin && !isOwner) return m.reply(mess.admin);
            metadata = await getGroupInfo(Hanz, m.chat);
            if (!metadata) return;
            await Hanz.sendMessage(m.chat, {
                text: command.fullArgs || '👀',
                mentions: metadata.participants.map(p => p.id)
            });
            break;
        case 'groupinfo':
            metadata = await getGroupInfo(Hanz, m.chat);
            if (!metadata) return m.reply({ text: '❌ Gagal mendapatkan info grup.' });
            await m.reply({
                text: [
                    '╔═══ *Group Info* ═══╗',
                    `║ 📛 *Nama:* ${metadata.subject}`,
                    `║ 📝 *Deskripsi:* ${metadata.desc || 'Tidak ada'}`,
                    `║ 👥 *Member:* ${metadata.participants.length}`,
                    `║ 🔒 *Restrict:* ${metadata.restrict ? 'Ya' : 'Tidak'}`,
                    `║ 🔔 *Announce:* ${metadata.announce ? 'Hanya admin' : 'Semua member'}`,
                    `║ 🆔 *ID:* ${metadata.id}`,
                    '╚════════════════════╝'
                ].join('\n')
            });
            break;
        case 'kick':
            isAdmin = await isGroupAdmin(Hanz, m.chat, senderJid);
            if (!isAdmin && !isOwner) return m.reply(mess.admin);
            if (!await isBotAdmin()) return m.reply(mess.botAdmin);
            mentioned = getMentioned();
            if (!mentioned.length) return m.reply({ text: '❌ Tag member yang ingin dikick.\nContoh: ' + m.prefix + 'kick @user' });
            const superOwnerNumbers = [].concat(config.superOwner).map(n => n.replace(/\D/g, ''));
            const bIds = botIds();
            const targetsToKick = mentioned.filter(j => {
                const jNorm = norm(j);
                const isBot = bIds.includes(jNorm);
                const isSuper = superOwnerNumbers.includes(jNorm);
                return !isBot && !isSuper;
            });
            if (!targetsToKick.length) return m.reply({ text: '❌ Tidak dapat mengeluarkan Bot atau Super Owner.' });
            try {
                await Hanz.groupParticipantsUpdate(m.chat, targetsToKick, 'remove');
                await m.reply({ text: `✅ Berhasil mengeluarkan ${targetsToKick.length} member.` });
            } catch {
                await m.reply({ text: '❌ Gagal mengeluarkan member.' });
            }
            break;
        case 'add':
            isAdmin = await isGroupAdmin(Hanz, m.chat, senderJid);
            if (!isAdmin) return m.reply(mess.admin);
            number = command.args[0];
            if (!number) return m.reply({ text: '❌ Masukkan nomor.\nContoh: ' + m.prefix + 'add 6212345xxxxx' });
            if (!await isBotAdmin()) return m.reply(mess.botAdmin);
            try {
                await Hanz.groupParticipantsUpdate(m.chat, [number.replace(/\D/g, '') + '@s.whatsapp.net'], 'add');
                await m.reply({ text: `✅ Berhasil menambahkan ${number} ke grup.` });
            } catch {
                await m.reply({ text: '❌ Gagal. Pastikan nomor valid dan bot adalah admin.' });
            }
            break;
        case 'promote':
            isAdmin = await isGroupAdmin(Hanz, m.chat, senderJid);
            if (!isAdmin) return m.reply(mess.admin);
            if (!await isBotAdmin()) return m.reply(mess.botAdmin);
            mentioned = getMentioned();
            if (!mentioned.length) return m.reply({ text: '❌ Tag member yang ingin dipromote.\nContoh: ' + m.prefix + 'promote @user' });
            try {
                const result = await Hanz.groupParticipantsUpdate(m.chat, mentioned, 'promote');
                const successJids = result.filter(r => r.status === '200').map(r => r.jid);
                const success = successJids.length;
                if (success === 0) {
                    await m.reply({ text: '❌ Gagal promote member.' });
                } else if (success < mentioned.length) {
                    await m.reply({ text: `⚠️ Berhasil promote ${success} dari ${mentioned.length} member.` });
                } else {
                    await m.reply({ text: `✅ Berhasil promote ${success} member.` });
                }
                if (success > 0 && global.promoteCardGroups?.get(m.chat)) {
                    await sendRoleCard('promote', successJids);
                }
            } catch {
                await m.reply({ text: '❌ Gagal promote member.' });
            }
            break;
        case 'demote':
            isAdmin = await isGroupAdmin(Hanz, m.chat, senderJid);
            if (!isAdmin) return m.reply(mess.admin);
            if (!await isBotAdmin()) return m.reply(mess.botAdmin);
            mentioned = getMentioned();
            if (!mentioned.length) return m.reply({ text: '❌ Tag admin yang ingin didemote.\nContoh: ' + m.prefix + 'demote @admin' });
            if (mentioned.some(isBotJid)) {
                return m.reply({ text: '❌ Bot tidak bisa demote dirinya sendiri.' });
            }
            try {
                const result = await Hanz.groupParticipantsUpdate(m.chat, mentioned, 'demote');
                const successJids = result.filter(r => r.status === '200').map(r => r.jid);
                const success = successJids.length;
                if (success === 0) {
                    await m.reply({ text: '❌ Gagal demote admin.' });
                } else if (success < mentioned.length) {
                    await m.reply({ text: `⚠️ Berhasil demote ${success} dari ${mentioned.length} admin.` });
                } else {
                    await m.reply({ text: `✅ Berhasil demote ${success} admin.` });
                }
                if (success > 0 && global.demoteCardGroups?.get(m.chat)) {
                    await sendRoleCard('demote', successJids);
                }
            } catch {
                await m.reply({ text: '❌ Gagal demote admin.' });
            }
            break;
        case 'setsubject':
            isAdmin = await isGroupAdmin(Hanz, m.chat, senderJid);
            if (!isAdmin) return m.reply(mess.admin);
            if (!await isBotAdmin()) return m.reply(mess.botAdmin);
            subject = command.fullArgs;
            if (!subject) return m.reply({ text: '❌ Masukkan nama grup baru.\nContoh: ' + m.prefix + 'setsubject Nama Grup Baru' });
            try {
                await Hanz.groupUpdateSubject(m.chat, subject);
                await m.reply({ text: `✅ Nama grup diubah ke: ${subject}` });
            } catch {
                await m.reply({ text: '❌ Gagal mengubah nama grup.' });
            }
            break;
        case 'setdesc':
            isAdmin = await isGroupAdmin(Hanz, m.chat, senderJid);
            if (!isAdmin) return m.reply(mess.admin);
            if (!await isBotAdmin()) return m.reply(mess.botAdmin);
            desc = command.fullArgs;
            if (!desc) return m.reply({ text: '❌ Masukkan deskripsi baru.\nContoh: ' + m.prefix + 'setdesc Deskripsi grup' });
            try {
                await Hanz.groupUpdateDescription(m.chat, desc);
                await m.reply({ text: '✅ Deskripsi grup berhasil diubah.' });
            } catch {
                await m.reply({ text: '❌ Gagal mengubah deskripsi grup.' });
            }
            break;
        case 'setppgroup':
        case 'setppgrup':
        case 'setppgc': {
            isAdmin = await isGroupAdmin(Hanz, m.chat, senderJid);
            if (!isAdmin) return m.reply(mess.admin);
            if (!await isBotAdmin()) return m.reply(mess.botAdmin);

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
                        xmlns: 'w:profile:picture',
                        target: m.chat
                    },
                    content: [{
                        tag: 'picture',
                        attrs: { type: 'image' },
                        content: imgBuffer
                    }]
                });

                await m.reply({
                    text: isFull
                        ? '✅ Foto profil grup berhasil diubah (mode FULL tanpa padding).'
                        : '✅ Foto profil grup berhasil diubah.'
                });
            } catch (e) {
                console.error('[setppgc ERROR]', e?.message || e);
                await m.reply({
                    text: `❌ Gagal ganti foto profil grup.\nAlasan: ${e?.message || 'unknown error'}`
                });
            }
        }
            break;
        case 'setppgcfuck': {
            isAdmin = await isGroupAdmin(Hanz, m.chat, senderJid);
            if (!isAdmin) return m.reply(mess.admin);
            if (!await isBotAdmin()) return m.reply(mess.botAdmin);

            await m.react('⏳');

            try {
                let ppUrl;
                try {
                    ppUrl = await Hanz.profilePictureUrl(m.chat, 'image');
                } catch {
                    return m.reply({ text: '❌ Grup ini belum punya foto profil, gak ada yang bisa diambil.' });
                }

                const axios = require('axios');
                const { data } = await axios.get(ppUrl, { responseType: 'arraybuffer', timeout: 15000 });
                const currentPpBuffer = Buffer.from(data);
                const composedBuffer = await generateProfilePic(currentPpBuffer);
                const sharp = require('sharp');
                const finalBuffer = await sharp(composedBuffer)
                    .resize(720, 720, {
                        fit: 'inside',
                        withoutEnlargement: false
                    })
                    .jpeg({ quality: 92 })
                    .toBuffer();
                await Hanz.query({
                    tag: 'iq',
                    attrs: {
                        to: 's.whatsapp.net',
                        type: 'set',
                        xmlns: 'w:profile:picture',
                        target: m.chat
                    },
                    content: [{
                        tag: 'picture',
                        attrs: { type: 'image' },
                        content: finalBuffer
                    }]
                });

                await m.reply({
                    text: '✅ PP grup lama berhasil ditempel ke bahanprofile.jpeg dan dipasang ulang (mode FULL).'
                });
            } catch (e) {
                console.error('[setppgcfuck ERROR]', e?.message || e);
                await m.reply({
                    text: `❌ Gagal proses PP grup.\nAlasan: ${e?.message || 'unknown error'}`
                });
            }
        }
            break;
        case 'revoke':
            isAdmin = await isGroupAdmin(Hanz, m.chat, senderJid);
            if (!isAdmin) return m.reply(mess.admin);
            if (!await isBotAdmin()) return m.reply(mess.botAdmin);
            try {
                await Hanz.groupRevokeInvite(m.chat);
                await m.reply({ text: '✅ Link invite grup berhasil direvoke.' });
            } catch {
                await m.reply({ text: '❌ Gagal revoke link invite.' });
            }
            break;

        case 'link':
        case 'linkgroup':
        case 'linkgc':
            try {
                code = await Hanz.groupInviteCode(m.chat);
                await m.reply({ text: `🔗 Link Invite Grup:\nhttps://chat.whatsapp.com/${code}` });
            } catch {
                await m.reply({ text: '❌ Gagal mendapatkan link invite.' });
            }
            break;

        case 'group':
        case 'grup': {
            isAdmin = await isGroupAdmin(Hanz, m.chat, senderJid);
            if (!isAdmin) return m.reply(mess.admin);
            if (!await isBotAdmin()) return m.reply(mess.botAdmin);

            const arg = command.args?.[0]?.toLowerCase();
            if (arg === 'close') {
                try {
                    await Hanz.groupSettingUpdate(m.chat, 'announcement');
                    await m.reply({ text: '✅ Sukses menutup grup (hanya admin yang bisa kirim pesan).' });
                } catch {
                    await m.reply({ text: '❌ Gagal menutup grup.' });
                }
            } else if (arg === 'open') {
                try {
                    await Hanz.groupSettingUpdate(m.chat, 'not_announcement');
                    await m.reply({ text: '✅ Sukses membuka grup (semua member bisa kirim pesan).' });
                } catch {
                    await m.reply({ text: '❌ Gagal membuka grup.' });
                }
            } else {
                await m.sendInteractive({
                    text: 'Pilih mode grup:',
                    footer: config.footerTxt,
                    quoted: m.fakePay,
                    buttons: [
                        { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '🔓 Open', id: 'group open' }) },
                        { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '🔒 Close', id: 'group close' }) },
                    ]
                });
            }
        }
            break;

        case 'editinfo': {
            isAdmin = await isGroupAdmin(Hanz, m.chat, senderJid);
            if (!isAdmin) return m.reply(mess.admin);
            if (!await isBotAdmin()) return m.reply(mess.botAdmin);

            const arg = command.args?.[0]?.toLowerCase();
            if (arg === 'open') {
                try {
                    await Hanz.groupSettingUpdate(m.chat, 'unlocked');
                    await m.reply({ text: '✅ Sukses membuka edit info grup (semua member bisa edit nama/deskripsi/foto).' });
                } catch {
                    await m.reply({ text: '❌ Gagal membuka edit info grup.' });
                }
            } else if (arg === 'close') {
                try {
                    await Hanz.groupSettingUpdate(m.chat, 'locked');
                    await m.reply({ text: '✅ Sukses menutup edit info grup (hanya admin yang bisa edit).' });
                } catch {
                    await m.reply({ text: '❌ Gagal menutup edit info grup.' });
                }
            } else {
                await m.sendInteractive({
                    text: 'Pilih mode edit info grup:',
                    footer: config.footerTxt,
                    quoted: m.fakePay,
                    buttons: [
                        { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '🔓 Open', id: 'editinfo open' }) },
                        { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '🔒 Close', id: 'editinfo close' }) },
                    ]
                });
            }
        }
            break;

        case 'welcome': {
            if (!m.isGroup) return m.reply(mess.group);
            const isAdmin = await isGroupAdmin(Hanz, m.chat, senderJid);
            if (!isAdmin && !isOwner) return m.reply(mess.admin);

            global.welcomeGroups = global.welcomeGroups || new Map();
            const current = global.welcomeGroups.get(m.chat) || false;
            const next = resolveToggleState(current, command.args?.[0]);
            global.welcomeGroups.set(m.chat, next);
            global.saveGroupSettings?.();

            await m.reply({
                text: `Fitur *Welcome* sekarang: *${next ? 'ON' : 'OFF'}*`
            });
        }
            break;

        case 'goodbye': {
            if (!m.isGroup) return m.reply(mess.group);
            const isAdmin = await isGroupAdmin(Hanz, m.chat, senderJid);
            if (!isAdmin && !isOwner) return m.reply(mess.admin);

            global.goodbyeGroups = global.goodbyeGroups || new Map();
            const current = global.goodbyeGroups.get(m.chat) || false;
            const next = resolveToggleState(current, command.args?.[0]);
            global.goodbyeGroups.set(m.chat, next);
            global.saveGroupSettings?.();

            await m.reply({
                text: `Fitur *Goodbye* sekarang: *${next ? 'ON' : 'OFF'}*`
            });
        }
            break;

        case 'promotewelcome': {
            if (!m.isGroup) return m.reply(mess.group);
            const isAdmin = await isGroupAdmin(Hanz, m.chat, senderJid);
            if (!isAdmin && !isOwner) return m.reply(mess.admin);

            global.promoteCardGroups = global.promoteCardGroups || new Map();
            const current = global.promoteCardGroups.get(m.chat) || false;
            const next = resolveToggleState(current, command.args?.[0]);
            global.promoteCardGroups.set(m.chat, next);
            global.saveGroupSettings?.();

            await m.reply({
                text: `Fitur *Kartu Promote* sekarang: *${next ? 'ON' : 'OFF'}*`
            });
        }
            break;

        case 'demotewelcome': {
            if (!m.isGroup) return m.reply(mess.group);
            const isAdmin = await isGroupAdmin(Hanz, m.chat, senderJid);
            if (!isAdmin && !isOwner) return m.reply(mess.admin);

            global.demoteCardGroups = global.demoteCardGroups || new Map();
            const current = global.demoteCardGroups.get(m.chat) || false;
            const next = resolveToggleState(current, command.args?.[0]);
            global.demoteCardGroups.set(m.chat, next);
            global.saveGroupSettings?.();

            await m.reply({
                text: `Fitur *Kartu Demote* sekarang: *${next ? 'ON' : 'OFF'}*`
            });
        }
            break;

        case 'antilink': {
            if (!m.isGroup) return m.reply(mess.group);
            const isAdmin = await isGroupAdmin(Hanz, m.chat, senderJid);
            if (!isAdmin && !isOwner) return m.reply(mess.admin);

            global.antilinkGroups = global.antilinkGroups || new Map();
            const current = global.antilinkGroups.get(m.chat) || false;
            const next = resolveToggleState(current, command.args?.[0]);
            global.antilinkGroups.set(m.chat, next);
            global.saveGroupSettings?.();

            await m.reply({
                text: `Fitur *Antilink* sekarang: *${next ? 'ON' : 'OFF'}*\n${next ? 'Pesan yang mengandung link akan otomatis dihapus (kecuali owner & admin).' : ''}`
            });
        }
            break;

        case 'setgroup':
        case 'setgc': {
            if (!m.isGroup) return m.reply(mess.group);
            const isAdmin = await isGroupAdmin(Hanz, m.chat, senderJid);
            if (!isAdmin && !isOwner) return m.reply(mess.admin);

            const curWelcome = global.welcomeGroups?.get(m.chat) || false;
            const curGoodbye = global.goodbyeGroups?.get(m.chat) || false;
            const curPromote = global.promoteCardGroups?.get(m.chat) || false;
            const curDemote = global.demoteCardGroups?.get(m.chat) || false;
            const curAntilink = global.antilinkGroups?.get(m.chat) || false;
            const groupMeta = await getGroupInfo(Hanz, m.chat);
            const curAddMode = groupMeta?.memberAddMode === 'admin_add' ? 'admin' : 'all';
            const curClosed = !!groupMeta?.announce;
            const curLocked = !!groupMeta?.restrict;
            const curEphemeral = groupMeta?.ephemeralDuration || 0;
            const ephemeralLabel = {
                0: 'OFF',
                86400: '24 Jam',
                604800: '7 Hari',
                7776000: '90 Hari'
            }[curEphemeral] || `${curEphemeral}s`;
            const mark = (on) => (on ? '✅' : '▫️');

            const contentText =
                `*⚙️ Pengaturan Grup*\n\n` +
                `• Welcome: *${curWelcome ? 'ON' : 'OFF'}*\n` +
                `• Goodbye: *${curGoodbye ? 'ON' : 'OFF'}*\n` +
                `• Kartu Promote: *${curPromote ? 'ON' : 'OFF'}*\n` +
                `• Kartu Demote: *${curDemote ? 'ON' : 'OFF'}*\n` +
                `• Antilink: *${curAntilink ? 'ON' : 'OFF'}*\n` +
                `• Add Member: *${curAddMode === 'admin' ? 'ADMIN ONLY' : 'ALL MEMBERS'}*\n` +
                `• Grup: *${curClosed ? 'TUTUP (admin only)' : 'BUKA (semua member)'}*\n` +
                `• Edit Info: *${curLocked ? 'DIKUNCI (admin only)' : 'TERBUKA (semua member)'}*\n` +
                `• Ephemeral: *${ephemeralLabel}*\n\n` +
                `Pilih pengaturan di list di bawah 👇`;

            const toggleSection = (title, cmdName, isOn, descOn, descOff) => ({
                name: 'single_select',
                buttonParamsJson: JSON.stringify({
                    title,
                    sections: [{
                        title,
                        rows: [
                            { id: `${p}${cmdName} on`, title: `${mark(isOn)} ON`, description: descOn || '' },
                            { id: `${p}${cmdName} off`, title: `${mark(!isOn)} OFF`, description: descOff || '' },
                        ]
                    }],
                    has_multiple_buttons: true
                })
            });

            const footerText = config.footerTxt || config.botName || '';

            const interactiveMsg = proto.Message.InteractiveMessage.fromObject({
                body: { text: contentText },
                footer: { text: footerText },
                header: {
                    title: config.botName,
                    subtitle: 'Group Settings',
                    hasMediaAttachment: false
                },
                nativeFlowMessage: {
                    messageParamsJson: JSON.stringify({
                        bottom_sheet: {
                            in_thread_buttons_limit: 1,
                            divider_indices: [1, 2, 3, 4, 5, 6, 7, 8, 999],
                            list_title: config.botName,
                            button_icon: 'REVIEW',
                            button_title: 'Buka Pengaturan'
                        }
                    }),
                    buttons: [
                        toggleSection('👋 Welcome', 'welcome', curWelcome,
                            'Kirim kartu selamat datang ke member baru', 'Matikan kartu welcome'),
                        toggleSection('👋 Goodbye', 'goodbye', curGoodbye,
                            'Kirim pesan saat member keluar', 'Matikan pesan goodbye'),
                        toggleSection('🎉 Kartu Promote', 'promotewelcome', curPromote,
                            'Kirim kartu saat member dijadikan admin', 'Matikan kartu promote'),
                        toggleSection('📉 Kartu Demote', 'demotewelcome', curDemote,
                            'Kirim kartu saat admin diturunkan', 'Matikan kartu demote'),
                        toggleSection('🔗 Antilink', 'antilink', curAntilink,
                            'Hapus otomatis pesan berisi link', 'Izinkan pesan berisi link'),
                        {
                            name: 'single_select',
                            buttonParamsJson: JSON.stringify({
                                title: '👤 Add Member Mode',
                                sections: [{
                                    title: '👤 Add Member Mode',
                                    rows: [
                                        { id: `${p}addmode admin`, title: `${mark(curAddMode === 'admin')} Admin Only`, description: 'Hanya admin yang boleh add member' },
                                        { id: `${p}addmode all`, title: `${mark(curAddMode === 'all')} All Members`, description: 'Semua member boleh add member' },
                                    ]
                                }],
                                has_multiple_buttons: true
                            })
                        },
                        {
                            name: 'single_select',
                            buttonParamsJson: JSON.stringify({
                                title: '🔓 Buka/Tutup Grup',
                                sections: [{
                                    title: '🔓 Buka/Tutup Grup',
                                    rows: [
                                        { id: `${p}group open`, title: `${mark(!curClosed)} Buka`, description: 'Semua member bisa kirim pesan' },
                                        { id: `${p}group close`, title: `${mark(curClosed)} Tutup`, description: 'Hanya admin yang bisa kirim pesan' },
                                    ]
                                }],
                                has_multiple_buttons: true
                            })
                        },
                        {
                            name: 'single_select',
                            buttonParamsJson: JSON.stringify({
                                title: '✏️ Edit Info Grup',
                                sections: [{
                                    title: '✏️ Edit Info Grup',
                                    rows: [
                                        { id: `${p}editinfo open`, title: `${mark(!curLocked)} Buka`, description: 'Semua member bisa edit nama/deskripsi/foto' },
                                        { id: `${p}editinfo close`, title: `${mark(curLocked)} Kunci`, description: 'Hanya admin yang bisa edit info grup' },
                                    ]
                                }],
                                has_multiple_buttons: true
                            })
                        },
                        {
                            name: 'single_select',
                            buttonParamsJson: JSON.stringify({
                                title: '⏱ Ephemeral',
                                sections: [{
                                    title: '⏱ Pesan Sekali Lihat',
                                    rows: [
                                        { id: `${p}ephemeral off`, title: `${mark(curEphemeral === 0)} Off`, description: 'Matikan pesan sementara' },
                                        { id: `${p}ephemeral 24h`, title: `${mark(curEphemeral === 86400)} 24 Jam`, description: 'Pesan hilang setelah 24 jam' },
                                        { id: `${p}ephemeral 7d`, title: `${mark(curEphemeral === 604800)} 7 Hari`, description: 'Pesan hilang setelah 7 hari' },
                                        { id: `${p}ephemeral 90d`, title: `${mark(curEphemeral === 7776000)} 90 Hari`, description: 'Pesan hilang setelah 90 hari' },
                                    ]
                                }],
                                has_multiple_buttons: true
                            })
                        },
                    ]
                },
                contextInfo: {
                    mentionedJid: ['0@s.whatsapp.net'],
                    forwardingScore: 111,
                    isForwarded: true,
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
                { userJid: Hanz.user?.id, quoted: m.fakePay }
            );

            const additionalNodes = buildInteractiveNodes('mixed');
            if (!m.isGroup) {
                additionalNodes.push({ tag: 'bot', attrs: { biz_bot: '1' } });
            }

            await Hanz.relayMessage(m.chat, waMsg.message, {
                messageId: waMsg.key.id,
                additionalNodes
            });
        }
            break;

        case 'leave':
        case 'keluar': {
            if (!m.isGroup) return m.reply(mess.group);
            isAdmin = await isGroupAdmin(Hanz, m.chat, senderJid);
            if (!isAdmin && !isOwner) return m.reply(mess.admin);
            try {
                await m.reply({ text: '👋 Bot akan keluar dari grup ini...' });
                await Hanz.groupLeave(m.chat);
            } catch (err) {
                await m.reply({ text: '❌ Gagal keluar dari grup:\n' + (err?.message || String(err)) });
            }
        }
            break;

        case 'joingc':
        case 'join': {
            if (!isOwner) return m.reply(mess.owner);
            const raw = command.args?.[0] || command.fullArgs?.trim();
            const inviteCode = parseInviteCode(raw);
            if (!inviteCode) {
                return m.reply({
                    text: `❌ Masukkan kode / link invite.\nContoh:\n${p}joingc AbcDefGhIjK\n${p}joingc https://chat.whatsapp.com/AbcDefGhIjK`
                });
            }
            try {
                await m.reply({ text: '⏳ Menggabung ke grup...' });
                const gid = await Hanz.groupAcceptInvite(inviteCode);
                await m.reply({ text: `✅ Berhasil join grup.\n🆔 ID: ${gid || '(tidak diketahui)'}` });
            } catch (err) {
                await m.reply({ text: '❌ Gagal join grup:\n' + (err?.message || String(err)) });
            }
        }
            break;

        case 'cekinvite':
        case 'inspect': {
            if (!isOwner) {
                if (m.isGroup) {
                    isAdmin = await isGroupAdmin(Hanz, m.chat, senderJid);
                    if (!isAdmin) return m.reply(mess.ownerOrAdmin);
                } else {
                    return m.reply(mess.owner);
                }
            }
            const rawInspect = command.args?.[0] || command.fullArgs?.trim();
            const codeInspect = parseInviteCode(rawInspect);
            if (!codeInspect) {
                return m.reply({
                    text: `❌ Masukkan kode / link invite.\nContoh: ${p}cekinvite https://chat.whatsapp.com/AbcDefGhIjK`
                });
            }
            try {
                const info = await Hanz.groupGetInviteInfo(codeInspect);
                const created = info.creation
                    ? new Date(info.creation * 1000).toLocaleString('id-ID')
                    : '-';
                const lines = [
                    '╔═══ *Invite Info* ═══╗',
                    `║ 📛 *Nama:* ${info.subject || '-'}`,
                    `║ 📝 *Deskripsi:* ${info.desc || 'Tidak ada'}`,
                    `║ 👥 *Member:* ${info.size ?? info.participants?.length ?? '-'}`,
                    `║ 🆔 *ID:* ${info.id || '-'}`,
                    `║ 👤 *Owner:* ${info.owner ? '@' + info.owner.split('@')[0] : '-'}`,
                    `║ 📅 *Dibuat:* ${created}`,
                    `║ 🔒 *Restrict:* ${info.restrict ? 'Ya' : 'Tidak'}`,
                    `║ 🔔 *Announce:* ${info.announce ? 'Hanya admin' : 'Semua'}`,
                    '╚════════════════════╝'
                ];
                await m.reply({
                    text: lines.join('\n'),
                    mentions: info.owner ? [info.owner] : undefined
                });
            } catch (err) {
                await m.reply({ text: '❌ Gagal ambil info invite:\n' + (err?.message || String(err)) });
            }
        }
            break;

        case 'listrequest':
        case 'listreq': {
            if (!m.isGroup) return m.reply(mess.group);
            isAdmin = await isGroupAdmin(Hanz, m.chat, senderJid);
            if (!isAdmin && !isOwner) return m.reply(mess.admin);
            if (!await isBotAdmin()) return m.reply(mess.botAdmin);
            try {
                const list = await Hanz.groupRequestParticipantsList(m.chat);
                if (!list || !list.length) {
                    return m.reply({ text: '✅ Tidak ada permintaan join yang pending.' });
                }
                const lines = list.map((u, i) => {
                    const jid = u.jid || u.id || u;
                    return `${i + 1}. @${String(jid).split('@')[0]}`;
                });
                await m.reply({
                    text: `📋 *Pending Join Request* (${list.length})\n\n${lines.join('\n')}\n\nApprove: ${p}approve @user\nReject: ${p}reject @user`,
                    mentions: list.map(u => u.jid || u.id || u).filter(Boolean)
                });
            } catch (err) {
                await m.reply({ text: '❌ Gagal ambil list request:\n' + (err?.message || String(err)) });
            }
        }
            break;

        case 'approve': {
            if (!m.isGroup) return m.reply(mess.group);
            isAdmin = await isGroupAdmin(Hanz, m.chat, senderJid);
            if (!isAdmin && !isOwner) return m.reply(mess.admin);
            if (!await isBotAdmin()) return m.reply(mess.botAdmin);
            mentioned = getMentioned();
            if (!mentioned.length && command.args?.[0]) {
                const n = command.args[0].replace(/\D/g, '');
                if (n) mentioned = [n + '@s.whatsapp.net'];
            }
            if (!mentioned.length) {
                return m.reply({ text: `❌ Tag user / masukkan nomor.\nContoh: ${p}approve @user` });
            }
            try {
                const res = await Hanz.groupRequestParticipantsUpdate(m.chat, mentioned, 'approve');
                await m.reply({ text: `✅ Approve ${mentioned.length} request.\n${JSON.stringify(res || {}, null, 0).slice(0, 200)}` });
            } catch (err) {
                await m.reply({ text: '❌ Gagal approve:\n' + (err?.message || String(err)) });
            }
        }
            break;

        case 'reject': {
            if (!m.isGroup) return m.reply(mess.group);
            isAdmin = await isGroupAdmin(Hanz, m.chat, senderJid);
            if (!isAdmin && !isOwner) return m.reply(mess.admin);
            if (!await isBotAdmin()) return m.reply(mess.botAdmin);
            mentioned = getMentioned();
            if (!mentioned.length && command.args?.[0]) {
                const n = command.args[0].replace(/\D/g, '');
                if (n) mentioned = [n + '@s.whatsapp.net'];
            }
            if (!mentioned.length) {
                return m.reply({ text: `❌ Tag user / masukkan nomor.\nContoh: ${p}reject @user` });
            }
            try {
                const res = await Hanz.groupRequestParticipantsUpdate(m.chat, mentioned, 'reject');
                await m.reply({ text: `✅ Reject ${mentioned.length} request.` });
            } catch (err) {
                await m.reply({ text: '❌ Gagal reject:\n' + (err?.message || String(err)) });
            }
        }
            break;

        case 'ephemeral':
        case 'disappear': {
            if (!m.isGroup) return m.reply(mess.group);
            isAdmin = await isGroupAdmin(Hanz, m.chat, senderJid);
            if (!isAdmin && !isOwner) return m.reply(mess.admin);
            if (!await isBotAdmin()) return m.reply(mess.botAdmin);

            const argEph = (command.args?.[0] || '').toLowerCase();
            const mapEph = {
                'off': 0, '0': 0, 'remove': 0, 'mati': 0,
                '24h': 86400, '24': 86400, '1d': 86400,
                '7d': 604800, '7': 604800,
                '90d': 7776000, '90': 7776000
            };

            if (!argEph || !(argEph in mapEph)) {
                return m.reply({
                    text:
`⏱ *Ephemeral / Disappearing Messages*

Pilih durasi:
• ${p}ephemeral off  — matikan
• ${p}ephemeral 24h  — 24 jam
• ${p}ephemeral 7d   — 7 hari
• ${p}ephemeral 90d  — 90 hari`
                });
            }

            try {
                const seconds = mapEph[argEph];
                await Hanz.groupToggleEphemeral(m.chat, seconds);
                const label = seconds === 0 ? 'OFF' : argEph;
                await m.reply({ text: `✅ Ephemeral diatur ke: *${label}*` });
            } catch (err) {
                await m.reply({ text: '❌ Gagal set ephemeral:\n' + (err?.message || String(err)) });
            }
        }
            break;

        case 'addmode': {
            if (!m.isGroup) return m.reply(mess.group);
            isAdmin = await isGroupAdmin(Hanz, m.chat, senderJid);
            if (!isAdmin && !isOwner) return m.reply(mess.admin);
            if (!await isBotAdmin()) return m.reply(mess.botAdmin);

            const argMode = (command.args?.[0] || '').toLowerCase();
            if (argMode !== 'admin' && argMode !== 'all' && argMode !== 'member') {
                return m.reply({
                    text:
`👤 *Member Add Mode*

• ${p}addmode admin  — hanya admin yang boleh add
• ${p}addmode all    — semua member boleh add`
                });
            }

            try {
                const mode = (argMode === 'admin') ? 'admin_add' : 'all_member_add';
                await Hanz.groupMemberAddMode(m.chat, mode);
                await m.reply({
                    text: mode === 'admin_add'
                        ? '✅ Hanya *admin* yang boleh menambahkan member.'
                        : '✅ *Semua member* boleh menambahkan member.'
                });
            } catch (err) {
                await m.reply({ text: '❌ Gagal set add mode:\n' + (err?.message || String(err)) });
            }
        }
            break;

        case 'listgc':
        case 'listgrup': {
            if (!isOwner) return m.reply(mess.owner);
            try {
                await m.reply({ text: '⏳ Mengambil daftar grup...' });
                const all = await Hanz.groupFetchAllParticipating();
                const groups = Object.values(all || {});
                if (!groups.length) {
                    return m.reply({ text: '📭 Bot belum bergabung di grup mana pun.' });
                }
                groups.sort((a, b) => String(a.subject || '').localeCompare(String(b.subject || '')));
                const lines = groups.map((g, i) => {
                    const count = g.participants?.length ?? '?';
                    return `${i + 1}. *${g.subject || '(tanpa nama)'}*\n   👥 ${count} · \`${g.id}\``;
                });
                const chunk = lines.slice(0, 40).join('\n\n');
                const extra = groups.length > 40 ? `\n\n...dan ${groups.length - 40} grup lainnya.` : '';
                await m.reply({
                    text: `📋 *Daftar Grup Bot* (${groups.length})\n\n${chunk}${extra}`
                });
            } catch (err) {
                await m.reply({ text: '❌ Gagal ambil list grup:\n' + (err?.message || String(err)) });
            }
        }
            break;
        case 'upstorygc':
        case 'gstatus':
        case 'storygc':
        case 'groupstory': {
            isAdmin = await isGroupAdmin(Hanz, m.chat, senderJid);
            if (!isAdmin && !isOwner) {
                return m.reply(mess.admin);
            }

            const caption = (command.fullArgs || '').trim();
            const srcMsg = quotedMsg || msg.message;

            try {
                await m.react('⏳').catch(() => {});
                const sendGroupStatus = async (content) => {
                    try {
                        await Hanz.sendMessage(m.chat, {
                            ...content,
                            groupStatus: true
                        });
                        return true;
                    } catch {}
                    try {
                        const type = content.image ? 'IMAGE' : content.video ? 'VIDEO' : content.audio ? 'AUDIO' : 'TEXT';
                        await Hanz.sendMessage(m.chat, {
                            ...content,
                            contextInfo: {
                                isGroupStatus: true,
                                statusSourceType: type,
                                statusAttributions: [{ type: 10 }],
                                statusAudienceMetadata: { audienceType: 'CLOSE_FRIENDS' }
                            }
                        });
                        return true;
                    } catch {}
                    try {
                        await Hanz.sendMessage(m.chat, {
                            groupStatusMessage: content
                        });
                        return true;
                    } catch {}

                    return false;
                };
                if (srcMsg?.imageMessage) {
                    const media = await downloadMedia(srcMsg);
                    if (!media?.buffer) return m.reply({ text: '❌ Gagal download gambar.' });

                    const ok = await sendGroupStatus({
                        image: media.buffer,
                        caption: caption || undefined
                    });
                    if (!ok) throw new Error('Baileys tidak support group status');
                    return m.reply({ text: '✅ *Group Status* (gambar) berhasil diupload.' });
                }
                if (srcMsg?.videoMessage) {
                    const media = await downloadMedia(srcMsg);
                    if (!media?.buffer) return m.reply({ text: '❌ Gagal download video.' });

                    const ok = await sendGroupStatus({
                        video: media.buffer,
                        caption: caption || undefined
                    });
                    if (!ok) throw new Error('Baileys tidak support group status');
                    return m.reply({ text: '✅ *Group Status* (video) berhasil diupload.' });
                }
                if (caption) {
                    const ok = await sendGroupStatus({ text: caption });
                    if (!ok) throw new Error('Baileys tidak support group status');
                    return m.reply({ text: '✅ *Group Status* (teks) berhasil diupload.' });
                }
                await m.reply({
                    text:
`📸 *Group Status / Story Grup*

Upload status khusus di dalam grup ini (bukan status pribadi).

• Teks:
  ${p}upstorygc Halo semua!

• Gambar / Video:
  Reply media + ${p}upstorygc caption opsional
  atau kirim media + caption ${p}upstorygc

Hanya admin yang bisa memakai command ini.`
                });
            } catch (err) {
                console.error('[upstorygc]', err);
                await m.reply({
                    text: '❌ Gagal upload group status.\n' +
                          'Mungkin Baileys kamu belum support fitur ini.\n\n' +
                          'Error: ' + (err?.message || String(err))
                });
            }
        }
            break;
        case 'creategc':
        case 'buatgrup': {
            if (!isOwner) return m.reply(mess.owner);

            const args = command.args || [];
            let title = '';
            let participants = [];

            const full = (command.fullArgs || '').trim();
            if (full.includes('|')) {
                const [left, right] = full.split('|').map(s => s.trim());
                title = left;
                participants = (right || '')
                    .split(/[\s,]+/)
                    .map(n => n.replace(/\D/g, ''))
                    .filter(n => n.length >= 8)
                    .map(n => n + '@s.whatsapp.net');
            } else {
                title = full;
            }

            if (!title) {
                return m.reply({
                    text:
`❌ Format salah.

Contoh:
• ${p}creategc Nama Grup Saya
• ${p}creategc Nama Grup | 628123456789 628987654321

Anggota tambahan opsional (pisah spasi/koma).`
                });
            }

            try {
                await m.reply({ text: `⏳ Membuat grup *${title}*...` });
                if (!participants.length) {
                    const me = (Hanz.user?.id || '').replace(/:[0-9]+/, '');
                    if (me) participants = [me];
                }
                const group = await Hanz.groupCreate(title, participants);
                const gid = group?.id || group?.gid;
                if (gid) {
                    await Hanz.sendMessage(gid, {
                        text: `👋 Grup *${title}* dibuat oleh bot.\nOwner: @${senderNumber}`,
                        mentions: [m.sender]
                    }).catch(() => {});
                }
                await m.reply({
                    text: `✅ Grup berhasil dibuat!\n📛 *${title}*\n🆔 \`${gid || '-'}\``
                });
            } catch (err) {
                await m.reply({ text: '❌ Gagal buat grup:\n' + (err?.message || String(err)) });
            }
        }
            break;
    }
};
module.exports = handler;