import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ChevronUp,
  ChevronDown,
  Compass,
  Home,
  PlusCircle,
  User as UserIcon,
  Volume2,
  VolumeX,
  Sparkles,
  Download,
  Share2,
} from 'lucide-react';
import { INITIAL_REELS } from './data/sampleReels';
import { Reel, TabType, UserProfile, CommentItem } from './types';
import { ReelCard } from './components/ReelCard';
import { CommentsModal } from './components/CommentsModal';
import { ShareModal } from './components/ShareModal';
import { PublishModal } from './components/PublishModal';
import { ExploreView } from './components/ExploreView';
import { ProfileView } from './components/ProfileView';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { downloadVideo } from './utils/downloadHelper';
import { getSafeVideoUrl } from './utils/videoSources';

const STORAGE_KEY_REELS = 'tikreel_custom_reels_v2';
const OLD_STORAGE_KEY_REELS = 'tikreel_custom_reels_v1';
const STORAGE_KEY_LIKES = 'tikreel_user_likes_v1';

export default function App() {
  // Current user mock profile
  const [currentUser, setCurrentUser] = useState<UserProfile>({
    id: 'user-me',
    username: 'creador_pro',
    displayName: 'Alex Creador',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&q=80',
    bio: 'Creando videos y compartiendo buenas vibras ✨🎬 | Amante de los viajes y la música 🎧',
    followersCount: 14200,
    followingCount: 312,
    totalLikes: 48900,
  });

  // Load reels with persistence and safe URL sanitization
  const [reels, setReels] = useState<Reel[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_REELS) || localStorage.getItem(OLD_STORAGE_KEY_REELS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((item: Reel) => ({
            ...item,
            videoUrl: getSafeVideoUrl(item.videoUrl),
          }));
        }
      }
    } catch {
      // Default fallback
    }
    return INITIAL_REELS;
  });

  // Navigation states
  const [activeTab, setActiveTab] = useState<TabType>('foryou');
  const [feedMode, setFeedMode] = useState<'foryou' | 'following'>('foryou');
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(true); // browser policy standard: start muted

  // Modals state
  const [isCommentsOpen, setIsCommentsOpen] = useState<boolean>(false);
  const [isShareOpen, setIsShareOpen] = useState<boolean>(false);
  const [isPublishOpen, setIsPublishOpen] = useState<boolean>(false);
  const [activeFilterTag, setActiveFilterTag] = useState<string | null>(null);

  // Global toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Filter reels based on feedMode ("foryou" vs "following")
  const activeFeedReels = reels.filter((reel) => {
    if (feedMode === 'following') {
      return reel.author.isFollowing || reel.author.id === currentUser.id;
    }
    return true;
  });

  // Current reel
  const currentReel = activeFeedReels[currentIndex] || activeFeedReels[0] || reels[0];

  // Save reels to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_REELS, JSON.stringify(reels));
    } catch (e) {
      console.warn('Storage quota exceeded:', e);
    }
  }, [reels]);

  // Navigate feed Next / Prev
  const goToNext = useCallback(() => {
    if (currentIndex < activeFeedReels.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  }, [currentIndex, activeFeedReels.length]);

  const goToPrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  }, [currentIndex]);

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if inside an input or textarea or modal is open
      if (
        isCommentsOpen ||
        isShareOpen ||
        isPublishOpen ||
        ['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)
      ) {
        return;
      }

      if (e.key === 'ArrowDown' || e.key === 'j') {
        e.preventDefault();
        goToNext();
      } else if (e.key === 'ArrowUp' || e.key === 'k') {
        e.preventDefault();
        goToPrev();
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        setIsMuted((prev) => !prev);
      } else if (e.key === 'l' || e.key === 'L') {
        e.preventDefault();
        if (currentReel) handleLikeReel(currentReel.id);
      } else if (e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        setIsCommentsOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, activeFeedReels, isCommentsOpen, isShareOpen, isPublishOpen, currentReel, goToNext, goToPrev]);

  // Scroll / Wheel detection with throttle
  const lastScrollTime = useRef<number>(0);
  const handleWheel = (e: React.WheelEvent) => {
    const now = Date.now();
    if (now - lastScrollTime.current < 600) return; // Debounce wheel
    if (Math.abs(e.deltaY) < 30) return;

    if (e.deltaY > 0) {
      goToNext();
      lastScrollTime.current = now;
    } else {
      goToPrev();
      lastScrollTime.current = now;
    }
  };

  // Like Reel handler
  const handleLikeReel = (reelId: string) => {
    setReels((prev) =>
      prev.map((r) => {
        if (r.id === reelId) {
          const newLiked = !r.isLiked;
          return {
            ...r,
            isLiked: newLiked,
            stats: {
              ...r.stats,
              likes: newLiked ? r.stats.likes + 1 : Math.max(0, r.stats.likes - 1),
            },
          };
        }
        return r;
      })
    );
  };

  // Bookmark Reel handler
  const handleBookmarkReel = (reelId: string) => {
    setReels((prev) =>
      prev.map((r) => {
        if (r.id === reelId) {
          const newSaved = !r.isBookmarked;
          showToast(newSaved ? 'Reel guardado en tu perfil' : 'Reel eliminado de guardados');
          return {
            ...r,
            isBookmarked: newSaved,
            stats: {
              ...r.stats,
              bookmarks: newSaved ? r.stats.bookmarks + 1 : Math.max(0, r.stats.bookmarks - 1),
            },
          };
        }
        return r;
      })
    );
  };

  // Follow author toggle
  const handleFollowToggle = (authorId: string) => {
    setReels((prev) =>
      prev.map((r) => {
        if (r.author.id === authorId) {
          const newFollowing = !r.author.isFollowing;
          showToast(newFollowing ? `¡Ahora sigues a @${r.author.username}!` : `Dejaste de seguir a @${r.author.username}`);
          return {
            ...r,
            author: {
              ...r.author,
              isFollowing: newFollowing,
            },
          };
        }
        return r;
      })
    );
  };

  // Download video handler
  const handleDownloadReel = async (reel: Reel) => {
    showToast('Iniciando descarga del video...');
    const filename = `tikreel-${reel.author.username}-${reel.id}.mp4`;
    const ok = await downloadVideo(reel.videoUrl, filename);
    if (ok) {
      showToast('¡Video descargado exitosamente!');
      setReels((prev) =>
        prev.map((r) =>
          r.id === reel.id
            ? { ...r, stats: { ...r.stats, downloads: r.stats.downloads + 1 } }
            : r
        )
      );
    }
  };

  // Add Comment to active reel
  const handleAddComment = (text: string) => {
    if (!currentReel) return;
    const newComment: CommentItem = {
      id: `c-${Date.now()}`,
      author: {
        username: currentUser.username,
        displayName: currentUser.displayName,
        avatar: currentUser.avatar,
      },
      text,
      timestamp: 'Ahora',
      likes: 0,
      isLiked: false,
    };

    setReels((prev) =>
      prev.map((r) => {
        if (r.id === currentReel.id) {
          return {
            ...r,
            commentsList: [newComment, ...r.commentsList],
            stats: {
              ...r.stats,
              comments: r.stats.comments + 1,
            },
          };
        }
        return r;
      })
    );
    showToast('Comentario publicado');
  };

  // Like a comment
  const handleLikeComment = (commentId: string) => {
    if (!currentReel) return;
    setReels((prev) =>
      prev.map((r) => {
        if (r.id === currentReel.id) {
          const updatedComments = r.commentsList.map((c) => {
            if (c.id === commentId) {
              const liked = !c.isLiked;
              return {
                ...c,
                isLiked: liked,
                likes: liked ? c.likes + 1 : Math.max(0, c.likes - 1),
              };
            }
            return c;
          });
          return { ...r, commentsList: updatedComments };
        }
        return r;
      })
    );
  };

  // Publish new reel
  const handlePublishReel = (newReel: Reel) => {
    setReels((prev) => [newReel, ...prev]);
    setCurrentIndex(0);
    setActiveTab('foryou');
    setFeedMode('foryou');
    showToast('¡Tu video ha sido publicado en el feed!');
  };

  // Jump from Explore or Profile to a specific reel
  const handleSelectReelFromGrid = (reelId: string) => {
    const idx = activeFeedReels.findIndex((r) => r.id === reelId);
    if (idx !== -1) {
      setCurrentIndex(idx);
    } else {
      const globalIdx = reels.findIndex((r) => r.id === reelId);
      if (globalIdx !== -1) {
        setFeedMode('foryou');
        setCurrentIndex(globalIdx);
      }
    }
    setActiveTab('foryou');
  };

  const handleSelectTag = (tag: string | null) => {
    setActiveFilterTag(tag);
    setActiveTab('explore');
  };

  return (
    <div className="relative w-screen h-screen bg-black text-white overflow-hidden flex flex-col font-sans select-none">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-neutral-900/95 border border-cyan-500/40 text-cyan-300 text-xs font-semibold px-4 py-2 rounded-full shadow-2xl backdrop-blur-md flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-200">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Content Area */}
      <div className="relative flex-1 w-full h-full flex items-center justify-center overflow-hidden">
        {/* VIEW 1: REELS VERTICAL FEED */}
        {(activeTab === 'foryou' || activeTab === 'following') && (
          <div
            ref={containerRef}
            onWheel={handleWheel}
            className="relative w-full h-full max-w-[430px] sm:h-[95vh] sm:rounded-3xl sm:border sm:border-neutral-800/80 overflow-hidden shadow-2xl bg-neutral-950 flex flex-col"
          >
            {/* Top Bar for Feed */}
            <Header
              feedMode={feedMode}
              onChangeFeedMode={(mode) => {
                setFeedMode(mode);
                setCurrentIndex(0);
              }}
              onOpenExplore={() => setActiveTab('explore')}
            />

            {/* Active Reel Card */}
            {activeFeedReels.length === 0 ? (
              <div className="w-full h-full flex flex-col items-center justify-center text-center p-6 bg-neutral-950">
                <Sparkles className="w-12 h-12 text-cyan-400 mb-3" />
                <h3 className="text-base font-bold text-white">No hay videos en Siguiendo</h3>
                <p className="text-xs text-neutral-400 mt-1 max-w-xs">
                  Sigue a creadores en la pestaña "Para ti" o publica tus propios videos para verlos aquí.
                </p>
                <button
                  onClick={() => setFeedMode('foryou')}
                  className="mt-4 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold transition-colors"
                >
                  Ir a Para ti
                </button>
              </div>
            ) : (
              <ReelCard
                key={currentReel.id}
                reel={currentReel}
                isActive={true}
                isMuted={isMuted}
                onToggleMute={() => setIsMuted(!isMuted)}
                onLike={() => handleLikeReel(currentReel.id)}
                onBookmark={() => handleBookmarkReel(currentReel.id)}
                onOpenComments={() => setIsCommentsOpen(true)}
                onOpenShare={() => setIsShareOpen(true)}
                onDownload={() => handleDownloadReel(currentReel)}
                onFollowToggle={() => handleFollowToggle(currentReel.author.id)}
                onSelectTag={handleSelectTag}
              />
            )}

            {/* Desktop Navigation Arrows (Float alongside or over player) */}
            <div className="hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2 flex-col gap-2 z-30 pointer-events-auto">
              <button
                onClick={goToPrev}
                disabled={currentIndex === 0}
                aria-label="Video anterior"
                className="w-10 h-10 rounded-full bg-black/50 hover:bg-black/80 disabled:opacity-20 text-white backdrop-blur-md flex items-center justify-center transition-all border border-white/10"
              >
                <ChevronUp className="w-6 h-6" />
              </button>
              <button
                onClick={goToNext}
                disabled={currentIndex >= activeFeedReels.length - 1}
                aria-label="Siguiente video"
                className="w-10 h-10 rounded-full bg-black/50 hover:bg-black/80 disabled:opacity-20 text-white backdrop-blur-md flex items-center justify-center transition-all border border-white/10"
              >
                <ChevronDown className="w-6 h-6" />
              </button>
            </div>
          </div>
        )}

        {/* VIEW 2: EXPLORE / TRENDS */}
        {activeTab === 'explore' && (
          <ExploreView
            reels={reels}
            onSelectReel={handleSelectReelFromGrid}
            activeFilterTag={activeFilterTag}
            onSelectTag={setActiveFilterTag}
          />
        )}

        {/* VIEW 3: USER PROFILE */}
        {activeTab === 'profile' && (
          <ProfileView
            user={currentUser}
            reels={reels}
            onSelectReel={handleSelectReelFromGrid}
            onOpenPublish={() => setIsPublishOpen(true)}
          />
        )}
      </div>

      {/* Bottom Navigation */}
      <BottomNav
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenPublish={() => setIsPublishOpen(true)}
        currentUser={currentUser}
      />

      {/* COMMENTS MODAL */}
      {currentReel && (
        <CommentsModal
          isOpen={isCommentsOpen}
          onClose={() => setIsCommentsOpen(false)}
          comments={currentReel.commentsList}
          currentUser={currentUser}
          onAddComment={handleAddComment}
          onLikeComment={handleLikeComment}
        />
      )}

      {/* SHARE & DOWNLOAD MODAL */}
      {currentReel && (
        <ShareModal
          isOpen={isShareOpen}
          onClose={() => setIsShareOpen(false)}
          reel={currentReel}
          onDownloadComplete={() => {
            setReels((prev) =>
              prev.map((r) =>
                r.id === currentReel.id
                  ? { ...r, stats: { ...r.stats, downloads: r.stats.downloads + 1 } }
                  : r
              )
            );
          }}
        />
      )}

      {/* PUBLISH / RECORD VIDEO MODAL */}
      <PublishModal
        isOpen={isPublishOpen}
        onClose={() => setIsPublishOpen(false)}
        currentUser={currentUser}
        onPublishReel={handlePublishReel}
      />
    </div>
  );
}
