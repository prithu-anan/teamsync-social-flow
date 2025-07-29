import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Hash, Users, Plus, Settings } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import ChannelSidebar from "@/components/messages/ChannelSidebar";
import MessageThread from "@/components/messages/MessageThread";
import NewConversationDialog from "@/components/messages/NewConversationDialog";
import { Badge } from "@/components/ui/badge";
import ThreadModal from "@/components/messages/ThreadModal";
import WaterBackground from '@/components/WaterBackground';
import { useAuth } from "@/contexts/AuthContext";
import { 
  getChannels, 
  getMessages, 
  sendMessage,
  getUsers,
  editMessage,
  deleteMessage,
  sendFileMessage
} from "@/utils/api-helpers";
import { toast } from "@/components/ui/use-toast";
import type { Channel, Message, User } from "@/types/messages";

const ChannelInfoSidebar = ({ channel, onMemberClick }: { channel: Channel; onMemberClick?: (user: User) => void }) => {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    const fetchUsers = async () => {
      const response = await getUsers();
      if (response && Array.isArray(response.data)) {
        setUsers(response.data);
      } else if (Array.isArray(response)) {
        setUsers(response);
      }
    };
    fetchUsers();
  }, []);

  if (!channel) return null;
  if (channel.type === 'direct') {
    return (
      <aside style={{ width: 300, minWidth: 250, minHeight: 'calc(100vh - 8rem)', maxHeight: 'calc(100vh - 8rem)' }}
        className="border-l border-border bg-white/70 dark:bg-slate-900/70 p-8 flex flex-col gap-6 shadow-2xl">
        <div>
          <h2 className="text-xl font-bold mb-4">Direct Message</h2>
          <div className="mb-2 text-lg font-semibold">{channel.name}</div>
        </div>
      </aside>
    );
  }
  // Map participant IDs to user names and avatars
  const memberObjs = (channel.participants || []).map(pid => {
    const u = users.find(u => String(u.id) === String(pid));
    return u ? { name: u.name, avatar: u.avatar } : { name: pid, avatar: undefined };
  });

  return (
    <aside style={{ width: 300, minWidth: 250, minHeight: 'calc(100vh - 8rem)', maxHeight: 'calc(100vh - 8rem)' }}
      className="border-l border-border bg-white/70 dark:bg-slate-900/70 p-8 flex flex-col gap-6 shadow-2xl">
      <div>
        <h2 className="text-xl font-bold mb-4">Channel Info</h2>
        <div className="mb-4 text-lg font-semibold">{channel.name}</div>
      </div>
      <div className="flex-1 min-h-0">
        <h3 className="font-semibold mb-3 text-base">Members</h3>
        <ScrollArea className="max-h-60 min-h-0 pr-2">
          <div className="flex flex-col gap-3">
            {memberObjs.length > 0 ? (
              memberObjs.map((member, idx) => {
                const user = users.find(u => u.name === member.name);
                return (
                  <div
                    key={idx}
                    className="flex items-center gap-3 p-2 rounded-lg transition-colors cursor-pointer hover:bg-blue-100/60 dark:hover:bg-slate-800/40 group"
                    onClick={() => onMemberClick?.(user)}
                  >
                    {/* Avatar with fallback */}
                    {member.avatar ? (
                      <img
                        src={member.avatar}
                        alt={member.name}
                        className="w-8 h-8 rounded-full object-cover border border-border bg-white"
                      />
                    ) : (
                      <span className="w-8 h-8 rounded-full flex items-center justify-center bg-primary/10 text-lg font-bold text-primary border border-border">
                        {member.name ? member.name.charAt(0).toUpperCase() : '?'}
                      </span>
                    )}
                    <span className="text-base font-semibold text-gray-800 dark:text-gray-100 group-hover:text-blue-700 dark:group-hover:text-blue-300 truncate">
                      {member.name}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="text-muted-foreground">No members listed</div>
            )}
          </div>
        </ScrollArea>
      </div>
    </aside>
  );
};

const Messages = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("dms");
  const [openThread, setOpenThread] = useState<{message: Message, channel: Channel} | null>(null);
  const [pinnedMessages, setPinnedMessages] = useState<{[channelId: string]: Message[]}>({});
  const [showNewConversationDialog, setShowNewConversationDialog] = useState(false);
  
  // API state
  const [allChannels, setAllChannels] = useState<Channel[]>([]);
  const [allMessages, setAllMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState<{[id: string]: number}>({});

  // Fetch all channels and filter by type
  const fetchChannels = async () => {
    setLoading(true);
    try {
      const response = await getChannels();
      
      if (response.error) {
        toast({
          title: "Error",
          description: response.error,
          variant: "destructive",
        });
        // Use fallback demo data
        setAllChannels(getFallbackChannels());
        return;
      }

      // Handle different response structures
      let channelsData = response;
      if (response && typeof response === 'object' && !Array.isArray(response)) {
        // If response is an object, check for common properties
        if (response.data && Array.isArray(response.data)) {
          channelsData = response.data;
        } else if (response.channels && Array.isArray(response.channels)) {
          channelsData = response.channels;
        } else if (response.items && Array.isArray(response.items)) {
          channelsData = response.items;
        } else {
          // If we can't find an array, use fallback data
          console.log("API response structure:", response);
          setAllChannels(getFallbackChannels());
          return;
        }
      }

      // Ensure we have an array
      if (!Array.isArray(channelsData)) {
        console.log("Channels data is not an array:", channelsData);
        setAllChannels(getFallbackChannels());
        return;
      }

      // Transform API response to match our interface
      const transformedChannels = channelsData.map((channel: any) => ({
        id: channel.id?.toString() || `channel-${Date.now()}`,
        name: channel.name || 'Unnamed Channel',
        type: channel.type || 'group', // 'direct' or 'group'
        recipient_id: channel.recipient_id?.toString() || null,
        channel_id: channel.channel_id?.toString() || channel.id?.toString() || null,
        project: channel.project?.name || channel.project || null,
        unreadCount: 0, // Will be calculated from messages
        lastMessage: "",
        lastMessageTime: "",
        participants: channel.members?.map((m: any) => m.id?.toString() || m.toString()) || [],
      }));

      // If no channels returned, use fallback data
      if (transformedChannels.length === 0) {
        setAllChannels(getFallbackChannels());
      } else {
        setAllChannels(transformedChannels);
      }
    } catch (error) {
      console.error("Error fetching channels:", error);
      toast({
        title: "Error",
        description: "Failed to fetch channels",
        variant: "destructive",
      });
      // Use fallback demo data
      setAllChannels(getFallbackChannels());
    } finally {
      setLoading(false);
    }
  };

  // Fetch users for direct messages
  const fetchUsers = async () => {
    try {
      const response = await getUsers();
      
      if (response.error) {
        console.error("Failed to fetch users:", response.error);
        return;
      }

      // Handle different response structures
      let usersData = response;
      if (response && typeof response === 'object' && !Array.isArray(response)) {
        // If response is an object, check for common properties
        if (response.data && Array.isArray(response.data)) {
          usersData = response.data;
        } else if (response.users && Array.isArray(response.users)) {
          usersData = response.users;
        } else if (response.items && Array.isArray(response.items)) {
          usersData = response.items;
        } else {
          // If we can't find an array, use empty array
          console.log("Users API response structure:", response);
          setUsers([]);
          return;
        }
      }

      // Ensure we have an array
      if (!Array.isArray(usersData)) {
        console.log("Users data is not an array:", usersData);
        setUsers([]);
        return;
      }

      setUsers(usersData);
    } catch (error) {
      console.error("Error fetching users:", error);
      setUsers([]);
    }
  };

  // Fetch messages for a channel
  const fetchMessages = async (channel: Channel) => {
    setMessagesLoading(true);
    try {
      let response;
      
      if (channel.type === 'direct') {
        // For direct messages, we need to handle this differently
        // Since the API doesn't have a direct endpoint for DMs, we'll use fallback data
        setAllMessages(getFallbackDirectMessages(channel));
        setMessagesLoading(false);
        return;
      } else if (channel.channel_id) {
        // For group messages, use the existing API
        response = await getMessages(channel.channel_id);
      } else {
        console.error("Invalid channel configuration");
        setMessagesLoading(false);
        return;
      }

      if (response.error) {
        toast({
          title: "Error",
          description: response.error,
          variant: "destructive",
        });
        // Use fallback demo messages
        setAllMessages(getFallbackMessages(channel));
        setMessagesLoading(false);
        return;
      }

      // Handle different response structures
      let messagesData = response;
      if (response && typeof response === 'object' && !Array.isArray(response)) {
        // If response is an object, check for common properties
        if (response.data && Array.isArray(response.data)) {
          messagesData = response.data;
        } else if (response.messages && Array.isArray(response.messages)) {
          messagesData = response.messages;
        } else if (response.items && Array.isArray(response.items)) {
          messagesData = response.items;
        } else {
          // If we can't find an array, use fallback data
          console.log("Messages API response structure:", response);
          setAllMessages(getFallbackMessages(channel));
          setMessagesLoading(false);
          return;
        }
      }

      // Ensure we have an array
      if (!Array.isArray(messagesData)) {
        console.log("Messages data is not an array:", messagesData);
        setAllMessages(getFallbackMessages(channel));
        setMessagesLoading(false);
        return;
      }

      // Transform API response to match our interface
      const transformedMessages = messagesData.map((msg: any) => ({
        id: msg.id?.toString() || `msg-${Date.now()}`,
        sender_id: msg.sender_id?.toString() || msg.sender_id || 'unknown',
        channel_id: msg.channel_id?.toString() || channel.channel_id,
        recipient_id: msg.recipient_id?.toString() || null,
        content: msg.content || '',
        timestamp: msg.timestamp || new Date().toISOString(),
        thread_parent_id: msg.thread_parent_id?.toString() || null,
        userName: users.find(u => u.id?.toString() === msg.sender_id?.toString())?.name || 
                users.find(u => u.id?.toString() === msg.sender_id)?.name || 
                'Unknown User',
        userAvatar: users.find(u => u.id?.toString() === msg.sender_id?.toString())?.avatar || 
                   users.find(u => u.id?.toString() === msg.sender_id)?.avatar || 
                   '/placeholder.svg',
        // File-related fields from API
        file_url: msg.file_url || null,
        file_type: msg.file_type || null,
        // Legacy fields for backward compatibility
        fileUrl: msg.file_url || msg.fileUrl || null,
        fileName: msg.file_name || msg.fileName || 'file',
        imageUrl: msg.file_type?.startsWith('image/') ? msg.file_url : null,
        reactions: [], // API doesn't provide reactions yet
      }));

      // If no messages returned, use fallback data
      if (transformedMessages.length === 0) {
        setAllMessages(getFallbackMessages(channel));
      } else {
        setAllMessages(transformedMessages);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
      toast({
        title: "Error",
        description: "Failed to fetch messages",
        variant: "destructive",
      });
      // Use fallback demo messages
      setAllMessages(getFallbackMessages(channel));
    } finally {
      setMessagesLoading(false);
    }
  };

  // Load initial data
  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    fetchChannels();
  }, []);

  // Filter channels for sidebar based on membership, activeTab, and search query
  const filteredChannels = allChannels.filter(c =>
    c.participants && c.participants.includes(user?.id?.toString()) &&
    (activeTab === 'dms' ? c.type === 'direct' : c.type === 'group') &&
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Compute sidebar channels with live preview and unread
  const sidebarChannels = filteredChannels.map(channel => {
    const channelMsgs = allMessages.filter(m => {
      if (channel.type === 'direct') {
        // For direct messages, check if the message is between the current user and the recipient
        return (m.recipient_id === channel.recipient_id && m.sender_id === user?.id) ||
               (m.recipient_id === user?.id && m.sender_id === channel.recipient_id);
      } else {
        // For group messages, check if the message belongs to this channel
        return m.channel_id === channel.channel_id;
      }
    });
    const lastMsg = channelMsgs[channelMsgs.length - 1];
    return {
      ...channel,
      lastMessage: lastMsg ? lastMsg.content : channel.lastMessage,
      lastMessageUserName: lastMsg ? lastMsg.userName : undefined,
      lastMessageTime: lastMsg ? lastMsg.timestamp : channel.lastMessageTime,
      unreadCount: unreadCounts[channel.id] || 0,
    };
  });

  // When a channel is selected, set its unreadCount to 0 and fetch messages
  const handleChannelSelect = async (channel: Channel) => {
    setSelectedChannel(channel);
    setUnreadCounts(counts => ({ ...counts, [channel.id]: 0 }));
    await fetchMessages(channel);
  };

  // Handle new conversation creation
  const handleConversationCreated = (conversation: Channel) => {
    // Add the new conversation to the channels list
    setAllChannels(prev => [...prev, conversation]);
    
    // Switch to the appropriate tab
    setActiveTab(conversation.type === 'direct' ? 'dms' : 'channels');
    
    // For newly created channels, just select it without fetching messages
    setSelectedChannel(conversation);
    setUnreadCounts(counts => ({ ...counts, [conversation.id]: 0 }));
    // Don't call fetchMessages for new channels since they won't have messages yet
  };

  const handleMemberClick = (user: User) => {
    if (user) {
      navigate(`/profile/${user.id}`);
    }
  };

  const sendMessageHandler = async (msg: Partial<Message>) => {
    if (msg.updateType === 'edit' && msg.id && msg.content) {
      const messageToEdit = allMessages.find(m => m.id === msg.id);
      if (!messageToEdit) {
        toast({ title: "Error", description: "Could not find the message to edit.", variant: "destructive" });
        return;
      }
      
      // Update payload to match new API: only channel_id, recipient_id, content
      const updatePayload = {
        channel_id: selectedChannel?.channel_id ? parseInt(selectedChannel.channel_id, 10) : null,
        recipient_id: 1, // Always set recipient_id to 1 for message edits
        content: msg.content,
      };

      try {
        const response = await editMessage(selectedChannel.channel_id, extractNumericId(msg.id), updatePayload);
        if (response && response.code === 200 && response.status === "OK") {
          // Optimistically update the UI with the new content
          const updatedMessageInState = { ...messageToEdit, content: msg.content };
          setAllMessages(prev => prev.map(m => 
            m.id === msg.id ? updatedMessageInState : m
          ));

        } else {
          toast({ title: "Error", description: response?.message || response?.error || "Failed to update message", variant: "destructive" });
        }
      } catch (error) {
        toast({ title: "Error", description: "An error occurred while editing.", variant: "destructive" });
      }
      return;
    }

    if (msg.updateType === 'delete' && msg.id) {
      try {
        const response = await deleteMessage(selectedChannel.channel_id, msg.id);
        if (response && !response.error) {
          setAllMessages(prev => prev.filter(m => m.id !== msg.id));

        } else {
          toast({ title: "Error", description: "Failed to delete message", variant: "destructive" });
        }
      } catch (error) {
        toast({ title: "Error", description: "An error occurred while deleting.", variant: "destructive" });
      }
      return;
    }

    if (!selectedChannel) return;

    // Debug logging
    console.log("sendMessageHandler called with:", msg);

    if (msg.updateType === 'reaction' && msg.id) {
      setAllMessages((prev) => prev.map(m => m.id === msg.id ? { ...m, reactions: msg.reactions } : m));
    } else {
      try {
        let response;
        
        if (selectedChannel.type === 'direct') {
          // For direct messages, we'll add to local state since API doesn't support DMs yet
          const newMessage: Message = {
            id: `msg-${Date.now()}`,
            sender_id: user?.id || '',
            channel_id: null,
            recipient_id: selectedChannel.recipient_id || null,
            content: msg.content || '',
            timestamp: new Date().toISOString(),
            userName: user?.name || 'You',
            userAvatar: user?.avatar || '/placeholder.svg',
          };
          setAllMessages(prev => [...prev, newMessage]);
          return;
        } else if (selectedChannel.channel_id) {
          // For group messages, use the existing API
          console.log("Selected channel:", selectedChannel);
          console.log("Channel ID being used:", selectedChannel.channel_id);
          console.log("Message content being sent:", msg.content);
          
          // Check if this is a file message
          if (msg.files && msg.files.length > 0) {
            // Handle file upload
            response = await sendFileMessage(selectedChannel.channel_id, {
              files: msg.files,
              content: msg.content || '',
              recipient_id: 1,
              thread_parent_id: extractNumericId(msg.thread_parent_id)
            });
          } else {
            // Handle text message
            // Ensure we have valid content
            if (!msg.content || msg.content.trim() === '') {
              console.error("Empty message content");
              return;
            }
            
            response = await sendMessage(selectedChannel.channel_id, { 
              content: msg.content.trim(),
              recipient_id: 1,
              thread_parent_id: extractNumericId(msg.thread_parent_id)
            });
          }
        } else {
          console.error("Invalid channel configuration for sending message");
          return;
        }

        if (!response) {
          toast({
            title: "Error",
            description: "No response from server.",
            variant: "destructive",
          });
          return;
        }
        
        // Debug: Log the exact response structure
        console.log("Full API response:", response);
        console.log("Response type:", typeof response);
        console.log("Response keys:", Object.keys(response));
        console.log("Response.code:", response.code);
        console.log("Response.status:", response.status);
        
        // Check if it's a success response (201 status)
        if (response.code === 201 || response.status === "CREATED") {
          // Success! The message was created
          console.log("Message sent successfully:", response);
          

          
          // For file uploads, fetch the updated messages to get the actual file data
          if (msg.files && msg.files.length > 0) {
            console.log("File uploaded successfully, fetching updated messages...");
            setMessagesLoading(true);
            await fetchMessages(selectedChannel);
            setMessagesLoading(false);
          } else {
            // For text messages, add optimistically
            const newMessage: Message = {
              id: `msg-${Date.now()}`, // Temporary ID until we get the real one
              sender_id: user?.id || '',
              channel_id: selectedChannel.channel_id || null,
              recipient_id: selectedChannel.recipient_id || null,
              content: msg.content || '',
              timestamp: new Date().toISOString(),
              userName: user?.name || 'You',
              userAvatar: user?.avatar || '/placeholder.svg',
              isOptimistic: true, // Mark as optimistic for styling
            };

            setAllMessages(prev => [...prev, newMessage]);
            
            // Remove the optimistic flag after a short delay to show the message is confirmed
            setTimeout(() => {
              setAllMessages(prev => 
                prev.map(m => 
                  m.id === newMessage.id 
                    ? { ...m, isOptimistic: false }
                    : m
                )
              );
            }, 1000); // Remove optimistic flag after 1 second
          }
          
          return;
        }
        
        if (response.error) {
          toast({
            title: "Error",
            description: response.error,
            variant: "destructive",
          });
          return;
        }
        
        // If we get here but no success response, show a generic error
        if (!response.code || (response.code !== 201 && response.status !== "CREATED")) {
          toast({
            title: "Error",
            description: response.message || "Failed to send message",
            variant: "destructive",
          });
          return;
        }
      } catch (error) {
        console.error("Error in sendMessageHandler:", error);
        toast({
          title: "Error",
          description: "Failed to send message",
          variant: "destructive",
        });
      }
    }
  };

  // Helper function to extract numeric ID from message ID (handles both "msg-123" and "123" formats)
  const extractNumericId = (id: string | null): number | null => {
    if (!id) return null;
    // If the ID starts with "msg-", extract the numeric part
    let numericId = id;
    if (id.startsWith('msg-')) {
      numericId = id.substring(4); // Remove "msg-" prefix
    }
    // Convert to integer
    const parsed = parseInt(numericId, 10);
    return isNaN(parsed) ? null : parsed;
  };

  // Fallback demo data for when API is not available
  const getFallbackChannels = (): Channel[] => {
    return [
      // Direct messages
      { id: 'dm-1', name: 'John Doe', type: 'direct', recipient_id: '1', channel_id: null, isOnline: true, unreadCount: 1, lastMessage: "Hey, how's it going?", lastMessageTime: "2 mins ago" },
      { id: 'dm-2', name: 'Jane Smith', type: 'direct', recipient_id: '2', channel_id: null, isOnline: false, unreadCount: 0, lastMessage: "Thanks for the help!", lastMessageTime: "1 hour ago" },
      { id: 'dm-3', name: 'Mike Johnson', type: 'direct', recipient_id: '3', channel_id: null, isOnline: true, unreadCount: 2, lastMessage: "Can you review this?", lastMessageTime: "3 hours ago" },
      // Group channels
      { id: 'channel-1', name: 'general', type: 'group', recipient_id: null, channel_id: '1', project: 'Team', unreadCount: 5, lastMessage: "Welcome everyone!", lastMessageTime: "10 mins ago" },
      { id: 'channel-2', name: 'random', type: 'group', recipient_id: null, channel_id: '2', project: 'Fun', unreadCount: 0, lastMessage: "Check out this meme!", lastMessageTime: "1 hour ago" },
      { id: 'channel-3', name: 'announcements', type: 'group', recipient_id: null, channel_id: '3', project: 'Updates', unreadCount: 1, lastMessage: "New feature released", lastMessageTime: "2 hours ago" },
    ];
  };

  // Fallback demo messages for when API is not available
  const getFallbackMessages = (channel: Channel): Message[] => {
    const baseMessages = [
      {
        id: 'msg-1',
        sender_id: '1',
        channel_id: channel.type === 'group' ? channel.channel_id : null,
        recipient_id: channel.type === 'direct' ? user?.id || '1' : null,
        content: "Hello everyone! 👋",
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
        thread_parent_id: null,
        userName: 'John Doe',
        userAvatar: '/placeholder.svg',
        reactions: [],
      },
      {
        id: 'msg-2',
        sender_id: user?.id || '2',
        channel_id: channel.type === 'group' ? channel.channel_id : null,
        recipient_id: channel.type === 'direct' ? channel.recipient_id : null,
        content: "Hi there! 👋",
        timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 minutes ago
        thread_parent_id: null,
        userName: user?.name || 'You',
        userAvatar: user?.avatar || '/placeholder.svg',
        reactions: [],
      },
    ];

    if (channel.type === 'group') {
      baseMessages.push({
        id: 'msg-3',
        sender_id: '3',
        channel_id: channel.channel_id,
        recipient_id: null,
        content: "This is a demo message to show how the chat works!",
        timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 minutes ago
        thread_parent_id: null,
        userName: 'Jane Smith',
        userAvatar: '/placeholder.svg',
        reactions: [],
      });
    }

    return baseMessages;
  };

  // Fallback demo direct messages
  const getFallbackDirectMessages = (channel: Channel): Message[] => {
    return [
      {
        id: 'msg-1',
        sender_id: channel.recipient_id || '1',
        channel_id: null,
        recipient_id: user?.id || '1',
        content: `Hey! How are you doing?`,
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        thread_parent_id: null,
        userName: channel.name,
        userAvatar: '/placeholder.svg',
        reactions: [],
      },
      {
        id: 'msg-2',
        sender_id: user?.id || '2',
        channel_id: null,
        recipient_id: channel.recipient_id || '1',
        content: "I'm doing great, thanks for asking!",
        timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
        thread_parent_id: null,
        userName: user?.name || 'You',
        userAvatar: user?.avatar || '/placeholder.svg',
        reactions: [],
      },
    ];
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ height: 'calc(100vh - 8rem)' }}>
      {/* Sidebar and main chat area */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Channel Sidebar - Fixed height with internal scrolling */}
        <div className="w-80 border-r border-border bg-white/50 dark:bg-slate-900 flex flex-col min-h-0" style={{ minHeight: 'calc(100vh - 8rem)', maxHeight: 'calc(100vh - 8rem)' }}>
          {/* Fixed header */}
          <div className="p-4 border-b border-border bg-background/50 flex-shrink-0">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Messages</h2>
              <Button variant="ghost" size="icon" onClick={() => setShowNewConversationDialog(true)}>
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
        <div className="flex-1 flex flex-col min-h-0 bg-white/50" style={{ minHeight: 'calc(100vh - 8rem)', maxHeight: 'calc(100vh - 8rem)' }}>
          {selectedChannel ? (
            <>
              {/* Channel Header - Fixed */}
              <div className="h-16 border-b border-border bg-background/80 flex items-center justify-between px-6 flex-shrink-0">
                <div className="flex items-center gap-3">
                  {selectedChannel.type === 'group' ? (
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
                    {selectedChannel.type === 'group' && selectedChannel.project && (
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
                {messagesLoading ? (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center text-muted-foreground">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                      Loading messages...
                    </div>
                  </div>
                ) : (
                  <MessageThread 
                    messages={allMessages.filter(m => {
                      if (selectedChannel.type === 'direct') {
                        return (m.recipient_id === selectedChannel.recipient_id && m.sender_id === user?.id) ||
                               (m.recipient_id === user?.id && m.sender_id === selectedChannel.recipient_id);
                      } else {
                        return m.channel_id === selectedChannel.channel_id;
                      }
                    })} 
                    channel={selectedChannel} 
                    openThread={openThread}
                    setOpenThread={setOpenThread}
                    pinnedMessages={pinnedMessages[selectedChannel.id] || []}
                    onPinMessage={(msg) => setPinnedMessages(p => ({...p, [selectedChannel.id]: [...(p[selectedChannel.id]||[]), msg]}))}
                    onUnpinMessage={(msg) => setPinnedMessages(p => ({...p, [selectedChannel.id]: (p[selectedChannel.id]||[]).filter(m => m.id !== msg.id)}))}
                    sendMessage={sendMessageHandler}
                  />
                )}
                {/* Thread Modal */}
                {openThread && (
                  <ThreadModal 
                    threadMessage={openThread.message}
                    channel={openThread.channel}
                    allMessages={allMessages}
                    sendMessage={sendMessageHandler}
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
      {/* Right sidebar for channel info */}
      <ChannelInfoSidebar channel={selectedChannel} onMemberClick={handleMemberClick} />
      
      {/* New Conversation Dialog */}
      <NewConversationDialog
        open={showNewConversationDialog}
        onOpenChange={setShowNewConversationDialog}
        onConversationCreated={handleConversationCreated}
      />
    </div>
  );
};

export default Messages;
