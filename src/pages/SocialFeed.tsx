import { useState, useEffect, useRef } from "react";
import {
  Heart,
  MessageCircle,
  Share2,
  ThumbsUp,
  Calendar,
  Cake,
  Award,
  Users,
  Plus,
  Loader2,
  Vote,
  X,
  Image,
  Star,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/use-toast";
import * as feedApi from "@/utils/api/feed-api";
import * as eventsApi from "@/utils/api/events-api";
import * as usersApi from "@/utils/api/users-api";
import * as pollVotesApi from "@/utils/api/poll-votes-api";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import MediaGallery from "@/components/MediaGallery";

// Interface definitions
interface PostComment {
  id: string;
  content: string;
  author: {
    name: string;
    avatar: string;
  };
  timestamp: string;
  reactions?: { id: string; userId: number; reactionType: string; createdAt: string }[];
}

interface PollOption {
  option: string;
  votes: number;
  percentage: number;
  voters: User[];
}

interface Post {
  id: string;
  content: string;
  author: {
    name: string;
    avatar: string;
  };
  author_id: number; // Add author_id to track post ownership
  timestamp: string;
  likes: number;
  comments: PostComment[];
  image?: string;
  media_urls?: string[];
  type: "text" | "photo" | "event" | "birthday" | "achievement" | "poll" | "highlight";
  eventDate?: string;
  eventTitle?: string;
  reactions: { id: string; userId: number; reactionType: string; createdAt: string }[];
  // Poll-specific properties
  pollOptions?: string[];
  pollVotes?: PollOption[];
  userVote?: string | null;
  totalVotes?: number;
}

interface User {
  id: number;
  name: string;
  email: string;
  avatar?: string;
}

interface PollVote {
  id: number;
  poll_id: number;
  user_id: number;
  selected_option: string;
}

const REACTION_EMOJIS = {
  like: '👍',
  love: '❤️',
  haha: '😆',
  wow: '😮',
  sad: '😢',
  angry: '😡',
};
const REACTION_TYPES = ['like', 'love', 'haha', 'wow', 'sad', 'angry'];
const REACTION_NAMES: Record<string, string> = {
  like: 'Like',
  love: 'Love',
  haha: 'Haha',
  wow: 'Wow',
  sad: 'Sad',
  angry: 'Angry',
};

const SocialFeed = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPostContent, setNewPostContent] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [filePreviewUrls, setFilePreviewUrls] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const appreciationFileInputRef = useRef<HTMLInputElement>(null);
  const [newComments, setNewComments] = useState<Record<string, string>>({});
  const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [creatingPost, setCreatingPost] = useState(false);
  const [activeTab, setActiveTab] = useState("posts");
  const [userCache, setUserCache] = useState<Record<number, User>>({});
  const [userReactions, setUserReactions] = useState<Record<string, string | null>>({});
  const [reactionDialogOpen, setReactionDialogOpen] = useState(false);
  const [reactionDialogPost, setReactionDialogPost] = useState<Post | null>(null);
  const [reactorUsers, setReactorUsers] = useState<Record<number, User>>({});
  const [reactorLoading, setReactorLoading] = useState(false);
  const [reactionPopoverOpen, setReactionPopoverOpen] = useState<Record<string, boolean>>({});
  const [userCommentReactions, setUserCommentReactions] = useState<Record<string, string | null>>({});
  const [commentReactionPopoverOpen, setCommentReactionPopoverOpen] = useState<Record<string, boolean>>({});
  const [commentsVisible, setCommentsVisible] = useState<Record<string, boolean>>({});
  // Poll-related state
  const [pollVotes, setPollVotes] = useState<PollVote[]>([]);
  const [userVotes, setUserVotes] = useState<Record<string, string | null>>({});
  const [pollData, setPollData] = useState<Record<string, { pollVotes: PollOption[]; userVote: string | null; totalVotes: number }>>({});
  const [voterModalOpen, setVoterModalOpen] = useState(false);
  const [selectedPollOption, setSelectedPollOption] = useState<{ postId: string; option: string; voters: User[] } | null>(null);
  
  // Create poll dialog state
  const [createPollDialogOpen, setCreatePollDialogOpen] = useState(false);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState<string[]>(["", ""]);
  const [creatingPoll, setCreatingPoll] = useState(false);
  
  // Event post creation state
  const [eventTitle, setEventTitle] = useState("");
  const [eventDate, setEventDate] = useState("");

  // Edit/Delete post state
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editPostContent, setEditPostContent] = useState("");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Photo modal state
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number>(0);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPreviousPage, setHasPreviousPage] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);

  // Load posts on component mount and when active tab changes
  useEffect(() => {
    setCurrentPage(1);
    setPosts([]);
    loadPosts(1, false);
  }, [activeTab]);

  // Load poll votes when posts change (but only if we haven't loaded them yet)
  const [pollVotesLoaded, setPollVotesLoaded] = useState(false);
  
  useEffect(() => {
    if (posts.some(post => post.type === "poll") && !pollVotesLoaded) {
      loadPollVotes();
      setPollVotesLoaded(true);
    }
  }, [posts, pollVotesLoaded]);

  // Load poll votes data
  const loadPollVotes = async () => {
    try {
      const response = await pollVotesApi.getPollVotes();
      if (response.error) {
        console.error("Failed to load poll votes:", response.error);
        return;
      }

      const votes = response.data || [];
      setPollVotes(votes);

      // Calculate poll statistics and user votes
      const newUserVotes: Record<string, string | null> = {};
      const newPollData: Record<string, { pollVotes: PollOption[]; userVote: string | null; totalVotes: number }> = {};
      
      posts.forEach(post => {
        if (post.type !== "poll" || !post.pollOptions) return;

        const postVotes = votes.filter(vote => vote.poll_id === Number(post.id));
        const totalVotes = postVotes.length;
        
        // Calculate user's vote for this poll
        const userVote = postVotes.find(vote => vote.user_id === user?.id);
        newUserVotes[post.id] = userVote?.selected_option || null;

        // Calculate poll options with statistics
        const pollOptions: PollOption[] = post.pollOptions.map(option => {
          const optionVotes = postVotes.filter(vote => vote.selected_option === option);
          const percentage = totalVotes > 0 ? (optionVotes.length / totalVotes) * 100 : 0;
          
          // Get voter details for avatars (up to 3)
          const voters = optionVotes.slice(0, 3).map(vote => {
            const voter = userCache[vote.user_id];
            return voter || { id: vote.user_id, name: "Unknown", email: "", avatar: "" };
          });

          return {
            option,
            votes: optionVotes.length,
            percentage,
            voters
          };
        });

        newPollData[post.id] = {
          pollVotes: pollOptions,
          userVote: userVote?.selected_option || null,
          totalVotes
        };
      });

      setPollData(newPollData);
      setUserVotes(newUserVotes);

      // Fetch missing voter details for all polls
      const allMissingVoterIds = new Set<number>();
      Object.values(newPollData).forEach(pollData => {
        pollData.pollVotes.forEach(pollOption => {
          pollOption.voters.forEach(voter => {
            if (voter.name === "Unknown") {
              allMissingVoterIds.add(voter.id);
            }
          });
        });
      });

      if (allMissingVoterIds.size > 0) {
        const voterPromises = Array.from(allMissingVoterIds).map(userId => fetchUserById(userId));
        const voterResults = await Promise.all(voterPromises);
        
        // Update poll data with fetched voter details
        const updatedPollData = { ...newPollData };
        Object.keys(updatedPollData).forEach(postId => {
          updatedPollData[postId] = {
            ...updatedPollData[postId],
            pollVotes: updatedPollData[postId].pollVotes.map(pollOption => ({
              ...pollOption,
              voters: pollOption.voters.map(voter => {
                if (voter.name === "Unknown") {
                  const fetchedVoter = voterResults.find(v => v?.id === voter.id);
                  return fetchedVoter || voter;
                }
                return voter;
              })
            }))
          };
        });
        
        setPollData(updatedPollData);
      }
    } catch (error) {
      console.error("Error loading poll votes:", error);
    }
  };

  // Handle opening voter modal
  const handleShowVoters = (postId: string, option: string, voters: User[]) => {
    setSelectedPollOption({ postId, option, voters });
    setVoterModalOpen(true);
  };

  // Render poll option voters section
  const renderPollOptionVoters = (postId: string, pollOption: PollOption) => (
    <div className="flex items-center gap-2">
      {/* Voter avatars */}
      <div className="flex -space-x-2">
        {pollOption.voters.map((voter, voterIndex) => (
          <Avatar key={voterIndex} className="h-6 w-6 border-2 border-white">
            <AvatarImage src={voter.avatar} alt={voter.name} />
            <AvatarFallback className="text-xs">
              {voter.name?.charAt(0)?.toUpperCase() || '?'}
            </AvatarFallback>
          </Avatar>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">
          {pollOption.votes} vote{pollOption.votes !== 1 ? 's' : ''}
        </span>
        {pollOption.votes > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            onClick={(e) => {
              e.stopPropagation();
              handleShowVoters(postId, pollOption.option, pollOption.voters);
            }}
          >
            View all
          </Button>
        )}
      </div>
    </div>
  );

  // Handle poll vote
  // Add poll option
  const addPollOption = () => {
    setPollOptions([...pollOptions, ""]);
  };

  // Remove poll option
  const removePollOption = (index: number) => {
    if (pollOptions.length > 2) {
      setPollOptions(pollOptions.filter((_, i) => i !== index));
    }
  };

  // Update poll option
  const updatePollOption = (index: number, value: string) => {
    const newOptions = [...pollOptions];
    newOptions[index] = value;
    setPollOptions(newOptions);
  };

  // Handle create poll
  const handleCreatePoll = async () => {
    if (!pollQuestion.trim() || pollOptions.some(option => !option.trim())) {
      toast({
        title: "Error",
        description: "Please fill in the poll question and all options",
        variant: "destructive",
      });
      return;
    }

    setCreatingPoll(true);
    try {
      const response = await feedApi.createFeedPost({
        type: "poll",
        content: pollQuestion,
        poll_options: pollOptions.filter(option => option.trim()),
      });

      if (response.error) {
        toast({
          title: "Error",
          description: response.error,
          variant: "destructive",
        });
        return;
      }

      // Reset form and close dialog
      setPollQuestion("");
      setPollOptions(["", ""]);
      setCreatePollDialogOpen(false);
      
      // Reload posts to get the new poll
      await loadPosts();
      
      toast({
        title: "Success",
        description: "Poll created successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create poll",
        variant: "destructive",
      });
    } finally {
      setCreatingPoll(false);
    }
  };

  const handlePollVote = async (postId: string, selectedOption: string) => {
    if (!user) return;

    try {
      const currentVote = userVotes[postId];
      
      if (currentVote === selectedOption) {
        // Remove vote if clicking the same option
        const voteToDelete = pollVotes.find(vote => 
          vote.poll_id === Number(postId) && 
          vote.user_id === Number(user.id) && 
          vote.selected_option === selectedOption
        );
        
        if (voteToDelete) {
          const response = await pollVotesApi.deletePollVote(voteToDelete.id);
          if (response.error) {
            toast({
              title: "Error",
              description: response.error,
              variant: "destructive",
            });
            return;
          }
        }
      } else {
        // Add or update vote
        const voteData = {
          poll_id: Number(postId),
          user_id: user.id,
          selected_option: selectedOption
        };

        let response;
        if (currentVote) {
          // Update existing vote
          const existingVote = pollVotes.find(vote => 
            vote.poll_id === Number(postId) && vote.user_id === Number(user.id)
          );
          if (existingVote) {
            response = await pollVotesApi.updatePollVote(existingVote.id, voteData);
          }
        } else {
          // Create new vote
          response = await pollVotesApi.createPollVote(voteData);
        }

        if (response.error) {
          toast({
            title: "Error",
            description: response.error,
            variant: "destructive",
          });
          return;
        }
      }

      // Reload poll votes to update the UI
      setPollVotesLoaded(false); // Reset flag to allow reloading
      await loadPollVotes();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process vote",
        variant: "destructive",
      });
    }
  };

  // Fetch user details by ID with caching
  const fetchUserById = async (userId: number): Promise<User | null> => {
    // Check if user is already in cache
    if (userCache[userId]) {
      return userCache[userId];
    }

    try {
      const response = await usersApi.getUserById(userId);
      if (response.error) {
        console.error(`Failed to fetch user ${userId}:`, response.error);
        return null;
      }

      const userData = response.data;
      const user: User = {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        avatar: userData.avatar || "",
      };

      // Cache the user data
      setUserCache(prev => ({ ...prev, [userId]: user }));
      return user;
    } catch (error) {
      console.error(`Error fetching user ${userId}:`, error);
      return null;
    }
  };

  // Fetch user details for multiple users
  const fetchUsersForPosts = async (posts: any[]): Promise<Record<number, User>> => {
    const uniqueUserIds = [...new Set(posts.map(post => post.author_id))];
    const userPromises = uniqueUserIds.map(userId => fetchUserById(userId));
    const users = await Promise.all(userPromises);
    
    const userMap: Record<number, User> = {};
    uniqueUserIds.forEach((userId, index) => {
      if (users[index]) {
        userMap[userId] = users[index]!;
      }
    });
    
    return userMap;
  };

  const loadPosts = async (page: number = 1, append: boolean = false) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    
    try {
      // Determine the type filter based on active tab
      let typeFilter: string | undefined;
      if (activeTab === "posts") {
        // For posts tab, we'll load all posts and filter for text/photo in the component
        typeFilter = undefined;
      } else {
        const tabToTypeMap: Record<string, string> = {
          "events": "event",
          "birthdays": "birthday", 
          "appreciation": "appreciation",
          "polls": "poll",
          "highlights": "highlight"
        };
        typeFilter = tabToTypeMap[activeTab];
      }

      let feedPosts: any[] = [];
      let metadata: any = null;

      if (activeTab === "posts") {
        // For posts tab, we need to load both text and photo posts
        const [textResponse, photoResponse] = await Promise.all([
          feedApi.getFeedPosts(page, 10, "text"),
          feedApi.getFeedPosts(page, 10, "photo")
        ]);

        if (textResponse.error || photoResponse.error) {
          toast({
            title: "Error",
            description: textResponse.error || photoResponse.error,
            variant: "destructive",
          });
          return;
        }

        const textPosts = textResponse.data?.data || textResponse.data?.content || textResponse.data || [];
        const photoPosts = photoResponse.data?.data || photoResponse.data?.content || photoResponse.data || [];
        
        // Combine and sort by created_at
        feedPosts = [...textPosts, ...photoPosts].sort((a, b) => 
          new Date(b.created_at || b.timestamp).getTime() - new Date(a.created_at || a.timestamp).getTime()
        );

        // For posts tab, we'll use a simplified pagination approach
        // since we're combining two different API calls
        const totalTextPosts = textResponse.data?.metadata?.totalElements || 0;
        const totalPhotoPosts = photoResponse.data?.metadata?.totalElements || 0;
        const hasMoreText = textResponse.data?.metadata?.hasNext || false;
        const hasMorePhoto = photoResponse.data?.metadata?.hasNext || false;
        
        metadata = {
          currentPage: page,
          hasNext: hasMoreText || hasMorePhoto,
          hasPrevious: page > 1,
          totalPages: Math.max(
            textResponse.data?.metadata?.totalPages || 1,
            photoResponse.data?.metadata?.totalPages || 1
          ),
          totalElements: totalTextPosts + totalPhotoPosts,
          pageSize: 20
        };
      } else {
        const response = await feedApi.getFeedPosts(page, 10, typeFilter);
        if (response.error) {
          toast({
            title: "Error",
            description: response.error,
            variant: "destructive",
          });
          return;
        }

        feedPosts = response.data?.data || response.data?.content || response.data || [];
        metadata = response.data?.metadata || response.data;
      }

      // Fetch comments for each post
      const commentsPromises = feedPosts.map((post: any) => feedApi.getFeedPostComments(post.id));
      const commentsResults = await Promise.all(commentsPromises);
      // Fetch reactions for each post
      const reactionsPromises = feedPosts.map((post: any) => feedApi.getFeedPostReactions(post.id));
      const reactionsResults = await Promise.all(reactionsPromises);
      // Flatten all comment authors for user fetching
      const allCommentAuthors = commentsResults
        .flatMap((result) => (result.data || []).map((c: any) => c.author_id))
        .filter((id, idx, arr) => arr.indexOf(id) === idx); // unique
      // Fetch user details for posts and comments
      const uniqueUserIds = [
        ...new Set([
          ...feedPosts.map((post: any) => post.author_id),
          ...allCommentAuthors,
        ]),
      ];
      const userPromises = uniqueUserIds.map((userId) => fetchUserById(userId));
      const users = await Promise.all(userPromises);
      const userMap: Record<number, User> = {};
      uniqueUserIds.forEach((userId, index) => {
        if (users[index]) {
          userMap[userId] = users[index]!;
        }
      });

      // Track user's own reaction for each post
      const newUserReactions: Record<string, string | null> = {};

      // Transform API response to match our Post interface
      const transformedPosts = feedPosts.map((post: any, idx: number) => {
        const author = userMap[post.author_id] || {
          name: "Unknown User",
          avatar: "",
        };
        // Comments for this post
        const commentsData = commentsResults[idx].data || [];
        const comments = commentsData.map((comment: any) => {
          const commentAuthor = userMap[comment.author_id] || {
            name: "Unknown User",
            avatar: "",
          };
          // Map reactions for this comment, if any
          let reactions = (comment.reactions || []).map((r: any) => ({
            ...r,
            userId: Number(r.userId),
          }));
          return {
            id: comment.id,
            content: comment.content,
            author: {
              name: commentAuthor.name,
              avatar:
                commentAuthor.avatar ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(commentAuthor.name)}&background=0D9488&color=fff`,
            },
            timestamp: comment.timestamp || comment.created_at,
            reactions,
          };
        });
        // Reactions for this post
        const reactionsData = reactionsResults[idx].data || [];
        // Find current user's reaction
        const myReaction = reactionsData.find((r: any) => r.userId === user?.id);
        newUserReactions[post.id] = myReaction ? myReaction.reactionType : null;
        return {
          id: post.id,
          content: post.content,
          author: {
            name: author.name,
            avatar:
              author.avatar ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(author.name)}&background=0D9488&color=fff`,
          },
          author_id: post.author_id, // Include author_id for ownership check
          timestamp: post.created_at || post.timestamp,
          likes: reactionsData.filter((r: any) => r.reactionType === "like").length,
          comments,
          image: post.media_urls?.[0] || post.image,
          media_urls: post.media_urls || undefined,
          type: post.type || "post",
          eventDate: post.event_date,
          eventTitle: post.event_title,
          reactions: reactionsData,
          // Add poll options if this is a poll post
          pollOptions: post.poll_options || undefined,
        };
      });

      // Update pagination state
      if (metadata) {
        setCurrentPage(metadata.currentPage || page);
        setHasNextPage(metadata.hasNext || false);
        setHasPreviousPage(metadata.hasPrevious || false);
        setTotalPages(metadata.totalPages || 1);
        setTotalElements(metadata.totalElements || 0);
      }

      if (append) {
        setPosts(prevPosts => [...prevPosts, ...transformedPosts]);
      } else {
        setPosts(transformedPosts);
      }
      
      setUserReactions(newUserReactions);
      setPollVotesLoaded(false); // Reset poll votes loaded flag when posts are reloaded
      setPollData({}); // Clear poll data when posts are reloaded

      // After mapping comments in loadPosts, build userCommentReactions for all comments
      const newUserCommentReactions: Record<string, string | null> = {};
      transformedPosts.forEach((post: any) => {
        post.comments.forEach((comment: any) => {
          const myCommentReaction = (comment.reactions || []).find((r: any) => r.userId === user?.id);
          newUserCommentReactions[`${post.id}_${comment.id}`] = myCommentReaction ? myCommentReaction.reactionType : null;
        });
      });
      setUserCommentReactions(newUserCommentReactions);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load posts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      const hours = Math.floor(diffTime / (1000 * 60 * 60));
      if (hours === 0) {
        const minutes = Math.floor(diffTime / (1000 * 60));
        return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
      }
      return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  // Handle creating a new post
  const handleCreatePost = async () => {
    if (!newPostContent.trim() && selectedFiles.length === 0) return;

    setCreatingPost(true);
    try {
      const response = await feedApi.createFeedPost({
        content: newPostContent,
        type: selectedFiles.length > 0 ? "photo" : "text",
        files: selectedFiles,
      });

      if (response.error) {
        toast({
          title: "Error",
          description: response.error,
          variant: "destructive",
        });
        return;
      }

      // Reload posts to get the new post
      await loadPosts();
      setNewPostContent("");
      setSelectedFiles([]);
      setFilePreviewUrls([]);
      toast({
        title: "Success",
        description: "Your post has been published successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create post",
        variant: "destructive",
      });
    } finally {
      setCreatingPost(false);
    }
  };

  // Handle creating an event post
  const handleCreateEventPost = async () => {
    if (!newPostContent.trim() && !eventTitle?.trim()) return;

    setCreatingPost(true);
    try {
      const response = await feedApi.createFeedPost({
        content: newPostContent,
        type: "event",
        event_date: eventDate || new Date().toISOString().split('T')[0], // Use provided date or current date
      });

      if (response.error) {
        toast({
          title: "Error",
          description: response.error,
          variant: "destructive",
        });
        return;
      }

      // Reload posts to get the new post
      await loadPosts();
      setNewPostContent("");
      setEventTitle("");
      setEventDate("");
      toast({
        title: "Success",
        description: "Your event has been created successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create event",
        variant: "destructive",
      });
    } finally {
      setCreatingPost(false);
    }
  };

  // Handle creating a birthday post
  const handleCreateBirthdayPost = async () => {
    if (!newPostContent.trim()) return;

    setCreatingPost(true);
    try {
      const response = await feedApi.createFeedPost({
        content: newPostContent,
        type: "birthday",
      });

      if (response.error) {
        toast({
          title: "Error",
          description: response.error,
          variant: "destructive",
        });
        return;
      }

      // Reload posts to get the new post
      await loadPosts();
      setNewPostContent("");
      toast({
        title: "Success",
        description: "Your birthday post has been created successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create birthday post",
        variant: "destructive",
      });
    } finally {
      setCreatingPost(false);
    }
  };

  // Handle creating an appreciation post
  const handleCreateAppreciationPost = async () => {
    if (!newPostContent.trim() && selectedFiles.length === 0) return;

    setCreatingPost(true);
    try {
      const response = await feedApi.createFeedPost({
        content: newPostContent,
        type: "appreciation",
        files: selectedFiles,
      });

      if (response.error) {
        toast({
          title: "Error",
          description: response.error,
          variant: "destructive",
        });
        return;
      }

      // Reload posts to get the new post
      await loadPosts();
      setNewPostContent("");
      setSelectedFiles([]);
      setFilePreviewUrls([]);
      toast({
        title: "Success",
        description: "Your appreciation post has been created successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create appreciation post",
        variant: "destructive",
      });
    } finally {
      setCreatingPost(false);
    }
  };

  // Handle creating a highlight post
  const handleCreateHighlightPost = async () => {
    if (!newPostContent.trim() && selectedFiles.length === 0) return;

    setCreatingPost(true);
    try {
      const response = await feedApi.createFeedPost({
        content: newPostContent,
        type: "highlight",
        files: selectedFiles,
      });

      if (response.error) {
        toast({
          title: "Error",
          description: response.error,
          variant: "destructive",
        });
        return;
      }

      // Reload posts to get the new post
      await loadPosts();
      setNewPostContent("");
      setSelectedFiles([]);
      setFilePreviewUrls([]);
      toast({
        title: "Success",
        description: "Your highlight post has been created successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create highlight post",
        variant: "destructive",
      });
    } finally {
      setCreatingPost(false);
    }
  };

  // File handling functions
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length === 0) {
      toast({
        title: "Invalid file type",
        description: "Please select only image files",
        variant: "destructive",
      });
      return;
    }

    // Limit to 5 images
    if (selectedFiles.length + imageFiles.length > 5) {
      toast({
        title: "Too many images",
        description: "You can upload a maximum of 5 images",
        variant: "destructive",
      });
      return;
    }

    setSelectedFiles(prev => [...prev, ...imageFiles]);
    
    // Create preview URLs
    imageFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFilePreviewUrls(prev => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setFilePreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const clearAllFiles = () => {
    setSelectedFiles([]);
    setFilePreviewUrls([]);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const triggerAppreciationFileInput = () => {
    appreciationFileInputRef.current?.click();
  };

  // Handle adding a comment
  const handleAddComment = async (postId: string) => {
    if (!newComments[postId]?.trim()) return;
    const response = await feedApi.createComment(postId, {
      content: newComments[postId],
    });
    if (response && !response.error) {
      // Update state locally
      const newComment = {
        id: Math.random().toString(),
        content: newComments[postId],
        author: {
          name: user.name,
          avatar: user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=0D9488&color=fff`,
        },
        timestamp: new Date().toISOString(),
      };
      setPosts(prev => prev.map(p => String(p.id) === String(postId) ? { ...p, comments: [...p.comments, newComment] } : p));
      setNewComments((prev) => ({ ...prev, [postId]: "" }));
      toast({ title: 'Comment added', description: 'Your comment was posted.' });
    }
  };

  // Handle liking a post
  const handleLikePost = async (postId: string) => {
    if (likedPosts[postId]) return;

    try {
      const response = await feedApi.addReactionToFeedPost(postId, {
        type: "like",
      });

      if (response.error) {
        toast({
          title: "Error",
          description: response.error,
          variant: "destructive",
        });
        return;
      }

      // Update local state
      setLikedPosts((prev) => ({ ...prev, [postId]: true }));
      
      // Update post likes count
      setPosts((prev) =>
        prev.map((post) =>
          String(post.id) === String(postId) ? { ...post, likes: post.likes + 1 } : post
        )
      );

      toast({
        title: "Success",
        description: "Post liked successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to like post",
        variant: "destructive",
      });
    }
  };

  // Get icon based on post type
  const getPostTypeIcon = (type: Post["type"]) => {
    switch (type) {
      case "text":
        return <MessageCircle className="h-4 w-4 text-blue-500" />;
      case "photo":
        return <Image className="h-4 w-4 text-green-500" />;
      case "event":
        return <Calendar className="h-4 w-4 text-blue-500" />;
      case "birthday":
        return <Cake className="h-4 w-4 text-pink-500" />;
      case "achievement":
        return <Award className="h-4 w-4 text-amber-500" />;
      case "poll":
        return <Vote className="h-4 w-4 text-blue-500" />;
      case "highlight":
        return <Star className="h-4 w-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  // Filter posts based on active tab
  const getFilteredPosts = () => {
    if (activeTab === "posts") {
      // Show text and photo posts in the posts tab
      return posts.filter((post) => 
        post.type === "text" || post.type === "photo"
      );
    }
    
    // Map tab values to post types
    const tabToTypeMap: Record<string, string> = {
      "events": "event",
      "birthdays": "birthday", 
      "appreciation": "appreciation",
      "polls": "poll",
      "highlights": "highlight"
    };
    
    const postType = tabToTypeMap[activeTab];
    if (!postType) return posts;
    
    return posts.filter((post) => post.type === postType);
  };

  // Handler to add a reaction
  const handleAddReaction = async (postId: string, reactionType: string) => {
    if (!user) return;
    const post = posts.find(p => String(p.id) === String(postId));
    const currentReaction = userReactions[postId];
    if (currentReaction === reactionType) return; // already reacted with this type
    // Remove old reaction if exists
    if (currentReaction) {
      await feedApi.removeReactionFromFeedPostWithQuery(Number(postId), user.id, currentReaction);
    }
    // Add new reaction
    const response = await feedApi.addReactionToFeedPost(Number(postId), {
      user_id: Number(user.id),
      reaction_type: reactionType,
    });
    if (response && !response.error) {
      // Update state locally
      const newPosts = posts.map(p => {
        if (String(p.id) !== String(postId)) return p;
        // Remove old reaction if exists
        let newReactions = p.reactions.filter(r => Number(r.userId) !== Number(user.id));
        // Add new reaction
        newReactions = [
          ...newReactions,
          { id: Date.now().toString(), userId: Number(user.id), reactionType, createdAt: new Date().toISOString() },
        ];
        return { ...p, reactions: newReactions };
      });
      setPosts(newPosts);
      setUserReactions(prev => ({ ...prev, [postId]: reactionType }));
    }
  };

  // Handler to remove a reaction
  const handleRemoveReaction = async (postId: string, reactionType: string) => {
    if (!user) return;
    const response = await feedApi.removeReactionFromFeedPostWithQuery(Number(postId), user.id, reactionType);
    if (response && !response.error) {
      // Update state locally
      const newPosts = posts.map(p => {
        if (String(p.id) !== String(postId)) return p;
        const newReactions = p.reactions.filter(r => !(Number(r.userId) === Number(user.id) && r.reactionType === reactionType));
        return { ...p, reactions: newReactions };
      });
      setPosts(newPosts);
      setUserReactions(prev => ({ ...prev, [postId]: null }));
    }
  };

  // Fetch user info for reactors (with caching)
  const fetchReactors = async (post: Post) => {
    setReactorLoading(true);
    const userIds = [...new Set(post.reactions.map(r => r.userId))];
    const newUsers: Record<number, User> = { ...reactorUsers };
    for (const id of userIds) {
      if (!newUsers[id]) {
        const res = await usersApi.getUserById(id);
        if (res && res.data) {
          newUsers[id] = {
            id: res.data.id,
            name: res.data.name,
            email: res.data.email,
            avatar: res.data.avatar || '',
          };
        }
      }
    }
    setReactorUsers(newUsers);
    setReactorLoading(false);
  };

  // Handler for opening the reaction dialog
  const openReactionDialog = async (post: Post) => {
    setReactionDialogPost(post);
    setReactionDialogOpen(true);
    await fetchReactors(post);
  };

  // Helper to get top 2 reactions by count
  const getTopReactions = (reactions: any[]) => {
    const counts: Record<string, number> = {};
    reactions.forEach(r => {
      counts[r.reactionType] = (counts[r.reactionType] || 0) + 1;
    });
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return sorted.slice(0, 2).map(([type]) => type);
  };

  // Handler for popover open/close
  const handlePopoverOpen = (postId: string, open: boolean) => {
    setReactionPopoverOpen(prev => ({ ...prev, [postId]: open }));
  };

  // Handlers for comment reactions
  const handleAddCommentReaction = async (postId: string, commentId: string, reactionType: string) => {
    if (!user) return;
    // Only add the new reaction
    const response = await feedApi.addReactionToComment(Number(postId), Number(commentId), {
      user_id: Number(user.id),
      reaction_type: reactionType,
    });
    if (response && !response.error) {
      // Update state locally
      setPosts(prevPosts => prevPosts.map(p => {
        if (String(p.id) !== String(postId)) return p;
        return {
          ...p,
          comments: p.comments.map(c => {
            if (String(c.id) !== String(commentId)) return c;
            let newReactions = (c.reactions || []).filter(r => Number(r.userId) !== Number(user.id));
            newReactions = [
              ...newReactions,
              { id: Date.now().toString(), userId: Number(user.id), reactionType, createdAt: new Date().toISOString() },
            ];
            return { ...c, reactions: newReactions };
          })
        };
      }));
      setUserCommentReactions(prev => ({ ...prev, [`${postId}_${commentId}`]: reactionType }));
    }
  };
  const handleRemoveCommentReaction = async (postId: string, commentId: string, reactionType: string) => {
    if (!user) return;
    const post = posts.find(p => String(p.id) === String(postId));
    const comment = post?.comments.find(c => String(c.id) === String(commentId));
    const key = `${postId}_${commentId}`;
    if (comment?.reactions) {
      const myReaction = comment.reactions.find(r => Number(r.userId) === Number(user.id) && r.reactionType === reactionType);
      if (myReaction) {
        const response = await feedApi.removeReactionFromCommentWithQuery(Number(postId), Number(commentId), user.id, reactionType);
        if (response && !response.error) {
          setPosts(prevPosts => prevPosts.map(p => {
            if (String(p.id) !== String(postId)) return p;
            return {
              ...p,
              comments: p.comments.map(c => {
                if (String(c.id) !== String(commentId)) return c;
                const newReactions = (c.reactions || []).filter(r => !(Number(r.userId) === Number(user.id) && r.reactionType === reactionType));
                return { ...c, reactions: newReactions };
              })
            };
          }));
          setUserCommentReactions(prev => ({ ...prev, [key]: null }));
        }
      }
    }
  };
  const handleCommentReactionPopoverOpen = (postId: string, commentId: string, open: boolean) => {
    setCommentReactionPopoverOpen(prev => ({ ...prev, [`${postId}_${commentId}`]: open }));
  };

  // Toggle comments visibility for a post
  const toggleComments = (postId: string) => {
    setCommentsVisible(prev => ({ ...prev, [postId]: !prev[postId] }));
  };

  // Load more posts function
  const loadMorePosts = async () => {
    if (loadingMore || !hasNextPage) return;
    await loadPosts(currentPage + 1, true);
  };

  // Edit post handlers
  const handleEditPost = (post: Post) => {
    setEditingPostId(post.id);
    setEditPostContent(post.content);
  };

  const handleCancelEdit = () => {
    setEditingPostId(null);
    setEditPostContent("");
  };

  const handleSaveEdit = async () => {
    if (!editingPostId || !editPostContent.trim()) return;
    
    setIsEditing(true);
    try {
      const response = await feedApi.updateFeedPost(editingPostId, {
        content: editPostContent.trim(),
        type: posts.find(p => p.id === editingPostId)?.type || "text",
        author_id: user?.id ? Number(user.id) : undefined
      });

      if (response.error) {
        toast({
          title: "Error",
          description: response.error,
          variant: "destructive",
        });
        return;
      }

      // Update the post in the local state
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post.id === editingPostId 
            ? { ...post, content: editPostContent.trim() }
            : post
        )
      );

      toast({
        title: "Success",
        description: "Post updated successfully",
      });

      handleCancelEdit();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update post",
        variant: "destructive",
      });
    } finally {
      setIsEditing(false);
    }
  };

  // Delete post handlers
  const handleDeletePost = (postId: string) => {
    setPostToDelete(postId);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!postToDelete) return;
    
    setIsDeleting(true);
    try {
      const response = await feedApi.deleteFeedPost(postToDelete);

      if (response.error) {
        toast({
          title: "Error",
          description: response.error,
          variant: "destructive",
        });
        return;
      }

      // Remove the post from local state
      setPosts(prevPosts => prevPosts.filter(post => post.id !== postToDelete));

      toast({
        title: "Success",
        description: "Post deleted successfully",
      });

      setDeleteConfirmOpen(false);
      setPostToDelete(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete post",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setDeleteConfirmOpen(false);
    setPostToDelete(null);
  };

  // Photo modal handlers
  const handlePhotoClick = (photoUrl: string, photoIndex: number, allPhotoUrls: string[]) => {
    setSelectedPhoto(photoUrl);
    setSelectedPhotoIndex(photoIndex);
    setPhotoUrls(allPhotoUrls);
    setPhotoModalOpen(true);
  };

  const handleClosePhotoModal = () => {
    setPhotoModalOpen(false);
    setSelectedPhoto(null);
    setSelectedPhotoIndex(0);
    setPhotoUrls([]);
  };

  const handlePreviousPhoto = () => {
    if (selectedPhotoIndex > 0) {
      setSelectedPhotoIndex(selectedPhotoIndex - 1);
      setSelectedPhoto(photoUrls[selectedPhotoIndex - 1]);
    }
  };

  const handleNextPhoto = () => {
    if (selectedPhotoIndex < photoUrls.length - 1) {
      setSelectedPhotoIndex(selectedPhotoIndex + 1);
      setSelectedPhoto(photoUrls[selectedPhotoIndex + 1]);
    }
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (photoModalOpen) {
      if (event.key === 'Escape') {
        handleClosePhotoModal();
      } else if (event.key === 'ArrowLeft') {
        handlePreviousPhoto();
      } else if (event.key === 'ArrowRight') {
        handleNextPhoto();
      }
    }
  };

  // Add keyboard event listener
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [photoModalOpen, selectedPhotoIndex, photoUrls]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading posts...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header section */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Team Social</h1>
        <Button>
          <Users className="h-4 w-4 mr-2" />
          Team Directory
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="posts">Posts</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="birthdays">Birthdays</TabsTrigger>
          <TabsTrigger value="appreciation">Appreciation</TabsTrigger>
          <TabsTrigger value="polls">Polls</TabsTrigger>
          <TabsTrigger value="highlights">Highlights</TabsTrigger>
        </TabsList>
        <TabsContent value="posts">
          {/* Create post */}
          <Card className="mb-6 backdrop-blur-sm bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Create Post</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Avatar>
                  <AvatarImage src={user?.avatar} alt={user?.name} />
                  <AvatarFallback>
                    {user?.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <Textarea
                    placeholder="What's on your mind?"
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    className="mb-4 backdrop-blur-sm bg-background/50"
                    disabled={creatingPost}
                  />
                  
                  {/* File upload section */}
                  <div className="mb-4">
                    {/* File input */}
                    <div className="flex items-center gap-2 mb-3">
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                        disabled={creatingPost}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="cursor-pointer"
                        disabled={creatingPost}
                        onClick={triggerFileInput}
                      >
                        <Image className="h-4 w-4 mr-2" />
                        Add Images
                      </Button>
                      {selectedFiles.length > 0 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={clearAllFiles}
                          disabled={creatingPost}
                        >
                          <X className="h-4 w-4 mr-2" />
                          Clear All
                        </Button>
                      )}
                    </div>

                    {/* File previews */}
                    {filePreviewUrls.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                        {filePreviewUrls.map((url, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={url}
                              alt={`Preview ${index + 1}`}
                              className="w-full h-24 object-cover rounded-md"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => removeFile(index)}
                              disabled={creatingPost}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="text-sm text-muted-foreground">
                      {selectedFiles.length > 0 && `${selectedFiles.length} image(s) selected`}
                    </div>
                    <Button 
                      onClick={handleCreatePost} 
                      disabled={creatingPost || (!newPostContent.trim() && selectedFiles.length === 0)}
                    >
                      {creatingPost && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Post
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Post list */}
          <div className="space-y-6">
            {getFilteredPosts().length === 0 ? (
              <Card className="backdrop-blur-sm bg-card/50 border-border/50">
                <CardContent className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <MessageCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No posts yet. Be the first to share something!</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              getFilteredPosts().map((post) => (
                <Card key={post.id} className="backdrop-blur-sm bg-card/50 border-border/50">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-4">
                        <Avatar>
                          <AvatarImage src={post.author.avatar} alt={post.author.name} />
                          <AvatarFallback>
                            {post.author.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-base">
                            {post.author.name}
                            {post.type !== "text" && post.type !== "photo" && (
                              <Badge variant="outline" className="ml-2 px-2 py-0">
                                <span className="flex items-center gap-1">
                                  {getPostTypeIcon(post.type)}
                                  {post.type.charAt(0).toUpperCase() + post.type.slice(1)}
                                </span>
                              </Badge>
                            )}
                          </CardTitle>
                          <CardDescription>{formatDate(post.timestamp)}</CardDescription>
                        </div>
                      </div>
                      {/* Edit/Delete buttons for post owner */}
                      {user && post.author_id === Number(user.id) && (
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditPost(post)}
                            disabled={isEditing}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeletePost(post.id)}
                            disabled={isDeleting}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pb-3">
                    {editingPostId === post.id ? (
                      <div className="space-y-3">
                        <Textarea
                          value={editPostContent}
                          onChange={(e) => setEditPostContent(e.target.value)}
                          className="min-h-[100px] backdrop-blur-sm bg-background/50"
                          placeholder="Edit your post..."
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={handleSaveEdit}
                            disabled={isEditing || !editPostContent.trim()}
                          >
                            {isEditing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Save
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleCancelEdit}
                            disabled={isEditing}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="whitespace-pre-line">{post.content}</p>
                    )}
                    
                    {post.type === "event" && post.eventDate && (
                      <div className="mt-4 p-4 bg-muted backdrop-blur-sm rounded-md">
                        <div className="flex items-center gap-3">
                          <Calendar className="h-8 w-8 text-teamsync-600" />
                          <div>
                            <h3 className="font-medium">{post.eventTitle}</h3>
                            <p className="text-sm text-muted-foreground">
                              {formatEventDate(post.eventDate)}
                            </p>
                          </div>
                        </div>
                        <div className="mt-3 flex justify-end">
                          <Button variant="outline" size="sm">
                            <Calendar className="h-3 w-3 mr-2" />
                            Add to Calendar
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    {post.type === "birthday" && (
                      <div className="mt-4 p-4 bg-pink-50 backdrop-blur-sm rounded-md">
                        <div className="flex items-center gap-3">
                          <Cake className="h-8 w-8 text-pink-500" />
                          <div>
                            <h3 className="font-medium">Happy Birthday! 🎉</h3>
                            <p className="text-sm text-muted-foreground">
                              Celebrate with the team
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {post.type === "achievement" && (
                      <div className="mt-4 p-4 bg-amber-50 backdrop-blur-sm rounded-md">
                        <div className="flex items-center gap-3">
                          <Award className="h-8 w-8 text-amber-500" />
                          <div>
                            <h3 className="font-medium">Team Achievement 🏆</h3>
                            <p className="text-sm text-muted-foreground">
                              Congratulations on this milestone!
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {post.type === "poll" && post.pollOptions && pollData[post.id] && (
                      <div className="mt-4 p-4 bg-blue-50 backdrop-blur-sm rounded-md">
                        <div className="space-y-3">
                          {pollData[post.id].pollVotes.map((pollOption, index) => (
                            <div
                              key={pollOption.option}
                              className={`relative p-3 rounded-lg border-2 cursor-pointer transition-all hover:bg-blue-100 ${
                                userVotes[post.id] === pollOption.option
                                  ? 'border-blue-500 bg-blue-100'
                                  : 'border-gray-200 bg-white'
                              }`}
                              onClick={() => handlePollVote(post.id, pollOption.option)}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <Checkbox
                                    checked={userVotes[post.id] === pollOption.option}
                                    className="pointer-events-none"
                                  />
                                  <span className="font-medium">{pollOption.option}</span>
                                </div>
                                {renderPollOptionVoters(post.id, pollOption)}
                              </div>
                              
                              {/* Progress bar */}
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${pollOption.percentage}%` }}
                                />
                              </div>
                              
                              {/* Percentage */}
                              <div className="text-right mt-1">
                                <span className="text-sm font-medium text-blue-600">
                                  {pollOption.percentage.toFixed(1)}%
                                </span>
                              </div>
                            </div>
                          ))}
                          
                          {/* Total votes */}
                          {pollData[post.id].totalVotes !== undefined && (
                            <div className="text-center pt-2 border-t border-gray-200">
                              <span className="text-sm text-muted-foreground">
                                {pollData[post.id].totalVotes} total vote{pollData[post.id].totalVotes !== 1 ? 's' : ''}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {(post.media_urls && post.media_urls.length > 0) && (
                      <MediaGallery 
                        mediaUrls={post.media_urls} 
                        onPhotoClick={handlePhotoClick}
                      />
                    )}
                    {(!post.media_urls || post.media_urls.length === 0) && post.image && (
                      <div className="mt-4">
                        <img
                          src={post.image}
                          alt="Post attachment"
                          className="rounded-md max-h-96 w-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => handlePhotoClick(post.image!, 0, [post.image!])}
                        />
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="flex items-center justify-evenly border-t pt-2 mt-2 gap-0 px-0">
                    {/* Like button with popover for all reactions */}
                    <Popover open={!!reactionPopoverOpen[post.id]} onOpenChange={open => handlePopoverOpen(post.id, open)}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`flex-1 flex items-center justify-center px-0 py-2 font-medium transition hover:bg-muted/50`}
                          onClick={() => {
                            if (userReactions[post.id]) {
                              handleRemoveReaction(post.id, userReactions[post.id]!);
                            } else {
                              handleAddReaction(post.id, 'like');
                            }
                          }}
                          onMouseEnter={() => handlePopoverOpen(post.id, true)}
                          onMouseLeave={() => handlePopoverOpen(post.id, false)}
                          type="button"
                        >
                          <div className={`inline-flex items-center justify-center rounded-full min-w-[100px] max-w-[180px] w-auto ${userReactions[post.id] ? 'bg-primary text-primary-foreground' : 'bg-transparent'}`}>
                            <span className="text-xl mr-1">{REACTION_EMOJIS[userReactions[post.id] || 'like']}</span>
                            <span>{REACTION_NAMES[userReactions[post.id] || 'like']}</span>
                          </div>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent
                        side="top"
                        align="center"
                        className="flex gap-2 p-2 w-auto bg-white shadow-lg rounded-full border border-gray-200"
                        onMouseEnter={() => handlePopoverOpen(post.id, true)}
                        onMouseLeave={() => handlePopoverOpen(post.id, false)}
                      >
                        {REACTION_TYPES.map(type => (
                          <button
                            key={type}
                            className="text-2xl hover:scale-125 transition-transform px-2 py-1 focus:outline-none"
                            onClick={() => handleAddReaction(post.id, type)}
                            type="button"
                          >
                            {REACTION_EMOJIS[type]}
                          </button>
                        ))}
                      </PopoverContent>
                    </Popover>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="flex-1 flex items-center justify-center px-0 py-2 rounded-none font-medium transition hover:bg-muted/50"
                      onClick={() => toggleComments(post.id)}
                    >
                      <MessageCircle className="h-4 w-4 mr-1" />
                      {commentsVisible[post.id] ? 'Hide Comments' : 'Comment'}
                    </Button>
                    <Button variant="ghost" size="sm" className="flex-1 flex items-center justify-center px-0 py-2 rounded-none font-medium transition hover:bg-muted/50">
                      <Share2 className="h-4 w-4 mr-1" />
                      Share
                    </Button>
                  </CardFooter>
                  
                  {/* Reaction summary and comment count row */}
                  <div className="flex items-center justify-between px-4 pt-2 pb-1">
                    {post.reactions.length > 0 && (
                      <button
                        className="flex items-center gap-1 px-2 py-1 rounded hover:bg-muted/50 transition"
                        onClick={() => openReactionDialog(post)}
                      >
                        {getTopReactions(post.reactions).map(type => (
                          <span key={type} className="text-xl">{REACTION_EMOJIS[type]}</span>
                        ))}
                        <span className="ml-1 text-sm font-medium">{post.reactions.length}</span>
                      </button>
                    )}
                    <span className="text-muted-foreground text-sm">{post.comments.length} comments</span>
                  </div>
                  
                  {/* Comments */}
                  {commentsVisible[post.id] && (
                    <div className="w-full mt-4 space-y-3 px-4">
                      {post.comments.map((comment) => (
                        <div key={comment.id} className="flex gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={comment.author.avatar} alt={comment.author.name} />
                            <AvatarFallback>
                              {comment.author.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="bg-muted/50 backdrop-blur-sm p-3 rounded-lg inline-block max-w-xs min-w-0 break-words">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold">{comment.author.name}</span>
                                <span className="text-xs text-muted-foreground">{formatDate(comment.timestamp)}</span>
                              </div>
                              <p className="text-sm">{comment.content}</p>
                            </div>
                            <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                              <Popover open={!!commentReactionPopoverOpen[`${post.id}_${comment.id}`]} onOpenChange={open => handleCommentReactionPopoverOpen(post.id, comment.id, open)}>
                                <PopoverTrigger asChild>
                                  <span
                                    className={`inline-flex items-center cursor-pointer select-none ${userCommentReactions[`${post.id}_${comment.id}`] ? 'text-primary' : ''}`}
                                    onClick={async () => {
                                      const key = `${post.id}_${comment.id}`;
                                      if (!userCommentReactions[key]) {
                                        await handleAddCommentReaction(post.id, comment.id, 'like');
                                      } else if (userCommentReactions[key] !== 'like') {
                                        await feedApi.removeReactionFromCommentWithQuery(Number(post.id), Number(comment.id), user.id, userCommentReactions[key]!);
                                        // Update state to remove old reaction
                                        setPosts(prevPosts => prevPosts.map(p => {
                                          if (String(p.id) !== String(post.id)) return p;
                                          return {
                                            ...p,
                                            comments: p.comments.map(c => {
                                              if (String(c.id) !== String(comment.id)) return c;
                                              const newReactions = (c.reactions || []).filter(r => r.reactionType !== userCommentReactions[key] || Number(r.userId) !== Number(user.id));
                                              return { ...c, reactions: newReactions };
                                            })
                                          };
                                        }));
                                        setUserCommentReactions(prev => ({ ...prev, [key]: null }));
                                        // Add Like reaction and update state
                                        await handleAddCommentReaction(post.id, comment.id, 'like');
                                      } else {
                                        // Unselect: remove reaction and update state
                                        await feedApi.removeReactionFromCommentWithQuery(Number(post.id), Number(comment.id), user.id, userCommentReactions[key]!);
                                        setPosts(prevPosts => prevPosts.map(p => {
                                          if (String(p.id) !== String(post.id)) return p;
                                          return {
                                            ...p,
                                            comments: p.comments.map(c => {
                                              if (String(c.id) !== String(comment.id)) return c;
                                              const newReactions = (c.reactions || []).filter(r => r.reactionType !== userCommentReactions[key] || Number(r.userId) !== Number(user.id));
                                              return { ...c, reactions: newReactions };
                                            })
                                          };
                                        }));
                                        setUserCommentReactions(prev => ({ ...prev, [key]: null }));
                                      }
                                    }}
                                    onMouseEnter={() => handleCommentReactionPopoverOpen(post.id, comment.id, true)}
                                    onMouseLeave={() => handleCommentReactionPopoverOpen(post.id, comment.id, false)}
                                    role="button"
                                    tabIndex={0}
                                  >
                                    <span className="text-xl mr-1">{REACTION_EMOJIS['like']}</span>
                                    <span>{REACTION_NAMES['like']}</span>
                                  </span>
                                </PopoverTrigger>
                                <PopoverContent
                                  side="top"
                                  align="center"
                                  className="flex gap-2 p-2 w-auto bg-white shadow-lg rounded-full border border-gray-200"
                                  onMouseEnter={() => handleCommentReactionPopoverOpen(post.id, comment.id, true)}
                                  onMouseLeave={() => handleCommentReactionPopoverOpen(post.id, comment.id, false)}
                                >
                                  {REACTION_TYPES.map(type => (
                                    <button
                                      key={type}
                                      className="text-2xl hover:scale-125 transition-transform px-2 py-1 focus:outline-none"
                                      onClick={async () => {
                                        const key = `${post.id}_${comment.id}`;
                                        if (!userCommentReactions[key]) {
                                          await handleAddCommentReaction(post.id, comment.id, type);
                                        } else if (userCommentReactions[key] !== type) {
                                          await feedApi.removeReactionFromCommentWithQuery(Number(post.id), Number(comment.id), user.id, userCommentReactions[key]!);
                                          // Update state to remove old reaction
                                          setPosts(prevPosts => prevPosts.map(p => {
                                            if (String(p.id) !== String(post.id)) return p;
                                            return {
                                              ...p,
                                              comments: p.comments.map(c => {
                                                if (String(c.id) !== String(comment.id)) return c;
                                                const newReactions = (c.reactions || []).filter(r => r.reactionType !== userCommentReactions[key] || Number(r.userId) !== Number(user.id));
                                                return { ...c, reactions: newReactions };
                                              })
                                            };
                                          }));
                                          setUserCommentReactions(prev => ({ ...prev, [key]: null }));
                                          // Add new reaction and update state
                                          await handleAddCommentReaction(post.id, comment.id, type);
                                        }
                                      }}
                                      type="button"
                                    >
                                      {REACTION_EMOJIS[type]}
                                    </button>
                                  ))}
                                </PopoverContent>
                              </Popover>
                              <button className="hover:text-foreground">Reply</button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Add comment */}
                  <div className="flex gap-3 w-full mt-4 px-4 pb-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user?.avatar} alt={user?.name} />
                      <AvatarFallback>
                        {user?.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <Textarea
                      placeholder="Write a comment..."
                      value={newComments[post.id] || ""}
                      onChange={(e) => setNewComments((prev) => ({ ...prev, [post.id]: e.target.value }))}
                      className="flex-1 resize-none rounded-lg bg-white/80 border border-gray-200 px-3 py-2"
                      rows={1}
                    />
                    <Button
                      onClick={() => handleAddComment(post.id)}
                      disabled={!newComments[post.id]?.trim()}
                      className="rounded-lg px-4 py-2"
                    >
                      Comment
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
        

        
        {/* Other tabs content - reuse the same post rendering logic */}
        <TabsContent value="events">
          {/* Create Event Post */}
          <Card className="mb-6 backdrop-blur-sm bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Create Event</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Avatar>
                  <AvatarImage src={user?.avatar} alt={user?.name} />
                  <AvatarFallback>
                    {user?.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <Textarea
                    placeholder="What event would you like to share?"
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    className="mb-4 backdrop-blur-sm bg-background/50"
                    disabled={creatingPost}
                  />
                  
                  {/* Event Details */}
                  <div className="space-y-4 mb-4">
                    <div>
                      <Label htmlFor="event-title">Event Title</Label>
                      <Input
                        id="event-title"
                        placeholder="Enter event title"
                        value={eventTitle || ""}
                        onChange={(e) => setEventTitle(e.target.value)}
                        className="mt-1"
                        disabled={creatingPost}
                      />
                    </div>
                    <div>
                      <Label htmlFor="event-date">Event Date & Time</Label>
                      <Input
                        id="event-date"
                        type="datetime-local"
                        value={eventDate || ""}
                        onChange={(e) => setEventDate(e.target.value)}
                        className="mt-1"
                        disabled={creatingPost}
                      />
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="text-sm text-muted-foreground">
                      Share this event with your team
                    </div>
                    <Button 
                      onClick={handleCreateEventPost} 
                      disabled={creatingPost || (!newPostContent.trim() && !eventTitle?.trim())}
                    >
                      {creatingPost && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Create Event
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            {getFilteredPosts().length === 0 ? (
              <Card className="backdrop-blur-sm bg-card/50 border-border/50">
                <CardContent className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No events yet.</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              getFilteredPosts().map((post) => (
                <Card key={post.id} className="backdrop-blur-sm bg-card/50 border-border/50">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-4">
                        <Avatar>
                          <AvatarImage src={post.author.avatar} alt={post.author.name} />
                          <AvatarFallback>
                            {post.author.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-base">
                            {post.author.name}
                            <Badge variant="outline" className="ml-2 px-2 py-0">
                              <span className="flex items-center gap-1">
                                {getPostTypeIcon(post.type)}
                                {post.type.charAt(0).toUpperCase() + post.type.slice(1)}
                              </span>
                            </Badge>
                          </CardTitle>
                          <CardDescription>{formatDate(post.timestamp)}</CardDescription>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-3">
                    <p className="whitespace-pre-line">{post.content}</p>
                    
                    {post.eventDate && (
                      <div className="mt-4 p-4 bg-muted backdrop-blur-sm rounded-md">
                        <div className="flex items-center gap-3">
                          <Calendar className="h-8 w-8 text-teamsync-600" />
                          <div>
                            <h3 className="font-medium">{post.eventTitle}</h3>
                            <p className="text-sm text-muted-foreground">
                              {formatEventDate(post.eventDate)}
                            </p>
                          </div>
                        </div>
                        <div className="mt-3 flex justify-end">
                          <Button variant="outline" size="sm">
                            <Calendar className="h-3 w-3 mr-2" />
                            Add to Calendar
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    {(post.media_urls && post.media_urls.length > 0) && (
                      <MediaGallery 
                        mediaUrls={post.media_urls} 
                        onPhotoClick={handlePhotoClick}
                      />
                    )}
                    {(!post.media_urls || post.media_urls.length === 0) && post.image && (
                      <div className="mt-4">
                        <img
                          src={post.image}
                          alt="Post attachment"
                          className="rounded-md max-h-96 w-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => handlePhotoClick(post.image!, 0, [post.image!])}
                        />
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="flex items-center justify-evenly border-t pt-2 mt-2 gap-0 px-0">
                    {/* Like button with popover for all reactions */}
                    <Popover open={!!reactionPopoverOpen[post.id]} onOpenChange={open => handlePopoverOpen(post.id, open)}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`flex-1 flex items-center justify-center px-0 py-2 font-medium transition hover:bg-muted/50`}
                          onClick={() => {
                            if (userReactions[post.id]) {
                              handleRemoveReaction(post.id, userReactions[post.id]!);
                            } else {
                              handleAddReaction(post.id, 'like');
                            }
                          }}
                          onMouseEnter={() => handlePopoverOpen(post.id, true)}
                          onMouseLeave={() => handlePopoverOpen(post.id, false)}
                          type="button"
                        >
                          <div className={`inline-flex items-center justify-center rounded-full min-w-[100px] max-w-[180px] w-auto ${userReactions[post.id] ? 'bg-primary text-primary-foreground' : 'bg-transparent'}`}>
                            <span className="text-xl mr-1">{REACTION_EMOJIS[userReactions[post.id] || 'like']}</span>
                            <span>{REACTION_NAMES[userReactions[post.id] || 'like']}</span>
                          </div>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent
                        side="top"
                        align="center"
                        className="flex gap-2 p-2 w-auto bg-white shadow-lg rounded-full border border-gray-200"
                        onMouseEnter={() => handlePopoverOpen(post.id, true)}
                        onMouseLeave={() => handlePopoverOpen(post.id, false)}
                      >
                        {REACTION_TYPES.map(type => (
                          <button
                            key={type}
                            className="text-2xl hover:scale-125 transition-transform px-2 py-1 focus:outline-none"
                            onClick={() => handleAddReaction(post.id, type)}
                            type="button"
                          >
                            {REACTION_EMOJIS[type]}
                          </button>
                        ))}
                      </PopoverContent>
                    </Popover>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="flex-1 flex items-center justify-center px-0 py-2 rounded-none font-medium transition hover:bg-muted/50"
                      onClick={() => toggleComments(post.id)}
                    >
                      <MessageCircle className="h-4 w-4 mr-1" />
                      {commentsVisible[post.id] ? 'Hide Comments' : 'Comment'}
                    </Button>
                    <Button variant="ghost" size="sm" className="flex-1 flex items-center justify-center px-0 py-2 rounded-none font-medium transition hover:bg-muted/50">
                      <Share2 className="h-4 w-4 mr-1" />
                      Share
                    </Button>
                  </CardFooter>
                  
                  {/* Reaction summary and comment count row */}
                  <div className="flex items-center justify-between px-4 pt-2 pb-1">
                    {post.reactions.length > 0 && (
                      <button
                        className="flex items-center gap-1 px-2 py-1 rounded hover:bg-muted/50 transition"
                        onClick={() => openReactionDialog(post)}
                      >
                        {getTopReactions(post.reactions).map(type => (
                          <span key={type} className="text-xl">{REACTION_EMOJIS[type]}</span>
                        ))}
                        <span className="ml-1 text-sm font-medium">{post.reactions.length}</span>
                      </button>
                    )}
                    <span className="text-muted-foreground text-sm">{post.comments.length} comments</span>
                  </div>
                  
                  {/* Comments */}
                  {commentsVisible[post.id] && (
                    <div className="w-full mt-4 space-y-3 px-4">
                      {post.comments.map((comment) => (
                        <div key={comment.id} className="flex gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={comment.author.avatar} alt={comment.author.name} />
                            <AvatarFallback>
                              {comment.author.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="bg-muted/50 backdrop-blur-sm p-3 rounded-lg inline-block max-w-xs min-w-0 break-words">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold">{comment.author.name}</span>
                                <span className="text-xs text-muted-foreground">{formatDate(comment.timestamp)}</span>
                              </div>
                              <p className="text-sm">{comment.content}</p>
                            </div>
                            <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                              <Popover open={!!commentReactionPopoverOpen[`${post.id}_${comment.id}`]} onOpenChange={open => handleCommentReactionPopoverOpen(post.id, comment.id, open)}>
                                <PopoverTrigger asChild>
                                  <span
                                    className={`inline-flex items-center cursor-pointer select-none ${userCommentReactions[`${post.id}_${comment.id}`] ? 'text-primary' : ''}`}
                                    onClick={async () => {
                                      const key = `${post.id}_${comment.id}`;
                                      if (!userCommentReactions[key]) {
                                        await handleAddCommentReaction(post.id, comment.id, 'like');
                                      } else if (userCommentReactions[key] !== 'like') {
                                        await feedApi.removeReactionFromCommentWithQuery(Number(post.id), Number(comment.id), user.id, userCommentReactions[key]!);
                                        // Update state to remove old reaction
                                        setPosts(prevPosts => prevPosts.map(p => {
                                          if (String(p.id) !== String(post.id)) return p;
                                          return {
                                            ...p,
                                            comments: p.comments.map(c => {
                                              if (String(c.id) !== String(comment.id)) return c;
                                              const newReactions = (c.reactions || []).filter(r => r.reactionType !== userCommentReactions[key] || Number(r.userId) !== Number(user.id));
                                              return { ...c, reactions: newReactions };
                                            })
                                          };
                                        }));
                                        setUserCommentReactions(prev => ({ ...prev, [key]: null }));
                                        // Add Like reaction and update state
                                        await handleAddCommentReaction(post.id, comment.id, 'like');
                                      } else {
                                        // Unselect: remove reaction and update state
                                        await feedApi.removeReactionFromCommentWithQuery(Number(post.id), Number(comment.id), user.id, userCommentReactions[key]!);
                                        setPosts(prevPosts => prevPosts.map(p => {
                                          if (String(p.id) !== String(post.id)) return p;
                                          return {
                                            ...p,
                                            comments: p.comments.map(c => {
                                              if (String(c.id) !== String(comment.id)) return c;
                                              const newReactions = (c.reactions || []).filter(r => r.reactionType !== userCommentReactions[key] || Number(r.userId) !== Number(user.id));
                                              return { ...c, reactions: newReactions };
                                            })
                                          };
                                        }));
                                        setUserCommentReactions(prev => ({ ...prev, [key]: null }));
                                      }
                                    }}
                                    onMouseEnter={() => handleCommentReactionPopoverOpen(post.id, comment.id, true)}
                                    onMouseLeave={() => handleCommentReactionPopoverOpen(post.id, comment.id, false)}
                                    role="button"
                                    tabIndex={0}
                                  >
                                    <span className="text-xl mr-1">{REACTION_EMOJIS['like']}</span>
                                    <span>{REACTION_NAMES['like']}</span>
                                  </span>
                                </PopoverTrigger>
                                <PopoverContent
                                  side="top"
                                  align="center"
                                  className="flex gap-2 p-2 w-auto bg-white shadow-lg rounded-full border border-gray-200"
                                  onMouseEnter={() => handleCommentReactionPopoverOpen(post.id, comment.id, true)}
                                  onMouseLeave={() => handleCommentReactionPopoverOpen(post.id, comment.id, false)}
                                >
                                  {REACTION_TYPES.map(type => (
                                    <button
                                      key={type}
                                      className="text-2xl hover:scale-125 transition-transform px-2 py-1 focus:outline-none"
                                      onClick={async () => {
                                        const key = `${post.id}_${comment.id}`;
                                        if (!userCommentReactions[key]) {
                                          await handleAddCommentReaction(post.id, comment.id, type);
                                        } else if (userCommentReactions[key] !== type) {
                                          await feedApi.removeReactionFromCommentWithQuery(Number(post.id), Number(comment.id), user.id, userCommentReactions[key]!);
                                          // Update state to remove old reaction
                                          setPosts(prevPosts => prevPosts.map(p => {
                                            if (String(p.id) !== String(post.id)) return p;
                                            return {
                                              ...p,
                                              comments: p.comments.map(c => {
                                                if (String(c.id) !== String(comment.id)) return c;
                                                const newReactions = (c.reactions || []).filter(r => r.reactionType !== userCommentReactions[key] || Number(r.userId) !== Number(user.id));
                                                return { ...c, reactions: newReactions };
                                              })
                                            };
                                          }));
                                          setUserCommentReactions(prev => ({ ...prev, [key]: null }));
                                          // Add new reaction and update state
                                          await handleAddCommentReaction(post.id, comment.id, type);
                                        }
                                      }}
                                      type="button"
                                    >
                                      {REACTION_EMOJIS[type]}
                                    </button>
                                  ))}
                                </PopoverContent>
                              </Popover>
                              <button className="hover:text-foreground">Reply</button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Add comment */}
                  <div className="flex gap-3 w-full mt-4 px-4 pb-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user?.avatar} alt={user?.name} />
                      <AvatarFallback>
                        {user?.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <Textarea
                      placeholder="Write a comment..."
                      value={newComments[post.id] || ""}
                      onChange={(e) => setNewComments((prev) => ({ ...prev, [post.id]: e.target.value }))}
                      className="flex-1 resize-none rounded-lg bg-white/80 border border-gray-200 px-3 py-2"
                      rows={1}
                    />
                    <Button
                      onClick={() => handleAddComment(post.id)}
                      disabled={!newComments[post.id]?.trim()}
                      className="rounded-lg px-4 py-2"
                    >
                      Comment
                    </Button>
                  </div>
                </Card>
              ))
            )}
            
            {/* Load More Button for Events */}
            {activeTab === "events" && hasNextPage && (
              <div className="flex justify-center mt-6">
                <Button 
                  onClick={loadMorePosts} 
                  disabled={loadingMore}
                  variant="outline"
                  className="backdrop-blur-sm bg-card/50 border-border/50"
                >
                  {loadingMore && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Load More Events
                </Button>
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="birthdays">
          {/* Create Birthday Post */}
          <Card className="mb-6 backdrop-blur-sm bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Create Birthday Post</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Avatar>
                  <AvatarImage src={user?.avatar} alt={user?.name} />
                  <AvatarFallback>
                    {user?.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <Textarea
                    placeholder="Share a birthday message or celebration..."
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    className="mb-4 backdrop-blur-sm bg-background/50"
                    disabled={creatingPost}
                  />
                  
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-muted-foreground">
                      Celebrate birthdays with your team 🎉
                    </div>
                    <Button 
                      onClick={handleCreateBirthdayPost} 
                      disabled={creatingPost || !newPostContent.trim()}
                    >
                      {creatingPost && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Create Birthday Post
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            {getFilteredPosts().length === 0 ? (
              <Card className="backdrop-blur-sm bg-card/50 border-border/50">
                <CardContent className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <Cake className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No birthdays this month.</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              getFilteredPosts().map((post) => (
                <Card key={post.id} className="backdrop-blur-sm bg-card/50 border-border/50">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-4">
                        <Avatar>
                          <AvatarImage src={post.author.avatar} alt={post.author.name} />
                          <AvatarFallback>
                            {post.author.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-base">
                            {post.author.name}
                            <Badge variant="outline" className="ml-2 px-2 py-0">
                              <span className="flex items-center gap-1">
                                {getPostTypeIcon(post.type)}
                                {post.type.charAt(0).toUpperCase() + post.type.slice(1)}
                              </span>
                            </Badge>
                          </CardTitle>
                          <CardDescription>{formatDate(post.timestamp)}</CardDescription>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-3">
                    <p className="whitespace-pre-line">{post.content}</p>
                    
                    {(post.media_urls && post.media_urls.length > 0) && (
                      <MediaGallery 
                        mediaUrls={post.media_urls} 
                        onPhotoClick={handlePhotoClick}
                      />
                    )}
                    {(!post.media_urls || post.media_urls.length === 0) && post.image && (
                      <div className="mt-4">
                        <img
                          src={post.image}
                          alt="Post attachment"
                          className="rounded-md max-h-96 w-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => handlePhotoClick(post.image!, 0, [post.image!])}
                        />
                      </div>
                    )}
                    
                    <div className="mt-4 p-4 bg-pink-50 backdrop-blur-sm rounded-md">
                      <div className="flex items-center gap-3">
                        <Cake className="h-8 w-8 text-pink-500" />
                        <div>
                          <h3 className="font-medium">Happy Birthday! 🎉</h3>
                          <p className="text-sm text-muted-foreground">
                            Celebrate with the team
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex items-center justify-evenly border-t pt-2 mt-2 gap-0 px-0">
                    {/* Like button with popover for all reactions */}
                    <Popover open={!!reactionPopoverOpen[post.id]} onOpenChange={open => handlePopoverOpen(post.id, open)}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`flex-1 flex items-center justify-center px-0 py-2 font-medium transition hover:bg-muted/50`}
                          onClick={() => {
                            if (userReactions[post.id]) {
                              handleRemoveReaction(post.id, userReactions[post.id]!);
                            } else {
                              handleAddReaction(post.id, 'like');
                            }
                          }}
                          onMouseEnter={() => handlePopoverOpen(post.id, true)}
                          onMouseLeave={() => handlePopoverOpen(post.id, false)}
                          type="button"
                        >
                          <div className={`inline-flex items-center justify-center rounded-full min-w-[100px] max-w-[180px] w-auto ${userReactions[post.id] ? 'bg-primary text-primary-foreground' : 'bg-transparent'}`}>
                            <span className="text-xl mr-1">{REACTION_EMOJIS[userReactions[post.id] || 'like']}</span>
                            <span>{REACTION_NAMES[userReactions[post.id] || 'like']}</span>
                          </div>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent
                        side="top"
                        align="center"
                        className="flex gap-2 p-2 w-auto bg-white shadow-lg rounded-full border border-gray-200"
                        onMouseEnter={() => handlePopoverOpen(post.id, true)}
                        onMouseLeave={() => handlePopoverOpen(post.id, false)}
                      >
                        {REACTION_TYPES.map(type => (
                          <button
                            key={type}
                            className="text-2xl hover:scale-125 transition-transform px-2 py-1 focus:outline-none"
                            onClick={() => handleAddReaction(post.id, type)}
                            type="button"
                          >
                            {REACTION_EMOJIS[type]}
                          </button>
                        ))}
                      </PopoverContent>
                    </Popover>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="flex-1 flex items-center justify-center px-0 py-2 rounded-none font-medium transition hover:bg-muted/50"
                      onClick={() => toggleComments(post.id)}
                    >
                      <MessageCircle className="h-4 w-4 mr-1" />
                      {commentsVisible[post.id] ? 'Hide Comments' : 'Comment'}
                    </Button>
                    <Button variant="ghost" size="sm" className="flex-1 flex items-center justify-center px-0 py-2 rounded-none font-medium transition hover:bg-muted/50">
                      <Share2 className="h-4 w-4 mr-1" />
                      Share
                    </Button>
                  </CardFooter>
                  
                  {/* Reaction summary and comment count row */}
                  <div className="flex items-center justify-between px-4 pt-2 pb-1">
                    {post.reactions.length > 0 && (
                      <button
                        className="flex items-center gap-1 px-2 py-1 rounded hover:bg-muted/50 transition"
                        onClick={() => openReactionDialog(post)}
                      >
                        {getTopReactions(post.reactions).map(type => (
                          <span key={type} className="text-xl">{REACTION_EMOJIS[type]}</span>
                        ))}
                        <span className="ml-1 text-sm font-medium">{post.reactions.length}</span>
                      </button>
                    )}
                    <span className="text-muted-foreground text-sm">{post.comments.length} comments</span>
                  </div>
                  
                  {/* Comments */}
                  {commentsVisible[post.id] && (
                    <div className="w-full mt-4 space-y-3 px-4">
                      {post.comments.map((comment) => (
                        <div key={comment.id} className="flex gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={comment.author.avatar} alt={comment.author.name} />
                            <AvatarFallback>
                              {comment.author.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="bg-muted/50 backdrop-blur-sm p-3 rounded-lg inline-block max-w-xs min-w-0 break-words">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold">{comment.author.name}</span>
                                <span className="text-xs text-muted-foreground">{formatDate(comment.timestamp)}</span>
                              </div>
                              <p className="text-sm">{comment.content}</p>
                            </div>
                            <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                              <Popover open={!!commentReactionPopoverOpen[`${post.id}_${comment.id}`]} onOpenChange={open => handleCommentReactionPopoverOpen(post.id, comment.id, open)}>
                                <PopoverTrigger asChild>
                                  <span
                                    className={`inline-flex items-center cursor-pointer select-none ${userCommentReactions[`${post.id}_${comment.id}`] ? 'text-primary' : ''}`}
                                    onClick={async () => {
                                      const key = `${post.id}_${comment.id}`;
                                      if (!userCommentReactions[key]) {
                                        await handleAddCommentReaction(post.id, comment.id, 'like');
                                      } else if (userCommentReactions[key] !== 'like') {
                                        await feedApi.removeReactionFromCommentWithQuery(Number(post.id), Number(comment.id), user.id, userCommentReactions[key]!);
                                        // Update state to remove old reaction
                                        setPosts(prevPosts => prevPosts.map(p => {
                                          if (String(p.id) !== String(post.id)) return p;
                                          return {
                                            ...p,
                                            comments: p.comments.map(c => {
                                              if (String(c.id) !== String(comment.id)) return c;
                                              const newReactions = (c.reactions || []).filter(r => r.reactionType !== userCommentReactions[key] || Number(r.userId) !== Number(user.id));
                                              return { ...c, reactions: newReactions };
                                            })
                                          };
                                        }));
                                        setUserCommentReactions(prev => ({ ...prev, [key]: null }));
                                        // Add Like reaction and update state
                                        await handleAddCommentReaction(post.id, comment.id, 'like');
                                      } else {
                                        // Unselect: remove reaction and update state
                                        await feedApi.removeReactionFromCommentWithQuery(Number(post.id), Number(comment.id), user.id, userCommentReactions[key]!);
                                        setPosts(prevPosts => prevPosts.map(p => {
                                          if (String(p.id) !== String(post.id)) return p;
                                          return {
                                            ...p,
                                            comments: p.comments.map(c => {
                                              if (String(c.id) !== String(comment.id)) return c;
                                              const newReactions = (c.reactions || []).filter(r => r.reactionType !== userCommentReactions[key] || Number(r.userId) !== Number(user.id));
                                              return { ...c, reactions: newReactions };
                                            })
                                          };
                                        }));
                                        setUserCommentReactions(prev => ({ ...prev, [key]: null }));
                                      }
                                    }}
                                    onMouseEnter={() => handleCommentReactionPopoverOpen(post.id, comment.id, true)}
                                    onMouseLeave={() => handleCommentReactionPopoverOpen(post.id, comment.id, false)}
                                    role="button"
                                    tabIndex={0}
                                  >
                                    <span className="text-xl mr-1">{REACTION_EMOJIS['like']}</span>
                                    <span>{REACTION_NAMES['like']}</span>
                                  </span>
                                </PopoverTrigger>
                                <PopoverContent
                                  side="top"
                                  align="center"
                                  className="flex gap-2 p-2 w-auto bg-white shadow-lg rounded-full border border-gray-200"
                                  onMouseEnter={() => handleCommentReactionPopoverOpen(post.id, comment.id, true)}
                                  onMouseLeave={() => handleCommentReactionPopoverOpen(post.id, comment.id, false)}
                                >
                                  {REACTION_TYPES.map(type => (
                                    <button
                                      key={type}
                                      className="text-2xl hover:scale-125 transition-transform px-2 py-1 focus:outline-none"
                                      onClick={async () => {
                                        const key = `${post.id}_${comment.id}`;
                                        if (!userCommentReactions[key]) {
                                          await handleAddCommentReaction(post.id, comment.id, type);
                                        } else if (userCommentReactions[key] !== type) {
                                          await feedApi.removeReactionFromCommentWithQuery(Number(post.id), Number(comment.id), user.id, userCommentReactions[key]!);
                                          // Update state to remove old reaction
                                          setPosts(prevPosts => prevPosts.map(p => {
                                            if (String(p.id) !== String(post.id)) return p;
                                            return {
                                              ...p,
                                              comments: p.comments.map(c => {
                                                if (String(c.id) !== String(comment.id)) return c;
                                                const newReactions = (c.reactions || []).filter(r => r.reactionType !== userCommentReactions[key] || Number(r.userId) !== Number(user.id));
                                                return { ...c, reactions: newReactions };
                                              })
                                            };
                                          }));
                                          setUserCommentReactions(prev => ({ ...prev, [key]: null }));
                                          // Add new reaction and update state
                                          await handleAddCommentReaction(post.id, comment.id, type);
                                        }
                                      }}
                                      type="button"
                                    >
                                      {REACTION_EMOJIS[type]}
                                    </button>
                                  ))}
                                </PopoverContent>
                              </Popover>
                              <button className="hover:text-foreground">Reply</button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Add comment */}
                  <div className="flex gap-3 w-full mt-4 px-4 pb-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user?.avatar} alt={user?.name} />
                      <AvatarFallback>
                        {user?.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <Textarea
                      placeholder="Write a comment..."
                      value={newComments[post.id] || ""}
                      onChange={(e) => setNewComments((prev) => ({ ...prev, [post.id]: e.target.value }))}
                      className="flex-1 resize-none rounded-lg bg-white/80 border border-gray-200 px-3 py-2"
                      rows={1}
                    />
                    <Button
                      onClick={() => handleAddComment(post.id)}
                      disabled={!newComments[post.id]?.trim()}
                      className="rounded-lg px-4 py-2"
                    >
                      Comment
                    </Button>
                  </div>
                </Card>
              ))
            )}
            
            {/* Load More Button for Birthdays */}
            {activeTab === "birthdays" && hasNextPage && (
              <div className="flex justify-center mt-6">
                <Button 
                  onClick={loadMorePosts} 
                  disabled={loadingMore}
                  variant="outline"
                  className="backdrop-blur-sm bg-card/50 border-border/50"
                >
                  {loadingMore && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Load More Birthdays
                </Button>
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="appreciation">
          {/* Create Appreciation Post */}
          <Card className="mb-6 backdrop-blur-sm bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Create Appreciation Post</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Avatar>
                  <AvatarImage src={user?.avatar} alt={user?.name} />
                  <AvatarFallback>
                    {user?.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <Textarea
                    placeholder="Share appreciation, recognition, or achievements..."
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    className="mb-4 backdrop-blur-sm bg-background/50"
                    disabled={creatingPost}
                  />
                  
                  {/* File upload section */}
                  <div className="mb-4">
                    {/* File input */}
                    <div className="flex items-center gap-2 mb-3">
                      <input
                        ref={appreciationFileInputRef}
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                        disabled={creatingPost}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="cursor-pointer"
                        disabled={creatingPost}
                        onClick={triggerAppreciationFileInput}
                      >
                        <Image className="h-4 w-4 mr-2" />
                        Add Images
                      </Button>
                      {selectedFiles.length > 0 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={clearAllFiles}
                          disabled={creatingPost}
                        >
                          <X className="h-4 w-4 mr-2" />
                          Clear All
                        </Button>
                      )}
                    </div>

                    {/* File previews */}
                    {filePreviewUrls.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                        {filePreviewUrls.map((url, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={url}
                              alt={`Preview ${index + 1}`}
                              className="w-full h-24 object-cover rounded-md"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => removeFile(index)}
                              disabled={creatingPost}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-muted-foreground">
                      {selectedFiles.length > 0 && `${selectedFiles.length} image(s) selected`}
                      {selectedFiles.length === 0 && "Recognize and appreciate your team members 🏆"}
                    </div>
                    <Button 
                      onClick={handleCreateAppreciationPost} 
                      disabled={creatingPost || (!newPostContent.trim() && selectedFiles.length === 0)}
                    >
                      {creatingPost && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Create Appreciation Post
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            {getFilteredPosts().length === 0 ? (
              <Card className="backdrop-blur-sm bg-card/50 border-border/50">
                <CardContent className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <ThumbsUp className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No appreciations yet.</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              getFilteredPosts().map((post) => (
                <Card key={post.id} className="backdrop-blur-sm bg-card/50 border-border/50">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-4">
                        <Avatar>
                          <AvatarImage src={post.author.avatar} alt={post.author.name} />
                          <AvatarFallback>
                            {post.author.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-base">
                            {post.author.name}
                            <Badge variant="outline" className="ml-2 px-2 py-0">
                              <span className="flex items-center gap-1">
                                {getPostTypeIcon(post.type)}
                                {post.type.charAt(0).toUpperCase() + post.type.slice(1)}
                              </span>
                            </Badge>
                          </CardTitle>
                          <CardDescription>{formatDate(post.timestamp)}</CardDescription>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-3">
                    <p className="whitespace-pre-line">{post.content}</p>
                    
                    {(post.media_urls && post.media_urls.length > 0) && (
                      <MediaGallery 
                        mediaUrls={post.media_urls} 
                        onPhotoClick={handlePhotoClick}
                      />
                    )}
                    {(!post.media_urls || post.media_urls.length === 0) && post.image && (
                      <div className="mt-4">
                        <img
                          src={post.image}
                          alt="Post attachment"
                          className="rounded-md max-h-96 w-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => handlePhotoClick(post.image!, 0, [post.image!])}
                        />
                      </div>
                    )}
                    
                    <div className="mt-4 p-4 bg-amber-50 backdrop-blur-sm rounded-md">
                      <div className="flex items-center gap-3">
                        <Award className="h-8 w-8 text-amber-500" />
                        <div>
                          <h3 className="font-medium">Team Achievement 🏆</h3>
                          <p className="text-sm text-muted-foreground">
                            Congratulations on this milestone!
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex items-center justify-evenly border-t pt-2 mt-2 gap-0 px-0">
                    {/* Like button with popover for all reactions */}
                    <Popover open={!!reactionPopoverOpen[post.id]} onOpenChange={open => handlePopoverOpen(post.id, open)}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`flex-1 flex items-center justify-center px-0 py-2 font-medium transition hover:bg-muted/50`}
                          onClick={() => {
                            if (userReactions[post.id]) {
                              handleRemoveReaction(post.id, userReactions[post.id]!);
                            } else {
                              handleAddReaction(post.id, 'like');
                            }
                          }}
                          onMouseEnter={() => handlePopoverOpen(post.id, true)}
                          onMouseLeave={() => handlePopoverOpen(post.id, false)}
                          type="button"
                        >
                          <div className={`inline-flex items-center justify-center rounded-full min-w-[100px] max-w-[180px] w-auto ${userReactions[post.id] ? 'bg-primary text-primary-foreground' : 'bg-transparent'}`}>
                            <span className="text-xl mr-1">{REACTION_EMOJIS[userReactions[post.id] || 'like']}</span>
                            <span>{REACTION_NAMES[userReactions[post.id] || 'like']}</span>
                          </div>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent
                        side="top"
                        align="center"
                        className="flex gap-2 p-2 w-auto bg-white shadow-lg rounded-full border border-gray-200"
                        onMouseEnter={() => handlePopoverOpen(post.id, true)}
                        onMouseLeave={() => handlePopoverOpen(post.id, false)}
                      >
                        {REACTION_TYPES.map(type => (
                          <button
                            key={type}
                            className="text-2xl hover:scale-125 transition-transform px-2 py-1 focus:outline-none"
                            onClick={() => handleAddReaction(post.id, type)}
                            type="button"
                          >
                            {REACTION_EMOJIS[type]}
                          </button>
                        ))}
                      </PopoverContent>
                    </Popover>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="flex-1 flex items-center justify-center px-0 py-2 rounded-none font-medium transition hover:bg-muted/50"
                      onClick={() => toggleComments(post.id)}
                    >
                      <MessageCircle className="h-4 w-4 mr-1" />
                      {commentsVisible[post.id] ? 'Hide Comments' : 'Comment'}
                    </Button>
                    <Button variant="ghost" size="sm" className="flex-1 flex items-center justify-center px-0 py-2 rounded-none font-medium transition hover:bg-muted/50">
                      <Share2 className="h-4 w-4 mr-1" />
                      Share
                    </Button>
                  </CardFooter>
                  
                  {/* Reaction summary and comment count row */}
                  <div className="flex items-center justify-between px-4 pt-2 pb-1">
                    {post.reactions.length > 0 && (
                      <button
                        className="flex items-center gap-1 px-2 py-1 rounded hover:bg-muted/50 transition"
                        onClick={() => openReactionDialog(post)}
                      >
                        {getTopReactions(post.reactions).map(type => (
                          <span key={type} className="text-xl">{REACTION_EMOJIS[type]}</span>
                        ))}
                        <span className="ml-1 text-sm font-medium">{post.reactions.length}</span>
                      </button>
                    )}
                    <span className="text-muted-foreground text-sm">{post.comments.length} comments</span>
                  </div>
                  
                  {/* Comments */}
                  {commentsVisible[post.id] && (
                    <div className="w-full mt-4 space-y-3 px-4">
                      {post.comments.map((comment) => (
                        <div key={comment.id} className="flex gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={comment.author.avatar} alt={comment.author.name} />
                            <AvatarFallback>
                              {comment.author.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="bg-muted/50 backdrop-blur-sm p-3 rounded-lg inline-block max-w-xs min-w-0 break-words">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold">{comment.author.name}</span>
                                <span className="text-xs text-muted-foreground">{formatDate(comment.timestamp)}</span>
                              </div>
                              <p className="text-sm">{comment.content}</p>
                            </div>
                            <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                              <Popover open={!!commentReactionPopoverOpen[`${post.id}_${comment.id}`]} onOpenChange={open => handleCommentReactionPopoverOpen(post.id, comment.id, open)}>
                                <PopoverTrigger asChild>
                                  <span
                                    className={`inline-flex items-center cursor-pointer select-none ${userCommentReactions[`${post.id}_${comment.id}`] ? 'text-primary' : ''}`}
                                    onClick={async () => {
                                      const key = `${post.id}_${comment.id}`;
                                      if (!userCommentReactions[key]) {
                                        await handleAddCommentReaction(post.id, comment.id, 'like');
                                      } else if (userCommentReactions[key] !== 'like') {
                                        await feedApi.removeReactionFromCommentWithQuery(Number(post.id), Number(comment.id), user.id, userCommentReactions[key]!);
                                        // Update state to remove old reaction
                                        setPosts(prevPosts => prevPosts.map(p => {
                                          if (String(p.id) !== String(post.id)) return p;
                                          return {
                                            ...p,
                                            comments: p.comments.map(c => {
                                              if (String(c.id) !== String(comment.id)) return c;
                                              const newReactions = (c.reactions || []).filter(r => r.reactionType !== userCommentReactions[key] || Number(r.userId) !== Number(user.id));
                                              return { ...c, reactions: newReactions };
                                            })
                                          };
                                        }));
                                        setUserCommentReactions(prev => ({ ...prev, [key]: null }));
                                        // Add Like reaction and update state
                                        await handleAddCommentReaction(post.id, comment.id, 'like');
                                      } else {
                                        // Unselect: remove reaction and update state
                                        await feedApi.removeReactionFromCommentWithQuery(Number(post.id), Number(comment.id), user.id, userCommentReactions[key]!);
                                        setPosts(prevPosts => prevPosts.map(p => {
                                          if (String(p.id) !== String(post.id)) return p;
                                          return {
                                            ...p,
                                            comments: p.comments.map(c => {
                                              if (String(c.id) !== String(comment.id)) return c;
                                              const newReactions = (c.reactions || []).filter(r => r.reactionType !== userCommentReactions[key] || Number(r.userId) !== Number(user.id));
                                              return { ...c, reactions: newReactions };
                                            })
                                          };
                                        }));
                                        setUserCommentReactions(prev => ({ ...prev, [key]: null }));
                                      }
                                    }}
                                    onMouseEnter={() => handleCommentReactionPopoverOpen(post.id, comment.id, true)}
                                    onMouseLeave={() => handleCommentReactionPopoverOpen(post.id, comment.id, false)}
                                    role="button"
                                    tabIndex={0}
                                  >
                                    <span className="text-xl mr-1">{REACTION_EMOJIS['like']}</span>
                                    <span>{REACTION_NAMES['like']}</span>
                                  </span>
                                </PopoverTrigger>
                                <PopoverContent
                                  side="top"
                                  align="center"
                                  className="flex gap-2 p-2 w-auto bg-white shadow-lg rounded-full border border-gray-200"
                                  onMouseEnter={() => handleCommentReactionPopoverOpen(post.id, comment.id, true)}
                                  onMouseLeave={() => handleCommentReactionPopoverOpen(post.id, comment.id, false)}
                                >
                                  {REACTION_TYPES.map(type => (
                                    <button
                                      key={type}
                                      className="text-2xl hover:scale-125 transition-transform px-2 py-1 focus:outline-none"
                                      onClick={async () => {
                                        const key = `${post.id}_${comment.id}`;
                                        if (!userCommentReactions[key]) {
                                          await handleAddCommentReaction(post.id, comment.id, type);
                                        } else if (userCommentReactions[key] !== type) {
                                          await feedApi.removeReactionFromCommentWithQuery(Number(post.id), Number(comment.id), user.id, userCommentReactions[key]!);
                                          // Update state to remove old reaction
                                          setPosts(prevPosts => prevPosts.map(p => {
                                            if (String(p.id) !== String(post.id)) return p;
                                            return {
                                              ...p,
                                              comments: p.comments.map(c => {
                                                if (String(c.id) !== String(comment.id)) return c;
                                                const newReactions = (c.reactions || []).filter(r => r.reactionType !== userCommentReactions[key] || Number(r.userId) !== Number(user.id));
                                                return { ...c, reactions: newReactions };
                                              })
                                            };
                                          }));
                                          setUserCommentReactions(prev => ({ ...prev, [key]: null }));
                                          // Add new reaction and update state
                                          await handleAddCommentReaction(post.id, comment.id, type);
                                        }
                                      }}
                                      type="button"
                                    >
                                      {REACTION_EMOJIS[type]}
                                    </button>
                                  ))}
                                </PopoverContent>
                              </Popover>
                              <button className="hover:text-foreground">Reply</button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Add comment */}
                  <div className="flex gap-3 w-full mt-4 px-4 pb-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user?.avatar} alt={user?.name} />
                      <AvatarFallback>
                        {user?.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <Textarea
                      placeholder="Write a comment..."
                      value={newComments[post.id] || ""}
                      onChange={(e) => setNewComments((prev) => ({ ...prev, [post.id]: e.target.value }))}
                      className="flex-1 resize-none rounded-lg bg-white/80 border border-gray-200 px-3 py-2"
                      rows={1}
                    />
                    <Button
                      onClick={() => handleAddComment(post.id)}
                      disabled={!newComments[post.id]?.trim()}
                      className="rounded-lg px-4 py-2"
                    >
                      Comment
                    </Button>
                  </div>
                </Card>
              ))
            )}
            
            {/* Load More Button for Appreciation */}
            {activeTab === "appreciation" && hasNextPage && (
              <div className="flex justify-center mt-6">
                <Button 
                  onClick={loadMorePosts} 
                  disabled={loadingMore}
                  variant="outline"
                  className="backdrop-blur-sm bg-card/50 border-border/50"
                >
                  {loadingMore && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Load More Appreciation
                </Button>
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="polls">
          {/* Create Poll Button */}
          <Card className="mb-6 backdrop-blur-sm bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Create Poll</CardTitle>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => setCreatePollDialogOpen(true)}
                className="w-full"
                variant="outline"
              >
                <Vote className="h-4 w-4 mr-2" />
                Create New Poll
              </Button>
            </CardContent>
          </Card>

          <div className="space-y-6">
            {getFilteredPosts().length === 0 ? (
              <Card className="backdrop-blur-sm bg-card/50 border-border/50">
                <CardContent className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <Vote className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No polls yet.</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              getFilteredPosts().map((post) => (
                <Card key={post.id} className="backdrop-blur-sm bg-card/50 border-border/50">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-4">
                        <Avatar>
                          <AvatarImage src={post.author.avatar} alt={post.author.name} />
                          <AvatarFallback>
                            {post.author.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-base">
                            {post.author.name}
                            <Badge variant="outline" className="ml-2 px-2 py-0">
                              <span className="flex items-center gap-1">
                                {getPostTypeIcon(post.type)}
                                {post.type.charAt(0).toUpperCase() + post.type.slice(1)}
                              </span>
                            </Badge>
                          </CardTitle>
                          <CardDescription>{formatDate(post.timestamp)}</CardDescription>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-3">
                    <p className="whitespace-pre-line">{post.content}</p>
                    
                    {post.pollOptions && pollData[post.id] && (
                      <div className="mt-4 p-4 bg-blue-50 backdrop-blur-sm rounded-md">
                        <div className="space-y-3">
                          {pollData[post.id].pollVotes.map((pollOption, index) => (
                            <div
                              key={pollOption.option}
                              className={`relative p-3 rounded-lg border-2 cursor-pointer transition-all hover:bg-blue-100 ${
                                userVotes[post.id] === pollOption.option
                                  ? 'border-blue-500 bg-blue-100'
                                  : 'border-gray-200 bg-white'
                              }`}
                              onClick={() => handlePollVote(post.id, pollOption.option)}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <Checkbox
                                    checked={userVotes[post.id] === pollOption.option}
                                    className="pointer-events-none"
                                  />
                                  <span className="font-medium">{pollOption.option}</span>
                                </div>
                                {renderPollOptionVoters(post.id, pollOption)}
                              </div>
                              
                              {/* Progress bar */}
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${pollOption.percentage}%` }}
                                />
                              </div>
                              
                              {/* Percentage */}
                              <div className="text-right mt-1">
                                <span className="text-sm font-medium text-blue-600">
                                  {pollOption.percentage.toFixed(1)}%
                                </span>
                              </div>
                            </div>
                          ))}
                          
                          {/* Total votes */}
                          {pollData[post.id].totalVotes !== undefined && (
                            <div className="text-center pt-2 border-t border-gray-200">
                              <span className="text-sm text-muted-foreground">
                                {pollData[post.id].totalVotes} total vote{pollData[post.id].totalVotes !== 1 ? 's' : ''}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {(post.media_urls && post.media_urls.length > 0) && (
                      <MediaGallery 
                        mediaUrls={post.media_urls} 
                        onPhotoClick={handlePhotoClick}
                      />
                    )}
                    {(!post.media_urls || post.media_urls.length === 0) && post.image && (
                      <div className="mt-4">
                        <img
                          src={post.image}
                          alt="Post attachment"
                          className="rounded-md max-h-96 w-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => handlePhotoClick(post.image!, 0, [post.image!])}
                        />
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="flex items-center justify-evenly border-t pt-2 mt-2 gap-0 px-0">
                    {/* Like button with popover for all reactions */}
                    <Popover open={!!reactionPopoverOpen[post.id]} onOpenChange={open => handlePopoverOpen(post.id, open)}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`flex-1 flex items-center justify-center px-0 py-2 font-medium transition hover:bg-muted/50`}
                          onClick={() => {
                            if (userReactions[post.id]) {
                              handleRemoveReaction(post.id, userReactions[post.id]!);
                            } else {
                              handleAddReaction(post.id, 'like');
                            }
                          }}
                          onMouseEnter={() => handlePopoverOpen(post.id, true)}
                          onMouseLeave={() => handlePopoverOpen(post.id, false)}
                          type="button"
                        >
                          <div className={`inline-flex items-center justify-center rounded-full min-w-[100px] max-w-[180px] w-auto ${userReactions[post.id] ? 'bg-primary text-primary-foreground' : 'bg-transparent'}`}>
                            <span className="text-xl mr-1">{REACTION_EMOJIS[userReactions[post.id] || 'like']}</span>
                            <span>{REACTION_NAMES[userReactions[post.id] || 'like']}</span>
                          </div>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent
                        side="top"
                        align="center"
                        className="flex gap-2 p-2 w-auto bg-white shadow-lg rounded-full border border-gray-200"
                        onMouseEnter={() => handlePopoverOpen(post.id, true)}
                        onMouseLeave={() => handlePopoverOpen(post.id, false)}
                      >
                        {REACTION_TYPES.map(type => (
                          <button
                            key={type}
                            className="text-2xl hover:scale-125 transition-transform px-2 py-1 focus:outline-none"
                            onClick={() => handleAddReaction(post.id, type)}
                            type="button"
                          >
                            {REACTION_EMOJIS[type]}
                          </button>
                        ))}
                      </PopoverContent>
                    </Popover>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="flex-1 flex items-center justify-center px-0 py-2 rounded-none font-medium transition hover:bg-muted/50"
                      onClick={() => toggleComments(post.id)}
                    >
                      <MessageCircle className="h-4 w-4 mr-1" />
                      {commentsVisible[post.id] ? 'Hide Comments' : 'Comment'}
                    </Button>
                    <Button variant="ghost" size="sm" className="flex-1 flex items-center justify-center px-0 py-2 rounded-none font-medium transition hover:bg-muted/50">
                      <Share2 className="h-4 w-4 mr-1" />
                      Share
                    </Button>
                  </CardFooter>
                  
                  {/* Reaction summary and comment count row */}
                  <div className="px-6 pb-3">
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <button
                          className="hover:text-foreground transition-colors"
                          onClick={() => openReactionDialog(post)}
                        >
                          {getTopReactions(post.reactions).length > 0 && (
                            <span className="flex items-center gap-1">
                              {getTopReactions(post.reactions).slice(0, 3).map((reaction, idx) => (
                                <span key={idx} className="text-lg">{REACTION_EMOJIS[reaction]}</span>
                              ))}
                              <span>{post.reactions.length} reactions</span>
                            </span>
                          )}
                        </button>
                      </div>
                      <button
                        className="hover:text-foreground transition-colors"
                        onClick={() => toggleComments(post.id)}
                      >
                        {post.comments.length} comment{post.comments.length !== 1 ? 's' : ''}
                      </button>
                    </div>
                  </div>
                  
                  {/* Comments section */}
                  {commentsVisible[post.id] && (
                    <div className="px-6 pb-4 border-t border-gray-100">
                      <div className="space-y-3 mt-3">
                        {post.comments.map((comment) => (
                          <div key={comment.id} className="flex gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={comment.author.avatar} alt={comment.author.name} />
                              <AvatarFallback>
                                {comment.author.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="bg-muted/50 rounded-lg px-3 py-2">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium text-sm">{comment.author.name}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {formatDate(comment.timestamp)}
                                  </span>
                                </div>
                                <p className="text-sm">{comment.content}</p>
                              </div>
                              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                <Popover open={!!commentReactionPopoverOpen[`${post.id}_${comment.id}`]} onOpenChange={open => handleCommentReactionPopoverOpen(post.id, comment.id, open)}>
                                  <PopoverTrigger asChild>
                                    <button className="hover:text-foreground transition-colors">
                                      {REACTION_EMOJIS[userCommentReactions[`${post.id}_${comment.id}`] || 'like']}
                                    </button>
                                  </PopoverTrigger>
                                  <PopoverContent
                                    side="top"
                                    align="center"
                                    className="flex gap-2 p-2 w-auto bg-white shadow-lg rounded-full border border-gray-200"
                                    onMouseEnter={() => handleCommentReactionPopoverOpen(post.id, comment.id, true)}
                                    onMouseLeave={() => handleCommentReactionPopoverOpen(post.id, comment.id, false)}
                                  >
                                    {REACTION_TYPES.map(type => (
                                      <button
                                        key={type}
                                        className="text-2xl hover:scale-125 transition-transform px-2 py-1 focus:outline-none"
                                        onClick={async () => {
                                          const key = `${post.id}_${comment.id}`;
                                          const currentReaction = userCommentReactions[key];
                                          if (currentReaction === type) {
                                            // Remove reaction
                                            await handleRemoveCommentReaction(post.id, comment.id, type);
                                          } else if (currentReaction) {
                                            // Replace reaction
                                            await feedApi.removeReactionFromCommentWithQuery(Number(post.id), Number(comment.id), user.id, userCommentReactions[key]!);
                                            // Update state to remove old reaction
                                            setPosts(prevPosts => prevPosts.map(p => {
                                              if (String(p.id) !== String(post.id)) return p;
                                              return {
                                                ...p,
                                                comments: p.comments.map(c => {
                                                  if (String(c.id) !== String(comment.id)) return c;
                                                  const newReactions = (c.reactions || []).filter(r => r.reactionType !== userCommentReactions[key] || Number(r.userId) !== Number(user.id));
                                                  return { ...c, reactions: newReactions };
                                                })
                                              };
                                            }));
                                            setUserCommentReactions(prev => ({ ...prev, [key]: null }));
                                            // Add new reaction and update state
                                            await handleAddCommentReaction(post.id, comment.id, type);
                                          } else {
                                            // Add new reaction
                                            await handleAddCommentReaction(post.id, comment.id, type);
                                          }
                                        }}
                                        type="button"
                                      >
                                        {REACTION_EMOJIS[type]}
                                      </button>
                                    ))}
                                  </PopoverContent>
                                </Popover>
                                <button className="hover:text-foreground">Reply</button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Add comment */}
                  <div className="flex gap-3 w-full mt-4 px-4 pb-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user?.avatar} alt={user?.name} />
                      <AvatarFallback>
                        {user?.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <Textarea
                      placeholder="Write a comment..."
                      value={newComments[post.id] || ""}
                      onChange={(e) => setNewComments((prev) => ({ ...prev, [post.id]: e.target.value }))}
                      className="flex-1 resize-none rounded-lg bg-white/80 border border-gray-200 px-3 py-2"
                      rows={1}
                    />
                    <Button
                      onClick={() => handleAddComment(post.id)}
                      disabled={!newComments[post.id]?.trim()}
                      className="rounded-lg px-4 py-2"
                    >
                      Comment
                    </Button>
                  </div>
                </Card>
              ))
            )}
            
            {/* Load More Button for Polls */}
            {activeTab === "polls" && hasNextPage && (
              <div className="flex justify-center mt-6">
                <Button 
                  onClick={loadMorePosts} 
                  disabled={loadingMore}
                  variant="outline"
                  className="backdrop-blur-sm bg-card/50 border-border/50"
                >
                  {loadingMore && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Load More Polls
                </Button>
              </div>
            )}
          </div>
        </TabsContent>
        
        {/* Highlights Tab */}
        <TabsContent value="highlights">
          {/* Create Highlight Post */}
          <Card className="mb-6 backdrop-blur-sm bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Create Highlight Post</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Avatar>
                  <AvatarImage src={user?.avatar} alt={user?.name} />
                  <AvatarFallback>
                    {user?.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <Textarea
                    placeholder="Share highlights, milestones, or important updates..."
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    className="mb-4 backdrop-blur-sm bg-background/50"
                    disabled={creatingPost}
                  />
                  
                  {/* File upload section for highlights */}
                  <div className="mb-4">
                    {/* File input */}
                    <div className="flex items-center gap-2 mb-3">
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                        disabled={creatingPost}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="cursor-pointer"
                        disabled={creatingPost}
                        onClick={triggerFileInput}
                      >
                        <Image className="h-4 w-4 mr-2" />
                        Add Images
                      </Button>
                      {selectedFiles.length > 0 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={clearAllFiles}
                          disabled={creatingPost}
                        >
                          <X className="h-4 w-4 mr-2" />
                          Clear All
                        </Button>
                      )}
                    </div>

                    {/* File previews */}
                    {filePreviewUrls.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                        {filePreviewUrls.map((url, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={url}
                              alt={`Preview ${index + 1}`}
                              className="w-full h-24 object-cover rounded-md"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => removeFile(index)}
                              disabled={creatingPost}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="text-sm text-muted-foreground">
                      {selectedFiles.length > 0 && `${selectedFiles.length} image(s) selected`}
                    </div>
                    <Button 
                      onClick={handleCreateHighlightPost} 
                      disabled={creatingPost || (!newPostContent.trim() && selectedFiles.length === 0)}
                    >
                      {creatingPost && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Create Highlight Post
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            {getFilteredPosts().length === 0 ? (
              <Card className="backdrop-blur-sm bg-card/50 border-border/50">
                <CardContent className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <Star className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No highlights yet.</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              getFilteredPosts().map((post) => (
                <Card key={post.id} className="backdrop-blur-sm bg-card/50 border-border/50">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-4">
                        <Avatar>
                          <AvatarImage src={post.author.avatar} alt={post.author.name} />
                          <AvatarFallback>
                            {post.author.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-base">
                            {post.author.name}
                            <Badge variant="outline" className="ml-2 px-2 py-0">
                              <span className="flex items-center gap-1">
                                {getPostTypeIcon(post.type)}
                                {post.type.charAt(0).toUpperCase() + post.type.slice(1)}
                              </span>
                            </Badge>
                          </CardTitle>
                          <CardDescription>{formatDate(post.timestamp)}</CardDescription>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-3">
                    <p className="whitespace-pre-line">{post.content}</p>
                    
                    {(post.media_urls && post.media_urls.length > 0) && (
                      <MediaGallery 
                        mediaUrls={post.media_urls} 
                        onPhotoClick={handlePhotoClick}
                      />
                    )}
                    {(!post.media_urls || post.media_urls.length === 0) && post.image && (
                      <div className="mt-4">
                        <img
                          src={post.image}
                          alt="Post attachment"
                          className="rounded-md max-h-96 w-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => handlePhotoClick(post.image!, 0, [post.image!])}
                        />
                      </div>
                    )}
                    
                    <div className="mt-4 p-4 bg-pink-50 backdrop-blur-sm rounded-md">
                      <div className="flex items-center gap-3">
                        <Cake className="h-8 w-8 text-pink-500" />
                        <div>
                          <h3 className="font-medium">Happy Birthday! 🎉</h3>
                          <p className="text-sm text-muted-foreground">
                            Celebrate with the team
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex items-center justify-evenly border-t pt-2 mt-2 gap-0 px-0">
                    {/* Like button with popover for all reactions */}
                    <Popover open={!!reactionPopoverOpen[post.id]} onOpenChange={open => handlePopoverOpen(post.id, open)}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`flex-1 flex items-center justify-center px-0 py-2 font-medium transition hover:bg-muted/50`}
                          onClick={() => {
                            if (userReactions[post.id]) {
                              handleRemoveReaction(post.id, userReactions[post.id]!);
                            } else {
                              handleAddReaction(post.id, 'like');
                            }
                          }}
                          onMouseEnter={() => handlePopoverOpen(post.id, true)}
                          onMouseLeave={() => handlePopoverOpen(post.id, false)}
                          type="button"
                        >
                          <div className={`inline-flex items-center justify-center rounded-full min-w-[100px] max-w-[180px] w-auto ${userReactions[post.id] ? 'bg-primary text-primary-foreground' : 'bg-transparent'}`}>
                            <span className="text-xl mr-1">{REACTION_EMOJIS[userReactions[post.id] || 'like']}</span>
                            <span>{REACTION_NAMES[userReactions[post.id] || 'like']}</span>
                          </div>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-2">
                        <div className="flex gap-1">
                          {REACTION_TYPES.map((type) => (
                            <button
                              key={type}
                              className="hover:scale-125 transition-transform p-1 rounded"
                              onClick={async () => {
                                const currentReaction = userReactions[post.id];
                                if (currentReaction === type) {
                                  await handleRemoveReaction(post.id, type);
                                } else {
                                  if (currentReaction) {
                                    await handleRemoveReaction(post.id, currentReaction);
                                  }
                                  await handleAddReaction(post.id, type);
                                }
                                handlePopoverOpen(post.id, false);
                              }}
                              type="button"
                            >
                              {REACTION_EMOJIS[type]}
                            </button>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1 flex items-center justify-center px-0 py-2 font-medium transition hover:bg-muted/50"
                      onClick={() => toggleComments(post.id)}
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      {post.comments.length} Comments
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1 flex items-center justify-center px-0 py-2 font-medium transition hover:bg-muted/50"
                    >
                      <Share2 className="h-4 w-4 mr-2" />
                      Share
                    </Button>
                  </CardFooter>
                  
                  {/* Comments section */}
                  {commentsVisible[post.id] && (
                    <div className="border-t pt-4">
                      <div className="space-y-4 px-4">
                        {post.comments.map((comment) => (
                          <div key={comment.id} className="flex gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={comment.author.avatar} alt={comment.author.name} />
                              <AvatarFallback>
                                {comment.author.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="bg-muted/50 rounded-lg p-3">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium text-sm">{comment.author.name}</span>
                                  <span className="text-xs text-muted-foreground">{formatDate(comment.timestamp)}</span>
                                </div>
                                <p className="text-sm">{comment.content}</p>
                              </div>
                              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                <Popover open={!!commentReactionPopoverOpen[`${post.id}_${comment.id}`]} onOpenChange={open => handleCommentReactionPopoverOpen(post.id, comment.id, open)}>
                                  <PopoverTrigger asChild>
                                    <button className="hover:text-foreground flex items-center gap-1">
                                      <span className="text-lg">{REACTION_EMOJIS[userCommentReactions[`${post.id}_${comment.id}`] || 'like']}</span>
                                      <span>{REACTION_NAMES[userCommentReactions[`${post.id}_${comment.id}`] || 'like']}</span>
                                    </button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-2">
                                    <div className="flex gap-1">
                                      {REACTION_TYPES.map((type) => (
                                        <button
                                          key={type}
                                          className="hover:scale-125 transition-transform p-1 rounded"
                                          onClick={async () => {
                                            const key = `${post.id}_${comment.id}`;
                                            const currentReaction = userCommentReactions[key];
                                            if (currentReaction === type) {
                                              await handleRemoveCommentReaction(post.id, comment.id, type);
                                            } else {
                                              if (currentReaction) {
                                                await handleRemoveCommentReaction(post.id, comment.id, currentReaction);
                                              }
                                              await handleAddCommentReaction(post.id, comment.id, type);
                                            }
                                            handleCommentReactionPopoverOpen(post.id, comment.id, false);
                                          }}
                                          type="button"
                                        >
                                          {REACTION_EMOJIS[type]}
                                        </button>
                                      ))}
                                    </div>
                                  </PopoverContent>
                                </Popover>
                                <button className="hover:text-foreground">Reply</button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Add comment */}
                  <div className="flex gap-3 w-full mt-4 px-4 pb-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user?.avatar} alt={user?.name} />
                      <AvatarFallback>
                        {user?.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <Textarea
                      placeholder="Write a comment..."
                      value={newComments[post.id] || ""}
                      onChange={(e) => setNewComments((prev) => ({ ...prev, [post.id]: e.target.value }))}
                      className="flex-1 resize-none rounded-lg bg-white/80 border border-gray-200 px-3 py-2"
                      rows={1}
                    />
                    <Button
                      onClick={() => handleAddComment(post.id)}
                      disabled={!newComments[post.id]?.trim()}
                      className="rounded-lg px-4 py-2"
                    >
                      Comment
                    </Button>
                  </div>
                </Card>
              ))
            )}
            
            {/* Load More Button for Highlights */}
            {activeTab === "highlights" && hasNextPage && (
              <div className="flex justify-center mt-6">
                <Button 
                  onClick={loadMorePosts} 
                  disabled={loadingMore}
                  variant="outline"
                  className="backdrop-blur-sm bg-card/50 border-border/50"
                >
                  {loadingMore && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Load More Highlights
                </Button>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Reaction dialog/modal */}
      <Dialog open={reactionDialogOpen} onOpenChange={setReactionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reactions</DialogTitle>
          </DialogHeader>
          {reactionDialogPost && (
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {reactionDialogPost.reactions.map((r, idx) => {
                const u = reactorUsers[r.userId];
                return (
                  <div key={idx} className="flex items-center gap-3 p-2 rounded hover:bg-muted/50">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={u?.avatar} alt={u?.name} />
                      <AvatarFallback>{u?.name?.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="font-medium text-sm">{u?.name || 'Unknown User'}</div>
                    </div>
                    <span className="text-2xl">{REACTION_EMOJIS[r.reactionType]}</span>
                  </div>
                );
              })}
              {reactorLoading && <div className="text-center py-4">Loading...</div>}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Voter modal */}
      <Dialog open={voterModalOpen} onOpenChange={setVoterModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Voters for "{selectedPollOption?.option}"
            </DialogTitle>
          </DialogHeader>
          {selectedPollOption && (
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {selectedPollOption.voters.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  No voters yet for this option.
                </div>
              ) : (
                selectedPollOption.voters.map((voter, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-2 rounded hover:bg-muted/50">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={voter.avatar} alt={voter.name} />
                      <AvatarFallback>
                        {voter.name?.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="font-medium text-sm">{voter.name}</div>
                      <div className="text-xs text-muted-foreground">{voter.email}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Poll Dialog */}
      <Dialog open={createPollDialogOpen} onOpenChange={setCreatePollDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Poll</DialogTitle>
            <DialogDescription>
              Create a poll to gather team feedback and opinions.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Poll Question */}
            <div className="space-y-2">
              <Label htmlFor="poll-question">Poll Question</Label>
              <Textarea
                id="poll-question"
                placeholder="What would you like to ask?"
                value={pollQuestion}
                onChange={(e) => setPollQuestion(e.target.value)}
                className="min-h-[80px]"
              />
            </div>

            {/* Poll Options */}
            <div className="space-y-2">
              <Label>Poll Options</Label>
              <div className="space-y-2">
                {pollOptions.map((option, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder={`Option ${index + 1}`}
                      value={option}
                      onChange={(e) => updatePollOption(index, e.target.value)}
                      className="flex-1"
                    />
                    {pollOptions.length > 2 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removePollOption(index)}
                        className="px-2"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addPollOption}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Option
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCreatePollDialogOpen(false);
                setPollQuestion("");
                setPollOptions(["", ""]);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreatePoll}
              disabled={creatingPoll || !pollQuestion.trim() || pollOptions.some(option => !option.trim())}
            >
              {creatingPoll && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Poll
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Post</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this post? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCancelDelete}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
            >
              {isDeleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete Post
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Photo Modal */}
      <Dialog open={photoModalOpen} onOpenChange={setPhotoModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0 bg-black/95 overflow-hidden">
          <div className="relative w-full h-full flex items-center justify-center min-h-0">
            {/* Close button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClosePhotoModal}
              className="absolute top-4 right-4 z-10 bg-black/50 text-white hover:bg-black/70"
            >
              <X className="h-6 w-6" />
            </Button>

            {/* Previous button */}
            {selectedPhotoIndex > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePreviousPhoto}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 bg-black/50 text-white hover:bg-black/70"
              >
                <ChevronLeft className="h-8 w-8" />
              </Button>
            )}

            {/* Next button */}
            {selectedPhotoIndex < photoUrls.length - 1 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleNextPhoto}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 bg-black/50 text-white hover:bg-black/70"
              >
                <ChevronRight className="h-8 w-8" />
              </Button>
            )}

            {/* Photo */}
            {selectedPhoto && (
              <div className="flex items-center justify-center w-full h-full p-4 min-h-0">
                <img
                  src={selectedPhoto}
                  alt="Enlarged photo"
                  className="max-w-full max-h-full object-contain w-auto h-auto"
                  style={{ maxHeight: 'calc(90vh - 8rem)' }}
                />
              </div>
            )}

            {/* Photo counter */}
            {photoUrls.length > 1 && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                {selectedPhotoIndex + 1} / {photoUrls.length}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SocialFeed;
