'use strict';

const axios = require('axios');

const SYNDICATION_URL = 'https://cdn.syndication.twimg.com/tweet-result';

function extractTweetId(url) {
    const m = String(url).match(/status(?:es)?\/(\d+)/);
    if (!m) throw new Error('URL tweet tidak valid, ID status tidak ditemukan');
    return m[1];
}

function getToken(id) {
    return ((Number(id) / 1e15) * Math.PI).toString(36).replace(/(0+|\.)/g, '');
}

/**
 * Ambil daftar media (foto & video) dari sebuah tweet lewat syndication API,
 * @param {string} url
 * @returns {Promise<{ text: string, user: string, media: Array<{type: 'photo'|'video', url: string}> }>}
 */
async function getTweetMedia(url) {
    const id = extractTweetId(url);
    const token = getToken(id);

    let data, status;
    try {
        ({ data, status } = await axios.get(SYNDICATION_URL, {
            params: { id, token, lang: 'en' },
            timeout: 20000,
            validateStatus: () => true,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                Accept: 'application/json',
            },
        }));
    } catch (e) {
        throw new Error(`Gagal menghubungi syndication API: ${e.message}`);
    }

    if (status === 404) throw new Error('Tweet tidak ditemukan (mungkin dihapus / akun private)');
    if (status !== 200 || !data || typeof data !== 'object') {
        throw new Error(`Gagal ambil data tweet (HTTP ${status})`);
    }

    const photos = Array.isArray(data.photos)
        ? data.photos.filter(p => p?.url).map(p => ({ type: 'photo', url: p.url }))
        : [];

    const media = [...photos];

    if (data.video?.variants?.length) {
        const mp4s = data.video.variants.filter(v => v?.type === 'video/mp4' && v?.src);
        if (mp4s.length) {
            const best = mp4s.reduce((a, b) => (b.bitrate || 0) > (a.bitrate || 0) ? b : a);
            media.push({ type: 'video', url: best.src });
        }
    }

    if (!media.length) {
        throw new Error('Tidak ada foto/video yang bisa diambil dari tweet ini (mungkin format respons API berubah)');
    }

    return {
        text: data.text || '',
        user: data.user?.name || data.user?.screen_name || '',
        media,
    };
}

module.exports = { getTweetMedia, extractTweetId, getToken };
