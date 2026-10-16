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

// providers/primeMirror/posts.ts
var posts_exports = {};
__export(posts_exports, {
  getPosts: () => getPosts,
  getSearchPosts: () => getSearchPosts
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
var netMirrorSearch = /* @__PURE__ */ __name((_0) => __async(null, [_0], function* ({
  searchQuery,
  page,
  prefix,
  signal,
  providerContext
}) {
  var _a;
  try {
    if (page > 1) return [];
    const { axios } = providerContext;
    const baseUrl = yield getNetMirrorBaseUrl(providerContext);
    const query = searchQuery == null ? void 0 : searchQuery.trim();
    if (!query) return [];
    const cookies = yield getNetMirrorCookie(providerContext, prefix);
    const t = Math.round(Date.now() / 1e3);
    const url = `${baseUrl}/mobile/search.php?s=${encodeURIComponent(query)}&t=${t}`;
    const res = yield axios.get(url, {
      signal,
      headers: getNetMirrorMobileHeaders(baseUrl, cookies)
    });
    const results = ((_a = res.data) == null ? void 0 : _a.searchResult) || [];
    const catalog = [];
    for (const item of results) {
      const id = item == null ? void 0 : item.id;
      const title = (item == null ? void 0 : item.t) || "";
      if (!id) continue;
      const image = getPosterUrl(id, prefix);
      const link = `${id}|${prefix}|${encodeURIComponent(title)}`;
      catalog.push({
        title,
        link,
        image,
        tag: (item == null ? void 0 : item.y) || ((item == null ? void 0 : item.r) && item.r !== "Series" ? item.r : void 0),
        aspectRatio: prefix === "pv" ? 16 / 9 : void 0
      });
    }
    return catalog;
  } catch (err) {
    console.error(`netMirrorSearch error [${prefix}]:`, err);
    return [];
  }
}), "netMirrorSearch");
var homeTrayCache = /* @__PURE__ */ new Map();
var titleCache = /* @__PURE__ */ new Map();
var parseHtmlTrays = /* @__PURE__ */ __name((html, cheerio) => {
  const trays = [];
  if (!html || typeof html !== "string") return trays;
  if (cheerio && typeof cheerio.load === "function") {
    try {
      const $ = cheerio.load(html);
      $(".tray-container").each((_i, el) => {
        const title = $(el).find("h2").first().text().trim();
        const items = [];
        $(el).find("article").each((_j, art) => {
          const a = $(art).find("a[data-post]").first();
          const id = a.attr("data-post") || $(art).attr("data-post");
          const img = $(art).find("img").attr("data-src") || $(art).find("img").attr("src");
          const alt = $(art).find("img").attr("alt") || "";
          if (id) {
            items.push({ id, image: img || "", alt });
          }
        });
        if (title && items.length > 0) {
          trays.push({ title, items });
        }
      });
      $("#top10, .top10").each((_i, el) => {
        const title = $(el).find("span").first().text().trim() || "Top 10 Today";
        const items = [];
        $(el).find(".top10-post, article").each((_j, art) => {
          const a = $(art).find("a[data-post]").first();
          const id = a.attr("data-post") || $(art).attr("data-post");
          const img = $(art).find("img").attr("data-src") || $(art).find("img").attr("src");
          if (id) {
            items.push({ id, image: img || "", alt: "" });
          }
        });
        if (title && items.length > 0 && !trays.some((t) => t.title.toLowerCase() === title.toLowerCase())) {
          trays.push({ title, items });
        }
      });
      if (trays.length > 0) return trays;
    } catch (e) {
    }
  }
  const traySections = html.split(/class="[^"]*tray-container[^"]*"/);
  for (let i = 1; i < traySections.length; i++) {
    const sec = traySections[i];
    const h2Match = sec.match(/<h2[^>]*>([^<]+)<\/h2>/);
    const title = h2Match ? h2Match[1].trim() : "";
    const items = [];
    const artMatches = sec.match(/<article[\s\S]*?<\/article>/g) || [];
    for (const art of artMatches) {
      const idMatch = art.match(/data-post="([^"]+)"/);
      const imgMatch = art.match(/data-src="([^"]+)"/) || art.match(/src="([^"]+)"/);
      const altMatch = art.match(/alt="([^"]*)"/);
      if (idMatch) {
        items.push({
          id: idMatch[1],
          image: imgMatch ? imgMatch[1] : "",
          alt: altMatch ? altMatch[1] : ""
        });
      }
    }
    if (title && items.length > 0 && !trays.some((t) => t.title.toLowerCase() === title.toLowerCase())) {
      trays.push({ title, items });
    }
  }
  return trays;
}, "parseHtmlTrays");
var getCachedHomeTrays = /* @__PURE__ */ __name((providerContext, prefix) => __async(null, null, function* () {
  const cached = homeTrayCache.get(prefix);
  if (cached && Date.now() - cached.timestamp < 9e5) {
    return cached.trays;
  }
  try {
    const { axios, cheerio } = providerContext;
    const baseUrl = yield getNetMirrorBaseUrl(providerContext);
    let cookies = yield getNetMirrorCookie(providerContext, prefix, false);
    const url = `${baseUrl}/mobile/home?app=1`;
    const homeHeaders = __spreadProps(__spreadValues({}, getNetMirrorMobileHeaders(baseUrl, cookies)), {
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
      "Accept-Language": "en-IN,en-US;q=0.9,en;q=0.8",
      "X-Requested-With": "XMLHttpRequest",
      Referer: `${baseUrl}/mobile/home?app=1`
    });
    const res = yield axios.get(url, {
      headers: homeHeaders,
      timeout: 1e4
    });
    const html = typeof res.data === "string" ? res.data : "";
    let trays = parseHtmlTrays(html, cheerio);
    if (trays.length === 0 && (html.includes("data-addhash") || html.includes("verify2.php") || !cookies.includes("t_hash_t="))) {
      if (providerContext.kvStore) {
        try {
          yield providerContext.kvStore.delete("t_hash_t");
          yield providerContext.kvStore.delete("t_hash_t_data");
        } catch (e) {
        }
      }
      const newCookie = yield unlockSharedSession(providerContext, baseUrl);
      if (newCookie && !newCookie.includes("::99")) {
        const freshCookies = `t_hash_t=${newCookie}; hd=on; ott=${prefix === "hs" ? "dp" : prefix === "pv" ? "pv" : "nf"}`;
        cookies = freshCookies;
        const retryRes = yield axios.get(url, {
          headers: __spreadProps(__spreadValues({}, getNetMirrorMobileHeaders(baseUrl, freshCookies)), {
            Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
            "Accept-Language": "en-IN,en-US;q=0.9,en;q=0.8",
            "X-Requested-With": "XMLHttpRequest",
            Referer: `${baseUrl}/mobile/home?app=1`
          }),
          timeout: 1e4
        });
        trays = parseHtmlTrays(retryRes.data, cheerio);
      }
    }
    if (prefix === "hs") {
      try {
        const hsCookies = cookies.replace("ott=dp", "ott=hs").replace("ott=nf", "ott=hs");
        const hsRes = yield axios.get(url, {
          headers: __spreadProps(__spreadValues({}, homeHeaders), {
            Cookie: hsCookies
          }),
          timeout: 1e4
        });
        const hsTrays = parseHtmlTrays(hsRes.data, cheerio);
        for (const ht of hsTrays) {
          if (!trays.some((t) => t.title.toLowerCase() === ht.title.toLowerCase())) {
            trays.push(ht);
          }
        }
      } catch (e) {
      }
    }
    if (trays.length > 0) {
      homeTrayCache.set(prefix, { trays, timestamp: Date.now() });
      return trays;
    }
  } catch (err) {
    console.error(`getCachedHomeTrays error [${prefix}]:`, err);
  }
  return cached ? cached.trays : [];
}), "getCachedHomeTrays");
var netMirrorGetPosts = /* @__PURE__ */ __name((_0) => __async(null, [_0], function* ({
  filter,
  page,
  prefix,
  signal,
  providerContext
}) {
  var _a, _b, _c;
  try {
    if (page > 1) return [];
    const { axios } = providerContext;
    const baseUrl = yield getNetMirrorBaseUrl(providerContext);
    const prefixPath = prefix ? `${prefix}/` : "";
    const t = Math.round(Date.now() / 1e3);
    const cleanFilter = (filter || "").trim().toLowerCase();
    const trays = yield getCachedHomeTrays(providerContext, prefix);
    const aliasMap = {
      "us tv shows": "us tv shows",
      "us & international tv shows": "us tv shows dubbed in hindi",
      "action": prefix === "pv" ? "action films" : "blockbuster movies",
      "action & adventure": prefix === "pv" ? "action films" : "blockbuster movies",
      "get in on the action": prefix === "pv" ? "action films" : "blockbuster movies",
      "action films": "action films",
      "drama": prefix === "pv" ? "drama series" : "emotional tv shows",
      "tv dramas": prefix === "pv" ? "drama series" : "emotional tv shows",
      "drama series": "drama series",
      "sci-fi": prefix === "pv" ? "science fiction movies" : "exciting tv shows",
      "sci-fi & fantasy": prefix === "pv" ? "science fiction movies" : "exciting tv shows",
      "tv sci-fi & fantasy": prefix === "pv" ? "science fiction movies" : "exciting tv shows",
      "mystery & thriller": prefix === "pv" ? "mystery and thriller movies" : "crime tv shows",
      "tv thrillers & mysteries": prefix === "pv" ? "mystery and thriller movies" : "crime tv shows",
      "suspense & thriller": prefix === "pv" ? "mystery and thriller movies" : "crime tv shows",
      "comedy": prefix === "pv" ? "comedy movies" : "casual viewing",
      "comedy movies": "comedy movies",
      "kids & family": prefix === "pv" ? "kids and family movies" : "teen tv shows",
      "kids & family movies": "kids and family movies",
      "children & family tv": prefix === "pv" ? "kids and family movies" : "teen tv shows",
      "asian movies & tv": "hindi movies & tv",
      "exciting movies": "exciting tv shows",
      "your next watch": "crowd pleasers",
      "gems for you": "gems for you",
      "international tv shows": "us tv shows dubbed in hindi",
      "korean": "korean",
      "korean dramas": "korean",
      "hotstar specials": "hotstar specials",
      "latest releases": "latest releases",
      "horror": prefix === "pv" ? "horror films" : "horror stories",
      "horror films": "horror films",
      "horror stories": "horror stories",
      "only on netflix": "only on netflix",
      "new on netflix": "new on netflix",
      "top movies": "top 10 movies in netflix today",
      "featured originals: series": "featured originals: series",
      "featured originals: movies": "featured originals: movies",
      "latest movies": "latest movies"
    };
    let matchedTray = trays.find(
      (tr) => tr.title.toLowerCase() === cleanFilter
    );
    if (!matchedTray && aliasMap[cleanFilter]) {
      const alias = aliasMap[cleanFilter];
      matchedTray = trays.find(
        (tr) => tr.title.toLowerCase() === alias
      );
    }
    if (!matchedTray) {
      matchedTray = trays.find((tr) => {
        const trTitle = tr.title.toLowerCase();
        return trTitle.includes(cleanFilter) || cleanFilter.includes(trTitle);
      });
    }
    if (!matchedTray && trays.length > 0) {
      matchedTray = trays[0];
    }
    if (matchedTray && matchedTray.items.length > 0) {
      const cookies2 = yield getNetMirrorCookie(providerContext, prefix);
      const itemsToFetch = matchedTray.items.filter(
        (it) => {
          var _a2;
          return !titleCache.has(it.id) && !((_a2 = it.alt) == null ? void 0 : _a2.trim());
        }
      );
      if (itemsToFetch.length > 0) {
        yield Promise.all(
          itemsToFetch.map((it) => __async(null, null, function* () {
            try {
              const postUrl = `${baseUrl}/mobile/${prefixPath}post.php?id=${it.id}&t=${t}`;
              const postRes = yield axios.get(postUrl, {
                headers: getNetMirrorMobileHeaders(baseUrl, cookies2),
                timeout: 6e3
              });
              const tData = postRes.data;
              if (tData && tData.title) {
                titleCache.set(it.id, tData.title);
              }
            } catch (e) {
            }
          }))
        );
      }
      const catalog2 = [];
      for (const it of matchedTray.items) {
        const title = titleCache.get(it.id) || ((_a = it.alt) == null ? void 0 : _a.trim()) || `Item ${it.id}`;
        const image = it.image || getPosterUrl(it.id, prefix);
        const link = `${it.id}|${prefix}|${encodeURIComponent(title)}`;
        catalog2.push({
          title,
          link,
          image,
          aspectRatio: prefix === "pv" ? 16 / 9 : void 0
        });
      }
      return catalog2;
    }
    const cookies = yield getNetMirrorCookie(providerContext, prefix, false);
    const url = `${baseUrl}/mobile/search.php?s=${encodeURIComponent(filter)}&t=${t}`;
    const res = yield axios.get(url, {
      signal,
      headers: getNetMirrorMobileHeaders(baseUrl, cookies)
    });
    const results = ((_b = res.data) == null ? void 0 : _b.searchResult) || [];
    const catalog = [];
    for (const item of results) {
      const id = item == null ? void 0 : item.id;
      const title = (item == null ? void 0 : item.t) || "";
      if (!id) continue;
      titleCache.set(String(id), title);
      const image = getPosterUrl(id, prefix);
      const link = `${id}|${prefix}|${encodeURIComponent(title)}`;
      catalog.push({
        title,
        link,
        image,
        tag: (item == null ? void 0 : item.y) || ((item == null ? void 0 : item.r) && item.r !== "Series" ? item.r : void 0),
        aspectRatio: prefix === "pv" ? 16 / 9 : void 0
      });
    }
    if (catalog.length === 0 && trays.length > 0 && trays[0].items.length > 0) {
      for (const it of trays[0].items) {
        const title = titleCache.get(it.id) || ((_c = it.alt) == null ? void 0 : _c.trim()) || `Item ${it.id}`;
        const image = it.image || getPosterUrl(it.id, prefix);
        const link = `${it.id}|${prefix}|${encodeURIComponent(title)}`;
        catalog.push({
          title,
          link,
          image,
          aspectRatio: prefix === "pv" ? 16 / 9 : void 0
        });
      }
    }
    return catalog;
  } catch (err) {
    console.error(`netMirrorGetPosts error [${prefix}]:`, err);
    return [];
  }
}), "netMirrorGetPosts");

// providers/primeMirror/posts.ts
var getPosts = /* @__PURE__ */ __name(function(_0) {
  return __async(this, arguments, function* ({
    filter,
    page,
    providerValue,
    signal,
    providerContext
  }) {
    return netMirrorGetPosts({
      filter,
      page,
      prefix: "pv",
      providerValue,
      signal,
      providerContext
    });
  });
}, "getPosts");
var getSearchPosts = /* @__PURE__ */ __name(function(_0) {
  return __async(this, arguments, function* ({
    searchQuery,
    page,
    providerValue,
    signal,
    providerContext
  }) {
    return netMirrorSearch({
      searchQuery,
      page,
      prefix: "pv",
      providerValue,
      signal,
      providerContext
    });
  });
}, "getSearchPosts");
exports.getPosts = getPosts;
exports.getSearchPosts = getSearchPosts;
// Annotate the CommonJS export names for ESM import in node:

