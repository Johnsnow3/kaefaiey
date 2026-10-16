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

// providers/mod/stream.ts
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
      const streamLinks2 = [];
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
          if (gfStream && !streamLinks2.some((s) => s.link === gfStream.link)) {
            streamLinks2.push(gfStream);
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
        if (gfStream && !streamLinks2.some((s) => s.link === gfStream.link)) {
          streamLinks2.push(gfStream);
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
            streamLinks2.push({ server: "Pixeldrain", link: link2, type: "mkv" });
            break;
          case ((link2 == null ? void 0 : link2.includes(".dev")) && !(link2 == null ? void 0 : link2.includes("/?id="))):
            streamLinks2.push({ server: "CF Worker", link: link2, type: "mkv" });
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
              streamLinks2.push({
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
              if (gfStream && !streamLinks2.some((s) => s.link === gfStream.link)) {
                streamLinks2.push(gfStream);
              }
            } catch (error) {
              console.log("hubcloudExtractor error in gofile link: ", error);
            }
            break;
          case (link2 == null ? void 0 : link2.includes("cloudflarestorage")):
            streamLinks2.push({ server: "CF Storage", link: link2, type: "mkv" });
            break;
          case ((link2 == null ? void 0 : link2.includes("fastdl")) || (link2 == null ? void 0 : link2.includes("fsl."))):
            streamLinks2.push({ server: "FastDl", link: link2, type: "mkv" });
            break;
          case (link2.includes("hubcdn") && !link2.includes("/?id=")):
            streamLinks2.push({
              server: "HubCdn",
              link: link2,
              type: "mkv"
            });
            break;
          default:
            if ((link2 == null ? void 0 : link2.includes(".mkv")) || (link2 == null ? void 0 : link2.includes("?token="))) {
              const serverName = "CF Worker";
              streamLinks2.push({ server: serverName, link: link2, type: "mkv" });
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
      streamLinks2.sort((a, b) => getPriority(a.server) - getPriority(b.server));
      console.log("streamLinks", streamLinks2);
      return streamLinks2;
    } catch (error) {
      throwProviderError("HubCloud", `extract ${link}`, error);
    }
  });
}
__name(hubcloudExtractor, "hubcloudExtractor");

// providers/extractors/gdflix.ts
function gdflixExtractor(link, signal, axios, cheerio, headers, providerContext) {
  return __async(this, null, function* () {
    var _a, _b, _c, _d, _e, _f, _g;
    try {
      let wafCookies;
      try {
        yield axios.get(link, { headers, signal });
      } catch (error) {
        if (((_a = error.response) == null ? void 0 : _a.status) === 403 && (providerContext == null ? void 0 : providerContext.openWebView)) {
          console.log("gdflix: WAF detected (403), using solver...");
          const baseUrl = link.split("/").slice(0, 3).join("/");
          const wafResult = yield providerContext.openWebView(link, {
            title: "Solve the captcha below and click done",
            description: "Required to bypass GDFlix anti-bot protection.",
            headers: __spreadProps(__spreadValues({}, headers), { Referer: baseUrl }),
            force: true,
            waitForCookie: "cf_clearance"
          });
          wafCookies = wafResult.cookies;
        } else {
          throw error;
        }
      }
      if (wafCookies) {
        headers["Cookie"] = wafCookies;
      }
      const streamLinks2 = [];
      const res = yield axios(`${link}`, { headers, signal });
      console.log("gdflixExtractor", link);
      const data = res.data;
      let $drive = cheerio.load(data);
      if ((_b = $drive("body").attr("onload")) == null ? void 0 : _b.includes("location.replace")) {
        const newLink = (_e = (_d = (_c = $drive("body").attr("onload")) == null ? void 0 : _c.split("location.replace('")) == null ? void 0 : _d[1].split("'")) == null ? void 0 : _e[0];
        console.log("newLink", newLink);
        if (newLink) {
          const newRes = yield axios.get(newLink, { headers, signal });
          $drive = cheerio.load(newRes.data);
        }
      }
      try {
        const baseUrl = link.split("/").slice(0, 3).join("/");
        const resumeDrive = $drive(".btn-secondary").attr("href") || "";
        console.log("resumeDrive", resumeDrive);
        if (resumeDrive.includes("indexbot")) {
          const resumeBotRes = yield axios.get(resumeDrive, { headers });
          const resumeBotToken = resumeBotRes.data.match(
            /formData\.append\('token', '([a-f0-9]+)'\)/
          )[1];
          const resumeBotBody = new FormData();
          resumeBotBody.append("token", resumeBotToken);
          const resumeBotPath = resumeBotRes.data.match(
            /fetch\('\/download\?id=([a-zA-Z0-9\/+]+)'/
          )[1];
          const resumeBotBaseUrl = resumeDrive.split("/download")[0];
          const resumeBotDownload = yield fetch(
            resumeBotBaseUrl + "/download?id=" + resumeBotPath,
            {
              method: "POST",
              body: resumeBotBody,
              headers: {
                Referer: resumeDrive,
                Cookie: "PHPSESSID=7e9658ce7c805dab5bbcea9046f7f308"
              }
            }
          );
          const resumeBotDownloadData = yield resumeBotDownload.json();
          console.log("resumeBotDownloadData", resumeBotDownloadData.url);
          streamLinks2.push({
            server: "ResumeBot",
            link: resumeBotDownloadData.url,
            type: "mkv"
          });
        } else {
          const url = baseUrl + resumeDrive;
          const resumeDriveRes = yield axios.get(url, { headers });
          const resumeDriveHtml = resumeDriveRes.data;
          const $resumeDrive = cheerio.load(resumeDriveHtml);
          const resumeLink = $resumeDrive(".btn-success").attr("href");
          if (resumeLink) {
            streamLinks2.push({
              server: "ResumeCloud",
              link: resumeLink,
              type: "mkv"
            });
          }
        }
      } catch (err) {
        console.log("Resume link not found");
      }
      try {
        const seed = $drive(".btn-danger").attr("href") || "";
        if (seed && seed.startsWith("http")) {
          if (seed.includes("url=")) {
            const directPart = decodeURIComponent(seed.split("url=")[1]);
            if (directPart && directPart.startsWith("http")) {
              streamLinks2.push({ server: "Instant Download", link: directPart, type: "mkv" });
            }
          }
          try {
            const vRes = yield axios.get(seed, {
              headers: __spreadProps(__spreadValues({}, headers), { Referer: link }),
              maxRedirects: 0,
              validateStatus: /* @__PURE__ */ __name((s) => s >= 200 && s < 400, "validateStatus"),
              signal
            });
            const loc = (_f = vRes.headers) == null ? void 0 : _f.location;
            if (loc) {
              let directGoogleUrl = null;
              if (loc.includes("url=")) {
                directGoogleUrl = decodeURIComponent(loc.split("url=")[1]);
              } else if (loc.includes("googleusercontent.com") || loc.startsWith("http")) {
                directGoogleUrl = loc;
              }
              if (directGoogleUrl && directGoogleUrl.startsWith("http")) {
                streamLinks2.push({ server: "Instant Download", link: directGoogleUrl, type: "mkv" });
              }
            } else if (typeof vRes.data === "string") {
              const upMatch = vRes.data.match(/window\.location\.href\s*=\s*["']([^"']+)["']/);
              if (upMatch) {
                const upPath = upMatch[1];
                const vOrigin = new URL(seed).origin;
                const upUrl = upPath.startsWith("http") ? upPath : vOrigin + upPath;
                const upRes = yield axios.get(upUrl, {
                  headers: __spreadProps(__spreadValues({}, headers), { Referer: seed }),
                  signal
                });
                const loc2 = (_g = upRes.headers) == null ? void 0 : _g.location;
                if (loc2 && loc2.startsWith("http")) {
                  streamLinks2.push({ server: "Instant Download", link: loc2, type: "mkv" });
                } else if (typeof upRes.data === "string") {
                  const $up = cheerio.load(upRes.data);
                  const dlBtn = $up("#downloadBtn, a.btn-danger, a.btn-success").attr("href");
                  if (dlBtn && dlBtn.startsWith("http")) {
                    streamLinks2.push({ server: "Instant Download", link: dlBtn, type: "mkv" });
                  }
                }
              }
            }
          } catch (e) {
          }
        }
      } catch (e) {
      }
      return streamLinks2;
    } catch (error) {
      return streamLinks;
    }
  });
}
__name(gdflixExtractor, "gdflixExtractor");

// providers/mod/stream.ts
var getStream = /* @__PURE__ */ __name(function(_0) {
  return __async(this, arguments, function* ({
    link: url,
    type,
    signal,
    providerContext,
    isDownload
  }) {
    const { axios, cheerio, commonHeaders } = providerContext;
    try {
      let targetUrl = url;
      if (type === "movie" && !targetUrl.includes("thenaukriadda") && !targetUrl.includes("sid=") && !targetUrl.includes("driveseed") && !targetUrl.includes("driveleech") && !targetUrl.includes("appdrive") && !targetUrl.includes("hubcloud") && !targetUrl.includes("gdflix")) {
        try {
          const episodeLinks = yield modGetEpisodeLinks({ url: targetUrl, providerContext });
          if (episodeLinks && episodeLinks.length > 0 && episodeLinks[0].link) {
            targetUrl = episodeLinks[0].link;
          }
        } catch (e) {
        }
      }
      if (targetUrl.includes("thenaukriadda") || targetUrl.includes("sid=")) {
        try {
          const bypassed = yield bypassThenaukriadda(targetUrl, providerContext, signal);
          if (bypassed) {
            targetUrl = bypassed;
          }
        } catch (bypassErr) {
          console.warn("Moviesmod: thenaukriadda bypass failed:", bypassErr.message);
        }
      }
      if (!targetUrl.includes("driveseed") && !targetUrl.includes("driveleech") && !targetUrl.includes("appdrive") && !targetUrl.includes("hubcloud") && !targetUrl.includes("gdflix")) {
        try {
          const legacyBypassed = yield bypassLegacyWpHttp(targetUrl, providerContext, signal);
          if (legacyBypassed) {
            targetUrl = legacyBypassed;
          }
        } catch (e) {
        }
      }
      if (targetUrl.includes("unblockedgames") || targetUrl.includes("leechpro")) {
        try {
          const res = yield axios.get(targetUrl, {
            headers: commonHeaders,
            signal
          });
          const html = typeof res.data === "string" ? res.data : "";
          const refreshMatch = html.match(/content=["']\d+;\s*url=(.*?)["']/i);
          const replaceMatch = html.match(/location\.replace\(["']([^"']+)["']\)/i);
          const nextUrl = (refreshMatch == null ? void 0 : refreshMatch[1]) || (replaceMatch == null ? void 0 : replaceMatch[1]);
          if (nextUrl) {
            targetUrl = nextUrl.replace(/\\/g, "");
          }
        } catch (e) {
        }
      }
      if (targetUrl.includes("hubcloud")) {
        return yield hubcloudExtractor(
          targetUrl,
          signal,
          axios,
          cheerio,
          commonHeaders,
          providerContext,
          isDownload,
          "MoviesMod"
        );
      }
      if (targetUrl.includes("gdflix")) {
        return yield gdflixExtractor(
          targetUrl,
          signal,
          axios,
          cheerio,
          commonHeaders,
          providerContext
        );
      }
      if (targetUrl.includes("driveseed") || targetUrl.includes("driveleech") || targetUrl.includes("appdrive")) {
        const driveStreams = yield extractStreamsFromDriveseed(
          targetUrl,
          providerContext,
          signal
        );
        if (driveStreams.length > 0) {
          return driveStreams;
        }
      }
      if (/\.(mp4|mkv|m3u8|avi)($|\?)/i.test(targetUrl)) {
        return [
          {
            server: "Direct Stream",
            link: targetUrl,
            type: targetUrl.includes(".m3u8") ? "m3u8" : "mkv"
          }
        ];
      }
      return [];
    } catch (err) {
      throwProviderError("MoviesMod", "stream", err);
      return [];
    }
  });
}, "getStream");
function modGetEpisodeLinks(_0) {
  return __async(this, arguments, function* ({
    url,
    providerContext
  }) {
    var _a;
    const { axios, cheerio, commonHeaders } = providerContext;
    try {
      let cleanUrl = url;
      if (cleanUrl.includes("url=")) {
        cleanUrl = atob(cleanUrl.split("url=")[1]);
      }
      const res = yield axios.get(cleanUrl, { headers: commonHeaders });
      const html = res.data;
      let $ = cheerio.load(html);
      if (url.includes("url=")) {
        const newUrl = (_a = $("meta[http-equiv='refresh']").attr("content")) == null ? void 0 : _a.split("url=")[1];
        if (newUrl) {
          const res2 = yield axios.get(newUrl, { headers: commonHeaders });
          $ = cheerio.load(res2.data);
        }
      }
      const episodeLinks = [];
      $("h3,h4").each((_, element) => {
        const seriesTitle = $(element).text();
        const link = $(element).find("a").attr("href");
        if (link && link !== "#") {
          episodeLinks.push({
            title: seriesTitle.trim() || "Download",
            link
          });
        }
      });
      $("a.maxbutton").each((_, element) => {
        const seriesTitle = $(element).children("span").text();
        const link = $(element).attr("href");
        if (link && link !== "#") {
          episodeLinks.push({
            title: seriesTitle.trim() || "Download",
            link
          });
        }
      });
      return episodeLinks;
    } catch (e) {
      return [];
    }
  });
}
__name(modGetEpisodeLinks, "modGetEpisodeLinks");
function bypassThenaukriadda(initialUrl, providerContext, signal) {
  return __async(this, null, function* () {
    var _a, _b, _c, _d, _e;
    const { axios, cheerio, commonHeaders } = providerContext;
    const headers = __spreadProps(__spreadValues({}, commonHeaders), { Referer: "https://moviesmod.ai.in/" });
    const res1 = yield axios.get(initialUrl, { headers, signal });
    const html1 = typeof res1.data === "string" ? res1.data : "";
    const $1 = cheerio.load(html1);
    const lpHttp = $1('input[name="_lp_http"]').val();
    let action1 = $1("form#lp-land").attr("action") || $1("form").attr("action") || initialUrl;
    if (!action1.startsWith("http")) {
      action1 = new URL(action1, initialUrl).href;
    }
    let cookies = "";
    const setCookies1 = (_a = res1.headers) == null ? void 0 : _a["set-cookie"];
    if (Array.isArray(setCookies1)) {
      cookies = setCookies1.map((c) => c.split(";")[0]).join("; ");
    }
    if (!lpHttp) {
      const directMatch = html1.match(/location\.replace\(["']([^"']+)["']\)/);
      if (directMatch) return directMatch[1].replace(/\\/g, "");
      return initialUrl;
    }
    const fd1 = new URLSearchParams();
    fd1.append("_lp_http", lpHttp);
    const res2 = yield axios.post(action1, fd1.toString(), {
      headers: __spreadProps(__spreadValues({}, headers), {
        "Content-Type": "application/x-www-form-urlencoded",
        Referer: initialUrl,
        Cookie: cookies
      }),
      signal
    });
    const setCookies2 = (_b = res2.headers) == null ? void 0 : _b["set-cookie"];
    if (Array.isArray(setCookies2)) {
      const c2 = setCookies2.map((c) => c.split(";")[0]).join("; ");
      cookies = cookies ? `${cookies}; ${c2}` : c2;
    }
    const html2 = typeof res2.data === "string" ? res2.data : "";
    const $2 = cheerio.load(html2);
    const form2 = $2("form#lp-s1-form").length > 0 ? $2("form#lp-s1-form") : $2("form").first();
    let action2 = form2.attr("action") || action1;
    if (!action2.startsWith("http")) {
      action2 = new URL(action2, action1).href;
    }
    const fd2 = new URLSearchParams();
    form2.find("input").each((_, el) => {
      const name = $2(el).attr("name");
      const val = $2(el).attr("value");
      if (name && val !== void 0) {
        fd2.append(name, val);
      }
    });
    const res3 = yield axios.post(action2, fd2.toString(), {
      headers: __spreadProps(__spreadValues({}, headers), {
        "Content-Type": "application/x-www-form-urlencoded",
        Referer: action1,
        Cookie: cookies
      }),
      signal
    });
    const setCookies3 = (_c = res3.headers) == null ? void 0 : _c["set-cookie"];
    if (Array.isArray(setCookies3)) {
      const c3 = setCookies3.map((c) => c.split(";")[0]).join("; ");
      cookies = cookies ? `${cookies}; ${c3}` : c3;
    }
    const html3 = typeof res3.data === "string" ? res3.data : "";
    const scMatch = html3.match(/sc\(["']([^"']+)["'],\s*["']([^"']+)["']/);
    if (!scMatch) {
      const directGo = html3.match(/href=["'](https?:\/\/[^"']*?[?&]lp_go=[^"']*)["']/);
      if (directGo) return directGo[1];
      const directMatch = html3.match(/location\.replace\(["']([^"']+)["']\)/);
      if (directMatch) return directMatch[1].replace(/\\/g, "");
      return action2;
    }
    const tokenName = scMatch[1];
    const tokenVal = scMatch[2];
    const origin2 = new URL(action2).origin;
    const lpGoUrl = `${origin2}/?lp_go=${tokenName}`;
    cookies += `; ${tokenName}=${tokenVal}`;
    const res4 = yield axios.get(lpGoUrl, {
      headers: __spreadProps(__spreadValues({}, headers), {
        Referer: action2,
        Cookie: cookies
      }),
      signal
    });
    const html4 = typeof res4.data === "string" ? res4.data : "";
    const redirectMatch = html4.match(/location\.replace\(["']([^"']+)["']\)/);
    if (redirectMatch) {
      return redirectMatch[1].replace(/\\/g, "");
    }
    return ((_e = (_d = res4.request) == null ? void 0 : _d.res) == null ? void 0 : _e.responseUrl) || lpGoUrl;
  });
}
__name(bypassThenaukriadda, "bypassThenaukriadda");
function bypassLegacyWpHttp(url, providerContext, signal) {
  return __async(this, null, function* () {
    var _a, _b;
    const { axios, cheerio, commonHeaders: headers } = providerContext;
    try {
      const sid = url.includes("sid=") ? url.split("sid=")[1] : "";
      let formUrl = url.split("?")[0];
      let wpHttp2 = "";
      if (sid) {
        const fd = new URLSearchParams();
        fd.append("_wp_http", sid);
        const res = yield axios.post(formUrl, fd.toString(), {
          headers: __spreadProps(__spreadValues({}, headers), { "Content-Type": "application/x-www-form-urlencoded" }),
          signal
        });
        const $ = cheerio.load(res.data);
        wpHttp2 = $('input[name="_wp_http2"]').val();
        const act = $("form").attr("action");
        if (act) formUrl = act.startsWith("http") ? act : new URL(act, formUrl).href;
      } else {
        const res = yield axios.get(url, { headers, signal });
        const $ = cheerio.load(res.data);
        wpHttp2 = $('input[name="_wp_http2"]').val();
        const act = $("form").attr("action");
        if (act) formUrl = act.startsWith("http") ? act : new URL(act, formUrl).href;
      }
      if (!wpHttp2) return null;
      const fd2 = new URLSearchParams();
      fd2.append("_wp_http2", wpHttp2);
      const res2 = yield axios.post(formUrl, fd2.toString(), {
        headers: __spreadProps(__spreadValues({}, headers), {
          "Content-Type": "application/x-www-form-urlencoded",
          Referer: url
        }),
        signal
      });
      const html2 = typeof res2.data === "string" ? res2.data : "";
      const linkMatch = html2.match(/setAttribute\("href",\s*"(.*?)"/);
      if (!linkMatch) return null;
      const link = linkMatch[1];
      const cookie = link.split("=")[1];
      const res3 = yield axios.get(link, {
        headers: __spreadProps(__spreadValues({}, headers), {
          Referer: formUrl,
          Cookie: `${cookie}=${wpHttp2}`
        }),
        signal
      });
      const html3 = typeof res3.data === "string" ? res3.data : "";
      const refreshMatch = html3.match(/content=["']\d+;\s*url=(.*?)["']/i);
      if (refreshMatch) return refreshMatch[1];
      const replaceMatch = html3.match(/location\.replace\(["']([^"']+)["']\)/i);
      if (replaceMatch) return replaceMatch[1];
      return ((_b = (_a = res3.request) == null ? void 0 : _a.res) == null ? void 0 : _b.responseUrl) || link;
    } catch (e) {
      return null;
    }
  });
}
__name(bypassLegacyWpHttp, "bypassLegacyWpHttp");
function extractStreamsFromDriveseed(driveUrl, providerContext, signal) {
  return __async(this, null, function* () {
    var _a, _b;
    const { axios, cheerio, commonHeaders: headers } = providerContext;
    const streams = [];
    const addedUrls = /* @__PURE__ */ new Set();
    const addStream = /* @__PURE__ */ __name((server, link) => {
      if (link && link.startsWith("http") && !addedUrls.has(link)) {
        addedUrls.add(link);
        streams.push({ server, link, type: "mkv" });
      }
    }, "addStream");
    let fileUrl = driveUrl;
    if (driveUrl.includes("/r?")) {
      try {
        const rRes = yield axios.get(driveUrl, {
          headers: __spreadProps(__spreadValues({}, headers), { Referer: "https://en.thenaukriadda.in/" }),
          signal
        });
        const html = typeof rRes.data === "string" ? rRes.data : "";
        const pathMatch = html.match(/location\.replace\(["']([^"']+)["']\)/);
        if (pathMatch) {
          const p = pathMatch[1].replace(/\\/g, "");
          const origin = new URL(driveUrl).origin;
          fileUrl = p.startsWith("http") ? p : origin + p;
        }
      } catch (e) {
      }
    }
    try {
      const fileRes = yield axios.get(fileUrl, {
        headers: __spreadProps(__spreadValues({}, headers), { Referer: driveUrl }),
        signal
      });
      const fileHtml = typeof fileRes.data === "string" ? fileRes.data : "";
      const $file = cheerio.load(fileHtml);
      try {
        const zfileUrl = fileUrl.replace("/file/", "/zfile/");
        const zRes = yield axios.get(zfileUrl, {
          headers: __spreadProps(__spreadValues({}, headers), { Referer: fileUrl }),
          signal
        });
        const zHtml = typeof zRes.data === "string" ? zRes.data : "";
        const $z = cheerio.load(zHtml);
        $z("a").each((_, el) => {
          const href = $z(el).attr("href");
          if (href && (href.includes("workers.dev") || href.includes("r2.dev") || href.includes("drive.google.com") || /\.(mp4|mkv|m3u8)($|\?)/i.test(href))) {
            const serverName = href.includes("drive.google.com") ? "Google Drive" : "Resume Cloud (Fast)";
            addStream(serverName, href);
          }
        });
        $z("iframe, video, source").each((_, el) => {
          const src = $z(el).attr("src");
          if (src) {
            const match = src.match(/link=(https?:\/\/[^&"']+)/);
            if (match && match[1]) {
              addStream("Direct Stream", match[1]);
            }
          }
        });
      } catch (e) {
      }
      $file("a").each((_, el) => {
        const href = $file(el).attr("href");
        if (href && (href.includes("workers.dev") || href.includes("r2.dev") || href.includes("drive.google.com") || /\.(mp4|mkv|m3u8)($|\?)/i.test(href))) {
          const serverName = href.includes("drive.google.com") ? "Google Drive" : "Direct File Stream";
          addStream(serverName, href);
        }
      });
      try {
        const instantHref = $file(".btn-danger, a:contains('Instant Download')").attr("href");
        if (instantHref && instantHref.startsWith("http")) {
          let added = false;
          if (instantHref.includes("url=")) {
            const directPart = decodeURIComponent(instantHref.split("url=")[1]);
            if (directPart && directPart.startsWith("http")) {
              addStream("Instant Download", directPart);
              added = true;
            }
          }
          if (!added) {
            try {
              const vRes = yield axios.get(instantHref, {
                headers: __spreadProps(__spreadValues({}, headers), { Referer: fileUrl }),
                maxRedirects: 0,
                validateStatus: /* @__PURE__ */ __name((s) => s >= 200 && s < 400, "validateStatus"),
                signal
              });
              const loc = (_a = vRes.headers) == null ? void 0 : _a.location;
              if (loc) {
                let directGoogleUrl = null;
                if (loc.includes("url=")) {
                  directGoogleUrl = decodeURIComponent(loc.split("url=")[1]);
                } else if (loc.includes("googleusercontent.com") || loc.startsWith("http")) {
                  directGoogleUrl = loc;
                }
                if (directGoogleUrl && directGoogleUrl.startsWith("http")) {
                  addStream("Instant Download", directGoogleUrl);
                }
              } else if (typeof vRes.data === "string") {
                const upMatch = vRes.data.match(/window\.location\.href\s*=\s*["']([^"']+)["']/);
                if (upMatch) {
                  const upPath = upMatch[1];
                  const vOrigin = new URL(instantHref).origin;
                  const upUrl = upPath.startsWith("http") ? upPath : vOrigin + upPath;
                  const upRes = yield axios.get(upUrl, {
                    headers: __spreadProps(__spreadValues({}, headers), { Referer: instantHref }),
                    maxRedirects: 0,
                    validateStatus: /* @__PURE__ */ __name((s) => s >= 200 && s < 400, "validateStatus"),
                    signal
                  });
                  const loc2 = (_b = upRes.headers) == null ? void 0 : _b.location;
                  if (loc2 && loc2.startsWith("http")) {
                    addStream("Instant Download", loc2);
                  } else if (typeof upRes.data === "string") {
                    const $up = cheerio.load(upRes.data);
                    const dlBtn = $up("#downloadBtn, a.btn-danger, a.btn-success").attr("href");
                    if (dlBtn && dlBtn.startsWith("http")) {
                      addStream("Instant Download", dlBtn);
                    }
                  }
                }
              }
            } catch (e) {
            }
          }
        }
      } catch (e) {
      }
      for (const t of [1, 2]) {
        try {
          const wfileUrl = fileUrl.replace("/file/", "/wfile/") + `?type=${t}`;
          const wRes = yield axios.get(wfileUrl, {
            headers: __spreadProps(__spreadValues({}, headers), { Referer: fileUrl }),
            signal
          });
          const wHtml = typeof wRes.data === "string" ? wRes.data : "";
          const $w = cheerio.load(wHtml);
          $w(".btn-success, a.btn").each((i, el) => {
            const href = $w(el).attr("href");
            if (href) addStream(`Worker ${t}.${i + 1}`, href);
          });
        } catch (e) {
        }
      }
    } catch (e) {
    }
    if (streams.length === 0) {
      try {
        const gdStreams = yield gdflixExtractor(
          fileUrl,
          signal,
          axios,
          cheerio,
          headers,
          providerContext
        );
        if (Array.isArray(gdStreams)) {
          for (const s of gdStreams) {
            addStream(s.server || "GDFlix", s.link);
          }
        }
      } catch (e) {
      }
    }
    return streams;
  });
}
__name(extractStreamsFromDriveseed, "extractStreamsFromDriveseed");
exports.getStream = getStream;
// Annotate the CommonJS export names for ESM import in node:

