import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatRelativeTime(timestamp: string): string {
  const now = new Date();
  const messageTime = new Date(timestamp);
  const diffInSeconds = Math.floor((now.getTime() - messageTime.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'just now';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) {
    return `yesterday at ${messageTime.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    })}`;
  }

  if (diffInDays < 7) {
    return `${diffInDays} days ago`;
  }

  // For older messages, show the date with time
  const timeString = messageTime.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });
  
  if (messageTime.getFullYear() !== now.getFullYear()) {
    return `${messageTime.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    })} at ${timeString}`;
  } else {
    return `${messageTime.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric'
    })} at ${timeString}`;
  }
}
