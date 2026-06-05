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

module.exports = {
    JOKES,
    FORTUNES,
    QUOTES,
    FAKTA,
    TRUTH_LIST,
    DARE_LIST,
    ROAST_TEMPLATES,
    ZODIAK_DATA,
    ZODIAK_RAMALAN,
    KATA_LIST,
    DADU_JENIS
};