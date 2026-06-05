# 🤖 WhatsApp Bot Base

Bot WhatsApp berbasis **Node.js** dan **Baileys** dengan sistem plugin otomatis, hot-reload tanpa restart, button interaktif, jadibot, dan struktur yang mudah dikembangkan.

> Dibuat oleh **Haris Sfx** — [GitHub](https://github.com/harissfx/basebot-wa)

---

## ✨ Fitur Unggulan

- 🔄 **Hot-reload otomatis** — edit file command, langsung aktif tanpa restart bot
- 🔌 **Plugin system** — tambah/hapus file command, otomatis terdaftar
- 🤖 **JadiBot** — kloning bot ke nomor lain via pairing code
- 🎛️ **Button interaktif** — quick reply, URL, call, copy, list/dropdown
- 🖼️ **Media lokal** — sistem `getImage()` untuk gambar lokal yang simpel
- 👑 **Multi-level owner** — Super Owner, Co-Owner, User
- 🔒 **Mode self/public** — bisa diubah via command tanpa restart
- 📡 **Auto join channel** — bot otomatis join channel WA saat connect
- 🛡️ **LID support** — handle sistem LID terbaru WhatsApp

---

## ⚙️ Prasyarat

- **Node.js** v18 atau lebih baru → [Download](https://nodejs.org)
- **npm** (sudah termasuk bersama Node.js)
- Akun **WhatsApp** aktif

---

## 🚀 Instalasi

```bash
# 1. Clone project
git clone https://github.com/harissfx/basebot-wa.git
cd basebot-wa

# 2. Install dependencies
npm install

# 3. Jalankan bot
node index.js
```

Saat pertama kali jalan, bot akan minta nomor HP:

```
📱 Masukkan Nomor WhatsApp: 628xxxxxxxxxx
```

Masukkan nomor format `628xxx` (tanpa `+`, spasi, atau strip). Bot akan tampilkan **Pairing Code** — masukkan di WhatsApp → **Linked Devices → Link with phone number**.

---

## 📁 Struktur Project

```
whatsapp-bot/
├── index.js                        # Entry point — koneksi Baileys, jadibot
├── package.json
├── lib/                            # Library utilitas eksternal
│   ├── ffmpeg.js                   # Helper konversi media (FFmpeg)
│   ├── ytdlp.js                    # Helper download YouTube/TikTok
│   ├── otp.js                      # Generator OTP
│   └── random.js                   # Fungsi random
├── src/
│   ├── config.js                   # ⚙️ Konfigurasi utama bot
│   ├── media/
│   │   └── logo.png                # Gambar default bot
│   ├── database/
│   │   ├── session/                # Sesi login bot utama (auto-generated)
│   │   └── jadibot/                # Sesi login clone bot (auto-generated)
│   ├── commands/                   # 📂 Semua file command di sini
│   │   ├── general.js              # menu, ping, owner, script
│   │   ├── sample.js               # Contoh button, list, poll, media
│   │   ├── downloader.js           # ytmp3, ytmp4, tiktok, instagram, dll
│   │   ├── media.js                # sticker, tourl, dll
│   │   ├── fun.js                  # dice, coin, 8ball, joke, dll
│   │   ├── tools.js                # cekno, cekchannel, setmode, dll
│   │   ├── owner.js                # Fitur khusus owner
│   │   ├── group.js                # Fitur grup (tagall, kick, promote, dll)
│   │   └── jadibot.js              # jadibot, listbot, stopbot
│   ├── handlers/
│   │   └── messageHandler.js       # Routing & parsing pesan masuk
│   └── utils/
│       ├── PluginLoader.js         # Sistem plugin & hot-reload
│       ├── helper.js               # Fungsi utilitas umum + getImage()
│       ├── interactiveHelper.js    # Builder pesan interaktif Baileys
│       └── fquoted.js              # Fake quoted message
```

---

## 🔧 Konfigurasi (`src/config.js`)

Edit langsung `src/config.js` — bot **otomatis reload** tanpa restart karena dipantau oleh PluginLoader.

```js
module.exports = {
    ownerName:  'Nama Owner',           // Nama yang tampil di menu
    botName:    'WhatsApp Bot',         // Nama bot
    footerTxt:  'Powered by Bot',       // Footer pesan interaktif
    prefix:     '!',                    // Awalan command: !menu, !ping, dll

    superOwner: '628xxxxxxxxxx',        // Super Owner — 1 nomor, akses penuh
    coOwner: [                          // Co-Owner — bisa lebih dari 1
        '628xxxxxxxxxx',
        // '628xxxxxxxxxx',
    ],

    botMode:    'public',               // 'public' = semua | 'self' = owner only
    autoRead:   true,                   // Auto centang biru
    autoTyping: true,                   // Tampilkan indikator mengetik
    authFolder: './src/database/session',

    channelId:  '',                     // ID channel WA untuk auto join
                                        // Format: '120363xxx@newsletter'
                                        // Kosongkan jika tidak dipakai
};
```

### Cara dapat Channel ID
Gunakan command `!cekchannel https://whatsapp.com/channel/xxxxx` — bot akan tampilkan ID-nya lengkap dengan tombol copy.

---

## ➕ Menambah Command Baru

Ada 2 cara — pilih sesuai selera:

### Cara 1 — Tambah `case` di file yang sudah ada

Buka salah satu file di `src/commands/`, tambah case baru di dalam `switch`:

```js
case 'halo':
    await m.reply({ text: `👋 Halo, ${m.pushname}!` });
    break;
```

Simpan file → bot **langsung reload otomatis** tanpa restart.

### Cara 2 — Buat file command baru

Buat file baru di `src/commands/namafile.js`:

```js
'use strict';

const config = require('../config');

const handler = async (m) => {
    const { command, pushname } = m;
    const p = config.prefix;

    switch (command.name) {
        case 'halo':
            await m.reply({ text: `👋 Halo, ${pushname}!` });
            break;

        case 'bye':
            await m.reply({ text: `👋 Sampai jumpa, ${pushname}!` });
            break;
    }
};

module.exports = handler;
```

Simpan file → PluginLoader **otomatis mendeteksi** file baru dan mendaftarkan semua command di dalamnya. Tidak perlu edit file lain sama sekali.

---

## 📦 Parameter `m` (Context Object)

Setiap handler menerima satu parameter `m` yang berisi semua info dan fungsi yang dibutuhkan command.

### Info Pengirim

| Property | Tipe | Keterangan |
|---|---|---|
| `m.sender` | `string` | JID pengirim (`628xxx@s.whatsapp.net` atau `xxx@lid`) |
| `m.senderNumber` | `string` | Nomor asli pengirim (`628xxxxxxxxxx`) |
| `m.pushname` | `string` | Nama WA pengirim |
| `m.isOwner` | `boolean` | Apakah pengirim owner (super atau co) |
| `m.isSuperOwner` | `boolean` | Apakah pengirim super owner |
| `m.isCoOwner` | `boolean` | Apakah pengirim co-owner |
| `m.isGroup` | `boolean` | Apakah pesan dari grup |
| `m.isMain` | `boolean` | Apakah dari bot utama (bukan clone) |

### Info Pesan

| Property | Tipe | Keterangan |
|---|---|---|
| `m.msg` | `object` | Objek pesan mentah dari Baileys |
| `m.text` | `string` | Teks pesan lengkap |
| `m.command.name` | `string` | Nama command yang dijalankan |
| `m.command.args` | `string[]` | Argumen command dalam array |
| `m.command.fullArgs` | `string` | Semua argumen dalam satu string |
| `m.command.hasPrefix` | `boolean` | Apakah command pakai prefix |
| `m.fakeOrder` | `object` | Fake quoted untuk tampilan pesan interaktif |

### Koneksi

| Property | Keterangan |
|---|---|
| `m.Hanz` | Objek socket Baileys — akses penuh ke semua method Baileys |

### Fungsi Kirim Pesan

| Fungsi | Keterangan |
|---|---|
| `m.reply(content)` | Kirim pesan dengan quoted ke pesan pengirim |
| `m.replyFake(content)` | Kirim pesan dengan fake quoted |
| `m.send(content)` | Kirim pesan tanpa quoted |
| `m.react(emoji)` | Kasih reaksi emoji ke pesan |
| `m.sendButtons(content)` | Kirim pesan dengan button lama |
| `m.sendList(content)` | Kirim pesan list/dropdown |
| `m.sendInteractive(content)` | Kirim pesan interaktif (button modern) |
| `m.sendButtonWithImage(content)` | Kirim button dengan gambar (via URL) |
| `m.sendInteractiveWithImage(content)` | Kirim button interaktif dengan gambar lokal/Buffer |

---

## 🎛️ Tipe Button Interaktif

Digunakan di `m.sendInteractive()` dan `m.sendInteractiveWithImage()`.

### `quick_reply` — Kirim pesan/command otomatis
```js
{ name: 'quick_reply', buttonParamsJson: JSON.stringify({
    display_text: 'Kembali ke Menu',
    id: 'menu'   // ← teks ini dikirim ke bot saat ditekan
})}
```

### `cta_url` — Buka URL
```js
{ name: 'cta_url', buttonParamsJson: JSON.stringify({
    display_text: 'Buka GitHub',
    url: 'https://github.com/harissfx'
})}
```

### `cta_call` — Telepon
```js
{ name: 'cta_call', buttonParamsJson: JSON.stringify({
    display_text: 'Hubungi Owner',
    phone_number: '628xxxxxxxxxx'
})}
```

### `cta_copy` — Copy teks
```js
{ name: 'cta_copy', buttonParamsJson: JSON.stringify({
    display_text: '📋 Copy Kode',
    copy_code: 'teks-yang-dicopy'
})}
```

### `single_select` — Dropdown/list pilihan
```js
{ name: 'single_select', buttonParamsJson: JSON.stringify({
    title: 'Pilih Menu',
    sections: [{
        title: 'Kategori 1',
        rows: [
            { title: 'Pilihan A', description: 'Deskripsi A', id: 'command-a' },
            { title: 'Pilihan B', description: 'Deskripsi B', id: 'command-b' },
        ]
    }]
})}
```

### Contoh lengkap `sendInteractive`
```js
await m.sendInteractive({
    text: 'Teks pesan',
    footer: 'Footer pesan',
    quoted: m.fakeOrder,     // atau m.msg untuk quoted ke pesan asli
    contextInfo: {
        mentionedJid: ['0@s.whatsapp.net'],
        forwardingScore: 111,
        isForwarded: true,
    },
    buttons: [
        { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: 'OK', id: 'ok' }) },
        { name: 'cta_url', buttonParamsJson: JSON.stringify({ display_text: 'Website', url: 'https://...' }) },
    ]
});
```

---

## 🖼️ Menggunakan Gambar Lokal (`getImage`)

Semua gambar disimpan di `src/media/`. Sistem `getImage()` mempermudah pemanggilan tanpa perlu path panjang.

### Menambah gambar baru

1. Taruh file gambar di `src/media/` (misal `banner.png`)
2. Daftarkan di `src/utils/helper.js` bagian `MEDIA`:

```js
const MEDIA = {
    logo:   path.join(__dirname, '../media/logo.png'),
    banner: path.join(__dirname, '../media/banner.png'), // ← tambah ini
};
```

### Menggunakan di command

```js
// Import di atas file command
const { getImage } = require('../utils/helper');

// Pakai di dalam case
case 'kirimgambar':
    await m.send({ image: getImage(),          caption: 'Ini logo' });   // default = logo
    await m.send({ image: getImage('banner'),  caption: 'Ini banner' }); // gambar lain
    break;

// Untuk sendInteractiveWithImage
case 'buttongambar':
    await m.sendInteractiveWithImage({
        imageSource: getImage(),   // Buffer langsung, tanpa ribet
        text: 'Teks pesan',
        buttons: [...]
    });
    break;
```

---

## 👑 Sistem Level Akses

| Level | Siapa | Akses |
|---|---|---|
| **Super Owner** | Nomor `superOwner` di config | Semua fitur termasuk jadibot & manage co-owner |
| **Co-Owner** | Nomor di array `coOwner` | Fitur owner biasa |
| **User** | Semua orang | Command publik saja |

### Cara cek di command
```js
// Hanya super owner
if (!m.isSuperOwner) return m.reply({ text: '❌ Khusus Super Owner!' });

// Hanya owner (super atau co)
if (!m.isOwner) return m.reply({ text: '❌ Khusus Owner!' });

// Hanya dari grup
if (!m.isGroup) return m.reply({ text: '❌ Command ini hanya untuk grup!' });

// Hanya dari bot utama (bukan clone jadibot)
if (!m.isMain) return m.reply({ text: '❌ Hanya bisa dari bot utama!' });
```

---

## 🔒 Mode Self / Public

Ubah via command — tidak perlu restart:

```
!setmode public   → semua orang bisa pakai bot
!setmode self     → hanya owner yang bisa pakai bot
!setmode          → lihat mode saat ini + tombol pilihan
```

Perubahan langsung aktif dan tersimpan ke `config.js` sehingga tetap berlaku setelah restart.

---

## 🤖 JadiBot (Clone Bot)

Fitur untuk menjalankan bot di nomor lain tanpa server tambahan.

| Command | Keterangan |
|---|---|
| `!jadibot 628xxx` | Buat clone bot di nomor tersebut |
| `!listbot` | Lihat daftar clone bot yang aktif |
| `!stopbot 628xxx` | Matikan clone bot |

Clone bot otomatis hidup kembali saat bot utama di-restart (via `autoLoadJadibot`).

---

## 🔄 Sistem Hot-Reload

PluginLoader memantau perubahan file secara otomatis menggunakan **chokidar**:

| Aksi | File | Efek |
|---|---|---|
| Edit file | `src/commands/*.js` | Reload command di file itu saja |
| Edit file | `src/utils/*.js`, `src/handlers/*.js`, `src/config.js` | Reload **semua** command |
| Edit file | `lib/*.js` | Reload **semua** command |
| Tambah file baru | `src/commands/` | Command baru otomatis terdaftar |
| Hapus file | `src/commands/` | Command otomatis terhapus dari daftar |

> ⚠️ Perubahan di `index.js` **tidak** hot-reload — butuh restart manual karena `index.js` adalah entry point koneksi Baileys.

---

## 🛠️ Fungsi Utilitas (`src/utils/helper.js`)

```js
const { 
    formatUptime,    // formatUptime(seconds) → '1 hari 2 jam 3 menit'
    formatJid,       // formatJid('08xx') → '628xx@s.whatsapp.net'
    formatGroupJid,  // formatGroupJid('xxx') → 'xxx@g.us'
    formatBytes,     // formatBytes(1024) → '1 KB'
    delay,           // await delay(3000) → tunggu 3 detik
    randomString,    // randomString(8) → 'aB3xKp9z'
    isGroupJid,      // isGroupJid(jid) → true/false
    getGroupInfo,    // await getGroupInfo(Hanz, jid) → metadata grup
    isGroupAdmin,    // await isGroupAdmin(Hanz, groupJid, userJid) → true/false
    getBotJid,       // getBotJid(Hanz) → JID bot sendiri
    getImage,        // getImage('logo') → Buffer gambar
} = require('../utils/helper');
```

---

## 📦 Dependencies

| Package | Kegunaan |
|---|---|
| `@whiskeysockets/baileys` | Library koneksi WhatsApp |
| `@hapi/boom` | HTTP error handling |
| `axios` | HTTP client (download gambar dari URL) |
| `chalk` | Warna teks di terminal |
| `chokidar` | Watch perubahan file (hot-reload) |
| `figlet` | Banner ASCII saat bot start |
| `fluent-ffmpeg` | Konversi media (sticker, audio, video) |
| `pino` | Logger Baileys |
| `sharp` | Proses gambar (resize, konversi) |
| `spinnies` | Animasi spinner di terminal |

---

## 🔄 Reset Sesi

Jika bot ter-logout atau bermasalah:

```bash
# Bot utama
rm -rf src/database/session

# Clone bot tertentu
rm -rf src/database/jadibot/628xxxxxxxxxx

# Semua clone bot
rm -rf src/database/jadibot

# Lalu restart
node index.js
```

---

## ⚠️ Disclaimer

Penggunaan bot WhatsApp di luar ketentuan resmi WhatsApp sepenuhnya menjadi tanggung jawab pengguna. Penulis tidak bertanggung jawab atas penyalahgunaan script ini.