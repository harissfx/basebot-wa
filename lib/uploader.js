'use strict';

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function TelegraPh(filePath) {
    if (!fs.existsSync(filePath)) throw new Error('File not Found');

    const form = new FormData();
    const filename = path.basename(filePath) || 'image.jpg';
    form.append('photo', fs.createReadStream(filePath), {
        filename,
        contentType: guessMime(filename),
    });

    const { data, status } = await axios.post('https://telegra.ph/upload', form, {
        headers: {
            ...form.getHeaders(),
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            Origin: 'https://telegra.ph',
            Referer: 'https://telegra.ph/',
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        validateStatus: () => true,
    });

    if (status !== 200) {
        throw new Error(`Telegra.ph HTTP ${status}: ${typeof data === 'string' ? data.slice(0, 200) : JSON.stringify(data)}`);
    }

    if (data?.error) throw new Error(String(data.error));
    if (Array.isArray(data) && data[0]?.error) throw new Error(String(data[0].error));
    if (!Array.isArray(data) || !data[0]?.src) {
        throw new Error('Upload gagal / response kosong: ' + JSON.stringify(data));
    }

    return 'https://telegra.ph' + data[0].src;
}

async function UploadFileUgu(input) {
    if (!fs.existsSync(input)) throw new Error('File not Found');

    const form = new FormData();
    form.append('files[]', fs.createReadStream(input), {
        filename: path.basename(input),
    });

    const { data, status } = await axios.post('https://uguu.se/upload.php', form, {
        headers: {
            'User-Agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            ...form.getHeaders(),
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        validateStatus: () => true,
    });

    if (status !== 200) {
        throw new Error(`uguu.se HTTP ${status}: ${typeof data === 'string' ? data.slice(0, 200) : JSON.stringify(data)}`);
    }
    if (!data?.files?.[0]) {
        throw new Error('Upload uguu gagal / response kosong: ' + JSON.stringify(data));
    }
    return data.files[0];
}

async function UploadCatbox(filePath) {
    if (!fs.existsSync(filePath)) throw new Error('File not Found');

    const form = new FormData();
    form.append('reqtype', 'fileupload');
    form.append('fileToUpload', fs.createReadStream(filePath), {
        filename: path.basename(filePath),
    });

    const { data, status } = await axios.post('https://catbox.moe/user/api.php', form, {
        headers: {
            ...form.getHeaders(),
            'User-Agent': 'Mozilla/5.0',
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        validateStatus: () => true,
    });

    if (status !== 200 || typeof data !== 'string' || !data.startsWith('http')) {
        throw new Error(`catbox gagal: ${status} ${String(data).slice(0, 150)}`);
    }
    return data.trim();
}

function guessMime(filename) {
    const ext = (filename.split('.').pop() || '').toLowerCase();
    const map = {
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        png: 'image/png',
        gif: 'image/gif',
        webp: 'image/webp',
        mp4: 'video/mp4',
        pdf: 'application/pdf',
    };
    return map[ext] || 'application/octet-stream';
}

module.exports = { TelegraPh, UploadFileUgu, UploadCatbox };