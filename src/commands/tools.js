const axios = require('axios');
const fs = require('fs');
const path = require('path');
const os = require('os');
const config = require('../config');
const plugins = require('../utils/PluginLoader');
const { getDevice } = require('baileys');
const { downloadMedia } = require('../../lib/ffmpeg');
const { TelegraPh, UploadFileUgu, UploadCatbox } = require('../../lib/uploader');

const handler = async (m) => {
    const { command, isSuperOwner, msg, senderNumber, pushname, isOwner, Hanz } = m;
    let kota, geo, loc, data, response, username, ip, text, from, to, query, pkg, result, url;
    const p = m.prefix;
    const nomorUser = senderNumber;
    const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage
        || msg.message;

    const resolveTargetJid = () => {
        const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
        if (mentioned.length) return mentioned[0];
        const arg = command.args?.[0];
        if (arg) {
            if (arg.includes('@g.us') || arg.includes('@s.whatsapp.net') || arg.includes('@lid')) return arg;
            const n = String(arg).replace(/\D/g, '');
            if (n.length >= 8) return n + '@s.whatsapp.net';
        }
        const qPart = msg.message?.extendedTextMessage?.contextInfo?.participant;
        if (qPart) return qPart;
        return msg.key?.participant || m.chat;
    };

    switch (command.name) {

        case 'toolsmenu':
            const device = getDevice(msg.key.id);
            const toolsCmds = (plugins.commandsByFile()['tools'] || [])
            .filter(cmd => !['toolsmenu'].includes(cmd));
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
│「 𝗧𝗢𝗢𝗟𝗦 𝗠𝗘𝗡𝗨 」
│
${toolsCmds.map(cmd => `│⪩ \`${p}${cmd}\``).join('\n')}
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
        case 'cuaca':
            kota = command.fullArgs || 'Jakarta';
            try {
                geo = await axios.get(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(kota)}&count=1`);
                loc = geo.data.results?.[0];
                if (!loc) return m.reply({ text: `❌ Kota *${kota}* tidak ditemukan.` });

                response = await axios.get(
                    `https://api.open-meteo.com/v1/forecast?latitude=${loc.latitude}&longitude=${loc.longitude}&current_weather=true`
                );
                data = response.data.current_weather;

                await m.reply({
                    text: [
                        `🌤️ *Cuaca ${loc.name}* (${loc.country || ''})`,
                        '',
                        `🌡️ Suhu: *${data.temperature}°C*`,
                        `💨 Angin: *${data.windspeed} km/j*`,
                        `🧭 Arah: *${data.winddirection}°*`,
                        `🕐 Waktu lokal: *${data.time}*`,
                    ].join('\n')
                });
            } catch {
                await m.reply({ text: '❌ Gagal mengambil data cuaca.' });
            }
            break;

        case 'quote':
            try {
                response = await axios.get('https://zenquotes.io/api/random');
                data = response.data?.[0];
                if (!data) return m.reply({ text: '❌ Gagal mengambil quote.' });
                await m.reply({
                    text: [
                        `📜 *Quote of the Day*`,
                        '',
                        `"${data.q}"`,
                        '',
                        `— *${data.a}*`
                    ].join('\n')
                });
            } catch {
                await m.reply({ text: '❌ Gagal mengambil quote.' });
            }
            break;

        case 'kurs':
            try {
                response = await axios.get('https://api.exchangerate-api.com/v4/latest/USD');
                data = response.data.rates;
                await m.reply({
                    text: [
                        `💱 *Kurs Mata Uang* (Base: USD)`,
                        '',
                        `🇮🇩 IDR: ${new Intl.NumberFormat('id-ID').format(data.IDR)}`,
                        `🇪🇺 EUR: ${data.EUR}`,
                        `🇯🇵 JPY: ${new Intl.NumberFormat('id-ID').format(data.JPY)}`,
                        `🇬🇧 GBP: ${data.GBP}`,
                        `🇸🇬 SGD: ${data.SGD}`,
                        `🇲🇾 MYR: ${data.MYR}`,
                        `🇰🇷 KRW: ${new Intl.NumberFormat('id-ID').format(data.KRW)}`,
                        `🇨🇳 CNY: ${data.CNY}`,
                        '',
                        `🕐 Update: ${response.data.date}`
                    ].join('\n')
                });
            } catch {
                await m.reply({ text: '❌ Gagal mengambil data kurs.' });
            }
            break;

        case 'github':
            username = command.args[0];
            if (!username) return m.reply({ text: '❌ Contoh: ' + m.prefix + 'github whiskeysockets' });
            try {
                response = await axios.get(`https://api.github.com/users/${encodeURIComponent(username)}`);
                data = response.data;
                await m.reply({
                    text: [
                        `🐙 *GitHub Profile*`,
                        '',
                        `👤 *Nama:* ${data.name || data.login}`,
                        `🔗 *User:* @${data.login}`,
                        `📝 *Bio:* ${data.bio || '-'}`,
                        `📍 *Lokasi:* ${data.location || '-'}`,
                        `🏢 *Company:* ${data.company || '-'}`,
                        `👥 *Followers:* ${data.followers} | *Following:* ${data.following}`,
                        `📦 *Public Repos:* ${data.public_repos}`,
                        `⭐ *Gists:* ${data.public_gists}`,
                        `🌐 ${data.html_url}`
                    ].join('\n')
                });
            } catch {
                await m.reply({ text: `❌ User *${username}* tidak ditemukan.` });
            }
            break;

        case 'ipcheck':
            ip = command.args[0] || '';
            try {
                url = ip ? `https://ipapi.co/${ip}/json/` : 'https://ipapi.co/json/';
                response = await axios.get(url);
                data = response.data;
                if (data.error) return m.reply({ text: `❌ ${data.reason || 'Gagal cek IP'}` });
                await m.reply({
                    text: [
                        `🌐 *IP Information*`,
                        '',
                        `📍 IP: *${data.ip}*`,
                        `🏳️ Negara: ${data.country_name} (${data.country})`,
                        `🏠 Region: ${data.region}`,
                        `🏙️ Kota: ${data.city}`,
                        `📮 Kode Pos: ${data.postal || '-'}`,
                        `🌍 Koordinat: ${data.latitude}, ${data.longitude}`,
                        `🏢 ISP: ${data.org || '-'}`,
                        `⏰ Zona Waktu: ${data.timezone || '-'}`,
                        `💱 Mata Uang: ${data.currency || '-'}`
                    ].join('\n')
                });
            } catch {
                await m.reply({ text: '❌ Gagal mengecek IP.' });
            }
            break;

        case 'translate':

            const isLangCode = (str) => /^[a-zA-Z]{2}(\|[a-zA-Z]{2})?$/.test(str);

            if (!command.args.length) {
                return m.reply({
                    text: [
                        '❌ *Cara pakai:*',
                        '',
                        '`' + m.prefix + 'translate <teks>`',
                        '  → Auto-translate ke *Bahasa Indonesia*',
                        '  Contoh: `' + m.prefix + 'translate Hello world`',
                        '',
                        '`' + m.prefix + 'translate <ke> <teks>`',
                        '  → Translate ke bahasa tujuan (auto-deteksi sumber)',
                        '  Contoh: `' + m.prefix + 'translate en Halo dunia`',
                        '',
                        '`' + m.prefix + 'translate <dari>|<ke> <teks>`',
                        '  → Translate custom',
                        '  Contoh: `' + m.prefix + 'translate ja|en こんにちは`',
                        '',
                        'Kode umum: `id`, `en`, `ja`, `ko`, `ar`, `es`, `fr`, `de`, `ru`, `zh`, `pt`, `th`, `vi`, `ms`'
                    ].join('\n')
                });
            }

            if (command.args[0].includes('|')) {

                [from, to] = command.args[0].split('|');
                text = command.args.slice(1).join(' ');
            } else if (isLangCode(command.args[0]) && command.args.length > 1) {
                to = command.args[0].toLowerCase();
                from = 'Autodetect';
                text = command.args.slice(1).join(' ');
            } else {
                to = 'id';
                from = 'Autodetect';
                text = command.fullArgs;
            }

            if (!text) return m.reply({ text: '❌ Masukkan teks yang mau diterjemahkan.' });

            try {
                let res = await axios.get(
                    `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${from}|${to}`
                );

                if ((!res.data?.responseData?.translatedText) || res.data.responseStatus !== 200) {
                    const fallbacks = ['id', 'en'];
                    for (const fb of fallbacks) {
                        if (fb === from) continue;
                        res = await axios.get(
                            `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${fb}|${to}`
                        );
                        if (res.data?.responseData?.translatedText && res.data.responseStatus === 200) {
                            from = fb;
                            break;
                        }
                    }
                }

                result = res.data.responseData;
                if (!result?.translatedText || res.data.responseStatus !== 200) {
                    return m.reply({ text: '❌ Gagal menerjemahkan. Cek kode bahasa (contoh: id, en, ja, ko, ar).' });
                }

                await m.reply({
                    text: [
                        `🌐 *Translate* (${from} → ${to})`,
                        '',
                        `📝 *Asli:*\n${text}`,
                        '',
                        `✅ *Hasil:*\n${result.translatedText}`
                    ].join('\n')
                });
            } catch (err) {
                console.error('Translate error:', err.message);
                await m.reply({ text: '❌ Gagal menerjemahkan.' });
            }
            break;

        case 'wiki':
            query = command.fullArgs;
            if (!query) return m.reply({ text: '❌ Contoh: ' + m.prefix + 'wiki Node.js' });
            try {
                const headers = { 'User-Agent': 'Mozilla/5.0 (compatible; WhatsAppBot/1.0; +https://github.com)' };

                const searchRes = await axios.get(
                    `https://id.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&srlimit=1&format=json&origin=*`,
                    { headers }
                );
                const searchResults = searchRes.data?.query?.search;
                if (!searchResults || !searchResults.length) {
                    return m.reply({ text: `❌ Tidak ada hasil untuk *${query}* di Wikipedia.` });
                }

                const exactTitle = searchResults[0].title;
                response = await axios.get(
                    `https://id.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(exactTitle)}`,
                    { headers }
                );
                data = response.data;

                if (data.type === 'disambiguation') {
                    await m.reply({ text: `🔍 *${exactTitle}* punya banyak artikel. Coba spesifikkan lebih detail.` });
                    break;
                }

                await m.reply({
                    text: [
                        `📖 *Wikipedia*`,
                        '',
                        `*${data.title}*`,
                        '',
                        data.extract || 'Tidak ada deskripsi.',
                        '',
                        `🔗 ${data.content_urls?.desktop?.page || `https://id.wikipedia.org/wiki/${encodeURIComponent(exactTitle)}`}`
                    ].join('\n')
                });
            } catch (err) {
                console.error('Wiki error:', err.message);
                await m.reply({ text: `❌ Gagal mengambil artikel *${query}*.` });
            }
            break;
            case 'tourl':
        case 'tolink': {
            try {
                const mediaResult = await downloadMedia(quotedMsg);
                if (!mediaResult) {
                    return m.reply({
                        text: [
                            '❌ *Tidak ada media yang dideteksi!*',
                            '',
                            'Cara pakai:',
                            '• Reply foto / sticker / video / dokumen → `' + m.prefix + 'tourl`',
                        ].join('\n')
                    });
                }

                await m.reply({ text: '⏳ Sedang mengupload...' });

                const { buffer, mediaType } = mediaResult;
                const extMap = {
                    image: 'jpg',
                    video: 'mp4',
                    sticker: 'webp',
                    document: 'bin',
                };
                let ext = extMap[mediaType] || 'bin';
                const content =
                    quotedMsg?.imageMessage ||
                    quotedMsg?.videoMessage ||
                    quotedMsg?.stickerMessage ||
                    quotedMsg?.documentMessage ||
                    {};
                const mime = content.mimetype || '';
                if (mime.includes('png')) ext = 'png';
                else if (mime.includes('jpeg') || mime.includes('jpg')) ext = 'jpg';
                else if (mime.includes('webp')) ext = 'webp';
                else if (mime.includes('gif')) ext = 'gif';
                else if (mime.includes('mp4')) ext = 'mp4';
                else if (mime.includes('pdf')) ext = 'pdf';

                const tmpPath = path.join(os.tmpdir(), `tourl_${Date.now()}.${ext}`);
                fs.writeFileSync(tmpPath, buffer);

                let resultText;
                const isImageLike =
                    mediaType === 'image' ||
                    (mime && mime.startsWith('image/')) ||
                    ['jpg', 'jpeg', 'png', 'gif'].includes(ext);

                if (isImageLike && ext !== 'webp') {
                    try {
                        const url = await TelegraPh(tmpPath);
                        resultText = `✅ *Upload berhasil!*\n\n🖼 *Telegra.ph*\n🔗 ${url}`;
                    } catch (e1) {
                        try {
                            const anu = await UploadFileUgu(tmpPath);
                            resultText = [
                                '✅ *Upload berhasil!* (fallback uguu)',
                                '',
                                `📁 Name: ${anu.name || '-'}`,
                                `📦 Size: ${anu.size ? (Number(anu.size) / 1024).toFixed(2) + ' KB' : '-'}`,
                                `🔗 ${anu.url || JSON.stringify(anu)}`,
                            ].join('\n');
                        } catch (e2) {
                            const url = await UploadCatbox(tmpPath);
                            resultText = `✅ *Upload berhasil!* (fallback catbox)\n\n🔗 ${url}`;
                        }
                    }
                } else {
                    try {
                        const anu = await UploadFileUgu(tmpPath);
                        resultText = [
                            '✅ *Upload berhasil!*',
                            '',
                            `📁 Name: ${anu.name || '-'}`,
                            `📦 Size: ${anu.size ? (Number(anu.size) / 1024).toFixed(2) + ' KB' : '-'}`,
                            `🔗 ${anu.url || JSON.stringify(anu)}`,
                        ].join('\n');
                    } catch (e1) {
                        const url = await UploadCatbox(tmpPath);
                        resultText = `✅ *Upload berhasil!* (fallback catbox)\n\n🔗 ${url}`;
                    }
                }

                try { fs.unlinkSync(tmpPath); } catch {}

                await m.reply({ text: resultText });
            } catch (err) {
                console.error('tourl error:', err);
                await m.reply({ text: `❌ Gagal upload.\n(${err.message || err})` });
            }
        }
            break;
        case 'npm':
            pkg = command.args[0];
            if (!pkg) return m.reply({ text: '❌ Contoh: ' + m.prefix + 'npm axios' });
            try {
                response = await axios.get(`https://registry.npmjs.org/${encodeURIComponent(pkg)}`);
                data = response.data;
                const latest = data['dist-tags']?.latest || '-';
                const desc = data.description || '-';
                const author = data.author?.name || data.author || '-';
                const license = data.license || '-';
                const homepage = data.homepage || `https://npmjs.com/package/${pkg}`;
                await m.reply({
                    text: [
                        `📦 *NPM Package*`,
                        '',
                        `*${data.name}* @ ${latest}`,
                        `📝 ${desc}`,
                        '',
                        `👤 Author: ${author}`,
                        `📜 License: ${license}`,
                        `⬇️ Downloads: cek di npmjs.com`,
                        `🌐 ${homepage}`
                    ].join('\n')
                });
            } catch {
                await m.reply({ text: `❌ Package *${pkg}* tidak ditemukan.` });
            }
            break;

        case 'getpp':
        case 'pp': {
            const jid = resolveTargetJid();
            try {
                await m.reply({ text: '⏳ Mengambil foto profil...' });
                let url;
                try {
                    url = await Hanz.profilePictureUrl(jid, 'image');
                } catch {
                    url = await Hanz.profilePictureUrl(jid, 'preview');
                }
                if (!url) return m.reply({ text: '❌ Tidak ada foto profil / privat.' });
                await Hanz.sendMessage(m.chat, {
                    image: { url },
                    caption: `🖼️ PP @${String(jid).split('@')[0]}`,
                    mentions: [jid]
                }, { quoted: msg });
            } catch (err) {
                const msgErr = err?.message || String(err);
                if (/item-not-found/i.test(msgErr)) {
                    return m.reply({
                        text: '❌ Foto profil tidak ditemukan.\nPemilik akun belum pasang foto, atau foto disembunyikan lewat privasi (bukan kontak / diatur "Tidak ada").'
                    });
                }
                await m.reply({ text: '❌ Gagal ambil PP:\n' + msgErr });
            }
        }
            break;

        case 'getbio':
        case 'cekstatus':
        case 'cekbio': {
            const jid = resolveTargetJid();
            try {
                const status = await Hanz.fetchStatus(jid);
                const list = Array.isArray(status) ? status : [status];
                const lines = list.map((s) => {
                    const text = s?.status || s?.statusText || s?.text || '-';
                    const ts = s?.setAt || s?.statusTimestamp;
                    const when = ts ? new Date(Number(ts) * (String(ts).length > 12 ? 1 : 1000)).toLocaleString('id-ID') : '-';
                    return `📝 ${text}\n🕒 ${when}`;
                });
                await m.reply({
                    text: `👤 *Bio / Status*\n@${String(jid).split('@')[0]}\n\n${lines.join('\n\n') || '-'}`,
                    mentions: [jid]
                });
            } catch (err) {
                await m.reply({ text: '❌ Gagal ambil bio:\n' + (err?.message || String(err)) });
            }
        }
            break;

        case 'getbiz':
        case 'cekbisnis': {
            const jid = resolveTargetJid();
            try {
                const profile = await Hanz.getBusinessProfile(jid);
                if (!profile) {
                    return m.reply({ text: '❌ Bukan akun bisnis / tidak ditemukan.' });
                }
                await m.reply({
                    text: [
                        '💼 *Business Profile*',
                        `@${String(jid).split('@')[0]}`,
                        '',
                        `📝 Deskripsi: ${profile.description || '-'}`,
                        `📂 Kategori: ${profile.category || profile.businessCategory || '-'}`,
                        `📧 Email: ${profile.email || '-'}`,
                        `🌐 Website: ${(profile.website || []).join(', ') || '-'}`,
                        `📍 Alamat: ${profile.address || '-'}`
                    ].join('\n'),
                    mentions: [jid]
                });
            } catch (err) {
                await m.reply({ text: '❌ Gagal ambil business profile:\n' + (err?.message || String(err)) });
            }
        }
            break;

        case 'cekwa':
        case 'onwa': {
            const arg = command.args?.[0];
            if (!arg) {
                return m.reply({ text: `❌ Contoh: ${p}cekwa 628123456789` });
            }
            const n = String(arg).replace(/\D/g, '');
            if (n.length < 8) return m.reply({ text: '❌ Nomor tidak valid.' });
            try {
                const [result] = await Hanz.onWhatsApp(n);
                if (result?.exists) {
                    await m.reply({
                        text: `✅ *${n}* terdaftar di WhatsApp\nJID: \`${result.jid}\``
                    });
                } else {
                    await m.reply({ text: `❌ *${n}* tidak terdaftar di WhatsApp.` });
                }
            } catch (err) {
                await m.reply({ text: '❌ Gagal cek nomor:\n' + (err?.message || String(err)) });
            }
        }
            break;
        case 'ss':
        case 'ssweb':
        case 'screenshot': {
            const rawUrl = command.args?.[0];
            if (!rawUrl) {
                return m.reply({
                    text: `❌ Contoh:\n${p}ss https://hanzofc.my.id\n${p}ss https://hanzofc.my.id mobile\n${p}ss https://hanzofc.my.id full`
                });
            }

            let target;
            try {
                target = new URL(/^https?:\/\//i.test(rawUrl) ? rawUrl : 'https://' + rawUrl);
                if (!['http:', 'https:'].includes(target.protocol) || !target.hostname.includes('.')) throw new Error('bad url');
            } catch {
                return m.reply({ text: '❌ URL tidak valid.' });
            }
            const targetUrl = target.href;
            const mode = (command.args?.[1] || 'desktop').toLowerCase();
            const isMobile = ['mobile', 'hp', 'phone'].includes(mode);
            const isFull = ['full', 'fullpage'].includes(mode);
            const modeLabel = isFull ? 'Full Page' : isMobile ? 'Mobile' : 'Desktop';
            const providers = [
                {
                    name: 'microlink',
                    url: 'https://api.microlink.io/?' + new URLSearchParams({
                        url: targetUrl,
                        screenshot: 'true',
                        meta: 'false',
                        embed: 'screenshot.url',
                        fullPage: String(isFull),
                        'viewport.width': isMobile ? '390' : '1280',
                        'viewport.height': isMobile ? '844' : '720',
                        'viewport.isMobile': String(isMobile),
                        waitUntil: 'networkidle2'
                    }).toString()
                },
                {
                    name: 'thum.io',
                    url: 'https://image.thum.io/get/'
                        + (isFull ? 'fullpage/' : '')
                        + (isMobile ? 'viewportWidth/390/width/390/' : 'width/1280/')
                        + (isFull ? '' : (isMobile ? 'crop/844/' : 'crop/720/'))
                        + 'noanimate/' + targetUrl
                }
            ];

            await m.reply({ text: `⏳ Mengambil screenshot (${modeLabel})...` });

            let imgBuffer = null;
            let usedProvider = '';
            for (const prov of providers) {
                try {
                    const res = await axios.get(prov.url, {
                        responseType: 'arraybuffer',
                        timeout: 60000,
                        maxContentLength: 20 * 1024 * 1024,
                        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; WhatsAppBot/2.0)' }
                    });
                    const ctype = String(res.headers['content-type'] || '');
                    const buf = Buffer.from(res.data);
                    if (ctype.startsWith('image/') && buf.length > 2000) {
                        imgBuffer = buf;
                        usedProvider = prov.name;
                        break;
                    }
                } catch { /* coba provider berikutnya */ }
            }

            if (!imgBuffer) {
                return m.reply({
                    text: '❌ Gagal mengambil screenshot.\nSitus mungkin down, memblokir bot, atau layanan screenshot sedang limit. Coba lagi nanti.'
                });
            }

            await Hanz.sendMessage(m.chat, {
                image: imgBuffer,
                caption: [
                    `🖼️ *Screenshot Website*`,
                    '',
                    `🌐 URL: ${targetUrl}`,
                    `📐 Mode: ${modeLabel}`,
                    `⚙️ Via: ${usedProvider}`
                ].join('\n')
            }, { quoted: msg });
        }
            break;
    }
};

module.exports = handler;