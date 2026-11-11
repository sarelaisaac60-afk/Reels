/**
 * Ultra-reliable, open CDN video sources that allow hotlinking in iframes without 403 errors.
 * Hosted on Google's gtv-videos-bucket and Wikimedia Commons.
 */
export const RELIABLE_VIDEOS = {
  dance: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4',
  skate: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  music: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
  nature: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
  travel: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
  action: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4',
  animation: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
};

/**
 * Sanitizes any legacy or blocked video URL (such as mixkit) into a verified working stream.
 */
export function getSafeVideoUrl(url?: string): string {
  if (!url) return RELIABLE_VIDEOS.dance;

  // Blob and Data URLs are always safe and local
  if (url.startsWith('blob:') || url.startsWith('data:')) {
    return url;
  }

  // If URL is from mixkit or known blocked domains, replace with reliable alternatives
  if (url.includes('mixkit.co')) {
    if (url.includes('dance') || url.includes('girl')) {
      return RELIABLE_VIDEOS.dance;
    }
    if (url.includes('skater') || url.includes('skateboard')) {
      return RELIABLE_VIDEOS.skate;
    }
    if (url.includes('dj') || url.includes('music')) {
      return RELIABLE_VIDEOS.music;
    }
    if (url.includes('cliff') || url.includes('ocean')) {
      return RELIABLE_VIDEOS.travel;
    }
    return RELIABLE_VIDEOS.nature;
  }

  return url;
}

/**
 * Creates an animated canvas video stream (zero network, 100% offline & sandbox resilient)
 * for cases where external CDNs are firewalled.
 */
export function createAnimatedStream(title: string, color1 = '#06b6d4', color2 = '#ec4899'): MediaStream | null {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 480;
    canvas.height = 854; // 9:16 vertical ratio
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    let frame = 0;
    let animId: number;

    const render = () => {
      frame++;
      const time = frame * 0.03;

      // Dynamic animated gradient background
      const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      const shift = Math.sin(time) * 0.5 + 0.5;
      grad.addColorStop(0, '#0a0a0c');
      grad.addColorStop(0.5, shift > 0.5 ? color1 : color2);
      grad.addColorStop(1, '#050505');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Animated pulsating rings & waves
      ctx.lineWidth = 4;
      for (let i = 0; i < 5; i++) {
        const radius = ((frame * 2 + i * 50) % 300) + 20;
        ctx.strokeStyle = `rgba(255, 255, 255, ${Math.max(0, 1 - radius / 300) * 0.4})`;
        ctx.beginPath();
        ctx.arc(canvas.width / 2, canvas.height / 2, radius, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Title & TikTok text overlay
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(title, canvas.width / 2, canvas.height / 2 + 100);

      animId = requestAnimationFrame(render);
    };

    render();

    // Capture 30fps stream
    const stream = canvas.captureStream(30);

    // Attach cleanup
    (stream as any)._cleanup = () => {
      cancelAnimationFrame(animId);
    };

    return stream;
  } catch (err) {
    console.warn('Canvas captureStream not supported:', err);
    return null;
  }
}
