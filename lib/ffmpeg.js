'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const { TextEncoder } = require('util');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

async function injectStickerMetadata(webpBuffer, packName, authorName) {
    try {
        const { Image } = require('node-webpmux');
        const data = JSON.stringify({
            'sticker-pack-id': require('crypto').randomBytes(32).toString('hex'),
            'sticker-pack-name': packName,
            'sticker-pack-publisher': authorName,
            'emojis': ['🤖'],
        });

        const exif = Buffer.concat([
            Buffer.from([
                0x49, 0x49, 0x2a, 0x00, 0x08, 0x00, 0x00, 0x00,
                0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00,
                0x00, 0x00, 0x16, 0x00, 0x00, 0x00
            ]),
            Buffer.from(data, 'utf-8'),
        ]);
        
        exif.writeUIntLE(new TextEncoder().encode(data).length, 14, 4);
        const img = new Image();
        await img.load(webpBuffer);
        img.exif = exif;
        return await img.save(null);
    } catch (e) {
        console.warn('[STICKER META] Gagal inject metadata:', e.message);
        return webpBuffer;
    }
}

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
    for (const p of paths) {
        try { if (p) fs.unlinkSync(p); } catch { }
    }
}

module.exports = {
    injectStickerMetadata,
    downloadMedia,
    runFFmpeg,
    writeTmp,
    cleanTmp,
};