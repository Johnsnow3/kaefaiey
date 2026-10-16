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

// providers/youtube/posts.ts
var posts_exports = {};
__export(posts_exports, {
  getPosts: () => getPosts,
  getSearchPosts: () => getSearchPosts
});

var defaultHeaders = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  "Accept-Language": "en-US,en;q=0.9"
};
function extractVideosFromData(data) {
  const posts = [];
  const seenIds = /* @__PURE__ */ new Set();
  function walk(obj) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j;
    if (!obj || typeof obj !== "object") return;
    if (obj.videoRenderer) {
      const vr = obj.videoRenderer;
      const videoId = vr.videoId;
      if (videoId && !seenIds.has(videoId)) {
        seenIds.add(videoId);
        const title = ((_b = (_a = vr.title) == null ? void 0 : _a.runs) == null ? void 0 : _b.map((r) => r.text).join("")) || ((_c = vr.title) == null ? void 0 : _c.simpleText) || "";
        const channel = ((_e = (_d = vr.ownerText) == null ? void 0 : _d.runs) == null ? void 0 : _e.map((r) => r.text).join("")) || ((_g = (_f = vr.shortBylineText) == null ? void 0 : _f.runs) == null ? void 0 : _g.map((r) => r.text).join("")) || "";
        const views = ((_h = vr.shortViewCountText) == null ? void 0 : _h.simpleText) || ((_i = vr.viewCountText) == null ? void 0 : _i.simpleText) || "";
        const duration = ((_j = vr.lengthText) == null ? void 0 : _j.simpleText) || "";
        const image = `https://i.ytimg.com/vi/${videoId}/hq720.jpg`;
        const tag = channel ? `${channel}${views ? ` \u2022 ${views}` : ""}` : views || void 0;
        posts.push({
          title: title.trim(),
          link: `https://www.youtube.com/watch?v=${videoId}`,
          image,
          aspectRatio: 16 / 9,
          borderRadius: 8,
          tag,
          cornerTag: duration || void 0
        });
      }
    }
    for (const key of Object.keys(obj)) {
      walk(obj[key]);
    }
  }
  __name(walk, "walk");
  walk(data);
  return posts;
}
__name(extractVideosFromData, "extractVideosFromData");
var getPosts = /* @__PURE__ */ __name(function(_0) {
  return __async(this, arguments, function* ({
    filter,
    page,
    providerContext
  }) {
    const { axios } = providerContext;
    try {
      const query = filter || "trending";
      const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(
        query
      )}`;
      const res = yield axios.get(searchUrl, {
        headers: defaultHeaders
      });
      const match = res.data.match(/var ytInitialData\s*=\s*({.+?});<\/script>/) || res.data.match(/ytInitialData\s*=\s*({.+?});/);
      if (!match) return [];
      const data = JSON.parse(match[1]);
      const posts = extractVideosFromData(data);
      const pageSize = 20;
      const startIndex = (page - 1) * pageSize;
      if (startIndex >= posts.length) {
        return posts.slice(0, pageSize);
      }
      return posts.slice(startIndex, startIndex + pageSize);
    } catch (err) {
      console.error("YouTube getPosts error:", err);
      return [];
    }
  });
}, "getPosts");
var getSearchPosts = /* @__PURE__ */ __name(function(_0) {
  return __async(this, arguments, function* ({
    searchQuery,
    page,
    providerContext
  }) {
    const { axios } = providerContext;
    try {
      const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(
        searchQuery
      )}`;
      const res = yield axios.get(searchUrl, {
        headers: defaultHeaders
      });
      const match = res.data.match(/var ytInitialData\s*=\s*({.+?});<\/script>/) || res.data.match(/ytInitialData\s*=\s*({.+?});/);
      if (!match) return [];
      const data = JSON.parse(match[1]);
      const posts = extractVideosFromData(data);
      const pageSize = 20;
      const startIndex = (page - 1) * pageSize;
      if (startIndex >= posts.length) {
        return posts.slice(0, pageSize);
      }
      return posts.slice(startIndex, startIndex + pageSize);
    } catch (err) {
      console.error("YouTube getSearchPosts error:", err);
      return [];
    }
  });
}, "getSearchPosts");
exports.getPosts = getPosts;
exports.getSearchPosts = getSearchPosts;
// Annotate the CommonJS export names for ESM import in node:

