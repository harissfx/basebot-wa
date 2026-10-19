const config = require('../config');
const { formatUptime, getImage } = require('../utils/helper');
const { getSetting, getOwnerDisplay } = require('../utils/cloneSettings');
const plugins = require('../utils/PluginLoader');
const pkg = require('../../package.json');
const { generateWAMessageFromContent } = require('baileys');
const sharp = require('sharp');

function getPrefix(m) {
    return m?.prefix ?? getSetting(m?.Hanz, m ? m.isMain !== false : true, 'prefix');
}

function getMenuStyle(m) {
    const raw = getSetting(m?.Hanz, m ? m.isMain !== false : true, 'menuStyle');
    const n = parseInt(raw, 10);
    return [1, 2].includes(n) ? n : 1;
}

function buildMenuText(m) {
    const p = getPrefix(m);
    const owner = getOwnerDisplay(m?.Hanz, m ? m.isMain !== false : true);
    return `┌━━━━━━━━━━━━━━┈ ❋ཻུ۪۪⸙
│    「 𝙄𝙉𝙁𝙊 𝘽𝙊𝙏 」
│● Owner: ${owner.name}
│● Nomor: ${owner.number}
│● Runtime: ${formatUptime(process.uptime())}
│● Nama Bot: ${config.botName}
│● Total Command: ${plugins.commandList().length}
└┬━━━━━━━━━━━━━━┈ ⳹
┌┤  「 𝙈𝙀𝙉𝙐 𝙂𝙇𝙊𝘽𝘼𝙇 」
││
││⪩ \`${p}generalmenu\`
││⪩ \`${p}ownermenu\`
││⪩ \`${p}ffmpegmenu\`
││⪩ \`${p}downloadmenu\`
││⪩ \`${p}toolsmenu\`
││⪩ \`${p}jadibotmenu\`
││⪩ \`${p}funmenu\`
││⪩ \`${p}groupmenu\`
││⪩ \`${p}iotmenu\`
││⪩ \`${p}extramenu\`
││
││  〘 Semua command 〙
││⪩ \`${p}allmenu\`
││
│└────────────┈ ⳹
│›⟩ ∘ 𝘓𝘢𝘯𝘨𝘶𝘢𝘨𝘦: 𝘑𝘢𝘷𝘢𝘚𝘤𝘳𝘪𝘱𝘵
│›⟩ ∘ 𝘚𝘤𝘳𝘪𝘱𝘵?: ketik ${p}script ( ͡° ͜ʖ ͡°)
├───────────────
│✑ 𝖢𝗈𝗉𝗒𝗋𝗂𝗀𝗁𝗍 Haris Sync
└━━━━━━━━━━━━━━━┈ ❋ཻུ۪۪⸙`;
}

/* ────────────────────────────────────────────────
 *  STYLE 1 — Menu global (kategori) + gambar
 * ──────────────────────────────────────────────── */
async function menuStyle1(m) {
    await m.sendInteractiveWithImage({
        imageSource: getImage(),
        text: buildMenuText(m),
        footer: config.footerTxt,
        quoted: m.fakePay,
        contextInfo: {
            mentionedJid: ['0@s.whatsapp.net'],
            forwardingScore: 999,
            isForwarded: true,
        },
        buttons: [
            { name: 'cta_url', buttonParamsJson: JSON.stringify({ display_text: 'Lapor Bug', url: 'https://t.me/HanzOfc' }) },
            { name: 'cta_url', buttonParamsJson: JSON.stringify({ display_text: 'Website Toko', url: 'https://hanzofc.my.id', webview_presentation: true, payment_link_preview: true, webview_interaction: true }) },
            {name: 'single_select', buttonParamsJson: JSON.stringify({
                    title: '『 Simpel Menu 』',
                    sections: [{
                        title: '『 Simpel Menu 』',
                        highlight_label: '',
                        rows: [{ title: 'General Menu', description: 'Info bot, ping, profile, script', id: 'generalmenu' }]
                    }, {
                        highlight_label: '',
                        rows: [{ title: 'Owner Menu', description: 'Set mode, block, broadcast, dll', id: 'ownermenu' }]
                    }, {
                        highlight_label: '',
                        rows: [{ title: 'Ffmpeg Menu', description: 'Sticker, nulis, media convert', id: 'ffmpegmenu' }]
                    }, {
                        highlight_label: '',
                        rows: [{ title: 'Downloader Menu', description: 'YT, TikTok, IG, FB, MediaFire, dll', id: 'downloadmenu' }]
                    }, {
                        highlight_label: '',
                        rows: [{ title: 'Tools Menu', description: 'Cek bio, cuaca, translate, wiki', id: 'toolsmenu' }]
                    }, {
                        highlight_label: 'Khusus Owner Utama',
                        rows: [{ title: 'JadiBot Menu', description: 'Multi session / jadi bot', id: 'jadibotmenu' }]
                    }, {
                        highlight_label: '',
                        rows: [{ title: 'Fun Menu', description: 'Game, truth/dare, quote, random', id: 'funmenu' }]
                    }, {
                        highlight_label: '',
                        rows: [{ title: 'Group Menu', description: 'Admin group, antilink, welcome', id: 'groupmenu' }]
                    }, {
                        highlight_label: '',
                        rows: [{ title: 'IoT Menu', description: 'Kontrol relay, LED, MQTT', id: 'iotmenu' }]
                    }, {
                        highlight_label: '',
                        rows: [{ title: 'Extra Menu', description: 'Afk, shortlink, jadwal sholat, gempa, QR', id: 'extramenu' }]
                    }]
                })
            }
        ]
    });
}

/* ────────────────────────────────────────────────
 *  STYLE 2 — Product message + list pilihan menu
 * ──────────────────────────────────────────────── */
async function menuStyle2(m) {
    const { Hanz } = m;

    await Hanz.sendMessage(m.chat, {
        productMessage: {
            title: config.botName,
            description: 'X',
            thumbnail: getImage(),
            productId: 'PROD001',
            retailerId: 'RETAIL001',
            url: 'https://github.com/harissfx/basebot-wa',
            body: buildMenuText(m),
            footer: config.footerTxt,
            priceAmount1000: 999999,
            currencyCode: 'USD',
            buttons: [
            { name: 'cta_url', buttonParamsJson: JSON.stringify({ display_text: 'Lapor Bug', url: 'https://t.me/HanzOfc' }) },
            { name: 'cta_url', buttonParamsJson: JSON.stringify({ display_text: 'Website Toko', url: 'https://hanzofc.my.id', webview_presentation: true, payment_link_preview: true, webview_interaction: true }) },
            {name: 'single_select', buttonParamsJson: JSON.stringify({
                    title: '『 Simpel Menu 』',
                    sections: [{
                        title: '『 Simpel Menu 』',
                        highlight_label: '',
                        rows: [{ title: 'General Menu', description: 'Info bot, ping, profile, script', id: 'generalmenu' }]
                    }, {
                        highlight_label: '',
                        rows: [{ title: 'Owner Menu', description: 'Set mode, block, broadcast, dll', id: 'ownermenu' }]
                    }, {
                        highlight_label: '',
                        rows: [{ title: 'Ffmpeg Menu', description: 'Sticker, nulis, media convert', id: 'ffmpegmenu' }]
                    }, {
                        highlight_label: '',
                        rows: [{ title: 'Downloader Menu', description: 'YT, TikTok, IG, FB, MediaFire, dll', id: 'downloadmenu' }]
                    }, {
                        highlight_label: '',
                        rows: [{ title: 'Tools Menu', description: 'Cek bio, cuaca, translate, wiki', id: 'toolsmenu' }]
                    }, {
                        highlight_label: 'Khusus Owner Utama',
                        rows: [{ title: 'JadiBot Menu', description: 'Multi session / jadi bot', id: 'jadibotmenu' }]
                    }, {
                        highlight_label: '',
                        rows: [{ title: 'Fun Menu', description: 'Game, truth/dare, quote, random', id: 'funmenu' }]
                    }, {
                        highlight_label: '',
                        rows: [{ title: 'Group Menu', description: 'Admin group, antilink, welcome', id: 'groupmenu' }]
                    }, {
                        highlight_label: '',
                        rows: [{ title: 'IoT Menu', description: 'Kontrol relay, LED, MQTT', id: 'iotmenu' }]
                    }, {
                        highlight_label: '',
                        rows: [{ title: 'Extra Menu', description: 'Afk, shortlink, jadwal sholat, gempa, QR', id: 'extramenu' }]
                    }]
                })
            }
        ]
        }
    }, { quoted: m.fakePay });
}

const STYLES = { 1: menuStyle1, 2: menuStyle2 };

const handler = async (m) => {
    const { command } = m;

    switch (command.name) {
        case 'menu': {
            const style = getMenuStyle(m);
            try {
                await (STYLES[style] || menuStyle1)(m);
            } catch (err) {
                console.error(`[MENU] Style ${style} gagal:`, err.stack || err);
                await m.reply({
                    text: `⚠️ Menu style *${style}* gagal ditampilkan, dialihkan ke style 1.\n` +
                        `Error: ${err.message || err}`
                });
                await menuStyle1(m);
            }
        }
            break;
        case 'menu1': await menuStyle1(m); break;
        case 'menu2': await menuStyle2(m); break;

        case 'listcommand':
        case 'allmenu': {
            const { Hanz, pushname } = m;
            const p = getPrefix(m);

            const imgBuffer = getImage();
            let thumbnailBuffer;
            try {
                thumbnailBuffer = imgBuffer
                    ? await sharp(imgBuffer).resize(300, 300).jpeg({ quality: 80 }).toBuffer()
                    : undefined;
            } catch {}

            const u = process.uptime();
            const hari = Math.floor(u / 86400);
            const jam = Math.floor((u % 86400) / 3600);
            const menit = Math.floor((u % 3600) / 60);
            const detik = Math.floor(u % 60);

            const byFile = plugins.commandsByFile();
            const excludeMenus = ['generalmenu', 'ownermenu', 'ffmpegmenu', 'downloadmenu', 'toolsmenu', 'jadibotmenu', 'funmenu', 'groupmenu', 'extramenu'];
            const listText = Object.entries(byFile)
                .filter(([file]) => file !== 'menu')
                .map(([file, cmds]) => {
                    const filtered = cmds.filter(cmd => !excludeMenus.includes(cmd));
                    if (!filtered.length) return null;
                    return `『 ${file} 』\n${filtered.map(cmd => `⪩ \`${p}${cmd}\``).join('\n')}`;
                })
                .filter(Boolean)
                .join('\n\n');

            const totalCmds = plugins.commandList().length;

            const contentText = `Information Bot
╭──────────────➤
│ Creator : *${getOwnerDisplay(m.Hanz, m.isMain).number}*
│ Nama Bot : *${config.botName}*
│ Version : *${pkg.version}*
│ Mode : *${String(getSetting(m.Hanz, m.isMain, 'botMode')).toUpperCase()}*
│ Total cmd: *${totalCmds}* command
│ Runtime : *${hari}h ${jam}j ${menit}m ${detik}d*
╰─────┈➤

${listText}`;

        

            const msg = generateWAMessageFromContent(m.chat, {
                interactiveMessage: {
                    header: {
                        hasMediaAttachment: true,
                        locationMessage: {
                            degreesLatitude: 0,
                            degreesLongitude: 0,
                            name: `✦ Halo 👋 @${pushname || ''}`,
                            address: `Perkenalkan saya ${config.botName}`,
                            url: 'https://hanzofc.my.id',
                            jpegThumbnail: thumbnailBuffer
                        }
                    },
                    body: {
                        text: contentText
                    },
                    footer: {
                        text: config.footerTxt,
                    },
                    nativeFlowMessage: {
                        messageParamsJson: JSON.stringify({
                            bottom_sheet: {
                                in_thread_buttons_limit: 1,
                                divider_indices: [1, 2, 3, 4, 5, 999],
                                list_title: 'All Menu',
                                button_icon: 'REVIEW',
                                button_title: 'Buka Menu'
                            }
                        }),
        buttons: [
            { name: 'cta_url', buttonParamsJson: JSON.stringify({ display_text: 'Lapor Bug', url: 'https://t.me/HanzOfc' }) },
            { name: 'cta_url', buttonParamsJson: JSON.stringify({ display_text: 'Website Toko', url: 'https://hanzofc.my.id', webview_presentation: true, payment_link_preview: true, webview_interaction: true }) },
            {name: 'single_select', buttonParamsJson: JSON.stringify({
                    title: '『 Simpel Menu 』',
                    sections: [{
                        title: '『 Global Menu 』',
                        highlight_label: '',
                        rows: [{ title: 'General Menu', description: 'Info bot, ping, profile, script', id: 'generalmenu' }]
                    }, {
                        highlight_label: '',
                        rows: [{ title: 'Owner Menu', description: 'Set mode, block, broadcast, dll', id: 'ownermenu' }]
                    }, {
                        highlight_label: '',
                        rows: [{ title: 'Ffmpeg Menu', description: 'Sticker, nulis, media convert', id: 'ffmpegmenu' }]
                    }, {
                        highlight_label: '',
                        rows: [{ title: 'Downloader Menu', description: 'YT, TikTok, IG, FB, MediaFire, dll', id: 'downloadmenu' }]
                    }, {
                        highlight_label: '',
                        rows: [{ title: 'Tools Menu', description: 'Cek bio, cuaca, translate, wiki', id: 'toolsmenu' }]
                    }, {
                        highlight_label: 'Khusus Owner Utama',
                        rows: [{ title: 'JadiBot Menu', description: 'Multi session / jadi bot', id: 'jadibotmenu' }]
                    }, {
                        highlight_label: '',
                        rows: [{ title: 'Fun Menu', description: 'Game, truth/dare, quote, random', id: 'funmenu' }]
                    }, {
                        highlight_label: '',
                        rows: [{ title: 'Group Menu', description: 'Admin group, antilink, welcome', id: 'groupmenu' }]
                    }, {
                        highlight_label: '',
                        rows: [{ title: 'IoT Menu', description: 'Kontrol relay, LED, MQTT', id: 'iotmenu' }]
                    }, {
                        highlight_label: '',
                        rows: [{ title: 'Extra Menu', description: 'Afk, shortlink, jadwal sholat, gempa, QR', id: 'extramenu' }]
                    }]
                })
            }
        ]
                    }
                }
            }, { quoted: m.fakePay });

            await Hanz.relayMessage(m.chat, msg.message, {
                messageId: msg.key.id,
                additionalNodes: [{
                    tag: 'biz',
                    attrs: {
                        actual_actors: '2',
                        host_storage: '2',
                        privacy_mode_ts: String(Math.floor(Date.now() / 1000))
                    },
                    content: [
                        {
                            tag: 'engagement',
                            attrs: {
                                customer_service_state: 'open',
                                conversation_state: 'open'
                            }
                        },
                        {
                            tag: 'interactive',
                            attrs: { type: 'native_flow', v: '1' },
                            content: [{ tag: 'native_flow', attrs: { v: '9', name: 'mixed' } }]
                        }
                    ]
                }]
            });
        }
            break;
    }
};

module.exports = handler;