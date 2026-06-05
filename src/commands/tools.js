const axios = require('axios');
const config = require('../config');
const plugins = require('../utils/PluginLoader');
const { getDevice } = require('@whiskeysockets/baileys');

const handler = async (m) => {
    const { command, isSuperOwner, msg, senderNumber, pushname, isOwner } = m;
    let kota, geo, loc, data, response, username, ip, text, from, to, query, pkg, result, url;
    const p = config.prefix;
    const nomorUser = senderNumber;
    switch (command.name) {

        case 'toolsmenu':
            const device = getDevice(msg.key.id);
            const toolsCmds = plugins.commandsByFile()['tools'] || [];
            const role = isSuperOwner ? 'Super Owner' : (isOwner ? 'Co-Owner' : 'User');
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
                quoted: m.fakeOrder,
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
            if (!username) return m.reply({ text: '❌ Contoh: !github whiskeysockets' });
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

        case 'qrcode':
            text = command.fullArgs;
            if (!text) return m.reply({ text: '❌ Contoh: !qrcode https://google.com' });
            url = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(text)}`;
            await m.reply({ image: { url }, caption: `📱 QR Code untuk:\n_${text.slice(0, 100)}_` });
            break;

        case 'translate':

            const isLangCode = (str) => /^[a-zA-Z]{2}(\|[a-zA-Z]{2})?$/.test(str);

            if (!command.args.length) {
                return m.reply({
                    text: [
                        '❌ *Cara pakai:*',
                        '',
                        '`!translate <teks>`',
                        '  → Auto-translate ke *Bahasa Indonesia*',
                        '  Contoh: `!translate Hello world`',
                        '',
                        '`!translate <ke> <teks>`',
                        '  → Translate ke bahasa tujuan (auto-deteksi sumber)',
                        '  Contoh: `!translate en Halo dunia`',
                        '',
                        '`!translate <dari>|<ke> <teks>`',
                        '  → Translate custom',
                        '  Contoh: `!translate ja|en こんにちは`',
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
            if (!query) return m.reply({ text: '❌ Contoh: !wiki Node.js' });
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

        case 'npm':
            pkg = command.args[0];
            if (!pkg) return m.reply({ text: '❌ Contoh: !npm axios' });
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

    }
};

module.exports = handler;