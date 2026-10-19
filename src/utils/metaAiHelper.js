'use strict';

const { getMetaAiMediaItems, fetchMetaAiImage, cleanMetaAiText } = require('baileys');

async function replyMetaAi(m, label, reply) {
    const text = cleanMetaAiText(reply?.text);
    const caption = text ? `*${label}:*\n\n${text}` : `*${label}*`;
    let sent = 0;

    for (const url of (reply?.images || []).slice(0, 4)) {
        try {
            await m.reply({ image: { url }, caption: sent ? '' : caption });
            sent++;
        } catch {
        }
    }

    if (!sent && reply?.unified) {
        for (const item of getMetaAiMediaItems(reply.unified).slice(0, 4)) {
            try {
                const img = await fetchMetaAiImage(item);
                await m.reply({ image: img.buffer, caption: sent ? '' : caption });
                sent++;
                } catch {
            }
        }
    }

    if (!sent) {
        await m.reply({
            text: text ? caption : `*${label}:*\n\n_(Meta AI membalas tanpa teks/gambar yang bisa dibaca)_`
        });
    }
    return sent;
}

module.exports = { replyMetaAi };