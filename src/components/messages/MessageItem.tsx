
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
import type { Message } from "@/pages/Messages";

interface MessageItemProps {
  message: Message;
  onReply: (message: Message) => void;
}

const MessageItem = ({ message, onReply }: MessageItemProps) => {
  const [showActions, setShowActions] = useState(false);

  const handleReaction = (emoji: string) => {
    // Handle reaction logic here
    console.log(`Reacting with ${emoji} to message ${message.id}`);
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
        </div>

        <div className="text-sm leading-relaxed">
          {message.content}
        </div>

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
          <div className="flex gap-1 mt-2">
            {message.reactions.map((reaction, index) => (
              <ReactionPicker key={index} onReact={handleReaction}>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 px-2 text-xs hover:bg-muted"
                >
                  {reaction.emoji} {reaction.count}
                </Button>
              </ReactionPicker>
            ))}
          </div>
        )}

        {/* Thread replies indicator */}
        {message.threadId && (
          <Button variant="ghost" size="sm" className="mt-2 text-xs text-blue-600 hover:text-blue-800">
            View thread →
          </Button>
        )}
      </div>

      {/* Message Actions */}
      {showActions && (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <ReactionPicker onReact={handleReaction}>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ThumbsUp className="h-3 w-3" />
            </Button>
          </ReactionPicker>
          <ReactionPicker onReact={handleReaction}>
            <Button variant="ghost" size="icon" className="h-8 w-8">
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
              <DropdownMenuItem>Start thread</DropdownMenuItem>
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
