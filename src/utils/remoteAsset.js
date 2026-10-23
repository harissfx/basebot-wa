"use strict";

const axios = require("axios");
const fs = require("fs");
const os = require("os");
const path = require("path");

const memCache = new Map();
const pending = new Map();
const CACHE_DIR = path.join(os.tmpdir(), "wabot-assets");

const ASSET_URLS = {
  bahanProfile: "https://i.ibb.co.com/bgTt3y7w/bahanprofile.jpg",
  noProfile: "https://i.ibb.co.com/m5mGdZMb/no-profile.png",
  magerNulis: "https://i.ibb.co.com/zWmg9fkm/magernulis.jpg",
  welcome: "https://i.ibb.co.com/MxWY11fc/welcome.png",
};

/*cadangan kalau url di atas gak bisa*/
const LOCAL_FILES = {
  bahanProfile: path.join(__dirname, "../media/bahanprofile.jpeg"),
  noProfile: path.join(__dirname, "../media/no-profile.png"),
  magerNulis: path.join(__dirname, "../media/magernulis.jpg"),
  welcome: path.join(__dirname, "../media/welcome.png"),
};

function localPath(key) {
  const p = LOCAL_FILES[key];
  return p && fs.existsSync(p) ? p : null;
}

function getUrl(key) {
  const url = ASSET_URLS[key];
  if (!url) throw new Error(`Asset "${key}" tidak terdaftar di ASSET_URLS.`);
  return url;
}

function tryGetUrl(key) {
  try {
    return getUrl(key);
  } catch {
    return null;
  }
}

function diskPath(key, url) {
  const ext = path.extname(new URL(url).pathname) || ".bin";
  return path.join(CACHE_DIR, `${key}${ext}`);
}

async function download(key) {
  const url = getUrl(key);
  const file = diskPath(key, url);
  try {
    const { data } = await axios.get(url, {
      responseType: "arraybuffer",
      timeout: 20000,
    });
    const buf = Buffer.from(data);
    if (!buf.length) throw new Error("response kosong");
    fs.mkdirSync(CACHE_DIR, { recursive: true });
    fs.writeFileSync(file, buf);
    return buf;
  } catch (err) {
    if (fs.existsSync(file)) {
      const old = fs.readFileSync(file);
      if (old.length > 0) {
        console.warn(
          `[ASSET] Gagal download ${key} (${err.message}), pakai cache lama.`,
        );
        return old;
      }
      try {
        fs.unlinkSync(file);
      } catch {}
    }
    const local = localPath(key);
    if (local) {
      console.warn(
        `[ASSET] Gagal download ${key} (${err.message}), pakai file lokal media/.`,
      );
      return fs.readFileSync(local);
    }
    throw new Error(
      `Gagal download asset "${key}" dari ${url}: ${err.message}`,
    );
  }
}

async function getAssetBuffer(key) {
  if (memCache.has(key)) return memCache.get(key);
  if (!pending.has(key)) {
    pending.set(
      key,
      download(key).finally(() => pending.delete(key)),
    );
  }
  const buf = await pending.get(key);
  memCache.set(key, buf);
  return buf;
}

async function getAssetPath(key) {
  await getAssetBuffer(key);
  const cached = diskPath(key, getUrl(key));
  if (fs.existsSync(cached)) return cached;
  const local = localPath(key);
  if (local) return local;
  return cached;
}

module.exports = { getAssetBuffer, getAssetPath, tryGetUrl };
