const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const os = require("os");
const axios = require("axios");
const cheerio = require("cheerio");
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
const commonHeaders = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.5",
};

const providerContext = {
  axios,
  cheerio,
  commonHeaders,
  kvStore,
  openWebView: async () => {
    throw new Error(
      "openWebView is an interactive WebView dialog that requires a browser environment. It is bypassed in server API mode.",
    );
  },
  getCookies: async () => ({}),
  Aes: {},
};

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

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (
      !req.url.startsWith("/assets") &&
      !req.url.endsWith(".css") &&
      !req.url.endsWith(".js") &&
      !req.url.endsWith(".ico")
    ) {
      console.log(`[HTTP] ${req.method} ${req.url} ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
});

// Serve frontend static files
app.use(express.static(path.join(__dirname, "public")));

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

// ─── Providers Metadata Endpoints ────────────────────────────────────────────
app.get("/api/providers", (req, res) => {
  const list = Object.entries(providers).map(([key, p]) => {
    const urlKey = Object.keys(urls).find(
      (k) => k.toLowerCase() === key.toLowerCase(),
    );
    return {
      id: key,
      name: key,
      endpoints: p.supportedEndpoints,
      hasCatalog: p.supportedEndpoints.includes("catalog"),
      hasPosts: p.supportedEndpoints.includes("posts"),
      hasMeta: p.supportedEndpoints.includes("meta"),
      hasStream: p.supportedEndpoints.includes("stream"),
      hasEpisodes: p.supportedEndpoints.includes("episodes"),
      hasSettings: p.supportedEndpoints.includes("settings"),
      url: urls[urlKey]?.url || urls[key]?.url || null,
    };
  });

  res.json({
    total: list.length,
    providers: list.sort((a, b) => a.name.localeCompare(b.name)),
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

  try {
    const mod = provider.endpoints.catalog;
    let catalogData = mod.catalog || mod.default?.catalog;
    let genresData = mod.genres || mod.default?.genres;

    const controller = new AbortController();
    req.on("close", () => controller.abort());

    if (typeof catalogData === "function") {
      catalogData = await catalogData({
        providerContext,
        signal: controller.signal,
      });
    }
    if (typeof genresData === "function") {
      genresData = await genresData({
        providerContext,
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
      providerContext,
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
      providerContext,
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
      link: String(link),
      provider: req.params.provider,
      providerContext,
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

// 5. Stream Endpoint
app.get("/api/:provider/stream", async (req, res) => {
  const provider = providers[req.params.provider];
  if (!provider?.endpoints?.stream) {
    return res
      .status(404)
      .json({ error: `Stream not supported by provider '${req.params.provider}'.` });
  }

  const { link = "", type = "movie", download = "false", clean = "true" } = req.query;
  if (!link) {
    return res
      .status(400)
      .json({ error: "Query parameter 'link' is required." });
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

    const streams = await getStream({
      link: String(link),
      type: String(type),
      signal: controller.signal,
      providerContext,
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
      url: String(episodeUrl),
      providerContext,
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

// ─── SPA Route Fallback ──────────────────────────────────────────────────────
app.get("*", (req, res) => {
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({ error: "API endpoint not found" });
  }
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
