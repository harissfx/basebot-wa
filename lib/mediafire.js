'use strict';

const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Scrape direct download info from MediaFire share link
 * @param {string} url
 * @returns {Promise<{ nama: string, mime: string, size: string, link: string }>}
 */
async function mediafireDl(url) {
    if (!url || typeof url !== 'string') {
        throw new Error('URL MediaFire tidak valid');
    }

    url = url.trim();
    if (!url.includes('mediafire.com')) {
        throw new Error('Link bukan MediaFire');
    }

    const { data: html, status } = await axios.get(url, {
        headers: {
            'User-Agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        timeout: 30000,
        maxRedirects: 5,
        validateStatus: () => true,
    });

    if (status !== 200) {
        throw new Error(`Gagal membuka halaman MediaFire (HTTP ${status})`);
    }

    const $ = cheerio.load(html);

    let link = $('a#downloadButton').attr('href') || null;
    let sizeText = $('a#downloadButton').text() || '';

    if (!link) {
        link =
            $('a[href*="download"]').filter((i, el) => {
                const href = $(el).attr('href') || '';
                return /mediafire\.com|download/i.test(href) && !href.includes('javascript');
            }).first().attr('href') || null;
    }

    if (!link) {
        const match = html.match(/https?:\/\/download\d*\.mediafire\.com\/[^"'\s]+/i);
        if (match) link = match[0];
    }

    if (!link) {
        throw new Error('Tombol download tidak ditemukan. Link mungkin private / expired / salah.');
    }

    sizeText = sizeText
        .replace(/Download/gi, '')
        .replace(/[()]/g, '')
        .replace(/\s+/g, ' ')
        .trim();

    let nama = '';
    try {
        const u = new URL(link);
        const parts = u.pathname.split('/').filter(Boolean);
        nama = decodeURIComponent(parts[parts.length - 1] || '');
    } catch {
        const seplit = link.split('/');
        nama = seplit[seplit.length - 1] || 'file';
    }

    nama = nama.split('?')[0] || 'file';

    const ext = (nama.split('.').pop() || '').toLowerCase();
    const mimeMap = {
        apk: 'application/vnd.android.package-archive',
        zip: 'application/zip',
        rar: 'application/x-rar-compressed',
        '7z': 'application/x-7z-compressed',
        pdf: 'application/pdf',
        mp4: 'video/mp4',
        mkv: 'video/x-matroska',
        mp3: 'audio/mpeg',
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        png: 'image/png',
        gif: 'image/gif',
        webp: 'image/webp',
        txt: 'text/plain',
        exe: 'application/x-msdownload',
        doc: 'application/msword',
        docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        xls: 'application/vnd.ms-excel',
        xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ppt: 'application/vnd.ms-powerpoint',
        pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    };
    const mime = mimeMap[ext] || 'application/octet-stream';

    return {
        nama: nama || `file.${ext || 'bin'}`,
        mime,
        size: sizeText || 'Unknown',
        link,
    };
}

module.exports = { mediafireDl };
