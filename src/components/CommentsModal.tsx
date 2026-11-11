import React, { useState } from 'react';
import { X, Heart, Send, MessageCircle } from 'lucide-react';
import { CommentItem, UserProfile } from '../types';
import { formatCount } from '../utils/downloadHelper';

interface CommentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  comments: CommentItem[];
  currentUser: UserProfile;
  onAddComment: (text: string) => void;
  onLikeComment: (commentId: string) => void;
}

const QUICK_EMOJIS = ['❤️', '🔥', '😂', '👏', '😍', '🙌', '✨', '💯'];

export const CommentsModal: React.FC<CommentsModalProps> = ({
  isOpen,
  onClose,
  comments,
  currentUser,
  onAddComment,
  onLikeComment,
}) => {
  const [commentText, setCommentText] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    onAddComment(commentText.trim());
    setCommentText('');
  };

  const handleAddEmoji = (emoji: string) => {
    setCommentText((prev) => prev + emoji);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
      />

      {/* Drawer Container */}
      <div className="relative w-full sm:max-w-md h-[70vh] sm:h-[600px] bg-neutral-900 border-t sm:border border-neutral-800 rounded-t-3xl sm:rounded-2xl flex flex-col shadow-2xl z-10 overflow-hidden text-white">
        {/* Drag handle affordance */}
        <div className="w-12 h-1.5 bg-neutral-700 rounded-full mx-auto my-2.5 sm:hidden" />

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm tracking-tight">
              {formatCount(comments.length)} comentarios
            </span>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar comentarios"
            className="p-1 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 no-scrollbar">
          {comments.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-neutral-400 py-12">
              <MessageCircle className="w-12 h-12 stroke-[1.5] mb-2 opacity-40 text-cyan-400" />
              <p className="text-sm font-medium text-neutral-300">Sé el primero en comentar</p>
              <p className="text-xs text-neutral-500 mt-1">Comparte lo que piensas sobre este video</p>
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="flex items-start gap-3 group">
                <img
                  src={comment.author.avatar}
                  alt={comment.author.displayName}
                  referrerPolicy="no-referrer"
                  className="w-8 h-8 rounded-full object-cover shrink-0 bg-neutral-800"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-neutral-300 hover:underline cursor-pointer">
                      @{comment.author.username}
                    </span>
                    <span className="text-[11px] text-neutral-500">{comment.timestamp}</span>
                  </div>
                  <p className="text-xs text-neutral-100 mt-0.5 leading-relaxed break-words">
                    {comment.text}
                  </p>
                  <button className="text-[11px] text-neutral-400 hover:text-neutral-200 mt-1 font-medium">
                    Responder
                  </button>
                </div>
                <div className="flex flex-col items-center shrink-0">
                  <button
                    onClick={() => onLikeComment(comment.id)}
                    aria-label="Dar me gusta al comentario"
                    className="p-1 rounded-full hover:bg-neutral-800 active:scale-90 transition-transform"
                  >
                    <Heart
                      className={`w-4 h-4 transition-colors ${
                        comment.isLiked
                          ? 'fill-red-500 text-red-500'
                          : 'text-neutral-500 group-hover:text-neutral-300'
                      }`}
                    />
                  </button>
                  {comment.likes > 0 && (
                    <span className="text-[10px] text-neutral-400 tabular-nums">
                      {comment.likes}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Emoji Bar */}
        <div className="px-4 py-1.5 bg-neutral-900 border-t border-neutral-800 flex items-center gap-2 overflow-x-auto no-scrollbar">
          {QUICK_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => handleAddEmoji(emoji)}
              type="button"
              className="text-lg hover:scale-125 transition-transform p-1 select-none"
            >
              {emoji}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSubmit} className="p-3 bg-neutral-950 border-t border-neutral-800 flex items-center gap-2">
          <img
            src={currentUser.avatar}
            alt={currentUser.displayName}
            referrerPolicy="no-referrer"
            className="w-8 h-8 rounded-full object-cover shrink-0 bg-neutral-800 ring-1 ring-neutral-700"
          />
          <input
            type="text"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Añade un comentario..."
            className="flex-1 bg-neutral-800 hover:bg-neutral-800/80 focus:bg-neutral-800 text-xs sm:text-sm text-white placeholder-neutral-500 rounded-full px-4 py-2 outline-none focus:ring-1 focus:ring-cyan-400 transition-all"
          />
          <button
            type="submit"
            disabled={!commentText.trim()}
            aria-label="Publicar comentario"
            className="w-9 h-9 rounded-full bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 disabled:hover:bg-cyan-500 text-black font-bold flex items-center justify-center transition-all shrink-0 active:scale-95"
          >
            <Send className="w-4 h-4 ml-0.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
