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

// providers/animesub/posts.ts
var posts_exports = {};
__export(posts_exports, {
  getPosts: () => getPosts,
  getSearchPosts: () => getSearchPosts
});

var MAL_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
};
function cleanMalImage(src) {
  if (!src) return "";
  return src.replace(/\/r\/\d+x\d+/, "");
}
__name(cleanMalImage, "cleanMalImage");
function parseMalTopAnime(html, cheerio) {
  const $ = cheerio.load(html);
  const posts = [];
  $("tr.ranking-list").each((_, el) => {
    var _a;
    const titleEl = $(el).find(".anime_ranking_h3 a, h3 a").first();
    const title = titleEl.text().trim();
    const malUrl = titleEl.attr("href") || "";
    const malId = (_a = malUrl.match(/anime\/(\d+)/)) == null ? void 0 : _a[1];
    if (!title || !malId) return;
    const imgEl = $(el).find("td.title img, .hoverinfo_trigger img").first();
    const rawImg = imgEl.attr("data-src") || imgEl.attr("src") || "";
    const image = cleanMalImage(rawImg);
    const score = $(el).find(".score span").text().trim();
    const tag = score && score !== "N/A" ? `${score}\u2605` : void 0;
    posts.push({
      title,
      link: JSON.stringify({ malId, title, image, type: "series" }),
      image,
      tag
    });
  });
  return posts;
}
__name(parseMalTopAnime, "parseMalTopAnime");
function parseMalSeasonal(html, cheerio, page) {
  const $ = cheerio.load(html);
  const allSeasonal = [];
  $(".seasonal-anime").each((_, el) => {
    var _a;
    const titleEl = $(el).find(".title a.link-title, .title-text .link-title").first();
    const title = titleEl.text().trim();
    const malUrl = titleEl.attr("href") || "";
    const malId = (_a = malUrl.match(/anime\/(\d+)/)) == null ? void 0 : _a[1];
    if (!title || !malId) return;
    const imgEl = $(el).find(".image img").first();
    const rawImg = imgEl.attr("data-src") || imgEl.attr("src") || "";
    const image = cleanMalImage(rawImg);
    const score = $(el).find(".score").text().trim();
    const tag = score && score !== "N/A" ? `${score}\u2605` : void 0;
    allSeasonal.push({
      title,
      link: JSON.stringify({ malId, title, image, type: "series" }),
      image,
      tag
    });
  });
  const pageSize = 25;
  const startIndex = (page - 1) * pageSize;
  return allSeasonal.slice(startIndex, startIndex + pageSize);
}
__name(parseMalSeasonal, "parseMalSeasonal");
function parseMalGenre(html, cheerio) {
  const $ = cheerio.load(html);
  const posts = [];
  $(".seasonal-anime").each((_, el) => {
    var _a;
    const titleEl = $(el).find(".title a.link-title, .title-text .link-title").first();
    const title = titleEl.text().trim();
    const malUrl = titleEl.attr("href") || "";
    const malId = (_a = malUrl.match(/anime\/(\d+)/)) == null ? void 0 : _a[1];
    if (!title || !malId) return;
    const imgEl = $(el).find(".image img").first();
    const rawImg = imgEl.attr("data-src") || imgEl.attr("src") || "";
    const image = cleanMalImage(rawImg);
    const score = $(el).find(".score").text().trim();
    const tag = score && score !== "N/A" ? `${score}\u2605` : void 0;
    posts.push({
      title,
      link: JSON.stringify({ malId, title, image, type: "series" }),
      image,
      tag
    });
  });
  return posts;
}
__name(parseMalGenre, "parseMalGenre");
function fetchKitsuFallbackPosts(filter, page, signal, providerContext) {
  return __async(this, null, function* () {
    var _a;
    try {
      const skipParam = page > 1 ? `&skip=${(page - 1) * 20}` : "";
      const filterWithSkip = filter.replace(".json", `${skipParam}.json`);
      const baseUrl = filter.startsWith("http") ? "" : "https://anime-kitsu.strem.fun";
      const url = baseUrl + filterWithSkip;
      const res = yield providerContext.axios.get(url, {
        headers: providerContext.commonHeaders,
        signal,
        timeout: 1e4
      });
      const data = res.data;
      const catalog = [];
      (_a = data == null ? void 0 : data.metas) == null ? void 0 : _a.forEach((result) => {
        const title = result == null ? void 0 : result.name;
        const id = result == null ? void 0 : result.id;
        const image = result == null ? void 0 : result.poster;
        const rating = (result == null ? void 0 : result.kitsuRating) || (result == null ? void 0 : result.rating);
        const tag = rating ? `${rating}\u2605` : void 0;
        if (id) {
          catalog.push({
            title,
            link: `https://anime-kitsu.strem.fun/meta/anime/${id}.json`,
            image,
            tag
          });
        }
      });
      return catalog;
    } catch (e) {
      return [];
    }
  });
}
__name(fetchKitsuFallbackPosts, "fetchKitsuFallbackPosts");
var getPosts = /* @__PURE__ */ __name(function(_0) {
  return __async(this, arguments, function* ({
    filter,
    page,
    signal,
    providerContext
  }) {
    try {
      if (filter.startsWith("mal:topanime:")) {
        const type = filter.replace("mal:topanime:", "").trim();
        const offset = (page - 1) * 50;
        const url = `https://myanimelist.net/topanime.php?type=${type}&limit=${offset}`;
        const res = yield providerContext.axios.get(url, {
          headers: MAL_HEADERS,
          signal,
          timeout: 1e4
        });
        return parseMalTopAnime(res.data, providerContext.cheerio);
      }
      if (filter === "mal:season:current") {
        const url = "https://myanimelist.net/anime/season";
        const res = yield providerContext.axios.get(url, {
          headers: MAL_HEADERS,
          signal,
          timeout: 1e4
        });
        return parseMalSeasonal(res.data, providerContext.cheerio, page);
      }
      if (filter.startsWith("mal:genre:")) {
        const parts = filter.split(":");
        const genreId = parts[2];
        const genreName = parts[3] || "Action";
        const url = `https://myanimelist.net/anime/genre/${genreId}/${genreName}?page=${page}`;
        const res = yield providerContext.axios.get(url, {
          headers: MAL_HEADERS,
          signal,
          timeout: 1e4
        });
        return parseMalGenre(res.data, providerContext.cheerio);
      }
      return yield fetchKitsuFallbackPosts(filter, page, signal, providerContext);
    } catch (err) {
      console.warn("AnimeSub getPosts error, trying Kitsu fallback:", err);
      return yield fetchKitsuFallbackPosts(filter, page, signal, providerContext);
    }
  });
}, "getPosts");
var getSearchPosts = /* @__PURE__ */ __name(function(_0) {
  return __async(this, arguments, function* ({
    searchQuery,
    page,
    signal,
    providerContext
  }) {
    var _a, _b;
    try {
      if (page > 1) {
        return [];
      }
      const encoded = encodeURIComponent(searchQuery);
      const searchUrl = `https://myanimelist.net/anime.php?q=${encoded}`;
      const res = yield providerContext.axios.get(searchUrl, {
        headers: MAL_HEADERS,
        signal,
        timeout: 1e4
      });
      const $ = providerContext.cheerio.load(res.data);
      const posts = [];
      $("table").eq(1).find("tr").each((i, el) => {
        var _a2;
        if (i === 0) return;
        const titleEl = $(el).find("a.hoverinfo_trigger strong, strong").first();
        const a = $(el).find("a.hoverinfo_trigger").first();
        const title = titleEl.text().trim() || a.text().trim();
        const href = a.attr("href") || "";
        const malId = (_a2 = href.match(/anime\/(\d+)/)) == null ? void 0 : _a2[1];
        if (!title || !malId) return;
        const imgEl = $(el).find("img").first();
        const rawImg = imgEl.attr("data-src") || imgEl.attr("src") || "";
        const image = cleanMalImage(rawImg);
        const score = $(el).find("td:nth-child(5)").text().trim();
        const tag = score && score !== "N/A" ? `${score}\u2605` : void 0;
        if (!posts.some((p) => p.title.toLowerCase() === title.toLowerCase())) {
          posts.push({
            title,
            link: JSON.stringify({ malId, title, image, type: "series" }),
            image,
            tag
          });
        }
      });
      if (posts.length > 0) {
        return posts;
      }
    } catch (err) {
      console.warn("AnimeSub MAL search error, falling back to Kitsu search:", err);
    }
    try {
      const encoded = encodeURIComponent(searchQuery);
      const url = `https://anime-kitsu.strem.fun/catalog/anime/kitsu-anime-list/search=${encoded}.json`;
      const res = yield providerContext.axios.get(url, {
        headers: providerContext.commonHeaders,
        signal,
        timeout: 1e4
      });
      const catalog = [];
      (_b = (_a = res.data) == null ? void 0 : _a.metas) == null ? void 0 : _b.forEach((result) => {
        const title = (result == null ? void 0 : result.name) || "";
        const id = result == null ? void 0 : result.id;
        const image = result == null ? void 0 : result.poster;
        const rating = (result == null ? void 0 : result.kitsuRating) || (result == null ? void 0 : result.rating);
        const tag = rating ? `${rating}\u2605` : void 0;
        if (id && !catalog.some((item) => item.link.includes(id))) {
          catalog.push({
            title,
            link: `https://anime-kitsu.strem.fun/meta/anime/${id}.json`,
            image,
            tag
          });
        }
      });
      return catalog;
    } catch (e) {
      return [];
    }
  });
}, "getSearchPosts");
exports.getPosts = getPosts;
exports.getSearchPosts = getSearchPosts;
// Annotate the CommonJS export names for ESM import in node:

