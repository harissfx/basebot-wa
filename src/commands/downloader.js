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

const fs           = require('fs');
const path         = require('path');
const os           = require('os');
const { execFile } = require('child_process');
const config = require('../config');

const YTDLP_PATH  = '/usr/local/bin/yt-dlp';
const MAX_SIZE_MB = 90; // batas ukuran file sebelum ditolak

// ─── Jalankan yt-dlp ─────────────────────────────────────────────────────────
function runYtDlp(args) {
    return new Promise((resolve, reject) => {
        execFile(YTDLP_PATH, args, { maxBuffer: 10 * 1024 * 1024 }, (err, stdout, stderr) => {
            if (err) return reject(new Error(stderr || err.message));
            resolve(stdout.trim());
        });
    });
}

// ─── Ambil info video (judul, durasi) ────────────────────────────────────────
async function getInfo(url) {
    const raw = await runYtDlp([
        '--dump-json', '--no-playlist',
        '--no-warnings', url,
    ]);
    return JSON.parse(raw);
}

// ─── Download ke file temp, kembalikan path ───────────────────────────────────
function download(url, extraArgs, ext) {
    return new Promise((resolve, reject) => {
        const outPath = path.join(os.tmpdir(), `wbot_dl_${Date.now()}.${ext}`);
        const args = [
            '--no-playlist',
            '--no-warnings',
            '-o', outPath,
            ...extraArgs,
            url,
        ];
        execFile(YTDLP_PATH, args, { maxBuffer: 10 * 1024 * 1024, timeout: 3 * 60 * 1000 }, (err, stdout, stderr) => {
            if (err) return reject(new Error(stderr || err.message));
            // yt-dlp kadang tambah ekstensi sendiri, cari file yang cocok
            if (fs.existsSync(outPath)) return resolve(outPath);
            // Cari file dengan nama yang mirip di tmpdir
            const tmpFiles = fs.readdirSync(os.tmpdir())
                .filter(f => f.startsWith(`wbot_dl_`) && f.endsWith(`.${ext}`))
                .map(f => ({ f, t: fs.statSync(path.join(os.tmpdir(), f)).mtimeMs }))
                .sort((a, b) => b.t - a.t);
            if (tmpFiles.length) return resolve(path.join(os.tmpdir(), tmpFiles[0].f));
            reject(new Error('File hasil download tidak ditemukan'));
        });
    });
}

function cleanTmp(...paths) {
    for (const p of paths) { try { if (p && fs.existsSync(p)) fs.unlinkSync(p); } catch {} }
}

function formatDuration(sec) {
    if (!sec) return '-';
    const m = Math.floor(sec / 60), s = sec % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
}

function fileSizeMB(filePath) {
    try { return fs.statSync(filePath).size / (1024 * 1024); } catch { return 0; }
}

// ─── Handler ──────────────────────────────────────────────────────────────────
const handler = async (ctx) => {
    const { command, sock, sender, msg } = ctx;
    const url = command.fullArgs?.trim();
    const p = config.prefix;

    switch (command.name) {

case 'menudownloader':
    let menu = `
╭──❍『𝑫𝒐𝒘𝒏𝒍𝒐𝒂𝒅𝒆𝒓 𝑴𝒆𝒏𝒖』
│
│⭔ ${p}ytmp3 [url]
│⭔ ${p}ytmp4 [url]
│⭔ ${p}twiter [url]
│⭔ ${p}umma [url]
│⭔ ${p}mediafire [url]
│⭔ ${p}gitclone [url]
│⭔ ${p}facebook [url]
│⭔ ${p}tiktok [url]
│
╰────❍
`
    await ctx.sendInteractive({
    text: menu,
    footer: config.botName,
    quoted: ctx.msg,
    buttons: [
        { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: 'Kembali ke Menu', id: 'menu' }) },
        { name: 'single_select',buttonParamsJson: JSON.stringify({ title: 'Simpel Menu',
            sections: [{
            title: 'Simpel Menu',
            highlight_label: "",
                rows: [{ title: "『General Menu』", description: "Select to display general menu", id: "generalmenu" }]
                        }, {
            highlight_label: "",
                rows: [{ title: "『Owner Menu』", description: "Select to display owner menu", id: "ownermenu" }]
                        }, {
            highlight_label: "",
                rows: [{ title: "『Ffmpeg Menu』", description: "Select to display bug menu", id: "bugmenu" }]
                        }, {
            highlight_label: "",
                rows: [{ title: "『Tools Menu』", description: "Select to display information owner bot", id: "ownerboth" }]
                        }, {
            highlight_label: "Khusus Owner Utama",
                rows: [{ title: "『JadiBot Menu』", description: "Select to display owner menu", id: "ownermenu" }]
                        }, {
            highlight_label: "",
                rows: [{ title: "『Group Menu』", description: "Select to display Thank-you note ", id: "tqto" }]
                },]
            })
        }]
    });
break;
        // ── !ytmp3 ── YouTube → Audio MP3 ─────────────────────────────────────
        case 'ytmp3': {
            if (!url) return ctx.reply({ text: '❌ Contoh: `!ytmp3 https://youtu.be/xxx`' });

            await ctx.react('⏳');
            let filePath;
            try {
                // Ambil info dulu
                await ctx.reply({ text: '🔍 Mengambil info lagu...' });
                const info = await getInfo(url);

                const durSec = info.duration || 0;
                if (durSec > 15 * 60) {
                    await ctx.react('❌');
                    return ctx.reply({ text: `❌ Durasi terlalu panjang (${formatDuration(durSec)}). Maksimal 15 menit.` });
                }

                await ctx.reply({ text: [
                    `🎵 *${info.title}*`,
                    `⏱️ Durasi: ${formatDuration(durSec)}`,
                    `⬇️ Sedang mendownload audio...`,
                ].join('\n') });

                filePath = await download(url, [
                    '-x',
                    '--audio-format', 'mp3',
                    '--audio-quality', '128K',
                ], 'mp3');

                const sizeMB = fileSizeMB(filePath);
                if (sizeMB > MAX_SIZE_MB) {
                    cleanTmp(filePath);
                    await ctx.react('❌');
                    return ctx.reply({ text: `❌ File terlalu besar (${sizeMB.toFixed(1)} MB). Coba lagu yang lebih pendek.` });
                }

                await sock.sendMessage(sender, {
                    audio: fs.readFileSync(filePath),
                    mimetype: 'audio/mpeg',
                    fileName: `${info.title}.mp3`,
                    ptt: false,
                }, { quoted: msg });

                cleanTmp(filePath);
                await ctx.react('✅');

            } catch (err) {
                cleanTmp(filePath);
                console.error('[YTMP3 ERROR]', err.message);
                await ctx.react('❌');
                await ctx.reply({ text: `❌ Gagal download audio.\nError: ${err.message.slice(0, 200)}` });
            }
            break;
        }

        // ── !ytmp4 ── YouTube → Video MP4 ─────────────────────────────────────
        case 'ytmp4': {
            if (!url) return ctx.reply({ text: '❌ Contoh: `!ytmp4 https://youtu.be/xxx`' });

            await ctx.react('⏳');
            let filePath;
            try {
                await ctx.reply({ text: '🔍 Mengambil info video...' });
                const info = await getInfo(url);

                const durSec = info.duration || 0;
                if (durSec > 5 * 60) {
                    await ctx.react('❌');
                    return ctx.reply({ text: `❌ Durasi terlalu panjang (${formatDuration(durSec)}). Maksimal 5 menit untuk video.` });
                }

                await ctx.reply({ text: [
                    `🎬 *${info.title}*`,
                    `⏱️ Durasi: ${formatDuration(durSec)}`,
                    `⬇️ Sedang mendownload video (max 480p)...`,
                ].join('\n') });

                filePath = await download(url, [
                    '-f', 'bestvideo[height<=480][ext=mp4]+bestaudio[ext=m4a]/best[height<=480][ext=mp4]/best[height<=480]',
                    '--merge-output-format', 'mp4',
                ], 'mp4');

                const sizeMB = fileSizeMB(filePath);
                if (sizeMB > MAX_SIZE_MB) {
                    cleanTmp(filePath);
                    await ctx.react('❌');
                    return ctx.reply({ text: `❌ File terlalu besar (${sizeMB.toFixed(1)} MB). Coba video lebih pendek.` });
                }

                await sock.sendMessage(sender, {
                    video: fs.readFileSync(filePath),
                    mimetype: 'video/mp4',
                    fileName: `${info.title}.mp4`,
                    caption: `🎬 *${info.title}*\n⏱️ ${formatDuration(durSec)}`,
                }, { quoted: msg });

                cleanTmp(filePath);
                await ctx.react('✅');

            } catch (err) {
                cleanTmp(filePath);
                console.error('[YTMP4 ERROR]', err.message);
                await ctx.react('❌');
                await ctx.reply({ text: `❌ Gagal download video.\nError: ${err.message.slice(0, 200)}` });
            }
            break;
        }

        // ── !tiktok ── TikTok video tanpa watermark ────────────────────────────
        case 'tiktok':
        case 'tt': {
            if (!url) return ctx.reply({ text: '❌ Contoh: `!tiktok https://vt.tiktok.com/xxx`' });

            await ctx.react('⏳');
            let filePath;
            try {
                await ctx.reply({ text: '⬇️ Mendownload video TikTok...' });

                filePath = await download(url, [
                    // Format tanpa watermark (h264 dari aweme, bukan watermarked)
                    '-f', 'download_addr-0/bestvideo+bestaudio/best',
                    '--merge-output-format', 'mp4',
                ], 'mp4');

                const sizeMB = fileSizeMB(filePath);
                if (sizeMB > MAX_SIZE_MB) {
                    cleanTmp(filePath);
                    await ctx.react('❌');
                    return ctx.reply({ text: `❌ File terlalu besar (${sizeMB.toFixed(1)} MB).` });
                }

                let info;
                try { info = await getInfo(url); } catch {}

                await sock.sendMessage(sender, {
                    video: fs.readFileSync(filePath),
                    mimetype: 'video/mp4',
                    caption: info?.title ? `🎵 ${info.title}` : '✅ TikTok downloaded!',
                }, { quoted: msg });

                cleanTmp(filePath);
                await ctx.react('✅');

            } catch (err) {
                cleanTmp(filePath);
                console.error('[TIKTOK ERROR]', err.message);
                await ctx.react('❌');
                await ctx.reply({ text: `❌ Gagal download TikTok.\nError: ${err.message.slice(0, 200)}` });
            }
            break;
        }

        // ── !xdl ── Twitter/X video ────────────────────────────────────────────
        case 'xdl':
        case 'twdl': {
            if (!url) return ctx.reply({ text: '❌ Contoh: `!xdl https://x.com/xxx/status/xxx`' });

            await ctx.react('⏳');
            let filePath;
            try {
                await ctx.reply({ text: '⬇️ Mendownload video dari X/Twitter...' });

                filePath = await download(url, [
                    '-f', 'best[ext=mp4]/best',
                    '--merge-output-format', 'mp4',
                ], 'mp4');

                const sizeMB = fileSizeMB(filePath);
                if (sizeMB > MAX_SIZE_MB) {
                    cleanTmp(filePath);
                    await ctx.react('❌');
                    return ctx.reply({ text: `❌ File terlalu besar (${sizeMB.toFixed(1)} MB).` });
                }

                await sock.sendMessage(sender, {
                    video: fs.readFileSync(filePath),
                    mimetype: 'video/mp4',
                    caption: '✅ Downloaded dari X/Twitter!',
                }, { quoted: msg });

                cleanTmp(filePath);
                await ctx.react('✅');

            } catch (err) {
                cleanTmp(filePath);
                console.error('[XDL ERROR]', err.message);
                await ctx.react('❌');
                await ctx.reply({ text: `❌ Gagal download dari X/Twitter.\nError: ${err.message.slice(0, 200)}` });
            }
            break;
        }

                // ── !igdl ── Instagram ──────────────────────────────────────────────
        case 'igdl': {
            if (!url) return ctx.reply({ text: '❌ Contoh: `!igdl https://www.instagram.com/reel/...`' });

            await ctx.react('⏳');
            let filePath;

            try {
                await ctx.reply({ text: '⬇️ Mendownload Instagram...' });

                filePath = await download(url, [
                    '-f', 'best',
                    '--merge-output-format', 'mp4',
                ], 'mp4');

                const sizeMB = fileSizeMB(filePath);

                if (sizeMB > MAX_SIZE_MB) {
                    cleanTmp(filePath);
                    await ctx.react('❌');
                    return ctx.reply({
                        text: `❌ File terlalu besar (${sizeMB.toFixed(1)} MB).`
                    });
                }

                let info;
                try { info = await getInfo(url); } catch {}

                await sock.sendMessage(sender, {
                    video: fs.readFileSync(filePath),
                    mimetype: 'video/mp4',
                    caption: info?.title || '✅ Instagram Downloaded!'
                }, { quoted: msg });

                cleanTmp(filePath);
                await ctx.react('✅');

            } catch (err) {
                cleanTmp(filePath);
                console.error('[IGDL ERROR]', err.message);

                await ctx.react('❌');
                await ctx.reply({
                    text: `❌ Gagal download Instagram.\nError: ${err.message.slice(0, 200)}`
                });
            }
            break;
        }

        // ── !fbdl ── Facebook ───────────────────────────────────────────────
        case 'fbdl': {
            if (!url) return ctx.reply({ text: '❌ Contoh: `!fbdl https://facebook.com/...`' });

            await ctx.react('⏳');
            let filePath;

            try {
                await ctx.reply({ text: '⬇️ Mendownload Facebook...' });

                filePath = await download(url, [
                    '-f', 'best',
                    '--merge-output-format', 'mp4',
                ], 'mp4');

                const sizeMB = fileSizeMB(filePath);

                if (sizeMB > MAX_SIZE_MB) {
                    cleanTmp(filePath);
                    await ctx.react('❌');
                    return ctx.reply({
                        text: `❌ File terlalu besar (${sizeMB.toFixed(1)} MB).`
                    });
                }

                let info;
                try { info = await getInfo(url); } catch {}

                await sock.sendMessage(sender, {
                    video: fs.readFileSync(filePath),
                    mimetype: 'video/mp4',
                    caption: info?.title || '✅ Facebook Downloaded!'
                }, { quoted: msg });

                cleanTmp(filePath);
                await ctx.react('✅');

            } catch (err) {
                cleanTmp(filePath);
                console.error('[FBDL ERROR]', err.message);

                await ctx.react('❌');
                await ctx.reply({
                    text: `❌ Gagal download Facebook.\nError: ${err.message.slice(0, 200)}`
                });
            }
            break;
        }

        // ── !pindl ── Pinterest Video ───────────────────────────────────────
        case 'pindl':
        case 'pin': {
            if (!url) return ctx.reply({ text: '❌ Contoh: `!pindl https://pin.it/...`' });

            await ctx.react('⏳');
            let filePath;

            try {
                await ctx.reply({ text: '⬇️ Mendownload Pinterest...' });

                filePath = await download(url, [
                    '-f', 'best',
                    '--merge-output-format', 'mp4',
                ], 'mp4');

                const sizeMB = fileSizeMB(filePath);

                if (sizeMB > MAX_SIZE_MB) {
                    cleanTmp(filePath);
                    await ctx.react('❌');
                    return ctx.reply({
                        text: `❌ File terlalu besar (${sizeMB.toFixed(1)} MB).`
                    });
                }

                let info;
                try { info = await getInfo(url); } catch {}

                await sock.sendMessage(sender, {
                    video: fs.readFileSync(filePath),
                    mimetype: 'video/mp4',
                    caption: info?.title || '✅ Pinterest Downloaded!'
                }, { quoted: msg });

                cleanTmp(filePath);
                await ctx.react('✅');

            } catch (err) {
                cleanTmp(filePath);
                console.error('[PINDL ERROR]', err.message);

                await ctx.react('❌');
                await ctx.reply({
                    text: `❌ Gagal download Pinterest.\nError: ${err.message.slice(0, 200)}`
                });
            }
            break;
        }

    }
};

module.exports = handler;