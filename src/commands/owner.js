const config = require('../config');
const { formatUptime } = require('../utils/helper');

const handler = async (ctx) => {
    const { command, sock, isOwner, isSuperOwner, sender } = ctx;
    const p = config.prefix;
    // Semua command di file ini minimal butuh akses owner (super atau co)
    if (!isOwner) return ctx.reply({ text: '❌ Perintah ini khusus untuk Owner Bot!' });

    // Command khusus super owner saja
    const superOwnerOnly = ['otp'];
    if (superOwnerOnly.includes(command.name) && !isSuperOwner) {
        return ctx.reply({ text: '❌ Perintah ini hanya untuk Super Owner!' });
    }

    switch (command.name) {
        case 'ownermenu':
            let menu = `
        ╭──❍『𝑫𝒐𝒘𝒏𝒍𝒐𝒂𝒅𝒆𝒓 𝑴𝒆𝒏𝒖』
        │
        │⭔ ${p}ytmp3 [url]
        │⭔ ${p}ytmp4 [url]
        │⭔ ${p}tiktok [url]
        │⭔ ${p}twiter [url]
        │⭔ ${p}facebook [url]
        │⭔ ${p}pinterest [url]
        │⭔ ${p}instagram [url]
        │
        ╰────❍
        `
            await ctx.sendInteractive({
                text: menu,
                footer: config.botName,
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
                                rows: [{ title: "Ffmpeg Menu", description: "Select to display ffmpeg menu", id: "ffmpeg" }]
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
        case 'otp':
            const TOKEN_FILE = path.join(__dirname, '../database/token.json');

            const loadToken = () => {
                try {
                    if (fs.existsSync(TOKEN_FILE)) {
                        const data = fs.readFileSync(TOKEN_FILE, 'utf-8');
                        return JSON.parse(data).token;
                    }
                    return null;
                } catch (error) {
                    return null;
                }
            };

            const saveToken = (token) => {
                try {
                    const dir = path.dirname(TOKEN_FILE);
                    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
                    fs.writeFileSync(TOKEN_FILE, JSON.stringify({ token }));
                } catch (error) { }
            };

            const isTokenValid = (token) => {
                try {
                    const decoded = jwt.decode(token, { complete: true });
                    const exp = decoded?.payload?.exp;
                    return exp && exp > Math.floor(Date.now() / 1000) + 60;
                } catch (error) {
                    return false;
                }
            };

            const getNewToken = async () => {
                try {
                    const response = await axios.post('https://beryllium.mapclub.com/api/auth/token',
                        { platform: 'WEB' },
                        { headers: { 'Content-Type': 'application/json', 'Client-Platform': 'WEB' } }
                    );
                    const token = response.data?.data?.[0]?.accessToken;
                    if (token) {
                        saveToken(token);
                        return token;
                    }
                    return null;
                } catch (error) {
                    return null;
                }
            };

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
                const response = await axios.post(
                    'https://beryllium.mapclub.com/api/member/registration/sms/otp?channel=WHATSAPP',
                    { account: phoneNumber, prefix: '62' },
                    { headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'Client-Platform': 'WEB' } }
                );

                if (response.status === 200) {
                    await ctx.reply({ text: `✅ OTP berhasil dikirim ke ${phoneNumber}\n\n📱 Cek WhatsApp kamu untuk kode verifikasi!` });
                } else {
                    await ctx.reply({ text: `❌ Gagal mengirim OTP. Status: ${response.status}` });
                }
            } catch (error) {
                if (error.response?.status === 401) {
                    const newToken = await getNewToken();
                    if (newToken) {

                        const retryResponse = await axios.post(
                            'https://beryllium.mapclub.com/api/member/registration/sms/otp?channel=WHATSAPP',
                            { account: phoneNumber, prefix: '62' },
                            { headers: { 'Authorization': `Bearer ${newToken}`, 'Content-Type': 'application/json', 'Client-Platform': 'WEB' } }
                        );
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
        case 'getiduser':
        case 'iduser':
        case 'cekno':
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
                hasil += ` • *JID Klasik* : \`${jidKlasik}\` (Copy ini)\n`;
                hasil += ` • *LID Privasi* : \`${lid}\``;

                await ctx.reply({ text: hasil });

            } catch (error) {
                console.error("Gagal melacak nomor:", error);
                await ctx.reply({ text: `❌ Terjadi kesalahan saat memeriksa nomor tersebut.` });
            }
            break;

        case 'getidch':
        case 'idch':
        case 'cekchannel':
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
                hasil += ` • *ID Internal* : \`${jidAsli}\` (Copy ini)\n`;
                hasil += ` • *Followers* : ${totalPengikut} pengikut\n`;
                hasil += ` • *Deskripsi* : ${deskripsi}`;

                await ctx.reply({ text: hasil });

            } catch (error) {
                console.error("Gagal melacak channel:", error);
                await ctx.reply({
                    text: `❌ *Gagal Mendapatkan Data!*\n\nPastikan link channel valid, publik, dan bot sedang tidak terkena limit query.`
                });
            }
            break;
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