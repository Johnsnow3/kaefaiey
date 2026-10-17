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
} from "lucide-react";
import { Header } from "./components/Header";
import { Sidebar } from "./components/Sidebar";
import { MediaCard } from "./components/MediaCard";
import { MediaDetails } from "./components/MediaDetails";
import { VideoPlayer } from "./components/VideoPlayer";
import { WatchlistView } from "./components/WatchlistView";
import { Post, Provider, MediaStream } from "./types";
import {
  fetchProviders,
  fetchPosts,
  searchPosts,
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
    () => getActiveProvider() || "autoEmbed"
  );
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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

  // Sync watchlist count
  const handleWatchlistChange = useCallback(() => {
    setWatchlistCount(getWatchlist().length);
  }, []);

  // Initial load: fetch providers list
  useEffect(() => {
    async function init() {
      const provs = await fetchProviders();
      setProviders(provs);

      // Verify active provider is in list; otherwise select a rock-solid default
      const current = getActiveProvider();
      if (!current || !provs.some((p) => p.id === current)) {
        const fallback =
          provs.find((p) => p.id === "autoEmbed")?.id ||
          provs.find((p) => p.id === "flixhq")?.id ||
          provs[0]?.id ||
          "autoEmbed";
        setActiveProvider(fallback);
        saveActiveProvider(fallback);
      }
    }
    init();
  }, []);

  // Fetch posts when provider, activeTab, or page changes
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
        // Construct filter based on active tab
        let filter = "";
        if (activeTab === "movies") filter = "movie";
        else if (activeTab === "series") filter = "series";
        else if (activeTab === "anime") filter = "anime";

        const res = await fetchPosts(activeProvider, filter, page);
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
  }, [activeProvider, activeTab, searchQuery, page]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  // Provider selection
  const handleSelectProvider = (provId: string) => {
    setActiveProvider(provId);
    saveActiveProvider(provId);
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
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col font-sans selection:bg-violet-600 selection:text-white">
      {/* Main Header */}
      <Header
        activeTab={activeTab}
        onTabChange={handleTabChange}
        searchQuery={searchQuery}
        onSearch={handleSearch}
        onOpenSidebar={() => setIsSidebarOpen(true)}
        watchlistCount={watchlistCount}
        activeProviderName={activeProvider}
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
          {/* Active Provider Pill Banner (Mobile / Tablet quick glance) */}
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
            <div className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 space-y-6">
              {/* Category & Status Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
                <div className="flex items-center gap-2.5">
                  <TrendingUp className="w-5 h-5 text-violet-400" />
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white capitalize">
                    {searchQuery ? `Search: "${searchQuery}"` : `${activeTab} on ${activeProvider}`}
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

              {/* Error Message */}
              {error && (
                <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/60 flex items-start gap-3 text-rose-200">
                  <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-semibold">{error}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Try clicking "Change Provider" in the sidebar to choose another active source like{" "}
                      <span className="text-violet-400 font-mono">autoEmbed, flixhq, vega, filmyfly</span>.
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
    </div>
  );
};
