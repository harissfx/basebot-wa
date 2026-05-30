const config = require('../config');

const handler = async (ctx) => {

    const { command, isOwner, isMain } = ctx;

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

            await ctx.reply({ text: `⏳ Sedang menginisialisasi sesi baru dan meminta Pairing Code untuk +${nomorTarget}...` });

            try {
                const pairingCode = await global.createNewBotInstance(nomorTarget);

                await ctx.sendInteractive({
                    text: `✅ *BERHASIL GENERATE CLONE BOT*\n\n• *Nomor Bot* : +${nomorTarget}\n• *Pairing Code* : *${pairingCode}*\n\n👉 Silakan klik tombol di bawah untuk menyalin kode pairing, lalu masukkan pada menu *Linked Devices -> Link with phone number* pada WhatsApp nomor tersebut.`,
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
                console.error("Gagal kloning bot:", error);
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