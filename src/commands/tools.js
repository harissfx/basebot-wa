const axios = require('axios');
const config = require('../config');

// ─────────────────────────────────────────────────────────────
//  TOOLS COMMANDS
//  Cuaca, quote, kurs, github, ipcheck, qrcode, translate, wiki, npm
//  Semua no API key
// ─────────────────────────────────────────────────────────────

const handler = async (ctx) => {
    const { command } = ctx;
    let kota, geo, loc, data, response, username, ip, text, from, to, query, pkg, result, url, sections;

    switch (command.name) {

        // ── Cuaca (Open-Meteo) ──────────────────────────────────
        case 'cuaca':
            kota = command.fullArgs || 'Jakarta';
            try {
                geo = await axios.get(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(kota)}&count=1`);
                loc = geo.data.results?.[0];
                if (!loc) return ctx.reply({ text: `❌ Kota *${kota}* tidak ditemukan.` });

                response = await axios.get(
                    `https://api.open-meteo.com/v1/forecast?latitude=${loc.latitude}&longitude=${loc.longitude}&current_weather=true`
                );
                data = response.data.current_weather;

                await ctx.reply({ text: [
                    `🌤️ *Cuaca ${loc.name}* (${loc.country || ''})`,
                    '',
                    `🌡️ Suhu: *${data.temperature}°C*`,
                    `💨 Angin: *${data.windspeed} km/j*`,
                    `🧭 Arah: *${data.winddirection}°*`,
                    `🕐 Waktu lokal: *${data.time}*`,
                ].join('\n') });
            } catch {
                await ctx.reply({ text: '❌ Gagal mengambil data cuaca.' });
            }
            break;

        // ── Quote (ZenQuotes) ───────────────────────────────────
        case 'quote':
            try {
                response = await axios.get('https://zenquotes.io/api/random');
                data = response.data?.[0];
                if (!data) return ctx.reply({ text: '❌ Gagal mengambil quote.' });
                await ctx.reply({ text: [
                    `📜 *Quote of the Day*`,
                    '',
                    `"${data.q}"`,
                    '',
                    `— *${data.a}*`
                ].join('\n') });
            } catch {
                await ctx.reply({ text: '❌ Gagal mengambil quote.' });
            }
            break;

        // ── Kurs (ExchangeRate-API) ─────────────────────────────
        case 'kurs':
            try {
                response = await axios.get('https://api.exchangerate-api.com/v4/latest/USD');
                data = response.data.rates;
                await ctx.reply({ text: [
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
                ].join('\n') });
            } catch {
                await ctx.reply({ text: '❌ Gagal mengambil data kurs.' });
            }
            break;

        // ── GitHub User Info ────────────────────────────────────
        case 'github':
            username = command.args[0];
            if (!username) return ctx.reply({ text: '❌ Contoh: !github whiskeysockets' });
            try {
                response = await axios.get(`https://api.github.com/users/${encodeURIComponent(username)}`);
                data = response.data;
                await ctx.reply({ text: [
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
                ].join('\n') });
            } catch {
                await ctx.reply({ text: `❌ User *${username}* tidak ditemukan.` });
            }
            break;

        // ── IP Check (ipapi.co) ─────────────────────────────────
        case 'ipcheck':
            ip = command.args[0] || '';
            try {
                url = ip ? `https://ipapi.co/${ip}/json/` : 'https://ipapi.co/json/';
                response = await axios.get(url);
                data = response.data;
                if (data.error) return ctx.reply({ text: `❌ ${data.reason || 'Gagal cek IP'}` });
                await ctx.reply({ text: [
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
                ].join('\n') });
            } catch {
                await ctx.reply({ text: '❌ Gagal mengecek IP.' });
            }
            break;

        // ── QR Code Generator ───────────────────────────────────
        case 'qrcode':
            text = command.fullArgs;
            if (!text) return ctx.reply({ text: '❌ Contoh: !qrcode https://google.com' });
            url = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(text)}`;
            await ctx.reply({ image: { url }, caption: `📱 QR Code untuk:\n_${text.slice(0, 100)}_` });
            break;

               // ── Translate (MyMemory) ────────────────────────────────
        case 'translate':
            // Validasi kode bahasa: 2 huruf, atau format xx|yy
            const isLangCode = (str) => /^[a-zA-Z]{2}(\|[a-zA-Z]{2})?$/.test(str);
            
            if (!command.args.length) {
                return ctx.reply({ text: [
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
                ].join('\n') });
            }
            
            if (command.args[0].includes('|')) {
                // Format custom: dari|ke
                [from, to] = command.args[0].split('|');
                text = command.args.slice(1).join(' ');
            } else if (isLangCode(command.args[0]) && command.args.length > 1) {
                // Format: ke teks
                to = command.args[0].toLowerCase();
                from = 'Autodetect';
                text = command.args.slice(1).join(' ');
            } else {
                // Format: teks (tanpa kode bahasa) → default ke Indonesia
                to = 'id';
                from = 'Autodetect';
                text = command.fullArgs;
            }
            
            if (!text) return ctx.reply({ text: '❌ Masukkan teks yang mau diterjemahkan.' });
            
            try {
                let res = await axios.get(
                    `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${from}|${to}`
                );
                
                // Fallback kalau Autodetect gagal
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
                    return ctx.reply({ text: '❌ Gagal menerjemahkan. Cek kode bahasa (contoh: id, en, ja, ko, ar).' });
                }
                
                await ctx.reply({ text: [
                    `🌐 *Translate* (${from} → ${to})`,
                    '',
                    `📝 *Asli:*\n${text}`,
                    '',
                    `✅ *Hasil:*\n${result.translatedText}`
                ].join('\n') });
            } catch (err) {
                console.error('Translate error:', err.message);
                await ctx.reply({ text: '❌ Gagal menerjemahkan.' });
            }
            break;

        // ── Wikipedia (Search + Summary with User-Agent) ──────
        case 'wiki':
            query = command.fullArgs;
            if (!query) return ctx.reply({ text: '❌ Contoh: !wiki Node.js' });
            try {
                const headers = { 'User-Agent': 'Mozilla/5.0 (compatible; WhatsAppBot/1.0; +https://github.com)' };
                
                // 1. Search dulu
                const searchRes = await axios.get(
                    `https://id.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&srlimit=1&format=json&origin=*`,
                    { headers }
                );
                const searchResults = searchRes.data?.query?.search;
                if (!searchResults || !searchResults.length) {
                    return ctx.reply({ text: `❌ Tidak ada hasil untuk *${query}* di Wikipedia.` });
                }

                // 2. Ambil summary pakai title exact dari search
                const exactTitle = searchResults[0].title;
                response = await axios.get(
                    `https://id.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(exactTitle)}`,
                    { headers }
                );
                data = response.data;

                if (data.type === 'disambiguation') {
                    await ctx.reply({ text: `🔍 *${exactTitle}* punya banyak artikel. Coba spesifikkan lebih detail.` });
                    break;
                }

                await ctx.reply({ text: [
                    `📖 *Wikipedia*`,
                    '',
                    `*${data.title}*`,
                    '',
                    data.extract || 'Tidak ada deskripsi.',
                    '',
                    `🔗 ${data.content_urls?.desktop?.page || `https://id.wikipedia.org/wiki/${encodeURIComponent(exactTitle)}`}`
                ].join('\n') });
            } catch (err) {
                console.error('Wiki error:', err.message);
                await ctx.reply({ text: `❌ Gagal mengambil artikel *${query}*.` });
            }
            break;
        // ── NPM Package Info ────────────────────────────────────
        case 'npm':
            pkg = command.args[0];
            if (!pkg) return ctx.reply({ text: '❌ Contoh: !npm axios' });
            try {
                response = await axios.get(`https://registry.npmjs.org/${encodeURIComponent(pkg)}`);
                data = response.data;
                const latest = data['dist-tags']?.latest || '-';
                const desc = data.description || '-';
                const author = data.author?.name || data.author || '-';
                const license = data.license || '-';
                const homepage = data.homepage || `https://npmjs.com/package/${pkg}`;
                await ctx.reply({ text: [
                    `📦 *NPM Package*`,
                    '',
                    `*${data.name}* @ ${latest}`,
                    `📝 ${desc}`,
                    '',
                    `👤 Author: ${author}`,
                    `📜 License: ${license}`,
                    `⬇️ Downloads: cek di npmjs.com`,
                    `🌐 ${homepage}`
                ].join('\n') });
            } catch {
                await ctx.reply({ text: `❌ Package *${pkg}* tidak ditemukan.` });
            }
            break;

    }
};

module.exports = handler;