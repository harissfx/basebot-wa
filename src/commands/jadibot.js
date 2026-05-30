const config = require('../config');
const { sendInteractiveMessage } = require('../utils/interactiveHelper');

const handler = async (ctx) => {

    const { command, isOwner, isMain, sock, sender } = ctx;

    if (!isOwner) return ctx.reply({ text: '❌ Perintah ini khusus untuk Owner Bot!' });

    // Semua fitur jadibot hanya bisa dijalankan dari bot UTAMA, bukan clone bot
    if (!isMain) {
        return ctx.reply({ text: '❌ Fitur ini hanya bisa digunakan melalui *Bot Utama*, bukan dari clone bot!' });
    }

    switch (command.name) {
        case 'addbot':
        case 'jadibot': {
            let nomorTarget = command.fullArgs.replace(/\D/g, '');

            if (!nomorTarget) {
                return ctx.reply({ text: `⚠️ *Format Salah!*\n\nFormat: \`${config.prefix}jadibot <nomor-hp>\`\nContoh: \`${config.prefix}jadibot 62857xxxx\`` });
            }

            if (nomorTarget.startsWith('0')) {
                nomorTarget = '62' + nomorTarget.slice(1);
            }

            // === CEK APAKAH NOMOR TERDAFTAR DI WHATSAPP ===
            await ctx.reply({ text: `🔍 Memeriksa nomor +${nomorTarget} di WhatsApp...` });

            try {
                const [checkResult] = await sock.onWhatsApp(`${nomorTarget}@s.whatsapp.net`);
                if (!checkResult?.exists) {
                    return ctx.reply({ text: `❌ *Nomor +${nomorTarget} tidak terdaftar di WhatsApp!*\n\nPastikan nomor sudah benar dan aktif di WhatsApp.` });
                }
            } catch (err) {
                return ctx.reply({ text: `❌ Gagal memeriksa nomor: ${err.message}` });
            }

            await ctx.reply({ text: `⏳ Sedang menginisialisasi sesi baru dan meminta Pairing Code untuk +${nomorTarget}...` });

            try {
                const pairingCode = await global.createNewBotInstance(nomorTarget);

                // Tentukan JID owner (pengirim perintah) dan JID target
                const ownerJid  = sender;
                const targetJid = `${nomorTarget}@s.whatsapp.net`;

                // === KIRIM KE NOMOR TARGET ===
                try {
                    await sendInteractiveMessage(sock, targetJid, {
                        text:
                            `🤖 *Halo! Kamu sedang didaftarkan sebagai Clone Bot.*\n\n` +
                            `• *Pairing Code* : *${pairingCode}*\n\n` +
                            `👉 Buka WhatsApp kamu → *Linked Devices* → *Link with phone number*\n` +
                            `Lalu masukkan kode di atas.\n\n` +
                            `⚠️ Kode ini hanya berlaku beberapa menit!`,
                        footer: `${config.botName}`,
                        buttons: [
                            {
                                name: 'cta_copy',
                                buttonParamsJson: JSON.stringify({
                                    display_text: '📋 Copy Kode Pairing',
                                    copy_code: pairingCode
                                })
                            }
                        ]
                    });
                } catch (sendErr) {
                    console.error('[JADIBOT] Gagal kirim pesan ke nomor target:', sendErr.message);
                }

                // === KIRIM KE OWNER ===
                await ctx.sendInteractive({
                    text:
                        `✅ *BERHASIL GENERATE CLONE BOT*\n\n` +
                        `• *Nomor Bot* : +${nomorTarget}\n` +
                        `• *Pairing Code* : *${pairingCode}*\n\n` +
                        `📨 Pairing code sudah dikirim langsung ke nomor *+${nomorTarget}*.\n\n` +
                        `👉 Atau klik tombol di bawah untuk menyalin kode, lalu masukkan pada menu *Linked Devices → Link with phone number*.`,
                    footer: `${config.botName}`,
                    quoted: ctx.msg,
                    buttons: [
                        {
                            name: 'cta_copy',
                            buttonParamsJson: JSON.stringify({
                                display_text: '📋 Copy Kode Pairing',
                                copy_code: pairingCode
                            })
                        }
                    ]
                });

            } catch (error) {
                console.error('Gagal kloning bot:', error);
                await ctx.reply({ text: `❌ Gagal membuat clone bot: ${error.message}` });
            }
            break;
        }

        case 'listbot': {
            const activeBots = Object.keys(global.conns || {});

            if (activeBots.length <= 1) {
                return ctx.reply({ text: `ℹ️ Belum ada clone bot (*jadibot*) yang aktif saat ini.` });
            }

            let teksList = `🤖 *DAFTAR CLONE BOT AKTIF* 🤖\n\n`;
            let urutan = 1;

            activeBots.forEach(botFile => {
                if (botFile !== config.authFolder.replace(/\D/g, '')) {
                    teksList += `${urutan++}. *Nomor*: +${botFile}\n`;
                }
            });

            await ctx.reply({ text: teksList });
            break;
        }

        case 'stopbot': {
            let targetStop = command.fullArgs.replace(/\D/g, '');
            if (!targetStop) return ctx.reply({ text: `⚠️ Masukkan nomor bot sewaan yang ingin dimatikan.\nContoh: \`${config.prefix}stopbot 62857xxx\`` });

            if (global.conns[targetStop]) {
                try {
                    global.conns[targetStop].logout();
                    delete global.conns[targetStop];
                    
                    await ctx.reply({ text: `✅ Sesi Clone Bot *+${targetStop}* berhasil dimatikan.` });
                } catch (e) {
                    await ctx.reply({ text: `❌ Terjadi kesalahan saat mematikan bot: ${e.message}` });
                }
            } else {
                await ctx.reply({ text: `❌ Nomor *+${targetStop}* tidak ditemukan di dalam daftar bot aktif.` });
            }
            break;
        }
    }
};

module.exports = handler;