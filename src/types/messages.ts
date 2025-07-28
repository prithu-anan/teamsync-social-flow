export interface Channel {
  id: string;
  name: string;
  type: 'direct' | 'group';
  isOnline?: boolean;
  unreadCount?: number;
  lastMessage?: string;
  lastMessageTime?: string;
  participants?: string[];
  project?: string;
  recipient_id?: string | null;
  channel_id?: string | null;
}

export interface Message {
  id: string;
  sender_id: string;
  channel_id?: string | null;
  recipient_id?: string | null;
  content: string;
  timestamp: string;
  thread_parent_id?: string | null;
  userName?: string;
  userAvatar?: string;
  reactions?: { emoji: string; count: number; users: string[] }[];
  isUrgent?: boolean;
  responseRequired?: boolean;
  responseTime?: string;
  // File-related fields from API
  file_url?: string;
  file_type?: string;
  // Legacy fields for backward compatibility
  fileUrl?: string;
  fileName?: string;
  imageUrl?: string;
  // For sending files
  files?: File[];
  updateType?: 'reaction' | 'new' | 'edit' | 'delete';
  isOptimistic?: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
} 