/*
Powered By Hanz Ofc

Created base v1.0.0 = 6,6,2026

Update base v2.0.0 = 20,10,2026

Thank To

|Wong Hore Team
|Pancuran Group

........


*/
let _baileys;
try {
  _baileys = require("baileys");
} catch (e) {
  throw new Error(
    "Gagal load baileys. Pastikan folder baileys-patched sudah di-build (npm run build). " +
      "Error: " +
      e.message,
  );
}
const makeWASocket = _baileys.default || _baileys.makeWASocket || _baileys;
const {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  delay,
} = _baileys;
const { Boom } = require("@hapi/boom");
const P = require("pino");
const readline = require("readline");
const path = require("path");
const fs = require("fs");

const chalk = require("chalk");
const figlet = require("figlet");
const qrcodeTerminal = require("qrcode-terminal");
const config = require("./src/config.js");
const prayerTimes = require("./src/utils/prayerTimes");
const { loadCloneSettings, getSetting } = require("./src/utils/cloneSettings");

const plugins = require("./src/utils/PluginLoader");
const logger = P({ level: process.env.BAILEYS_LOG || "silent" });

const _origConsoleLog = console.log;
const _origConsoleWarn = console.warn;
const _origConsoleInfo = console.info;
const _origConsoleError = console.error;

function shouldMuteBaileysNoise(args) {
  const s = args[0];
  if (typeof s === "string") {
    const muted = [
      "Closing open session",
      "Closing stale open session",
      "Closing session",
      "incoming prekey bundle",
      "outgoing prekey bundle",
      "Session already closed",
      "Session already open",
      "Removing old closed session",
      "Opening session:",
      "Closing session:",
    ];
    return muted.some((m) => s.includes(m));
  }

  if (s && typeof s === "object" && s._chains !== undefined) return true;
  return false;
}

function clearSpinnerLine() {
  try {
    if (
      process.stdout.isTTY &&
      typeof spinnies !== "undefined" &&
      spinnies.hasActiveSpinners()
    ) {
      process.stdout.write("\r\x1b[2K");
    }
  } catch (_) {}
}
console.log = function (...args) {
  if (!shouldMuteBaileysNoise(args)) {
    clearSpinnerLine();
    _origConsoleLog.apply(console, args);
  }
};
console.warn = function (...args) {
  if (!shouldMuteBaileysNoise(args)) {
    clearSpinnerLine();
    _origConsoleWarn.apply(console, args);
  }
};
console.info = function (...args) {
  if (!shouldMuteBaileysNoise(args)) {
    clearSpinnerLine();
    _origConsoleInfo.apply(console, args);
  }
};
console.error = function (...args) {
  if (!shouldMuteBaileysNoise(args)) {
    clearSpinnerLine();
    _origConsoleError.apply(console, args);
  }
};

const spinnies = (() => {
  const TICK_MS = 50;
  const BRAILLE = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
  const BASE = [74, 111, 165];
  const GLOW = [190, 235, 255];
  const GREEN_GLOW = [120, 255, 170];
  const AMBER = [255, 190, 80];
  const PHRASES = [
    "Menunggu pesan...",
    "Siap menerima perintah",
    "Bot standby, silakan chat",
    "Mendengarkan grup...",
  ];
  const MAX_LEN = Math.max(...PHRASES.map((p) => p.length));
  const HOLD = 18;
  const GAP = 6;
  const TOTAL = PHRASES.reduce((a, p) => a + p.length * 4 + HOLD + GAP, 0);

  const rgb = (c, str) => `\x1b[38;2;${c[0]};${c[1]};${c[2]}m${str}\x1b[0m`;
  const dim = (str) => `\x1b[2m${str}\x1b[0m`;
  const lerp = (a, b, t) => Math.round(a + (b - a) * t);
  const mix = (c1, c2, t) => [
    lerp(c1[0], c2[0], t),
    lerp(c1[1], c2[1], t),
    lerp(c1[2], c2[2], t),
  ];
  function hsl(h, sat, l) {
    h = (((h % 360) + 360) % 360) / 360;
    const a = sat * Math.min(l, 1 - l);
    const f = (n) => {
      const k = (n + h * 12) % 12;
      return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    };
    return [
      Math.round(f(0) * 255),
      Math.round(f(8) * 255),
      Math.round(f(4) * 255),
    ];
  }
  const fmtElapsed = (ms) => {
    const sec = Math.floor(ms / 1000);
    if (sec >= 3600)
      return `${Math.floor(sec / 3600)}j ${Math.floor((sec % 3600) / 60)}m`;
    return sec >= 60 ? `${Math.floor(sec / 60)}m ${sec % 60}s` : `${sec}s`;
  };

  let timer = null;
  let tick = 0;
  let lastMsg = Date.now();
  let _prayerTimings = null;
  let _prayerLastFetch = 0;

  async function refreshPrayer() {
    try {
      const cfg = config.prayer;
      if (!cfg || cfg.enabled === false) {
        _prayerTimings = null;
        return;
      }
      const now = Date.now();
      if (_prayerTimings && now - _prayerLastFetch < 30 * 60 * 1000) return;
      _prayerTimings = await prayerTimes.ensure(
        cfg.city || "Jakarta",
        cfg.country || "Indonesia",
        cfg.method ?? 20,
      );
      _prayerLastFetch = now;
    } catch (_) {}
  }

  function frame() {
    let x = tick % TOTAL;
    let shown = "";
    let typing = false;
    for (const p of PHRASES) {
      const len = p.length;
      const dur = len * 4 + HOLD + GAP;
      if (x >= dur) {
        x -= dur;
        continue;
      }
      const typeEnd = len * 3;
      const holdEnd = typeEnd + HOLD;
      const delEnd = holdEnd + len;
      let n = 0;
      if (x < typeEnd) {
        n = Math.floor(x / 3);
        typing = true;
      } else if (x < holdEnd) n = len;
      else if (x < delEnd) {
        n = len - (x - holdEnd);
        typing = true;
      }
      shown = p.slice(0, n);
      break;
    }

    const hue = 215 + 35 * Math.sin(tick / 12);
    const spin = rgb(hsl(hue, 0.85, 0.7), BRAILLE[tick % BRAILLE.length]);

    const pos = ((tick * 0.5) % (MAX_LEN + 10)) - 4;
    const text = [...shown]
      .map((ch, i) => {
        const k = Math.max(0, 1 - Math.abs(i - pos) / 3);
        return rgb(mix(BASE, GLOW, k), ch);
      })
      .join("");
    const cursor =
      typing || Math.floor(tick / 4) % 2 === 0
        ? rgb(hsl(hue, 0.85, 0.72), "▌")
        : " ";
    const pad = " ".repeat(MAX_LEN - shown.length);

    const cols = process.stdout.columns || 80;
    if (cols < 50) return `${spin} ${text}${cursor}`;

    const idle = Date.now() - lastMsg;
    const fresh = idle < 4000;
    const dot = rgb(mix(GREEN_GLOW, AMBER, Math.min(1, idle / 600000)), "●");
    const label = (
      fresh ? "baru ada pesan" : "sepi " + fmtElapsed(idle)
    ).padEnd(14);
    const status = `${dot} ${fresh ? rgb(GREEN_GLOW, label) : dim(label)}`;

    let sholat = "";
    const cfg = config.prayer;
    if (cfg && cfg.enabled !== false && _prayerTimings) {
      const next = prayerTimes.getNext(_prayerTimings);
      const limit =
        Number(cfg.remindMinutes) > 0 ? Number(cfg.remindMinutes) : 15;
      if (next && next.remainMin <= limit) {
        const GOLD = [255, 200, 90];
        const line = prayerTimes.formatLine(_prayerTimings);
        const blink = Math.floor(tick / 2) % 2 === 0;
        const icon = blink ? rgb(GOLD, "🕌") : "  ";
        const body = rgb(GOLD, line);
        sholat = `  ${dim("│")}  ${icon} ${body}`;
      }
    }

    return `${spin} ${text}${cursor}${pad}  ${status}${sholat}`;
  }

  function stop() {
    if (!timer) return;
    clearInterval(timer);
    timer = null;
    try {
      process.stdout.write("\r\x1b[2K\x1b[?25h");
    } catch (_) {}
  }

  process.on("exit", () => {
    try {
      if (process.stdout.isTTY) process.stdout.write("\x1b[?25h");
    } catch (_) {}
  });

  return {
    add() {
      if (!process.stdout.isTTY) return;
      if (timer) return;
      tick = 0;
      lastMsg = Date.now();
      refreshPrayer();
      process.stdout.write("\x1b[?25l");
      timer = setInterval(() => {
        try {
          if (tick > 0 && tick % 6000 === 0) refreshPrayer();
          process.stdout.write("\r" + frame() + "\x1b[K");
          tick++;
        } catch (_) {}
      }, TICK_MS);
      if (timer.unref) timer.unref();
    },
    remove() {
      stop();
    },
    hasActiveSpinners() {
      return !!timer;
    },
    touch() {
      lastMsg = Date.now();
    },
  };
})();

function question(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) =>
    rl.question(query, (ans) => {
      rl.close();
      resolve(ans);
    }),
  );
}

function printBanner(hasSession = false) {
  console.clear();
  console.log(
    chalk.cyan(
      figlet.textSync("Hanz Ofc", {
        font: "Standard",
        horizontalLayout: "default",
        verticalLayout: "default",
        width: 80,
        whitespaceBreak: false,
      }),
    ),
  );
  console.log(chalk.cyan("================================================="));
  console.log(chalk.cyan(" • Powered By Haris Sync`"));
  console.log(chalk.cyan(" • Thanks To Wong Hore Team & Pancuran Group"));
  console.log(
    chalk.cyan(" • Info Script: https://github.com/harissfx/basebot-wa"),
  );
  console.log(chalk.cyan("================================================="));
  if (hasSession) {
    console.log(
      chalk.yellow("INFO:"),
      chalk.hex("#39FF14")("Session ditemukan, menghubungkan ulang...\n"),
    );
  } else if (config.usePairingCode) {
    console.log(
      chalk.yellow("INFO:"),
      chalk.hex("#39FF14")(
        "Jika code pairing tidak muncul tekan enter 1-2x lagi\n",
      ),
    );
  } else {
    console.log(
      chalk.yellow("INFO:"),
      chalk.hex("#39FF14")("Scan QR Code nya\n"),
    );
  }
}

plugins.init();

let phoneNumber = null;
let isFirstConnect = true;

global.conns = global.conns || {};

let pairingRequests = {};

function isSessionReady(authFolder, state) {
  try {
    if (state?.creds?.registered) return true;
    if (state?.creds?.me?.id || state?.creds?.me?.lid) return true;
    const credsPath = path.join(authFolder, "creds.json");
    if (fs.existsSync(credsPath)) {
      const raw = JSON.parse(fs.readFileSync(credsPath, "utf8"));
      if (raw?.registered) return true;
      if (raw?.me?.id || raw?.me?.lid) return true;
    }
  } catch (_) {}
  return false;
}

const STALE_TOLERANCE_SEC = 2;
function isStaleMessage(msg, startedAtMs) {
  const raw = msg?.messageTimestamp;
  const ts =
    Number(
      typeof raw === "object" && raw !== null
        ? (raw.low ?? raw.toNumber?.())
        : raw,
    ) || 0;
  if (!ts) return false;
  return ts < Math.floor(startedAtMs / 1000) - STALE_TOLERANCE_SEC;
}

const seenMessages = new Map();
const SEEN_TTL_MS = 10 * 60 * 1000;
function isDuplicateMessage(instanceKey, msg) {
  const id = msg?.key?.id;
  if (!id) return false;
  const key = `${instanceKey}|${msg.key.remoteJid}|${id}`;
  const now = Date.now();
  for (const [k, t] of seenMessages) {
    if (now - t > SEEN_TTL_MS) seenMessages.delete(k);
    else break;
  }
  if (seenMessages.has(key)) {
    console.log(
      chalk.gray(
        `[~] Pesan duplikat dilewati (${instanceKey}, id=${String(id).slice(0, 8)}…)`,
      ),
    );
    return true;
  }
  seenMessages.set(key, now);
  return false;
}

function reasonOf(code) {
  const names = Object.entries(DisconnectReason || {})
    .filter(([, v]) => v === code)
    .map(([k]) => k);
  return names.length ? names.join("/") : "unknown";
}

async function startBot(
  authFolder = config.authFolder,
  isMain = true,
  customPhone = null,
) {
  const { state, saveCreds } = await useMultiFileAuthState(authFolder);
  const alreadyRegistered = isSessionReady(authFolder, state);

  if (isFirstConnect && isMain) {
    printBanner(alreadyRegistered);
    isFirstConnect = false;
  }

  let version;
  try {
    ({ version } = await fetchLatestBaileysVersion());
  } catch {
    version = [2, 3000, 1015901307];
  }

  const startedAt = Date.now();
  const Hanz = makeWASocket({
    version,
    logger,
    printQRInTerminal: false,
    auth: state,
    browser: ["Linux", "Firefox", "120.0"],
    generateHighQualityLinkPreview: true,
    syncFullHistory: false,
    markOnlineOnConnect: true,
    connectTimeoutMs: 60000,
    defaultQueryTimeoutMs: 120000,
    keepAliveIntervalMs: 30000,
    retryRequestDelayMs: 250,
    maxMsgRetryCount: 5,
  });

  const _sendMessage = Hanz.sendMessage.bind(Hanz);
  Hanz.sendMessage = async (jid, content, options = {}) => {
    const opts = { ...(options || {}) };
    if (
      opts.noSelfSync === undefined &&
      getSetting(Hanz, isMain, "noSelfSync") === true
    ) {
      opts.noSelfSync = true;
    }
    return _sendMessage(jid, content, opts);
  };
  const _relayMessage = Hanz.relayMessage.bind(Hanz);
  Hanz.relayMessage = async (jid, message, options = {}) => {
    const opts = { ...(options || {}) };
    if (
      opts.noSelfSync === undefined &&
      getSetting(Hanz, isMain, "noSelfSync") === true
    ) {
      opts.noSelfSync = true;
    }
    return _relayMessage(jid, message, opts);
  };

  const instanceKey = path.basename(authFolder);
  global.conns[instanceKey] = Hanz;
  Hanz.authFolder = authFolder;
  Hanz.isMain = isMain;
  Hanz.instanceKey = instanceKey;

  if (!isMain) {
    loadCloneSettings(Hanz);
  } else {
    Hanz.botMode = getSetting(Hanz, isMain, "botMode") || "public";
  }

  Hanz.ev.on("creds.update", saveCreds);

  const messageHandler = require("./src/handlers/messageHandler");
  let closed = false;
  Hanz.ev.on("messages.upsert", (m) => {
    if (closed) return;
    const fresh = (m.messages || []).filter((msg) => {
      if (isStaleMessage(msg, startedAt)) return false;
      return !isDuplicateMessage(instanceKey, msg);
    });
    if (!fresh.length) return;
    spinnies.touch();
    messageHandler(
      Hanz,
      fresh.length === m.messages.length ? m : { ...m, messages: fresh },
      isMain,
    );
  });
  Hanz.ev.on("group-participants.update", (update) => {
    messageHandler.handleGroupParticipants(Hanz, update).catch((err) => {
      console.log(chalk.red(`[GROUP-PARTICIPANTS] Error: ${err.message}`));
    });
  });
  Hanz.ev.on("contacts.upsert", (contacts) => {
    messageHandler.handleContactsUpdate(contacts);
  });
  Hanz.ev.on("contacts.update", (contacts) => {
    messageHandler.handleContactsUpdate(contacts);
  });
  Hanz.ev.on("chats.upsert", (chats) => {
    if (typeof messageHandler.handleChatsUpdate === "function") {
      messageHandler.handleChatsUpdate(chats);
    }
  });
  Hanz.ev.on("chats.update", (chats) => {
    if (typeof messageHandler.handleChatsUpdate === "function") {
      messageHandler.handleChatsUpdate(chats);
    }
  });

  let pairingReady = null;
  let pairingReadyResolve = null;
  if (!alreadyRegistered && isMain && config.usePairingCode) {
    pairingReady = new Promise((resolve) => {
      pairingReadyResolve = resolve;
    });
  }

  let openedAt = null;

  Hanz.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect, qr } = update;
    if (qr && isMain && !alreadyRegistered && !config.usePairingCode) {
      console.log(
        chalk.cyan("\n=== SCAN QR CODE INI DENGAN WHATSAPP ANDA ==="),
      );
      qrcodeTerminal.generate(qr, { small: true });
      console.log(
        chalk.gray("Buka WhatsApp -> Linked Devices -> Link a Device\n"),
      );
    }

    if (connection === "connecting" && pairingReadyResolve) {
      setTimeout(() => {
        if (pairingReadyResolve) {
          const fn = pairingReadyResolve;
          pairingReadyResolve = null;
          fn();
        }
      }, 5000);
    }

    if (connection === "close") {
      if (isMain) {
        try {
          spinnies.remove("waiting");
        } catch (e) {}
      }

      const statusCode =
        lastDisconnect?.error instanceof Boom
          ? lastDisconnect.error.output.statusCode
          : null;

      const upFor = openedAt
        ? `, sempat aktif ${Math.round((Date.now() - openedAt) / 1000)}d`
        : "";
      openedAt = null;
      closed = true;
      const who = isMain ? "Koneksi utama" : `Clone +${instanceKey}`;
      const codeTxt =
        statusCode == null
          ? "tanpa kode"
          : `${statusCode} ${reasonOf(statusCode)}`;
      const errMsg = lastDisconnect?.error?.message
        ? ` — ${lastDisconnect.error.message}`
        : "";
      const why = `${codeTxt}${errMsg}${upFor}`;

      if (statusCode === DisconnectReason.loggedOut) {
        console.log(chalk.red(`\n[!] Sesi ${instanceKey} keluar/logged out.`));
        if (isMain) process.exit(0);
        delete global.conns[instanceKey];

        try {
          fs.rmSync(authFolder, { recursive: true, force: true });
        } catch (e) {}
        return;
      }

      const isNormalRestart = statusCode === 515 || statusCode === 408;

      if (isMain && !Hanz.authState.creds.registered && !isNormalRestart) {
        console.log(
          chalk.red(
            `\n[!] Koneksi terputus (${statusCode}) saat proses ${config.usePairingCode ? "pairing" : "scan QR"} belum selesai.`,
          ),
        );
        console.log(
          chalk.yellow(
            '[!] Silakan jalankan ulang "npm start" secara manual dan coba lagi.',
          ),
        );
        process.exit(1);
      }

      const afterLogin = statusCode === 515 && !upFor;

      if (afterLogin) {
      } else if (isNormalRestart) {
        console.log(
          chalk.gray(`[~] ${who} restart (${why}), menyambung ulang...`),
        );
      } else {
        console.log(
          chalk.yellow(
            `[!] ${who} terputus (${why}), mencoba menghubungkan kembali...`,
          ),
        );
      }

      await delay(3000);
      startBot(authFolder, isMain, customPhone);
    } else if (connection === "open") {
      openedAt = Date.now();
      const name = Hanz.user?.name || Hanz.user?.id?.split(":")[0] || "Unknown";

      if (isMain) {
        require("./src/utils/mqttClient").connect();
        await messageHandler.preloadGroupNames(Hanz).catch(() => {});

        const mode = getSetting(Hanz, isMain, "botMode");
        const noPrefixOn = getSetting(Hanz, isMain, "noPrefix");
        const autoReadOn = getSetting(Hanz, isMain, "autoRead");
        const autoTypingOn = getSetting(Hanz, isMain, "autoTyping");
        const prefixNow = getSetting(Hanz, isMain, "prefix");
        const coOwnerCount = []
          .concat(config.coOwner || [])
          .filter(Boolean).length;
        const groupCount = global.groupNameCache
          ? global.groupNameCache.size
          : 0;

        const info = [
          ["ID/No", name],
          ["Prefix", `${prefixNow}${noPrefixOn ? " (bisa tanpa prefix)" : ""}`],
          [
            "Mode",
            mode === "self"
              ? "Self (khusus owner)"
              : "Public (semua bisa pakai)",
          ],
          ["Auto Read", autoReadOn ? "Aktif" : "Nonaktif"],
          ["Auto Typing", autoTypingOn ? "Aktif" : "Nonaktif"],
          ["Super Owner", [].concat(config.superOwner)[0] || "-"],
          ["Co-Owner", coOwnerCount ? `${coOwnerCount} nomor` : "-"],
          ["Grup Aktif", `${groupCount} grup`],
          ["Commands", `${plugins.commandList().length} fitur aktif`],
        ];
        const labelWidth = Math.max(...info.map(([label]) => label.length));

        console.log(
          chalk.hex("#39FF14")(`\nSTATUS: Bot Utama Berhasil Terhubung!`),
        );
        for (const [label, value] of info) {
          console.log(chalk.white(` • ${label.padEnd(labelWidth)} : ${value}`));
        }

        try {
          spinnies.remove("waiting");
        } catch (e) {}
        spinnies.add("waiting", { text: "." });

        autoLoadJadibot();

        messageHandler.resolveOwnerLids(Hanz).catch(() => {});

        if (config.channelId) {
          try {
            await Hanz.newsletterFollow(config.channelId);
          } catch (e) {}
        }
      } else {
        const cMode =
          getSetting(Hanz, isMain, "botMode") === "self" ? "Self" : "Public";
        const cPrefix = getSetting(Hanz, isMain, "prefix") || "-";
        const rawName = Hanz.user?.name || Hanz.authState?.creds?.me?.name;
        const cName = rawName && rawName !== instanceKey ? rawName : "-";
        console.log(
          chalk.hex("#39FF14")("[BOT]".padEnd(8)) +
            cloneTag(instanceKey) +
            chalk.white(`+${instanceKey} terhubung`) +
            chalk.gray(
              ` • ${cMode.padEnd(6)} • Prefix ${String(cPrefix).padEnd(2)} • ${cName}`,
            ),
        );

        if (config.channelId) {
          try {
            await Hanz.newsletterFollow(config.channelId);
          } catch (e) {}
        }
      }
    }
  });

  const stillNeedLogin =
    !alreadyRegistered &&
    !Hanz.authState?.creds?.registered &&
    !(Hanz.authState?.creds?.me?.id || Hanz.authState?.creds?.me?.lid);

  if (stillNeedLogin) {
    if (isMain) {
      if (config.usePairingCode) {
        if (!phoneNumber) {
          console.log(
            chalk.white(
              "Format nomor gunakan kode negara, contoh: 6212345xxxxx\n",
            ),
          );

          const input = await question(
            chalk.green("📱 Masukkan Nomor WhatsApp: "),
          );
          phoneNumber = input.replace(/\D/g, "");

          if (!phoneNumber.match(/^\d{10,15}$/)) {
            console.log(chalk.red("Nomor tidak valid! Aplikasi dihentikan."));
            process.exit(1);
          }
        }

        console.log(chalk.gray("Menunggu koneksi ke server WhatsApp..."));
        await pairingReady;

        for (let attempt = 1; attempt <= 3; attempt++) {
          try {
            const pairingCode = await Hanz.requestPairingCode(phoneNumber);
            const formattedCode =
              pairingCode.match(/.{1,4}/g)?.join("-") || pairingCode;
            console.log(
              chalk.magenta(`\n[➔] PAIRING CODE ANDA: `) +
                chalk.white.bold(formattedCode),
            );
            console.log(
              chalk.gray(
                "Silakan masukkan kode di atas pada menu: Linked Devices -> Link with phone number\n",
              ),
            );
            break;
          } catch (err) {
            console.log(
              chalk.yellow(`[!] Percobaan ${attempt}/3 gagal: ${err.message}`),
            );
            if (attempt >= 3) {
              console.log(
                chalk.red(
                  "❌ Gagal generate pairing code setelah 3 percobaan.",
                ),
              );
              process.exit(1);
            }
            await delay(5000);
          }
        }
      } else {
        if (!Hanz.authState.creds.me) {
          console.log(chalk.cyan("=== WHATSAPP BOT LOGIN (QR CODE) ==="));
          console.log(
            chalk.gray("⏳ Menunggu QR code muncul dari server WhatsApp...\n"),
          );
        }
      }
    } else if (customPhone) {
      setTimeout(async () => {
        try {
          await delay(3000);
          const code = await Hanz.requestPairingCode(customPhone);
          const formattedCode = code.match(/.{1,4}/g)?.join("-") || code;
          if (pairingRequests[customPhone]?.resolve) {
            const cb = pairingRequests[customPhone];
            delete pairingRequests[customPhone];
            cb.resolve(formattedCode);
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
  const sessionPath = path.join(
    __dirname,
    "src",
    "database",
    "jadibot",
    targetPhone,
  );

  if (fs.existsSync(path.join(sessionPath, "creds.json"))) {
    const creds = JSON.parse(
      fs.readFileSync(path.join(sessionPath, "creds.json"), "utf-8"),
    );
    if (creds.registered) {
      if (global.conns[targetPhone]) {
        throw new Error("Bot dengan nomor tersebut sudah aktif dan terhubung.");
      }
      await startBot(sessionPath, false, targetPhone);
      throw new Error(
        "Session lama ditemukan dan otomatis dihubungkan kembali tanpa pairing ulang.",
      );
    }
  }

  return new Promise((resolve, reject) => {
    pairingRequests[targetPhone] = { resolve, reject };

    startBot(sessionPath, false, targetPhone).catch((err) => {
      delete pairingRequests[targetPhone];
      reject(err);
    });
  });
};

function cloneTag(key) {
  const num = String(key || "").replace(/\D/g, "");
  return chalk.magenta(
    `[CLONE ${num ? num.slice(-4) : "?"}]`.padEnd("[CLONE 0000]".length) + " ",
  );
}

function autoLoadJadibot() {
  const sessionsDir = path.join(__dirname, "src", "database", "jadibot");

  if (!fs.existsSync(sessionsDir)) {
    fs.mkdirSync(sessionsDir, { recursive: true });
  }

  const toStart = fs.readdirSync(sessionsDir).filter((folder) => {
    const fullPath = path.join(sessionsDir, folder);
    return (
      fs.statSync(fullPath).isDirectory() &&
      fs.existsSync(path.join(fullPath, "creds.json")) &&
      !global.conns[folder]
    );
  });
  if (!toStart.length) return;

  console.log(
    chalk.blue("[BOT]".padEnd(8)) +
      chalk.white(`Menghidupkan ${toStart.length} clone bot...`),
  );
  for (const folder of toStart) {
    startBot(path.join(sessionsDir, folder), false, folder).catch(() => {});
  }
}

process.on("uncaughtException", (err) =>
  console.error(chalk.red("[Error Uncaught]:"), err.message),
);
process.on("unhandledRejection", (reason) =>
  console.error(chalk.red("[Error Rejection]:"), reason),
);

let stopping = false;
for (const [sig, code] of [
  ["SIGINT", 130],
  ["SIGTERM", 143],
  ["SIGHUP", 129],
]) {
  process.on(sig, () => {
    stopping = true;
    console.log(chalk.red(`\n[!] Proses menerima ${sig}, bot dihentikan.`));
    process.exit(code);
  });
}
process.on("exit", (code) => {
  if (!stopping && code !== 0)
    console.log(chalk.red(`[!] Proses berakhir dengan exit code ${code}.`));
});

startBot().catch((err) => {
  console.error(chalk.red("[Fatal Error]:"), err);
  process.exit(1);
});
