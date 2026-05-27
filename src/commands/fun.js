const { delay } = require('../utils/helper');

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

const funCommands = {
    dice: async (ctx) => {
        await ctx.reply({ text: `🎲 Dadu: *${Math.floor(Math.random() * 6) + 1}*` });
    },

    coin: async (ctx) => {
        await ctx.reply({ text: `🪙 Hasil: *${Math.random() < 0.5 ? 'Kepala' : 'Ekor'}*` });
    },

    random: async (ctx) => {
        const max = parseInt(ctx.command.args[0]) || 100;
        await ctx.reply({ text: `🔢 Random (1-${max}): *${Math.floor(Math.random() * max) + 1}*` });
    },

    '8ball': async (ctx) => {
        const answers = [
            'Ya, pasti! ✅', 'Tidak, jelas tidak ❌', 'Mungkin saja 🤔',
            'Coba lagi nanti ⏳', 'Saya ragu-ragu 🤷', 'Sudah pasti! 💯',
            'Lebih baik tidak memberitahumu sekarang 🤫', 'Tanda-tanda menunjukkan ya 👍',
            'Tidak mungkin 🚫', 'Fokus dan tanyakan lagi 🎯',
        ];
        await ctx.reply({ text: `🎱 *8-Ball:*\n\n${pick(answers)}` });
    },

    joke: async (ctx) => {
        const jokes = [
            'Kenapa programmer suka kopi?\nKarena tanpa kopi, mereka tidak bisa *compile* pikiran! ☕',
            'Apa bedanya bug dan fitur?\nDokumentasi! 📄',
            'Kenapa JavaScript developer tidak bisa tidur?\nKarena mereka selalu *await* sesuatu! 😴',
            'Apa yang dikatakan server ke client?\n"404: Joke not found" 🔍',
            'Kenapa Python tidak bisa berkencan?\nKarena dia terlalu *indent*! 🐍',
        ];
        await ctx.reply({ text: `😂 *Joke:*\n\n${pick(jokes)}` });
    },

    fortune: async (ctx) => {
        const fortunes = [
            'Hari ini adalah hari keberuntunganmu! 🍀',
            'Kesabaran adalah kunci kesuksesanmu. 🔑',
            'Sebuah kejutan baik akan datang segera. 🎁',
            'Jangan takut mengambil risiko hari ini. 🚀',
            'Seseorang spesial sedang memikirkanmu. 💭',
            'Waktunya untuk istirahat dan recharge. 🔋',
            'Kreativitasmu akan membawa hasil besar. 🎨',
            'Kebaikan yang kamu lakukan akan kembali padamu. ❤️',
        ];
        await ctx.reply({ text: `🥠 *Fortune Cookie:*\n\n${pick(fortunes)}` });
    },

    typing: async (ctx) => {
        await ctx.sock.sendPresenceUpdate('composing', ctx.sender);
        await delay(2000);
        await ctx.sock.sendPresenceUpdate('paused', ctx.sender);
        await ctx.reply({ text: '⌨️ Ini contoh typing indicator!' });
    },
};

module.exports = funCommands;
