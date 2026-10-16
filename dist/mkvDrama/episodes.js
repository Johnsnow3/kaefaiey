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

// providers/mkvDrama/episodes.ts
var episodes_exports = {};
__export(episodes_exports, {
  getEpisodes: () => getEpisodes
});


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

// providers/mkvDrama/episodes.ts
function episodeNumber(text) {
  var _a;
  return Number(((_a = text.match(/(?:episode|ep)\s*(\d+)/i)) == null ? void 0 : _a[1]) || 0);
}
__name(episodeNumber, "episodeNumber");
function getEpisodes(_0) {
  return __async(this, arguments, function* ({
    url,
    providerContext
  }) {
    var _a;
    const page = yield getMkvDramaPage(url, providerContext);
    const episodes = yield getViewCrateLinks(
      page,
      providerContext
    );
    const quickDownload = yield (_a = providerContext.kvStore) == null ? void 0 : _a.get("mkvDrama_quickDownload");
    return episodes.sort((left, right) => {
      const difference = episodeNumber(left.title) - episodeNumber(right.title);
      return difference || left.title.localeCompare(right.title);
    }).map((e) => __spreadProps(__spreadValues({}, e), {
      quickDownload: quickDownload != null ? quickDownload : true
    }));
  });
}
__name(getEpisodes, "getEpisodes");
exports.getEpisodes = getEpisodes;
// Annotate the CommonJS export names for ESM import in node:

