import { useState, useRef, useEffect, useMemo } from "react";
import { Send, Plus, Smile, Image, Bell, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import MessageItem from "./MessageItem";
import EmojiPicker from "./EmojiPicker";
import type { Message, Channel } from "@/types/messages";
import ThreadModal from './ThreadModal';
import PinnedMessagesModal from './PinnedMessagesModal';
import { useAuth } from "@/contexts/AuthContext";
import { channel_auto_reply } from '@/utils/ai-api-helpers';

interface MessageThreadProps {
  messages: Message[];
  channel: Channel;
  openThread: {message: Message, channel: Channel} | null;
  setOpenThread: (t: {message: Message, channel: Channel} | null) => void;
  pinnedMessages: Message[];
  onPinMessage: (msg: Message) => void;
  onUnpinMessage: (msg: Message) => void;
  sendMessage: (msg: Partial<Message> & { updateType?: 'reaction' | 'new' | 'edit' | 'delete' }) => void;
}

// Helper for random badge colors
const BADGE_COLORS = [
  'bg-green-100 text-green-800',
  'bg-blue-100 text-blue-800',
  'bg-yellow-100 text-yellow-800',
  'bg-purple-100 text-purple-800',
  'bg-pink-100 text-pink-800',
  'bg-orange-100 text-orange-800',
  'bg-red-100 text-red-800',
  'bg-cyan-100 text-cyan-800',
  'bg-teal-100 text-teal-800',
  'bg-indigo-100 text-indigo-800',
  'bg-fuchsia-100 text-fuchsia-800',
  'bg-lime-100 text-lime-800',
  'bg-amber-100 text-amber-800',
  'bg-rose-100 text-rose-800',
  'bg-gray-200 text-gray-700',
];

const MessageThread = ({ messages, channel, openThread, setOpenThread, pinnedMessages, onPinMessage, onUnpinMessage, sendMessage }: MessageThreadProps) => {
  const { user } = useAuth();
  const [newMessage, setNewMessage] = useState("");
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showPinnedModal, setShowPinnedModal] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [showAiDropdown, setShowAiDropdown] = useState(false);
  const [loadingAi, setLoadingAi] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const latestPinned = pinnedMessages.length > 0 ? pinnedMessages[pinnedMessages.length - 1] : null;

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      console.log("MessageThread: Sending message with content:", newMessage);
      console.log("MessageThread: Message length:", newMessage.length);
      console.log("MessageThread: Message type:", typeof newMessage);
      
      sendMessage({
        content: newMessage,
        thread_parent_id: replyingTo ? replyingTo.id : undefined,
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
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      // Send files using the new file upload API
      sendMessage({ 
        content: files.length === 1 ? `📎 ${files[0].name}` : `📎 ${files.length} files`,
        files: files
      });
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
    const userId = user?.id || 'user-1'; // Use actual user ID

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

  const handleEditMessage = (messageId: string, newContent: string) => {
    sendMessage({
      id: messageId,
      content: newContent,
      updateType: 'edit'
    });
  };

  const handleDeleteMessage = (messageId: string) => {
    sendMessage({
      id: messageId,
      updateType: 'delete'
    });
  };

  const handleAiSuggest = async () => {
    setLoadingAi(true);
    setShowAiDropdown(true);
    setAiSuggestions([]);
    try {
      const res = await channel_auto_reply({ channel_id: channel.channel_id || channel.id, sender_id: user?.id });
      if (res && Array.isArray(res.suggestions)) {
        setAiSuggestions(res.suggestions);
      } else {
        setAiSuggestions([]);
      }
    } finally {
      setLoadingAi(false);
    }
  };

  const handleSelectSuggestion = (reply) => {
    setNewMessage(reply);
    setShowAiDropdown(false);
  };

  const badgeColorMap = useMemo(() => {
    const map = {};
    aiSuggestions.forEach((s, idx) => {
      map[s.tone || idx] = BADGE_COLORS[idx % BADGE_COLORS.length];
    });
    return map;
  }, [aiSuggestions]);

  // Filter messages based on channel type and IDs
  const channelMessages = messages.filter(msg => {
    if (channel.type === 'direct') {
      // For direct messages, check if the message is between the current user and the recipient
      return (msg.recipient_id === channel.recipient_id && msg.sender_id === user?.id) ||
             (msg.recipient_id === user?.id && msg.sender_id === channel.recipient_id);
    } else {
      // For group messages, check if the message belongs to this channel
      return msg.channel_id === channel.channel_id;
    }
  });

  return (
    <div className="flex flex-col h-full min-h-0 w-full overflow-hidden">
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
      <ScrollArea className="flex-1 min-h-0 overflow-hidden">
        <div className="p-6 space-y-6 pb-0">
          {channelMessages.map((message) => {
            const isOwnMessage = user?.id && message.sender_id && String(user.id) === String(message.sender_id);
            return (
              <div key={message.id} className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'}`}>
                {/* If this message is a reply, show the replied-to message above it as a block, aligned with the message */}
                {message.thread_parent_id && (() => {
                  const repliedMsg = messages.find(m => m.id === message.thread_parent_id);
                  return repliedMsg ? (
                    <div className={`mb-2 max-w-xl ${isOwnMessage ? 'mr-12' : 'ml-12'}`}>
                      <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/30 border border-border/50 hover:bg-muted/50 transition-colors cursor-pointer group" onClick={() => setOpenThread({message: repliedMsg, channel})}>
                        {/* Reply indicator line */}
                        <div className="w-0.5 h-full bg-primary/30 rounded-full flex-shrink-0"></div>
                        {/* Reply content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-semibold text-primary">{repliedMsg.userName}</span>
                            <span className="text-xs text-muted-foreground">•</span>
                            <span className="text-xs text-muted-foreground">Replying to</span>
                          </div>
                          <div className="text-sm text-muted-foreground truncate">
                            {repliedMsg.content}
                          </div>
                          {/* Show file/image preview if the replied message has one */}
                          {(repliedMsg.fileUrl || repliedMsg.file_url) && (
                            <div className="mt-1">
                              {(repliedMsg.fileType?.startsWith('image/') || repliedMsg.file_type?.startsWith('image/')) ? (
                                <img 
                                  src={repliedMsg.fileUrl || repliedMsg.file_url} 
                                  alt="Replied image" 
                                  className="w-8 h-8 rounded object-cover"
                                />
                              ) : (
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <span>📎</span>
                                  <span className="truncate">{repliedMsg.fileName || 'File'}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : null;
                })()}
                <MessageItem
                  message={message}
                  onReply={setReplyingTo}
                  onPin={() => (pinnedMessages.some(m => m.id === message.id) ? onUnpinMessage(message) : onPinMessage(message))}
                  isPinned={pinnedMessages.some(m => m.id === message.id)}
                  onOpenThread={() => setOpenThread({message, channel})}
                  onReact={handleReact}
                  onEdit={handleEditMessage}
                  onDelete={handleDeleteMessage}
                />
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
      {/* Message Input - Fixed at bottom */}
      <div className="p-4 border-t border-border bg-background/30 flex-shrink-0">
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
        <div className="flex items-end gap-3 relative">
          <div className="flex-1">
            {/* AI Suggestions Dropdown - now above the input */}
            {showAiDropdown && (
              <div className="absolute z-50 bottom-full mb-2 left-0 w-full bg-white dark:bg-slate-900 border border-border rounded-lg shadow-lg p-2 max-h-80 overflow-y-auto">
                {loadingAi ? (
                  <div className="text-center text-muted-foreground py-2">Loading suggestions...</div>
                ) : aiSuggestions.length > 0 ? (
                  aiSuggestions.map((s, idx) => (
                    <button
                      key={idx}
                      className="block w-full text-left px-4 py-2 hover:bg-blue-100 dark:hover:bg-slate-800 rounded transition-colors flex items-center gap-2"
                      onClick={() => handleSelectSuggestion(s.reply)}
                    >
                      <span className="font-medium flex-1">{s.reply}</span>
                      {/* Random color badge for tone/response type */}
                      <span
                        className={`inline-block text-xs font-semibold px-2 py-1 rounded-full ${badgeColorMap[s.tone || idx]}`}
                      >
                        {s.tone || 'default'}
                      </span>
                    </button>
                  ))
                ) : (
                  <div className="text-center text-muted-foreground py-2">No suggestions found.</div>
                )}
                <button className="block w-full text-center text-xs text-blue-600 mt-2 hover:underline" onClick={() => setShowAiDropdown(false)}>Close</button>
              </div>
            )}
            <Textarea
              value={newMessage}
              onChange={(e) => {
                console.log("Textarea onChange - new value:", e.target.value);
                console.log("Textarea onChange - value length:", e.target.value.length);
                setNewMessage(e.target.value);
              }}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="min-h-[60px] max-h-[120px] resize-none"
              rows={1}
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="file"
              id="file-upload"
              className="hidden"
              onChange={handleFileChange}
              accept="image/*,.pdf,.doc,.docx,.txt,.xls,.xlsx,.csv,.ppt,.pptx"
              multiple
            />
            <label htmlFor="file-upload">
              <Button variant="ghost" size="icon" className="h-10 w-10" asChild>
                <span>
                  <Plus className="h-4 w-4" />
                </span>
              </Button>
            </label>
            <EmojiPicker onEmojiSelect={handleEmojiSelect}>
              <Button variant="ghost" size="icon" className="h-10 w-10">
                <Smile className="h-4 w-4" />
              </Button>
            </EmojiPicker>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-10 w-10"
              onClick={handleAiSuggest}
              title="AI Suggestions"
            >
              <Sparkles className="h-5 w-5" />
            </Button>
            <Button 
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
              className="h-10 w-10 p-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      {/* Thread view modal or side panel */}
      {openThread && (
        <ThreadModal 
          threadMessage={openThread.message} 
          channel={channel} 
          allMessages={messages} 
          sendMessage={sendMessage} 
          onClose={() => setOpenThread(null)} 
        />
      )}
    </div>
  );
};

export default MessageThread;
