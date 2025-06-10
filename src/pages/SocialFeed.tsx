import { useState } from "react";
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

// Interface definitions
interface PostComment {
  id: string;
  content: string;
  author: {
    name: string;
    avatar: string;
  };
  timestamp: string;
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
}

// Sample data
const initialPosts: Post[] = [
  {
    id: "1",
    content: "Just finished the new landing page design for our client. What do you think?",
    author: {
      name: "Jane Smith",
      avatar: "https://ui-avatars.com/api/?name=Jane+Smith&background=0D9488&color=fff",
    },
    timestamp: "2025-05-11T09:30:00",
    likes: 12,
    comments: [
      {
        id: "1-1",
        content: "Looks great! I love the color scheme.",
        author: {
          name: "John Doe",
          avatar: "https://ui-avatars.com/api/?name=John+Doe&background=0D8ABC&color=fff",
        },
        timestamp: "2025-05-11T09:45:00",
      },
      {
        id: "1-2",
        content: "The UI is so clean and intuitive!",
        author: {
          name: "Mike Johnson",
          avatar: "https://ui-avatars.com/api/?name=Mike+Johnson&background=8B5CF6&color=fff",
        },
        timestamp: "2025-05-11T10:15:00",
      },
    ],
    type: "post",
  },
  {
    id: "2",
    content: "Team, we hit our quarterly targets! 🎉 Great job everyone on achieving this milestone ahead of schedule.",
    author: {
      name: "Mike Johnson",
      avatar: "https://ui-avatars.com/api/?name=Mike+Johnson&background=8B5CF6&color=fff",
    },
    timestamp: "2025-05-10T16:20:00",
    likes: 24,
    comments: [
      {
        id: "2-1",
        content: "Amazing work team! 🚀",
        author: {
          name: "Jane Smith",
          avatar: "https://ui-avatars.com/api/?name=Jane+Smith&background=0D9488&color=fff",
        },
        timestamp: "2025-05-10T16:30:00",
      },
    ],
    type: "achievement",
  },
  {
    id: "3",
    content: "Don't forget about our team building event this Friday!",
    author: {
      name: "John Doe",
      avatar: "https://ui-avatars.com/api/?name=John+Doe&background=0D8ABC&color=fff",
    },
    timestamp: "2025-05-09T11:00:00",
    likes: 8,
    comments: [],
    type: "event",
    eventDate: "2025-05-15T15:00:00",
    eventTitle: "Team Building: Escape Room Challenge",
  },
  {
    id: "4",
    content: "Happy Birthday Sarah! 🎂",
    author: {
      name: "Jane Smith",
      avatar: "https://ui-avatars.com/api/?name=Jane+Smith&background=0D9488&color=fff",
    },
    timestamp: "2025-05-08T08:15:00",
    likes: 15,
    comments: [
      {
        id: "4-1",
        content: "Happy Birthday! 🎉",
        author: {
          name: "John Doe",
          avatar: "https://ui-avatars.com/api/?name=John+Doe&background=0D8ABC&color=fff",
        },
        timestamp: "2025-05-08T08:30:00",
      },
      {
        id: "4-2",
        content: "Have a great day! 🎂",
        author: {
          name: "Mike Johnson",
          avatar: "https://ui-avatars.com/api/?name=Mike+Johnson&background=8B5CF6&color=fff",
        },
        timestamp: "2025-05-08T09:00:00",
      },
    ],
    type: "birthday",
  },
];

const SocialFeed = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [newPostContent, setNewPostContent] = useState("");
  const [newComments, setNewComments] = useState<Record<string, string>>({});
  const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>({});

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
  const handleCreatePost = () => {
    if (!newPostContent.trim()) return;

    const newPost: Post = {
      id: (posts.length + 1).toString(),
      content: newPostContent,
      author: {
        name: user?.name || "Anonymous",
        avatar: user?.avatar || "",
      },
      timestamp: new Date().toISOString(),
      likes: 0,
      comments: [],
      type: "post",
    };

    setPosts([newPost, ...posts]);
    setNewPostContent("");
    toast({
      title: "Post created",
      description: "Your post has been published successfully",
    });
  };

  // Handle adding a comment
  const handleAddComment = (postId: string) => {
    if (!newComments[postId]?.trim()) return;

    const updatedPosts = posts.map((post) => {
      if (post.id === postId) {
        const newComment: PostComment = {
          id: `${postId}-${post.comments.length + 1}`,
          content: newComments[postId],
          author: {
            name: user?.name || "Anonymous",
            avatar: user?.avatar || "",
          },
          timestamp: new Date().toISOString(),
        };
        return {
          ...post,
          comments: [...post.comments, newComment],
        };
      }
      return post;
    });

    setPosts(updatedPosts);
    setNewComments((prev) => ({ ...prev, [postId]: "" }));
  };

  // Handle liking a post
  const handleLikePost = (postId: string) => {
    if (likedPosts[postId]) return;

    const updatedPosts = posts.map((post) => {
      if (post.id === postId) {
        return {
          ...post,
          likes: post.likes + 1,
        };
      }
      return post;
    });

    setPosts(updatedPosts);
    setLikedPosts((prev) => ({ ...prev, [postId]: true }));
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
      <Tabs defaultValue="all" className="mb-8">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="birthdays">Birthdays</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
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
                  />
                  <div className="flex justify-end">
                    <Button onClick={handleCreatePost}>Post</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Post list */}
          <div className="space-y-6">
            {posts.map((post) => (
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
                <CardFooter className="flex flex-col border-t pt-3">
                  <div className="flex justify-between items-center w-full mb-3">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <ThumbsUp className="h-4 w-4" />
                      <span>{post.likes}</span>
                    </div>
                    <div className="text-muted-foreground text-sm">
                      {post.comments.length} comments
                    </div>
                  </div>
                  <div className="flex justify-between w-full border-t pt-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleLikePost(post.id)}
                    >
                      <ThumbsUp className={`h-4 w-4 mr-2 ${likedPosts[post.id] ? 'text-teamsync-600 fill-teamsync-600' : ''}`} />
                      Like
                    </Button>
                    <Button variant="ghost" size="sm" className="flex-1">
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Comment
                    </Button>
                    <Button variant="ghost" size="sm" className="flex-1">
                      <Share2 className="h-4 w-4 mr-2" />
                      Share
                    </Button>
                  </div>
                  
                  {/* Comments */}
                  {post.comments.length > 0 && (
                    <div className="w-full mt-4 space-y-3">
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
                            <div className="bg-muted/50 backdrop-blur-sm p-3 rounded-lg">
                              <div className="font-medium text-sm">{comment.author.name}</div>
                              <p className="text-sm">{comment.content}</p>
                            </div>
                            <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                              <span>{formatDate(comment.timestamp)}</span>
                              <button className="hover:text-foreground">Like</button>
                              <button className="hover:text-foreground">Reply</button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Add comment */}
                  <div className="flex gap-3 w-full mt-4">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user?.avatar} alt={user?.name} />
                      <AvatarFallback>
                        {user?.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 flex gap-2">
                      <Textarea
                        placeholder="Write a comment..."
                        value={newComments[post.id] || ''}
                        onChange={(e) =>
                          setNewComments((prev) => ({
                            ...prev,
                            [post.id]: e.target.value,
                          }))
                        }
                        className="flex-1 backdrop-blur-sm bg-background/50"
                      />
                      <Button size="sm" onClick={() => handleAddComment(post.id)}>
                        Comment
                      </Button>
                    </div>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="events">
          <div className="space-y-6">
            {posts
              .filter((post) => post.type === "event")
              .map((post) => (
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
                  <CardFooter className="flex flex-col border-t pt-3">
                    <div className="flex justify-between items-center w-full mb-3">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <ThumbsUp className="h-4 w-4" />
                        <span>{post.likes}</span>
                      </div>
                      <div className="text-muted-foreground text-sm">
                        {post.comments.length} comments
                      </div>
                    </div>
                    <div className="flex justify-between w-full border-t pt-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleLikePost(post.id)}
                      >
                        <ThumbsUp className={`h-4 w-4 mr-2 ${likedPosts[post.id] ? 'text-teamsync-600 fill-teamsync-600' : ''}`} />
                        Like
                      </Button>
                      <Button variant="ghost" size="sm" className="flex-1">
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Comment
                      </Button>
                      <Button variant="ghost" size="sm" className="flex-1">
                        <Share2 className="h-4 w-4 mr-2" />
                        Share
                      </Button>
                    </div>
                    
                    {/* Comments */}
                    {post.comments.length > 0 && (
                      <div className="w-full mt-4 space-y-3">
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
                              <div className="bg-muted/50 backdrop-blur-sm p-3 rounded-lg">
                                <div className="font-medium text-sm">{comment.author.name}</div>
                                <p className="text-sm">{comment.content}</p>
                              </div>
                              <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                                <span>{formatDate(comment.timestamp)}</span>
                                <button className="hover:text-foreground">Like</button>
                                <button className="hover:text-foreground">Reply</button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Add comment */}
                    <div className="flex gap-3 w-full mt-4">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user?.avatar} alt={user?.name} />
                        <AvatarFallback>
                          {user?.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 flex gap-2">
                        <Textarea
                          placeholder="Write a comment..."
                          value={newComments[post.id] || ''}
                          onChange={(e) =>
                            setNewComments((prev) => ({
                              ...prev,
                              [post.id]: e.target.value,
                            }))
                          }
                          className="flex-1 backdrop-blur-sm bg-background/50"
                        />
                        <Button size="sm" onClick={() => handleAddComment(post.id)}>
                          Comment
                        </Button>
                      </div>
                    </div>
                  </CardFooter>
                </Card>
              ))}
          </div>
        </TabsContent>
        <TabsContent value="birthdays">
          <div className="space-y-6">
            {posts
              .filter((post) => post.type === "birthday")
              .map((post) => (
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
                  <CardFooter className="flex flex-col border-t pt-3">
                    <div className="flex justify-between items-center w-full mb-3">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <ThumbsUp className="h-4 w-4" />
                        <span>{post.likes}</span>
                      </div>
                      <div className="text-muted-foreground text-sm">
                        {post.comments.length} comments
                      </div>
                    </div>
                    <div className="flex justify-between w-full border-t pt-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleLikePost(post.id)}
                      >
                        <ThumbsUp className={`h-4 w-4 mr-2 ${likedPosts[post.id] ? 'text-teamsync-600 fill-teamsync-600' : ''}`} />
                        Like
                      </Button>
                      <Button variant="ghost" size="sm" className="flex-1">
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Comment
                      </Button>
                      <Button variant="ghost" size="sm" className="flex-1">
                        <Share2 className="h-4 w-4 mr-2" />
                        Share
                      </Button>
                    </div>
                    
                    {/* Comments */}
                    {post.comments.length > 0 && (
                      <div className="w-full mt-4 space-y-3">
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
                              <div className="bg-muted/50 backdrop-blur-sm p-3 rounded-lg">
                                <div className="font-medium text-sm">{comment.author.name}</div>
                                <p className="text-sm">{comment.content}</p>
                              </div>
                              <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                                <span>{formatDate(comment.timestamp)}</span>
                                <button className="hover:text-foreground">Like</button>
                                <button className="hover:text-foreground">Reply</button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Add comment */}
                    <div className="flex gap-3 w-full mt-4">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user?.avatar} alt={user?.name} />
                        <AvatarFallback>
                          {user?.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 flex gap-2">
                        <Textarea
                          placeholder="Write a comment..."
                          value={newComments[post.id] || ''}
                          onChange={(e) =>
                            setNewComments((prev) => ({
                              ...prev,
                              [post.id]: e.target.value,
                            }))
                          }
                          className="flex-1 backdrop-blur-sm bg-background/50"
                        />
                        <Button size="sm" onClick={() => handleAddComment(post.id)}>
                          Comment
                        </Button>
                      </div>
                    </div>
                  </CardFooter>
                </Card>
              ))}
          </div>
        </TabsContent>
        <TabsContent value="achievements">
          <div className="space-y-6">
            {posts
              .filter((post) => post.type === "achievement")
              .map((post) => (
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
                  <CardFooter className="flex flex-col border-t pt-3">
                    <div className="flex justify-between items-center w-full mb-3">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <ThumbsUp className="h-4 w-4" />
                        <span>{post.likes}</span>
                      </div>
                      <div className="text-muted-foreground text-sm">
                        {post.comments.length} comments
                      </div>
                    </div>
                    <div className="flex justify-between w-full border-t pt-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleLikePost(post.id)}
                      >
                        <ThumbsUp className={`h-4 w-4 mr-2 ${likedPosts[post.id] ? 'text-teamsync-600 fill-teamsync-600' : ''}`} />
                        Like
                      </Button>
                      <Button variant="ghost" size="sm" className="flex-1">
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Comment
                      </Button>
                      <Button variant="ghost" size="sm" className="flex-1">
                        <Share2 className="h-4 w-4 mr-2" />
                        Share
                      </Button>
                    </div>
                    
                    {/* Comments */}
                    {post.comments.length > 0 && (
                      <div className="w-full mt-4 space-y-3">
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
                              <div className="bg-muted/50 backdrop-blur-sm p-3 rounded-lg">
                                <div className="font-medium text-sm">{comment.author.name}</div>
                                <p className="text-sm">{comment.content}</p>
                              </div>
                              <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                                <span>{formatDate(comment.timestamp)}</span>
                                <button className="hover:text-foreground">Like</button>
                                <button className="hover:text-foreground">Reply</button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Add comment */}
                    <div className="flex gap-3 w-full mt-4">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user?.avatar} alt={user?.name} />
                        <AvatarFallback>
                          {user?.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 flex gap-2">
                        <Textarea
                          placeholder="Write a comment..."
                          value={newComments[post.id] || ''}
                          onChange={(e) =>
                            setNewComments((prev) => ({
                              ...prev,
                              [post.id]: e.target.value,
                            }))
                          }
                          className="flex-1 backdrop-blur-sm bg-background/50"
                        />
                        <Button size="sm" onClick={() => handleAddComment(post.id)}>
                          Comment
                        </Button>
                      </div>
                    </div>
                  </CardFooter>
                </Card>
              ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SocialFeed;
