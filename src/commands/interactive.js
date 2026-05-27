const fs   = require('fs');
const path = require('path');

const interactiveCommands = {
    button: async (ctx) => {
        try {
            await ctx.sendButtons({
                text: 'Silakan pilih salah satu opsi:',
                footer: 'WhatsApp Bot',
                quoted: ctx.msg,
                buttons: [
                    { id: 'btn_1', text: '✅ Opsi 1' },
                    { id: 'btn_2', text: '✅ Opsi 2' },
                    { id: 'btn_3', text: '✅ Opsi 3' },
                ]
            });
        } catch {
            await ctx.reply({ text: '❌ Gagal mengirim button.' });
        }
    },

    list: async (ctx) => {
        try {
            await ctx.sendInteractive({
                text: '📋 Silakan pilih item dari daftar:',
                footer: 'WhatsApp Bot List Menu',
                quoted: ctx.msg,
                buttons: [{
                    name: 'single_select',
                    buttonParamsJson: JSON.stringify({
                        title: '📂 Pilih Kategori',
                        sections: [
                            {
                                title: '🍔 Makanan',
                                rows: [
                                    { id: 'food_1', title: 'Burger',    description: 'Burger daging sapi premium' },
                                    { id: 'food_2', title: 'Pizza',     description: 'Pizza pepperoni large' },
                                    { id: 'food_3', title: 'Sushi',     description: 'Sushi salmon set' },
                                ]
                            },
                            {
                                title: '🥤 Minuman',
                                rows: [
                                    { id: 'drink_1', title: 'Kopi', description: 'Kopi arabica single origin' },
                                    { id: 'drink_2', title: 'Teh',  description: 'Teh hijau organik' },
                                    { id: 'drink_3', title: 'Jus',  description: 'Jus jeruk segar' },
                                ]
                            },
                            {
                                title: '🍰 Dessert',
                                rows: [
                                    { id: 'dessert_1', title: 'Cheesecake', description: 'New York cheesecake' },
                                    { id: 'dessert_2', title: 'Brownies',   description: 'Chocolate fudge brownies' },
                                ]
                            },
                        ]
                    })
                }]
            });
        } catch {
            await ctx.reply({ text: '❌ Gagal mengirim list.' });
        }
    },

    interactive: async (ctx) => {
        try {
            await ctx.sendInteractive({
                text: '🚀 Pesan Interactive Lengkap',
                footer: 'Support multiple button types',
                quoted: ctx.msg,
                buttons: [
                    {
                        name: 'quick_reply',
                        buttonParamsJson: JSON.stringify({ display_text: '👋 Say Hello', id: 'qr_hello' })
                    },
                    {
                        name: 'cta_url',
                        buttonParamsJson: JSON.stringify({ display_text: '🌐 Buka Website', url: 'https://github.com/whiskeysockets/baileys' })
                    },
                    {
                        name: 'cta_copy',
                        buttonParamsJson: JSON.stringify({ display_text: '📋 Copy Text', copy_code: 'Ini teks yang akan dicopy!' })
                    },
                    {
                        name: 'single_select',
                        buttonParamsJson: JSON.stringify({
                            title: '📂 Menu Lainnya',
                            sections: [{
                                title: '⚙️ Settings',
                                rows: [
                                    { id: 'set_1', title: 'Profile',    description: 'Ubah profil' },
                                    { id: 'set_2', title: 'Notifikasi', description: 'Pengaturan notifikasi' },
                                    { id: 'set_3', title: 'Privasi',    description: 'Pengaturan privasi' },
                                ]
                            }]
                        })
                    },
                ]
            });
        } catch {
            await ctx.reply({ text: '❌ Gagal.' });
        }
    },

    media: async (ctx) => {
        try {
            await ctx.reply({ image: { url: 'https://picsum.photos/400/300' }, caption: '🖼️ Gambar dari URL' });
        } catch {
            await ctx.reply({ text: '❌ Gagal kirim media.' });
        }
    },

    medialokal: async (ctx) => {
        const imagePath = path.join(__dirname, '../../assets/logo.png');
        if (!fs.existsSync(imagePath)) {
            return ctx.reply({ text: '❌ File tidak ditemukan.\n\nBuat folder `assets/` dan taruh `logo.png` di dalamnya.' });
        }
        try {
            await ctx.reply({ image: fs.readFileSync(imagePath), caption: '🖼️ Gambar lokal dari project!' });
        } catch {
            await ctx.reply({ text: '❌ Gagal kirim media lokal.' });
        }
    },

    quoted: async (ctx) => {
        try {
            const r1 = await ctx.reply({ text: '📌 Reply pertama!' });
            const r2 = await ctx.sock.sendMessage(ctx.sender, { text: '📌 Reply kedua (quoted reply pertama)' }, { quoted: r1 });
            await ctx.sock.sendMessage(ctx.sender, { text: '📌 Reply ketiga (quoted reply kedua)' }, { quoted: r2 });
        } catch {
            await ctx.reply({ text: '❌ Gagal kirim quoted.' });
        }
    },

    teruskan: async (ctx) => {
        try {
            const msg1 = await ctx.send({ text: '📨 Pesan asli' });
            await ctx.sock.sendMessage(ctx.sender, { forward: { key: msg1.key, message: msg1.message } });
            await ctx.send({ text: '✅ Pesan diteruskan!' });
        } catch {
            await ctx.reply({ text: '❌ Gagal meneruskan pesan.' });
        }
    },

    buttonimage: async (ctx) => {
        try {
            await ctx.sendButtonWithImage({
                text: '🖼️ Button dengan gambar',
                footer: 'WhatsApp Bot',
                imageUrl: 'https://picsum.photos/400/200',
                quoted: ctx.msg,
                buttons: [
                    { id: 'like',  text: '❤️ Suka' },
                    { id: 'share', text: '📤 Share' },
                ]
            });
        } catch {
            await ctx.reply({ text: '❌ Gagal.' });
        }
    },

    buttoncall: async (ctx) => {
        try {
            await ctx.sendInteractive({
                text: '📞 Hubungi kami melalui:',
                footer: 'WhatsApp Bot',
                quoted: ctx.msg,
                buttons: [{
                    name: 'cta_call',
                    buttonParamsJson: JSON.stringify({ display_text: '📱 Telepon Sekarang', phone_number: '+6281234567890' })
                }]
            });
        } catch {
            await ctx.reply({ text: '❌ Gagal.' });
        }
    },
};

module.exports = interactiveCommands;
