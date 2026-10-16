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

// providers/mkvDrama/stream.ts
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
function hubcloudExtractor(link, signal, axios, cheerio, headers, providerContext, isDownload, providerValue2) {
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
        const specificKey = providerValue2 ? `${providerValue2}_preferredDownloadServer` : "";
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

// providers/getBaseUrl.ts
var urlsEndpoint = "https://raw.githubusercontent.com/Zenda-Cross/vega-providers/refs/heads/main/urls.json";
var cacheTtl = 60 * 60 * 1e3;
function getCache() {
  var _a;
  const state = typeof providerGlobal !== "undefined" && providerGlobal ? providerGlobal : globalThis;
  (_a = state.__vegaProviderBaseUrlCache__) != null ? _a : state.__vegaProviderBaseUrlCache__ = { expiresAt: 0 };
  return state.__vegaProviderBaseUrlCache__;
}
__name(getCache, "getCache");
function fetchProviderUrls() {
  return __async(this, null, function* () {
    const cache = getCache();
    if (cache.data && Date.now() < cache.expiresAt) {
      return cache.data;
    }
    if (cache.request) {
      return cache.request;
    }
    const request = fetch(urlsEndpoint).then((response) => __async(null, null, function* () {
      if (!response.ok) {
        throw new Error(`URL configuration request failed: ${response.status}`);
      }
      const data = yield response.json();
      console.log("Fetched provider URL configuration");
      cache.data = data;
      cache.expiresAt = Date.now() + cacheTtl;
      return data;
    })).catch((error) => {
      if (cache.data) {
        console.warn("Using stale provider URL configuration", error);
        return cache.data;
      }
      throw error;
    }).finally(() => {
      cache.request = void 0;
    });
    Object.defineProperty(cache, "request", {
      configurable: true,
      enumerable: false,
      value: request,
      writable: true
    });
    return request;
  });
}
__name(fetchProviderUrls, "fetchProviderUrls");
var getBaseUrl = /* @__PURE__ */ __name((providerValue2) => __async(null, null, function* () {
  var _a, _b;
  try {
    const providerUrls = yield fetchProviderUrls();
    return (_b = (_a = providerUrls[providerValue2]) == null ? void 0 : _a.url) != null ? _b : "";
  } catch (error) {
    console.error(`Error fetching baseUrl: ${providerValue2}`, error);
    throw error;
  }
}), "getBaseUrl");

// providers/mkvDrama/request.ts
var providerValue = "mkvDrama";
var mkvDramaHeaders = {
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  "Cache-Control": "max-age=0",
  Priority: "u=0, i",
  "Sec-CH-UA": '"Not;A=Brand";v="8", "Chromium";v="150", "Brave";v="150"',
  "Sec-CH-UA-Arch": '"x86"',
  "Sec-CH-UA-Bitness": '"64"',
  "Sec-CH-UA-Mobile": "?0",
  "Sec-CH-UA-Model": '""',
  "Sec-CH-UA-Platform": '"Windows"',
  "Sec-CH-UA-Platform-Version": '"19.0.0"',
  "Sec-Fetch-Dest": "document",
  "Sec-Fetch-Mode": "navigate",
  "Sec-Fetch-Site": "same-origin",
  "Sec-Fetch-User": "?1",
  "Sec-GPC": "1",
  "Upgrade-Insecure-Requests": "1",
  cookie: "ext_name=ojplmecpdpgccookcobabopnaifgidhf; _did=L-1Od04LpLDvj-KnwUZUCQ; LkpgcDuljxiVttMcsesion=eyJmZV9jc3JmX3Rva2VuIjogInpQZGROclRDenZqcXE4V1UzcEhGaUhkTkEwRG1tUE1ndDQ1SktEZHc3emMiLCAiZmVfY3NyZl90b2tlbl9jcmVhdGVkX2F0IjogIjIwMjYtMDctMjVUMDg6MjQ6MjMuNDI4ODcxKzAwOjAwIn0=.amRytw.EU34Y5Oet2q7RoiPiLmITOgD2lM; cf_clearance=w5GY0s9FeC3XEEvbulOW4KEhXq_S5Gf3tAy9Ld.hUrE-1784969771-1.2.1.1-8k59IPqk0ZcVP5GGxMMnD8VmX2.iasFQtuGTnUN57_tmdEHkdSzNjkcwTO5VajEgGTS6U4vHH2E0JXtZYnPFBPJGexxW4A6TdI2pIgpu_xmQ7b.ljrp8gv_bzti5ivuya3uM6ZH8t1TS5s8VYbZBKNSkZIilQLW7.36rnbc7BtBGV1FJibBQPe9U.7.St7Z5AIsCJTtGhrep8XukM_AET3dy4GyWSNk1fZMtF6rWzg0mKLl8khIL4eDXHaXbKhlmkCZtUry1DTyhCIs3P3LkzIU4DlEejA7qhYi8iehi0MaSlZwWjwbLwLgw2OMmmssShMy6Gr5aWcZnDsCPindcbOEx53ZlsZLTLmm_NTkcOQx6sByo84V4OH9ySfRC2fPpWBP3_iiIfV2Rwt4d8a.qkn54YeVGUMTxqDRLZtBi_uvWjtnditxtUv2cKREuggUztX0Yeq04mrcM0iL1fy5c5g",
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36"
};
function mergeMkvDramaCookies(current, setCookie) {
  const cookies = /* @__PURE__ */ new Map();
  current.split(";").map((part) => part.trim()).filter(Boolean).forEach((part) => cookies.set(part.split("=", 1)[0], part));
  const values = Array.isArray(setCookie) ? setCookie : [setCookie];
  values.filter(Boolean).forEach((value) => {
    const cookie = String(value).split(";", 1)[0];
    cookies.set(cookie.split("=", 1)[0], cookie);
  });
  return [...cookies.values()].join("; ");
}
__name(mergeMkvDramaCookies, "mergeMkvDramaCookies");
function getMkvDramaUrl(path) {
  return __async(this, null, function* () {
    const baseUrl = yield getBaseUrl(providerValue);
    const url = new URL(path, `${baseUrl}/`);
    if (url.hostname !== new URL(baseUrl).hostname) {
      throw new Error(`Refusing non-MKVDrama WAF request: ${url.hostname}`);
    }
    return url.href;
  });
}
__name(getMkvDramaUrl, "getMkvDramaUrl");
function getMkvDramaPage(path, providerContext) {
  return __async(this, null, function* () {
    var _a, _b;
    const url = yield getMkvDramaUrl(path);
    const baseUrl = new URL(url).origin;
    const headers = __spreadProps(__spreadValues({}, mkvDramaHeaders), {
      Referer: baseUrl
    });
    let forbiddenError;
    try {
      const response = yield providerContext.axios.get(url, { headers });
      return {
        data: response.data || "",
        url,
        cookies: mergeMkvDramaCookies(
          mkvDramaHeaders.cookie || "",
          (_a = response.headers) == null ? void 0 : _a["set-cookie"]
        )
      };
    } catch (error) {
      if (((_b = error.response) == null ? void 0 : _b.status) !== 403) throw error;
      forbiddenError = error;
    }
    if (typeof providerContext.openWebView !== "function") throw forbiddenError;
    const wafResult = yield providerContext.openWebView(url, {
      title: "Open MKVDrama",
      description: "Complete the security check, wait for download links to load, then click done.",
      headers,
      waitForCookie: "cf_clearance",
      force: true,
      timeoutMs: 12e4
    });
    return {
      data: wafResult.data || "",
      url: wafResult.url || url,
      cookies: wafResult.cookies,
      userAgent: wafResult.userAgent
    };
  });
}
__name(getMkvDramaPage, "getMkvDramaPage");

// providers/mkvDrama/loader.ts
var cryptoApiUrl = "https://worker.zendax.me/api/crypto";
function parseBootstrapResponse(value) {
  const queue = [value];
  const seen = /* @__PURE__ */ new Set();
  while (queue.length && seen.size < 20) {
    const current = queue.shift();
    if (current === void 0 || current === null || seen.has(current))
      continue;
    seen.add(current);
    if (typeof current === "string") {
      try {
        queue.push(JSON.parse(current.replace(/^\uFEFF/, "").trim()));
      } catch (e) {
        continue;
      }
      continue;
    }
    if (current instanceof ArrayBuffer || ArrayBuffer.isView(current)) {
      const bytes = current instanceof ArrayBuffer ? new Uint8Array(current) : new Uint8Array(
        current.buffer,
        current.byteOffset,
        current.byteLength
      );
      queue.push(Buffer.from(bytes).toString("utf8"));
      continue;
    }
    if (Array.isArray(current)) {
      if (current.every((item) => Number.isInteger(item))) {
        queue.push(Buffer.from(current).toString("utf8"));
      } else {
        queue.push(...current);
      }
      continue;
    }
    if (typeof current !== "object") continue;
    const response = current;
    const gatePath = response.gate_path || response.gatePath;
    const passPath = response.pass_path || response.passPath;
    const decryptionKey = response.dec_key || response.decKey;
    if (gatePath && passPath && decryptionKey) {
      return {
        gate_path: String(gatePath),
        pass_path: String(passPath),
        dec_key: String(decryptionKey)
      };
    }
    if (response.type === "Buffer" && Array.isArray(response.data)) {
      queue.push(response.data);
      continue;
    }
    ["data", "body", "result", "payload", "content", "response"].forEach(
      (key) => {
        if (response[key] !== void 0) queue.push(response[key]);
      }
    );
  }
  const shape = value && typeof value === "object" ? Object.keys(value).slice(0, 8).join(",") : typeof value;
  throw new Error(`MKVDrama loader bootstrap is invalid (${shape || "empty"})`);
}
__name(parseBootstrapResponse, "parseBootstrapResponse");
function readCookie(cookies, name) {
  var _a;
  const prefix = `${name}=`;
  return ((_a = cookies.split(";").map((part) => part.trim()).find((part) => part.startsWith(prefix))) == null ? void 0 : _a.slice(prefix.length)) || "";
}
__name(readCookie, "readCookie");
function decryptAesGcm(payload, key, keyEncoding, providerContext) {
  return __async(this, null, function* () {
    var _a;
    if (!payload.d || !payload.s) {
      throw new Error("MKVDrama encrypted payload is invalid");
    }
    const encrypted = Buffer.from(payload.d, "base64");
    if (encrypted.length <= 16) {
      throw new Error("MKVDrama encrypted payload is too short");
    }
    const response = yield providerContext.axios.post(cryptoApiUrl, {
      operation: "decrypt",
      algorithm: "aes-256-gcm",
      data: encrypted.subarray(0, -16).toString("base64"),
      authTag: encrypted.subarray(-16).toString("base64"),
      key,
      iv: payload.s,
      inputEncoding: "base64",
      authTagEncoding: "base64",
      keyEncoding,
      ivEncoding: "hex",
      outputEncoding: "utf8"
    });
    if (typeof ((_a = response.data) == null ? void 0 : _a.result) !== "string") {
      throw new Error("MKVDrama crypto worker returned an invalid response");
    }
    return response.data.result;
  });
}
__name(decryptAesGcm, "decryptAesGcm");
function decryptDynamicField(cookies, decryptionKey, providerContext) {
  return __async(this, null, function* () {
    const encoded = readCookie(cookies, "_akx");
    if (!encoded) throw new Error("MKVDrama _akx cookie was not found");
    let payload;
    try {
      payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
    } catch (e) {
      throw new Error("MKVDrama _akx cookie is invalid");
    }
    const field = JSON.parse(
      yield decryptAesGcm(payload, decryptionKey, "hex", providerContext)
    );
    if (!field.n || !field.v) {
      throw new Error("MKVDrama dynamic request field is invalid");
    }
    return field;
  });
}
__name(decryptDynamicField, "decryptDynamicField");
function derivePayloadKey(gateUrl, providerContext) {
  return __async(this, null, function* () {
    var _a;
    const response = yield providerContext.axios.post(cryptoApiUrl, {
      operation: "hash",
      algorithm: "sha256",
      data: `access-pass${new URL(gateUrl).pathname}`,
      outputEncoding: "base64"
    });
    if (typeof ((_a = response.data) == null ? void 0 : _a.result) !== "string") {
      throw new Error("MKVDrama crypto worker returned an invalid hash");
    }
    return response.data.result;
  });
}
__name(derivePayloadKey, "derivePayloadKey");
function requestHeaders(pageUrl, cookies) {
  return __spreadProps(__spreadValues({}, mkvDramaHeaders), {
    Accept: "application/json",
    "Content-Type": "application/json",
    Cookie: cookies,
    Origin: new URL(pageUrl).origin,
    Referer: pageUrl,
    "Sec-Fetch-Dest": "empty",
    "Sec-Fetch-Mode": "cors"
  });
}
__name(requestHeaders, "requestHeaders");
function postJson(url, body, pageUrl, cookies, providerContext) {
  return __async(this, null, function* () {
    var _a;
    const response = yield providerContext.axios.post(url, body, {
      headers: requestHeaders(pageUrl, cookies)
    });
    return {
      data: response.data,
      cookies: mergeMkvDramaCookies(cookies, (_a = response.headers) == null ? void 0 : _a["set-cookie"])
    };
  });
}
__name(postJson, "postJson");
function loadVerifiedPage(page, cookies, providerContext) {
  return __async(this, null, function* () {
    if (typeof providerContext.openWebView !== "function") {
      throw new Error("MKVDrama verification is required to load download links");
    }
    const result = yield providerContext.openWebView(page.url, {
      title: "Open MKVDrama",
      description: "Complete the verification and wait for download links to load, then click done.",
      headers: __spreadProps(__spreadValues({}, mkvDramaHeaders), {
        Cookie: cookies,
        Referer: page.url
      }),
      waitForCookie: "cf_clearance",
      force: true,
      timeoutMs: 12e4
    });
    const data = result.data || "";
    if (!providerContext.cheerio.load(data)(".soraddlx").length) {
      throw new Error(
        "MKVDrama verification completed before download links were loaded"
      );
    }
    return {
      data,
      url: result.url || page.url,
      cookies: result.cookies || cookies,
      userAgent: result.userAgent
    };
  });
}
__name(loadVerifiedPage, "loadVerifiedPage");
function loadMkvDramaEpisodeHtml(page, providerContext) {
  return __async(this, null, function* () {
    var _a, _b, _c;
    const $ = providerContext.cheerio.load(page.data);
    if ($(".soraddlx").length || !$("#mlx-ph").length) return page;
    let cookies = page.cookies || mkvDramaHeaders.cookie || "";
    const bootstrapUrl = new URL(
      `${new URL(page.url).pathname.replace(/\/+$/, "")}/_vb3k_mnxr_w`,
      page.url
    ).href;
    let bootstrapResponse;
    try {
      bootstrapResponse = yield providerContext.axios.post(bootstrapUrl, null, {
        headers: requestHeaders(page.url, cookies)
      });
    } catch (error) {
      if (((_a = error.response) == null ? void 0 : _a.status) !== 403) throw error;
      return loadVerifiedPage(page, cookies, providerContext);
    }
    cookies = mergeMkvDramaCookies(
      cookies,
      (_b = bootstrapResponse.headers) == null ? void 0 : _b["set-cookie"]
    );
    const bootstrap = parseBootstrapResponse(bootstrapResponse.data);
    const dynamicField = yield decryptDynamicField(
      cookies,
      bootstrap.dec_key,
      providerContext
    );
    const dynamicValue = { [dynamicField.n]: dynamicField.v };
    const gateUrl = new URL(bootstrap.gate_path, page.url).href;
    let gateResponse;
    try {
      gateResponse = yield postJson(
        gateUrl,
        __spreadValues({ r: null, i: false, w: false }, dynamicValue),
        page.url,
        cookies,
        providerContext
      );
    } catch (error) {
      if (((_c = error.response) == null ? void 0 : _c.status) !== 403) throw error;
      return loadVerifiedPage(page, cookies, providerContext);
    }
    cookies = gateResponse.cookies;
    const passUrl = new URL(bootstrap.pass_path, page.url).href;
    const passResponse = yield postJson(
      passUrl,
      __spreadValues({ r: null, w: false }, dynamicValue),
      page.url,
      cookies,
      providerContext
    );
    cookies = passResponse.cookies;
    const payloadKey = yield derivePayloadKey(gateUrl, providerContext);
    const html = yield decryptAesGcm(
      passResponse.data || {},
      payloadKey,
      "base64",
      providerContext
    );
    return __spreadProps(__spreadValues({}, page), { data: html, cookies });
  });
}
__name(loadMkvDramaEpisodeHtml, "loadMkvDramaEpisodeHtml");

// providers/mkvDrama/links.ts
function normalizeLink1(href, pageUrl) {
  const absolute = new URL(href, pageUrl).href;
  const duplicateIndex = absolute.indexOf("https://", 8);
  return duplicateIndex === -1 ? absolute : absolute.slice(0, duplicateIndex);
}
__name(normalizeLink1, "normalizeLink1");
function findLink1Sources(page, providerContext) {
  const $ = providerContext.cheerio.load(page.data);
  const sources = [];
  $(".soraddlx").each((_, groupElement) => {
    const group = $(groupElement);
    const episodeTitle = group.find(".sorattlx h3").first().text().replace(/\s+/g, " ").trim();
    group.find(".soraurlx").each((_2, rowElement) => {
      const row = $(rowElement);
      const quality = row.find("strong").first().text().replace(/\s+/g, " ").trim();
      const anchor = row.find("a[href]").filter((_3, element) => /^link\s*1$/i.test($(element).text().trim())).first();
      const href = anchor.attr("href") || "";
      if (!href) return;
      sources.push({
        title: [episodeTitle, quality].filter(Boolean).join(" - ") || "Link 1",
        link: normalizeLink1(href, page.url)
      });
    });
  });
  return sources;
}
__name(findLink1Sources, "findLink1Sources");
function followRedirects(url, providerContext, initialCookies = "", referer = "") {
  return __async(this, null, function* () {
    var _a, _b;
    let currentUrl = url;
    let cookies = initialCookies;
    for (let index = 0; index < 8; index += 1) {
      const response = yield providerContext.axios.get(currentUrl, {
        headers: __spreadValues(__spreadValues(__spreadValues({}, mkvDramaHeaders), cookies ? { Cookie: cookies } : {}), referer ? { Referer: referer } : {}),
        maxRedirects: 0,
        validateStatus: /* @__PURE__ */ __name((status) => status >= 200 && status < 400, "validateStatus")
      });
      cookies = mergeMkvDramaCookies(cookies, (_a = response.headers) == null ? void 0 : _a["set-cookie"]);
      const location = (_b = response.headers) == null ? void 0 : _b.location;
      if (!location) {
        return { data: response.data || "", url: currentUrl, cookies };
      }
      referer = currentUrl;
      const nextUrl = new URL(location, currentUrl).href;
      if (new URL(nextUrl).hostname !== new URL(currentUrl).hostname)
        cookies = "";
      currentUrl = nextUrl;
    }
    throw new Error("MKVDrama redirect chain exceeded the limit");
  });
}
__name(followRedirects, "followRedirects");
function submitOuoForm(page, providerContext) {
  return __async(this, null, function* () {
    var _a, _b;
    const $ = providerContext.cheerio.load(page.data);
    const token = $('input[name="_token"]').attr("value") || "";
    const form = $('form:has(input[name="_token"])').first();
    const action = form.attr("action") || "";
    if (!token || !action) throw new Error("OUO token form was not found");
    const formUrl = new URL(action, page.url).href;
    const response = yield providerContext.axios.post(
      formUrl,
      new URLSearchParams({ _token: token, "x-token": "" }).toString(),
      {
        headers: __spreadProps(__spreadValues({}, mkvDramaHeaders), {
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
          "Content-Type": "application/x-www-form-urlencoded",
          Cookie: page.cookies,
          Origin: new URL(formUrl).origin,
          Referer: page.url
        }),
        maxRedirects: 0,
        validateStatus: /* @__PURE__ */ __name((status) => status >= 200 && status < 400, "validateStatus")
      }
    );
    const cookies = mergeMkvDramaCookies(
      page.cookies,
      (_a = response.headers) == null ? void 0 : _a["set-cookie"]
    );
    const location = (_b = response.headers) == null ? void 0 : _b.location;
    if (!location) return { data: response.data || "", url: formUrl, cookies };
    const destination = new URL(location, formUrl).href;
    return followRedirects(
      destination,
      providerContext,
      new URL(destination).hostname === new URL(formUrl).hostname ? cookies : "",
      formUrl
    );
  });
}
__name(submitOuoForm, "submitOuoForm");
function nearestTitle($, anchor, server) {
  const ownText = anchor.text().replace(/\s+/g, " ").trim();
  const sectionHeading = anchor.closest("section, article, tr, li, .card, .list-group-item").find("h1, h2, h3, h4, h5, h6, strong").first().text().replace(/\s+/g, " ").trim();
  const rowHeading = anchor.closest(".row, div").prevAll("h1, h2, h3, h4, h5, h6, strong").first().text().replace(/\s+/g, " ").trim();
  const containerText = anchor.closest("tr, li, article, .card, .list-group-item, .row").text().replace(/\s+/g, " ").trim();
  const heading = anchor.prevAll("h1, h2, h3, h4, h5, h6, strong").first().text().replace(/\s+/g, " ").trim();
  const title = sectionHeading || rowHeading || heading || containerText;
  return title ? `${title} - ${server}` : ownText || server;
}
__name(nearestTitle, "nearestTitle");
function getViewCrateLinks(page, providerContext) {
  return __async(this, null, function* () {
    const episodePage = yield loadMkvDramaEpisodeHtml(page, providerContext);
    const sources = findLink1Sources(episodePage, providerContext);
    if (!sources.length) throw new Error("MKVDrama Link1 was not found");
    const links = [];
    const seen = /* @__PURE__ */ new Set();
    for (const source of sources) {
      const ouoPage = yield followRedirects(
        source.link,
        providerContext,
        episodePage.cookies,
        episodePage.url
      );
      const viewCratePage = /ouo\.(?:io|press)$/i.test(
        new URL(ouoPage.url).hostname
      ) ? yield submitOuoForm(ouoPage, providerContext) : ouoPage;
      if (!/viewcrate\./i.test(new URL(viewCratePage.url).hostname)) {
        throw new Error(
          `OUO did not redirect to ViewCrate: ${viewCratePage.url}`
        );
      }
      const $ = providerContext.cheerio.load(viewCratePage.data);
      $("a[href]").each((_, element) => {
        const anchor = $(element);
        const href = anchor.attr("href") || "";
        const absolute = new URL(href, viewCratePage.url).href;
        const key = `${source.title}:${absolute}`;
        if (!/(?:pixeldrain\.|gofile\.io)/i.test(absolute) || seen.has(key)) {
          return;
        }
        seen.add(key);
        const server = /gofile\.io/i.test(absolute) ? "GoFile" : "PixelDrain";
        const viewCrateTitle = nearestTitle($, anchor, server);
        links.push({
          title: `${source.title} - ${viewCrateTitle}`,
          link: absolute
        });
      });
    }
    return links;
  });
}
__name(getViewCrateLinks, "getViewCrateLinks");

// providers/mkvDrama/stream.ts
function directStream(link, referer) {
  var _a;
  const extension = (_a = new URL(link).pathname.split(".").pop()) == null ? void 0 : _a.toLowerCase();
  if (!extension || !["mp4", "m3u8", "mpd"].includes(extension)) return [];
  return [
    {
      server: new URL(link).hostname,
      link,
      type: extension === "m3u8" ? "m3u8" : extension === "mpd" ? "mpd" : "mp4",
      headers: { Referer: referer }
    }
  ];
}
__name(directStream, "directStream");
function pixelDrainStream(link) {
  const url = new URL(link);
  const parts = url.pathname.split("/").filter(Boolean);
  const id = parts[0] === "u" || parts[0] === "l" ? parts[1] : parts[parts.length - 1];
  if (!id) return [];
  return [
    {
      server: "PixelDrain",
      link: `https://pixeldrain.com/api/file/${id}`,
      type: "mkv"
    }
  ];
}
__name(pixelDrainStream, "pixelDrainStream");
function getStream(_0) {
  return __async(this, arguments, function* ({
    link,
    type,
    signal,
    providerContext,
    isDownload
  }) {
    var _a;
    const baseUrl = yield getMkvDramaUrl("/");
    let target = link;
    if (new URL(link, baseUrl).hostname.endsWith("mkvdrama.net")) {
      const page = yield getMkvDramaPage(link, providerContext);
      target = ((_a = (yield getViewCrateLinks(page, providerContext))[0]) == null ? void 0 : _a.link) || "";
      if (!target) return [];
    }
    const direct = directStream(target, baseUrl);
    if (direct.length) return direct;
    const hostname = new URL(target).hostname.toLowerCase();
    const { axios, cheerio, commonHeaders } = providerContext;
    const headers = __spreadProps(__spreadValues(__spreadValues({}, commonHeaders), mkvDramaHeaders), { Referer: baseUrl });
    if (/pixeldrain\./.test(hostname)) return pixelDrainStream(target);
    if (/gofile\.io/.test(hostname)) {
      const id = new URL(target).pathname.split("/").filter(Boolean).pop();
      if (!id) return [];
      const result = yield gofileExtractor(id, axios, providerContext);
      if (!(result == null ? void 0 : result.link) || !(result == null ? void 0 : result.token)) return [];
      return [
        {
          server: "GoFile",
          link: result.link,
          type: "mkv",
          headers: {
            Referer: "https://gofile.io/",
            Cookie: `accountToken=${result.token}`
          }
        }
      ];
    }
    if (/gdflix|gdlink|new1\.filesdl/.test(hostname)) {
      return gdflixExtractor(
        target,
        signal,
        axios,
        cheerio,
        headers,
        providerContext
      );
    }
    if (/hubcloud|hubdrive|vcloud|cloud/.test(hostname)) {
      return hubcloudExtractor(
        target,
        signal,
        axios,
        cheerio,
        headers,
        providerContext,
        isDownload,
        "mkvDrama"
      );
    }
    return [
      {
        server: hostname,
        link: target,
        type: "mp4",
        headers: { Referer: baseUrl }
      }
    ];
  });
}
__name(getStream, "getStream");
exports.getStream = getStream;
// Annotate the CommonJS export names for ESM import in node:

