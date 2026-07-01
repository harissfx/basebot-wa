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

    const norm = (jid) => jid?.replace(/:[0-9]+/, '').split('@')[0];
    const botIds = () => [Hanz.user?.id, Hanz.user?.lid].filter(Boolean).map(norm);
    const isBotJid = (jid) => botIds().includes(norm(jid));

    // Resolve status ON/OFF baru dari argumen ('on'/'off') atau toggle kalau kosong
    const resolveToggleState = (current, arg) => {
        const a = arg?.toLowerCase();
        if (a === 'on') return true;
        if (a === 'off') return false;
        return !current; // tanpa argumen -> toggle
    };

    // Cek apakah bot adalah admin di grup ini
    const isBotAdmin = async () => {
        const meta = await getGroupInfo(Hanz, sender);
        if (!meta) return false;

        // WhatsApp sekarang bisa mengirim id partisipan dalam format @lid
        // (bukan cuma @s.whatsapp.net), termasuk untuk akun bot sendiri.
        // Kalau cuma dicocokkan lewat Hanz.user.id, ini bisa gagal match
        // walau bot beneran admin. Jadi kita kumpulkan semua kemungkinan
        // identitas bot (id & lid) lalu cocokkan ke semua kemungkinan
        // identitas tiap partisipan (id, lid, jid).
        const bot = meta.participants.find((p) => {
            const pIds = [p.id, p.lid, p.jid].filter(Boolean).map(norm);
            return pIds.some((id) => botIds().includes(id));
        });

        return bot?.admin === 'admin' || bot?.admin === 'superadmin';
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
                                rows: [{ title: "Fun Menu", description: "Select to display fun menu", id: "funmenu" }]
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
            if (!await isBotAdmin()) return m.reply({ text: '❌ Bot bukan admin grup.' });
            mentioned = getMentioned();
            if (!mentioned.length) return m.reply({ text: '❌ Tag member yang ingin dikick.\nContoh: !kick @user' });
            try {
                await Hanz.groupParticipantsUpdate(sender, mentioned, 'remove');
                await m.reply({ text: `✅ Berhasil mengeluarkan ${mentioned.length} member.` });
            } catch {
                await m.reply({ text: '❌ Gagal mengeluarkan member.' });
            }
            break;
        case 'add':
            isAdmin = await isGroupAdmin(Hanz, sender, senderJid);
            if (!isAdmin) return m.reply({ text: '❌ Kamu bukan admin grup.' });
            number = command.args[0];
            if (!number) return m.reply({ text: '❌ Masukkan nomor.\nContoh: !add 6281234567890' });
            if (!await isBotAdmin()) return m.reply({ text: '❌ Bot bukan admin grup.' });
            try {
                await Hanz.groupParticipantsUpdate(sender, [number.replace(/\D/g, '') + '@s.whatsapp.net'], 'add');
                await m.reply({ text: `✅ Berhasil menambahkan ${number} ke grup.` });
            } catch {
                await m.reply({ text: '❌ Gagal. Pastikan nomor valid dan bot adalah admin.' });
            }
            break;
        case 'promote':
            isAdmin = await isGroupAdmin(Hanz, sender, senderJid);
            if (!isAdmin) return m.reply({ text: '❌ Kamu bukan admin grup.' });
            if (!await isBotAdmin()) return m.reply({ text: '❌ Bot bukan admin grup.' });
            mentioned = getMentioned();
            if (!mentioned.length) return m.reply({ text: '❌ Tag member yang ingin dipromote.\nContoh: !promote @user' });
            try {
                const result = await Hanz.groupParticipantsUpdate(sender, mentioned, 'promote');
                const success = result.filter(r => r.status === '200').length;
                if (success === 0) {
                    await m.reply({ text: '❌ Gagal promote member.' });
                } else if (success < mentioned.length) {
                    await m.reply({ text: `⚠️ Berhasil promote ${success} dari ${mentioned.length} member.` });
                } else {
                    await m.reply({ text: `✅ Berhasil promote ${success} member.` });
                }
            } catch {
                await m.reply({ text: '❌ Gagal promote member.' });
            }
            break;
        case 'demote':
            isAdmin = await isGroupAdmin(Hanz, sender, senderJid);
            if (!isAdmin) return m.reply({ text: '❌ Kamu bukan admin grup.' });
            if (!await isBotAdmin()) return m.reply({ text: '❌ Bot bukan admin grup.' });
            mentioned = getMentioned();
            if (!mentioned.length) return m.reply({ text: '❌ Tag admin yang ingin didemote.\nContoh: !demote @admin' });
            // Proteksi: bot tidak boleh demote dirinya sendiri
            if (mentioned.some(isBotJid)) {
                return m.reply({ text: '❌ Bot tidak bisa demote dirinya sendiri.' });
            }
            try {
                const result = await Hanz.groupParticipantsUpdate(sender, mentioned, 'demote');
                const success = result.filter(r => r.status === '200').length;
                if (success === 0) {
                    await m.reply({ text: '❌ Gagal demote admin.' });
                } else if (success < mentioned.length) {
                    await m.reply({ text: `⚠️ Berhasil demote ${success} dari ${mentioned.length} admin.` });
                } else {
                    await m.reply({ text: `✅ Berhasil demote ${success} admin.` });
                }
            } catch {
                await m.reply({ text: '❌ Gagal demote admin.' });
            }
            break;
        case 'setsubject':
            isAdmin = await isGroupAdmin(Hanz, sender, senderJid);
            if (!isAdmin) return m.reply({ text: '❌ Kamu bukan admin grup.' });
            if (!await isBotAdmin()) return m.reply({ text: '❌ Bot bukan admin grup.' });
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
            isAdmin = await isGroupAdmin(Hanz, sender, senderJid);
            if (!isAdmin) return m.reply({ text: '❌ Kamu bukan admin grup.' });
            if (!await isBotAdmin()) return m.reply({ text: '❌ Bot bukan admin grup.' });
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
            isAdmin = await isGroupAdmin(Hanz, sender, senderJid);
            if (!isAdmin) return m.reply({ text: '❌ Kamu bukan admin grup.' });
            if (!await isBotAdmin()) return m.reply({ text: '❌ Bot bukan admin grup.' });
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
                    // ══════════════════════════════════════════════════════
        //  WELCOME
        // ══════════════════════════════════════════════════════

        case 'welcome': {
            if (!m.isGroup) return m.reply({ text: '❌ Command ini hanya untuk grup.' });
            const isAdmin = await isGroupAdmin(Hanz, sender, senderJid);
            if (!isAdmin && !isOwner) return m.reply({ text: '❌ Kamu bukan admin grup.' });

            global.welcomeGroups = global.welcomeGroups || new Map();
            const current = global.welcomeGroups.get(sender) || false;
            const next = resolveToggleState(current, command.args?.[0]);
            global.welcomeGroups.set(sender, next);

            await m.reply({
                text: `Fitur *Welcome* sekarang: *${next ? 'ON' : 'OFF'}*`
            });
            break;
        }

        // ══════════════════════════════════════════════════════
        //  GOODBYE
        // ══════════════════════════════════════════════════════

        case 'goodbye': {
            if (!m.isGroup) return m.reply({ text: '❌ Command ini hanya untuk grup.' });
            const isAdmin = await isGroupAdmin(Hanz, sender, senderJid);
            if (!isAdmin && !isOwner) return m.reply({ text: '❌ Kamu bukan admin grup.' });

            global.goodbyeGroups = global.goodbyeGroups || new Map();
            const current = global.goodbyeGroups.get(sender) || false;
            const next = resolveToggleState(current, command.args?.[0]);
            global.goodbyeGroups.set(sender, next);

            await m.reply({
                text: `Fitur *Goodbye* sekarang: *${next ? 'ON' : 'OFF'}*`
            });
            break;
        }

        // ══════════════════════════════════════════════════════
        //  ANTILINK
        // ══════════════════════════════════════════════════════

        case 'antilink': {
            if (!m.isGroup) return m.reply({ text: '❌ Command ini hanya untuk grup.' });
            const isAdmin = await isGroupAdmin(Hanz, sender, senderJid);
            if (!isAdmin && !isOwner) return m.reply({ text: '❌ Kamu bukan admin grup.' });

            global.antilinkGroups = global.antilinkGroups || new Map();
            const current = global.antilinkGroups.get(sender) || false;
            const next = resolveToggleState(current, command.args?.[0]);
            global.antilinkGroups.set(sender, next);

            await m.reply({
                text: `Fitur *Antilink* sekarang: *${next ? 'ON' : 'OFF'}*\n${next ? 'Pesan yang mengandung link akan otomatis dihapus (kecuali owner & admin).' : ''}`
            });
            break;
        }
    }
};
module.exports = handler;