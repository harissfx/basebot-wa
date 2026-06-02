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
                { buttonId: `${prefix}status`, buttonText: { displayText: "🔍 Cek Status" }, type: 1 },  
                {
                    buttonId: 'list_button',
                    buttonText: { displayText: '📋 Menu Lengkap' },
                    nativeFlowInfo: {
                        name: 'single_select',
                        paramsJson: JSON.stringify({
                            title: '📋 Pilihan Kontrol SmartHome',
                            sections: [
                                {
                                    title: "💡 Kontrol LED",
                                    rows: [
                                        { title: "LED ON", id: `led on` },
                                        { title: "LED OFF", id: `led off` },
                                    ]
                                },
                                {
                                    title: "🔌 Kontrol Relay",
                                    rows: [
                                        { title: "Relay 1 ON", id: `relay1 on` },
                                        { title: "Relay 1 OFF", id: `relay1 off` },
                                        { title: "Relay 2 ON", id: `relay2 on` },
                                        { title: "Relay 2 OFF", id: `relay2 off` },
                                    ]
                                },
                                {
                                    title: "📈 Sensor & Status",
                                    rows: [
                                        { title: "Baca Sensor DHT", id: `dht` },
                                        { title: "Status Semua", id: `status` },
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