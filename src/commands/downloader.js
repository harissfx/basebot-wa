'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const axios = require('axios');
const config = require('../config');
const plugins = require('../utils/PluginLoader');
const { getDevice } = require('baileys');
const {
    MAX_SIZE_MB,
    getInfo,
    download,
    cleanTmp,
    formatDuration,
    fileSizeMB,
} = require('../../lib/ytdlp');
const { Tiktok } = require('../../lib/tiktok');
const { mediafireDl } = require('../../lib/mediafire');
const { getTweetMedia } = require('../../lib/twitterphoto');
const { SpotifyDl } = require('../../lib/spotify');
const { AppleMusicDl } = require('../../lib/applemusic');
const { ThreadsDl } = require('../../lib/threads');

const IMAGE_EXTS = ['jpg', 'jpeg', 'png', 'webp'];
const VIDEO_EXTS = ['mp4', 'mov', 'webm', 'mkv'];

function isImageEntry(entry) {
    if (!entry) return false;

    const hasVideoFormat = Array.isArray(entry.formats)
        && entry.formats.some(f => f.vcodec && f.vcodec !== 'none');
    if (hasVideoFormat) return false;

    if (entry.vcodec && entry.vcodec !== 'none') return false;
    if (VIDEO_EXTS.includes((entry.ext || '').toLowerCase())) return false;
    if (IMAGE_EXTS.includes((entry.ext || '').toLowerCase())) return true;

    return true;
}

function pickImageUrl(entry) {
    if (!entry) return null;
    if (entry.url && !VIDEO_EXTS.some(ext => entry.url.toLowerCase().includes(`.${ext}`))) return entry.url;
    if (entry.display_url) return entry.display_url;
    if (Array.isArray(entry.thumbnails) && entry.thumbnails.length) {
        return entry.thumbnails[entry.thumbnails.length - 1].url;
    }
    return null;
}

async function fetchDirectBuffer(url) {
    const res = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 60000,
        maxContentLength: MAX_SIZE_MB * 1024 * 1024 * 2,
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
    });
    return Buffer.from(res.data);
}

const handler = async (m) => {
    const { command, isSuperOwner, Hanz, msg, senderNumber, pushname, isOwner } = m;
    const url = command.fullArgs?.trim();
    const p = m.prefix;
    const nomorUser = senderNumber;

    switch (command.name) {

        case 'downloadmenu':
            const device = getDevice(msg.key.id);
            const downloadCmds = (plugins.commandsByFile()['downloader'] || [])
            .filter(cmd => !['downloadmenu'].includes(cmd));
            const role = isSuperOwner ? 'Super Owner' : (isOwner ? 'Co-Owner' : 'User biasa');
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
                quoted: m.fakePay,
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
                            }, {
                                highlight_label: "",
                                rows: [{ title: "Extra Menu", description: "Select to display extra menu", id: "extramenu" }]
                            }]
                        })
                    }]
            });
            break;

        case 'ytmp3': {
            if (!url) return m.reply({ text: '❌ Contoh: `' + m.prefix + 'ytmp3 https://youtu.be/xxx`' });

            await m.react('⏳');
            let filePath;
            try {
                const info = await getInfo(url);

                const durSec = info.duration || 0;
                if (durSec > 15 * 60) {
                    await m.react('❌');
                    return m.reply({ text: `❌ Durasi terlalu panjang (${formatDuration(durSec)}). Maksimal 15 menit.` });
                }

                filePath = await download(url, [
                    '-f', 'bestaudio/worst[height<=360]/worst',
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

                await Hanz.sendMessage(m.chat, {
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
        }
            break;

        case 'ytmp4': {
            if (!url) return m.reply({ text: '❌ Contoh: `' + m.prefix + 'ytmp4 https://youtu.be/xxx`' });

            await m.react('⏳');
            let filePath;
            try {
                const info = await getInfo(url);

                const durSec = info.duration || 0;
                if (durSec > 5 * 60) {
                    await m.react('❌');
                    return m.reply({ text: `❌ Durasi terlalu panjang (${formatDuration(durSec)}). Maksimal 5 menit untuk video.` });
                }

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

                await Hanz.sendMessage(m.chat, {
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
        }
            break;

        case 'play':
        case 'ytplay': {
            const query = command.fullArgs?.trim();
            if (!query) return m.reply({ text: '❌ Contoh: `' + m.prefix + 'play Kokoronashi`\nAtau: `' + m.prefix + 'ytplay Lagu favorit`' });

            await m.react('⏳');
            try {
                await m.reply({ text: '🔍 Mencari di YouTube...' });
                let yts;
                try {
                    yts = require('yt-search');
                } catch {
                    await m.react('❌');
                    return m.reply({ text: '❌ Package `yt-search` belum terinstall.\nJalankan: `npm install yt-search`' });
                }

                const search = await yts(query);
                if (!search?.videos?.length) {
                    await m.react('❌');
                    return m.reply({ text: '❌ Tidak ditemukan hasil pencarian.' });
                }

                const anu = search.videos[0];
                let thumbUrl = anu.thumbnail || anu.image || '';
                if (thumbUrl && thumbUrl.startsWith('//')) thumbUrl = 'https:' + thumbUrl;
                if (!thumbUrl || !thumbUrl.startsWith('http')) {
                    thumbUrl = `https://i.ytimg.com/vi/${anu.videoId}/hqdefault.jpg`;
                }

                const caption = [
                    `🎵 *${anu.title}*`,
                    ``,
                    `⏱️ Durasi : ${anu.timestamp || '-'}`,
                    `👁️ Views  : ${anu.views?.toLocaleString?.() || anu.views || '-'}`,
                    `📅 Upload : ${anu.ago || '-'}`,
                    `👤 Channel: ${anu.author?.name || '-'}`,
                    `🔗 Url    : ${anu.url}`,
                    ``,
                    `_Pilih format download di bawah:_`,
                ].join('\n');
                try {
                    await m.sendButtonWithImage({
                        imageUrl: thumbUrl,
                        text: caption,
                        footer: config.footerTxt,
                        quoted: msg,
                        buttons: [
                            { text: '🎵 AUDIO', id: `ytmp3 ${anu.url}` },
                            { text: '🎥 VIDEO', id: `ytmp4 ${anu.url}` },
                        ],
                    });
                } catch (imgErr) {
                    console.warn('[PLAY] Gagal kirim dengan gambar:', imgErr.message);
                    await m.sendButtons({
                        text: caption,
                        footer: config.footerTxt,
                        quoted: msg,
                        buttons: [
                            { text: '🎵 AUDIO', id: `ytmp3 ${anu.url}` },
                            { text: '🎥 VIDEO', id: `ytmp4 ${anu.url}` },
                        ],
                    });
                }

                await m.react('✅');
            } catch (err) {
                console.error('[PLAY ERROR]', err.message);
                await m.react('❌');
                await m.reply({ text: `❌ Gagal mencari lagu.\nError: ${err.message.slice(0, 200)}` });
            }
        }
            break;

        case 'tiktok':
        case 'tt':
        case 'tiktoknowm': {
            if (!url) return m.reply({ text: '❌ Contoh: `' + m.prefix + 'tiktok https://vt.tiktok.com/xxx`' });
            if (!url.includes('tiktok')) return m.reply({ text: '❌ Link bukan TikTok!' });

            await m.react('⏳');
            try {
                await m.reply({ text: '⬇️ Mengambil video TikTok (no watermark)...' });

                const data = await Tiktok(url);

                if (!data.nowm) {
                    await m.react('❌');
                    return m.reply({ text: '❌ Gagal mendapatkan link video.' });
                }

                await Hanz.sendMessage(m.chat, {
                    video: { url: data.nowm },
                    mimetype: 'video/mp4',
                    caption: [
                        `🎵 *${data.title}*`,
                        `👤 ${data.author}`,
                        data.duration ? `⏱️ ${Math.floor(data.duration / 60)}:${String(data.duration % 60).padStart(2, '0')}` : '',
                    ].filter(Boolean).join('\n'),
                }, { quoted: msg });

                await m.react('✅');
            } catch (err) {
                console.error('[TIKTOK ERROR]', err.message);
                await m.react('❌');
                await m.reply({ text: `❌ Gagal download TikTok.\nError: ${err.message.slice(0, 200)}` });
            }
        }
            break;

        case 'tiktokaudio':
        case 'ttaudio':
        case 'ttmp3': {
            if (!url) return m.reply({ text: '❌ Contoh: `' + m.prefix + 'tiktokaudio https://vt.tiktok.com/xxx`' });
            if (!url.includes('tiktok')) return m.reply({ text: '❌ Link bukan TikTok!' });

            await m.react('⏳');
            try {
                await m.reply({ text: '⬇️ Mengambil audio TikTok...' });

                const data = await Tiktok(url);

                if (!data.audio) {
                    await m.react('❌');
                    return m.reply({ text: '❌ Gagal mendapatkan link audio.' });
                }

                await Hanz.sendMessage(m.chat, {
                    audio: { url: data.audio },
                    mimetype: 'audio/mpeg',
                    fileName: `${data.title || 'tiktok'}.mp3`,
                    ptt: false,
                }, { quoted: msg });

                await m.react('✅');
            } catch (err) {
                console.error('[TIKTOKAUDIO ERROR]', err.message);
                await m.react('❌');
                await m.reply({ text: `❌ Gagal download audio TikTok.\nError: ${err.message.slice(0, 200)}` });
            }
        }
            break;

        case 'xdl':
        case 'twdl':
        case 'twiter':
            {
                if (!url) return m.reply({ text: '❌ Contoh: `' + m.prefix + 'xdl https://x.com/xxx/status/xxx`' });

                await m.react('⏳');
                let filePath;
                try {
                    await m.reply({ text: '⬇️ Mendownload dari X/Twitter...' });

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

                    await Hanz.sendMessage(m.chat, {
                        video: fs.readFileSync(filePath),
                        mimetype: 'video/mp4',
                        caption: '✅ Downloaded dari X/Twitter!',
                    }, { quoted: msg });

                    cleanTmp(filePath);
                    await m.react('✅');

                } catch (ytErr) {
                    cleanTmp(filePath);
                    console.error('[XDL ERROR]', ytErr.message);

                    try {
                        const { media } = await getTweetMedia(url);

                        if (media.length > 1) {
                            const mediaParts = media.map(item => item.type === 'photo'
                                ? { image: { url: item.url } }
                                : { video: { url: item.url }, mimetype: 'video/mp4' });
                            mediaParts[0].caption = '✅ Downloaded dari X/Twitter!';

                            await m.reply({ albumMessage: mediaParts });
                        } else {
                            const item = media[0];
                            await Hanz.sendMessage(m.chat, item.type === 'photo'
                                ? { image: { url: item.url }, caption: '✅ Downloaded dari X/Twitter!' }
                                : { video: { url: item.url }, mimetype: 'video/mp4', caption: '✅ Downloaded dari X/Twitter!' },
                                { quoted: msg });
                        }

                        await m.react('✅');
                    } catch (fallbackErr) {
                        console.error('[XDL FALLBACK ERROR]', fallbackErr.message);
                        await m.react('❌');
                        await m.reply({
                            text: `❌ Gagal download dari X/Twitter.\nError: ${ytErr.message.slice(0, 150)}\nFallback juga gagal: ${fallbackErr.message.slice(0, 150)}`
                        });
                    }
                }
            }
                break;

        case 'instagram':
        case 'igdl':
            {
                if (!url) return m.reply({ text: '❌ Contoh: `' + m.prefix + 'igdl https://www.instagram.com/reel/...` (video, foto, atau carousel)' });

                await m.react('⏳');
                let filePath;

                try {
                    let info;
                    try {
                        info = await getInfo(url, ['--ignore-no-formats-error']);
                    } catch (e) {
                        throw new Error(`Gagal ambil metadata: ${e.message}`);
                    }

                    const entries = Array.isArray(info.entries) && info.entries.length ? info.entries : [info];
                    const caption = info.title || info.description?.slice(0, 200) || '✅ Instagram Downloaded!';

                    if (entries.length > 1) {
                        await m.reply({ text: `⬇️ Mendownload carousel (${entries.length} item)...` });

                        const mediaParts = [];
                        for (const entry of entries) {
                            try {
                                if (isImageEntry(entry)) {
                                    const directUrl = pickImageUrl(entry);
                                    if (!directUrl) continue;
                                    const buf = await fetchDirectBuffer(directUrl);
                                    mediaParts.push({ image: buf });
                                } else if (entry.url) {
                                    const buf = await fetchDirectBuffer(entry.url);
                                    const sizeMB = buf.length / (1024 * 1024);
                                    if (sizeMB <= MAX_SIZE_MB) {
                                        mediaParts.push({ video: buf, mimetype: 'video/mp4' });
                                    }
                                } else {
                                    const vidPath = await download(entry.webpage_url || url, [
                                        '-f', 'best',
                                        '--merge-output-format', 'mp4',
                                    ], 'mp4');
                                    const sizeMB = fileSizeMB(vidPath);
                                    if (sizeMB <= MAX_SIZE_MB) {
                                        mediaParts.push({ video: fs.readFileSync(vidPath), mimetype: 'video/mp4' });
                                    }
                                    cleanTmp(vidPath);
                                }
                            } catch (itemErr) {
                                console.error('[IGDL ITEM ERROR]', itemErr.message);
                            }
                        }

                        if (!mediaParts.length) throw new Error('Semua item di carousel gagal didownload');

                        mediaParts[0].caption = caption;

                        await m.reply({ albumMessage: mediaParts });
                        await m.react('✅');

                    } else if (isImageEntry(info)) {
                
                        await m.reply({ text: '⬇️ Mendownload foto Instagram...' });

                        const directUrl = pickImageUrl(info);
                        if (!directUrl) throw new Error('URL gambar tidak ditemukan di metadata');

                        const buf = await fetchDirectBuffer(directUrl);
                        const sizeMB = buf.length / (1024 * 1024);
                        if (sizeMB > MAX_SIZE_MB) {
                            await m.react('❌');
                            return m.reply({ text: `❌ File terlalu besar (${sizeMB.toFixed(1)} MB).` });
                        }

                        await Hanz.sendMessage(m.chat, { image: buf, caption }, { quoted: msg });
                        await m.react('✅');

                    } else {
                    
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

                        await Hanz.sendMessage(m.chat, {
                            video: fs.readFileSync(filePath),
                            mimetype: 'video/mp4',
                            caption
                        }, { quoted: msg });

                        cleanTmp(filePath);
                        await m.react('✅');
                    }

                } catch (err) {
                    cleanTmp(filePath);
                    console.error('[IGDL ERROR]', err.message);

                    await m.react('❌');
                    await m.reply({
                        text: `❌ Gagal download Instagram.\nError: ${err.message.slice(0, 200)}`
                    });
                }
            }
                break;

        case 'fb':
        case 'fbdl':
        case 'facebook':
            {
                if (!url) return m.reply({ text: '❌ Contoh: `' + m.prefix + 'fbdl https://facebook.com/...`' });

                await m.react('⏳');
                let filePath;

                const fbOnlyArgs = ['--ies', 'facebook'];

                try {
                    await m.reply({ text: '⬇️ Mendownload Facebook...' });

                    filePath = await download(url, [
                        '-f', 'best',
                        '--merge-output-format', 'mp4',
                        ...fbOnlyArgs,
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
                    try { info = await getInfo(url, fbOnlyArgs); } catch { }

                    if (info && info.extractor_key && info.extractor_key.toLowerCase() !== 'facebook') {
                        cleanTmp(filePath);
                        await m.react('❌');
                        return m.reply({
                            text: '❌ Link ini nggak bisa dipastikan asalnya dari Facebook (extractor mismatch). Download dibatalkan demi keamanan.'
                        });
                    }

                    await Hanz.sendMessage(m.chat, {
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
                        text: `❌ Gagal download Facebook.\nError: ${err.message.slice(0, 200)}\n\n💡 Kalau link-nya berupa /share/p/..., coba buka dulu link-nya di browser (sambil login FB), copy URL asli yang muncul di address bar (biasanya ada /videos/ atau /reel/), baru pakai itu.`
                    });
                }
            }
                break;

case 'shorts':
case 'ytshorts': {
    if (!url) return m.reply({ text: '❌ Contoh: `' + m.prefix + 'shorts https://youtube.com/shorts/xxx`' });

    await m.react('⏳');
    let filePath;
    try {
        await m.reply({ text: '⬇️ Mendownload Shorts...' });

        filePath = await download(url, [
            '-f', 'best[ext=mp4][height<=1080]/best[ext=mp4]/best',
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

        await Hanz.sendMessage(m.chat, {
            video: fs.readFileSync(filePath),
            mimetype: 'video/mp4',
            caption: info?.title ? `📱 *${info.title}*` : '✅ Shorts downloaded!',
        }, { quoted: msg });

        cleanTmp(filePath);
        await m.react('✅');

    } catch (err) {
        cleanTmp(filePath);
        console.error('[SHORTS ERROR]', err.message);
        await m.react('❌');
        await m.reply({ text: `❌ Gagal download Shorts.\nError: ${err.message.slice(0, 200)}` });
    }
}
    break;
        case 'gitclone': {
            if (!url) return m.reply({ text: '❌ Contoh: `' + m.prefix + 'gitclone https://github.com/user/repo`' });

            const repoMatch = url.match(/github\.com\/([^\/\s]+)\/([^\/\s#?]+)/i);
            if (!repoMatch) return m.reply({ text: '❌ Link GitHub tidak valid!' });

            await m.react('⏳');
            const tmpFile = path.join(os.tmpdir(), `gitclone_${Date.now()}.zip`);
            try {
                const user = repoMatch[1];
                const repoName = repoMatch[2].replace(/\.git$/i, '');

                await m.reply({ text: `⬇️ Mendownload repository *${user}/${repoName}*...` });

                const branches = ['main', 'master'];
                let downloaded = false;
                let lastStatus = 0;

                for (const branch of branches) {
                    const zipUrl = `https://github.com/${user}/${repoName}/archive/refs/heads/${branch}.zip`;
                    try {
                        const res = await axios.get(zipUrl, {
                            responseType: 'arraybuffer',
                            timeout: 90000,
                            maxContentLength: MAX_SIZE_MB * 1024 * 1024 * 2,
                            maxRedirects: 5,
                            headers: {
                                'User-Agent': 'Mozilla/5.0 (compatible; gitclone-bot)',
                                'Accept': 'application/zip,*/*',
                            },
                            validateStatus: (s) => s < 500,
                        });
                        lastStatus = res.status;
                        if (res.status === 200 && res.data && res.data.byteLength > 100) {
                            fs.writeFileSync(tmpFile, Buffer.from(res.data));
                            downloaded = true;
                            break;
                        }
                    } catch (e) {
                        lastStatus = e.response?.status || 0;
                    }
                }

                if (!downloaded || !fs.existsSync(tmpFile)) {
                    await m.react('❌');
                    return m.reply({
                        text: `❌ Gagal download repo.\nStatus: ${lastStatus || 'timeout'}\nPastikan repo public & branch main/master ada.`
                    });
                }

                const sizeMB = fs.statSync(tmpFile).size / (1024 * 1024);
                if (sizeMB > MAX_SIZE_MB) {
                    fs.unlinkSync(tmpFile);
                    await m.react('❌');
                    return m.reply({ text: `❌ Repo terlalu besar (${sizeMB.toFixed(1)} MB). Max ${MAX_SIZE_MB} MB.` });
                }

                await Hanz.sendMessage(m.chat, {
                    document: fs.readFileSync(tmpFile),
                    mimetype: 'application/zip',
                    fileName: `${repoName}.zip`,
                    caption: `📦 *${user}/${repoName}*\n💾 ${sizeMB.toFixed(2)} MB`,
                }, { quoted: msg });

                fs.unlinkSync(tmpFile);
                await m.react('✅');
            } catch (err) {
                try { if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile); } catch { }
                console.error('[GITCLONE ERROR]', err.message);
                await m.react('❌');
                await m.reply({ text: `❌ Gagal clone repo.\nError: ${err.message.slice(0, 200)}` });
            }
        }
            break;
case 'mediafire': {
            const MAX_MEDIAFIRE_LINKS = 20;
            const mfLinks = [...new Set(
                (command.fullArgs || '').match(/https?:\/\/(?:www\.)?mediafire\.com\/\S+/gi) || []
            )];

            if (!mfLinks.length) {
                return m.reply({ text: '❌ Contoh: `' + m.prefix + 'mediafire https://www.mediafire.com/file/xxx`\n\nBisa juga kirim beberapa link sekaligus (pisah pakai spasi/baris baru), nanti didownload semua.' });
            }
            if (mfLinks.length > MAX_MEDIAFIRE_LINKS) {
                return m.reply({ text: `❌ Kebanyakan link (${mfLinks.length}). Maksimal ${MAX_MEDIAFIRE_LINKS} link sekali kirim.` });
            }

            await m.react('⏳');

            const isMulti = mfLinks.length > 1;
            if (isMulti) {
                await m.reply({ text: `⬇️ Ditemukan ${mfLinks.length} link MediaFire, mendownload satu-satu...` });
            }

            const failed = [];
            let sentCount = 0;

            for (let i = 0; i < mfLinks.length; i++) {
                const mfUrl = mfLinks[i];
                try {
                    if (isMulti) {
                        await m.reply({ text: `⬇️ (${i + 1}/${mfLinks.length}) Mengambil info MediaFire...` });
                    } else {
                        await m.reply({ text: '⬇️ Mengambil info MediaFire...' });
                    }

                    const data = await mediafireDl(mfUrl);

                    if (!data?.link) {
                        failed.push({ url: mfUrl, reason: 'Gagal mendapatkan link download.' });
                        continue;
                    }

                    const sizeMatch = String(data.size).match(/([\d.]+)\s*(MB|GB|KB)?/i);
                    if (sizeMatch) {
                        let sizeNum = parseFloat(sizeMatch[1]);
                        const unit = (sizeMatch[2] || 'MB').toUpperCase();
                        if (unit === 'GB') sizeNum *= 1024;
                        if (unit === 'KB') sizeNum /= 1024;
                        if (sizeNum > MAX_SIZE_MB) {
                            failed.push({ url: mfUrl, reason: `File terlalu besar (${data.size}). Max ${MAX_SIZE_MB} MB.` });
                            continue;
                        }
                    }

                    await Hanz.sendMessage(m.chat, {
                        document: { url: data.link },
                        mimetype: data.mime || 'application/octet-stream',
                        fileName: data.nama,
                        caption: [
                            `📁 *${data.nama}*`,
                            data.size ? `💾 ${data.size}` : null,
                            `🔗 MediaFire`,
                        ].filter(Boolean).join('\n'),
                    }, { quoted: msg });

                    sentCount++;
                } catch (err) {
                    console.error('[MEDIAFIRE ERROR]', err.message);
                    failed.push({ url: mfUrl, reason: err.message.slice(0, 150) });
                }
            }

            if (sentCount === 0) {
                await m.react('❌');
            } else if (failed.length) {
                await m.react('⚠️');
            } else {
                await m.react('✅');
            }

            if (isMulti || failed.length) {
                const summary = [
                    `✅ Berhasil: ${sentCount}/${mfLinks.length}`,
                    ...(failed.length ? ['', '❌ Gagal:', ...failed.map(f => `• ${f.url}\n   ↳ ${f.reason}`)] : []),
                ].join('\n');
                await m.reply({ text: summary });
            }
        }
            break;

case 'soundcloud':
case 'scloud': {
    if (!url) return m.reply({ text: '❌ Contoh: `' + m.prefix + 'scloud https://soundcloud.com/...`' });

    await m.react('⏳');
    let filePath;
    try {
        await m.reply({ text: '⬇️ Mendownload dari SoundCloud...' });

        filePath = await download(url, [
            '-x',
            '--audio-format', 'mp3',
            '--audio-quality', '128K',
        ], 'mp3');

        const sizeMB = fileSizeMB(filePath);
        if (sizeMB > MAX_SIZE_MB) {
            cleanTmp(filePath);
            await m.react('❌');
            return m.reply({ text: `❌ File terlalu besar.` });
        }

        let info;
        try { info = await getInfo(url); } catch { }

        await Hanz.sendMessage(m.chat, {
            audio: fs.readFileSync(filePath),
            mimetype: 'audio/mpeg',
            fileName: info?.title ? `${info.title}.mp3` : 'soundcloud.mp3',
            ptt: false,
        }, { quoted: msg });

        cleanTmp(filePath);
        await m.react('✅');

    } catch (err) {
        cleanTmp(filePath);
        console.error('[SOUNDCLOUD ERROR]', err.message);
        await m.react('❌');
        await m.reply({ text: `❌ Gagal download SoundCloud.\nError: ${err.message.slice(0, 200)}` });
    }
}
    break;
        case 'pinterest':
        case 'pindl': {
            if (!url) return m.reply({ text: '❌ Contoh: `' + m.prefix + 'pindl https://pin.it/...`' });

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

                await Hanz.sendMessage(m.chat, {
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
        }
            break;

        case 'spotify':
        case 'spotdl': {
            if (!url) return m.reply({ text: `❌ Contoh: \`${p}spotify https://open.spotify.com/track/xxxxx\`` });
            if (!/open\.spotify\.com\/(track|album|playlist)\//i.test(url)) {
                return m.reply({ text: '❌ Link Spotify tidak valid!\nHarus track / album / playlist.' });
            }

            await m.react('⏳');
            try {
                await m.reply({ text: '⬇️ Mengambil audio dari Spotify...' });
                const result = await SpotifyDl(url);
                const dl = result.downloads.find(d => d.url && (/mp3|audio|download/i.test(d.type || '') || d.url.includes('http')))
                    || result.downloads[0];

                if (!dl?.url) throw new Error('URL audio tidak ditemukan');

                await Hanz.sendMessage(m.chat, {
                    audio: { url: dl.url },
                    mimetype: 'audio/mpeg',
                    fileName: `${(result.title || 'spotify').slice(0, 80)}.mp3`,
                    ptt: false,
                }, { quoted: msg });

                await m.reply({
                    text: [
                        `🎵 *${result.title || 'Spotify'}*`,
                        result.artist ? `👤 ${result.artist}` : null,
                        `✅ Audio terkirim`,
                    ].filter(Boolean).join('\n'),
                });
                await m.react('✅');
            } catch (err) {
                console.error('[SPOTIFY ERROR]', err.message);
                await m.react('❌');
                await m.reply({ text: `❌ Gagal download Spotify.\nError: ${err.message.slice(0, 200)}` });
            }
        }
            break;

        case 'applemusic':
        case 'apple':
        case 'aplmusic': {
            if (!url) return m.reply({ text: `❌ Contoh: \`${p}applemusic https://music.apple.com/.../album/.../idxxxx\`` });
            if (!/music\.apple\.com\//i.test(url)) {
                return m.reply({ text: '❌ Link Apple Music tidak valid!' });
            }

            await m.react('⏳');
            try {
                await m.reply({ text: '⬇️ Mengambil audio dari Apple Music...' });
                const result = await AppleMusicDl(url);
                const dl = result.downloads.find(d => d.url && !/cover/i.test(d.type || ''))
                    || result.downloads.find(d => d.url);
                if (!dl?.url) throw new Error('URL audio tidak ditemukan');

                if (/cover/i.test(dl.type || '') || /\.(jpg|jpeg|png|webp)/i.test(dl.url)) {
                    await Hanz.sendMessage(m.chat, {
                        image: { url: dl.url },
                        caption: `🍎 *${result.title || 'Apple Music'}*\n(Cover only — audio tidak tersedia)`,
                    }, { quoted: msg });
                } else {
                    await Hanz.sendMessage(m.chat, {
                        audio: { url: dl.url },
                        mimetype: 'audio/mpeg',
                        fileName: `${(result.title || 'applemusic').slice(0, 80)}.mp3`,
                        ptt: false,
                    }, { quoted: msg });
                    await m.reply({ text: `🍎 *${result.title || 'Apple Music'}*\n✅ Audio terkirim` });
                }
                await m.react('✅');
            } catch (err) {
                console.error('[APPLEMUSIC ERROR]', err.message);
                await m.react('❌');
                await m.reply({ text: `❌ Gagal download Apple Music.\nError: ${err.message.slice(0, 200)}` });
            }
        }
            break;

        case 'threads':
        case 'thread': {
            if (!url) return m.reply({ text: `❌ Contoh: \`${p}threads https://www.threads.net/@user/post/xxxxx\`` });
            if (!/threads\.(net|com)\//i.test(url)) {
                return m.reply({ text: '❌ Link Threads tidak valid!' });
            }

            await m.react('⏳');
            try {
                await m.reply({ text: '⬇️ Mengambil media dari Threads...' });
                const result = await ThreadsDl(url);
                const downloads = result.downloads || [];
                let sent = 0;
                for (const item of downloads.slice(0, 5)) {
                    if (!item.url) continue;
                    try {
                        if (item.type === 'image' || /\.(jpg|jpeg|png|webp)(\?|$)/i.test(item.url)) {
                            await Hanz.sendMessage(m.chat, {
                                image: { url: item.url },
                                caption: sent === 0 ? '🧵 Threads media' : undefined,
                            }, { quoted: msg });
                        } else {
                            await Hanz.sendMessage(m.chat, {
                                video: { url: item.url },
                                caption: sent === 0 ? '🧵 Threads media' : undefined,
                            }, { quoted: msg });
                        }
                        sent++;
                    } catch (e) {
                        console.error('[THREADS SEND]', e.message);
                    }
                }

                if (!sent) throw new Error('Gagal mengirim media');
                await m.react('✅');
            } catch (err) {
                console.error('[THREADS ERROR]', err.message);
                await m.react('❌');
                await m.reply({ text: `❌ Gagal download Threads.\nError: ${err.message.slice(0, 200)}` });
            }
        }
            break;

    }
};

module.exports = handler;