const fs = require('fs');
const path = require('path');
const config = require('../config');
const { formatUptime } = require('../utils/helper');
const { getDevice } = require('@whiskeysockets/baileys');

const handler = async (ctx) => {
    const { command, isSuperOwner, sock, sender, msg, senderNumber, pushname, isOwner } = ctx;
    const p = config.prefix;
    const nomorUser = senderNumber;
    let imgPath, imageSource, start, sent, u, h, m, s;

    switch (command.name) {
        case 'generalmenu':
            const device = getDevice(msg.key.id);
            const nomorUser = senderNumber;
            const role = isSuperOwner ? 'Super Owner' : (isOwner ? 'Co-Owner' : 'User');
            let menu = `┌─❖「 𝗜𝗡𝗙𝗢 𝗨𝗦𝗘𝗥 」
│● 𝘕𝘢𝘮𝘢: ${pushname}
│● 𝘕𝘰𝘮𝘰𝘳: ${nomorUser}
│● 𝘚𝘵𝘢𝘵𝘶𝘴: ${role}
│● 𝘗𝘦𝘳𝘢𝘯𝘨𝘬𝘢𝘵: ${device}
│
└┬❖ 
┌┤𝖧𝖺𝗒 𝗄𝖺𝗄 ${pushname} 👋
│└────────────┈ ⳹
│「 𝗚𝗘𝗡𝗘𝗥𝗔𝗟 𝗠𝗘𝗡𝗨 」
│
│⪩ \`${p}𝗆𝖾𝗇𝗎\`
│⪩ \`${p}𝗉𝗂𝗇𝗀\`
│⪩ \`${p}𝗈𝗐𝗇𝖾𝗋\`
│⪩ \`${p}𝗅𝗈𝖼𝖺𝗍𝗂𝗈𝗇\`
│⪩ \`${p}𝖼𝗈𝗇𝗍𝖺𝖼𝗍\`
│⪩ \`${p}𝗋𝖾𝖺𝖼𝗍\`
│⪩ \`${p}𝗊𝗎𝗈𝗍𝖾\`
│⪩ \`${p}𝗉𝗈𝗅𝗅\`
│
└────────────┈ ⳹`
            await ctx.sendInteractive({
                text: menu,
                footer: config.footerTxt,
                quoted: ctx.fakeOrder,
                contextInfo: {
                    mentionedJid: ["0@s.whatsapp.net"],
                    forwardingScore: 111,
                    isForwarded: true
                },
                buttons: [
                    { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: 'Kembali ke Menu', id: 'menu' }) },
                    {
                        name: 'single_select', buttonParamsJson: JSON.stringify({
                            title: '『 Simpel Menu 』',
                            sections: [{
                                title: '『 Simpel Menu 』',
                                highlight_label: "",
                                rows: [{ title: "General Menu", description: "Select to display general menu", id: "generalmenu" }]
                            }, {
                                highlight_label: "",
                                rows: [{ title: "Owner Menu", description: "Select to display owner menu", id: "ownermenu" }]
                            }, {
                                highlight_label: "",
                                rows: [{ title: "Ffmpeg Menu", description: "Select to display ffmpeg menu", id: "ffmpegmenu" }]
                            }, {
                                highlight_label: "",
                                rows: [{ title: "Downloader Menu", description: "Select to display downloader menu", id: "downloadmenu" }]
                            }, {
                                highlight_label: "",
                                rows: [{ title: "Tools Menu", description: "Select to display tools menu", id: "toolsmenu" }]
                            }, {
                                highlight_label: "Khusus Owner Utama",
                                rows: [{ title: "JadiBot Menu", description: "Select to display jadi bot menu", id: "jadibotmenu" }]
                            }, {
                                highlight_label: "",
                                rows: [{ title: "Group Menu", description: "Select to display group menu ", id: "groupmenu" }]
                            },]
                        })
                    }]
            });
            break;
        case 'menu':
            imgPath = path.join(__dirname, '../media/logo.png');
            if (!fs.existsSync(imgPath)) return ctx.reply({ text: '❌ File logo.png tidak ditemukan di folder media.' });
            imageSource = fs.readFileSync(imgPath);
            menutxt = `┌━━━━━━━━━━━━━━┈ ❋ཻུ۪۪⸙
│    「 𝙄𝙉𝙁𝙊 𝘽𝙊𝙏 」
│● Owner: ${config.ownerName}
│● Nomor: ${[].concat(config.superOwner).join(', ')}
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
│✑ 𝖢𝗈𝗉𝗒𝗋𝗂𝗀𝗁𝗍 Haris Syc
└━━━━━━━━━━━━━━━┈ ❋ཻུ۪۪⸙`
            await ctx.sendInteractiveWithImage({
                imageSource,
                text: menutxt,
                footer: config.footerTxt,
                quoted: ctx.fakeOrder,
                contextInfo: {
                    mentionedJid: ['0@s.whatsapp.net'],
                    forwardingScore: 999,
                    isForwarded: true,
                },
                buttons: [
                    { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '📋 General', id: 'menu_general' }) },
                    { name: 'cta_url', buttonParamsJson: JSON.stringify({ display_text: '🌐 Buka GitHub', url: 'https://github.com/whiskeysockets/baileys' }) },
                    { name: 'cta_copy', buttonParamsJson: JSON.stringify({ display_text: '📋 Copy Kode', copy_code: 'KODE-PROMO-2025' }) },
                    { name: 'cta_call', buttonParamsJson: JSON.stringify({ display_text: '📱 Telepon Sekarang', phone_number: '+6281234567890' }) },
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
case 'script':
case 'sc':
    
    await ctx.sendInteractive({
                text: '🚀 Pilih aksi:',
                footer: 'WhatsApp Bot',
                quoted: ctx.msg,
                buttons: [
                    { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: `Hai\nSaya ${pushname} Disini mau Open Vcs Free Temenin sampai Crot💦 Yang Minat langsung Vc aja ya. Nomor saya👉 wa.me/ ${nomorUser}`, id: '' }) },
                    { name: 'cta_url', buttonParamsJson: JSON.stringify({ display_text: 'Buka GitHub', url: 'https://github.com/harissfx/basebot-wa' }) },
                ]
            });
break;
        case 'ping':
            start = Date.now();
            sent = await ctx.reply({ text: '🏓 Pong!' });
            await sock.sendMessage(sender, {
                text: `🏓 *Pong!*\n\nSpeed: *${Date.now() - start}ms*\nUptime: \`${formatUptime(process.uptime())}\``,
                edit: sent.key
            });
            break;


        case 'owner': {
            const superOwners = [].concat(config.superOwner);
            if (!superOwners.length) return ctx.reply({ text: '❌ Nomor owner belum diatur.' });
            const contacts = superOwners.map((num, i) => ({
                vcard: `BEGIN:VCARD\nVERSION:3.0\nFN:Owner Bot${superOwners.length > 1 ? ' ' + (i + 1) : ''}\nTEL;type=CELL;type=VOICE;waid=${num}:+${num}\nEND:VCARD`
            }));
            await ctx.send({
                contacts: {
                    displayName: 'Owner Bot',
                    contacts
                }
            });
            break;
        }

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