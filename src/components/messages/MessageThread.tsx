import { useState, useRef, useEffect } from "react";
import { Send, Plus, Smile, Image, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import MessageItem from "./MessageItem";
import EmojiPicker from "./EmojiPicker";
import type { Message, Channel } from "@/pages/Messages";
import ThreadModal from './ThreadModal';
import PinnedMessagesModal from './PinnedMessagesModal';

interface MessageThreadProps {
  messages: Message[];
  channel: Channel;
  openThread: {message: Message, channel: Channel} | null;
  setOpenThread: (t: {message: Message, channel: Channel} | null) => void;
  pinnedMessages: Message[];
  onPinMessage: (msg: Message) => void;
  onUnpinMessage: (msg: Message) => void;
  sendMessage: (msg: Partial<Message>) => void;
}

const MessageThread = ({ messages, channel, openThread, setOpenThread, pinnedMessages, onPinMessage, onUnpinMessage, sendMessage }: MessageThreadProps) => {
  const [newMessage, setNewMessage] = useState("");
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showPinnedModal, setShowPinnedModal] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const latestPinned = pinnedMessages.length > 0 ? pinnedMessages[pinnedMessages.length - 1] : null;

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      sendMessage({
        content: newMessage,
        replyTo: replyingTo ? replyingTo.id : undefined,
      });
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          sendMessage({ 
            content: `📷 ${file.name}`,
            imageUrl: ev.target?.result as string 
          });
        };
        reader.readAsDataURL(file);
      } else {
        // Create a temporary URL for the file
        const fileUrl = URL.createObjectURL(file);
        sendMessage({ 
          content: `📎 ${file.name}`,
          fileUrl: fileUrl, 
          fileName: file.name 
        });
      }
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setNewMessage(prev => prev + emoji);
  };

  const handleReact = (messageId: string, emoji: string) => {
    const message = messages.find(m => m.id === messageId);
    if (!message) return;

    const updatedReactions = [...(message.reactions || [])];
    const existingReaction = updatedReactions.find(r => r.emoji === emoji);
    const userId = 'user-1'; // Replace with actual user ID

    if (existingReaction) {
      if (existingReaction.users.includes(userId)) {
        // Remove reaction
        existingReaction.count--;
        existingReaction.users = existingReaction.users.filter(id => id !== userId);
        if (existingReaction.count === 0) {
          updatedReactions.splice(updatedReactions.indexOf(existingReaction), 1);
        }
      } else {
        // Add reaction
        existingReaction.count++;
        existingReaction.users.push(userId);
      }
    } else {
      // Add new reaction
      updatedReactions.push({
        emoji,
        count: 1,
        users: [userId]
      });
    }

    // Update the message in the messages array
    const updatedMessages = messages.map(m => 
      m.id === messageId 
        ? { ...m, reactions: updatedReactions }
        : m
    );
    
    // Update the message in the parent component
    sendMessage({
      id: messageId,
      reactions: updatedReactions,
      updateType: 'reaction' // Add this to differentiate from new messages
    });
  };

  const channelMessages = messages.filter(msg => msg.channelId === channel.id);

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Pinned Banner */}
      {latestPinned && (
        <div className="bg-yellow-100 border-b border-yellow-300 text-yellow-900 px-4 py-2 cursor-pointer flex items-center gap-2 justify-between" onClick={() => setShowPinnedModal(true)}>
          <div className="truncate">
            <span className="font-semibold">📌 {latestPinned.userName}: </span>
            <span className="truncate">{latestPinned.content}</span>
          </div>
          <span className="underline text-xs ml-2">View all</span>
        </div>
      )}
      {/* Pinned Messages Modal */}
      {showPinnedModal && (
        <PinnedMessagesModal
          pinnedMessages={pinnedMessages}
          onClose={() => setShowPinnedModal(false)}
          onUnpinMessage={onUnpinMessage}
        />
      )}
      {/* Pinned Messages */}
      {pinnedMessages.length > 0 && (
        <div className="hidden" />
      )}
      {/* Messages Area - Scrollable */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-6 space-y-6">
          {channelMessages.map((message) => (
            <div key={message.id}>
              {/* If this message is a reply, show the replied-to message above it */}
              {message.replyTo && (
                <div className="mb-1 ml-4 pl-2 border-l-2 border-muted-foreground/30 text-xs text-muted-foreground">
                  {(() => {
                    const repliedMsg = messages.find(m => m.id === message.replyTo);
                    return repliedMsg ? <span><span className="font-semibold">{repliedMsg.userName}:</span> {repliedMsg.content}</span> : <span>Replied message not found</span>;
                  })()}
                </div>
              )}
              <MessageItem
                message={message}
                onReply={setReplyingTo}
                onPin={() => (pinnedMessages.some(m => m.id === message.id) ? onUnpinMessage(message) : onPinMessage(message))}
                isPinned={pinnedMessages.some(m => m.id === message.id)}
                onOpenThread={() => setOpenThread({message, channel})}
                onReact={handleReact}
              />
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
      {/* Message Input - Fixed at bottom */}
      <div className="p-4 border-t border-border bg-background">
        {replyingTo && (
          <div className="mb-3 p-3 bg-muted rounded-lg flex items-center justify-between">
            <div className="truncate">
              <span className="text-xs text-muted-foreground">Replying to <span className="font-medium">{replyingTo.userName}</span>: {replyingTo.content}</span>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setReplyingTo(null)}
            >
              ×
            </Button>
          </div>
        )}
        <div className="flex items-end gap-3">
          <div className="flex items-center gap-2 mb-2">
            <Button variant="ghost" size="icon" className="relative">
              <Image className="h-4 w-4" />
              <input 
                type="file" 
                accept="image/*" 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                onChange={handleFileChange} 
              />
            </Button>
            <Button variant="ghost" size="icon" className="relative">
              <Plus className="h-4 w-4" />
              <input 
                type="file" 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                onChange={handleFileChange} 
              />
            </Button>
          </div>
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
            <EmojiPicker onEmojiSelect={handleEmojiSelect}>
              <Button variant="ghost" size="icon">
                <Smile className="h-4 w-4" />
              </Button>
            </EmojiPicker>
            <Button 
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
              size="icon"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="mt-2 text-xs text-muted-foreground flex items-center justify-between">
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
      {/* Thread view modal or side panel */}
      {openThread && <ThreadModal threadMessage={openThread.message} channel={channel} allMessages={messages} sendMessage={sendMessage} onClose={() => setOpenThread(null)} />}
    </div>
  );
};

export default MessageThread;
