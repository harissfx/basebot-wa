const fs   = require('fs');
const path = require('path');
const config = require('../config');

const handler = async (ctx) => {
    const { command, sock, sender, msg } = ctx;
    const p = config.prefix;

    switch (command.name) {

        case 'docbtn': {
    const pey = {
        key: {
            fromMe: false,
            participant: '0@s.whatsapp.net',
            remoteJid: '0@s.whatsapp.net'
        },
        message: {
            requestPaymentMessage: {
                currencyCodeIso4217: 'USD',
                amount1000: '1000000000',
                requestFrom: '0@s.whatsapp.net',
                noteMessage: {
                    extendedTextMessage: {
                        text: config.botName
                    }
                }
            }
        }
    };

    await ctx.sendInteractive({
        text: `╔═══ *${config.botName}* ═══╗\n║\n║ Halo! Pilih menu di bawah.\n║\n╚══════════════════════╝`,
        footer: config.footerTxt,
        quoted: pey,
        buttons: [
            { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '📋 Menu Utama', id: `${p}menu` }) },
            { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '🏓 Ping Bot', id: `${p}ping` }) },
            {
                name: 'single_select',
                buttonParamsJson: JSON.stringify({
                    title: '📂 Pilih Menu',
                    sections: [
                        {
                            title: '⚙️ Umum',
                            rows: [
                                { header: 'Menu', title: 'Menu Utama',   description: '', id: `${p}menu`  },
                                { header: 'Info', title: 'Info Bot',     description: '', id: `${p}info`  },
                                { header: 'Ping', title: 'Ping',         description: '', id: `${p}ping`  },
                                { header: 'Owner',title: 'Kontak Owner', description: '', id: `${p}owner` },
                            ]
                        },
                        {
                            title: '🎮 Fun',
                            rows: [
                                { header: 'Dadu',   title: 'Dadu',    description: '', id: `${p}dice`  },
                                { header: 'Koin',   title: 'Koin',    description: '', id: `${p}coin`  },
                                { header: '8Ball',  title: '8Ball',   description: '', id: `${p}8ball` },
                                { header: 'Joke',   title: 'Lelucon', description: '', id: `${p}joke`  },
                            ]
                        }
                    ]
                })
            }
        ]
    });

    break;
}

    }
};

module.exports = handler;