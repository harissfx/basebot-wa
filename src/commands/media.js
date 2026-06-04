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
 */

const fs   = require('fs');
const path = require('path');
const os   = require('os');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

// ─── Inject metadata nama paket & author ke WebP (EXIF trick) ────────────────
// WhatsApp baca nama stiker dari chunk "EXIF" di dalam file WebP.
// Format: pakai JSON di dalam chunk custom "EXIF" yang WhatsApp kenali.
function injectStickerMetadata(webpBuffer, packName, authorName) {
    try {
        // Metadata JSON yang dibaca WhatsApp
        const metaJson = JSON.stringify({
            'sticker-pack-id':        `com.bot.sticker.${Date.now()}`,
            'sticker-pack-name':       packName,
            'sticker-pack-publisher':  authorName,
            'emojis':                  ['🤖'],
        });

        const metaBuf    = Buffer.from(metaJson, 'utf-8');
        // Chunk ID "EXIF" = 4 bytes, size = 4 bytes (little-endian)
        const chunkId    = Buffer.from('EXIF');
        const chunkSize  = Buffer.alloc(4);
        chunkSize.writeUInt32LE(metaBuf.length, 0);
        const exifChunk  = Buffer.concat([chunkId, chunkSize, metaBuf]);

        // WebP header: "RIFF" (4) + fileSize (4) + "WEBP" (4) = 12 bytes
        // Sisipkan chunk EXIF tepat setelah header RIFF+WEBP
        const riffHeader = webpBuffer.slice(0, 12);
        const rest       = webpBuffer.slice(12);

        // Update ukuran file di RIFF header
        const newTotalSize = 4 + exifChunk.length + rest.length; // 4 = "WEBP"
        const newRiff = Buffer.concat([
            Buffer.from('RIFF'),
            (() => { const b = Buffer.alloc(4); b.writeUInt32LE(newTotalSize, 0); return b; })(),
            Buffer.from('WEBP'),
        ]);

        return Buffer.concat([newRiff, exifChunk, rest]);
    } catch (e) {
        // Kalau inject gagal, kembalikan buffer asli tanpa crash
        console.warn('[STICKER META] Gagal inject metadata:', e.message);
        return webpBuffer;
    }
}

// ─── Helper: download media dari pesan Baileys ke Buffer ──────────────────────
async function downloadMedia(message) {
    const typeMap = {
        imageMessage:    'image',
        videoMessage:    'video',
        stickerMessage:  'sticker',
        documentMessage: 'document',
    };

    let msgContent = null;
    let mediaType  = null;

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

// ─── Helper: jalankan FFmpeg ──────────────────────────────────────────────────
function runFFmpeg(inputPath, outputPath, optionsFn) {
    return new Promise((resolve, reject) => {
        let ffmpegPath;
        try {
            ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
        } catch {
            ffmpegPath = 'ffmpeg';
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

// ─── Helper: tulis buffer ke file temp ───────────────────────────────────────
function writeTmp(buffer, ext) {
    const tmpPath = path.join(os.tmpdir(), `wbot_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`);
    fs.writeFileSync(tmpPath, buffer);
    return tmpPath;
}

// ─── Helper: hapus file temp ─────────────────────────────────────────────────
function cleanTmp(...paths) {
    for (const p of paths) {
        try { if (p) fs.unlinkSync(p); } catch {}
    }
}

// ─── Handler utama ────────────────────────────────────────────────────────────
const handler = async (ctx) => {
    const { command, msg, sock, sender } = ctx;

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
                        '• Reply foto  → `!sticker`',
                        '• Reply GIF/video → `!sticker` (jadi stiker animasi)',
                        '• Nama paket : `!sticker NamaPaket|Author`',
                    ].join('\n'),
                });
            }

            await ctx.react('⏳');

            const { buffer, mediaType } = mediaResult;
            const isAnimated = mediaType === 'video'
                || (mediaType === 'image' && quotedMsg?.imageMessage?.mimetype === 'image/gif')
                || (mediaType === 'sticker' && quotedMsg?.stickerMessage?.isAnimated);

            // Parse packName & authorName dari args: !sticker NamaPaket|Author
            const rawArgs   = (command.fullArgs || '').trim();
            const [packName = 'Bot', authorName = 'WaBot'] = rawArgs
                ? rawArgs.split('|').map(s => s.trim())
                : ['Bot', 'WaBot'];

            let inputPath, outputPath;
            try {
                let stickerBuffer;

                if (isAnimated) {
                    inputPath  = writeTmp(buffer, mediaType === 'video' ? 'mp4' : 'webp');
                    outputPath = writeTmp(Buffer.alloc(0), 'webp');

                    await runFFmpeg(inputPath, outputPath, (cmd) => {
                        cmd
                            .inputOptions(['-t 8'])
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

                    stickerBuffer = fs.readFileSync(outputPath);

                } else {
                    // Foto → WebP statis
                    try {
                        const sharp = require('sharp');
                        stickerBuffer = await sharp(buffer)
                            .resize(512, 512, { fit: 'inside', background: { r: 0, g: 0, b: 0, alpha: 0 } })
                            .webp({ quality: 80 })
                            .toBuffer();
                    } catch {
                        // Fallback FFmpeg
                        inputPath  = writeTmp(buffer, 'jpg');
                        outputPath = writeTmp(Buffer.alloc(0), 'webp');
                        await runFFmpeg(inputPath, outputPath, (cmd) => {
                            cmd.outputOptions([
                                '-vf', 'scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=0x00000000',
                                '-quality', '80',
                            ]);
                        });
                        stickerBuffer = fs.readFileSync(outputPath);
                    }
                }

                // ✅ Inject metadata nama paket & author ke WebP
                stickerBuffer = injectStickerMetadata(stickerBuffer, packName, authorName);

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
                await ctx.reply({ text: `❌ Gagal membuat stiker.\nError: ${err.message}` });
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
                    ].join('\n'),
                });
            }

            await ctx.react('⏳');

            const { buffer } = mediaResult;
            const isAnimated = quotedMsg?.stickerMessage?.isAnimated;

            let inputPath, outputPath;
            try {
                if (!isAnimated) {
                    // Stiker statis → PNG via sharp
                    try {
                        const sharp = require('sharp');
                        const pngBuffer = await sharp(buffer).png().toBuffer();
                        await sock.sendMessage(sender, {
                            image: pngBuffer,
                            caption: '🖼️ Stiker dikonversi ke foto!',
                        }, { quoted: msg });
                        await ctx.react('✅');
                        return;
                    } catch { /* fallback FFmpeg */ }
                }

                // Animasi atau fallback: ambil frame pertama via FFmpeg
                inputPath  = writeTmp(buffer, 'webp');
                outputPath = writeTmp(Buffer.alloc(0), 'png');

                await runFFmpeg(inputPath, outputPath, (cmd) => {
                    cmd
                        .inputOptions(['-vframes 1'])
                        .outputOptions(['-vf', 'scale=512:512:force_original_aspect_ratio=decrease']);
                });

                const imgBuffer = fs.readFileSync(outputPath);
                await sock.sendMessage(sender, {
                    image: imgBuffer,
                    caption: `🖼️ Stiker dikonversi ke foto!${isAnimated ? '\n_(frame pertama dari stiker animasi)_' : ''}`,
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
                inputPath  = writeTmp(buffer, isVideo ? 'mp4' : 'webp');
                outputPath = writeTmp(Buffer.alloc(0), 'gif');

                await runFFmpeg(inputPath, outputPath, (cmd) => {
                    cmd
                        .inputOptions(isVideo ? ['-t 8'] : [])
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
                    return ctx.reply({ text: `❌ GIF terlalu besar (${gifSizeMB} MB). Coba video lebih pendek.` });
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