/**
 * Utility to download video files reliably
 */
export async function downloadVideo(videoUrl: string, filename = 'tiktok-reel.mp4'): Promise<boolean> {
  try {
    // If it's already a blob: or data: URL
    if (videoUrl.startsWith('blob:') || videoUrl.startsWith('data:')) {
      const a = document.createElement('a');
      a.href = videoUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return true;
    }

    // Try fetching as blob
    try {
      const response = await fetch(videoUrl, { mode: 'cors' });
      if (response.ok) {
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);
        return true;
      }
    } catch {
      // CORS might block fetch on external domain, fall back to direct anchor download
    }

    // Fallback: create direct anchor link
    const a = document.createElement('a');
    a.href = videoUrl;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    return true;
  } catch (err) {
    console.error('Error downloading video:', err);
    return false;
  }
}

/**
 * Format numbers like TikTok (1.2K, 3.4M, etc.)
 */
export function formatCount(count: number): string {
  if (count >= 1_000_000) {
    return (count / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (count >= 1_000) {
    return (count / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return count.toString();
}
