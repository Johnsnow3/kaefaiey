const fs = require("fs");
const path = require("path");

/**
 * Free, zero-dependency persistent Key-Value Store for Vega Providers.
 * Replaces external paid KV stores (like Cloudflare KV, Vercel KV, Upstash)
 * with a high-performance in-memory cache backed by a local JSON file.
 *
 * Implements the ProviderKvStore interface:
 *   get<T>(key): Promise<T | undefined>
 *   set(key, value): Promise<void>
 *   delete(key): Promise<boolean>
 *   keys(): Promise<string[]>
 *   clear(): Promise<void>
 */
class PersistentKvStore {
  constructor(filePath) {
    this.filePath = filePath || path.join(__dirname, "..", "data", "kv-store.json");
    this.memory = new Map();
    this.saveTimeout = null;
    this.init();
  }

  init() {
    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, "utf-8");
        const parsed = JSON.parse(raw);
        for (const [k, v] of Object.entries(parsed)) {
          this.memory.set(k, v);
        }
        console.log(`[KV Store] Loaded ${this.memory.size} keys from ${this.filePath}`);
      } else {
        // Pre-populate sensible defaults for providers
        this.populateDefaults();
        this.saveSync();
      }
    } catch (err) {
      console.warn(`[KV Store] Init warning: ${err.message}. Running in memory-only mode.`);
      this.populateDefaults();
    }
  }

  populateDefaults() {
    const defaults = {
      preferredQuality: "1080",
      preferredDownloadServer: "auto",
      vega_quickDownload: true,
      vega_skipTimings: true,
      vega_preferredDownloadServer: "auto",
      katMovieFix_quickDownload: true,
      kmMovies_quickDownload: true,
      kmMovies_skipTimings: true,
      hdhub4u_quickDownload: true,
      hdhub4u_skipTimings: true,
      eonMovies_quickDownload: true,
      katmovies_quickDownload: true,
      katmovies_skipTimings: true,
      skyMovieHD_quickDownload: true,
      Joya9tv_quickDownload: true,
      cinefreak_quickDownload: true,
      cinefreak_skipTimings: true,
      cinefreak_preferredDownloadServer: "auto",
      mkvDrama_quickDownload: true,
      "4khdhub_quickDownload": true,
      drive_quickDownload: true,
      drive_skipTimings: true,
      luxMovies_quickDownload: true,
      luxMovies_skipTimings: true,
      topmovies_skipTimings: true,
      "1cinevood_quickDownload": true,
      "1cinevood_skipTimings": true,
      anikoto_skipTimings: true,
      zeefliz_quickDownload: true,
      zeefliz_skipTimings: true,
      movies4u_quickDownload: true,
      movies4u_skipTimings: true,
      cinemaLuxe_quickDownload: true,
      autoEmbed_skipTimings: true,
      torrentio_skipTimings: true,
    };

    for (const [k, v] of Object.entries(defaults)) {
      if (!this.memory.has(k)) {
        this.memory.set(k, v);
      }
    }
  }

  scheduleSave() {
    if (this.saveTimeout) return;
    this.saveTimeout = setTimeout(() => {
      this.saveTimeout = null;
      this.saveSync();
    }, 500);
  }

  saveSync() {
    try {
      const obj = {};
      for (const [k, v] of this.memory.entries()) {
        obj[k] = v;
      }
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      // Atomic write via temp file
      const tempPath = `${this.filePath}.tmp.${Date.now()}`;
      fs.writeFileSync(tempPath, JSON.stringify(obj, null, 2), "utf-8");
      fs.renameSync(tempPath, this.filePath);
    } catch (err) {
      console.error(`[KV Store] Failed to persist data: ${err.message}`);
    }
  }

  async get(key) {
    if (!this.memory.has(key)) return undefined;
    return this.memory.get(key);
  }

  async set(key, value) {
    this.memory.set(key, value);
    this.scheduleSave();
  }

  async delete(key) {
    const existed = this.memory.delete(key);
    if (existed) {
      this.scheduleSave();
    }
    return existed;
  }

  async keys() {
    return Array.from(this.memory.keys());
  }

  async clear() {
    this.memory.clear();
    this.scheduleSave();
  }

  // Synchronous / Inspection helpers for API & Dashboard
  getAll() {
    const obj = {};
    for (const [k, v] of this.memory.entries()) {
      obj[k] = v;
    }
    return obj;
  }

  getStats() {
    return {
      totalKeys: this.memory.size,
      filePath: this.filePath,
      fileSize: fs.existsSync(this.filePath) ? fs.statSync(this.filePath).size : 0,
    };
  }
}

module.exports = { PersistentKvStore };
