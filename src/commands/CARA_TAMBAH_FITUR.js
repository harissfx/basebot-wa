// ═══════════════════════════════════════════════════════════
//  📖 PANDUAN: CARA TAMBAH COMMAND BARU
//
//  1. Buat file baru di folder ini (contoh: mycommands.js)
//  2. Export object berisi nama-command: async function
//  3. Bot otomatis reload tanpa perlu restart!
//
//  Tersedia di ctx:
//   ctx.reply({ text: '...' })        → balas pesan (ada quotes)
//   ctx.send({ text: '...' })         → kirim pesan biasa
//   ctx.react('👍')                   → react emoji ke pesan
//   ctx.sendButtons({ ... })          → kirim tombol
//   ctx.sendList({ ... })             → kirim list menu
//   ctx.sendInteractive({ ... })      → kirim interactive button
//   ctx.sendButtonWithImage({ ... })  → button + gambar
//   ctx.isGroup                       → true kalau di grup
//   ctx.isOwner                       → true kalau owner bot
//   ctx.command.args                  → array argumen perintah
//   ctx.command.fullArgs              → argumen lengkap (string)
//   ctx.sender                        → JID pengirim
// ═══════════════════════════════════════════════════════════

const exampleCommands = {

    // !halo → balas dengan sapaan
    halo: async (ctx) => {
        await ctx.reply({ text: '👋 Halo! Ini command baru yang mudah dibuat!' });
    },

    // !ulang [teks] → ulangi kata-kata user
    ulang: async (ctx) => {
        const teks = ctx.command.fullArgs;
        if (!teks) return ctx.reply({ text: '❌ Tulis sesuatu!\nContoh: !ulang Halo dunia' });
        await ctx.reply({ text: `🔁 Kamu bilang: ${teks}` });
    },

    // !tanya → kirim button dengan pilihan
    tanya: async (ctx) => {
        await ctx.sendButtons({
            text: '❓ Suka programming pakai bahasa apa?',
            footer: 'Pilih salah satu',
            quoted: ctx.msg,
            buttons: [
                { id: 'jawab_js',  text: '🟡 JavaScript' },
                { id: 'jawab_py',  text: '🐍 Python'     },
                { id: 'jawab_go',  text: '🔵 Golang'     },
            ]
        });
    },

    // Response dari button !tanya di atas
    jawab_js: async (ctx) => { await ctx.reply({ text: '🟡 Pilihan bagus! JavaScript is everywhere!' }); },
    jawab_py: async (ctx) => { await ctx.reply({ text: '🐍 Python keren buat AI & data!'             }); },
    jawab_go: async (ctx) => { await ctx.reply({ text: '🔵 Golang cepat dan efisien!'                 }); },

};

module.exports = exampleCommands;
