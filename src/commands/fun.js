const { delay } = require('../utils/helper');

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

const handler = async (ctx) => {
    const { command, sock, sender } = ctx;
    let max, answers, jokes, fortunes;

    switch (command.name) {

        case 'dice':
            await ctx.reply({ text: `🎲 Dadu: *${Math.floor(Math.random() * 6) + 1}*` });
            break;

        case 'coin':
            await ctx.reply({ text: `🪙 Hasil: *${Math.random() < 0.5 ? 'Kepala' : 'Ekor'}*` });
            break;

        case 'random':
            max = parseInt(command.args[0]) || 100;
            await ctx.reply({ text: `🔢 Random (1-${max}): *${Math.floor(Math.random() * max) + 1}*` });
            break;

        case '8ball':
            answers = [
                'Ya, pasti! ✅', 'Tidak, jelas tidak ❌', 'Mungkin saja 🤔',
                'Coba lagi nanti ⏳', 'Saya ragu-ragu 🤷', 'Sudah pasti! 💯',
                'Tanda-tanda menunjukkan ya 👍', 'Tidak mungkin 🚫',
            ];
            await ctx.reply({ text: `🎱 *8-Ball:*\n\n${pick(answers)}` });
            break;

        case 'joke':
            jokes = [
                'Kenapa programmer suka kopi?\nKarena tanpa kopi, mereka tidak bisa *compile* pikiran! ☕',
                'Apa bedanya bug dan fitur?\nDokumentasi! 📄',
                'Kenapa JavaScript developer tidak bisa tidur?\nKarena mereka selalu *await* sesuatu! 😴',
                'Apa yang dikatakan server ke client?\n"404: Joke not found" 🔍',
            ];
            await ctx.reply({ text: `😂 *Joke:*\n\n${pick(jokes)}` });
            break;

        case 'fortune':
            fortunes = [
                'Hari ini adalah hari keberuntunganmu! 🍀',
                'Kesabaran adalah kunci kesuksesanmu. 🔑',
                'Sebuah kejutan baik akan datang segera. 🎁',
                'Jangan takut mengambil risiko hari ini. 🚀',
                'Kreativitasmu akan membawa hasil besar. 🎨',
            ];
            await ctx.reply({ text: `🥠 *Fortune Cookie:*\n\n${pick(fortunes)}` });
            break;

        case 'typing':
            await sock.sendPresenceUpdate('composing', sender);
            await delay(2000);
            await sock.sendPresenceUpdate('paused', sender);
            await ctx.reply({ text: '⌨️ Ini contoh typing indicator!' });
            break;

    }
};

module.exports = handler;