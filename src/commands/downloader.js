/**
 * downloader.js — Download media dari YouTube, TikTok, Twitter/X
 *
 * Commands:
 *   !ytmp3 <url>   → YouTube audio (MP3)
 *   !ytmp4 <url>   → YouTube video (MP4, max 480p)
 *   !tiktok <url>  → TikTok video tanpa watermark
 *   !xdl <url>     → Twitter/X video
 *
 * Requirement: yt-dlp harus terinstall di sistem
 *   curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp \
 *     -o /usr/local/bin/yt-dlp && chmod +x /usr/local/bin/yt-dlp
 */

'use strict';

const fs = require('fs');
const config = require('../config');
const plugins = require('../utils/PluginLoader');
const { getDevice } = require('@whiskeysockets/baileys');
const {
    MAX_SIZE_MB,
    getInfo,
    download,
    cleanTmp,
    formatDuration,
    fileSizeMB,
} = require('../../lib/ytdlp');

// ─── Handler ──────────────────────────────────────────────────────────────────
const handler = async (m) => {
    const { command, isSuperOwner, Hanz, sender, msg, senderNumber, pushname, isOwner } = m;
    const url = command.fullArgs?.trim();
    const p = config.prefix;

    switch (command.name) {

        case 'downloadmenu':
            const device = getDevice(msg.key.id);
            const role = isSuperOwner ? 'Super Owner' : (isOwner ? 'Co-Owner' : 'User');
            const nomorUser = senderNumber;
            const downloadCmds = plugins.commandsByFile()['downloader'] || [];
            let menu = `┌─❖「 𝗜𝗡𝗙𝗢 𝗨𝗦𝗘𝗥 」
│● 𝘕𝘢𝘮𝘢: ${pushname}
│● 𝘕𝘰𝘮𝘰𝘳: ${nomorUser}
│● 𝘚𝘵𝘢𝘵𝘮𝘴: ${role}
│● 𝘗𝘦𝘳𝘢𝘯𝘨𝘬𝘢𝘵: ${device}
│
└┬❖ 
┌┤𝖧𝖺𝗒 𝗄𝖺𝗄 ${pushname} 👋
│└────────────┈ ⳹
│「 𝗗𝗢𝗪𝗡𝗟𝗢𝗔𝗗 𝗠𝗘𝗡𝗨 」       
│
${downloadCmds.map(cmd => `│⪩ \`${p}${cmd}\``).join('\n')}
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

        // ── !ytmp3 ── YouTube → Audio MP3 ─────────────────────────────────────
        case 'ytmp3': {
            if (!url) return m.reply({ text: '❌ Contoh: `!ytmp3 https://youtu.be/xxx`' });

            await m.react('⏳');
            let filePath;
            try {
                await m.reply({ text: '🔍 Mengambil info lagu...' });
                const info = await getInfo(url);

                const durSec = info.duration || 0;
                if (durSec > 15 * 60) {
                    await m.react('❌');
                    return m.reply({ text: `❌ Durasi terlalu panjang (${formatDuration(durSec)}). Maksimal 15 menit.` });
                }

                await m.reply({
                    text: [
                        `🎵 *${info.title}*`,
                        `⏱️ Durasi: ${formatDuration(durSec)}`,
                        `⬇️ Sedang mendownload audio...`,
                    ].join('\n')
                });

                filePath = await download(url, [
                    '-x',
                    '--audio-format', 'mp3',
                    '--audio-quality', '128K',
                ], 'mp3');

                const sizeMB = fileSizeMB(filePath);
                if (sizeMB > MAX_SIZE_MB) {
                    cleanTmp(filePath);
                    await m.react('❌');
                    return m.reply({ text: `❌ File terlalu besar (${sizeMB.toFixed(1)} MB). Coba lagu yang lebih pendek.` });
                }

                await Hanz.sendMessage(sender, {
                    audio: fs.readFileSync(filePath),
                    mimetype: 'audio/mpeg',
                    fileName: `${info.title}.mp3`,
                    ptt: false,
                }, { quoted: msg });

                cleanTmp(filePath);
                await m.react('✅');

            } catch (err) {
                cleanTmp(filePath);
                console.error('[YTMP3 ERROR]', err.message);
                await m.react('❌');
                await m.reply({ text: `❌ Gagal download audio.\nError: ${err.message.slice(0, 200)}` });
            }
            break;
        }

        // ── !ytmp4 ── YouTube → Video MP4 ─────────────────────────────────────
        case 'ytmp4': {
            if (!url) return m.reply({ text: '❌ Contoh: `!ytmp4 https://youtu.be/xxx`' });

            await m.react('⏳');
            let filePath;
            try {
                await m.reply({ text: '🔍 Mengambil info video...' });
                const info = await getInfo(url);

                const durSec = info.duration || 0;
                if (durSec > 5 * 60) {
                    await m.react('❌');
                    return m.reply({ text: `❌ Durasi terlalu panjang (${formatDuration(durSec)}). Maksimal 5 menit untuk video.` });
                }

                await m.reply({
                    text: [
                        `🎬 *${info.title}*`,
                        `⏱️ Durasi: ${formatDuration(durSec)}`,
                        `⬇️ Sedang mendownload video (max 480p)...`,
                    ].join('\n')
                });

                filePath = await download(url, [
                    '-f', 'bestvideo[height<=480][ext=mp4]+bestaudio[ext=m4a]/best[height<=480][ext=mp4]/best[height<=480]',
                    '--merge-output-format', 'mp4',
                ], 'mp4');

                const sizeMB = fileSizeMB(filePath);
                if (sizeMB > MAX_SIZE_MB) {
                    cleanTmp(filePath);
                    await m.react('❌');
                    return m.reply({ text: `❌ File terlalu besar (${sizeMB.toFixed(1)} MB). Coba video lebih pendek.` });
                }

                await Hanz.sendMessage(sender, {
                    video: fs.readFileSync(filePath),
                    mimetype: 'video/mp4',
                    fileName: `${info.title}.mp4`,
                    caption: `🎬 *${info.title}*\n⏱️ ${formatDuration(durSec)}`,
                }, { quoted: msg });

                cleanTmp(filePath);
                await m.react('✅');

            } catch (err) {
                cleanTmp(filePath);
                console.error('[YTMP4 ERROR]', err.message);
                await m.react('❌');
                await m.reply({ text: `❌ Gagal download video.\nError: ${err.message.slice(0, 200)}` });
            }
            break;
        }

        // ── !tiktok ── TikTok video tanpa watermark ────────────────────────────
        case 'tiktok':
        case 'tt': {
            if (!url) return m.reply({ text: '❌ Contoh: `!tiktok https://vt.tiktok.com/xxx`' });

            await m.react('⏳');
            let filePath;
            try {
                await m.reply({ text: '⬇️ Mendownload video TikTok...' });

                filePath = await download(url, [
                    '-f', 'download_addr-0/bestvideo+bestaudio/best',
                    '--merge-output-format', 'mp4',
                ], 'mp4');

                const sizeMB = fileSizeMB(filePath);
                if (sizeMB > MAX_SIZE_MB) {
                    cleanTmp(filePath);
                    await m.react('❌');
                    return m.reply({ text: `❌ File terlalu besar (${sizeMB.toFixed(1)} MB).` });
                }

                let info;
                try { info = await getInfo(url); } catch { }

                await Hanz.sendMessage(sender, {
                    video: fs.readFileSync(filePath),
                    mimetype: 'video/mp4',
                    caption: info?.title ? `🎵 ${info.title}` : '✅ TikTok downloaded!',
                }, { quoted: msg });

                cleanTmp(filePath);
                await m.react('✅');

            } catch (err) {
                cleanTmp(filePath);
                console.error('[TIKTOK ERROR]', err.message);
                await m.react('❌');
                await m.reply({ text: `❌ Gagal download TikTok.\nError: ${err.message.slice(0, 200)}` });
            }
            break;
        }

        // ── !xdl ── Twitter/X video ────────────────────────────────────────────
        case 'xdl':
        case 'twdl':
        case 'twiter':
            {
                if (!url) return m.reply({ text: '❌ Contoh: `!xdl https://x.com/xxx/status/xxx`' });

                await m.react('⏳');
                let filePath;
                try {
                    await m.reply({ text: '⬇️ Mendownload video dari X/Twitter...' });

                    filePath = await download(url, [
                        '-f', 'best[ext=mp4]/best',
                        '--merge-output-format', 'mp4',
                    ], 'mp4');

                    const sizeMB = fileSizeMB(filePath);
                    if (sizeMB > MAX_SIZE_MB) {
                        cleanTmp(filePath);
                        await m.react('❌');
                        return m.reply({ text: `❌ File terlalu besar (${sizeMB.toFixed(1)} MB).` });
                    }

                    await Hanz.sendMessage(sender, {
                        video: fs.readFileSync(filePath),
                        mimetype: 'video/mp4',
                        caption: '✅ Downloaded dari X/Twitter!',
                    }, { quoted: msg });

                    cleanTmp(filePath);
                    await m.react('✅');

                } catch (err) {
                    cleanTmp(filePath);
                    console.error('[XDL ERROR]', err.message);
                    await m.react('❌');
                    await m.reply({ text: `❌ Gagal download dari X/Twitter.\nError: ${err.message.slice(0, 200)}` });
                }
                break;
            }

        // ── !igdl ── Instagram ──────────────────────────────────────────────
        case 'instagram':
        case 'igdl':
            {
                if (!url) return m.reply({ text: '❌ Contoh: `!igdl https://www.instagram.com/reel/...`' });

                await m.react('⏳');
                let filePath;

                try {
                    await m.reply({ text: '⬇️ Mendownload Instagram...' });

                    filePath = await download(url, [
                        '-f', 'best',
                        '--merge-output-format', 'mp4',
                    ], 'mp4');

                    const sizeMB = fileSizeMB(filePath);

                    if (sizeMB > MAX_SIZE_MB) {
                        cleanTmp(filePath);
                        await m.react('❌');
                        return m.reply({
                            text: `❌ File terlalu besar (${sizeMB.toFixed(1)} MB).`
                        });
                    }

                    let info;
                    try { info = await getInfo(url); } catch { }

                    await Hanz.sendMessage(sender, {
                        video: fs.readFileSync(filePath),
                        mimetype: 'video/mp4',
                        caption: info?.title || '✅ Instagram Downloaded!'
                    }, { quoted: msg });

                    cleanTmp(filePath);
                    await m.react('✅');

                } catch (err) {
                    cleanTmp(filePath);
                    console.error('[IGDL ERROR]', err.message);

                    await m.react('❌');
                    await m.reply({
                        text: `❌ Gagal download Instagram.\nError: ${err.message.slice(0, 200)}`
                    });
                }
                break;
            }

        // ── !fbdl ── Facebook ───────────────────────────────────────────────
        case 'fb':
        case 'fbdl':
        case 'facebook':
            {
                if (!url) return m.reply({ text: '❌ Contoh: `!fbdl https://facebook.com/...`' });

                await m.react('⏳');
                let filePath;

                try {
                    await m.reply({ text: '⬇️ Mendownload Facebook...' });

                    filePath = await download(url, [
                        '-f', 'best',
                        '--merge-output-format', 'mp4',
                    ], 'mp4');

                    const sizeMB = fileSizeMB(filePath);

                    if (sizeMB > MAX_SIZE_MB) {
                        cleanTmp(filePath);
                        await m.react('❌');
                        return m.reply({
                            text: `❌ File terlalu besar (${sizeMB.toFixed(1)} MB).`
                        });
                    }

                    let info;
                    try { info = await getInfo(url); } catch { }

                    await Hanz.sendMessage(sender, {
                        video: fs.readFileSync(filePath),
                        mimetype: 'video/mp4',
                        caption: info?.title || '✅ Facebook Downloaded!'
                    }, { quoted: msg });

                    cleanTmp(filePath);
                    await m.react('✅');

                } catch (err) {
                    cleanTmp(filePath);
                    console.error('[FBDL ERROR]', err.message);

                    await m.react('❌');
                    await m.reply({
                        text: `❌ Gagal download Facebook.\nError: ${err.message.slice(0, 200)}`
                    });
                }
                break;
            }

        // ── !pindl ── Pinterest Video ───────────────────────────────────────
        case 'pinterest':
        case 'pindl':
        case 'pin': {
            if (!url) return m.reply({ text: '❌ Contoh: `!pindl https://pin.it/...`' });

            await m.react('⏳');
            let filePath;

            try {
                await m.reply({ text: '⬇️ Mendownload Pinterest...' });

                filePath = await download(url, [
                    '-f', 'best',
                    '--merge-output-format', 'mp4',
                ], 'mp4');

                const sizeMB = fileSizeMB(filePath);

                if (sizeMB > MAX_SIZE_MB) {
                    cleanTmp(filePath);
                    await m.react('❌');
                    return m.reply({
                        text: `❌ File terlalu besar (${sizeMB.toFixed(1)} MB).`
                    });
                }

                let info;
                try { info = await getInfo(url); } catch { }

                await Hanz.sendMessage(sender, {
                    video: fs.readFileSync(filePath),
                    mimetype: 'video/mp4',
                    caption: info?.title || '✅ Pinterest Downloaded!'
                }, { quoted: msg });

                cleanTmp(filePath);
                await m.react('✅');

            } catch (err) {
                cleanTmp(filePath);
                console.error('[PINDL ERROR]', err.message);

                await m.react('❌');
                await m.reply({
                    text: `❌ Gagal download Pinterest.\nError: ${err.message.slice(0, 200)}`
                });
            }
            break;
        }

    }
};

module.exports = handler;