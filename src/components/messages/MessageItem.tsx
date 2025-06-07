import { useState } from "react";
import { MoreHorizontal, Reply, Heart, ThumbsUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ReactionPicker from "./ReactionPicker";
import ImagePreviewModal from "./ImagePreviewModal";
import type { Message } from "@/pages/Messages";

interface MessageItemProps {
  message: Message;
  onReply: (message: Message) => void;
  onPin: () => void;
  isPinned?: boolean;
  onOpenThread?: () => void;
  onReact?: (messageId: string, emoji: string) => void;
}

const MessageItem = ({ message, onReply, onPin, isPinned, onOpenThread, onReact }: MessageItemProps) => {
  const [showActions, setShowActions] = useState(false);
  const [showImagePreview, setShowImagePreview] = useState(false);

  const handleReaction = (emoji: string) => {
    onReact?.(message.id, emoji);
  };

  const hasReacted = (emoji: string) => {
    return message.reactions?.some(r => r.emoji === emoji && r.users.includes('user-1')); // Replace 'user-1' with actual user ID
  };

  return (
    <div 
      className="group flex gap-3 hover:bg-muted/30 -mx-6 px-6 py-2 rounded-lg transition-colors"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Avatar */}
      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
        <span className="text-sm font-medium">
          {message.userName.split(' ').map(n => n[0]).join('')}
        </span>
      </div>

      {/* Message Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 mb-1">
          <span className="font-semibold text-sm">{message.userName}</span>
          <span className="text-xs text-muted-foreground">{message.timestamp}</span>
          {message.isUrgent && (
            <Badge variant="destructive" className="text-xs">
              Urgent
            </Badge>
          )}
          <Button variant="ghost" size="icon" className="ml-2" onClick={onPin}>
            {isPinned ? '📌' : '📍'}
          </Button>
        </div>

        <div className="text-sm leading-relaxed break-words">
          {message.content}
        </div>

        {message.imageUrl && (
          <div className="mt-2">
            <img 
              src={message.imageUrl} 
              alt="sent" 
              className="max-w-xs rounded-lg border shadow-sm hover:shadow-md transition-shadow cursor-pointer" 
              onClick={() => setShowImagePreview(true)}
            />
            {showImagePreview && (
              <ImagePreviewModal
                imageUrl={message.imageUrl}
                fileName={message.fileName || 'image'}
                onClose={() => setShowImagePreview(false)}
              />
            )}
          </div>
        )}

        {message.fileUrl && (
          <div className="mt-2">
            <a 
              href={message.fileUrl} 
              download={message.fileName}
              className="inline-flex items-center gap-2 px-3 py-2 bg-muted hover:bg-muted/80 rounded-lg border transition-colors"
            >
              <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
                {message.fileName?.endsWith('.pdf') ? '📄' : '📎'}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium truncate max-w-[200px]">
                  {message.fileName}
                </span>
                <span className="text-xs text-muted-foreground">
                  Click to download
                </span>
              </div>
            </a>
          </div>
        )}

        {message.responseRequired && message.responseTime && (
          <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded-md">
            <div className="flex items-center gap-2 text-sm">
              <Badge variant="outline" className="text-orange-600 border-orange-300">
                Response required
              </Badge>
              <span className="text-orange-600">in {message.responseTime}</span>
            </div>
          </div>
        )}

        {/* Reactions */}
        {message.reactions && message.reactions.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {message.reactions.map((reaction, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                className={`h-7 px-2 text-xs hover:bg-muted ${
                  hasReacted(reaction.emoji) ? 'bg-muted border-primary' : ''
                }`}
                onClick={() => handleReaction(reaction.emoji)}
              >
                {reaction.emoji} {reaction.count}
              </Button>
            ))}
          </div>
        )}

        {/* Thread replies indicator */}
        {message.threadId && (
          <Button variant="ghost" size="sm" className="mt-2 text-xs text-blue-600 hover:text-blue-800" onClick={onOpenThread}>
            View thread →
          </Button>
        )}
      </div>

      {/* Message Actions */}
      {showActions && (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <ReactionPicker onReact={handleReaction}>
            <Button 
              variant="ghost" 
              size="icon" 
              className={`h-8 w-8 ${hasReacted('👍') ? 'text-primary' : ''}`}
            >
              <ThumbsUp className="h-3 w-3" />
            </Button>
          </ReactionPicker>
          <ReactionPicker onReact={handleReaction}>
            <Button 
              variant="ghost" 
              size="icon" 
              className={`h-8 w-8 ${hasReacted('❤️') ? 'text-primary' : ''}`}
            >
              <Heart className="h-3 w-3" />
            </Button>
          </ReactionPicker>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8"
            onClick={() => onReply(message)}
          >
            <Reply className="h-3 w-3" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={onOpenThread}>Start thread</DropdownMenuItem>
              <DropdownMenuItem>Edit message</DropdownMenuItem>
              <DropdownMenuItem>Copy link</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  );
};

export default MessageItem;
