const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const os = require("os");
const axios = require("axios");
const cheerio = require("cheerio");
const http2 = require("http2");
const { spawn, execSync } = require("child_process");

// Check if curl command is available on system
let hasCurl = false;
try {
  execSync("curl --version", { stdio: "ignore" });
  hasCurl = true;
} catch {}

// ─── Log Rate Limiter (Protects against Railway 500 logs/sec limit) ─────────
const origLog = console.log;
const origWarn = console.warn;
const origError = console.error;
let logsThisSec = 0;
let lastLogReset = Date.now();

function canLog() {
  const now = Date.now();
  if (now - lastLogReset > 1000) {
    lastLogReset = now;
    logsThisSec = 0;
  }
  if (logsThisSec < 15) {
    logsThisSec++;
    return true;
  }
  return false;
}

console.log = (...args) => { if (canLog()) origLog(...args); };
console.warn = (...args) => { if (canLog()) origWarn(...args); };
console.error = (...args) => { if (canLog()) origError(...args); };

const { PersistentKvStore } = require("./kvStore");
const {
  cleanPost,
  cleanStream,
  cleanMeta,
  cleanEpisode,
  cleanUrl,
} = require("./linkCleaner");

// ─── Free Persistent KV Store ───────────────────────────────────────────────
// Replaces external paid KV stores (like Cloudflare KV, Vercel KV) with a
// high-performance zero-cost persistent JSON store located in data/kv-store.json.
const kvStore = new PersistentKvStore();

// ─── Local URLs Fallback Interceptor ─────────────────────────────────────────
// Intercepts remote urls.json requests from getBaseUrl.ts to ensure rock-solid
// offline and Railway container reliability without relying on GitHub raw uptime.
const urlsPath = path.join(__dirname, "..", "urls.json");
const urlsEndpoint =
  "https://raw.githubusercontent.com/Zenda-Cross/vega-providers/refs/heads/main/urls.json";
const nativeFetch = global.fetch;

global.fetch = async (input, init) => {
  const url = typeof input === "string" ? input : input?.url || "";
  if (url === urlsEndpoint) {
    if (fs.existsSync(urlsPath)) {
      const providerUrls = fs.readFileSync(urlsPath, "utf-8");
      return new Response(providerUrls, {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
  }
  return nativeFetch(input, init);
};

// ─── Provider Context Setup ─────────────────────────────────────────────────
const crypto = require("crypto");

const defaultBrowserHeaders = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  "Sec-Ch-Ua": '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
  "Sec-Ch-Ua-Mobile": "?0",
  "Sec-Ch-Ua-Platform": '"Windows"',
  "Upgrade-Insecure-Requests": "1",
};

// Global axios request interceptor: ensure requests never send bare axios user-agent
axios.interceptors.request.use((config) => {
  config.headers = config.headers || {};
  const currentUa = config.headers["User-Agent"] || config.headers["user-agent"] || "";
  if (!currentUa || currentUa.includes("axios")) {
    config.headers["User-Agent"] = defaultBrowserHeaders["User-Agent"];
  }
  if (!config.headers["Accept"] && !config.headers["accept"]) {
    config.headers["Accept"] = defaultBrowserHeaders["Accept"];
  }
  if (!config.headers["Accept-Language"] && !config.headers["accept-language"]) {
    config.headers["Accept-Language"] = defaultBrowserHeaders["Accept-Language"];
  }
  return config;
});

const Aes = {
  sha1: async (str) => crypto.createHash("sha1").update(str).digest("hex"),
  sha256: async (str) => crypto.createHash("sha256").update(str).digest("hex"),
  md5: async (str) => crypto.createHash("md5").update(str).digest("hex"),
};

async function solveWithPlaywright(url, options = {}) {
  let browser;
  try {
    const { chromium } = require("playwright-core");
    const launchArgs = [
      "--disable-blink-features=AutomationControlled",
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--headless=new",
    ];

    const executablePath =
      process.env.CHROME_PATH ||
      process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ||
      (fs.existsSync("/usr/bin/chromium") ? "/usr/bin/chromium" : undefined) ||
      (fs.existsSync("/usr/bin/chromium-browser") ? "/usr/bin/chromium-browser" : undefined) ||
      (fs.existsSync("/usr/bin/google-chrome") ? "/usr/bin/google-chrome" : undefined);

    const launchOpts = {
      headless: true,
      args: launchArgs,
      ignoreDefaultArgs: ["--enable-automation"],
    };
    if (executablePath) {
      launchOpts.executablePath = executablePath;
    }

    browser = await chromium.launch(launchOpts).catch(() =>
      chromium.launch({ ...launchOpts, channel: "chrome" }).catch(() =>
        chromium.launch({ ...launchOpts, channel: "msedge" })
      )
    );
  } catch (err) {
    throw new Error(
      `Headless challenge solver unavailable (${err.message})`
    );
  }

  const contextOptions = {
    userAgent:
      options.headers?.["User-Agent"] || defaultBrowserHeaders["User-Agent"],
  };
  const context = await browser.newContext(contextOptions);

  await context.addInitScript(() => {
    try {
      delete Object.getPrototypeOf(navigator).webdriver;
    } catch {}
    Object.defineProperty(navigator, "webdriver", { get: () => undefined });
  });

  const page = await context.newPage();

  return new Promise(async (resolve, reject) => {
    let settled = false;

    const cleanup = () => {
      settled = true;
    };

    const finalize = async (data = "") => {
      if (settled) return;
      cleanup();
      try {
        const cookies = await context.cookies();
        const cookieMap = {};
        for (const c of cookies) {
          cookieMap[c.name] = c.value;
        }
        const cookieStr = Object.entries(cookieMap)
          .map(([k, v]) => `${k}=${v}`)
          .join("; ");
        const pageUrl = page.url();
        const userAgent = await page.evaluate(() => navigator.userAgent).catch(() => "");
        await browser.close().catch(() => {});
        resolve({
          data: typeof data === "string" ? data : JSON.stringify(data),
          cookies: cookieStr,
          cookie: cookieStr,
          cookieMap,
          url: pageUrl,
          userAgent,
        });
      } catch (err) {
        await browser.close().catch(() => {});
        reject(err);
      }
    };

    const timeout = setTimeout(async () => {
      if (!settled) {
        cleanup();
        await browser.close().catch(() => {});
        reject(new Error("Cloudflare Turnstile challenge timed out"));
      }
    }, options.timeoutMs || 25000);

    try {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 });
    } catch {}

    if (options.injectedJavaScript) {
      try {
        await page.evaluate(options.injectedJavaScript);
      } catch {}
    }

    for (let s = 1; s <= 20; s++) {
      if (settled) break;
      await page.waitForTimeout(1000);
      if (settled) break;

      if (options.waitForCookie) {
        try {
          const cookies = await context.cookies();
          const target = cookies.find((c) => c.name === options.waitForCookie);
          if (target && target.value) {
            clearTimeout(timeout);
            finalize();
            break;
          }
        } catch {}
      }

      try {
        const token = await page.evaluate(() => {
          let t = null;
          if (window.turnstile) {
            try { t = window.turnstile.getResponse(); } catch {}
          }
          if (!t) {
            const inp = document.querySelector('input[name="cf-turnstile-response"]');
            if (inp && inp.value && inp.value.length > 20) t = inp.value;
          }
          return t;
        }).catch(() => null);

        if (token) {
          clearTimeout(timeout);
          finalize(token);
          break;
        }
      } catch {}
    }

    if (!settled) {
      clearTimeout(timeout);
      finalize();
    }
  });
}

const commonHeaders = defaultBrowserHeaders;

// ─── Kartoons Device Link Manager ───────────────────────────────────────────
let activeKartoonsDevice = null;
let kartoonsPollInterval = null;

async function getOrCreateKartoonsDeviceCode() {
  if (activeKartoonsDevice && Date.now() < activeKartoonsDevice.expiresAt - 30000) {
    return activeKartoonsDevice;
  }
  try {
    const res = await axios.post("https://api.kartoons.to/api/cloudstream/device/code", {}, {
      headers: {
        "User-Agent": defaultBrowserHeaders["user-agent"],
        "Origin": "https://kartoons.to",
        "Referer": "https://kartoons.to/",
      },
      timeout: 10000,
    });
    if (res.data?.success && res.data?.code) {
      const code = res.data.code;
      const expiresMs = (Number(res.data.expires_in) || 600) * 1000;
      activeKartoonsDevice = {
        code,
        linkUrl: `https://kartoons.to/cloudstream/link?code=${code}`,
        expiresAt: Date.now() + expiresMs,
        linked: false,
      };
      startKartoonsPoller(code);
      return activeKartoonsDevice;
    }
  } catch (err) {
    console.warn("[Kartoons] Failed to generate device code:", err.message);
  }
  return null;
}

function startKartoonsPoller(code) {
  if (kartoonsPollInterval) clearInterval(kartoonsPollInterval);
  kartoonsPollInterval = setInterval(async () => {
    try {
      if (!activeKartoonsDevice || activeKartoonsDevice.code !== code || Date.now() >= activeKartoonsDevice.expiresAt) {
        clearInterval(kartoonsPollInterval);
        kartoonsPollInterval = null;
        return;
      }
      const res = await axios.get(`https://api.kartoons.to/api/cloudstream/device/status?code=${encodeURIComponent(code)}`, {
        headers: {
          "User-Agent": defaultBrowserHeaders["user-agent"],
          "Origin": "https://kartoons.to",
          "Referer": "https://kartoons.to/",
        },
        timeout: 10000,
      });
      const data = res.data?.data || res.data;
      if (data?.status === "linked" && data?.token) {
        console.log(`[Kartoons] Device code ${code} approved! Persisting token.`);
        const session = {
          token: data.token.trim(),
          userAgent: defaultBrowserHeaders["user-agent"],
        };
        await kvStore.set("kartoons_device_session", session);
        activeKartoonsDevice.linked = true;
        clearInterval(kartoonsPollInterval);
        kartoonsPollInterval = null;
      } else if (data?.status === "expired") {
        clearInterval(kartoonsPollInterval);
        kartoonsPollInterval = null;
      }
    } catch (e) {}
  }, 3000);
}

const providerContext = {
  axios,
  cheerio,
  commonHeaders,
  kvStore,
  openWebView: async (url, options = {}) => {
    if (url.includes("kartoons.to") || options.title?.includes("Kartoons")) {
      const codeMatch = (options.description || "").match(/code\s+([A-Z0-9]{6})/i) || (url.match(/code=([A-Z0-9]{6})/i));
      const code = codeMatch ? codeMatch[1] : (activeKartoonsDevice?.code);
      if (code) {
        activeKartoonsDevice = {
          code,
          linkUrl: `https://kartoons.to/cloudstream/link?code=${code}`,
          expiresAt: Date.now() + 600000,
          linked: false,
        };
        startKartoonsPoller(code);
      }
      const saved = await kvStore.get("kartoons_device_session");
      if (saved?.token && saved.token !== "web_guest") {
        return {
          data: JSON.stringify({ kartoonsDevice: true, code: code || "LINKED", token: saved.token }),
          userAgent: saved.userAgent || defaultBrowserHeaders["user-agent"],
        };
      }
      throw new Error("Kartoons account linking needed. Please approve code on kartoons.to/cloudstream/link");
    }
    try {
      return await solveWithPlaywright(url, options);
    } catch (err) {
      console.warn(`[WAF Solver] Bypass failed for ${url}: ${err.message}`);
      throw new Error(`Cloudflare/WAF verification needed for upstream site: ${err.message}`);
    }
  },
  getCookies: async () => ({}),
  Aes,
};

function getProviderContext(providerName) {
  if (providerName !== "kartoons") return providerContext;
  return {
    ...providerContext,
    kvStore: {
      ...kvStore,
      get: async (key) => {
        const val = await kvStore.get(key);
        if (key === "kartoons_device_session") {
          if (val && typeof val === "object" && val.token) return val;
          return {
            token: "web_guest",
            userAgent: defaultBrowserHeaders["user-agent"],
          };
        }
        return val;
      },
    },
  };
}

// ─── Provider Discovery & Registry ──────────────────────────────────────────
const distDir = path.join(__dirname, "..", "dist");

function loadUrls() {
  try {
    if (fs.existsSync(urlsPath)) {
      return JSON.parse(fs.readFileSync(urlsPath, "utf-8"));
    }
  } catch (e) {
    console.warn("Could not load urls.json:", e.message);
  }
  return {};
}

function discoverProviders() {
  const registry = {};

  if (!fs.existsSync(distDir)) {
    console.error("dist/ directory not found. Please run 'npm run build' first.");
    return registry;
  }

  const dirs = fs
    .readdirSync(distDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  const endpoints = [
    "catalog",
    "posts",
    "meta",
    "stream",
    "episodes",
    "settings",
  ];

  for (const providerName of dirs) {
    const providerDir = path.join(distDir, providerName);
    const available = {};

    for (const ep of endpoints) {
      const filePath = path.join(providerDir, `${ep}.js`);
      if (fs.existsSync(filePath)) {
        try {
          delete require.cache[require.resolve(filePath)];
          available[ep] = require(filePath);
        } catch (err) {
          console.warn(`Failed to load ${providerName}/${ep}: ${err.message}`);
        }
      }
    }

    if (Object.keys(available).length > 0) {
      registry[providerName] = {
        name: providerName,
        endpoints: available,
        supportedEndpoints: Object.keys(available),
      };
    }
  }

  return registry;
}

let providers = discoverProviders();
let urls = loadUrls();

console.log(`[Vega API] Discovered and loaded ${Object.keys(providers).length} content providers.`);

// ─── Express App Setup ──────────────────────────────────────────────────────
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: "*" }));
app.use(express.json());

// Request logging middleware (silences video chunks, proxy, healthchecks, and assets)
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (
      !req.url.startsWith("/api/proxy") &&
      !req.url.startsWith("/api/health") &&
      !req.url.startsWith("/assets") &&
      !req.url.endsWith(".css") &&
      !req.url.endsWith(".js") &&
      !req.url.endsWith(".ico") &&
      !req.url.endsWith(".ts") &&
      !req.url.endsWith(".m3u8")
    ) {
      console.log(`[HTTP] ${req.method} ${req.url} ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
});

// Serve frontend static files
app.use(express.static(path.join(__dirname, "public")));
app.use("/assets", express.static(path.join(__dirname, "..", "assets")));

// ─── Manifest & Metadata ────────────────────────────────────────────────────
const manifestPath = path.join(__dirname, "..", "manifest.json");
function loadManifest() {
  try {
    if (fs.existsSync(manifestPath)) {
      return JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
    }
  } catch (e) {
    console.warn("Could not load manifest.json:", e.message);
  }
  return [];
}
let manifest = loadManifest();

// ─── Health & System Endpoints ──────────────────────────────────────────────
app.get("/api/health", (req, res) => {
  const mem = process.memoryUsage();
  res.json({
    status: "healthy",
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    providersCount: Object.keys(providers).length,
    memory: {
      rssMb: Math.round(mem.rss / 1024 / 1024),
      heapTotalMb: Math.round(mem.heapTotal / 1024 / 1024),
      heapUsedMb: Math.round(mem.heapUsed / 1024 / 1024),
    },
    kv: kvStore.getStats(),
  });
});

app.get("/api/debug-proxy", async (req, res) => {
  const targetUrl = req.query.url || "https://bcdnxw.hakunaymatata.com/resource/7f5e548580cb9377d874406794a006d8.mp4?sign=cb247797b53a651cbd8e1b021ed1231a&t=1792492637";
  const results = {
    hasCurl,
    nodeVersion: process.version,
    curlVersion: "",
    curlVerbose: "",
    outboundIp: "",
  };

  try {
    results.curlVersion = execSync("curl --version").toString().split("\n")[0];
  } catch (e) {
    results.curlVersion = "Error: " + e.message;
  }

  try {
    results.outboundIp = execSync("curl -s https://api.ipify.org").toString();
  } catch (e) {
    results.outboundIp = "Error: " + e.message;
  }

  try {
    const cmd = `curl -s -v --http2 -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36" -H "Referer: https://officialmoviebox.com/" -H "Origin: https://officialmoviebox.com" -r 0-10 "${targetUrl}" 2>&1`;
    results.curlVerbose = execSync(cmd, { timeout: 8000 }).toString("utf8").substring(0, 2000);
  } catch (e) {
    results.curlVerbose = "Error: " + e.message + (e.stdout ? "\n" + e.stdout.toString() : "");
  }

  res.json(results);
});

// ─── Providers Metadata Endpoints ────────────────────────────────────────────
app.get("/api/providers", (req, res) => {
  const enabledManifest = manifest.filter((m) => !m.disabled);

  // Map the 36 curated providers in exact order with logos and author
  const list = enabledManifest
    .map((m) => {
      const p = providers[m.value];
      if (!p) return null;
      const urlKey = Object.keys(urls).find(
        (k) => k.toLowerCase() === m.value.toLowerCase(),
      );

      const iconFilename = path.basename(m.icon || "");
      const localIcon = `/assets/${iconFilename || m.value + ".png"}`;

      return {
        id: m.value,
        name: m.value,
        displayName: m.display_name || m.value,
        version: m.version ? `v${m.version.replace(/^v/, "")}` : "v1.0",
        icon: localIcon,
        region: m.type ? m.type.charAt(0).toUpperCase() + m.type.slice(1) : "Global",
        author: "John Snow",
        endpoints: p.supportedEndpoints,
        hasCatalog: p.supportedEndpoints.includes("catalog"),
        hasPosts: p.supportedEndpoints.includes("posts"),
        hasMeta: p.supportedEndpoints.includes("meta"),
        hasStream: p.supportedEndpoints.includes("stream"),
        hasEpisodes: p.supportedEndpoints.includes("episodes"),
        hasSettings: p.supportedEndpoints.includes("settings"),
        url: urls[urlKey]?.url || urls[m.value]?.url || null,
      };
    })
    .filter(Boolean);

  res.json({
    total: list.length,
    providers: list,
  });
});

app.get("/api/providers/:provider", (req, res) => {
  const provider = providers[req.params.provider];
  if (!provider) {
    return res
      .status(404)
      .json({ error: `Provider '${req.params.provider}' not found.` });
  }

  const urlKey = Object.keys(urls).find(
    (k) => k.toLowerCase() === req.params.provider.toLowerCase(),
  );

  res.json({
    id: req.params.provider,
    name: req.params.provider,
    endpoints: provider.supportedEndpoints,
    hasCatalog: provider.supportedEndpoints.includes("catalog"),
    hasPosts: provider.supportedEndpoints.includes("posts"),
    hasMeta: provider.supportedEndpoints.includes("meta"),
    hasStream: provider.supportedEndpoints.includes("stream"),
    hasEpisodes: provider.supportedEndpoints.includes("episodes"),
    hasSettings: provider.supportedEndpoints.includes("settings"),
    url: urls[urlKey]?.url || urls[req.params.provider]?.url || null,
  });
});

// ─── Provider Endpoints ──────────────────────────────────────────────────────

// 1. Catalog Endpoint
app.get("/api/:provider/catalog", async (req, res) => {
  const provider = providers[req.params.provider];
  if (!provider?.endpoints?.catalog) {
    return res
      .status(404)
      .json({ error: `Catalog not supported by provider '${req.params.provider}'.` });
  }

  if (req.params.provider === "kartoons") {
    const saved = await kvStore.get("kartoons_device_session");
    if (!saved?.token || saved.token === "web_guest") {
      return res.json({
        provider: "kartoons",
        catalog: [
          { title: "Latest Shows", filter: "/catalog/show" },
          { title: "Latest Movies", filter: "/catalog/movie" },
          { title: "Popular Shows", filter: "/catalog/show?catalog=popular" },
          { title: "Popular Movies", filter: "/catalog/movie?catalog=popular" },
        ],
        genres: [],
      });
    }
  }

  try {
    const mod = provider.endpoints.catalog;
    let catalogData = mod.catalog || mod.default?.catalog;
    let genresData = mod.genres || mod.default?.genres;

    const controller = new AbortController();
    req.on("close", () => controller.abort());

    const activeContext = getProviderContext(req.params.provider);

    if (typeof catalogData === "function") {
      catalogData = await catalogData({
        providerContext: activeContext,
        signal: controller.signal,
      });
    }
    if (typeof genresData === "function") {
      genresData = await genresData({
        providerContext: activeContext,
        signal: controller.signal,
      });
    }

    res.json({
      provider: req.params.provider,
      catalog: catalogData || [],
      genres: genresData || [],
    });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to fetch catalog" });
  }
});

// 2. Posts (Browse) Endpoint
app.get("/api/:provider/posts", async (req, res) => {
  const provider = providers[req.params.provider];
  if (!provider?.endpoints?.posts) {
    return res
      .status(404)
      .json({ error: `Posts not supported by provider '${req.params.provider}'.` });
  }

  const { filter = "", page = "1", providerValue = "", clean = "true" } = req.query;

  try {
    const mod = provider.endpoints.posts;
    const getPosts = mod.getPosts || mod.default?.getPosts;

    if (!getPosts) {
      return res
        .status(404)
        .json({ error: "getPosts function not found in provider module." });
    }

    const controller = new AbortController();
    req.on("close", () => controller.abort());
    const timeout = setTimeout(() => controller.abort(), 40000);

    const posts = await getPosts({
      filter: String(filter),
      page: parseInt(page, 10) || 1,
      providerValue: String(providerValue || req.params.provider),
      signal: controller.signal,
      providerContext: getProviderContext(req.params.provider),
    });

    clearTimeout(timeout);

    const cleanedPosts =
      clean !== "false" && Array.isArray(posts) ? posts.map(cleanPost) : posts;

    res.json({
      provider: req.params.provider,
      filter: String(filter),
      page: parseInt(page, 10) || 1,
      total: Array.isArray(cleanedPosts) ? cleanedPosts.length : 0,
      posts: cleanedPosts || [],
    });
  } catch (err) {
    if (err.name === "AbortError") {
      return res.status(408).json({ error: "Request timed out after 40 seconds." });
    }
    res.status(500).json({ error: err.message || "Failed to fetch posts" });
  }
});

// 3. Search Posts Endpoint
app.get("/api/:provider/search", async (req, res) => {
  const provider = providers[req.params.provider];
  if (!provider?.endpoints?.posts) {
    return res
      .status(404)
      .json({ error: `Search not supported by provider '${req.params.provider}'.` });
  }

  const { q = "", page = "1", providerValue = "", clean = "true" } = req.query;

  if (!q) {
    return res
      .status(400)
      .json({ error: "Query parameter 'q' (search query) is required." });
  }

  try {
    const mod = provider.endpoints.posts;
    const getSearchPosts = mod.getSearchPosts || mod.default?.getSearchPosts;

    if (!getSearchPosts) {
      return res.status(404).json({
        error: `getSearchPosts function not found for provider '${req.params.provider}'.`,
      });
    }

    const controller = new AbortController();
    req.on("close", () => controller.abort());
    const timeout = setTimeout(() => controller.abort(), 40000);

    const posts = await getSearchPosts({
      searchQuery: String(q),
      page: parseInt(page, 10) || 1,
      providerValue: String(providerValue || req.params.provider),
      signal: controller.signal,
      providerContext: getProviderContext(req.params.provider),
    });

    clearTimeout(timeout);

    const cleanedPosts =
      clean !== "false" && Array.isArray(posts) ? posts.map(cleanPost) : posts;

    res.json({
      provider: req.params.provider,
      query: String(q),
      page: parseInt(page, 10) || 1,
      total: Array.isArray(cleanedPosts) ? cleanedPosts.length : 0,
      posts: cleanedPosts || [],
    });
  } catch (err) {
    if (err.name === "AbortError") {
      return res.status(408).json({ error: "Search request timed out." });
    }
    res.status(500).json({ error: err.message || "Search failed" });
  }
});

// 4. Meta Details Endpoint
app.get("/api/:provider/meta", async (req, res) => {
  const provider = providers[req.params.provider];
  if (!provider?.endpoints?.meta) {
    return res
      .status(404)
      .json({ error: `Meta not supported by provider '${req.params.provider}'.` });
  }

  const { link = "", clean = "true" } = req.query;
  if (!link) {
    return res
      .status(400)
      .json({ error: "Query parameter 'link' is required." });
  }

  let rawLink = String(link).trim();
  if (rawLink.startsWith("%7B") || rawLink.startsWith("%7b") || rawLink.startsWith("%22")) {
    try {
      rawLink = decodeURIComponent(rawLink);
    } catch {}
  }

  try {
    const mod = provider.endpoints.meta;
    const getMetaData =
      mod.getMetaData ||
      mod.getMeta ||
      mod.GetMetaData ||
      mod.default?.getMetaData ||
      mod.default?.getMeta;

    if (!getMetaData) {
      return res
        .status(404)
        .json({ error: "getMetaData/getMeta function not found in provider module." });
    }

    const meta = await getMetaData({
      link: rawLink,
      provider: req.params.provider,
      providerContext: getProviderContext(req.params.provider),
    });

    const cleanedMeta = clean !== "false" ? cleanMeta(meta) : meta;

    res.json({
      provider: req.params.provider,
      meta: cleanedMeta || {},
    });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to fetch metadata" });
  }
});

// ─── Stream Proxy Endpoint (MUST be before /api/:provider/stream) ─────────
app.options("/api/proxy/stream", (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "*");
  res.sendStatus(204);
});

app.options("/api/proxy/subtitle", (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "*");
  res.sendStatus(204);
});

function proxyWithCurl(targetUrl, reqHeaders, method, isDownload, filename, req, res) {
  const originReferer = reqHeaders["Referer"] || targetUrl;
  const args = [
    "-s",
    "-i",
    "--no-buffer",
    "--http2",
    "-H", `User-Agent: ${reqHeaders["User-Agent"] || defaultBrowserHeaders["User-Agent"]}`,
    "-H", `Referer: ${originReferer}`,
    "-H", `Origin: ${originReferer.replace(/\/+$/, "")}`,
    "-H", "Accept: */*",
    "-L",
    "--max-redirs", "5",
  ];

  if (method === "HEAD") {
    args.push("--head");
  } else if (req.headers && req.headers.range) {
    args.push("-r", req.headers.range.replace(/^bytes=/, ""));
  }

  args.push(targetUrl);

  const child = spawn("curl", args);
  let headerBuffer = Buffer.alloc(0);
  let headersParsed = false;

  child.stdout.on("data", (chunk) => {
    if (!headersParsed) {
      headerBuffer = Buffer.concat([headerBuffer, chunk]);
      const headerEnd = headerBuffer.indexOf("\r\n\r\n");
      if (headerEnd !== -1) {
        headersParsed = true;
        const headerText = headerBuffer.subarray(0, headerEnd).toString("utf8");
        const bodyRemainder = headerBuffer.subarray(headerEnd + 4);

        const lines = headerText.split("\r\n");
        let status = 200;
        const headers = {};

        for (const line of lines) {
          const statusMatch = line.match(/^HTTP\/\S+\s+(\d+)/);
          if (statusMatch) {
            status = parseInt(statusMatch[1], 10);
            continue;
          }
          const colon = line.indexOf(":");
          if (colon !== -1) {
            const k = line.substring(0, colon).trim().toLowerCase();
            const v = line.substring(colon + 1).trim();
            headers[k] = v;
          }
        }

        res.status(status);
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
        res.setHeader("Access-Control-Expose-Headers", "Content-Range, Content-Length, Accept-Ranges");

        ["content-type", "content-length", "content-range", "accept-ranges"].forEach((h) => {
          if (headers[h]) res.setHeader(h, headers[h]);
        });

        if (isDownload) {
          res.setHeader("Content-Disposition", `attachment; filename="${String(filename || "video.mp4").replace(/"/g, "")}"`);
        } else {
          res.setHeader("Content-Disposition", "inline");
        }

        const currType = (headers["content-type"] || "").toLowerCase();
        if (!currType || currType.includes("octet-stream") || currType.includes("text/html")) {
          res.setHeader("Content-Type", "video/mp4");
        }

        if (!headers["accept-ranges"]) {
          res.setHeader("Accept-Ranges", "bytes");
        }

        if (method === "HEAD") {
          try { child.kill("SIGKILL"); } catch {}
          return res.end();
        }

        if (bodyRemainder.length > 0) {
          res.write(bodyRemainder);
        }
        child.stdout.pipe(res);
      }
    }
  });

  child.on("error", (err) => {
    if (!res.headersSent && !res.writableEnded) {
      res.status(502).json({ error: `Curl stream proxy failed: ${err.message}` });
    }
  });

  req.on("close", () => {
    try { child.kill("SIGKILL"); } catch {}
  });
}

function proxyWithHttp2(targetUrl, reqHeaders, method, isDownload, filename, req, res) {
  try {
    const parsed = new URL(targetUrl);
    const client = http2.connect(`${parsed.protocol}//${parsed.host}`, {
      servername: parsed.hostname,
    });

    client.on("error", (err) => {
      if (hasCurl && !res.headersSent && !res.writableEnded) {
        return proxyWithCurl(targetUrl, reqHeaders, method, isDownload, filename, req, res);
      }
      if (!res.headersSent && !res.writableEnded) {
        res.status(502).json({ error: `HTTP2 stream proxy failed: ${err.message}` });
      }
    });

    const originReferer = reqHeaders["Referer"] || `${parsed.protocol}//${parsed.host}/`;
    const http2Headers = {
      ":method": method === "HEAD" ? "HEAD" : "GET",
      ":authority": parsed.hostname,
      ":scheme": parsed.protocol.replace(":", ""),
      ":path": `${parsed.pathname}${parsed.search}`,
      "user-agent": reqHeaders["User-Agent"] || defaultBrowserHeaders["User-Agent"],
      "referer": originReferer,
      "origin": originReferer.replace(/\/+$/, ""),
      "accept": "*/*",
      "accept-encoding": "identity",
    };

    if (reqHeaders["Range"]) {
      http2Headers["range"] = reqHeaders["Range"];
    }

    const h2Req = client.request(http2Headers);

    h2Req.on("response", (headers) => {
      const status = Number(headers[":status"]) || 200;
      if (status >= 400 && hasCurl && !res.headersSent && !res.writableEnded) {
        try { client.close(); } catch {}
        return proxyWithCurl(targetUrl, reqHeaders, method, isDownload, filename, req, res);
      }

      res.status(status);
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
      res.setHeader("Access-Control-Expose-Headers", "Content-Range, Content-Length, Accept-Ranges");

      ["content-type", "content-length", "content-range", "accept-ranges"].forEach((h) => {
        if (headers[h]) res.setHeader(h, headers[h]);
      });

      if (isDownload) {
        res.setHeader("Content-Disposition", `attachment; filename="${String(filename || "video.mp4").replace(/"/g, "")}"`);
      } else {
        res.setHeader("Content-Disposition", "inline");
      }

      const currType = (headers["content-type"] || "").toLowerCase();
      if (!currType || currType.includes("octet-stream")) {
        res.setHeader("Content-Type", "video/mp4");
      }

      if (!headers["accept-ranges"]) {
        res.setHeader("Accept-Ranges", "bytes");
      }

      if (method === "HEAD") {
        res.end();
        try { client.close(); } catch {}
      }
    });

    h2Req.pipe(res);

    h2Req.on("end", () => {
      try { client.close(); } catch {}
    });

    h2Req.on("error", () => {
      try { client.close(); } catch {}
    });

    res.on("close", () => {
      try {
        h2Req.destroy();
        client.close();
      } catch {}
    });
  } catch (err) {
    if (hasCurl && !res.headersSent && !res.writableEnded) {
      return proxyWithCurl(targetUrl, reqHeaders, method, isDownload, filename, req, res);
    }
    if (!res.headersSent && !res.writableEnded) {
      res.status(502).json({ error: `HTTP2 setup failed: ${err.message}` });
    }
  }
}

app.all("/api/proxy/stream", async (req, res) => {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "*");
    return res.sendStatus(204);
  }

  const { url, referer, cookie } = req.query;
  if (!url) {
    return res.status(400).json({ error: "Query parameter 'url' is required." });
  }

  const isDownload = req.query.download === "1" || req.query.download === "true";
  const filename = req.query.filename || "video.mp4";

  try {
    const targetUrl = String(url);
    let originReferer = referer ? String(referer) : "";
    try {
      const parsed = new URL(targetUrl);
      if (!originReferer) originReferer = `${parsed.protocol}//${parsed.host}/`;
    } catch {}

    // Special auto-referers for providers with strict CDN referer validation
    if (
      targetUrl.includes("hakunaymatata.com") ||
      targetUrl.includes("aoneroom.com") ||
      targetUrl.includes("officialmoviebox.com")
    ) {
      originReferer = "https://officialmoviebox.com/";
    } else if (targetUrl.includes("mxplayer.in") || targetUrl.includes("cloudfront.net/video/")) {
      originReferer = "https://www.mxplayer.in/";
    } else if (targetUrl.includes("googlevideo.com") || targetUrl.includes("youtube.com")) {
      originReferer = "https://www.youtube.com/";
    } else if (targetUrl.includes("net52.cc") || targetUrl.includes("makhi") || targetUrl.includes("freecdn") || targetUrl.includes("imgcdn.kim")) {
      originReferer = "https://net52.cc/home";
    } else if (targetUrl.includes("gofile.io")) {
      originReferer = "https://gofile.io/";
    } else if (targetUrl.includes("vegadrive") || targetUrl.includes("one.vegadrive.app")) {
      originReferer = "https://one.vegadrive.app/";
    } else if (targetUrl.includes("kartoons.to")) {
      originReferer = "https://kartoons.to/";
    } else if (
      targetUrl.includes("hscow.com") ||
      targetUrl.includes("fcxmb.com") ||
      targetUrl.includes("bhcxy.com") ||
      targetUrl.includes("fodcyy.com") ||
      targetUrl.includes("fhxod.com") ||
      targetUrl.includes("hlowb.com")
    ) {
      originReferer = "https://api.hlowb.com/";
    }

    const reqHeaders = {
      "User-Agent": defaultBrowserHeaders["User-Agent"],
      Referer: originReferer || targetUrl,
      Origin: originReferer ? originReferer.replace(/\/+$/, "") : targetUrl,
      Accept: "*/*",
      "Accept-Encoding": "identity",
    };

    if (cookie) {
      reqHeaders["Cookie"] = String(cookie);
    } else if (targetUrl.includes("net52.cc") || targetUrl.includes("makhi") || targetUrl.includes("freecdn")) {
      try {
        const cachedToken = (await kvStore.get("t_hash_t")) || (await kvStore.get("t_hash_t_data"))?.token;
        if (cachedToken) {
          reqHeaders["Cookie"] = `t_hash_t=${cachedToken}; hd=on; ott=nf`;
        }
      } catch {}
    }

    if (req.headers.range) {
      reqHeaders["Range"] = req.headers.range;
    }

    // ─── M3U8 HLS Master/Media Playlist Proxy & Rewriter ───────────────────
    const isM3u8Url = targetUrl.toLowerCase().includes(".m3u8") || targetUrl.toLowerCase().includes("/m3u8") || targetUrl.toLowerCase().includes("hls_variant");
    if (isM3u8Url && req.method !== "HEAD") {
      try {
        const m3u8Res = await axios({
          method: "get",
          url: targetUrl,
          responseType: "text",
          headers: reqHeaders,
          timeout: 25000,
          validateStatus: (s) => s >= 200 && s < 400,
        });

        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
        res.setHeader("Access-Control-Allow-Headers", "*");
        res.setHeader("Content-Type", "application/vnd.apple.mpegurl; charset=utf-8");

        const cookieParam = cookie ? `&cookie=${encodeURIComponent(cookie)}` : "";
        const lines = String(m3u8Res.data).split("\n");
        let hasDefaultAudio = false;

        const rewritten = lines.map((line) => {
          const trimmed = line.trim();
          if (!trimmed) return line;

          if (trimmed.startsWith("#")) {
            // Rewrite URI in tags e.g. #EXT-X-MEDIA:TYPE=AUDIO,...URI="..." or #EXT-X-MEDIA:TYPE=SUBTITLES,...URI="..." or #EXT-X-KEY:...URI="..." or #EXT-X-MAP:...URI="..."
            if (trimmed.includes('URI="')) {
              let tagLine = trimmed;
              // If this is an audio track and none has been marked default yet, enable default/autoselect on the first audio track
              if (tagLine.startsWith("#EXT-X-MEDIA:TYPE=AUDIO")) {
                if (!hasDefaultAudio && (tagLine.includes("DEFAULT=NO") || !tagLine.includes("DEFAULT="))) {
                  hasDefaultAudio = true;
                  tagLine = tagLine.replace(/DEFAULT=NO/g, "DEFAULT=YES").replace(/AUTOSELECT=NO/g, "AUTOSELECT=YES");
                }
              }

              return tagLine.replace(/URI="([^"]+)"/g, (_, rawUri) => {
                let absUri = rawUri;
                try { absUri = new URL(rawUri, targetUrl).href; } catch {}
                return `URI="/api/proxy/stream?url=${encodeURIComponent(absUri)}&referer=${encodeURIComponent(originReferer)}${cookieParam}"`;
              });
            }
            return line;
          }

          let absSeg = trimmed;
          try { absSeg = new URL(trimmed, targetUrl).href; } catch {}
          return `/api/proxy/stream?url=${encodeURIComponent(absSeg)}&referer=${encodeURIComponent(originReferer)}${cookieParam}`;
        });

        return res.send(rewritten.join("\n"));
      } catch (m3u8Err) {
        // Fall back to direct stream pipe below if text fetch fails
      }
    }

    // ─── Direct Media Range Stream Pipe (MP4 / MKV / TS / M4S / WOFF2) ─────
    let streamRes;
    try {
      streamRes = await axios({
        method: req.method === "HEAD" ? "head" : "get",
        url: targetUrl,
        responseType: "stream",
        headers: reqHeaders,
        timeout: 35000,
        maxRedirects: 5,
        validateStatus: (status) => status >= 200 && status < 400,
      });
    } catch (axiosErr) {
      // If server returned 426 Upgrade Required, automatically retry over curl or HTTP/2
      if (axiosErr.response?.status === 426 && !isM3u8Url && !res.headersSent) {
        if (hasCurl) {
          return proxyWithCurl(targetUrl, reqHeaders, req.method, isDownload, filename, req, res);
        }
        return proxyWithHttp2(targetUrl, reqHeaders, req.method, isDownload, filename, req, res);
      }
      throw axiosErr;
    }

    res.status(streamRes.status);
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "*");
    res.setHeader("Access-Control-Expose-Headers", "Content-Range, Content-Length, Accept-Ranges");

    const forwardHeaders = [
      "content-type",
      "content-length",
      "content-range",
      "accept-ranges",
    ];

    forwardHeaders.forEach((h) => {
      if (streamRes.headers[h]) {
        res.setHeader(h, streamRes.headers[h]);
      }
    });

    if (isDownload) {
      res.setHeader("Content-Disposition", `attachment; filename="${String(filename).replace(/"/g, '')}"`);
    } else {
      res.setHeader("Content-Disposition", "inline");
    }

    // ─── Correct Obfuscated MIME Types (NetMirror TS chunks disguised as .woff2 / .js; MX Player .m4s / .mp4; MKV)
    const lowerUrl = targetUrl.toLowerCase();
    const currType = (streamRes.headers["content-type"] || "").toLowerCase();

    if (
      lowerUrl.includes(".woff2") ||
      lowerUrl.includes(".woff") ||
      lowerUrl.includes(".ts") ||
      currType.includes("font/woff") ||
      (lowerUrl.includes(".jpg") && (lowerUrl.includes("hls_mps") || lowerUrl.includes("myhls_mps") || lowerUrl.includes("/hls/"))) ||
      (lowerUrl.includes(".js") && (lowerUrl.includes("/files/") || lowerUrl.includes("/a/") || lowerUrl.includes("makhi") || lowerUrl.includes("freecdn")))
    ) {
      // NetMirror / Castle TV MPEG-TS chunk disguised as woff2 font, js script, or jpg image
      res.setHeader("Content-Type", "video/mp2t");
    } else if (
      lowerUrl.includes(".m4s") ||
      lowerUrl.includes(".mp4") ||
      lowerUrl.includes(".m4v") ||
      lowerUrl.includes(".mkv") ||
      currType.includes("octet-stream") ||
      currType.includes("text/html")
    ) {
      // MP4, fragmented MP4, or Matroska container
      res.setHeader("Content-Type", "video/mp4");
    }

    if (!streamRes.headers["accept-ranges"]) {
      res.setHeader("Accept-Ranges", "bytes");
    }

    if (req.method === "HEAD") {
      return res.end();
    }

    req.on("close", () => {
      try { streamRes.data.destroy(); } catch {}
    });

    streamRes.data.pipe(res);
  } catch (err) {
    // Silently ignore client aborts / normal player seek closes so Railway logs aren't spammed
    if (
      err.code === "ECONNRESET" ||
      err.code === "ERR_CANCELED" ||
      err.code === "ECONNABORTED" ||
      err.message?.includes("aborted") ||
      err.message?.includes("premature close") ||
      res.writableEnded
    ) {
      return;
    }
    res.status(502).json({ error: `Stream proxy failed: ${err.message}` });
  }
});

// ─── Subtitle Proxy Endpoint (CORS bypass + WebVTT / SRT Converter) ───────────
app.get("/api/proxy/subtitle", async (req, res) => {
  const { url: targetUrl, referer } = req.query;
  if (!targetUrl) return res.status(400).send("Missing url parameter");

  try {
    const originReferer = referer ? String(referer) : String(targetUrl);
    const subHeaders = {
      "User-Agent": defaultBrowserHeaders["User-Agent"],
      Referer: originReferer,
      Accept: "*/*",
    };

    if (String(targetUrl).includes("userver") || String(originReferer).includes("netmirror") || String(targetUrl).includes("subscdn")) {
      try {
        const cachedToken = (await kvStore.get("t_hash_t")) || (await kvStore.get("t_hash_t_data"))?.token;
        if (cachedToken) {
          subHeaders["Cookie"] = `t_hash_t=${cachedToken}; user_token=${cachedToken}; hd=1`;
        }
      } catch {}
    }

    const subRes = await axios.get(String(targetUrl), {
      responseType: "text",
      headers: subHeaders,
      timeout: 10000,
    });

    let content = String(subRes.data || "");
    // Clean UTF-8 BOM and normalize line endings
    content = content.replace(/\r\n/g, "\n").replace(/\r/g, "\n").replace(/^\uFEFF/, "");

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "*");
    res.setHeader("Content-Type", "text/vtt; charset=utf-8");

    // If already starts with WEBVTT
    if (content.trim().startsWith("WEBVTT")) {
      return res.send(content);
    }

    // Convert SRT to WebVTT: replace comma with dot in timestamps (00:01:23,456 --> 00:01:23.456)
    const vttContent = "WEBVTT\n\n" + content.replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, "$1.$2");
    return res.send(vttContent);
  } catch (err) {
    res.status(502).send("Failed to proxy subtitle file");
  }
});

// 5. Stream Endpoint
app.get("/api/:provider/stream", async (req, res) => {
  const provider = providers[req.params.provider];
  if (!provider?.endpoints?.stream) {
    return res
      .status(404)
      .json({ error: `Stream not supported by provider '${req.params.provider}'.` });
  }

  let { link = "", type = "movie", download = "false", clean = "true" } = req.query;
  if (!link) {
    return res
      .status(400)
      .json({ error: "Query parameter 'link' is required." });
  }

  let rawLink = String(link).trim();
  if (rawLink.startsWith("%7B") || rawLink.startsWith("%7b") || rawLink.startsWith("%22")) {
    try {
      rawLink = decodeURIComponent(rawLink);
    } catch {}
  }

  try {
    const mod = provider.endpoints.stream;
    const getStream =
      mod.getStream ||
      mod.GetStream ||
      mod.mpGetStream ||
      mod.default?.getStream ||
      mod.default?.GetStream;

    if (!getStream) {
      return res
        .status(404)
        .json({ error: "getStream function not found in provider module." });
    }

    const controller = new AbortController();
    req.on("close", () => controller.abort());
    const timeout = setTimeout(() => controller.abort(), 60000);

    if (req.params.provider === "kartoons") {
      const saved = await kvStore.get("kartoons_device_session");
      if (!saved?.token || saved.token === "web_guest") {
        clearTimeout(timeout);
        const dev = await getOrCreateKartoonsDeviceCode();
        return res.json({
          provider: "kartoons",
          authRequired: true,
          code: dev?.code || "",
          linkUrl: dev?.linkUrl || "https://kartoons.to/cloudstream/link",
          message: `To stream from Kartoons, please open ${dev?.linkUrl || "https://kartoons.to/cloudstream/link"} and approve code ${dev?.code || ""}.`,
          streams: [],
        });
      }
    }

    const streams = await getStream({
      link: rawLink,
      type: String(type),
      signal: controller.signal,
      providerContext: getProviderContext(req.params.provider),
      isDownload: download === "true",
    });

    clearTimeout(timeout);

    const cleanedStreams =
      clean !== "false" && Array.isArray(streams)
        ? streams.map(cleanStream)
        : streams;

    res.json({
      provider: req.params.provider,
      type: String(type),
      total: Array.isArray(cleanedStreams) ? cleanedStreams.length : 0,
      streams: cleanedStreams || [],
    });
  } catch (err) {
    if (req.params.provider === "kartoons") {
      const isAuthErr = err.message && (
        err.message.includes("Open the Kartoons catalog") ||
        err.message.includes("rejected the device link") ||
        err.message.includes("Authentication required") ||
        err.message.includes("401")
      );
      if (isAuthErr) {
        await kvStore.delete("kartoons_device_session");
        activeKartoonsDevice = null;
        const dev = await getOrCreateKartoonsDeviceCode();
        return res.json({
          provider: "kartoons",
          authRequired: true,
          code: dev?.code || "",
          linkUrl: dev?.linkUrl || "https://kartoons.to/cloudstream/link",
          message: `Kartoons device link required. Please open ${dev?.linkUrl || "https://kartoons.to/cloudstream/link"} and approve code ${dev?.code || ""}.`,
          streams: [],
        });
      }
    }
    if (err.name === "AbortError") {
      return res.status(408).json({ error: "Stream extraction timed out after 60s." });
    }
    res.status(500).json({ error: err.message || "Failed to extract stream" });
  }
});

// 6. Episodes Endpoint
app.get("/api/:provider/episodes", async (req, res) => {
  const provider = providers[req.params.provider];
  if (!provider?.endpoints?.episodes) {
    return res
      .status(404)
      .json({ error: `Episodes not supported by provider '${req.params.provider}'.` });
  }

  const { url: episodeUrl = "", clean = "true" } = req.query;
  if (!episodeUrl) {
    return res
      .status(400)
      .json({ error: "Query parameter 'url' is required." });
  }

  let rawEpisodeUrl = String(episodeUrl).trim();
  if (rawEpisodeUrl.startsWith("%7B") || rawEpisodeUrl.startsWith("%7b") || rawEpisodeUrl.startsWith("%22")) {
    try {
      rawEpisodeUrl = decodeURIComponent(rawEpisodeUrl);
    } catch {}
  }

  try {
    const mod = provider.endpoints.episodes;
    const getEpisodeLinks =
      mod.getEpisodeLinks ||
      mod.getEpisodes ||
      mod.GetEpisodeLinks ||
      mod.default?.getEpisodeLinks ||
      mod.default?.getEpisodes;

    if (!getEpisodeLinks) {
      return res
        .status(404)
        .json({ error: "getEpisodeLinks/getEpisodes function not found in provider." });
    }

    const episodes = await getEpisodeLinks({
      url: rawEpisodeUrl,
      providerContext: getProviderContext(req.params.provider),
    });

    const cleanedEpisodes =
      clean !== "false" && Array.isArray(episodes)
        ? episodes.map(cleanEpisode)
        : episodes;

    res.json({
      provider: req.params.provider,
      total: Array.isArray(cleanedEpisodes) ? cleanedEpisodes.length : 0,
      episodes: cleanedEpisodes || [],
    });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to fetch episodes" });
  }
});

// ─── Kartoons Device Link Routes ───────────────────────────────────────────
app.get("/api/kartoons/link-status", async (req, res) => {
  const saved = await kvStore.get("kartoons_device_session");
  if (saved?.token && saved.token !== "web_guest") {
    return res.json({ linked: true, token: saved.token });
  }
  const dev = await getOrCreateKartoonsDeviceCode();
  res.json({
    linked: false,
    code: dev?.code || null,
    linkUrl: dev?.linkUrl || "https://kartoons.to/cloudstream/link",
    expiresIn: dev ? Math.max(0, Math.floor((dev.expiresAt - Date.now()) / 1000)) : 0,
  });
});

app.post("/api/kartoons/link-device", async (req, res) => {
  activeKartoonsDevice = null;
  const dev = await getOrCreateKartoonsDeviceCode();
  res.json({
    success: true,
    code: dev?.code || null,
    linkUrl: dev?.linkUrl || "https://kartoons.to/cloudstream/link",
  });
});

app.post("/api/kartoons/link-token", async (req, res) => {
  const { token } = req.body;
  if (!token || typeof token !== "string" || !token.trim()) {
    return res.status(400).json({ error: "Token is required" });
  }
  const session = {
    token: token.trim(),
    userAgent: defaultBrowserHeaders["user-agent"],
  };
  await kvStore.set("kartoons_device_session", session);
  res.json({ success: true, message: "Kartoons session token saved" });
});

// 7. Settings Endpoint
app.get("/api/:provider/settings", async (req, res) => {
  const provider = providers[req.params.provider];
  if (!provider?.endpoints?.settings) {
    return res
      .status(404)
      .json({ error: `Settings not supported by provider '${req.params.provider}'.` });
  }

  try {
    const mod = provider.endpoints.settings;
    const getSettingsSchema =
      mod.getSettingsSchema || mod.default?.getSettingsSchema;

    if (!getSettingsSchema) {
      return res.status(404).json({
        error: "getSettingsSchema function not found in provider module.",
      });
    }

    const schema = await getSettingsSchema({ providerContext });
    res.json({
      provider: req.params.provider,
      settings: schema || [],
    });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to get settings schema" });
  }
});

// ─── Free Persistent KV Store API ───────────────────────────────────────────
// Allows client inspection & management of configuration without paid KV services

app.get("/api/kv", (req, res) => {
  res.json({
    stats: kvStore.getStats(),
    data: kvStore.getAll(),
  });
});

app.get("/api/kv/:key", async (req, res) => {
  const value = await kvStore.get(req.params.key);
  if (value === undefined) {
    return res.status(404).json({ error: `Key '${req.params.key}' not found.` });
  }
  res.json({ key: req.params.key, value });
});

app.post("/api/kv/:key", async (req, res) => {
  const { value } = req.body;
  if (value === undefined) {
    return res
      .status(400)
      .json({ error: "Request body must contain 'value' field." });
  }
  await kvStore.set(req.params.key, value);
  res.json({ success: true, key: req.params.key, value });
});

app.delete("/api/kv/:key", async (req, res) => {
  const deleted = await kvStore.delete(req.params.key);
  res.json({ success: deleted, key: req.params.key });
});

app.post("/api/kv/clear", async (req, res) => {
  await kvStore.clear();
  res.json({ success: true, message: "KV store cleared." });
});

// ─── Hot-Reload Providers ────────────────────────────────────────────────────
app.post("/api/reload", (req, res) => {
  providers = discoverProviders();
  urls = loadUrls();
  res.json({
    message: "Providers and URLs reloaded successfully",
    providersCount: Object.keys(providers).length,
  });
});

// ─── Static Dist Access (if needed by React Native app) ─────────────────────
app.use("/dist", express.static(distDir));

// ─── Direct Route to Flim Baazy App (no caching to prevent stale page) ─────
app.get("/", (req, res) => {
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ─── API Documentation & Playground ─────────────────────────────────────────
app.get("/docs", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "docs.html"));
});

// ─── SPA Route Fallback ──────────────────────────────────────────────────────
app.get("*", (req, res) => {
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({ error: "API endpoint not found" });
  }
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ─── Global Error Handler ────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("[Unhandled Server Error]:", err);
  res.status(500).json({
    error: "Internal server error",
    message: err.message,
  });
});

// ─── Server Startup ──────────────────────────────────────────────────────────
app.listen(PORT, "0.0.0.0", () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║             ⚡ VEGA PROVIDERS API PLATFORM                ║
║                                                            ║
║  📡 Server URL:   http://localhost:${PORT}                   ║
║  📚 Documentation: http://localhost:${PORT}/docs             ║
║  🚀 Playground:   http://localhost:${PORT}/#playground       ║
║  🗄️ KV Store:     http://localhost:${PORT}/api/kv            ║
║  📦 Providers:    ${String(Object.keys(providers).length).padEnd(41)}║
║  ☁️ Deployment:   Railway Ready                            ║
╚════════════════════════════════════════════════════════════╝
  `);
});

module.exports = app;
