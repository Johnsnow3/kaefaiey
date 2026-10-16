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

// providers/showbox/stream.ts
var stream_exports = {};
__export(stream_exports, {
  getStream: () => getStream
});


// providers/providerErrors.ts
function getErrorMessage(error) {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  try {
    return JSON.stringify(error);
  } catch (e) {
    return String(error);
  }
}
__name(getErrorMessage, "getErrorMessage");
function throwProviderError(provider, operation, error) {
  var _a, _b;
  const response = error == null ? void 0 : error.response;
  const status = response == null ? void 0 : response.status;
  const statusText = response == null ? void 0 : response.statusText;
  const url = ((_a = response == null ? void 0 : response.config) == null ? void 0 : _a.url) || ((_b = error == null ? void 0 : error.config) == null ? void 0 : _b.url);
  const details = [
    status ? `HTTP ${status}${statusText ? ` ${statusText}` : ""}` : "",
    url ? `URL ${url}` : "",
    getErrorMessage(error)
  ].filter(Boolean);
  throw new Error(`${provider} ${operation} failed: ${details.join(" | ")}`);
}
__name(throwProviderError, "throwProviderError");

// providers/showbox/stream.ts
var getStream = /* @__PURE__ */ __name(function(_0) {
  return __async(this, arguments, function* ({
    link: id,
    // type,
    signal,
    providerContext
  }) {
    var _a, _b, _c, _d, _e;
    try {
      const { axios, cheerio, kvStore } = providerContext;
      const stream = [];
      const [, epId] = id.split("&");
      if (!epId) return [];
      let html = "";
      const febboxCookie = yield kvStore == null ? void 0 : kvStore.get("febboxCookie");
      if (febboxCookie) {
        try {
          const febRes = yield axios.get(
            `https://www.febbox.com/console/video_quality_list?fid=${epId}`,
            {
              headers: {
                Cookie: febboxCookie,
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
                "X-Requested-With": "XMLHttpRequest",
                Referer: "https://www.febbox.com/"
              },
              signal
            }
          );
          if (((_a = febRes.data) == null ? void 0 : _a.html) && typeof febRes.data.html === "string") {
            html = febRes.data.html;
          } else if (((_b = febRes.data) == null ? void 0 : _b.code) === -1 || ((_c = febRes.data) == null ? void 0 : _c.login_required) || typeof ((_d = febRes.data) == null ? void 0 : _d.msg) === "string" && febRes.data.msg.toLowerCase().includes("login")) {
            throw new Error("Please set cookies in ShowBox provider settings");
          }
        } catch (e) {
          if ((_e = e.message) == null ? void 0 : _e.includes("ShowBox provider settings")) {
            throw e;
          }
        }
      }
      if (!html) {
        const url = `https://feb.8man.workers.dev/?fid=${epId}`;
        const res = yield axios.get(url, { signal });
        const data = res.data;
        if ((data == null ? void 0 : data.html) && typeof data.html === "string") {
          html = data.html;
        } else if ((data == null ? void 0 : data.code) === -1 || (data == null ? void 0 : data.login_required) || typeof (data == null ? void 0 : data.msg) === "string" && data.msg.toLowerCase().includes("login")) {
          throw new Error("Please set cookies in ShowBox provider settings");
        }
      }
      if (!html) {
        return [];
      }
      const $ = cheerio.load(html);
      $(".file_quality").each((i, el) => {
        const server = $(el).find("p.name").text() + " - " + $(el).find("p.size").text() + " - " + $(el).find("p.speed").text();
        const link = $(el).attr("data-url");
        if (link) {
          stream.push({
            server,
            type: "mkv",
            link
          });
        }
      });
      return stream;
    } catch (err) {
      throwProviderError("ShowBox", "stream", err);
    }
  });
}, "getStream");
exports.getStream = getStream;
// Annotate the CommonJS export names for ESM import in node:

