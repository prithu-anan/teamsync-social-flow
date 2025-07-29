import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Image, Smile } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import MessageItem from './MessageItem';
import type { Message, Channel } from '@/types/messages';

interface ThreadModalProps {
  threadMessage: Message;
  channel: Channel;
  allMessages: Message[];
  sendMessage: (msg: Partial<Message>) => void;
  onClose: () => void;
}

// Helper function to recursively get all parent messages
const getParentMessages = (message: Message, allMessages: Message[]): Message[] => {
  const parents: Message[] = [];
  let currentMessage = message;
  
  while (currentMessage.thread_parent_id) {
    const parent = allMessages.find(m => m.id === currentMessage.thread_parent_id);
    if (parent) {
      parents.unshift(parent); // Add to beginning to maintain chronological order
      currentMessage = parent;
    } else {
      break; // Stop if parent not found
    }
  }
  
  return parents;
};

const ThreadModal = ({ threadMessage, channel, allMessages, sendMessage, onClose }: ThreadModalProps) => {
  const [reply, setReply] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replies = allMessages.filter(m => m.thread_parent_id === threadMessage.id);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Get all parent messages recursively
  const parentMessages = getParentMessages(threadMessage, allMessages);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [replies.length]);

  const handleSend = () => {
    if (reply.trim()) {
      sendMessage({ content: reply, thread_parent_id: threadMessage.id });
      setReply('');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      // Send files using the new file upload API
      sendMessage({ 
        content: files.length === 1 ? `📎 ${files[0].name}` : `📎 ${files.length} files`,
        files: files,
        thread_parent_id: threadMessage.id
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="font-semibold">Thread</div>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="h-5 w-5" /></Button>
        </div>
        
        {/* Parent messages chain */}
        {parentMessages.length > 0 && (
          <div className="p-4 border-b border-border bg-muted/20">
            <div className="text-xs text-muted-foreground mb-2">Thread history:</div>
            <div className="space-y-2">
              {parentMessages.map((parentMsg, index) => (
                <div key={parentMsg.id} className="border-l-2 border-blue-200 pl-3">
                  <MessageItem 
                    message={parentMsg} 
                    onReply={() => {}} 
                    onPin={() => {}} 
                    isPinned={false}
                    onEdit={() => {}}
                    onDelete={() => {}}
                    onOpenThread={undefined} // Hide "View Thread" button for parent messages
                  />
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Original message that started the thread */}
        <div className="p-4 border-b border-border bg-muted/30">
          <div className="text-xs text-muted-foreground mb-2">Original message:</div>
          <MessageItem 
            message={threadMessage} 
            onReply={() => {}} 
            onPin={() => {}} 
            isPinned={false}
            onEdit={() => {}}
            onDelete={() => {}}
            onOpenThread={undefined} // Hide "View Thread" button for the original message
          />
        </div>
        
        {/* Replies */}
        <ScrollArea className="flex-1 min-h-0">
          <div className="p-4 space-y-4">
            {replies.length > 0 && (
              <div className="text-xs text-muted-foreground mb-2">Replies:</div>
            )}
            {replies.map(msg => (
              <MessageItem 
                key={msg.id} 
                message={msg} 
                onReply={() => {}} 
                onPin={() => {}} 
                isPinned={false}
                onEdit={() => {}}
                onDelete={() => {}}
                onOpenThread={undefined} // Hide "View Thread" button for replies
              />
            ))}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>
        
        {/* Input */}
        <div className="border-t border-border p-3 flex items-end gap-2 bg-background">
          <Button variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()}>
            <Image className="h-4 w-4" />
            <input ref={fileInputRef} type="file" accept="image/*,.pdf,.doc,.docx,.txt,.xls,.xlsx,.csv,.ppt,.pptx" className="hidden" onChange={handleFileChange} multiple />
          </Button>
          <Button variant="ghost" size="icon"><Smile className="h-4 w-4" /></Button>
          <Textarea
            value={reply}
            onChange={e => setReply(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="Reply..."
            className="min-h-[40px] max-h-24 resize-none flex-1"
          />
          <Button onClick={handleSend} disabled={!reply.trim()} size="icon"><Send className="h-4 w-4" /></Button>
        </div>
      </div>
    </div>
  );
};

export default ThreadModal; 