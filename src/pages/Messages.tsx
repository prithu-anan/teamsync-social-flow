import { useState, useRef } from "react";
import { Search, Hash, Users, Plus, Settings } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import ChannelSidebar from "@/components/messages/ChannelSidebar";
import MessageThread from "@/components/messages/MessageThread";
import { Badge } from "@/components/ui/badge";
import ThreadModal from "@/components/messages/ThreadModal";

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
  replyTo?: string;
  reactions?: { emoji: string; count: number; users: string[] }[];
  isUrgent?: boolean;
  responseRequired?: boolean;
  responseTime?: string;
  fileUrl?: string;
  fileName?: string;
  imageUrl?: string;
  updateType?: 'reaction' | 'new' | 'edit' | 'delete';
}

// Mock data
const channels: Channel[] = [
  { id: 'dm-1', name: 'Mia Alvarez', type: 'dm', isOnline: true, unreadCount: 1, lastMessage: "Morning! 👋 I just got feedback from marketing...", lastMessageTime: "42 mins ago" },
  { id: 'dm-2', name: 'Lena Olsson', type: 'dm', isOnline: false, unreadCount: 1, lastMessage: "Thanks @Lena Olsson! Sure thing, it's called...", lastMessageTime: "4:43pm" },
  { id: 'dm-3', name: 'Hardeep Kaur', type: 'dm', isOnline: true, unreadCount: 1, lastMessage: "Hola Lena 👋 here's the file you asked for", lastMessageTime: "4:46pm" },
  { id: 'dm-4', name: 'Alex Chen', type: 'dm', isOnline: false, unreadCount: 0, lastMessage: "See you at the meeting!", lastMessageTime: "2:10pm" },
  { id: 'dm-5', name: 'Priya Singh', type: 'dm', isOnline: true, unreadCount: 2, lastMessage: "Can you review my PR?", lastMessageTime: "1:55pm" },
  { id: 'dm-6', name: 'Tomás Silva', type: 'dm', isOnline: false, unreadCount: 0, lastMessage: "Lunch?", lastMessageTime: "12:30pm" },
  { id: 'dm-7', name: 'Sara Müller', type: 'dm', isOnline: true, unreadCount: 0, lastMessage: "Sent the docs!", lastMessageTime: "11:20am" },
  { id: 'dm-8', name: 'Yuki Tanaka', type: 'dm', isOnline: false, unreadCount: 0, lastMessage: "Arigato!", lastMessageTime: "10:10am" },
  { id: 'dm-9', name: 'Omar Farouk', type: 'dm', isOnline: true, unreadCount: 1, lastMessage: "Check this out!", lastMessageTime: "9:00am" },
  { id: 'dm-10', name: 'Emily Johnson', type: 'dm', isOnline: false, unreadCount: 0, lastMessage: "Good night!", lastMessageTime: "yesterday" },
  { id: 'channel-1', name: 'design-hive', type: 'channel', project: 'Design System', unreadCount: 5, lastMessage: "Can we discuss the new color palette?", lastMessageTime: "10 mins ago" },
  { id: 'channel-2', name: 'product-updates', type: 'channel', project: 'Product', unreadCount: 2, lastMessage: "New feature deployed successfully", lastMessageTime: "1 hour ago" },
  { id: 'channel-3', name: 'pets-images', type: 'channel', project: 'Fun', lastMessage: "Check out this cute puppy!", lastMessageTime: "yesterday" },
  { id: 'channel-4', name: 'frontend-devs', type: 'channel', project: 'Web', unreadCount: 3, lastMessage: "React 18 is out!", lastMessageTime: "5 mins ago" },
  { id: 'channel-5', name: 'backend-team', type: 'channel', project: 'API', unreadCount: 0, lastMessage: "DB migration scheduled", lastMessageTime: "yesterday" },
  { id: 'channel-6', name: 'random', type: 'channel', project: 'Fun', unreadCount: 1, lastMessage: "Friday memes!", lastMessageTime: "today" },
  { id: 'channel-7', name: 'marketing', type: 'channel', project: 'Growth', unreadCount: 0, lastMessage: "Campaign results are in", lastMessageTime: "yesterday" },
  { id: 'channel-8', name: 'support', type: 'channel', project: 'Customer', unreadCount: 2, lastMessage: "Ticket #1234 resolved", lastMessageTime: "2 hours ago" },
  { id: 'channel-9', name: 'qa', type: 'channel', project: 'Testing', unreadCount: 0, lastMessage: "All tests passed", lastMessageTime: "yesterday" },
  { id: 'channel-10', name: 'announcements', type: 'channel', project: 'General', unreadCount: 0, lastMessage: "Welcome to the team!", lastMessageTime: "2 days ago" },
  { id: 'channel-11', name: 'devops', type: 'channel', project: 'Infra', unreadCount: 1, lastMessage: "CI/CD updated", lastMessageTime: "3 hours ago" },
  { id: 'channel-12', name: 'memes', type: 'channel', project: 'Fun', unreadCount: 0, lastMessage: "Best meme of 2024", lastMessageTime: "today" },
  { id: 'channel-13', name: 'book-club', type: 'channel', project: 'Culture', unreadCount: 0, lastMessage: "Next book: Dune", lastMessageTime: "yesterday" },
  { id: 'channel-14', name: 'music', type: 'channel', project: 'Fun', unreadCount: 0, lastMessage: "Share your playlist!", lastMessageTime: "today" },
  { id: 'channel-15', name: 'ai-lab', type: 'channel', project: 'Research', unreadCount: 0, lastMessage: "GPT-4o is amazing!", lastMessageTime: "just now" },
];

const Messages = () => {
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("dms");
  const [openThread, setOpenThread] = useState<{message: Message, channel: Channel} | null>(null);
  const [pinnedMessages, setPinnedMessages] = useState<{[channelId: string]: Message[]}>({});
  const [allMessages, setAllMessages] = useState<Message[]>(() => {
    // Generate 30+ messages with various types for testing
    const baseMsgs = [
      {
        id: 'msg-1', userId: 'user-1', userName: 'Mia Alvarez', userAvatar: '/placeholder.svg', content: "Morning! 👋 I just got feedback from marketing. They'd like to see some pop of color in the call-to-action buttons. @Lena Olsson , would you like to take this up?", timestamp: "42 mins ago", channelId: 'channel-1', reactions: [{emoji: '👍', count: 2, users: ['user-2','user-3']}],
      },
      {
        id: 'msg-2', userId: 'user-2', userName: 'Gabriella Kim', userAvatar: '/placeholder.svg', content: "Team! Reminder about our brainstorm at 3 PM. Looking forward to some fresh ideas!", timestamp: "32 mins ago", channelId: 'channel-1', reactions: [{emoji: '❤️', count: 1, users: ['user-1']}],
      },
      {
        id: 'msg-3', userId: 'user-3', userName: 'Isaac Goldberg', userAvatar: '/placeholder.svg', content: "Quick question: Who was behind the tablet designs? Need to discuss a small tweak.", timestamp: "10 mins ago", channelId: 'channel-1',
      },
      {
        id: 'msg-4', userId: 'user-4', userName: 'Dann Cox', userAvatar: '/placeholder.svg', content: 'Does anyone know how to recover the "Foundations" project in Figma? 😱', timestamp: "now", channelId: 'channel-1', isUrgent: true, responseRequired: true, responseTime: "2 hours, 13 mins"
      },
      {
        id: 'msg-5', userId: 'user-2', userName: 'Gabriella Kim', userAvatar: '/placeholder.svg', content: "Here's the logo!", timestamp: "just now", channelId: 'channel-1', fileUrl: '/test.pdf', fileName: 'test.pdf', reactions: [{emoji: '🔥', count: 1, users: ['user-1']}],
      },
      {
        id: 'msg-6', userId: 'user-3', userName: 'Isaac Goldberg', userAvatar: '/placeholder.svg', content: "Check out this image!", timestamp: "just now", channelId: 'channel-1', imageUrl: '/test-image.jpg', reactions: [{emoji: '😂', count: 1, users: ['user-2']}],
      },
      // Add more messages for other channels and DMs
    ];
    // Add 30+ more messages for scroll testing
    let msgs: Message[] = [...baseMsgs];
    for (let i = 7; i < 40; i++) {
      msgs.push({
        id: `msg-${i}`,
        userId: `user-${(i%4)+1}`,
        userName: ['Mia Alvarez','Gabriella Kim','Isaac Goldberg','Dann Cox'][(i%4)],
        userAvatar: '/placeholder.svg',
        content: `Test message ${i}`,
        timestamp: `${i} mins ago`,
        channelId: i%2===0 ? 'channel-1' : 'channel-2',
        reactions: i%5===0 ? [{emoji: '👍', count: i%3+1, users: ['user-1','user-2']}] : [],
        threadId: i%7===0 ? `thread-${i}` : undefined,
      });
    }
    return msgs;
  });

  const [unreadCounts, setUnreadCounts] = useState<{[id: string]: number}>(() => {
    const counts: {[id: string]: number} = {};
    channels.forEach(c => { counts[c.id] = c.unreadCount || 0; });
    return counts;
  });

  // Compute sidebar channels with live preview and unread
  const sidebarChannels = channels.map(channel => {
    const channelMsgs = allMessages.filter(m => m.channelId === channel.id);
    const lastMsg = channelMsgs[channelMsgs.length - 1];
    return {
      ...channel,
      lastMessage: lastMsg ? lastMsg.content : channel.lastMessage,
      lastMessageUserName: lastMsg ? lastMsg.userName : undefined,
      lastMessageTime: lastMsg ? lastMsg.timestamp : channel.lastMessageTime,
      unreadCount: unreadCounts[channel.id] || 0,
    };
  });

  const filteredChannels = sidebarChannels.filter(channel => {
    const matchesSearch = channel.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === 'dms' ? channel.type === 'dm' : channel.type === 'channel';
    return matchesSearch && matchesTab;
  });

  // When a channel is selected, set its unreadCount to 0
  const handleChannelSelect = (channel: Channel) => {
    setSelectedChannel(channel);
    setUnreadCounts(counts => ({ ...counts, [channel.id]: 0 }));
  };

  const sendMessage = (msg: Partial<Message>) => {
    if (msg.updateType === 'reaction' && msg.id) {
      setAllMessages((prev) => prev.map(m => m.id === msg.id ? { ...m, reactions: msg.reactions } : m));
    } else {
      setAllMessages((prev) => [
        ...prev,
        {
          ...msg,
          id: `msg-${Date.now()}`,
          userId: 'user-1',
          userName: 'Mia Alvarez',
          userAvatar: '/placeholder.svg',
          timestamp: 'now',
          channelId: selectedChannel?.id || 'channel-1',
          content: msg.content ?? '',
        }
      ]);
    }
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] bg-background">
      {/* Channel Sidebar - Fixed height with internal scrolling */}
      <div className="w-80 border-r border-border bg-slate-50 dark:bg-slate-900 flex flex-col min-h-0">
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
        <ScrollArea className="flex-1 min-h-0 conversation-scroll-area">
          <ChannelSidebar 
            channels={filteredChannels} 
            selectedChannel={selectedChannel}
            onChannelSelect={handleChannelSelect}
            searchQuery={searchQuery}
          />
        </ScrollArea>
      </div>

      {/* Main Content - Fixed height with internal scrolling */}
      <div className="flex-1 flex flex-col min-h-0">
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
            <div className="flex-1 min-h-0 flex flex-col">
              <MessageThread 
                messages={allMessages.filter(m => m.channelId === selectedChannel.id)} 
                channel={selectedChannel} 
                openThread={openThread}
                setOpenThread={setOpenThread}
                pinnedMessages={pinnedMessages[selectedChannel.id] || []}
                onPinMessage={(msg) => setPinnedMessages(p => ({...p, [selectedChannel.id]: [...(p[selectedChannel.id]||[]), msg]}))}
                onUnpinMessage={(msg) => setPinnedMessages(p => ({...p, [selectedChannel.id]: (p[selectedChannel.id]||[]).filter(m => m.id !== msg.id)}))}
                sendMessage={sendMessage}
              />
              {/* Thread Modal */}
              {openThread && (
                <ThreadModal 
                  threadMessage={openThread.message}
                  channel={openThread.channel}
                  allMessages={allMessages}
                  sendMessage={sendMessage}
                  onClose={() => setOpenThread(null)}
                />
              )}
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
