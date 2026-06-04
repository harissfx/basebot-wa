/**
 * media.js — Fitur konversi media pakai FFmpeg
 *
 * Commands:
 *   !sticker / !s  → foto/gif/video (reply) jadi stiker
 *   !toimg         → stiker (reply) jadi foto
 *   !togif         → stiker/video (reply) jadi GIF
 *
 * Install dependency:
 *   npm install fluent-ffmpeg @ffmpeg-installer/ffmpeg sharp node-webpmux
 */

'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const config = require('../config');
const { TextEncoder } = require('util');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

// ─── Inject metadata ke WebP pakai node-webpmux (cara yang benar) ─────────────
// Format byte EXIF ini IDENTIK dengan yang dipakai wa-sticker-formatter.
// WhatsApp hanya baca metadata kalau byte header-nya benar.
async function injectStickerMetadata(webpBuffer, packName, authorName) {
    try {
        const { Image } = require('node-webpmux');

        const data = JSON.stringify({
            'sticker-pack-id': require('crypto').randomBytes(32).toString('hex'),
            'sticker-pack-name': packName,
            'sticker-pack-publisher': authorName,
            'emojis': ['🤖'],
        });

        // Header byte ini HARUS persis — sama persis dengan wa-sticker-formatter
        const exif = Buffer.concat([
            Buffer.from([
                0x49, 0x49, 0x2a, 0x00, 0x08, 0x00, 0x00, 0x00,
                0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00,
                0x00, 0x00, 0x16, 0x00, 0x00, 0x00
            ]),
            Buffer.from(data, 'utf-8'),
        ]);
        // Tulis panjang JSON ke offset 14 (4 byte LE)
        exif.writeUIntLE(new TextEncoder().encode(data).length, 14, 4);

        const img = new Image();
        await img.load(webpBuffer);
        img.exif = exif;
        return await img.save(null); // null = kembalikan sebagai Buffer
    } catch (e) {
        console.warn('[STICKER META] Gagal inject metadata:', e.message);
        return webpBuffer; // fallback, stiker tetap terkirim tanpa metadata
    }
}

// ─── Download media dari pesan Baileys ───────────────────────────────────────
async function downloadMedia(message) {
    const typeMap = {
        imageMessage: 'image',
        videoMessage: 'video',
        stickerMessage: 'sticker',
        documentMessage: 'document',
    };
    let msgContent = null, mediaType = null;
    for (const [key, type] of Object.entries(typeMap)) {
        if (message?.[key]) { msgContent = message[key]; mediaType = type; break; }
    }
    if (!msgContent || !mediaType) return null;
    const stream = await downloadContentFromMessage(msgContent, mediaType);
    const chunks = [];
    for await (const chunk of stream) chunks.push(chunk);
    return { buffer: Buffer.concat(chunks), mediaType };
}

// ─── Jalankan FFmpeg ──────────────────────────────────────────────────────────
function runFFmpeg(inputPath, outputPath, optionsFn) {
    return new Promise((resolve, reject) => {
        let ffmpegPath;
        try { ffmpegPath = require('@ffmpeg-installer/ffmpeg').path; }
        catch { ffmpegPath = 'ffmpeg'; }
        const ffmpeg = require('fluent-ffmpeg');
        ffmpeg.setFfmpegPath(ffmpegPath);
        const cmd = ffmpeg(inputPath);
        optionsFn(cmd);
        cmd.output(outputPath).on('end', resolve).on('error', reject).run();
    });
}

function writeTmp(buffer, ext) {
    const p = path.join(os.tmpdir(), `wbot_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`);
    fs.writeFileSync(p, buffer);
    return p;
}

function cleanTmp(...paths) {
    for (const p of paths) { try { if (p) fs.unlinkSync(p); } catch { } }
}

// ─── Handler ──────────────────────────────────────────────────────────────────
const handler = async (ctx) => {
    const { command, msg, sock, sender } = ctx;
    const p = config.prefix;
    const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage
        || msg.message;

    switch (command.name) {
        case 'ffmpegmenu':
            let menu = `
╭──❍『𝑫𝒐𝒘𝒏𝒍𝒐𝒂𝒅𝒆𝒓 𝑴𝒆𝒏𝒖』
│
│⭔ ${p}ytmp3 [url]
│⭔ ${p}ytmp4 [url]
│⭔ ${p}tiktok [url]
│⭔ ${p}twiter [url]
│⭔ ${p}facebook [url]
│⭔ ${p}pinterest [url]
│⭔ ${p}instagram [url]
│
╰────❍
`
            await ctx.sendInteractive({
                text: menu,
                footer: config.botName,
                quoted: ctx.fakeOrder,
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
                                rows: [{ title: "Ffmpeg Menu", description: "Select to display ffmpeg menu", id: "ffmpeg" }]
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
        // ── !sticker / !s ─────────────────────────────────────────────────────
        case 'sticker':
        case 's': {
            const mediaResult = await downloadMedia(quotedMsg);
            if (!mediaResult) {
                return ctx.reply({
                    text: [
                        '❌ *Tidak ada media yang dideteksi!*', '',
                        'Cara pakai:',
                        '• Reply foto        → `!s`',
                        '• Reply GIF/video   → `!s` (stiker animasi)',
                        '• Custom nama       → `!s NamaPaket|Author`',
                    ].join('\n')
                });
            }

            await ctx.react('⏳');

            const { buffer, mediaType } = mediaResult;
            const isAnimated = mediaType === 'video'
                || (mediaType === 'image' && quotedMsg?.imageMessage?.mimetype === 'image/gif')
                || (mediaType === 'sticker' && quotedMsg?.stickerMessage?.isAnimated);

            // Parse "NamaPaket|Author" dari args
            const rawArgs = (command.fullArgs || '').trim();
            const [packName, authorName] = rawArgs
                ? rawArgs.split('|').map(s => s.trim())
                : ['Bot', 'WaBot'];

            let inputPath, outputPath;
            try {
                let stickerBuffer;

                if (isAnimated) {
                    inputPath = writeTmp(buffer, mediaType === 'video' ? 'mp4' : 'webp');
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
                                '-an', '-vsync', '0',
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
                        inputPath = writeTmp(buffer, 'jpg');
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

                // ✅ Inject metadata nama & author yang benar
                stickerBuffer = await injectStickerMetadata(stickerBuffer, packName, authorName);

                await sock.sendMessage(sender, { sticker: stickerBuffer, isAnimated }, { quoted: msg });
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

        // ── !toimg ────────────────────────────────────────────────────────────
        case 'toimg': {
            const mediaResult = await downloadMedia(quotedMsg);
            if (!mediaResult || mediaResult.mediaType !== 'sticker') {
                return ctx.reply({ text: '❌ Reply sebuah stiker!\n\nCara pakai: reply stiker → `!toimg`' });
            }

            await ctx.react('⏳');
            const { buffer } = mediaResult;
            const isAnimated = quotedMsg?.stickerMessage?.isAnimated;
            let inputPath, outputPath;

            try {
                if (!isAnimated) {
                    try {
                        const sharp = require('sharp');
                        const pngBuffer = await sharp(buffer).png().toBuffer();
                        await sock.sendMessage(sender, { image: pngBuffer, caption: '🖼️ Stiker → Foto!' }, { quoted: msg });
                        await ctx.react('✅');
                        return;
                    } catch { /* fallback FFmpeg */ }
                }
                inputPath = writeTmp(buffer, 'webp');
                outputPath = writeTmp(Buffer.alloc(0), 'png');
                await runFFmpeg(inputPath, outputPath, (cmd) => {
                    cmd
                        .inputOptions(['-vframes 1'])
                        .outputOptions(['-vf', 'scale=512:512:force_original_aspect_ratio=decrease']);
                });
                const imgBuffer = fs.readFileSync(outputPath);
                await sock.sendMessage(sender, {
                    image: imgBuffer,
                    caption: `🖼️ Stiker → Foto!${isAnimated ? '\n_(frame pertama dari stiker animasi)_' : ''}`,
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

        // ── !togif ────────────────────────────────────────────────────────────
        case 'togif': {
            const mediaResult = await downloadMedia(quotedMsg);
            if (!mediaResult) {
                return ctx.reply({ text: '❌ Reply stiker animasi atau video!\n\nCara pakai: reply stiker/video → `!togif`' });
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
                inputPath = writeTmp(buffer, isVideo ? 'mp4' : 'webp');
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
                    video: gifBuffer, gifPlayback: true,
                    caption: `🎞️ GIF berhasil! (${gifSizeMB} MB)`,
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