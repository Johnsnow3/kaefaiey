import React from "react";
import { Download, Play, ExternalLink, ShieldCheck, Smartphone, Monitor } from "lucide-react";
import { getWatchlist } from "../services/storage";
import { getVlcUrl, getMxPlayerIntent } from "../services/api";
import { Post } from "../types";

interface DownloadsViewProps {
  onSelectMedia: (item: Post, provider: string) => void;
  onExplore: () => void;
}

export const DownloadsView: React.FC<DownloadsViewProps> = ({
  onSelectMedia,
  onExplore,
}) => {
  const watchlist = getWatchlist();

  return (
    <div className="flex-1 max-w-4xl mx-auto w-full p-4 sm:p-6 space-y-6 animate-fadeIn pb-24 text-white">
      {/* Top Banner */}
      <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-zinc-900 via-[#18181b] to-zinc-900 border border-zinc-800 shadow-xl space-y-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-rose-600/20 text-[#ff4d4d] border border-rose-500/30 flex items-center justify-center">
            <Download className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              Downloads & External Players
            </h1>
            <p className="text-xs text-zinc-400">
              High-speed direct downloading and 1-click launch in VLC, MX Player, and MPV.
            </p>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="p-3 rounded-xl bg-[#121215] border border-zinc-800 flex items-center gap-3">
            <Smartphone className="w-5 h-5 text-rose-400 flex-shrink-0" />
            <div>
              <span className="text-xs font-bold block text-white">MX Player</span>
              <span className="text-[10px] text-zinc-400">Android hardware acceleration</span>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-[#121215] border border-zinc-800 flex items-center gap-3">
            <Monitor className="w-5 h-5 text-amber-400 flex-shrink-0" />
            <div>
              <span className="text-xs font-bold block text-white">VLC Media Player</span>
              <span className="text-[10px] text-zinc-400">All formats & subtitles (MKV, MP4)</span>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-[#121215] border border-zinc-800 flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <div>
              <span className="text-xs font-bold block text-white">Zero Ads</span>
              <span className="text-[10px] text-zinc-400">Direct CDN clean downloads</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Launch From Watchlist */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-zinc-300 uppercase tracking-wider">
          Saved Media For Quick Download ({watchlist.length})
        </h2>

        {watchlist.length > 0 ? (
          <div className="space-y-2">
            {watchlist.map((item) => (
              <div
                key={item.id}
                onClick={() =>
                  onSelectMedia(
                    { title: item.title, link: item.link, image: item.image, tag: item.tag },
                    item.provider
                  )
                }
                className="p-3 rounded-2xl bg-[#141416] border border-zinc-800 hover:border-zinc-700 flex items-center justify-between cursor-pointer transition-all active:scale-[0.99] group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-16 rounded-xl overflow-hidden bg-zinc-900 flex-shrink-0">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-rose-400 transition-colors">
                      {item.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-zinc-800 text-zinc-400 uppercase">
                        {item.provider}
                      </span>
                      <span className="text-[10px] text-zinc-500 capitalize">{item.type}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button className="px-3 py-1.5 rounded-xl bg-rose-600/20 text-[#ff4d4d] border border-rose-500/30 hover:bg-rose-600 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-all">
                    <Play className="w-3 h-3 fill-current" />
                    <span>Watch</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 rounded-2xl bg-[#141416] border border-zinc-800 text-center space-y-3">
            <Download className="w-10 h-10 text-zinc-600 mx-auto" />
            <h3 className="text-sm font-bold text-white">No Downloads in Queue</h3>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              Browse movies or series and tap the download icon on any episode or details page to download or stream externally.
            </p>
            <button
              onClick={onExplore}
              className="px-5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-xs transition-colors"
            >
              Explore Catalog
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
