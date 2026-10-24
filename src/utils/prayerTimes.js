/**
 * Jadwal sholat harian via API Aladhan (metode Kemenag).
 * Cache per hari, refresh otomatis. Pakai jam sistem (NTP server).
 * Tidak butuh axios — pakai fetch bawaan Node 18+.
 */

const NAMES = {
  Fajr: "Subuh",
  Sunrise: "Terbit",
  Dhuhr: "Dzuhur",
  Asr: "Ashar",
  Maghrib: "Maghrib",
  Isha: "Isya",
};

const ORDER = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];

let cache = {
  date: null,
  timings: null,
  city: null,
};

function todayLocal() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function nowMinutesJakarta() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());
  const h = Number(parts.find((p) => p.type === "hour").value);
  const m = Number(parts.find((p) => p.type === "minute").value);
  return h * 60 + m;
}

function parseHM(str) {
  const m = String(str).match(/(\d{1,2}):(\d{2})/);
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]);
}

function fmtRemain(mins) {
  if (mins < 0) mins = 0;
  if (mins >= 60) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}j ${m}m` : `${h}j`;
  }
  return `${mins}m`;
}

async function fetchTimings(city, country, method) {
  const params = new URLSearchParams({
    city: String(city || "Jakarta"),
    country: String(country || "Indonesia"),
    method: String(method ?? 20),
  });
  const url = `https://api.aladhan.com/v1/timingsByCity?${params}`;
  const ctrl = new AbortController();
  const to = setTimeout(() => ctrl.abort(), 12000);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data?.code !== 200 || !data?.data?.timings) {
      throw new Error("Respon Aladhan tidak valid");
    }
    return data.data.timings;
  } finally {
    clearTimeout(to);
  }
}

/**
 * Pastikan cache terisi untuk hari ini. Silent fail → return null / cache lama.
 */
async function ensure(city, country, method) {
  const d = todayLocal();
  if (cache.date === d && cache.timings && cache.city === city) {
    return cache.timings;
  }
  try {
    const timings = await fetchTimings(city, country, method);
    cache = { date: d, timings, city };
    return timings;
  } catch (_) {
    return cache.timings || null;
  }
}

/**
 * Sholat berikutnya + sisa menit.
 * Kalau semua sudah lewat → Subuh besok.
 */
function getNext(timings) {
  if (!timings) return null;
  const now = nowMinutesJakarta();
  for (const key of ORDER) {
    const t = parseHM(timings[key]);
    if (t == null) continue;
    if (t > now) {
      return {
        key,
        name: NAMES[key] || key,
        time: String(timings[key]).slice(0, 5),
        remainMin: t - now,
      };
    }
  }
  const fajr = parseHM(timings.Fajr);
  if (fajr == null) return null;
  return {
    key: "Fajr",
    name: "Subuh",
    time: String(timings.Fajr).slice(0, 5),
    remainMin: 24 * 60 - now + fajr,
  };
}

/** String siap tampil di spinner, atau null. */
function formatLine(timings) {
  const next = getNext(timings);
  if (!next) return null;
  return `${next.name} ${next.time} · ${fmtRemain(next.remainMin)}`;
}

/** Hampir masuk waktu (≤ 15 menit). */
function isSoon(timings) {
  const next = getNext(timings);
  return !!(next && next.remainMin <= 15);
}

module.exports = {
  ensure,
  getNext,
  formatLine,
  isSoon,
  NAMES,
  ORDER,
};
