import React, { useEffect, useState } from "react";
import {
  ArrowLeft,
  Play,
  Bookmark,
  Search,
  Download,
  AlertCircle,
  Loader2,
  ChevronDown,
  Copy,
  Check,
  ExternalLink,
  Tv,
} from "lucide-react";
import { Episode, MediaMeta, MediaStream, Post, WatchlistItem } from "../types";
import {
  fetchEpisodes,
  fetchMeta,
  fetchStream,
  getProxyStreamUrl,
  getVlcUrl,
  getMxPlayerIntent,
  getKartoonsLinkStatus,
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
  onSearchRelated?: (title: string) => void;
  onWatchlistChange?: () => void;
}

export const MediaDetails: React.FC<MediaDetailsProps> = ({
  item,
  provider,
  onClose,
  onPlay,
  onSearchRelated,
  onWatchlistChange,
}) => {
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState<MediaMeta | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loadingEpisodes, setLoadingEpisodes] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState<number>(1);
  const [extractingStream, setExtractingStream] = useState(false);
  const [downloadingEpLink, setDownloadingEpLink] = useState<string | null>(null);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [kartoonsAuthData, setKartoonsAuthData] = useState<{
    code: string;
    linkUrl: string;
    pendingLink?: string;
    pendingTitle?: string;
  } | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [checkingKartoonsLink, setCheckingKartoonsLink] = useState(false);
  const [saved, setSaved] = useState(() => isInWatchlist(item.link));

  // Poll Kartoons link status when code is displayed
  useEffect(() => {
    if (!kartoonsAuthData) return;
    let timer: any = null;
    let active = true;

    async function checkStatus() {
      try {
        const res = await getKartoonsLinkStatus();
        if (!active) return;
        if (res.linked) {
          const { pendingLink, pendingTitle } = kartoonsAuthData || {};
          setKartoonsAuthData(null);
          setStreamError(null);
          handleStartPlay(pendingLink, pendingTitle);
          return;
        }
      } catch {}
      if (active) timer = setTimeout(checkStatus, 3000);
    }

    timer = setTimeout(checkStatus, 3000);
    return () => {
      active = false;
      if (timer) clearTimeout(timer);
    };
  }, [kartoonsAuthData]);

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

    let linkToExtract = targetLink;
    let titleToPlay = customTitle;

    // For TV series, if user clicks Watch Now without selecting an episode, play Episode 1
    if (!linkToExtract) {
      if (isSeries) {
        let currentEpisodes = episodes;
        if (currentEpisodes.length === 0 && meta?.linkList) {
          const firstWithEpisodes = meta.linkList.find((l) => l.episodesLink);
          if (firstWithEpisodes?.episodesLink) {
            try {
              setLoadingEpisodes(true);
              currentEpisodes = await fetchEpisodes(provider, firstWithEpisodes.episodesLink);
              setEpisodes(currentEpisodes);
            } catch (err) {
              console.warn("Auto-fetching episodes failed:", err);
            } finally {
              setLoadingEpisodes(false);
            }
          }
        }

        if (currentEpisodes && currentEpisodes.length > 0) {
          linkToExtract = currentEpisodes[0].link;
          if (!titleToPlay) {
            titleToPlay = `${item.title} - ${currentEpisodes[0].title || "Episode 1"}`;
          }
        }
      }

      if (!linkToExtract) {
        linkToExtract =
          meta?.linkList?.[0]?.directLinks?.[0]?.link ||
          meta?.linkList?.[0]?.episodesLink ||
          item.link;
      }
    }

    try {
      const mediaType = isSeries ? "series" : "movie";
      const streams = await fetchStream(provider, linkToExtract, mediaType);

      if (!streams || streams.length === 0) {
        throw new Error(
          "No streams could be found for this title on this provider. Please try another provider."
        );
      }

      onPlay(
        streams[0],
        streams,
        titleToPlay || customTitle || item.title,
        meta?.image || item.image
      );
    } catch (err: any) {
      if (
        err.authRequired ||
        (provider === "kartoons" && err.code) ||
        (err.message && err.message.toLowerCase().includes("kartoons") && (err.message.toLowerCase().includes("link") || err.message.toLowerCase().includes("auth")))
      ) {
        setKartoonsAuthData({
          code: err.code || "",
          linkUrl: err.linkUrl || "https://kartoons.to/cloudstream/link",
          pendingLink: linkToExtract,
          pendingTitle: titleToPlay,
        });
        setStreamError(null);
      } else {
        setStreamError(
          err.message ||
            "Failed to extract streaming link. The source may require a different provider."
        );
      }
    } finally {
      setExtractingStream(false);
    }
  };

  const handleDownloadEpisode = async (ep: Episode, e: React.MouseEvent) => {
    e.stopPropagation();
    if (downloadingEpLink) return;
    setDownloadingEpLink(ep.link);
    try {
      const mediaType = isSeries ? "series" : "movie";
      const streams = await fetchStream(provider, ep.link, mediaType, true);
      if (!streams || streams.length === 0) {
        throw new Error("No download stream available for this episode.");
      }
      // Prioritize standalone MP4 stream for direct downloads if available
      const downloadStream = streams.find((s) => s.type === "mp4") || streams[0];
      const streamUrl = downloadStream.link;
      const extension = downloadStream.type === "mkv" ? "mkv" : downloadStream.type === "mp4" ? "mp4" : "m3u8";
      const safeTitle = `${meta?.title || item.title} - ${ep.title || "Episode"}.${extension}`.replace(/[\\/:*?"<>|]/g, "_");
      
      const downloadProxyUrl = getProxyStreamUrl(
        streamUrl,
        downloadStream.headers?.Referer,
        downloadStream.headers?.Cookie,
        true,
        safeTitle
      );
      
      const a = document.createElement("a");
      a.href = downloadProxyUrl;
      a.download = safeTitle;
      a.target = "_blank";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err: any) {
      alert(`Download notice: ${err.message || "Unable to extract download stream"}`);
    } finally {
      setDownloadingEpLink(null);
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

  // Tags list
  const displayTags = meta?.tags && meta.tags.length > 0 ? meta.tags : [
    meta?.rating ? `Rating: ${meta.rating}` : "HD",
    isSeries ? "TV Series" : "Movie",
    item.cornerTag || item.tag || "Recently added",
  ].filter(Boolean);

  return (
    <div className="fixed inset-0 z-50 bg-[#09090b] overflow-y-auto overflow-x-hidden w-full max-w-full custom-scrollbar animate-fadeIn text-slate-100 flex flex-col items-center">
      <div className="relative w-full max-w-2xl min-h-screen pb-24 flex flex-col overflow-x-hidden">
        {/* Top Backdrop Image */}
        <div className="relative w-full h-72 sm:h-84 md:h-96 bg-black overflow-hidden flex-shrink-0">
          <img
            src={meta?.poster || meta?.image || item.image}
            alt={item.title}
            className="w-full h-full object-cover opacity-85"
          />
          {/* Subtle gradient to pure dark background */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-[#09090b]/60 to-transparent" />

          {/* Floating Top Back Button */}
          <button
            onClick={onClose}
            className="absolute top-4 left-4 z-20 p-2.5 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors backdrop-blur-md active:scale-95"
            title="Go Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="px-5 sm:px-6 -mt-8 relative z-10 space-y-4 flex-1">
          {/* Title */}
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-tight break-words">
            {meta?.title || item.title}
          </h1>

          {/* Metadata Badges Row */}
          <div className="flex flex-wrap items-center gap-2">
            {displayTags.slice(0, 5).map((t, idx) => (
              <span
                key={idx}
                className="px-3 py-1 rounded-lg bg-[#1c1c20] text-xs font-medium text-zinc-300 border border-zinc-800"
              >
                {t}
              </span>
            ))}
          </div>

          {/* Synopsis Section */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-white">
                Synopsis
              </h2>
              <span className="text-xs font-bold text-[#ff8a80] uppercase tracking-wide">
                {provider}
              </span>
            </div>
            {loading ? (
              <div className="space-y-2 animate-pulse pt-1">
                <div className="h-3.5 bg-zinc-800 rounded w-full" />
                <div className="h-3.5 bg-zinc-800 rounded w-5/6" />
                <div className="h-3.5 bg-zinc-800 rounded w-2/3" />
              </div>
            ) : (
              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-normal">
                {meta?.synopsis ||
                  (item as any).description ||
                  "Watch full high-definition streaming for this title with multi-audio and subtitle tracks."}
              </p>
            )}
          </div>

          {/* Action Row: Search & Save (Bookmark) */}
          <div className="flex items-center justify-around py-2 border-y border-zinc-800/80">
            <button
              onClick={() => onSearchRelated?.(item.title)}
              className="flex flex-col items-center gap-1 text-zinc-400 hover:text-white transition-colors active:scale-95 p-2"
            >
              <Search className="w-5 h-5 text-zinc-300" />
              <span className="text-xs font-medium">Search</span>
            </button>

            <button
              onClick={toggleWatchlist}
              className="flex flex-col items-center gap-1 text-zinc-400 hover:text-white transition-colors active:scale-95 p-2"
            >
              <Bookmark
                className={`w-5 h-5 ${
                  saved ? "fill-[#ff8a80] text-[#ff8a80]" : "text-zinc-300"
                }`}
              />
              <span
                className={`text-xs font-medium ${
                  saved ? "text-[#ff8a80]" : "text-zinc-300"
                }`}
              >
                {saved ? "Saved" : "Save"}
              </span>
            </button>
          </div>

          {/* Kartoons Device Linking Card */}
          {kartoonsAuthData && (
            <div className="p-4 sm:p-5 rounded-2xl bg-amber-950/40 border border-amber-600/50 space-y-3 shadow-xl">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 flex-shrink-0">
                  <Tv className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm sm:text-base font-bold text-amber-100 leading-snug">
                    Kartoons Device Linking Required
                  </h3>
                  <p className="text-xs text-amber-200/80 mt-1">
                    Kartoons requires linking your account once to stream media.
                  </p>
                </div>
              </div>

              <div className="bg-black/50 p-3 sm:p-4 rounded-xl border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-center sm:text-left">
                  <span className="text-[11px] font-semibold text-zinc-400 block uppercase tracking-wider">
                    Your Link Code
                  </span>
                  <span className="text-2xl sm:text-3xl font-extrabold tracking-widest text-amber-400 font-mono">
                    {kartoonsAuthData.code || "..."}
                  </span>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => {
                      if (kartoonsAuthData.code) {
                        navigator.clipboard.writeText(kartoonsAuthData.code);
                        setCopiedCode(true);
                        setTimeout(() => setCopiedCode(false), 2000);
                      }
                    }}
                    className="flex-1 sm:flex-initial px-3.5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors active:scale-95"
                  >
                    {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCode ? "Copied" : "Copy Code"}</span>
                  </button>

                  <a
                    href={kartoonsAuthData.linkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95"
                  >
                    <span>Open Link Page</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-amber-300/80 pt-1">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                  <span>Waiting for link approval...</span>
                </div>
                <button
                  onClick={async () => {
                    setCheckingKartoonsLink(true);
                    const res = await getKartoonsLinkStatus();
                    setCheckingKartoonsLink(false);
                    if (res.linked) {
                      const { pendingLink, pendingTitle } = kartoonsAuthData || {};
                      setKartoonsAuthData(null);
                      handleStartPlay(pendingLink, pendingTitle);
                    }
                  }}
                  disabled={checkingKartoonsLink}
                  className="text-[11px] text-amber-400 hover:underline font-semibold"
                >
                  {checkingKartoonsLink ? "Checking..." : "I have linked it"}
                </button>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {streamError && (
            <div className="p-3.5 rounded-xl bg-red-950/50 border border-red-800/60 flex items-start gap-3 text-red-200">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1 text-xs">
                <span className="font-semibold block text-sm">Playback Error</span>
                <p className="text-red-300 mt-0.5">{streamError}</p>
              </div>
            </div>
          )}

          {/* Primary Action Button (Resume / Watch Now) matching Image 3 */}
          <button
            onClick={() => handleStartPlay()}
            disabled={extractingStream}
            className="w-full py-4 px-6 rounded-2xl font-bold bg-[#ff9999] hover:bg-[#ff8a80] active:scale-[0.98] text-zinc-950 shadow-xl shadow-rose-950/30 flex items-center justify-center gap-3 transition-all disabled:opacity-50"
          >
            {extractingStream ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin text-zinc-950" />
                <span className="text-sm">Connecting Stream...</span>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-zinc-950 flex items-center justify-center text-white">
                  <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                </div>
                <div className="text-left">
                  <span className="block text-base font-extrabold leading-none">
                    {isSeries ? "Resume" : "Watch Now"}
                  </span>
                  <span className="block text-[11px] font-semibold text-zinc-800 mt-0.5">
                    {isSeries
                      ? `${episodes[0]?.title || "Episode 1"} · HD Stream`
                      : "Full Movie · Multi-Audio & Subtitles"}
                  </span>
                </div>
              </div>
            )}
          </button>

          {/* Season Selector Dropdown (for series) */}
          {isSeries && (
            <div className="relative pt-1">
              <button
                className="w-full py-3 px-4 rounded-xl bg-[#18181b] border border-zinc-800/80 text-sm font-semibold text-white flex items-center justify-between"
              >
                <span>Season {selectedSeason}</span>
                <ChevronDown className="w-4 h-4 text-zinc-400" />
              </button>
            </div>
          )}

          {/* Episode List (Matching Image 3) */}
          {(isSeries || episodes.length > 0) && (
            <div className="space-y-2.5 pt-1">
              {loadingEpisodes ? (
                <div className="flex items-center justify-center p-6 text-zinc-500 gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-[#ff8a80]" />
                  <span className="text-xs">Loading episode list...</span>
                </div>
              ) : episodes.length > 0 ? (
                episodes.map((ep, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleStartPlay(ep.link, `${item.title} - ${ep.title}`)}
                    className="w-full p-3 rounded-xl bg-[#18181b] border border-zinc-800/80 hover:border-zinc-700 flex items-center justify-between cursor-pointer active:scale-[0.99] transition-all group overflow-hidden"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1 mr-2">
                      <div className="w-8 h-8 rounded-full bg-[#ff9999] group-hover:bg-[#ff8a80] text-zinc-950 flex items-center justify-center shadow-md flex-shrink-0 transition-transform group-hover:scale-105">
                        <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                      </div>
                      <span className="text-sm font-semibold text-white group-hover:text-[#ff8a80] transition-colors truncate block min-w-0">
                        {ep.title || `Episode ${idx + 1}`}
                      </span>
                    </div>

                    <button
                      onClick={(e) => handleDownloadEpisode(ep, e)}
                      disabled={downloadingEpLink === ep.link}
                      className="p-2 rounded-lg text-zinc-400 hover:text-white transition-colors flex-shrink-0 disabled:opacity-50"
                      title="Download Episode"
                    >
                      {downloadingEpLink === ep.link ? (
                        <Loader2 className="w-4 h-4 animate-spin text-[#ff8a80]" />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                ))
              ) : (
                <div
                  onClick={() => handleStartPlay()}
                  className="w-full p-3.5 rounded-xl bg-[#18181b] border border-zinc-800 flex items-center justify-between cursor-pointer hover:border-zinc-700 overflow-hidden"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1 mr-2">
                    <div className="w-8 h-8 rounded-full bg-[#ff9999] text-zinc-950 flex items-center justify-center shadow-md flex-shrink-0">
                      <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                    </div>
                    <span className="text-sm font-semibold text-white truncate block min-w-0">Episode 1</span>
                  </div>
                  <Download className="w-4 h-4 text-zinc-400 flex-shrink-0" />
                </div>
              )}
            </div>
          )}

          {/* Available Quality Servers (if Movie or multiple qualities) */}
          {!isSeries && meta?.linkList && meta.linkList.length > 0 && (
            <div className="space-y-2 pt-2">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">
                Available Servers & Qualities ({meta.linkList.length})
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {meta.linkList.map((linkGroup, idx) => (
                  <button
                    key={idx}
                    onClick={() =>
                      handleStartPlay(
                        linkGroup.directLinks?.[0]?.link || linkGroup.episodesLink,
                        `${item.title} - ${linkGroup.title}`
                      )
                    }
                    className="p-3 rounded-xl bg-[#18181b] border border-zinc-800 hover:border-zinc-700 flex items-center justify-between text-left transition-all"
                  >
                    <span className="text-xs font-semibold text-white">
                      {linkGroup.title || `Server #${idx + 1}`}
                    </span>
                    <Play className="w-3.5 h-3.5 text-[#ff8a80] fill-current" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
