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

// providers/vega/stream.ts
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

// providers/extractors/gofile.ts
var GOFILE_API = "https://api.gofile.io";
var GOFILE_LANGUAGE = "en-US";
var GOFILE_USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
var cachedAccountToken = null;
var cachedGenerateWT = null;
var cachedWTTime = 0;
function getOrFetchGenerateWT(axios) {
  return __async(this, null, function* () {
    const now = Date.now();
    if (cachedGenerateWT && now - cachedWTTime < 3 * 60 * 60 * 1e3) {
      return cachedGenerateWT;
    }
    try {
      const res = yield axios.get("https://gofile.io/js/wt.obf.js", {
        headers: {
          "User-Agent": GOFILE_USER_AGENT,
          Referer: "https://gofile.io/"
        }
      });
      const code = res.data;
      const runner = new Function(
        "navigator",
        "window",
        "document",
        "location",
        `${code}
return generateWT;`
      );
      const fakeNav = {
        userAgent: GOFILE_USER_AGENT,
        language: GOFILE_LANGUAGE
      };
      const fakeWin = {
        navigator: fakeNav,
        location: {
          href: "https://gofile.io/",
          protocol: "https:",
          host: "gofile.io"
        }
      };
      const generateWT = runner(fakeNav, fakeWin, {}, fakeWin.location);
      if (typeof generateWT === "function") {
        cachedGenerateWT = generateWT;
        cachedWTTime = now;
        return generateWT;
      }
    } catch (err) {
      console.warn("gofile: failed to fetch/execute wt.obf.js:", (err == null ? void 0 : err.message) || err);
    }
    return (accountToken) => accountToken;
  });
}
__name(getOrFetchGenerateWT, "getOrFetchGenerateWT");
function getOrFetchToken(axios, providerContext) {
  return __async(this, null, function* () {
    var _a, _b;
    if (cachedAccountToken) return cachedAccountToken;
    const kvStore = providerContext == null ? void 0 : providerContext.kvStore;
    try {
      const saved = yield kvStore == null ? void 0 : kvStore.get("gofile_account_token");
      if (saved && typeof saved === "string") {
        cachedAccountToken = saved;
        return saved;
      }
    } catch (e) {
    }
    const accountResponse = yield axios.post(
      `${GOFILE_API}/accounts`,
      {},
      {
        headers: {
          "User-Agent": GOFILE_USER_AGENT,
          Origin: "https://gofile.io",
          Referer: "https://gofile.io/"
        }
      }
    );
    const token = (_b = (_a = accountResponse.data) == null ? void 0 : _a.data) == null ? void 0 : _b.token;
    if (!token) throw new Error("Gofile did not return an account token");
    cachedAccountToken = token;
    try {
      yield kvStore == null ? void 0 : kvStore.set("gofile_account_token", token);
    } catch (e) {
    }
    return token;
  });
}
__name(getOrFetchToken, "getOrFetchToken");
function findFirstFile(content) {
  var _a;
  if ((content == null ? void 0 : content.type) === "file" && (content == null ? void 0 : content.link)) return content;
  for (const child of Object.values((_a = content == null ? void 0 : content.children) != null ? _a : {})) {
    const file = findFirstFile(child);
    if (file) return file;
  }
  return void 0;
}
__name(findFirstFile, "findFirstFile");
function gofileExtractor(id, axios, providerContext) {
  return __async(this, null, function* () {
    var _a, _b, _c, _d, _e, _f, _g;
    try {
      const token = yield getOrFetchToken(axios, providerContext);
      const generateWT = yield getOrFetchGenerateWT(axios);
      const websiteToken = generateWT(token);
      const response = yield axios.get(`${GOFILE_API}/contents/${id}`, {
        params: {
          contentFilter: "",
          page: 1,
          pageSize: 1e3,
          sortField: "name",
          sortDirection: 1
        },
        headers: {
          Accept: "*/*",
          "Accept-Language": `${GOFILE_LANGUAGE},en;q=0.9`,
          Authorization: `Bearer ${token}`,
          Origin: "https://gofile.io",
          Referer: "https://gofile.io/",
          "User-Agent": GOFILE_USER_AGENT,
          "X-BL": GOFILE_LANGUAGE,
          "X-Website-Token": websiteToken
        }
      });
      if (((_a = response.data) == null ? void 0 : _a.status) !== "ok") {
        if (((_b = response.data) == null ? void 0 : _b.status) === "error-auth" || response.status === 401) {
          cachedAccountToken = null;
          try {
            yield (_c = providerContext == null ? void 0 : providerContext.kvStore) == null ? void 0 : _c.delete("gofile_account_token");
          } catch (e) {
          }
        }
        throw new Error(
          `Gofile API returned ${(_e = (_d = response.data) == null ? void 0 : _d.status) != null ? _e : "invalid data"}`
        );
      }
      const file = findFirstFile(response.data.data);
      if (!(file == null ? void 0 : file.link)) throw new Error("No downloadable file found in Gofile response");
      return { link: file.link, token };
    } catch (error) {
      if (((_f = error == null ? void 0 : error.response) == null ? void 0 : _f.status) === 401) {
        cachedAccountToken = null;
        try {
          yield (_g = providerContext == null ? void 0 : providerContext.kvStore) == null ? void 0 : _g.delete("gofile_account_token");
        } catch (e) {
        }
      }
      throwProviderError("Gofile", `extract ${id}`, error);
    }
  });
}
__name(gofileExtractor, "gofileExtractor");

// providers/extractors/hubcloud.ts
var hubcloudDecode = /* @__PURE__ */ __name(function(value) {
  if (value === void 0) {
    return "";
  }
  return atob(value.toString());
}, "hubcloudDecode");
var extractUrlFromScript = /* @__PURE__ */ __name((html) => {
  var _a, _b, _c;
  const doubleAtobMatch = html.match(
    /(?:var|let|const)\s+\w+\s*=\s*atob\(atob\(['"]([^'"]+)['"]\)\)/
  );
  if (doubleAtobMatch == null ? void 0 : doubleAtobMatch[1]) {
    return atob(atob(doubleAtobMatch[1]));
  }
  const plainMatch = html.match(/var\s+url\s*=\s*['"]([^'"]+)['"]/);
  return hubcloudDecode((_c = (_b = (_a = plainMatch == null ? void 0 : plainMatch[1]) == null ? void 0 : _a.split("r=")) == null ? void 0 : _b[1]) != null ? _c : "") || (plainMatch == null ? void 0 : plainMatch[1]) || "";
}, "extractUrlFromScript");
var getPixelDrainUrl = /* @__PURE__ */ __name((html) => {
  const match = html.match(/var\s+pxl\s*=\s*['"]([^'"]+)['"];?/i);
  return (match == null ? void 0 : match[1]) || "";
}, "getPixelDrainUrl");
var getRedirectedPixelDrainUrl = /* @__PURE__ */ __name((...htmlSources) => {
  for (const html of htmlSources) {
    if (!html) {
      continue;
    }
    const redirectedUrl = getPixelDrainUrl(html);
    if (redirectedUrl) {
      return redirectedUrl;
    }
  }
  return "";
}, "getRedirectedPixelDrainUrl");
function resolveGofileLink(gofileLink, axios, providerContext) {
  return __async(this, null, function* () {
    try {
      const gofileUrl = new URL(gofileLink);
      const id = gofileUrl.pathname.split("/").filter(Boolean).pop();
      if (!id) return null;
      const gfResult = yield gofileExtractor(id, axios, providerContext);
      if (!(gfResult == null ? void 0 : gfResult.link) || !(gfResult == null ? void 0 : gfResult.token)) return null;
      return {
        server: "Gofile",
        link: gfResult.link,
        type: "mkv",
        headers: {
          Referer: "https://gofile.io/",
          Cookie: `accountToken=${gfResult.token}`
        }
      };
    } catch (error) {
      console.log("hubcloudExtractor: resolveGofileLink error:", error);
      return null;
    }
  });
}
__name(resolveGofileLink, "resolveGofileLink");
function hubcloudExtractor(link, signal, axios, cheerio, headers, providerContext, isDownload, providerValue) {
  return __async(this, null, function* () {
    var _a, _b, _c, _d, _e, _f, _g;
    try {
      if (!headers["Cookie"]) {
        headers["Cookie"] = "ext_name=ojplmecpdpgccookcobabopnaifgidhf; xla=s4t; cf_clearance=woQrFGXtLfmEMBEiGUsVHrUBMT8s3cmguIzmMjmvpkg-1770053679-1.2.1.1-xBrQdciOJsweUF6F2T_OtH6jmyanN_TduQ0yslc_XqjU6RcHSxI7.YOKv6ry7oYo64868HYoULnVyww536H2eVI3R2e4wKzsky6abjPdfQPxqpUaXjxfJ02o6jl3_Vkwr4uiaU7Wy596Vdst3y78HXvVmKdIohhtPvp.vZ9_L7wvWdce0GRixjh_6JiqWmWMws46hwEt3hboaS1e1e4EoWCvj5b0M_jVwvSxBOAW5emFzvT3QrnRh4nyYmKDERnY";
      }
      console.log("hubcloudExtractor", link);
      const baseUrl = link.split("/").slice(0, 3).join("/");
      const streamLinks = [];
      const openWebView = providerContext == null ? void 0 : providerContext.openWebView;
      let vLinkRes;
      try {
        vLinkRes = yield axios(`${link}`, { headers, signal });
      } catch (error) {
        if (((_a = error.response) == null ? void 0 : _a.status) === 403) {
          if (openWebView) {
            console.log(
              `hubcloudExtractor: WAF detected (403) for ${link}, using solver...`
            );
            const cleanHeaders = __spreadProps(__spreadValues({}, headers), { Referer: baseUrl });
            const wafResult = yield openWebView(baseUrl, {
              title: "Solve the captcha below and click done",
              description: "Required to bypass anti-bot protection.",
              headers: cleanHeaders,
              waitForCookie: "cf_clearance",
              force: true
            });
            if (wafResult.userAgent) headers["User-Agent"] = wafResult.userAgent;
            headers["Cookie"] = (headers["Cookie"] ? headers["Cookie"] + "; " : "") + wafResult.cookies;
            vLinkRes = yield axios(`${link}`, { headers, signal });
          } else {
            console.log(
              `hubcloudExtractor: 403 Forbidden for ${link}, but openWebView solver is not available!`
            );
            throw error;
          }
        } else {
          throw error;
        }
      }
      const vLinkText = vLinkRes.data;
      const $vLink = cheerio.load(vLinkText);
      const vLinkGofileBtns = $vLink("a[href*='gofile.io']");
      for (const el of vLinkGofileBtns) {
        const gfHref = $vLink(el).attr("href");
        if (gfHref) {
          const gfStream = yield resolveGofileLink(gfHref, axios, providerContext);
          if (gfStream && !streamLinks.some((s) => s.link === gfStream.link)) {
            streamLinks.push(gfStream);
          }
        }
      }
      let vcloudLink = extractUrlFromScript(vLinkText) || $vLink(".fa-file-download.fa-lg").parent().attr("href") || link;
      console.log("vcloudLink", vcloudLink);
      if (vcloudLink == null ? void 0 : vcloudLink.startsWith("/")) {
        vcloudLink = `${baseUrl}${vcloudLink}`;
        console.log("New vcloudLink", vcloudLink);
      }
      if (vcloudLink == null ? void 0 : vcloudLink.includes("gofile.io")) {
        const gfStream = yield resolveGofileLink(vcloudLink, axios, providerContext);
        if (gfStream && !streamLinks.some((s) => s.link === gfStream.link)) {
          streamLinks.push(gfStream);
        }
      }
      let vcloudText = "";
      if (vcloudLink && !vcloudLink.includes("gofile.io") && vcloudLink !== link) {
        try {
          const vcloudRes = yield axios.get(vcloudLink, { headers, signal });
          vcloudText = vcloudRes.data;
        } catch (error) {
          if (((_b = error.response) == null ? void 0 : _b.status) === 403 && openWebView) {
            console.log(
              `hubcloudExtractor: WAF detected (403) for ${vcloudLink}, using solver...`
            );
            const vcloudBaseUrl = vcloudLink.split("/").slice(0, 3).join("/");
            const cleanHeaders2 = __spreadProps(__spreadValues({}, headers), { Referer: vcloudBaseUrl });
            const wafResult = yield openWebView(vcloudBaseUrl, {
              title: "Solve the captcha below and click done",
              description: "Required to bypass anti-bot protection.",
              headers: cleanHeaders2,
              waitForCookie: "cf_clearance",
              force: true
            });
            if (wafResult.userAgent) headers["User-Agent"] = wafResult.userAgent;
            headers["Cookie"] = (headers["Cookie"] ? headers["Cookie"] + "; " : "") + wafResult.cookies;
            const retryRes = yield axios.get(vcloudLink, { headers, signal });
            vcloudText = retryRes.data;
          } else {
            throw error;
          }
        }
      }
      const $ = cheerio.load(vcloudText);
      const linkClass = $(".btn-success.btn-lg.h6,.btn-danger,.btn-secondary");
      for (const element of linkClass) {
        const itm = $(element);
        let link2 = itm.attr("href") || "";
        switch (true) {
          case (link2 == null ? void 0 : link2.includes("pixeld")):
            console.log("Pixeldrain link found:", link2);
            if (!(link2 == null ? void 0 : link2.includes("api"))) {
              const redirectedPixelDrainUrl = getRedirectedPixelDrainUrl(
                vLinkText,
                vcloudText
              );
              if (redirectedPixelDrainUrl) {
                console.log(
                  "Special case for token negn6f",
                  redirectedPixelDrainUrl
                );
                link2 = redirectedPixelDrainUrl;
              }
              const token = (_c = link2.split("/").pop()) == null ? void 0 : _c.split("?")[0];
              const baseUrl2 = link2.split("/").slice(0, -2).join("/");
              link2 = `${baseUrl2}/api/file/${token}?download`;
            }
            streamLinks.push({ server: "Pixeldrain", link: link2, type: "mkv" });
            break;
          case ((link2 == null ? void 0 : link2.includes(".dev")) && !(link2 == null ? void 0 : link2.includes("/?id="))):
            streamLinks.push({ server: "CF Worker", link: link2, type: "mkv" });
            break;
          case ((link2 == null ? void 0 : link2.includes("hubcloud")) || (link2 == null ? void 0 : link2.includes("/?id="))):
            try {
              let newLink = link2;
              try {
                if (typeof fetch !== "undefined") {
                  const fRes = yield fetch(link2, {
                    headers,
                    signal,
                    redirect: "follow"
                  });
                  if (fRes.url && fRes.url.includes("googleusercontent")) {
                    newLink = fRes.url.split("?link=")[1] || fRes.url;
                  } else if (fRes.url && fRes.url !== link2) {
                    newLink = fRes.url;
                  }
                }
              } catch (e) {
              }
              if (!newLink.includes("googleusercontent")) {
                try {
                  const res1 = yield axios.get(newLink, {
                    headers,
                    signal,
                    maxRedirects: 0,
                    validateStatus: /* @__PURE__ */ __name((s) => s >= 200 && s < 400, "validateStatus")
                  });
                  if ((_d = res1.headers) == null ? void 0 : _d["location"]) {
                    newLink = res1.headers["location"];
                  }
                  if (newLink.includes("googleusercontent")) {
                    newLink = newLink.split("?link=")[1] || newLink;
                  } else if (newLink.includes("http")) {
                    const res2 = yield axios.get(newLink, {
                      headers,
                      signal,
                      maxRedirects: 0,
                      validateStatus: /* @__PURE__ */ __name((s) => s >= 200 && s < 400, "validateStatus")
                    });
                    if ((_e = res2.headers) == null ? void 0 : _e["location"]) {
                      const loc2 = res2.headers["location"];
                      newLink = loc2.includes("?link=") ? loc2.split("?link=")[1] : loc2;
                    }
                  }
                } catch (e) {
                }
              }
              if (newLink.includes("?link=")) {
                newLink = newLink.split("?link=")[1] || newLink;
              }
              streamLinks.push({
                server: "GDrive (download only)",
                link: newLink,
                type: "mkv"
              });
            } catch (error) {
              console.log("hubcloudExtractor error in hubcloud link: ", error);
            }
            break;
          case (link2 == null ? void 0 : link2.includes("gofile.io")):
            try {
              const gfStream = yield resolveGofileLink(link2, axios, providerContext);
              if (gfStream && !streamLinks.some((s) => s.link === gfStream.link)) {
                streamLinks.push(gfStream);
              }
            } catch (error) {
              console.log("hubcloudExtractor error in gofile link: ", error);
            }
            break;
          case (link2 == null ? void 0 : link2.includes("cloudflarestorage")):
            streamLinks.push({ server: "CF Storage", link: link2, type: "mkv" });
            break;
          case ((link2 == null ? void 0 : link2.includes("fastdl")) || (link2 == null ? void 0 : link2.includes("fsl."))):
            streamLinks.push({ server: "FastDl", link: link2, type: "mkv" });
            break;
          case (link2.includes("hubcdn") && !link2.includes("/?id=")):
            streamLinks.push({
              server: "HubCdn",
              link: link2,
              type: "mkv"
            });
            break;
          default:
            if ((link2 == null ? void 0 : link2.includes(".mkv")) || (link2 == null ? void 0 : link2.includes("?token="))) {
              const serverName = "CF Worker";
              streamLinks.push({ server: serverName, link: link2, type: "mkv" });
            }
            break;
        }
      }
      let preferredServer = "auto";
      try {
        const specificKey = providerValue ? `${providerValue}_preferredDownloadServer` : "";
        preferredServer = ((specificKey ? yield (_f = providerContext == null ? void 0 : providerContext.kvStore) == null ? void 0 : _f.get(specificKey) : void 0) || (yield (_g = providerContext == null ? void 0 : providerContext.kvStore) == null ? void 0 : _g.get("preferredDownloadServer")) || "auto").toLowerCase().trim();
      } catch (e) {
      }
      const getPriority = /* @__PURE__ */ __name((serverName = "") => {
        const s = serverName.toLowerCase();
        if (isDownload && preferredServer !== "auto" && preferredServer !== "" && s.includes(preferredServer)) {
          return 0;
        }
        if (isDownload) {
          if (s.includes("cf storage") || s.includes("storage") || s.includes("resumable")) return 1;
          if (s.includes("gdrive") || s.includes("google") || s.includes("instant")) return 2;
          if (s.includes("pixeldrain")) return 3;
          if (s.includes("gofile")) return 4;
          if (s.includes("fastdl") || s.includes("fsl")) return 5;
          if (s.includes("hubcdn")) return 6;
          if (s.includes("cf worker") || s.includes("worker") || s.includes("fast cloud")) return 8;
          return 10;
        } else {
          if (s.includes("cf storage") || s.includes("storage")) return 1;
          if (s.includes("cf worker") || s.includes("worker") || s.includes("fast cloud")) return 2;
          if (s.includes("gofile")) return 3;
          if (s.includes("pixeldrain")) return 4;
          if (s.includes("fastdl") || s.includes("fsl")) return 5;
          if (s.includes("hubcdn")) return 6;
          if (s.includes("gdrive") || s.includes("google")) return 7;
          return 10;
        }
      }, "getPriority");
      streamLinks.sort((a, b) => getPriority(a.server) - getPriority(b.server));
      console.log("streamLinks", streamLinks);
      return streamLinks;
    } catch (error) {
      throwProviderError("HubCloud", `extract ${link}`, error);
    }
  });
}
__name(hubcloudExtractor, "hubcloudExtractor");

// providers/vega/stream.ts
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
      const streamLinks = [];
      console.log("dotlink", link);
      if (!link.includes("cloud")) {
        try {
          const dotlinkRes = yield axios.get(link, {
            headers: __spreadProps(__spreadValues({}, commonHeaders), { Referer: link.split("/").slice(0, 3).join("/") }),
            signal,
            timeout: 1e4
          });
          const dotlinkText = dotlinkRes.data;
          const $ = cheerio.load(dotlinkText);
          const gDirectLink = $(
            "a:contains('G-Direct'), a:contains('Instant'), a[href*='fastdl']"
          ).attr("href");
          if (gDirectLink) {
            try {
              const fastdlRes = yield axios.get(gDirectLink, {
                headers: __spreadProps(__spreadValues({}, commonHeaders), { Referer: link }),
                signal,
                timeout: 1e4
              });
              const m = fastdlRes.data.match(/reurl\s*=\s*["']([^"']+)["']/);
              if (m) {
                const targetUrl = m[1].includes("link=") ? decodeURIComponent(m[1].split("link=")[1]) : m[1];
                if (targetUrl.includes("googleusercontent.com") || targetUrl.startsWith("http")) {
                  streamLinks.push({
                    server: "Instant (Google CDN)",
                    link: targetUrl,
                    type: "mkv"
                  });
                }
              }
            } catch (e) {
              console.log("FastDL error:", e == null ? void 0 : e.message);
            }
          }
          const vcloudAnchor = $(
            "a:contains('V-Cloud'), a[href*='vcloud'], a[href*='hubcloud']"
          );
          const vlink = vcloudAnchor.attr("href") || (dotlinkText.match(/<a\s+href="([^"]*cloud\.[^"]*)"/i) || [])[1];
          if (vlink) {
            try {
              const hcStreams = yield hubcloudExtractor(
                vlink,
                signal,
                axios,
                cheerio,
                commonHeaders,
                providerContext,
                isDownload,
                "vega"
              );
              if (Array.isArray(hcStreams)) {
                for (const s of hcStreams) {
                  if (!streamLinks.some((existing) => existing.link === s.link)) {
                    streamLinks.push(s);
                  }
                }
              }
            } catch (e) {
              console.log("HubCloud vcloud error:", e == null ? void 0 : e.message);
            }
          }
          try {
            const filepressAnchor = $(
              '.btn.btn-sm.btn-outline[style*="rgb(252,185,0)"], a:contains("Filepress"), a[href*="filepress"], a[href*="filebee"]'
            ).first();
            const filepressLink = filepressAnchor.attr("href") || filepressAnchor.parent().attr("href");
            if (filepressLink) {
              const filepressID = filepressLink.split("/").pop();
              const filepressBaseUrl = filepressLink.split("/").slice(0, -2).join("/");
              const filepressTokenRes = yield axios.post(
                filepressBaseUrl + "/api/file/downlaod/",
                {
                  id: filepressID,
                  method: "indexDownlaod",
                  captchaValue: null
                },
                {
                  headers: {
                    "Content-Type": "application/json",
                    Referer: filepressBaseUrl
                  },
                  timeout: 1e4
                }
              );
              if ((_a = filepressTokenRes.data) == null ? void 0 : _a.status) {
                const filepressToken = (_b = filepressTokenRes.data) == null ? void 0 : _b.data;
                const filepressStreamLink = yield axios.post(
                  filepressBaseUrl + "/api/file/downlaod2/",
                  {
                    id: filepressToken,
                    method: "indexDownlaod",
                    captchaValue: null
                  },
                  {
                    headers: {
                      "Content-Type": "application/json",
                      Referer: filepressBaseUrl
                    },
                    timeout: 1e4
                  }
                );
                if ((_d = (_c = filepressStreamLink.data) == null ? void 0 : _c.data) == null ? void 0 : _d[0]) {
                  streamLinks.push({
                    server: "filepress",
                    link: filepressStreamLink.data.data[0],
                    type: "mkv"
                  });
                }
              }
            }
          } catch (error) {
            console.log("filepress error:", error == null ? void 0 : error.message);
          }
        } catch (err) {
          console.log("dotlink error:", err == null ? void 0 : err.message);
        }
      } else {
        const hcStreams = yield hubcloudExtractor(
          link,
          signal,
          axios,
          cheerio,
          commonHeaders,
          providerContext,
          isDownload,
          "vega"
        );
        if (Array.isArray(hcStreams)) {
          streamLinks.push(...hcStreams);
        }
      }
      if (streamLinks.length > 0) {
        return streamLinks;
      }
      return yield hubcloudExtractor(
        link,
        signal,
        axios,
        cheerio,
        commonHeaders,
        providerContext,
        isDownload,
        "vega"
      );
    } catch (error) {
      throwProviderError("Vega", "stream", error);
    }
  });
}
__name(getStream, "getStream");
exports.getStream = getStream;
// Annotate the CommonJS export names for ESM import in node:

