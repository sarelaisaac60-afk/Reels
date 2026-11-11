import React from 'react';
import { Search, Flame, Radio } from 'lucide-react';
import { TabType } from '../types';

interface HeaderProps {
  feedMode: 'foryou' | 'following';
  onChangeFeedMode: (mode: 'foryou' | 'following') => void;
  onOpenExplore: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  feedMode,
  onChangeFeedMode,
  onOpenExplore,
}) => {
  return (
    <header className="absolute top-0 inset-x-0 z-30 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/80 via-black/40 to-transparent pointer-events-auto">
      {/* Brand mark */}
      <div className="flex items-center gap-1.5 cursor-pointer">
        <span className="text-base font-black tracking-tighter text-white drop-shadow">
          Tik<span className="text-cyan-400">Reel</span>
        </span>
        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
      </div>

      {/* Feed Mode Segmented Tabs */}
      <div className="flex items-center gap-4 text-sm font-semibold">
        <button
          onClick={() => onChangeFeedMode('following')}
          className={`transition-all relative py-1 ${
            feedMode === 'following'
              ? 'text-white scale-105 font-bold'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          Siguiendo
          {feedMode === 'following' && (
            <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-white rounded-full shadow" />
          )}
        </button>

        <span className="text-neutral-600 text-xs select-none">|</span>

        <button
          onClick={() => onChangeFeedMode('foryou')}
          className={`transition-all relative py-1 flex items-center gap-1 ${
            feedMode === 'foryou'
              ? 'text-white scale-105 font-bold'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <span>Para ti</span>
          {feedMode === 'foryou' && (
            <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-white rounded-full shadow" />
          )}
        </button>
      </div>

      {/* Search trigger */}
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenExplore}
          aria-label="Buscar reels"
          className="p-2 rounded-full bg-black/30 hover:bg-black/50 text-white backdrop-blur-md transition-transform active:scale-90"
        >
          <Search className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};
