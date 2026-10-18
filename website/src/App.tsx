import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  ArrowLeft,
  ChevronRight,
  LayoutGrid,
  Search,
  Sparkles,
  TrendingUp,
  AlertCircle,
  Loader2,
  ChevronLeft,
  Play,
  X,
  Layers,
} from "lucide-react";
import { Header } from "./components/Header";
import { Sidebar } from "./components/Sidebar";
import { MediaCard } from "./components/MediaCard";
import { MediaDetails } from "./components/MediaDetails";
import { VideoPlayer } from "./components/VideoPlayer";
import { WatchlistView } from "./components/WatchlistView";
import { DownloadsView } from "./components/DownloadsView";
import { BottomNav, NavTab } from "./components/BottomNav";
import { Post, Provider, MediaStream, CatalogCategory } from "./types";
import {
  fetchProviders,
  fetchPosts,
  searchPosts,
  fetchCatalog,
} from "./services/api";
import {
  getActiveProvider,
  setActiveProvider as saveActiveProvider,
  getWatchlist,
} from "./services/storage";

interface CategoryRow {
  title: string;
  filter: string;
  posts: Post[];
  loading: boolean;
}

export const App: React.FC = () => {
  // Navigation & View States
  const [navTab, setNavTab] = useState<NavTab>("home");
  const [homeViewMode, setHomeViewMode] = useState<"sections" | "grid">("sections");

  // Providers state
  const [providers, setProviders] = useState<Provider[]>([]);
  const [activeProvider, setActiveProvider] = useState<string>(
    () => getActiveProvider() || "netflixMirror"
  );
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Multi-Category Rows for Home (Image 1)
  const [catalogCategories, setCatalogCategories] = useState<CatalogCategory[]>([]);
  const [categoryRows, setCategoryRows] = useState<CategoryRow[]>([]);
  const [loadingRows, setLoadingRows] = useState(true);

  // "See all" Grid State (Image 2)
  const [activeCategory, setActiveCategory] = useState<CatalogCategory | null>(null);
  const [gridPosts, setGridPosts] = useState<Post[]>([]);
  const [loadingGrid, setLoadingGrid] = useState(false);
  const [gridPage, setGridPage] = useState(1);
  const [gridHasMore, setGridHasMore] = useState(true);

  // Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Post[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const searchTimeoutRef = useRef<any>(null);

  // Watchlist Count
  const [watchlistCount, setWatchlistCount] = useState(
    () => getWatchlist().length
  );

  // Media Inspection & Playback
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [playingMedia, setPlayingMedia] = useState<{
    stream: MediaStream;
    allStreams: MediaStream[];
    title: string;
    subtitle?: string;
    poster?: string;
  } | null>(null);

  const handleWatchlistChange = useCallback(() => {
    setWatchlistCount(getWatchlist().length);
  }, []);

  // 1. Initial Load: Fetch Providers
  useEffect(() => {
    async function init() {
      const provs = await fetchProviders();
      setProviders(provs);

      const saved = getActiveProvider();
      if (!saved || !provs.some((p) => p.id === saved)) {
        const preferred =
          provs.find((p) => p.id === "netflixMirror")?.id ||
          provs.find((p) => p.id === "vega")?.id ||
          provs.find((p) => p.id === "flixhq")?.id ||
          provs[0]?.id ||
          "netflixMirror";
        setActiveProvider(preferred);
        saveActiveProvider(preferred);
      }
    }
    init();
  }, []);

  // 2. Load Multi-Category Rows when activeProvider changes
  useEffect(() => {
    let isMounted = true;
    async function loadProviderHome() {
      setLoadingRows(true);
      setCategoryRows([]);
      setHomeViewMode("sections");
      setActiveCategory(null);

      try {
        const catList = await fetchCatalog(activeProvider);
        if (!isMounted) return;

        setCatalogCategories(catList || []);

        // Categories to fetch rows for
        const targetCategories =
          catList && catList.length > 0
            ? catList.slice(0, 8)
            : [{ title: "Popular Content", filter: "" }];

        // Initialize placeholder skeleton rows
        setCategoryRows(
          targetCategories.map((c) => ({
            title: c.title,
            filter: c.filter,
            posts: [],
            loading: true,
          }))
        );

        // Fetch each category's items concurrently
        const results = await Promise.all(
          targetCategories.map(async (cat) => {
            try {
              const res = await fetchPosts(activeProvider, cat.filter, 1);
              return {
                title: cat.title,
                filter: cat.filter,
                posts: res.posts || [],
                loading: false,
              };
            } catch {
              return {
                title: cat.title,
                filter: cat.filter,
                posts: [],
                loading: false,
              };
            }
          })
        );

        if (isMounted) {
          const filled = results.filter((r) => r.posts.length > 0);
          setCategoryRows(
            filled.length > 0
              ? filled
              : results // Keep even if empty so title shows or fallback
          );
        }
      } catch (err) {
        console.error("Failed loading provider catalog rows:", err);
      } finally {
        if (isMounted) setLoadingRows(false);
      }
    }

    loadProviderHome();
    return () => {
      isMounted = false;
    };
  }, [activeProvider]);

  // 3. Load Grid Posts when user enters "See all" (Image 2)
  const loadCategoryGridPosts = useCallback(
    async (category: CatalogCategory, page: number) => {
      setLoadingGrid(true);
      try {
        const res = await fetchPosts(activeProvider, category.filter, page);
        if (page === 1) {
          setGridPosts(res.posts);
        } else {
          setGridPosts((prev) => [...prev, ...res.posts]);
        }
        setGridHasMore(res.posts.length >= 10);
      } catch (err) {
        console.error("Grid load error:", err);
      } finally {
        setLoadingGrid(false);
      }
    },
    [activeProvider]
  );

  const handleOpenSeeAll = (category: CatalogCategory) => {
    setActiveCategory(category);
    setGridPage(1);
    setHomeViewMode("grid");
    loadCategoryGridPosts(category, 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // 4. Live Search Effect
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(async () => {
      setLoadingSearch(true);
      try {
        const res = await searchPosts(activeProvider, searchQuery.trim(), 1);
        setSearchResults(res.posts || []);
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setLoadingSearch(false);
      }
    }, 350);

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchQuery, activeProvider]);

  const handleProviderSelect = (provId: string) => {
    setActiveProvider(provId);
    saveActiveProvider(provId);
    setIsSidebarOpen(false);
    setSearchQuery("");
  };

  // Extract featured items for top banner
  const featuredItems = categoryRows[0]?.posts?.slice(0, 5) || [];

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col font-sans selection:bg-rose-600 selection:text-white pb-20 sm:pb-0">
      {/* Top Header */}
      <Header
        activeTab={navTab}
        onTabChange={(tab) => {
          if (tab === "movies") {
            const match = catalogCategories.find((c) =>
              c.title.toLowerCase().includes("movie")
            );
            if (match) handleOpenSeeAll(match);
            else setNavTab("home");
          } else if (tab === "series") {
            const match = catalogCategories.find(
              (c) =>
                c.title.toLowerCase().includes("series") ||
                c.title.toLowerCase().includes("show") ||
                c.title.toLowerCase().includes("tv")
            );
            if (match) handleOpenSeeAll(match);
            else setNavTab("home");
          } else if (tab === "anime") {
            const animeProv = providers.find((p) =>
              ["hiAnime", "anikoto", "kissKh", "kickAssAnime"].includes(p.id)
            )?.id;
            if (animeProv && animeProv !== activeProvider) {
              handleProviderSelect(animeProv);
            }
            setNavTab("home");
          } else {
            setNavTab(tab);
            setHomeViewMode("sections");
          }
        }}
        searchQuery={searchQuery}
        onSearchChange={(q) => {
          setSearchQuery(q);
          if (navTab !== "search") setNavTab("search");
        }}
        activeProvider={activeProvider}
        onOpenProviders={() => setIsSidebarOpen(true)}
        watchlistCount={watchlistCount}
      />

      {/* Main Content Area */}
      <main className="flex-1 overflow-x-hidden flex flex-col">
        {/* ===================== TAB 1: HOME ===================== */}
        {navTab === "home" && (
          <>
            {/* VIEW MODE A: Multi-Category Horizontal Rows (Image 1) */}
            {homeViewMode === "sections" ? (
              <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-4 space-y-7 animate-fadeIn">
                {/* Top Featured Scrolling Cards (Matching Image 1 top bar) */}
                {featuredItems.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <div className="flex gap-2.5 overflow-x-auto no-scrollbar py-1">
                      {featuredItems.map((item, idx) => (
                        <div
                          key={idx}
                          onClick={() => setSelectedPost(item)}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900/90 border border-zinc-800 hover:border-zinc-700 cursor-pointer flex-shrink-0 transition-transform active:scale-95 group"
                        >
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold text-white uppercase ${
                              idx % 2 === 0 ? "bg-[#e50914]" : "bg-zinc-800 border border-zinc-700"
                            }`}
                          >
                            {idx % 2 === 0 ? "New Season" : "Watch Now"}
                          </span>
                          <span className="text-xs font-semibold text-zinc-200 group-hover:text-white truncate max-w-[140px] sm:max-w-[200px]">
                            {item.title}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Category Sections List (Matching Image 1) */}
                {loadingRows ? (
                  <div className="space-y-8 pt-4">
                    {[1, 2, 3].map((s) => (
                      <div key={s} className="space-y-3">
                        <div className="h-6 bg-zinc-800/60 rounded-md w-48 animate-pulse" />
                        <div className="flex gap-3 overflow-hidden">
                          {[1, 2, 3, 4, 5].map((i) => (
                            <div
                              key={i}
                              className="w-[124px] sm:w-[140px] aspect-[2/3] bg-zinc-800/40 rounded-2xl animate-pulse flex-shrink-0"
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : categoryRows.length > 0 ? (
                  categoryRows.map((row, rIdx) => (
                    <section key={rIdx} className="space-y-3">
                      {/* Section Header: Title on Left, "See all >" on Right */}
                      <div className="flex items-center justify-between">
                        <h2 className="text-base sm:text-xl font-bold text-white tracking-tight">
                          {row.title}
                        </h2>

                        <button
                          onClick={() =>
                            handleOpenSeeAll({
                              title: row.title,
                              filter: row.filter,
                            })
                          }
                          className="px-3 py-1 rounded-full bg-zinc-800/80 hover:bg-zinc-700 text-xs font-semibold text-zinc-300 hover:text-white flex items-center gap-1 transition-all active:scale-95"
                        >
                          <span>See all</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Horizontal Scrolling Row of Cards */}
                      <div className="relative">
                        <div className="flex gap-3 overflow-x-auto no-scrollbar py-1 scroll-smooth">
                          {row.posts.map((post, pIdx) => (
                            <MediaCard
                              key={pIdx}
                              item={post}
                              provider={activeProvider}
                              onSelect={(item) => setSelectedPost(item)}
                              layout="carousel"
                            />
                          ))}
                        </div>
                      </div>
                    </section>
                  ))
                ) : (
                  <div className="p-12 text-center text-zinc-500 space-y-2">
                    <p className="text-sm">No content rows returned by {activeProvider}.</p>
                    <button
                      onClick={() => setIsSidebarOpen(true)}
                      className="px-4 py-2 rounded-xl bg-zinc-800 text-white text-xs font-semibold"
                    >
                      Switch Provider
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* VIEW MODE B: "See all" Category Grid (Image 2) */
              <div className="w-full max-w-7xl mx-auto p-3 sm:p-6 space-y-4 animate-fadeIn">
                {/* Top Bar: Back Arrow, Title, Grid Toggle Icon */}
                <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setHomeViewMode("sections")}
                      className="p-2 -ml-2 rounded-full hover:bg-zinc-800 text-white transition-colors"
                      title="Back to Categories"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h1 className="text-lg sm:text-2xl font-bold text-white tracking-tight">
                      {activeCategory?.title || "Browse All"}
                    </h1>
                  </div>

                  <div className="p-2 text-zinc-400">
                    <LayoutGrid className="w-5 h-5 text-zinc-300" />
                  </div>
                </div>

                {/* 3-Column Mobile Grid, 4-6 on Desktop */}
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2.5 sm:gap-3.5">
                  {gridPosts.map((post, idx) => (
                    <MediaCard
                      key={idx}
                      item={post}
                      provider={activeProvider}
                      onSelect={(item) => setSelectedPost(item)}
                      layout="grid"
                    />
                  ))}
                </div>

                {/* Loading / Pagination */}
                {loadingGrid && (
                  <div className="flex items-center justify-center p-8 text-zinc-500 gap-2">
                    <Loader2 className="w-5 h-5 animate-spin text-[#ff4d4d]" />
                    <span className="text-xs">Loading items...</span>
                  </div>
                )}

                {!loadingGrid && gridHasMore && (
                  <div className="flex justify-center pt-4 pb-6">
                    <button
                      onClick={() => {
                        const nextPage = gridPage + 1;
                        setGridPage(nextPage);
                        if (activeCategory) {
                          loadCategoryGridPosts(activeCategory, nextPage);
                        }
                      }}
                      className="px-6 py-2.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-white transition-all shadow-md active:scale-95"
                    >
                      Load More
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* ===================== TAB 2: SEARCH ===================== */}
        {navTab === "search" && (
          <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 space-y-4 animate-fadeIn">
            {/* Search Input Bar */}
            <div className="relative">
              <Search className="w-5 h-5 text-zinc-400 absolute left-4 top-3.5 pointer-events-none" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search movies, anime, TV series, actors..."
                className="w-full pl-12 pr-10 py-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-rose-500 shadow-lg"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 top-3.5 p-0.5 text-zinc-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Live Search Results */}
            {loadingSearch ? (
              <div className="flex items-center justify-center p-12 text-zinc-500 gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-[#ff4d4d]" />
                <span className="text-xs">Searching {activeProvider}...</span>
              </div>
            ) : searchResults.length > 0 ? (
              <div className="space-y-3 pt-2">
                <span className="text-xs font-semibold text-zinc-400">
                  {searchResults.length} Results Found
                </span>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2.5 sm:gap-3.5">
                  {searchResults.map((post, idx) => (
                    <MediaCard
                      key={idx}
                      item={post}
                      provider={activeProvider}
                      onSelect={(item) => setSelectedPost(item)}
                      layout="grid"
                    />
                  ))}
                </div>
              </div>
            ) : searchQuery.trim() ? (
              <div className="p-12 text-center text-zinc-500 space-y-2">
                <p className="text-sm font-semibold text-zinc-400">No results found for "{searchQuery}"</p>
                <p className="text-xs">Try searching with a shorter title or switch provider.</p>
              </div>
            ) : (
              <div className="p-12 text-center text-zinc-500 space-y-2">
                <Search className="w-10 h-10 text-zinc-600 mx-auto" />
                <p className="text-sm font-semibold text-zinc-400">Type above to search across {activeProvider}</p>
              </div>
            )}
          </div>
        )}

        {/* ===================== TAB 3: LIBRARY (WATCHLIST) ===================== */}
        {navTab === "library" && (
          <WatchlistView
            onSelectMedia={(item, prov) => {
              setActiveProvider(prov);
              saveActiveProvider(prov);
              setSelectedPost(item);
            }}
            onExplore={() => setNavTab("home")}
          />
        )}

        {/* ===================== TAB 4: DOWNLOADS ===================== */}
        {navTab === "downloads" && (
          <DownloadsView
            onSelectMedia={(item, prov) => {
              setActiveProvider(prov);
              saveActiveProvider(prov);
              setSelectedPost(item);
            }}
            onExplore={() => setNavTab("home")}
          />
        )}

        {/* ===================== TAB 5: SETTINGS ===================== */}
        {navTab === "settings" && (
          <div className="w-full max-w-3xl mx-auto p-4 sm:p-6 space-y-6 animate-fadeIn pb-24 text-white">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <div>
                <h1 className="text-xl font-bold text-white">Settings & Providers</h1>
                <p className="text-xs text-zinc-400">Manage streaming sources and preferences</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-[#141416] border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-bold block text-white">Active Content Provider</span>
                    <span className="text-xs text-zinc-400">Current source for movies, series & anime</span>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-rose-600/20 text-[#ff4d4d] border border-rose-500/30 text-xs font-mono font-bold">
                    {activeProvider}
                  </span>
                </div>

                <button
                  onClick={() => setIsSidebarOpen(true)}
                  className="w-full py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-white flex items-center justify-center gap-2 transition-colors"
                >
                  <Layers className="w-4 h-4" />
                  <span>Browse All 60+ Providers & Run Live Tests</span>
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-[#141416] border border-zinc-800 space-y-2">
                <span className="text-sm font-bold block text-white">Player & Stream Engine</span>
                <p className="text-xs text-zinc-400">
                  Built-in Hls.js engine with server-side proxy rewriter for CORS bypass and custom Referer authorization.
                </p>
                <div className="flex items-center gap-2 pt-2 text-xs text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>M3U8 HLS Rewriter & MKV Stream Proxy Active</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Responsive Mobile Bottom Navigation Bar (Matching Image 1, 2, 3) */}
      <BottomNav
        activeTab={navTab}
        onTabChange={(tab) => {
          setNavTab(tab);
          if (tab === "home") setHomeViewMode("sections");
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        watchlistCount={watchlistCount}
      />

      {/* Provider Selector Modal / Drawer */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        providers={providers}
        activeProvider={activeProvider}
        onSelectProvider={handleProviderSelect}
      />

      {/* Media Details Fullscreen Modal (Matching Image 3) */}
      {selectedPost && (
        <MediaDetails
          item={selectedPost}
          provider={activeProvider}
          onClose={() => setSelectedPost(null)}
          onPlay={(stream, allStreams, title, poster) => {
            setSelectedPost(null);
            setPlayingMedia({
              stream,
              allStreams,
              title,
              subtitle: selectedPost.cornerTag || selectedPost.tag,
              poster,
            });
          }}
          onSearchRelated={(title) => {
            setSelectedPost(null);
            setSearchQuery(title);
            setNavTab("search");
          }}
          onWatchlistChange={handleWatchlistChange}
        />
      )}

      {/* Fullscreen Landscape Video Player (Matching Image 4 & 5) */}
      {playingMedia && (
        <VideoPlayer
          stream={playingMedia.stream}
          allStreams={playingMedia.allStreams}
          title={playingMedia.title}
          subtitle={playingMedia.subtitle}
          poster={playingMedia.poster}
          onClose={() => setPlayingMedia(null)}
        />
      )}
    </div>
  );
};
