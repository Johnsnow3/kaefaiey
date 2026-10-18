import React from "react";
import { Film } from "lucide-react";
import { Post } from "../types";

interface MediaCardProps {
  item: Post;
  provider: string;
  onSelect: (item: Post) => void;
  layout?: "carousel" | "grid";
}

export const MediaCard: React.FC<MediaCardProps> = ({
  item,
  provider,
  onSelect,
  layout = "grid",
}) => {
  const [imgError, setImgError] = React.useState(false);

  // Badge text: Use cornerTag, tag, or default to "Recently added"
  const badgeText = item.cornerTag || item.tag || "Recently added";

  return (
    <div
      onClick={() => onSelect(item)}
      className={`group relative flex flex-col cursor-pointer select-none transition-all duration-200 active:scale-95 ${
        layout === "carousel"
          ? "w-[124px] sm:w-[140px] md:w-[160px] flex-shrink-0"
          : "w-full"
      }`}
    >
      {/* Poster Image Container */}
      <div className="relative aspect-[2/3] w-full rounded-2xl overflow-hidden bg-[#18181b] shadow-md group-hover:shadow-rose-950/20 group-hover:scale-[1.02] transition-all duration-300">
        {!imgError && item.image ? (
          <img
            src={item.image}
            alt={item.title}
            onError={() => setImgError(true)}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-3 bg-gradient-to-br from-zinc-900 to-black text-zinc-500">
            <Film className="w-8 h-8 mb-2 text-zinc-600" />
            <span className="text-[11px] text-center line-clamp-2 font-medium text-zinc-400">
              {item.title}
            </span>
          </div>
        )}

        {/* Gradient shadow at bottom of poster */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-90" />

        {/* Red "Recently added" / Tag Badge at bottom of poster */}
        <div className="absolute bottom-2 left-2 right-2 flex justify-center z-10 pointer-events-none">
          <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold tracking-tight uppercase bg-[#e50914] text-white shadow-lg shadow-red-950/50 truncate max-w-full text-center">
            {badgeText}
          </span>
        </div>
      </div>

      {/* Movie Title below Poster */}
      <h3
        title={item.title}
        className="mt-2 text-xs sm:text-sm font-medium text-white truncate max-w-full group-hover:text-rose-400 transition-colors"
      >
        {item.title}
      </h3>
    </div>
  );
};
