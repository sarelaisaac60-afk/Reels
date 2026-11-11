import React from 'react';
import { Home, Compass, Plus, Bookmark, User as UserIcon } from 'lucide-react';
import { TabType, UserProfile } from '../types';

interface BottomNavProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
  onOpenPublish: () => void;
  currentUser: UserProfile;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onSelectTab,
  onOpenPublish,
  currentUser,
}) => {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 h-16 bg-neutral-950/90 backdrop-blur-lg border-t border-neutral-900/80 flex items-center justify-around px-2 max-w-lg mx-auto sm:rounded-t-2xl">
      {/* Feed / Home Tab */}
      <button
        onClick={() => onSelectTab('foryou')}
        className={`min-h-[44px] min-w-[44px] flex flex-col items-center justify-center gap-0.5 transition-colors ${
          activeTab === 'foryou' || activeTab === 'following'
            ? 'text-white'
            : 'text-neutral-500 hover:text-neutral-300'
        }`}
      >
        <Home className={`w-5 h-5 ${activeTab === 'foryou' || activeTab === 'following' ? 'stroke-[2.5]' : ''}`} />
        <span className="text-[10px] font-semibold tracking-tight">Inicio</span>
      </button>

      {/* Explore / Trends Tab */}
      <button
        onClick={() => onSelectTab('explore')}
        className={`min-h-[44px] min-w-[44px] flex flex-col items-center justify-center gap-0.5 transition-colors ${
          activeTab === 'explore'
            ? 'text-white'
            : 'text-neutral-500 hover:text-neutral-300'
        }`}
      >
        <Compass className={`w-5 h-5 ${activeTab === 'explore' ? 'stroke-[2.5] text-cyan-400' : ''}`} />
        <span className="text-[10px] font-semibold tracking-tight">Explorar</span>
      </button>

      {/* Special TikTok-style "+" Publish Button */}
      <div className="flex items-center justify-center px-1">
        <button
          onClick={onOpenPublish}
          aria-label="Publicar video"
          className="relative group active:scale-90 transition-transform flex items-center justify-center"
        >
          {/* Layered Cyan & Red background offset */}
          <div className="w-11 h-7.5 bg-cyan-400 rounded-lg absolute -left-0.5" />
          <div className="w-11 h-7.5 bg-red-500 rounded-lg absolute -right-0.5" />
          <div className="relative w-10.5 h-7.5 bg-white rounded-lg flex items-center justify-center z-10 shadow">
            <Plus className="w-5 h-5 text-black stroke-[3]" />
          </div>
        </button>
      </div>

      {/* Saved / Activity Quick Filter Tab */}
      <button
        onClick={() => onSelectTab('profile')}
        className={`min-h-[44px] min-w-[44px] flex flex-col items-center justify-center gap-0.5 transition-colors ${
          activeTab === 'profile'
            ? 'text-white'
            : 'text-neutral-500 hover:text-neutral-300'
        }`}
      >
        <div className="relative">
          <div className={`w-6 h-6 rounded-full overflow-hidden ring-1 ${activeTab === 'profile' ? 'ring-cyan-400 ring-2' : 'ring-neutral-700'}`}>
            <img
              src={currentUser.avatar}
              alt={currentUser.displayName}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
        <span className="text-[10px] font-semibold tracking-tight">Perfil</span>
      </button>
    </nav>
  );
};
