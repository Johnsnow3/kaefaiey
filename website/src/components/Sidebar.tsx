import React, { useState } from "react";
import {
  X,
  Search,
  Activity,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Loader2,
  Sparkles,
  Server,
  Zap,
} from "lucide-react";
import { Provider, ProviderHealth } from "../types";
import { testProviderHealth } from "../services/api";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  providers: Provider[];
  activeProvider: string;
  onSelectProvider: (providerId: string) => void;
}

// Curated categorizations for easy discovery
const CATEGORIES = [
  { id: "all", label: "All Sources" },
  { id: "featured", label: "Recommended" },
  { id: "anime", label: "Anime" },
  { id: "hindi", label: "Bollywood/Hindi" },
  { id: "hollywood", label: "Hollywood/Global" },
];

const ANIME_PROVIDERS = new Set([
  "anikoto",
  "animesalt",
  "animesub",
  "animetsu",
  "animeworld",
  "animerulz",
  "hiAnime",
  "kartoons",
  "kickAssAnime",
  "kissKh",
  "tokyoInsider",
]);

const HINDI_PROVIDERS = new Set([
  "vega",
  "hdhub4u",
  "4khdhub",
  "1cinevood",
  "cinevood",
  "kmMovies",
  "luxMovies",
  "filmyfly",
  "katmovies",
  "katmoviefix",
  "moviezwap",
  "movies4u",
  "mod",
  "skyMovieHD",
  "uhd",
  "world4u",
  "zeefliz",
  "mxplayer",
]);

const FEATURED_PROVIDERS = new Set([
  "vega",
  "torrentio",
  "autoEmbed",
  "showbox",
  "anikoto",
  "eonMovies",
  "dramacool",
  "kissKh",
  "movieBox",
  "ridoMovies",
]);

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  providers,
  activeProvider,
  onSelectProvider,
}) => {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [healthMap, setHealthMap] = useState<Record<string, ProviderHealth>>({});

  if (!isOpen) return null;

  const handleTest = async (e: React.MouseEvent, providerId: string) => {
    e.stopPropagation();
    setHealthMap((prev) => ({
      ...prev,
      [providerId]: { status: "testing" },
    }));

    const result = await testProviderHealth(providerId);
    setHealthMap((prev) => ({
      ...prev,
      [providerId]: result,
    }));
  };

  const filteredProviders = providers.filter((p) => {
    // 1. Text Search Filter
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.id.toLowerCase().includes(search.toLowerCase()) ||
      (p.url && p.url.toLowerCase().includes(search.toLowerCase()));
    if (!matchesSearch) return false;

    // 2. Category Filter
    if (activeCategory === "featured") return FEATURED_PROVIDERS.has(p.id);
    if (activeCategory === "anime") return ANIME_PROVIDERS.has(p.id);
    if (activeCategory === "hindi") return HINDI_PROVIDERS.has(p.id);
    if (activeCategory === "hollywood") {
      return (
        !ANIME_PROVIDERS.has(p.id) &&
        !HINDI_PROVIDERS.has(p.id)
      );
    }
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
      />

      {/* Slide-out Drawer */}
      <div className="relative w-full max-w-md bg-[#0d0f18] border-r border-white/[0.1] shadow-2xl flex flex-col h-full z-10">
        {/* Drawer Header */}
        <div className="p-4 border-b border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Server className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Provider Sources
              </h2>
              <p className="text-xs text-gray-400">
                Switch source & test live availability
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Providers Input */}
        <div className="p-3 border-b border-white/[0.06]">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter 60+ providers..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500 transition-colors"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-2.5 text-xs text-gray-400 hover:text-white"
              >
                Clear
              </button>
            )}
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 mt-2.5 overflow-x-auto pb-1 scrollbar-none">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`text-xs px-2.5 py-1 rounded-lg whitespace-nowrap font-medium transition-colors ${
                  activeCategory === cat.id
                    ? "bg-indigo-500 text-white font-semibold shadow-sm"
                    : "bg-white/[0.04] text-gray-400 hover:text-gray-200"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Provider List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {filteredProviders.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-xs">
              No providers match "{search}".
            </div>
          ) : (
            filteredProviders.map((p) => {
              const isSelected = activeProvider === p.id;
              const health = healthMap[p.id] || { status: "idle" };

              return (
                <div
                  key={p.id}
                  onClick={() => {
                    onSelectProvider(p.id);
                    onClose();
                  }}
                  className={`group relative p-3 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? "bg-gradient-to-r from-indigo-900/40 to-cyan-900/20 border-cyan-500/50 shadow-md shadow-indigo-500/10"
                      : "bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.06] hover:border-white/[0.12]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    {/* Provider Info */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <img
                        src={p.icon || `/assets/${p.id}.png`}
                        alt={p.displayName || p.name}
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = "none";
                        }}
                        className="w-11 h-11 rounded-xl object-cover shadow bg-zinc-900 border border-white/10 flex-shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors truncate">
                            {p.displayName || p.name}
                          </span>
                          <span className="text-[10px] text-zinc-400 font-mono">
                            {p.version || "v1.0"}
                          </span>
                          {isSelected && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-cyan-400/20 text-cyan-300 border border-cyan-400/30">
                              ACTIVE
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-[10px] text-zinc-400 mt-0.5">
                          <span>{p.region || "Global"}</span>
                          <span>•</span>
                          <span>{p.author || "John Snow"}</span>
                        </div>
                      </div>
                    </div>

                    {/* Test Button & Health Badge */}
                    <div className="flex flex-col items-end gap-1.5">
                      <button
                        onClick={(e) => handleTest(e, p.id)}
                        disabled={health.status === "testing"}
                        className={`text-xs px-2.5 py-1 rounded-xl font-medium flex items-center gap-1.5 transition-all border ${
                          health.status === "testing"
                            ? "bg-white/[0.05] text-gray-400 border-white/[0.05]"
                            : health.status === "online"
                            ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/25"
                            : health.status === "offline"
                            ? "bg-rose-500/15 text-rose-300 border-rose-500/30 hover:bg-rose-500/25"
                            : "bg-white/[0.06] text-gray-300 border-white/[0.1] hover:bg-indigo-600 hover:text-white hover:border-indigo-500"
                        }`}
                        title="Test if provider is working right now"
                      >
                        {health.status === "testing" ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin text-indigo-400" />
                            <span>Testing...</span>
                          </>
                        ) : health.status === "online" ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            <span>{health.latencyMs}ms</span>
                          </>
                        ) : health.status === "offline" ? (
                          <>
                            <AlertCircle className="w-3 h-3 text-rose-400" />
                            <span>Offline</span>
                          </>
                        ) : (
                          <>
                            <Activity className="w-3 h-3" />
                            <span>Test</span>
                          </>
                        )}
                      </button>

                      {health.message && health.status !== "testing" && (
                        <span className="text-[10px] text-gray-400 font-mono">
                          {health.message}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Drawer Footer Status */}
        <div className="p-3 border-t border-white/[0.08] bg-black/30 flex items-center justify-between text-xs text-gray-400">
          <span>{providers.length} Providers Configured</span>
          <a
            href="/docs"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 text-indigo-400 hover:underline"
          >
            <span>API Docs</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
};
