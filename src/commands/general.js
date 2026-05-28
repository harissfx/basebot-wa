const config = require('../settings');

// ─────────────────────────────────────────────────────────────
//  GENERAL COMMANDS
//  Tambah command baru: tulis case baru di switch, lalu
//  tambahkan nama command-nya ke array .commands di bawah
// ─────────────────────────────────────────────────────────────

const handler = async (ctx) => {
    const { command, sock, sender } = ctx;
    const p = config.prefix;

    switch (command.name) {

        case 'menu': {
            await ctx.send({ text: [
                `╔═══ *${config.botName}* ═══╗`,
                '║',
                '║ 👋 Halo! Menu tersedia:',
                '║',
                '║ *📋 General:*',
                `║ • menu - Menu ini`,
                `║ • ping - Latency`,
                `║ • info - Info bot`,
                `║ • owner - Owner`,
                '║',
                '║ *🎛️ Interactive:*',
                `║ • button - Button`,
                `║ • list - List menu`,
                `║ • interactive - Mixed`,
                `║ • poll - Polling`,
                `║ • location - Lokasi`,
                `║ • contact - Kontak`,
                '║',
                '║ *🖼️ Media:*',
                `║ • media - Gambar URL`,
                `║ • medialokal - Gambar lokal`,
                '║',
                '║ *👥 Group:*',
                `║ • tagall - Tag semua`,
                `║ • groupinfo - Info grup`,
                `║ • kick - Kick member`,
                `║ • add - Tambah member`,
                `║ • promote - Promote`,
                `║ • demote - Demote`,
                `║ • link - Link invite`,
                '║',
                '║ *😄 Fun:*',
                `║ • dice - Dadu`,
                `║ • coin - Coin flip`,
                `║ • random - Random`,
                `║ • 8ball - Bola ajaib`,
                `║ • joke - Joke`,
                `║ • fortune - Fortune`,
                '║',
                `║ *💡 Bisa pakai prefix ${p} atau langsung!*`,
                '╚════════════════════╝',
            ].join('\n') });
            break;
        }

        case 'ping': {
            const start = Date.now();
            const sent  = await ctx.reply({ text: '🏓 Pong!' });
            await sock.sendMessage(sender, {
                text: `🏓 *Pong!*\n\n⏱️ Latency: *${Date.now() - start}ms*`,
                edit: sent.key
            });
            break;
        }

        case 'info': {
            const u = process.uptime();
            const h = Math.floor(u / 3600);
            const m = Math.floor((u % 3600) / 60);
            const s = Math.floor(u % 60);
            await ctx.send({ text: [
                '╔═══ *Bot Info* ═══╗',
                `║ 🤖 *Nama:* ${config.botName}`,
                `║ 👤 *Owner:* ${config.ownerNumber || '-'}`,
                `║ ⚙️ *Prefix:* ${p} (atau tanpa)`,
                `║ 🔄 *Uptime:* ${h}j ${m}m ${s}d`,
                `║ 📦 *Node:* ${process.version}`,
                `║ 🖥️ *Platform:* ${process.platform}`,
                '╚════════════════════╝',
            ].join('\n') });
            break;
        }

        case 'owner': {
            if (!config.ownerNumber) return ctx.reply({ text: '❌ Nomor owner belum diatur.' });
            await ctx.send({
                contacts: {
                    displayName: 'Owner Bot',
                    contacts: [{ vcard: `BEGIN:VCARD\nVERSION:3.0\nFN:Owner Bot\nTEL;type=CELL;type=VOICE;waid=${config.ownerNumber}:+${config.ownerNumber}\nEND:VCARD` }]
                }
            });
            break;
        }

        case 'location': {
            await ctx.reply({
                location: { degreesLatitude: -6.1754, degreesLongitude: 106.8272, name: 'Monumen Nasional', address: 'Jakarta, Indonesia' }
            });
            break;
        }

        case 'contact': {
            await ctx.reply({
                contacts: {
                    displayName: 'Test Contact',
                    contacts: [{ vcard: 'BEGIN:VCARD\nVERSION:3.0\nFN:Test Contact\nTEL;type=CELL;type=VOICE;waid=6281234567890:+62 812-3456-7890\nEND:VCARD' }]
                }
            });
            break;
        }

        case 'react': {
            await ctx.react(command.args[0] || '👍');
            break;
        }

        case 'quote': {
            await ctx.reply({ text: '📌 Quoted message!' });
            break;
        }

        case 'poll': {
            await ctx.reply({
                poll: { name: 'Polling Favorit', values: ['Node.js', 'Python', 'Golang', 'Rust'], selectableCount: 1, toAnnouncementGroup: false }
            });
            break;
        }

    }
};

// Daftar semua command yang di-handle file ini
// Tambah di sini kalau bikin case baru di atas
handler.commands = ['menu', 'ping', 'info', 'owner', 'location', 'contact', 'react', 'quote', 'poll'];

module.exports = handler;