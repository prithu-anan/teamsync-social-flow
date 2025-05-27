
import { Hash, Circle, MoreHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Channel } from "@/pages/Messages";

interface ChannelSidebarProps {
  channels: Channel[];
  selectedChannel: Channel | null;
  onChannelSelect: (channel: Channel) => void;
  searchQuery: string;
}

const ChannelSidebar = ({ channels, selectedChannel, onChannelSelect, searchQuery }: ChannelSidebarProps) => {
  const filteredChannels = channels.filter(channel =>
    channel.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const dmChannels = filteredChannels.filter(c => c.type === 'dm');
  const projectChannels = filteredChannels.filter(c => c.type === 'channel');

  const renderChannel = (channel: Channel) => (
    <div
      key={channel.id}
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors hover:bg-sidebar-accent",
        selectedChannel?.id === channel.id && "bg-sidebar-accent"
      )}
      onClick={() => onChannelSelect(channel)}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {channel.type === 'channel' ? (
          <Hash className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        ) : (
          <div className="relative flex-shrink-0">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-xs font-medium">
                {channel.name.split(' ').map(n => n[0]).join('')}
              </span>
            </div>
            {channel.isOnline && (
              <Circle className="absolute -bottom-0.5 -right-0.5 h-3 w-3 fill-green-500 text-green-500" />
            )}
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className="font-medium truncate">{channel.name}</span>
            {channel.unreadCount && channel.unreadCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {channel.unreadCount}
              </Badge>
            )}
          </div>
          {channel.lastMessage && (
            <p className="text-sm text-muted-foreground truncate">
              {channel.lastMessage}
            </p>
          )}
          {channel.lastMessageTime && (
            <p className="text-xs text-muted-foreground">
              {channel.lastMessageTime}
            </p>
          )}
        </div>
      </div>
      
      <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100">
        <MoreHorizontal className="h-3 w-3" />
      </Button>
    </div>
  );

  return (
    <div className="flex-1 overflow-y-auto p-4">
      {/* Direct Messages */}
      {dmChannels.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-muted-foreground mb-3 px-2">
            Direct Messages
          </h3>
          <div className="space-y-1">
            {dmChannels.map(renderChannel)}
          </div>
        </div>
      )}

      {/* Project Channels */}
      {projectChannels.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-3 px-2">
            Channels
          </h3>
          <div className="space-y-1">
            {projectChannels.map(renderChannel)}
          </div>
        </div>
      )}

      {filteredChannels.length === 0 && searchQuery && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No conversations found</p>
        </div>
      )}
    </div>
  );
};

export default ChannelSidebar;
