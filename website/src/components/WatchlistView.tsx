import React, { useState } from "react";
import { Bookmark, Film, Tv, Trash2, Play, Sparkles } from "lucide-react";
import { WatchlistItem, Post } from "../types";
import { getWatchlist, removeFromWatchlist, clearWatchlist } from "../services/storage";

interface WatchlistViewProps {
  onSelectMedia: (item: Post, provider: string) => void;
  onExplore: () => void;
}

export const WatchlistView: React.FC<WatchlistViewProps> = ({
  onSelectMedia,
  onExplore,
}) => {
  const [items, setItems] = useState<WatchlistItem[]>(() => getWatchlist());
  const [filter, setFilter] = useState<"all" | "movie" | "series">("all");

  const handleRemove = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    removeFromWatchlist(id);
    setItems(getWatchlist());
  };

  const handleClearAll = () => {
    if (window.confirm("Are you sure you want to clear your entire watchlist?")) {
      clearWatchlist();
      setItems([]);
    }
  };

  const filteredItems = items.filter((item) => {
    if (filter === "all") return true;
    return item.type === filter;
  });

  return (
    <div className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 space-y-6 animate-fadeIn">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <Bookmark className="w-6 h-6 text-violet-400 fill-violet-400/20" />
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              My Watchlist
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-violet-600/20 text-violet-300 border border-violet-500/30">
              {items.length}
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Saved movies and shows for offline and quick streaming across all providers.
          </p>
        </div>

        {items.length > 0 && (
          <div className="flex items-center gap-3">
            {/* Filter Tabs */}
            <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-xl text-xs font-medium">
              <button
                onClick={() => setFilter("all")}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  filter === "all"
                    ? "bg-violet-600 text-white font-semibold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                All ({items.length})
              </button>
              <button
                onClick={() => setFilter("movie")}
                className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 ${
                  filter === "movie"
                    ? "bg-violet-600 text-white font-semibold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Film className="w-3 h-3" />
                Movies
              </button>
              <button
                onClick={() => setFilter("series")}
                className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 ${
                  filter === "series"
                    ? "bg-violet-600 text-white font-semibold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Tv className="w-3 h-3" />
                Shows
              </button>
            </div>

            <button
              onClick={handleClearAll}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 border border-slate-800 transition-colors"
              title="Clear all saved items"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Content Grid or Empty State */}
      {filteredItems.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-4">
          <div className="w-20 h-20 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-center text-violet-400 shadow-xl">
            <Bookmark className="w-10 h-10 stroke-[1.5]" />
          </div>
          <h2 className="text-xl font-bold text-white">Your watchlist is empty</h2>
          <p className="text-sm text-slate-400">
            Find movies, series, and anime from any provider and click the bookmark button to save them here.
          </p>
          <button
            onClick={onExplore}
            className="px-6 py-2.5 rounded-xl font-semibold text-sm bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-600/30 transition-all flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            Explore Content
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 sm:gap-4">
          {filteredItems.map((item) => {
            const post: Post = {
              title: item.title,
              link: item.link,
              image: item.image,
              tag: item.tag,
            };

            return (
              <div
                key={item.id}
                onClick={() => onSelectMedia(post, item.provider)}
                className="group relative flex flex-col cursor-pointer rounded-xl overflow-hidden bg-slate-900/60 border border-slate-800/80 hover:border-violet-500/50 hover:shadow-2xl hover:shadow-violet-950/40 hover:-translate-y-1.5 transition-all duration-300"
              >
                {/* Poster */}
                <div className="relative aspect-[2/3] w-full overflow-hidden bg-slate-950">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.title}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-3 text-slate-500">
                      <Film className="w-10 h-10 mb-2 opacity-50" />
                      <span className="text-xs text-center font-medium line-clamp-3">
                        {item.title}
                      </span>
                    </div>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-80" />

                  {/* Provider Pill */}
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-violet-600/90 text-white shadow-md backdrop-blur-sm">
                    {item.provider}
                  </span>

                  {/* Remove Button */}
                  <button
                    onClick={(e) => handleRemove(item.id, e)}
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-slate-950/70 hover:bg-rose-600 text-slate-300 hover:text-white transition-colors"
                    title="Remove from Watchlist"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  {/* Play overlay icon */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="w-10 h-10 rounded-full bg-violet-600 text-white flex items-center justify-center shadow-lg shadow-violet-600/50 scale-75 group-hover:scale-100 transition-transform duration-300">
                      <Play className="w-4 h-4 fill-white ml-0.5" />
                    </div>
                  </div>
                </div>

                {/* Bottom details */}
                <div className="p-3 flex flex-col justify-between flex-1 bg-slate-900/40">
                  <h3
                    title={item.title}
                    className="text-xs sm:text-sm font-semibold text-slate-100 line-clamp-2 leading-snug group-hover:text-violet-400 transition-colors"
                  >
                    {item.title}
                  </h3>
                  <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-400 font-medium capitalize">
                    <span>{item.type}</span>
                    <span className="text-violet-400">Stream Now</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
