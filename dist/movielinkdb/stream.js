"use strict";

// ============ Helper Utilities ============

var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;

var __defNormalProp = (obj, key, value) =>
  key in obj
    ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value: value })
    : (obj[key] = value);

var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    __hasOwnProp.call(b, prop) && __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b))
      __propIsEnum.call(b, prop) && __defNormalProp(a, prop, b[prop]);
  return a;
};

var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));

var __name = (target, value) =>
  __defProp(target, "name", { value: value, configurable: true });

var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

var __copyProps = (to, from, except, desc) => {
  if ((from && "object" == typeof from) || "function" == typeof from)
    for (let key of __getOwnPropNames(from))
      __hasOwnProp.call(to, key) ||
        key === except ||
        __defProp(to, key, {
          get: () => from[key],
          enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable,
        });
  return to;
};

var __toCommonJS = (mod) =>
  __copyProps(__defProp({}, "__esModule", { value: true }), mod);

var __async = (__this, __arguments, generator) =>
  new Promise((resolve, reject) => {
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
    var step = (x) =>
      x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
    step((generator = generator.apply(__this, __arguments)).next());
  });

var stream_exports = {};

// ============ Error Helpers ============

function getErrorMessage(error) {
  if (error instanceof Error) return error.message;
  if ("string" == typeof error) return error;
  try {
    return JSON.stringify(error);
  } catch (e) {
    return String(error);
  }
}

function throwProviderError(provider, operation, error) {
  const response = error?.response;
  const status = response?.status;
  const statusText = response?.statusText;
  const url = response?.config?.url || error?.config?.url;
  const details = [
    status ? `HTTP ${status}${statusText ? ` ${statusText}` : ""}` : "",
    url ? `URL ${url}` : "",
    getErrorMessage(error),
  ].filter(Boolean);
  throw new Error(`${provider} ${operation} failed: ${details.join(" | ")}`);
}

__export(stream_exports, { getStream: () => getStream });
__name(getErrorMessage, "getErrorMessage");
__name(throwProviderError, "throwProviderError");

// ============ Gofile Provider ============

var GOFILE_API = "https://api.gofile.io";
var GOFILE_LANGUAGE = "en-US";
var GOFILE_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

var cachedAccountToken = null;
var cachedGenerateWT = null;
var cachedWTTime = 0;

/**
 * Fetches and caches the generateWT function from gofile's wt.obf.js.
 * Falls back to identity function on failure. Cached for 3 hours.
 */
function getOrFetchGenerateWT(axios) {
  return __async(this, null, function* () {
    const now = Date.now();
    if (cachedGenerateWT && now - cachedWTTime < 10800000) return cachedGenerateWT;

    try {
      const code = (
        yield axios.get("https://gofile.io/js/wt.obf.js", {
          headers: {
            "User-Agent": GOFILE_USER_AGENT,
            Referer: "https://gofile.io/",
          },
        })
      ).data;

      const runner = new Function(
        "navigator",
        "window",
        "document",
        "location",
        `${code}\nreturn generateWT;`
      );

      const fakeNav = { userAgent: GOFILE_USER_AGENT, language: GOFILE_LANGUAGE };
      const fakeWin = {
        navigator: fakeNav,
        location: {
          href: "https://gofile.io/",
          protocol: "https:",
          host: "gofile.io",
        },
      };

      const generateWT = runner(fakeNav, fakeWin, {}, fakeWin.location);

      if ("function" == typeof generateWT) {
        cachedGenerateWT = generateWT;
        cachedWTTime = now;
        return generateWT;
      }
    } catch (err) {
      console.warn("gofile: failed to fetch/execute wt.obf.js:", err?.message || err);
    }
    return (accountToken) => accountToken;
  });
}

/**
 * Gets or creates a Gofile account token, caching it in kvStore.
 */
function getOrFetchToken(axios, providerContext) {
  return __async(this, null, function* () {
    if (cachedAccountToken) return cachedAccountToken;

    const kvStore = providerContext?.kvStore;

    try {
      const saved = yield kvStore?.get("gofile_account_token");
      if (saved && "string" == typeof saved) {
        cachedAccountToken = saved;
        return saved;
      }
    } catch (e) {}

    const token = (
      yield axios.post(
        `${GOFILE_API}/accounts`,
        {},
        {
          headers: {
            "User-Agent": GOFILE_USER_AGENT,
            Origin: "https://gofile.io",
            Referer: "https://gofile.io/",
          },
        }
      )
    ).data?.data?.token;

    if (!token) throw new Error("Gofile did not return an account token");

    cachedAccountToken = token;
    try {
      yield kvStore?.set("gofile_account_token", token);
    } catch (e) {}

    return token;
  });
}

/**
 * Recursively finds the first file with a download link in a Gofile content tree.
 */
function findFirstFile(content) {
  if (content?.type === "file" && content?.link) return content;
  for (const child of Object.values(content?.children ?? {})) {
    const file = findFirstFile(child);
    if (file) return file;
  }
}

/**
 * Extracts a direct download link from a Gofile folder/file ID.
 */
function gofileExtractor(id, axios, providerContext) {
  return __async(this, null, function* () {
    try {
      const token = yield getOrFetchToken(axios, providerContext);
      const websiteToken = (yield getOrFetchGenerateWT(axios))(token);

      const response = yield axios.get(`${GOFILE_API}/contents/${id}`, {
        params: {
          contentFilter: "",
          page: 1,
          pageSize: 1000,
          sortField: "name",
          sortDirection: 1,
        },
        headers: {
          Accept: "*/*",
          "Accept-Language": `${GOFILE_LANGUAGE},en;q=0.9`,
          Authorization: `Bearer ${token}`,
          Origin: "https://gofile.io",
          Referer: "https://gofile.io/",
          "User-Agent": GOFILE_USER_AGENT,
          "X-BL": GOFILE_LANGUAGE,
          "X-Website-Token": websiteToken,
        },
      });

      if (response.data?.status !== "ok") {
        if (response.data?.status === "error-auth" || response.status === 401) {
          cachedAccountToken = null;
          try {
            yield providerContext?.kvStore?.delete("gofile_account_token");
          } catch (e) {}
        }
        throw new Error(
          `Gofile API returned ${response.data?.status ?? "invalid data"}`
        );
      }

      const file = findFirstFile(response.data.data);
      if (!file?.link) throw new Error("No downloadable file found in Gofile response");

      return { link: file.link, token: token };
    } catch (error) {
      if (error?.response?.status === 401) {
        cachedAccountToken = null;
        try {
          yield providerContext?.kvStore?.delete("gofile_account_token");
        } catch (e) {}
      }
      throwProviderError("Gofile", `extract ${id}`, error);
    }
  });
}

__name(getOrFetchGenerateWT, "getOrFetchGenerateWT");
__name(getOrFetchToken, "getOrFetchToken");
__name(findFirstFile, "findFirstFile");
__name(gofileExtractor, "gofileExtractor");

// ============ HubCloud Helpers ============

var hubcloudDecode = __name(function (value) {
  return void 0 === value ? "" : atob(value.toString());
}, "hubcloudDecode");

var extractUrlFromScript = __name((html) => {
  const doubleAtobMatch = html.match(
    /(?:var|let|const)\s+\w+\s*=\s*atob\(atob\(['"]([^'"]+)['"]\)\)/
  );
  if (doubleAtobMatch?.[1]) return atob(atob(doubleAtobMatch[1]));

  const plainMatch = html.match(/var\s+url\s*=\s*['"]([^'"]+)['"]/);
  return (
    hubcloudDecode(plainMatch?.[1]?.split("r=")?.[1] ?? "") ||
    plainMatch?.[1] ||
    ""
  );
}, "extractUrlFromScript");

var getPixelDrainUrl = __name((html) => {
  const match = html.match(/var\s+pxl\s*=\s*['"]([^'"]+)['"];?/i);
  return match?.[1] || "";
}, "getPixelDrainUrl");

var getRedirectedPixelDrainUrl = __name((...htmlSources) => {
  for (const html of htmlSources) {
    if (!html) continue;
    const redirectedUrl = getPixelDrainUrl(html);
    if (redirectedUrl) return redirectedUrl;
  }
  return "";
}, "getRedirectedPixelDrainUrl");

/**
 * Resolves a Gofile link into a stream object with headers.
 */
function resolveGofileLink(gofileLink, axios, providerContext) {
  return __async(this, null, function* () {
    try {
      const id = new URL(gofileLink).pathname.split("/").filter(Boolean).pop();
      if (!id) return null;

      const gfResult = yield gofileExtractor(id, axios, providerContext);

      return gfResult?.link && gfResult?.token
        ? {
            server: "Gofile",
            link: gfResult.link,
            type: "mkv",
            headers: {
              Referer: "https://gofile.io/",
              Cookie: `accountToken=${gfResult.token}`,
            },
          }
        : null;
    } catch (error) {
      console.log("hubcloudExtractor: resolveGofileLink error:", error);
      return null;
    }
  });
}

// ============ HubCloud Extractor ============

function hubcloudExtractor(
  link,
  signal,
  axios,
  cheerio,
  headers2,
  providerContext,
  isDownload,
  providerValue
) {
  return __async(this, null, function* () {
    try {
      // Set default cookies if not provided
      if (!headers2.Cookie) {
        headers2.Cookie =
          "ext_name=ojplmecpdpgccookcobabopnaifgidhf; xla=s4t; cf_clearance=woQrFGXtLfmEMBEiGUsVHrUBMT8s3cmguIzmMjmvpkg-1770053679-1.2.1.1-xBrQdciOJsweUF6F2T_OtH6jmyanN_TduQ0yslc_XqjU6RcHSxI7.YOKv6ry7oYo64868HYoULnVyww536H2eVI3R2e4wKzsky6abjPdfQPxqpUaXjxfJ02o6jl3_Vkwr4uiaU7Wy596Vdst3y78HXvVmKdIohhtPvp.vZ9_L7wvWdce0GRixjh_6JiqWmWMws46hwEt3hboaS1e1e4EoWCvj5b0M_jVwvSxBOAW5emFzvT3QrnRh4nyYmKDERnY";
      }

      console.log("hubcloudExtractor", link);

      const baseUrl = link.split("/").slice(0, 3).join("/");
      const streamLinks = [];
      const openWebView = providerContext?.openWebView;

      // Fetch the initial link
      let vLinkRes;
      try {
        vLinkRes = yield axios(`${link}`, { headers: headers2, signal: signal });
      } catch (error) {
        if (error.response?.status !== 403) throw error;
        if (!openWebView) {
          console.log(
            `hubcloudExtractor: 403 Forbidden for ${link}, but openWebView solver is not available!`
          );
          throw error;
        }

        // WAF detected - use webview solver
        console.log(`hubcloudExtractor: WAF detected (403) for ${link}, using solver...`);
        const cleanHeaders = __spreadProps(__spreadValues({}, headers2), {
          Referer: baseUrl,
        });
        const wafResult = yield openWebView(baseUrl, {
          title: "Solve the captcha below and click done",
          description: "Required to bypass anti-bot protection.",
          headers: cleanHeaders,
          waitForCookie: "cf_clearance",
          force: true,
        });

        if (wafResult.userAgent) headers2["User-Agent"] = wafResult.userAgent;
        headers2.Cookie =
          (headers2.Cookie ? headers2.Cookie + "; " : "") + wafResult.cookies;

        vLinkRes = yield axios(`${link}`, { headers: headers2, signal: signal });
      }

      const vLinkText = vLinkRes.data;
      const $vLink = cheerio.load(vLinkText);

      // Look for Gofile buttons on the page
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

      // Extract vcloud link from scripts or download button
      let vcloudLink =
        extractUrlFromScript(vLinkText) ||
        $vLink(".fa-file-download.fa-lg").parent().attr("href") ||
        link;

      console.log("vcloudLink", vcloudLink);

      if (vcloudLink?.startsWith("/")) {
        vcloudLink = `${baseUrl}${vcloudLink}`;
        console.log("New vcloudLink", vcloudLink);
      }

      // If vcloudLink is a gofile link, resolve it
      if (vcloudLink?.includes("gofile.io")) {
        const gfStream = yield resolveGofileLink(vcloudLink, axios, providerContext);
        if (gfStream && !streamLinks.some((s) => s.link === gfStream.link)) {
          streamLinks.push(gfStream);
        }
      }

      // Fetch vcloud page
      let vcloudText = "";
      if (vcloudLink && !vcloudLink.includes("gofile.io") && vcloudLink !== link) {
        try {
          vcloudText = (
            yield axios.get(vcloudLink, { headers: headers2, signal: signal })
          ).data;
        } catch (error) {
          if (error.response?.status !== 403 || !openWebView) throw error;

          console.log(
            `hubcloudExtractor: WAF detected (403) for ${vcloudLink}, using solver...`
          );
          const vcloudBaseUrl = vcloudLink.split("/").slice(0, 3).join("/");
          const cleanHeaders2 = __spreadProps(__spreadValues({}, headers2), {
            Referer: vcloudBaseUrl,
          });
          const wafResult = yield openWebView(vcloudBaseUrl, {
            title: "Solve the captcha below and click done",
            description: "Required to bypass anti-bot protection.",
            headers: cleanHeaders2,
            waitForCookie: "cf_clearance",
            force: true,
          });

          if (wafResult.userAgent) headers2["User-Agent"] = wafResult.userAgent;
          headers2.Cookie =
            (headers2.Cookie ? headers2.Cookie + "; " : "") + wafResult.cookies;

          vcloudText = (
            yield axios.get(vcloudLink, { headers: headers2, signal: signal })
          ).data;
        }
      }

      // Parse vcloud page for download links
      const $ = cheerio.load(vcloudText);
      const linkClass = $(".btn-success.btn-lg.h6,.btn-danger,.btn-secondary");

      for (const element of linkClass) {
        let link2 = $(element).attr("href") || "";

        switch (true) {
          case link2?.includes("pixeld"): {
            console.log("Pixeldrain link found:", link2);
            if (!link2?.includes("api")) {
              const redirectedPixelDrainUrl = getRedirectedPixelDrainUrl(
                vLinkText,
                vcloudText
              );
              if (redirectedPixelDrainUrl) {
                console.log("Special case for token negn6f", redirectedPixelDrainUrl);
                link2 = redirectedPixelDrainUrl;
              }

              const token = link2.split("/").pop()?.split("?")[0];
              const baseUrl2 = link2.split("/").slice(0, -2).join("/");
              link2 = `${baseUrl2}/api/file/${token}?download`;
            }
            streamLinks.push({ server: "Pixeldrain", link: link2, type: "mkv" });
            break;
          }

          case link2?.includes(".dev") && !link2?.includes("/?id="): {
            streamLinks.push({ server: "CF Worker", link: link2, type: "mkv" });
            break;
          }

          case link2?.includes("hubcloud") || link2?.includes("/?id="): {
            try {
              let newLink = link2;

              // Try fetch to follow redirects
              try {
                if ("undefined" != typeof fetch) {
                  const fRes = yield fetch(link2, {
                    headers: headers2,
                    signal: signal,
                    redirect: "follow",
                  });
                  if (fRes.url && fRes.url.includes("googleusercontent")) {
                    newLink = fRes.url.split("?link=")[1] || fRes.url;
                  } else if (fRes.url && fRes.url !== link2) {
                    newLink = fRes.url;
                  }
                }
              } catch (e) {}

              // Try axios with manual redirects
              if (!newLink.includes("googleusercontent")) {
                try {
                  const res1 = yield axios.get(newLink, {
                    headers: headers2,
                    signal: signal,
                    maxRedirects: 0,
                    validateStatus: __name(
                      (s) => s >= 200 && s < 400,
                      "validateStatus"
                    ),
                  });
                  if (res1.headers?.location) newLink = res1.headers.location;

                  if (newLink.includes("googleusercontent")) {
                    newLink = newLink.split("?link=")[1] || newLink;
                  } else if (newLink.includes("http")) {
                    const res2 = yield axios.get(newLink, {
                      headers: headers2,
                      signal: signal,
                      maxRedirects: 0,
                      validateStatus: __name(
                        (s) => s >= 200 && s < 400,
                        "validateStatus"
                      ),
                    });
                    if (res2.headers?.location) {
                      const loc2 = res2.headers.location;
                      newLink = loc2.includes("?link=")
                        ? loc2.split("?link=")[1]
                        : loc2;
                    }
                  }
                } catch (e) {}
              }

              if (newLink.includes("?link=")) {
                newLink = newLink.split("?link=")[1] || newLink;
              }

              streamLinks.push({
                server: "GDrive (download only)",
                link: newLink,
                type: "mkv",
              });
            } catch (error) {
              console.log("hubcloudExtractor error in hubcloud link: ", error);
            }
            break;
          }

          case link2?.includes("gofile.io"): {
            try {
              const gfStream = yield resolveGofileLink(link2, axios, providerContext);
              if (gfStream && !streamLinks.some((s) => s.link === gfStream.link)) {
                streamLinks.push(gfStream);
              }
            } catch (error) {
              console.log("hubcloudExtractor error in gofile link: ", error);
            }
            break;
          }

          case link2?.includes("cloudflarestorage"): {
            streamLinks.push({ server: "CF Storage", link: link2, type: "mkv" });
            break;
          }

          case link2?.includes("fastdl") || link2?.includes("fsl."): {
            streamLinks.push({ server: "FastDl", link: link2, type: "mkv" });
            break;
          }

          case link2.includes("hubcdn") && !link2.includes("/?id="): {
            streamLinks.push({ server: "HubCdn", link: link2, type: "mkv" });
            break;
          }

          default: {
            if (link2?.includes(".mkv") || link2?.includes("?token=")) {
              streamLinks.push({ server: "CF Worker", link: link2, type: "mkv" });
            }
          }
        }
      }

      // Sort streams by preferred server priority
      let preferredServer = "auto";
      try {
        const specificKey = providerValue
          ? `${providerValue}_preferredDownloadServer`
          : "";
        preferredServer = (
          (specificKey
            ? yield providerContext?.kvStore?.get(specificKey)
            : void 0) ||
          (yield providerContext?.kvStore?.get("preferredDownloadServer")) ||
          "auto"
        )
          .toLowerCase()
          .trim();
      } catch (e) {}

      const getPriority = __name((serverName = "") => {
        const s = serverName.toLowerCase();

        if (
          isDownload &&
          "auto" !== preferredServer &&
          "" !== preferredServer &&
          s.includes(preferredServer)
        )
          return 0;

        if (isDownload) {
          if (s.includes("cf storage") || s.includes("storage") || s.includes("resumable"))
            return 1;
          if (s.includes("gdrive") || s.includes("google") || s.includes("instant"))
            return 2;
          if (s.includes("pixeldrain")) return 3;
          if (s.includes("gofile")) return 4;
          if (s.includes("fastdl") || s.includes("fsl")) return 5;
          if (s.includes("hubcdn")) return 6;
          if (s.includes("cf worker") || s.includes("worker") || s.includes("fast cloud"))
            return 8;
          return 10;
        }

        // Streaming priorities
        if (s.includes("cf storage") || s.includes("storage")) return 1;
        if (s.includes("cf worker") || s.includes("worker") || s.includes("fast cloud"))
          return 2;
        if (s.includes("gofile")) return 3;
        if (s.includes("pixeldrain")) return 4;
        if (s.includes("fastdl") || s.includes("fsl")) return 5;
        if (s.includes("hubcdn")) return 6;
        if (s.includes("gdrive") || s.includes("google")) return 7;
        return 10;
      }, "getPriority");

      streamLinks.sort((a, b) => getPriority(a.server) - getPriority(b.server));
      console.log("streamLinks", streamLinks);

      return streamLinks;
    } catch (error) {
      throwProviderError("HubCloud", `extract ${link}`, error);
    }
  });
}

__name(resolveGofileLink, "resolveGofileLink");
__name(hubcloudExtractor, "hubcloudExtractor");

// ============ Default Request Headers ============

var headers = {
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
  "Cache-Control": "no-store",
  "Accept-Language": "en-US,en;q=0.9",
  DNT: "1",
  "sec-ch-ua": '"Not_A Brand";v="8", "Chromium";v="120", "Microsoft Edge";v="120"',
  "sec-ch-ua-mobile": "?0",
  "sec-ch-ua-platform": '"Windows"',
  "Sec-Fetch-Dest": "document",
  "Sec-Fetch-Mode": "navigate",
  "Sec-Fetch-Site": "none",
  "Sec-Fetch-User": "?1",
  Cookie:
    "xla=s4t; _ga=GA1.1.1081149560.1756378968; _ga_BLZGKYN5PF=GS2.1.s1756378968$o1$g1$t1756378984$j44$l0$h0",
  "Upgrade-Insecure-Requests": "1",
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0",
};

// ============ URL Helpers ============

function isHttpUrl(s) {
  return /^https?:\/\//i.test(s);
}

function resolveRelative(href, base) {
  if (!href) return "";
  if (isHttpUrl(href)) return href;
  if (href.startsWith("//")) return "https:" + href;
  try {
    return new URL(href, base).href;
  } catch (e) {
    try {
      return `${new URL(base).origin}${href.startsWith("/") ? "" : "/"}${href}`;
    } catch (e2) {
      return href;
    }
  }
}

function ensureAbsolute(link) {
  return isHttpUrl(link), link;
}

// ============ Page Fetcher ============

function fetchPage(url, providerContext, signal) {
  return __async(this, null, function* () {
    const { axios: axios, cheerio: cheerio } = providerContext;
    console.log(`[getStream] Fetching page: ${url}`);

    const res = yield axios.get(url, {
      headers: __spreadProps(__spreadValues({}, headers), { Referer: url }),
      signal: signal,
    });

    console.log(`[getStream] Received status ${res.status}, length ${res.data?.length || 0}`);
    return cheerio.load(res.data || "");
  });
}

// ============ Provider-Specific Extractors ============

/**
 * Extracts a download link from an FSL (fsldownload.com) page.
 */
function extractFsl(link, signal, providerContext) {
  return __async(this, null, function* () {
    const { cheerio: cheerio } = providerContext;
    try {
      const $ = yield fetchPage(link, providerContext, signal);

      let href = $("a.fsl-download").attr("href")?.trim();

      // Fallback 1: links pointing to fsldownload
      if (!href) {
        $("a[href*='fsldownload']").each((_, el) => {
          const h = $(el).attr("href")?.trim();
          if (h) return (href = h), false;
        });
      }

      // Fallback 2: data-host="fsl" anchors
      if (!href) {
        $("a[data-host='fsl']").each((_, el) => {
          const h = $(el).attr("href")?.trim();
          if (h && "#" !== h) return (href = h), false;
        });
      }

      if (!href) {
        console.warn(`[getStream] FSL: no download link found on ${link}`);
        return null;
      }

      const full = resolveRelative(href, link);
      console.log(`[getStream] FSL direct link: ${full}`);
      return { server: "fsl", link: full, type: "mp4" };
    } catch (e) {
      console.warn(`[getStream] FSL extraction failed: ${e.message}`);
      return null;
    }
  });
}

/**
 * Extracts a download link from a GP (Google Photos/Googleusercontent) page.
 */
function extractGp(link, signal, providerContext) {
  return __async(this, null, function* () {
    const { cheerio: cheerio } = providerContext;
    try {
      const $ = yield fetchPage(link, providerContext, signal);

      let href =
        $("a.dlh-cta.green[href*='googleusercontent']").attr("href")?.trim() ||
        $("a.dlh-cta[href*='googleusercontent']").attr("href")?.trim() ||
        $("a.dlh-cta").attr("href")?.trim();

      if (!href) href = $("a.gpx-btn").attr("href")?.trim();

      // Fallback 1: any googleusercontent link
      if (!href) {
        $("a[href*='googleusercontent']").each((_, el) => {
          const h = $(el).attr("href")?.trim();
          if (h) return (href = h), false;
        });
      }

      // Fallback 2: data-host="gphotos" anchors
      if (!href) {
        $("a[data-host='gphotos']").each((_, el) => {
          const h = $(el).attr("href")?.trim();
          if (h && "#" !== h) return (href = h), false;
        });
      }

      if (!href) {
        console.warn(`[getStream] GP: no download link found on ${link}`);
        return null;
      }

      const full = resolveRelative(href, link);
      console.log(`[getStream] GP direct link: ${full}`);
      return { server: "gp", link: full, type: "mp4" };
    } catch (e) {
      console.warn(`[getStream] GP extraction failed: ${e.message}`);
      return null;
    }
  });
}

/**
 * Generic extractor: finds the first plausible download link on the page.
 */
function extractGeneric(link, signal, providerContext, server) {
  return __async(this, null, function* () {
    const { cheerio: cheerio } = providerContext;
    try {
      const $ = yield fetchPage(link, providerContext, signal);

      const href =
        $("a[href*='.mkv']").first().attr("href") ||
        $("a[href*='.mp4']").first().attr("href") ||
        $("a[href*='download']").first().attr("href") ||
        $("a.btn-primary").first().attr("href") ||
        $("a.dlh-cta").first().attr("href") ||
        $("a.fsl-download").first().attr("href");

      if (!href) {
        console.warn(`[getStream] ${server}: no download link found on ${link}`);
        return null;
      }

      const full = resolveRelative(href, link);
      console.log(`[getStream] ${server} direct link: ${full}`);
      return { server: server, link: full, type: "mp4" };
    } catch (e) {
      console.warn(`[getStream] ${server} extraction failed: ${e.message}`);
      return null;
    }
  });
}

__name(isHttpUrl, "isHttpUrl");
__name(resolveRelative, "resolveRelative");
__name(ensureAbsolute, "ensureAbsolute");
__name(fetchPage, "fetchPage");
__name(extractFsl, "extractFsl");
__name(extractGp, "extractGp");
__name(extractGeneric, "extractGeneric");

// ============ Main Stream Extractor ============

function getStream(_0) {
  return __async(this, arguments, function* ({
    link: link,
    type: type,
    signal: signal,
    providerContext: providerContext,
  }) {
    const { axios: axios, cheerio: cheerio } = providerContext;
    const streamLinks = [];

    if (!link) {
      console.warn("[getStream] Empty link provided");
      return [];
    }

    const absoluteLink = ensureAbsolute(link);
    if (!isHttpUrl(absoluteLink)) {
      console.warn(`[getStream] Link is not an absolute URL: ${link}`);
      return [];
    }

    console.log(`[getStream] Starting extraction for: ${absoluteLink}`);

    try {
      const $ = yield fetchPage(absoluteLink, providerContext, signal);

      // ---- Direct detection: FSL page ----
      if (
        $("a.fsl-download").length > 0 ||
        $("a[href*='fsldownload.com']").length > 0
      ) {
        console.log("[getStream] Detected FSL page directly");
        const s = yield extractFsl(absoluteLink, signal, providerContext);
        if (s) streamLinks.push(s);
        if (streamLinks.length > 0) return streamLinks;
      }

      // ---- Direct detection: GP page ----
      if (
        $("a.dlh-cta[href*='googleusercontent']").length > 0 ||
        $("a.gpx-btn").length > 0 ||
        $("a[href*='video-downloads.googleusercontent.com']").length > 0
      ) {
        console.log("[getStream] Detected GP page directly");
        const s = yield extractGp(absoluteLink, signal, providerContext);
        if (s) streamLinks.push(s);
        if (streamLinks.length > 0) return streamLinks;
      }

      // ---- Collect candidate action links ----
      const candidates = [];
      const seen = new Set();
      const selector = [
        ".gdl-action-wrap a",
        ".mlbd-download-button-wrap a",
        "a.dlh-arow",
        "a.dlh-cta",
        "a[data-host]",
      ].join(", ");

      $(selector).each((_, el) => {
        const anchor = $(el);
        const rawHref = anchor.attr("href")?.trim();
        if (!rawHref || "#" === rawHref) return;

        const host = (anchor.attr("data-host") || "").toLowerCase();
        const key = `${host}|${rawHref}`;
        if (seen.has(key)) return;

        seen.add(key);
        candidates.push({ href: rawHref, host: host });
      });

      console.log(`[getStream] Found ${candidates.length} candidate link(s)`);

      // ---- Process each candidate ----
      for (const { href: rawHref, host: host } of candidates) {
        const fullHref = resolveRelative(rawHref, absoluteLink);
        console.log(`[getStream] Candidate: host="${host}", href="${fullHref}"`);

        // FSL
        if (
          "fsl" === host ||
          "fsl-promo" === host ||
          fullHref.includes("fsldownload")
        ) {
          console.log("[getStream] -> Routing to FSL extractor");
          const s = yield extractFsl(fullHref, signal, providerContext);
          if (s) streamLinks.push(s);
          continue;
        }

        // GP
        if (
          "gphotos" === host ||
          "gphotos-promo" === host ||
          host.startsWith("gphotos") ||
          fullHref.includes("googleusercontent") ||
          fullHref.includes("?gp=1")
        ) {
          console.log("[getStream] -> Routing to GP extractor");
          const s = yield extractGp(fullHref, signal, providerContext);
          if (s) streamLinks.push(s);
          continue;
        }

        // InstantCloud
        if ("instantcloud" === host || fullHref.includes("instantcloud.org")) {
          console.log("[getStream] -> Routing to InstantCloud extractor");
          const s = yield extractGeneric(fullHref, signal, providerContext, "instantcloud");
          if (s) streamLinks.push(s);
          continue;
        }

        // HubCloud
        if (fullHref.includes("hubcloud")) {
          console.log("[getStream] -> Routing to HubCloud extractor");
          const hubStreams = yield hubcloudExtractor(fullHref, signal, axios, cheerio, headers);
          if (Array.isArray(hubStreams)) streamLinks.push(...hubStreams);
          else if (hubStreams) streamLinks.push({ server: "hubcloud", link: hubStreams, type: "mp4" });
          continue;
        }

        // Generic fallback
        console.log("[getStream] -> Unknown host, trying generic extractor");
        const s = yield extractGeneric(fullHref, signal, providerContext, host || "unknown");
        if (s) streamLinks.push(s);
      }

      // ---- Fallback: CSRF-protected unlock flow ----
      if (0 === streamLinks.length) {
        console.log("[getStream] No links found via action wraps, trying CSRF flow");

        const csrfInput = $("input[name^='_csrf']");
        const csrfName = csrfInput.attr("name");
        const csrfValue = csrfInput.val();

        if (csrfName && csrfValue) {
          console.log("[getStream] CSRF token found, attempting unlock");

          const formData = new URLSearchParams();
          formData.append(csrfName, csrfValue);

          const unlockedHTML =
            (
              yield axios.post(absoluteLink, formData, {
                headers: __spreadProps(__spreadValues({}, headers), {
                  "Content-Type": "application/x-www-form-urlencoded",
                }),
                signal: signal,
              })
            ).data || "";

          const $$ = cheerio.load(unlockedHTML);
          let hubcloudLink = "";

          // Try to find a hubcloud URL in the unlocked HTML
          const match = unlockedHTML.match(
            /https?:\/\/hubcloud\.(fit|foo)\/video\/[a-zA-Z0-9_]+/i
          );
          if (match) hubcloudLink = match[0];

          if (!hubcloudLink) {
            $$("a[href*='hubcloud']").each((_, el) => {
              const h = $$(el).attr("href");
              if (h) return (hubcloudLink = h), false;
            });
          }

          if (hubcloudLink) {
            console.log(`[getStream] HubCloud link found after unlock: ${hubcloudLink}`);
            const hubStreams = yield hubcloudExtractor(
              hubcloudLink,
              signal,
              axios,
              cheerio,
              headers
            );
            if (Array.isArray(hubStreams)) streamLinks.push(...hubStreams);
            else if (hubStreams)
              streamLinks.push({ server: "hubcloud", link: hubStreams, type: "mp4" });
          }
        } else {
          console.log("[getStream] No CSRF token found");
        }
      }

      console.log(`[getStream] Extraction complete. Found ${streamLinks.length} stream(s).`);
      return streamLinks;
    } catch (err) {
      console.error(`[getStream] Fatal error: ${err.message}`);
      return [];
    }
  });
}

__name(getStream, "getStream");

// ============ Exports ============

exports.getStream = getStream;
