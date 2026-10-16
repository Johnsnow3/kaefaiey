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

// providers/kmMovies/stream.ts
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
function hubcloudExtractor(link, signal, axios, cheerio, headers2, providerContext, isDownload, providerValue) {
  return __async(this, null, function* () {
    var _a, _b, _c, _d, _e, _f, _g;
    try {
      if (!headers2["Cookie"]) {
        headers2["Cookie"] = "ext_name=ojplmecpdpgccookcobabopnaifgidhf; xla=s4t; cf_clearance=woQrFGXtLfmEMBEiGUsVHrUBMT8s3cmguIzmMjmvpkg-1770053679-1.2.1.1-xBrQdciOJsweUF6F2T_OtH6jmyanN_TduQ0yslc_XqjU6RcHSxI7.YOKv6ry7oYo64868HYoULnVyww536H2eVI3R2e4wKzsky6abjPdfQPxqpUaXjxfJ02o6jl3_Vkwr4uiaU7Wy596Vdst3y78HXvVmKdIohhtPvp.vZ9_L7wvWdce0GRixjh_6JiqWmWMws46hwEt3hboaS1e1e4EoWCvj5b0M_jVwvSxBOAW5emFzvT3QrnRh4nyYmKDERnY";
      }
      console.log("hubcloudExtractor", link);
      const baseUrl = link.split("/").slice(0, 3).join("/");
      const streamLinks = [];
      const openWebView = providerContext == null ? void 0 : providerContext.openWebView;
      let vLinkRes;
      try {
        vLinkRes = yield axios(`${link}`, { headers: headers2, signal });
      } catch (error) {
        if (((_a = error.response) == null ? void 0 : _a.status) === 403) {
          if (openWebView) {
            console.log(
              `hubcloudExtractor: WAF detected (403) for ${link}, using solver...`
            );
            const cleanHeaders = __spreadProps(__spreadValues({}, headers2), { Referer: baseUrl });
            const wafResult = yield openWebView(baseUrl, {
              title: "Solve the captcha below and click done",
              description: "Required to bypass anti-bot protection.",
              headers: cleanHeaders,
              waitForCookie: "cf_clearance",
              force: true
            });
            if (wafResult.userAgent) headers2["User-Agent"] = wafResult.userAgent;
            headers2["Cookie"] = (headers2["Cookie"] ? headers2["Cookie"] + "; " : "") + wafResult.cookies;
            vLinkRes = yield axios(`${link}`, { headers: headers2, signal });
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
          const vcloudRes = yield axios.get(vcloudLink, { headers: headers2, signal });
          vcloudText = vcloudRes.data;
        } catch (error) {
          if (((_b = error.response) == null ? void 0 : _b.status) === 403 && openWebView) {
            console.log(
              `hubcloudExtractor: WAF detected (403) for ${vcloudLink}, using solver...`
            );
            const vcloudBaseUrl = vcloudLink.split("/").slice(0, 3).join("/");
            const cleanHeaders2 = __spreadProps(__spreadValues({}, headers2), { Referer: vcloudBaseUrl });
            const wafResult = yield openWebView(vcloudBaseUrl, {
              title: "Solve the captcha below and click done",
              description: "Required to bypass anti-bot protection.",
              headers: cleanHeaders2,
              waitForCookie: "cf_clearance",
              force: true
            });
            if (wafResult.userAgent) headers2["User-Agent"] = wafResult.userAgent;
            headers2["Cookie"] = (headers2["Cookie"] ? headers2["Cookie"] + "; " : "") + wafResult.cookies;
            const retryRes = yield axios.get(vcloudLink, { headers: headers2, signal });
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
                    headers: headers2,
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
                    headers: headers2,
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
                      headers: headers2,
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

// providers/kmMovies/stream.ts
var headers = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  Pragma: "no-cache",
  "Cache-Control": "no-cache"
};
var browserHeaders = __spreadProps(__spreadValues({}, headers), {
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
  "Accept-Language": "en-US,en;q=0.9,en-IN;q=0.8",
  DNT: "1",
  Priority: "u=0, i",
  "Sec-CH-UA": '"Not;A=Brand";v="8", "Chromium";v="131", "Microsoft Edge";v="131"',
  "Sec-CH-UA-Mobile": "?0",
  "Sec-CH-UA-Platform": '"Windows"',
  "Sec-Fetch-Dest": "document",
  "Sec-Fetch-Mode": "navigate",
  "Sec-Fetch-Site": "none",
  "Sec-Fetch-User": "?1",
  "Upgrade-Insecure-Requests": "1"
});
var SERVER_PATTERNS = {
  "ZIP-ZAP": /* @__PURE__ */ __name((name, href) => name.includes("ZIP-ZAP") || href.includes("kmphotos.cv/download"), "ZIP-ZAP"),
  BUZZHEAVIER: /* @__PURE__ */ __name((name, href) => name.includes("BUZZHEAVIER") || name.includes("BUZZHIEVER") || href.includes("bzzhr.co"), "BUZZHEAVIER"),
  SKYDROP: /* @__PURE__ */ __name((name, href) => name.includes("SKYDROP") || href.includes("skydrop.sbs/"), "SKYDROP"),
  GOFILE: /* @__PURE__ */ __name((name, href) => href.includes("gofile.io/") || name.includes("GOFILE") && !href.includes(".php"), "GOFILE"),
  HUBCLOUD: /* @__PURE__ */ __name((name, href) => name.includes("HUBCLOUD") || href.includes("hubcloud."), "HUBCLOUD")
};
function getMagicLinksPage(url, requestHeaders) {
  return __async(this, null, function* () {
    const initialResponse = yield fetch(url, {
      headers: requestHeaders,
      credentials: "include",
      cache: "no-store",
      redirect: "manual"
    });
    const location = initialResponse.headers.get("location");
    const setCookie = initialResponse.headers.get("set-cookie");
    if (!location || !setCookie) {
      if (!initialResponse.ok) {
        throw new Error(
          `HTTP ${initialResponse.status} ${initialResponse.statusText} | URL ${url}`
        );
      }
      return { data: yield initialResponse.text() };
    }
    const cookie = setCookie.split(";", 1)[0];
    const destination = new URL(location, url).href;
    const response = yield fetch(destination, {
      headers: __spreadProps(__spreadValues({}, requestHeaders), {
        Cookie: cookie,
        Referer: url
      }),
      credentials: "include",
      cache: "no-store",
      redirect: "follow"
    });
    if (!response.ok) {
      throw new Error(
        `HTTP ${response.status} ${response.statusText} | URL ${destination}`
      );
    }
    return { data: yield response.text() };
  });
}
__name(getMagicLinksPage, "getMagicLinksPage");
function getWithWAF(url, axios, openWebView) {
  return __async(this, null, function* () {
    var _a;
    const baseUrl = url.split("/").slice(0, 3).join("/");
    const requestHeaders = __spreadProps(__spreadValues({}, headers), { Referer: baseUrl });
    try {
      if (new URL(url).hostname.includes("magiclinks")) {
        return yield getMagicLinksPage(url, requestHeaders);
      }
      return yield axios.get(url, {
        headers: requestHeaders,
        responseType: "text"
      });
    } catch (error) {
      if (((_a = error.response) == null ? void 0 : _a.status) === 403 && openWebView) {
        console.log(`WAF detected (403) for ${url}, using solver...`);
        const wafResult = yield openWebView(baseUrl, {
          title: "Solve the captcha below and click done",
          description: "Required to bypass anti-bot protection.",
          headers: __spreadProps(__spreadValues({}, headers), { Referer: baseUrl }),
          waitForCookie: "cf_clearance"
        });
        return yield axios.get(url, {
          headers: __spreadProps(__spreadValues({}, headers), {
            Referer: baseUrl,
            Cookie: wafResult.cookies || wafResult.cookie
          }),
          responseType: "text"
        });
      }
      throw error;
    }
  });
}
__name(getWithWAF, "getWithWAF");
function extractDownloadLinks($) {
  const links = [];
  const seen = /* @__PURE__ */ new Set();
  $("a[href]").each((_, element) => {
    var _a;
    const href = (_a = $(element).attr("href")) == null ? void 0 : _a.trim();
    if (!href || seen.has(href)) return;
    const name = $(element).text().replace(/\s+/g, " ").trim().toUpperCase();
    for (const [server, matches] of Object.entries(SERVER_PATTERNS)) {
      if (matches(name, href)) {
        seen.add(href);
        links.push({ server, link: href });
        return;
      }
    }
  });
  return links;
}
__name(extractDownloadLinks, "extractDownloadLinks");
function captureRedirect(url, axios, requestHeaders) {
  return __async(this, null, function* () {
    var _a;
    const response = yield axios.get(url, {
      headers: requestHeaders,
      maxRedirects: 0,
      validateStatus: /* @__PURE__ */ __name((status) => status >= 200 && status < 400, "validateStatus")
    });
    return ((_a = response.headers) == null ? void 0 : _a.location) ? new URL(response.headers.location, url).href : "";
  });
}
__name(captureRedirect, "captureRedirect");
function resolveZipZap(link, axios, cheerio, commonHeaders) {
  return __async(this, null, function* () {
    try {
      const downloadUrl = new URL(link);
      const requestHeaders = __spreadProps(__spreadValues(__spreadValues({}, headers), commonHeaders), {
        Referer: downloadUrl.origin
      });
      const pageResponse = yield axios.get(downloadUrl.href, {
        headers: requestHeaders
      });
      const $ = cheerio.load(pageResponse.data);
      const r2Href = $("a[href*='dl=r2']").first().attr("href");
      if (!r2Href) return null;
      const r2Url = new URL(r2Href, downloadUrl);
      const rawUrl = yield captureRedirect(r2Url.href, axios, __spreadProps(__spreadValues({}, requestHeaders), {
        Referer: downloadUrl.href
      }));
      return rawUrl ? { server: "ZIP-ZAP", link: rawUrl, type: "mkv" } : null;
    } catch (err) {
      console.log("resolveZipZap error:", (err == null ? void 0 : err.message) || err);
      return null;
    }
  });
}
__name(resolveZipZap, "resolveZipZap");
function resolveBuzzheavier(link, axios, cheerio, commonHeaders) {
  return __async(this, null, function* () {
    var _a, _b;
    try {
      const origin = new URL(link).origin;
      const requestHeaders = __spreadProps(__spreadValues(__spreadValues({}, browserHeaders), commonHeaders), {
        Referer: origin
      });
      const pageResponse = yield axios.get(link, { headers: requestHeaders });
      const $ = cheerio.load(pageResponse.data);
      const downloadPath = $("a.download-btn").attr("hx-get");
      if (!downloadPath) return null;
      const downloadUrl = new URL(downloadPath, origin).href;
      const setCookie = (_a = pageResponse.headers) == null ? void 0 : _a["set-cookie"];
      const cookie = (Array.isArray(setCookie) ? setCookie : [setCookie]).filter(Boolean).map((value) => value.split(";", 1)[0]).join("; ");
      const downloadResponse = yield axios.head(downloadUrl, {
        headers: __spreadValues(__spreadProps(__spreadValues({}, requestHeaders), {
          Referer: link,
          "HX-Request": "true",
          "HX-Current-URL": link
        }), cookie ? { Cookie: cookie } : {}),
        validateStatus: /* @__PURE__ */ __name((status) => status >= 200 && status < 300, "validateStatus")
      });
      const redirectUrl = (_b = downloadResponse.headers) == null ? void 0 : _b["hx-redirect"];
      if (!redirectUrl) return null;
      return {
        server: "BUZZHEAVIER",
        link: new URL(redirectUrl, origin).href,
        type: "mkv",
        headers: {
          Referer: link,
          "User-Agent": requestHeaders["User-Agent"]
        }
      };
    } catch (err) {
      console.log("resolveBuzzheavier error:", (err == null ? void 0 : err.message) || err);
      return null;
    }
  });
}
__name(resolveBuzzheavier, "resolveBuzzheavier");
function resolveSkyDrop(link, axios, providerContext) {
  return __async(this, null, function* () {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q, _r, _s;
    try {
      const skyDropUrl = new URL(link);
      const origin = skyDropUrl.origin;
      const id = skyDropUrl.searchParams.get("id");
      if (!id) return null;
      const reqHeaders = __spreadProps(__spreadValues({}, headers), {
        Referer: link,
        Origin: origin,
        "X-Requested-With": "XMLHttpRequest"
      });
      const getRes = yield axios.get(link, { headers: reqHeaders });
      let setCookie = ((_a = getRes.headers) == null ? void 0 : _a["set-cookie"]) || ((_b = getRes.headers) == null ? void 0 : _b["Set-Cookie"]) || ((_c = getRes.headers) == null ? void 0 : _c["x-set-cookie"]) || ((_d = getRes.headers) == null ? void 0 : _d["X-Set-Cookie"]) || (typeof ((_e = getRes.headers) == null ? void 0 : _e.get) === "function" ? getRes.headers.get("x-set-cookie") || getRes.headers.get("set-cookie") : "");
      if (!setCookie && (providerContext == null ? void 0 : providerContext.openWebView)) {
        try {
          const waf = yield providerContext.openWebView(link, {
            headers: reqHeaders,
            waitForCookie: "skydrop_download"
          });
          if (waf == null ? void 0 : waf.cookies) {
            setCookie = waf.cookies;
          }
        } catch (e) {
        }
      }
      if (setCookie) {
        const cookieHeader = (Array.isArray(setCookie) ? setCookie : [setCookie]).map((c) => c.split(";")[0]).join("; ");
        reqHeaders["Cookie"] = cookieHeader;
      }
      const resolveRes = yield axios.post(
        `${origin}/resolve/`,
        {},
        { headers: reqHeaders }
      );
      if (((_f = resolveRes.data) == null ? void 0 : _f.success) && ((_g = resolveRes.data) == null ? void 0 : _g.ready_url)) {
        const readyUrl = new URL(resolveRes.data.ready_url, origin).href;
        const readyRes = yield axios.get(readyUrl, {
          headers: __spreadProps(__spreadValues({}, reqHeaders), {
            Referer: link
          })
        });
        const extraCookieRaw = ((_h = readyRes.headers) == null ? void 0 : _h["set-cookie"]) || ((_i = readyRes.headers) == null ? void 0 : _i["Set-Cookie"]) || (typeof ((_j = readyRes.headers) == null ? void 0 : _j.get) === "function" ? readyRes.headers.get("set-cookie") : "");
        if (extraCookieRaw) {
          const extraCookie = (Array.isArray(extraCookieRaw) ? extraCookieRaw : [extraCookieRaw]).map((c) => c.split(";")[0]).join("; ");
          reqHeaders["Cookie"] = (reqHeaders["Cookie"] ? reqHeaders["Cookie"] + "; " : "") + extraCookie;
        }
        let finalLocation = "";
        try {
          const fetchRes = yield axios.post(
            `${origin}/fetch/`,
            {},
            {
              headers: __spreadProps(__spreadValues({}, reqHeaders), {
                Referer: readyUrl
              }),
              maxRedirects: 0,
              validateStatus: /* @__PURE__ */ __name((status) => status >= 200 && status < 400, "validateStatus")
            }
          );
          const loc = ((_k = fetchRes.headers) == null ? void 0 : _k.location) || ((_l = fetchRes.headers) == null ? void 0 : _l["location"]) || (typeof ((_m = fetchRes.headers) == null ? void 0 : _m.get) === "function" ? fetchRes.headers.get("location") : "") || ((_n = fetchRes.request) == null ? void 0 : _n.responseURL) || "";
          if (loc && (loc.includes("http") || loc.startsWith("/"))) {
            finalLocation = new URL(loc, origin).href;
          }
        } catch (err) {
          const loc = ((_p = (_o = err.response) == null ? void 0 : _o.headers) == null ? void 0 : _p.location) || ((_r = (_q = err.response) == null ? void 0 : _q.headers) == null ? void 0 : _r["location"]) || ((_s = err.request) == null ? void 0 : _s.responseURL);
          if (loc && (loc.includes("http") || loc.startsWith("/"))) {
            finalLocation = new URL(loc, origin).href;
          }
        }
        if (!finalLocation && typeof fetch !== "undefined") {
          const controller = new AbortController();
          try {
            const fRes = yield fetch(`${origin}/fetch/`, {
              method: "POST",
              headers: __spreadProps(__spreadValues({}, reqHeaders), {
                Referer: readyUrl
              }),
              signal: controller.signal
            });
            if (fRes.url && fRes.url.includes("googleusercontent")) {
              finalLocation = fRes.url;
            } else if (fRes.headers.get("location")) {
              finalLocation = fRes.headers.get("location") || "";
            }
          } catch (e) {
          } finally {
            controller.abort();
          }
        }
        if (finalLocation && finalLocation.includes("googleusercontent")) {
          return {
            server: "G-Drive (download only)",
            link: finalLocation,
            type: "mkv"
          };
        }
        return {
          server: finalLocation ? "G-Drive (download only)" : "SkyDrop (download only)",
          link: finalLocation || `${origin}/fetch/`,
          type: "mkv",
          headers: __spreadProps(__spreadValues({
            Referer: readyUrl
          }, reqHeaders["Cookie"] ? { Cookie: reqHeaders["Cookie"] } : {}), {
            "User-Agent": headers["User-Agent"]
          })
        };
      }
    } catch (err) {
      console.log("resolveSkyDrop error:", (err == null ? void 0 : err.message) || err);
    }
    return null;
  });
}
__name(resolveSkyDrop, "resolveSkyDrop");
function resolveGofile(link, axios, providerContext) {
  return __async(this, null, function* () {
    try {
      if (!link.includes("gofile.io")) return null;
      const gofileUrl = new URL(link);
      const id = gofileUrl.pathname.split("/").filter(Boolean).pop();
      if (!id || id.endsWith(".php") || id.endsWith(".html")) return null;
      const result = yield gofileExtractor(id, axios, providerContext);
      if (!(result == null ? void 0 : result.link) || !(result == null ? void 0 : result.token)) return null;
      return {
        server: "Gofile",
        link: result.link,
        type: "mkv",
        headers: {
          Referer: "https://gofile.io/",
          Cookie: `accountToken=${result.token}`
        }
      };
    } catch (err) {
      console.log("resolveGofile error:", (err == null ? void 0 : err.message) || err);
      return null;
    }
  });
}
__name(resolveGofile, "resolveGofile");
function resolveHubcloud(link, signal, axios, cheerio, commonHeaders, providerContext, isDownload) {
  return __async(this, null, function* () {
    try {
      const streams = yield hubcloudExtractor(
        link,
        signal,
        axios,
        cheerio,
        __spreadValues(__spreadProps(__spreadValues({}, headers), {
          Referer: link
        }), commonHeaders),
        providerContext
      );
      if (!(streams == null ? void 0 : streams.length)) return null;
      if (isDownload) {
        streams.sort((a, b) => {
          const aIsDownload = a.server.toLowerCase().includes("download");
          const bIsDownload = b.server.toLowerCase().includes("download");
          if (aIsDownload && !bIsDownload) return -1;
          if (!aIsDownload && bIsDownload) return 1;
          return 0;
        });
      }
      return streams[0];
    } catch (err) {
      console.log("resolveHubcloud error:", (err == null ? void 0 : err.message) || err);
      return null;
    }
  });
}
__name(resolveHubcloud, "resolveHubcloud");
function getStream(_0) {
  return __async(this, arguments, function* ({
    link,
    type,
    signal,
    providerContext,
    isDownload
  }) {
    const { axios, cheerio, openWebView, commonHeaders } = providerContext;
    try {
      const resolvers = {
        "ZIP-ZAP": /* @__PURE__ */ __name((l) => resolveZipZap(l, axios, cheerio, commonHeaders || {}), "ZIP-ZAP"),
        BUZZHEAVIER: /* @__PURE__ */ __name((l) => resolveBuzzheavier(l, axios, cheerio, commonHeaders || {}), "BUZZHEAVIER"),
        SKYDROP: /* @__PURE__ */ __name((l) => resolveSkyDrop(l, axios, providerContext), "SKYDROP"),
        GOFILE: /* @__PURE__ */ __name((l) => resolveGofile(l, axios, providerContext), "GOFILE"),
        HUBCLOUD: /* @__PURE__ */ __name((l) => resolveHubcloud(
          l,
          signal,
          axios,
          cheerio,
          commonHeaders || {},
          providerContext,
          isDownload
        ), "HUBCLOUD")
      };
      for (const [server, matches] of Object.entries(SERVER_PATTERNS)) {
        if (matches("", link)) {
          try {
            const stream = yield resolvers[server](link);
            if (stream) return [stream];
          } catch (err) {
            console.log(`Direct ${server} check failed:`, (err == null ? void 0 : err.message) || err);
          }
        }
      }
      const res = yield getWithWAF(link, axios, openWebView);
      const $ = cheerio.load(res.data);
      const downloadLinks = extractDownloadLinks($);
      const streams = [];
      const seen = /* @__PURE__ */ new Set();
      const resolverFailures = [];
      const serverOrder = isDownload ? ["SKYDROP", "ZIP-ZAP", "BUZZHEAVIER", "GOFILE", "HUBCLOUD"] : ["ZIP-ZAP", "BUZZHEAVIER", "GOFILE", "HUBCLOUD", "SKYDROP"];
      for (const server of serverOrder) {
        for (const { link: dlLink } of downloadLinks.filter(
          (d) => d.server === server
        )) {
          try {
            const stream = yield resolvers[server](dlLink);
            if (stream && !seen.has(stream.link)) {
              seen.add(stream.link);
              streams.push(stream);
              break;
            }
          } catch (error) {
            console.log(`${server} failed:`, (error == null ? void 0 : error.message) || error);
            resolverFailures.push(`${server}: ${(error == null ? void 0 : error.message) || String(error)}`);
          }
        }
      }
      if (downloadLinks.length > 0 && streams.length === 0 && resolverFailures.length > 0) {
        throw new Error(
          `All stream resolvers failed: ${resolverFailures.join("; ")}`
        );
      }
      return streams;
    } catch (error) {
      throwProviderError("KMMovies", "stream", error);
    }
  });
}
__name(getStream, "getStream");
exports.getStream = getStream;
// Annotate the CommonJS export names for ESM import in node:

