const { delay } = require('../utils/helper');
const { getGroupInfo } = require('../utils/helper');
const config = require('../config');
const mess = require('../config').mess;
const plugins = require('../utils/PluginLoader');
const { getDevice } = require('baileys');
const { sendSlotGame } = require('../../lib/htmlrich/slotGame');
const { sendMatch3Game } = require('../../lib/htmlrich/match3Game');
const { sendBlockStackGame } = require('../../lib/htmlrich/blockStackGame');
const { sendFlappyGame } = require('../../lib/htmlrich/flappyGame');
const { sendBrickBreakerGame } = require('../../lib/htmlrich/brickBreakerGame');
const { sendSnakeGame } = require('../../lib/htmlrich/snakeGame');
const { sendRoomRaiderGame } = require('../../lib/htmlrich/roomRaiderGame');
const { send2048Game } = require('../../lib/htmlrich/game2048');
const { sendMemoryGame } = require('../../lib/htmlrich/memoryGame');
const { sendWordleGame } = require('../../lib/htmlrich/wordleGame');
const { sendWhackGame } = require('../../lib/htmlrich/whackGame');
const { sendDinoGame } = require('../../lib/htmlrich/dinoGame');
const { sendCrossyGame } = require('../../lib/htmlrich/crossyGame');
const { sendFruitSliceGame } = require('../../lib/htmlrich/fruitSliceGame');
const { sendSpaceShooterGame } = require('../../lib/htmlrich/spaceShooterGame');
const { sendLaneRunnerGame } = require('../../lib/htmlrich/laneRunnerGame');
const { sendFishingGame } = require('../../lib/htmlrich/fishingGame');
const { sendLavaCaveGame } = require('../../lib/htmlrich/lavaCaveGame');

const { pick } = require('../../lib/random');

const tebakAngkaGame = {};
const tebakKataGame  = {};

function hashStr(str) {
    let h = 5381;
    for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) >>> 0;
    return h;
}
function hariIniWIB() {
    return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
}
function barPersen(persen, panjang = 10) {
    const isi = Math.round((persen / 100) * panjang);
    return '█'.repeat(isi) + '░'.repeat(panjang - isi);
}

const { JOKES, FORTUNES, QUOTES, FAKTA, TRUTH_LIST, DARE_LIST,
        ROAST_TEMPLATES, ZODIAK_DATA, ZODIAK_RAMALAN, KATA_LIST, DADU_JENIS,
        KHODAM_LIST, KHODAM_KOMENTAR, KAPANKAH_WAKTU, SUIT_EMOJI, SUIT_MENANG_ATAS, SUIT_ALIAS }
        = require('../../lib/funData');

function buatSensorKata(kata, terungkap = []) {
    return kata.split('').map((c, i) => terungkap.includes(i) ? c : '_').join(' ');
}

const handler = async (m) => {
    const { command, isSuperOwner, Hanz, msg, senderNumber, pushname, isOwner, isGroup } = m;
    const p = m.prefix;
    const args = command.args;
    const nomorUser = senderNumber;
    let max, answers, metadata, members, targetMember;

    switch (command.name) {

        case 'funmenu': {
            const device = getDevice(msg.key.id);
            const funCmds = (plugins.commandsByFile()['fun'] || [])
            .filter(cmd => !['funmenu'].includes(cmd));
            const role = isSuperOwner ? 'Super Owner' : (isOwner ? 'Co-Owner' : 'User biasa');
            let menu = `┌─❖「 𝗜𝗡𝗙𝗢 𝗨𝗦𝗘𝗥 」
│● 𝘕𝘢𝘮𝘢: ${pushname}
│● 𝘕𝘰𝘮𝘰𝘳: ${nomorUser}
│● 𝘚𝘵𝘢𝘵𝘶𝘴: ${role}
│● 𝘗𝘦𝘳𝘢𝘯𝘨𝘬𝘢𝘵: ${device}
│
└┬❖ 
┌┤𝖧𝖺𝗒 𝗄𝖺𝗄 ${pushname} 👋
│└────────────┈ ⳹
│「 𝗙𝗨𝗡 𝗠𝗘𝗡𝗨 」
│
${funCmds.map(cmd => `│⪩ \`${p}${cmd}\``).join('\n')}
│
└────────────┈ ⳹`;
            await m.sendInteractive({
                text: menu,
                footer: config.footerTxt,
                quoted: m.fakePay,
                contextInfo: {
                    mentionedJid: ["0@s.whatsapp.net"],
                    forwardingScore: 111,
                    isForwarded: true
                },
                buttons: [
                    { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: 'Kembali ke Menu', id: 'menu' }) },
                    { name: 'single_select', buttonParamsJson: JSON.stringify({
                            title: '『 Simpel Menu 』',
                            sections: [{
                                title: '『 Simpel Menu 』',
                                highlight_label: "",
                                rows: [{ title: "General Menu", description: "Select to display general menu", id: "generalmenu" }]
                            }, {
                                highlight_label: "",
                                rows: [{ title: "Owner Menu", description: "Select to display owner menu", id: "ownermenu" }]
                            }, {
                                highlight_label: "",
                                rows: [{ title: "Ffmpeg Menu", description: "Select to display ffmpeg menu", id: "ffmpegmenu" }]
                            }, {
                                highlight_label: "",
                                rows: [{ title: "Downloader Menu", description: "Select to display downloader menu", id: "downloadmenu" }]
                            }, {
                                highlight_label: "",
                                rows: [{ title: "Tools Menu", description: "Select to display tools menu", id: "toolsmenu" }]
                            }, {
                                highlight_label: "Khusus Owner Utama",
                                rows: [{ title: "JadiBot Menu", description: "Select to display jadi bot menu", id: "jadibotmenu" }]
                            }, {
                                highlight_label: "",
                                rows: [{ title: "Fun Menu", description: "Select to display fun menu", id: "funmenu" }]
                            }, {
                                highlight_label: "",
                                rows: [{ title: "Group Menu", description: "Select to display group menu ", id: "groupmenu" }]
                            }, {
                                highlight_label: "",
                                rows: [{ title: "Extra Menu", description: "Select to display extra menu", id: "extramenu" }]
                            }]
                        })
                    }]
            });
        }
            break;

        case 'dice': {
            const jenis = args[0]?.toLowerCase();
            const sisi  = DADU_JENIS[jenis] || 6;
            const hasil = Math.floor(Math.random() * sisi) + 1;
            const label = jenis && DADU_JENIS[jenis] ? jenis.toUpperCase() : 'D6';
            await m.react('🎲');
            await delay(500);
            await m.reply({ text: `🎲 *Dadu ${label} (1-${sisi})*\n\nHasil: *${hasil}*\n\n_Ketik ${p}dice d4/d8/d10/d12/d20/d100 untuk dadu lain_` });
        }
            break;

        case 'coin': {
            const hasil = Math.random() < 0.5 ? 'Kepala 🦁' : 'Ekor 🔢';
            await m.react('🪙');
            await delay(500);
            await m.reply({ text: `🪙 *Lempar Koin*\n\nHasil: *${hasil}*` });
        }
            break;

        case 'random': {
            max = parseInt(args[0]) || 100;
            const min = parseInt(args[1]) || 1;
            const hasil = Math.floor(Math.random() * (max - min + 1)) + min;
            await m.reply({ text: `🔢 *Random Number*\n\nRentang: ${min} - ${max}\nHasil: *${hasil}*\n\n_Ketik ${p}random [max] [min] untuk rentang custom_` });
        }
            break;

        case '8ball': {
            answers = [
                'Ya, pasti! ✅', 'Tidak, jelas tidak ❌', 'Mungkin saja 🤔',
                'Coba lagi nanti ⏳', 'Saya ragu-ragu 🤷', 'Sudah pasti! 💯',
                'Tanda-tanda menunjukkan ya 👍', 'Tidak mungkin 🚫',
                'Tanyakan besok 📅', 'Semua tanda mengatakan YA! 🎯',
                'Jangan bergantung pada itu 😒', 'Prospeknya tidak bagus 😬',
                'Sangat meragukan 🙅', 'Ya, tanpa keraguan! 🙌',
                'Lebih baik tidak bilang sekarang 🤐',
            ];
            const pertanyaan = command.fullArgs || '???';
            await m.react('🎱');
            await delay(800);
            await m.reply({ text: `🎱 *Magic 8-Ball*\n\n❓ Pertanyaan: _${pertanyaan}_\n\n✨ Jawaban: *${pick(answers)}*` });
        }
            break;

        case 'joke': {
            await m.react('😂');
            await m.reply({ text: pick(JOKES) });
        }
            break;

        case 'fortune': {
            await m.react('🥠');
            await m.reply({ text: pick(FORTUNES) });
        }
            break;
        case 'slots':
        case 'slot': {
            await m.react('🎰');
            try {
                await sendSlotGame(Hanz, m.chat);
            } catch (err) {
                console.error('[slots]', err);
                await m.reply({ text: '❌ Gagal kirim slot game: ' + (err.message || err) });
            }
        }
            break;
        case 'match3':
        case 'gem':
        case 'gemmatch': {
            await m.react('💎');
            try {
                await sendMatch3Game(Hanz, m.chat);
            } catch (err) {
                console.error('[match3]', err);
                await m.reply({ text: '❌ Gagal kirim match3 game: ' + (err.message || err) });
            }
        }
            break;
        case 'blockstack':
        case 'tetris':
        case 'susunbalok': {
            await m.react('🧱');
            try {
                await sendBlockStackGame(Hanz, m.chat);
            } catch (err) {
                console.error('[blockstack]', err);
                await m.reply({ text: '❌ Gagal kirim block stack game: ' + (err.message || err) });
            }
        }
            break;
        case 'flappy':
        case 'burung':
        case 'flappyhop': {
            await m.react('🐦');
            try {
                await sendFlappyGame(Hanz, m.chat);
            } catch (err) {
                console.error('[flappy]', err);
                await m.reply({ text: '❌ Gagal kirim flappy game: ' + (err.message || err) });
            }
        }
            break;
        case 'breakout':
        case 'brickbreaker':
        case 'brick': {
            await m.react('🧱');
            try {
                await sendBrickBreakerGame(Hanz, m.chat);
            } catch (err) {
                console.error('[breakout]', err);
                await m.reply({ text: '❌ Gagal kirim brick breaker game: ' + (err.message || err) });
            }
        }
            break;
        case 'snake':
        case 'ular':
        case 'ularnaga': {
            await m.react('🐍');
            try {
                await sendSnakeGame(Hanz, m.chat);
            } catch (err) {
                console.error('[snake]', err);
                await m.reply({ text: '❌ Gagal kirim snake game: ' + (err.message || err) });
            }
        }
            break;
                case 'roomraider':
        case 'fps':
        case 'tembakan': {
            await m.react('🔫');
            try {
                await sendRoomRaiderGame(Hanz, m.chat);
            } catch (err) {
                console.error('[roomraider]', err);
                await m.reply({ text: '❌ Gagal kirim room raider game: ' + (err.message || err) });
            }
        }
            break;
        case '2048':
        case 'game2048': {
            await m.react('🔢');
            try {
                await send2048Game(Hanz, m.chat);
            } catch (err) {
                console.error('[2048]', err);
                await m.reply({ text: '❌ Gagal kirim game 2048: ' + (err.message || err) });
            }
        }
            break;
        case 'memory':
        case 'pasangan':
        case 'memorycard': {
            await m.react('🃏');
            try {
                await sendMemoryGame(Hanz, m.chat);
            } catch (err) {
                console.error('[memory]', err);
                await m.reply({ text: '❌ Gagal kirim game memory: ' + (err.message || err) });
            }
        }
            break;
        case 'wordle':
        case 'katle': {
            await m.react('🔤');
            try {
                await sendWordleGame(Hanz, m.chat);
            } catch (err) {
                console.error('[wordle]', err);
                await m.reply({ text: '❌ Gagal kirim game wordle: ' + (err.message || err) });
            }
        }
            break;
        case 'whack':
        case 'tikus':
        case 'pukultikus': {
            await m.react('🔨');
            try {
                await sendWhackGame(Hanz, m.chat);
            } catch (err) {
                console.error('[whack]', err);
                await m.reply({ text: '❌ Gagal kirim game pukul tikus: ' + (err.message || err) });
            }
        }
            break;
        case 'dino':
        case 'trex':
        case 'dinorun': {
            await m.react('🦖');
            try {
                await sendDinoGame(Hanz, m.chat);
            } catch (err) {
                console.error('[dino]', err);
                await m.reply({ text: '❌ Gagal kirim game dino: ' + (err.message || err) });
            }
        }
            break;
        case 'crossy':
        case 'seberang':
        case 'penyebrang':
        case 'crossyroad': {
            await m.react('🐔');
            try {
                await sendCrossyGame(Hanz, m.chat);
            } catch (err) {
                console.error('[crossy]', err);
                await m.reply({ text: '❌ Gagal kirim game penyebrang jalan: ' + (err.message || err) });
            }
        }
            break;
        case 'fruitslice':
        case 'tebasbuah':
        case 'fruitninja':
        case 'tebas': {
            await m.react('🍉');
            try {
                await sendFruitSliceGame(Hanz, m.chat);
            } catch (err) {
                console.error('[fruitslice]', err);
                await m.reply({ text: '❌ Gagal kirim game tebas buah: ' + (err.message || err) });
            }
        }
            break;
        case 'spaceshooter':
        case 'pesawat':
        case 'tembakpesawat':
        case 'shooter': {
            await m.react('🚀');
            try {
                await sendSpaceShooterGame(Hanz, m.chat);
            } catch (err) {
                console.error('[spaceshooter]', err);
                await m.reply({ text: '❌ Gagal kirim game pesawat tempur: ' + (err.message || err) });
            }
        }
            break;
        case 'lane':
        case 'lari3':
        case 'subway':
        case 'larijalur': {
            await m.react('🏃');
            try {
                await sendLaneRunnerGame(Hanz, m.chat);
            } catch (err) {
                console.error('[lanerunner]', err);
                await m.reply({ text: '❌ Gagal kirim game lari 3 jalur: ' + (err.message || err) });
            }
        }
            break;
        case 'pancing':
        case 'mancing':
        case 'fishing': {
            await m.react('🎣');
            try {
                await sendFishingGame(Hanz, m.chat);
            } catch (err) {
                console.error('[fishing]', err);
                await m.reply({ text: '❌ Gagal kirim game pancing ikan: ' + (err.message || err) });
            }
        }
            break;
        case 'gualava':
        case 'lavacave':
        case 'platformer':
        case 'petualang': {
            await m.react('🌋');
            try {
                await sendLavaCaveGame(Hanz, m.chat);
            } catch (err) {
                console.error('[gualava]', err);
                await m.reply({ text: '❌ Gagal kirim game gua lava: ' + (err.message || err) });
            }
        }
            break;
        case 'katabijak':
        case 'motivasi': {
            await m.react('💬');
            await m.reply({ text: pick(QUOTES) });
        }
            break;

        case 'fakta': {
            await m.react('🧠');
            await m.reply({ text: pick(FAKTA) });
        }
            break;

        case 'cekkhodam': {
            const nama = (command.fullArgs || '').trim().slice(0, 40) || pushname;
            const h = hashStr(`${nama.toLowerCase()}|${hariIniWIB()}`);
            const khodam = KHODAM_LIST[h % KHODAM_LIST.length];
            const power = (Math.floor(h / 7) % 100) + 1;
            const tier = power >= 75 ? 'tinggi' : power >= 40 ? 'sedang' : 'rendah';
            const daftarKomentar = KHODAM_KOMENTAR[tier];
            const komentar = daftarKomentar[Math.floor(h / 13) % daftarKomentar.length];
            await m.react('🔮');
            await delay(600);
            await m.reply({
                text: [
                    '🔮 *CEK KHODAM*', '',
                    `👤 Nama    : ${nama}`,
                    `👻 Khodam  : *${khodam}*`,
                    `⚡ Power   : ${barPersen(power)} ${power}%`, '',
                    `💬 ${komentar}`, '',
                    '_Hasil berlaku untuk hari ini, besok bisa beda._',
                ].join('\n')
            });
        }
            break;

        case 'cekjodoh': {
            const raw = (command.fullArgs || '').trim();
            const bagian = raw.split(/\s*(?:\||&|\bdan\b|\bx\b)\s*/i).map(s => s.trim()).filter(Boolean);
            if (!bagian.length) {
                return m.reply({
                    text: [
                        '💘 *Cek Kecocokan*', '',
                        `• \`${p}cekjodoh nama1|nama2\``,
                        `• \`${p}cekjodoh nama\` (dicocokkan dengan kamu)`,
                    ].join('\n')
                });
            }
            const a = (bagian.length > 1 ? bagian[0] : pushname).slice(0, 30);
            const b = (bagian.length > 1 ? bagian[1] : bagian[0]).slice(0, 30);
            const kunci = [a.toLowerCase(), b.toLowerCase()].sort().join('+');
            const persen = hashStr(kunci) % 101;
            const komentar =
                persen === 100 ? 'SEMPURNA! Ini sih bukan kebetulan, ini takdir 🔥' :
                persen >= 81 ? 'Fix jodoh! Mulai siapin undangan 💍' :
                persen >= 61 ? 'Cocok nih! Jangan digantung terus 😏' :
                persen >= 41 ? 'Lumayan! Tinggal modal komunikasi.' :
                persen >= 21 ? 'Masih jauh, tapi bukan mustahil. Perbanyak usaha!' :
                'Mending temenan dulu aja ya 😅';
            await m.react('💘');
            await delay(500);
            await m.reply({
                text: [
                    '💘 *CEK KECOCOKAN*', '',
                    `${a}  ❤️  ${b}`, '',
                    `${barPersen(persen)} *${persen}%*`, '',
                    `💬 ${komentar}`,
                ].join('\n')
            });
        }
            break;

        case 'kapankah': {
            const tanya = (command.fullArgs || '').trim().replace(/\?+$/, '').slice(0, 120);
            if (!tanya) {
                return m.reply({ text: `❓ Mau tanya apa?\nContoh: \`${p}kapankah aku kaya\`` });
            }
            await m.react('⏳');
            await delay(500);
            await m.reply({ text: `❓ *Kapankah ${tanya}?*\n\n⏳ ${pick(KAPANKAH_WAKTU)}` });
        }
            break;

        case 'suit': {
            const raw = (command.fullArgs || '').trim().toLowerCase();
            const pilihan = SUIT_EMOJI[raw] ? raw : (SUIT_ALIAS[raw] || null);
            if (!pilihan) {
                return m.reply({
                    text: [
                        '✊✌️✋ *SUIT vs BOT*', '',
                        `Pilih: \`${p}suit batu\`, \`${p}suit gunting\`, atau \`${p}suit kertas\``,
                        '_(boleh disingkat: b / g / k)_',
                    ].join('\n')
                });
            }
            const pilihanBot = pick(Object.keys(SUIT_EMOJI));
            const menang = SUIT_MENANG_ATAS[pilihan] === pilihanBot;
            const seri = pilihan === pilihanBot;
            await m.react(seri ? '🤝' : menang ? '🏆' : '💀');
            await m.reply({
                text: [
                    '✊✌️✋ *SUIT vs BOT*', '',
                    `Kamu : ${SUIT_EMOJI[pilihan]} ${pilihan}`,
                    `Bot  : ${SUIT_EMOJI[pilihanBot]} ${pilihanBot}`, '',
                    seri ? '🤝 *Seri!* Coba lagi, siapa tahu hoki.' :
                    menang ? `🏆 *Kamu menang, ${pushname}!* Bot-nya nangis di pojokan.` :
                    '💀 *Kamu kalah!* Bot lagi bahagia sekarang.',
                ].join('\n')
            });
        }
            break;

        case 'roast': {
            const target = command.fullArgs?.trim() || pushname;
            const roastFn = pick(ROAST_TEMPLATES);
            await m.react('🔥');
            await delay(500);
            await m.reply({ text: roastFn(target) });
        }
            break;

        case 'truth': {
            await m.react('🫣');
            await m.reply({ text: `🫣 *Truth untuk ${pushname}:*\n\n${pick(TRUTH_LIST)}\n\n_Jawab dengan jujur ya! Gak ada yang ngehakimin (mungkin) 😇_` });
        }
            break;

        case 'dare': {
            await m.react('😈');
            await m.reply({ text: `😈 *Dare untuk ${pushname}:*\n\n${pick(DARE_LIST)}\n\n_Berani gak? Ingat, sekali dare, harus dilakukan! 💪_` });
        }
            break;

        case 'tod': {
            const pilihan = Math.random() < 0.5 ? 'TRUTH' : 'DARE';
            const isi = pilihan === 'TRUTH' ? pick(TRUTH_LIST) : pick(DARE_LIST);
            const emoji = pilihan === 'TRUTH' ? '🫣' : '😈';
            await m.react(emoji);
            await m.reply({ text: `${emoji} *${pilihan} untuk ${pushname}:*\n\n${isi}\n\n_Kamu dapat ${pilihan}! ${pilihan === 'TRUTH' ? 'Jawab jujur ya!' : 'Harus dilakukan!'}_` });
        }
            break;

        case 'zodiak': {
            const inputZodiak = args[0]?.toLowerCase();
            if (!inputZodiak || !ZODIAK_DATA[inputZodiak]) {
                const daftarZodiak = Object.keys(ZODIAK_DATA).join(', ');
                return m.reply({ text: `🔮 *Ramalan Zodiak*\n\nKetik: ${p}zodiak [nama zodiak]\n\nZodiak tersedia:\n${daftarZodiak}\n\nContoh: ${p}zodiak aries` });
            }
            const { emoji, tanggal } = ZODIAK_DATA[inputZodiak];
            const ramalan = pick(ZODIAK_RAMALAN);
            const bintang = ['⭐', '⭐⭐', '⭐⭐⭐', '⭐⭐⭐⭐', '⭐⭐⭐⭐⭐'];
            await m.react('🔮');
            await m.reply({
                text: `🔮 *Ramalan ${inputZodiak.charAt(0).toUpperCase() + inputZodiak.slice(1)} Hari Ini*\n\n${emoji} Zodiak: *${inputZodiak.toUpperCase()}*\n📅 Tanggal: ${tanggal}\n\n✨ *Ramalan:*\n${ramalan}\n\n💫 Keberuntungan: ${pick(bintang)}\n💰 Keuangan: ${pick(bintang)}\n❤️ Asmara: ${pick(bintang)}\n🏥 Kesehatan: ${pick(bintang)}`
            });
        }
            break;

        case 'siapakah': {
            if (!isGroup) return m.reply(mess.group);
            const pertanyaanSiapa = command.fullArgs?.trim();
            if (!pertanyaanSiapa) return m.reply({ text: `❓ *Cara pakai:*\n${p}siapakah [pertanyaan]\n\nContoh: ${p}siapakah yang paling sering ghosting?` });

            metadata = await getGroupInfo(Hanz, m.chat);
            if (!metadata) return m.reply({ text: '❌ Gagal mengambil data grup.' });
            members = metadata.participants;
            targetMember = pick(members);
            const targetNum = targetMember.id.split('@')[0];

            await m.reply({
                text: `🎯 *Siapakah ${pertanyaanSiapa}?*\n\nBot telah memutar roda takdir...\n\n🎰 Dan jawabannya adalah... *@${targetNum}* ! 🎉\n\n_(disclaimer: ini random ya, jangan baper)_ 😂`,
                mentions: [targetMember.id]
            });
        }
            break;

        case 'ship': {
            const nama1 = args[0] || pushname;
            const nama2 = args[1] || 'Bot';
            let hash = 0;
            for (const c of (nama1 + nama2).toLowerCase()) hash += c.charCodeAt(0);
            const persentase = (hash * 37 + 13) % 101;
            let level, warna;
            if (persentase >= 80)      { level = 'PASANGAN SERASI BANGET! 🥰💞'; }
            else if (persentase >= 60) { level = 'Lumayan cocok! Ada harapan nih 😊'; }
            else if (persentase >= 40) { level = 'Biasa aja... perlu usaha lebih 😅'; }
            else if (persentase >= 20) { level = 'Hmm, kayaknya kurang nyambung deh 🤔'; }
            else                        { level = 'Aduh, jauh banget matchnya 💀'; }

            const bar = '█'.repeat(Math.floor(persentase / 10)) + '░'.repeat(10 - Math.floor(persentase / 10));
            await m.react('💘');
            await delay(500);
            await m.reply({
                text: `💘 *Ship Meter*\n\n💑 ${nama1} + ${nama2}\n\n[${bar}] ${persentase}%\n\n${level}\n\n_(hasil berdasarkan algoritma canggih bot — bisa dipercaya 100% — mungkin)_ 😂`
            });
        }
            break;

        case 'tebakangka': {
            const key = senderNumber;
            if (tebakAngkaGame[key]) {
                return m.reply({ text: `🎮 Kamu masih punya game aktif!\nKisaran: 1 - ${tebakAngkaGame[key].max}\nSisa percobaan: *${tebakAngkaGame[key].sisa}*\n\nTebak angkanya dengan ketik: ${p}tebak [angka]\nMenyerah? ketik: ${p}tebak serah` });
            }
            const maxTA = parseInt(args[0]) || 100;
            const angkaRahasia = Math.floor(Math.random() * maxTA) + 1;
            tebakAngkaGame[key] = { angka: angkaRahasia, max: maxTA, sisa: 7 };
            await m.react('🎯');
            await m.reply({ text: `🎯 *Tebak Angka Dimulai!*\n\nAku sudah pilih angka antara 1 - ${maxTA}\nKamu punya *7 kesempatan* untuk menebak!\n\nKetik: ${p}tebak [angka]\nMenyerah? ketik: ${p}tebak serah` });
        }
            break;

        case 'tebak': {
            const key = senderNumber;
            const game = tebakAngkaGame[key];
            if (!game) return m.reply({ text: `❌ Belum ada game aktif!\nMulai dengan: ${p}tebakangka` });

            if (args[0]?.toLowerCase() === 'serah') {
                const jawabanTA = game.angka;
                delete tebakAngkaGame[key];
                return m.reply({ text: `🏳️ Kamu menyerah!\nAngka yang benar adalah: *${jawabanTA}*\n\nMau coba lagi? ${p}tebakangka` });
            }

            const tebakanTA = parseInt(args[0]);
            if (isNaN(tebakanTA)) return m.reply({ text: `❓ Masukkan angka yang valid ya!\nContoh: ${p}tebak 50` });

            game.sisa--;
            if (tebakanTA === game.angka) {
                delete tebakAngkaGame[key];
                await m.react('🎉');
                return m.reply({ text: `🎉 *BENAR!* Kamu berhasil!\n\nAngkanya memang *${tebakanTA}*!\nSisa kesempatan: ${game.sisa}\n\nKeren banget! 🏆` });
            }

            if (game.sisa <= 0) {
                const jawabanTA = game.angka;
                delete tebakAngkaGame[key];
                await m.react('💀');
                return m.reply({ text: `💀 *Game Over!*\n\nKesempatan habis! Angka yang benar adalah *${jawabanTA}*.\nBermain lagi? ${p}tebakangka` });
            }

            const petunjuk = tebakanTA < game.angka
                ? `📈 Terlalu kecil! Coba yang lebih besar.`
                : `📉 Terlalu besar! Coba yang lebih kecil.`;
            await m.reply({ text: `${petunjuk}\n\nSisa kesempatan: *${game.sisa}*\nKetik: ${p}tebak [angka]` });
        }
            break;

        case 'tebakkata': {
            const keyK = senderNumber;
            if (tebakKataGame[keyK]) {
                const g = tebakKataGame[keyK];
                return m.reply({ text: `🔤 Kamu masih punya game aktif!\n\n${buatSensorKata(g.kata, g.terungkap)}\n\nHuruf sudah dicoba: ${g.dicoba.join(', ') || '-'}\nSisa nyawa: ${'❤️'.repeat(g.nyawa)}\n\nTebak huruf: ${p}huruf [huruf]\nTebak kata: ${p}jawab [kata]\nMenyerah: ${p}huruf serah` });
            }
            const soal = pick(KATA_LIST);
            tebakKataGame[senderNumber] = {
                kata: soal.kata,
                hint: soal.hint,
                terungkap: [],
                dicoba: [],
                nyawa: 6,
            };
            await m.react('🔤');
            await m.reply({ text: `🔤 *Tebak Kata Dimulai!*\n\n💡 Hint: ${soal.hint}\n\n${buatSensorKata(soal.kata, [])}\n\n❤️ Nyawa: 6\n\nTebak huruf: ${p}huruf [huruf]\nTebak langsung: ${p}jawab [kata]\nMenyerah: ${p}huruf serah` });
        }
            break;

        case 'huruf': {
            const keyH = senderNumber;
            const gH = tebakKataGame[keyH];
            if (!gH) return m.reply({ text: `❌ Belum ada game aktif!\nMulai dengan: ${p}tebakkata` });

            if (args[0]?.toLowerCase() === 'serah') {
                const jawabanH = gH.kata;
                delete tebakKataGame[keyH];
                return m.reply({ text: `🏳️ Kamu menyerah!\nKata yang benar: *${jawabanH}*\n\nMau coba lagi? ${p}tebakkata` });
            }

            const huruf = args[0]?.toUpperCase();
            if (!huruf || huruf.length !== 1 || !/[A-Z]/.test(huruf)) {
                return m.reply({ text: `❓ Masukkan satu huruf yang valid!\nContoh: ${p}huruf A` });
            }
            if (gH.dicoba.includes(huruf)) return m.reply({ text: `⚠️ Huruf *${huruf}* sudah pernah dicoba!` });

            gH.dicoba.push(huruf);
            const posisi = gH.kata.split('').map((c, i) => c === huruf ? i : -1).filter(i => i !== -1);

            if (posisi.length === 0) {
                gH.nyawa--;
                if (gH.nyawa <= 0) {
                    const jawaban = gH.kata;
                    delete tebakKataGame[keyH];
                    await m.react('💀');
                    return m.reply({ text: `💀 *Game Over!*\n\nHuruf *${huruf}* tidak ada!\nKata yang benar: *${jawaban}*\n\nBermain lagi? ${p}tebakkata` });
                }
                await m.react('❌');
                await m.reply({ text: `❌ Huruf *${huruf}* tidak ada!\n\n${buatSensorKata(gH.kata, gH.terungkap)}\nNyawa: ${'❤️'.repeat(gH.nyawa)}${'🖤'.repeat(6 - gH.nyawa)}\n\nHuruf dicoba: ${gH.dicoba.join(', ')}` });
            } else {
                posisi.forEach(i => { if (!gH.terungkap.includes(i)) gH.terungkap.push(i); });
                const selesai = gH.terungkap.length === gH.kata.length;
                if (selesai) {
                    delete tebakKataGame[keyH];
                    await m.react('🎉');
                    return m.reply({ text: `🎉 *BERHASIL!*\n\nKamu berhasil menebak kata: *${gH.kata}*!\n\nMau main lagi? ${p}tebakkata` });
                }
                await m.react('✅');
                await m.reply({ text: `✅ Huruf *${huruf}* ditemukan!\n\n${buatSensorKata(gH.kata, gH.terungkap)}\nNyawa: ${'❤️'.repeat(gH.nyawa)}${'🖤'.repeat(6 - gH.nyawa)}\n\nHuruf dicoba: ${gH.dicoba.join(', ')}` });
            }
        }
            break;

        case 'jawab': {
            const keyJ = senderNumber;
            const gJ = tebakKataGame[keyJ];
            if (!gJ) return m.reply({ text: `❌ Belum ada game tebak kata!\nMulai dengan: ${p}tebakkata` });
            const jawabanUser = command.fullArgs?.trim().toUpperCase();
            if (!jawabanUser) return m.reply({ text: `❓ Ketik kata yang kamu tebak!\nContoh: ${p}jawab KUCING` });

            if (jawabanUser === gJ.kata) {
                delete tebakKataGame[keyJ];
                await m.react('🏆');
                return m.reply({ text: `🏆 *LUAR BIASA!*\n\nKamu langsung tebak kata: *${gJ.kata}* dengan benar!\n\nMau main lagi? ${p}tebakkata` });
            } else {
                gJ.nyawa -= 2;
                if (gJ.nyawa <= 0) {
                    const jawaban = gJ.kata;
                    delete tebakKataGame[keyJ];
                    await m.react('💀');
                    return m.reply({ text: `💀 *Salah dan Game Over!*\n\nBukan *${jawabanUser}*!\nKata yang benar: *${jawaban}*\n\nBermain lagi? ${p}tebakkata` });
                }
                await m.react('❌');
                await m.reply({ text: `❌ Bukan *${jawabanUser}*! Nyawa berkurang 2.\n\n${buatSensorKata(gJ.kata, gJ.terungkap)}\nNyawa: ${'❤️'.repeat(Math.max(gJ.nyawa, 0))}${'🖤'.repeat(6 - Math.max(gJ.nyawa, 0))}\n\nTerus tebak huruf: ${p}huruf [huruf]` });
            }
        }
            break;

        case 'pilih': {
            const opsiPilih = command.fullArgs?.split(/[,|\/]/).map(s => s.trim()).filter(Boolean);
            if (!opsiPilih || opsiPilih.length < 2) {
                return m.reply({ text: `🎯 *Cara pakai:*\n${p}pilih [opsi1] / [opsi2] / [opsi3]\n\nContoh: ${p}pilih makan / tidur / ngoding` });
            }
            const pilihanBot = pick(opsiPilih);
            await m.react('🎯');
            await m.reply({ text: `🎯 *Bot Pilihkan Untukmu!*\n\nOpsi: ${opsiPilih.map((o, i) => `\n${i + 1}. ${o}`).join('')}\n\n✨ Bot memilih: *${pilihanBot}*\n\n_Keputusan bot adalah final... atau tidak, terserah kamu_ 😂` });
        }
            break;

        case 'baper': {
            const namaBaper = command.fullArgs?.trim() || 'Kamu';
            const baperList = [
                `Semoga ${namaBaper} selalu sehat dan bahagia, meski aku gak ada di sisinya... 🥺`,
                `${namaBaper} mungkin lagi ketawa sekarang, dan aku... juga ketawa. Tapi hati ini nangis. 😭`,
                `Kamu gak harus balasnya, ${namaBaper}. Tapi tolong jangan matiin read receipt. 🙏`,
                `Ada gak sih obat untuk perasaan yang dipendam? Nanya buat temen — temennya aku. 🫠`,
                `${namaBaper} mungkin gak sadar, tapi setiap notif dari dia bikin jantung skip beat. 💓`,
            ];
            await m.react('🥺');
            await m.reply({ text: pick(baperList) });
        }
            break;

        case 'ultah': {
            const tglStr = args[0];
            if (!tglStr || !/^\d{2}-\d{2}-\d{4}$/.test(tglStr)) {
                return m.reply({ text: `🎂 *Cara pakai:*\n${p}ultah [DD-MM-YYYY]\n\nContoh: ${p}ultah 17-08-1990` });
            }
            const [dd, mm, yyyy] = tglStr.split('-').map(Number);
            const lahir = new Date(yyyy, mm - 1, dd);
            const sekarang = new Date();
            let umur = sekarang.getFullYear() - lahir.getFullYear();
            const ultahTahunIni = new Date(sekarang.getFullYear(), mm - 1, dd);
            const sudahUltah = sekarang >= ultahTahunIni;
            if (!sudahUltah) umur--;
            const hariBerikutnya = sudahUltah
                ? new Date(sekarang.getFullYear() + 1, mm - 1, dd)
                : ultahTahunIni;
            const selisihMs = hariBerikutnya - sekarang;
            const sisa = Math.ceil(selisihMs / (1000 * 60 * 60 * 24));
            const detikHidup = Math.floor((sekarang - lahir) / 1000);

            await m.react('🎂');
            await m.reply({
                text: `🎂 *Info Ulang Tahun*\n\n📅 Tanggal lahir: ${dd}/${mm}/${yyyy}\n🎉 Umur sekarang: *${umur} tahun*\n⏳ Ulang tahun berikutnya: *${sisa} hari lagi*\n💓 Sudah hidup selama: *${detikHidup.toLocaleString()} detik*\n\n${umur < 20 ? '🌱 Masih muda! Nikmati masa mudamu!' : umur < 30 ? '🔥 Quarter life? Gaskeun!' : umur < 40 ? '✨ Mapan dan berpengalaman!' : '👑 Legend sejati!'}`
            });
        }
            break;
    }
};

module.exports = handler;