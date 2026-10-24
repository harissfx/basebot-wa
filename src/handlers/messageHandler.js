const fs = require("fs");
const config = require("../config");
const mess = require("../config").mess;

{
  const {
    defaults: settingDefaults,
    KEYS: SETTING_KEYS,
  } = require("../utils/cloneSettings");
  const d = settingDefaults();
  for (const k of SETTING_KEYS) if (global[k] === undefined) global[k] = d[k];
}

const plugins = require("../utils/PluginLoader");
const chalk = require("chalk");
const readline = require("readline");
const { getContentType } = require("baileys");
const {
  sendButtons,
  sendListMessage,
  sendInteractiveMessage,
  sendButtonWithImage,
  sendInteractiveWithImage,
} = require("../utils/interactiveHelper");
const {
  getActiveQuoteFor,
  quotePay,
  quoteMeta,
  quoteStatus,
} = require("../utils/fquoted");
const { getSetting } = require("../utils/cloneSettings");
const { sendRawMessage } = require("../utils/rawSender");
const { generateCard } = require("../utils/welcomeCard");
const {
  resolveName,
  resolveNameFromGroup,
  resolvePhoneJid,
} = require("../utils/identity");
const { getImage, getGroupInfo, normJid } = require("../utils/helper");
const stickerCmdStore = require("../utils/stickerCmdStore");
const path = require("path");
const GROUP_SETTINGS_PATH = path.join(
  __dirname,
  "..",
  "database",
  "groupSettings.json",
);

function loadAllGroupSettings() {
  try {
    const raw = fs.readFileSync(GROUP_SETTINGS_PATH, "utf8");
    const parsed = JSON.parse(raw);
    return {
      welcome: parsed.welcome || {},
      goodbye: parsed.goodbye || {},
      antilink: parsed.antilink || {},
      promoteCard: parsed.promoteCard || {},
      demoteCard: parsed.demoteCard || {},
    };
  } catch {
    return {
      welcome: {},
      goodbye: {},
      antilink: {},
      promoteCard: {},
      demoteCard: {},
    };
  }
}

function saveAllGroupSettings(data) {
  try {
    fs.mkdirSync(path.dirname(GROUP_SETTINGS_PATH), { recursive: true });
    fs.writeFileSync(GROUP_SETTINGS_PATH, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error(
      `[GROUP-SETTINGS] Gagal simpan ke ${GROUP_SETTINGS_PATH}: ${err.message}`,
    );
  }
}

function extractDocStyleText(content) {
  if (content == null) return "";
  if (typeof content === "string") return content;
  if (typeof content === "object") {
    const mediaKeys = [
      "image",
      "video",
      "audio",
      "document",
      "sticker",
      "location",
      "contacts",
      "contact",
      "poll",
      "pollResultMessage",
      "productMessage",
      "event",
      "album",
      "groupLabel",
      "requestPaymentMessage",
      "react",
      "pin",
      "edit",
      "delete",
      "viewOnce",
      "viewOnceMessage",
      "buttons",
      "templateButtons",
      "sections",
      "listMessage",
      "interactiveMessage",
      "nativeFlowMessage",
      "ptvMessage",
      "videoNote",
    ];
    if (mediaKeys.some((k) => content[k] != null)) return null;

    if (typeof content.text === "string") return content.text;
    if (typeof content.caption === "string") return content.caption;
  }
  return null;
}

/**
 * Media (image/video/audio/document/dll) dikirim normal via sendMessage.
 *
 * @param {any} sock - Hanz / WA socket
 * @param {string} jid
 * @param {string|object} content
 * @param {{ quoted?: any }} options
 */
async function sendDocStyleReply(sock, jid, content, options = {}) {
  const text = extractDocStyleText(content);

  const noSelfSync =
    getSetting(sock, sock?.isMain !== false, "noSelfSync") === true;
  if (text === null) {
    return sock.sendMessage(jid, content, { ...options, noSelfSync });
  }

  const {
    generateWAMessageContent,
    generateWAMessageFromContent,
  } = require("baileys");
  const sharp = require("sharp");

  const buffer = getImage();
  const jpegThumbnail = await sharp(buffer)
    .resize(100, 100, { fit: "cover" })
    .jpeg({ quality: 70 })
    .toBuffer();

  const { documentMessage: doc } = await generateWAMessageContent(
    {
      document: buffer,
      mimetype: "image/png",
      fileName: config.botName,
      jpegThumbnail,
    },
    { upload: sock.waUploadToServer },
  );

  Object.assign(doc, {
    jpegThumbnail,
    fileLength: 180860 * 2 ** 32,
    fileName: config.botName,
    mimetype: "image/png",
    caption: text,
    pageCount: 0,
    contextInfo: {
      forwardingScore: 999,
      isForwarded: true,
      forwardedNewsletterMessageInfo: {
        newsletterJid: config.channelId,
        newsletterName: config.botName,
        serverMessageId: 1,
      },
    },
  });

  const msg = generateWAMessageFromContent(
    jid,
    { documentMessage: doc },
    { userJid: sock.user?.id, quoted: options.quoted },
  );

  await sock.relayMessage(jid, msg.message, {
    messageId: msg.key.id,
    noSelfSync,
  });
  return msg;
}

const superOwnerLidCache = new Set();
const coOwnerLidCache = new Set();

const COOLDOWN_MS = 5000;
const COOLDOWN_EXEMPT = new Set([
  "menu",
  "ping",
  "generalmenu",
  "ownermenu",
  "ffmpegmenu",
  "downloadmenu",
  "toolsmenu",
  "jadibotmenu",
  "funmenu",
  "groupmenu",
  "extramenu",
  "afk",
  "welcome",
  "goodbye",
  "antilink",
  "promotewelcome",
  "demotewelcome",
]);
const cooldownMap = new Map();
const savedGroupSettings = loadAllGroupSettings();

const welcomeGroups = new Map(Object.entries(savedGroupSettings.welcome));
const goodbyeGroups = new Map(Object.entries(savedGroupSettings.goodbye));
const antilinkGroups = new Map(Object.entries(savedGroupSettings.antilink));
const promoteCardGroups = new Map(
  Object.entries(savedGroupSettings.promoteCard),
);
const demoteCardGroups = new Map(Object.entries(savedGroupSettings.demoteCard));

global.welcomeGroups = welcomeGroups;
global.goodbyeGroups = goodbyeGroups;
global.antilinkGroups = antilinkGroups;
global.promoteCardGroups = promoteCardGroups;
global.demoteCardGroups = demoteCardGroups;
global.saveGroupSettings = function saveGroupSettings() {
  saveAllGroupSettings({
    welcome: Object.fromEntries(welcomeGroups),
    goodbye: Object.fromEntries(goodbyeGroups),
    antilink: Object.fromEntries(antilinkGroups),
    promoteCard: Object.fromEntries(promoteCardGroups),
    demoteCard: Object.fromEntries(demoteCardGroups),
  });
};

global.afkUsers = global.afkUsers || new Map();

setInterval(
  () => {
    const now = Date.now();
    for (const [key, timestamp] of cooldownMap) {
      if (now - timestamp > COOLDOWN_MS) cooldownMap.delete(key);
    }
  },
  5 * 60 * 1000,
);

async function resolveOwnerLids(Hanz) {
  const resolveList = [
    {
      numbers: [].concat(config.superOwner),
      cache: superOwnerLidCache,
      label: "SUPER",
    },
    {
      numbers: [].concat(config.coOwner || []),
      cache: coOwnerLidCache,
      label: "CO",
    },
  ];
  for (const { numbers, cache, label } of resolveList) {
    for (const nomor of numbers.map((n) => n.replace(/\D/g, ""))) {
      try {
        const [result] = await Hanz.onWhatsApp(nomor);
        if (result?.exists && result?.lid) {
          const lidNum = String(result.lid)
            .replace(/@.+$/, "")
            .split(":")[0]
            .replace(/\D/g, "");
          if (lidNum) cache.add(lidNum);
        }
      } catch (e) {}
    }
  }
}

function extractMessageText(message) {
  if (!message) return null;
  const type = getContentType(message);
  switch (type) {
    case "conversation":
      return message.conversation;
    case "extendedTextMessage":
      return message.extendedTextMessage?.text;
    case "imageMessage":
      return message.imageMessage?.caption;
    case "videoMessage":
      return message.videoMessage?.caption;
    case "buttonsResponseMessage":
      return message.buttonsResponseMessage?.selectedButtonId;
    case "listResponseMessage":
      return message.listResponseMessage?.singleSelectReply?.selectedRowId;
    case "templateButtonReplyMessage":
      return message.templateButtonReplyMessage?.selectedId;
    case "interactiveResponseMessage": {
      const paramsJson =
        message.interactiveResponseMessage?.nativeFlowResponseMessage
          ?.paramsJson;
      if (paramsJson) {
        try {
          const parsed = JSON.parse(paramsJson);
          return parsed.id;
        } catch {
          return null;
        }
      }
      return null;
    }
    default:
      return null;
  }
}

function isGroup(jid) {
  return jid.endsWith("@g.us");
}
function isFromMe(msg) {
  return msg.key.fromMe;
}
function truncateLog(str, max = 80) {
  const s = String(str || "")
    .replace(/\s+/g, " ")
    .trim();
  if (s.length <= max) return s;
  return s.slice(0, max - 1) + "…";
}

global.groupNameCache = global.groupNameCache || new Map();

function refreshGroupName(chat, Hanz) {
  if (!Hanz || global.groupNameCache.has(chat)) return;
  global.groupNameCache.set(chat, null);
  Hanz.groupMetadata(chat)
    .then((meta) => {
      if (meta?.subject) global.groupNameCache.set(chat, meta.subject);
    })
    .catch(() => {});
}

async function preloadGroupNames(Hanz) {
  try {
    const all = await Hanz.groupFetchAllParticipating();
    for (const g of Object.values(all || {})) {
      if (g?.id && g?.subject) global.groupNameCache.set(g.id, g.subject);
    }
  } catch {}
}

function isStatusBroadcast(jid) {
  return jid === "status@broadcast";
}
function isChannel(jid) {
  return jid.endsWith("@newsletter");
}

global.channelNameCache = global.channelNameCache || new Map();

function refreshChannelName(jid, Hanz) {
  if (!Hanz || global.channelNameCache.has(jid)) return;
  global.channelNameCache.set(jid, null);
  Hanz.newsletterMetadata("jid", jid)
    .then((meta) => {
      if (meta?.name) global.channelNameCache.set(jid, meta.name);
    })
    .catch(() => {});
}

function chatLogMeta(chat, msg, Hanz) {
  const num = getSenderNumber(chat, msg);
  const name = msg.pushName || "TanpaNama";

  if (isStatusBroadcast(chat)) {
    return {
      kind: "STATUS",
      kindColor: chalk.hex("#FFA500"),
      place: num || "status@broadcast",
      who: name,
    };
  }

  if (isChannel(chat)) {
    refreshChannelName(chat, Hanz);
    const channelName = global.channelNameCache.get(chat);
    const place = channelName ? `${channelName} (${chat})` : chat;

    return {
      kind: "CHANNEL",
      kindColor: chalk.yellow,
      place,
      who: channelName || "Channel",
    };
  }

  if (isGroup(chat)) {
    refreshGroupName(chat, Hanz);
    const groupName = global.groupNameCache.get(chat);
    const groupId = String(chat).replace(/@g\.us$/, "");
    const place = groupName || groupId;

    return {
      kind: "GRUP",
      kindColor: chalk.magenta,
      place,
      who: `${name} · ${num}`,
    };
  }
  return {
    kind: "PRIVAT",
    kindColor: chalk.cyan,
    place: num || String(chat).split("@")[0],
    who: name,
  };
}

const BOT_W = "[CLONE 0000]".length;
const KIND_W = "[CHANNEL]".length;
function botTag(Hanz) {
  if (!Hanz || Hanz.isMain !== false)
    return chalk.blue("[UTAMA]".padEnd(BOT_W) + " ");
  const num = String(Hanz.instanceKey || Hanz.user?.id || "")
    .split(":")[0]
    .split("@")[0]
    .replace(/\D/g, "");
  return chalk.magenta(
    `[CLONE ${num ? num.slice(-4) : "?"}]`.padEnd(BOT_W) + " ",
  );
}

function logInbound(chat, msg, text, Hanz) {
  const meta = chatLogMeta(chat, msg, Hanz);
  console.log(
    chalk.blue("[MASUK] ") +
      botTag(Hanz) +
      meta.kindColor(`[${meta.kind}]`.padEnd(KIND_W) + " ") +
      chalk.white(meta.place + " ") +
      chalk.gray(`(${meta.who})`) +
      chalk.white(" → ") +
      chalk.white(truncateLog(text)),
  );
}

function logExecute(chat, msg, cmdName, cmdArgs, Hanz) {
  const meta = chatLogMeta(chat, msg, Hanz);
  console.log(
    chalk.green("[CMD]   ") +
      botTag(Hanz) +
      meta.kindColor(`[${meta.kind}]`.padEnd(KIND_W) + " ") +
      chalk.white(meta.place + " ") +
      chalk.gray(`(${meta.who})`) +
      chalk.white(" → ") +
      chalk.yellow(`${cmdName}${cmdArgs || ""}`),
  );
}

function logNotFound(chat, msg, cmdName, Hanz) {
  const meta = chatLogMeta(chat, msg, Hanz);
  console.log(
    chalk.magenta("[SKIP]  ") +
      botTag(Hanz) +
      meta.kindColor(`[${meta.kind}]`.padEnd(KIND_W) + " ") +
      chalk.white(meta.place + " ") +
      chalk.white(`command `) +
      chalk.yellow(`"${cmdName}"`) +
      chalk.white(` tidak ada `) +
      chalk.gray(`← ${meta.who}`),
  );
}

function logRunError(chat, msg, cmdName, err, Hanz) {
  const meta = chatLogMeta(chat, msg, Hanz);
  console.error(
    chalk.red("[ERROR] ") +
      botTag(Hanz) +
      meta.kindColor(`[${meta.kind}]`.padEnd(KIND_W) + " ") +
      chalk.white(meta.place + " ") +
      chalk.yellow(`${cmdName} `) +
      chalk.red(err?.message || String(err)) +
      chalk.gray(` ← ${meta.who}`),
  );
}

function getSenderNumber(chat, msg) {
  const candidates = [
    msg?.key?.senderPn,
    msg?.key?.participantAlt,
    msg?.key?.remoteJidAlt,
    msg?.key?.participant,
    msg?.key?.remoteJid,
    chat,
  ];
  const raw =
    candidates.find((v) => v && !v.endsWith("@lid")) ||
    candidates.find((v) => v) ||
    "";
  return raw.split("@")[0].split(":")[0].replace(/\D/g, "");
}

function isSuperOwner(chat, msg, isMain = true) {
  const superOwners = []
    .concat(config.superOwner)
    .map((n) => n.replace(/\D/g, ""));
  const senderNumber = getSenderNumber(chat, msg);
  const fromMe = (isMain && msg?.key?.fromMe) || false;
  return (
    superOwners.some((n) => n === senderNumber) ||
    superOwnerLidCache.has(senderNumber) ||
    fromMe
  );
}

function isCoOwner(chat, msg) {
  const coOwners = []
    .concat(config.coOwner || [])
    .map((n) => n.replace(/\D/g, ""));
  const senderNumber = getSenderNumber(chat, msg);
  return (
    coOwners.some((n) => n === senderNumber) ||
    coOwnerLidCache.has(senderNumber)
  );
}

function isOwner(chat, msg, isMain = true) {
  return isSuperOwner(chat, msg, isMain) || isCoOwner(chat, msg);
}

function parseCommand(
  text,
  isButton = false,
  Hanz = null,
  isMain = true,
  forceNoPrefix = false,
) {
  const prefix = getSetting(Hanz, isMain, "prefix");

  if (text.startsWith(prefix)) {
    const args = text.slice(prefix.length).trim().split(/ +/);
    const name = args.shift().toLowerCase();
    return { name, args, fullArgs: args.join(" "), raw: text, hasPrefix: true };
  }

  const allowNoPrefix = getSetting(Hanz, isMain, "noPrefix") !== false;
  if (!allowNoPrefix && !isButton && !forceNoPrefix) return null;

  const words = text.trim().split(/ +/);
  const name = words[0].toLowerCase();
  if (plugins.has(name)) {
    const args = words.slice(1);
    return {
      name,
      args,
      fullArgs: args.join(" "),
      raw: text,
      hasPrefix: false,
    };
  }

  return null;
}

async function handleMessages(Hanz, m, isMain = true) {
  for (const msg of m.messages) {
    if (!msg.message) continue;

    const fromMe = isFromMe(msg);
    const chat = msg.key.remoteJid;
    const participantJid = msg.key.participant || (isGroup(chat) ? null : chat);
    const senderJid = participantJid || chat;
    const senderNumber = getSenderNumber(chat, msg);
    if (msg.pushName && participantJid) {
      global.nameCache = global.nameCache || new Map();
      global.nameCache.set(participantJid, msg.pushName);
    }

    const checkOwner = isOwner(chat, msg);
    const checkSuperOwner = isSuperOwner(chat, msg);
    const checkCoOwner = isCoOwner(chat, msg);

    if (
      !fromMe &&
      getSetting(Hanz, isMain, "botMode") === "self" &&
      !checkOwner
    )
      continue;

    let text = extractMessageText(msg.message);
    let fromSticker = false;
    if (!text) {
      const stickerHashes = stickerCmdStore.hashesFromMessage(msg.message);
      if (
        isMain &&
        stickerHashes.length &&
        checkOwner &&
        stickerCmdStore.hasPending(senderNumber)
      ) {
        const pend = stickerCmdStore.takePending(senderNumber);
        if (pend) {
          const st = stickerCmdStore.findStickerMessage(msg.message);
          stickerCmdStore.set(stickerHashes[0], {
            text: pend.text,
            creator: senderNumber,
            at: Date.now(),
            locked: false,
            isAnimated: !!st?.isAnimated,
          });
          await Hanz.sendMessage(
            chat,
            {
              text: `✅ *Sticker command tersimpan!*\n⚡ Command: \`${pend.text}\`\n\nKirim sticker ini lagi untuk mencobanya.`,
            },
            { quoted: msg },
          );
          continue;
        }
      }
      if (stickerHashes.length) {
        const found = stickerCmdStore.lookup(msg.message);
        if (found?.entry?.text) {
          text = String(found.entry.text).trim();
          fromSticker = true;
        }
      }
    }

    if (!text) continue;

    if (isStatusBroadcast(chat)) {
      if (!fromMe) {
        readline.clearLine(process.stdout, 0);
        readline.cursorTo(process.stdout, 0);
        logInbound(chat, msg, text, Hanz);
      }
      continue;
    }

    const command = parseCommand(text, false, Hanz, isMain, fromSticker);

    if (!fromMe && !command) {
      readline.clearLine(process.stdout, 0);
      readline.cursorTo(process.stdout, 0);
      logInbound(chat, msg, text, Hanz);
    }

    const autoReadOn = getSetting(Hanz, isMain, "autoRead") !== false;
    const autoTypingOn = getSetting(Hanz, isMain, "autoTyping") === true;
    if (autoReadOn) await Hanz.readMessages([msg.key]);
    if (autoTypingOn && !isGroup(chat))
      await Hanz.sendPresenceUpdate("composing", chat);

    if (isGroup(chat) && global.antilinkGroups?.get(chat) && !checkOwner) {
      const linkRegex =
        /https?:\/\/|wa\.me\/|chat\.whatsapp\.com\/|bit\.ly\/|t\.me\//i;
      if (linkRegex.test(text)) {
        const meta = await getGroupInfo(Hanz, chat);
        const norm = normJid;
        const isParticipantAdmin = (jid) => {
          const target = norm(jid);
          const p = meta?.participants?.find((pp) => {
            const pIds = [pp.id, pp.lid, pp.jid].filter(Boolean).map(norm);
            return pIds.includes(target);
          });
          return p?.admin === "admin" || p?.admin === "superadmin";
        };

        const senderIsAdmin = meta ? isParticipantAdmin(senderJid) : false;
        if (!senderIsAdmin) {
          const botIsAdmin = meta
            ? [Hanz.user?.id, Hanz.user?.lid]
                .filter(Boolean)
                .some(isParticipantAdmin)
            : false;

          if (botIsAdmin) {
            try {
              await Hanz.sendMessage(chat, { delete: msg.key });
              await Hanz.sendMessage(chat, {
                text: `@${senderNumber} dilarang mengirim link di grup ini!`,
                mentions: [senderJid],
              });
            } catch {}
          }
          continue;
        }
      }
    }

    if (isGroup(chat) && global.afkUsers?.size > 0) {
      const mentioned =
        msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
      for (const jid of mentioned) {
        const num = jid.split("@")[0];
        if (global.afkUsers.has(num)) {
          const { reason, time } = global.afkUsers.get(num);
          const elapsed = Math.floor((Date.now() - time) / 1000);
          const dur =
            elapsed < 60
              ? `${elapsed} detik`
              : elapsed < 3600
                ? `${Math.floor(elapsed / 60)} menit`
                : `${Math.floor(elapsed / 3600)} jam`;
          await Hanz.sendMessage(chat, {
            text: `@${num} sedang AFK selama ${dur}\nAlasan: ${reason}`,
            mentions: [jid],
          });
        }
      }
    }

    if (!fromMe && global.afkUsers?.has(senderNumber)) {
      const num = senderNumber;
      global.afkUsers.delete(num);
      await Hanz.sendMessage(chat, {
        text: `Selamat datang kembali @${num}! Status AFK kamu telah dihapus.`,
        mentions: [senderJid],
      });
    }

    if (checkSuperOwner && isMain) {
      const body = text.trim();
      const util = require("util");
      const replyEval = (content) =>
        Hanz.sendMessage(chat, { text: String(content) }, { quoted: msg });

      const ctxInfo =
        msg.message?.extendedTextMessage?.contextInfo ||
        msg.message?.imageMessage?.contextInfo ||
        msg.message?.videoMessage?.contextInfo ||
        {};
      const quotedMessage = ctxInfo.quotedMessage || null;
      const m = {
        msg,
        message: msg.message,
        key: msg.key,
        chat,
        sender: senderJid,
        quoted: quotedMessage
          ? {
              message: quotedMessage,
              key: {
                remoteJid: ctxInfo.remoteJid || chat,
                id: ctxInfo.stanzaId,
                participant: ctxInfo.participant,
              },
              ...quotedMessage,
            }
          : null,
        Hanz,
        reply: replyEval,
        sendRaw: (content, jid = chat, options = {}) =>
          sendRawMessage(Hanz, jid, content, options),
      };

      const isSilentResult = (r) =>
        r === undefined || (r && typeof r === "object" && r.key && r.message);
      const ackEval = () =>
        Hanz.sendMessage(chat, { react: { text: "✅", key: msg.key } }).catch(
          () => {},
        );

      const q = quotedMessage || undefined;
      const jid = chat;
      const send = (content, to, options = {}) => {
        if (content === undefined || content === null) {
          throw new Error(
            "send: tidak ada isi pesan (reply pesan dulu kalau pakai q)",
          );
        }
        let jid = chat;
        let opts = options;
        if (to === true) opts = { ...options, quoted: msg };
        else if (typeof to === "string") jid = to;
        else if (to && typeof to === "object") opts = to;
        return sendRawMessage(Hanz, jid, content, opts);
      };

      const isSentMsg = (r) =>
        !!(r && typeof r === "object" && r.key && r.key.id && r.message);

      if (body.startsWith("=>")) {
        try {
          const code = body
            .slice(2)
            .trim()
            .replace(/[;\s]+$/, "");
          const AsyncFunction = Object.getPrototypeOf(
            async function () {},
          ).constructor;
          let asExpression = true;
          try {
            new AsyncFunction(`return (${code})`);
          } catch {
            asExpression = false;
          }
          const result = await eval(
            `(async () => { ${asExpression ? `return (${code})` : code} })()`,
          );
          if (isSentMsg(result)) continue;
          if (isSilentResult(result)) {
            await ackEval();
            continue;
          }
          let out;
          try {
            out = JSON.stringify(
              result,
              (k, v) => {
                if (v && v.type === "Buffer" && Array.isArray(v.data))
                  return Buffer.from(v.data).toString("base64");
                if (v instanceof Uint8Array)
                  return Buffer.from(v).toString("base64");
                return v;
              },
              2,
            );
            if (out === undefined) out = util.inspect(result, { depth: 5 });
          } catch {
            out = util.inspect(result, { depth: 5 });
          }
          await replyEval(out);
        } catch (e) {
          await replyEval(String(e?.stack || e));
        }
        continue;
      }

      if (body.startsWith(">") && !body.startsWith(">>")) {
        try {
          let evaled = await eval(body.slice(1).trim());
          if (isSentMsg(evaled)) continue;
          if (isSilentResult(evaled)) {
            await ackEval();
            continue;
          }
          if (typeof evaled !== "string") {
            evaled = util.inspect(evaled, { depth: 5 });
          }
          await replyEval(evaled);
        } catch (err) {
          await replyEval(String(err?.stack || err));
        }
        continue;
      }

      if (body.startsWith("$")) {
        const { exec } = require("child_process");
        const cmd = body.slice(1).trim();
        exec(
          cmd,
          { timeout: 30000, maxBuffer: 1024 * 1024 },
          async (err, stdout, stderr) => {
            if (err) return replyEval(String(err));
            if (stderr) await replyEval(stderr);
            if (stdout) await replyEval(stdout);
          },
        );
        continue;
      }
    }

    if (command) {
      const handler = plugins.get(command.name);

      if (handler) {
        if (
          !checkSuperOwner &&
          !checkOwner &&
          !COOLDOWN_EXEMPT.has(command.name)
        ) {
          const botId =
            Hanz.instanceKey || (Hanz.isMain === false ? "clone" : "main");
          const cooldownKey = `${botId}:${senderJid}:${command.name}`;
          const lastUsed = cooldownMap.get(cooldownKey) || 0;
          const remaining = COOLDOWN_MS - (Date.now() - lastUsed);

          if (remaining > 0) {
            await Hanz.sendMessage(
              chat,
              {
                text: `⏳ Sabar dulu! Tunggu *${(remaining / 1000).toFixed(1)} detik* lagi sebelum pakai command ini.`,
              },
              { quoted: msg },
            );
            continue;
          }

          cooldownMap.set(cooldownKey, Date.now());
        }

        const cmdArgs = command.args.length ? " " + command.args.join(" ") : "";

        readline.clearLine(process.stdout, 0);
        readline.cursorTo(process.stdout, 0);

        logExecute(chat, msg, command.name, cmdArgs, Hanz);

        try {
          await handler({
            Hanz,
            msg,
            chat,
            sender: senderJid,
            senderNumber,
            pushname: msg.pushName || "Kak",
            isGroup: isGroup(chat),
            isOwner: checkOwner,
            isSuperOwner: checkSuperOwner,
            isCoOwner: checkCoOwner,
            command,
            text,
            mess,
            fakePay: getActiveQuoteFor(Hanz, isMain),
            quotePay,
            quoteMeta,
            quoteStatus,
            isMain,
            prefix: getSetting(Hanz, isMain, "prefix"),
            reply: (content) =>
              sendDocStyleReply(Hanz, chat, content, { quoted: msg }),
            replyFake: (content) =>
              sendDocStyleReply(Hanz, chat, content, {
                quoted: getActiveQuoteFor(Hanz, isMain),
              }),
            send: (content) =>
              Hanz.sendMessage(chat, content, {
                noSelfSync: getSetting(Hanz, isMain, "noSelfSync") === true,
              }),
            sendButtons: (content) => sendButtons(Hanz, chat, content),
            sendList: (content) => sendListMessage(Hanz, chat, content),
            sendInteractive: (content) =>
              sendInteractiveMessage(Hanz, chat, content),
            sendButtonWithImage: (content) =>
              sendButtonWithImage(Hanz, chat, content),
            sendInteractiveWithImage: (content) =>
              sendInteractiveWithImage(Hanz, chat, content),
            react: (emoji) =>
              Hanz.sendMessage(chat, { react: { text: emoji, key: msg.key } }),
          });
        } catch (err) {
          readline.clearLine(process.stdout, 0);
          readline.cursorTo(process.stdout, 0);

          logRunError(chat, msg, command.name, err, Hanz);
          await Hanz.sendMessage(chat, { text: mess.error });
        }
      } else {
        readline.clearLine(process.stdout, 0);
        readline.cursorTo(process.stdout, 0);

        logNotFound(chat, msg, command.name, Hanz);
        await Hanz.sendMessage(chat, {
          text: `❓ Command *${command.name}* tidak ditemukan.`,
        });
      }
    }

    if (autoTypingOn && !isGroup(chat))
      await Hanz.sendPresenceUpdate("paused", chat);
  }
}

async function handleGroupParticipants(Hanz, update) {
  const { id: groupJid, participants, action } = update;
  const memberCount = await getMemberCount(
    Hanz,
    groupJid,
    action,
    participants.length,
  );

  for (const item of participants) {
    const rawJid = typeof item === "string" ? item : item?.id || item?.jid;
    if (!rawJid) continue;

    if (typeof item === "object" && item) {
      const hint = item.notify || item.name || item.verifiedName;
      if (hint) {
        global.nameCache = global.nameCache || new Map();
        global.nameCache.set(rawJid, hint);
      }
    }

    const directPhone =
      typeof item === "object" && item?.phoneNumber ? item.phoneNumber : null;
    const jid = directPhone || (await resolvePhoneJid(Hanz, rawJid));
    const number = normJid(jid);
    const altJid = jid !== rawJid ? rawJid : null;

    if (typeof item === "object" && item) {
      const hint = item.notify || item.name || item.verifiedName;
      if (hint && jid !== rawJid) {
        global.nameCache = global.nameCache || new Map();
        global.nameCache.set(jid, hint);
      }
    }

    if (action === "add" && global.welcomeGroups?.get(groupJid)) {
      await sendMemberCard(
        Hanz,
        groupJid,
        jid,
        altJid,
        "welcome",
        `Selamat datang @${number} di grup ini!`,
        memberCount,
      );
    }

    if (action === "remove" && global.goodbyeGroups?.get(groupJid)) {
      await sendMemberCard(
        Hanz,
        groupJid,
        jid,
        altJid,
        "goodbye",
        `Sampai jumpa @${number}, semoga sukses!`,
        memberCount,
      );
    }
  }
}

async function getMemberCount(Hanz, groupJid, action, batchSize) {
  global.groupMemberCounts = global.groupMemberCounts || new Map();

  if (!global.groupMemberCounts.has(groupJid)) {
    try {
      const meta = await Hanz.groupMetadata(groupJid);
      global.groupMemberCounts.set(groupJid, meta.participants.length);
    } catch {
      return null;
    }
  } else if (action === "add") {
    global.groupMemberCounts.set(
      groupJid,
      global.groupMemberCounts.get(groupJid) + batchSize,
    );
  } else if (action === "remove") {
    global.groupMemberCounts.set(
      groupJid,
      Math.max(0, global.groupMemberCounts.get(groupJid) - batchSize),
    );
  }

  return global.groupMemberCounts.get(groupJid);
}

async function sendMemberCard(
  Hanz,
  groupJid,
  jid,
  altJid,
  type,
  fallbackText,
  memberCount,
) {
  try {
    let name = await resolveName(Hanz, jid, altJid);
    if (!name) {
      name = await resolveNameFromGroup(Hanz, groupJid, jid, altJid);
    }

    const imageBuffer = await generateCard({
      Hanz,
      jid,
      groupJid,
      type,
      name,
      memberCount,
    });
    const nomorUser = normJid(jid);

    await sendInteractiveWithImage(Hanz, groupJid, {
      text: fallbackText,
      footer: config.footerTxt || config.botName || "",
      imageSource: imageBuffer,
      quoted: getActiveQuoteFor(Hanz, Hanz?.isMain !== false),
      contextInfo: {
        mentionedJid: [jid],
        forwardingScore: 999,
        isForwarded: true,
      },
      buttons: [
        {
          name: "quick_reply",
          buttonParamsJson: JSON.stringify({
            display_text:
              type === "welcome"
                ? `Terimakasih🙏\nDisini saya mau Open Vcs Free Temenin sampai Crot💦 Yang Minat langsung Vc aja ya. Nomor saya👉 wa.me/${nomorUser}`
                : `Goodbay👋`,
            id: type === "welcome" ? "welcomecik" : "goodbaycik",
          }),
        },
      ],
    });
  } catch (err) {
    console.log(
      chalk.red(
        `[${type.toUpperCase()}-CARD] Gagal generate/kirim button: ${err.message}`,
      ),
    );
    try {
      await Hanz.sendMessage(groupJid, { text: fallbackText, mentions: [jid] });
    } catch (err2) {
      console.log(
        chalk.red(
          `[${type.toUpperCase()}-CARD] Fallback teks juga gagal: ${err2.message}`,
        ),
      );
    }
  }
}

function handleContactsUpdate(contacts = []) {
  global.nameCache = global.nameCache || new Map();
  for (const c of contacts) {
    const jid = c?.id;
    const name = c?.name || c?.notify || c?.verifiedName;
    if (jid && name) {
      global.nameCache.set(jid, name);
    }
  }
}

module.exports = handleMessages;
module.exports.handleContactsUpdate = handleContactsUpdate;
module.exports.resolveOwnerLids = resolveOwnerLids;
module.exports.handleGroupParticipants = handleGroupParticipants;
module.exports.preloadGroupNames = preloadGroupNames;
