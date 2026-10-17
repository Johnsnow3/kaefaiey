import React, { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  PictureInPicture,
  Download,
  ExternalLink,
  Copy,
  Check,
  Languages,
  Subtitles as SubtitlesIcon,
  Server,
  X,
  Settings,
  ChevronDown,
} from "lucide-react";
import { MediaStream, SubtitleTrack } from "../types";
import {
  getMxPlayerIntent,
  getProxyStreamUrl,
  getVlcUrl,
  getCurlDownloadCommand,
  getMpvCommand,
} from "../services/api";

interface VideoPlayerProps {
  title: string;
  streams: MediaStream[];
  initialSubtitles?: SubtitleTrack[];
  onClose: () => void;
  onProgressUpdate?: (currentTime: number, duration: number) => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  title,
  streams,
  initialSubtitles = [],
  onClose,
  onProgressUpdate,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  // Active Server Stream
  const [selectedStreamIndex, setSelectedStreamIndex] = useState(0);
  const activeStream = streams[selectedStreamIndex] || streams[0];

  // Playback State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef<any>(null);

  // Audio & Subtitle Tracks
  const [audioTracks, setAudioTracks] = useState<{ id: number; name: string; lang: string }[]>([]);
  const [selectedAudioTrack, setSelectedAudioTrack] = useState<number>(-1);

  const [availableSubtitles, setAvailableSubtitles] = useState<SubtitleTrack[]>([]);
  const [selectedSubtitleIndex, setSelectedSubtitleIndex] = useState<number>(-1); // -1 is off

  // Menus
  const [activeMenu, setActiveMenu] = useState<"none" | "server" | "audio" | "subs" | "speed" | "external">("none");
  const [copiedLink, setCopiedLink] = useState(false);

  // Aggregate subtitles from stream object + initial props
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

  // Load Video Source via HLS.js or Native MP4
  useEffect(() => {
    if (!videoRef.current || !activeStream?.link) return;
    const video = videoRef.current;
    const streamUrl = activeStream.link;
    const isM3u8 = streamUrl.includes(".m3u8") || activeStream.type === "m3u8";

    // Clean up previous HLS instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (isM3u8 && Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90,
      });

      hls.loadSource(streamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => {});
        setIsPlaying(true);

        // Populate HLS audio tracks (English, Hindi, etc.)
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

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              hls.destroy();
              break;
          }
        }
      });

      hlsRef.current = hls;
    } else {
      // Native video playback (MP4 or Safari native HLS)
      video.src = streamUrl;
      video.play().catch(() => {});
      setIsPlaying(true);
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [activeStream?.link]);

  // Track playback time
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    setCurrentTime(videoRef.current.currentTime);
    if (videoRef.current.duration) {
      setDuration(videoRef.current.duration);
      onProgressUpdate?.(videoRef.current.currentTime, videoRef.current.duration);
    }
  };

  // Auto-hide controls
  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying && activeMenu === "none") {
        setShowControls(false);
      }
    }, 3500);
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const seekRelative = (seconds: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.max(
      0,
      Math.min(videoRef.current.currentTime + seconds, duration)
    );
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return;
    const time = parseFloat(e.target.value);
    videoRef.current.currentTime = time;
    setCurrentTime(time);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
      setIsMuted(val === 0);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const nextMuted = !isMuted;
    videoRef.current.muted = nextMuted;
    setIsMuted(nextMuted);
    if (!nextMuted && volume === 0) {
      setVolume(0.5);
      videoRef.current.volume = 0.5;
    }
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackRate(speed);
    if (videoRef.current) videoRef.current.playbackRate = speed;
    setActiveMenu("none");
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const togglePiP = async () => {
    if (!videoRef.current) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await videoRef.current.requestPictureInPicture();
      }
    } catch (e) {
      console.warn("PiP not supported", e);
    }
  };

  // Switch Audio Track (Multi-audio support e.g. English, Hindi)
  const handleSelectAudioTrack = (trackId: number) => {
    if (hlsRef.current) {
      hlsRef.current.audioTrack = trackId;
      setSelectedAudioTrack(trackId);
    }
    setActiveMenu("none");
  };

  // Switch Subtitle Track (English, Hindi, etc.)
  const handleSelectSubtitle = (index: number) => {
    setSelectedSubtitleIndex(index);
    setActiveMenu("none");
  };

  const handleCopyLink = () => {
    if (activeStream?.link) {
      navigator.clipboard.writeText(activeStream.link);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return "00:00";
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    }
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="fixed inset-0 z-50 bg-black flex items-center justify-center select-none overflow-hidden font-sans"
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        onTimeUpdate={handleTimeUpdate}
        onClick={togglePlay}
        playsInline
        className="w-full h-full object-contain cursor-pointer"
      >
        {/* Render external VTT Subtitle Track if selected */}
        {selectedSubtitleIndex >= 0 &&
          availableSubtitles[selectedSubtitleIndex] && (
            <track
              kind="subtitles"
              src={availableSubtitles[selectedSubtitleIndex].uri}
              label={availableSubtitles[selectedSubtitleIndex].title || "Subtitles"}
              srcLang={availableSubtitles[selectedSubtitleIndex].language || "en"}
              default
            />
          )}
      </video>

      {/* Top Header Controls */}
      <div
        className={`absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/90 via-black/40 to-transparent flex items-center justify-between transition-opacity duration-300 z-10 ${
          showControls ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-colors"
            title="Close Player"
          >
            <X className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-sm md:text-base font-bold text-white tracking-tight truncate max-w-md md:max-w-xl">
              {title}
            </h1>
            <p className="text-xs text-cyan-400 font-mono">
              {activeStream?.server || "Main Server"} • {activeStream?.type?.toUpperCase() || "HD"}
            </p>
          </div>
        </div>

        {/* Top Right Quick Actions: External Player & Direct Download */}
        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              setActiveMenu(activeMenu === "external" ? "none" : "external")
            }
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-indigo-600 text-xs font-semibold text-white flex items-center gap-1.5 backdrop-blur-md transition-colors"
            title="Open in VLC, MX Player, or Download Manager"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">External Players</span>
          </button>
        </div>
      </div>

      {/* Center Large Play/Pause Toggle Indicator on Click */}
      {!isPlaying && (
        <div
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center cursor-pointer"
        >
          <div className="w-20 h-20 rounded-full bg-indigo-600/90 hover:bg-indigo-500 text-white flex items-center justify-center shadow-2xl shadow-indigo-500/50 backdrop-blur-md transform transition hover:scale-110">
            <Play className="w-9 h-9 ml-1 fill-white" />
          </div>
        </div>
      )}

      {/* Bottom Floating Control Bar */}
      <div
        className={`absolute bottom-0 left-0 right-0 p-4 md:p-6 bg-gradient-to-t from-black/95 via-black/60 to-transparent flex flex-col gap-2 transition-opacity duration-300 z-10 ${
          showControls ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Timeline Progress Bar */}
        <div className="flex items-center gap-3 w-full group">
          <span className="text-xs font-mono text-gray-300 min-w-[45px]">
            {formatTime(currentTime)}
          </span>
          <div className="relative flex-1 flex items-center">
            <input
              type="range"
              min={0}
              max={duration || 100}
              step={0.5}
              value={currentTime}
              onChange={handleSeekChange}
              className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-cyan-400 hover:h-2 transition-all"
            />
          </div>
          <span className="text-xs font-mono text-gray-400 min-w-[45px]">
            {formatTime(duration)}
          </span>
        </div>

        {/* Buttons Control Row */}
        <div className="flex items-center justify-between mt-1">
          {/* Left Controls: Play/Pause, Skips, Volume */}
          <div className="flex items-center gap-2 md:gap-4">
            <button
              onClick={togglePlay}
              className="p-2 text-white hover:text-cyan-400 transition-colors"
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
            </button>

            <button
              onClick={() => seekRelative(-10)}
              className="p-2 text-gray-300 hover:text-white transition-colors"
              title="Rewind 10 seconds"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={() => seekRelative(10)}
              className="p-2 text-gray-300 hover:text-white transition-colors"
              title="Forward 10 seconds"
            >
              <RotateCw className="w-4 h-4" />
            </button>

            {/* Volume Control */}
            <div className="flex items-center gap-2 group">
              <button
                onClick={toggleMute}
                className="p-2 text-gray-300 hover:text-white"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4 text-rose-400" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-16 md:w-24 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-indigo-400"
              />
            </div>
          </div>

          {/* Right Controls: Servers, Multi-Audio, Subtitles, Speed, PiP, Fullscreen */}
          <div className="flex items-center gap-1.5 md:gap-3">
            {/* Server Switcher Button */}
            {streams.length > 1 && (
              <div className="relative">
                <button
                  onClick={() =>
                    setActiveMenu(activeMenu === "server" ? "none" : "server")
                  }
                  className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs text-white flex items-center gap-1 font-medium transition-colors"
                >
                  <Server className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="hidden md:inline">Server</span>
                  <ChevronDown className="w-3 h-3" />
                </button>

                {activeMenu === "server" && (
                  <div className="absolute bottom-10 right-0 w-48 bg-[#12151f] border border-white/10 rounded-xl shadow-2xl p-1.5 z-30">
                    <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-2 py-1">
                      Choose Stream Server
                    </div>
                    {streams.map((s, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setSelectedStreamIndex(idx);
                          setActiveMenu("none");
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between ${
                          selectedStreamIndex === idx
                            ? "bg-indigo-600 text-white font-bold"
                            : "text-gray-300 hover:bg-white/10"
                        }`}
                      >
                        <span className="truncate">{s.server || `Server ${idx + 1}`}</span>
                        <span className="text-[10px] font-mono text-cyan-300 ml-2">
                          {s.type}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Multi-Audio Track Selector Button (English / Hindi / Japanese) */}
            {audioTracks.length > 1 && (
              <div className="relative">
                <button
                  onClick={() =>
                    setActiveMenu(activeMenu === "audio" ? "none" : "audio")
                  }
                  className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs text-white flex items-center gap-1 font-medium transition-colors"
                  title="Audio Language (e.g. English, Hindi)"
                >
                  <Languages className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden md:inline">Audio</span>
                  <ChevronDown className="w-3 h-3" />
                </button>

                {activeMenu === "audio" && (
                  <div className="absolute bottom-10 right-0 w-44 bg-[#12151f] border border-white/10 rounded-xl shadow-2xl p-1.5 z-30">
                    <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-2 py-1">
                      Audio Tracks
                    </div>
                    {audioTracks.map((trk) => (
                      <button
                        key={trk.id}
                        onClick={() => handleSelectAudioTrack(trk.id)}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between ${
                          selectedAudioTrack === trk.id
                            ? "bg-emerald-600 text-white font-bold"
                            : "text-gray-300 hover:bg-white/10"
                        }`}
                      >
                        <span className="capitalize">{trk.name}</span>
                        {selectedAudioTrack === trk.id && (
                          <Check className="w-3.5 h-3.5 text-white" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Subtitles Button (English, Hindi, etc.) */}
            {availableSubtitles.length > 0 && (
              <div className="relative">
                <button
                  onClick={() =>
                    setActiveMenu(activeMenu === "subs" ? "none" : "subs")
                  }
                  className={`px-2.5 py-1 rounded-lg text-xs flex items-center gap-1 font-medium transition-colors ${
                    selectedSubtitleIndex >= 0
                      ? "bg-indigo-600 text-white"
                      : "bg-white/10 hover:bg-white/20 text-white"
                  }`}
                  title="Subtitles"
                >
                  <SubtitlesIcon className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Subtitles</span>
                  <ChevronDown className="w-3 h-3" />
                </button>

                {activeMenu === "subs" && (
                  <div className="absolute bottom-10 right-0 w-48 bg-[#12151f] border border-white/10 rounded-xl shadow-2xl p-1.5 z-30 max-h-56 overflow-y-auto">
                    <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-2 py-1">
                      Subtitles
                    </div>
                    <button
                      onClick={() => handleSelectSubtitle(-1)}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between ${
                        selectedSubtitleIndex === -1
                          ? "bg-indigo-600 text-white font-bold"
                          : "text-gray-300 hover:bg-white/10"
                      }`}
                    >
                      <span>Off</span>
                      {selectedSubtitleIndex === -1 && <Check className="w-3.5 h-3.5 text-white" />}
                    </button>
                    {availableSubtitles.map((sub, i) => (
                      <button
                        key={i}
                        onClick={() => handleSelectSubtitle(i)}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between ${
                          selectedSubtitleIndex === i
                            ? "bg-indigo-600 text-white font-bold"
                            : "text-gray-300 hover:bg-white/10"
                        }`}
                      >
                        <span className="truncate">{sub.title || sub.language || `Sub ${i + 1}`}</span>
                        {selectedSubtitleIndex === i && <Check className="w-3.5 h-3.5 text-white" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Playback Speed */}
            <div className="relative">
              <button
                onClick={() =>
                  setActiveMenu(activeMenu === "speed" ? "none" : "speed")
                }
                className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs text-white font-mono transition-colors"
                title="Playback Speed"
              >
                {playbackRate}x
              </button>

              {activeMenu === "speed" && (
                <div className="absolute bottom-10 right-0 w-28 bg-[#12151f] border border-white/10 rounded-xl shadow-2xl p-1 z-30">
                  {[0.5, 0.75, 1, 1.25, 1.5, 2].map((sp) => (
                    <button
                      key={sp}
                      onClick={() => handleSpeedChange(sp)}
                      className={`w-full text-left px-2.5 py-1 rounded-lg text-xs font-mono ${
                        playbackRate === sp
                          ? "bg-indigo-600 text-white font-bold"
                          : "text-gray-300 hover:bg-white/10"
                      }`}
                    >
                      {sp}x
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* PiP Button */}
            <button
              onClick={togglePiP}
              className="p-2 text-gray-300 hover:text-white transition-colors hidden sm:block"
              title="Picture in Picture"
            >
              <PictureInPicture className="w-4 h-4" />
            </button>

            {/* Fullscreen Button */}
            <button
              onClick={toggleFullscreen}
              className="p-2 text-gray-300 hover:text-white transition-colors"
              title="Fullscreen"
            >
              {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* External Player & Download Modal */}
      {activeMenu === "external" && (
        <div className="absolute inset-0 z-40 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#12151f] border border-white/15 rounded-3xl p-5 shadow-2xl text-white">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <ExternalLink className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold">External Players & Downloads</h3>
              </div>
              <button
                onClick={() => setActiveMenu("none")}
                className="p-1 rounded-lg text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-2.5">
              {/* VLC Launcher */}
              <a
                href={getVlcUrl(activeStream.link)}
                className="w-full p-3 rounded-2xl bg-white/[0.04] hover:bg-indigo-600/30 border border-white/[0.08] hover:border-indigo-500/50 flex items-center justify-between group transition-all"
              >
                <div>
                  <div className="text-sm font-semibold flex items-center gap-2">
                    <span>🚀 Open in VLC Player</span>
                  </div>
                  <p className="text-xs text-gray-400">
                    Works on Windows, macOS, Android, and iOS
                  </p>
                </div>
                <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-white" />
              </a>

              {/* MX Player Launcher (Android) */}
              <a
                href={getMxPlayerIntent(activeStream.link, title)}
                className="w-full p-3 rounded-2xl bg-white/[0.04] hover:bg-cyan-600/30 border border-white/[0.08] hover:border-cyan-500/50 flex items-center justify-between group transition-all"
              >
                <div>
                  <div className="text-sm font-semibold">
                    📱 Open in MX Player
                  </div>
                  <p className="text-xs text-gray-400">
                    Direct Android Intent stream playback
                  </p>
                </div>
                <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-white" />
              </a>

              {/* Direct Download Button via Stream Proxy */}
              <a
                href={getProxyStreamUrl(activeStream.link, activeStream.headers?.Referer)}
                download={title || "video.mp4"}
                target="_blank"
                rel="noreferrer"
                className="w-full p-3 rounded-2xl bg-white/[0.04] hover:bg-emerald-600/30 border border-white/[0.08] hover:border-emerald-500/50 flex items-center justify-between group transition-all"
              >
                <div>
                  <div className="text-sm font-semibold flex items-center gap-2">
                    <Download className="w-4 h-4 text-emerald-400" />
                    <span>Direct Video Download</span>
                  </div>
                  <p className="text-xs text-gray-400">
                    Save to disk via Flim Baazy high-speed stream proxy
                  </p>
                </div>
                <Download className="w-4 h-4 text-emerald-400" />
              </a>

              {/* Copy Stream Link */}
              <div className="pt-2">
                <div className="text-xs text-gray-400 font-medium mb-1">
                  Raw Streaming Link
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={activeStream.link}
                    className="w-full p-2 bg-black/40 border border-white/10 rounded-xl text-xs font-mono text-gray-300 select-all focus:outline-none"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors"
                  >
                    {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedLink ? "Copied" : "Copy"}</span>
                  </button>
                </div>
              </div>

              {/* MPV / Terminal Command snippet */}
              <div className="pt-1">
                <div className="text-[11px] text-gray-400 font-medium mb-1">
                  Command for MPV / IDM:
                </div>
                <code className="block p-2 bg-black/60 rounded-xl text-[10px] font-mono text-cyan-300 break-all select-all">
                  {getMpvCommand(activeStream.link, activeStream.headers)}
                </code>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
