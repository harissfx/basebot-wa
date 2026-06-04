const { isGroupAdmin, getGroupInfo } = require('../utils/helper');
const config = require('../config');

const handler = async (ctx) => {
    const { command, sock, sender, msg } = ctx;
    const p = config.prefix;
    let metadata, mentions, text, isAdmin, mentioned, number, subject, desc, code;
    if (!ctx.isGroup) {
        await ctx.reply({ text: '❌ Command ini hanya bisa digunakan di grup.' });
        return;
    }

    const getMentioned = () => msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    const senderJid = msg.key.participant || msg.key.remoteJid;

    switch (command.name) {
        case 'groupmenu':
            let menu = `
╭──❍『𝑫𝒐𝒘𝒏𝒍𝒐𝒂𝒅𝒆𝒓 𝑴𝒆𝒏𝒖』
│
│⭔ ${p}ytmp3 [url]
│⭔ ${p}ytmp4 [url]
│⭔ ${p}tiktok [url]
│⭔ ${p}twiter [url]
│⭔ ${p}facebook [url]
│⭔ ${p}pinterest [url]
│⭔ ${p}instagram [url]
│
╰────❍
`
            await ctx.sendInteractive({
                text: menu,
                footer: config.botName,
                quoted: ctx.fakeOrder,
                contextInfo: {
                    mentionedJid: ["0@s.whatsapp.net"],
                    forwardingScore: 111,
                    isForwarded: true
                },
                buttons: [
                    { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: 'Kembali ke Menu', id: 'menu' }) },
                    {
                        name: 'single_select', buttonParamsJson: JSON.stringify({
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
                                rows: [{ title: "Ffmpeg Menu", description: "Select to display ffmpeg menu", id: "ffmpeg" }]
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
                                rows: [{ title: "Group Menu", description: "Select to display group menu ", id: "groupmenu" }]
                            },]
                        })
                    }]
            });
            break;
        case 'tagall':
            metadata = await getGroupInfo(sock, sender);
            if (!metadata) return ctx.reply({ text: '❌ Gagal mendapatkan info grup.' });
            mentions = metadata.participants.map(p => p.id);
            text = `📢 *Tag All Members*\n\n` + metadata.participants.map((p, i) => `${i + 1}. @${p.id.split('@')[0]}`).join('\n');
            await sock.sendMessage(sender, { text, mentions });
            break;
        case 'hidetag':
            metadata = await getGroupInfo(sock, sender);
            if (!metadata) return;
            await sock.sendMessage(sender, {
                text: command.fullArgs || '👀',
                mentions: metadata.participants.map(p => p.id)
            });
            break;
        case 'groupinfo':
            metadata = await getGroupInfo(sock, sender);
            if (!metadata) return ctx.reply({ text: '❌ Gagal mendapatkan info grup.' });
            await ctx.reply({
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
            isAdmin = await isGroupAdmin(sock, sender, senderJid);
            if (!isAdmin) return ctx.reply({ text: '❌ Kamu bukan admin grup.' });
            mentioned = getMentioned();
            if (!mentioned.length) return ctx.reply({ text: '❌ Tag member yang ingin dikick.\nContoh: !kick @user' });
            try {
                await sock.groupParticipantsUpdate(sender, mentioned, 'remove');
                await ctx.reply({ text: `✅ Berhasil mengeluarkan ${mentioned.length} member.` });
            } catch {
                await ctx.reply({ text: '❌ Gagal. Pastikan bot adalah admin.' });
            }
            break;
        case 'add':
            number = command.args[0];
            if (!number) return ctx.reply({ text: '❌ Masukkan nomor.\nContoh: !add 6281234567890' });
            try {
                await sock.groupParticipantsUpdate(sender, [number.replace(/\D/g, '') + '@s.whatsapp.net'], 'add');
                await ctx.reply({ text: `✅ Berhasil menambahkan ${number} ke grup.` });
            } catch {
                await ctx.reply({ text: '❌ Gagal. Pastikan nomor valid dan bot adalah admin.' });
            }
            break;
        case 'promote':
            mentioned = getMentioned();
            if (!mentioned.length) return ctx.reply({ text: '❌ Tag member yang ingin dipromote.\nContoh: !promote @user' });
            try {
                await sock.groupParticipantsUpdate(sender, mentioned, 'promote');
                await ctx.reply({ text: `✅ Berhasil promote ${mentioned.length} member.` });
            } catch {
                await ctx.reply({ text: '❌ Gagal promote member.' });
            }
            break;
        case 'demote':
            mentioned = getMentioned();
            if (!mentioned.length) return ctx.reply({ text: '❌ Tag admin yang ingin didemote.\nContoh: !demote @admin' });
            try {
                await sock.groupParticipantsUpdate(sender, mentioned, 'demote');
                await ctx.reply({ text: `✅ Berhasil demote ${mentioned.length} admin.` });
            } catch {
                await ctx.reply({ text: '❌ Gagal demote admin.' });
            }
            break;
        case 'setsubject':
            subject = command.fullArgs;
            if (!subject) return ctx.reply({ text: '❌ Masukkan nama grup baru.\nContoh: !setsubject Nama Grup Baru' });
            try {
                await sock.groupUpdateSubject(sender, subject);
                await ctx.reply({ text: `✅ Nama grup diubah ke: ${subject}` });
            } catch {
                await ctx.reply({ text: '❌ Gagal mengubah nama grup.' });
            }
            break;
        case 'setdesc':
            desc = command.fullArgs;
            if (!desc) return ctx.reply({ text: '❌ Masukkan deskripsi baru.\nContoh: !setdesc Deskripsi grup' });
            try {
                await sock.groupUpdateDescription(sender, desc);
                await ctx.reply({ text: '✅ Deskripsi grup berhasil diubah.' });
            } catch {
                await ctx.reply({ text: '❌ Gagal mengubah deskripsi grup.' });
            }
            break;
        case 'revoke':
            try {
                await sock.groupRevokeInvite(sender);
                await ctx.reply({ text: '✅ Link invite grup berhasil direvoke.' });
            } catch {
                await ctx.reply({ text: '❌ Gagal revoke link invite.' });
            }
            break;

        case 'link':
            try {
                code = await sock.groupInviteCode(sender);
                await ctx.reply({ text: `🔗 Link Invite Grup:\nhttps://chat.whatsapp.com/${code}` });
            } catch {
                await ctx.reply({ text: '❌ Gagal mendapatkan link invite.' });
            }
            break;
    }
};
module.exports = handler;