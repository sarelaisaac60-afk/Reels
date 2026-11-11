import React, { useState } from 'react';
import { Search, TrendingUp, Play, Heart, Hash, Sparkles } from 'lucide-react';
import { Reel } from '../types';
import { formatCount } from '../utils/downloadHelper';

interface ExploreViewProps {
  reels: Reel[];
  onSelectReel: (reelId: string) => void;
  activeFilterTag: string | null;
  onSelectTag: (tag: string | null) => void;
}

export const ExploreView: React.FC<ExploreViewProps> = ({
  reels,
  onSelectReel,
  activeFilterTag,
  onSelectTag,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Extract all unique tags with count
  const tagCounts: { [tag: string]: number } = {};
  reels.forEach((r) => {
    r.tags?.forEach((t) => {
      tagCounts[t] = (tagCounts[t] || 0) + 1;
    });
  });

  const popularTags = Object.keys(tagCounts).sort((a, b) => tagCounts[b] - tagCounts[a]);

  // Filter reels
  const filteredReels = reels.filter((reel) => {
    const matchesTag = activeFilterTag
      ? reel.tags?.includes(activeFilterTag.toLowerCase())
      : true;

    if (!searchQuery.trim()) return matchesTag;

    const query = searchQuery.toLowerCase();
    const matchesQuery =
      reel.caption.toLowerCase().includes(query) ||
      reel.author.username.toLowerCase().includes(query) ||
      reel.author.displayName.toLowerCase().includes(query) ||
      reel.category.toLowerCase().includes(query) ||
      reel.tags?.some((t) => t.toLowerCase().includes(query));

    return matchesTag && matchesQuery;
  });

  return (
    <div className="w-full h-full flex flex-col bg-neutral-950 text-white overflow-y-auto no-scrollbar pb-24">
      {/* Top Search Header */}
      <div className="sticky top-0 z-20 bg-neutral-950/90 backdrop-blur-md px-4 pt-4 pb-3 border-b border-neutral-800/80">
        <div className="relative max-w-xl mx-auto">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar videos, usuarios o hashtags..."
            className="w-full bg-neutral-900 border border-neutral-800 rounded-full pl-10 pr-4 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-cyan-500 transition-colors"
          />
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 text-xs text-neutral-400 hover:text-white"
            >
              Borrar
            </button>
          )}
        </div>

        {/* Popular Hashtags Carousel */}
        <div className="flex items-center gap-2 mt-3 overflow-x-auto no-scrollbar max-w-xl mx-auto py-1">
          <button
            onClick={() => onSelectTag(null)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-colors ${
              activeFilterTag === null
                ? 'bg-white text-black'
                : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
            }`}
          >
            Todos
          </button>
          {popularTags.map((tag) => (
            <button
              key={tag}
              onClick={() => onSelectTag(tag === activeFilterTag ? null : tag)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-colors flex items-center gap-1 ${
                activeFilterTag === tag
                  ? 'bg-cyan-500 text-black'
                  : 'bg-neutral-900 text-neutral-300 hover:text-white border border-neutral-800'
              }`}
            >
              <Hash className="w-3 h-3 text-cyan-400" />
              <span>{tag}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Reels */}
      <div className="p-4 max-w-4xl mx-auto w-full">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-red-500" />
            <h2 className="text-sm font-bold tracking-tight">
              {activeFilterTag ? `Tendencias en #${activeFilterTag}` : 'Descubre Videos en Tendencia'}
            </h2>
          </div>
          <span className="text-xs text-neutral-400 tabular-nums">
            {filteredReels.length} videos
          </span>
        </div>

        {filteredReels.length === 0 ? (
          <div className="py-20 text-center text-neutral-400">
            <Sparkles className="w-10 h-10 mx-auto text-neutral-600 mb-2" />
            <p className="text-sm font-medium">No se encontraron videos para tu búsqueda</p>
            <p className="text-xs text-neutral-500 mt-1">Intenta con otros hashtags o palabras clave</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 sm:gap-3">
            {filteredReels.map((reel) => (
              <div
                key={reel.id}
                onClick={() => onSelectReel(reel.id)}
                className="relative aspect-[9/16] bg-neutral-900 rounded-xl overflow-hidden group cursor-pointer border border-neutral-800/60 shadow hover:border-neutral-700 transition-all hover:scale-[1.02]"
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

                {/* Hover Play Button */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white scale-90 group-hover:scale-100 transition-transform">
                    <Play className="w-5 h-5 fill-white ml-0.5" />
                  </div>
                </div>

                {/* Bottom Stats Overlay */}
                <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex items-center justify-between text-white text-[11px] font-medium">
                  <div className="flex items-center gap-1">
                    <Play className="w-3 h-3 fill-white" />
                    <span>{formatCount(reel.stats.likes * 3 + 1200)}</span>
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
