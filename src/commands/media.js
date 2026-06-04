/**
 * media.js — Fitur konversi media pakai FFmpeg
 * 
 * Commands:
 *   !sticker / !s      → foto/gif/video (reply) jadi stiker
 *   !toimg             → stiker (reply) jadi foto
 *   !togif             → stiker/video (reply) jadi GIF
 *
 * Cara install dependency:
 *   npm install fluent-ffmpeg @ffmpeg-installer/ffmpeg sharp
 *
 * Pastikan juga ffmpeg tersedia di sistem:
 *   Ubuntu/Debian : sudo apt install ffmpeg
 *   Atau pakai @ffmpeg-installer/ffmpeg (auto-download, tidak perlu apt)
 */

const fs   = require('fs');
const path = require('path');
const os   = require('os');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

// ─── Helper: download media dari pesan Baileys ke Buffer ──────────────────────
async function downloadMedia(message) {
    const typeMap = {
        imageMessage:   'image',
        videoMessage:   'video',
        stickerMessage: 'sticker',
        documentMessage:'document',
    };

    let msgContent = null;
    let mediaType  = null;

    // Cek pesan langsung
    for (const [key, type] of Object.entries(typeMap)) {
        if (message?.[key]) {
            msgContent = message[key];
            mediaType  = type;
            break;
        }
    }

    if (!msgContent || !mediaType) return null;

    const stream = await downloadContentFromMessage(msgContent, mediaType);
    const chunks = [];
    for await (const chunk of stream) chunks.push(chunk);
    return { buffer: Buffer.concat(chunks), mediaType };
}

// ─── Helper: jalankan FFmpeg via fluent-ffmpeg ────────────────────────────────
function runFFmpeg(inputPath, outputPath, optionsFn) {
    return new Promise((resolve, reject) => {
        let ffmpegPath;
        try {
            ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
        } catch {
            ffmpegPath = 'ffmpeg'; // fallback ke ffmpeg sistem
        }

        const ffmpeg = require('fluent-ffmpeg');
        ffmpeg.setFfmpegPath(ffmpegPath);

        const cmd = ffmpeg(inputPath);
        optionsFn(cmd);
        cmd
            .output(outputPath)
            .on('end', resolve)
            .on('error', reject)
            .run();
    });
}

// ─── Helper: tulis buffer ke file temp, kembalikan pathnya ───────────────────
function writeTmp(buffer, ext) {
    const tmpPath = path.join(os.tmpdir(), `wbot_${Date.now()}.${ext}`);
    fs.writeFileSync(tmpPath, buffer);
    return tmpPath;
}

// ─── Helper: hapus file temp ─────────────────────────────────────────────────
function cleanTmp(...paths) {
    for (const p of paths) {
        try { fs.unlinkSync(p); } catch {}
    }
}

// ─── Handler utama ────────────────────────────────────────────────────────────
const handler = async (ctx) => {
    const { command, msg, sock, sender } = ctx;

    // Ambil pesan yang di-reply (quoted), atau pesan itu sendiri jika ada media
    const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage
                   || msg.message;

    switch (command.name) {

        // ── !sticker / !s ── foto / gif / video → stiker ──────────────────────
        case 'sticker':
        case 's': {
            const mediaResult = await downloadMedia(quotedMsg);

            if (!mediaResult) {
                return ctx.reply({
                    text: [
                        '❌ *Tidak ada media yang dideteksi!*',
                        '',
                        'Cara pakai:',
                        '• Reply foto → `!sticker`',
                        '• Reply GIF/video → `!sticker` (jadi stiker animasi)',
                        '• Reply stiker → auto-convert ke format WebP',
                    ].join('\n'),
                });
            }

            await ctx.react('⏳');

            const { buffer, mediaType } = mediaResult;
            const isAnimated = mediaType === 'video'
                || (mediaType === 'image' && quotedMsg?.imageMessage?.mimetype === 'image/gif')
                || (mediaType === 'sticker' && quotedMsg?.stickerMessage?.isAnimated);

            // Parse nama paket & author dari args: !sticker NamaPaket|Author
            const [packName = 'Bot', authorName = 'WaBot'] = (command.fullArgs || '').split('|').map(s => s.trim());

            let inputPath, outputPath;
            try {
                if (isAnimated) {
                    // Video/GIF → WebP animasi
                    inputPath  = writeTmp(buffer, mediaType === 'video' ? 'mp4' : 'gif');
                    outputPath = writeTmp(Buffer.alloc(0), 'webp');

                    await runFFmpeg(inputPath, outputPath, (cmd) => {
                        cmd
                            .inputOptions(['-t 8'])          // maks 8 detik
                            .outputOptions([
                                '-vf', 'scale=512:512:force_original_aspect_ratio=decrease,fps=15,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=0x00000000',
                                '-vcodec', 'libwebp',
                                '-lossless', '0',
                                '-compression_level', '6',
                                '-quality', '80',
                                '-loop', '0',
                                '-preset', 'default',
                                '-an',
                                '-vsync', '0',
                            ]);
                    });
                } else {
                    // Foto → WebP statis
                    // Coba pakai sharp dulu (lebih cepat), fallback ke FFmpeg
                    let webpBuffer;
                    try {
                        const sharp = require('sharp');
                        webpBuffer = await sharp(buffer)
                            .resize(512, 512, { fit: 'inside', background: { r:0, g:0, b:0, alpha:0 } })
                            .webp({ quality: 80 })
                            .toBuffer();
                    } catch {
                        // Fallback ke FFmpeg
                        inputPath  = writeTmp(buffer, 'jpg');
                        outputPath = writeTmp(Buffer.alloc(0), 'webp');
                        await runFFmpeg(inputPath, outputPath, (cmd) => {
                            cmd.outputOptions([
                                '-vf', 'scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=0x00000000',
                                '-quality', '80',
                            ]);
                        });
                        webpBuffer = fs.readFileSync(outputPath);
                    }
                    if (webpBuffer) {
                        await sock.sendMessage(sender, {
                            sticker: webpBuffer,
                            isAnimated: false,
                        }, { quoted: msg });
                        cleanTmp(inputPath, outputPath);
                        await ctx.react('✅');
                        return;
                    }
                }

                const stickerBuffer = fs.readFileSync(outputPath);

                // Kirim stiker
                await sock.sendMessage(sender, {
                    sticker: stickerBuffer,
                    isAnimated,
                }, { quoted: msg });

                cleanTmp(inputPath, outputPath);
                await ctx.react('✅');

            } catch (err) {
                cleanTmp(inputPath, outputPath);
                console.error('[STICKER ERROR]', err.message);
                await ctx.react('❌');
                await ctx.reply({ text: `❌ Gagal membuat stiker.\nError: ${err.message}\n\nPastikan FFmpeg sudah terinstall dan dependency lengkap.` });
            }
            break;
        }

        // ── !toimg ── stiker → foto ────────────────────────────────────────────
        case 'toimg': {
            const mediaResult = await downloadMedia(quotedMsg);

            if (!mediaResult || mediaResult.mediaType !== 'sticker') {
                return ctx.reply({
                    text: [
                        '❌ *Reply sebuah stiker!*',
                        '',
                        'Cara pakai:',
                        '• Reply stiker → `!toimg`',
                        '• Hasilnya akan dikirim sebagai foto PNG',
                    ].join('\n'),
                });
            }

            await ctx.react('⏳');

            const { buffer } = mediaResult;
            const isAnimated = quotedMsg?.stickerMessage?.isAnimated;

            let inputPath, outputPath;
            try {
                inputPath  = writeTmp(buffer, 'webp');
                outputPath = writeTmp(Buffer.alloc(0), 'png');

                if (isAnimated) {
                    // Ambil frame pertama dari WebP animasi
                    await runFFmpeg(inputPath, outputPath, (cmd) => {
                        cmd
                            .inputOptions(['-vframes 1'])
                            .outputOptions(['-vf', 'scale=512:512:force_original_aspect_ratio=decrease']);
                    });
                } else {
                    try {
                        // Coba sharp dulu
                        const sharp = require('sharp');
                        const pngBuffer = await sharp(buffer).png().toBuffer();
                        await sock.sendMessage(sender, {
                            image: pngBuffer,
                            caption: '🖼️ Stiker dikonversi ke foto!',
                        }, { quoted: msg });
                        cleanTmp(inputPath, outputPath);
                        await ctx.react('✅');
                        return;
                    } catch {
                        // Fallback FFmpeg
                        await runFFmpeg(inputPath, outputPath, (cmd) => {
                            cmd.outputOptions(['-vf', 'scale=512:512:force_original_aspect_ratio=decrease']);
                        });
                    }
                }

                const imgBuffer = fs.readFileSync(outputPath);
                await sock.sendMessage(sender, {
                    image: imgBuffer,
                    caption: `🖼️ Stiker dikonversi ke foto!${isAnimated ? '\n_(Diambil frame pertama dari stiker animasi)_' : ''}`,
                }, { quoted: msg });

                cleanTmp(inputPath, outputPath);
                await ctx.react('✅');

            } catch (err) {
                cleanTmp(inputPath, outputPath);
                console.error('[TOIMG ERROR]', err.message);
                await ctx.react('❌');
                await ctx.reply({ text: `❌ Gagal konversi stiker ke foto.\nError: ${err.message}` });
            }
            break;
        }

        // ── !togif ── stiker animasi / video → GIF ────────────────────────────
        case 'togif': {
            const mediaResult = await downloadMedia(quotedMsg);

            if (!mediaResult) {
                return ctx.reply({
                    text: [
                        '❌ *Tidak ada media yang dideteksi!*',
                        '',
                        'Cara pakai:',
                        '• Reply stiker animasi → `!togif`',
                        '• Reply video → `!togif`',
                        '• Hasilnya akan dikirim sebagai GIF',
                    ].join('\n'),
                });
            }

            const { buffer, mediaType } = mediaResult;
            const isAnimatedSticker = mediaType === 'sticker' && quotedMsg?.stickerMessage?.isAnimated;
            const isVideo = mediaType === 'video';

            if (!isAnimatedSticker && !isVideo) {
                return ctx.reply({ text: '❌ Hanya stiker animasi atau video yang bisa dikonversi ke GIF!' });
            }

            await ctx.react('⏳');

            let inputPath, outputPath;
            try {
                const inputExt = isVideo ? 'mp4' : 'webp';
                inputPath  = writeTmp(buffer, inputExt);
                outputPath = writeTmp(Buffer.alloc(0), 'gif');

                await runFFmpeg(inputPath, outputPath, (cmd) => {
                    cmd
                        .inputOptions(isVideo ? ['-t 8'] : [])  // maks 8 detik untuk video
                        .outputOptions([
                            '-vf', 'scale=320:-1:flags=lanczos,fps=12,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse',
                            '-loop', '0',
                        ]);
                });

                const gifBuffer = fs.readFileSync(outputPath);
                const gifSizeMB = (gifBuffer.length / 1024 / 1024).toFixed(2);

                if (gifBuffer.length > 10 * 1024 * 1024) {
                    cleanTmp(inputPath, outputPath);
                    await ctx.react('❌');
                    return ctx.reply({ text: `❌ GIF terlalu besar (${gifSizeMB} MB). Coba pakai video yang lebih pendek.` });
                }

                await sock.sendMessage(sender, {
                    video: gifBuffer,
                    gifPlayback: true,
                    caption: `🎞️ GIF berhasil dibuat! (${gifSizeMB} MB)`,
                }, { quoted: msg });

                cleanTmp(inputPath, outputPath);
                await ctx.react('✅');

            } catch (err) {
                cleanTmp(inputPath, outputPath);
                console.error('[TOGIF ERROR]', err.message);
                await ctx.react('❌');
                await ctx.reply({ text: `❌ Gagal konversi ke GIF.\nError: ${err.message}` });
            }
            break;
        }

    }
};

module.exports = handler;