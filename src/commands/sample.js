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
 *     → Akses semua konfigurasi: config.botName, config.footerTxt, dll
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
 *   const { getDevice } = require('baileys');
 *     → getDevice(msg.key.id) = deteksi perangkat pengirim (android/ios/web)
 *
 *   const mess = require('../config').mess;   (atau ambil dari m: const { mess } = m)
 *     → teks balasan guard, edit semua di src/config.js (bagian mess)
 *     → if (!isOwner) return m.reply(mess.owner);
 *     → if (!isGroup) return m.reply(mess.group);
 */


const config = require('../config');
const mess = config.mess;
const plugins = require('../utils/PluginLoader');
const path = require('path');
const { UploadCatbox } = require('../../lib/uploader');
const { getImage, delay, formatUptime } = require('../utils/helper');
const { generateWAMessageFromContent, proto, prepareWAMessageMedia } = require('baileys');


const handler = async (m) => {
    const { command, pushname, senderNumber, isOwner, isSuperOwner, isGroup, Hanz } = m;
    const p = m.prefix;

    const msg = m.msg;

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

        // Kirim gambar dari URL (ukuran kecil ~20-50KB, cocok untuk sample)
        // Catatan: m.reply media sekarang aman 
        case 'media':
            await m.reply({
                image: { url: 'https://picsum.photos/id/10/400/300.jpg' }, // fixed id, ~20-40KB
                caption: '🖼️ Gambar dari internet (sample kecil)'
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

        // Kirim video dari URL (sample pendek ~1MB, ~10 detik)
        case 'video':
            await m.reply({
                video: { url: 'https://www.w3schools.com/html/mov_bbb.mp4' }, // ~1MB
                caption: '🎥 Video contoh (sample pendek)',
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
                audio: { url: 'https://filesamples.com/samples/audio/mp3/sample1.mp3' },
                mimetype: 'audio/mpeg'
            });
            break;

        // Kirim audio sebagai voice note (tampil seperti pesan suara)
        case 'voice':
            await m.reply({
                audio: { url: 'https://filesamples.com/samples/audio/mp3/sample1.mp3' },
                mimetype: 'audio/ogg; codecs=opus',
                ptt: true   // ptt = push to talk = voice note
            });
            break;

        // ══════════════════════════════════════════════════════
        //  DOKUMEN / FILE
        // ══════════════════════════════════════════════════════

        // Kirim dokumen dari URL (PDF kecil)
        case 'dokumen':
            await m.reply({
                document: { url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' }, // ~13KB
                mimetype: 'application/pdf',
                fileName: 'contoh-dokumen.pdf',  // nama file yang tampil
                caption: '📄 Contoh dokumen PDF (sample kecil)'
            });
            break;

        // ══════════════════════════════════════════════════════
        //  LOKASI
        // ══════════════════════════════════════════════════════

        // Kirim lokasi
        case 'lokasi':
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
                mentions: [m.sender]  // array JID yang di-mention
            });
            break;

        // ══════════════════════════════════════════════════════
        //  BUTTON LAMA (sendButtons)
        // ══════════════════════════════════════════════════════

        // Button klasik — maksimal 3 button
        case 'button':
            await m.sendButtons({
                text: '🎛️ Silakan pilih salah satu:',
                footer: config.footerTxt,
                quoted: m.msg,
                buttons: [
                    { id: 'btn_1', text: '1️⃣ Opsi Pertama' },
                    { id: 'btn_2', text: '2️⃣ Opsi Kedua' },
                    { id: 'btn_3', text: '3️⃣ Opsi Ketiga' },
                ]
            });
            break;

        // Handler respons button lama
        // Handler callback tombol dari case 'button' di atas
        // id tombol = btn_1 / btn_2 / btn_3
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
        // Handler callback quick-reply dari case 'interactive'
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
                    { name: 'cta_url', buttonParamsJson: JSON.stringify({ display_text: '📺 YouTube', url: 'https://www.youtube.com/@HanzOfc69' }) },
                ]
            });
            break;

        case 'typing': {
            await Hanz.sendPresenceUpdate('composing', m.chat);
            await delay(2000);
            await Hanz.sendPresenceUpdate('paused', m.chat);
            await m.reply({ text: '⌨️ Ini contoh typing indicator!' });
        }
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
        //  BUTTON INTERAKTIF — Tipe: request_contact_info
        // ══════════════════════════════════════════════════════

        case 'requestcontact':
            {
            const bodyText = [
                'Hai ' + (pushname || '') + ',',
                '',
                'Selamat datang di *' + (config.botName || 'Layanan WhatsApp') + '*.',
            ].join('\n');

           
                const interactiveMsg = proto.Message.InteractiveMessage.fromObject({
                    body: { text: bodyText },
                    nativeFlowMessage: {
                        buttons: [{ name: 'request_contact_info' }],
                        messageParamsJson: '',
                    },
                });

                const waMsg = generateWAMessageFromContent(
                    m.chat,
                    proto.Message.fromObject({
                        messageContextInfo: {
                            deviceListMetadata: {},
                            deviceListMetadataVersion: 2,
                        },
                        interactiveMessage: interactiveMsg,
                    }),
                    { userJid: Hanz.user?.id, quoted: m.msg }
                );

                const additionalNodes = [
                    {
                        tag: 'biz',
                        attrs: {},
                        content: [
                            {
                                tag: 'interactive',
                                attrs: { type: 'native_flow', v: '1' },
                                content: [
                                    {
                                        tag: 'native_flow',
                                        attrs: { v: '9', name: 'request_contact_info' },
                                    },
                                ],
                            },
                        ],
                    },
                ];
                if (!m.isGroup) {
                    additionalNodes.push({ tag: 'bot', attrs: { biz_bot: '1' } });
                }

                await Hanz.relayMessage(m.chat, waMsg.message, {
                    messageId: waMsg.key.id,
                    additionalNodes,
                });
     
        }
            break;
        // ──────────────────────────────────────────────────────
        //  KONTAK (vCard) — versi dari config bot
        //  Kirim kartu kontak owner/bot menggunakan data di config.
        //  Contoh: !contact
        // ──────────────────────────────────────────────────────
        case 'contact': {
            try {
                const vcard = 'BEGIN:VCARD\n'
                    + 'VERSION:3.0\n'
                    + `FN:${config.botName || 'Hanz Ofc Bot'}\n`
                    + `ORG:${config.ownerName || 'Special Tester'};\n`
                    + `TEL;type=CELL;type=VOICE;waid=${config.superOwner}:+${config.superOwner}\n`
                    + 'END:VCARD';

                await m.send({
                    contacts: {
                        displayName: config.botName || 'Hanz Ofc Bot',
                        contacts: [{ vcard }]
                    }
                });
            } catch (err) {
                console.error('[testcontact] ERROR:', err);
                await m.reply({ text: '❌ Gagal kirim contact:\n' + (err?.message || String(err)) });
            }
        }
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
        // Handler callback list message (case 'list') — id = food_1..drink_2
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
                quoted: m.fakePay,
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
        // Handler callback dari productbutton (id: like / share)
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
                imageUrl: 'https://picsum.photos/400/300', 
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
        }
            break;

        // ══════════════════════════════════════════════════════
        //  CEK LEVEL AKSES
        // ══════════════════════════════════════════════════════

        // Contoh cek akses sebelum jalankan command
        case 'owneronly':
            if (!isOwner) return m.reply(mess.owner);
            await m.reply({ text: '✅ Halo Owner!' });
            break;

        // Hanya Super Owner yang boleh menjalankan command ini
        case 'superonly':
            if (!isSuperOwner) return m.reply(mess.superOwner);
            await m.reply({ text: '✅ Halo Super Owner!' });
            break;

        // Hanya bisa dijalankan di dalam grup
        case 'grouponly':
            if (!isGroup) return m.reply(mess.group);
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

        // ══════════════════════════════════════════════════════
        //  PRODUCT MESSAGE
        // ══════════════════════════════════════════════════════

        // Kirim tampilan produk (mirip katalog) tanpa button
        case 'product':
            await m.reply({
                productMessage: {
                    title: config.botName,
                    description: 'Deskripsi produk contoh',
                    thumbnail: getImage(),
                    productId: 'PROD001',
                    retailerId: 'RETAIL001',
                    url: 'https://github.com/harissfx/basebot-wa',
                    body: 'Isi body pesan produk',
                    footer: config.footerTxt,
                    priceAmount1000: 150000, 
                    currencyCode: 'IDR'
                }
            });
            break;

        // Product message + tombol quick_reply
        // Contoh: !productbutton
        case 'productbutton':
            await m.reply({
                productMessage: {
                    title: config.botName,
                    description: 'Deskripsi produk contoh',
                    thumbnail: getImage(),
                    productId: 'PROD002',
                    retailerId: 'RETAIL001',
                    url: 'https://github.com/harissfx/basebot-wa',
                    body: 'Produk dengan tombol',
                    footer: config.footerTxt,
                    priceAmount1000: 250000,
                    currencyCode: 'IDR',
                    buttons: [
                    { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '❤️ Suka', id: 'like' }) },
                    { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '📤 Share', id: 'share' }) },
                ]
                }
            });
            break;

        // Product message + dropdown (single_select)
        // Contoh: !productlist
        case 'productlist':
            await m.reply({
                productMessage: {
                    title: config.botName,
                    description: 'Deskripsi produk contoh',
                    thumbnail: getImage(),
                    productId: 'PROD003',
                    retailerId: 'RETAIL001',
                    url: 'https://github.com/harissfx/basebot-wa',
                    body: 'Produk dengan dropdown menu',
                    footer: config.footerTxt,
                    priceAmount1000: 350000,
                    currencyCode: 'IDR',
                    buttons: [{
                        name: 'single_select',
                        buttonParamsJson: JSON.stringify({
                            title: '『 Menu 』',
                            sections: [{
                                title: 'Pilih salah satu',
                                rows: [
                                    { id: 'allmenu', title: 'AllMenu', description: 'Lihat semua menu' }
                                ]
                            }]
                        })
                    }]
                }
            });
            break;

        // ══════════════════════════════════════════════════════
        //  ORDER MESSAGE
        // ══════════════════════════════════════════════════════

        // Order message (tampilan detail pesanan / invoice sederhana)
        // totalAmount1000: nilai dikali 1000 (25000000 = Rp25.000)
        // Contoh: !order
        case 'order':
            await m.reply({
                message: 'Detail pesanan contoh',
                orderTitle: config.botName,
                thumbnail: getImage(),
                totalAmount1000: 25000000,   // = Rp25.000
                totalCurrencyCode: 'IDR'
            });
            break;

        // ══════════════════════════════════════════════════════
        //  POLL RESULT (snapshot hasil polling, beda dari poll biasa)
        // ══════════════════════════════════════════════════════

        // Snapshot hasil polling (bukan poll yang bisa divote)
        // Berguna untuk menampilkan hasil sementara/final.
        // Contoh: !pollresult
        case 'pollresult':
            await m.reply({
                pollResultMessage: {
                    name: 'Hasil Polling Contoh',
                    options: [
                        { optionName: 'Opsi A', optionVoteCount: 12 },
                        { optionName: 'Opsi B', optionVoteCount: 8 }
                    ],
                }
            });
            break;
        // ──────────────────────────────────────────────────────
        //  POLL (versi alternatif / tester)
        //  Kirim polling sederhana. Beda dari case 'poll' di atas.
        //  Contoh: !poll
        // ──────────────────────────────────────────────────────
        case 'poll': {
                await m.send({
                    poll: {
                        name: 'Poll Test dari Special Tester',
                        values: ['Opsi A', 'Opsi B', 'Opsi C'],
                        selectableCount: 1
                    }
                });
            }
            break;
        
        // ══════════════════════════════════════════════════════
        //  REQUEST PAYMENT
        // ══════════════════════════════════════════════════════

        // Request payment (minta pembayaran)
        // Contoh: !payment
        case 'payment':
    await m.reply({
        requestPaymentMessage: {
            amount: 999999000,
            currency: 'IDR',
            note: 'Contoh permintaan pembayaran',
            background: {
                id: '100',
                fileLength: '0',
                width: 1000,
                height: 1000,
                mimetype: 'image/webp',
                placeholderArgb: 0xFF0A84FF,
                textArgb:       0xFFFFFFFF,
                subtextArgb:    0xFFB0D4FF
            }
        }
    });
    break;

        // ══════════════════════════════════════════════════════
        //  EVENT MESSAGE
        // ══════════════════════════════════════════════════════

        // Event message (undangan acara dengan waktu & lokasi)
        // Contoh: !event
        case 'event':
            await m.reply({
                event: {
                    name: 'Contoh Event',
                    description: 'Deskripsi event contoh',
                    startDate: new Date(Date.now() + 60 * 60 * 1000),   // 1 jam lagi
                    endDate: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 jam lagi
                    isCancelled: false,
                    extraGuestsAllowed: true,
                    //call: 'audio', //call: 'audio',
                    location: {
                        name: 'Teel aviv',
                        degreesLatitude: -6.2,
                        degreesLongitude: 106.8
                    }
                }
            });
            break;

        // ══════════════════════════════════════════════════════
        //  ALBUM (kirim beberapa gambar sekaligus jadi 1 album)
        // ══════════════════════════════════════════════════════

        // Album: kirim beberapa media sekaligus dalam satu pesan
        // Contoh: !album
        case 'album':
            await m.reply({
                albumMessage: [
                    { image: { url: 'https://picsum.photos/400/300' } },
                    { image: { url: 'https://picsum.photos/401/300' } },
                    { image: { url: 'https://picsum.photos/400/300' } },
                    { image: { url: 'https://picsum.photos/401/300' } }
                ]
            });
            break;

        // ══════════════════════════════════════════════════════
        //  GROUP LABEL (hanya bisa dipakai di grup)
        // ══════════════════════════════════════════════════════

        // Label anggota grup (tampil di samping nama di grup)
        // Hanya relevan di dalam grup.
        // Contoh: !grouplabel
        case 'grouplabel':
            if (!isGroup) return m.reply(mess.group);
            await m.reply({ groupLabel: { labelText: 'Admin' } });
            break;
        // ──────────────────────────────────────────────────────
        //  CTA BUTTONS (native flow)
        //  Kumpulan tombol CTA: quick reply, URL, call, copy, reminder.
        //  Cocok untuk demo semua jenis tombol interaktif sekaligus.
        //  Contoh: !ctabuttons
        // ──────────────────────────────────────────────────────
        case 'ctabuttons': {
            try {
                await m.sendInteractive({
                    text: 'Contoh semua jenis *CTA native flow button* (url, call, copy, reminder, dll).',
                    footer: config.footerTxt || '© Special Tester',
                    buttons: [
                        { name: 'cta_reply', buttonParamsJson: JSON.stringify({ display_text: 'Quick Reply', id: 'specialmenu' }) },
                        { name: 'cta_url', buttonParamsJson: JSON.stringify({ display_text: 'Buka URL', url: 'https://github.com/harissfx/basebot-wa', merchant_url: 'https://github.com/harissfx/basebot-wa' }) },
                        { name: 'cta_call', buttonParamsJson: JSON.stringify({ display_text: 'Telepon', id: 'message' }) },
                        { name: 'cta_copy', buttonParamsJson: JSON.stringify({ display_text: 'Salin Kode', id: '123456789', copy_code: 'HANZ-BOT' }) },
                        { name: 'cta_reminder', buttonParamsJson: JSON.stringify({ display_text: 'Ingatkan', id: 'message' }) },
                        { name: 'cta_cancel_reminder', buttonParamsJson: JSON.stringify({ display_text: 'Batal Ingatkan', id: 'message' }) }
                    ],
                    quoted: m.msg
                });
            } catch (err) {
                console.error('[testctabuttons] ERROR:', err);
                await m.reply({ text: '❌ Gagal kirim CTA buttons:\n' + (err?.message || String(err)) });
            }
        }
            break;

        // ══════════════════════════════════════════════════════
        //  REACT KE PESAN TERTENTU (pakai key, bukan quoted)
        // ══════════════════════════════════════════════════════

        // Beda dari case 'react' di atas: ini react ke pesan yang baru
        // dikirim bot sendiri, dengan cara simpan `key` dulu.
        case 'reactsent': {
            const sent = await m.send({ text: '⏳ Pesan ini akan di-react otomatis...' });
            await m.send({ react: { text: '💖', key: sent.key } });
        }
            break;

        // ══════════════════════════════════════════════════════
        //  PIN PESAN
        // ══════════════════════════════════════════════════════

        // Pin pesan yang baru dikirim bot (durasi dalam detik).
        // type: 1 = pin, time: detik (86400 = 24 jam)
        // Contoh: !pin
        case 'pin': {
            const sent = await m.send({ text: '📌 Pesan ini akan di-pin (24 jam)...' });
            await m.send({ pin: { type: 1, time: 86400, key: sent.key } });
        }
            break;

        // ══════════════════════════════════════════════════════
        //  FORWARD PESAN
        // ══════════════════════════════════════════════════════

        // Forward ulang pesan yang mengirim command ini
        // Forward pesan (tampilan forwarded)
        
        //forward sekali
           case 'forward1':
    await m.send({
        text: 'test',
        contextInfo: {
            forwardingScore: 1,
            isForwarded: true,
        },
    });
    break;

    //forward berkali kali
        case 'forward2':
    await m.send({
        text: 'test',
        contextInfo: {
            forwardingScore: 999,
            isForwarded: true,
        },
    });
    break;

        // ══════════════════════════════════════════════════════
        //  EDIT PESAN
        // ══════════════════════════════════════════════════════

        // Edit pesan yang baru dikirim bot
        // Contoh: !edit
        case 'edit': {
            const sent = await m.send({ text: 'Teks asli sebelum di-edit...' });
            await delay(1500);
            await m.send({ text: '✏️ Teks ini sudah di-*edit*.', edit: sent.key });
        }
            break;

        // ══════════════════════════════════════════════════════
        //  HAPUS PESAN (delete for everyone)
        // ══════════════════════════════════════════════════════

        // Hapus pesan yang baru dikirim bot (revoke)
        // Contoh: !delete
        case 'delete': {
            const sent = await m.send({ text: '🗑️ Pesan ini akan dihapus dalam 3 detik...' });
            await delay(3000);
            await m.send({ delete: sent.key });
        }
            break;
        // ──────────────────────────────────────────────────────
        //  TESTER: Semua jenis interactive button sekaligus
        // ──────────────────────────────────────────────────────
        case 'interactiveall': {
    try {
        await m.sendInteractive({
            text: 'Contoh SEMUA jenis native flow button sekaligus: single_select, quick_reply, url, call, copy, reminder, cancel_reminder, address, location.',
            footer: config.footerTxt || '© Special Tester',
            buttons: [
                {
                    name: 'single_select',
                    buttonParamsJson: JSON.stringify({
                        title: 'title',
                        sections: [
                            {
                                title: 'hanzofc',
                                highlight_label: 'label',
                                rows: [
                                    { header: 'header', title: 'title', description: 'description', id: 'id' },
                                    { header: 'header', title: 'title', description: 'description', id: 'id' }
                                ]
                            }
                        ]
                    })
                },
                { name: 'cta_reply', buttonParamsJson: JSON.stringify({ display_text: 'quick_reply', id: 'specialmenu' }) },
                { name: 'cta_url', buttonParamsJson: JSON.stringify({ display_text: 'url', url: 'https://www.google.com', merchant_url: 'https://www.google.com' }) },
                { name: 'cta_call', buttonParamsJson: JSON.stringify({ display_text: 'call', id: 'message' }) },
                { name: 'cta_copy', buttonParamsJson: JSON.stringify({ display_text: 'copy', id: '123456789', copy_code: 'message' }) },
                { name: 'cta_reminder', buttonParamsJson: JSON.stringify({ display_text: 'Recordatorio', id: 'message' }) },
                { name: 'cta_cancel_reminder', buttonParamsJson: JSON.stringify({ display_text: 'cta_cancel_reminder', id: 'message' }) },
                { name: 'address_message', buttonParamsJson: JSON.stringify({ display_text: 'address_message', id: 'message' }) },
                { name: 'send_location', buttonParamsJson: '' }
            ],
            quoted: m.msg
        });
    } catch (err) {
        console.error('[testinteractiveall] ERROR:', err);
        await m.reply({ text: '❌ Gagal kirim interactive all:\n' + (err?.message || String(err)) });
    }
}
    break;
        // ──────────────────────────────────────────────────────
        //  TESTER: Payment request + sticker buffer
        //  Contoh request payment dan kirim sticker dari buffer.
        //  Contoh: !testpaymentstickerbuf
        // ──────────────────────────────────────────────────────
        case 'paystickerbuf': {

        const { getImage } = require('../utils/helper');
        const sharp = require('sharp');
        const { generateWAMessageContent } = require('baileys');

        const png = getImage();
       
        const webpBuffer = await sharp(png)
            .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
            .webp()
            .toBuffer();

        const sticker = await generateWAMessageContent(
            { sticker: webpBuffer },
            { upload: m.Hanz.waUploadToServer }
        );

        await m.reply({
            requestPaymentMessage: {
                amount: 999999000,
                currency: 'IDR',
                from: m.chat,
                note: 'Contoh permintaan pembayaran',
                background: {
                    id: '100',
                    fileLength: '0',
                    width: 1000,
                    height: 1000,
                    mimetype: 'image/webp',
                    placeholderArgb: 0xFF0A84FF,
                    textArgb:       0xFFFFFFFF,
                    subtextArgb:    0xFFB0D4FF
                },
                sticker
            }
        });
   
}
    break;
        // ──────────────────────────────────────────────────────
        //  VIDEO NOTE / PTV (video bulat seperti voice note)
        //  Kirim video sebagai video note (lingkaran).
        //  Contoh: !ptv  |  !videonote
        // ──────────────────────────────────────────────────────
        case 'ptv':
        case 'videonote':
        await m.send({
            video: { url: 'https://www.w3schools.com/html/mov_bbb.mp4' },
            ptv: true,
            mimetype: 'video/mp4'
        });
    break;

        // ──────────────────────────────────────────────────────
        //  CODE BLOCK (syntax highlight)
        //  Contoh: !codeblock
        // ──────────────────────────────────────────────────────
        case 'codeblock': {
            const code = [
                'function sum(a, b) {',
                '  return a + b;',
                '}',
                '',
                'console.log(sum(2, 3)); // 5'
            ].join('\n');

                if (typeof Hanz.sendCodeBlock === 'function') {
                    await Hanz.sendCodeBlock(m.chat, code, msg, {
                        language: 'javascript',
                        title: '✨ Contoh Code Block',
                        footer: 'Baileys3 + message-composer'
                    });
                } else {
                    const { generateCodeBlockContent } = require('baileys');
                    const { message, messageId } = generateCodeBlockContent(code, msg, {
                        language: 'javascript',
                        title: 'Contoh JavaScript'
                    });
                    await Hanz.relayMessage(m.chat, message, { messageId });
                }
            }
            break;
        

        // ──────────────────────────────────────────────────────
        //  TABEL (rich table message)
        //  Contoh: !tabel  |  !table
        // ──────────────────────────────────────────────────────
        case 'tabel':
        case 'table': {
                await Hanz.sendTable(
                    m.chat,
                    '📊 Ranking Member',
                    ['No', 'Nama', 'Poin'],
                    [
                        ['1', 'Alice', '120'],
                        ['2', 'Bob', '95'],
                        ['3', 'Charlie', '80']
                    ],
                    msg
                );
            }
            break;

        // ──────────────────────────────────────────────────────
        //  LIST (rich list message)
        //  Contoh: !daftar
        // ──────────────────────────────────────────────────────
        case 'daftar': {
                await Hanz.sendList(
                    m.chat,
                    '📝 Daftar Fitur Baru',
                    [
                        'noSelfSync — skip sync ke device sendiri',
                        'Username API — cek / set @username',
                        'Code Block — pesan kode dengan highlight',
                        'Table / List — rich message'
                    ],
                    msg
                );
            }
            break;
        
        // ──────────────────────────────────────────────────────
        //  SEND HTML
        //  Contoh: !teshtml  |  !sendhtml
        // ──────────────────────────────────────────────────────
      case 'teshtml':
case 'sendhtml': {
    const htmlContent = `
    <div style="
        background-color: #111b21;
        padding: 20px;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        border-radius: 12px;
        border: 1px solid #222d34;
        max-width: 400px;
    ">
        <h1 style="
            color: #00a884;
            font-size: 20px;
            margin-top: 0;
            margin-bottom: 8px;
            border-bottom: 2px solid #00a884;
            padding-bottom: 6px;
        ">Hello World</h1>
        
        <p style="color: #e9edef; font-size: 14px; line-height: 1.4;">
            Ini tes <b style="color: #00a884;">sendHtml</b> Bot hanz ofc.
        </p>
        
        <ul style="color: #8696a0; font-size: 13px; padding-left: 18px;">
            <li style="margin-bottom: 4px;">Item 1</li>
            <li>Item 2</li>
        </ul>
    </div>
    `;

    await Hanz.sendHtml(m.chat, htmlContent);
}
break;

        // ──────────────────────────────────────────────────────
        //  RICH MENU / SEND RICH
        //  Contoh: !tesrich  |  !sendrich
        // ──────────────────────────────────────────────────────
       case 'tesrich':
        case 'sendrich': {

                await Hanz.richMenu(m.chat, {
                    header: {
                        disclaimer: true,
                        disclaimerText: 'By Hanz Ofc',
                        title: config.botName,
                    },
                    body: {
                        title: 'Select Option',
                        buttons: ['Menu 1', 'Menu 2', 'Menu 3']
                    },
                    footer: {
                        text: 'WhatsApp Channel',
                        url: 'https://whatsapp.com/channel/0029VbCV1ck8fewpdNb2TY2k'
                    }
                });
            }
            break;
        
        case 'catalog': {

                    await Hanz.sendMessage(m.chat, {
                        product: {
                            productImage: getImage(),
                            productId: '26602732806077569',
                            title: 'HANZ OFC',
                            description: 'Jasa Desain 3D Custom & Pemodelan Digital.',
                            currencyCode: 'IDR',
                            priceAmount1000: 999999999999,
                            productImageCount: 923456789,
                        },
                        businessOwnerJid: '239470280454183@lid'
                    }, { quoted: m.fakePay });
                    }
                    break;
                
        
        // ──────────────────────────────────────────────────────
        //  noSelfSync
        //  Kontrol apakah pesan ikut tersync ke device bot sendiri.
        //  noSelfSync: false = muncul di semua device bot (default)
        //  noSelfSync: true  = tidak sync ke device bot sendiri
        //  Contoh: !selfsync
        // ──────────────────────────────────────────────────────
        case 'selfsyncoff': {
                await Hanz.sendMessage(
                    m.chat,
                    {
                        text:
                            '📨 Pesan NORMAL (noSelfSync: false / default).\n' +
                            'Pesan ini *akan muncul* di semua device akun bot.'
                    },
                    { noSelfSync: false }
                );
        }
            break;
        
        case 'selfsyncon': {
            
                await Hanz.sendMessage(
                    m.chat,
                    {
                        text:
                            '📨 Pesan noSelfSync (noSelfSync: true).\n' +
                            'Pesan ini *tidak muncul* di semua device akun bot.'
                    },
                    { noSelfSync: true }
                );
        }
            break;
    
        // ══════════════════════════════════════════════════════
        //  Newsletter Admin Invite
        // ══════════════════════════════════════════════════════
case 'undanganch': {
    try {
        const [id, name] = (command.fullArgs || '').split('|').map((s) => s.trim());
        const newsletterJid = id
            ? (id.includes('@') ? id : id.replace(/\D/g, '') + '@newsletter')
            : '120363185570235320@newsletter';
        const newsletterName = name || 'Official Hanz Ofc Info';

        let jpegThumbnail;
        try {
            jpegThumbnail = await require('sharp')(getImage())
                .resize(96, 96, { fit: 'cover' })
                .jpeg({ quality: 50 })
                .toBuffer();
        } catch {}

        await Hanz.relayMessage(m.chat, {
            newsletterAdminInviteMessage: {
                newsletterJid,
                newsletterName,
                jpegThumbnail,
                caption: `Terima undangan ini untuk menjadi admin di saluran WhatsApp saya '${newsletterName}'`,
                inviteExpiration: Math.floor(Date.now() / 1000) + 3 * 24 * 60 * 60,
            },
        }, {});
    } catch (err) {
        await m.reply({ text: '❌ Gagal kirim newsletter admin invite:\n' + (err?.message || String(err)) });
    }
}
    break;

            case 'stickerpack': {
            const { proto, generateWAMessageFromContent } = require('baileys');

            const stickerPack = {
                stickerPackId: '36b2e506-e4d5-4a22-9831-3b24e3ab0fa4',
                name: 'Sticker pack tester',
                publisher: '',
                stickers: [
                    { fileName: 'pT0V+pjmjrxRMYlZNiMA1vS-jrXN2irmJFSDwpOdvfY=.was', isAnimated: true, emojis: ['👋 😉 🍕'], accessibilityLabel: 'Potongan pizza yang tersenyum menurunkan kacamata hitamnya dan mengedipkan mata.', isLottie: true, mimetype: 'application/was' },
                    { fileName: '-IhG7nx8bYDCLQaW6HA5JolG8+7V+PmDTb6wCJUw5fg=.was', isAnimated: true, emojis: ['❤️ 😍 🍞'], accessibilityLabel: 'Sepotong roti panggang yang tersenyum muncul dari pemanggang, jatuh kembali ke bawah, lalu muncul lagi dengan mata berbentuk hati, lalu hati-hati pun bermunculan.', isLottie: true, mimetype: 'application/was' },
                    { fileName: 'sTxopgbYnNpl2tGFJWQ0Q8zwcEZ+Hcbsk-JXJvnJNTU=.was', isAnimated: true, emojis: ['😂 😝 🥟'], accessibilityLabel: 'Pangsit tertawa terbahak-bahak sampai air matanya beterbangan.', isLottie: true, mimetype: 'application/was' },
                    { fileName: 'V0vJewe4nuSLBKJKYZm1A+O4Hbk7bQECbFQ0U6l-jpo=.was', isAnimated: true, emojis: ['👍 😀 🍔'], accessibilityLabel: 'Burger mengacungkan jempol dan menepuk perutnya.', isLottie: true, mimetype: 'application/was' },
                    { fileName: 'J3Os85IdQCSzCwJcxCfQJ4QW56tEOe6qLyXvbrCJ0m8=.was', isAnimated: true, emojis: ['😢 🫠 🍦'], accessibilityLabel: 'Es krim menangis, menggerakkan wajahnya ke atas dan ke bawah saat mulai meleleh.', isLottie: true, mimetype: 'application/was' },
                    { fileName: 'vqVKsznm3EP4HLJBrH43jMCCoYCo+2XfoRA3Qx-zHAo=.was', isAnimated: true, emojis: ['😴 🥱 🍣'], accessibilityLabel: 'Sushi yang mengantuk menguap, berbalik, dan menarik ikannya seperti selimut.', isLottie: true, mimetype: 'application/was' },
                    { fileName: 'Qij2vnAGeJhWXYrXP0Tk-+sUq1GWnryShxFX4Lg7XDs=.was', isAnimated: true, emojis: ['🤗 😙 🌭'], accessibilityLabel: 'Hot dog tersenyum sambil meremas dirinya sendiri.', isLottie: true, mimetype: 'application/was' },
                    { fileName: 'ionYyIpBjj4KZe+neLija1ff2+RKX9S6AYoA3b1LIYk=.was', isAnimated: true, emojis: ['😐 🫠 🍳'], accessibilityLabel: 'Telur bergerak dengan ekspresi kosong dan berkedip.', isLottie: true, mimetype: 'application/was' },
                    { fileName: 'jIctc3DPnMQzIKwQJUFA-0odzp-60q4AnJV3OBWg-E0=.was', isAnimated: true, emojis: ['🫣 👀 🍙'], accessibilityLabel: 'Onigiri terlihat takut dan bersembunyi di balik rumput laut.', isLottie: true, mimetype: 'application/was' },
                    { fileName: 'fXhSW6u-JaVGfgYFSfmzihhrjg3GvA+Ks26rvTN+kow=.was', isAnimated: true, emojis: ['😳 👀 🐟'], accessibilityLabel: 'Kaleng terbuka, tutupnya bergulir dan menampakkan dua ikan yang tersenyum. Mata mereka bergerak menatap kita, lalu tutupnya perlahan menutup kembali.', isLottie: true, mimetype: 'application/was' },
                    { fileName: '8jgfavZo8AE1icNv8pGB7SJftKpcSZb7LBysMVIIXvQ=.was', isAnimated: true, emojis: ['🤭 🤫 🌮'], accessibilityLabel: 'Dua tako bergosip, satu membisikkan sesuatu ke telinga yang lain, lalu mereka tertawa.', isLottie: true, mimetype: 'application/was' },
                    { fileName: 'DSLYFWNRBd19enfLS-Br1aWoqwhPAFC5750Wych7NS8=.was', isAnimated: true, emojis: ['😡 🔥 🌶️'], accessibilityLabel: 'Cabai hijau terlihat marah, meledak emosi, berubah menjadi merah dengan api di belakangnya dan di matanya.', isLottie: true, mimetype: 'application/was' },
                    { fileName: 'i+90Z6utzP4fi+VlQFocO3+S-L07SIrClP8iudAaUOA=.was', isAnimated: true, emojis: ['🫨 😵‍💫 🧋'], accessibilityLabel: 'Boba berguling-guling di dalam cangkir, matanya bergerak dengan ekspresi bingung.', isLottie: true, mimetype: 'application/was' },
                    { fileName: 'OTpBeuJTYVxExK8M5ShVus70UJMUWbNGN8IgDM7k8mg=.was', isAnimated: true, emojis: ['🥱 😴 ☕️'], accessibilityLabel: 'Cangkir kopi menguap lebar, sementara tetesan kopi meluber keluar.', isLottie: true, mimetype: 'application/was' },
                    { fileName: 'DssuUEuSHUJCfdfIIK+olc1rq5xMpqpQpmCz+fIKYfg=.webp', isAnimated: true, emojis: ['😆 😂'], accessibilityLabel: 'A laughing and crying white cup is tilted to the right as if shaking. It contains a brown drink.', isLottie: false, mimetype: 'image/webp' },
                    { fileName: '4y8-WZocIz9qZrSjS0bGboNldfTLpypYESs2DSmR-D8=.webp', isAnimated: true, emojis: ['😄 😀'], accessibilityLabel: 'A laughing, white cup is tilted to the right and contains a brown drink.', isLottie: false, mimetype: 'image/webp' },
                    { fileName: 'iikxkpT0OcrT4jkS0LwdGvkrc9ynkAV-+0EdaoT-1PI=.webp', isAnimated: true, emojis: ['☕ 🙂'], accessibilityLabel: 'A smiling, white cup contains a brown drink.', isLottie: false, mimetype: 'image/webp' },
                ],
                fileLength: '845069',
                fileSha256: 'kym3eDqEyMRAtqrgNoVwHshx/QRdCIfGHD91pCR2pCk=',
                fileEncSha256: 'ibGAirE4pWbpv/fVyMKDsXBqPbGK30eIx3IrhNXL4Hg=',
                mediaKey: 'Ln80akKpiBDxogGpnMrc7R14ZWqmxU5/K7k87Ofd51c=',
                directPath: '/v/t62.15575-24/851381217_1097251283087781_4062692779807025517_n.enc?ccb=11-4&oh=01_Q5Aa5wEc3C59NizzZ57kzGtaULReI6T_SSyzmIvsT7OzVOICgw&oe=6AFCE222&_nc_sid=5e03e0',
                trayIconFileName: '36b2e506-e4d5-4a22-9831-3b24e3ab0fa4.png',
                thumbnailDirectPath: '/v/t62.15575-24/852644530_1420739213588292_4062523797821799892_n.enc?ccb=11-4&oh=01_Q5Aa5wH8SUeoXNMYncfKXYe5p51gKe6r6gzg30kGbIdi0RvP3w&oe=6AFCF133&_nc_sid=5e03e0',
                stickerPackSize: '855603',
            };

            const waMsg = generateWAMessageFromContent(
                m.chat,
                proto.Message.fromObject({ stickerPackMessage: stickerPack }),
                { userJid: Hanz.user?.id, quoted: m.msg }
            );

            await Hanz.relayMessage(m.chat, waMsg.message, { messageId: waMsg.key.id });
        }
            break;
    }
};

module.exports = handler;