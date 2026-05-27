const config = require('../settings');

const generalCommands = {
    menu: async (ctx) => {
        const p = config.prefix;
        await ctx.send({ text: [
            `╔═══ *${config.botName}* ═══╗`,
            '║',
            '║ 👋 Halo! Menu tersedia:',
            '║',
            '║ *📋 General:*',
            `║ • menu / ${p}menu - Menu ini`,
            `║ • ping / ${p}ping - Latency`,
            `║ • info / ${p}info - Info bot`,
            `║ • owner / ${p}owner - Owner`,
            '║',
            '║ *🎛️ Interactive:*',
            `║ • button / ${p}button - Button`,
            `║ • list / ${p}list - List menu`,
            `║ • interactive / ${p}interactive - Mixed`,
            `║ • poll / ${p}poll - Polling`,
            `║ • location / ${p}location - Lokasi`,
            `║ • contact / ${p}contact - Kontak`,
            '║',
            '║ *🖼️ Media:*',
            `║ • media / ${p}media - Gambar URL`,
            `║ • medialokal / ${p}medialokal - Gambar lokal`,
            '║',
            '║ *👥 Group:*',
            `║ • tagall / ${p}tagall - Tag semua`,
            `║ • groupinfo / ${p}groupinfo - Info grup`,
            `║ • kick / ${p}kick - Kick member`,
            `║ • add / ${p}add - Tambah member`,
            `║ • promote / ${p}promote - Promote`,
            `║ • demote / ${p}demote - Demote`,
            `║ • link / ${p}link - Link invite`,
            '║',
            '║ *😄 Fun:*',
            `║ • dice / ${p}dice - Dadu`,
            `║ • coin / ${p}coin - Coin flip`,
            `║ • random / ${p}random - Random`,
            `║ • 8ball / ${p}8ball - Bola ajaib`,
            `║ • joke / ${p}joke - Joke`,
            `║ • fortune / ${p}fortune - Fortune`,
            '║',
            `║ *💡 Bisa pakai prefix ${p} atau langsung!*`,
            '╚════════════════════╝',
        ].join('\n') });
    },

    ping: async (ctx) => {
        const start = Date.now();
        const sent = await ctx.reply({ text: '🏓 Pong!' });
        await ctx.sock.sendMessage(ctx.sender, {
            text: `🏓 *Pong!*\n\n⏱️ Latency: *${Date.now() - start}ms*`,
            edit: sent.key
        });
    },

    info: async (ctx) => {
        const u = process.uptime();
        const h = Math.floor(u / 3600);
        const m = Math.floor((u % 3600) / 60);
        const s = Math.floor(u % 60);
        await ctx.send({ text: [
            '╔═══ *Bot Info* ═══╗',
            `║ 🤖 *Nama:* ${config.botName}`,
            `║ 👤 *Owner:* ${config.ownerNumber || '-'}`,
            `║ ⚙️ *Prefix:* ${config.prefix} (atau tanpa)`,
            `║ 🔄 *Uptime:* ${h}j ${m}m ${s}d`,
            `║ 📦 *Node:* ${process.version}`,
            `║ 🖥️ *Platform:* ${process.platform}`,
            '╚════════════════════╝',
        ].join('\n') });
    },

    owner: async (ctx) => {
        if (!config.ownerNumber) return ctx.reply({ text: '❌ Nomor owner belum diatur.' });
        await ctx.send({
            contacts: {
                displayName: 'Owner Bot',
                contacts: [{
                    vcard: `BEGIN:VCARD\nVERSION:3.0\nFN:Owner Bot\nTEL;type=CELL;type=VOICE;waid=${config.ownerNumber}:+${config.ownerNumber}\nEND:VCARD`
                }]
            }
        });
    },

    location: async (ctx) => {
        await ctx.reply({
            location: {
                degreesLatitude: -6.1754,
                degreesLongitude: 106.8272,
                name: 'Monumen Nasional',
                address: 'Jakarta, Indonesia'
            }
        });
    },

    contact: async (ctx) => {
        await ctx.reply({
            contacts: {
                displayName: 'Test Contact',
                contacts: [{
                    vcard: 'BEGIN:VCARD\nVERSION:3.0\nFN:Test Contact\nORG:WhatsApp Bot;\nTEL;type=CELL;type=VOICE;waid=6281234567890:+62 812-3456-7890\nEND:VCARD'
                }]
            }
        });
    },

    react: async (ctx) => {
        await ctx.react(ctx.command.args[0] || '👍');
    },

    quote: async (ctx) => {
        await ctx.reply({ text: '📌 Quoted message!' });
    },

    poll: async (ctx) => {
        await ctx.reply({
            poll: {
                name: 'Polling Favorit',
                values: ['Node.js', 'Python', 'Golang', 'Rust'],
                selectableCount: 1,
                toAnnouncementGroup: false
            }
        });
    },
};

module.exports = generalCommands;
