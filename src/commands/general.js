const config = require('../config');
const { tryGetUrl } = require('../utils/remoteAsset');
const { formatUptime, getImage, formatJid } = require('../utils/helper');
const plugins = require('../utils/PluginLoader');
const { getOwnerDisplay } = require('../utils/cloneSettings');
const { getDevice } = require('baileys');
const pkg = require('../../package.json');

const handler = async (m) => {
    const { command, isSuperOwner, Hanz, msg, senderNumber, pushname, isOwner } = m;
    const p = m.prefix;
    const nomorUser = senderNumber;

    switch (command.name) {
        case 'generalmenu':
            const device = getDevice(msg.key.id);
            const generalCmds = (plugins.commandsByFile()['general'] || [])
            .filter(cmd => !['generalmenu'].includes(cmd));
            const role = isSuperOwner ? 'Super Owner' : (isOwner ? 'Co-Owner' : 'User biasa');
            let menu = `┌─❖「 𝗜𝗡𝗙𝗢 𝗨𝗦𝗘𝗥 」
│● 𝘕𝘢𝘮𝘢: ${pushname}
│● 𝘕𝘰𝘮𝘰𝘳: ${nomorUser}
│● 𝘚𝘵𝘢𝘵𝘶𝘴: ${role}
│● 𝘗𝘦𝘳𝘢𝘯𝘨𝘬𝘢𝘵: ${device}
│
└┬❖ 
┌┤𝖧𝖺𝗒 𝗄𝖺𝗄 ${pushname} 👋
│└────────────┈ ⳹
│「 𝗚𝗘𝗡𝗘𝗥𝗔𝗟 𝗠𝗘𝗡𝗨 」
│
${generalCmds.map(cmd => `│⪩ \`${p}${cmd}\``).join('\n')}
│
└────────────┈ ⳹`
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
            break;

        case 'script':
        case 'sc': {
            const text = `┌─❖
│「 Hay 👋 」
└┬❖ 「 ${pushname} 」
┌┤✑ Mau Script Free?
│└────────────┈ ⳹
│
└─「 \`MEDSOS\` 」
│X : https://x.com/HarisSfx
│IG : https://www.instagram.com/hanz_ofc66/
└┬────────────┈ ⳹
 │✑  𝐹𝑟𝑒𝑒 𝑁𝑜 𝐸𝑛𝑐
 │✑  𝑁𝑜 𝑅𝑒𝑛𝑎𝑚𝑒 𝑘𝑖𝑑𝑠
 │
 │Butuh donasi? Ketik \`${p}donate\`
 └─────────────┈ ⳹`;
            await m.sendInteractive({
                text,
                footer: config.footerTxt,
                quoted: m.fakePay,
                contextInfo: {
                    mentionedJid: ['0@s.whatsapp.net'],
                    forwardingScore: 999,
                    isForwarded: true,
                },
                buttons: [
                    { name: 'cta_url', buttonParamsJson: JSON.stringify({ display_text: 'Buka GitHub', url: 'https://github.com/harissfx/basebot-wa' }) },
                ]
            });
        }
            break;

        case 'donate':
        case 'donasi': {
            const text = `┌─❖「 𝗗𝗢𝗡𝗔𝗦𝗜 」
│ Kalau bot ini bermanfaat, boleh banget
│ traktir owner secangkir kopi ☕
└────────────┈ ⳹`;
            await m.sendInteractive({
                text,
                footer: config.footerTxt,
                quoted: m.fakePay,
                buttons: [
                    { name: 'cta_url', buttonParamsJson: JSON.stringify({ display_text: 'Donasi via Saweria', url: 'https://saweria.co/HarisSfx' }) },
                ]
            });
        }
            break;

        case 'ping':
        case 'botstatus':
        case 'statusbot': {
            const os = require('os');
            const { performance } = require('perf_hooks');
            const { formatBytes, formatUptime } = require('../utils/helper');

            const used = process.memoryUsage();
            const cpus = os.cpus().map(cpu => {
                cpu.total = Object.keys(cpu.times).reduce((last, type) => last + cpu.times[type], 0);
                return cpu;
            });
            const cpu = cpus.reduce((last, cpu, _, { length }) => {
                last.total += cpu.total;
                last.speed += cpu.speed / length;
                last.times.user += cpu.times.user;
                last.times.nice += cpu.times.nice;
                last.times.sys += cpu.times.sys;
                last.times.idle += cpu.times.idle;
                last.times.irq += cpu.times.irq;
                return last;
            }, {
                speed: 0,
                total: 0,
                times: {
                    user: 0,
                    nice: 0,
                    sys: 0,
                    idle: 0,
                    irq: 0
                }
            });

            const timestamp = performance.now();
            const processLatency = (performance.now() - timestamp).toFixed(2);
            const msgTime = msg.messageTimestamp ? Number(msg.messageTimestamp) * 1000 : null;
            const latencyStr = msgTime ? `${Math.max(0, Date.now() - msgTime)} ms (proses: ${processLatency} ms)` : `${processLatency} ms`;

            const respon = `
Kecepatan Respon: ${latencyStr}

Runtime : ${formatUptime(process.uptime())}

💻 *Info Server*
RAM: ${formatBytes(os.totalmem() - os.freemem())} / ${formatBytes(os.totalmem())}

_NodeJS Memory Usage_
${Object.keys(used).map((key, _, arr) => `${key.padEnd(Math.max(...arr.map(v => v.length)), ' ')}: ${formatBytes(used[key])}`).join('\n')}

${cpus[0] ? `_Total CPU Usage_
${cpus[0].model.trim()} (${cpu.speed.toFixed(2)} MHZ)
${Object.keys(cpu.times).map(type => `- *${(type + '*').padEnd(6)}: ${(100 * cpu.times[type] / cpu.total).toFixed(2)}%`).join('\n')}

_CPU Core(s) Usage (${cpus.length} Core CPU)_
${cpus.map((cpu, i) => `${i + 1}. ${cpu.model.trim()} (${cpu.speed} MHZ)
${Object.keys(cpu.times).map(type => `- *${(type + '*').padEnd(6)}: ${(100 * cpu.times[type] / cpu.total).toFixed(2)}%`).join('\n')}`).join('\n\n')}` : ''}
`.trim();

            await m.reply({ text: respon });
        }
            break;

        case 'about':
        case 'botinfo': {
            const totalCmds = plugins.commandList().length;
            const text = `┌─❖「 𝗔𝗕𝗢𝗨𝗧 𝗕𝗢𝗧 」
│● 𝘕𝘢𝘮𝘢 𝘉𝘰𝘵: ${config.botName}
│● 𝘖𝘸𝘯𝘦𝘳: ${getOwnerDisplay(Hanz, m.isMain).name}
│● 𝘝𝘦𝘳𝘴𝘪: ${pkg.version}
│● 𝘙𝘶𝘯𝘵𝘪𝘮𝘦: ${formatUptime(process.uptime())}
│● 𝘛𝘰𝘵𝘢𝘭 𝘊𝘰𝘮𝘮𝘢𝘯𝘥: ${totalCmds}
│● 𝘗𝘳𝘦𝘧𝘪𝘹: ${p}
│
└┬❖
┌┤ Ketik \`${p}script\` buat lihat source code & donasi
└────────────┈ ⳹`;
            await m.sendInteractive({
                text,
                footer: config.footerTxt,
                quoted: m.fakePay,
                contextInfo: {
                    mentionedJid: ['0@s.whatsapp.net'],
                    forwardingScore: 111,
                    isForwarded: true
                },
                buttons: [
                    { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: 'Kembali ke Menu', id: 'menu' }) },
                    { name: 'cta_url', buttonParamsJson: JSON.stringify({ display_text: 'GitHub Repo', url: 'https://github.com/harissfx/basebot-wa' }) },
                ]
            });
        }
            break;

        case 'profile':
        case 'myinfo': {
            const device = getDevice(msg.key.id);
            const role = isSuperOwner ? 'Super Owner' : (isOwner ? 'Co-Owner' : 'User biasa');
            const caption = `┌─❖「 𝗣𝗥𝗢𝗙𝗜𝗟 」
│● 𝘕𝘢𝘮𝘢: ${pushname}
│● 𝘕𝘰𝘮𝘰𝘳: ${nomorUser}
│● 𝘚𝘵𝘢𝘵𝘶𝘴: ${role}
│● 𝘗𝘦𝘳𝘢𝘯𝘨𝘬𝘢𝘵: ${device}
└────────────┈ ⳹`;

            const targetJid = `${nomorUser}@s.whatsapp.net`;

            let ppUrl = null;
            try {
                ppUrl = await Hanz.profilePictureUrl(targetJid, 'image');
            } catch {
                ppUrl = null;
            }

            await m.sendButtonWithImage({
                text: caption,
                footer: config.footerTxt,
                ...(ppUrl ? { imageUrl: ppUrl } : (tryGetUrl('noProfile') ? { imageUrl: tryGetUrl('noProfile') } : { imageBuffer: getImage() })),
                quoted: m.fakePay,
                buttons: [
                    { text: 'Kembali ke Menu', id: 'menu' }
                ]
            });
        }
            break;

        case 'report':
        case 'lapor': {
            const reportMsg = command.fullArgs?.trim();
            if (!reportMsg) {
                return m.reply({
                    text: `❌ Tulis dulu laporan/masukannya.\nContoh: *${p}report bug di command ping, hasilnya error*`
                });
            }

            const targets = [].concat(config.superOwner, config.coOwner)
                .filter(Boolean)
                .map(formatJid);

            if (!targets.length) return m.reply({ text: '❌ Nomor owner belum diatur.' });

            const reportText = `┌─❖「 𝗟𝗔𝗣𝗢𝗥𝗔𝗡 𝗕𝗔𝗥𝗨 」
│● 𝘕𝘢𝘮𝘢: ${pushname}
│● 𝘕𝘰𝘮𝘰𝘳: ${nomorUser}
│
└┬❖ 𝗜𝘀𝗶 𝗟𝗮𝗽𝗼𝗿𝗮𝗻
${reportMsg}`;

            let delivered = 0;
            for (const jid of targets) {
                try {
                    await Hanz.sendMessage(jid, { text: reportText });
                    delivered++;
                } catch (err) {
                    console.error('[REPORT] Gagal kirim ke', jid, '-', err.message);
                }
            }

            await m.reply({
                text: delivered > 0
                    ? '✅ Laporan kamu udah dikirim ke owner, makasih ya!'
                    : '❌ Gagal mengirim laporan, coba lagi nanti.'
            });
        }
            break;

        case 'owner': {
            const superOwners = [].concat(config.superOwner);
            if (!superOwners.length) return m.reply({ text: '❌ Nomor owner belum diatur.' });
            const contacts = superOwners.map((num, i) => ({
                vcard: `BEGIN:VCARD\nVERSION:3.0\nFN:Owner Bot${superOwners.length > 1 ? ' ' + (i + 1) : ''}\nTEL;type=CELL;type=VOICE;waid=${num}:+${num}\nEND:VCARD`
            }));
            await m.send({
                contacts: {
                    displayName: 'Owner Bot',
                    contacts
                }
            });
        }
            break;
    }
};

module.exports = handler;