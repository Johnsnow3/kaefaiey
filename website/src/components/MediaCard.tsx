import React from "react";
import { Bookmark, Play, Star, Film } from "lucide-react";
import { Post, WatchlistItem } from "../types";
import { isInWatchlist, addToWatchlist, removeFromWatchlist } from "../services/storage";

interface MediaCardProps {
  item: Post;
  provider: string;
  onSelect: (item: Post) => void;
  onWatchlistChange?: () => void;
}

export const MediaCard: React.FC<MediaCardProps> = ({
  item,
  provider,
  onSelect,
  onWatchlistChange,
}) => {
  const [imgError, setImgError] = React.useState(false);
  const [saved, setSaved] = React.useState(() => isInWatchlist(item.link));

  // Sync state if link changes
  React.useEffect(() => {
    setSaved(isInWatchlist(item.link));
  }, [item.link]);

  const toggleWatchlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (saved) {
      removeFromWatchlist(item.link);
      setSaved(false);
    } else {
      const watchItem: WatchlistItem = {
        id: item.link,
        title: item.title,
        image: item.image,
        link: item.link,
        provider,
        type: item.tag?.toLowerCase().includes("series") || item.cornerTag?.toLowerCase().includes("series") ? "series" : "movie",
        tag: item.tag || item.cornerTag,
        addedAt: Date.now(),
      };
      addToWatchlist(watchItem);
      setSaved(true);
    }
    if (onWatchlistChange) onWatchlistChange();
  };

  return (
    <div
      onClick={() => onSelect(item)}
      className="group relative flex flex-col cursor-pointer select-none rounded-xl overflow-hidden bg-slate-900/60 border border-slate-800/80 hover:border-violet-500/50 hover:shadow-2xl hover:shadow-violet-950/40 hover:-translate-y-1.5 transition-all duration-300"
    >
      {/* Aspect Ratio Container for Poster */}
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-slate-950">
        {!imgError && item.image ? (
          <img
            src={item.image}
            alt={item.title}
            onError={() => setImgError(true)}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-gradient-to-br from-slate-900 to-slate-950 text-slate-500">
            <Film className="w-12 h-12 mb-2 text-violet-500/40" />
            <span className="text-xs text-center line-clamp-3 font-medium text-slate-400">
              {item.title}
            </span>
          </div>
        )}

        {/* Gradient Overlay for Readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-80 group-hover:opacity-60 transition-opacity" />

        {/* Corner Tags / Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1 items-start z-10">
          {item.cornerTag && (
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider uppercase bg-violet-600/90 text-white shadow-md backdrop-blur-sm">
              {item.cornerTag}
            </span>
          )}
          {item.tag && item.tag !== item.cornerTag && (
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider uppercase bg-amber-500/90 text-slate-950 shadow-md backdrop-blur-sm">
              {item.tag}
            </span>
          )}
        </div>

        {/* Watchlist Bookmark Button */}
        <button
          onClick={toggleWatchlist}
          title={saved ? "Remove from Watchlist" : "Add to Watchlist"}
          aria-label={saved ? "Remove from Watchlist" : "Add to Watchlist"}
          className={`absolute top-2 right-2 p-2 rounded-lg backdrop-blur-md transition-all duration-200 z-10 ${
            saved
              ? "bg-violet-600 text-white shadow-lg shadow-violet-600/40"
              : "bg-slate-950/60 text-slate-300 hover:bg-slate-900 hover:text-white"
          }`}
        >
          <Bookmark className={`w-3.5 h-3.5 ${saved ? "fill-white" : ""}`} />
        </button>

        {/* Center Hover Play Button */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
          <div className="w-12 h-12 rounded-full bg-violet-600/90 text-white flex items-center justify-center shadow-lg shadow-violet-600/50 transform scale-75 group-hover:scale-100 transition-transform duration-300">
            <Play className="w-5 h-5 fill-current ml-0.5" />
          </div>
        </div>
      </div>

      {/* Info Content */}
      <div className="p-3 flex flex-col flex-1 justify-between bg-slate-900/40">
        <h3
          title={item.title}
          className="text-sm font-semibold text-slate-100 line-clamp-2 leading-snug group-hover:text-violet-400 transition-colors"
        >
          {item.title}
        </h3>
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/60 text-[11px] text-slate-400 font-medium">
          <span className="truncate capitalize text-violet-400/90 font-mono text-[10px]">
            {provider}
          </span>
          <span className="text-slate-500 flex items-center gap-1">
            <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
            <span>HD</span>
          </span>
        </div>
      </div>
    </div>
  );
};
