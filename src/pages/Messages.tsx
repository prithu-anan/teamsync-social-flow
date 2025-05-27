
import { useState } from "react";
import { Search, Hash, Users, Plus, Settings } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import ChannelSidebar from "@/components/messages/ChannelSidebar";
import MessageThread from "@/components/messages/MessageThread";
import { Badge } from "@/components/ui/badge";

export interface Channel {
  id: string;
  name: string;
  type: 'dm' | 'channel';
  isOnline?: boolean;
  unreadCount?: number;
  lastMessage?: string;
  lastMessageTime?: string;
  participants?: string[];
  project?: string;
}

export interface Message {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  timestamp: string;
  channelId: string;
  threadId?: string;
  reactions?: { emoji: string; count: number; users: string[] }[];
  isUrgent?: boolean;
  responseRequired?: boolean;
  responseTime?: string;
}

const Messages = () => {
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("dms");

  // Mock data
  const channels: Channel[] = [
    {
      id: 'dm-1',
      name: 'Mia Alvarez',
      type: 'dm',
      isOnline: true,
      unreadCount: 1,
      lastMessage: "Morning! 👋 I just got feedback from marketing...",
      lastMessageTime: "42 mins ago"
    },
    {
      id: 'dm-2',
      name: 'Lena Olsson',
      type: 'dm',
      isOnline: false,
      unreadCount: 1,
      lastMessage: "Thanks @Lena Olsson! Sure thing, it's called...",
      lastMessageTime: "4:43pm"
    },
    {
      id: 'dm-3',
      name: 'Hardeep Kaur',
      type: 'dm',
      isOnline: true,
      unreadCount: 1,
      lastMessage: "Hola Lena 👋 here's the file you asked for",
      lastMessageTime: "4:46pm"
    },
    {
      id: 'channel-1',
      name: 'design-hive',
      type: 'channel',
      project: 'Design System',
      unreadCount: 5,
      lastMessage: "Can we discuss the new color palette?",
      lastMessageTime: "10 mins ago"
    },
    {
      id: 'channel-2',
      name: 'product-updates',
      type: 'channel',
      project: 'Product',
      unreadCount: 2,
      lastMessage: "New feature deployed successfully",
      lastMessageTime: "1 hour ago"
    },
    {
      id: 'channel-3',
      name: 'pets-images',
      type: 'channel',
      project: 'Fun',
      lastMessage: "Check out this cute puppy!",
      lastMessageTime: "yesterday"
    }
  ];

  const messages: Message[] = [
    {
      id: 'msg-1',
      userId: 'user-1',
      userName: 'Mia Alvarez',
      userAvatar: '/placeholder.svg',
      content: "Morning! 👋 I just got feedback from marketing. They'd like to see some pop of color in the call-to-action buttons. @Lena Olsson , would you like to take this up?",
      timestamp: "42 mins ago",
      channelId: selectedChannel?.id || 'channel-1'
    },
    {
      id: 'msg-2',
      userId: 'user-2',
      userName: 'Gabriella Kim',
      userAvatar: '/placeholder.svg',
      content: "Team! Reminder about our brainstorm at 3 PM. Looking forward to some fresh ideas!",
      timestamp: "32 mins ago",
      channelId: selectedChannel?.id || 'channel-1'
    },
    {
      id: 'msg-3',
      userId: 'user-3',
      userName: 'Isaac Goldberg',
      userAvatar: '/placeholder.svg',
      content: "Quick question: Who was behind the tablet designs? Need to discuss a small tweak.",
      timestamp: "10 mins ago",
      channelId: selectedChannel?.id || 'channel-1'
    },
    {
      id: 'msg-4',
      userId: 'user-4',
      userName: 'Dann Cox',
      userAvatar: '/placeholder.svg',
      content: 'Does anyone know how to recover the "Foundations" project in Figma? 😱',
      timestamp: "now",
      channelId: selectedChannel?.id || 'channel-1',
      isUrgent: true,
      responseRequired: true,
      responseTime: "2 hours, 13 mins"
    }
  ];

  const filteredChannels = channels.filter(channel => {
    const matchesSearch = channel.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === 'dms' ? channel.type === 'dm' : channel.type === 'channel';
    return matchesSearch && matchesTab;
  });

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-background">
      {/* Channel Sidebar - Fixed height with internal scrolling */}
      <div className="w-80 border-r border-border bg-slate-50 dark:bg-slate-900 flex flex-col">
        {/* Fixed header */}
        <div className="p-4 border-b border-border bg-background flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Messages</h2>
            <Button variant="ghost" size="icon">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="relative mb-4">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search conversations..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="dms">Direct Messages</TabsTrigger>
              <TabsTrigger value="channels">Channels</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        
        {/* Scrollable conversation list */}
        <ScrollArea className="flex-1">
          <ChannelSidebar 
            channels={filteredChannels} 
            selectedChannel={selectedChannel}
            onChannelSelect={setSelectedChannel}
            searchQuery=""
          />
        </ScrollArea>
      </div>

      {/* Main Content - Fixed height with internal scrolling */}
      <div className="flex-1 flex flex-col h-full">
        {selectedChannel ? (
          <>
            {/* Channel Header - Fixed */}
            <div className="h-16 border-b border-border bg-background flex items-center justify-between px-6 flex-shrink-0">
              <div className="flex items-center gap-3">
                {selectedChannel.type === 'channel' ? (
                  <Hash className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-medium">
                      {selectedChannel.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                )}
                <div>
                  <h3 className="font-semibold">{selectedChannel.name}</h3>
                  {selectedChannel.type === 'channel' && selectedChannel.project && (
                    <p className="text-sm text-muted-foreground">{selectedChannel.project} Project</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon">
                  <Users className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon">
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Messages - Scrollable content */}
            <div className="flex-1 min-h-0">
              <MessageThread messages={messages} channel={selectedChannel} />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-center">
            <div>
              <h3 className="text-lg font-semibold mb-2">Select a conversation</h3>
              <p className="text-muted-foreground">Choose a channel or direct message to start chatting</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;
