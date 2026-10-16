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

// providers/protonMovies/stream.ts
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

// providers/protonMovies/stream.ts
function LALLJLutmoZpvvbikjaWM(str) {
  var buf = new ArrayBuffer(str.length * 2);
  var bufView = new Uint8Array(buf);
  for (var i = 0, strLen = str.length; i < strLen; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return buf;
}
__name(LALLJLutmoZpvvbikjaWM, "LALLJLutmoZpvvbikjaWM");
function getOrCreateUID() {
  const uid = "uid_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
  return uid;
}
__name(getOrCreateUID, "getOrCreateUID");
var getStream = /* @__PURE__ */ __name(function(_0) {
  return __async(this, arguments, function* ({
    link,
    providerContext
  }) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    const { axios, cheerio, commonHeaders: headers } = providerContext;
    function generateMessageToken(baseUrlL) {
      const hostname = baseUrlL == null ? void 0 : baseUrlL.replace(/https?:\/\//, "").split("/")[0];
      console.log("generateMessageToken hostname", hostname);
      const NsmxUftCNibQ = `[hostname=${hostname}][agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36 Edg/137.0.0.0][tmz=India Standard Time][userTimezoneOffset=-330][{"url":"https://cdnjs.cloudflare.com/ajax/libs/jquery/3.6.4/jquery.min.js","type":"script","duration":253.30000000074506},{"url":"https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onloadTurnstileCallback","type":"script","duration":397.19999999925494},{"url":"https://adoto.net/cdn-cgi/scripts/5c5dd728/cloudflare-static/email-decode.min.js","type":"img","duration":225.90000000223517},{"url":"https://code.jquery.com/jquery-3.3.1.slim.min.js","type":"script","duration":65.30000000074506},{"url":"https://static.cloudflareinsights.com/beacon.min.js/vcd15cbe7772f49c399c6a5babf22c1241717689176015","type":"script","duration":225.89999999850988},{"url":"https://cdnjs.cloudflare.com/ajax/libs/jquery/3.6.4/jquery.min.js","type":"script","duration":253.30000000074506},{"url":"https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onloadTurnstileCallback","type":"script","duration":397.19999999925494},{"url":"https://adoto.net/cdn-cgi/scripts/5c5dd728/cloudflare-static/email-decode.min.js","type":"img","duration":225.90000000223517},{"url":"https://code.jquery.com/jquery-3.3.1.slim.min.js","type":"script","duration":65.30000000074506},{"url":"https://static.cloudflareinsights.com/beacon.min.js/vcd15cbe7772f49c399c6a5babf22c1241717689176015","type":"script","duration":225.89999999850988},{"url":"https://challenges.cloudflare.com/cdn-cgi/challenge-platform/h/b/turnstile/if/ov2/av0/rcv/b3dhg/0x4AAAAAAAQDru7r64xT2ifD/auto/fbE/new/normal/auto/","type":"iframe","duration":2050.300000000745},{"url":"https://new19.gdtot.dad/favicon.ico","type":"img","duration":1003.6999999992549},{"url":"https://vikingfile.com/assets/favicon-64375c377b5df8304acbdad4f4430694.ico","type":"img","duration":183.19999999925494},{"url":"https://gofile.io/dist/img/favicon32.png","type":"img","duration":19177.199999999255},{"url":"https://pub.clickadu.com/assets/scripts/supported-browsers.js","type":"fetch","duration":18.799999997019768},{"url":"https://challenges.cloudflare.com/cdn-cgi/challenge-platform/h/b/turnstile/if/ov2/av0/rcv/b3dhg/0x4AAAAAAAQDru7r64xT2ifD/auto/fbE/auto_expire/normal/auto/","type":"iframe","duration":1612.5999999977648},{"url":"https://challenges.cloudflare.com/cdn-cgi/challenge-platform/h/b/turnstile/if/ov2/av0/rcv/b3dhg/0x4AAAAAAAQDru7r64xT2ifD/auto/fbE/auto_expire/normal/auto/","type":"iframe","duration":1154.0999999977648},{"url":"https://cdnjs.cloudflare.com/ajax/libs/jquery/3.6.4/jquery.min.js","type":"script","duration":253.30000000074506},{"url":"https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onloadTurnstileCallback","type":"script","duration":397.19999999925494},{"url":"https://adoto.net/cdn-cgi/scripts/5c5dd728/cloudflare-static/email-decode.min.js","type":"img","duration":225.90000000223517},{"url":"https://code.jquery.com/jquery-3.3.1.slim.min.js","type":"script","duration":65.30000000074506},{"url":"https://static.cloudflareinsights.com/beacon.min.js/vcd15cbe7772f49c399c6a5babf22c1241717689176015","type":"script","duration":225.89999999850988},{"url":"https://challenges.cloudflare.com/cdn-cgi/challenge-platform/h/b/turnstile/if/ov2/av0/rcv/b3dhg/0x4AAAAAAAQDru7r64xT2ifD/auto/fbE/new/normal/auto/","type":"iframe","duration":2050.300000000745},{"url":"https://new19.gdtot.dad/favicon.ico","type":"img","duration":1003.6999999992549},{"url":"https://vikingfile.com/assets/favicon-64375c377b5df8304acbdad4f4430694.ico","type":"img","duration":183.19999999925494},{"url":"https://gofile.io/dist/img/favicon32.png","type":"img","duration":19177.199999999255},{"url":"https://pub.clickadu.com/assets/scripts/supported-browsers.js","type":"fetch","duration":18.799999997019768},{"url":"https://challenges.cloudflare.com/cdn-cgi/challenge-platform/h/b/turnstile/if/ov2/av0/rcv/b3dhg/0x4AAAAAAAQDru7r64xT2ifD/auto/fbE/auto_expire/normal/auto/","type":"iframe","duration":1612.5999999977648},{"url":"https://challenges.cloudflare.com/cdn-cgi/challenge-platform/h/b/turnstile/if/ov2/av0/rcv/b3dhg/0x4AAAAAAAQDru7r64xT2ifD/auto/fbE/auto_expire/normal/auto/","type":"iframe","duration":1154.0999999977648},{"url":"https://challenges.cloudflare.com/cdn-cgi/challenge-platform/h/b/turnstile/if/ov2/av0/rcv/b3dhg/0x4AAAAAAAQDru7r64xT2ifD/auto/fbE/auto_expire/normal/auto/","type":"iframe","duration":986}][{"elements":{"div":70,"span":68,"img":4,"iframe":0,"script":28,"link":20,"p":5,"a":213,"ul":28,"li":208,"button":9,"input":5},"hidden":{"div":13,"span":60,"img":1,"iframe":0,"script":28,"link":20,"p":0,"a":186,"ul":22,"li":184,"button":6,"input":2},"errors":{"network":0,"js":0},"eventListeners":0}]`;
      var jRpeP = LALLJLutmoZpvvbikjaWM(NsmxUftCNibQ);
      var jzKEwqEAcWFMNwHZnCCqJQ = new Uint8Array(jRpeP);
      var kyMXQUxoFYuZIBlKvlHa = jzKEwqEAcWFMNwHZnCCqJQ.toString();
      var kyMXQUxoFYuZIBlKvlHa = kyMXQUxoFYuZIBlKvlHa.replace(/2/g, "004");
      var kyMXQUxoFYuZIBlKvlHa = kyMXQUxoFYuZIBlKvlHa.replace(/3/g, "005");
      var kyMXQUxoFYuZIBlKvlHa = kyMXQUxoFYuZIBlKvlHa.replace(/7/g, "007");
      var kyMXQUxoFYuZIBlKvlHa = kyMXQUxoFYuZIBlKvlHa.replace(/,0,0,0/g, "");
      return kyMXQUxoFYuZIBlKvlHa;
    }
    __name(generateMessageToken, "generateMessageToken");
    function decodeHtml(encodedArray) {
      const joined = encodedArray.join("");
      const unescaped = joined.replace(/\\"/g, '"').replace(/\\'/g, "'");
      const cleaned = unescaped.replace(/\\n/g, "\n").replace(/\\t/g, "	").replace(/\\r/g, "\r");
      const decoded = cleaned.replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
      return decoded;
    }
    __name(decodeHtml, "decodeHtml");
    try {
      const streamLinks = [];
      const res = yield axios.get(link, { headers });
      const data = res.data;
      const $$ = cheerio.load(data);
      const htmlArray = (_e = (_d = (_c = (_b = (_a = $$('script:contains("decodeURIComponent")').text().split(" = ")) == null ? void 0 : _a[1]) == null ? void 0 : _b.split("protomovies")) == null ? void 0 : _c[0]) == null ? void 0 : _d.trim()) == null ? void 0 : _e.slice(0, -1);
      const html = decodeHtml(JSON.parse(htmlArray));
      const $ = cheerio.load(html);
      const idList = [];
      const id1080 = (_f = $('tr:contains("1080p")').find('button:contains("Info")').attr("id")) == null ? void 0 : _f.split("-")[1];
      if (id1080) {
        idList.push({
          id: id1080,
          quality: "1080p"
        });
      }
      const id720 = (_g = $('tr:contains("720p")').find('button:contains("Info")').attr("id")) == null ? void 0 : _g.split("-")[1];
      if (id720) {
        idList.push({
          id: id720,
          quality: "720p"
        });
      }
      const id480 = (_h = $('tr:contains("480p")').find('button:contains("Info")').attr("id")) == null ? void 0 : _h.split("-")[1];
      if (id480) {
        idList.push({
          id: id480,
          quality: "480p"
        });
      }
      const baseUrl = link.split("/").slice(0, 3).join("/");
      const secondIdList = [];
      yield Promise.all(
        idList.slice(0, 2).map((id) => __async(null, null, function* () {
          const formData = new URLSearchParams();
          formData.append("downloadid", id.id);
          formData.append("token", "ok");
          const messageToken = generateMessageToken(baseUrl);
          const uid = getOrCreateUID();
          const idRes = yield fetch(`${baseUrl}/ppd.php`, {
            headers: {
              accept: "*/*",
              "accept-language": "en-US,en;q=0.9,en-IN;q=0.8",
              "cache-control": "no-cache",
              "content-type": "application/x-www-form-urlencoded",
              pragma: "no-cache",
              priority: "u=1, i",
              "sec-ch-ua": '"Chromium";v="136", "Microsoft Edge";v="136", "Not.A/Brand";v="99"',
              "sec-ch-ua-mobile": "?0",
              "sec-ch-ua-platform": '"Windows"',
              "sec-fetch-dest": "empty",
              "sec-fetch-mode": "cors",
              "sec-fetch-site": "same-origin",
              cookie: "ext_name=ojplmecpdpgccookcobabopnaifgidhf; tgInvite222=true; cf_clearance=3ynJv2B6lHMj3FCOqtfQaL7lTN4KC3xmPRMgcNtddAc-1748787867-1.2.1.1-SEIhLbWR3ehfib5Y3P5pjzj1Qu9wipc52Icv4AmNkztXn2pTXhjKgxXnvTuA2bNscgHuc1juXujAHteqY_vaMmy2C3djMWnJGzjje_XvXZXKht8rwHZt6sviq7KAYvrYZPTrATqENuopzmqmK6dDFS.CAnWHt0VDn8q06iLm5rYj1AXUo3qkV5p1Idx_25elWHYGG8yengBrQV1MYVM9LMdQqv44PXu69FZvNkgv.d6blCKyneJnoLkw4LHAccu.QRPbFwWqqTDyO9YTLRQW9w29bKghD3_JVxkz.qxpg5FbocJ3i6tJJy74SvROpYdpVUOn0fW1YgQ7RxYwhNoHpdTKy8pvmQJGRuSVW1GjO_k",
              Referer: "https://m3.protonmovies.top/download/",
              "Referrer-Policy": "strict-origin-when-cross-origin"
            },
            body: `downloadid=${id.id}&msg=${messageToken}&uid=${uid}&token=ok`,
            method: "POST"
          });
          const idData = yield idRes.text();
          secondIdList.push({
            quality: id.quality,
            id: idData
          });
          console.log("idData", idData);
        }))
      );
      yield Promise.all(
        secondIdList.map((id) => __async(null, null, function* () {
          const idRes = yield axios.post(`${baseUrl}/tmp/${id.id}`);
          if (idRes.data.ppd["gofile.io"]) {
            const goRes = yield gofileExtractor(
              idRes.data.ppd["gofile.io"].link.split("/").pop(),
              axios,
              providerContext
            );
            console.log("link", goRes.link);
            if (goRes.link) {
              streamLinks.push({
                link: goRes.link,
                server: "gofile " + id.quality,
                type: "mkv",
                headers: {
                  referer: "https://gofile.io",
                  connection: "keep-alive",
                  contentType: "video/x-matroska",
                  cookie: "accountToken=" + goRes.token
                }
              });
            }
          }
        }))
      );
      return streamLinks;
    } catch (e) {
      console.log("proton get stream err", e);
      return [];
    }
  });
}, "getStream");
exports.getStream = getStream;
// Annotate the CommonJS export names for ESM import in node:

