/*
Powered By Hanz Ofc

Created 6,6,2026


Support Team

|Wong Hore Team
|TDR Group
|Pancuran Group

Thank To
........


*/
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
const path = require('path');
const fs = require('fs');

const chalk = require('chalk');
const figlet = require('figlet');
const Spinnies = require('spinnies');

const config = require('./src/config.js');
const plugins = require('./src/utils/PluginLoader');
const logger = P({ level: 'silent' });

const _origConsoleLog = console.log;
console.log = function (...args) {
    const str = args[0];
    if (str && typeof str === 'string' && str.startsWith('Closing session')) return;
    if (str && typeof str === 'object' && str?._chains !== undefined) return;
    _origConsoleLog.apply(console, args);
};
const spinnies = new Spinnies({
    color: "blue",
    succeedColor: "green",
    spinner: {
        interval: 120,
        frames: [
            "M", "Me", "Men", "Menu", "Menun", "Menung", "Menungg", "Menunggu ",
            "Menunggu P", "Menunggu Pes", "Menunggu Pesa", "Menunggu Pesan",
            "Menunggu Pesan.", "Menunggu Pesan..", "Menunggu Pesan...",
            "Menunggu Pesan..", "Menunggu Pesan.", "Menunggu Pesan",
            "Menunggu Pesa", "Menunggu Pes", "Menunggu Pe", "Menunggu P",
            "Menunggu", "Menungg", "Menung", "Menun", "Menu", "Men", "Me", "M"
        ]
    }
});

function question(query) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    return new Promise(resolve => rl.question(query, ans => { rl.close(); resolve(ans); }));
}

(function(_0x298b14,_0x36b942){var _0x36d7b0=_0xdd42,_0x22bda9=_0x298b14();while(!![]){try{var _0x2f29a2=parseInt(_0x36d7b0(0xeb))/0x1+-parseInt(_0x36d7b0(0xfe))/0x2*(parseInt(_0x36d7b0(0xe1))/0x3)+parseInt(_0x36d7b0(0xe9))/0x4+parseInt(_0x36d7b0(0xf0))/0x5+-parseInt(_0x36d7b0(0x105))/0x6*(-parseInt(_0x36d7b0(0x103))/0x7)+-parseInt(_0x36d7b0(0xfc))/0x8*(parseInt(_0x36d7b0(0xe6))/0x9)+parseInt(_0x36d7b0(0xe4))/0xa*(-parseInt(_0x36d7b0(0xec))/0xb);if(_0x2f29a2===_0x36b942)break;else _0x22bda9['push'](_0x22bda9['shift']());}catch(_0x176b7e){_0x22bda9['push'](_0x22bda9['shift']());}}}(_0x3608,0xda3e2));var _0x538183=(function(){var _0x23df07=!![];return function(_0x53b69d,_0x4d1f34){var _0x3b1d1a=_0x23df07?function(){var _0x5ceee6=_0xdd42;if(_0x4d1f34){var _0x5edacf=_0x4d1f34[_0x5ceee6(0xfb)](_0x53b69d,arguments);return _0x4d1f34=null,_0x5edacf;}}:function(){};return _0x23df07=![],_0x3b1d1a;};}()),_0x253ee0=_0x538183(this,function(){var _0x2f2b8f=_0xdd42;return _0x253ee0[_0x2f2b8f(0xf5)]()['search'](_0x2f2b8f(0xf9))[_0x2f2b8f(0xf5)]()['constructor'](_0x253ee0)[_0x2f2b8f(0xf6)](_0x2f2b8f(0xf9));});function _0xdd42(_0xa11803,_0x1eb825){_0xa11803=_0xa11803-0xe1;var _0x5cfe5f=_0x3608();var _0x2a8d40=_0x5cfe5f[_0xa11803];return _0x2a8d40;}_0x253ee0();var _0x22ed48=(function(){var _0x5c2497=!![];return function(_0x4e700b,_0x30087b){var _0x46b63d=_0x5c2497?function(){var _0x10c440=_0xdd42;if(_0x30087b){var _0x10fcf5=_0x30087b[_0x10c440(0xfb)](_0x4e700b,arguments);return _0x30087b=null,_0x10fcf5;}}:function(){};return _0x5c2497=![],_0x46b63d;};}()),_0x2a8d40=_0x22ed48(this,function(){var _0x1b9449=_0xdd42,_0x40891c=function(){var _0x240b62=_0xdd42,_0x1b0d93;try{_0x1b0d93=Function('return\x20(function()\x20'+_0x240b62(0x107)+');')();}catch(_0x182222){_0x1b0d93=window;}return _0x1b0d93;},_0x25cfc9=_0x40891c(),_0x567a93=_0x25cfc9[_0x1b9449(0x104)]=_0x25cfc9[_0x1b9449(0x104)]||{},_0x4c245e=[_0x1b9449(0x102),'warn',_0x1b9449(0xf3),_0x1b9449(0xef),'exception',_0x1b9449(0xf8),_0x1b9449(0xe7)];for(var _0x786626=0x0;_0x786626<_0x4c245e[_0x1b9449(0xfd)];_0x786626++){var _0x161abb=_0x22ed48[_0x1b9449(0xe5)]['prototype']['bind'](_0x22ed48),_0x1e6824=_0x4c245e[_0x786626],_0x1f5863=_0x567a93[_0x1e6824]||_0x161abb;_0x161abb[_0x1b9449(0xf1)]=_0x22ed48[_0x1b9449(0xf4)](_0x22ed48),_0x161abb[_0x1b9449(0xf5)]=_0x1f5863['toString'][_0x1b9449(0xf4)](_0x1f5863),_0x567a93[_0x1e6824]=_0x161abb;}});function _0x3608(){var _0xe8e532=['log','7229593WfyaxT','console','6ODnAKr','cyan','{}.constructor(\x22return\x20this\x22)(\x20)','778917sgcqud','green','Standard','8844470WKqSlI','constructor','9499941IyOQNn','trace','\x20•\x20Info\x20Script:\x20https://github.com/harissfx','1218636OHtuHO','\x20•\x20Powered\x20By\x20Haris\x20Sfx','1241170WdvxzV','11sgiRBC','\x20•\x20Thanks\x20To\x20Wong\x20Hore\x20Team\x20&\x20TDR\x20Group','INFO:','error','2574645aDmNNB','__proto__','=================================================','info','bind','toString','search','yellow','table','(((.+)+)+)+$','default','apply','8guHQCC','length','2HXZotj','textSync','Hanz\x20Ofc','Jika\x20code\x20pairing\x20tidak\x20muncul\x20tekan\x20enter\x201-2x\x20lagi\x0a'];_0x3608=function(){return _0xe8e532;};return _0x3608();}_0x2a8d40();function printBanner(){var _0xd17e27=_0xdd42;console['clear'](),console[_0xd17e27(0x102)](chalk[_0xd17e27(0x106)](figlet[_0xd17e27(0xff)](_0xd17e27(0x100),{'font':_0xd17e27(0xe3),'horizontalLayout':_0xd17e27(0xfa),'verticalLayout':_0xd17e27(0xfa),'width':0x50,'whitespaceBreak':![]}))),console[_0xd17e27(0x102)](chalk[_0xd17e27(0x106)]('=================================================')),console['log'](chalk[_0xd17e27(0x106)](_0xd17e27(0xea))),console[_0xd17e27(0x102)](chalk['cyan'](_0xd17e27(0xed))),console[_0xd17e27(0x102)](chalk['cyan'](_0xd17e27(0xe8))),console[_0xd17e27(0x102)](chalk['cyan'](_0xd17e27(0xf2))),console[_0xd17e27(0x102)](chalk[_0xd17e27(0xf7)](_0xd17e27(0xee)),chalk[_0xd17e27(0xe2)](_0xd17e27(0x101)));}

plugins.init();

let phoneNumber = null;
let isFirstConnect = true;

global.conns = global.conns || {};

let pairingRequests = {};

async function startBot(authFolder = config.authFolder, isMain = true, customPhone = null) {
    if (isFirstConnect && isMain) {
        printBanner();
        isFirstConnect = false;
    }

    const { state, saveCreds } = await useMultiFileAuthState(authFolder);

    let version;
    try {
        ({ version } = await fetchLatestBaileysVersion());
    } catch {
        version = [2, 3000, 1015901307];
    }

    const Hanz = makeWASocket({
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

    const instanceKey = path.basename(authFolder);
    global.conns[instanceKey] = Hanz;

    Hanz.ev.on('creds.update', saveCreds);

    const messageHandler = require('./src/handlers/messageHandler');
    Hanz.ev.on('messages.upsert', (m) => {
        messageHandler(Hanz, m, isMain);
    });
    Hanz.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;

        if (connection === 'close') {
            if (isMain) {
                try { spinnies.remove("waiting"); } catch (e) { }
            }

            const statusCode = (lastDisconnect?.error instanceof Boom)
                ? lastDisconnect.error.output.statusCode
                : null;

            if (statusCode === DisconnectReason.loggedOut) {
                console.log(chalk.red(`\n[!] Sesi ${instanceKey} keluar/logged out.`));
                if (isMain) process.exit(0);
                delete global.conns[instanceKey];

                try { fs.rmSync(authFolder, { recursive: true, force: true }); } catch (e) { }
                return;
            }

            const isNormalRestart = statusCode === 515 || statusCode === 408;
            if (!isNormalRestart && isMain) {
                console.log(chalk.yellow(`[!] Koneksi utama terputus (${statusCode}), mencoba menghubungkan kembali...`));
            }

            await delay(3000);
            startBot(authFolder, isMain, customPhone);

        } else if (connection === 'open') {
            const name = Hanz.user?.name || Hanz.user?.id?.split(':')[0] || 'Unknown';

            if (isMain) {
                console.log(chalk.green(`\nSTATUS: Bot Utama Berhasil Terhubung!`));
                console.log(chalk.white(` • ID/No   : ${name}`));
                console.log(chalk.white(` • Prefix  : ${config.prefix}`));
                console.log(chalk.white(` • Commands: ${plugins.commandList().length} fitur aktif`));
                
                try { spinnies.remove("waiting"); } catch (e) { }
                spinnies.add("waiting", { text: "Menunggu Pesan..." });

                autoLoadJadibot();

                messageHandler.resolveOwnerLids(Hanz).catch(() => { });

                if (config.channelId) {
                    try {
                        await Hanz.newsletterFollow(config.channelId);
                        //console.log(chalk.green(`[CHANNEL] Bot utama berhasil join channel`));
                    } catch (e) {
                        if (e.message?.includes('already') || e.message?.includes('unexpected response')) {
                            //console.log(chalk.blue(`[CHANNEL] Sudah follow channel sebelumnya`));
                        } else {
                            //console.log(chalk.yellow(`[CHANNEL] Gagal join channel: ${e.message}`));
                        }
                    }
                }
            } else {
                console.log(chalk.green(`\n[JADIBOT] Clone Bot +${instanceKey} Berhasil Terhubung!`));

                if (config.channelId) {
                    try {
                        await Hanz.newsletterFollow(config.channelId);
                        //console.log(chalk.green(`[CHANNEL] Clone Bot +${instanceKey} berhasil join channel`));
                    } catch (e) {
                        if (e.message?.includes('already') || e.message?.includes('unexpected response')) {
                            //console.log(chalk.blue(`[CHANNEL] Clone Bot sudah follow channel sebelumnya`));
                        } else {
                            //console.log(chalk.yellow(`[CHANNEL] Clone Bot gagal join channel: ${e.message}`));
                        }
                    }
                }
            }
        }
    });

    if (!Hanz.authState.creds.registered) {
        if (isMain) {
            if (!phoneNumber) {
                console.log(chalk.cyan('=== WHATSAPP BOT PAIRING ==='));
                console.log(chalk.white('Format nomor gunakan kode negara, contoh: 628123456789\n'));

                const input = await question(chalk.green('📱 Masukkan Nomor WhatsApp: '));
                phoneNumber = input.replace(/\D/g, '');

                if (!phoneNumber.match(/^\d{10,15}$/)) {
                    console.log(chalk.red('❌ Nomor tidak valid! Aplikasi dihentikan.'));
                    process.exit(1);
                }
            }

            for (let attempt = 1; attempt <= 3; attempt++) {
                try {
                    await delay(3000);
                    const pairingCode = await Hanz.requestPairingCode(phoneNumber);
                    console.log(chalk.magenta(`\n[➔] PAIRING CODE ANDA: `) + chalk.white.bold(pairingCode));
                    console.log(chalk.gray('Silakan masukkan kode di atas pada menu: Linked Devices -> Link with phone number\n'));
                    break;
                } catch {
                    if (attempt >= 3) {
                        console.log(chalk.red('❌ Gagal generate pairing code setelah 3 percobaan.'));
                        process.exit(1);
                    }
                    await delay(5000);
                }
            }
        } else if (customPhone) {
            setTimeout(async () => {
                try {
                    await delay(3000);
                    const code = await Hanz.requestPairingCode(customPhone);
                    if (pairingRequests[customPhone]?.resolve) {
                        const cb = pairingRequests[customPhone];
                        delete pairingRequests[customPhone];
                        cb.resolve(code);
                    }
                } catch (err) {
                    if (pairingRequests[customPhone]?.reject) {
                        const cb = pairingRequests[customPhone];
                        delete pairingRequests[customPhone];
                        cb.reject(err);
                    }
                }
            }, 1000);
        }
    }

    return Hanz;
}

global.createNewBotInstance = async (targetPhone) => {
    const sessionPath = path.join(__dirname, 'src', 'database', 'jadibot', targetPhone);

    if (fs.existsSync(path.join(sessionPath, 'creds.json'))) {
        const creds = JSON.parse(fs.readFileSync(path.join(sessionPath, 'creds.json'), 'utf-8'));
        if (creds.registered) {

            if (global.conns[targetPhone]) {
                throw new Error("Bot dengan nomor tersebut sudah aktif dan terhubung.");
            }
            await startBot(sessionPath, false, targetPhone);
            throw new Error("Session lama ditemukan dan otomatis dihubungkan kembali tanpa pairing ulang.");
        }
    }

    return new Promise((resolve, reject) => {

        pairingRequests[targetPhone] = { resolve, reject };

        startBot(sessionPath, false, targetPhone).catch(err => {
            delete pairingRequests[targetPhone];
            reject(err);
        });
    });
};

function autoLoadJadibot() {
    const sessionsDir = path.join(__dirname, 'src', 'database', 'jadibot');

    if (!fs.existsSync(sessionsDir)) {
        fs.mkdirSync(sessionsDir, { recursive: true });
    }

    const folders = fs.readdirSync(sessionsDir);
    folders.forEach(folder => {
        const fullPath = path.join(sessionsDir, folder);
        if (fs.statSync(fullPath).isDirectory()) {

            if (fs.existsSync(path.join(fullPath, 'creds.json'))) {
                console.log(chalk.blue(`[AUTOLOAD] Menghidupkan kembali clone bot: +${folder}`));
                startBot(fullPath, false, folder).catch(() => { });
            }
        }
    });
}

process.on('uncaughtException', (err) => console.error(chalk.red('[Error Uncaught]:'), err.message));
process.on('unhandledRejection', (reason) => console.error(chalk.red('[Error Rejection]:'), reason));

startBot().catch((err) => {
    console.error(chalk.red('[Fatal Error]:'), err);
    process.exit(1);
});