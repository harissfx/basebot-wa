const config = require('../config');
const { formatUptime } = require('../utils/helper');

const handler = async (ctx) => {
    const { command, sock, isOwner, sender } = ctx;

    if (!isOwner) return ctx.reply({ text: '❌ Perintah ini khusus untuk Owner Bot!' });

    switch (command.name) {

        case 'ping': {
            const start = Date.now();
            const sent = await ctx.reply({ text: '🏓 Pong!' });
            await sock.sendMessage(sender, {
                text: `🏓 *Pong!*\n\n⏱️ Latency: *${Date.now() - start}ms*`,
                edit: sent.key
            });
            break;
        }

        case 'info': {
            const u = process.uptime();
            const h = Math.floor(u / 3600);
            const m = Math.floor((u % 3600) / 60);
            const s = Math.floor(u % 60);
            await ctx.send({ text: [
                '╔═══ *Bot Info* ═══╗',
                `║ 🤖 *Nama:* ${config.botName}`,
                `║ 👤 *Owner:* ${[].concat(config.ownerNumber).join(', ')}`,
                `║ ⚙️ *Prefix:* ${config.prefix}`,
                `║ 🔄 *Uptime:* ${h}j ${m}m ${s}d`,
                `║ 📦 *Node:* ${process.version}`,
                `║ 🖥️ *Platform:* ${process.platform}`,
                '╚════════════════════╝',
            ].join('\n') });
            break;
        }

    }
};

module.exports = handler;