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

// providers/cinefreak/stream.ts
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

// providers/cinefreak/stream.ts
function decodeBase64Safe(str) {
  try {
    return atob(str);
  } catch (e) {
    try {
      return Buffer.from(str, "base64").toString("utf8");
    } catch (e2) {
      return str;
    }
  }
}
__name(decodeBase64Safe, "decodeBase64Safe");
function resolveCinecloudUrl(link) {
  try {
    if (link.includes("generate.php") && link.includes("id=")) {
      const urlObj = new URL(link);
      const rawId = urlObj.searchParams.get("id") || "";
      if (rawId) {
        const decoded = decodeBase64Safe(rawId);
        if (decoded.startsWith("http")) {
          const cleaned = decoded.replace(/newgo\d*$/i, "");
          return cleaned;
        }
      }
    }
  } catch (e) {
  }
  return link;
}
__name(resolveCinecloudUrl, "resolveCinecloudUrl");
function followRedirect(link, headers, signal, cheerio, axios) {
  return __async(this, null, function* () {
    var _a, _b;
    try {
      const res1 = yield axios.get(link, {
        headers,
        signal,
        maxRedirects: 0,
        timeout: 8e3,
        validateStatus: /* @__PURE__ */ __name((s) => s >= 200 && s < 400, "validateStatus")
      });
      let newLink = link;
      if ((_a = res1.headers) == null ? void 0 : _a["location"]) {
        newLink = res1.headers["location"];
      } else if (res1.status === 200 && typeof res1.data === "string") {
        try {
          const $ = cheerio.load(res1.data);
          const instantLink = $(
            "a.instant-download, a.download-btn, a.fsl-btn, a.server-btn, a.btn-success"
          ).attr("href");
          if (instantLink && instantLink !== "#") {
            newLink = instantLink;
          }
        } catch (e) {
        }
      }
      if (newLink.startsWith("/")) {
        const url = new URL(link);
        newLink = `${url.origin}${newLink}`;
      }
      if (newLink.includes("googleusercontent")) {
        newLink = newLink.split("?link=")[1] || newLink;
      } else if (newLink !== link && newLink.startsWith("http")) {
        try {
          const res2 = yield axios.get(newLink, {
            headers,
            signal,
            maxRedirects: 0,
            timeout: 8e3,
            validateStatus: /* @__PURE__ */ __name((s) => s >= 200 && s < 400, "validateStatus")
          });
          if ((_b = res2.headers) == null ? void 0 : _b["location"]) {
            const loc = res2.headers["location"];
            newLink = loc.includes("?link=") ? loc.split("?link=")[1] : loc;
          }
        } catch (e) {
        }
      }
      return newLink;
    } catch (e) {
      return link;
    }
  });
}
__name(followRedirect, "followRedirect");
function getStream(_0) {
  return __async(this, arguments, function* ({
    link,
    type,
    signal,
    providerContext,
    isDownload
  }) {
    var _a, _b, _c, _d;
    const { axios, cheerio, commonHeaders } = providerContext;
    try {
      let targetLink = resolveCinecloudUrl(link);
      if (targetLink.includes("generate.php")) {
        try {
          const res = yield axios.get(targetLink, {
            headers: commonHeaders,
            signal
          });
          const match = (_a = res.data) == null ? void 0 : _a.match(
            /window\.location\.href\s*=\s*["'](https?:\/\/[^"']+)["']/i
          );
          if (match == null ? void 0 : match[1]) {
            targetLink = match[1];
          }
        } catch (e) {
          console.warn("CineFreak: Failed to resolve generate.php via fetch", e);
        }
      }
      const streamLinks = [];
      let baseUrl = "";
      try {
        baseUrl = new URL(targetLink).origin;
      } catch (e) {
        baseUrl = "https://new5.cinecloud.site";
      }
      const idMatch = targetLink.match(/\/(?:x|f|d|w|gp)\/([a-zA-Z0-9]+)/);
      const id = idMatch ? idMatch[1] : "";
      const mainPageUrl = id ? `${baseUrl}/f/${id}` : targetLink;
      let pageHtml = "";
      try {
        const res = yield axios.get(mainPageUrl, {
          headers: commonHeaders,
          signal
        });
        pageHtml = res.data;
      } catch (e) {
        if (((_b = e.response) == null ? void 0 : _b.status) === 403 && providerContext.openWebView) {
          const cleanHeaders = __spreadProps(__spreadValues({}, commonHeaders), { Referer: baseUrl });
          delete cleanHeaders["User-Agent"];
          delete cleanHeaders["sec-ch-ua"];
          delete cleanHeaders["sec-ch-ua-mobile"];
          delete cleanHeaders["sec-ch-ua-platform"];
          delete cleanHeaders["Cookie"];
          const wafResult = yield providerContext.openWebView(baseUrl, {
            title: "Solve the captcha below and click done",
            description: "Required to bypass anti-bot protection.",
            headers: cleanHeaders,
            waitForCookie: "cf_clearance",
            force: true
          });
          if (wafResult.userAgent) commonHeaders["User-Agent"] = wafResult.userAgent;
          commonHeaders["Cookie"] = (commonHeaders["Cookie"] ? commonHeaders["Cookie"] + "; " : "") + wafResult.cookies;
          const retryRes = yield axios.get(mainPageUrl, { headers: commonHeaders, signal });
          pageHtml = retryRes.data;
        } else {
          throw e;
        }
      }
      const $ = cheerio.load(pageHtml);
      const linkElements = $(".server-btn");
      for (const el of linkElements) {
        const btn = $(el);
        let href = btn.attr("href") || "";
        if (!href || href === "#") continue;
        if (href.startsWith("/")) {
          href = `${baseUrl}${href}`;
        }
        const text = btn.text().trim().toLowerCase();
        try {
          if (href.includes(".dev") && !href.includes("/?id=")) {
            streamLinks.push({ server: "Fast Cloud", link: href, type: "mkv" });
          } else if (href.includes("/w/") || href.includes("/gp/") || text.includes("instant download")) {
            const newLink = yield followRedirect(href, commonHeaders, signal, cheerio, axios);
            if (newLink && newLink !== href) {
              streamLinks.push({
                server: text.includes("v2") || href.includes("/gp/") ? "Instant V2 (download only)" : "Instant (download only)",
                link: newLink,
                type: "mkv"
              });
            }
          } else if (href.includes("/d/") || text.includes("cloud [resumable]")) {
            let dPageHtml = "";
            try {
              const dPageRes = yield axios.get(href, { headers: commonHeaders, signal });
              dPageHtml = dPageRes.data;
            } catch (e) {
              if (((_c = e.response) == null ? void 0 : _c.status) === 403 && providerContext.openWebView) {
                const retryRes = yield axios.get(href, { headers: commonHeaders, signal });
                dPageHtml = retryRes.data;
              }
            }
            if (dPageHtml && !dPageHtml.includes("File not Found") && !dPageHtml.includes("cannot be found")) {
              const $dPage = cheerio.load(dPageHtml);
              let dPageLink = $dPage("a.download-now, a.btn-warning, a:contains('Download Now')").attr("href");
              if (dPageLink && (dPageLink.includes("/x/") || dPageLink.includes("/w/") || dPageLink.includes("/gp/") || dPageLink === "#")) {
                dPageLink = null;
              }
              if (!dPageLink) {
                $dPage("a[href]").each((_, aEl) => {
                  const h = $dPage(aEl).attr("href") || "";
                  if (h.includes("cloudflarestorage") || h.includes(".r2.dev") || h.includes("response-content-disposition")) {
                    dPageLink = h;
                  }
                });
              }
              if (!dPageLink) {
                const match = dPageHtml.match(/https?:\/\/[^\s"'<>]*(?:cloudflarestorage|r2\.dev)[^\s"'<>]*/);
                if (match) {
                  dPageLink = match[0];
                }
              }
              if (dPageLink && dPageLink.startsWith("http") && !dPageLink.includes("/x/")) {
                streamLinks.push({ server: "Cloud Resumable", link: dPageLink, type: "mkv" });
              }
            }
          } else if (href.includes("/x/") || text.includes("stream online")) {
            try {
              const xRes = yield axios.get(href, { headers: commonHeaders, signal });
              const $x = cheerio.load(xRes.data);
              const iframeSrc = $x("iframe").attr("src");
              if (iframeSrc) {
                const u = new URL(iframeSrc.startsWith("//") ? "https:" + iframeSrc : iframeSrc);
                const rawId = u.searchParams.get("id");
                if (rawId && rawId.startsWith("http")) {
                  streamLinks.push({ server: "Stream Online", link: rawId, type: "mkv" });
                }
              }
            } catch (err) {
            }
          }
        } catch (error) {
          console.warn(`Cinefreak extraction error for ${href}:`, error);
        }
      }
      let preferredServer = "auto";
      try {
        preferredServer = ((yield (_d = providerContext == null ? void 0 : providerContext.kvStore) == null ? void 0 : _d.get("cinefreak_preferredDownloadServer")) || "auto").toLowerCase().trim();
      } catch (e) {
      }
      const getPriority = /* @__PURE__ */ __name((server = "") => {
        const s = server.toLowerCase();
        if (isDownload && preferredServer !== "auto" && preferredServer !== "" && s.includes(preferredServer)) {
          return 0;
        }
        if (isDownload) {
          if (s.includes("resumable") || s.includes("storage")) return 1;
          if (s.includes("instant (download only)")) return 2;
          if (s.includes("instant v2")) return 3;
          if (s.includes("stream online")) return 4;
          if (s.includes("fast cloud") || s.includes("worker")) return 5;
        } else {
          if (s.includes("resumable") || s.includes("storage")) return 1;
          if (s.includes("fast cloud") || s.includes("worker")) return 2;
          if (s.includes("stream online")) return 3;
          if (s.includes("instant (download only)")) return 4;
          if (s.includes("instant v2")) return 5;
        }
        return 6;
      }, "getPriority");
      streamLinks.sort((a, b) => getPriority(a.server) - getPriority(b.server));
      return streamLinks;
    } catch (error) {
      throwProviderError("CineFreak", "stream", error);
      return [];
    }
  });
}
__name(getStream, "getStream");
exports.getStream = getStream;
// Annotate the CommonJS export names for ESM import in node:

