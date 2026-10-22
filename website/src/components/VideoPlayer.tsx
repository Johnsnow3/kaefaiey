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
  Check,
  CheckCircle2,
  Download,
  AlertTriangle,
  X,
  Maximize2,
  Tv,
  Gauge,
} from "lucide-react";
import { MediaStream, SubtitleTrack } from "../types";
import {
  getMxPlayerIntent,
  getProxyStreamUrl,
  getProxySubtitleUrl,
  getVlcUrl,
} from "../services/api";

// ─── Custom Icons for Netflix / MX Player matching Image 1 & 4 ───────────────
const AudioWaveIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <rect x="3" y="9" width="2.2" height="6" rx="1.1" />
    <rect x="7.5" y="5.5" width="2.2" height="13" rx="1.1" />
    <rect x="12" y="2.5" width="2.2" height="19" rx="1.1" />
    <rect x="16.5" y="5.5" width="2.2" height="13" rx="1.1" />
    <rect x="21" y="9" width="2.2" height="6" rx="1.1" />
  </svg>
);

const SubtitlesIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect x="2.5" y="5" width="19" height="14" rx="3" />
    <path d="M7 15h4M15 15h2M7 11h2M13 11h4" />
  </svg>
);

interface ParsedCue {
  start: number;
  end: number;
  text: string;
}

function parseVttTime(timeStr: string): number {
  try {
    const clean = timeStr.trim();
    const parts = clean.split(":");
    if (parts.length === 3) {
      const [h, m, rest] = parts;
      const [s, ms] = rest.split(".");
      return (
        parseInt(h, 10) * 3600 +
        parseInt(m, 10) * 60 +
        parseInt(s, 10) +
        parseInt((ms || "0").slice(0, 3), 10) / 1000
      );
    } else if (parts.length === 2) {
      const [m, rest] = parts;
      const [s, ms] = rest.split(".");
      return (
        parseInt(m, 10) * 60 +
        parseInt(s, 10) +
        parseInt((ms || "0").slice(0, 3), 10) / 1000
      );
    }
  } catch {}
  return 0;
}

function parseVttText(vtt: string): ParsedCue[] {
  const cues: ParsedCue[] = [];
  const lines = vtt.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trim();
    if (line.includes("-->")) {
      const [startStr, endStr] = line.split("-->").map((s) => s.trim().split(" ")[0]);
      const start = parseVttTime(startStr);
      const end = parseVttTime(endStr);
      const textLines: string[] = [];
      i++;
      while (i < lines.length && lines[i].trim() !== "") {
        textLines.push(lines[i].trim().replace(/<[^>]+>/g, ""));
        i++;
      }
      if (textLines.length > 0 && end > start) {
        cues.push({ start, end, text: textLines.join("\n") });
      }
    } else {
      i++;
    }
  }
  return cues;
}

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
  const triedDirectRef = useRef(false);

  // Active Server Stream - Prioritize first HLS (m3u8) stream for maximum browser playback compatibility
  const initialIndex = resolvedStreams.findIndex(
    (s) => s.type === "m3u8" || s.link.includes(".m3u8")
  );
  const [selectedStreamIndex, setSelectedStreamIndex] = useState(
    initialIndex >= 0 ? initialIndex : 0
  );
  const activeStream = resolvedStreams[selectedStreamIndex] || resolvedStreams[0];

  // Playback & Controls State
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

  // Orientation & Fullscreen State
  const [isRotated, setIsRotated] = useState(false);
  const [isPortraitDetected, setIsPortraitDetected] = useState(false);

  // Audio & Subtitle Tracks State
  const [audioTracks, setAudioTracks] = useState<{ id: number; name: string; lang: string; codec?: string }[]>([]);
  const [selectedAudioTrack, setSelectedAudioTrack] = useState<number>(0);

  const [availableSubtitles, setAvailableSubtitles] = useState<(SubtitleTrack & { hlsTrackId?: number })[]>([]);
  const [selectedSubtitleIndex, setSelectedSubtitleIndex] = useState<number>(-1);
  const [activeCues, setActiveCues] = useState<ParsedCue[]>([]);

  // Quality levels from HLS
  const [qualityLevels, setQualityLevels] = useState<{ id: number; height: number; bitrate?: number; label: string }[]>([]);
  const [selectedQualityIndex, setSelectedQualityIndex] = useState<number>(-1); // -1 is Auto

  // Modal Sheets: "none" | "quality" | "audio" | "subs" | "speed"
  const [activeSheet, setActiveSheet] = useState<"none" | "quality" | "audio" | "subs" | "speed">("none");

  // Detect screen orientation and attempt auto-landscape lock
  useEffect(() => {
    const checkOrientation = () => {
      const isPortrait = window.innerHeight > window.innerWidth;
      setIsPortraitDetected(isPortrait);
    };

    checkOrientation();
    window.addEventListener("resize", checkOrientation);

    // Attempt auto fullscreen & landscape lock on mount
    const triggerAutoLandscape = async () => {
      try {
        if (containerRef.current?.requestFullscreen) {
          await containerRef.current.requestFullscreen();
        } else if ((containerRef.current as any)?.webkitRequestFullscreen) {
          await (containerRef.current as any).webkitRequestFullscreen();
        }
      } catch {}

      try {
        if (window.screen.orientation && typeof (window.screen.orientation as any).lock === "function") {
          await (window.screen.orientation as any).lock("landscape");
        }
      } catch {}
    };

    triggerAutoLandscape();

    return () => {
      window.removeEventListener("resize", checkOrientation);
      try {
        if (window.screen.orientation && typeof (window.screen.orientation as any).unlock === "function") {
          (window.screen.orientation as any).unlock();
        }
      } catch {}
      try {
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        }
      } catch {}
    };
  }, []);

  // Aggregate external subtitles and initial subtitles (strictly filtering preview thumbnail sprites)
  useEffect(() => {
    const isRealSub = (s: SubtitleTrack) => {
      const u = (s.uri || "").toLowerCase();
      const t = (s.title || "").toLowerCase();
      if (u.includes("back0") || u.includes("t001.jpg") || u.includes(".jpg") || t.includes("thumbnail")) {
        return false;
      }
      return true;
    };

    const combined: (SubtitleTrack & { hlsTrackId?: number })[] = [
      ...initialSubtitles.filter(isRealSub),
    ];
    if (activeStream?.subtitles) {
      for (const s of activeStream.subtitles) {
        if (isRealSub(s) && !combined.some((x) => x.uri === s.uri)) {
          combined.push(s);
        }
      }
    }
    setAvailableSubtitles(combined);
    if (combined.length > 0 && selectedSubtitleIndex === -1) {
      const enIdx = combined.findIndex(
        (s) =>
          (s.language || "").toLowerCase().startsWith("en") ||
          (s.title || "").toLowerCase().includes("english")
      );
      setSelectedSubtitleIndex(enIdx >= 0 ? enIdx : 0);
    }
  }, [activeStream, initialSubtitles]);

  // Load and parse cues whenever selectedSubtitleIndex changes
  useEffect(() => {
    if (selectedSubtitleIndex === -1) {
      setActiveCues([]);
      return;
    }

    const currentSub = availableSubtitles[selectedSubtitleIndex];
    if (!currentSub || !currentSub.uri) {
      setActiveCues([]);
      return;
    }

    let isMounted = true;
    const fetchSubtitles = async () => {
      try {
        const subProxyUrl = getProxySubtitleUrl(
          currentSub.uri,
          activeStream?.headers?.Referer
        );
        const res = await fetch(subProxyUrl);
        if (res.ok) {
          const text = await res.text();
          if (isMounted) {
            const parsed = parseVttText(text);
            setActiveCues(parsed);
          }
        }
      } catch (err) {
        console.warn("Failed to fetch external subtitles:", err);
      }
    };

    fetchSubtitles();
    return () => {
      isMounted = false;
    };
  }, [selectedSubtitleIndex, availableSubtitles, activeStream?.headers?.Referer]);

  // Load Video Source via HLS.js or Native MP4 / Range Proxy
  useEffect(() => {
    if (!videoRef.current || !activeStream?.link) return;
    const video = videoRef.current;
    const streamUrl = activeStream.link;
    const lowerUrl = streamUrl.toLowerCase();
    const isM3u8 = streamUrl.includes(".m3u8") || activeStream.type === "m3u8" || streamUrl.includes("/hls/") || lowerUrl.includes("hls_variant");
    const isMkv = lowerUrl.includes(".mkv") || activeStream.type === "mkv";
    const hasCustomReferer = Boolean(activeStream.headers?.Referer);

    const needsProxy =
      hasCustomReferer ||
      Boolean(activeStream.headers?.Cookie) ||
      isMkv ||
      lowerUrl.includes("googlevideo.com") ||
      lowerUrl.includes("youtube.com") ||
      lowerUrl.includes("mxplayer.in") ||
      lowerUrl.includes("cloudfront.net") ||
      lowerUrl.includes("hakunaymatata.com") ||
      lowerUrl.includes("officialmoviebox.com") ||
      lowerUrl.includes("net52.cc") ||
      lowerUrl.includes("makhi") ||
      lowerUrl.includes("freecdn") ||
      lowerUrl.includes("imgcdn.kim") ||
      lowerUrl.includes("hscow.com") ||
      lowerUrl.includes("fcxmb.com") ||
      lowerUrl.includes("bhcxy.com") ||
      lowerUrl.includes("fodcyy.com") ||
      lowerUrl.includes("fhxod.com") ||
      lowerUrl.includes("hls_mps") ||
      lowerUrl.includes("myhls_mps");

    setPlaybackNotice(null);
    setIsBuffering(true);
    triedProxyRef.current = false;
    triedDirectRef.current = false;

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const parseLangName = (lang: string, name: string) => {
      const l = (lang || "").toLowerCase();
      const n = name || "";
      if (n && !n.startsWith("stream_")) return n;
      if (l.startsWith("hi")) return "Hindi";
      if (l.startsWith("en")) return "English";
      if (l.startsWith("te")) return "Telugu";
      if (l.startsWith("ta")) return "Tamil";
      if (l.startsWith("kn") || l.startsWith("kan")) return "Kannada";
      if (l.startsWith("ml") || l.startsWith("mal")) return "Malayalam";
      if (l.startsWith("bn")) return "Bengali";
      if (l.startsWith("mr")) return "Marathi";
      if (l.startsWith("pa")) return "Punjabi";
      if (l.startsWith("ja")) return "Japanese";
      if (l.startsWith("es")) return "Spanish";
      if (l.startsWith("de")) return "German";
      return n || lang || "Audio";
    };

    if (isM3u8 && Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 60,
        maxBufferLength: 60,
        maxMaxBufferLength: 120,
      });

      const initialHlsUrl = needsProxy
        ? getProxyStreamUrl(streamUrl, activeStream.headers?.Referer, activeStream.headers?.Cookie)
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

        // Initial Audio tracks from manifest
        if (hls.audioTracks && hls.audioTracks.length > 0) {
          const tracks = hls.audioTracks.map((t, index) => {
            const langCode = t.lang || (t.name?.length === 2 ? t.name.toLowerCase() : t.name?.slice(0, 3).toLowerCase()) || "hi";
            return {
              id: index,
              name: parseLangName(langCode, t.name),
              lang: langCode,
              codec: "audio/mp4a-latm",
            };
          });
          setAudioTracks(tracks);
          setSelectedAudioTrack(hls.audioTrack >= 0 ? hls.audioTrack : 0);
        }
      });

      // Listen for dynamic audio tracks updates
      hls.on(Hls.Events.AUDIO_TRACKS_UPDATED, (_, data) => {
        if (data.audioTracks && data.audioTracks.length > 0) {
          const tracks = data.audioTracks.map((t, index) => {
            const langCode = t.lang || (t.name?.length === 2 ? t.name.toLowerCase() : t.name?.slice(0, 3).toLowerCase()) || "hi";
            return {
              id: index,
              name: parseLangName(langCode, t.name),
              lang: langCode,
              codec: "audio/mp4a-latm",
            };
          });
          setAudioTracks(tracks);
          setSelectedAudioTrack(hls.audioTrack >= 0 ? hls.audioTrack : 0);
        }
      });

      hls.on(Hls.Events.AUDIO_TRACK_SWITCHED, (_, data) => {
        setSelectedAudioTrack(data.id);
      });

      // Listen for HLS subtitle tracks
      hls.on(Hls.Events.SUBTITLE_TRACKS_UPDATED, (_, data) => {
        if (data.subtitleTracks && data.subtitleTracks.length > 0) {
          setAvailableSubtitles((prev) => {
            const updated = [...prev];
            data.subtitleTracks.forEach((t, idx) => {
              if (!updated.some((s) => s.title === t.name || s.hlsTrackId === idx)) {
                updated.push({
                  title: t.name || t.lang || `Subtitle ${idx + 1}`,
                  language: t.lang || "en",
                  uri: "",
                  type: "application/x-mpegURL",
                  hlsTrackId: idx,
                });
              }
            });
            return updated;
          });
        }
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
                const proxied = getProxyStreamUrl(
                  streamUrl,
                  activeStream.headers?.Referer,
                  activeStream.headers?.Cookie
                );
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
                const proxied = getProxyStreamUrl(
                  streamUrl,
                  activeStream.headers?.Referer,
                  activeStream.headers?.Cookie
                );
                hls.loadSource(proxied);
                hls.startLoad();
              } else {
                setPlaybackNotice(
                  "Unable to decode stream directly in browser. Try opening with 1-click in VLC, MX Player, or choosing another server."
                );
                hls.destroy();
              }
              break;
          }
        }
      });

      hlsRef.current = hls;
    } else {
      // Direct MP4 / MKV stream
      const initialSrc = needsProxy
        ? getProxyStreamUrl(streamUrl, activeStream.headers?.Referer, activeStream.headers?.Cookie)
        : streamUrl;

      video.src = initialSrc;
      video.onerror = (e) => {
        console.warn("Video playback error event:", video.error?.code, video.error?.message, "src:", initialSrc);
        if (!triedProxyRef.current && !initialSrc.includes("/api/proxy/")) {
          triedProxyRef.current = true;
          video.src = getProxyStreamUrl(streamUrl, activeStream.headers?.Referer, activeStream.headers?.Cookie);
          video.play().catch(() => {});
        } else if (!triedDirectRef.current && initialSrc.includes("/api/proxy/")) {
          triedDirectRef.current = true;
          video.src = streamUrl;
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

  // Handle Subtitle Switching across HLS and HTML5 TextTracks
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (selectedSubtitleIndex === -1) {
      if (hlsRef.current) {
        hlsRef.current.subtitleTrack = -1;
      }
      if (video.textTracks) {
        for (let i = 0; i < video.textTracks.length; i++) {
          video.textTracks[i].mode = "disabled";
        }
      }
      return;
    }

    const currentSub = availableSubtitles[selectedSubtitleIndex];
    if (currentSub?.hlsTrackId !== undefined && hlsRef.current) {
      hlsRef.current.subtitleTrack = currentSub.hlsTrackId;
    } else if (video.textTracks && video.textTracks.length > 0) {
      for (let i = 0; i < video.textTracks.length; i++) {
        video.textTracks[i].mode = i === selectedSubtitleIndex ? "showing" : "disabled";
      }
    }
  }, [selectedSubtitleIndex, availableSubtitles]);

  // Video Buffering listeners
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
    }, 4500);
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

  const toggleRotate = () => {
    setIsRotated((prev) => !prev);
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
  const lowerUrl = streamUrl.toLowerCase();
  const needsProxy =
    Boolean(activeStream?.headers?.Referer) ||
    Boolean(activeStream?.headers?.Cookie) ||
    activeStream?.type === "mkv" ||
    lowerUrl.includes(".mkv") ||
    lowerUrl.includes("googlevideo.com") ||
    lowerUrl.includes("youtube.com") ||
    lowerUrl.includes("mxplayer.in") ||
    lowerUrl.includes("cloudfront.net") ||
    lowerUrl.includes("hakunaymatata.com") ||
    lowerUrl.includes("officialmoviebox.com") ||
    lowerUrl.includes("net52.cc") ||
    lowerUrl.includes("makhi") ||
    lowerUrl.includes("freecdn") ||
    lowerUrl.includes("imgcdn.kim") ||
    lowerUrl.includes("hscow.com") ||
    lowerUrl.includes("fcxmb.com") ||
    lowerUrl.includes("bhcxy.com") ||
    lowerUrl.includes("fodcyy.com") ||
    lowerUrl.includes("fhxod.com") ||
    lowerUrl.includes("hls_mps") ||
    lowerUrl.includes("myhls_mps");

  const effectivePlayUrl = needsProxy
    ? getProxyStreamUrl(streamUrl, activeStream?.headers?.Referer, activeStream?.headers?.Cookie)
    : streamUrl;

  // Display audio tracks (matching Image 4)
  const displayAudioTracks = audioTracks.length > 0 ? audioTracks : [
    { id: 0, name: "Default Audio", lang: "hi", codec: "audio/mp4a-latm" },
  ];

  // Active cue text for floating subtitles (bulletproof rendering on mobile landscape and portrait)
  const activeCueText = selectedSubtitleIndex >= 0
    ? activeCues.find((c) => currentTime >= c.start && currentTime <= c.end)?.text || null
    : null;

  // Active audio label for bottom bar (e.g. "Hi")
  const activeAudioDisplay = displayAudioTracks.find((t) => t.id === selectedAudioTrack)?.lang?.toUpperCase() || "HI";

  // Active subtitle label for bottom bar (e.g. "None" or "English")
  const activeSubDisplay = selectedSubtitleIndex >= 0
    ? availableSubtitles[selectedSubtitleIndex]?.language?.slice(0, 7) || "CC"
    : "None";

  // Active quality label for bottom bar
  const activeQualityDisplay = selectedQualityIndex === -1
    ? (qualityLevels[0]?.label || "1080p")
    : (qualityLevels[selectedQualityIndex]?.label || "1080p");

  return (
    <div
      ref={containerRef}
      onMouseMove={handleUserActivity}
      onClick={handleUserActivity}
      style={
        isRotated
          ? {
              transform: "rotate(90deg)",
              transformOrigin: "center center",
              width: "100vh",
              height: "100vw",
              position: "fixed",
              top: "50%",
              left: "50%",
              marginTop: "-50vw",
              marginLeft: "-50vh",
              maxWidth: "none",
              maxHeight: "none",
              zIndex: 9999,
            }
          : undefined
      }
      className="fixed inset-0 z-50 bg-black flex items-center justify-center select-none overflow-hidden font-sans"
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        onTimeUpdate={handleTimeUpdate}
        poster={poster}
        playsInline
        crossOrigin="anonymous"
        className={`w-full h-full ${
          fitMode === "cover"
            ? "object-cover"
            : fitMode === "fill"
            ? "object-fill"
            : "object-contain"
        }`}
      >
        {availableSubtitles.map((sub, idx) => (
          <track
            key={idx}
            kind="subtitles"
            src={getProxySubtitleUrl(sub.uri, activeStream?.headers?.Referer)}
            label={sub.title || sub.language || `Subtitle ${idx + 1}`}
            srcLang={sub.language || "en"}
            default={idx === selectedSubtitleIndex}
          />
        ))}
      </video>

      {/* Floating Subtitle Overlay (Guarantees visible subtitles across all mobile orientations) */}
      {activeCueText && (
        <div className="absolute bottom-20 sm:bottom-24 inset-x-4 flex justify-center pointer-events-none z-20 animate-fadeIn">
          <div className="bg-black/85 backdrop-blur-sm border border-white/10 px-4 py-1.5 rounded-xl text-center max-w-xl shadow-2xl">
            <span className="text-white text-sm sm:text-lg font-semibold tracking-wide drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] whitespace-pre-line leading-snug">
              {activeCueText}
            </span>
          </div>
        </div>
      )}

      {/* Buffering Animation Overlay (Center) */}
      {isBuffering && !playbackNotice && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          <div className="relative flex items-center justify-center">
            <div className="w-16 h-16 rounded-full border-4 border-rose-500/20 border-t-[#ff4d4d] animate-spin" />
            <div className="absolute w-8 h-8 rounded-full bg-rose-500/20 animate-ping" />
          </div>
        </div>
      )}

      {/* Floating Prompt for Mobile Landscape switch */}
      {!isRotated && isPortraitDetected && !isLocked && (
        <button
          onClick={toggleRotate}
          className="sm:hidden absolute top-16 left-1/2 -translate-x-1/2 z-40 bg-zinc-900/90 border border-zinc-700/80 px-4 py-2 rounded-full text-xs font-semibold text-zinc-100 flex items-center gap-2 backdrop-blur-md shadow-2xl active:scale-95 animate-fadeIn"
        >
          <RotateCw className="w-4 h-4 text-[#ff8a80]" />
          <span>Switch to Landscape View</span>
        </button>
      )}

      {/* Lock Notice indicator if locked */}
      {isLocked && showControls && (
        <div className="absolute top-6 left-6 z-40 animate-fadeIn">
          <button
            onClick={() => setIsLocked(false)}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md text-white text-xs font-semibold shadow-2xl transition-all active:scale-95"
          >
            <Unlock className="w-4 h-4 text-[#ff8a80]" />
            <span>Tap to Unlock</span>
          </button>
        </div>
      )}

      {/* Top Header Controls (Matching Image 1) */}
      {!isLocked && (
        <div
          className={`absolute top-0 left-0 right-0 p-4 sm:p-6 bg-gradient-to-b from-black/90 via-black/40 to-transparent flex items-center justify-between transition-opacity duration-300 z-30 ${
            showControls ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/10 text-white transition-colors active:scale-95"
              title="Go Back"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-bold text-white tracking-tight truncate max-w-[200px] sm:max-w-md">
                {title}
              </h1>
              <p className="text-xs text-zinc-400 font-medium truncate">
                {subtitle || "Episode 1"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Rotate 90deg / Screen orientation toggle */}
            <button
              onClick={toggleRotate}
              className="p-2 rounded-full hover:bg-white/10 text-white transition-colors active:scale-95"
              title="Rotate Screen (Landscape / Portrait)"
            >
              <RotateCw className={`w-5 h-5 ${isRotated ? "text-[#ff8a80]" : "text-zinc-300"}`} />
            </button>

            {/* Lock button */}
            <button
              onClick={() => setIsLocked(true)}
              className="p-2 rounded-full hover:bg-white/10 text-white transition-colors active:scale-95"
              title="Lock Controls"
            >
              <Lock className="w-5 h-5 text-zinc-300" />
            </button>

            {/* Picture in Picture */}
            <button
              onClick={togglePiP}
              className="p-2 rounded-full hover:bg-white/10 text-white transition-colors active:scale-95 hidden sm:block"
              title="Picture in Picture"
            >
              <PictureInPicture className="w-5 h-5 text-zinc-300" />
            </button>
          </div>
        </div>
      )}

      {/* Center Controls (Rewind 10s, Large Play/Pause, Forward 10s) (Matching Image 1) */}
      {!isLocked && (
        <div
          className={`absolute inset-0 flex items-center justify-center gap-8 sm:gap-14 transition-opacity duration-300 z-20 pointer-events-none ${
            showControls && !isBuffering ? "opacity-100" : "opacity-0"
          }`}
        >
          {/* Rewind 10s */}
          <button
            onClick={() => seekRelative(-10)}
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-black/40 hover:bg-black/60 text-white flex flex-col items-center justify-center backdrop-blur-md pointer-events-auto active:scale-90 transition-all border border-white/10 shadow-xl"
            title="Rewind 10 seconds"
          >
            <RotateCcw className="w-6 h-6 text-zinc-200" />
            <span className="text-[10px] font-bold mt-0.5 text-zinc-300 font-mono">10</span>
          </button>

          {/* Large Center Play / Pause */}
          <button
            onClick={togglePlay}
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center backdrop-blur-md pointer-events-auto active:scale-95 transition-all shadow-2xl border border-white/20"
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
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-black/40 hover:bg-black/60 text-white flex flex-col items-center justify-center backdrop-blur-md pointer-events-auto active:scale-90 transition-all border border-white/10 shadow-xl"
            title="Fast Forward 10 seconds"
          >
            <RotateCw className="w-6 h-6 text-zinc-200" />
            <span className="text-[10px] font-bold mt-0.5 text-zinc-300 font-mono">10</span>
          </button>
        </div>
      )}

      {/* Bottom Scrubber & Action Controls (Strictly Matching Image 1) */}
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

            <div className="relative flex-1 flex items-center h-6 group cursor-pointer">
              <input
                type="range"
                min={0}
                max={duration || 100}
                step={0.5}
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-1.5 bg-zinc-700/60 rounded-lg appearance-none cursor-pointer accent-[#ff4d4d] focus:outline-none"
              />
            </div>

            <span className="text-xs font-mono font-medium text-zinc-400 min-w-[42px] text-right">
              {formatTime(duration)}
            </span>
          </div>

          {/* Bottom Action Bar (Matching Image 1) */}
          <div className="flex items-center justify-between pt-1 text-xs text-zinc-300">
            {/* Left pills: Audio, Subtitle, Speed */}
            <div className="flex items-center gap-4 sm:gap-6">
              {/* Audio button */}
              <button
                onClick={() => setActiveSheet(activeSheet === "audio" ? "none" : "audio")}
                className="flex items-center gap-1.5 hover:text-white transition-colors group"
                title="Audio Tracks"
              >
                <AudioWaveIcon className="w-4 h-4 text-zinc-400 group-hover:text-white" />
                <span className="font-semibold text-xs text-zinc-300 group-hover:text-white capitalize">
                  {activeAudioDisplay}
                </span>
              </button>

              {/* Subtitles button */}
              <button
                onClick={() => setActiveSheet(activeSheet === "subs" ? "none" : "subs")}
                className="flex items-center gap-1.5 hover:text-white transition-colors group"
                title="Subtitles"
              >
                <SubtitlesIcon className="w-4 h-4 text-zinc-400 group-hover:text-white" />
                <span className="font-semibold text-xs text-zinc-300 group-hover:text-white capitalize">
                  {activeSubDisplay}
                </span>
              </button>

              {/* Speed button */}
              <button
                onClick={() => setActiveSheet(activeSheet === "speed" ? "none" : "speed")}
                className="flex items-center gap-1.5 hover:text-white transition-colors group"
                title="Playback Speed"
              >
                <Gauge className="w-4 h-4 text-zinc-400 group-hover:text-white" />
                <span className="font-mono font-semibold text-xs text-zinc-300 group-hover:text-white">
                  {playbackRate}x
                </span>
              </button>
            </div>

            {/* Right pills: PIP, Quality, Fit */}
            <div className="flex items-center gap-4 sm:gap-6">
              {/* PIP */}
              <button
                onClick={togglePiP}
                className="hover:text-white transition-colors flex items-center gap-1.5 group"
                title="Picture-in-Picture"
              >
                <PictureInPicture className="w-4 h-4 text-zinc-400 group-hover:text-white" />
                <span className="text-xs font-semibold text-zinc-300 group-hover:text-white hidden sm:inline">
                  PIP
                </span>
              </button>

              {/* Quality Selector */}
              <button
                onClick={() => setActiveSheet(activeSheet === "quality" ? "none" : "quality")}
                className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-zinc-800/80 hover:bg-zinc-700 text-white font-bold text-xs transition-colors"
                title="Server & Quality"
              >
                <span className="text-[10px] px-1 py-0.2 rounded bg-zinc-700 text-zinc-300 font-mono">HD</span>
                <span className="text-xs">{activeQualityDisplay}</span>
              </button>

              {/* Fit / Aspect Ratio */}
              <button
                onClick={toggleFit}
                className="hover:text-white transition-colors flex items-center gap-1.5 group"
                title="Aspect Ratio"
              >
                <Maximize2 className="w-4 h-4 text-zinc-400 group-hover:text-white" />
                <span className="text-xs font-semibold text-zinc-300 group-hover:text-white capitalize">
                  {fitMode === "contain" ? "Fit" : fitMode === "cover" ? "Fill" : "Stretch"}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Sheet for Audio Tracks (Strictly Matching Image 4) */}
      {activeSheet === "audio" && (
        <div
          className="absolute inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-3 sm:p-4 animate-fadeIn"
          onClick={() => setActiveSheet("none")}
        >
          <div
            className="relative w-full max-w-lg bg-[#141416]/95 border border-zinc-800/90 rounded-3xl p-5 shadow-2xl text-white backdrop-blur-md"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
              <div className="w-6" />
              <h3 className="text-base font-bold text-white tracking-wide text-center">Audio</h3>
              <button
                onClick={() => setActiveSheet("none")}
                className="p-1.5 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Audio Items matching Image 4 */}
            <div className="space-y-2.5 mt-4 max-h-72 overflow-y-auto custom-scrollbar pr-1">
              {displayAudioTracks.map((t, idx) => {
                const isSelected = selectedAudioTrack === t.id;
                return (
                  <div
                    key={idx}
                    onClick={() => handleAudioChange(t.id)}
                    className={`p-3.5 sm:p-4 rounded-2xl border cursor-pointer flex items-center justify-between transition-all ${
                      isSelected
                        ? "bg-[#232328] border-white ring-1 ring-white/50 text-white shadow-lg"
                        : "bg-[#18181c]/80 border-zinc-800/80 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <AudioWaveIcon className={`w-5 h-5 flex-shrink-0 ${isSelected ? "text-white" : "text-zinc-400"}`} />
                      <div className="min-w-0">
                        <span className="block text-sm font-bold text-white lowercase">
                          {t.lang || "hi"}
                        </span>
                        <span className="block text-xs text-zinc-400 font-normal truncate mt-0.5">
                          {t.codec || "audio/mp4a-latm"} · {t.name || `Track ${idx + 1}`}
                        </span>
                      </div>
                    </div>

                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-white text-zinc-950 flex items-center justify-center flex-shrink-0 shadow-md">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Modal Sheet for Subtitles (Matching Image 4 styling) */}
      {activeSheet === "subs" && (
        <div
          className="absolute inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-3 sm:p-4 animate-fadeIn"
          onClick={() => setActiveSheet("none")}
        >
          <div
            className="relative w-full max-w-lg bg-[#141416]/95 border border-zinc-800/90 rounded-3xl p-5 shadow-2xl text-white backdrop-blur-md"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
              <div className="w-6" />
              <h3 className="text-base font-bold text-white tracking-wide text-center">Subtitles</h3>
              <button
                onClick={() => setActiveSheet("none")}
                className="p-1.5 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Subtitle Items */}
            <div className="space-y-2.5 mt-4 max-h-72 overflow-y-auto custom-scrollbar pr-1">
              {/* Off / None Option */}
              <div
                onClick={() => handleSubtitleChange(-1)}
                className={`p-3.5 sm:p-4 rounded-2xl border cursor-pointer flex items-center justify-between transition-all ${
                  selectedSubtitleIndex === -1
                    ? "bg-[#232328] border-white ring-1 ring-white/50 text-white shadow-lg"
                    : "bg-[#18181c]/80 border-zinc-800/80 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <SubtitlesIcon className={`w-5 h-5 flex-shrink-0 ${selectedSubtitleIndex === -1 ? "text-white" : "text-zinc-400"}`} />
                  <div>
                    <span className="block text-sm font-bold text-white">None</span>
                    <span className="block text-xs text-zinc-400 font-normal mt-0.5">Subtitles turned off</span>
                  </div>
                </div>
                {selectedSubtitleIndex === -1 && (
                  <div className="w-5 h-5 rounded-full bg-white text-zinc-950 flex items-center justify-center flex-shrink-0 shadow-md">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                )}
              </div>

              {/* Subtitle tracks */}
              {availableSubtitles.map((sub, idx) => {
                const isSelected = selectedSubtitleIndex === idx;
                return (
                  <div
                    key={idx}
                    onClick={() => handleSubtitleChange(idx)}
                    className={`p-3.5 sm:p-4 rounded-2xl border cursor-pointer flex items-center justify-between transition-all ${
                      isSelected
                        ? "bg-[#232328] border-white ring-1 ring-white/50 text-white shadow-lg"
                        : "bg-[#18181c]/80 border-zinc-800/80 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <SubtitlesIcon className={`w-5 h-5 flex-shrink-0 ${isSelected ? "text-white" : "text-zinc-400"}`} />
                      <div className="min-w-0">
                        <span className="block text-sm font-bold text-white capitalize">
                          {sub.language || sub.title || `Subtitle #${idx + 1}`}
                        </span>
                        <span className="block text-xs text-zinc-400 font-normal truncate mt-0.5">
                          {sub.title || "External Subtitles"} · {sub.type || "WebVTT"}
                        </span>
                      </div>
                    </div>

                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-white text-zinc-950 flex items-center justify-center flex-shrink-0 shadow-md">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Modal Sheet for Quality & Server */}
      {activeSheet === "quality" && (
        <div
          className="absolute inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setActiveSheet("none")}
        >
          <div
            className="relative w-full max-w-2xl bg-[#141416]/95 border border-zinc-800 rounded-3xl p-5 sm:p-6 shadow-2xl text-white backdrop-blur-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="text-base font-bold text-white">Quality & Server</h3>
              <button
                onClick={() => setActiveSheet("none")}
                className="p-1.5 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-4">
              {/* Server Column */}
              <div>
                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2.5">
                  Available Servers ({resolvedStreams.length || 1})
                </h4>
                <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-1">
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
                                {s.quality || "1080p"}
                              </span>
                            </div>
                          </div>
                          {isSelected && <CheckCircle2 className="w-5 h-5 text-white" />}
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-3 rounded-2xl bg-zinc-800 border border-white text-white flex items-center justify-between">
                      <span className="text-xs font-bold">Default HD Server</span>
                      <CheckCircle2 className="w-5 h-5 text-white" />
                    </div>
                  )}
                </div>
              </div>

              {/* Quality Column */}
              <div>
                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2.5">
                  Resolution
                </h4>
                <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-1">
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
                      <span className="block text-xs font-bold text-white">Auto (Adaptive)</span>
                      <span className="text-[10px] text-zinc-400">Best quality for current network</span>
                    </div>
                    {selectedQualityIndex === -1 && <CheckCircle2 className="w-5 h-5 text-white" />}
                  </div>

                  {qualityLevels.map((lvl) => {
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
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Sheet for Playback Speed */}
      {activeSheet === "speed" && (
        <div
          className="absolute inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setActiveSheet("none")}
        >
          <div
            className="relative w-full max-w-xs bg-[#141416]/95 border border-zinc-800 rounded-3xl p-5 shadow-2xl text-white backdrop-blur-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="text-base font-bold text-white">Playback Speed</h3>
              <button
                onClick={() => setActiveSheet("none")}
                className="p-1.5 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-2 mt-4">
              {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map((s) => (
                <div
                  key={s}
                  onClick={() => handleSpeedChange(s)}
                  className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${
                    playbackRate === s
                      ? "bg-zinc-800 border-white text-white font-bold"
                      : "bg-[#1c1c20] border-zinc-800 text-zinc-400 hover:text-white"
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
          {/* Top Back Navigation Button */}
          <button
            onClick={onClose}
            className="absolute top-4 left-4 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all flex items-center gap-2 active:scale-95 shadow-md z-10"
            title="Go Back"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-xs font-semibold pr-1">Back</span>
          </button>

          <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 mb-4 shadow-xl">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-white mb-2">Stream Playback Notice</h2>
          <p className="text-xs sm:text-sm text-zinc-300 max-w-md mb-6 leading-relaxed">
            {playbackNotice}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <a
              href={getVlcUrl(effectivePlayUrl)}
              className="px-4 py-2.5 rounded-xl font-bold text-xs bg-orange-600 hover:bg-orange-500 text-white flex items-center gap-2 shadow-lg"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              Play in VLC
            </a>
            <a
              href={getMxPlayerIntent(effectivePlayUrl, title)}
              className="px-4 py-2.5 rounded-xl font-bold text-xs bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-2 shadow-lg"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              Play in MX Player
            </a>
            <a
              href={getProxyStreamUrl(streamUrl, activeStream?.headers?.Referer, activeStream?.headers?.Cookie, true, `${title || "video"}.mp4`)}
              download={title || "video.mp4"}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2.5 rounded-xl font-bold text-xs bg-rose-600 hover:bg-rose-500 text-white flex items-center gap-2 shadow-lg"
            >
              <Download className="w-3.5 h-3.5" />
              Direct Download
            </a>
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl font-bold text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white flex items-center gap-2 transition-all shadow-lg border border-zinc-700"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
