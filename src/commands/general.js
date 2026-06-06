const config = require('../config');
const { formatUptime } = require('../utils/helper');
const plugins = require('../utils/PluginLoader');
const { getImage } = require('../utils/helper');
const { getDevice } = require('@whiskeysockets/baileys');

const handler = async (m) => {
    const { command, isSuperOwner, Hanz, sender, msg, senderNumber, pushname, isOwner } = m;
    const p = config.prefix;
    const nomorUser = senderNumber;
    let start, sent;

    switch (command.name) {
        case 'generalmenu':
            const device = getDevice(msg.key.id);
            const generalCmds = (plugins.commandsByFile()['general'] || [])
            .filter(cmd => !['generalmenu'].includes(cmd));
            const role = isSuperOwner ? 'Super Owner' : (isOwner ? 'Co-Owner' : 'User biasa');
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
${generalCmds.map(cmd => `│⪩ \`${p}${cmd}\``).join('\n')}
│
└────────────┈ ⳹`
            await m.sendInteractive({
                text: menu,
                footer: config.footerTxt,
                quoted: m.fakeOrder,
                contextInfo: {
                    mentionedJid: ["0@s.whatsapp.net"],
                    forwardingScore: 111,
                    isForwarded: true
                },
                buttons: [
                    { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: 'Kembali ke Menu', id: 'menu' }) },
                    { name: 'single_select', buttonParamsJson: JSON.stringify({
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
                                rows: [{ title: "Fun Menu", description: "Select to display fun menu", id: "funmenu" }]
                            }, {
                                highlight_label: "",
                                rows: [{ title: "Group Menu", description: "Select to display group menu ", id: "groupmenu" }]
                            }]
                        })
                    }]
            });
            break;
        
case 'script':
case 'sc':
    tete = `
┌─❖
│「 Hay 👋 」
└┬❖ 「 ${pushname} 」
┌┤✑ Mau Script Free? 
│└────────────┈ ⳹
│
└─「 \`MEDSOS\` 」
│X : https://x.com/HarisSfx
│IG : https://www.instagram.com/hanz_ofc66/
│
│𝘿𝙤𝙣𝙖𝙨𝙞 : https://saweria.co/HarisS69
└┬────────────┈ ⳹
 │✑  𝐹𝑟𝑒𝑒 𝑁𝑜 𝐸𝑛𝑐
 │✑  𝑁𝑜 𝑅𝑒𝑛𝑎𝑚𝑒 𝑘𝑖𝑑𝑠
 └─────────────┈ ⳹`
    await m.sendInteractive({
                text: tete,
                footer: config.footerTxt,
                quoted: m.msg,
                contextInfo: {
                    mentionedJid: ['0@s.whatsapp.net'],
                    forwardingScore: 999,
                    isForwarded: true,
                },
                buttons: [
                    { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: `Hai\nSaya ${pushname} Disini mau Open Vcs Free Temenin sampai Crot💦 Yang Minat langsung Vc aja ya. Nomor saya👉 wa.me/${nomorUser}`, id: '' }) },
                    { name: 'cta_url', buttonParamsJson: JSON.stringify({ display_text: 'Buka GitHub', url: 'https://github.com/harissfx/basebot-wa' }) },
                ]
            });
break;
        case 'ping':
            start = Date.now();
            sent = await m.reply({ text: '🏓 Pong!' });
            await Hanz.sendMessage(sender, {
                text: `🏓 *Pong!*\n\nSpeed: *${Date.now() - start}ms*\nUptime: \`${formatUptime(process.uptime())}\``,
                edit: sent.key
            });
            break;
        case 'owner': {
            const superOwners = [].concat(config.superOwner);
            if (!superOwners.length) return m.reply({ text: '❌ Nomor owner belum diatur.' });
            const contacts = superOwners.map((num, i) => ({
                vcard: `BEGIN:VCARD\nVERSION:3.0\nFN:Owner Bot${superOwners.length > 1 ? ' ' + (i + 1) : ''}\nTEL;type=CELL;type=VOICE;waid=${num}:+${num}\nEND:VCARD`
            }));
            await m.send({
                contacts: {
                    displayName: 'Owner Bot',
                    contacts
                }
            });
            break;
        }
    }
};

module.exports = handler;