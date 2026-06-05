const config = require('../config');
const path = require('path');
const { formatUptime } = require('../utils/helper');
const { getDevice } = require('@whiskeysockets/baileys');
const { loadToken, isTokenValid, getNewToken, sendOtp } = require('../../lib/otp');

const handler = async (ctx) => {
    const { command, sock, isOwner, isSuperOwner, msg, pushname, isGroup } = ctx;
    const p = config.prefix;
    if (!isOwner) return ctx.reply({ text: '❌ Perintah ini khusus untuk Owner Bot!' });

    const superOwnerOnly = [''];
    if (superOwnerOnly.includes(command.name) && !isSuperOwner) {
        return ctx.reply({ text: '❌ Perintah ini hanya untuk Super Owner!' });
    }

    switch (command.name) {
        case 'ownermenu':
            const device = getDevice(msg.key.id);
            const role = isSuperOwner ? 'Super Owner 👑' : (isOwner ? 'Co-Owner 👥' : 'User 👤');
            const chatType = isGroup ? 'Grup 👥' : 'Pribadi 💬';
            const time = new Date().toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit' }) + ' WIB';
            let menu = `┌─❖「 𝗜𝗡𝗙𝗢 𝗨𝗦𝗘𝗥 」
│● 𝘕𝘢𝘮𝘢: ${pushname}
│● 𝘚𝘵𝘢𝘵𝘶𝘴: ${role}
│● 𝘗𝘦𝘳𝘢𝘯𝘨𝘬𝘢𝘵: ${device} 📱
│● 𝘛𝘪𝘱𝒆 𝘊𝘩𝘢𝘵: ${chatType}
│● 𝘞𝘢𝘬𝘵𝘶: ${time}
│
└┬❖ 
┌┤𝖧𝖺𝗒 𝗄𝖺𝗄 ${pushname} 👋
│└────────────┈ ⳹
│「 𝗢𝗪𝗡𝗘𝗥 𝗠𝗘𝗡𝗨 」
│
│⪩ \`${p}𝗈𝗍𝗉 (𝗇𝗈𝗆𝗈𝗋)\`
│⪩ \`${p}𝗀𝖾𝗍𝗂𝖽𝗎𝗌𝖾𝗋 (𝗇𝗈𝗆𝗈𝗋)\`
│⪩ \`${p}𝗀𝖾𝗍𝗂𝖽𝖼𝗁 (𝗅𝗂𝗇𝗄-𝖼𝗁𝖺𝗇𝗇𝖾𝗅)\`
│⪩ \`${p}𝗂𝗇𝖿𝗈\`
│
└────────────┈ ⳹`
            await ctx.sendInteractive({
                text: menu,
                footer: config.footerTxt,
                quoted: ctx.fakeOrder,
                contextInfo: {
                    mentionedJid: ["0@s.whatsapp.net"],
                    forwardingScore: 111,
                    isForwarded: true
                },
                buttons: [
                    { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: 'Kembali ke Menu', id: 'menu' }) },
                    {
                        name: 'single_select', buttonParamsJson: JSON.stringify({
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
                                rows: [{ title: "Group Menu", description: "Select to display group menu ", id: "groupmenu" }]
                            },]
                        })
                    }]
            });
            break;

        case 'otp': {
            const input = ctx.command?.args?.[0] || ctx.text || '';
            const phoneNumber = input.replace(/[^0-9]/g, '');

            if (!phoneNumber || phoneNumber.length < 10) {
                await ctx.reply({ text: '📞 Penggunaan: *otp 628xxxxxxxxxx*' });
                break;
            }

            await ctx.reply({ text: `⏳ Mengirim OTP ke ${phoneNumber}...` });

            let token = loadToken();
            if (!token || !isTokenValid(token)) {
                token = await getNewToken();
                if (!token) {
                    await ctx.reply({ text: '❌ Gagal mendapatkan token' });
                    break;
                }
            }

            try {
                const response = await sendOtp(phoneNumber, token);
                if (response.status === 200) {
                    await ctx.reply({ text: `✅ OTP berhasil dikirim ke ${phoneNumber}\n\n📱 Cek WhatsApp kamu untuk kode verifikasi!` });
                } else {
                    await ctx.reply({ text: `❌ Gagal mengirim OTP. Status: ${response.status}` });
                }
            } catch (error) {
                if (error.response?.status === 401) {
                    const newToken = await getNewToken();
                    if (newToken) {
                        const retryResponse = await sendOtp(phoneNumber, newToken);
                        if (retryResponse.status === 200) {
                            await ctx.reply({ text: `✅ OTP berhasil dikirim ke ${phoneNumber}` });
                        } else {
                            await ctx.reply({ text: '❌ Gagal mengirim OTP setelah refresh token' });
                        }
                    } else {
                        await ctx.reply({ text: '❌ Token expired dan gagal refresh' });
                    }
                } else {
                    await ctx.reply({ text: '❌ Terjadi kesalahan, coba lagi nanti' });
                }
            }
            break;
        }

        case 'getiduser':
        case 'iduser':
        case 'cekno': {
            let nomorInput = command.fullArgs.replace(/\D/g, '');

            if (!nomorInput) {
                return ctx.reply({
                    text: `❌ *Format Salah!*\n\nFormat: \`${p}getiduser <nomor-hp>\`\nContoh: \`${p}getiduser 085706035039\` atau \`${p}getiduser 6285706035039\``
                });
            }

            if (nomorInput.startsWith('0')) {
                nomorInput = '62' + nomorInput.slice(1);
            }

            try {
                const [result] = await sock.onWhatsApp(nomorInput);

                if (!result || !result.exists) {
                    return ctx.reply({ text: `❌ Nomor *${nomorInput}* tidak terdaftar di WhatsApp.` });
                }

                const jidKlasik = result.jid;
                const lid = result.lid || "Tidak tersedia";

                let hasil = `🔍 *DATA USER WHATSAPP* 🔍\n\n`;
                hasil += ` • *Nomor Asli* : +${nomorInput}\n`;
                hasil += ` • *JID Klasik* : \`${jidKlasik}\`\n`;
                hasil += ` • *LID Privasi* : \`${lid}\``;

                await ctx.sendInteractive({
                    text: hasil,
                    footer: config.footerTxt,
                    quoted: ctx.msg,
                    buttons: [
                        { name: 'cta_copy', buttonParamsJson: JSON.stringify({ display_text: '📋 Copy JID Klasik', copy_code: jidKlasik }) },
                        { name: 'cta_copy', buttonParamsJson: JSON.stringify({ display_text: '📋 Copy LID', copy_code: lid }) },
                    ]
                });
            } catch (error) {
                console.error("Gagal melacak nomor:", error);
                await ctx.reply({ text: `❌ Terjadi kesalahan saat memeriksa nomor tersebut.` });
            }
            break;
        }

        case 'getidch':
        case 'idch':
        case 'cekchannel': {
            const textInput = command.fullArgs;
            const channelRegex = /whatsapp\.com\/channel\/([a-zA-Z0-9]+)/i;

            if (!textInput || !channelRegex.test(textInput)) {
                return ctx.reply({
                    text: `❌ *Format Salah!*\n\nFormat: \`${p}getidch <link-channel>\`\nContoh: \`${p}getidch https://whatsapp.com/channel/0029VaXXXXX\``
                });
            }

            const match = textInput.match(channelRegex);
            const inviteCode = match[1];

            try {
                const metadata = await sock.newsletterMetadata("invite", inviteCode);
                const jidAsli = metadata.id;
                const metaDataThread = metadata.thread_metadata || {};
                const namaChannel = metaDataThread.name?.text || "Tidak diketahui";
                const totalPengikut = metaDataThread.subscribers_count || "0";
                const deskripsi = metaDataThread.description?.text || "Tidak ada deskripsi.";

                let hasil = `🔍 *DATA WHATSAPP CHANNEL* 🔍\n\n`;
                hasil += ` • *Nama Channel* : ${namaChannel}\n`;
                hasil += ` • *ID Internal* : \`${jidAsli}\`\n`;
                hasil += ` • *Followers* : ${totalPengikut} pengikut\n`;
                hasil += ` • *Deskripsi* : ${deskripsi}`;

                await ctx.sendInteractive({
                    text: hasil,
                    footer: config.footerTxt,
                    quoted: ctx.msg,
                    buttons: [
                        { name: 'cta_copy', buttonParamsJson: JSON.stringify({ display_text: '📋 Copy ID Channel', copy_code: jidAsli }) },
                    ]
                });
            } catch (error) {
                console.error("Gagal melacak channel:", error);
                await ctx.reply({
                    text: `❌ *Gagal Mendapatkan Data!*\n\nPastikan link channel valid, publik, dan bot sedang tidak terkena limit query.`
                });
            }
            break;
        }

        case 'setmode':
        case 'mode': {
            if (!isSuperOwner) return ctx.reply({ text: '❌ Perintah ini hanya untuk Super Owner!' });

            const modeInput = command.fullArgs.trim().toLowerCase();

            if (!['public', 'self'].includes(modeInput)) {
                return ctx.sendInteractive({
                    text: `⚙️ *MODE BOT SAAT INI:* ${(global.botMode || config.botMode).toUpperCase()}

` +
                        `• *public* → semua orang bisa pakai bot
` +
                        `• *self* → hanya owner yang bisa pakai bot`,
                    footer: config.footerTxt,
                    quoted: ctx.msg,
                    buttons: [
                        { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '🌐 Set Public', id: 'setmode public' }) },
                        { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '🔒 Set Self', id: 'setmode self' }) },
                    ]
                });
            }

            if (modeInput === (global.botMode || config.botMode)) {
                return ctx.reply({ text: `ℹ️ Mode bot sudah dalam mode *${modeInput.toUpperCase()}*.` });
            }

            // Update langsung di memori — efek instan tanpa restart
            global.botMode = modeInput;

            // Simpan ke config.js supaya tetap setelah restart
            try {
                const configPath = require('path').join(__dirname, '..', 'config.js');
                let configFile = require('fs').readFileSync(configPath, 'utf8');
                configFile = configFile.replace(/botMode:\s*'(public|self)'/, `botMode: '${modeInput}'`);
                require('fs').writeFileSync(configPath, configFile, 'utf8');
            } catch (e) { }

            await ctx.reply({
                text: `✅ Mode bot berhasil diubah ke *${modeInput.toUpperCase()}*!\n\n` +
                    `${modeInput === 'self' ? '🔒 Sekarang hanya owner yang bisa pakai bot.' : '🌐 Sekarang semua orang bisa pakai bot.'}`
            });
                        break;
        }

        case 'info': {
            const u = process.uptime();
            const h = Math.floor(u / 3600);
            const m = Math.floor((u % 3600) / 60);
            const s = Math.floor(u % 60);
            await ctx.send({
                text: [
                    '╔═══ *Bot Info* ═══╗',
                    `║ 🤖 *Nama:* ${config.botName}`,
                    `║ 👤 *Owner:* ${[].concat(config.superOwner).join(', ')}`,
                    `║ ⚙️ *Prefix:* ${config.prefix}`,
                    `║ 🔄 *Uptime:* ${h}j ${m}m ${s}d`,
                    `║ 📦 *Node:* ${process.version}`,
                    `║ 🖥️ *Platform:* ${process.platform}`,
                    '╚════════════════════╝',
                ].join('\n')
            });
            break;
        }

    }
};

module.exports = handler;