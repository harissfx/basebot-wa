# WhatsApp Bot Base

Bot WhatsApp berbasis **Node.js** dan **Baileys** dengan sistem plugin otomatis, hot-reload tanpa restart, pesan interaktif, game HTML, kontrol IoT lewat MQTT, dan **JadiBot** (clone bot) dengan pengaturan terpisah per clone.

> Dibuat oleh **Haris Sync** — [GitHub](https://github.com/harissfx/basebot-wa)

---

## Fitur Unggulan

- **Hot-reload otomatis** — edit file command, langsung aktif tanpa restart bot
- **Plugin system** — tambah/hapus file command, otomatis terdaftar (**440+ command** bawaan)
- **JadiBot** — kloning bot ke nomor lain via pairing code, hidup lagi otomatis saat bot utama restart
- **Setting per clone** — prefix, mode, gaya menu, auto-read, dll disimpan terpisah untuk tiap clone
- **Log berlabel** — tiap baris log menandai asal pesan: bot utama atau clone yang mana
- **Pesan interaktif** — quick reply, URL, call, copy, list/dropdown, product, poll, event
- **Game HTML** — slot, 2048, snake, wordle, flappy, dino, dan lainnya (`lib/htmlrich/`)
- **Meta AI** — chat dan generate gambar lewat `!metaai` / `!imagine`
- **Downloader** — YouTube, TikTok, Instagram, Facebook, Twitter/X, Spotify, Apple Music, SoundCloud, Pinterest, Threads, MediaFire, GitHub
- **Kontrol IoT** — relay dan LED via MQTT (HiveMQ dan sejenisnya)
- **Multi-level owner** — Super Owner, Co-Owner, User
- **Mode self/public** — bisa diubah via command tanpa restart
- **Login pairing code atau QR** — pilih lewat `usePairingCode` di config
- **LID support** — handle sistem LID terbaru WhatsApp
- **Anti-spam cooldown** — jeda 5 detik per command per chat
- **Anti-duplikat pesan** — pesan dengan id sama tidak diproses dua kali
- **Welcome/Goodbye, Antilink, AFK** — fitur grup bawaan
- **Database pesan & sticker command** — simpan pesan/media (`addmsg`, `save`) dan jadikan sticker sebagai pemicu command (`setcmd`)
- **Cek update** — `!checkupdate` membandingkan dengan repo GitHub

---

## Prasyarat

- **Node.js** v18 atau lebih baru → [Download](https://nodejs.org)
- **npm** (sudah termasuk bersama Node.js)
- Akun **WhatsApp** aktif
- **FFmpeg** sudah ikut lewat `@ffmpeg-installer/ffmpeg`, tidak perlu install manual

---

## Instalasi

```bash
# 1. Clone project
git clone https://github.com/harissfx/basebot-wa.git
cd basebot-wa

# 2. Install dependencies
npm install

# 3. Atur nomor owner di src/config.js (superOwner, coOwner)

# 4. Jalankan bot
npm start
```

Saat pertama kali jalan dengan `usePairingCode: true`, bot akan minta nomor HP:

```
📱 Masukkan Nomor WhatsApp: 628xxxxxxxxxx
```

Masukkan nomor format `628xxx` (tanpa `+`, spasi, atau strip). Bot menampilkan **Pairing Code** — masukkan di WhatsApp → **Linked Devices → Link with phone number**.

Kalau `usePairingCode: false`, bot menampilkan **QR code** di terminal. Scan lewat **Linked Devices → Link a Device**.

Setelah terhubung, bot menampilkan status seperti ini:

```
STATUS: Bot Utama Berhasil Terhubung!
 • ID/No       : Nama Bot
 • Prefix      : ! (bisa tanpa prefix)
 • Mode        : Public (semua bisa pakai)
 • Auto Read   : Aktif
 • Auto Typing : Aktif
 • Super Owner : 628xxxxxxxxxx
 • Co-Owner    : 1 nomor
 • Grup Aktif  : 3 grup
 • Commands    : 440 fitur aktif
```

---

## 📁 Struktur Project

```
whatsapp-bot/
├── index.js                        # Entry point — koneksi Baileys, jadibot, autoload clone
├── package.json
├── lib/                            # Library utilitas
│   ├── applemusic.js               # Downloader Apple Music
│   ├── ffmpeg.js                   # Helper konversi media (FFmpeg)
│   ├── funData.js                  # Data fun dan game
│   ├── mediafire.js                # Downloader MediaFire
│   ├── random.js                   # Fungsi random
│   ├── spotify.js                  # Downloader Spotify
│   ├── threads.js                  # Downloader Threads
│   ├── tiktok.js                   # Downloader TikTok
│   ├── twitterphoto.js             # Downloader foto Twitter/X
│   ├── uploader.js                 # Upload file ke hosting (tourl)
│   ├── ytdlp.js                    # Helper download YouTube
│   ├── mone.js                     # [OBFUSCATED] Logic monetisasi link
│   ├── font/                       # Font untuk fitur nulis dan sticker
│   └── htmlrich/                   # Game HTML (slot, 2048, snake, wordle, dll)
├── src/
│   ├── config.js                   # Konfigurasi utama bot
│   ├── media/
│   │   └── logo.png                # Gambar default bot
│   ├── database/                   # Data runtime (dibuat otomatis, tidak untuk di-commit)
│   │   ├── session/                # Sesi login bot utama
│   │   └── jadibot/<nomor>/        # Sesi login + settings.json tiap clone bot
│   ├── commands/                   # Semua file command di sini
│   │   ├── menu.js                 # menu, menu1, menu2, listcommand, allmenu
│   │   ├── general.js              # ping, botinfo, profile, report, owner, script
│   │   ├── owner.js                # Pengaturan bot, privasi, broadcast, database pesan
│   │   ├── group.js                # tagall, kick, promote, welcome, antilink, dll
│   │   ├── downloader.js           # ytmp3, ytmp4, tiktok, instagram, spotify, dll
│   │   ├── media.js                # sticker, toimg, togif, nulis, dll
│   │   ├── fun.js                  # Game dan hiburan
│   │   ├── tools.js                # cuaca, kurs, translate, tourl, cekwa, dll
│   │   ├── extra.js                # afk, shortlink, sholat, gempa, qrcode, Meta AI
│   │   ├── jadibot.js              # jadibot, listbot, stopbot
│   │   ├── iot.js                  # MQTT, relay, LED
│   │   └── sample.js               # Contoh button, list, poll, media (bahan belajar)
│   ├── handlers/
│   │   └── messageHandler.js       # Routing, parsing, dan logging pesan masuk
│   └── utils/
│       ├── PluginLoader.js         # Sistem plugin & hot-reload
│       ├── cloneSettings.js        # Setting per bot (utama/clone) + info owner
│       ├── helper.js               # Fungsi utilitas umum + getImage()
│       ├── interactiveHelper.js    # Builder pesan interaktif Baileys
│       ├── fquoted.js              # Fake quoted message
│       ├── metaAiHelper.js         # Helper Meta AI
│       ├── mqttClient.js           # Koneksi broker MQTT
│       ├── inoGenerator.js         # Generator sketch Arduino (.ino) untuk IoT
│       ├── groupSettingsStore.js   # Simpan setting grup (welcome, antilink, dll)
│       ├── msgDbStore.js           # Database pesan & media tersimpan
│       ├── stickerCmdStore.js      # Sticker sebagai pemicu command
│       ├── welcomeCard.js          # Kartu welcome/goodbye
│       ├── profileMaker.js         # Pembuat gambar profil
│       ├── identity.js             # Helper identitas/LID
│       ├── rawSender.js            # Kirim pesan mentah
│       └── remoteAsset.js          # Ambil aset dari URL
```

---

## Konfigurasi (`src/config.js`)

Edit langsung `src/config.js` — perubahan terbaca otomatis karena dipantau oleh PluginLoader.

```js
module.exports = {
    ownerName:  'Nama Owner',           // Nama pemilik, muncul di beberapa menu
    botName:    'WhatsApp Bot',         // Nama bot di menu dan info
    footerTxt:  'Powered by Bot',       // Footer pesan interaktif

    prefix:     '!',                    // Awalan command (maks 5 karakter, tanpa spasi)
    noPrefix:   true,                   // true: command jalan dengan ATAU tanpa prefix
                                        // false: wajib pakai prefix

    superOwner: '628xxxxxxxxxx',        // HANYA 1 nomor. Akses penuh + atur co-owner
    coOwner:    ['628xxxxxxxxxx'],      // Boleh banyak nomor. Akses owner biasa

    botMode:    'public',               // 'public' = semua | 'self' = owner only
    quoteStyle: 'pay',                  // Gaya quote bot: 'pay' | 'meta' | 'status'
    menuStyle:  1,                      // 1 = list + gambar, 2 = product + list kategori

    autoRead:   true,                   // Auto centang biru
    autoTyping: true,                   // Tampilkan indikator mengetik (chat pribadi)
    noSelfSync: false,                  // true: pesan bot tidak di-sync ke device lain

    usePairingCode: true,               // true: login pairing code | false: scan QR
    authFolder: './src/database/session',

    channelId:  '',                     // ID channel WA (format 120363xxx@newsletter)
                                        // Kosongkan ('') kalau tidak dipakai

    githubRepo: 'username/nama-repo',   // Dipakai !checkupdate

    mess: { /* teks balasan guard: owner, group, admin, dll */ },
};
```

### Cara dapat Channel ID
Gunakan command `!cekchannel https://whatsapp.com/channel/xxxxx` — bot menampilkan ID-nya lengkap dengan tombol copy.

### Variabel environment (opsional)

| Variabel | Fungsi |
|---|---|
| `BAILEYS_LOG` | Level log Baileys (default `silent`) |
| `HTMLRICH_MAX_KB` | Batas ukuran game HTML yang dikirim (default tanpa batas) |
| `HTMLRICH_MUSIC_ALL` | Isi `1` untuk memakai semua musik latar pada game |

---

## Daftar Command

Ketik `!menu` untuk daftar lengkap dari bot. Ringkasan per kategori:

| File | Isi |
|---|---|
| `menu.js` | `menu`, `menu1`, `menu2`, `listcommand`, `allmenu` |
| `general.js` | `ping`, `botstatus`, `about`/`botinfo`, `profile`, `report`, `owner`, `script`, `donate` |
| `owner.js` | `setmode`, `setprefix`, `setnoprefix`, `autoread`, `autotyping`, `setquote`, `setmenu`, `info`, `block`/`unblock`, pengaturan privasi, `broadcast`, `setbio`, `setname`, `setpp`, `save`/`getsave`, `addmsg`/`getmsg`, `setcmd`/`delcmd`, dll |
| `group.js` | `tagall`, `hidetag`, `kick`, `add`, `promote`, `demote`, `welcome`, `goodbye`, `antilink`, `setgroup`, `link`, `leave`, `listrequest`, `approve`, `reject`, `creategc`, dll |
| `downloader.js` | `ytmp3`, `ytmp4`, `play`, `tiktok`, `instagram`, `fb`, `twdl`, `spotify`, `applemusic`, `soundcloud`, `pinterest`, `threads`, `mediafire`, `gitclone`, `shorts` |
| `media.js` | `sticker`, `toimg`, `togif`, `nulis`, `buatpp` |
| `fun.js` | Game (`slots`, `2048`, `snake`, `wordle`, `flappy`, `dino`, `memory`, `fruitslice`, `spaceshooter`, dll) dan hiburan (`dice`, `coin`, `8ball`, `joke`, `roast`, `truth`, `dare`, dll) |
| `tools.js` | `cuaca`, `kurs`, `translate`, `wiki`, `npm`, `github`, `ipcheck`, `tourl`, `getpp`, `cekwa`, `quote` |
| `extra.js` | `afk`, `shortlink`, `gp`, `sholat`, `gempa`, `qrcode`, `checkupdate`, `metaai`, `imagine` |
| `jadibot.js` | `jadibot`, `addbot`, `listbot`, `stopbot` |
| `iot.js` | `setmqtt`, `mqttinfo`, `setrelay`, `relay1`–`relay8`, `led`, `getino` |
| `sample.js` | Contoh pesan interaktif (button, list, poll, product, event, dll) |

> Beberapa command punya batasan akses: khusus Super Owner, Owner, admin grup, atau hanya bisa dipakai lewat bot utama.

---

## Menambah Command Baru

Ada 2 cara — pilih sesuai selera:

### Cara 1 — Tambah `case` di file yang sudah ada

Buka salah satu file di `src/commands/`, tambah case baru di dalam `switch`:

```js
case 'halo': {
    await m.reply({ text: `👋 Halo, ${m.pushname}!` });
}
    break;
```

Simpan file → bot **langsung reload otomatis** tanpa restart.

### Cara 2 — Buat file command baru

Buat file baru di `src/commands/namafile.js`:

```js
'use strict';

const handler = async (m) => {
    const { command, pushname } = m;
    const p = m.prefix;

    switch (command.name) {
        case 'halo': {
            await m.reply({ text: `👋 Halo, ${pushname}!` });
        }
            break;

        case 'bye': {
            await m.reply({ text: `👋 Sampai jumpa, ${pushname}!` });
        }
            break;
    }
};

module.exports = handler;
```

Simpan file → PluginLoader **otomatis mendeteksi** file baru dan mendaftarkan semua command di dalamnya. Tidak perlu edit file lain sama sekali.

---

## Parameter `m` (Context Object)

Setiap handler menerima satu parameter `m` yang berisi semua info dan fungsi yang dibutuhkan command.

### Info Pengirim

| Property | Tipe | Keterangan |
|---|---|---|
| `m.chat` | `string` | JID chat (grup `xxx@g.us` atau privat) |
| `m.sender` | `string` | JID pengirim asli (di grup = anggota yang mengirim) |
| `m.senderNumber` | `string` | Nomor asli pengirim (`628xxxxxxxxxx`) |
| `m.pushname` | `string` | Nama WA pengirim |
| `m.isOwner` | `boolean` | Pengirim owner (super atau co) |
| `m.isSuperOwner` | `boolean` | Pengirim super owner |
| `m.isCoOwner` | `boolean` | Pengirim co-owner |
| `m.isGroup` | `boolean` | Pesan dari grup |
| `m.isMain` | `boolean` | Pesan masuk ke bot utama (`false` = clone bot) |
| `m.prefix` | `string` | Prefix aktif milik bot yang menerima pesan (utama atau clone). Gunakan ini untuk menampilkan prefix di balasan |

### Info Pesan

| Property | Tipe | Keterangan |
|---|---|---|
| `m.msg` | `object` | Objek pesan mentah dari Baileys |
| `m.text` | `string` | Teks pesan lengkap |
| `m.quoted` | `object \| null` | Pesan yang di-reply (kalau ada) |
| `m.command.name` | `string` | Nama command yang dijalankan |
| `m.command.args` | `string[]` | Argumen command dalam array |
| `m.command.fullArgs` | `string` | Semua argumen dalam satu string |
| `m.fakePay` | `object` | Fake quoted sesuai `quoteStyle` bot ini |

### Koneksi

| Property | Keterangan |
|---|---|
| `m.Hanz` | Objek socket Baileys — akses penuh ke semua method Baileys. Untuk clone, berisi juga `instanceKey` (nomor clone) dan `authFolder` |

### Fungsi Kirim Pesan

| Fungsi | Keterangan |
|---|---|
| `m.reply(content)` | Kirim pesan dengan quoted ke pesan pengirim |
| `m.replyFake(content)` | Kirim pesan dengan fake quoted |
| `m.send(content)` | Kirim pesan tanpa quoted |
| `m.sendRaw(content, jid?, options?)` | Kirim pesan mentah (bypass helper) |
| `m.react(emoji)` | Kasih reaksi emoji ke pesan |
| `m.sendButtons(content)` | Kirim pesan dengan button lama |
| `m.sendList(content)` | Kirim pesan list/dropdown |
| `m.sendInteractive(content)` | Kirim pesan interaktif (button modern) |
| `m.sendButtonWithImage(content)` | Kirim button dengan gambar (via URL) |
| `m.sendInteractiveWithImage(content)` | Kirim button interaktif dengan gambar lokal/Buffer |

---

## Tipe Button Interaktif

Digunakan di `m.sendInteractive()` dan `m.sendInteractiveWithImage()`. Contoh lengkap lain ada di `src/commands/sample.js`.

### `quick_reply` — Kirim pesan/command otomatis
```js
{ name: 'quick_reply', buttonParamsJson: JSON.stringify({
    display_text: 'Kembali ke Menu',
    id: 'menu'
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
    quoted: m.fakePay,
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

## Menggunakan Gambar Lokal (`getImage`)

Semua gambar disimpan di `src/media/`. Sistem `getImage()` mempermudah pemanggilan tanpa perlu path panjang.

### Menambah gambar baru

1. Taruh file gambar di `src/media/` (misal `banner.png`)
2. Daftarkan di `src/utils/helper.js` bagian `MEDIA`:

```js
const MEDIA = {
    logo:   path.join(__dirname, '../media/logo.png'),
    banner: path.join(__dirname, '../media/banner.png'),
};
```

### Menggunakan di command

```js
const { getImage } = require('../utils/helper');

case 'kirimgambar': {
    await m.send({ image: getImage(),         caption: 'Ini logo' });
    await m.send({ image: getImage('banner'), caption: 'Ini banner' });
}
    break;
```

---

## Sistem Level Akses

| Level | Siapa | Akses |
|---|---|---|
| **Super Owner** | Nomor `superOwner` di config | Semua fitur termasuk jadibot & manage co-owner |
| **Co-Owner** | Nomor di array `coOwner` | Fitur owner biasa |
| **User** | Semua orang | Command publik saja |

### Cara cek di command
```js
const { mess } = require('../config');

if (!m.isSuperOwner) return m.reply(mess.superOwner);
if (!m.isOwner)      return m.reply(mess.owner);
if (!m.isGroup)      return m.reply(mess.group);
if (!m.isMain)       return m.reply(mess.mainBotOnly);
```

---

## Pengaturan Bot (Mode, Prefix, dll)

Command ini mengatur bot yang **sedang dipakai** — bot utama atau clone yang menerima perintah. Semuanya **khusus Super Owner**. Kalau argumennya dikosongkan, bot menampilkan status saat ini beserta tombol pilihan.

```
!setmode public|self   → semua orang bisa pakai | hanya owner
!setprefix <prefix>    → ganti prefix
!setnoprefix on|off    → command tanpa prefix
!autoread on|off       → auto centang biru
!autotyping on|off     → indikator mengetik
!noselfsync on|off     → sync pesan bot ke device lain
!setquote <gaya>       → pay | meta | status
!setmenu 1|2           → gaya menu
!info                  → lihat semua pengaturan aktif
```

| Bot | Disimpan di | Bertahan setelah restart |
|---|---|---|
| Bot utama | Memori (default dari `config.js`) | Tidak — kembali ke `config.js` |
| Clone | `src/database/jadibot/<nomor>/settings.json` | Ya |

Kalau mau pengaturan bot utama permanen, ubah nilainya di `src/config.js`.

---

## JadiBot (Clone Bot)

| Command | Keterangan |
|---|---|
| `!jadibot 628xxx` | Buat clone bot di nomor tersebut. Pairing code ditampilkan di chat dan dikirim juga ke nomor target |
| `!listbot` | Lihat daftar clone bot yang aktif |
| `!stopbot 628xxx` | Matikan clone bot |
| `!jadibotmenu` | Menu fitur jadibot |

Aturan main:
- Command jadibot hanya bisa dipakai lewat **bot utama**.
- Clone **hidup kembali otomatis** saat bot utama di-restart (autoload).
- Setiap clone memiliki **pengaturan sendiri** (prefix, mode, menu, auto-read, dll).
- Menu dan info bot pada clone menampilkan identitas clone (nomor dan nama profilnya).
- Setelah pairing selesai, WhatsApp meminta koneksi dimulai ulang sekali (kode `515`). Bot menyambung ulang secara otomatis.

---

## Format Log Terminal

Setiap baris log memakai kolom tetap dan label asal bot, sehingga pesan dari bot utama dan tiap clone mudah dibedakan:

```
[BOT]   Menghidupkan 2 clone bot...
[BOT]   [CLONE 0053] +6283165110053 terhubung • Public • Prefix !  • Nama
[BOT]   [CLONE 7890] +6281234567890 terhubung • Self   • Prefix .  • Toko Budi
[MASUK] [UTAMA]      [PRIVAT]  628xxx (Nama) → halo
[CMD]   [UTAMA]      [GRUP]    Nama Grup (Nama · 628xxx) → ping
[CMD]   [CLONE 0053] [GRUP]    Nama Grup (Nama · 628xxx) → ping
[SKIP]  [UTAMA]      [PRIVAT]  command "xyz" tidak ada
[ERROR] [CLONE 0053] [GRUP]    ... pesan error
```

| Kolom | Arti |
|---|---|
| `[MASUK]` `[CMD]` `[SKIP]` `[ERROR]` | Jenis log: pesan masuk, command jalan, command tidak ada, error |
| `[UTAMA]` / `[CLONE xxxx]` | Asal pesan. Untuk clone, `xxxx` adalah 4 digit terakhir nomor clone |
| `[GRUP]` `[PRIVAT]` `[CHANNEL]` | Jenis chat. Untuk grup, yang tampil nama grup |

---

## Fitur Grup

| Command | Keterangan |
|---|---|
| `!welcome on/off` | Pesan sambutan saat member masuk |
| `!goodbye on/off` | Pesan perpisahan saat member keluar |
| `!promotewelcome`, `!demotewelcome` | Kartu saat member dijadikan/dicopot admin |
| `!antilink on/off` | Hapus otomatis pesan berisi link (owner kebal) |
| `!afk <alasan>` | Status AFK, auto-reply saat kamu di-mention |

`welcome`, `goodbye`, dan `antilink` bisa dipakai admin grup atau owner. Tanpa `on/off`, statusnya di-toggle. Setting grup tersimpan di `src/database/groupSettings.json` dan bertahan setelah restart.

---

## Kontrol IoT (MQTT)

Kontrol relay dan LED lewat broker MQTT (fire-and-forget, tanpa menunggu balasan device).

```
!setmqtt <brokerUrl> <topic>                       → broker publik
!setmqtt <brokerUrl> <user> <pass> <topic>         → broker privat (khusus Super Owner)
!mqttinfo                                          → lihat konfigurasi aktif
!setrelay <jumlah 1-8>                             → atur jumlah relay
!relaylabel <nomor> <nama>                         → beri nama relay
!relaypin <nomor> <pin GPIO>                       → atur pin relay
!relay1 on|off ... !relay8 on|off                  → nyalakan/matikan relay
!led on|off                                        → kontrol LED
!iotcontrol                                        → menu kontrol interaktif
!getino                                            → generate sketch ESP32 (.ino) sesuai konfigurasi
```

Konfigurasi broker disimpan di `src/database/mqttConfig.json`. Selama broker belum diatur, log startup menampilkan pesan `[MQTT] Belum dikonfigurasi`.

---

## Fitur Shortlink (`extra.js`)

### `!shortlink` / `!short`
Mempersingkat URL menggunakan **TinyURL** — gratis, tanpa iklan, tanpa perlu akun.

```
!shortlink https://link-panjang.com/path/yang/sangat/panjang
```

### `!gp` / `!gplink`
Mempersingkat URL menggunakan **GPLinks** — link hasil shorten akan menampilkan halaman iklan singkat sebelum mengarahkan ke URL tujuan.

```
!gp https://link-panjang.com/path
```

> **fitur pribadi aja:** Fitur `!gp` sebenarnya buat penggunaan pribadi sih ya menggunakan API key GPLinks milik developer (Haris S). Setiap klik pada link yang dihasilkan akan menghasilkan pendapatan iklan yang masuk ke akun developer, bukan ke pengguna bot. Jika kamu tidak setuju dengan hal ini, disable saja fitur ini.

---

## Sistem Hot-Reload

| Aksi | File | Efek |
|---|---|---|
| Edit file | `src/commands/*.js` | Reload command di file itu saja |
| Edit file | `src/utils/*.js`, `src/handlers/*.js`, `src/config.js` | Reload **semua** command |
| Edit file | `lib/*.js` | Reload **semua** command |
| Tambah file baru | `src/commands/` | Command baru otomatis terdaftar |
| Hapus file | `src/commands/` | Command otomatis terhapus dari daftar |

File di `src/database/`, `src/media/`, dan semua `.json` tidak dipantau.

> ⚠️ Perubahan di `index.js` **tidak** hot-reload — butuh restart manual.

---

## Fungsi Utilitas (`src/utils/helper.js`)

```js
const {
    formatUptime,    // formatUptime(seconds) → '1 hari 2 jam 3 menit'
    formatJid,       // formatJid('08xx') → '628xx@s.whatsapp.net'
    normJid,         // normalisasi JID
    formatBytes,     // formatBytes(1024) → '1 KB'
    delay,           // await delay(3000) → tunggu 3 detik
    randomString,    // randomString(8) → 'aB3xKp9z'
    getGroupInfo,    // await getGroupInfo(Hanz, jid) → metadata grup
    isGroupAdmin,    // await isGroupAdmin(Hanz, groupJid, userJid) → true/false
    getImage,        // getImage('logo') → Buffer gambar
    MEDIA,           // daftar gambar lokal
} = require('../utils/helper');
```

Pengaturan per bot (utama/clone) dibaca lewat `src/utils/cloneSettings.js`:

```js
const { getSetting, setSetting, getOwnerDisplay } = require('../utils/cloneSettings');

getSetting(m.Hanz, m.isMain, 'prefix');             // baca setting bot ini
setSetting(m.Hanz, m.isMain, 'botMode', 'self');    // ubah (clone: tersimpan ke settings.json)
getOwnerDisplay(m.Hanz, m.isMain);                  // { name, number } untuk tampilan info bot
```

---

## Dependencies

| Package | Kegunaan |
|---|---|
| `baileys` (alias `@hanzofc/baileys`) | Library koneksi WhatsApp |
| `@hapi/boom` | HTTP error handling |
| `@ffmpeg-installer/ffmpeg`, `fluent-ffmpeg` | Konversi media (sticker, audio, video) |
| `axios`, `form-data`, `qs` | HTTP client dan upload |
| `cheerio` | Scraping HTML |
| `yt-search` | Pencarian YouTube |
| `mqtt` | Koneksi broker MQTT (IoT) |
| `sharp`, `node-webpmux`, `fontkit` | Proses gambar, sticker, dan font |
| `chalk` | Warna teks di terminal |
| `chokidar` | Watch perubahan file (hot-reload) |
| `figlet` | Banner ASCII saat bot start |
| `spinnies` | Animasi spinner "Menunggu Pesan" di terminal |
| `qrcode-terminal` | Tampilkan QR login di terminal |
| `pino` | Logger Baileys |
| `jsonwebtoken`, `uuid`, `dotenv` | Utilitas pendukung |

---

## Reset Sesi

```bash
# Bot utama
rm -rf src/database/session

# Clone bot tertentu
rm -rf src/database/jadibot/628xxxxxxxxxx

# Semua clone bot
rm -rf src/database/jadibot

# Lalu restart
npm start
```

---

## Keamanan

- Folder `src/database/` berisi **kredensial login WhatsApp** (`creds.json`) dan data pesan. **Jangan** di-commit, di-zip untuk dibagikan, atau dikirim ke orang lain — siapa pun yang memegangnya bisa mengambil alih sesi bot. Folder ini sudah masuk `.gitignore`.
- Jangan menaruh nomor atau token pribadi di repo publik. Cek `src/config.js` sebelum push.

---

## ⚠️ Disclaimer

Penggunaan bot WhatsApp di luar ketentuan resmi WhatsApp sepenuhnya menjadi tanggung jawab pengguna. Penulis tidak bertanggung jawab atas penyalahgunaan script ini.