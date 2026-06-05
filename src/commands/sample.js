'use strict';

/**
 * sample.js — File referensi semua jenis pesan yang didukung bot
 *
 * File ini berisi contoh lengkap berbagai tipe pengiriman pesan.
 * Gunakan sebagai referensi saat membuat command baru di file lain.
 *
 * Cara pakai:
 *   Semua contoh di sini bisa langsung dicopy ke file command lain.
 *   Cukup salin case yang dibutuhkan, lalu sesuaikan isinya.
 *
 * Import yang tersedia untuk dipakai di file command lain:
 *
 *   const config = require('../config');
 *     → Akses semua konfigurasi: config.prefix, config.botName, config.footerTxt, dll
 *
 *   const { getImage } = require('../utils/helper');
 *     → getImage()         = ambil logo.png sebagai Buffer (default)
 *     → getImage('nama')   = ambil gambar lain yang sudah didaftarkan di MEDIA
 *
 *   const { delay } = require('../utils/helper');
 *     → await delay(1000)  = jeda 1 detik
 *
 *   const { formatUptime } = require('../utils/helper');
 *     → formatUptime(process.uptime()) = '1 jam 2 menit 3 detik'
 *
 *   const { formatJid } = require('../utils/helper');
 *     → formatJid('08xx')  = '628xx@s.whatsapp.net'
 *
 *   const { formatBytes } = require('../utils/helper');
 *     → formatBytes(1024)  = '1 KB'
 *
 *   const { randomString } = require('../utils/helper');
 *     → randomString(8)    = string acak 8 karakter
 *
 *   const { getDevice } = require('@whiskeysockets/baileys');
 *     → getDevice(msg.key.id) = deteksi perangkat pengirim (android/ios/web)
 */


const config = require('../config');
const { getImage, delay, formatUptime } = require('../utils/helper');

const handler = async (m) => {
    const { command, pushname, sender, senderNumber, isOwner, isSuperOwner, isGroup } = m;
    const p = config.prefix;

    switch (command.name) {

        // ══════════════════════════════════════════════════════
        //  TEKS BIASA
        // ══════════════════════════════════════════════════════

        // Balas pesan dengan quoted ke pesan pengirim
        case 'balas':
            await m.reply({ text: '👋 Ini balasan dengan quoted!' });
            break;

        // Kirim pesan tanpa quoted
        case 'kirim':
            await m.send({ text: '📨 Ini pesan tanpa quoted.' });
            break;

        // Balas dengan fake quoted (tampilan forwarded)
        case 'fakequoted':
            await m.replyFake({ text: '📌 Ini pesan dengan fake quoted.' });
            break;

        // ══════════════════════════════════════════════════════
        //  REAKSI EMOJI
        // ══════════════════════════════════════════════════════

        // React emoji ke pesan — argumen opsional, default 👍
        // Contoh: !react 🔥
        case 'react':
            await m.react(command.args[0] || '👍');
            break;

        // ══════════════════════════════════════════════════════
        //  GAMBAR
        // ══════════════════════════════════════════════════════

        // Kirim gambar dari URL
        case 'media':
            await m.reply({
                image: { url: 'https://picsum.photos/400/300' },
                caption: '🖼️ Gambar dari internet'
            });
            break;

        // Kirim gambar dari file lokal (src/media/)
        // Tambah gambar baru di src/utils/helper.js bagian MEDIA
        case 'medialokal':
            await m.send({
                image: getImage(),          // getImage() = logo (default)
                caption: '🖼️ Gambar lokal!'
                // getImage('nama') untuk gambar lain yang sudah didaftarkan
            });
            break;

        // ══════════════════════════════════════════════════════
        //  VIDEO
        // ══════════════════════════════════════════════════════

        // Kirim video dari URL
        case 'video':
            await m.reply({
                video: { url: 'https://www.w3schools.com/html/mov_bbb.mp4' },
                caption: '🎥 Video contoh',
                gifPlayback: false  // true = tampil sebagai GIF (loop, tanpa kontrol)
            });
            break;

        // Kirim GIF dari URL
        case 'gif':
            await m.reply({
                video: { url: 'https://media.giphy.com/media/3oEjI6SIIHBdRxXI40/giphy.mp4' },
                gifPlayback: true   // tampil sebagai GIF
            });
            break;

        // ══════════════════════════════════════════════════════
        //  AUDIO
        // ══════════════════════════════════════════════════════

        // Kirim audio biasa (tampil sebagai file audio)
        case 'audio':
            await m.reply({
                audio: { url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
                mimetype: 'audio/mp4'
            });
            break;

        // Kirim audio sebagai voice note (tampil seperti pesan suara)
        case 'voice':
            await m.reply({
                audio: { url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
                mimetype: 'audio/ogg; codecs=opus',
                ptt: true   // ptt = push to talk = voice note
            });
            break;

        // ══════════════════════════════════════════════════════
        //  DOKUMEN / FILE
        // ══════════════════════════════════════════════════════

        // Kirim dokumen dari URL
        case 'dokumen':
            await m.reply({
                document: { url: 'https://www.w3.org/WAI/WCAG21/wcag-2.1.pdf' },
                mimetype: 'application/pdf',
                fileName: 'contoh-dokumen.pdf',  // nama file yang tampil
                caption: '📄 Ini contoh dokumen PDF'
            });
            break;

        // ══════════════════════════════════════════════════════
        //  LOKASI
        // ══════════════════════════════════════════════════════

        // Kirim lokasi
        case 'location':
            await m.reply({
                location: {
                    degreesLatitude: -6.1754,
                    degreesLongitude: 106.8272,
                    name: 'Monumen Nasional',
                    address: 'Jakarta, Indonesia'
                }
            });
            break;

        // ══════════════════════════════════════════════════════
        //  KONTAK
        // ══════════════════════════════════════════════════════

        // Kirim kontak (vCard)
        case 'contact':
            await m.reply({
                contacts: {
                    displayName: 'Test Contact',
                    contacts: [{
                        vcard: 'BEGIN:VCARD\nVERSION:3.0\nFN:Test Contact\nTEL;type=CELL;type=VOICE;waid=6281234567890:+62 812-3456-7890\nEND:VCARD'
                    }]
                }
            });
            break;

        // ══════════════════════════════════════════════════════
        //  POLL
        // ══════════════════════════════════════════════════════

        // Kirim poll/voting
        case 'poll':
            await m.reply({
                poll: {
                    name: '🗳️ Bahasa favorit kamu?',
                    values: ['Node.js', 'Python', 'Golang', 'Rust'],
                    selectableCount: 1,         // 1 = pilih 1 saja, 0 = pilih bebas
                    toAnnouncementGroup: false
                }
            });
            break;

        // ══════════════════════════════════════════════════════
        //  MENTION USER
        // ══════════════════════════════════════════════════════

        // Mention user di pesan
        case 'mention':
            await m.reply({
                text: `Halo @${senderNumber}! 👋`,
                mentions: [sender]  // array JID yang di-mention
            });
            break;

        // ══════════════════════════════════════════════════════
        //  BUTTON LAMA (sendButtons)
        // ══════════════════════════════════════════════════════

        // Button klasik — maksimal 3 button
        case 'button':
            await m.sendButtons({
                text: '🎛️ Silakan pilih salah satu:',
                footer: 'WhatsApp Bot',
                quoted: m.msg,
                buttons: [
                    { id: 'btn_1', text: '1️⃣ Opsi Pertama' },
                    { id: 'btn_2', text: '2️⃣ Opsi Kedua' },
                    { id: 'btn_3', text: '3️⃣ Opsi Ketiga' },
                ]
            });
            break;

        // Handler respons button lama
        case 'btn_1': await m.reply({ text: '✅ Kamu pilih *Opsi Pertama*!' }); break;
        case 'btn_2': await m.reply({ text: '✅ Kamu pilih *Opsi Kedua*!' }); break;
        case 'btn_3': await m.reply({ text: '✅ Kamu pilih *Opsi Ketiga*!' }); break;

        // ══════════════════════════════════════════════════════
        //  BUTTON INTERAKTIF (sendInteractive) — Tipe: quick_reply
        // ══════════════════════════════════════════════════════

        // quick_reply — saat ditekan, mengirim teks `id` ke bot secara otomatis
        case 'interactive':
            await m.sendInteractive({
                text: '🚀 Pilih aksi:',
                footer: config.footerTxt,
                quoted: m.msg,
                buttons: [
                    { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '👋 Halo Bot', id: 'qr_hello' }) },
                    { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '📊 Cek Status', id: 'qr_status' }) },
                    { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '❓ Bantuan', id: `${p}menu` }) },
                ]
            });
            break;

        // Handler respons quick_reply
        case 'qr_hello':  await m.reply({ text: `👋 Halo, ${pushname}! Ada yang bisa dibantu?` }); break;
        case 'qr_status': await m.reply({ text: `✅ Bot aktif!\nUptime: ${formatUptime(process.uptime())}` }); break;

        // ══════════════════════════════════════════════════════
        //  BUTTON INTERAKTIF — Tipe: cta_url
        // ══════════════════════════════════════════════════════

        // cta_url — buka link di browser saat ditekan
        case 'buttonurl':
            await m.sendInteractive({
                text: '🌐 Kunjungi link berikut:',
                footer: config.footerTxt,
                quoted: m.msg,
                buttons: [
                    { name: 'cta_url', buttonParamsJson: JSON.stringify({ display_text: '🐙 GitHub', url: 'https://github.com/harissfx/basebot-wa' }) },
                    { name: 'cta_url', buttonParamsJson: JSON.stringify({ display_text: '📺 YouTube', url: 'https://youtube.com' }) },
                ]
            });
            break;

        // ══════════════════════════════════════════════════════
        //  BUTTON INTERAKTIF — Tipe: cta_call
        // ══════════════════════════════════════════════════════

        // cta_call — buka dialog telepon saat ditekan
        case 'buttoncall':
            await m.sendInteractive({
                text: '📞 Hubungi kami:',
                footer: 'Customer Service',
                quoted: m.msg,
                buttons: [
                    { name: 'cta_call', buttonParamsJson: JSON.stringify({ display_text: '📱 Telepon Owner', phone_number: [].concat(config.superOwner)[0] }) },
                ]
            });
            break;

        // ══════════════════════════════════════════════════════
        //  BUTTON INTERAKTIF — Tipe: cta_copy
        // ══════════════════════════════════════════════════════

        // cta_copy — copy teks ke clipboard saat ditekan
        case 'buttoncopy':
            await m.sendInteractive({
                text: '📋 Klik tombol untuk copy:',
                footer: config.footerTxt,
                quoted: m.msg,
                buttons: [
                    { name: 'cta_copy', buttonParamsJson: JSON.stringify({ display_text: '📋 Copy Kode Promo', copy_code: 'HANZ2026' }) },
                    { name: 'cta_copy', buttonParamsJson: JSON.stringify({ display_text: '📋 Copy Nomor Owner', copy_code: [].concat(config.superOwner)[0] }) },
                ]
            });
            break;

        // ══════════════════════════════════════════════════════
        //  BUTTON INTERAKTIF — Tipe: single_select (dropdown/list)
        // ══════════════════════════════════════════════════════

        // single_select — dropdown dengan section dan baris pilihan
        // Saat dipilih, `id` baris dikirim sebagai pesan ke bot
        case 'list':
            await m.sendInteractive({
                text: '📋 Pilih item dari menu:',
                footer: config.footerTxt,
                quoted: m.msg,
                buttons: [{
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
                                ]
                            },
                        ]
                    })
                }]
            });
            break;

        // Handler respons single_select
        case 'food_1':  await m.reply({ text: '🍔 Kamu pilih *Burger*!' }); break;
        case 'food_2':  await m.reply({ text: '🍕 Kamu pilih *Pizza*!' }); break;
        case 'food_3':  await m.reply({ text: '🍣 Kamu pilih *Sushi*!' }); break;
        case 'drink_1': await m.reply({ text: '☕ Kamu pilih *Kopi*!' }); break;
        case 'drink_2': await m.reply({ text: '🍵 Kamu pilih *Teh*!' }); break;

        // ══════════════════════════════════════════════════════
        //  BUTTON INTERAKTIF — Campuran semua tipe
        // ══════════════════════════════════════════════════════

        // Kombinasi quick_reply + cta_url + cta_copy dalam satu pesan
        case 'buttonmix':
            await m.sendInteractive({
                text: `👋 Halo *${pushname}*!\n\nIni contoh button campuran berbagai tipe:`,
                footer: config.footerTxt,
                quoted: m.fakeOrder,
                contextInfo: {
                    mentionedJid: ['0@s.whatsapp.net'],
                    forwardingScore: 111,
                    isForwarded: true,
                },
                buttons: [
                    { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '👋 Balas Bot', id: 'qr_hello' }) },
                    { name: 'cta_url',     buttonParamsJson: JSON.stringify({ display_text: '🌐 GitHub', url: 'https://github.com/harissfx' }) },
                    { name: 'cta_copy',    buttonParamsJson: JSON.stringify({ display_text: '📋 Copy Nomor', copy_code: senderNumber }) },
                ]
            });
            break;

        // ══════════════════════════════════════════════════════
        //  BUTTON INTERAKTIF + GAMBAR LOKAL
        // ══════════════════════════════════════════════════════

        // sendInteractiveWithImage — button interaktif dengan gambar dari file lokal (Buffer)
        // Gunakan ini untuk gambar lokal, BUKAN sendButtonWithImage
        case 'buttonimage':
            await m.sendInteractiveWithImage({
                text: '🖼️ Button dengan gambar lokal!',
                footer: config.footerTxt,
                imageSource: getImage(),    // Buffer dari src/media/logo.png
                quoted: m.msg,
                buttons: [
                    { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '❤️ Suka', id: 'like' }) },
                    { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '📤 Share', id: 'share' }) },
                ]
            });
            break;

        // Handler respons buttonimage
        case 'like':  await m.react('❤️'); break;
        case 'share': await m.reply({ text: '📤 Makasih udah mau share!' }); break;

        // ══════════════════════════════════════════════════════
        //  BUTTON + GAMBAR VIA URL (sendButtonWithImage)
        // ══════════════════════════════════════════════════════

        // sendButtonWithImage — button lama dengan gambar dari URL
        // Berbeda dengan buttonimage di atas yang pakai gambar lokal
        case 'buttonimagurl':
            await m.sendButtonWithImage({
                text: '🖼️ Button dengan gambar dari URL!',
                footer: config.footerTxt,
                imageUrl: 'https://picsum.photos/400/300',  // harus URL, bukan Buffer
                quoted: m.msg,
                buttons: [
                    { id: 'btn_1', text: '1️⃣ Opsi Pertama' },
                    { id: 'btn_2', text: '2️⃣ Opsi Kedua' },
                ]
            });
            break;

        // ══════════════════════════════════════════════════════
        //  PAKAI ARGUMEN COMMAND
        // ══════════════════════════════════════════════════════

        // Contoh pakai command.args dan command.fullArgs
        // command.args   → array: ['halo', 'dunia']
        // command.fullArgs → string: 'halo dunia'
        // Contoh: !echo halo dunia
        case 'echo':
            if (!command.fullArgs) return m.reply({ text: `⚠️ Format: \`${p}echo <teks>\`` });
            await m.reply({ text: command.fullArgs });
            break;

        // Contoh ambil argumen satu per satu
        // Contoh: !hitung 10 20
        case 'hitung': {
            const [a, b] = command.args;
            if (!a || !b) return m.reply({ text: `⚠️ Format: \`${p}hitung <angka1> <angka2>\`` });
            const hasil = Number(a) + Number(b);
            await m.reply({ text: `🔢 ${a} + ${b} = *${hasil}*` });
            break;
        }

        // ══════════════════════════════════════════════════════
        //  CEK LEVEL AKSES
        // ══════════════════════════════════════════════════════

        // Contoh cek akses sebelum jalankan command
        case 'owneronly':
            if (!isOwner) return m.reply({ text: '❌ Khusus Owner!' });
            await m.reply({ text: '✅ Halo Owner!' });
            break;

        case 'superonly':
            if (!isSuperOwner) return m.reply({ text: '❌ Khusus Super Owner!' });
            await m.reply({ text: '✅ Halo Super Owner!' });
            break;

        case 'grouponly':
            if (!isGroup) return m.reply({ text: '❌ Command ini hanya untuk grup!' });
            await m.reply({ text: '✅ Halo anggota grup!' });
            break;

        // ══════════════════════════════════════════════════════
        //  DELAY / JEDA
        // ══════════════════════════════════════════════════════

        // Contoh kirim beberapa pesan dengan jeda
        case 'countdown':
            await m.reply({ text: '3️⃣' });
            await delay(1000);
            await m.send({ text: '2️⃣' });
            await delay(1000);
            await m.send({ text: '1️⃣' });
            await delay(1000);
            await m.send({ text: '🚀 *BLAST OFF!*' });
            break;
    }
};

module.exports = handler;