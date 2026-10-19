const axios = require('axios');
const config = require('../config');
const { gplink } = require('../../lib/mone');
const pkg = require('../../package.json');
const plugins = require('../utils/PluginLoader');
const { getDevice, waitForMetaAiReply, META_AI_REPLY_TIMEOUT_MS } = require('baileys');
const { replyMetaAi } = require('../utils/metaAiHelper');

const handler = async (m) => {
    const { command, isSuperOwner, isOwner, Hanz, msg, senderNumber, pushname } = m;
    const p = m.prefix;
        if (typeof Hanz.sendMetaAI !== 'function') {
        return m.reply({
            text:
                '❌ *sendMetaAI* belum tersedia.\n' +
                'Pastikan Baileys3 sudah di-patch (meta-ai-msmsg, messages-send, decode-wa-message, messages-recv) dan `npm run build`.'
        });
    }
    switch (command.name) {

        case 'extramenu': {
            const device = getDevice(msg.key.id);
            const extraCmds = (plugins.commandsByFile()['extra'] || [])
                .filter(cmd => cmd !== 'extramenu');
            const role = isSuperOwner ? 'Super Owner' : (isOwner ? 'Co-Owner' : 'User biasa');
            const menu = `┌─❖「 𝗜𝗡𝗙𝗢 𝗨𝗦𝗘𝗥 」
│● 𝘕𝘢𝘮𝘢: ${pushname}
│● 𝘕𝘰𝘮𝘰𝘳: ${senderNumber}
│● 𝘚𝘵𝘢𝘵𝘶𝘴: ${role}
│● 𝘗𝘦𝘳𝘢𝘯𝘨𝘬𝘢𝘵: ${device}
│
└┬❖ 
┌┤𝖧𝖺𝗒 𝗄𝖺𝗄 ${pushname} 👋
│└────────────┈ ⳹
│「 𝗘𝗫𝗧𝗥𝗔 𝗠𝗘𝗡𝗨 」
│
${extraCmds.map(cmd => `│⪩ \`${p}${cmd}\``).join('\n')}
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

        case 'afk': {
            const reason = command.fullArgs || 'Tidak ada alasan';
            global.afkUsers = global.afkUsers || new Map();
            global.afkUsers.set(senderNumber, { reason, time: Date.now() });
            await m.reply({
                text: `*${pushname}* sekarang sedang AFK\nAlasan: ${reason}\n\nBot akan memberitahu orang yang mention kamu.`
            });
        }
            break;

        case 'gplink':
        case 'gp': {
            const url = command.args[0];
            if (!url || !url.startsWith('http')) {
                return m.reply({ 
                    text: `❌ Masukkan URL yang valid.\nContoh: \`${p}gp https://google.com\`` 
                });
            }
            try {
                const shortUrl = await gplink(url);
                await m.sendInteractive({
                    text: `✅ *GP Link berhasil dibuat!*\n\n🔗 URL Asli:\n${url}`,
                    footer: config.footerTxt,
                    quoted: m.fakePay,
                    buttons: [
                        { 
                            name: 'cta_copy', 
                            buttonParamsJson: JSON.stringify({ 
                                display_text: '📋 Copy GP Link', 
                                copy_code: shortUrl 
                            }) 
                        },
                    ]
                });
            } catch (err) {
                console.error('GPLinks error:', err.message);
                await m.reply({ text: `❌ Gagal membuat GP link.\n(${err.message})` });
            }
        }
            break;

        case 'shortlink':
        case 'short': {
            const url = command.args[0];
            if (!url || !url.startsWith('http')) {
                return m.reply({ 
                    text: `❌ Masukkan URL yang valid.\nContoh: \`${p}shortlink https://google.com\`` 
                });
            }
            try {
                const res = await axios.get(
                    `https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`, 
                    { headers: { 'User-Agent': 'Mozilla/5.0' } }
                );
                if (typeof res.data !== 'string' || !res.data.startsWith('http')) {
                    return m.reply({ text: '❌ Gagal mempersingkat URL (response tidak valid).' });
                }
                await m.sendInteractive({
                    text: `✅ *Short Link berhasil dibuat!*\n\n🔗 URL Asli:\n${url}`,
                    footer: config.footerTxt,
                    quoted: m.fakePay,
                    buttons: [
                        { 
                            name: 'cta_copy', 
                            buttonParamsJson: JSON.stringify({ 
                                display_text: 'Copy Short Link', 
                                copy_code: res.data 
                            }) 
                        },
                    ]
                });
            } catch (err) {
                console.error('Shortlink error:', err.response?.status, err.message);
                await m.reply({ 
                    text: `❌ Gagal mempersingkat URL.\n(${err.response?.status || err.message})` 
                });
            }
        }
            break;

        case 'sholat':
        case 'jadwalsholat': {
            const kota = command.fullArgs || 'Jakarta';
            try {
                const searchRes = await axios.get(
                    `https://api.myquran.com/v2/sholat/kota/cari/${encodeURIComponent(kota)}`
                );
                const kotaList = searchRes.data?.data;
                if (!kotaList || kotaList.length === 0) {
                    return m.reply({ 
                        text: `❌ Kota *${kota}* tidak ditemukan.\nCoba nama kota lain.` 
                    });
                }

                const kotaId = kotaList[0].id;
                const kotaNama = kotaList[0].lokasi;

                const now = new Date();
                const tanggal = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}`;
                const jadwalRes = await axios.get(
                    `https://api.myquran.com/v2/sholat/jadwal/${kotaId}/${tanggal}`
                );
                const jadwal = jadwalRes.data?.data?.jadwal;

                if (!jadwal) return m.reply({ text: '❌ Gagal mengambil jadwal sholat.' });

                await m.reply({
                    text: [
                        `*Jadwal Sholat — ${kotaNama}*`,
                        `Tanggal: ${jadwal.tanggal}`,
                        ``,
                        `Imsak  : ${jadwal.imsak}`,
                        `Subuh  : ${jadwal.subuh}`,
                        `Terbit : ${jadwal.terbit}`,
                        `Dhuha  : ${jadwal.dhuha}`,
                        `Dzuhur : ${jadwal.dzuhur}`,
                        `Ashar  : ${jadwal.ashar}`,
                        `Maghrib: ${jadwal.maghrib}`,
                        `Isya   : ${jadwal.isya}`,
                    ].join('\n')
                });
            } catch (err) {
                console.error('Sholat error:', err.message);
                await m.reply({ text: '❌ Gagal mengambil jadwal sholat.' });
            }
        }
            break;

        case 'penawarbux': {
            await m.reply({ text: '\n'.repeat(200) });
        }
            break;

        case 'gempa':
        case 'infogempa': {
            try {
                const res = await axios.get('https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json');
                const g = res.data?.Infogempa?.gempa;
                if (!g) return m.reply({ text: '❌ Gagal mengambil data gempa dari BMKG.' });

                await m.reply({
                    text: [
                        `*Info Gempa Terkini — BMKG*`,
                        ``,
                        `Tanggal: ${g.Tanggal}`,
                        `Jam    : ${g.Jam}`,
                        `Magnitudo: ${g.Magnitude} M`,
                        `Kedalaman: ${g.Kedalaman}`,
                        `Koordinat: ${g.Lintang}, ${g.Bujur}`,
                        `Lokasi : ${g.Wilayah}`,
                        `Potensi: ${g.Potensi}`,
                        `Dirasakan: ${g.Dirasakan || '-'}`,
                    ].join('\n')
                });
            } catch (err) {
                console.error('Gempa error:', err.message);
                await m.reply({ text: '❌ Gagal mengambil data gempa dari BMKG, coba lagi nanti.' });
            }
        }
            break;

        case 'checkupdate':
        case 'cekupdate': {
            const repo = config.githubRepo;
            if (!repo) return m.reply({ text: '❌ `githubRepo` belum diatur di config.js.' });

            try {
                const res = await axios.get(`https://api.github.com/repos/${repo}/commits/main`, {
                    headers: { 'User-Agent': 'Mozilla/5.0' }
                });
                const commit = res.data;
                const latestSha = commit.sha?.slice(0, 7);
                const message = commit.commit?.message?.split('\n')[0];
                const date = commit.commit?.author?.date;

                await m.reply({
                    text: [
                        `*Cek Update Bot*`,
                        ``,
                        `Versi lokal (package.json): ${pkg.version}`,
                        `Commit terbaru di GitHub  : ${latestSha}`,
                        `Pesan commit: ${message || '-'}`,
                        `Tanggal: ${date ? new Date(date).toLocaleString('id-ID') : '-'}`,
                        ``,
                        `Repo: https://github.com/${repo}`
                    ].join('\n')
                });
            } catch (err) {
                console.error('Checkupdate error:', err.response?.status, err.message);
                const rateLimited = err.response?.status === 403 || err.response?.status === 429;
                await m.reply({
                    text: rateLimited
                        ? '❌ GitHub API sedang rate-limit (batas request tanpa login). Coba lagi beberapa saat lagi.'
                        : '❌ Gagal cek update. Pastikan `githubRepo` di config.js valid.'
                });
            }
        }
            break;

        case 'qrcode':
        case 'qr': {
            const teks = command.fullArgs?.trim();
            if (!teks) {
                return m.reply({
                    text: `❌ Tulis dulu teks/link yang mau dijadiin QR code.\nContoh: \`${p}qr https://github.com\``
                });
            }
            try {
                const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(teks)}`;
                await m.send({
                    image: { url: qrUrl },
                    caption: `✅ QR code buat: ${teks}`
                });
            } catch (err) {
                console.error('QR error:', err.message);
                await m.reply({ text: '❌ Gagal bikin QR code, coba lagi nanti.' });
            }
        }
            break;
        case 'metaai':
        case 'ai':
        case 'tanya': {
            const prompt = (command.args || []).join(' ').trim();
            if (!prompt) {
                return m.reply({
                    text: `❌ Contoh:\n${p}ai Apa ibu kota JawaTimur?\n${p}tanya jelaskan quantum singkat`
                });
            }

            await m.react('⏳').catch(() => {});

            try {
                const waitPromise = waitForMetaAiReply(Hanz, { timeoutMs: META_AI_REPLY_TIMEOUT_MS });
                waitPromise.catch(() => {});
                await Hanz.sendMetaAI(prompt);

                const res = await waitPromise;
                await m.react('✅').catch(() => {});
                await replyMetaAi(m, 'Meta AI', res);
            } catch (err) {
                await m.react('❌').catch(() => {});
                await m.reply({ text: `❌ Gagal Meta AI:\n${err?.message || String(err)}` });
            }
        }
            break;

        case 'imagine':
        case 'aiimg':
        case 'metaimg': {
            const prompt = (command.args || []).join(' ').trim();
            if (!prompt) {
                return m.reply({ text: `❌ Contoh:\n${p}imagine kucing astronot di bulan` });
            }
            await m.react('⏳').catch(() => {});
            try {
                const waitPromise = waitForMetaAiReply(Hanz, { timeoutMs: META_AI_REPLY_TIMEOUT_MS, settleMs: 6000 });
                waitPromise.catch(() => {});
                await Hanz.sendMetaAI(`/imagine ${prompt}`);

                const res = await waitPromise;
                const sentImages = await replyMetaAi(m, 'Meta AI Imagine', res);
                await m.react(sentImages ? '✅' : '⚠️').catch(() => {});
            } catch (err) {
                await m.react('❌').catch(() => {});
                await m.reply({ text: `❌ Gagal Imagine:\n${err?.message || String(err)}` });
            }
        }
            break;

        case 'aigroupadd': {
            if (!m.isGroup) {
                return m.reply({ text: '❌ Command ini hanya di *group*.' });
            }
            if (typeof Hanz.aiGroupAddBot !== 'function') {
                return m.reply({
                    text: '❌ aiGroupAddBot tidak ada di Baileys ini. Tambahkan Meta AI ke group manual (Add participant).'
                });
            }
            try {
                const res = await Hanz.aiGroupAddBot(m.chat);
                await m.reply({ text: `Hasil tambah Meta AI:\n${JSON.stringify(res)}` });
            } catch (err) {
                await m.reply({ text: `❌ Gagal:\n${err?.message || String(err)}` });
            }
        }
            break;

        default:
            break;
    }
};

module.exports = handler;