import React, { useState } from 'react';
import {
  Grid,
  Heart,
  Bookmark,
  Edit3,
  Share2,
  Play,
  BadgeCheck,
  PlusCircle,
  Video,
} from 'lucide-react';
import { Reel, UserProfile } from '../types';
import { formatCount } from '../utils/downloadHelper';

interface ProfileViewProps {
  user: UserProfile;
  reels: Reel[];
  onSelectReel: (reelId: string) => void;
  onOpenPublish: () => void;
  onUpdateBio?: (newBio: string) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  user,
  reels,
  onSelectReel,
  onOpenPublish,
}) => {
  const [activeTab, setActiveTab] = useState<'my' | 'liked' | 'saved'>('my');

  // Categorize reels
  const myReels = reels.filter((r) => r.author.id === user.id);
  const likedReels = reels.filter((r) => r.isLiked);
  const savedReels = reels.filter((r) => r.isBookmarked);

  const displayedReels =
    activeTab === 'my'
      ? myReels
      : activeTab === 'liked'
      ? likedReels
      : savedReels;

  return (
    <div className="w-full h-full flex flex-col bg-neutral-950 text-white overflow-y-auto no-scrollbar pb-24">
      {/* Top Header */}
      <div className="p-5 max-w-xl mx-auto w-full flex flex-col items-center text-center">
        {/* Avatar */}
        <div className="relative mb-3 group cursor-pointer">
          <div className="w-24 h-24 rounded-full overflow-hidden ring-4 ring-neutral-800 bg-neutral-900 shadow-xl">
            <img
              src={user.avatar}
              alt={user.displayName}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>
          <button
            onClick={onOpenPublish}
            className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-cyan-500 text-black flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-transform"
            title="Publicar video"
          >
            <PlusCircle className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* Name and Handle */}
        <div className="flex items-center gap-1.5 mb-1">
          <h1 className="text-lg font-bold tracking-tight">{user.displayName}</h1>
          <BadgeCheck className="w-4 h-4 text-cyan-400 fill-cyan-400/20" />
        </div>
        <p className="text-xs text-neutral-400 mb-4">@{user.username}</p>

        {/* Stats Row */}
        <div className="flex items-center gap-8 py-2 px-6 rounded-2xl bg-neutral-900/60 border border-neutral-800/80 mb-4">
          <div className="text-center">
            <span className="block font-bold text-base text-white tabular-nums">
              {formatCount(user.followingCount)}
            </span>
            <span className="text-[11px] text-neutral-400 font-medium">Siguiendo</span>
          </div>
          <div className="w-px h-6 bg-neutral-800" />
          <div className="text-center">
            <span className="block font-bold text-base text-white tabular-nums">
              {formatCount(user.followersCount)}
            </span>
            <span className="text-[11px] text-neutral-400 font-medium">Seguidores</span>
          </div>
          <div className="w-px h-6 bg-neutral-800" />
          <div className="text-center">
            <span className="block font-bold text-base text-white tabular-nums">
              {formatCount(user.totalLikes)}
            </span>
            <span className="text-[11px] text-neutral-400 font-medium">Me gusta</span>
          </div>
        </div>

        {/* Bio */}
        <p className="text-xs text-neutral-300 max-w-sm mb-4 leading-relaxed">
          {user.bio}
        </p>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 w-full max-w-xs justify-center mb-6">
          <button
            onClick={onOpenPublish}
            className="flex-1 py-2 px-4 rounded-xl bg-gradient-to-r from-red-600 to-cyan-500 hover:from-red-500 hover:to-cyan-400 text-white font-bold text-xs tracking-wide shadow-md active:scale-95 transition-all flex items-center justify-center gap-1.5"
          >
            <Video className="w-4 h-4" />
            <span>Publicar Reel</span>
          </button>
          <button className="p-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white transition-colors active:scale-95">
            <Share2 className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs Bar */}
        <div className="w-full border-t border-neutral-800/80 flex items-center justify-around">
          <button
            onClick={() => setActiveTab('my')}
            className={`py-3 flex-1 flex items-center justify-center gap-2 border-b-2 text-xs font-semibold transition-colors ${
              activeTab === 'my'
                ? 'border-white text-white'
                : 'border-transparent text-neutral-500 hover:text-neutral-300'
            }`}
          >
            <Grid className="w-4 h-4" />
            <span>Mis Videos ({myReels.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('liked')}
            className={`py-3 flex-1 flex items-center justify-center gap-2 border-b-2 text-xs font-semibold transition-colors ${
              activeTab === 'liked'
                ? 'border-white text-white'
                : 'border-transparent text-neutral-500 hover:text-neutral-300'
            }`}
          >
            <Heart className="w-4 h-4" />
            <span>Me Gusta ({likedReels.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('saved')}
            className={`py-3 flex-1 flex items-center justify-center gap-2 border-b-2 text-xs font-semibold transition-colors ${
              activeTab === 'saved'
                ? 'border-white text-white'
                : 'border-transparent text-neutral-500 hover:text-neutral-300'
            }`}
          >
            <Bookmark className="w-4 h-4" />
            <span>Guardados ({savedReels.length})</span>
          </button>
        </div>
      </div>

      {/* Grid of reels */}
      <div className="p-4 max-w-4xl mx-auto w-full">
        {displayedReels.length === 0 ? (
          <div className="py-16 text-center text-neutral-400">
            {activeTab === 'my' ? (
              <>
                <Video className="w-12 h-12 mx-auto text-neutral-600 mb-2" />
                <p className="text-sm font-semibold text-neutral-200">Aún no has publicado ningún Reel</p>
                <p className="text-xs text-neutral-500 mt-1 mb-4">
                  Graba desde tu cámara o sube un video para empezar a conectar
                </p>
                <button
                  onClick={onOpenPublish}
                  className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-xs transition-colors"
                >
                  Crear primer video
                </button>
              </>
            ) : activeTab === 'liked' ? (
              <>
                <Heart className="w-12 h-12 mx-auto text-neutral-600 mb-2" />
                <p className="text-sm font-semibold text-neutral-200">No hay videos con Me Gusta</p>
                <p className="text-xs text-neutral-500 mt-1">
                  Dale doble tap o click al corazón en cualquier video del feed
                </p>
              </>
            ) : (
              <>
                <Bookmark className="w-12 h-12 mx-auto text-neutral-600 mb-2" />
                <p className="text-sm font-semibold text-neutral-200">No hay videos guardados</p>
                <p className="text-xs text-neutral-500 mt-1">
                  Guarda tus videos favoritos para verlos más tarde
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 sm:gap-3">
            {displayedReels.map((reel) => (
              <div
                key={reel.id}
                onClick={() => onSelectReel(reel.id)}
                className="relative aspect-[9/16] bg-neutral-900 rounded-xl overflow-hidden group cursor-pointer border border-neutral-800 shadow hover:border-neutral-700 transition-all hover:scale-[1.02]"
              >
                {/* Video thumbnail with poster and fallback */}
                {reel.thumbnailUrl ? (
                  <img
                    src={reel.thumbnailUrl}
                    alt={reel.caption}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-neutral-800 to-neutral-950 flex flex-col items-center justify-center p-3 text-center">
                    <Play className="w-6 h-6 text-cyan-400 mb-1" />
                    <span className="text-[10px] text-neutral-400 line-clamp-2">{reel.caption}</span>
                  </div>
                )}

                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
                    <Play className="w-5 h-5 fill-white ml-0.5" />
                  </div>
                </div>

                <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/80 to-transparent flex items-center justify-between text-white text-[11px] font-medium">
                  <div className="flex items-center gap-1">
                    <Play className="w-3 h-3 fill-white" />
                    <span>{formatCount(reel.stats.likes * 2 + 500)}</span>
                  </div>
                  <div className="flex items-center gap-1 text-red-400">
                    <Heart className="w-3 h-3 fill-current" />
                    <span>{formatCount(reel.stats.likes)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
