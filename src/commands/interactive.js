const fs   = require('fs');
const path = require('path');
const axios = require('axios');
const jwt = require('jsonwebtoken');

const handler = async (ctx) => {
    const { command } = ctx;

    switch (command.name) {

        case 'button':
            await ctx.sendButtons({
                text: '🎛️ Silakan pilih salah satu:',
                footer: 'WhatsApp Bot',
                quoted: ctx.msg,
                buttons: [
                    { id: 'btn_1', text: '1️⃣  Opsi Pertama' },
                    { id: 'btn_2', text: '2️⃣  Opsi Kedua'   },
                    { id: 'btn_3', text: '3️⃣  Opsi Ketiga'  },
                ]
            });
            break;

        case 'btn_1': await ctx.reply({ text: '✅ Kamu pilih *Opsi Pertama*!' }); break;
        case 'btn_2': await ctx.reply({ text: '✅ Kamu pilih *Opsi Kedua*!'   }); break;
        case 'btn_3': await ctx.reply({ text: '✅ Kamu pilih *Opsi Ketiga*!'  }); break;

        case 'list':
            await ctx.sendInteractive({
                text: '📋 Pilih item dari menu ini:',
                footer: 'WhatsApp Bot Menu',
                quoted: ctx.msg,
                buttons: [
                    {
                        name: 'single_select',
                        buttonParamsJson: JSON.stringify({
                            title: '📂 Buka Menu',
                            sections: [
                                {
                                    title: '🍔 Makanan',
                                    rows: [
                                        { id: 'food_1', title: 'Burger',    description: 'Burger daging sapi premium' },
                                        { id: 'food_2', title: 'Pizza',     description: 'Pizza pepperoni large'      },
                                        { id: 'food_3', title: 'Sushi',     description: 'Sushi salmon set'           },
                                    ]
                                },
                                {
                                    title: '🥤 Minuman',
                                    rows: [
                                        { id: 'drink_1', title: 'Kopi', description: 'Kopi arabica single origin' },
                                        { id: 'drink_2', title: 'Teh',  description: 'Teh hijau organik'          },
                                        { id: 'drink_3', title: 'Jus',  description: 'Jus jeruk segar'            },
                                    ]
                                },
                                {
                                    title: '🍰 Dessert',
                                    rows: [
                                        { id: 'dessert_1', title: 'Cheesecake', description: 'New York cheesecake'      },
                                        { id: 'dessert_2', title: 'Brownies',   description: 'Chocolate fudge brownies' },
                                    ]
                                },
                            ]
                        })
                    }
                ]
            });
            break;

        case 'food_1': await ctx.reply({ text: '🍔 Kamu pesan *Burger*!\nHarga: Rp 45.000'     }); break;
        case 'food_2': await ctx.reply({ text: '🍕 Kamu pesan *Pizza*!\nHarga: Rp 75.000'      }); break;
        case 'food_3': await ctx.reply({ text: '🍣 Kamu pesan *Sushi*!\nHarga: Rp 95.000'      }); break;
        case 'drink_1': await ctx.reply({ text: '☕ Kamu pesan *Kopi*!\nHarga: Rp 25.000'       }); break;
        case 'drink_2': await ctx.reply({ text: '🍵 Kamu pesan *Teh*!\nHarga: Rp 15.000'        }); break;
        case 'drink_3': await ctx.reply({ text: '🍊 Kamu pesan *Jus*!\nHarga: Rp 20.000'        }); break;
        case 'dessert_1': await ctx.reply({ text: '🍰 Kamu pesan *Cheesecake*!\nHarga: Rp 55.000' }); break;
        case 'dessert_2': await ctx.reply({ text: '🍫 Kamu pesan *Brownies*!\nHarga: Rp 35.000'   }); break;

        case 'interactive':
            await ctx.sendInteractive({
                text: '🚀 Pilih aksi:',
                footer: 'WhatsApp Bot',
                quoted: ctx.msg,
                buttons: [
                    { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '👋 Halo Bot', id: 'qr_hello' }) },
                    { name: 'cta_url',     buttonParamsJson: JSON.stringify({ display_text: '🌐 Buka GitHub', url: 'https://github.com/whiskeysockets/baileys' }) },
                    { name: 'cta_copy',    buttonParamsJson: JSON.stringify({ display_text: '📋 Copy Kode', copy_code: 'KODE-PROMO-2025' }) },
                ]
            });
            break;
        case 'qr_hello': await ctx.reply({ text: '👋 Halo juga! Ada yang bisa saya bantu?' }); break;

        case 'media':
            await ctx.reply({ image: { url: 'https://picsum.photos/400/300' }, caption: '🖼️ Gambar dari internet' });
            break;

        case 'medialokal':
            const imagePath = path.join(__dirname, '../media/logo.png');
            if (!fs.existsSync(imagePath)) return ctx.reply({ text: '❌ File tidak ditemukan.\n\nBuat folder `assets/` dan taruh `logo.png`.' });
            await ctx.reply({ image: fs.readFileSync(imagePath), caption: '🖼️ Gambar lokal dari assets!' });
            break;

        case 'buttonimage':
            const imgPath = path.join(__dirname, '../media/logo.png');
            if (!fs.existsSync(imgPath)) return ctx.reply({ text: '❌ File logo.png tidak ada di folder assets.' });
            const base64Image = fs.readFileSync(imgPath).toString('base64');
            await ctx.sendButtonWithImage({
                text: '🖼️ Button dengan gambar!',
                footer: 'WhatsApp Bot',
                imageUrl: `data:image/png;base64,${base64Image}`,
                quoted: ctx.msg,
                buttons: [
                    { id: 'like',  text: '❤️ Suka'  },
                    { id: 'share', text: '📤 Share' },
                ]
            });
            break;
        case 'like': await ctx.react('❤️'); break;
        case 'share': await ctx.reply({ text: '📤 Makasih udah mau share!' }); break;

        case 'buttoncall':
            await ctx.sendInteractive({
                text: '📞 Hubungi kami:',
                footer: 'Customer Service',
                quoted: ctx.msg,
                buttons: [{ name: 'cta_call', buttonParamsJson: JSON.stringify({ display_text: '📱 Telepon Sekarang', phone_number: '+6281234567890' })}

                ]
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
                } catch (error) {}
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
    }
};


module.exports = handler;