import React from "react";
import { Film, Search, ChevronDown, X } from "lucide-react";

interface HeaderProps {
  activeTab: string;
  onTabChange: (tab: any) => void;
  searchQuery: string;
  onSearchChange?: (q: string) => void;
  onSearchSubmit?: (q: string) => void;
  onSearch?: (q: string) => void;
  activeProvider: string;
  onOpenProviders: () => void;
  watchlistCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  onSearch,
  activeProvider,
  onOpenProviders,
}) => {
  const [mobileSearchOpen, setMobileSearchOpen] = React.useState(false);

  const handleQueryChange = (val: string) => {
    if (onSearchChange) onSearchChange(val);
    else if (onSearch) onSearch(val);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      if (onSearchSubmit) onSearchSubmit(searchQuery.trim());
      else if (onSearch) onSearch(searchQuery.trim());
    }
  };

  return (
    <header className="sticky top-0 z-30 w-full backdrop-blur-xl bg-[#09090b]/90 border-b border-zinc-800/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-4">
        {/* Left: Brand Logo */}
        <div
          onClick={() => onTabChange("home")}
          className="flex items-center gap-2.5 cursor-pointer select-none group"
        >
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-rose-600 via-red-600 to-amber-600 flex items-center justify-center shadow-md shadow-red-950/40 group-hover:scale-105 transition-transform">
            <Film className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <span className="text-lg sm:text-xl font-black tracking-tight text-white flex items-center gap-0.5 font-sans">
            Flim<span className="text-[#ff4d4d]">Baazy</span>
          </span>
        </div>

        {/* Center: Desktop Navigation Tabs */}
        <nav className="hidden lg:flex items-center gap-1 bg-zinc-900/80 p-1 rounded-2xl border border-zinc-800">
          {[
            { id: "home", label: "Home" },
            { id: "movies", label: "Movies" },
            { id: "series", label: "TV Shows" },
            { id: "anime", label: "Anime" },
            { id: "library", label: "Library" },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id as any)}
                className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-zinc-800 text-white shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Right: Search + Clean Single Provider Pill */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Desktop Search */}
          <form
            onSubmit={handleSubmit}
            className="hidden sm:flex relative items-center"
          >
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleQueryChange(e.target.value)}
              placeholder="Search titles..."
              className="w-48 md:w-60 pl-8 pr-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-rose-500 transition-all"
            />
          </form>

          {/* Mobile Search Toggle Icon */}
          <button
            onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
            className="sm:hidden p-2 rounded-full text-zinc-400 hover:text-white"
            title="Search"
          >
            {mobileSearchOpen ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
          </button>

          {/* Single Clean Provider Pill */}
          <button
            onClick={onOpenProviders}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-900 hover:bg-zinc-800 text-xs font-bold text-white border border-zinc-800 hover:border-zinc-700 transition-all shadow-sm active:scale-95"
            title="Select Provider Source"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono text-zinc-200 truncate max-w-[100px] sm:max-w-[140px]">
              {activeProvider}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
          </button>
        </div>
      </div>

      {/* Expandable Search Input for Mobile */}
      {mobileSearchOpen && (
        <div className="sm:hidden px-4 py-2 bg-[#121215] border-b border-zinc-800 animate-fadeIn">
          <form onSubmit={handleSubmit} className="relative flex items-center">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 pointer-events-none" />
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => handleQueryChange(e.target.value)}
              placeholder="Search movies, anime, series..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-rose-500"
            />
          </form>
        </div>
      )}
    </header>
  );
};
