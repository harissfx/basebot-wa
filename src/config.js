module.exports = {
  ownerName: "Hanz Ofc", // nama pemilik bot, muncul di beberapa menu
  botName: "WhatsApp Bot", // nama bot, muncul di menu dan info
  footerTxt: "Powered by ẉHanzOfc.com", // tulisan kecil di bagian bawah pesan bot

  prefix: "!", // tanda di depan command, contoh: !menu (maks 5 karakter, tanpa spasi)
  noPrefix: true, // true: command jalan pakai prefix ATAU tanpa prefix | false: wajib pakai prefix

  superOwner: "6289999999999", // HANYA 1 nomor. Akses penuh + bisa atur co-owner. Format 62xxx tanpa + dan spasi
  coOwner: ["6289999999999" /* '6289999999999', */], // boleh banyak nomor, dipisah koma. Akses owner biasa (tanpa menu settings)

  botMode: "public", // 'public': semua orang boleh pakai bot | 'self': hanya owner yang dilayani

  quoteStyle: "pay", // tampilan pesan yang di-quote bot: 'pay' (struk pembayaran), 'meta' (kontak Meta AI), 'status' (sticker pack)

  menuStyle: 1, // 1=list+gambar, 2=product+list kategori

  autoRead: true, // true: pesan masuk otomatis dicentang biru | false: dibiarkan belum dibaca
  autoTyping: true, // true: bot tampil "mengetik..." dulu sebelum balas chat pribadi | false: langsung balas
  noSelfSync: false, // true: pesan bot tidak di-sync ke device lain akun bot | false: normal

  usePairingCode: true, // true: login pakai kode pairing (8 digit) | false: login pakai scan QR code
  authFolder: "./src/database/session", // folder penyimpanan data login WhatsApp. Hapus folder ini kalau mau scan QR / pairing ulang
  channelId: "120363185570235320@newsletter", // ID channel/saluran WhatsApp buat label "diteruskan dari". Kosongkan ('') kalau tidak dipakai

  githubRepo: "harissfx/basebot-wa", // format: 'username/nama-repo', dipakai command !checkupdate buat cek versi terbaru di GitHub

  // ── Jadwal sholat (tampil di spinner terminal) ───────────────────────────────────────────────
  prayer: {
    enabled: true, // false = matikan pengingat sholat di spinner
    city: "Surabaya", // ganti sesuai kota (contoh: Surabaya, Bandung, Medan, Makassar)
    country: "Indonesia",
    method: 20, // 20 = Kementerian Agama RI | 11 = Malaysia | 3 = Muslim World League
    remindMinutes: 15, // muncul di spinner hanya jika sisa ≤ menit ini
  },

  // ── Teks balasan guard ───────────────────────────────────────────────────────────────────────
  mess: {
    superOwner: "❌ Khusus Super Owner!",
    owner: "❌ Khusus Owner / Co-Owner.",
    coOwner: "❌ Khusus Co-Owner.",
    group: "❌ Command ini hanya untuk grup.",
    private: "❌ Command ini hanya bisa dipakai di chat pribadi.",
    admin: "❌ Kamu bukan admin grup.",
    botAdmin: "❌ Bot bukan admin grup.",
    ownerOrAdmin: "❌ Khusus Owner / Admin grup.",
    mainBotOnly:
      "❌ Fitur ini hanya bisa dipakai lewat *Bot Utama*, bukan clone bot!",
    error: "❌ Terjadi kesalahan saat menjalankan perintah.",
    wait: "⏳ Tunggu sebentar...",
  },
};
