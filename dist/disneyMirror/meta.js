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

// providers/disneyMirror/meta.ts
var meta_exports = {};
__export(meta_exports, {
  getMeta: () => getMeta
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
var getPosterUrl = /* @__PURE__ */ __name((id, prefix) => {
  if (prefix === "pv") {
    return id.length > 10 ? `https://imgcdn.kim/pv/v/350/${id}.jpg` : `https://imgcdn.kim/pv/341/${id}.jpg`;
  }
  if (prefix === "hs") {
    return `https://imgcdn.kim/hs/v/166/${id}.jpg`;
  }
  return `https://imgcdn.kim/poster/v/${id}.jpg`;
}, "getPosterUrl");
var netMirrorGetMeta = /* @__PURE__ */ __name((_0) => __async(null, [_0], function* ({
  link,
  prefix: defaultPrefix,
  providerContext
}) {
  const { axios } = providerContext;
  const baseUrl = yield getNetMirrorBaseUrl(providerContext);
  let id = "";
  let prefix = defaultPrefix;
  let titleFromLink = "";
  if (link.includes("|")) {
    const parts = link.split("|");
    id = parts[0];
    prefix = parts[1] || defaultPrefix;
    if (parts[2]) {
      try {
        titleFromLink = decodeURIComponent(parts[2]);
      } catch (e) {
        titleFromLink = parts[2];
      }
    }
  } else if (link.includes("id=")) {
    try {
      id = link.split("id=")[1].split("&")[0];
      if (link.includes("title=")) {
        titleFromLink = decodeURIComponent(link.split("title=")[1].split("&")[0]);
      }
    } catch (e) {
    }
  } else {
    id = link;
  }
  const cookies = yield getNetMirrorCookie(providerContext, prefix);
  const prefixPath = prefix ? `${prefix}/` : "";
  const t = Math.round(Date.now() / 1e3);
  let title = titleFromLink;
  let synopsis = "";
  let image = getPosterUrl(id, prefix);
  let poster = prefix === "pv" ? `https://imgcdn.kim/pv/v/${id}.jpg` : void 0;
  let cast = [];
  const tags = [];
  let imdbId = "";
  let type = "movie";
  const linkList = [];
  try {
    const postUrl = `${baseUrl}/mobile/${prefixPath}post.php?id=${id}&t=${t}`;
    const res = yield axios.get(postUrl, {
      headers: getNetMirrorMobileHeaders(baseUrl, cookies)
    });
    const data = res.data;
    if (data) {
      title = data.title || title;
      synopsis = data.desc || "";
      if (data.year) tags.push(String(data.year));
      if (typeof data.genre === "string") {
        data.genre.split(",").forEach((g) => {
          const trimmed = g.trim();
          if (trimmed) tags.push(trimmed);
        });
      }
      if (typeof data.match === "string" && data.match.includes("IMDb")) {
        tags.push(data.match);
      }
      if (typeof data.cast === "string") {
        cast = data.cast.split(",").map((c) => c.trim()).filter(Boolean);
      }
      if (Array.isArray(data.season) && data.season.length > 0) {
        type = "series";
        data.season.forEach((s) => {
          const sNum = String(s.s || s.name || "1").replace(/[^0-9]/g, "") || "1";
          linkList.push({
            title: `Season ${s.s || s.name || "1"}`,
            episodesLink: `${s.id}|${id}|${prefix}|${encodeURIComponent(title)}|${sNum}`
          });
        });
      } else if (Array.isArray(data.episodes) && data.episodes.length > 0) {
        type = "series";
        linkList.push({
          title: "Season 1",
          episodesLink: `${id}|${id}|${prefix}|${encodeURIComponent(title)}|1`
        });
      } else {
        type = "movie";
        linkList.push({
          title: title || "Movie",
          directLinks: [
            {
              title: title || "Movie",
              link: `${id}|${prefix}|${encodeURIComponent(title)}`,
              type: "movie"
            }
          ]
        });
      }
    }
  } catch (err) {
    console.error(`netMirrorGetMeta post.php error [${prefix}]:`, err);
  }
  if (linkList.length === 0) {
    linkList.push({
      title: title || "Movie",
      directLinks: [
        {
          title: title || "Movie",
          link: `${id}|${prefix}|${encodeURIComponent(title)}`,
          type: "movie"
        }
      ]
    });
  }
  return {
    title: title || "Unknown Title",
    synopsis: synopsis || "",
    image: image || "",
    poster,
    imdbId,
    type,
    cast: cast.length > 0 ? cast : void 0,
    tags: tags.length > 0 ? tags : void 0,
    linkList
  };
}), "netMirrorGetMeta");

// providers/disneyMirror/meta.ts
var getMeta = /* @__PURE__ */ __name(function(_0) {
  return __async(this, arguments, function* ({
    link,
    providerContext
  }) {
    return netMirrorGetMeta({
      link,
      prefix: "hs",
      providerContext
    });
  });
}, "getMeta");
exports.getMeta = getMeta;
// Annotate the CommonJS export names for ESM import in node:

