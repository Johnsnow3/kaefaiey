import React, { useState } from "react";
import {
  Film,
  Menu,
  Search,
  Bookmark,
  Layers,
  Sparkles,
  X,
} from "lucide-react";

interface HeaderProps {
  activeTab: "home" | "movies" | "series" | "anime" | "watchlist";
  onTabChange: (tab: "home" | "movies" | "series" | "anime" | "watchlist") => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSearchSubmit: (q: string) => void;
  activeProvider: string;
  onOpenSidebar: () => void;
  watchlistCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  activeProvider,
  onOpenSidebar,
  watchlistCount,
}) => {
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSearchSubmit(searchQuery.trim());
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-[#090a0f]/85 border-b border-white/[0.08] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Mobile menu button + Brand Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenSidebar}
            className="p-2 -ml-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/[0.06] transition-colors focus:outline-none"
            title="Open Provider Sources Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div
            onClick={() => onTabChange("home")}
            className="flex items-center gap-2.5 cursor-pointer select-none group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform">
              <Film className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-white flex items-center gap-1 font-sans">
                Flim<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400">Baazy</span>
              </span>
            </div>
          </div>
        </div>

        {/* Center: Navigation Tabs (Desktop) */}
        <nav className="hidden md:flex items-center gap-1 bg-white/[0.04] p-1 rounded-2xl border border-white/[0.06]">
          {[
            { id: "home", label: "Discover" },
            { id: "movies", label: "Movies" },
            { id: "series", label: "TV Shows" },
            { id: "anime", label: "Anime" },
            { id: "watchlist", label: "Watchlist", count: watchlistCount },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id as any)}
                className={`relative px-4 py-1.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? "bg-gradient-to-r from-indigo-500 to-cyan-500 text-white shadow-md shadow-indigo-500/20"
                    : "text-gray-400 hover:text-gray-200 hover:bg-white/[0.04]"
                }`}
              >
                <span className="flex items-center gap-1.5">
                  {tab.label}
                  {tab.count !== undefined && tab.count > 0 && (
                    <span
                      className={`text-xs px-1.5 py-0.2 rounded-full font-semibold ${
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-indigo-500/20 text-indigo-400"
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Right: Search + Active Provider Pill */}
        <div className="flex items-center gap-2.5">
          {/* Desktop Search Bar */}
          <form
            onSubmit={handleSubmit}
            className="hidden sm:flex relative items-center"
          >
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search movies, anime, series..."
              className="w-56 lg:w-72 pl-9 pr-4 py-1.5 rounded-xl bg-white/[0.06] border border-white/[0.08] text-sm text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/80 transition-all"
            />
          </form>

          {/* Mobile Search Toggle */}
          <button
            onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
            className="sm:hidden p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/[0.06]"
          >
            {mobileSearchOpen ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
          </button>

          {/* Active Provider Selector Button */}
          <button
            onClick={onOpenSidebar}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-white/[0.06] to-white/[0.03] border border-indigo-500/30 hover:border-indigo-500/60 text-xs font-semibold text-gray-200 hover:text-white transition-all shadow-sm group"
            title="Switch Provider Source"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-gray-400 hidden xl:inline">Source:</span>
            <span className="text-cyan-300 font-mono tracking-tight font-bold group-hover:underline">
              {activeProvider}
            </span>
            <Layers className="w-3.5 h-3.5 text-gray-400 group-hover:text-indigo-400 transition-colors" />
          </button>
        </div>
      </div>

      {/* Mobile Search Expandable Bar */}
      {mobileSearchOpen && (
        <div className="sm:hidden px-4 py-2 bg-[#0d0f18] border-b border-white/[0.08]">
          <form onSubmit={handleSubmit} className="relative flex items-center">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 pointer-events-none" />
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search titles, actors, genres..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-white/[0.08] border border-white/[0.1] text-sm text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400"
            />
          </form>
        </div>
      )}
    </header>
  );
};
