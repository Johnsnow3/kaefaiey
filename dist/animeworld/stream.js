"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
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

// providers/animeworld/stream.ts
var stream_exports = {};
__export(stream_exports, {
  getStream: () => getStream
});


// providers/extractors/abbasy.ts
var UA = "Mozilla/5.0 (Linux; Android 16; Pixel 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Mobile Safari/537.36";
function buildPlaybackHeaders() {
  return {
    "User-Agent": UA,
    Accept: "*/*",
    "Accept-Language": "en-GB,en-US;q=0.9,en;q=0.8,hi;q=0.7",
    Referer: "https://playhydrax.com/"
  };
}
__name(buildPlaybackHeaders, "buildPlaybackHeaders");
function makeAbsolute(url, base) {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  const b = new URL(base);
  if (url.startsWith("/")) return `${b.protocol}//${b.host}${url}`;
  return `${b.protocol}//${b.host}/${url}`;
}
__name(makeAbsolute, "makeAbsolute");
function fetchCuidCookie(axios) {
  return __async(this, null, function* () {
    var _a;
    try {
      const res = yield axios.post(
        "https://meatusbyway.cfd/cuid/?f=https%3A%2F%2Fwatchanimeworld.one",
        "{}",
        {
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Origin: "https://watchanimeworld.one",
            Referer: "https://watchanimeworld.one/",
            "User-Agent": UA
          },
          timeout: 5e3
          // ↓ from 10s — fail fast if down
        }
      );
      const key = (_a = res == null ? void 0 : res.data) == null ? void 0 : _a.key;
      return key ? `a97fa794a0f9=${key}` : "";
    } catch (e) {
      return "";
    }
  });
}
__name(fetchCuidCookie, "fetchCuidCookie");
function promiseAny(promises) {
  return new Promise((resolve, reject) => {
    let rejectedCount = 0;
    if (promises.length === 0) return reject(new Error("Empty promise array"));
    promises.forEach((p) => {
      Promise.resolve(p).then(resolve, () => {
        rejectedCount++;
        if (rejectedCount === promises.length) {
          reject(new Error("All promises rejected"));
        }
      });
    });
  });
}
__name(promiseAny, "promiseAny");
function parseConfigLangs(pageHtml) {
  const out = [];
  const m = pageHtml.match(/var CONFIG = (\{[\s\S]*?\});/);
  if (!m) return out;
  try {
    const config = JSON.parse(m[1]);
    const ready = config.ready || {};
    const langMap = config.lang || {};
    for (const code of Object.keys(ready)) {
      const info = langMap[code] || {};
      out.push({
        code,
        name: info.name || code,
        short: info.short || code.slice(0, 2).toUpperCase(),
        slug: ready[code]
      });
    }
  } catch (e) {
    console.warn("[abbasy] CONFIG parse failed", e);
  }
  return out;
}
__name(parseConfigLangs, "parseConfigLangs");
function fetchSourcesForSlug(slug, cuidCookie, axios) {
  return __async(this, null, function* () {
    const playerUrl = `https://player.abyssplayer.com/${slug}`;
    const playerRes = yield axios.get(playerUrl, {
      headers: __spreadValues({
        "User-Agent": UA,
        Referer: "https://watchanimeworld.one/"
      }, cuidCookie ? { Cookie: cuidCookie } : {}),
      timeout: 8e3
      // ↓ from default
    });
    const playerHtml = playerRes.data;
    const datasMatch = playerHtml.match(
      /const\s+datas\s*=\s*["']([A-Za-z0-9+/=]+)["']/
    );
    if (!datasMatch) return [];
    const datasBlob = datasMatch[1];
    const apiUrl = "https://enc-dec.app/api/dec-abyss";
    const payloads = [
      { data: datasBlob },
      { datas: datasBlob },
      { text: datasBlob },
      { url: playerUrl },
      { slug }
    ];
    const apiRes = yield promiseAny(
      payloads.map(
        (p) => axios.post(apiUrl, p, {
          headers: {
            "Content-Type": "application/json",
            "User-Agent": UA,
            Referer: "https://enc-dec.app/"
          },
          timeout: 1e4
        }).then((r) => {
          if (!(r == null ? void 0 : r.data)) throw new Error("empty");
          return r;
        })
      )
    ).catch(() => null);
    if (!(apiRes == null ? void 0 : apiRes.data)) return [];
    const data = apiRes.data;
    const sources = [];
    if ((data == null ? void 0 : data.result) && Array.isArray(data.result.sources)) {
      sources.push(...data.result.sources);
    } else if (Array.isArray(data == null ? void 0 : data.sources)) {
      sources.push(...data.sources);
    } else if (Array.isArray(data)) {
      sources.push(...data);
    }
    return sources;
  });
}
__name(fetchSourcesForSlug, "fetchSourcesForSlug");
function abyssExtractor(link, _signal, axios, _cheerio, headers, _providerContext) {
  return __async(this, null, function* () {
    const streamLinks = [];
    const t0 = Date.now();
    try {
      let pageUrl = link;
      if (!pageUrl.startsWith("http")) {
        pageUrl = makeAbsolute(pageUrl, "https://watchanimeworld.one/");
      }
      console.log(`[abbasy] \u2192 ${pageUrl}`);
      const cuidPromise = fetchCuidCookie(axios);
      let langs = [];
      if (pageUrl.includes("player.abyssplayer.com")) {
        const slug = pageUrl.split("/").pop() || "";
        langs = [{ code: "und", name: "Unknown", short: "UN", slug }];
      } else {
        const pageRes = yield axios.get(pageUrl, {
          headers: {
            "User-Agent": UA,
            Referer: "https://watchanimeworld.one/",
            Origin: "https://watchanimeworld.one"
          },
          timeout: 8e3
        });
        langs = parseConfigLangs(pageRes.data);
      }
      if (!langs.length) {
        return [
          {
            server: "AbyssPlayer",
            link: pageUrl,
            type: "iframe",
            headers: {},
            subtitles: []
          }
        ];
      }
      const cuidCookie = yield cuidPromise;
      const langsWithSources = yield Promise.all(
        langs.map((lang) => __async(null, null, function* () {
          try {
            const sources = yield fetchSourcesForSlug(
              lang.slug,
              cuidCookie,
              axios
            );
            return { lang, sources };
          } catch (e) {
            console.warn(`[abbasy] ${lang.name} failed:`, e);
            return { lang, sources: [] };
          }
        }))
      );
      const codecRank = /* @__PURE__ */ __name((c) => (c == null ? void 0 : c.toLowerCase()) === "h264" ? 0 : 1, "codecRank");
      const resRank = /* @__PURE__ */ __name((t) => parseInt((t == null ? void 0 : t.replace(/[^\d]/g, "")) || "0", 10), "resRank");
      const playbackHeaders = buildPlaybackHeaders();
      for (const { lang, sources } of langsWithSources) {
        if (!sources.length) continue;
        sources.sort(
          (a, b) => codecRank(a.codec) - codecRank(b.codec) || resRank(a.type) - resRank(b.type)
        );
        for (const src of sources) {
          if (!(src == null ? void 0 : src.url) || src.status === false) continue;
          const srcLang = src.language || src.lang || src.audio_lang || lang.name;
          const srcLangShort = src.language_short || src.lang_short || lang.short;
          streamLinks.push({
            server: `AbyssPlayer (${srcLang})`,
            link: src.url,
            type: src.url.includes(".m3u8") ? "m3u8" : "mp4",
            headers: playbackHeaders,
            subtitles: [],
            quality: `${srcLangShort} \xB7 ${src.type || "auto"}${src.codec ? ` \xB7 ${src.codec}` : ""}`
          });
        }
      }
      if (!streamLinks.length) {
        streamLinks.push({
          server: "AbyssPlayer",
          link: `https://player.abyssplayer.com/${langs[0].slug}`,
          type: "iframe",
          headers: {},
          subtitles: []
        });
      }
      console.log(
        `[abbasy] ${streamLinks.length} streams in ${Date.now() - t0}ms`
      );
      return streamLinks;
    } catch (err) {
      console.error("[abbasy] error:", (err == null ? void 0 : err.message) || err);
      return [];
    }
  });
}
__name(abyssExtractor, "abyssExtractor");

// providers/extractors/zypter.ts
function zypterExtractor(link, signal, axios, cheerio, headers, providerContext) {
  return __async(this, null, function* () {
    var _a, _b;
    const streamLinks = [];
    try {
      const dataMatch = link.match(/\/video\/([a-zA-Z0-9_-]+)/) || link.match(/\/([a-zA-Z0-9_-]+)\/?$/);
      const dataId = dataMatch ? dataMatch[1] : link.split("/").filter(Boolean).pop();
      if (!dataId) {
        console.warn("[zypter] no data ID in URL");
        return [];
      }
      const urlObj = new URL(link);
      const baseUrl = `${urlObj.protocol}//${urlObj.host}`;
      const apiUrl = `${baseUrl}/player/index.php?data=${dataId}&do=getVideo`;
      const apiHeaders = {
        Accept: "*/*",
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        Origin: baseUrl,
        Referer: link,
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        "X-Requested-With": "XMLHttpRequest"
      };
      const body = new URLSearchParams({ hash: dataId, r: baseUrl });
      const apiRes = yield axios.post(apiUrl, body, {
        headers: apiHeaders,
        timeout: 1e4
      });
      const streamUrl = ((_a = apiRes == null ? void 0 : apiRes.data) == null ? void 0 : _a.securedLink) || ((_b = apiRes == null ? void 0 : apiRes.data) == null ? void 0 : _b.videoSource);
      if (!streamUrl) {
        console.warn("[zypter] no stream in response");
        return [];
      }
      streamLinks.push({
        server: "ZephyrFlick",
        link: streamUrl,
        type: streamUrl.includes(".m3u8") ? "m3u8" : "mp4",
        headers: {
          Referer: baseUrl,
          Origin: baseUrl,
          "User-Agent": apiHeaders["User-Agent"]
        },
        subtitles: []
      });
      console.log(`[zypter] queued ${streamUrl.slice(0, 80)}\u2026`);
      return streamLinks;
    } catch (err) {
      console.error("[zypter] error:", (err == null ? void 0 : err.message) || err);
      return [];
    }
  });
}
__name(zypterExtractor, "zypterExtractor");

// providers/animeworld/stream.ts
function makeAbsolute2(url, base) {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  const b = new URL(base);
  if (url.startsWith("/")) return `${b.protocol}//${b.host}${url}`;
  return `${b.protocol}//${b.host}/${url}`;
}
__name(makeAbsolute2, "makeAbsolute");
var getEpisodeStreams = /* @__PURE__ */ __name(function(_0) {
  return __async(this, arguments, function* ({
    url,
    providerContext
  }) {
    const { axios, cheerio, commonHeaders: headers } = providerContext;
    const t0 = Date.now();
    try {
      const res = yield axios.get(url, { headers, timeout: 8e3 });
      const $ = cheerio.load(res.data);
      const iframeUrls = [];
      const pick = /* @__PURE__ */ __name((sel) => {
        const f = $(sel);
        if (!f.length) return;
        const src = f.attr("data-src") || f.attr("src") || "";
        if (src) iframeUrls.push(makeAbsolute2(src, url));
      }, "pick");
      pick("#options-0 iframe");
      pick("#options-1 iframe");
      if (!iframeUrls.length) {
        return [
          {
            server: "Episode",
            link: url,
            type: "iframe",
            headers: {},
            subtitles: []
          }
        ];
      }
      const signal = new AbortController().signal;
      const results = yield Promise.allSettled(
        iframeUrls.map(
          (u) => u.includes("zephyrix.org") || u.includes("zephyr") ? zypterExtractor(u, signal, axios, cheerio, headers, providerContext) : abyssExtractor(u, signal, axios, cheerio, headers, providerContext)
        )
      );
      const merged = [];
      for (const r of results) {
        if (r.status === "fulfilled" && Array.isArray(r.value)) {
          merged.push(...r.value);
        }
      }
      console.log(`[episode] ${merged.length} streams in ${Date.now() - t0}ms`);
      if (!merged.length) {
        return [
          {
            server: "Episode",
            link: iframeUrls[0] || url,
            type: "iframe",
            headers: {},
            subtitles: []
          }
        ];
      }
      return merged;
    } catch (err) {
      console.error("[episode] error:", (err == null ? void 0 : err.message) || err);
      return [
        {
          server: "Episode",
          link: url,
          type: "iframe",
          headers: {},
          subtitles: []
        }
      ];
    }
  });
}, "getEpisodeStreams");
var getStream = /* @__PURE__ */ __name(function(_0) {
  return __async(this, arguments, function* ({
    link: url,
    providerContext
  }) {
    console.log("[getStream]", url);
    const { axios, cheerio, commonHeaders: headers } = providerContext;
    const signal = new AbortController().signal;
    if (url.includes("/episode/") || url.includes("/movies/") || url.includes("/movie/")) {
      return getEpisodeStreams({ url, providerContext });
    }
    if (url.includes("zephyrix.org") || url.includes("zephyr")) {
      return zypterExtractor(url, signal, axios, cheerio, headers, providerContext);
    }
    if (url.includes("dub-player") || url.includes("abyssplayer") || url.includes("watchanimeworld.one/dub-player")) {
      return abyssExtractor(url, signal, axios, cheerio, headers, providerContext);
    }
    return zypterExtractor(url, signal, axios, cheerio, headers, providerContext);
  });
}, "getStream");
exports.getStream = getStream;
// Annotate the CommonJS export names for ESM import in node:

