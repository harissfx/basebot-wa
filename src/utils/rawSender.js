const { proto, generateWAMessageFromContent, isJidGroup } = require('baileys');

function reviveBinary(v) {
    if (Array.isArray(v)) return v.map(reviveBinary);
    if (v && typeof v === 'object') {
        if (Buffer.isBuffer(v) || v instanceof Uint8Array) return v;
        if (v.type === 'Buffer' && Array.isArray(v.data)) return Buffer.from(v.data);
        const out = {};
        for (const k of Object.keys(v)) out[k] = reviveBinary(v[k]);
        return out;
    }
    return v;
}

function unwrap(msg) {
    return msg?.viewOnceMessage?.message
        || msg?.viewOnceMessageV2?.message
        || msg?.viewOnceMessageV2Extension?.message
        || msg?.ephemeralMessage?.message
        || msg?.documentWithCaptionMessage?.message
        || msg;
}

function nativeFlowNodes(jid) {
    const nodes = [{
        tag: 'biz',
        attrs: {},
        content: [{
            tag: 'interactive',
            attrs: { type: 'native_flow', v: '1' },
            content: [{ tag: 'native_flow', attrs: { v: '9', name: 'mixed' } }]
        }]
    }];
    if (!isJidGroup(jid)) nodes.push({ tag: 'bot', attrs: { biz_bot: '1' } });
    return nodes;
}

async function sendRawMessage(Hanz, jid, content, options = {}) {
    let raw = content && content.message && typeof content.message === 'object' ? content.message : content;
    if (!raw || typeof raw !== 'object') throw new Error('sendRaw: isi pesan harus berupa objek');

    raw = reviveBinary(raw);

    if (raw.interactiveMessage && !raw.viewOnceMessage) {
        raw = {
            viewOnceMessage: {
                message: {
                    messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2 },
                    interactiveMessage: raw.interactiveMessage
                }
            }
        };
    }

    const waMsg = generateWAMessageFromContent(jid, proto.Message.fromObject(raw), {
        userJid: Hanz.user?.id,
        quoted: options.quoted
    });

    let additionalNodes = options.additionalNodes;
    if (!additionalNodes && unwrap(raw)?.interactiveMessage?.nativeFlowMessage) {
        additionalNodes = nativeFlowNodes(jid);
    }

    await Hanz.relayMessage(jid, waMsg.message, {
        messageId: waMsg.key.id,
        ...(additionalNodes ? { additionalNodes } : {})
    });
    return waMsg;
}

module.exports = { sendRawMessage, reviveBinary };