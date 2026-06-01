const config = require('../config');
const { formatUptime } = require('../utils/helper');

const handler = async (ctx) => {
    const { command, sock, isOwner, sender } = ctx;

    if (!isOwner) return ctx.reply({ text: '❌ Perintah ini khusus untuk Owner Bot!' });

    switch (command.name) {

      

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