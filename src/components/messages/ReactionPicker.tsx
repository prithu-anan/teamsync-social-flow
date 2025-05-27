
import { useState } from "react";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Button } from "@/components/ui/button";

interface ReactionPickerProps {
  children: React.ReactNode;
  onReact: (emoji: string) => void;
}

const COMMON_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '😡', '👏', '🔥'];

const ReactionPicker = ({ children, onReact }: ReactionPickerProps) => {
  return (
    <HoverCard openDelay={200} closeDelay={100}>
      <HoverCardTrigger asChild>
        {children}
      </HoverCardTrigger>
      <HoverCardContent className="w-auto p-2" side="top">
        <div className="flex gap-1">
          {COMMON_REACTIONS.map((emoji) => (
            <Button
              key={emoji}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 hover:bg-muted"
              onClick={() => onReact(emoji)}
            >
              <span className="text-base">{emoji}</span>
            </Button>
          ))}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
};

export default ReactionPicker;
