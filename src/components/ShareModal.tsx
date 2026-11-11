import React, { useState } from 'react';
import {
  X,
  Download,
  Link2,
  Check,
  Share,
  QrCode,
  Send,
  Sparkles,
} from 'lucide-react';
import { Reel } from '../types';
import { downloadVideo } from '../utils/downloadHelper';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  reel: Reel;
  onDownloadComplete: () => void;
}

const DEMO_FRIENDS = [
  { id: 'f-1', name: 'Laura Gómez', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&q=80' },
  { id: 'f-2', name: 'Carlos Díaz', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80' },
  { id: 'f-3', name: 'Valeria Sol', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80' },
  { id: 'f-4', name: 'David M.', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&q=80' },
];

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  reel,
  onDownloadComplete,
}) => {
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [sentFriends, setSentFriends] = useState<string[]>([]);
  const [showQR, setShowQR] = useState(false);

  if (!isOpen) return null;

  const currentUrl = window.location.href;
  const shareTitle = `Mira este video de @${reel.author.username} en TikReel: ${reel.caption}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    const filename = `tikreel-${reel.author.username}-${reel.id}.mp4`;
    const success = await downloadVideo(reel.videoUrl, filename);
    setIsDownloading(false);
    if (success) {
      setDownloadSuccess(true);
      onDownloadComplete();
      setTimeout(() => setDownloadSuccess(false), 3000);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'TikReel Video',
          text: shareTitle,
          url: currentUrl,
        });
      } catch {
        // User cancelled or error
      }
    } else {
      handleCopyLink();
    }
  };

  const handleSendToFriend = (friendId: string) => {
    if (sentFriends.includes(friendId)) return;
    setSentFriends((prev) => [...prev, friendId]);
  };

  const shareToSocial = (platform: string) => {
    const encodedUrl = encodeURIComponent(currentUrl);
    const encodedText = encodeURIComponent(shareTitle);
    let url = '';

    switch (platform) {
      case 'whatsapp':
        url = `https://api.whatsapp.com/send?text=${encodedText}%20${encodedUrl}`;
        break;
      case 'telegram':
        url = `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`;
        break;
      case 'twitter':
        url = `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;
        break;
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
        break;
    }

    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
      />

      {/* Drawer Container */}
      <div className="relative w-full sm:max-w-md bg-neutral-900 border-t sm:border border-neutral-800 rounded-t-3xl sm:rounded-2xl flex flex-col shadow-2xl z-10 overflow-hidden text-white pb-6">
        {/* Drag handle affordance */}
        <div className="w-12 h-1.5 bg-neutral-700 rounded-full mx-auto my-2.5 sm:hidden" />

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800">
          <span className="font-bold text-sm tracking-tight">Compartir en</span>
          <button
            onClick={onClose}
            aria-label="Cerrar modal"
            className="p-1 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Send to Direct Friends Strip */}
        <div className="p-4 border-b border-neutral-800/80">
          <p className="text-xs font-medium text-neutral-400 mb-3">Enviar a amigos</p>
          <div className="flex items-center gap-4 overflow-x-auto no-scrollbar">
            {DEMO_FRIENDS.map((friend) => {
              const isSent = sentFriends.includes(friend.id);
              return (
                <div key={friend.id} className="flex flex-col items-center gap-1 shrink-0 w-16">
                  <div className="relative">
                    <img
                      src={friend.avatar}
                      alt={friend.name}
                      referrerPolicy="no-referrer"
                      className="w-12 h-12 rounded-full object-cover ring-2 ring-neutral-700"
                    />
                    {isSent && (
                      <div className="absolute inset-0 bg-cyan-600/80 rounded-full flex items-center justify-center">
                        <Check className="w-5 h-5 text-white stroke-[3]" />
                      </div>
                    )}
                  </div>
                  <span className="text-[11px] text-neutral-300 truncate w-full text-center">
                    {friend.name.split(' ')[0]}
                  </span>
                  <button
                    onClick={() => handleSendToFriend(friend.id)}
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full transition-colors ${
                      isSent
                        ? 'bg-neutral-800 text-neutral-500 cursor-default'
                        : 'bg-red-600 hover:bg-red-500 text-white'
                    }`}
                  >
                    {isSent ? 'Enviado' : 'Enviar'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Social Platforms Row */}
        <div className="p-4 border-b border-neutral-800/80">
          <p className="text-xs font-medium text-neutral-400 mb-3">Redes y mensajería</p>
          <div className="flex items-center justify-between gap-3 overflow-x-auto no-scrollbar py-1">
            {/* WhatsApp */}
            <button
              onClick={() => shareToSocial('whatsapp')}
              className="flex flex-col items-center gap-1.5 shrink-0 group"
            >
              <div className="w-12 h-12 rounded-full bg-emerald-600 hover:bg-emerald-500 flex items-center justify-center shadow-lg transition-transform group-active:scale-95 text-white font-bold text-lg">
                WA
              </div>
              <span className="text-[11px] text-neutral-300">WhatsApp</span>
            </button>

            {/* Telegram */}
            <button
              onClick={() => shareToSocial('telegram')}
              className="flex flex-col items-center gap-1.5 shrink-0 group"
            >
              <div className="w-12 h-12 rounded-full bg-sky-500 hover:bg-sky-400 flex items-center justify-center shadow-lg transition-transform group-active:scale-95 text-white">
                <Send className="w-5 h-5 ml-0.5" />
              </div>
              <span className="text-[11px] text-neutral-300">Telegram</span>
            </button>

            {/* X / Twitter */}
            <button
              onClick={() => shareToSocial('twitter')}
              className="flex flex-col items-center gap-1.5 shrink-0 group"
            >
              <div className="w-12 h-12 rounded-full bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 flex items-center justify-center shadow-lg transition-transform group-active:scale-95 text-white font-bold text-sm">
                𝕏
              </div>
              <span className="text-[11px] text-neutral-300">X (Twitter)</span>
            </button>

            {/* Facebook */}
            <button
              onClick={() => shareToSocial('facebook')}
              className="flex flex-col items-center gap-1.5 shrink-0 group"
            >
              <div className="w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-500 flex items-center justify-center shadow-lg transition-transform group-active:scale-95 text-white font-bold text-sm">
                f
              </div>
              <span className="text-[11px] text-neutral-300">Facebook</span>
            </button>

            {/* Native OS Share */}
            <button
              onClick={handleNativeShare}
              className="flex flex-col items-center gap-1.5 shrink-0 group"
            >
              <div className="w-12 h-12 rounded-full bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 flex items-center justify-center shadow-lg transition-transform group-active:scale-95 text-cyan-400">
                <Share className="w-5 h-5" />
              </div>
              <span className="text-[11px] text-neutral-300">Más</span>
            </button>
          </div>
        </div>

        {/* Action Buttons: Download & Copy Link */}
        <div className="p-4 space-y-3">
          {/* Main Download Button */}
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className={`w-full py-3.5 px-4 rounded-xl flex items-center justify-center gap-2.5 font-semibold text-sm transition-all shadow-lg ${
              downloadSuccess
                ? 'bg-emerald-600 text-white'
                : 'bg-cyan-500 hover:bg-cyan-400 text-black active:scale-[0.98]'
            }`}
          >
            {isDownloading ? (
              <>
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                <span>Descargando video...</span>
              </>
            ) : downloadSuccess ? (
              <>
                <Check className="w-5 h-5 stroke-[3]" />
                <span>¡Video Descargado con Éxito!</span>
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                <span>Descargar Video (MP4)</span>
              </>
            )}
          </button>

          {/* Secondary Actions Grid */}
          <div className="grid grid-cols-2 gap-2">
            {/* Copy Link */}
            <button
              onClick={handleCopyLink}
              className="py-2.5 px-3 rounded-xl bg-neutral-800 hover:bg-neutral-700/80 border border-neutral-700 text-xs font-medium flex items-center justify-center gap-2 transition-colors active:scale-95"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />
                  <span className="text-emerald-400 font-semibold">¡Enlace Copiado!</span>
                </>
              ) : (
                <>
                  <Link2 className="w-4 h-4 text-neutral-400" />
                  <span>Copiar enlace</span>
                </>
              )}
            </button>

            {/* QR Code */}
            <button
              onClick={() => setShowQR(!showQR)}
              className="py-2.5 px-3 rounded-xl bg-neutral-800 hover:bg-neutral-700/80 border border-neutral-700 text-xs font-medium flex items-center justify-center gap-2 transition-colors active:scale-95 text-neutral-300"
            >
              <QrCode className="w-4 h-4 text-cyan-400" />
              <span>{showQR ? 'Ocultar QR' : 'Código QR'}</span>
            </button>
          </div>

          {/* QR Code view */}
          {showQR && (
            <div className="p-4 bg-white text-black rounded-xl flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-200">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(
                  currentUrl
                )}`}
                alt="QR Code"
                className="w-36 h-36 rounded-lg"
              />
              <p className="text-[11px] text-neutral-600 mt-2 font-medium">
                Escanea con tu teléfono para abrir en TikTok style
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
