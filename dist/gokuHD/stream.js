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

__export(stream_exports, { getStream: () => getStream2 });
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
 * Falls back to identity function on failure.
 */
function getOrFetchGenerateWT(axios) {
  return __async(this, null, function* () {
    const now = Date.now();
    // Cache for 3 hours (10800000 ms)
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
    // Fallback: identity function
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
  headers,
  providerContext,
  isDownload,
  providerValue
) {
  return __async(this, null, function* () {
    try {
      // Set default cookies if not provided
      if (!headers.Cookie) {
        headers.Cookie =
          "ext_name=ojplmecpdpgccookcobabopnaifgidhf; xla=s4t; cf_clearance=woQrFGXtLfmEMBEiGUsVHrUBMT8s3cmguIzmMjmvpkg-1770053679-1.2.1.1-xBrQdciOJsweUF6F2T_OtH6jmyanN_TduQ0yslc_XqjU6RcHSxI7.YOKv6ry7oYo64868HYoULnVyww536H2eVI3R2e4wKzsky6abjPdfQPxqpUaXjxfJ02o6jl3_Vkwr4uiaU7Wy596Vdst3y78HXvVmKdIohhtPvp.vZ9_L7wvWdce0GRixjh_6JiqWmWMws46hwEt3hboaS1e1e4EoWCvj5b0M_jVwvSxBOAW5emFzvT3QrnRh4nyYmKDERnY";
      }

      console.log("hubcloudExtractor", link);

      const baseUrl = link.split("/").slice(0, 3).join("/");
      const streamLinks = [];
      const openWebView = providerContext?.openWebView;

      // Fetch the initial link
      let vLinkRes;
      try {
        vLinkRes = yield axios(`${link}`, { headers: headers, signal: signal });
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
        const cleanHeaders = __spreadProps(__spreadValues({}, headers), {
          Referer: baseUrl,
        });
        const wafResult = yield openWebView(baseUrl, {
          title: "Solve the captcha below and click done",
          description: "Required to bypass anti-bot protection.",
          headers: cleanHeaders,
          waitForCookie: "cf_clearance",
          force: true,
        });

        if (wafResult.userAgent) headers["User-Agent"] = wafResult.userAgent;
        headers.Cookie =
          (headers.Cookie ? headers.Cookie + "; " : "") + wafResult.cookies;

        vLinkRes = yield axios(`${link}`, { headers: headers, signal: signal });
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
            yield axios.get(vcloudLink, { headers: headers, signal: signal })
          ).data;
        } catch (error) {
          if (error.response?.status !== 403 || !openWebView) throw error;

          console.log(
            `hubcloudExtractor: WAF detected (403) for ${vcloudLink}, using solver...`
          );
          const vcloudBaseUrl = vcloudLink.split("/").slice(0, 3).join("/");
          const cleanHeaders2 = __spreadProps(__spreadValues({}, headers), {
            Referer: vcloudBaseUrl,
          });
          const wafResult = yield openWebView(vcloudBaseUrl, {
            title: "Solve the captcha below and click done",
            description: "Required to bypass anti-bot protection.",
            headers: cleanHeaders2,
            waitForCookie: "cf_clearance",
            force: true,
          });

          if (wafResult.userAgent) headers["User-Agent"] = wafResult.userAgent;
          headers.Cookie =
            (headers.Cookie ? headers.Cookie + "; " : "") + wafResult.cookies;

          vcloudText = (
            yield axios.get(vcloudLink, { headers: headers, signal: signal })
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
                    headers: headers,
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
                    headers: headers,
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
                      headers: headers,
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

// ============ Transfer.it Extractor ============

function transferitExtractor(transferId, axios, userAgent) {
  return __async(this, null, function* () {
    try {
      const megaApiUrl = `https://g.api.mega.co.nz/cs?x=${transferId}&bc=1`;
      const headers = {
        "Content-Type": "application/json",
        "User-Agent":
          userAgent ||
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      };

      const fileNode = (
        yield axios.post(megaApiUrl, [{ a: "f", c: 1, r: 1 }], {
          headers: headers,
          timeout: 10000,
        })
      ).data?.[0]?.f?.find((f) => 0 === f.t);

      if (!fileNode?.h) return null;

      const gUrl = (
        yield axios.post(
          megaApiUrl,
          [{ a: "g", n: fileNode.h, pt: 1, g: 1, ssl: 1 }],
          { headers: headers, timeout: 10000 }
        )
      ).data?.[0]?.g;

      return gUrl ? `${gUrl}/video.mp4` : null;
    } catch (err) {
      return null;
    }
  });
}

// ============ Buzzheavier Extractor ============

function buzzheavierExtractor(link, axios, ctx) {
  return __async(this, null, function* () {
    try {
      const pageUrl = new URL(link);
      pageUrl.pathname = pageUrl.pathname.replace(/\/download\/?$/, "");

      const headers = __spreadProps(__spreadValues({}, ctx.commonHeaders), {
        Referer: pageUrl.origin + "/",
      });

      const page = yield axios.get(pageUrl.href, { headers: headers });
      const path = ctx.cheerio.load(page.data)("a.download-btn").attr("hx-get");

      if (!path) return null;

      const cookies = page.headers?.["set-cookie"];
      const cookie = (Array.isArray(cookies) ? cookies : [cookies])
        .filter((value) => "string" == typeof value && !!value)
        .map((value) => value.split(";", 1)[0])
        .join("; ");

      const response = yield axios.head(new URL(path, pageUrl).href, {
        headers: __spreadValues(
          __spreadProps(__spreadValues({}, headers), {
            Referer: pageUrl.href,
            "HX-Request": "true",
            "HX-Current-URL": pageUrl.href,
          }),
          cookie ? { Cookie: cookie } : {}
        ),
        maxRedirects: 0,
        validateStatus: __name((status) => status >= 200 && status < 400, "validateStatus"),
      });

      const target =
        response.headers?.["hx-redirect"] || response.headers?.location;

      if ("string" != typeof target || !target) return null;

      const mediaUrl = new URL(target, pageUrl);
      return ["https:", "http:"].includes(mediaUrl.protocol)
        ? {
            server: "Buzzheavier",
            link: mediaUrl.href,
            type: "mkv",
            headers: __spreadProps(__spreadValues({}, ctx.commonHeaders), {
              Referer: pageUrl.href,
            }),
          }
        : null;
    } catch (error) {
      console.warn("Buzzheavier extraction failed:", error?.message || "request failed");
      return null;
    }
  });
}

// ============ VegaDrive Extractor ============

function vegadriveExtractor(vegadriveUrl, axios, ctx) {
  return __async(this, null, function* () {
    const streams = [];

    try {
      const defaultUserAgent =
        ctx?.commonHeaders?.["User-Agent"] ||
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

      const baseHeaders = { "User-Agent": defaultUserAgent, Referer: vegadriveUrl };

      // Follow redirects manually
      let pageRes;
      let finalUrl = vegadriveUrl;
      for (let redirects = 0; ; redirects++) {
        pageRes = yield axios.get(finalUrl, {
          headers: baseHeaders,
          maxRedirects: 0,
          validateStatus: __name((status) => status >= 200 && status < 400, "validateStatus"),
        });

        const location = pageRes.headers?.location || pageRes.headers?.Location;
        if (![301, 302, 303, 307, 308].includes(pageRes.status) || !location) break;
        if (redirects >= 8) throw new Error("Too many VegaDrive mirror redirects");

        const nextUrl = new URL(String(location), finalUrl);
        if (!["http:", "https:"].includes(nextUrl.protocol))
          throw new Error("Invalid VegaDrive mirror redirect");

        finalUrl = nextUrl.href;
      }

      // Extract cookies
      const cookieHeader = pageRes.headers?.["set-cookie"];
      let cookieStr = "";
      if (Array.isArray(cookieHeader)) {
        cookieStr = cookieHeader.map((c) => String(c).split(";")[0]).join("; ");
      } else if (cookieHeader) {
        cookieStr = String(cookieHeader).split(";")[0];
      }

      const vdBase = new URL(finalUrl).origin;
      const reqHeaders = __spreadValues(
        __spreadProps(__spreadValues({}, baseHeaders), { Referer: finalUrl }),
        cookieStr ? { Cookie: cookieStr } : {}
      );

      const shareIdMatch = vegadriveUrl.match(/\/s\/([a-zA-Z0-9]+)/);
      if (!shareIdMatch) return streams;

      const shareId = shareIdMatch[1];
      const targetProviders = ["buzzheavier", "gofile", "pixeldrain", "transferit"];

      yield Promise.all(
        targetProviders.map((provider) =>
          __async(null, null, function* () {
            try {
              const dUrl = `${vdBase}/d/${shareId}/${provider}`;
              const dRes = yield axios.get(dUrl, {
                headers: reqHeaders,
                maxRedirects: 0,
                validateStatus: __name((s) => s >= 200 && s < 400, "validateStatus"),
              });

              let targetLoc = dRes.headers?.location || dRes.headers?.Location;
              if (!targetLoc) return;

              if (targetLoc.startsWith("/")) targetLoc = `${vdBase}${targetLoc}`;

              // Handle bridge redirect
              if (targetLoc.includes("__vega_bridge")) {
                const bridgeRes = yield axios.get(targetLoc, {
                  headers: reqHeaders,
                  maxRedirects: 0,
                  validateStatus: __name((s) => s >= 200 && s < 400, "validateStatus"),
                });
                targetLoc = bridgeRes.headers?.location || bridgeRes.headers?.Location;
                if (targetLoc && targetLoc.startsWith("/")) targetLoc = `${vdBase}${targetLoc}`;
              }

              if (!targetLoc) return;

              if ("buzzheavier" === provider) {
                const resolved = yield buzzheavierExtractor(targetLoc, axios, ctx);
                if (resolved) streams.push(resolved);
              } else if ("pixeldrain" === provider) {
                const pxMatch =
                  targetLoc.match(/\/u\/([a-zA-Z0-9_-]+)/) ||
                  targetLoc.match(/\/file\/([a-zA-Z0-9_-]+)/);
                if (pxMatch) {
                  streams.push({
                    server: "Pixeldrain",
                    link: `https://pixeldrain.com/api/file/${pxMatch[1]}`,
                    type: "mp4",
                  });
                }
              } else if ("gofile" === provider) {
                const gofileMatch = targetLoc.match(/\/d\/([a-zA-Z0-9]+)/);
                if (gofileMatch) {
                  const gfStream = yield gofileExtractor(gofileMatch[1], axios, ctx);
                  if (gfStream && gfStream.link) {
                    streams.push({
                      server: "Gofile",
                      link: gfStream.link,
                      type: "mp4",
                      headers: {
                        "User-Agent": defaultUserAgent,
                        Referer: "https://gofile.io/",
                        Cookie: `accountToken=${gfStream.token}`,
                      },
                    });
                  }
                }
              } else if ("transferit" === provider) {
                const trMatch = targetLoc.match(/\/t\/([a-zA-Z0-9_-]+)/);
                if (trMatch) {
                  const transferId = trMatch[1];
                  const ddl = yield transferitExtractor(transferId, axios, defaultUserAgent);
                  if (ddl) {
                    streams.push({ server: "Transfer.it", link: ddl, type: "mp4" });
                  }
                }
              }
            } catch (err) {}
          })
        )
      );
    } catch (error) {}

    return streams;
  });
}

// ============ Main Stream Extractor (internal) ============

function getStream(_0) {
  return __async(this, arguments, function* ({
    link: link,
    type: type,
    signal: signal,
    providerContext: providerContext,
    isDownload: isDownload,
  }) {
    const { axios: axios, cheerio: cheerio, commonHeaders: commonHeaders } =
      providerContext;

    try {
      const streamLinks = [];
      console.log("dotlink", link);

      let hubcloudUrl = link;
      let vegadriveUrl = "";

      // Parse link - may be a JSON object with hubcloud and vegadrive keys
      if (link.startsWith("{") && link.endsWith("}")) {
        try {
          const parsed = JSON.parse(link);
          if (parsed.hubcloud) hubcloudUrl = parsed.hubcloud;
          if (parsed.vegadrive) vegadriveUrl = parsed.vegadrive;
        } catch (e) {}
      } else if (link.includes("vegadrive") || link.includes("one.vegadrive")) {
        vegadriveUrl = link;
        hubcloudUrl = "";
      }

      // Extract from vegadrive if present
      if (vegadriveUrl) {
        try {
          const vdStreams = yield vegadriveExtractor(vegadriveUrl, axios, providerContext);
          if (Array.isArray(vdStreams)) {
            for (const s of vdStreams) {
              if (!streamLinks.some((existing) => existing.link === s.link)) {
                streamLinks.push(s);
              }
            }
          }
        } catch (e) {
          console.log("vegadrive error:", e?.message);
        }
      }

      if (!hubcloudUrl && streamLinks.length > 0) return streamLinks;

      link = hubcloudUrl;

      if (link.includes("cloud")) {
        // Direct HubCloud link
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
        if (Array.isArray(hcStreams)) streamLinks.push(...hcStreams);
      } else {
        // Dotlink page - parse for various providers
        try {
          const dotlinkText = (
            yield axios.get(link, {
              headers: __spreadProps(__spreadValues({}, commonHeaders), {
                Referer: link.split("/").slice(0, 3).join("/"),
              }),
              signal: signal,
              timeout: 10000,
            })
          ).data;

          const $ = cheerio.load(dotlinkText);

          // G-Direct / Instant / FastDL link
          const gDirectLink = $(
            "a:contains('G-Direct'), a:contains('Instant'), a[href*='fastdl']"
          ).attr("href");

          if (gDirectLink) {
            try {
              const m = (
                yield axios.get(gDirectLink, {
                  headers: __spreadProps(__spreadValues({}, commonHeaders), {
                    Referer: link,
                  }),
                  signal: signal,
                  timeout: 10000,
                })
              ).data.match(/reurl\s*=\s*["']([^"']+)["']/);

              if (m) {
                const targetUrl = m[1].includes("link=")
                  ? decodeURIComponent(m[1].split("link=")[1])
                  : m[1];
                if (
                  targetUrl.includes("googleusercontent.com") ||
                  targetUrl.startsWith("http")
                ) {
                  streamLinks.push({
                    server: "Instant (Google CDN)",
                    link: targetUrl,
                    type: "mkv",
                  });
                }
              }
            } catch (e) {
              console.log("FastDL error:", e?.message);
            }
          }

          // Vega Drive link on dotlink page
          const pageVdLink = $(
            "a:contains('Vega Drive'), a[href*='vegadrive']"
          ).attr("href");
          if (pageVdLink) {
            try {
              const vdStreams = yield vegadriveExtractor(
                pageVdLink,
                axios,
                providerContext
              );
              if (Array.isArray(vdStreams)) {
                for (const s of vdStreams) {
                  if (!streamLinks.some((existing) => existing.link === s.link)) {
                    streamLinks.push(s);
                  }
                }
              }
            } catch (e) {
              console.log("vegadrive dotlink error:", e?.message);
            }
          }

          // V-Cloud / HubCloud link on dotlink page
          const vlink =
            $("a:contains('V-Cloud'), a[href*='vcloud'], a[href*='hubcloud']").attr(
              "href"
            ) ||
            (dotlinkText.match(/<a\s+href="([^"]*cloud\.[^"]*)"/i) || [])[1];

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
              console.log("HubCloud vcloud error:", e?.message);
            }
          }

          // Filepress link
          try {
            const filepressAnchor = $(
              '.btn.btn-sm.btn-outline[style*="rgb(252,185,0)"], a:contains("Filepress"), a[href*="filepress"], a[href*="filebee"]'
            ).first();
            const filepressLink =
              filepressAnchor.attr("href") || filepressAnchor.parent().attr("href");

            if (filepressLink) {
              const filepressID = filepressLink.split("/").pop();
              const filepressBaseUrl = filepressLink.split("/").slice(0, -2).join("/");

              const filepressTokenRes = yield axios.post(
                filepressBaseUrl + "/api/file/downlaod/",
                {
                  id: filepressID,
                  method: "indexDownlaod",
                  captchaValue: null,
                },
                {
                  headers: {
                    "Content-Type": "application/json",
                    Referer: filepressBaseUrl,
                  },
                  timeout: 10000,
                }
              );

              if (filepressTokenRes.data?.status) {
                const filepressToken = filepressTokenRes.data?.data;
                const filepressStreamLink = yield axios.post(
                  filepressBaseUrl + "/api/file/downlaod2/",
                  {
                    id: filepressToken,
                    method: "indexDownlaod",
                    captchaValue: null,
                  },
                  {
                    headers: {
                      "Content-Type": "application/json",
                      Referer: filepressBaseUrl,
                    },
                    timeout: 10000,
                  }
                );

                if (filepressStreamLink.data?.data?.[0]) {
                  streamLinks.push({
                    server: "filepress",
                    link: filepressStreamLink.data.data[0],
                    type: "mkv",
                  });
                }
              }
            }
          } catch (error) {
            console.log("filepress error:", error?.message);
          }
        } catch (err) {
          console.log("dotlink error:", err?.message);
        }
      }

      // Return streams if found, otherwise fallback to hubcloud
      return streamLinks.length > 0
        ? streamLinks
        : yield hubcloudExtractor(
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

// ============ Public API (getStream2) ============

function getStream2(_0) {
  return __async(this, arguments, function* ({
    link: link,
    type: type,
    signal: signal,
    providerContext: providerContext,
    isDownload: isDownload,
  }) {
    const { axios: axios, commonHeaders: commonHeaders } = providerContext;

    // Special handling for FastDL links
    if (link.includes("fastdl")) {
      try {
        const res = yield axios.get(link, {
          signal: signal,
          headers: __spreadProps(__spreadValues({}, commonHeaders), {
            Referer: link,
          }),
        });

        const reurlMatch = (
          "string" == typeof res.data ? res.data : JSON.stringify(res.data)
        ).match(/var\s+reurl\s*=\s*"([^"]+)";/i);

        if (reurlMatch) {
          let directLink = reurlMatch[1];
          if (directLink.includes("link=")) {
            directLink = directLink.split("link=").slice(1).join("link=");
          }
          if (
            directLink.startsWith("http%3A") ||
            directLink.startsWith("https%3A")
          ) {
            directLink = decodeURIComponent(directLink);
          }
          if (directLink.startsWith("http")) {
            return [{ server: "FastDL", link: directLink, type: "mkv" }];
          }
        }
      } catch (e) {
        console.warn("FastDL extraction failed, falling back to vega stream", e);
      }
    }

    // Delegate to the main stream extractor
    return getStream({
      link: link,
      type: type,
      signal: signal,
      providerContext: providerContext,
      isDownload: isDownload,
    });
  });
}

// ============ Name Assignments & Exports ============

__name(resolveGofileLink, "resolveGofileLink");
__name(hubcloudExtractor, "hubcloudExtractor");
__name(transferitExtractor, "transferitExtractor");
__name(buzzheavierExtractor, "buzzheavierExtractor");
__name(vegadriveExtractor, "vegadriveExtractor");
__name(getStream, "getStream");
__name(getStream2, "getStream");

exports.getStream = getStream2;
