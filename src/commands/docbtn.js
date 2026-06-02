const fs   = require('fs');
const path = require('path');
const config = require('../config');

const handler = async (ctx) => {
    const { command, sock, sender, msg } = ctx;
    const p = config.prefix;

    switch (command.name) {

        case 'docbtn': 
         

            // Thumbnail untuk externalAdReply
            const thumbPath = path.join(__dirname, '../media/logo.png');
            const thumbnail = fs.existsSync(thumbPath) ? fs.readFileSync(thumbPath) : null;

            // Fake dokumen — pakai buffer kosong atau file asli kalau ada
            const fakeDocPath = path.join(__dirname, '../media/fake.pdf');
            const docBuffer   = fs.existsSync(fakeDocPath)
                ? fs.readFileSync(fakeDocPath)
                : Buffer.alloc(1024); // buffer kosong kalau file tidak ada

            const fakeExt = [
                { ext: '.pdf',  mime: 'application/pdf' },
                { ext: '.docx', mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
                { ext: '.xlsx', mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
            ];
            const pick = fakeExt[Math.floor(Math.random() * fakeExt.length)];

            await sock.sendMessage(sender, {
                document: docBuffer,
                fileName: `${config.botName}${pick.ext}`,
                mimetype: pick.mime,
                fileLength: 100000000000000,
                pageCount: 999999,
                caption: [
                    `╔═══ *${config.botName}* ═══╗`,
                    `║`,
                    `║ Halo! Pilih menu di bawah ini.`,
                    `║`,
                    `╚══════════════════════╝`,
                ].join('\n'),
                footer: config.footerTxt,
                buttons: [
                    {
                        buttonId: `${p}menu`,
                        buttonText: { displayText: '📋 Menu Utama' },
                        type: 1
                    },
                    {
                        buttonId: `${p}ping`,
                        buttonText: { displayText: '🏓 Ping Bot' },
                        type: 1
                    },
                    {
                        buttonId: 'list_button',
                        buttonText: { displayText: '📂 Pilih Menu' },
                        nativeFlowInfo: {
                            name: 'single_select',
                            paramsJson: JSON.stringify({
                                title: '📂 Pilih Menu',
                                sections: [
                                    {
                                        title: '⚙️ Umum',
                                        rows: [
                                            { title: 'Menu Utama',  id: `${p}menu`  },
                                            { title: 'Info Bot',    id: `${p}info`  },
                                            { title: 'Ping',        id: `${p}ping`  },
                                            { title: 'Kontak Owner',id: `${p}owner` },
                                        ]
                                    },
                                    {
                                        title: '🎮 Fun',
                                        rows: [
                                            { title: 'Dadu',   id: `${p}dice`    },
                                            { title: 'Koin',   id: `${p}coin`    },
                                            { title: '8Ball',  id: `${p}8ball`   },
                                            { title: 'Lelucon',id: `${p}joke`    },
                                        ]
                                    }
                                ]
                            })
                        },
                        type: 2
                    }
                ],
                contextInfo: {
                    forwardingScore: 999,
                    isForwarded: true,
                    externalAdReply: {
                        title: config.botName,
                        body: config.footerTxt,
                        mediaType: 1,
                        thumbnail: thumbnail || undefined,
                        renderLargerThumbnail: true,
                        mediaUrl: 'https://github.com/harissfx',
                        sourceUrl: 'https://github.com/harissfx'
                    }
                }
            }, { quoted: ctx.fakeOrder });

            break;
        

    }
};

module.exports = handler;