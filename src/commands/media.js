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
const config = require('../config');
const plugins = require('../utils/PluginLoader');
const { getDevice } = require('@whiskeysockets/baileys');
const {
    injectStickerMetadata,
    downloadMedia,
    runFFmpeg,
    writeTmp,
    cleanTmp,
} = require('../../lib/ffmpeg');

// ─── Handler ──────────────────────────────────────────────────────────────────
const handler = async (m) => {
    const { command, isSuperOwner, msg, Hanz, sender, senderNumber, pushname, isOwner } = m;
    const p = config.prefix;
    const nomorUser = senderNumber;
    const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage
        || msg.message;

    switch (command.name) {
        case 'ffmpegmenu':
            const device = getDevice(msg.key.id);
            const mediaCmds = plugins.commandsByFile()['media'] || [];
            const role = isSuperOwner ? 'Super Owner' : (isOwner ? 'Co-Owner' : 'User');
            let menu = `┌─❖「 𝗜𝗡𝗙𝗢 𝗨𝗦𝗘𝗥 」
│● 𝘕𝘢𝘮𝘢: ${pushname}
│● 𝘕𝘰𝘮𝘰𝘳: ${nomorUser}
│● 𝘚𝘵𝘢𝘵𝘶𝘴: ${role}
│● 𝘗𝘦𝘳𝘢𝘯𝘨𝘬𝘢𝘵: ${device}
│
└┬❖ 
┌┤𝖧𝖺𝗒 𝗄𝖺𝗄 ${pushname} 👋
│└────────────┈ ⳹
│「 𝗠𝗘𝗗𝗜𝗔 𝗠𝗘𝗡𝗨 」
│
${mediaCmds.map(cmd => `│⪩ \`${p}${cmd}\``).join('\n')}
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
                            }]
                        })
                    }]
            });
            break;

        // ── !sticker / !s ─────────────────────────────────────────────────────
        case 'sticker':
        case 's': {
            const mediaResult = await downloadMedia(quotedMsg);
            if (!mediaResult) {
                return m.reply({
                    text: [
                        '❌ *Tidak ada media yang dideteksi!*', '',
                        'Cara pakai:',
                        '• Reply foto        → `!s`',
                        '• Reply GIF/video   → `!s` (stiker animasi)',
                        '• Custom nama       → `!s NamaPaket|Author`',
                    ].join('\n')
                });
            }

            await m.react('⏳');

            const { buffer, mediaType } = mediaResult;
            const isAnimated = mediaType === 'video'
                || (mediaType === 'image' && quotedMsg?.imageMessage?.mimetype === 'image/gif')
                || (mediaType === 'sticker' && quotedMsg?.stickerMessage?.isAnimated);

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

                stickerBuffer = await injectStickerMetadata(stickerBuffer, packName, authorName);

                await Hanz.sendMessage(sender, { sticker: stickerBuffer, isAnimated }, { quoted: msg });
                cleanTmp(inputPath, outputPath);
                await m.react('✅');

            } catch (err) {
                cleanTmp(inputPath, outputPath);
                console.error('[STICKER ERROR]', err.message);
                await m.react('❌');
                await m.reply({ text: `❌ Gagal membuat stiker.\nError: ${err.message}` });
            }
            break;
        }

        // ── !toimg ────────────────────────────────────────────────────────────
        case 'toimg': {
            const mediaResult = await downloadMedia(quotedMsg);
            if (!mediaResult || mediaResult.mediaType !== 'sticker') {
                return m.reply({ text: '❌ Reply sebuah stiker!\n\nCara pakai: reply stiker → `!toimg`' });
            }

            await m.react('⏳');
            const { buffer } = mediaResult;
            const isAnimated = quotedMsg?.stickerMessage?.isAnimated;
            let inputPath, outputPath;

            try {
                if (!isAnimated) {
                    try {
                        const sharp = require('sharp');
                        const pngBuffer = await sharp(buffer).png().toBuffer();
                        await Hanz.sendMessage(sender, { image: pngBuffer, caption: '🖼️ Stiker → Foto!' }, { quoted: msg });
                        await m.react('✅');
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
                await Hanz.sendMessage(sender, {
                    image: imgBuffer,
                    caption: `🖼️ Stiker → Foto!${isAnimated ? '\n_(frame pertama dari stiker animasi)_' : ''}`,
                }, { quoted: msg });
                cleanTmp(inputPath, outputPath);
                await m.react('✅');
            } catch (err) {
                cleanTmp(inputPath, outputPath);
                console.error('[TOIMG ERROR]', err.message);
                await m.react('❌');
                await m.reply({ text: `❌ Gagal konversi stiker ke foto.\nError: ${err.message}` });
            }
            break;
        }

        // ── !togif ────────────────────────────────────────────────────────────
        case 'togif': {
            const mediaResult = await downloadMedia(quotedMsg);
            if (!mediaResult) {
                return m.reply({ text: '❌ Reply stiker animasi atau video!\n\nCara pakai: reply stiker/video → `!togif`' });
            }

            const { buffer, mediaType } = mediaResult;
            const isAnimatedSticker = mediaType === 'sticker' && quotedMsg?.stickerMessage?.isAnimated;
            const isVideo = mediaType === 'video';

            if (!isAnimatedSticker && !isVideo) {
                return m.reply({ text: '❌ Hanya stiker animasi atau video yang bisa dikonversi ke GIF!' });
            }

            await m.react('⏳');
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
                    await m.react('❌');
                    return m.reply({ text: `❌ GIF terlalu besar (${gifSizeMB} MB). Coba video lebih pendek.` });
                }
                await Hanz.sendMessage(sender, {
                    video: gifBuffer, gifPlayback: true,
                    caption: `🎞️ GIF berhasil! (${gifSizeMB} MB)`,
                }, { quoted: msg });
                cleanTmp(inputPath, outputPath);
                await m.react('✅');
            } catch (err) {
                cleanTmp(inputPath, outputPath);
                console.error('[TOGIF ERROR]', err.message);
                await m.react('❌');
                await m.reply({ text: `❌ Gagal konversi ke GIF.\nError: ${err.message}` });
            }
            break;
        }

    }
};

module.exports = handler;