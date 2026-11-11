export interface Author {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  isVerified?: boolean;
  isFollowing?: boolean;
}

export interface AudioTrack {
  id: string;
  title: string;
  author: string;
  cover?: string;
  duration?: number;
}

export interface CommentItem {
  id: string;
  author: {
    username: string;
    displayName: string;
    avatar: string;
  };
  text: string;
  timestamp: string;
  likes: number;
  isLiked?: boolean;
}

export interface ReelStats {
  likes: number;
  comments: number;
  shares: number;
  bookmarks: number;
  downloads: number;
}

export interface Reel {
  id: string;
  videoUrl: string;
  thumbnailUrl?: string;
  caption: string;
  tags: string[];
  category: string;
  author: Author;
  audio: AudioTrack;
  stats: ReelStats;
  isLiked: boolean;
  isBookmarked: boolean;
  createdAt: string;
  commentsList: CommentItem[];
}

export interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  bio: string;
  followersCount: number;
  followingCount: number;
  totalLikes: number;
}

export type TabType = 'foryou' | 'following' | 'explore' | 'profile';
