const fs   = require('fs');
const path = require('path');
const config = require('../config');
const { formatUptime } = require('../utils/helper');

const handler = async (ctx) => {
    const { command, sock, sender } = ctx;
    const p = config.prefix;
    let imgPath, imageSource, start, sent, u, h, m, s;

    switch (command.name) {

        case 'menu':
            imgPath = path.join(__dirname, '../media/logo.png');
            if (!fs.existsSync(imgPath)) return ctx.reply({ text: '❌ File logo.png tidak ditemukan di folder media.' });
            imageSource = fs.readFileSync(imgPath);
            menutxt = `┌━━━━━━━━━━━━━━┈ ❋ཻུ۪۪⸙
│    「 𝙄𝙉𝙁𝙊 𝘽𝙊𝙏 」
│● Owner: ${config.ownerName}
│● Nomor: ${config.ownerNumber}
│● Runtime: ${formatUptime(process.uptime())}
│● Nama Bot: ${config.botName}
└┬━━━━━━━━━━━━━━┈ ⳹
┌┤  「 𝙈𝙀𝙉𝙐 𝘽𝙊𝙏 」
││
││⪩ 𝗍𝗈𝗆𝖾𝗇𝗎
││⪩ 𝖼𝗎𝖼𝗂𝗆𝖺𝗍𝖺
││⪩ 𝗅𝗂𝗌𝗍𝗆𝗎𝗌𝗂𝗄
││⪩ 𝗍𝖾𝗑𝗍𝗆𝖺𝗄𝖾𝗋
││⪩ 𝖿𝗎𝗇𝗆𝖾𝗇𝗎
││⪩ 𝖺𝖽𝖽𝗆𝖾𝗇𝗎
││⪩ 𝗀𝖺𝗌𝗆𝖾𝗇𝗎
││⪩ 𝖻𝗎𝗀𝗆𝖾𝗇𝗎
││⪩ 𝗂𝗌𝗅𝖺𝗆𝗆𝖾𝗇𝗎
││⪩ 𝖻𝖾𝗋𝗂𝗍𝖺𝗆𝖾𝗇𝗎
││⪩ 𝗀𝖺𝗆𝖾𝗆𝖾𝗇𝗎
││⪩ 𝗀𝗋𝗈𝗎𝗉𝗆𝖾𝗇𝗎
││⪩ 𝗋𝖺𝗇𝖽𝗈𝗆𝗆𝖾𝗇𝗎
││⪩ 𝖽𝗈𝗐𝗇𝗅𝗈𝖺𝖽𝗆𝖾𝗇𝗎
││
│└────────────┈ ⳹
│›⟩ ∘ 𝘓𝘢𝘯𝘨𝘶𝘢𝘨𝘦: 𝘑𝘢𝘷𝘢𝘚𝘤𝘳𝘪𝘱𝘵
│›⟩ ∘ 𝘚𝘤𝘳𝘪𝘱𝘵?: 𝘎𝘬 𝘥𝘪 𝘫𝘶𝘢𝘭 ( ͡° ͜ʖ ͡°)
├───────────────
│✑ 𝖢𝗈𝗉𝗒𝗋𝗂𝗀𝗁𝗍 𝖧𝖺𝗇𝗓 𝖮𝖿𝖼
└━━━━━━━━━━━━━━━┈ ❋ཻུ۪۪⸙`
            await ctx.sendInteractiveWithImage({
                imageSource,
                text: menutxt,
                footer: `${config.footerTxt}`,
                quoted: ctx.fakeOrder,
                contextInfo: {
                    mentionedJid: ['0@s.whatsapp.net'],
                    forwardingScore: 999,
                    isForwarded: true,
                },
                buttons: [
                    { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '📋 General', id: 'menu_general' }) },
                    { name: 'cta_url',     buttonParamsJson: JSON.stringify({ display_text: '🌐 Buka GitHub', url: 'https://github.com/whiskeysockets/baileys' }) },
                    { name: 'cta_copy',    buttonParamsJson: JSON.stringify({ display_text: '📋 Copy Kode', copy_code: 'KODE-PROMO-2025' }) },
                    { name: 'cta_call', buttonParamsJson: JSON.stringify({ display_text: '📱 Telepon Sekarang', phone_number: '+6281234567890' }) },
                                        {
                        name: 'single_select',
                        buttonParamsJson: JSON.stringify({
                            title: '📂 Buka Menu',
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
                        })
                    }
                ]
            });
            break;
case 'getiduser':
        case 'iduser':
        case 'cekno':
            let nomorInput = command.fullArgs.replace(/\D/g, '');

            if (!nomorInput) {
                return ctx.reply({ 
                    text: `❌ *Format Salah!*\n\nFormat: \`${p}getiduser <nomor-hp>\`\nContoh: \`${p}getiduser 085706035039\` atau \`${p}getiduser 6285706035039\`` 
                });
            }

            if (nomorInput.startsWith('0')) {
                nomorInput = '62' + nomorInput.slice(1);
            }

            try {
                const [result] = await sock.onWhatsApp(nomorInput);

                if (!result || !result.exists) {
                    return ctx.reply({ text: `❌ Nomor *${nomorInput}* tidak terdaftar di WhatsApp.` });
                }

                const jidKlasik = result.jid; 
                const lid = result.lid || "Tidak tersedia"; 

                let hasil = `🔍 *DATA USER WHATSAPP* 🔍\n\n`;
                hasil += ` • *Nomor Asli* : +${nomorInput}\n`;
                hasil += ` • *JID Klasik* : \`${jidKlasik}\` (Copy ini)\n`;
                hasil += ` • *LID Privasi* : \`${lid}\``;

                await ctx.reply({ text: hasil });

            } catch (error) {
                console.error("Gagal melacak nomor:", error);
                await ctx.reply({ text: `❌ Terjadi kesalahan saat memeriksa nomor tersebut.` });
            }
            break;

        case 'getidch':
        case 'idch':
        case 'cekchannel':
            const textInput = command.fullArgs;
            const channelRegex = /whatsapp\.com\/channel\/([a-zA-Z0-9]+)/i;

            if (!textInput || !channelRegex.test(textInput)) {
                return ctx.reply({ 
                    text: `❌ *Format Salah!*\n\nFormat: \`${p}getidch <link-channel>\`\nContoh: \`${p}getidch https://whatsapp.com/channel/0029VaXXXXX\`` 
                });
            }

            const match = textInput.match(channelRegex);
            const inviteCode = match[1];

try {
    const metadata = await sock.newsletterMetadata("invite", inviteCode);

    const jidAsli = metadata.id; 
    const metaDataThread = metadata.thread_metadata || {};
    
    const namaChannel   = metaDataThread.name?.text || "Tidak diketahui";
    const totalPengikut = metaDataThread.subscribers_count || "0";
    const deskripsi     = metaDataThread.description?.text || "Tidak ada deskripsi.";

    let hasil = `🔍 *DATA WHATSAPP CHANNEL* 🔍\n\n`;
    hasil += ` • *Nama Channel* : ${namaChannel}\n`;
    hasil += ` • *ID Internal* : \`${jidAsli}\` (Copy ini)\n`;
    hasil += ` • *Followers* : ${totalPengikut} pengikut\n`;
    hasil += ` • *Deskripsi* : ${deskripsi}`;

    await ctx.reply({ text: hasil });

} catch (error) {
    console.error("Gagal melacak channel:", error);
    await ctx.reply({ 
        text: `❌ *Gagal Mendapatkan Data!*\n\nPastikan link channel valid, publik, dan bot sedang tidak terkena limit query.` 
    });
}
            break;
        case 'menu_general':
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

        case 'menu_interactive':
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

        case 'menu_media':
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

        case 'ping':
            start = Date.now();
            sent  = await ctx.reply({ text: '🏓 Pong!' });
            await sock.sendMessage(sender, {
                text: `🏓 *Pong!*\n\n⏱️ Latency: *${Date.now() - start}ms*`,
                edit: sent.key
            });
            break;

       
        case 'owner':
            if (!config.ownerNumber) return ctx.reply({ text: '❌ Nomor owner belum diatur.' });
            await ctx.send({
                contacts: {
                    displayName: 'Owner Bot',
                    contacts: [{ vcard: `BEGIN:VCARD\nVERSION:3.0\nFN:Owner Bot\nTEL;type=CELL;type=VOICE;waid=${config.ownerNumber}:+${config.ownerNumber}\nEND:VCARD` }]
                }
            });
            break;

        case 'location':
            await ctx.reply({
                location: { degreesLatitude: -6.1754, degreesLongitude: 106.8272, name: 'Monumen Nasional', address: 'Jakarta, Indonesia' }
            });
            break;

        case 'contact':
            await ctx.reply({
                contacts: {
                    displayName: 'Test Contact',
                    contacts: [{ vcard: 'BEGIN:VCARD\nVERSION:3.0\nFN:Test Contact\nTEL;type=CELL;type=VOICE;waid=6281234567890:+62 812-3456-7890\nEND:VCARD' }]
                }
            });
            break;

        case 'react':
            await ctx.react(command.args[0] || '👍');
            break;

        case 'quote':
            await ctx.reply({ text: '📌 Quoted message!' });
            break;

        case 'poll':
            await ctx.reply({
                poll: { name: 'Polling Favorit', values: ['Node.js', 'Python', 'Golang', 'Rust'], selectableCount: 1, toAnnouncementGroup: false }
            });
            break;
        

    }
};

module.exports = handler;