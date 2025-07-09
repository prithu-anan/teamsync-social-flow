import { useState, useEffect } from "react";
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
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/use-toast";
import * as feedApi from "@/utils/api/feed-api";
import * as eventsApi from "@/utils/api/events-api";
import * as usersApi from "@/utils/api/users-api";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

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

interface Post {
  id: string;
  content: string;
  author: {
    name: string;
    avatar: string;
  };
  timestamp: string;
  likes: number;
  comments: PostComment[];
  image?: string;
  type: "post" | "event" | "birthday" | "achievement";
  eventDate?: string;
  eventTitle?: string;
  reactions: { id: string; userId: number; reactionType: string; createdAt: string }[];
}

interface User {
  id: number;
  name: string;
  email: string;
  avatar?: string;
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
  const [newComments, setNewComments] = useState<Record<string, string>>({});
  const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [creatingPost, setCreatingPost] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
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

  // Load posts on component mount
  useEffect(() => {
    loadPosts();
  }, []);

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

  const loadPosts = async () => {
    setLoading(true);
    try {
      const response = await feedApi.getFeedPosts();
      if (response.error) {
        toast({
          title: "Error",
          description: response.error,
          variant: "destructive",
        });
        return;
      }

      const feedPosts = response.data || [];

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
          timestamp: post.created_at || post.timestamp,
          likes: reactionsData.filter((r: any) => r.reactionType === "like").length,
          comments,
          image: post.media_urls?.[0] || post.image,
          type: post.type || "post",
          eventDate: post.event_date,
          eventTitle: post.event_title,
          reactions: reactionsData,
        };
      });

      setPosts(transformedPosts);
      setUserReactions(newUserReactions);

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
    if (!newPostContent.trim()) return;

    setCreatingPost(true);
    try {
      const response = await feedApi.createFeedPost({
        content: newPostContent,
        type: "text",
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
      case "event":
        return <Calendar className="h-4 w-4 text-blue-500" />;
      case "birthday":
        return <Cake className="h-4 w-4 text-pink-500" />;
      case "achievement":
        return <Award className="h-4 w-4 text-amber-500" />;
      default:
        return null;
    }
  };

  // Filter posts based on active tab
  const getFilteredPosts = () => {
    if (activeTab === "all") return posts;
    
    // Map tab values to post types
    const tabToTypeMap: Record<string, string> = {
      "events": "event",
      "birthdays": "birthday", 
      "appreciation": "appreciation"
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
      user_id: user.id,
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
      toast({ title: 'Reacted!', description: `You reacted with ${reactionType}.` });
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
      toast({ title: 'Reaction removed', description: `Your reaction was removed.` });
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
      user_id: user.id,
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
      toast({ title: 'Reacted!', description: `You reacted to a comment with ${reactionType}.` });
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
          toast({ title: 'Reaction removed', description: `Your reaction was removed from the comment.` });
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
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="birthdays">Birthdays</TabsTrigger>
          <TabsTrigger value="appreciation">Appreciation</TabsTrigger>
        </TabsList>
        <TabsContent value="all">
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
                  <div className="flex justify-end">
                    <Button onClick={handleCreatePost} disabled={creatingPost}>
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
                            {post.type !== "post" && (
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
                    </div>
                  </CardHeader>
                  <CardContent className="pb-3">
                    <p className="whitespace-pre-line">{post.content}</p>
                    
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
                    
                    {post.image && (
                      <div className="mt-4">
                        <img
                          src={post.image}
                          alt="Post attachment"
                          className="rounded-md max-h-96 w-full object-cover"
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
                    
                    {post.image && (
                      <div className="mt-4">
                        <img
                          src={post.image}
                          alt="Post attachment"
                          className="rounded-md max-h-96 w-full object-cover"
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
        
        <TabsContent value="birthdays">
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
          </div>
        </TabsContent>
        
        <TabsContent value="appreciation">
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
    </div>
  );
};

export default SocialFeed;
