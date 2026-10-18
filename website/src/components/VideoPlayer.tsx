import React, { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import {
  ArrowLeft,
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Lock,
  Unlock,
  PictureInPicture,
  Volume2,
  VolumeX,
  Check,
  CheckCircle2,
  Download,
  AlertTriangle,
  X,
  Maximize2,
  Minimize2,
  Tv,
} from "lucide-react";
import { MediaStream, SubtitleTrack } from "../types";
import {
  getMxPlayerIntent,
  getProxyStreamUrl,
  getVlcUrl,
} from "../services/api";

interface VideoPlayerProps {
  title: string;
  subtitle?: string;
  stream?: MediaStream;
  allStreams?: MediaStream[];
  streams?: MediaStream[];
  initialSubtitles?: SubtitleTrack[];
  poster?: string;
  onClose: () => void;
  onProgressUpdate?: (currentTime: number, duration: number) => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  title,
  subtitle,
  stream,
  allStreams,
  streams: propStreams,
  initialSubtitles = [],
  poster,
  onClose,
  onProgressUpdate,
}) => {
  const resolvedStreams = propStreams || allStreams || (stream ? [stream] : []);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const triedProxyRef = useRef(false);

  // Active Server Stream
  const [selectedStreamIndex, setSelectedStreamIndex] = useState(0);
  const activeStream = resolvedStreams[selectedStreamIndex] || resolvedStreams[0];

  // Playback State
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [isLocked, setIsLocked] = useState(false);
  const [fitMode, setFitMode] = useState<"contain" | "cover" | "fill">("contain");
  const [playbackNotice, setPlaybackNotice] = useState<string | null>(null);
  const controlsTimeoutRef = useRef<any>(null);

  // Audio & Subtitle Tracks
  const [audioTracks, setAudioTracks] = useState<{ id: number; name: string; lang: string }[]>([]);
  const [selectedAudioTrack, setSelectedAudioTrack] = useState<number>(-1);

  const [availableSubtitles, setAvailableSubtitles] = useState<SubtitleTrack[]>([]);
  const [selectedSubtitleIndex, setSelectedSubtitleIndex] = useState<number>(-1);

  // Quality levels from Hls
  const [qualityLevels, setQualityLevels] = useState<{ id: number; height: number; bitrate?: number; label: string }[]>([]);
  const [selectedQualityIndex, setSelectedQualityIndex] = useState<number>(-1); // -1 is Auto

  // Modal Sheets: "quality" | "audio" | "subs" | "speed" | "none"
  const [activeSheet, setActiveSheet] = useState<"none" | "quality" | "audio" | "subs" | "speed">("none");

  // Aggregate subtitles
  useEffect(() => {
    const combined: SubtitleTrack[] = [...initialSubtitles];
    if (activeStream?.subtitles) {
      for (const s of activeStream.subtitles) {
        if (!combined.some((x) => x.uri === s.uri)) {
          combined.push(s);
        }
      }
    }
    setAvailableSubtitles(combined);
  }, [activeStream, initialSubtitles]);

  // Load Video Source via HLS.js or Native MP4 / Proxy
  useEffect(() => {
    if (!videoRef.current || !activeStream?.link) return;
    const video = videoRef.current;
    const streamUrl = activeStream.link;
    const isM3u8 = streamUrl.includes(".m3u8") || activeStream.type === "m3u8" || streamUrl.includes("/hls/");
    const isMkv = streamUrl.toLowerCase().includes(".mkv") || activeStream.type === "mkv";
    const hasCustomReferer = Boolean(activeStream.headers?.Referer);

    setPlaybackNotice(null);
    setIsBuffering(true);
    triedProxyRef.current = false;

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (isM3u8 && Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90,
        maxBufferLength: 30,
        maxMaxBufferLength: 600,
      });

      const initialHlsUrl = hasCustomReferer
        ? getProxyStreamUrl(streamUrl, activeStream.headers?.Referer)
        : streamUrl;

      hls.loadSource(initialHlsUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
        setIsBuffering(false);
        video.play().catch(() => {});
        setIsPlaying(true);

        // Quality levels
        if (data.levels && data.levels.length > 0) {
          const lvls = data.levels.map((lvl, index) => ({
            id: index,
            height: lvl.height,
            bitrate: lvl.bitrate,
            label: lvl.height ? `${lvl.height}p` : `Level ${index + 1}`,
          }));
          setQualityLevels(lvls);
        }

        // Audio tracks
        if (hls.audioTracks && hls.audioTracks.length > 0) {
          const tracks = hls.audioTracks.map((t, index) => ({
            id: index,
            name: t.name || t.lang || `Track ${index + 1}`,
            lang: t.lang || "und",
          }));
          setAudioTracks(tracks);
          setSelectedAudioTrack(hls.audioTrack);
        }
      });

      hls.on(Hls.Events.AUDIO_TRACK_SWITCHED, (_, data) => {
        setSelectedAudioTrack(data.id);
      });

      hls.on(Hls.Events.LEVEL_SWITCHED, (_, data) => {
        setSelectedQualityIndex(data.level);
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              if (!triedProxyRef.current && !streamUrl.includes("/api/proxy/")) {
                triedProxyRef.current = true;
                const proxied = getProxyStreamUrl(streamUrl, activeStream.headers?.Referer);
                hls.loadSource(proxied);
                hls.startLoad();
              } else {
                hls.startLoad();
              }
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              if (!triedProxyRef.current && !streamUrl.includes("/api/proxy/")) {
                triedProxyRef.current = true;
                const proxied = getProxyStreamUrl(streamUrl, activeStream.headers?.Referer);
                hls.loadSource(proxied);
                hls.startLoad();
              } else {
                setPlaybackNotice(
                  "Unable to decode stream directly in browser. Try opening in VLC, MX Player, or choosing another server."
                );
                hls.destroy();
              }
              break;
          }
        }
      });

      hlsRef.current = hls;
    } else {
      const initialSrc = hasCustomReferer || isMkv
        ? getProxyStreamUrl(streamUrl, activeStream.headers?.Referer)
        : streamUrl;

      video.src = initialSrc;
      video.onerror = () => {
        if (!triedProxyRef.current && !initialSrc.includes("/api/proxy/")) {
          triedProxyRef.current = true;
          video.src = getProxyStreamUrl(streamUrl, activeStream.headers?.Referer);
          video.play().catch(() => {});
        } else {
          setPlaybackNotice(
            isMkv
              ? "MKV Stream: Browser cannot decode this Matroska codec natively. Use 1-Click Launch below for instant playback in VLC / MX Player or direct download."
              : "Video stream cannot be decoded directly by the browser. Launch with 1-click in VLC / MX Player or use Direct Download."
          );
        }
      };
      video.play().catch(() => {});
      setIsPlaying(true);
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      video.onerror = null;
    };
  }, [activeStream?.link]);

  // Video buffering listeners
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onWaiting = () => setIsBuffering(true);
    const onPlaying = () => setIsBuffering(false);
    const onCanPlay = () => setIsBuffering(false);
    const onSeeking = () => setIsBuffering(true);
    const onSeeked = () => setIsBuffering(false);

    video.addEventListener("waiting", onWaiting);
    video.addEventListener("playing", onPlaying);
    video.addEventListener("canplay", onCanPlay);
    video.addEventListener("seeking", onSeeking);
    video.addEventListener("seeked", onSeeked);

    return () => {
      video.removeEventListener("waiting", onWaiting);
      video.removeEventListener("playing", onPlaying);
      video.removeEventListener("canplay", onCanPlay);
      video.removeEventListener("seeking", onSeeking);
      video.removeEventListener("seeked", onSeeked);
    };
  }, []);

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    setCurrentTime(videoRef.current.currentTime);
    if (videoRef.current.duration) {
      setDuration(videoRef.current.duration);
      onProgressUpdate?.(videoRef.current.currentTime, videoRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const target = parseFloat(e.target.value);
    setCurrentTime(target);
    if (videoRef.current) {
      videoRef.current.currentTime = target;
    }
  };

  const seekRelative = (seconds: number) => {
    if (!videoRef.current) return;
    const newTime = Math.max(0, Math.min(duration || Infinity, videoRef.current.currentTime + seconds));
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const togglePlay = () => {
    if (!videoRef.current || isLocked) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleUserActivity = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying && activeSheet === "none") {
        setShowControls(false);
      }
    }, 4000);
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackRate(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
    setActiveSheet("none");
  };

  const handleQualityChange = (levelIndex: number) => {
    setSelectedQualityIndex(levelIndex);
    if (hlsRef.current) {
      hlsRef.current.currentLevel = levelIndex;
    }
  };

  const handleAudioChange = (trackId: number) => {
    setSelectedAudioTrack(trackId);
    if (hlsRef.current) {
      hlsRef.current.audioTrack = trackId;
    }
    setActiveSheet("none");
  };

  const handleSubtitleChange = (subIndex: number) => {
    setSelectedSubtitleIndex(subIndex);
    setActiveSheet("none");
  };

  const toggleFit = () => {
    setFitMode((prev) => (prev === "contain" ? "cover" : prev === "cover" ? "fill" : "contain"));
  };

  const togglePiP = async () => {
    if (!videoRef.current) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await videoRef.current.requestPictureInPicture();
      }
    } catch (err) {
      console.warn("PiP failed:", err);
    }
  };

  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    if (h > 0) {
      return `${h}:${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
    }
    return `${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const streamUrl = activeStream?.link || "";

  // Get active audio & subtitle labels for bottom bar
  const activeAudioLabel = audioTracks[selectedAudioTrack]?.lang?.toUpperCase() || "HI";
  const activeSubLabel = selectedSubtitleIndex >= 0 ? availableSubtitles[selectedSubtitleIndex]?.language?.toUpperCase() || "SUB" : "NONE";

  return (
    <div
      ref={containerRef}
      onMouseMove={handleUserActivity}
      onClick={handleUserActivity}
      className="fixed inset-0 z-50 bg-black flex items-center justify-center select-none overflow-hidden font-sans"
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        onTimeUpdate={handleTimeUpdate}
        poster={poster}
        playsInline
        className={`w-full h-full ${
          fitMode === "cover"
            ? "object-cover"
            : fitMode === "fill"
            ? "object-fill"
            : "object-contain"
        }`}
      >
        {selectedSubtitleIndex >= 0 && availableSubtitles[selectedSubtitleIndex] && (
          <track
            kind="subtitles"
            src={availableSubtitles[selectedSubtitleIndex].uri}
            label={availableSubtitles[selectedSubtitleIndex].title || "Subtitles"}
            srcLang={availableSubtitles[selectedSubtitleIndex].language || "en"}
            default
          />
        )}
      </video>

      {/* Buffering Animation Overlay (Center) */}
      {isBuffering && !playbackNotice && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          <div className="relative flex items-center justify-center">
            {/* Outer glowing pulsing ring */}
            <div className="w-16 h-16 rounded-full border-4 border-rose-500/20 border-t-[#ff4d4d] animate-spin" />
            <div className="absolute w-8 h-8 rounded-full bg-rose-500/20 animate-ping" />
          </div>
        </div>
      )}

      {/* Lock Notice indicator if locked */}
      {isLocked && showControls && (
        <div className="absolute top-6 left-6 z-40 animate-fadeIn">
          <button
            onClick={() => setIsLocked(false)}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md text-white text-xs font-semibold shadow-2xl transition-all"
          >
            <Unlock className="w-4 h-4 text-[#ff8a80]" />
            <span>Tap to Unlock</span>
          </button>
        </div>
      )}

      {/* Top Header Controls (Matching Image 4) */}
      {!isLocked && (
        <div
          className={`absolute top-0 left-0 right-0 p-4 sm:p-6 bg-gradient-to-b from-black/90 via-black/40 to-transparent flex items-center justify-between transition-opacity duration-300 z-30 ${
            showControls ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/10 text-white transition-colors"
              title="Back"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-sm sm:text-base font-bold text-white tracking-tight truncate max-w-xs sm:max-w-md">
                {title}
              </h1>
              <p className="text-xs text-zinc-400 font-medium">
                {subtitle || "Episode 1"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsLocked(true)}
              className="p-2 rounded-full hover:bg-white/10 text-white transition-colors"
              title="Lock Controls"
            >
              <Lock className="w-5 h-5 text-zinc-300" />
            </button>
            <button
              onClick={togglePiP}
              className="p-2 rounded-full hover:bg-white/10 text-white transition-colors"
              title="Picture in Picture"
            >
              <PictureInPicture className="w-5 h-5 text-zinc-300" />
            </button>
          </div>
        </div>
      )}

      {/* Center Controls (Rewind 10s, Play/Pause, Forward 10s) (Matching Image 4) */}
      {!isLocked && (
        <div
          className={`absolute inset-0 flex items-center justify-center gap-8 sm:gap-14 transition-opacity duration-300 z-20 pointer-events-none ${
            showControls && !isBuffering ? "opacity-100" : "opacity-0"
          }`}
        >
          {/* Rewind 10s */}
          <button
            onClick={() => seekRelative(-10)}
            className="w-14 h-14 rounded-full bg-black/40 hover:bg-black/60 text-white flex flex-col items-center justify-center backdrop-blur-sm pointer-events-auto active:scale-90 transition-all"
            title="Rewind 10 seconds"
          >
            <RotateCcw className="w-6 h-6 text-zinc-200" />
            <span className="text-[10px] font-bold mt-0.5 text-zinc-300">10</span>
          </button>

          {/* Large Center Play / Pause */}
          <button
            onClick={togglePlay}
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center backdrop-blur-md pointer-events-auto active:scale-95 transition-all shadow-2xl"
            title={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <Pause className="w-8 h-8 sm:w-9 sm:h-9 fill-white text-white" />
            ) : (
              <Play className="w-8 h-8 sm:w-9 sm:h-9 fill-white text-white ml-1" />
            )}
          </button>

          {/* Forward 10s */}
          <button
            onClick={() => seekRelative(10)}
            className="w-14 h-14 rounded-full bg-black/40 hover:bg-black/60 text-white flex flex-col items-center justify-center backdrop-blur-sm pointer-events-auto active:scale-90 transition-all"
            title="Fast Forward 10 seconds"
          >
            <RotateCw className="w-6 h-6 text-zinc-200" />
            <span className="text-[10px] font-bold mt-0.5 text-zinc-300">10</span>
          </button>
        </div>
      )}

      {/* Bottom Scrubber & Action Controls (Matching Image 4) */}
      {!isLocked && (
        <div
          className={`absolute bottom-0 left-0 right-0 p-4 sm:p-6 bg-gradient-to-t from-black/95 via-black/60 to-transparent flex flex-col gap-2.5 transition-opacity duration-300 z-30 ${
            showControls ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          {/* Scrubber Timeline */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono font-medium text-zinc-300 min-w-[42px]">
              {formatTime(currentTime)}
            </span>

            <div className="relative flex-1 flex items-center h-5">
              <input
                type="range"
                min={0}
                max={duration || 100}
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-1 bg-zinc-700/80 rounded-lg appearance-none cursor-pointer accent-[#ff4d4d]"
              />
            </div>

            <span className="text-xs font-mono font-medium text-zinc-400 min-w-[42px] text-right">
              {formatTime(duration)}
            </span>
          </div>

          {/* Bottom Action Bar (Matching Image 4) */}
          <div className="flex items-center justify-between pt-1 text-xs text-zinc-300">
            <div className="flex items-center gap-4 sm:gap-6">
              {/* Audio button */}
              <button
                onClick={() => setActiveSheet(activeSheet === "audio" ? "none" : "audio")}
                className="flex items-center gap-1.5 hover:text-white transition-colors"
                title="Audio Tracks"
              >
                <Volume2 className="w-4 h-4 text-zinc-400" />
                <span className="font-semibold uppercase">{activeAudioLabel}</span>
              </button>

              {/* Subtitles button */}
              <button
                onClick={() => setActiveSheet(activeSheet === "subs" ? "none" : "subs")}
                className="flex items-center gap-1.5 hover:text-white transition-colors"
                title="Subtitles"
              >
                <span className="text-zinc-400 font-bold text-xs">[CC]</span>
                <span className="font-semibold">{activeSubLabel}</span>
              </button>

              {/* Speed button */}
              <button
                onClick={() => setActiveSheet(activeSheet === "speed" ? "none" : "speed")}
                className="flex items-center gap-1 hover:text-white transition-colors"
                title="Speed"
              >
                <span className="font-mono font-semibold">{playbackRate}x</span>
              </button>
            </div>

            <div className="flex items-center gap-4 sm:gap-6">
              {/* PIP */}
              <button
                onClick={togglePiP}
                className="hover:text-white transition-colors hidden sm:flex items-center gap-1"
                title="Picture in Picture"
              >
                <PictureInPicture className="w-4 h-4 text-zinc-400" />
                <span className="text-xs font-medium">PIP</span>
              </button>

              {/* Quality & Server Selector (Image 5 sheet trigger) */}
              <button
                onClick={() => setActiveSheet(activeSheet === "quality" ? "none" : "quality")}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-800/80 hover:bg-zinc-700 text-white font-bold text-xs transition-colors"
                title="Server & Quality Selection"
              >
                <span className="text-[10px] px-1 py-0.2 rounded bg-zinc-700 text-zinc-300">HD</span>
                <span>{qualityLevels[selectedQualityIndex]?.label || "1080p"}</span>
              </button>

              {/* Fit / Aspect Ratio */}
              <button
                onClick={toggleFit}
                className="hover:text-white transition-colors flex items-center gap-1"
                title="Aspect Ratio"
              >
                <Maximize2 className="w-4 h-4 text-zinc-400" />
                <span className="capitalize text-xs font-medium">Fit</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Sheet for Quality & Server (Matching Image 5) */}
      {activeSheet === "quality" && (
        <div className="absolute inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="relative w-full max-w-2xl bg-[#141416] border border-zinc-800 rounded-3xl p-5 sm:p-6 shadow-2xl text-white">
            {/* Close */}
            <button
              onClick={() => setActiveSheet("none")}
              className="absolute top-4 right-4 p-2 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Two Column Layout: Server | Quality */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-2">
              {/* Left Column: Server */}
              <div>
                <h3 className="text-sm font-bold text-zinc-300 text-center mb-3">Server</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar pr-1">
                  {resolvedStreams.length > 0 ? (
                    resolvedStreams.map((s, idx) => {
                      const isSelected = idx === selectedStreamIndex;
                      return (
                        <div
                          key={idx}
                          onClick={() => {
                            setSelectedStreamIndex(idx);
                            setActiveSheet("none");
                          }}
                          className={`p-3 rounded-2xl border cursor-pointer flex items-center justify-between transition-all ${
                            isSelected
                              ? "bg-zinc-800/90 border-white text-white"
                              : "bg-[#1c1c20] border-zinc-800/80 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Tv className="w-4 h-4 text-zinc-400" />
                            <div>
                              <span className="block text-xs font-bold text-white">
                                {s.server || `Server #${idx + 1}`}
                              </span>
                              <span className="text-[10px] text-zinc-400 font-mono">
                                {s.quality || "1080"}
                              </span>
                            </div>
                          </div>
                          {isSelected && <CheckCircle2 className="w-5 h-5 text-white" />}
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-3 rounded-2xl bg-zinc-800 border border-white text-white flex items-center justify-between">
                      <span className="text-xs font-bold">Netflix Auto</span>
                      <CheckCircle2 className="w-5 h-5 text-white" />
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Quality */}
              <div>
                <h3 className="text-sm font-bold text-zinc-300 text-center mb-3">Quality</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar pr-1">
                  {/* Auto option */}
                  <div
                    onClick={() => {
                      handleQualityChange(-1);
                      setActiveSheet("none");
                    }}
                    className={`p-3 rounded-2xl border cursor-pointer flex items-center justify-between transition-all ${
                      selectedQualityIndex === -1
                        ? "bg-zinc-800/90 border-white text-white"
                        : "bg-[#1c1c20] border-zinc-800/80 text-zinc-400 hover:border-zinc-700"
                    }`}
                  >
                    <div>
                      <span className="block text-xs font-bold text-white">Auto</span>
                      <span className="text-[10px] text-zinc-400">Adaptive bitrate</span>
                    </div>
                    {selectedQualityIndex === -1 && <CheckCircle2 className="w-5 h-5 text-white" />}
                  </div>

                  {/* Available heights */}
                  {qualityLevels.length > 0 ? (
                    qualityLevels.map((lvl) => {
                      const isSelected = selectedQualityIndex === lvl.id;
                      return (
                        <div
                          key={lvl.id}
                          onClick={() => {
                            handleQualityChange(lvl.id);
                            setActiveSheet("none");
                          }}
                          className={`p-3 rounded-2xl border cursor-pointer flex items-center justify-between transition-all ${
                            isSelected
                              ? "bg-zinc-800/90 border-white text-white"
                              : "bg-[#1c1c20] border-zinc-800/80 text-zinc-400 hover:border-zinc-700"
                          }`}
                        >
                          <div>
                            <span className="block text-xs font-bold text-white">{lvl.label}</span>
                            <span className="text-[10px] text-zinc-400 font-mono">
                              {lvl.bitrate ? `${Math.round(lvl.bitrate / 1000)} kbps` : "High Definition"}
                            </span>
                          </div>
                          {isSelected && <CheckCircle2 className="w-5 h-5 text-white" />}
                        </div>
                      );
                    })
                  ) : (
                    <>
                      <div className="p-3 rounded-2xl bg-[#1c1c20] border border-zinc-800 flex items-center justify-between">
                        <div>
                          <span className="block text-xs font-bold text-white">1080p</span>
                          <span className="text-[10px] text-zinc-400 font-mono">1.0 Mbps · 1920x1080</span>
                        </div>
                        <span className="text-[10px] px-1 rounded bg-zinc-800 text-zinc-400">HD</span>
                      </div>
                      <div className="p-3 rounded-2xl bg-[#1c1c20] border border-zinc-800 flex items-center justify-between">
                        <div>
                          <span className="block text-xs font-bold text-white">720p</span>
                          <span className="text-[10px] text-zinc-400 font-mono">600 kbps · 1280x720</span>
                        </div>
                        <span className="text-[10px] px-1 rounded bg-zinc-800 text-zinc-400">HD</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Sheet for Audio Tracks */}
      {activeSheet === "audio" && (
        <div className="absolute inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="relative w-full max-w-md bg-[#141416] border border-zinc-800 rounded-3xl p-5 shadow-2xl text-white">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="text-sm font-bold text-white">Select Audio Track</h3>
              <button onClick={() => setActiveSheet("none")}>
                <X className="w-5 h-5 text-zinc-400 hover:text-white" />
              </button>
            </div>
            <div className="space-y-2 mt-4 max-h-60 overflow-y-auto custom-scrollbar">
              {audioTracks.length > 0 ? (
                audioTracks.map((t) => {
                  const isSelected = selectedAudioTrack === t.id;
                  return (
                    <div
                      key={t.id}
                      onClick={() => handleAudioChange(t.id)}
                      className={`p-3 rounded-2xl border cursor-pointer flex items-center justify-between transition-all ${
                        isSelected
                          ? "bg-zinc-800 border-white text-white"
                          : "bg-[#1c1c20] border-zinc-800 text-zinc-400 hover:text-white"
                      }`}
                    >
                      <span className="text-xs font-bold">{t.name}</span>
                      {isSelected && <CheckCircle2 className="w-5 h-5 text-white" />}
                    </div>
                  );
                })
              ) : (
                <div className="p-3 rounded-2xl bg-zinc-800 border border-white text-white flex items-center justify-between">
                  <span className="text-xs font-bold">Default / Original Audio</span>
                  <CheckCircle2 className="w-5 h-5 text-white" />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Sheet for Subtitles */}
      {activeSheet === "subs" && (
        <div className="absolute inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="relative w-full max-w-md bg-[#141416] border border-zinc-800 rounded-3xl p-5 shadow-2xl text-white">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="text-sm font-bold text-white">Subtitles</h3>
              <button onClick={() => setActiveSheet("none")}>
                <X className="w-5 h-5 text-zinc-400 hover:text-white" />
              </button>
            </div>
            <div className="space-y-2 mt-4 max-h-60 overflow-y-auto custom-scrollbar">
              <div
                onClick={() => handleSubtitleChange(-1)}
                className={`p-3 rounded-2xl border cursor-pointer flex items-center justify-between transition-all ${
                  selectedSubtitleIndex === -1
                    ? "bg-zinc-800 border-white text-white"
                    : "bg-[#1c1c20] border-zinc-800 text-zinc-400 hover:text-white"
                }`}
              >
                <span className="text-xs font-bold">Off</span>
                {selectedSubtitleIndex === -1 && <CheckCircle2 className="w-5 h-5 text-white" />}
              </div>
              {availableSubtitles.map((sub, idx) => {
                const isSelected = selectedSubtitleIndex === idx;
                return (
                  <div
                    key={idx}
                    onClick={() => handleSubtitleChange(idx)}
                    className={`p-3 rounded-2xl border cursor-pointer flex items-center justify-between transition-all ${
                      isSelected
                        ? "bg-zinc-800 border-white text-white"
                        : "bg-[#1c1c20] border-zinc-800 text-zinc-400 hover:text-white"
                    }`}
                  >
                    <span className="text-xs font-bold">{sub.title || sub.language}</span>
                    {isSelected && <CheckCircle2 className="w-5 h-5 text-white" />}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Modal Sheet for Playback Speed */}
      {activeSheet === "speed" && (
        <div className="absolute inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="relative w-full max-w-xs bg-[#141416] border border-zinc-800 rounded-3xl p-5 shadow-2xl text-white">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="text-sm font-bold text-white">Playback Speed</h3>
              <button onClick={() => setActiveSheet("none")}>
                <X className="w-5 h-5 text-zinc-400 hover:text-white" />
              </button>
            </div>
            <div className="space-y-2 mt-4">
              {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map((s) => (
                <div
                  key={s}
                  onClick={() => handleSpeedChange(s)}
                  className={`p-2.5 rounded-xl border cursor-pointer flex items-center justify-between ${
                    playbackRate === s
                      ? "bg-zinc-800 border-white text-white font-bold"
                      : "bg-[#1c1c20] border-zinc-800 text-zinc-400"
                  }`}
                >
                  <span className="text-xs">{s}x {s === 1.0 ? "(Normal)" : ""}</span>
                  {playbackRate === s && <Check className="w-4 h-4 text-white" />}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Fallback Notice Overlay (VLC / MX Player) */}
      {playbackNotice && (
        <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-fadeIn">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 mb-4 shadow-xl">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-white mb-2">Stream Playback Notice</h2>
          <p className="text-xs sm:text-sm text-zinc-300 max-w-md mb-6 leading-relaxed">
            {playbackNotice}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <a
              href={getVlcUrl(streamUrl)}
              className="px-4 py-2.5 rounded-xl font-bold text-xs bg-orange-600 hover:bg-orange-500 text-white flex items-center gap-2 shadow-lg"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              Play in VLC
            </a>
            <a
              href={getMxPlayerIntent(streamUrl, title)}
              className="px-4 py-2.5 rounded-xl font-bold text-xs bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-2 shadow-lg"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              Play in MX Player
            </a>
            <a
              href={getProxyStreamUrl(streamUrl, activeStream?.headers?.Referer)}
              download={title || "video.mp4"}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2.5 rounded-xl font-bold text-xs bg-rose-600 hover:bg-rose-500 text-white flex items-center gap-2 shadow-lg"
            >
              <Download className="w-3.5 h-3.5" />
              Direct Download
            </a>
          </div>
        </div>
      )}
    </div>
  );
};
