"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
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

// providers/netflixMirror/episodes.ts
var episodes_exports = {};
__export(episodes_exports, {
  getEpisodes: () => getEpisodes
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
var netMirrorGetEpisodes = /* @__PURE__ */ __name((_0) => __async(null, [_0], function* ({
  seasonId,
  prefix: defaultPrefix,
  signal,
  providerContext
}) {
  const { axios } = providerContext;
  const baseUrl = yield getNetMirrorBaseUrl(providerContext);
  const t = Math.round(Date.now() / 1e3);
  let sid = seasonId;
  let seriesId = seasonId;
  let prefix = defaultPrefix;
  let seriesTitle = "";
  let seasonNumber = 1;
  if (seasonId.includes("|")) {
    const parts = seasonId.split("|");
    sid = parts[0];
    seriesId = parts[1] || sid;
    prefix = parts[2] || defaultPrefix;
    if (parts[3]) {
      try {
        seriesTitle = decodeURIComponent(parts[3]);
      } catch (e) {
        seriesTitle = parts[3];
      }
    }
    if (parts[4]) {
      seasonNumber = parseInt(parts[4], 10) || 1;
    }
  }
  const cookies = yield getNetMirrorCookie(providerContext, prefix);
  const prefixPath = prefix ? `${prefix}/` : "";
  const episodeList = [];
  let page = 1;
  let hasMorePages = true;
  while (hasMorePages && page <= 6) {
    try {
      const url = `${baseUrl}/mobile/${prefixPath}episodes.php?s=${sid}&series=${seriesId}&t=${t}&page=${page}`;
      const res = yield axios.get(url, {
        signal,
        headers: getNetMirrorMobileHeaders(baseUrl, cookies)
      });
      const data = res.data;
      if (Array.isArray(data == null ? void 0 : data.episodes) && data.episodes.length > 0) {
        data.episodes.forEach((episode) => {
          const epNum = String((episode == null ? void 0 : episode.ep) || "").replace(/[^0-9]/g, "").trim() || `${episodeList.length + 1}`;
          const sNum = String((episode == null ? void 0 : episode.s) || "").replace(/[^0-9]/g, "").trim() || `${seasonNumber}`;
          const epTitle = (episode == null ? void 0 : episode.t) ? `Episode ${epNum}: ${episode.t}` : `Episode ${epNum}`;
          episodeList.push({
            title: epTitle,
            link: `${episode == null ? void 0 : episode.id}|${prefix}|${encodeURIComponent(seriesTitle)}|${sNum}|${epNum}`,
            description: (episode == null ? void 0 : episode.ep_desc) || void 0
          });
        });
        if ((data == null ? void 0 : data.nextPageShow) && data.nextPageShow > 0) {
          page++;
        } else {
          hasMorePages = false;
        }
      } else {
        hasMorePages = false;
      }
    } catch (err) {
      console.error(`netMirrorGetEpisodes error [${prefix}]:`, err);
      break;
    }
  }
  if (episodeList.length === 0 && sid) {
    episodeList.push({
      title: "Episode 1",
      link: `${sid}|${prefix}|${encodeURIComponent(seriesTitle)}|${seasonNumber}|1`
    });
  }
  return episodeList;
}), "netMirrorGetEpisodes");

// providers/netflixMirror/episodes.ts
var getEpisodes = /* @__PURE__ */ __name(function(_0) {
  return __async(this, arguments, function* ({
    url: link,
    providerContext
  }) {
    return netMirrorGetEpisodes({
      seasonId: link,
      prefix: "",
      providerContext
    });
  });
}, "getEpisodes");
exports.getEpisodes = getEpisodes;
// Annotate the CommonJS export names for ESM import in node:

