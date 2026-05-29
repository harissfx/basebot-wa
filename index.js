const makeWASocket = require('@whiskeysockets/baileys').default;
const {
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    delay
} = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const P = require('pino');
const readline = require('readline');

const config  = require('./src/config.js');
const plugins = require('./src/utils/PluginLoader');
const logger  = P({ level: 'silent' });

function question(query) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    return new Promise(resolve => rl.question(query, ans => { rl.close(); resolve(ans); }));
}

plugins.init();

let phoneNumber    = null;
let isFirstConnect = true;

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState(config.authFolder);

    let version;
    try {
        ({ version } = await fetchLatestBaileysVersion());
    } catch {
        version = [2, 3000, 1015901307];
    }

    const sock = makeWASocket({
        version,
        logger,
        printQRInTerminal: false,
        auth: state,
        browser: ['Ubuntu', 'Chrome', '20.0.04'],
        generateHighQualityLinkPreview: true,
        syncFullHistory: false,
        markOnlineOnConnect: true,
        connectTimeoutMs: 60000,
        defaultQueryTimeoutMs: 120000,
        keepAliveIntervalMs: 30000,
        retryRequestDelayMs: 250,
        maxMsgRetryCount: 5,
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', (m) => {

        require('./src/handlers/messageHandler')(sock, m);
    });

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;

        if (connection === 'close') {
            const statusCode = (lastDisconnect?.error instanceof Boom)
                ? lastDisconnect.error.output.statusCode
                : null;

            if (statusCode === DisconnectReason.loggedOut) {
                console.log('\n╔═══════════════════════════════════════════╗');
                console.log('║  ❌ DEVICE LOGGED OUT                     ║');
                console.log('╠═══════════════════════════════════════════╣');
                console.log('║  rm -rf session && npm start              ║');
                console.log('╚═══════════════════════════════════════════╝\n');
                process.exit(0);
            }

            const isNormalRestart = statusCode === 515 || statusCode === 408;
            if (!isNormalRestart) {
                console.log(`🔌 Koneksi terputus (${statusCode}), mencoba reconnect...`);
            }

            await delay(3000);
            startBot();

        } else if (connection === 'open') {
            if (isFirstConnect) {
                isFirstConnect = false;
                const name = sock.user?.name || sock.user?.id?.split(':')[0] || 'Unknown';
                console.log('\n╔═══════════════════════════════════════════╗');
                console.log('║  ✅ BERHASIL TERHUBUNG!                   ║');
                console.log('╠═══════════════════════════════════════════╣');
                console.log(`║  📱 ${name.padEnd(38)} ║`);
                console.log(`║  Prefix  : ${config.prefix.padEnd(32)} ║`);
                console.log(`║  Commands: ${String(plugins.commandList().length).padEnd(32)} ║`);
                console.log('╚═══════════════════════════════════════════╝\n');
                console.log('💡 Edit file di src/commands/ → reload otomatis tanpa restart!\n');
            }
        }
    });

    // === PAIRING CODE ===
    if (!sock.authState.creds.registered) {
        if (!phoneNumber) {
            console.log('\n╔═══════════════════════════════════════════╗');
            console.log('║        🔐 WHATSAPP BOT - PAIRING          ║');
            console.log('╠═══════════════════════════════════════════╣');
            console.log('║  Format nomor: 628123456789               ║');
            console.log('║  (tanpa +, spasi, atau strip)             ║');
            console.log('╚═══════════════════════════════════════════╝\n');

            const input = await question('📱 Nomor WhatsApp: ');
            phoneNumber = input.replace(/\D/g, '');

            if (!phoneNumber.match(/^\d{10,15}$/)) {
                console.log('❌ Nomor tidak valid. Contoh: 628123456789');
                process.exit(1);
            }
        }

        for (let attempt = 1; attempt <= 3; attempt++) {
            try {
                await delay(3000);
                const pairingCode = await sock.requestPairingCode(phoneNumber);
                console.log('\n╔═══════════════════════════════════════════╗');
                console.log(`║  🔢 PAIRING CODE: ${pairingCode.padEnd(23)} ║`);
                console.log('╠═══════════════════════════════════════════╣');
                console.log('║  Buka WA → Settings → Linked Devices     ║');
                console.log('║  → Link with phone number → masukkan kode║');
                console.log('╚═══════════════════════════════════════════╝\n');
                break;
            } catch {
                if (attempt >= 3) {
                    console.log('❌ Gagal generate pairing code setelah 3 percobaan.');
                    process.exit(1);
                }
                await delay(5000);
            }
        }
    }

    return sock;
}

process.on('uncaughtException',  (err)    => console.error('❌ Uncaught Exception:', err.message));
process.on('unhandledRejection', (reason) => console.error('❌ Unhandled Rejection:', reason));

startBot().catch((err) => {
    console.error('❌ Fatal error:', err);
    process.exit(1);
});
