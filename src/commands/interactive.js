const fs   = require('fs');
const path = require('path');

// ═══════════════════════════════════════════════════════════
//  INTERACTIVE COMMANDS
//  Semua command yang mengirim button, list, atau pesan kaya
// ═══════════════════════════════════════════════════════════

const interactiveCommands = {

    // ─────────────────────────────────────────────
    // !button → kirim 3 tombol pilihan
    // ─────────────────────────────────────────────
    button: async (ctx) => {
        await ctx.sendButtons({
            text: '🎛️ Silakan pilih salah satu:',
            footer: 'WhatsApp Bot',
            quoted: ctx.msg,
            buttons: [
                { id: 'btn_1', text: '1️⃣  Opsi Pertama' },
                { id: 'btn_2', text: '2️⃣  Opsi Kedua'  },
                { id: 'btn_3', text: '3️⃣  Opsi Ketiga' },
            ]
        });
    },

    // ─────────────────────────────────────────────
    // Response saat user klik tombol di atas
    // id harus sama persis dengan id button-nya
    // ─────────────────────────────────────────────
    btn_1: async (ctx) => { await ctx.reply({ text: '✅ Kamu pilih *Opsi Pertama*!' }); },
    btn_2: async (ctx) => { await ctx.reply({ text: '✅ Kamu pilih *Opsi Kedua*!'  }); },
    btn_3: async (ctx) => { await ctx.reply({ text: '✅ Kamu pilih *Opsi Ketiga*!' }); },

    // ─────────────────────────────────────────────
    // !list → kirim daftar menu makanan & minuman
    // ─────────────────────────────────────────────
    list: async (ctx) => {
        await ctx.sendList({
            text: '📋 Pilih item dari menu di bawah:',
            footer: 'WhatsApp Bot Menu',
            buttonTitle: '📂 Buka Menu',
            quoted: ctx.msg,
            sections: [
                {
                    title: '🍔 Makanan',
                    rows: [
                        { id: 'food_1', title: 'Burger',    description: 'Burger daging sapi premium' },
                        { id: 'food_2', title: 'Pizza',     description: 'Pizza pepperoni large'      },
                        { id: 'food_3', title: 'Sushi',     description: 'Sushi salmon set'           },
                    ]
                },
                {
                    title: '🥤 Minuman',
                    rows: [
                        { id: 'drink_1', title: 'Kopi', description: 'Kopi arabica single origin' },
                        { id: 'drink_2', title: 'Teh',  description: 'Teh hijau organik'          },
                        { id: 'drink_3', title: 'Jus',  description: 'Jus jeruk segar'            },
                    ]
                },
                {
                    title: '🍰 Dessert',
                    rows: [
                        { id: 'dessert_1', title: 'Cheesecake', description: 'New York cheesecake'      },
                        { id: 'dessert_2', title: 'Brownies',   description: 'Chocolate fudge brownies' },
                    ]
                },
            ]
        });
    },

    // ─────────────────────────────────────────────
    // Response saat user pilih item dari list
    // ─────────────────────────────────────────────
    food_1:    async (ctx) => { await ctx.reply({ text: '🍔 Kamu pesan *Burger*!\nHarga: Rp 45.000' }); },
    food_2:    async (ctx) => { await ctx.reply({ text: '🍕 Kamu pesan *Pizza*!\nHarga: Rp 75.000' }); },
    food_3:    async (ctx) => { await ctx.reply({ text: '🍣 Kamu pesan *Sushi*!\nHarga: Rp 95.000' }); },
    drink_1:   async (ctx) => { await ctx.reply({ text: '☕ Kamu pesan *Kopi*!\nHarga: Rp 25.000' }); },
    drink_2:   async (ctx) => { await ctx.reply({ text: '🍵 Kamu pesan *Teh*!\nHarga: Rp 15.000'  }); },
    drink_3:   async (ctx) => { await ctx.reply({ text: '🍊 Kamu pesan *Jus*!\nHarga: Rp 20.000'  }); },
    dessert_1: async (ctx) => { await ctx.reply({ text: '🍰 Kamu pesan *Cheesecake*!\nHarga: Rp 55.000' }); },
    dessert_2: async (ctx) => { await ctx.reply({ text: '🍫 Kamu pesan *Brownies*!\nHarga: Rp 35.000'  }); },

    // ─────────────────────────────────────────────
    // !interactive → gabungan semua tipe tombol
    // ─────────────────────────────────────────────
    interactive: async (ctx) => {
        await ctx.sendInteractive({
            text: '🚀 Pesan Interactive — pilih aksi:',
            footer: 'WhatsApp Bot',
            quoted: ctx.msg,
            buttons: [
                {
                    name: 'quick_reply',
                    buttonParamsJson: JSON.stringify({ display_text: '👋 Halo Bot', id: 'qr_hello' })
                },
                {
                    name: 'cta_url',
                    buttonParamsJson: JSON.stringify({ display_text: '🌐 Buka GitHub', url: 'https://github.com/whiskeysockets/baileys' })
                },
                {
                    name: 'cta_copy',
                    buttonParamsJson: JSON.stringify({ display_text: '📋 Copy Kode', copy_code: 'KODE-PROMO-2025' })
                },
            ]
        });
    },

    // Response dari tombol quick_reply di atas
    qr_hello: async (ctx) => { await ctx.reply({ text: '👋 Halo juga! Ada yang bisa saya bantu?' }); },

    // ─────────────────────────────────────────────
    // !media → kirim gambar dari URL
    // ─────────────────────────────────────────────
    media: async (ctx) => {
        await ctx.reply({
            image: { url: 'https://picsum.photos/400/300' },
            caption: '🖼️ Gambar dari internet'
        });
    },

    // ─────────────────────────────────────────────
    // !medialokal → kirim gambar dari folder assets/
    // ─────────────────────────────────────────────
    medialokal: async (ctx) => {
        const imagePath = path.join(__dirname, '../../assets/logo.png');
        if (!fs.existsSync(imagePath)) {
            return ctx.reply({ text: '❌ File tidak ditemukan.\n\nBuat folder `assets/` dan taruh `logo.png` di dalamnya.' });
        }
        await ctx.reply({
            image: fs.readFileSync(imagePath),
            caption: '🖼️ Gambar lokal dari folder assets!'
        });
    },

    // ─────────────────────────────────────────────
    // !buttonimage → button dengan gambar header
    // ─────────────────────────────────────────────
    buttonimage: async (ctx) => {
        const imagePath = path.join(__dirname, '../../assets/logo.png');
        if (!fs.existsSync(imagePath)) {
            return ctx.reply({ text: '❌ File logo.png tidak ada di folder assets.' });
        }

        // Baca gambar dan konversi ke base64
        const base64Image = fs.readFileSync(imagePath).toString('base64');

        await ctx.sendButtonWithImage({
            text: '🖼️ Button dengan gambar!',
            footer: 'WhatsApp Bot',
            imageUrl: `data:image/png;base64,${base64Image}`,
            quoted: ctx.msg,
            buttons: [
                { id: 'like',  text: '❤️ Suka'  },
                { id: 'share', text: '📤 Share' },
            ]
        });
    },

    // Response dari button di atas
    like:  async (ctx) => { await ctx.react('❤️'); },
    share: async (ctx) => { await ctx.reply({ text: '📤 Makasih udah mau share!' }); },

    // ─────────────────────────────────────────────
    // !buttoncall → tombol telepon
    // ─────────────────────────────────────────────
    buttoncall: async (ctx) => {
        await ctx.sendInteractive({
            text: '📞 Butuh bantuan? Hubungi kami:',
            footer: 'Customer Service',
            quoted: ctx.msg,
            buttons: [{
                name: 'cta_call',
                buttonParamsJson: JSON.stringify({
                    display_text: '📱 Telepon Sekarang',
                    phone_number: '+6281234567890'
                })
            }]
        });
    },
};

module.exports = interactiveCommands;
