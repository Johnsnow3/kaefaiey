import React, { useEffect, useState } from "react";
import {
  X,
  Play,
  Bookmark,
  Share2,
  Tv,
  Film,
  Star,
  Layers,
  Download,
  AlertCircle,
  Loader2,
  ExternalLink,
  ChevronRight,
  Info,
} from "lucide-react";
import { Episode, MediaMeta, MediaStream, Post, WatchlistItem } from "../types";
import {
  fetchEpisodes,
  fetchMeta,
  fetchStream,
  getMxPlayerIntent,
  getVlcUrl,
  getProxyStreamUrl,
} from "../services/api";
import {
  isInWatchlist,
  addToWatchlist,
  removeFromWatchlist,
} from "../services/storage";

interface MediaDetailsProps {
  item: Post;
  provider: string;
  onClose: () => void;
  onPlay: (
    stream: MediaStream,
    allStreams: MediaStream[],
    title: string,
    poster?: string
  ) => void;
  onWatchlistChange?: () => void;
}

export const MediaDetails: React.FC<MediaDetailsProps> = ({
  item,
  provider,
  onClose,
  onPlay,
  onWatchlistChange,
}) => {
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState<MediaMeta | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loadingEpisodes, setLoadingEpisodes] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState<number>(0);
  const [extractingStream, setExtractingStream] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [saved, setSaved] = useState(() => isInWatchlist(item.link));

  // Determine media type
  const isSeries =
    item.tag?.toLowerCase().includes("series") ||
    item.cornerTag?.toLowerCase().includes("series") ||
    item.title?.toLowerCase().includes("season") ||
    item.title?.toLowerCase().includes("episode") ||
    meta?.type === "series";

  // Fetch meta on mount
  useEffect(() => {
    let isMounted = true;
    async function loadMeta() {
      setLoading(true);
      setStreamError(null);
      try {
        const data = await fetchMeta(provider, item.link);
        if (!isMounted) return;
        setMeta(data);

        // If meta has episodesLink, fetch episodes
        if (data?.linkList && data.linkList.length > 0) {
          const firstWithEpisodes = data.linkList.find((l) => l.episodesLink);
          if (firstWithEpisodes?.episodesLink) {
            setLoadingEpisodes(true);
            const eps = await fetchEpisodes(provider, firstWithEpisodes.episodesLink);
            if (isMounted) {
              setEpisodes(eps);
              setLoadingEpisodes(false);
            }
          }
        }
      } catch (err: any) {
        console.error("Failed to load details:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadMeta();
    return () => {
      isMounted = false;
    };
  }, [item.link, provider]);

  const toggleWatchlist = () => {
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
        type: isSeries ? "series" : "movie",
        tag: item.tag || item.cornerTag,
        addedAt: Date.now(),
      };
      addToWatchlist(watchItem);
      setSaved(true);
    }
    if (onWatchlistChange) onWatchlistChange();
  };

  const handleStartPlay = async (targetLink?: string, customTitle?: string) => {
    setExtractingStream(true);
    setStreamError(null);

    const linkToExtract =
      targetLink ||
      meta?.linkList?.[0]?.directLinks?.[0]?.link ||
      meta?.linkList?.[0]?.episodesLink ||
      item.link;

    try {
      const mediaType = isSeries ? "series" : "movie";
      const streams = await fetchStream(provider, linkToExtract, mediaType);

      if (!streams || streams.length === 0) {
        throw new Error(
          "No streams could be found for this provider. Try switching to another provider or server."
        );
      }

      onPlay(
        streams[0],
        streams,
        customTitle || item.title,
        meta?.image || item.image
      );
    } catch (err: any) {
      setStreamError(
        err.message ||
          "Failed to extract streaming link. The source may require a different provider."
      );
    } finally {
      setExtractingStream(false);
    }
  };

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      {/* Click outside backdrop */}
      <div className="fixed inset-0 -z-10" onClick={onClose} />

      {/* Modal Container */}
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl text-slate-100">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-slate-950/70 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="Close Modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Scrollable Body */}
        <div className="overflow-y-auto custom-scrollbar flex-1">
          {/* Header Banner */}
          <div className="relative w-full h-64 sm:h-80 bg-slate-950 overflow-hidden">
            <img
              src={meta?.poster || meta?.image || item.image}
              alt={item.title}
              className="w-full h-full object-cover opacity-30 filter blur-sm scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent" />

            {/* Poster + Header Content Overlay */}
            <div className="absolute inset-0 p-6 flex items-end gap-6">
              <div className="hidden sm:block w-36 h-52 rounded-xl overflow-hidden shadow-2xl border border-slate-700/80 flex-shrink-0 bg-slate-950">
                <img
                  src={meta?.image || item.image}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex-1 pb-1">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-violet-600/90 text-white">
                    {provider}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800/80 text-slate-300 border border-slate-700">
                    {isSeries ? "TV Series" : "Movie"}
                  </span>
                  {meta?.rating && (
                    <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      {meta.rating}
                    </span>
                  )}
                  {item.cornerTag && (
                    <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {item.cornerTag}
                    </span>
                  )}
                </div>

                <h1 className="text-xl sm:text-3xl font-extrabold text-white leading-tight drop-shadow-md">
                  {meta?.title || item.title}
                </h1>

                {meta?.tags && meta.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    {meta.tags.slice(0, 6).map((tag, idx) => (
                      <span
                        key={idx}
                        className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-800/60 text-slate-300"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="p-4 sm:p-6 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-4 bg-slate-900/90">
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleStartPlay()}
                disabled={extractingStream}
                className="px-6 py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-lg shadow-violet-600/30 flex items-center gap-2 transition-all transform active:scale-95 disabled:opacity-50"
              >
                {extractingStream ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Extracting Stream...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-white" />
                    Watch Now
                  </>
                )}
              </button>

              <button
                onClick={toggleWatchlist}
                className={`p-2.5 rounded-xl border font-medium text-sm flex items-center gap-2 transition-colors ${
                  saved
                    ? "bg-violet-600/20 border-violet-500 text-violet-300"
                    : "bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
                title={saved ? "Saved in Watchlist" : "Save to Watchlist"}
              >
                <Bookmark className={`w-4 h-4 ${saved ? "fill-violet-400" : ""}`} />
                <span className="hidden sm:inline">
                  {saved ? "In Watchlist" : "Watchlist"}
                </span>
              </button>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Info className="w-4 h-4 text-violet-400" />
              <span>Multi-audio & Subtitle tracks switchable in player</span>
            </div>
          </div>

          {/* Error Banner */}
          {streamError && (
            <div className="m-4 sm:m-6 p-4 rounded-xl bg-rose-950/40 border border-rose-800/60 flex items-start gap-3 text-rose-200">
              <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1 text-sm">
                <span className="font-semibold block">Playback Error</span>
                <p className="text-xs text-rose-300 mt-0.5">{streamError}</p>
                <p className="text-xs text-slate-400 mt-2">
                  Tip: Switch provider from the side menu (e.g. autoEmbed, torrentio, flixhq, vega, filmyfly).
                </p>
              </div>
            </div>
          )}

          {/* Details Content */}
          <div className="p-4 sm:p-6 space-y-6">
            {/* Synopsis / Description */}
            {(meta?.synopsis || loading) && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
                  Overview
                </h3>
                {loading ? (
                  <div className="space-y-2 animate-pulse">
                    <div className="h-4 bg-slate-800 rounded w-full" />
                    <div className="h-4 bg-slate-800 rounded w-5/6" />
                    <div className="h-4 bg-slate-800 rounded w-3/4" />
                  </div>
                ) : (
                  <p className="text-sm text-slate-300 leading-relaxed font-normal">
                    {meta?.synopsis}
                  </p>
                )}
              </div>
            )}

            {/* Direct Links / Versions (if provider returned multiple quality links) */}
            {meta?.linkList && meta.linkList.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-4 h-4 text-violet-400" />
                  Available Servers & Qualities ({meta.linkList.length})
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {meta.linkList.map((linkGroup, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/60 hover:border-violet-500/50 transition-colors flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-sm text-slate-200">
                          {linkGroup.title || `Server #${idx + 1}`}
                        </span>
                      </div>

                      {linkGroup.directLinks && linkGroup.directLinks.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {linkGroup.directLinks.map((dl, dIdx) => (
                            <button
                              key={dIdx}
                              onClick={() => handleStartPlay(dl.link, `${item.title} - ${dl.title}`)}
                              className="px-2.5 py-1 text-xs rounded-lg bg-violet-600/20 hover:bg-violet-600 hover:text-white text-violet-300 border border-violet-500/30 font-medium transition-all flex items-center gap-1.5"
                            >
                              <Play className="w-3 h-3 fill-current" />
                              {dl.title}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <button
                          onClick={() =>
                            handleStartPlay(
                              linkGroup.episodesLink || item.link,
                              `${item.title} - ${linkGroup.title}`
                            )
                          }
                          className="w-full py-1.5 text-xs rounded-lg bg-slate-700/60 hover:bg-violet-600 text-slate-200 hover:text-white font-medium transition-colors flex items-center justify-center gap-1.5"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          Stream This Link
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Episodes List (for Series / Anime) */}
            {(episodes.length > 0 || loadingEpisodes) && (
              <div className="space-y-3 pt-4 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <Tv className="w-4 h-4 text-violet-400" />
                    Episodes ({episodes.length})
                  </h3>
                </div>

                {loadingEpisodes ? (
                  <div className="flex items-center justify-center p-8 text-slate-500 gap-2">
                    <Loader2 className="w-5 h-5 animate-spin text-violet-400" />
                    <span className="text-sm">Fetching episode list...</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 max-h-64 overflow-y-auto custom-scrollbar p-1">
                    {episodes.map((ep, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleStartPlay(ep.link, `${item.title} - ${ep.title}`)}
                        className="p-2.5 rounded-xl bg-slate-800/40 hover:bg-violet-600 hover:text-white border border-slate-800 hover:border-violet-500 text-left transition-all group flex flex-col justify-between"
                      >
                        <span className="text-xs font-semibold line-clamp-1 group-hover:text-white">
                          {ep.title || `Episode ${idx + 1}`}
                        </span>
                        <span className="text-[10px] text-slate-500 group-hover:text-violet-200 mt-1 flex items-center gap-1">
                          <Play className="w-2.5 h-2.5 fill-current" />
                          Play
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
