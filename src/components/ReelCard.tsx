import React, { useRef, useState, useEffect } from 'react';
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  Download,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Music,
  Check,
  Plus,
  BadgeCheck,
} from 'lucide-react';
import { Reel } from '../types';
import { formatCount } from '../utils/downloadHelper';
import { getSafeVideoUrl, createAnimatedStream, RELIABLE_VIDEOS } from '../utils/videoSources';

interface HeartAnimation {
  id: number;
  x: number;
  y: number;
}

interface ReelCardProps {
  reel: Reel;
  isActive: boolean;
  isMuted: boolean;
  onToggleMute: () => void;
  onLike: () => void;
  onBookmark: () => void;
  onOpenComments: () => void;
  onOpenShare: () => void;
  onDownload: () => void;
  onFollowToggle: () => void;
  onSelectTag?: (tag: string) => void;
}

export const ReelCard: React.FC<ReelCardProps> = ({
  reel,
  isActive,
  isMuted,
  onToggleMute,
  onLike,
  onBookmark,
  onOpenComments,
  onOpenShare,
  onDownload,
  onFollowToggle,
  onSelectTag,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [showPlayIcon, setShowPlayIcon] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [hearts, setHearts] = useState<HeartAnimation[]>([]);
  const [isCaptionExpanded, setIsCaptionExpanded] = useState<boolean>(false);
  const [videoError, setVideoError] = useState<boolean>(false);
  const [currentVideoSrc, setCurrentVideoSrc] = useState<string>(() =>
    getSafeVideoUrl(reel.videoUrl)
  );

  const lastTapRef = useRef<number>(0);
  const playIconTimeoutRef = useRef<number | null>(null);

  // Keep video source in sync
  useEffect(() => {
    setCurrentVideoSrc(getSafeVideoUrl(reel.videoUrl));
    setVideoError(false);
  }, [reel.videoUrl]);

  // Handle Video Errors cleanly without throwing unhandled media errors
  const handleVideoError = () => {
    console.warn(`[TikReel] Error loading source ${currentVideoSrc}, switching to resilient stream`);
    setVideoError(true);
    const video = videoRef.current;
    if (!video) return;

    // First fallback: reliable GTV sample
    if (currentVideoSrc !== RELIABLE_VIDEOS.dance) {
      setCurrentVideoSrc(RELIABLE_VIDEOS.dance);
      video.load();
      return;
    }

    // Second fallback: procedural animated canvas stream
    const fallbackStream = createAnimatedStream(reel.caption.slice(0, 30) || 'TikReel Video');
    if (fallbackStream) {
      video.removeAttribute('src');
      video.srcObject = fallbackStream;
      video.play().catch(() => {});
    }
  };

  // Synchronize playback with active state
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isActive) {
      video.currentTime = 0;
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => setIsPlaying(true))
          .catch(() => {
            // Browser might require muted autoplay
            setIsPlaying(false);
          });
      }
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }, [isActive, currentVideoSrc]);

  // Track progress
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const curr = videoRef.current.currentTime;
      const dur = videoRef.current.duration || 1;
      setCurrentTime(curr);
      setProgress((curr / dur) * 100);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration || 0);
    }
  };

  // Toggle Play / Pause on Single Tap
  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play();
      setIsPlaying(true);
      triggerPlayIcon(true);
    } else {
      video.pause();
      setIsPlaying(false);
      triggerPlayIcon(false);
    }
  };

  const triggerPlayIcon = (playing: boolean) => {
    setShowPlayIcon(true);
    if (playIconTimeoutRef.current) clearTimeout(playIconTimeoutRef.current);
    playIconTimeoutRef.current = window.setTimeout(() => {
      setShowPlayIcon(false);
    }, 600);
  };

  // Handle Double Tap to Like
  const handleTouchOrClick = (e: React.MouseEvent<HTMLElement>) => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;

    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      // Double tap detected!
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const newHeart: HeartAnimation = { id: Date.now(), x, y };
      setHearts((prev) => [...prev, newHeart]);

      setTimeout(() => {
        setHearts((prev) => prev.filter((h) => h.id !== newHeart.id));
      }, 900);

      if (!reel.isLiked) {
        onLike();
      }
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
      // Delay single tap play/pause toggle to prevent conflict with double-tap
      setTimeout(() => {
        if (lastTapRef.current === now) {
          togglePlay();
        }
      }, DOUBLE_TAP_DELAY);
    }
  };

  // Seek bar scrubber
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPercent = parseFloat(e.target.value);
    if (videoRef.current && duration > 0) {
      const targetTime = (newPercent / 100) * duration;
      videoRef.current.currentTime = targetTime;
      setProgress(newPercent);
    }
  };

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = Math.floor(sec % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="relative w-full h-full bg-neutral-950 flex items-center justify-center overflow-hidden select-none">
      {/* Video element with safe source fallback */}
      <video
        ref={videoRef}
        src={currentVideoSrc}
        loop
        playsInline
        muted={isMuted}
        poster={reel.thumbnailUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onError={handleVideoError}
        className="w-full h-full object-cover cursor-pointer"
        onClick={handleTouchOrClick}
      />

      {/* Fallback if external video cannot load */}
      {videoError && (
        <div
          onClick={handleTouchOrClick}
          className="absolute inset-0 bg-gradient-to-b from-neutral-900 via-neutral-950 to-black flex flex-col items-center justify-center p-6 text-center z-10 cursor-pointer"
        >
          {reel.thumbnailUrl && (
            <img
              src={reel.thumbnailUrl}
              alt={reel.caption}
              className="absolute inset-0 w-full h-full object-cover opacity-30 blur-sm"
            />
          )}
          <div className="relative z-10 max-w-xs space-y-3">
            <div className="w-16 h-16 mx-auto rounded-full bg-red-500/20 text-red-400 flex items-center justify-center">
              <Play className="w-8 h-8 fill-current ml-1" />
            </div>
            <p className="text-sm font-semibold text-white">{reel.caption}</p>
            <p className="text-xs text-neutral-400">
              Modo vista previa de demostración. Puedes subir o grabar tus propios videos en vivo con el botón "+".
            </p>
          </div>
        </div>
      )}

      {/* Floating hearts on double tap */}
      {hearts.map((heart) => (
        <div
          key={heart.id}
          style={{ left: heart.x - 40, top: heart.y - 40 }}
          className="pointer-events-none absolute z-40 animate-float-heart"
        >
          <Heart className="w-20 h-20 fill-red-500 text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.8)]" />
        </div>
      ))}

      {/* Central Play/Pause Flash Indicator */}
      {showPlayIcon && (
        <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center">
          <div className="w-20 h-20 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white scale-110 transition-transform">
            {isPlaying ? (
              <Play className="w-10 h-10 fill-white ml-1" />
            ) : (
              <Pause className="w-10 h-10 fill-white" />
            )}
          </div>
        </div>
      )}

      {/* Top right quick mute/unmute control */}
      <div className="absolute top-4 right-4 z-20">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleMute();
          }}
          aria-label={isMuted ? 'Activar sonido' : 'Silenciar'}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-md transition-all active:scale-95 border border-white/10"
        >
          {isMuted ? (
            <VolumeX className="w-5 h-5 text-neutral-200" />
          ) : (
            <Volume2 className="w-5 h-5 text-cyan-400" />
          )}
        </button>
      </div>

      {/* Bottom Gradient Scrim for Legibility */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-80 bg-gradient-to-t from-black/90 via-black/50 to-transparent z-10" />

      {/* Left/Bottom Content Overlay */}
      <div className="absolute bottom-6 left-3 right-18 z-20 text-white pointer-events-auto pr-2">
        {/* Creator Info */}
        <div className="flex items-center gap-2 mb-2">
          <span className="font-bold text-base tracking-tight hover:underline cursor-pointer">
            @{reel.author.username}
          </span>
          {reel.author.isVerified && (
            <BadgeCheck className="w-4 h-4 text-cyan-400 fill-cyan-400/20" />
          )}
          {!reel.author.isFollowing && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onFollowToggle();
              }}
              className="ml-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-red-600 hover:bg-red-500 text-white transition-all"
            >
              Seguir
            </button>
          )}
        </div>

        {/* Caption */}
        <div className="text-sm text-neutral-100 mb-3 leading-snug">
          <p className={`${isCaptionExpanded ? '' : 'line-clamp-2'} whitespace-pre-wrap`}>
            {reel.caption}
          </p>
          {reel.caption.length > 70 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsCaptionExpanded(!isCaptionExpanded);
              }}
              className="text-xs text-neutral-400 hover:text-white font-medium mt-0.5"
            >
              {isCaptionExpanded ? 'Ver menos' : 'más'}
            </button>
          )}
        </div>

        {/* Tags */}
        {reel.tags && reel.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2.5">
            {reel.tags.map((tag) => (
              <button
                key={tag}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectTag?.(tag);
                }}
                className="text-xs font-semibold text-cyan-300 hover:text-cyan-200 transition-colors"
              >
                #{tag}
              </button>
            ))}
          </div>
        )}

        {/* Audio Track Marquee */}
        <div className="flex items-center gap-2 text-xs text-neutral-200 bg-black/30 backdrop-blur-sm px-2.5 py-1 rounded-full w-fit max-w-[240px] truncate border border-white/10">
          <Music className="w-3.5 h-3.5 shrink-0 text-cyan-400 animate-bounce" />
          <span className="truncate">{reel.audio.title}</span>
        </div>
      </div>

      {/* Right Side Interaction Column (TikTok Actions Rail) */}
      <div className="absolute right-2 bottom-6 z-20 flex flex-col items-center gap-4 text-white">
        {/* Creator Avatar with Follow button */}
        <div className="relative mb-1">
          <div className="w-12 h-12 rounded-full ring-2 ring-white/70 overflow-hidden bg-neutral-800 shadow-lg">
            <img
              src={reel.author.avatar}
              alt={reel.author.displayName}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>
          {!reel.author.isFollowing ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onFollowToggle();
              }}
              aria-label="Seguir creador"
              className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shadow-md active:scale-90 transition-transform"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
            </button>
          ) : (
            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md">
              <Check className="w-3 h-3 stroke-[3]" />
            </div>
          )}
        </div>

        {/* Like Button */}
        <div className="flex flex-col items-center">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onLike();
            }}
            aria-label="Dar me gusta"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full bg-black/30 hover:bg-black/50 backdrop-blur-md active:scale-75 transition-all"
          >
            <Heart
              className={`w-7 h-7 transition-colors ${
                reel.isLiked
                  ? 'fill-red-500 text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.7)]'
                  : 'text-white hover:text-red-400'
              }`}
            />
          </button>
          <span className="text-xs font-semibold tracking-tight text-white drop-shadow tabular-nums mt-0.5">
            {formatCount(reel.stats.likes)}
          </span>
        </div>

        {/* Comments Button */}
        <div className="flex flex-col items-center">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenComments();
            }}
            aria-label="Comentarios"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full bg-black/30 hover:bg-black/50 backdrop-blur-md active:scale-90 transition-transform text-white hover:text-cyan-300"
          >
            <MessageCircle className="w-7 h-7 fill-white/20 text-white" />
          </button>
          <span className="text-xs font-semibold tracking-tight text-white drop-shadow tabular-nums mt-0.5">
            {formatCount(reel.stats.comments)}
          </span>
        </div>

        {/* Bookmark / Guardar Button */}
        <div className="flex flex-col items-center">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onBookmark();
            }}
            aria-label="Guardar reel"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full bg-black/30 hover:bg-black/50 backdrop-blur-md active:scale-90 transition-transform"
          >
            <Bookmark
              className={`w-7 h-7 transition-colors ${
                reel.isBookmarked
                  ? 'fill-amber-400 text-amber-400'
                  : 'text-white hover:text-amber-300'
              }`}
            />
          </button>
          <span className="text-xs font-semibold tracking-tight text-white drop-shadow tabular-nums mt-0.5">
            {formatCount(reel.stats.bookmarks)}
          </span>
        </div>

        {/* Share Button */}
        <div className="flex flex-col items-center">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenShare();
            }}
            aria-label="Compartir"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full bg-black/30 hover:bg-black/50 backdrop-blur-md active:scale-90 transition-transform text-white hover:text-emerald-400"
          >
            <Share2 className="w-7 h-7" />
          </button>
          <span className="text-xs font-semibold tracking-tight text-white drop-shadow tabular-nums mt-0.5">
            {formatCount(reel.stats.shares)}
          </span>
        </div>

        {/* Direct Download Button (Descargar) */}
        <div className="flex flex-col items-center">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDownload();
            }}
            aria-label="Descargar video"
            title="Descargar este video"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full bg-cyan-500/20 hover:bg-cyan-500/40 border border-cyan-400/40 text-cyan-300 backdrop-blur-md active:scale-90 transition-transform"
          >
            <Download className="w-6 h-6 animate-pulse" />
          </button>
          <span className="text-[11px] font-semibold tracking-tight text-cyan-300 drop-shadow tabular-nums mt-0.5">
            Bajar
          </span>
        </div>

        {/* Rotating Music Disc */}
        <div className="mt-1">
          <div
            className={`w-11 h-11 rounded-full p-1.5 bg-gradient-to-tr from-neutral-900 to-neutral-700 ring-2 ring-white/40 shadow-xl flex items-center justify-center ${
              isPlaying && isActive ? 'animate-spin-slow' : 'animate-spin-paused'
            }`}
          >
            <div className="w-full h-full rounded-full overflow-hidden bg-black flex items-center justify-center">
              <img
                src={reel.author.avatar}
                alt="Audio cover"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover opacity-80"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Video Progress Scrubber Bar at the Bottom */}
      <div className="absolute bottom-0 inset-x-0 z-30 flex flex-col group">
        <input
          type="range"
          min="0"
          max="100"
          step="0.1"
          value={progress || 0}
          onChange={handleSeek}
          aria-label="Línea de tiempo del video"
          className="w-full h-1 group-hover:h-2 bg-white/20 accent-red-500 cursor-pointer transition-all appearance-none outline-none"
        />
        {/* Subtle hover time tooltip */}
        <div className="hidden group-hover:flex justify-between px-3 py-1 bg-black/80 text-[10px] text-neutral-300 font-mono tabular-nums">
          <span>{formatSeconds(currentTime)}</span>
          <span>{formatSeconds(duration)}</span>
        </div>
      </div>
    </div>
  );
};
