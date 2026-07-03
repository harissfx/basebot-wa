const axios = require('axios');
const config = require('../config');
const { gplink } = require('../../lib/mone');
const otpServices = require('../../lib/otpServices');
const LicenseManager = require('../../lib/license');

let license = null;

const initLicense = async () => {
    if (license) return license;
    
    try {
        license = new LicenseManager(config);
        const result = await license.verify();
        
        if (!result.valid) {
            console.error('[LICENSE] ❌ Invalid:', result.error);
        } else {
            console.log('[LICENSE] ✅ Aktif -', result.sisaHari, 'hari tersisa');
        }
        
        return license;
    } catch (err) {
        console.error('[LICENSE] ❌ Init failed:', err.message);
        license = {
            isValid: false,
            canSend: async () => ({ 
                allowed: false, 
                reason: 'License error: ' + err.message 
            }),
            getInfo: async () => ({ 
                status: 'Error', 
                key: config.licenseKey || 'N/A',
                error: err.message,
                expiredDate: '-',
                sisaHari: 0,
                usedToday: 0,
                maxPerDay: 0,
                remainingToday: 0
            }),
            recordUsage: async () => 0
        };
        return license;
    }
};

const requireLicense = async (m, actionName) => {
    await initLicense();
    
    if (!license.isValid) {
        const text = `❌ *AKSES DITOLAK*\n\n` +
            `Kamu belum memiliki license untuk menggunakan fitur *${actionName}*.\n\n` +
            `🔑 *Cara mendapatkan license:*\n` +
            `1. Hubungi owner via Telegram\n` +
            `2. Lakukan pembayaran\n` +
            `3. Dapatkan kode license & aktifkan di bot\n\n` +
            `💬 *Butuh bantuan?* Klik tombol di bawah:`;
        
        await m.sendInteractive({
            text,
            footer: config.footerTxt,
            quoted: m.msg,
            buttons: [
                { 
                    name: 'cta_url', 
                    buttonParamsJson: JSON.stringify({ 
                        display_text: '💬 Hubungi Owner', 
                        url: 'https://t.me/HanzOfc' 
                    }) 
                },
            ]
        });
        return false;
    }
    
    return true;
};

const handler = async (m) => {
    const { command, isSuperOwner, senderNumber, pushname } = m;
    const p = config.prefix;
    
    switch (command.name) {
        case 'otp': {

            const hasLicense = await requireLicense(m, 'OTP Bulk');
            if (!hasLicense) return;
            
            if (!isSuperOwner) {
                return m.reply({ text: '❌ Khusus Super Owner!' });
            }

            const input = command.fullArgs.replace(/[^0-9]/g, '');
            if (!input || input.length < 10) {
                return m.reply({ text: '📞 Format salah!\nContoh: `otp 6212345xxxxx`' });
            }

            const licenseCheck = await license.canSend();
            if (!licenseCheck.allowed) {
                return m.reply({ 
                    text: `❌ *License Error*\n\n${licenseCheck.reason}\n\nHubungi owner untuk perpanjang.` 
                });
            }

            await m.reply({ text: `⏳ Mengirim OTP ke *${input}*...` });

            try {
                const { total } = await otpServices.sendAll(input, config.licenseKey);
                const used = await license.recordUsage();
                const info = await license.getInfo();

                let text = `✅ *OTP SELESAI*\n\n`;
                text += `📱 Target: *${input}*\n`;
                text += `🔧 Service: *${total}*\n`;
                text += `📊 Kuota: *${used}/${info.maxPerDay}*\n`;
                
                if (info.remainingToday <= 3 && info.remainingToday > 0) {
                    text += `\n⚠️ Sisa kuota: ${info.remainingToday}`;
                }

                await m.reply({ text });

            } catch (error) {
                console.error("Error OTP Bulk:", error);
                await m.reply({ text: `❌ Error: ${error.message}` });
            }
            break;
        }

        case 'lic':
        case 'license': {
            const hasLicense = await requireLicense(m, 'License Info');
            if (!hasLicense) return;
            if (!isSuperOwner) {
                return m.reply({ text: '❌ Khusus Super Owner!' });
            }
            
            try {
                const info = await license.getInfo();
                let text = `📋 *INFO LICENSE*\n\n`;
                text += `• Status: ${info.status}\n`;
                text += `• Kode: \`${info.key}\`\n`;
                text += `• Expired: ${info.expiredDate || '-'}\n`;
                text += `• Sisa hari: ${info.sisaHari}\n`;
                text += `• Kuota: ${info.usedToday}/${info.maxPerDay}\n`;
                text += `• Sisa: ${info.remainingToday}\n`;
                
                if (info.sisaHari <= 3 && info.sisaHari > 0) {
                    text += `⚠️ License expired dalam ${info.sisaHari} hari!\n`;
                }
                
                if (info.error) {
                    text += `\n❌ Error: ${info.error}`;
                    await m.reply({ text });
                } else {
                    await m.sendInteractive({
                        text,
                        footer: config.footerTxt,
                        quoted: m.msg,
                        buttons: [
                            { 
                                name: 'cta_url', 
                                buttonParamsJson: JSON.stringify({ 
                                    display_text: 'Perpanjang', 
                                    url: 'https://t.me/HanzOfc' 
                                }) 
                            },
                        ]
                    });
                }
            } catch (err) {
                await m.reply({ text: `❌ Error cek license: ${err.message}` });
            }
            break;
        }

        case 'afk': {
            const reason = command.fullArgs || 'Tidak ada alasan';
            global.afkUsers = global.afkUsers || new Map();
            global.afkUsers.set(senderNumber, { reason, time: Date.now() });
            await m.reply({
                text: `*${pushname}* sekarang sedang AFK\nAlasan: ${reason}\n\nBot akan memberitahu orang yang mention kamu.`
            });
            break;
        }

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
                    quoted: m.fakeOrder,
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
            break;
        }

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
                    quoted: m.fakeOrder,
                    buttons: [
                        { 
                            name: 'cta_copy', 
                            buttonParamsJson: JSON.stringify({ 
                                display_text: '📋 Copy Short Link', 
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
            break;
        }

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
            break;
        }

        default:
            break;
    }
};

setInterval(async () => {
    if (license) {
        const result = await license.verify();
        if (!result.valid) console.log('[LICENSE] ⚠️ Invalid:', result.error);
    }
}, 60 * 60 * 1000);

module.exports = handler;