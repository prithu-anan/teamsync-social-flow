import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Image, Smile } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import MessageItem from './MessageItem';
import type { Message, Channel } from '@/pages/Messages';

interface ThreadModalProps {
  threadMessage: Message;
  channel: Channel;
  allMessages: Message[];
  sendMessage: (msg: Partial<Message>) => void;
  onClose: () => void;
}

const ThreadModal = ({ threadMessage, channel, allMessages, sendMessage, onClose }: ThreadModalProps) => {
  const [reply, setReply] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replies = allMessages.filter(m => m.threadId === threadMessage.threadId);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [replies.length]);

  const handleSend = () => {
    if (reply.trim()) {
      sendMessage({ content: reply, threadId: threadMessage.threadId, channelId: channel.id });
      setReply('');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          sendMessage({ imageUrl: ev.target?.result as string, threadId: threadMessage.threadId, channelId: channel.id });
        };
        reader.readAsDataURL(file);
      } else {
        sendMessage({ fileUrl: URL.createObjectURL(file), fileName: file.name, threadId: threadMessage.threadId, channelId: channel.id });
      }
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
        {/* Root message */}
        <div className="p-4 border-b border-border bg-muted">
          <MessageItem message={threadMessage} onReply={() => {}} onPin={() => {}} isPinned={false} />
        </div>
        {/* Replies */}
        <ScrollArea className="flex-1 min-h-0">
          <div className="p-4 space-y-4">
            {replies.map(msg => (
              <MessageItem key={msg.id} message={msg} onReply={() => {}} onPin={() => {}} isPinned={false} />
            ))}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>
        {/* Input */}
        <div className="border-t border-border p-3 flex items-end gap-2 bg-background">
          <Button variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()}>
            <Image className="h-4 w-4" />
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
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