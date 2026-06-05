const fs = require('fs');
const path = require('path');
const config = require('../config');

const handler = async (ctx) => {
    const { command } = ctx

    switch (command.name) {

        case 'button':
            await ctx.sendButtons({
                text: '🎛️ Silakan pilih salah satu:',
                footer: 'WhatsApp Bot',
                quoted: ctx.msg,
                buttons: [
                    { id: 'btn_1', text: '1️⃣  Opsi Pertama' },
                    { id: 'btn_2', text: '2️⃣  Opsi Kedua' },
                    { id: 'btn_3', text: '3️⃣  Opsi Ketiga' },
                ]
            });
            break;

        case 'btn_1': await ctx.reply({ text: '✅ Kamu pilih *Opsi Pertama*!' }); break;
        case 'btn_2': await ctx.reply({ text: '✅ Kamu pilih *Opsi Kedua*!' }); break;
        case 'btn_3': await ctx.reply({ text: '✅ Kamu pilih *Opsi Ketiga*!' }); break;

        case 'list':
            await ctx.sendInteractive({
                text: '📋 Pilih item dari menu ini:',
                footer: 'WhatsApp Bot Menu',
                quoted: ctx.msg,
                buttons: [
                    {
                        name: 'single_select',
                        buttonParamsJson: JSON.stringify({
                            title: '📂 Buka Menu',
                            sections: [
                                {
                                    title: '🍔 Makanan',
                                    rows: [
                                        { id: 'food_1', title: 'Burger', description: 'Burger daging sapi premium' },
                                        { id: 'food_2', title: 'Pizza', description: 'Pizza pepperoni large' },
                                        { id: 'food_3', title: 'Sushi', description: 'Sushi salmon set' },
                                    ]
                                },
                                {
                                    title: '🥤 Minuman',
                                    rows: [
                                        { id: 'drink_1', title: 'Kopi', description: 'Kopi arabica single origin' },
                                        { id: 'drink_2', title: 'Teh', description: 'Teh hijau organik' },
                                        { id: 'drink_3', title: 'Jus', description: 'Jus jeruk segar' },
                                    ]
                                },
                                {
                                    title: '🍰 Dessert',
                                    rows: [
                                        { id: 'dessert_1', title: 'Cheesecake', description: 'New York cheesecake' },
                                        { id: 'dessert_2', title: 'Brownies', description: 'Chocolate fudge brownies' },
                                    ]
                                },
                            ]
                        })
                    }
                ]
            });
            break;

        case 'interactive':
            await ctx.sendInteractive({
                text: '🚀 Pilih aksi:',
                footer: 'WhatsApp Bot',
                quoted: ctx.msg,
                buttons: [
                    { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '👋 Halo Bot', id: 'qr_hello' }) },
                    { name: 'cta_url', buttonParamsJson: JSON.stringify({ display_text: '🌐 Buka GitHub', url: 'https://github.com/whiskeysockets/baileys' }) },
                    { name: 'cta_copy', buttonParamsJson: JSON.stringify({ display_text: '📋 Copy Kode', copy_code: 'KODE-PROMO-2025' }) },
                ]
            });
            break;
        case 'qr_hello': await ctx.reply({ text: '👋 Halo juga! Ada yang bisa saya bantu?' }); break;

        case 'media':
            await ctx.reply({ image: { url: 'https://picsum.photos/400/300' }, caption: '🖼️ Gambar dari internet' });
            break;

        case 'medialokal':
            const imagePath = path.join(__dirname, '../media/logo.png');
            if (!fs.existsSync(imagePath)) return ctx.reply({ text: '❌ File tidak ditemukan.\n\nBuat folder `assets/` dan taruh `logo.png`.' });
            await ctx.reply({ image: fs.readFileSync(imagePath), caption: '🖼️ Gambar lokal dari assets!' });
            break;

        case 'buttonimage':
            const imgPath = path.join(__dirname, '../media/logo.png');
            if (!fs.existsSync(imgPath)) return ctx.reply({ text: '❌ File logo.png tidak ada di folder assets.' });
            const base64Image = fs.readFileSync(imgPath).toString('base64');
            await ctx.sendButtonWithImage({
                text: '🖼️ Button dengan gambar!',
                footer: 'WhatsApp Bot',
                imageUrl: `data:image/png;base64,${base64Image}`,
                quoted: ctx.msg,
                buttons: [
                    { id: 'like', text: '❤️ Suka' },
                    { id: 'share', text: '📤 Share' },
                ]
            });
            break;
        case 'like': await ctx.react('❤️'); break;
        case 'share': await ctx.reply({ text: '📤 Makasih udah mau share!' }); break;

        case 'buttoncall':
            await ctx.sendInteractive({
                text: '📞 Hubungi kami:',
                footer: 'Customer Service',
                quoted: ctx.msg,
                buttons: [{ name: 'cta_call', buttonParamsJson: JSON.stringify({ display_text: '📱 Telepon Sekarang', phone_number: '+6281234567890' }) }

                ]
            });
            break;

    }
};


module.exports = handler;