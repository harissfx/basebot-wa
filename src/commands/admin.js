const { isGroupAdmin, getGroupInfo } = require('../utils/helper');

// Helper: cek apakah command ini dipakai di grup
function requireGroup(ctx) {
    if (!ctx.isGroup) {
        ctx.reply({ text: '❌ Command ini hanya bisa digunakan di grup.' });
        return false;
    }
    return true;
}

// Helper: ambil mentioned JID dari pesan
function getMentioned(ctx) {
    return ctx.msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
}

const adminCommands = {
    tagall: async (ctx) => {
        if (!requireGroup(ctx)) return;
        const metadata = await getGroupInfo(ctx.sock, ctx.sender);
        if (!metadata) return ctx.reply({ text: '❌ Gagal mendapatkan info grup.' });

        const mentions = metadata.participants.map(p => p.id);
        const text = `📢 *Tag All Members*\n\n` +
            metadata.participants.map((p, i) => `${i + 1}. @${p.id.split('@')[0]}`).join('\n');

        await ctx.sock.sendMessage(ctx.sender, { text, mentions });
    },

    hidetag: async (ctx) => {
        if (!requireGroup(ctx)) return;
        const metadata = await getGroupInfo(ctx.sock, ctx.sender);
        if (!metadata) return;

        await ctx.sock.sendMessage(ctx.sender, {
            text: ctx.command.fullArgs || '👀',
            mentions: metadata.participants.map(p => p.id)
        });
    },

    groupinfo: async (ctx) => {
        if (!requireGroup(ctx)) return;
        const metadata = await getGroupInfo(ctx.sock, ctx.sender);
        if (!metadata) return ctx.reply({ text: '❌ Gagal mendapatkan info grup.' });

        await ctx.reply({ text: [
            '╔═══ *Group Info* ═══╗',
            `║ 📛 *Nama:* ${metadata.subject}`,
            `║ 📝 *Deskripsi:* ${metadata.desc || 'Tidak ada'}`,
            `║ 👥 *Member:* ${metadata.participants.length}`,
            `║ 🔒 *Restrict:* ${metadata.restrict ? 'Ya' : 'Tidak'}`,
            `║ 🔔 *Announce:* ${metadata.announce ? 'Hanya admin' : 'Semua member'}`,
            `║ 🆔 *ID:* ${metadata.id}`,
            '╚════════════════════╝'
        ].join('\n') });
    },

    kick: async (ctx) => {
        if (!requireGroup(ctx)) return;

        // FIX: Cek admin pakai participant JID (bukan ctx.sender yang berisi group JID)
        const senderJid = ctx.msg.key.participant || ctx.msg.key.remoteJid;
        const isAdmin = await isGroupAdmin(ctx.sock, ctx.sender, senderJid);
        if (!isAdmin) return ctx.reply({ text: '❌ Kamu bukan admin grup.' });

        const mentioned = getMentioned(ctx);
        if (!mentioned.length) return ctx.reply({ text: '❌ Tag member yang ingin dikick.\nContoh: !kick @user' });

        try {
            await ctx.sock.groupParticipantsUpdate(ctx.sender, mentioned, 'remove');
            await ctx.reply({ text: `✅ Berhasil mengeluarkan ${mentioned.length} member.` });
        } catch {
            await ctx.reply({ text: '❌ Gagal mengeluarkan member. Pastikan bot adalah admin.' });
        }
    },

    add: async (ctx) => {
        if (!requireGroup(ctx)) return;
        const number = ctx.command.args[0];
        if (!number) return ctx.reply({ text: '❌ Masukkan nomor.\nContoh: !add 6281234567890' });

        try {
            const jid = number.replace(/\D/g, '') + '@s.whatsapp.net';
            await ctx.sock.groupParticipantsUpdate(ctx.sender, [jid], 'add');
            await ctx.reply({ text: `✅ Berhasil menambahkan ${number} ke grup.` });
        } catch {
            await ctx.reply({ text: '❌ Gagal menambahkan member. Pastikan nomor valid dan bot adalah admin.' });
        }
    },

    promote: async (ctx) => {
        if (!requireGroup(ctx)) return;
        const mentioned = getMentioned(ctx);
        if (!mentioned.length) return ctx.reply({ text: '❌ Tag member yang ingin dipromote.\nContoh: !promote @user' });

        try {
            await ctx.sock.groupParticipantsUpdate(ctx.sender, mentioned, 'promote');
            await ctx.reply({ text: `✅ Berhasil promote ${mentioned.length} member.` });
        } catch {
            await ctx.reply({ text: '❌ Gagal promote member.' });
        }
    },

    demote: async (ctx) => {
        if (!requireGroup(ctx)) return;
        const mentioned = getMentioned(ctx);
        if (!mentioned.length) return ctx.reply({ text: '❌ Tag admin yang ingin didemote.\nContoh: !demote @admin' });

        try {
            await ctx.sock.groupParticipantsUpdate(ctx.sender, mentioned, 'demote');
            await ctx.reply({ text: `✅ Berhasil demote ${mentioned.length} admin.` });
        } catch {
            await ctx.reply({ text: '❌ Gagal demote admin.' });
        }
    },

    setsubject: async (ctx) => {
        if (!requireGroup(ctx)) return;
        const subject = ctx.command.fullArgs;
        if (!subject) return ctx.reply({ text: '❌ Masukkan nama grup baru.\nContoh: !setsubject Nama Grup Baru' });

        try {
            await ctx.sock.groupUpdateSubject(ctx.sender, subject);
            await ctx.reply({ text: `✅ Nama grup diubah ke: ${subject}` });
        } catch {
            await ctx.reply({ text: '❌ Gagal mengubah nama grup.' });
        }
    },

    setdesc: async (ctx) => {
        if (!requireGroup(ctx)) return;
        const desc = ctx.command.fullArgs;
        if (!desc) return ctx.reply({ text: '❌ Masukkan deskripsi baru.\nContoh: !setdesc Deskripsi grup' });

        try {
            await ctx.sock.groupUpdateDescription(ctx.sender, desc);
            await ctx.reply({ text: '✅ Deskripsi grup berhasil diubah.' });
        } catch {
            await ctx.reply({ text: '❌ Gagal mengubah deskripsi grup.' });
        }
    },

    revoke: async (ctx) => {
        if (!requireGroup(ctx)) return;
        try {
            await ctx.sock.groupRevokeInvite(ctx.sender);
            await ctx.reply({ text: '✅ Link invite grup berhasil direvoke.' });
        } catch {
            await ctx.reply({ text: '❌ Gagal revoke link invite.' });
        }
    },

    link: async (ctx) => {
        if (!requireGroup(ctx)) return;
        try {
            const code = await ctx.sock.groupInviteCode(ctx.sender);
            await ctx.reply({ text: `🔗 Link Invite Grup:\nhttps://chat.whatsapp.com/${code}` });
        } catch {
            await ctx.reply({ text: '❌ Gagal mendapatkan link invite.' });
        }
    },
};

module.exports = adminCommands;
