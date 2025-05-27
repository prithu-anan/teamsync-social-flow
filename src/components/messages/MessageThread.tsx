
import { useState, useRef, useEffect } from "react";
import { Send, Plus, Smile, Image, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import MessageItem from "./MessageItem";
import type { Message, Channel } from "@/pages/Messages";

interface MessageThreadProps {
  messages: Message[];
  channel: Channel;
}

const MessageThread = ({ messages, channel }: MessageThreadProps) => {
  const [newMessage, setNewMessage] = useState("");
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      // Here you would typically send the message to your backend
      console.log("Sending message:", newMessage);
      setNewMessage("");
      setReplyingTo(null);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const channelMessages = messages.filter(msg => msg.channelId === channel.id);

  return (
    <div className="flex flex-col h-full">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {channelMessages.map((message) => (
          <MessageItem
            key={message.id}
            message={message}
            onReply={setReplyingTo}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="border-t border-border bg-background p-4">
        {replyingTo && (
          <div className="mb-3 p-3 bg-muted rounded-lg">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Replying to <span className="font-medium">{replyingTo.userName}</span>
              </p>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setReplyingTo(null)}
              >
                ×
              </Button>
            </div>
            <p className="text-sm truncate">{replyingTo.content}</p>
          </div>
        )}
        
        <div className="flex items-end gap-3">
          <Button variant="ghost" size="icon" className="mb-2">
            <Plus className="h-4 w-4" />
          </Button>
          
          <div className="flex-1">
            <Textarea
              placeholder={`Message ${channel.type === 'channel' ? '#' + channel.name : channel.name}...`}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              className="min-h-[60px] max-h-32 resize-none"
            />
          </div>
          
          <div className="flex items-center gap-2 mb-2">
            <Button variant="ghost" size="icon">
              <Image className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon">
              <Smile className="h-4 w-4" />
            </Button>
            <Button 
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
              size="icon"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
          <p>
            <strong>Enter</strong> to send, <strong>Shift + Enter</strong> for new line
          </p>
          {channel.type === 'channel' && (
            <p className="flex items-center gap-1">
              <Bell className="h-3 w-3" />
              Notify channel
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageThread;
