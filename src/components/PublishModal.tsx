import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Upload,
  Camera,
  Video,
  Music,
  Sparkles,
  RefreshCw,
  Mic,
  MicOff,
  Check,
  AlertCircle,
  Play,
  Pause,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Reel, UserProfile, AudioTrack } from '../types';
import { PRESET_SAMPLE_VIDEOS, TRENDING_SOUNDS } from '../data/sampleReels';

interface PublishModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onPublishReel: (newReel: Reel) => void;
}

const CATEGORIES = [
  'General',
  'Danza & Estilo',
  'Música',
  'Comedia',
  'Deportes',
  'Viajes',
  'Tutoriales',
  'Gaming',
];

const SUGGESTED_TAGS = ['parati', 'fyp', 'viral', 'reels', 'trend', 'humor', 'danza', 'musica'];

export const PublishModal: React.FC<PublishModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onPublishReel,
}) => {
  const [mode, setMode] = useState<'upload' | 'camera' | 'presets'>('upload');
  const [videoFileUrl, setVideoFileUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<string[]>(['parati', 'viral']);
  const [selectedCategory, setSelectedCategory] = useState<string>('General');
  const [selectedSound, setSelectedSound] = useState<AudioTrack>({
    id: 'snd-orig',
    title: `Sonido Original - ${currentUser.displayName}`,
    author: currentUser.displayName,
  });

  // Camera Recording States
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isMicMuted, setIsMicMuted] = useState<boolean>(false);

  // Preview playback
  const [isPreviewPlaying, setIsPreviewPlaying] = useState<boolean>(true);

  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const liveCameraRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clean up media streams and object URLs
  useEffect(() => {
    return () => {
      stopLiveCamera();
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, []);

  // Handle switching to camera mode
  useEffect(() => {
    if (mode === 'camera' && isOpen) {
      startLiveCamera();
    } else {
      stopLiveCamera();
    }
  }, [mode, isOpen]);

  const startLiveCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 720 }, height: { ideal: 1280 } },
        audio: !isMicMuted,
      });
      mediaStreamRef.current = stream;
      if (liveCameraRef.current) {
        liveCameraRef.current.srcObject = stream;
        liveCameraRef.current.play();
      }
    } catch (err: any) {
      console.warn('Camera access denied or unavailable:', err);
      setCameraError('No se pudo acceder a la cámara. Revisa los permisos de tu navegador o sube un video existente.');
    }
  };

  const stopLiveCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (liveCameraRef.current) {
      liveCameraRef.current.srcObject = null;
    }
  };

  const startRecording = () => {
    if (!mediaStreamRef.current) return;
    recordedChunksRef.current = [];
    setRecordingSeconds(0);

    try {
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : 'video/webm';
      const recorder = new MediaRecorder(mediaStreamRef.current, { mimeType });

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const recordedUrl = URL.createObjectURL(blob);
        setVideoFileUrl(recordedUrl);
        stopLiveCamera();
      };

      recorder.start(100);
      mediaRecorderRef.current = recorder;
      setIsRecording(true);

      timerIntervalRef.current = window.setInterval(() => {
        setRecordingSeconds((prev) => {
          if (prev >= 60) {
            stopRecording();
            return 60;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      console.error('Error starting MediaRecorder:', err);
      setCameraError('Tu navegador no soporta grabación en este formato. Prueba subiendo un archivo.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    setIsRecording(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const objectUrl = URL.createObjectURL(file);
      setVideoFileUrl(objectUrl);
      if (!caption) {
        setCaption(`¡Nuevo reel! 🎬 ${file.name.replace(/\.[^/.]+$/, '')}`);
      }
    }
  };

  const handleSelectPreset = (presetUrl: string, presetName: string, category: string) => {
    setVideoFileUrl(presetUrl);
    setSelectedCategory(category);
    if (!caption) {
      setCaption(`¡Probando este genial clip de ${presetName.toLowerCase()}! ✨🔥`);
    }
  };

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags((prev) => prev.filter((t) => t !== tag));
    } else {
      setSelectedTags((prev) => [...prev, tag]);
    }
  };

  const handlePublish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoFileUrl) return;

    const newReel: Reel = {
      id: `reel-${Date.now()}`,
      videoUrl: videoFileUrl,
      caption: caption || 'Nuevo video recién publicado 🚀',
      tags: selectedTags,
      category: selectedCategory,
      author: {
        id: currentUser.id,
        username: currentUser.username,
        displayName: currentUser.displayName,
        avatar: currentUser.avatar,
        isVerified: true,
        isFollowing: false,
      },
      audio: selectedSound,
      stats: {
        likes: 1,
        comments: 0,
        shares: 0,
        bookmarks: 0,
        downloads: 0,
      },
      isLiked: true, // auto-like your own post
      isBookmarked: false,
      createdAt: 'Ahora mismo',
      commentsList: [],
    };

    // Confetti effect!
    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#06b6d4', '#ec4899', '#3b82f6', '#10b981', '#f59e0b'],
      });
    } catch {
      // Ignored if canvas-confetti is not loaded
    }

    onPublishReel(newReel);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity"
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl z-10 overflow-hidden text-white flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-red-500 flex items-center justify-center text-white">
              <Video className="w-4 h-4" />
            </div>
            <h2 className="font-bold text-base tracking-tight">Publicar Nuevo Reel</h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar modal"
            className="p-1 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Source Mode Tabs */}
        {!videoFileUrl && (
          <div className="flex border-b border-neutral-800 bg-neutral-950/60 p-1">
            <button
              onClick={() => setMode('upload')}
              className={`flex-1 py-2.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors ${
                mode === 'upload'
                  ? 'bg-neutral-800 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Upload className="w-4 h-4" />
              <span>Subir Archivo</span>
            </button>
            <button
              onClick={() => setMode('camera')}
              className={`flex-1 py-2.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors ${
                mode === 'camera'
                  ? 'bg-neutral-800 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Camera className="w-4 h-4" />
              <span>Grabar Cámara</span>
            </button>
            <button
              onClick={() => setMode('presets')}
              className={`flex-1 py-2.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors ${
                mode === 'presets'
                  ? 'bg-neutral-800 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>Clips Listos</span>
            </button>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 no-scrollbar">
          {/* STEP 1: Video Selection / Recording */}
          {!videoFileUrl ? (
            <div>
              {mode === 'upload' && (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-neutral-700 hover:border-cyan-500 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors bg-neutral-950/40 hover:bg-neutral-950/80 group min-h-[260px]"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <div className="w-16 h-16 rounded-full bg-cyan-500/10 text-cyan-400 group-hover:scale-110 flex items-center justify-center transition-transform mb-3">
                    <Upload className="w-8 h-8" />
                  </div>
                  <p className="font-semibold text-sm text-neutral-200">
                    Selecciona o arrastra tu video aquí
                  </p>
                  <p className="text-xs text-neutral-500 mt-1">
                    MP4, WebM o MOV · Hasta 60 segundos recomendado (9:16 vertical)
                  </p>
                  <button
                    type="button"
                    className="mt-4 px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-white transition-colors"
                  >
                    Examinar archivos
                  </button>
                </div>
              )}

              {mode === 'camera' && (
                <div className="flex flex-col items-center">
                  {cameraError ? (
                    <div className="p-6 text-center bg-red-950/30 border border-red-800/50 rounded-2xl w-full">
                      <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-2" />
                      <p className="text-sm font-semibold text-red-200">{cameraError}</p>
                      <button
                        onClick={startLiveCamera}
                        className="mt-4 px-4 py-2 rounded-xl bg-neutral-800 text-xs font-medium text-white hover:bg-neutral-700 flex items-center gap-1.5 mx-auto"
                      >
                        <RefreshCw className="w-3.5 h-3.5" /> Reintentar
                      </button>
                    </div>
                  ) : (
                    <div className="relative w-full max-w-[280px] aspect-[9/16] bg-black rounded-2xl overflow-hidden shadow-xl border border-neutral-800">
                      <video
                        ref={liveCameraRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover scale-x-[-1]"
                      />

                      {/* Timer Overlay */}
                      {isRecording && (
                        <div className="absolute top-3 left-3 bg-red-600/90 text-white text-xs font-mono px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow">
                          <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                          <span>00:{recordingSeconds < 10 ? '0' : ''}{recordingSeconds} / 01:00</span>
                        </div>
                      )}

                      {/* Microphone toggle */}
                      <button
                        onClick={() => setIsMicMuted(!isMicMuted)}
                        className="absolute top-3 right-3 p-2 rounded-full bg-black/60 text-white backdrop-blur-sm"
                      >
                        {isMicMuted ? <MicOff className="w-4 h-4 text-red-400" /> : <Mic className="w-4 h-4" />}
                      </button>

                      {/* Record Trigger Button */}
                      <div className="absolute bottom-5 inset-x-0 flex items-center justify-center">
                        {isRecording ? (
                          <button
                            onClick={stopRecording}
                            className="w-16 h-16 rounded-full bg-red-600 border-4 border-white flex items-center justify-center animate-pulse-recording shadow-2xl active:scale-95 transition-transform"
                          >
                            <div className="w-6 h-6 rounded bg-white" />
                          </button>
                        ) : (
                          <button
                            onClick={startRecording}
                            className="w-16 h-16 rounded-full bg-red-600 border-4 border-white flex items-center justify-center shadow-2xl active:scale-95 transition-transform"
                          >
                            <div className="w-12 h-12 rounded-full bg-red-500" />
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {mode === 'presets' && (
                <div className="space-y-3">
                  <p className="text-xs text-neutral-400">
                    Elige un video vertical de alta calidad para probar la experiencia instantáneamente:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {PRESET_SAMPLE_VIDEOS.map((preset, index) => (
                      <div
                        key={index}
                        onClick={() => handleSelectPreset(preset.url, preset.name, preset.category)}
                        className="p-3 rounded-xl bg-neutral-950/60 hover:bg-neutral-800 border border-neutral-800 hover:border-cyan-500/60 cursor-pointer transition-all flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-neutral-800 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform">
                            <Play className="w-4 h-4 fill-current ml-0.5" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-white group-hover:text-cyan-300">
                              {preset.name}
                            </p>
                            <p className="text-[11px] text-neutral-500">
                              {preset.category} · {preset.duration}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs text-cyan-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                          Usar →
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* STEP 2: Preview & Metadata Details */
            <form onSubmit={handlePublish} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-5">
                {/* Video Preview Card */}
                <div className="sm:col-span-5 flex flex-col items-center">
                  <div className="relative w-full max-w-[220px] aspect-[9/16] bg-black rounded-2xl overflow-hidden shadow-2xl border border-neutral-800 group">
                    <video
                      ref={videoPreviewRef}
                      src={videoFileUrl}
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const v = videoPreviewRef.current;
                        if (v) {
                          if (v.paused) {
                            v.play();
                            setIsPreviewPlaying(true);
                          } else {
                            v.pause();
                            setIsPreviewPlaying(false);
                          }
                        }
                      }}
                      className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity text-white"
                    >
                      <div className="w-10 h-10 rounded-full bg-black/60 flex items-center justify-center">
                        {isPreviewPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setVideoFileUrl(null)}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 hover:bg-red-600 text-white transition-colors"
                      title="Cambiar video"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <span className="text-[11px] text-neutral-400 mt-2">
                    Vista previa del Reel
                  </span>
                </div>

                {/* Video Info Form */}
                <div className="sm:col-span-7 space-y-4">
                  {/* Caption */}
                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                      Descripción del Reel
                    </label>
                    <textarea
                      rows={3}
                      value={caption}
                      onChange={(e) => setCaption(e.target.value)}
                      placeholder="Escribe un título llamativo, menciona qué pasa en el video..."
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-cyan-500 transition-colors resize-none"
                    />
                  </div>

                  {/* Hashtags */}
                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                      Hashtags sugeridos
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {SUGGESTED_TAGS.map((tag) => {
                        const active = selectedTags.includes(tag);
                        return (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => toggleTag(tag)}
                            className={`text-xs px-2.5 py-1 rounded-full transition-colors ${
                              active
                                ? 'bg-cyan-500 text-black font-semibold'
                                : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                            }`}
                          >
                            #{tag}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Sound Selector */}
                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                      Pista de audio / Sonido
                    </label>
                    <div className="relative">
                      <select
                        value={selectedSound.id}
                        onChange={(e) => {
                          const sound =
                            TRENDING_SOUNDS.find((s) => s.id === e.target.value) || {
                              id: 'snd-orig',
                              title: `Sonido Original - ${currentUser.displayName}`,
                              author: currentUser.displayName,
                            };
                          setSelectedSound(sound);
                        }}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-cyan-500 appearance-none pr-8"
                      >
                        <option value="snd-orig">
                          Sonido Original - {currentUser.displayName}
                        </option>
                        {TRENDING_SOUNDS.map((snd) => (
                          <option key={snd.id} value={snd.id}>
                            🎵 {snd.title} ({snd.author})
                          </option>
                        ))}
                      </select>
                      <Music className="w-4 h-4 text-neutral-400 absolute right-3 top-3 pointer-events-none" />
                    </div>
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                      Categoría
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {CATEGORIES.map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setSelectedCategory(cat)}
                          className={`text-xs px-2.5 py-1 rounded-lg transition-colors ${
                            selectedCategory === cat
                              ? 'bg-neutral-200 text-black font-semibold'
                              : 'bg-neutral-950 border border-neutral-800 text-neutral-400 hover:text-white'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setVideoFileUrl(null)}
                  className="px-4 py-2.5 text-xs font-medium text-neutral-400 hover:text-white transition-colors"
                >
                  Cambiar video
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-red-500 hover:from-cyan-400 hover:to-red-400 text-white font-bold text-xs tracking-wide shadow-lg shadow-red-500/20 active:scale-95 transition-all flex items-center gap-2"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Publicar Ahora</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
