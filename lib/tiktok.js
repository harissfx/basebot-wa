'use strict';

const axios = require('axios');

/**
 * Download TikTok video/audio via TikWM API
 * @param {string} url - TikTok URL
 * @returns {Promise<object>}
 */
async function Tiktok(url) {
    if (!url || typeof url !== 'string') {
        throw new Error('URL TikTok tidak valid');
    }

    url = url.trim().split('?')[0];

    try {
        const { data } = await axios.post(
            'https://tikwm.com/api/',
            new URLSearchParams({ url, hd: '1' }),
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                },
                timeout: 30000,
            }
        );

        if (data.code !== 0 || !data.data) {
            throw new Error(data.msg || 'Gagal mengambil data TikTok');
        }

        const d = data.data;

        return {
            title: d.title || d.desc || 'TikTok Video',
            author: d.author?.nickname || d.author?.unique_id || 'Unknown',
            nowm: d.play || d.hdplay || null,
            watermark: d.wmplay || null,
            audio: d.music || null,
            thumbnail: d.cover || d.origin_cover || null,
            duration: d.duration || 0,
        };
    } catch (err) {
        if (err.response) {
            throw new Error(`API Error: ${err.response.status}`);
        }
        throw new Error(err.message || 'Gagal koneksi ke TikWM');
    }
}

module.exports = { Tiktok };
