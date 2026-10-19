'use strict';

/**
 * Spotify downloader (multi-source fallback)
 * Sumber: scrapr (spotmate / spotidown / soundloaders)
 */

const axios = require("axios");
const cheerio = require("cheerio");

const baseUrl = "https://spotmate.online";
const regexSpotifyUrl = /open\.spotify\.com\/(track|album|playlist)\/([a-zA-Z0-9]+)/;

const userAgents = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Safari/605.1.15",
];

async function spotmate(url) {
  try {
    if (!regexSpotifyUrl.test(url)) {
      throw new Error("Must be a valid Spotify URL.");
    }

    const userAgent = userAgents[Math.floor(Math.random() * userAgents.length)];
    const client = axios.create({
      baseURL: baseUrl,
      headers: {
        "User-Agent": userAgent,
      },
    });

    const r1 = await client.get("/en1");
    const cookies = r1.headers["set-cookie"];
    const cookieHeader = cookies ? cookies.map((c) => c.split(";")[0]).join("; ") : "";

    const $ = cheerio.load(r1.data);
    const csrfToken = $('meta[name="csrf-token"]').attr("content");

    if (!csrfToken) {
      throw new Error("Could not extract CSRF token from Spotmate.");
    }

    const apiHeaders = {
      "X-CSRF-TOKEN": csrfToken,
      "Content-Type": "application/json",
      Cookie: cookieHeader,
      Referer: "https://spotmate.online/en1",
      Origin: "https://spotmate.online",
      "X-Requested-With": "XMLHttpRequest",
    };

    const r2 = await client.post(
      "/getTrackData",
      { spotify_url: url },
      { headers: apiHeaders }
    );

    const trackData = r2.data;
    if (!trackData || trackData.error || !trackData.name) {
      throw new Error(trackData.message || "Failed to fetch track details from Spotmate.");
    }

    const title = trackData.name;
    const artist = trackData.artists ? trackData.artists.map((a) => a.name).join(", ") : "Unknown Artist";
    const thumbnail = trackData.album && trackData.album.images && trackData.album.images[0]
      ? trackData.album.images[0].url
      : "";

    const r3 = await client.post(
      "/convert",
      { urls: url },
      { headers: apiHeaders }
    );

    const convertData = r3.data;
    if (!convertData || convertData.error || !convertData.url) {
      throw new Error(convertData.message || "Failed to get download URL from Spotmate.");
    }

    return {
      status: true,
      result: {
        title: artist ? `${artist} - ${title}` : title,
        thumbnail,
        type: "audio",
        downloads: [
          {
            type: "mp3",
            url: convertData.url,
          },
        ],
      },
    };
  } catch (error) {
    return {
      status: false,
      message: error.message,
    };
  }
}


async function spotidown(url) {
  try {
    const headers = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      Accept: "application/json, text/javascript, */*; q=0.01",
      "X-Requested-With": "XMLHttpRequest",
      Referer: "https://spotidown.app/",
      Origin: "https://spotidown.app",
    };

    const r1 = await axios.get("https://spotidown.app/", {
      headers: { ...headers, Accept: "text/html" },
    });
    const mainPage = r1.data;
    const cookies = r1.headers["set-cookie"];

    const $1 = cheerio.load(mainPage);
    const $form = $1('form[name="spotifyurl"]');

    if (!$form.length) {
      throw new Error("Could not find the submission form on Spotidown.");
    }

    const fd1 = new URLSearchParams();
    $form.find("input").each((i, el) => {
      const name = $1(el).attr("name");
      const value = $1(el).attr("value") || "";
      if (name && name !== "url") {
        fd1.append(name, value);
      }
    });

    fd1.append("url", url);
    fd1.append("g-recaptcha-response", ""); 

    const r2 = await axios.post(
      "https://spotidown.app/action",
      fd1.toString(),
      {
        headers: {
          ...headers,
          "Content-Type": "application/x-www-form-urlencoded",
          Cookie: cookies ? cookies.map((c) => c.split(";")[0]).join("; ") : "",
        },
      },
    );

    if (r2.data.error) {
      throw new Error(r2.data.message || "Error during initial action.");
    }

    const $2 = cheerio.load(r2.data.data);
    const $form2 = $2('form[name="submitspurl"]');

    if ($form2.length) {
      const fd2 = new URLSearchParams();
      $form2.find("input").each((i, el) => {
        const name = $2(el).attr("name");
        const value = $2(el).attr("value") || "";
        if (name) fd2.append(name, value);
      });

      const r3 = await axios.post(
        "https://spotidown.app/action/track",
        fd2.toString(),
        {
          headers: {
            ...headers,
            "Content-Type": "application/x-www-form-urlencoded",
            Cookie: cookies
              ? cookies.map((c) => c.split(";")[0]).join("; ")
              : "",
          },
        },
      );

      if (r3.data.error) {
        throw new Error(r3.data.message || "Error during track action.");
      }

      return parseDownloadPage(r3.data.data);
    } else {
      return parseDownloadPage(r2.data.data);
    }
  } catch (error) {
    return {
      status: false,
      message: error.message,
    };
  }
}

function parseDownloadPage(html) {
  const $ = cheerio.load(html);

  const title =
    $("h3").first().text().trim() ||
    $("h1").first().text().trim() ||
    "Spotify Track";
  const artist = $("p").first().text().trim();
  const thumbnail = $("img").first().attr("src");

  const downloads = [];
  $("a").each((i, el) => {
    const $el = $(el);
    const link = $el.attr("href");
    const text = $el.text().trim();

    if (
      link &&
      link.startsWith("http") &&
      !link.includes("premium.html") &&
      text !== "Download Another Song"
    ) {
      downloads.push({
        type: text || "Download",
        url: link,
      });
    }
  });

  return {
    status: true,
    result: {
      title: artist ? `${artist} - ${title}` : title,
      thumbnail,
      type: "audio",
      downloads,
    },
  };
}


async function soundloaders(url) {
  try {
    const cleanUrl = url.trim().split("?")[0];
    const BASE = "https://soundloaders.app";
    const ua =
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36";

    const r1 = await axios.get(BASE + "/", {
      headers: { "User-Agent": ua },
      timeout: 10000,
    });
    const cookies = (r1.headers["set-cookie"] || []).map((c) => c.split(";")[0]).join("; ");

    let token = "";
    try {
      const vRes = await axios.post(
        BASE + "/api/userverify",
        new URLSearchParams({ url: cleanUrl }).toString(),
        {
          headers: {
            "User-Agent": ua,
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
            Referer: BASE + "/",
            Origin: BASE,
            Cookie: cookies,
          },
          timeout: 8000,
        }
      );
      if (vRes.data?.token) token = vRes.data.token;
    } catch (_) {}

    const { data: actRes } = await axios.post(
      BASE + "/action",
      new URLSearchParams({ url: cleanUrl, cftoken: token }).toString(),
      {
        headers: {
          "User-Agent": ua,
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          Referer: BASE + "/",
          Origin: BASE,
          Cookie: cookies,
        },
        timeout: 12000,
      }
    );

    if (!actRes || actRes.status === false) {
      throw new Error(actRes?.error || "SoundLoaders returned an error.");
    }

    const html = actRes.html || "";
    const $ = cheerio.load(html);

    const titleH2 = $("h2").first().text().trim();
    const artistP = $('p.text-sm, p[class*="text-white"]').first().text().trim();
    const thumbImg = $('img[class*="rounded"], img').first().attr("src") || "";

    const tracks = [];
    $('form[name="submitspurl"]').each((_, form) => {
      const dataVal = $(form).find('input[name="data"]').val() || "";
      const trackToken = $(form).find('input[name="track_token"]').val() || "";
      let trackInfo = { title: "", artist: "", thumbnail: "" };

      if (dataVal) {
        try {
          const decoded = JSON.parse(Buffer.from(dataVal, "base64").toString());
          trackInfo.title = decoded.name || "";
          trackInfo.artist = decoded.artist || "";
          trackInfo.thumbnail = decoded.cover || "";
        } catch (_) {}
      }

      tracks.push({
        data: dataVal,
        trackToken,
        title: trackInfo.title || titleH2 || "Spotify Track",
        artist: trackInfo.artist || artistP || "",
        thumbnail: trackInfo.thumbnail || thumbImg,
      });
    });

    if (tracks.length === 0) {
      throw new Error("No tracks found from SoundLoaders.");
    }

    const downloads = [];
    const firstTrack = tracks[0];

    if (tracks.length === 1 && firstTrack.data && firstTrack.trackToken) {
      try {
        const { data: dlRes } = await axios.post(
          BASE + "/action/tracks",
          new URLSearchParams({
            data: firstTrack.data,
            track_token: firstTrack.trackToken,
          }).toString(),
          {
            headers: {
              "User-Agent": ua,
              "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
              Referer: BASE + "/",
              Origin: BASE,
              Cookie: cookies,
            },
            timeout: 4000,
          }
        );

        if (dlRes && dlRes.html) {
          const $dl = cheerio.load(dlRes.html);
          $dl("a[href^='http']").each((_, a) => {
            const href = $dl(a).attr("href");
            const text = $dl(a).text().trim();
            if (href && !href.includes("tunecable") && !href.includes("premium")) {
              const isCover = text.toLowerCase().includes("cover") || href.includes("cover");
              downloads.push({
                quality: isCover ? "cover" : "320kbps",
                type: isCover ? "photo" : "audio",
                url: href,
              });
            }
          });
        }
      } catch (_) {}
    }

    if (downloads.length === 0) {
      tracks.forEach((t, i) => {
        const label = t.artist ? `${t.artist} - ${t.title}` : t.title;
        downloads.push({
          quality: "320kbps",
          type: "audio",
          title: label,
          trackIndex: i + 1,
          url: BASE + "/action",
        });
      });
    }

    return {
      status: true,
      result: {
        title: firstTrack.title || titleH2 || "Spotify Track",
        artist: firstTrack.artist || artistP || undefined,
        thumbnail: firstTrack.thumbnail || thumbImg,
        type: "audio",
        downloads,
      },
    };
  } catch (err) {
    return {
      status: false,
      message: err.message || "Failed to scrape Spotify via SoundLoaders.",
    };
  }
}


/**
 * @param {string} url - Spotify track/album/playlist URL
 * @returns {Promise<{ title: string, artist?: string, thumbnail?: string, downloads: Array }>}
 */
async function SpotifyDl(url) {
    if (!url || typeof url !== 'string') throw new Error('URL Spotify tidak valid');
    url = url.trim();
    if (!/open\.spotify\.com\/(track|album|playlist)\//i.test(url)) {
        throw new Error('Link bukan Spotify track/album/playlist');
    }

    const scrapers = [spotmate, spotidown, soundloaders];
    let lastErr = 'Semua sumber Spotify gagal';
    for (const fn of scrapers) {
        try {
            const res = await fn(url);
            if (res?.status && res.result?.downloads?.length) {
                return res.result;
            }
            lastErr = res?.message || lastErr;
        } catch (e) {
            lastErr = e.message || lastErr;
        }
    }
    throw new Error(lastErr);
}

module.exports = { SpotifyDl };
