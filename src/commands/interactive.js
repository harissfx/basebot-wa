const fs = require('fs');
const path = require('path');
const config = require('../config');
const { getImage } = require('../utils/helper');s

const handler = async (m) => {
    const { command } = m

    switch (command.name) {

        case 'button':
            await m.sendButtons({
                text: '🎛️ Silakan pilih salah satu:',
                footer: 'WhatsApp Bot',
                quoted: m.msg,
                buttons: [
                    { id: 'btn_1', text: '1️⃣  Opsi Pertama' },
                    { id: 'btn_2', text: '2️⃣  Opsi Kedua' },
                    { id: 'btn_3', text: '3️⃣  Opsi Ketiga' },
                ]
            });
            break;

        case 'btn_1': await m.reply({ text: '✅ Kamu pilih *Opsi Pertama*!' }); break;
        case 'btn_2': await m.reply({ text: '✅ Kamu pilih *Opsi Kedua*!' }); break;
        case 'btn_3': await m.reply({ text: '✅ Kamu pilih *Opsi Ketiga*!' }); break;

        case 'list':
            await m.sendInteractive({
                text: '📋 Pilih item dari menu ini:',
                footer: 'WhatsApp Bot Menu',
                quoted: m.msg,
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
            await m.sendInteractive({
                text: '🚀 Pilih aksi:',
                footer: 'WhatsApp Bot',
                quoted: m.msg,
                buttons: [
                    { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '👋 Halo Bot', id: 'qr_hello' }) },
                    { name: 'cta_url', buttonParamsJson: JSON.stringify({ display_text: '🌐 Buka GitHub', url: 'https://github.com/whiskeysockets/baileys' }) },
                    { name: 'cta_copy', buttonParamsJson: JSON.stringify({ display_text: '📋 Copy Kode', copy_code: 'KODE-PROMO-2025' }) },
                ]
            });
            break;
        case 'qr_hello': await m.reply({ text: '👋 Halo juga! Ada yang bisa saya bantu?' }); break;

        case 'media':
            await m.reply({ image: { url: 'https://picsum.photos/400/300' }, caption: '🖼️ Gambar dari internet' });
            break;

        case 'medialokal':
            await m.send({ image: getImage(), caption: '🖼️ Gambar lokal!' });
            break;

        case 'buttonimage':
            await m.sendButtonWithImage({
                text: '🖼️ Button dengan gambar!',
                footer: 'WhatsApp Bot',
                imageSource: getImage(),
                quoted: m.msg,
                buttons: [
                    { id: 'like', text: '❤️ Suka' },
                    { id: 'share', text: '📤 Share' },
                ]
            });
            break;
        case 'like': await m.react('❤️'); break;
        case 'share': await m.reply({ text: '📤 Makasih udah mau share!' }); break;

        case 'buttoncall':
            await m.sendInteractive({
                text: '📞 Hubungi kami:',
                footer: 'Customer Service',
                quoted: m.msg,
                buttons: [{ name: 'cta_call', buttonParamsJson: JSON.stringify({ display_text: '📱 Telepon Sekarang', phone_number: '+6281234567890' }) }

                ]
            });
            break;

        case 'location':
            await m.reply({
                location: { degreesLatitude: -6.1754, degreesLongitude: 106.8272, name: 'Monumen Nasional', address: 'Jakarta, Indonesia' }
            });
            break;

        case 'contact':
            await m.reply({
                contacts: {
                    displayName: 'Test Contact',
                    contacts: [{ vcard: 'BEGIN:VCARD\nVERSION:3.0\nFN:Test Contact\nTEL;type=CELL;type=VOICE;waid=6281234567890:+62 812-3456-7890\nEND:VCARD' }]
                }
            });
            break;

        case 'react':
            await m.react(command.args[0] || '👍');
            break;

        case 'poll':
            await m.reply({
                poll: { name: 'Polling Favorit', values: ['Node.js', 'Python', 'Golang', 'Rust'], selectableCount: 1, toAnnouncementGroup: false }
            });
            break;
    }
};


module.exports = handler;