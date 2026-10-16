"use strict";
var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var __async = (__this, __arguments, generator) => {
  return new Promise((resolve, reject) => {
    var fulfilled = (value) => {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    };
    var rejected = (value) => {
      try {
        step(generator.throw(value));
      } catch (e) {
        reject(e);
      }
    };
    var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
    step((generator = generator.apply(__this, __arguments)).next());
  });
};

// providers/disneyMirror/stream.ts
var stream_exports = {};
__export(stream_exports, {
  getStream: () => getStream
});


// providers/netMirrorCommon.ts
var getNetMirrorBaseUrl = /* @__PURE__ */ __name((providerContext) => __async(null, null, function* () {
  try {
    if (providerContext == null ? void 0 : providerContext.kvStore) {
      const override = yield providerContext.kvStore.get("baseUrlOverride");
      if (override && override.trim().startsWith("http")) {
        return override.trim().replace(/\/+$/, "");
      }
    }
  } catch (e) {
  }
  return "https://net52.cc";
}), "getNetMirrorBaseUrl");
var getNetMirrorMobileHeaders = /* @__PURE__ */ __name((baseUrl, cookieStr) => {
  const headers = {
    "User-Agent": "Mozilla/5.0 (Linux; Android 13; Pixel 5 Build/TQ3A.230901.001; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/144.0.7559.132 Safari/537.36 /OS.Gatu v3.0",
    Referer: `${baseUrl}/home`,
    Origin: baseUrl,
    Accept: "application/json, text/plain, */*"
  };
  if (cookieStr) {
    headers["Cookie"] = cookieStr;
  }
  return headers;
}, "getNetMirrorMobileHeaders");
var unlockNetMirrorMobileSession = /* @__PURE__ */ __name((providerContext, baseUrl) => __async(null, null, function* () {
  var _a, _b, _c, _d, _e, _f, _g, _h;
  const { axios, kvStore } = providerContext;
  try {
    const appUa = "Mozilla/5.0 (Linux; Android 13; Pixel 5 Build/TQ3A.230901.001; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/144.0.7559.132 Safari/537.36 /OS.Gatu v3.0";
    const homeRes = yield axios.get(`${baseUrl}/mobile/home?app=1`, {
      headers: {
        "User-Agent": appUa,
        "X-Requested-With": "com.netmirror.app",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
      },
      timeout: 8e3
    });
    const setCookies = ((_a = homeRes.headers) == null ? void 0 : _a["set-cookie"]) || ((_b = homeRes.headers) == null ? void 0 : _b["x-set-cookie"]) || [];
    const cookiesArr = Array.isArray(setCookies) ? setCookies : [setCookies];
    const initialCookie = cookiesArr.map((c) => String(c).split(";")[0]).filter(Boolean).join("; ");
    for (const cookie of cookiesArr) {
      const token = usableSessionToken((_c = String(cookie).match(/t_hash_t=([^;]+)/)) == null ? void 0 : _c[1]);
      if (token) {
        if (kvStore) {
          yield kvStore.set("t_hash_t", token);
          yield kvStore.set("t_hash_t_data", { token, ts: Date.now() });
        }
        return token;
      }
    }
    const html = typeof homeRes.data === "string" ? homeRes.data : "";
    const matchAddHash = html.match(/data-addhash=["']([^"']+)["']/);
    const addhash = matchAddHash ? matchAddHash[1] : null;
    if (!addhash) return void 0;
    const hostDomain = baseUrl.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
    const userverUrl = `https://userver.${hostDomain}/?hee5=${addhash}&a=y&t=${Math.random()}`;
    yield axios.get(userverUrl, {
      headers: {
        "User-Agent": appUa,
        Referer: `${baseUrl}/mobile/home?app=1`,
        Cookie: initialCookie,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
      },
      maxRedirects: 0,
      validateStatus: /* @__PURE__ */ __name(() => true, "validateStatus"),
      timeout: 5e3
    }).catch(() => {
    });
    const pollCookie = [
      "ext_name=ojplmecpdpgccookcobabopnaifgidhf",
      `addhash=${encodeURIComponent(addhash)}`,
      initialCookie
    ].filter(Boolean).join("; ");
    const startTime = Date.now();
    let verifiedToken;
    while (Date.now() - startTime < 45e3) {
      yield new Promise((resolve) => setTimeout(resolve, 2e3));
      try {
        const vRes = yield axios.post(
          `${baseUrl}/mobile/verify2.php`,
          `verify=${encodeURIComponent(addhash)}`,
          {
            headers: {
              "User-Agent": appUa,
              "X-Requested-With": "XMLHttpRequest",
              "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
              Referer: `${baseUrl}/mobile/home`,
              Origin: baseUrl,
              Cookie: pollCookie
            },
            validateStatus: /* @__PURE__ */ __name(() => true, "validateStatus"),
            timeout: 5e3
          }
        );
        const vSetCookies = ((_d = vRes.headers) == null ? void 0 : _d["set-cookie"]) || ((_e = vRes.headers) == null ? void 0 : _e["x-set-cookie"]) || [];
        const vCookiesArr = Array.isArray(vSetCookies) ? vSetCookies : [vSetCookies];
        for (const sc of vCookiesArr) {
          if (typeof sc === "string" && sc.includes("t_hash_t=")) {
            const tokenMatch = sc.match(/t_hash_t=([^;]+)/);
            if (tokenMatch && !tokenMatch[1].includes("::99")) {
              verifiedToken = decodeURIComponent(tokenMatch[1]);
              break;
            }
          }
        }
        if (verifiedToken) {
          break;
        }
        if (((_f = vRes.data) == null ? void 0 : _f.statusup) === "All Done") {
          const reloadRes = yield axios.get(`${baseUrl}/mobile/home?app=1`, {
            headers: {
              "User-Agent": appUa,
              "X-Requested-With": "com.netmirror.app",
              Cookie: pollCookie
            },
            timeout: 6e3
          }).catch(() => null);
          const rSetCookies = ((_g = reloadRes == null ? void 0 : reloadRes.headers) == null ? void 0 : _g["set-cookie"]) || ((_h = reloadRes == null ? void 0 : reloadRes.headers) == null ? void 0 : _h["x-set-cookie"]) || [];
          const rCookiesArr = Array.isArray(rSetCookies) ? rSetCookies : [rSetCookies];
          for (const sc of rCookiesArr) {
            if (typeof sc === "string" && sc.includes("t_hash_t=")) {
              const tokenMatch = sc.match(/t_hash_t=([^;]+)/);
              if (tokenMatch && !tokenMatch[1].includes("::99")) {
                verifiedToken = decodeURIComponent(tokenMatch[1]);
                break;
              }
            }
          }
          break;
        }
      } catch (e) {
      }
    }
    if (verifiedToken && kvStore) {
      yield kvStore.set("t_hash_t", verifiedToken);
      yield kvStore.set("t_hash_t_data", { token: verifiedToken, ts: Date.now() });
    }
    return verifiedToken;
  } catch (err) {
    console.log("Mobile ad verification notice:", (err == null ? void 0 : err.message) || err);
    return void 0;
  }
}), "unlockNetMirrorMobileSession");
var unlockPromises = /* @__PURE__ */ new Map();
var unlockSharedSession = /* @__PURE__ */ __name((providerContext, baseUrl) => {
  let promise = unlockPromises.get(baseUrl);
  if (!promise) {
    promise = unlockNetMirrorMobileSession(providerContext, baseUrl).finally(() => {
      unlockPromises.delete(baseUrl);
    });
    unlockPromises.set(baseUrl, promise);
  }
  return promise;
}, "unlockSharedSession");
var usableSessionToken = /* @__PURE__ */ __name((value) => {
  if (typeof value !== "string" || !value.trim()) return void 0;
  let token = value.trim();
  try {
    token = decodeURIComponent(token);
  } catch (e) {
  }
  if (token.includes("::99")) return void 0;
  const timestamp = token.split("::")[2];
  if (timestamp && /^\d{10}$/.test(timestamp) && Date.now() / 1e3 - Number(timestamp) >= 43200) return void 0;
  return token;
}, "usableSessionToken");
var getNetMirrorCookie = /* @__PURE__ */ __name((providerContext, ott, unlockIfMissing = true) => __async(null, null, function* () {
  const { kvStore } = providerContext;
  const baseUrl = yield getNetMirrorBaseUrl(providerContext);
  const ottCookie = ott === "hs" ? "dp" : ott === "pv" ? "pv" : "nf";
  let t_hash_t;
  try {
    if (kvStore) {
      const cached = yield kvStore.get("t_hash_t_data");
      const userToken = usableSessionToken(yield kvStore.get("t_hash_t"));
      if (userToken && userToken !== usableSessionToken(cached == null ? void 0 : cached.token)) {
        t_hash_t = userToken;
        yield kvStore.set("t_hash_t_data", { token: t_hash_t, ts: Date.now() });
      }
      if (!t_hash_t && cached && Date.now() - cached.ts < 432e5) {
        t_hash_t = usableSessionToken(cached.token);
      }
    }
  } catch (e) {
  }
  if (!t_hash_t && unlockIfMissing) {
    t_hash_t = yield unlockSharedSession(providerContext, baseUrl);
    if (t_hash_t && kvStore) {
      yield kvStore.set("t_hash_t", t_hash_t);
      yield kvStore.set("t_hash_t_data", { token: t_hash_t, ts: Date.now() });
    }
  }
  return [t_hash_t ? `t_hash_t=${t_hash_t}` : "", "hd=on", `ott=${ottCookie}`].filter(Boolean).join("; ");
}), "getNetMirrorCookie");
var resolveNewTvApiBase = /* @__PURE__ */ __name((providerContext) => __async(null, null, function* () {
  var _a;
  const { axios, kvStore } = providerContext;
  try {
    if (kvStore) {
      const cached = yield kvStore.get("newtv_api_base");
      if (cached && cached.apiBase && Date.now() - cached.ts < 864e5) {
        return cached.apiBase;
      }
    }
  } catch (e) {
  }
  const domains = [
    "https://mobiledetects.com",
    "https://mobiledetect.app",
    "https://mobidetect.art",
    "https://mobidetect.cc",
    "https://mobidetect.shop",
    "https://mobidetects.top"
  ];
  for (const domain of domains) {
    try {
      const res = yield axios.get(`${domain}/checknewtv.php`, {
        headers: {
          "X-Requested-With": "NetmirrorNewTV v1.0",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0 /OS.GatuNewTV v1.0",
          Accept: "application/json, text/plain, */*"
        },
        timeout: 4e3
      });
      const tokenHash = (_a = res.data) == null ? void 0 : _a.token_hash;
      if (tokenHash) {
        const decoded = typeof atob === "function" ? atob(tokenHash) : Buffer.from(tokenHash, "base64").toString("utf-8");
        const apiBase = decoded.trim().replace(/\/+$/, "");
        if (apiBase.startsWith("http")) {
          if (kvStore) {
            yield kvStore.set("newtv_api_base", { apiBase, ts: Date.now() });
          }
          return apiBase;
        }
      }
    } catch (e) {
    }
  }
  return "https://tv.imgcdn.kim";
}), "resolveNewTvApiBase");
var titleCache = /* @__PURE__ */ new Map();
var netMirrorGetStream = /* @__PURE__ */ __name((_0) => __async(null, [_0], function* ({
  id: rawId,
  type,
  prefix: defaultPrefix,
  signal,
  providerContext,
  isDownload
}) {
  const { axios } = providerContext;
  const baseUrl = yield getNetMirrorBaseUrl(providerContext);
  let id = rawId;
  let prefix = defaultPrefix;
  let title = "";
  let seasonNum;
  let episodeNum;
  if (rawId.includes("|")) {
    const parts = rawId.split("|");
    id = parts[0];
    prefix = parts[1] || defaultPrefix;
    if (parts[2]) {
      try {
        title = decodeURIComponent(parts[2]);
      } catch (e) {
        title = parts[2];
      }
    }
    if (parts[3]) seasonNum = parseInt(parts[3], 10) || void 0;
    if (parts[4]) episodeNum = parseInt(parts[4], 10) || void 0;
  }
  if (!title) {
    const cachedTitle = titleCache.get(id);
    if (cachedTitle) {
      title = cachedTitle;
    } else {
      try {
        const cookies2 = yield getNetMirrorCookie(providerContext, prefix);
        const prefixPath = prefix ? `${prefix}/` : "";
        const t = Math.round(Date.now() / 1e3);
        const postRes = yield axios.get(
          `${baseUrl}/mobile/${prefixPath}post.php?id=${id}&t=${t}`,
          {
            headers: getNetMirrorMobileHeaders(baseUrl, cookies2),
            timeout: 3e3
          }
        );
        const pData = postRes.data;
        if (pData == null ? void 0 : pData.title) {
          title = pData.title;
          titleCache.set(id, title);
          if (pData.s && seasonNum === void 0) {
            seasonNum = parseInt(String(pData.s).replace(/[^0-9]/g, ""), 10) || void 0;
          }
          if (pData.ep && episodeNum === void 0) {
            episodeNum = parseInt(String(pData.ep).replace(/[^0-9]/g, ""), 10) || void 0;
          }
        }
      } catch (e) {
      }
    }
  }
  const ottHeader = prefix === "hs" ? "hs" : prefix === "pv" ? "pv" : "nf";
  const serverName = prefix === "hs" ? "Disney+" : prefix === "pv" ? "Prime Video" : "Netflix";
  const streamLinks = [];
  let cookies = "";
  try {
    cookies = yield getNetMirrorCookie(providerContext, prefix);
    const tm = Math.round(Date.now() / 1e3);
    const prefixPath = prefix === "hs" ? "hs/" : prefix === "pv" ? "pv/" : "";
    let plData = null;
    const plUrlsToTry = [
      ...prefixPath ? [`${baseUrl}/mobile/${prefixPath}playlist.php?id=${id}&t=${encodeURIComponent(title || "Title")}&tm=${tm}`] : [],
      `${baseUrl}/mobile/playlist.php?id=${id}&t=${encodeURIComponent(title || "Title")}&tm=${tm}`
    ];
    for (const plUrl of plUrlsToTry) {
      try {
        const mPlRes = yield axios.get(plUrl, {
          signal,
          headers: getNetMirrorMobileHeaders(baseUrl, cookies),
          timeout: 6e3
        });
        const resData = Array.isArray(mPlRes.data) ? mPlRes.data[0] : mPlRes.data;
        if (resData && Array.isArray(resData.sources) && resData.sources.length > 0) {
          plData = resData;
          break;
        }
      } catch (e) {
      }
    }
    if (!plData || !Array.isArray(plData.sources)) {
      try {
        const nativeHost = "https://net77.cc";
        const playRes = yield axios.post(
          `${nativeHost}/play.php`,
          `id=${id}`,
          {
            signal,
            headers: {
              "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
              Origin: nativeHost,
              Referer: `${nativeHost}/home`,
              Cookie: cookies,
              "X-Requested-With": "XMLHttpRequest",
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36"
            },
            timeout: 5e3
          }
        );
        const playData = playRes.data;
        if (playData && playData.h) {
          const playlistUrl = `${nativeHost}/playlist.php?id=${id}&t=${encodeURIComponent(
            title || "Title"
          )}&tm=${tm}&h=${encodeURIComponent(playData.h)}`;
          const plRes = yield axios.get(playlistUrl, {
            signal,
            headers: {
              Accept: "application/json, text/javascript, */*; q=0.01",
              Referer: `${nativeHost}/home`,
              Origin: nativeHost,
              Cookie: cookies,
              "X-Requested-With": "XMLHttpRequest",
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            },
            timeout: 5e3
          });
          plData = Array.isArray(plRes.data) ? plRes.data[0] : plRes.data;
        }
      } catch (e) {
      }
    }
    if (plData && Array.isArray(plData.sources)) {
      const subtitles = [];
      if (Array.isArray(plData.tracks)) {
        plData.tracks.forEach((track) => {
          let uri = track.file || "";
          if (uri.startsWith("//")) uri = "https:" + uri;
          if (!uri) return;
          const isVtt = uri.endsWith(".vtt");
          subtitles.push({
            title: track.label || "Subtitle",
            language: track.label || "English",
            type: isVtt ? "text/vtt" : "application/x-subrip",
            uri
          });
        });
      }
      let hadAbuseVideo = false;
      const firstSource = plData.sources[0];
      if (firstSource && firstSource.file) {
        let testUrl = firstSource.file;
        if (!testUrl.startsWith("http")) testUrl = `${baseUrl}${testUrl}`;
        try {
          const checkRes = yield axios.get(testUrl, {
            signal,
            headers: getNetMirrorMobileHeaders(baseUrl, cookies),
            timeout: 2500
          });
          const content = typeof checkRes.data === "string" ? checkRes.data : "";
          if (content.includes("220884") || content.includes("Only Valid Users Allowed")) {
            hadAbuseVideo = true;
          }
        } catch (e) {
        }
      }
      let validSources = [];
      if (!hadAbuseVideo) {
        for (const s of plData.sources) {
          let fUrl = s.file || "";
          if (!fUrl) continue;
          if (!fUrl.startsWith("http")) fUrl = `${baseUrl}${fUrl}`;
          validSources.push(__spreadProps(__spreadValues({}, s), { file: fUrl }));
        }
      }
      if (hadAbuseVideo) {
        if (providerContext.kvStore) {
          try {
            yield providerContext.kvStore.delete("t_hash_t");
            yield providerContext.kvStore.delete("t_hash_t_data");
          } catch (e) {
          }
        }
        const newCookie = yield unlockNetMirrorMobileSession(providerContext, baseUrl);
        if (newCookie && !newCookie.includes("::99")) {
          if (providerContext.kvStore) {
            yield providerContext.kvStore.set("t_hash_t", newCookie);
            yield providerContext.kvStore.set("t_hash_t_data", {
              token: newCookie,
              ts: Date.now()
            });
          }
          cookies = `t_hash_t=${newCookie}; hd=on; ott=${ottHeader === "hs" ? "dp" : ottHeader}`;
          const retryUrls = [
            ...prefixPath ? [`${baseUrl}/mobile/${prefixPath}playlist.php?id=${id}&t=${encodeURIComponent(title || "Title")}&tm=${Math.round(Date.now() / 1e3)}`] : [],
            `${baseUrl}/mobile/playlist.php?id=${id}&t=${encodeURIComponent(title || "Title")}&tm=${Math.round(Date.now() / 1e3)}`
          ];
          for (const rUrl of retryUrls) {
            try {
              const newMPlRes = yield axios.get(rUrl, {
                signal,
                headers: getNetMirrorMobileHeaders(baseUrl, cookies),
                timeout: 5e3
              });
              const newPlData = Array.isArray(newMPlRes.data) ? newMPlRes.data[0] : newMPlRes.data;
              if (newPlData && Array.isArray(newPlData.sources) && newPlData.sources.length > 0) {
                validSources = [];
                for (const s of newPlData.sources) {
                  let fUrl = s.file || "";
                  if (!fUrl) continue;
                  if (!fUrl.startsWith("http")) fUrl = `${baseUrl}${fUrl}`;
                  validSources.push(__spreadProps(__spreadValues({}, s), { file: fUrl }));
                }
                break;
              }
            } catch (e) {
            }
          }
        }
      }
      validSources.forEach((source) => {
        const fileUrl = source.file;
        let quality = "1080";
        const label = (source.label || "").toLowerCase();
        if (label.includes("full hd") || fileUrl.includes("1080p")) quality = "1080";
        else if (label.includes("mid hd") || fileUrl.includes("720p")) quality = "720";
        else if (label.includes("low hd") || fileUrl.includes("480p")) quality = "480";
        else if (label.includes("360p")) quality = "360";
        streamLinks.push({
          server: `${serverName} ${source.label || "HLS"}`,
          link: fileUrl,
          type: "m3u8",
          quality,
          subtitles: subtitles.length > 0 ? subtitles : void 0,
          headers: getNetMirrorMobileHeaders(baseUrl, cookies)
        });
      });
    }
  } catch (err) {
    console.log(`Native NetMirror playlist flow for ${id}:`, err);
  }
  if (streamLinks.length === 0) {
    try {
      const apiBase = yield resolveNewTvApiBase(providerContext);
      const playerUrl = `${apiBase}/newtv/player.php?id=${id}`;
      const res = yield axios.get(playerUrl, {
        signal,
        headers: {
          Ott: ottHeader,
          "X-Requested-With": "NetmirrorNewTV v1.0",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0 /OS.GatuNewTV v1.0",
          Accept: "application/json, text/plain, */*"
        },
        timeout: 5e3
      });
      const data = res.data;
      if (data && data.status === "ok" && data.video_link && !data.video_link.includes("220884")) {
        try {
          const m3u8Res = yield axios.get(data.video_link, {
            signal,
            headers: { Referer: data.referer || `${baseUrl}/` },
            timeout: 4e3
          });
          const m3u8Text = typeof m3u8Res.data === "string" ? m3u8Res.data : "";
          if (!m3u8Text.includes("220884")) {
            const variantLines = m3u8Text.split("\n").map((l) => l.trim()).filter((l) => l.startsWith("http") && !l.includes("220884"));
            for (const vUrl of variantLines) {
              let q = "1080";
              if (vUrl.includes("720p")) q = "720";
              else if (vUrl.includes("480p")) q = "480";
              else if (vUrl.includes("360p")) q = "360";
              streamLinks.push({
                server: `${serverName} HLS (${q}p)`,
                link: vUrl,
                type: "m3u8",
                quality: q,
                headers: {
                  Referer: `${baseUrl}/`,
                  Origin: baseUrl
                }
              });
            }
          }
        } catch (e) {
        }
      }
    } catch (err) {
      console.error(`NewTV player API failed for ${id}:`, err);
    }
  }
  const cleanStreamLinks = streamLinks.filter(
    (s) => !s.link.includes("220884") && !s.server.includes("220884")
  );
  if (cleanStreamLinks.length === 0) {
    cleanStreamLinks.push({
      server: `${serverName} HLS`,
      link: `${baseUrl}/mobile/hls/${id}.m3u8`,
      type: "m3u8",
      quality: "1080",
      headers: getNetMirrorMobileHeaders(baseUrl, cookies)
    });
  }
  cleanStreamLinks.sort((a, b) => {
    if (isDownload) {
      if (a.type === "mp4" && b.type !== "mp4") return -1;
      if (b.type === "mp4" && a.type !== "mp4") return 1;
    }
    const qA = parseInt(a.quality || "0", 10);
    const qB = parseInt(b.quality || "0", 10);
    return qB - qA;
  });
  return cleanStreamLinks;
}), "netMirrorGetStream");

// providers/disneyMirror/stream.ts
var getStream = /* @__PURE__ */ __name((_0) => __async(null, [_0], function* ({
  link: id,
  type,
  signal,
  providerContext,
  isDownload
}) {
  return netMirrorGetStream({
    id,
    type,
    prefix: "hs",
    signal,
    providerContext,
    isDownload
  });
}), "getStream");
exports.getStream = getStream;
// Annotate the CommonJS export names for ESM import in node:

