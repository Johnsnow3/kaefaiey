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

// providers/youtube/meta.ts
var meta_exports = {};
__export(meta_exports, {
  getMeta: () => getMeta
});

var defaultHeaders = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  "Accept-Language": "en-US,en;q=0.9"
};
function extractVideoId(link) {
  const match = link.match(/(?:v=|\/watch\?v=|\/embed\/|\/v\/|youtu\.be\/|\/shorts\/)([a-zA-Z0-9_-]{11})/i) || link.match(/([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : link;
}
__name(extractVideoId, "extractVideoId");
function formatViews(rawCount) {
  const num = typeof rawCount === "number" ? rawCount : parseInt(rawCount, 10);
  if (isNaN(num) || num <= 0) return "";
  if (num >= 1e9) {
    return (num / 1e9).toFixed(1).replace(/\.0$/, "") + "B views";
  }
  if (num >= 1e6) {
    return (num / 1e6).toFixed(1).replace(/\.0$/, "") + "M views";
  }
  if (num >= 1e3) {
    return (num / 1e3).toFixed(1).replace(/\.0$/, "") + "K views";
  }
  return num.toLocaleString() + " views";
}
__name(formatViews, "formatViews");
function formatDuration(totalSeconds) {
  const sec = typeof totalSeconds === "number" ? totalSeconds : parseInt(totalSeconds, 10);
  if (isNaN(sec) || sec <= 0) return "";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  const h = Math.floor(m / 60);
  const remM = m % 60;
  if (h > 0) {
    return `${h}:${remM.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }
  return `${m}:${s.toString().padStart(2, "0")}`;
}
__name(formatDuration, "formatDuration");
var getMeta = /* @__PURE__ */ __name(function(_0) {
  return __async(this, arguments, function* ({
    link,
    providerContext
  }) {
    var _a;
    const { axios, cheerio } = providerContext;
    const videoId = extractVideoId(link);
    const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
    try {
      const res = yield axios.get(watchUrl, { headers: defaultHeaders });
      const $ = cheerio.load(res.data);
      let title = $('meta[name="title"]').attr("content") || $('meta[property="og:title"]').attr("content") || $("title").text().replace(/ - YouTube$/, "").trim();
      let synopsis = $('meta[name="description"]').attr("content") || $('meta[property="og:description"]').attr("content") || "";
      let channel = $('link[itemprop="name"]').attr("content") || $('span[itemprop="author"] link[itemprop="name"]').attr("content") || "";
      let formattedViewCount = "";
      let durationStr = "";
      let publishDateStr = "";
      let category = "";
      let likes = "";
      const prMatch = res.data.match(/var ytInitialPlayerResponse\s*=\s*({.+?});(?:var|<\/script>)/) || res.data.match(/ytInitialPlayerResponse\s*=\s*({.+?});/);
      if (prMatch) {
        try {
          const pr = JSON.parse(prMatch[1]);
          const details = pr.videoDetails;
          if (details) {
            title = details.title || title;
            synopsis = details.shortDescription || synopsis;
            channel = details.author || channel;
            if (details.viewCount) {
              formattedViewCount = formatViews(details.viewCount);
            }
            if (details.lengthSeconds) {
              durationStr = formatDuration(details.lengthSeconds);
            }
          }
          const micro = (_a = pr.microformat) == null ? void 0 : _a.playerMicroformatRenderer;
          if (micro) {
            if (micro.category) {
              category = micro.category;
            }
            const pubDate = micro.publishDate || micro.uploadDate;
            if (pubDate) {
              const dateObj = new Date(pubDate);
              if (!isNaN(dateObj.getTime())) {
                publishDateStr = dateObj.toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric"
                });
              }
            }
          }
        } catch (e) {
        }
      }
      const dMatch = res.data.match(/var ytInitialData\s*=\s*({.+?});<\/script>/) || res.data.match(/ytInitialData\s*=\s*({.+?});/);
      if (dMatch) {
        try {
          let findLikes2 = function(obj) {
            if (!obj || typeof obj !== "object" || likes) return;
            if (obj.iconName === "LIKE" && typeof obj.title === "string") {
              likes = obj.title.trim();
              return;
            }
            if (obj.defaultText && typeof obj.defaultText.simpleText === "string" && /^[0-9.]+[KMB]?$/i.test(obj.defaultText.simpleText)) {
              likes = obj.defaultText.simpleText.trim();
              return;
            }
            for (const k of Object.keys(obj)) {
              if (!likes) findLikes2(obj[k]);
            }
          };
          var findLikes = findLikes2;
          __name(findLikes2, "findLikes");
          const data = JSON.parse(dMatch[1]);
          findLikes2(data);
        } catch (e) {
        }
      }
      if (!likes) {
        const regexMatch = res.data.match(/"iconName":"LIKE"[^}]*?"title":"([^"]+)"/);
        if (regexMatch) likes = regexMatch[1].trim();
      }
      const tags = [];
      if (formattedViewCount) tags.push(formattedViewCount);
      if (likes) tags.push(likes.toLowerCase().includes("like") ? likes : `${likes} likes`);
      if (durationStr) tags.push(`\u23F1 ${durationStr}`);
      if (publishDateStr) tags.push(publishDateStr);
      if (category) tags.push(category);
      const landscapeImage = `https://i.ytimg.com/vi/${videoId}/hq720.jpg`;
      const fallbackImage = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
      return {
        title: title || "YouTube Video",
        synopsis,
        image: landscapeImage || fallbackImage,
        poster: landscapeImage || fallbackImage,
        imdbId: "",
        type: "movie",
        cast: channel ? [channel] : void 0,
        tags: tags.length > 0 ? tags : void 0,
        rating: void 0,
        // Do not set rating to avoid "views/10" in the app UI
        linkList: [
          {
            title: "Watch Video",
            quality: "HD",
            directLinks: [
              {
                title: "Play Video",
                link: `https://www.youtube.com/watch?v=${videoId}`,
                type: "movie",
                image: landscapeImage
              }
            ]
          }
        ],
        webUrl: watchUrl
      };
    } catch (err) {
      console.error("YouTube getMeta error:", err);
      const landscapeImage = `https://i.ytimg.com/vi/${videoId}/hq720.jpg`;
      return {
        title: "YouTube Video",
        synopsis: "",
        image: landscapeImage,
        poster: landscapeImage,
        imdbId: "",
        type: "movie",
        linkList: [
          {
            title: "Watch Video",
            quality: "HD",
            directLinks: [
              {
                title: "Play Video",
                link: `https://www.youtube.com/watch?v=${videoId}`,
                type: "movie"
              }
            ]
          }
        ],
        webUrl: watchUrl
      };
    }
  });
}, "getMeta");
exports.getMeta = getMeta;
// Annotate the CommonJS export names for ESM import in node:

