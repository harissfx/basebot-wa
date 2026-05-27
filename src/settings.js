// ============================================================
//                     PENGATURAN BOT
//  Edit file ini sesuai kebutuhan, lalu simpan (Ctrl+S)
//  Bot akan otomatis reload jika dijalankan dengan: npm run dev
// ============================================================

require('dotenv').config();

module.exports = {
    // Nama bot
    botName: process.env.BOT_NAME || 'WhatsApp Bot',

    // Prefix command (contoh: !help, .menu, /info)
    prefix: process.env.BOT_PREFIX || '!',

    // Nomor owner bot (format: 628xxxxxxxxxx, tanpa + atau spasi)
    ownerNumber: process.env.OWNER_NUMBER || '628123456789',

    // Mode bot: 'public' → semua orang | 'self' → hanya owner
    botMode: process.env.BOT_MODE || 'public',

    // Otomatis centang biru pesan yang masuk
    autoRead: process.env.AUTO_READ === 'true',

    // Tampilkan indikator "mengetik..." saat membalas
    autoTyping: process.env.AUTO_TYPING === 'true',

    // Folder penyimpanan sesi login
    authFolder: process.env.AUTH_FOLDER || 'session',

    // Environment
    nodeEnv: process.env.NODE_ENV || 'development',
};
