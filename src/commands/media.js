'use strict';

const fs = require('fs');
const path = require('path');
const config = require('../config');
const plugins = require('../utils/PluginLoader');
const { getDevice } = require('baileys');
const {
    injectStickerMetadata,
    downloadMedia,
    runFFmpeg,
    writeTmp,
    cleanTmp,
} = require('../../lib/ffmpeg');
const { generateProfilePic } = require('../utils/profileMaker');
const { getAssetPath } = require('../utils/remoteAsset');
const MEME_FONT_PATH = path.join(__dirname, '../../lib/font/anton.ttf');
const MEME_FONT_URL  = 'https://raw.githubusercontent.com/google/fonts/main/ofl/anton/Anton-Regular.ttf';
const memeFfEsc = (str) => `'${String(str).replace(/\\/g, '/').replace(/:/g, '\\:').replace(/'/g, "\\'")}'`;

async function ensureMemeFont() {
    const isValid = (b) => b.length > 10000 && (b.readUInt32BE(0) === 0x00010000 || b.slice(0, 4).toString() === 'OTTO');
    if (fs.existsSync(MEME_FONT_PATH) && isValid(fs.readFileSync(MEME_FONT_PATH))) return MEME_FONT_PATH;
    const axios = require('axios');
    const { data } = await axios.get(MEME_FONT_URL, { responseType: 'arraybuffer', timeout: 20000 });
    const buf = Buffer.from(data);
    if (!isValid(buf)) throw new Error('File font hasil unduhan tidak valid');
    fs.mkdirSync(path.dirname(MEME_FONT_PATH), { recursive: true });
    fs.writeFileSync(MEME_FONT_PATH, buf);
    return MEME_FONT_PATH;
}

function layoutMemeText(font, text, imgW, opts = {}) {
    const { maxLines = 3, startDiv = 8, minDiv = 22, maxHeight = 0 } = opts;
    const upper = String(text).replace(/[\u0000-\u001f]/g, ' ').replace(/\s+/g, ' ').trim().toUpperCase();
    if (!upper) return { lines: [], size: 0, border: 0 };
    const measure = (s, size) => (font.layout(s).advanceWidth / font.unitsPerEm) * size;
    const minSize = Math.max(14, Math.round(imgW / minDiv));
    let size = Math.round(imgW / startDiv);

    for (;;) {
        const border = Math.max(2, Math.round(size / 12));
        const maxW = imgW * 0.95 - border * 2;
        const lines = [];
        let cur = '';
        for (const word of upper.split(' ')) {
            const cand = cur ? `${cur} ${word}` : word;
            if (measure(cand, size) <= maxW) { cur = cand; continue; }
            if (cur) lines.push(cur);
            cur = word;
            while (measure(cur, size) > maxW && cur.length > 1) {  
                let cut = cur.length - 1;
                while (cut > 1 && measure(cur.slice(0, cut), size) > maxW) cut--;
                lines.push(cur.slice(0, cut));
                cur = cur.slice(cut);
            }
        }
        if (cur) lines.push(cur);
        const muat = lines.length <= maxLines && (!maxHeight || lines.length * size * 1.1 <= maxHeight);
        if (muat || size <= minSize) return { lines: lines.slice(0, maxLines), size, border };
        size -= 2;
    }
}

const handler = async (m) => {
    const { command, isSuperOwner, msg, Hanz, senderNumber, pushname, isOwner } = m;
    const p = m.prefix;
    const nomorUser = senderNumber;
    const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage
        || msg.message;

    switch (command.name) {
        case 'ffmpegmenu':
            const device = getDevice(msg.key.id);
            const mediaCmds = (plugins.commandsByFile()['media'] || [])
            .filter(cmd => !['ffmpegmenu'].includes(cmd));
            const role = isSuperOwner ? 'Super Owner' : (isOwner ? 'Co-Owner' : 'User biasa');
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
            : [config.botName, config.ownerName];

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

                await Hanz.sendMessage(m.chat, { sticker: stickerBuffer, isAnimated }, { quoted: msg });
                cleanTmp(inputPath, outputPath);
                await m.react('✅');

            } catch (err) {
                cleanTmp(inputPath, outputPath);
                console.error('[STICKER ERROR]', err.message);
                await m.react('❌');
                await m.reply({ text: `❌ Gagal membuat stiker.\nError: ${err.message}` });
            }
        }
            break;

        case 'smeme': {
            const input = (command.fullArgs || '').trim();
            if (!input) {
                return m.reply({
                    text: [
                        '❌ *Teks belum diisi!*', '',
                        'Cara pakai (reply foto atau kirim foto + caption):',
                        `• \`${p}smeme teks bawah\``,
                        `• \`${p}smeme teks atas|teks bawah\``,
                    ].join('\n')
                });
            }

            const mediaResult = await downloadMedia(quotedMsg);
            if (!mediaResult || !['image', 'sticker'].includes(mediaResult.mediaType)) {
                return m.reply({ text: `❌ Reply atau kirim *foto* dengan caption \`${p}smeme teks\`` });
            }
            if (mediaResult.mediaType === 'sticker' && quotedMsg?.stickerMessage?.isAnimated) {
                return m.reply({ text: '❌ Stiker animasi tidak didukung, pakai foto atau stiker biasa.' });
            }

            let topText = '', bottomText = input;
            if (input.includes('|')) {
                const idx = input.indexOf('|');
                topText = input.slice(0, idx).trim();
                bottomText = input.slice(idx + 1).trim();
            }
            if (topText.length > 100 || bottomText.length > 100) {
                return m.reply({ text: '❌ Teks terlalu panjang (maks 100 karakter per baris).' });
            }

            await m.react('⏳');

            const tmpFiles = [];
            try {
                const sharp = require('sharp');
                const fontkit = require('fontkit');
                const fontPath = await ensureMemeFont();
                const font = fontkit.openSync(fontPath);
                const { data: imgBuf, info } = await sharp(mediaResult.buffer)
                    .rotate()
                    .resize(512, 512, { fit: 'inside' })
                    .flatten({ background: '#ffffff' })
                    .png()
                    .toBuffer({ resolveWithObject: true });
                const W = info.width, H = info.height;

                const inputPath = writeTmp(imgBuf, 'png');
                const outputPath = writeTmp(Buffer.alloc(0), 'png');
                tmpFiles.push(inputPath, outputPath);

                const esc = (str) => `'${String(str).replace(/\\/g, '/').replace(/:/g, '\\:').replace(/'/g, "\\'")}'`;
                const clauses = [];
                const addLines = (text, position) => {
                    const { lines, size, border } = layoutMemeText(font, text, W);
                    if (!lines.length) return;
                    const lineH = Math.round(size * 1.08);
                    const margin = Math.round(H * 0.03);
                    lines.forEach((line, i) => {
                        const f = writeTmp(Buffer.from(line, 'utf-8'), 'txt');
                        tmpFiles.push(f);
                        const y = position === 'top'
                            ? margin + i * lineH
                            : H - margin - (lines.length - i) * lineH;
                        clauses.push(
                            `drawtext=fontfile=${esc(fontPath)}:textfile=${esc(f)}:expansion=none` +
                            `:fontsize=${size}:fontcolor=white:borderw=${border}:bordercolor=black` +
                            `:x=(w-text_w)/2:y=${y}`
                        );
                    });
                };
                addLines(topText, 'top');
                addLines(bottomText, 'bottom');

                await runFFmpeg(inputPath, outputPath, (cmd) => {
                    cmd.outputOptions(['-vf', clauses.join(','), '-frames:v', '1']);
                });

                let stickerBuffer = await sharp(fs.readFileSync(outputPath))
                    .webp({ quality: 85 })
                    .toBuffer();
                stickerBuffer = await injectStickerMetadata(stickerBuffer, config.botName, config.ownerName);

                await Hanz.sendMessage(m.chat, { sticker: stickerBuffer }, { quoted: msg });
                cleanTmp(...tmpFiles);
                await m.react('✅');

            } catch (err) {
                cleanTmp(...tmpFiles);
                console.error('[SMEME ERROR]', err.message);
                await m.react('❌');
                await m.reply({ text: `❌ Gagal membuat stiker meme.\nError: ${err.message}` });
            }
        }
            break;

        case 'attp': {
            const text = (command.fullArgs || '').trim();
            if (!text) {
                return m.reply({ text: `❌ Teksnya mana?\nContoh: \`${p}attp halo semua\`` });
            }
            if (text.length > 120) {
                return m.reply({ text: '❌ Teks terlalu panjang (maks 120 karakter).' });
            }

            await m.react('⏳');

            const tmpFiles = [];
            try {
                const fontkit = require('fontkit');
                const fontPath = await ensureMemeFont();
                const font = fontkit.openSync(fontPath);

                const S = 512;
                const { lines, size, border } = layoutMemeText(font, text, S, {
                    maxLines: 6, startDiv: 3.5, minDiv: 26, maxHeight: S * 0.9,
                });
                const lineH = Math.round(size * 1.1);
                const startY = Math.round((S - lines.length * lineH) / 2);
                const WARNA = ['0xff3b30', '0xff9500', '0xffd60a', '0x34c759', '0x00c7ff', '0xbf5af2'];
                const DURASI = 0.25;

                const lineFiles = lines.map((l) => {
                    const f = writeTmp(Buffer.from(l, 'utf-8'), 'txt');
                    tmpFiles.push(f);
                    return f;
                });

                const clauses = [];
                WARNA.forEach((warna, k) => {
                    lineFiles.forEach((f, i) => {
                        clauses.push(
                            `drawtext=fontfile=${memeFfEsc(fontPath)}:textfile=${memeFfEsc(f)}:expansion=none` +
                            `:fontsize=${size}:fontcolor=${warna}:borderw=${border}:bordercolor=black` +
                            `:x=(w-text_w)/2:y=${startY + i * lineH}` +
                            `:enable='between(t,${(k * DURASI).toFixed(2)},${((k + 1) * DURASI).toFixed(2)})'`
                        );
                    });
                });

                const outputPath = writeTmp(Buffer.alloc(0), 'webp');
                tmpFiles.push(outputPath);

                await runFFmpeg(`color=c=black@0.0:s=${S}x${S}:r=15:d=${WARNA.length * DURASI},format=rgba`, outputPath, (cmd) => {
                    cmd.inputFormat('lavfi').outputOptions([
                        '-vf', clauses.join(','),
                        '-vcodec', 'libwebp',
                        '-lossless', '0',
                        '-compression_level', '6',
                        '-quality', '75',
                        '-loop', '0',
                        '-preset', 'default',
                        '-an', '-vsync', '0',
                    ]);
                });

                let stickerBuffer = fs.readFileSync(outputPath);
                stickerBuffer = await injectStickerMetadata(stickerBuffer, config.botName, config.ownerName);

                await Hanz.sendMessage(m.chat, { sticker: stickerBuffer, isAnimated: true }, { quoted: msg });
                cleanTmp(...tmpFiles);
                await m.react('✅');

            } catch (err) {
                cleanTmp(...tmpFiles);
                console.error('[ATTP ERROR]', err.message);
                await m.react('❌');
                await m.reply({ text: `❌ Gagal membuat stiker teks.\nError: ${err.message}` });
            }
        }
            break;

        case 'take': {
            const stickerMsg = quotedMsg?.stickerMessage;
            if (!stickerMsg) {
                return m.reply({
                    text: [
                        '❌ *Reply stikernya dulu!*', '',
                        `• \`${p}take\` → paket atas namamu`,
                        `• \`${p}take NamaPaket|Author\` → nama bebas`,
                    ].join('\n')
                });
            }

            await m.react('⏳');
            try {
                const mediaResult = await downloadMedia(quotedMsg);
                if (!mediaResult) throw new Error('Gagal mengunduh stiker');

                const bagian = (command.fullArgs || '').split('|').map((s) => s.trim());
                const packName = (bagian[0] || pushname).slice(0, 40);
                const authorName = (bagian[1] || config.botName).slice(0, 40);

                const stickerBuffer = await injectStickerMetadata(mediaResult.buffer, packName, authorName);
                await Hanz.sendMessage(m.chat, { sticker: stickerBuffer, isAnimated: !!stickerMsg.isAnimated }, { quoted: msg });
                await m.react('✅');
            } catch (err) {
                console.error('[TAKE ERROR]', err.message);
                await m.react('❌');
                await m.reply({ text: `❌ Gagal mengganti info stiker.\nError: ${err.message}` });
            }
        }
            break;

    case 'buatpp':
    case 'ppmaker': {
        const mediaResult = await downloadMedia(quotedMsg);
        if (!mediaResult || mediaResult.mediaType !== 'image') {
            return m.reply({
                text: [
                    '❌ *Tidak ada foto yang dideteksi!*', '',
                    'Cara pakai:',
                    `• Reply foto              → \`${p}pp\``,
                    `• Kirim foto + caption    → \`${p}pp\``,
                ].join('\n')
            });
        }

        await m.react('⏳');
        try {
            const { buffer } = mediaResult;
            const ppBuffer = await generateProfilePic(buffer);

            await Hanz.sendMessage(m.chat, {
                image: ppBuffer,
                caption: `✅ Berhasil, ${pushname}!`,
            }, { quoted: msg });
            await m.react('✅');
        } catch (err) {
            console.error('[PP ERROR]', err.message);
            await m.react('❌');
            await m.reply({ text: `❌ Gagal membuat foto profil.\nError: ${err.message}` });
        }
    }
        break;

    case 'goodbaycik': {
                const imageUrl = 'https://files.catbox.moe/nd1oqp.webp';
                const axios = require('axios');
                const { data } = await axios.get(imageUrl, { responseType: 'arraybuffer', timeout: 15000 });
                const inputBuffer = Buffer.from(data);
                const sharp = require('sharp');
                let stickerBuffer = await sharp(inputBuffer)
                    .resize(512, 512, { fit: 'inside', background: { r: 0, g: 0, b: 0, alpha: 0 } })
                    .webp({ quality: 80 })
                    .toBuffer();
                stickerBuffer = await injectStickerMetadata(stickerBuffer, config.botName, config.ownerName);
                await Hanz.sendMessage(m.chat, { sticker: stickerBuffer }, { quoted: msg });
        }
            break;
    case 'welcomecik': {
                const imageUrl = 'https://files.catbox.moe/ji993c.webp';
                const axios = require('axios');
                const { data } = await axios.get(imageUrl, { responseType: 'arraybuffer', timeout: 15000 });
                const inputBuffer = Buffer.from(data);
                const sharp = require('sharp');
                let stickerBuffer = await sharp(inputBuffer)
                    .resize(512, 512, { fit: 'inside', background: { r: 0, g: 0, b: 0, alpha: 0 } })
                    .webp({ quality: 80 })
                    .toBuffer();
                stickerBuffer = await injectStickerMetadata(stickerBuffer, config.botName, config.ownerName);
                await Hanz.sendMessage(m.chat, { sticker: stickerBuffer }, { quoted: msg });
        }
            break;

        case 'toimg': {
            const mediaResult = await downloadMedia(quotedMsg);
            if (!mediaResult || mediaResult.mediaType !== 'sticker') {
                return m.reply({ text: '❌ Reply sebuah stiker!\n\nCara pakai: reply stiker → `' + m.prefix + 'toimg`' });
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
                        await Hanz.sendMessage(m.chat, { image: pngBuffer, caption: '🖼️ Stiker → Foto!' }, { quoted: msg });
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
                await Hanz.sendMessage(m.chat, {
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
        }
            break;

        case 'togif': {
            const mediaResult = await downloadMedia(quotedMsg);
            if (!mediaResult) {
                return m.reply({ text: '❌ Reply stiker animasi atau video!\n\nCara pakai: reply stiker/video → `' + m.prefix + 'togif`' });
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
                await Hanz.sendMessage(m.chat, {
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
        }
            break;

        case 'nulis': {
            const raw = command.fullArgs.trim();
            if (!raw || !raw.includes('|')) {
                return m.reply({
                    text: [
                        '❌ *Cara pakai:*',
                        '`' + m.prefix + 'nulis Nama|Kelas|Warna|Isi tulisan`',
                        '',
                        'Contoh:',
                        '`' + m.prefix + 'nulis Budi|9A|black|Aku lagi belajar bikin bot WhatsApp`',
                        '',
                        '• *Warna* nama warna (black, white, red, dst) atau kode hex (contoh: ff0000)',
                        '• *Nama* maksimal 27 karakter, *Kelas* maksimal 6 karakter',
                    ].join('\n')
                });
            }

            const [namaRaw, kelasRaw, warnaRaw, ...isiParts] = raw.split('|');
            const nama = (namaRaw || '').trim();
            const kelas = (kelasRaw || '').trim();
            const warna = (warnaRaw || '').trim();
            const isi = isiParts.join('|').trim();

            if (!nama) return m.reply({ text: '❌ Nama belum diisi.' });
            if (!kelas) return m.reply({ text: '❌ Kelas belum diisi.' });
            if (!warna) return m.reply({ text: '❌ Warna belum diisi.\nContoh: black, white, red, atau ff0000' });
            if (!isi) return m.reply({ text: '❌ Isi tulisan belum diisi.' });
            if (nama.length > 27) return m.reply({ text: '❌ Nama maksimal 27 karakter.' });
            if (kelas.length > 6) return m.reply({ text: '❌ Kelas maksimal 6 karakter.' });
            if (!/^#?[a-zA-Z0-9]{1,8}$/.test(warna)) {
                return m.reply({ text: '❌ Format warna tidak valid.\nContoh: black, white, red, atau ff0000' });
            }

            const fontPath = path.join(__dirname, '../../lib/font/nulis.ttf');
            if (!fs.existsSync(fontPath)) {
                return m.reply({ text: '❌ Asset `nulis.ttf` tidak ditemukan di server.' });
            }
            let bgPath;
            try {
                bgPath = await getAssetPath('magerNulis');
            } catch (err) {
                console.error('[MAGERNULIS]', err.message);
                return m.reply({ text: '❌ Gagal mengambil gambar `magernulis.jpg` dari URL. Cek `ASSET_MAGER_NULIS_URL` di file .env.' });
            }

            await m.react('✍️');

            const hariList = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
            const bulanList = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
            const now = new Date();
            const hariIni = hariList[now.getDay()];
            const tanggalIni = `${now.getDate()} ${bulanList[now.getMonth()]} ${now.getFullYear()}`;
            const BODY_FONT_SIZE = 19;
            const BODY_X = 344;
            const BODY_MAX_WIDTH = 566;
            const BODY_FIRST_RULED_Y = 149;
            const BODY_LINE_HEIGHT = 22.6;
            const BODY_BASELINE_OFFSET = BODY_FONT_SIZE * 0.895;
            const BODY_MAX_LINES = 25;

            let fontkit, font;
            try {
                fontkit = require('fontkit');
                font = fontkit.openSync(fontPath);
            } catch (err) {
                return m.reply({ text: '❌ Modul `fontkit` belum terpasang. Jalankan `npm install fontkit` di folder bot lalu coba lagi.' });
            }
            const textWidthPx = (str, size) => (font.layout(str).advanceWidth / font.unitsPerEm) * size;

            function wrapByWidth(text, fontSize, maxWidth) {
                const words = text.split(/\s+/).filter(Boolean);
                const lines = [];
                let cur = '';
                for (const word of words) {
                    const candidate = cur ? `${cur} ${word}` : word;
                    if (textWidthPx(candidate, fontSize) > maxWidth && cur) {
                        lines.push(cur);
                        cur = word;
                    } else {
                        cur = candidate;
                    }
                    while (textWidthPx(cur, fontSize) > maxWidth && cur.length > 1) {
                        let cut = cur.length - 1;
                        while (cut > 1 && textWidthPx(cur.slice(0, cut), fontSize) > maxWidth) cut--;
                        lines.push(cur.slice(0, cut));
                        cur = cur.slice(cut);
                    }
                }
                if (cur) lines.push(cur);
                return lines;
            }

            const allLines = wrapByWidth(isi, BODY_FONT_SIZE, BODY_MAX_WIDTH);
            const truncated = allLines.length > BODY_MAX_LINES;
            const bodyLines = allLines.slice(0, BODY_MAX_LINES);

            let namaFile, kelasFile, hariFile, tanggalFile, outputPath;
            const bodyFiles = [];
            try {
                namaFile = writeTmp(Buffer.from(nama, 'utf-8'), 'txt');
                kelasFile = writeTmp(Buffer.from(`Kelas: ${kelas}`, 'utf-8'), 'txt');
                hariFile = writeTmp(Buffer.from(hariIni, 'utf-8'), 'txt');
                tanggalFile = writeTmp(Buffer.from(tanggalIni, 'utf-8'), 'txt');
                outputPath = writeTmp(Buffer.alloc(0), 'jpg');
                const esc = (str) => `'${String(str).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
                const fontcolor = warna.replace(/^#/, '0x');

                const draw = (textfile, x, y, fontsize) =>
                    `drawtext=fontfile=${esc(fontPath)}:textfile=${esc(textfile)}:x=${x}:y=${Math.round(y)}:fontsize=${fontsize}:fontcolor=${fontcolor}`;

                const clauses = [
                    draw(hariFile, 815, 64, 16),
                    draw(tanggalFile, 815, 87, 16),
                    draw(namaFile, 285, 95, 18),
                    draw(kelasFile, 650, 95, 18),
                ];

                bodyLines.forEach((line, i) => {
                    const lineFile = writeTmp(Buffer.from(line, 'utf-8'), 'txt');
                    bodyFiles.push(lineFile);
                    const ruledY = BODY_FIRST_RULED_Y + i * BODY_LINE_HEIGHT;
                    clauses.push(draw(lineFile, BODY_X, ruledY - BODY_BASELINE_OFFSET, BODY_FONT_SIZE));
                });

                const vf = clauses.join(',');

                await runFFmpeg(bgPath, outputPath, (cmd) => {
                    cmd.outputOptions(['-vf', vf, '-frames:v', '1']);
                });

                const buffer = fs.readFileSync(outputPath);
                await Hanz.sendMessage(m.chat, {
                    image: buffer,
                    caption: truncated
                        ? `✅ Berhasil, ${pushname}!\n⚠️ Isi tulisan kepanjangan, dipotong sampai ${BODY_MAX_LINES} baris (muat 1 halaman).`
                        : `✅ Berhasil, ${pushname}!`,
                }, { quoted: msg });
                cleanTmp(namaFile, kelasFile, hariFile, tanggalFile, outputPath, ...bodyFiles);
                await m.react('✅');
            } catch (err) {
                cleanTmp(namaFile, kelasFile, hariFile, tanggalFile, outputPath, ...bodyFiles);
                console.error('[NULIS ERROR]', err.message);
                await m.react('❌');
                await m.reply({ text: `❌ Gagal membuat tulisan.\nError: ${err.message}` });
            }
        }
            break;

    }
};

module.exports = handler;