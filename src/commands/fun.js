const { delay } = require('../utils/helper');
const { getGroupInfo } = require('../utils/helper');
const config = require('../config');
const plugins = require('../utils/PluginLoader');
const { getDevice } = require('@whiskeysockets/baileys');
const { pick } = require('../../lib/random');

// ══════════════════════════════════════════════════════
//  STATE — tebak angka & tebak kata (in-memory per user)
// ══════════════════════════════════════════════════════
const tebakAngkaGame = {};   // key: senderNumber
const tebakKataGame  = {};   // key: senderNumber

// ══════════════════════════════════════════════════════
//  DATA
// ══════════════════════════════════════════════════════
const JOKES = [
    '😂 *Joke Hari Ini:*\n\nKenapa programmer suka kopi?\nKarena tanpa kopi, mereka tidak bisa *compile* pikiran! ☕',
    '😂 *Joke Hari Ini:*\n\nApa bedanya bug dan fitur?\nDokumentasi! 📄',
    '😂 *Joke Hari Ini:*\n\nKenapa JavaScript developer tidak bisa tidur?\nKarena mereka selalu *await* sesuatu! 😴',
    '😂 *Joke Hari Ini:*\n\nApa yang dikatakan server ke client?\n"404: Joke not found" 🔍',
    '😂 *Joke Hari Ini:*\n\nSuami: "Sayang, kenapa kamu nangis?"\nIstri: "Aku nonton film sedih"\nSuami: "Film apa?"\nIstri: "Saldo ATM kita" 😭',
    '😂 *Joke Hari Ini:*\n\nGuru: "Siapa yang bisa jawab, berapa 0 + 0?"\nSiswa: "Nol pak"\nGuru: "Betul! Kaya rekening kamu"\n*seluruh kelas terdiam* 💀',
    '😂 *Joke Hari Ini:*\n\nDiet itu gampang, tinggal stop makan.\nSaya sudah stop... stop dietnya. 🍔',
    '😂 *Joke Hari Ini:*\n\nKata orang: "Hidup itu singkat, nikmati saja"\nKata tagihan: "Halo, kami hadir lagi" 📃',
    '😂 *Joke Hari Ini:*\n\nTeman: "Lo udah move on dari mantan?"\nGue: "Udah dong"\nNotifikasi WhatsApp: *[Mantan baru saja online]*\nGue: 👀',
    '😂 *Joke Hari Ini:*\n\nApa perbedaan WhatsApp dan istri?\nWhatsApp bisa di-mute. 🔕',
    '😂 *Joke Hari Ini:*\n\nKenapa Thanos jentikkan jarinya?\nKarena dia gak mampu bayar tagihan listrik yang mahal kalau setengah alam semesta masih hidup. 💡',
    '😂 *Joke Hari Ini:*\n\n"Besok diet mulai ya"\n*besoknya*\n"Besok mulainya" 🔄',
];

const FORTUNES = [
    '🥠 *Fortune Cookie:*\n\nHari ini adalah hari keberuntunganmu! Tapi keberuntungan itu perlu dijemput, bukan ditunggu sambil rebahan. 🍀',
    '🥠 *Fortune Cookie:*\n\nKesabaran adalah kunci kesuksesanmu. Tapi jangan lupa, kunci itu perlu dicari dulu. 🔑',
    '🥠 *Fortune Cookie:*\n\nSebuah kejutan baik akan datang segera. Kalau belum datang, sabar — mungkin macet di jalan. 🎁',
    '🥠 *Fortune Cookie:*\n\nJangan takut mengambil risiko hari ini. Tapi pakai helm dulu ya. 🚀',
    '🥠 *Fortune Cookie:*\n\nKreativitasmu akan membawa hasil besar. Tapi bayar listrik dulu sebelum berkarya. 🎨',
    '🥠 *Fortune Cookie:*\n\nOrang yang kamu pikirkan sekarang... juga lagi scroll hp dan gak balas pesanmu. 📱',
    '🥠 *Fortune Cookie:*\n\nRezekimu datang dari arah yang tidak kamu duga. Cek dompet tembok juga ya. 💸',
    '🥠 *Fortune Cookie:*\n\nHari ini kamu akan bertemu orang penting. Mungkin tukang parkir, mungkin manajer bank, siapa tahu. 🤝',
    '🥠 *Fortune Cookie:*\n\nJangan lupa makan dan minum. Otak gak bisa jalan kalau perutnya demo. 🍱',
    '🥠 *Fortune Cookie:*\n\nSesuatu yang kamu cari sudah ada di depan mata. Mungkin kacamatamu nyangkut di kepala lagi. 👓',
];

const QUOTES = [
    '💬 *Quote of the Day:*\n\n"Hidup adalah perjalanan, bukan tujuan."\n— Seseorang yang belum pernah macet di tol 🚗',
    '💬 *Quote of the Day:*\n\n"Jatuh tujuh kali, bangkit delapan kali."\n— Orang yang belum pernah dengar tulang patah 🦴',
    '💬 *Quote of the Day:*\n\n"Mimpi setinggi bintang."\n— Pastikan WiFi-mu kuat untuk mencapainya 📡',
    '💬 *Quote of the Day:*\n\n"Kegagalan adalah awal dari kesuksesan."\n— Investor yang porto-nya minus 80% 📉',
    '💬 *Quote of the Day:*\n\n"Waktu adalah uang."\n— Kenapa kamu masih baca ini? Kerja sana! ⏰',
    '💬 *Quote of the Day:*\n\n"Jangan tunda pekerjaan sampai besok."\n— Aku tulis ini besoknya 📝',
    '💬 *Quote of the Day:*\n\n"Senyum adalah senjata terkuat."\n— Belum pernah coba ngomong sama debt collector 😬',
    '💬 *Quote of the Day:*\n\n"Hidup terlalu pendek untuk bersedih."\n— Tapi cukup panjang untuk menyesal tidak investasi Bitcoin tahun 2012 🤦',
    '💬 *Quote of the Day:*\n\n"Percayalah pada prosesnya."\n— BPJS Kesehatan, mungkin 🏥',
    '💬 *Quote of the Day:*\n\n"Kesuksesan bukan milik orang pintar, tapi milik orang yang tidak menyerah."\n— Semangat! Aku juga masih ngopi sambil nulis ini ☕',
];

const FAKTA = [
    '🧠 *Fakta Random:*\n\nSemut bisa mengangkat beban 50 kali berat tubuhnya. Tapi tetap aja kalah sama manusia yang bisa angkat utang 1000 kali gaji bulanannya.',
    '🧠 *Fakta Random:*\n\nOtak manusia menghasilkan listrik yang cukup untuk menyalakan lampu 25 watt. Sayangnya, tidak bisa dipakai untuk cas HP.',
    '🧠 *Fakta Random:*\n\nKucing tidur rata-rata 16 jam sehari. Katanya sih healing, tapi sebenarnya itu job description mereka.',
    '🧠 *Fakta Random:*\n\nBanana secara teknis adalah buah beri, tapi stroberi bukan. Dunia itu memang gak adil.',
    '🧠 *Fakta Random:*\n\nOktopus punya 3 jantung dan 9 otak. Masih lebih banyak dari orang yang kerja sambil pakai 3 monitor.',
    '🧠 *Fakta Random:*\n\nRata-rata orang menghabiskan 6 bulan hidupnya hanya untuk menunggu lampu merah. Cukup untuk belajar bahasa baru — tapi ya gitu deh.',
    '🧠 *Fakta Random:*\n\nAir laut menutupi 71% bumi, tapi manusia baru mengeksplorasi sekitar 5%-nya. Sisanya mungkin ada yang jual akun Netflix di sana.',
    '🧠 *Fakta Random:*\n\nTempat yang paling kotor di rumah bukan toilet, tapi... keyboard komputermu. Selamat makan siang! 🍱',
    '🧠 *Fakta Random:*\n\nBebek bisa tidur dengan satu mata terbuka untuk menjaga lingkungan. Fitur ini belum tersedia di mantan kamu.',
    '🧠 *Fakta Random:*\n\nGajah adalah satu-satunya hewan yang tidak bisa melompat. Tapi rekening tabungannya mungkin tetap lebih besar dari kita.',
];

const TRUTH_LIST = [
    'Siapa orang yang paling sering kamu stalk di media sosial? 👀',
    'Pernah pura-pura gak baca pesan padahal centang biru? 📱',
    'Apa hal paling memalukan yang pernah kamu lakukan di depan umum? 😳',
    'Berapa lama waktu terakhir kamu mandi? (jujur ya) 🚿',
    'Pernah bohong soal umur? Berapa yang diklaim vs aslinya? 🎂',
    'Siapa yang paling sering kamu ghosting? 👻',
    'Kalau bisa hapus satu pesan yang udah terkirim, pesan ke siapa? 🗑️',
    'Apa hal yang kamu sembunyikan dari orang tua? 🤫',
    'Terakhir kali nangis karena apa? 😢',
    'Pernah pinjam barang teman dan "lupa" ngembaliin? 😬',
    'Kalau HP kamu bisa dibaca semua orang, yang paling takut ketahuan apa? 📲',
    'Apa kebohongan terbesar yang pernah kamu bilang ke teman? 🤥',
];

const DARE_LIST = [
    'Ketik "Aku suka kamu" ke kontak pertama di HP kamu, tanpa penjelasan! 😈',
    'Ganti nama display-mu jadi nama konyol selama 1 jam! 🤡',
    'Kirim voice note menyanyi lagu anak-anak ke grup ini! 🎤',
    'Foto selfie dengan ekspresi paling norak, kirimin ke sini! 📸',
    'Ceritain mimpi paling aneh yang pernah kamu alami ke grup ini! 💤',
    'Kirim pesan "Halo kak sayang" ke kontak random dari daftar kontakmu! 😂',
    'Tulis status WA: "Aku lagi main Truth or Dare dan malu banget" selama 10 menit! 📝',
    'Sebut 3 hal aneh yang ada di kamarmu sekarang! 🚪',
    'Lakukan 10 push-up sekarang dan kirim buktinya! 💪',
    'Hubungi teman lama yang sudah lama tidak kontak, bilang "kangen" tanpa konteks! 📞',
    'Posting foto jadul yang bikin kamu malu di status WA! 🖼️',
    'Ceritakan crush pertamamu secara detail! ❤️',
];

const ROAST_TEMPLATES = [
    (name) => `🔥 *Roast untuk ${name}:*\n\nKalau IQ ${name} adalah suhu, lemari es pun bakal bilang "brrr". Tapi tenang, di dunia ini semua ada gunanya — termasuk contoh negatif. Semangat ya! 😂`,
    (name) => `🔥 *Roast untuk ${name}:*\n\n${name} itu unik banget. Dari sekian miliar orang di bumi, cuma ${name} yang bisa salah arah di jalan satu arah. GPS pun udah menyerah. 🗺️`,
    (name) => `🔥 *Roast untuk ${name}:*\n\nKata orang, wajah adalah cermin jiwa. Tapi kalau lihat ${name}... kayaknya cerminnya retak. Bercanda ya! Aslinya sih ${name} itu... *loading...* 😂`,
    (name) => `🔥 *Roast untuk ${name}:*\n\n${name} itu rajin banget — rajin update status, rajin stalking orang, rajin minta wifi password. Yang kurang cuma rajin kerja. 💀`,
    (name) => `🔥 *Roast untuk ${name}:*\n\nKalau kepintaran ${name} dijual per gram, harganya lebih murah dari garam. Dan garam lagi diskon di Indomaret. 😂`,
    (name) => `🔥 *Roast untuk ${name}:*\n\n${name} bilang mau diet dari kemarin. Tapi kalau diet itu olahraga, ${name} udah juara dunia "olahraga wacana". 🏆`,
    (name) => `🔥 *Roast untuk ${name}:*\n\nIlmu pengetahuan bilang kita pakai 10% otak. ${name} udah buktikan itu bisa ditekan jadi 5%. Efisiensi! 🧠`,
];

const ZODIAK_DATA = {
    aries:       { emoji: '♈', tanggal: '21 Mar - 19 Apr' },
    taurus:      { emoji: '♉', tanggal: '20 Apr - 20 Mei' },
    gemini:      { emoji: '♊', tanggal: '21 Mei - 20 Jun' },
    cancer:      { emoji: '♋', tanggal: '21 Jun - 22 Jul' },
    leo:         { emoji: '♌', tanggal: '23 Jul - 22 Agt' },
    virgo:       { emoji: '♍', tanggal: '23 Agt - 22 Sep' },
    libra:       { emoji: '♎', tanggal: '23 Sep - 22 Okt' },
    scorpio:     { emoji: '♏', tanggal: '23 Okt - 21 Nov' },
    sagitarius:  { emoji: '♐', tanggal: '22 Nov - 21 Des' },
    capricorn:   { emoji: '♑', tanggal: '22 Des - 19 Jan' },
    aquarius:    { emoji: '♒', tanggal: '20 Jan - 18 Feb' },
    pisces:      { emoji: '♓', tanggal: '19 Feb - 20 Mar' },
};

const ZODIAK_RAMALAN = [
    'Hari ini bintangmu bersinar terang! Cuma sayang bintang gak bisa bayar tagihan. 💸',
    'Energi positif mengelilingimu. Tapi sinyal HP kamu kayaknya 1 bar terus. 📶',
    'Kesempatan emas datang hari ini. Mungkin ketemu parkir gratis? 🅿️',
    'Seseorang sedang memikirkanmu. Semoga bukan debt collector. 😅',
    'Kamu lebih kuat dari yang kamu kira! Tapi tetap minum vitamin ya. 💊',
    'Hari ini cocok untuk memulai sesuatu yang baru. Termasuk diet yang sudah ditunda 3 tahun. 🥗',
    'Rezekimu lancar hari ini. Coba cek saldo dulu — siapa tahu ada transfer nyasar. 🏦',
    'Jaga kesehatan! Tidur yang cukup, makan teratur, dan kurangi doom-scrolling. 📱',
    'Ada kejutan menyenangkan menantimu. Semoga bukan tagihan kartu kredit. 📩',
    'Kreativitasmu sedang di puncak! Saatnya bikin konten atau bayar hutang. Pilih sendiri. 🎨',
];

const KATA_LIST = [
    { kata: 'KUCING', hint: 'Hewan peliharaan yang suka tidur dan mengeong 🐱' },
    { kata: 'NASI', hint: 'Makanan pokok orang Indonesia yang tanpanya belum makan namanya 🍚' },
    { kata: 'PANTAI', hint: 'Tempat wisata dengan pasir dan ombak, foto di sini selalu bagus 🏖️' },
    { kata: 'BUKU', hint: 'Benda yang banyak dibeli tapi jarang dibaca 📚' },
    { kata: 'KOPI', hint: 'Minuman yang bikin developer bisa kerja, tapi bukan sulap ☕' },
    { kata: 'MOBIL', hint: 'Kendaraan roda empat yang sering macet di Jakarta 🚗' },
    { kata: 'HUJAN', hint: 'Turun dari langit, bikin ngantuk, tapi gak dibayar 🌧️' },
    { kata: 'PIZZA', hint: 'Makanan bulat yang dipotong segitiga, dimakan di kotak persegi 🍕' },
    { kata: 'GITAR', hint: 'Alat musik petik yang sering dibeli pemula tapi akhirnya jadi gantungan baju 🎸' },
    { kata: 'TIDUR', hint: 'Aktivitas favorit manusia tapi selalu gak cukup waktunya 😴' },
    { kata: 'LAPTOP', hint: 'Alat kerja yang juga dipakai nonton drakor dan scrolling 💻' },
    { kata: 'MAKAN', hint: 'Kegiatan yang selalu bikin mood membaik apapun masalahnya 🍽️' },
    { kata: 'POHON', hint: 'Makhluk hijau yang berdiri bertahun-tahun tanpa ngeluh 🌳' },
    { kata: 'BOLA', hint: 'Benda bulat yang dikejar-kejar 22 orang di lapangan besar ⚽' },
    { kata: 'BULAN', hint: 'Yang malam-malam ada di langit dan selalu difoto pasangan 🌙' },
];

const DADU_JENIS = { d4: 4, d6: 6, d8: 8, d10: 10, d12: 12, d20: 20, d100: 100 };

// ══════════════════════════════════════════════════════
//  HELPER
// ══════════════════════════════════════════════════════
function buatSensorKata(kata, terungkap = []) {
    return kata.split('').map((c, i) => terungkap.includes(i) ? c : '_').join(' ');
}

// ══════════════════════════════════════════════════════
//  HANDLER
// ══════════════════════════════════════════════════════
const handler = async (m) => {
    const { command, isSuperOwner, Hanz, sender, msg, senderNumber, pushname, isOwner, isGroup } = m;
    const p = config.prefix;
    const args = command.args;
    const nomorUser = senderNumber;
    let max, answers, metadata, members, targetMember;

    switch (command.name) {

        // ══════════════════════════════════════════════════════
        //  FUNMENU
        // ══════════════════════════════════════════════════════
        case 'funmenu': {
            const device = getDevice(msg.key.id);
            const funCmds = plugins.commandsByFile()['fun'] || [];
            const role = isSuperOwner ? 'Super Owner' : (isOwner ? 'Co-Owner' : 'User');
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
│${funCmds.map(cmd => `│⪩ \`${p}${cmd}\``).join('\n')}
│
└────────────┈ ⳹`;
            await m.sendInteractive({
                text: menu,
                footer: config.footerTxt,
                quoted: m.fakeOrder,
                contextInfo: {
                    mentionedJid: ["0@s.whatsapp.net"],
                    forwardingScore: 111,
                    isForwarded: true
                },
                buttons: [
                    { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: 'Kembali ke Menu', id: 'menu' }) },
                    {
                        name: 'single_select', buttonParamsJson: JSON.stringify({
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
                                rows: [{ title: "Group Menu", description: "Select to display group menu ", id: "groupmenu" }]
                            }]
                        })
                    }]
            });
            break;
        }

        // ══════════════════════════════════════════════════════
        //  KLASIK (upgrade)
        // ══════════════════════════════════════════════════════

        case 'dice': {
            const jenis = args[0]?.toLowerCase();
            const sisi  = DADU_JENIS[jenis] || 6;
            const hasil = Math.floor(Math.random() * sisi) + 1;
            const label = jenis && DADU_JENIS[jenis] ? jenis.toUpperCase() : 'D6';
            await m.react('🎲');
            await delay(500);
            await m.reply({ text: `🎲 *Dadu ${label} (1-${sisi})*\n\nHasil: *${hasil}*\n\n_Ketik ${p}dice d4/d8/d10/d12/d20/d100 untuk dadu lain_` });
            break;
        }

        case 'coin': {
            const hasil = Math.random() < 0.5 ? 'Kepala 🦁' : 'Ekor 🔢';
            await m.react('🪙');
            await delay(500);
            await m.reply({ text: `🪙 *Lempar Koin*\n\nHasil: *${hasil}*` });
            break;
        }

        case 'random': {
            max = parseInt(args[0]) || 100;
            const min = parseInt(args[1]) || 1;
            const hasil = Math.floor(Math.random() * (max - min + 1)) + min;
            await m.reply({ text: `🔢 *Random Number*\n\nRentang: ${min} - ${max}\nHasil: *${hasil}*\n\n_Ketik ${p}random [max] [min] untuk rentang custom_` });
            break;
        }

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
            break;
        }

        case 'joke': {
            await m.react('😂');
            await m.reply({ text: pick(JOKES) });
            break;
        }

        case 'fortune': {
            await m.react('🥠');
            await m.reply({ text: pick(FORTUNES) });
            break;
        }

        case 'typing': {
            await Hanz.sendPresenceUpdate('composing', sender);
            await delay(2000);
            await Hanz.sendPresenceUpdate('paused', sender);
            await m.reply({ text: '⌨️ Ini contoh typing indicator!' });
            break;
        }

        // ══════════════════════════════════════════════════════
        //  BARU: QUOTE ABSURD
        // ══════════════════════════════════════════════════════
        case 'quote': {
            await m.react('💬');
            await m.reply({ text: pick(QUOTES) });
            break;
        }

        // ══════════════════════════════════════════════════════
        //  BARU: FAKTA RANDOM
        // ══════════════════════════════════════════════════════
        case 'fakta': {
            await m.react('🧠');
            await m.reply({ text: pick(FAKTA) });
            break;
        }

        // ══════════════════════════════════════════════════════
        //  BARU: ROAST
        // ══════════════════════════════════════════════════════
        case 'roast': {
            const target = command.fullArgs?.trim() || pushname;
            const roastFn = pick(ROAST_TEMPLATES);
            await m.react('🔥');
            await delay(500);
            await m.reply({ text: roastFn(target) });
            break;
        }

        // ══════════════════════════════════════════════════════
        //  BARU: TRUTH OR DARE
        // ══════════════════════════════════════════════════════
        case 'truth': {
            await m.react('🫣');
            await m.reply({ text: `🫣 *Truth untuk ${pushname}:*\n\n${pick(TRUTH_LIST)}\n\n_Jawab dengan jujur ya! Gak ada yang ngehakimin (mungkin) 😇_` });
            break;
        }

        case 'dare': {
            await m.react('😈');
            await m.reply({ text: `😈 *Dare untuk ${pushname}:*\n\n${pick(DARE_LIST)}\n\n_Berani gak? Ingat, sekali dare, harus dilakukan! 💪_` });
            break;
        }

        case 'tod': {
            const pilihan = Math.random() < 0.5 ? 'TRUTH' : 'DARE';
            const isi = pilihan === 'TRUTH' ? pick(TRUTH_LIST) : pick(DARE_LIST);
            const emoji = pilihan === 'TRUTH' ? '🫣' : '😈';
            await m.react(emoji);
            await m.reply({ text: `${emoji} *${pilihan} untuk ${pushname}:*\n\n${isi}\n\n_Kamu dapat ${pilihan}! ${pilihan === 'TRUTH' ? 'Jawab jujur ya!' : 'Harus dilakukan!'}_` });
            break;
        }

        // ══════════════════════════════════════════════════════
        //  BARU: ZODIAK
        // ══════════════════════════════════════════════════════
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
            break;
        }

        // ══════════════════════════════════════════════════════
        //  BARU: SIAPAKAH (khusus grup)
        // ══════════════════════════════════════════════════════
        case 'siapakah': {
            if (!isGroup) return m.reply({ text: '❌ Perintah ini hanya bisa dipakai di grup!' });
            const pertanyaanSiapa = command.fullArgs?.trim();
            if (!pertanyaanSiapa) return m.reply({ text: `❓ *Cara pakai:*\n${p}siapakah [pertanyaan]\n\nContoh: ${p}siapakah yang paling sering ghosting?` });

            metadata = await getGroupInfo(Hanz, sender);
            if (!metadata) return m.reply({ text: '❌ Gagal mengambil data grup.' });
            members = metadata.participants;
            targetMember = pick(members);
            const targetNum = targetMember.id.split('@')[0];

            await m.reply({
                text: `🎯 *Siapakah ${pertanyaanSiapa}?*\n\nBot telah memutar roda takdir...\n\n🎰 Dan jawabannya adalah... *@${targetNum}* ! 🎉\n\n_(disclaimer: ini random ya, jangan baper)_ 😂`,
                mentions: [targetMember.id]
            });
            break;
        }

        // ══════════════════════════════════════════════════════
        //  BARU: SHIP (cocokan dua orang)
        // ══════════════════════════════════════════════════════
        case 'ship': {
            const nama1 = args[0] || pushname;
            const nama2 = args[1] || 'Bot';
            // Deterministic tapi terasa random: hash dua nama
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
            break;
        }

        // ══════════════════════════════════════════════════════
        //  BARU: TEBAK ANGKA
        // ══════════════════════════════════════════════════════
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
            break;
        }

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
            break;
        }

        // ══════════════════════════════════════════════════════
        //  BARU: TEBAK KATA
        // ══════════════════════════════════════════════════════
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
            break;
        }

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
            break;
        }

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
            break;
        }

        // ══════════════════════════════════════════════════════
        //  BARU: PILIHKAN (bot pilihkan)
        // ══════════════════════════════════════════════════════
        case 'pilih': {
            const opsiPilih = command.fullArgs?.split(/[,|\/]/).map(s => s.trim()).filter(Boolean);
            if (!opsiPilih || opsiPilih.length < 2) {
                return m.reply({ text: `🎯 *Cara pakai:*\n${p}pilih [opsi1] / [opsi2] / [opsi3]\n\nContoh: ${p}pilih makan / tidur / ngoding` });
            }
            const pilihanBot = pick(opsiPilih);
            await m.react('🎯');
            await m.reply({ text: `🎯 *Bot Pilihkan Untukmu!*\n\nOpsi: ${opsiPilih.map((o, i) => `\n${i + 1}. ${o}`).join('')}\n\n✨ Bot memilih: *${pilihanBot}*\n\n_Keputusan bot adalah final... atau tidak, terserah kamu_ 😂` });
            break;
        }

        // ══════════════════════════════════════════════════════
        //  BARU: BAPER GENERATOR
        // ══════════════════════════════════════════════════════
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
            break;
        }

        // ══════════════════════════════════════════════════════
        //  BARU: HITUNG UMUR BAPER
        // ══════════════════════════════════════════════════════
        case 'ultah': {
            const tglStr = args[0]; // format: DD-MM-YYYY
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
            break;
        }
    }
};

module.exports = handler;