const config = require('../settings');

// ─────────────────────────────────────────────────────────────
//  GENERAL COMMANDS
//  Tambah command baru: tulis case baru di switch, lalu
//  tambahkan nama command-nya ke array .commands di bawah
// ─────────────────────────────────────────────────────────────

const handler = async (ctx) => {
    const { command, sock, sender } = ctx;

    switch (command.name) {

        case 'menu': {
            const fs   = require('fs');
            const path = require('path');

            const imgPath = path.join(__dirname, '../../assets/logo.png');
            const imageSource = fs.existsSync(imgPath)
                ? fs.readFileSync(imgPath)                 // lokal
                : { url: 'https://picsum.photos/600/400' }; // fallback URL

            await ctx.sendInteractiveWithImage({
                imageSource,
                text: [
                    `🤖 *${config.botName}*`,
                    '',
                    '👋 Halo! Pilih kategori menu di bawah:',
                ].join('\n'),
                footer: 'Ketuk tombol untuk lihat isi kategori',
                quoted: ctx.msg,
                buttons: [
                    {
                        name: 'quick_reply',
                        buttonParamsJson: JSON.stringify({ display_text: '📋 General', id: 'menu_general' })
                    },
                    {
                        name: 'quick_reply',
                        buttonParamsJson: JSON.stringify({ display_text: '🎛️ Interactive', id: 'menu_interactive' })
                    },
                    {
                        name: 'quick_reply',
                        buttonParamsJson: JSON.stringify({ display_text: '🖼️ Media & Fun', id: 'menu_media' })
                    },
                ]
            });
            break;
        }

        // ── Response tiap button menu ─────────────────────────
        case 'menu_general': {
            const p = config.prefix;
            await ctx.sendInteractive({
                text: [
                    '📋 *General Commands*',
                    '',
                    `• \`${p}menu\` — Menu utama`,
                    `• \`${p}ping\` — Latency bot`,
                    `• \`${p}info\` — Info bot`,
                    `• \`${p}owner\` — Kontak owner`,
                    `• \`${p}location\` — Kirim lokasi`,
                    `• \`${p}contact\` — Kirim kontak`,
                    `• \`${p}poll\` — Polling`,
                ].join('\n'),
                footer: config.botName,
                quoted: ctx.msg,
                buttons: [
                    { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '⬅️ Kembali ke Menu', id: 'menu' }) },
                    { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '🎛️ Interactive', id: 'menu_interactive' }) },
                ]
            });
            break;
        }

        case 'menu_interactive': {
            const p = config.prefix;
            await ctx.sendInteractive({
                text: [
                    '🎛️ *Interactive Commands*',
                    '',
                    `• \`${p}button\` — Quick reply buttons`,
                    `• \`${p}list\` — List menu makanan`,
                    `• \`${p}interactive\` — Mixed buttons`,
                    `• \`${p}buttonimage\` — Button + gambar`,
                    `• \`${p}buttoncall\` — Button telepon`,
                    `• \`${p}poll\` — Polling`,
                ].join('\n'),
                footer: config.botName,
                quoted: ctx.msg,
                buttons: [
                    { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '⬅️ Kembali ke Menu', id: 'menu' }) },
                    { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '🖼️ Media & Fun', id: 'menu_media' }) },
                    {
                        name: 'cta_url',
                        buttonParamsJson: JSON.stringify({ display_text: '📖 Docs Baileys', url: 'https://github.com/whiskeysockets/baileys' })
                    },
                ]
            });
            break;
        }

        case 'menu_media': {
            const p = config.prefix;
            await ctx.sendInteractive({
                text: [
                    '🖼️ *Media Commands*',
                    `• \`${p}media\` — Gambar dari URL`,
                    `• \`${p}medialokal\` — Gambar lokal`,
                    '',
                    '😄 *Fun Commands*',
                    `• \`${p}dice\` — Lempar dadu`,
                    `• \`${p}coin\` — Coin flip`,
                    `• \`${p}random\` — Angka random`,
                    `• \`${p}8ball\` — Bola ajaib`,
                    `• \`${p}joke\` — Lelucon`,
                    `• \`${p}fortune\` — Ramalan`,
                    '',
                    '👥 *Group Commands*',
                    `• \`${p}tagall\` — Tag semua member`,
                    `• \`${p}groupinfo\` — Info grup`,
                    `• \`${p}kick/add/promote/demote/link\``,
                ].join('\n'),
                footer: config.botName,
                quoted: ctx.msg,
                buttons: [
                    { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '⬅️ Kembali ke Menu', id: 'menu' }) },
                    { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '📋 General', id: 'menu_general' }) },
                ]
            });
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
                `║ ⚙️ *Prefix:* ${config.prefix} (atau tanpa)`,
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
handler.commands = ['menu', 'menu_general', 'menu_interactive', 'menu_media', 'ping', 'info', 'owner', 'location', 'contact', 'react', 'quote', 'poll'];

module.exports = handler;