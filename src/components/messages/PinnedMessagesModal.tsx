import React, { useRef, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import MessageItem from './MessageItem';
import type { Message } from '@/pages/Messages';

interface PinnedMessagesModalProps {
  pinnedMessages: Message[];
  onClose: () => void;
  onUnpinMessage: (msg: Message) => void;
}

const PinnedMessagesModal = ({ pinnedMessages, onClose, onUnpinMessage }: PinnedMessagesModalProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [pinnedMessages.length]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="font-semibold">Pinned Messages</div>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="h-5 w-5" /></Button>
        </div>
        {/* Pinned Messages List */}
        <ScrollArea className="flex-1 min-h-0">
          <div className="p-4 space-y-4">
            {pinnedMessages.map(msg => (
              <MessageItem key={msg.id} message={msg} onReply={() => {}} onPin={() => onUnpinMessage(msg)} isPinned={true} />
            ))}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

export default PinnedMessagesModal; 