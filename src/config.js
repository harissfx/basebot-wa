// ============================================================
//                     PENGATURAN BOT
//  Edit langsung di sini, simpan (Ctrl+S)
//  Bot akan otomatis reload tanpa restart
// ============================================================

module.exports = {
    //Nama owner
    ownerName: 'Haris s',

    // Nama bot
    botName: 'WhatsApp Bot',

    footerTxt: 'Powered by ẉHarisSyc.com',
    
    // Prefix command (contoh: ! . /)
    prefix: '!',

    // Nomor owner (format: 628xxxxxxxxxx, tanpa + atau spasi)
    ownerNumber: ['6287855060868', '6285124014109'],
    
    // Mode bot: 'public' → semua orang | 'self' → hanya owner
    botMode: 'public',

    // Otomatis centang biru pesan yang masuk
    autoRead: true,

    // Tampilkan indikator "mengetik..." saat membalas
    autoTyping: true,

    // Folder penyimpanan sesi login
    authFolder: './src/database/session',
};