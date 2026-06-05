const { delay } = require('../utils/helper');
const config = require('../config');
const plugins = require('../utils/PluginLoader');
const { getDevice } = require('@whiskeysockets/baileys');
const { pick } = require('../../lib/random');

const handler = async (m) => {
    const { command, isSuperOwner, Hanz, sender, msg, senderNumber, pushname, isOwner } = m;
    const p = config.prefix;
    const nomorUser = senderNumber;
    let max, answers, jokes, fortunes;

    switch (command.name) {
        case 'funmenu':
            const device = getDevice(msg.key.id);
            const funCmds = plugins.commandsByFile()['fun'] || [];
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
│「 𝗙𝗨𝗡 𝗠𝗘𝗡𝗨 」
│
│${funCmds.map(cmd => `│⪩ \`${p}${cmd}\``).join('\n')}
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

        case 'dice':
            await m.reply({ text: `🎲 Dadu: *${Math.floor(Math.random() * 6) + 1}*` });
            break;

        case 'coin':
            await m.reply({ text: `🪙 Hasil: *${Math.random() < 0.5 ? 'Kepala' : 'Ekor'}*` });
            break;

        case 'random':
            max = parseInt(command.args[0]) || 100;
            await m.reply({ text: `🔢 Random (1-${max}): *${Math.floor(Math.random() * max) + 1}*` });
            break;

        case '8ball':
            answers = [
                'Ya, pasti! ✅', 'Tidak, jelas tidak ❌', 'Mungkin saja 🤔',
                'Coba lagi nanti ⏳', 'Saya ragu-ragu 🤷', 'Sudah pasti! 💯',
                'Tanda-tanda menunjukkan ya 👍', 'Tidak mungkin 🚫',
            ];
            await m.reply({ text: `🎱 *8-Ball:*\n\n${pick(answers)}` });
            break;

        case 'joke':
            jokes = [
                'Kenapa programmer suka kopi?\nKarena tanpa kopi, mereka tidak bisa *compile* pikiran! ☕',
                'Apa bedanya bug dan fitur?\nDokumentasi! 📄',
                'Kenapa JavaScript developer tidak bisa tidur?\nKarena mereka selalu *await* sesuatu! 😴',
                'Apa yang dikatakan server ke client?\n"404: Joke not found" 🔍',
            ];
            await m.reply({ text: `😂 *Joke:*\n\n${pick(jokes)}` });
            break;

        case 'fortune':
            fortunes = [
                'Hari ini adalah hari keberuntunganmu! 🍀',
                'Kesabaran adalah kunci kesuksesanmu. 🔑',
                'Sebuah kejutan baik akan datang segera. 🎁',
                'Jangan takut mengambil risiko hari ini. 🚀',
                'Kreativitasmu akan membawa hasil besar. 🎨',
            ];
            await m.reply({ text: `🥠 *Fortune Cookie:*\n\n${pick(fortunes)}` });
            break;

        case 'typing':
            await Hanz.sendPresenceUpdate('composing', sender);
            await delay(2000);
            await Hanz.sendPresenceUpdate('paused', sender);
            await m.reply({ text: '⌨️ Ini contoh typing indicator!' });
            break;

    }
};

module.exports = handler;