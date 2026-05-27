# 🤖 WhatsApp Bot Base

Bot WhatsApp berbasis **Node.js** dan **Baileys** dengan dukungan Button Interaktif, List Menu, Media, Poll, dan fitur Group Admin.

---

## 📋 Fitur

| Kategori | Command |
|---|---|
| 📋 **General** | `menu`, `ping`, `info`, `owner` |
| 🎛️ **Interactive** | `button`, `list`, `interactive`, `poll`, `location`, `contact` |
| 🖼️ **Media** | `media`, `medialokal`, `buttonimage`, `buttoncall` |
| 💬 **Message** | `quoted`, `teruskan` |
| 👥 **Group Admin** | `tagall`, `hidetag`, `groupinfo`, `kick`, `add`, `promote`, `demote`, `setsubject`, `setdesc`, `link`, `revoke` |
| 😄 **Fun** | `dice`, `coin`, `random`, `8ball`, `joke`, `fortune`, `typing` |

> Semua command bisa dipanggil **dengan prefix** (contoh: `!menu`) atau **tanpa prefix** (contoh: `menu`).

---

## ⚙️ Prasyarat

- **Node.js** v18 atau lebih baru → [Download](https://nodejs.org)
- **npm** (sudah termasuk bersama Node.js)
- Akun **WhatsApp** aktif

---

## 🚀 Instalasi & Menjalankan Bot

### 1. Clone atau download project

```bash
git clone https://github.com/username/whatsapp-bot.git
cd whatsapp-bot
```

### 2. Install dependencies

```bash
npm install
```

### 3. Konfigurasi

Salin file contoh environment:

```bash
cp .env.example .env
```

Edit file `.env` sesuai kebutuhan:

```env
BOT_NAME=WhatsApp Bot
BOT_PREFIX=!
OWNER_NUMBER=628123456789
BOT_MODE=public
AUTO_READ=false
AUTO_TYPING=false
AUTH_FOLDER=session
```

> **Atau** langsung edit `src/settings.js` tanpa menggunakan `.env`.

### 4. Jalankan bot

```bash
# Mode production
npm start

# Mode development (auto-reload saat ada perubahan kode)
npm run dev
```

### 5. Pairing WhatsApp

Saat pertama kali dijalankan, bot akan meminta nomor HP:

```
📱 Nomor WhatsApp: 628123456789
```

Masukkan nomor dalam format `628xxxxxxxxxx` (tanpa `+`, spasi, atau strip).

Bot akan menampilkan **Pairing Code**:

```
╔═══════════════════════════════════════════╗
║  🔢 PAIRING CODE: XXXX-XXXX              ║
╠═══════════════════════════════════════════╣
║  Buka WA → Settings → Linked Devices     ║
║  → Link with phone number → masukkan kode║
╚═══════════════════════════════════════════╝
```

Setelah berhasil, bot siap digunakan.

---

## 📁 Struktur Project

```
whatsapp-bot/
├── src/
│   ├── app.js                  # Entry point, koneksi Baileys
│   ├── settings.js             # Konfigurasi utama bot
│   ├── handlers/
│   │   └── messageHandler.js   # Routing & parsing pesan masuk
│   ├── commands/
│   │   ├── general.js          # Command umum (menu, ping, info)
│   │   ├── interactive.js      # Button, list, media
│   │   ├── admin.js            # Fitur group admin
│   │   └── fun.js              # Game & hiburan
│   └── utils/
│       ├── helper.js           # Fungsi utilitas umum
│       └── interactiveHelper.js# Builder pesan interaktif Baileys
├── assets/
│   └── logo.png                # Gambar default medialokal
├── session/                    # File sesi login (auto-generated)
├── .env.example                # Contoh konfigurasi environment
├── .gitignore
├── nodemon.json
└── package.json
```

---

## 🔧 Konfigurasi Lengkap

| Key | Default | Keterangan |
|---|---|---|
| `BOT_NAME` | `WhatsApp Bot` | Nama bot yang tampil di menu |
| `BOT_PREFIX` | `!` | Awalan command (contoh: `!menu`) |
| `OWNER_NUMBER` | — | Nomor owner format `628xxx` |
| `BOT_MODE` | `public` | `public` = semua bisa, `self` = hanya owner |
| `AUTO_READ` | `false` | Otomatis centang biru pesan masuk |
| `AUTO_TYPING` | `false` | Tampilkan indikator mengetik |
| `AUTH_FOLDER` | `session` | Folder penyimpanan sesi |

---

## ➕ Menambah Command Baru

Buat fungsi baru di salah satu file di `src/commands/`, atau buat file baru:

```js
// src/commands/custom.js
const customCommands = {
    halo: async (ctx) => {
        await ctx.reply({ text: '👋 Halo juga!' });
    },
};

module.exports = customCommands;
```

Lalu daftarkan di `src/handlers/messageHandler.js`:

```js
const customCommands = require('../commands/custom');

const commands = {
    ...generalCommands,
    ...customCommands, // tambahkan di sini
    ...
};
```

---

## 🔄 Reset Sesi

Jika bot ter-logout atau bermasalah, hapus folder sesi lalu restart:

```bash
rm -rf session
npm start
```

---

## 📦 Dependencies

| Package | Keterangan |
|---|---|
| `@whiskeysockets/baileys` | Library koneksi WhatsApp |
| `@hapi/boom` | HTTP error handling |
| `axios` | HTTP client (untuk button dengan gambar) |
| `dotenv` | Membaca konfigurasi dari file `.env` |
| `pino` | Logger |
| `nodemon` *(dev)* | Auto-reload saat development |

---

## ⚠️ Disclaimer

Project ini dibuat untuk keperluan **edukasi dan personal**. Penggunaan bot WhatsApp di luar ketentuan resmi WhatsApp sepenuhnya menjadi tanggung jawab pengguna.
