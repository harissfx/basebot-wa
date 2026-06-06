const config = require('../config');
const { formatUptime } = require('../utils/helper');
const plugins = require('../utils/PluginLoader');
const { getImage } = require('../utils/helper');

const handler = async (m) => {
    const { command } = m;
        const p = config.prefix;

    switch (command.name) {
case 'menu':
            
            menutxt = `┌━━━━━━━━━━━━━━┈ ❋ཻུ۪۪⸙
│    「 𝙄𝙉𝙁𝙊 𝘽𝙊𝙏 」
│● Owner: ${config.ownerName}
│● Nomor: ${[].concat(config.superOwner).join(', ')}
│● Runtime: ${formatUptime(process.uptime())}
│● Nama Bot: ${config.botName}
└┬━━━━━━━━━━━━━━┈ ⳹
┌┤  「 𝙈𝙀𝙉𝙐 𝘽𝙊𝙏 」
││
${Object.entries(plugins.commandsByFile()).map(([file, cmds]) => `││\n││  〘 ${file} 〙\n` + cmds.map(cmd => `││⪩ \`${p}${cmd}\``).join('\n')).join('\n')}
││
│└────────────┈ ⳹
│›⟩ ∘ 𝘓𝘢𝘯𝘨𝘶𝘢𝘨𝘦: 𝘑𝘢𝘷𝘢𝘚𝘤𝘳𝘪𝘱𝘵
│›⟩ ∘ 𝘚𝘤𝘳𝘪𝘱𝘵?: ketik ${p}script ( ͡° ͜ʖ ͡°)
├───────────────
│✑ 𝖢𝗈𝗉𝗒𝗋𝗂𝗀𝗁𝗍 Haris Syc
└━━━━━━━━━━━━━━━┈ ❋ཻུ۪۪⸙`
            await m.sendInteractiveWithImage({
                imageSource: getImage(),
                text: menutxt,
                footer: config.footerTxt,
                quoted: m.fakeOrder,
                contextInfo: {
                    mentionedJid: ['0@s.whatsapp.net'],
                    forwardingScore: 999,
                    isForwarded: true,
                },
                buttons: [ 
                    { name: 'cta_call', buttonParamsJson: JSON.stringify({ display_text: 'Lapor Bug', phone_number: 'wa.me/6285124014109' }) },
                    { name: 'cta_url', buttonParamsJson: JSON.stringify({ display_text: 'Join Channel', url: 'https://whatsapp.com/channel/0029VaB6LTrAYlUCe0VINW1r' }) },
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
                    }
                ]
            });
            break;
    }
};

module.exports = handler;