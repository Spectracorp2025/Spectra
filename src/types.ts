export type UserRank = 'Normal' | 'Premium' | 'Plus';

export interface UserProfile {
  id: string;
  name: string;
  age: number;
  country: string;
  phone: string;
  email?: string;
  rank: UserRank;
  is_admin: boolean;
  rank_expiration?: string; // ISO date
  created_at?: string;
}

export interface Announcement {
  id: string;
  title: string;
  description: string;
  type: 'image' | 'video';
  media_url: string;
  created_at: string;
}

export interface Report {
  id: string;
  user_id: string;
  user_name: string;
  type: 'bug' | 'suggestion' | 'other';
  message: string;
  status: 'pending' | 'resolved';
  created_at: string;
}

export interface LightNovel {
  id: string;
  title: string;
  photo_url: string;
  description: string;
  created_at: string;
}

export interface Chapter {
  id: string;
  novel_id: string;
  title: string;
  order: number;
  content: (ChapterVideo | ChapterDialogue)[];
  created_at: string;
}

export interface ChapterVideo {
  type: 'video';
  youtube_url: string;
}

export interface ChapterDialogue {
  type: 'dialogue';
  character_name?: string;
  text: string;
  is_thinking?: boolean;
}

export interface Stream {
  id: string;
  title: string;
  description: string;
  photo_url: string;
  video_url?: string;
  stream_url: string;
  start_time: string; // ISO date
  duration_hours: number; // usually 3
  created_at: string;
}

export interface ForumPost {
  id: string;
  user_id: string;
  user_name: string;
  title: string;
  content: string;
  likes_count: number;
  comments_count: number;
  created_at: string;
}

export interface ForumComment {
  id: string;
  post_id: string;
  user_id: string;
  user_name: string;
  content: string;
  created_at: string;
}

export interface Product {
    id: string;
    photo_url: string;
    online_url: string;
    name: string;
    description: string;
    price_cop: number;
    created_at: string;
}

export interface Game {
    id: string;
    photo_url: string;
    name: string;
    description: string;
    free_ranks: UserRank[]; // Array of ranks that get it for free
    price_cop: number;
    download_url?: string;
    password?: string;
    type: 'mobile' | 'pc';
    created_at: string;
}

export interface Tool {
    id: string;
    photo_url: string;
    name: string;
    description: string;
    free_ranks: UserRank[];
    price_cop: number;
    download_url?: string;
    created_at: string;
}

export interface SocialNetwork {
    id: string;
    photo_url: string;
    title: string;
    link: string;
    created_at: string;
}

export interface SharedAccount {
    id: string;
    platform: string;
    email: string;
    password?: string;
    expiration_date: string;
    allowed_ranks: UserRank[];
    created_at: string;
}

export interface Plan {
    id: string;
    photo_url: string;
    title: string;
    description: string;
    price_cop: number;
    duration: 'monthly' | 'quarterly' | 'annual' | 'lifetime';
    created_at: string;
}
