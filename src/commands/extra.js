const axios = require('axios');
const config = require('../config');
const { isGroupAdmin } = require('../utils/helper');
const { gplink } = require('../../lib/mone');

const handler = async (m) => {
    const { command, sender, senderNumber, pushname, msg } = m;
    const p = config.prefix;
    const senderJid = msg.key.participant || msg.key.remoteJid;

    switch (command.name) {

        // ══════════════════════════════════════════════════════
        //  AFK
        // ══════════════════════════════════════════════════════

        case 'afk': {
            const reason = command.fullArgs || 'Tidak ada alasan';
            global.afkUsers = global.afkUsers || new Map();
            global.afkUsers.set(senderNumber, { reason, time: Date.now() });
            await m.reply({
                text: `*${pushname}* sekarang sedang AFK\nAlasan: ${reason}\n\nBot akan memberitahu orang yang mention kamu.`
            });
            break;
        }

        // ══════════════════════════════════════════════════════
        //  GPLINKS
        // ══════════════════════════════════════════════════════

        case 'gplink':
        case 'gp': {
            const url = command.args[0];
            if (!url || !url.startsWith('http')) {
                return m.reply({ text: `❌ Masukkan URL yang valid.\nContoh: \`${p}gp https://google.com\`` });
            }
            try {
                const shortUrl = await gplink(url);
                await m.sendInteractive({
                    text: `✅ *GP Link berhasil dibuat!*\n\n🔗 URL Asli:\n${url}`,
                    footer: config.footerTxt,
                    quoted: m.fakeOrder,
                    buttons: [
                        { name: 'cta_copy', buttonParamsJson: JSON.stringify({ display_text: '📋 Copy GP Link', copy_code: shortUrl }) },
                    ]
                });
            } catch (err) {
                console.error('GPLinks error:', err.message);
                await m.reply({ text: `❌ Gagal membuat GP link.\n(${err.message})` });
            }
            break;
        }

        // ══════════════════════════════════════════════════════
        //  SHORTLINK
        // ══════════════════════════════════════════════════════

        case 'shortlink':
        case 'short': {
            const url = command.args[0];
            if (!url || !url.startsWith('http')) {
                return m.reply({ text: `❌ Masukkan URL yang valid.\nContoh: \`${p}shortlink https://google.com\`` });
            }
            try {
                const res = await axios.get(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`, {
                    headers: { 'User-Agent': 'Mozilla/5.0' }
                });
                if (typeof res.data !== 'string' || !res.data.startsWith('http')) {
                    return m.reply({ text: '❌ Gagal mempersingkat URL (response tidak valid).' });
                }
                await m.sendInteractive({
                    text: `✅ *Short Link berhasil dibuat!*\n\n🔗 URL Asli:\n${url}`,
                    footer: config.footerTxt,
                    quoted: m.fakeOrder,
                    buttons: [
                        { name: 'cta_copy', buttonParamsJson: JSON.stringify({ display_text: '📋 Copy Short Link', copy_code: res.data }) },
                    ]
                });
            } catch (err) {
                console.error('Shortlink error:', err.response?.status, err.message);
                await m.reply({ text: `❌ Gagal mempersingkat URL.\n(${err.response?.status || err.message})` });
            }
            break;
        }

        // ══════════════════════════════════════════════════════
        //  JADWAL SHOLAT
        // ══════════════════════════════════════════════════════

        case 'sholat':
        case 'jadwalsholat': {
            const kota = command.fullArgs || 'Jakarta';
            try {
                // Cari ID kota
                const searchRes = await axios.get(`https://api.myquran.com/v2/sholat/kota/cari/${encodeURIComponent(kota)}`);
                const kotaList = searchRes.data?.data;
                if (!kotaList || kotaList.length === 0) {
                    return m.reply({ text: `❌ Kota *${kota}* tidak ditemukan.\nCoba nama kota lain.` });
                }

                const kotaId = kotaList[0].id;
                const kotaNama = kotaList[0].lokasi;

                // Ambil jadwal hari ini
                const now = new Date();
                const tanggal = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}`;
                const jadwalRes = await axios.get(`https://api.myquran.com/v2/sholat/jadwal/${kotaId}/${tanggal}`);
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
            break;
        }

    }
};

module.exports = handler;