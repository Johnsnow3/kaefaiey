import React, { useEffect, useState, useCallback } from "react";
import {
  Film,
  Sparkles,
  Search,
  RefreshCw,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Tv,
  Layers,
  Activity,
  Menu,
  Play,
  X,
} from "lucide-react";
import { Header } from "./components/Header";
import { Sidebar } from "./components/Sidebar";
import { MediaCard } from "./components/MediaCard";
import { MediaDetails } from "./components/MediaDetails";
import { VideoPlayer } from "./components/VideoPlayer";
import { WatchlistView } from "./components/WatchlistView";
import { Post, Provider, MediaStream, CatalogCategory } from "./types";
import {
  fetchProviders,
  fetchPosts,
  searchPosts,
  fetchCatalog,
  testProviderHealth,
} from "./services/api";
import {
  getActiveProvider,
  setActiveProvider as saveActiveProvider,
  getWatchlist,
} from "./services/storage";

export const App: React.FC = () => {
  // Provider states
  const [providers, setProviders] = useState<Provider[]>([]);
  const [activeProvider, setActiveProvider] = useState<string>(
    () => getActiveProvider() || "vega"
  );
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Dynamic Catalog Categories for active provider
  const [categories, setCategories] = useState<CatalogCategory[]>([]);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>("");

  // Content feeds
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Watchlist badge state
  const [watchlistCount, setWatchlistCount] = useState(
    () => getWatchlist().length
  );

  // Media inspection & playback states
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [playingMedia, setPlayingMedia] = useState<{
    stream: MediaStream;
    allStreams: MediaStream[];
    title: string;
    poster?: string;
  } | null>(null);

  // M3U8 & Stream Player Tester states
  const [isM3u8TesterOpen, setIsM3u8TesterOpen] = useState(false);
  const [m3u8Url, setM3u8Url] = useState("");
  const [m3u8Referer, setM3u8Referer] = useState("");
  const [m3u8Title, setM3u8Title] = useState("");

  // Sync watchlist count
  const handleWatchlistChange = useCallback(() => {
    setWatchlistCount(getWatchlist().length);
  }, []);

  // Initial load: fetch providers list
  useEffect(() => {
    async function init() {
      const provs = await fetchProviders();
      setProviders(provs);

      // Verify active provider is in list; otherwise select a rock-solid default (vega or first with posts)
      const current = getActiveProvider();
      if (!current || !provs.some((p) => p.id === current)) {
        const fallback =
          provs.find((p) => p.id === "vega")?.id ||
          provs.find((p) => p.id === "flixhq")?.id ||
          provs.find((p) => p.id === "autoEmbed")?.id ||
          provs[0]?.id ||
          "vega";
        setActiveProvider(fallback);
        saveActiveProvider(fallback);
      }
    }
    init();
  }, []);

  // Fetch catalog categories whenever activeProvider changes
  useEffect(() => {
    async function loadCatalogCategories() {
      try {
        const cat = await fetchCatalog(activeProvider);
        if (cat && cat.length > 0) {
          const hasEmpty = cat.some((c: any) => c.filter === "");
          const fullList: CatalogCategory[] = hasEmpty
            ? cat
            : [{ title: "All", filter: "" }, ...cat];
          setCategories(fullList);
          setActiveCategoryFilter(fullList[0].filter);
        } else {
          setCategories([{ title: "All Content", filter: "" }]);
          setActiveCategoryFilter("");
        }
      } catch {
        setCategories([{ title: "All Content", filter: "" }]);
        setActiveCategoryFilter("");
      }
      setPage(1);
    }
    loadCatalogCategories();
  }, [activeProvider]);

  // Fetch posts when provider, category filter, activeTab, or page changes
  const loadPosts = useCallback(async () => {
    if (activeTab === "watchlist") return;
    setLoadingPosts(true);
    setError(null);

    try {
      if (searchQuery.trim()) {
        const res = await searchPosts(activeProvider, searchQuery, page);
        setPosts(res.posts);
        setHasMore(res.posts.length > 0);
      } else {
        const res = await fetchPosts(activeProvider, activeCategoryFilter, page);
        setPosts(res.posts);
        setHasMore(res.posts.length >= 10);
      }
    } catch (err: any) {
      console.error("Load posts error:", err);
      setError(
        `Failed to fetch content from provider "${activeProvider}". Please check your internet or switch to another provider.`
      );
    } finally {
      setLoadingPosts(false);
    }
  }, [activeProvider, activeCategoryFilter, activeTab, searchQuery, page]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  // Provider selection
  const handleSelectProvider = (provId: string) => {
    setActiveProvider(provId);
    saveActiveProvider(provId);
    setSearchQuery("");
    setPage(1);
    setIsSidebarOpen(false);
  };

  // Search trigger
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setPage(1);
    if (activeTab === "watchlist") setActiveTab("all");
  };

  // Tab switch
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setSearchQuery("");
    setPage(1);

    if (tab === "movies") {
      const match = categories.find((c) =>
        c.title.toLowerCase().includes("movie")
      );
      if (match) setActiveCategoryFilter(match.filter);
    } else if (tab === "series") {
      const match = categories.find(
        (c) =>
          c.title.toLowerCase().includes("series") ||
          c.title.toLowerCase().includes("show") ||
          c.title.toLowerCase().includes("tv")
      );
      if (match) setActiveCategoryFilter(match.filter);
    } else if (tab === "anime") {
      const match = categories.find((c) =>
        c.title.toLowerCase().includes("anime")
      );
      if (match) {
        setActiveCategoryFilter(match.filter);
      } else {
        // Switch to dedicated anime provider
        const animeProv =
          providers.find((p) => p.id === "hiAnime")?.id ||
          providers.find((p) => p.id === "kissKh")?.id ||
          providers.find((p) => p.id === "animesub")?.id;
        if (animeProv && animeProv !== activeProvider) {
          handleSelectProvider(animeProv);
        }
      }
    } else if (tab === "all") {
      if (categories.length > 0) {
        setActiveCategoryFilter(categories[0].filter);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col font-sans selection:bg-violet-600 selection:text-white">
      {/* Main Header */}
      <Header
        activeTab={activeTab}
        onTabChange={handleTabChange}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearchSubmit={handleSearch}
        onSearch={handleSearch}
        onOpenSidebar={() => setIsSidebarOpen(true)}
        watchlistCount={watchlistCount}
        activeProvider={activeProvider}
        activeProviderName={activeProvider}
        onOpenM3u8Tester={() => setIsM3u8TesterOpen(true)}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Responsive Side Menu Drawer */}
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          providers={providers}
          activeProvider={activeProvider}
          onSelectProvider={handleSelectProvider}
        />

        {/* Main Workspace Area */}
        <main className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">
          {/* Active Provider Banner (Mobile / Tablet quick glance) */}
          <div className="lg:hidden px-4 pt-3 pb-1 flex items-center justify-between bg-slate-900/60 border-b border-slate-800">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-white"
            >
              <Menu className="w-4 h-4 text-violet-400" />
              <span>
                Provider: <strong className="text-violet-400 uppercase">{activeProvider}</strong>
              </span>
            </button>
            <span className="text-[11px] text-slate-500">
              {providers.length} Sources Available
            </span>
          </div>

          {/* Watchlist View */}
          {activeTab === "watchlist" ? (
            <WatchlistView
              onSelectMedia={(item, prov) => {
                setActiveProvider(prov);
                saveActiveProvider(prov);
                setSelectedPost(item);
              }}
              onExplore={() => setActiveTab("all")}
            />
          ) : (
            /* Media Catalog & Search View */
            <div className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 space-y-5">
              {/* Category & Status Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-800/80">
                <div className="flex items-center gap-2.5">
                  <TrendingUp className="w-5 h-5 text-violet-400" />
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white capitalize">
                    {searchQuery ? `Search: "${searchQuery}"` : `${activeProvider} Catalog`}
                  </h1>
                  {!loadingPosts && (
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
                      Page {page}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => loadPosts()}
                    disabled={loadingPosts}
                    className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-colors"
                    title="Refresh content"
                  >
                    <RefreshCw className={`w-4 h-4 ${loadingPosts ? "animate-spin text-violet-400" : ""}`} />
                  </button>

                  <button
                    onClick={() => setIsSidebarOpen(true)}
                    className="px-3 py-1.5 rounded-xl bg-violet-600/10 hover:bg-violet-600/20 border border-violet-500/30 text-violet-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Change Provider</span>
                  </button>
                </div>
              </div>

              {/* Dynamic Catalog Categories Filter Bar */}
              {categories.length > 1 && !searchQuery && (
                <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-2 pt-1 -mx-1 px-1">
                  {categories.map((cat, idx) => {
                    const isActive = activeCategoryFilter === cat.filter;
                    return (
                      <button
                        key={idx}
                        onClick={() => {
                          setActiveCategoryFilter(cat.filter);
                          setPage(1);
                        }}
                        className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 flex items-center gap-1.5 ${
                          isActive
                            ? "bg-violet-600 text-white shadow-lg shadow-violet-600/30 scale-100"
                            : "bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800/80"
                        }`}
                      >
                        <span>{cat.title}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/60 flex items-start gap-3 text-rose-200">
                  <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-semibold">{error}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Try clicking "Change Provider" in the sidebar to choose another active source like{" "}
                      <span className="text-violet-400 font-mono">vega, autoEmbed, flixhq, filmyfly</span>.
                    </p>
                  </div>
                </div>
              )}

              {/* Cards Grid */}
              {loadingPosts ? (
                /* Skeleton Loader Grid */
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 sm:gap-4">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div
                      key={i}
                      className="rounded-xl overflow-hidden bg-slate-900/40 border border-slate-800/60 animate-pulse"
                    >
                      <div className="aspect-[2/3] bg-slate-800/50" />
                      <div className="p-3 space-y-2">
                        <div className="h-3.5 bg-slate-800 rounded w-3/4" />
                        <div className="h-3 bg-slate-800 rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : posts.length === 0 ? (
                /* Empty Results State */
                <div className="py-20 flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500">
                    <Film className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold text-white">No content found</h3>
                  <p className="text-sm text-slate-400">
                    {searchQuery
                      ? `No results for "${searchQuery}" on provider "${activeProvider}".`
                      : `Provider "${activeProvider}" did not return items for this category.`}
                  </p>
                  <button
                    onClick={() => setIsSidebarOpen(true)}
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-600/30 transition-all"
                  >
                    Switch to Another Provider
                  </button>
                </div>
              ) : (
                /* Content Grid */
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 sm:gap-4">
                  {posts.map((post, idx) => (
                    <MediaCard
                      key={`${post.link}-${idx}`}
                      item={post}
                      provider={activeProvider}
                      onSelect={(item) => setSelectedPost(item)}
                      onWatchlistChange={handleWatchlistChange}
                    />
                  ))}
                </div>
              )}

              {/* Pagination Controls */}
              {!loadingPosts && posts.length > 0 && (
                <div className="flex items-center justify-center gap-3 pt-8 pb-4">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 border border-slate-800 text-xs font-semibold text-slate-300 flex items-center gap-1.5 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </button>

                  <span className="px-3.5 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-mono font-medium text-violet-400">
                    {page}
                  </span>

                  <button
                    onClick={() => setPage((p) => p + 1)}
                    disabled={!hasMore}
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 border border-slate-800 text-xs font-semibold text-slate-300 flex items-center gap-1.5 transition-colors"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Media Details Modal */}
      {selectedPost && (
        <MediaDetails
          item={selectedPost}
          provider={activeProvider}
          onClose={() => setSelectedPost(null)}
          onPlay={(stream, allStreams, title, poster) => {
            setSelectedPost(null);
            setPlayingMedia({ stream, allStreams, title, poster });
          }}
          onWatchlistChange={handleWatchlistChange}
        />
      )}

      {/* Video Player Modal */}
      {playingMedia && (
        <VideoPlayer
          stream={playingMedia.stream}
          allStreams={playingMedia.allStreams}
          title={playingMedia.title}
          poster={playingMedia.poster}
          onClose={() => setPlayingMedia(null)}
        />
      )}

      {/* Built-in M3U8 & Stream Player Tester Modal */}
      {isM3u8TesterOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="fixed inset-0 -z-10" onClick={() => setIsM3u8TesterOpen(false)} />
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 text-slate-100 overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-violet-600/30 border border-violet-500/50 flex items-center justify-center text-violet-400">
                  <Play className="w-4 h-4 fill-current" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">M3U8 & Stream Player</h3>
                  <p className="text-xs text-slate-400">Play any .m3u8, .mp4, or .mkv stream with HLS & proxy</p>
                </div>
              </div>
              <button
                onClick={() => setIsM3u8TesterOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!m3u8Url.trim()) return;
                const url = m3u8Url.trim();
                const isHls = url.includes(".m3u8") || url.includes("/hls/");
                const isMkv = url.toLowerCase().includes(".mkv");
                const streamItem: MediaStream = {
                  server: "Custom M3U8 / Stream",
                  link: url,
                  type: isHls ? "m3u8" : isMkv ? "mkv" : "mp4",
                  headers: m3u8Referer.trim() ? { Referer: m3u8Referer.trim() } : undefined,
                };
                setIsM3u8TesterOpen(false);
                setPlayingMedia({
                  stream: streamItem,
                  allStreams: [streamItem],
                  title: m3u8Title.trim() || (isHls ? "Custom M3U8 Stream" : "Custom Video Stream"),
                });
              }}
              className="mt-4 space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Stream URL (.m3u8, .mp4, .mkv) *
                </label>
                <input
                  type="text"
                  required
                  value={m3u8Url}
                  onChange={(e) => setM3u8Url(e.target.value)}
                  placeholder="https://example.com/stream/playlist.m3u8"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Custom Referer / Origin (Optional)
                </label>
                <input
                  type="text"
                  value={m3u8Referer}
                  onChange={(e) => setM3u8Referer(e.target.value)}
                  placeholder="e.g. https://officialmoviebox.com/ or https://example.com/"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Streams requiring CDN Referer headers are automatically routed through our server-side M3U8 proxy rewriter.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Custom Title (Optional)
                </label>
                <input
                  type="text"
                  value={m3u8Title}
                  onChange={(e) => setM3u8Title(e.target.value)}
                  placeholder="e.g. My HLS Stream"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
                />
              </div>

              <div className="pt-2 flex flex-wrap items-center gap-1.5 text-xs text-slate-400">
                <span className="text-[11px]">Quick Tests:</span>
                <button
                  type="button"
                  onClick={() => {
                    setM3u8Url("https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8");
                    setM3u8Title("Big Buck Bunny (HLS)");
                  }}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-violet-300 text-[11px]"
                >
                  Big Buck Bunny (HLS)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setM3u8Url("https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4");
                    setM3u8Title("Big Buck Bunny (MP4)");
                  }}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[11px]"
                >
                  MP4 Sample
                </button>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsM3u8TesterOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-violet-600/30 flex items-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  Stream Now
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
