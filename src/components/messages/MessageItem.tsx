import { useState } from "react";
import { MoreHorizontal, Reply, Heart, Pin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ReactionPicker from "./ReactionPicker";
import ImagePreviewModal from "./ImagePreviewModal";
import FileMessage from "./FileMessage";
import type { Message } from "@/pages/Messages";
import { useAuth } from "@/contexts/AuthContext";
import { formatRelativeTime } from "@/lib/utils";
import { Textarea } from "../ui/textarea";

interface MessageItemProps {
  message: Message;
  onReply: (message: Message) => void;
  onPin: () => void;
  isPinned?: boolean;
  onOpenThread?: () => void;
  onReact?: (messageId: string, emoji: string) => void;
  onEdit: (messageId: string, newContent: string) => void;
  onDelete: (messageId: string) => void;
}

const MessageItem = ({ 
  message, 
  onReply, 
  onPin, 
  isPinned, 
  onOpenThread, 
  onReact,
  onEdit,
  onDelete
}: MessageItemProps) => {
  const { user } = useAuth();
  const [showActions, setShowActions] = useState(false);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(message.content);

  const isOwnMessage = user?.id && message.sender_id && String(user.id) === String(message.sender_id);

  const handleReaction = (emoji: string) => {
    onReact?.(message.id, emoji);
  };

  const hasReacted = (emoji: string) => {
    return message.reactions?.some(r => r.emoji === emoji && r.users.includes(user?.id || 'user-1'));
  };

  const handleSaveEdit = () => {
    if (editedContent.trim() && editedContent.trim() !== message.content) {
      onEdit(message.id, editedContent);
    }
    setIsEditing(false);
  };
  
  const handleCancelEdit = () => {
    setEditedContent(message.content);
    setIsEditing(false);
  };

  return (
    <>
      <div 
        className={`group flex gap-3 hover:bg-muted/30 -mx-6 px-6 py-2 rounded-lg transition-colors ${
          message.isOptimistic ? 'opacity-60' : ''
        } ${isOwnMessage ? 'justify-end text-right' : ''}`}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => !isMenuOpen && setShowActions(false)}
      >
        {/* For right-aligned (own) messages, show actions on the left */}
        {isOwnMessage && (
          <div className={`flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity justify-end`}>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={onPin}
            >
              <Pin className={`h-4 w-4 ${isPinned ? 'text-yellow-500 fill-yellow-500' : ''}`} />
            </Button>
            <ReactionPicker onReact={handleReaction}>
              <Button 
                variant="ghost" 
                size="icon" 
                className={`h-8 w-8 ${hasReacted('❤️') ? 'text-primary' : ''}`}
              >
                <Heart className="h-4 w-4" />
              </Button>
            </ReactionPicker>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={() => onReply(message)}
            >
              <Reply className="h-4 w-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={onPin}>
                  {isPinned ? 'Unpin message' : 'Pin message'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsEditing(true)}>
                  Edit message
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="text-destructive" 
                  onClick={() => setIsDeleteAlertOpen(true)}
                >
                  Delete message
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
        {/* Avatar */}
        {!isOwnMessage && (
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            {message.userAvatar && message.userAvatar !== '/placeholder.svg' ? (
              <img src={message.userAvatar} alt={message.userName} className="w-full h-full rounded-full object-cover" />
            ) : (
              <span className="text-lg font-bold text-primary">
                {message.userName ? message.userName.charAt(0).toUpperCase() : '?'}
              </span>
            )}
          </div>
        )}
        {/* Message Content */}
        <div className="flex-1 min-w-0">
          <div className={`flex items-baseline gap-2 mb-1 ${isOwnMessage ? 'justify-end text-right' : ''}`}>
            {isOwnMessage ? (
              <>
                <span className="text-xs text-muted-foreground">{formatRelativeTime(message.timestamp)}</span>
                <span className="font-semibold text-sm">{message.userName || 'Unknown User'}</span>
              </>
            ) : (
              <>
                <span className="font-semibold text-sm">{message.userName || 'Unknown User'}</span>
                <span className="text-xs text-muted-foreground">{formatRelativeTime(message.timestamp)}</span>
              </>
            )}
            {message.isUrgent && (
              <Badge variant="destructive" className="text-xs">
                Urgent
              </Badge>
            )}
            {isPinned && (
              <Pin className="h-3 w-3 text-yellow-500" />
            )}
            {message.thread_parent_id && (
              <Reply className="h-3 w-3 text-blue-500" />
            )}
          </div>

          {!isEditing ? (
            message.content && message.content.trim() && (
              <div
                className={`text-sm leading-relaxed break-words px-4 py-2 rounded-2xl shadow-sm max-w-xl inline-block ${
                  isOwnMessage
                    ? 'bg-blue-100/80 text-right rounded-br-md'
                    : 'bg-white/80 text-left rounded-bl-md'
                }`}
              >
                {message.content}
              </div>
            )
          ) : (
            <div className="space-y-2">
              <Textarea 
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                rows={3}
                className="text-sm"
              />
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={handleSaveEdit}>Save</Button>
                <Button size="sm" variant="ghost" onClick={handleCancelEdit}>Cancel</Button>
              </div>
            </div>
          )}

          {/* File message handling */}
          {(message.file_url || message.fileUrl) && (
            <FileMessage
              fileUrl={message.file_url || message.fileUrl || ''}
              fileName={message.fileName || 'file'}
              fileType={message.file_type}
            />
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
          {message.thread_parent_id && onOpenThread && (
            <Button variant="ghost" size="sm" className="mt-2 text-xs text-blue-600 hover:text-blue-800" onClick={onOpenThread}>
              View thread →
            </Button>
          )}
        </div>
        {/* Avatar for own message (optional, can be omitted for classic chat look) */}
        {isOwnMessage && (
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            {message.userAvatar && message.userAvatar !== '/placeholder.svg' ? (
              <img src={message.userAvatar} alt={message.userName} className="w-full h-full rounded-full object-cover" />
            ) : (
              <span className="text-lg font-bold text-primary">
                {message.userName ? message.userName.charAt(0).toUpperCase() : '?'}
              </span>
            )}
          </div>
        )}
        {/* Message Actions for left-aligned messages */}
        {!isOwnMessage && (
          <div className={`flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity`}>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={onPin}
            >
              <Pin className={`h-4 w-4 ${isPinned ? 'text-yellow-500 fill-yellow-500' : ''}`} />
            </Button>
            <ReactionPicker onReact={handleReaction}>
              <Button 
                variant="ghost" 
                size="icon" 
                className={`h-8 w-8 ${hasReacted('❤️') ? 'text-primary' : ''}`}
              >
                <Heart className="h-4 w-4" />
              </Button>
            </ReactionPicker>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={() => onReply(message)}
            >
              <Reply className="h-4 w-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={onPin}>
                  {isPinned ? 'Unpin message' : 'Pin message'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this message?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the message.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => onDelete(message.id)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default MessageItem;
