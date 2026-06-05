const { isGroupAdmin, getGroupInfo } = require('../utils/helper');
const config = require('../config');
const plugins = require('../utils/PluginLoader');
const { getDevice } = require('@whiskeysockets/baileys');

const handler = async (m) => {
    const { command, isSuperOwner, Hanz, sender, msg, senderNumber, pushname, isOwner } = m;
    const p = config.prefix;
    const nomorUser = senderNumber;
    let metadata, mentions, text, isAdmin, mentioned, number, subject, desc, code;
    if (!m.isGroup) {
        await m.reply({ text: '❌ Command ini hanya bisa digunakan di grup.' });
        return;
    }

    const getMentioned = () => msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    const senderJid = msg.key.participant || msg.key.remoteJid;

    switch (command.name) {
        case 'groupmenu':
            const device = getDevice(msg.key.id);
            const groupCmds = plugins.commandsByFile()['group'] || [];
            const role = isSuperOwner ? 'Super Owner' : (isOwner ? 'Co-Owner' : 'User');
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
                quoted: m.fakeOrder,
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
                                rows: [{ title: "Game Menu", description: "Select to display jadi bot menu", id: "funmenu" }]
                            }, {
                                highlight_label: "",
                                rows: [{ title: "Group Menu", description: "Select to display group menu ", id: "groupmenu" }]
                            }]
                        })
                    }]
            });
            break;
        case 'tagall':
            metadata = await getGroupInfo(Hanz, sender);
            if (!metadata) return m.reply({ text: '❌ Gagal mendapatkan info grup.' });
            mentions = metadata.participants.map(p => p.id);
            text = `📢 *Tag All Members*\n\n` + metadata.participants.map((p, i) => `${i + 1}. @${p.id.split('@')[0]}`).join('\n');
            await Hanz.sendMessage(sender, { text, mentions });
            break;
        case 'hidetag':
            metadata = await getGroupInfo(Hanz, sender);
            if (!metadata) return;
            await Hanz.sendMessage(sender, {
                text: command.fullArgs || '👀',
                mentions: metadata.participants.map(p => p.id)
            });
            break;
        case 'groupinfo':
            metadata = await getGroupInfo(Hanz, sender);
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
            isAdmin = await isGroupAdmin(Hanz, sender, senderJid);
            if (!isAdmin) return m.reply({ text: '❌ Kamu bukan admin grup.' });
            mentioned = getMentioned();
            if (!mentioned.length) return m.reply({ text: '❌ Tag member yang ingin dikick.\nContoh: !kick @user' });
            try {
                await Hanz.groupParticipantsUpdate(sender, mentioned, 'remove');
                await m.reply({ text: `✅ Berhasil mengeluarkan ${mentioned.length} member.` });
            } catch {
                await m.reply({ text: '❌ Gagal. Pastikan bot adalah admin.' });
            }
            break;
        case 'add':
            number = command.args[0];
            if (!number) return m.reply({ text: '❌ Masukkan nomor.\nContoh: !add 6281234567890' });
            try {
                await Hanz.groupParticipantsUpdate(sender, [number.replace(/\D/g, '') + '@s.whatsapp.net'], 'add');
                await m.reply({ text: `✅ Berhasil menambahkan ${number} ke grup.` });
            } catch {
                await m.reply({ text: '❌ Gagal. Pastikan nomor valid dan bot adalah admin.' });
            }
            break;
        case 'promote':
            mentioned = getMentioned();
            if (!mentioned.length) return m.reply({ text: '❌ Tag member yang ingin dipromote.\nContoh: !promote @user' });
            try {
                await Hanz.groupParticipantsUpdate(sender, mentioned, 'promote');
                await m.reply({ text: `✅ Berhasil promote ${mentioned.length} member.` });
            } catch {
                await m.reply({ text: '❌ Gagal promote member.' });
            }
            break;
        case 'demote':
            mentioned = getMentioned();
            if (!mentioned.length) return m.reply({ text: '❌ Tag admin yang ingin didemote.\nContoh: !demote @admin' });
            try {
                await Hanz.groupParticipantsUpdate(sender, mentioned, 'demote');
                await m.reply({ text: `✅ Berhasil demote ${mentioned.length} admin.` });
            } catch {
                await m.reply({ text: '❌ Gagal demote admin.' });
            }
            break;
        case 'setsubject':
            subject = command.fullArgs;
            if (!subject) return m.reply({ text: '❌ Masukkan nama grup baru.\nContoh: !setsubject Nama Grup Baru' });
            try {
                await Hanz.groupUpdateSubject(sender, subject);
                await m.reply({ text: `✅ Nama grup diubah ke: ${subject}` });
            } catch {
                await m.reply({ text: '❌ Gagal mengubah nama grup.' });
            }
            break;
        case 'setdesc':
            desc = command.fullArgs;
            if (!desc) return m.reply({ text: '❌ Masukkan deskripsi baru.\nContoh: !setdesc Deskripsi grup' });
            try {
                await Hanz.groupUpdateDescription(sender, desc);
                await m.reply({ text: '✅ Deskripsi grup berhasil diubah.' });
            } catch {
                await m.reply({ text: '❌ Gagal mengubah deskripsi grup.' });
            }
            break;
        case 'revoke':
            try {
                await Hanz.groupRevokeInvite(sender);
                await m.reply({ text: '✅ Link invite grup berhasil direvoke.' });
            } catch {
                await m.reply({ text: '❌ Gagal revoke link invite.' });
            }
            break;

        case 'link':
            try {
                code = await Hanz.groupInviteCode(sender);
                await m.reply({ text: `🔗 Link Invite Grup:\nhttps://chat.whatsapp.com/${code}` });
            } catch {
                await m.reply({ text: '❌ Gagal mendapatkan link invite.' });
            }
            break;
    }
};
module.exports = handler;