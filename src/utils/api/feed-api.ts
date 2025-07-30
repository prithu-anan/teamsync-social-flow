import axios from 'axios';
import { API_BASE_URL, getAuthHeaders } from './api-config';

// Type definitions for better type safety
interface FeedPostRequest {
    content: string;
    type?: string;
    event_date?: string;
    poll_options?: string[];
    author_id?: number;
}

interface FeedPostWithFilesRequest extends FeedPostRequest {
    files?: File[];
}

interface CommentRequest {
    content: string;
    post_id?: string | number;
}

interface ReplyRequest {
    content: string;
}

type ReactionRequest = {
    type?: string;
    user_id?: number;
    reaction_type?: string;
};

export const createFeedPost = async (req: FeedPostWithFilesRequest) => {
    const token = localStorage.getItem("teamsync_jwt");

    try {
        // Create FormData for multipart/form-data
        const formData = new FormData();
        
        // Build feed post data based on post type
        const feedPostData: any = {
            type: req.type,
            content: req.content,
        };

        // Add event_date only for event posts
        if (req.type === "event" && req.event_date) {
            feedPostData.event_date = req.event_date;
        }

        // Add poll_options only for poll posts
        if (req.type === "poll" && req.poll_options) {
            feedPostData.poll_options = req.poll_options;
        }
        
        formData.append('feedPost', new Blob([JSON.stringify(feedPostData)], { type: 'application/json' }));
        
        // Add files if provided
        if (req.files && req.files.length > 0) {
            req.files.forEach((file) => {
                formData.append('files', file);
            });
        }

        const options = {
            method: 'POST',
            url: `${API_BASE_URL}/feedposts`,
            headers: {
                authorization: `Bearer ${token}`,
                // 'content-type': 'multipart/form-data; boundary=---011000010111000001101001'
            },
            data: formData
        };

        const res = await axios.request(options);

        if (res.status === 200 || res.status === 201) {
            return res.data;
        }
    } catch (err) {
        if (err.response) {
            return { error: err.response.data || "Failed to create feed post" };
        } else if (err.request) {
            return { error: "No response from server. Check your connection." };
        } else {
            return { error: "An unexpected error occurred." };
        }
    }
}

// Helper function for creating feed posts without files (backward compatibility)
export const createFeedPostWithoutFiles = async (req: FeedPostRequest) => {
    return createFeedPost({ ...req, files: undefined });
}

export const getFeedPosts = async (page: number = 1, limit: number = 20, type?: string) => {
    const token = localStorage.getItem("teamsync_jwt");

    try {
        const params = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
        });
        
        if (type) {
            params.append("type", type);
        }

        const res = await axios.get(`${API_BASE_URL}/feedposts?${params.toString()}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (res.status === 200) {
            return res.data;
        }
    } catch (err) {
        if (err.response) {
            return { error: err.response.data || "Failed to fetch feed posts" };
        } else if (err.request) {
            return { error: "No response from server. Check your connection." };
        } else {
            return { error: "An unexpected error occurred." };
        }
    }
}

export const getFeedPostById = async (id: string | number) => {
    const token = localStorage.getItem("teamsync_jwt");

    try {
        const res = await axios.get(`${API_BASE_URL}/feedposts/${id}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (res.status === 200) {
            return res.data;
        }
    } catch (err) {
        if (err.response) {
            return { error: err.response.data || "Failed to fetch feed post" };
        } else if (err.request) {
            return { error: "No response from server. Check your connection." };
        } else {
            return { error: "An unexpected error occurred." };
        }
    }
}

export const updateFeedPost = async (id: string | number, req: FeedPostRequest) => {
    const token = localStorage.getItem("teamsync_jwt");

    try {
        const res = await axios.put(`${API_BASE_URL}/feedposts/${id}`, req, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (res.status === 200) {
            return res.data;
        }
    } catch (err) {
        if (err.response) {
            return { error: err.response.data || "Failed to update feed post" };
        } else if (err.request) {
            return { error: "No response from server. Check your connection." };
        } else {
            return { error: "An unexpected error occurred." };
        }
    }
}

export const deleteFeedPost = async (id: string | number) => {
    const token = localStorage.getItem("teamsync_jwt");

    try {
        const res = await axios.delete(`${API_BASE_URL}/feedposts/${id}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (res.status === 200) {
            return res.data;
        }
    } catch (err) {
        if (err.response) {
            return { error: err.response.data || "Failed to delete feed post" };
        } else if (err.request) {
            return { error: "No response from server. Check your connection." };
        } else {
            return { error: "An unexpected error occurred." };
        }
    }
}

// Comment CRUD operations
export const createComment = async (feedPostId: string | number, req: CommentRequest) => {
    const token = localStorage.getItem("teamsync_jwt");

    try {
        const requestBody = {
            ...req,
            post_id: feedPostId
        };
        
        const res = await axios.post(`${API_BASE_URL}/feedposts/${feedPostId}/comments`, requestBody, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (res.status === 200 || res.status === 201) {
            return res.data;
        }
    } catch (err) {
        if (err.response) {
            return { error: err.response.data || "Failed to create comment" };
        } else if (err.request) {
            return { error: "No response from server. Check your connection." };
        } else {
            return { error: "An unexpected error occurred." };
        }
    }
}

export const getFeedPostComments = async (feedPostId: string | number) => {
    const token = localStorage.getItem("teamsync_jwt");

    try {
        const res = await axios.get(`${API_BASE_URL}/feedposts/${feedPostId}/comments`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (res.status === 200) {
            return res.data;
        }
    } catch (err) {
        if (err.response) {
            return { error: err.response.data || "Failed to fetch comments" };
        } else if (err.request) {
            return { error: "No response from server. Check your connection." };
        } else {
            return { error: "An unexpected error occurred." };
        }
    }
}

export const getCommentById = async (feedPostId: string | number, commentId: string | number) => {
    const token = localStorage.getItem("teamsync_jwt");

    try {
        const res = await axios.get(`${API_BASE_URL}/feedposts/${feedPostId}/comments/${commentId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (res.status === 200) {
            return res.data;
        }
    } catch (err) {
        if (err.response) {
            return { error: err.response.data || "Failed to fetch comment" };
        } else if (err.request) {
            return { error: "No response from server. Check your connection." };
        } else {
            return { error: "An unexpected error occurred." };
        }
    }
}

export const updateComment = async (feedPostId: string | number, commentId: string | number, req: CommentRequest) => {
    const token = localStorage.getItem("teamsync_jwt");

    try {
        const res = await axios.put(`${API_BASE_URL}/feedposts/${feedPostId}/comments/${commentId}`, req, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (res.status === 200) {
            return res.data;
        }
    } catch (err) {
        if (err.response) {
            return { error: err.response.data || "Failed to update comment" };
        } else if (err.request) {
            return { error: "No response from server. Check your connection." };
        } else {
            return { error: "An unexpected error occurred." };
        }
    }
}

export const deleteComment = async (feedPostId: string | number, commentId: string | number) => {
    const token = localStorage.getItem("teamsync_jwt");

    try {
        const res = await axios.delete(`${API_BASE_URL}/feedposts/${feedPostId}/comments/${commentId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (res.status === 200) {
            return res.data;
        }
    } catch (err) {
        if (err.response) {
            return { error: err.response.data || "Failed to delete comment" };
        } else if (err.request) {
            return { error: "No response from server. Check your connection." };
        } else {
            return { error: "An unexpected error occurred." };
        }
    }
}

// Reply CRUD operations
export const addReplyToComment = async (feedPostId: string | number, commentId: string | number, req: ReplyRequest) => {
    const token = localStorage.getItem("teamsync_jwt");

    try {
        const res = await axios.post(`${API_BASE_URL}/feedposts/${feedPostId}/comments/${commentId}/replies`, req, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (res.status === 200 || res.status === 201) {
            return res.data;
        }
    } catch (err) {
        if (err.response) {
            return { error: err.response.data || "Failed to add reply" };
        } else if (err.request) {
            return { error: "No response from server. Check your connection." };
        } else {
            return { error: "An unexpected error occurred." };
        }
    }
}

export const getCommentReplies = async (feedPostId: string | number, commentId: string | number) => {
    const token = localStorage.getItem("teamsync_jwt");

    try {
        const res = await axios.get(`${API_BASE_URL}/feedposts/${feedPostId}/comments/${commentId}/replies`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (res.status === 200) {
            return res.data;
        }
    } catch (err) {
        if (err.response) {
            return { error: err.response.data || "Failed to fetch replies" };
        } else if (err.request) {
            return { error: "No response from server. Check your connection." };
        } else {
            return { error: "An unexpected error occurred." };
        }
    }
}

export const getReplyById = async (feedPostId: string | number, commentId: string | number, replyId: string | number) => {
    const token = localStorage.getItem("teamsync_jwt");

    try {
        const res = await axios.get(`${API_BASE_URL}/feedposts/${feedPostId}/comments/${commentId}/replies/${replyId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (res.status === 200) {
            return res.data;
        }
    } catch (err) {
        if (err.response) {
            return { error: err.response.data || "Failed to fetch reply" };
        } else if (err.request) {
            return { error: "No response from server. Check your connection." };
        } else {
            return { error: "An unexpected error occurred." };
        }
    }
}

export const updateReply = async (feedPostId: string | number, commentId: string | number, replyId: string | number, req: ReplyRequest) => {
    const token = localStorage.getItem("teamsync_jwt");

    try {
        const res = await axios.put(`${API_BASE_URL}/feedposts/${feedPostId}/comments/${commentId}/replies/${replyId}`, req, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (res.status === 200) {
            return res.data;
        }
    } catch (err) {
        if (err.response) {
            return { error: err.response.data || "Failed to update reply" };
        } else if (err.request) {
            return { error: "No response from server. Check your connection." };
        } else {
            return { error: "An unexpected error occurred." };
        }
    }
}

export const deleteReply = async (feedPostId: string | number, commentId: string | number, replyId: string | number) => {
    const token = localStorage.getItem("teamsync_jwt");

    try {
        const res = await axios.delete(`${API_BASE_URL}/feedposts/${feedPostId}/comments/${commentId}/replies/${replyId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (res.status === 200) {
            return res.data;
        }
    } catch (err) {
        if (err.response) {
            return { error: err.response.data || "Failed to delete reply" };
        } else if (err.request) {
            return { error: "No response from server. Check your connection." };
        } else {
            return { error: "An unexpected error occurred." };
        }
    }
}

// Reaction CRUD operations for feed posts
export const addReactionToFeedPost = async (feedPostId: string | number, req: ReactionRequest) => {
    const token = localStorage.getItem("teamsync_jwt");

    try {
        const res = await axios.post(`${API_BASE_URL}/feedposts/${feedPostId}/reactions`, req, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (res.status === 200 || res.status === 201) {
            return res.data;
        }
    } catch (err) {
        if (err.response) {
            return { error: err.response.data || "Failed to add reaction" };
        } else if (err.request) {
            return { error: "No response from server. Check your connection." };
        } else {
            return { error: "An unexpected error occurred." };
        }
    }
}

export const removeReactionFromFeedPost = async (feedPostId: string | number, reactionId: string | number) => {
    const token = localStorage.getItem("teamsync_jwt");

    try {
        const res = await axios.delete(`${API_BASE_URL}/feedposts/${feedPostId}/reactions/${reactionId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (res.status === 200) {
            return res.data;
        }
    } catch (err) {
        if (err.response) {
            return { error: err.response.data || "Failed to remove reaction" };
        } else if (err.request) {
            return { error: "No response from server. Check your connection." };
        } else {
            return { error: "An unexpected error occurred." };
        }
    }
}

export const getFeedPostReactions = async (feedPostId: string | number) => {
    const token = localStorage.getItem("teamsync_jwt");

    try {
        const res = await axios.get(`${API_BASE_URL}/feedposts/${feedPostId}/reactions`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (res.status === 200) {
            return res.data;
        }
    } catch (err) {
        if (err.response) {
            return { error: err.response.data || "Failed to fetch reactions" };
        } else if (err.request) {
            return { error: "No response from server. Check your connection." };
        } else {
            return { error: "An unexpected error occurred." };
        }
    }
}

export const getReactionById = async (feedPostId: string | number, reactionId: string | number) => {
    const token = localStorage.getItem("teamsync_jwt");

    try {
        const res = await axios.get(`${API_BASE_URL}/feedposts/${feedPostId}/reactions/${reactionId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (res.status === 200) {
            return res.data;
        }
    } catch (err) {
        if (err.response) {
            return { error: err.response.data || "Failed to fetch reaction" };
        } else if (err.request) {
            return { error: "No response from server. Check your connection." };
        } else {
            return { error: "An unexpected error occurred." };
        }
    }
}

export const updateReaction = async (feedPostId: string | number, reactionId: string | number, req: ReactionRequest) => {
    const token = localStorage.getItem("teamsync_jwt");

    try {
        const res = await axios.put(`${API_BASE_URL}/feedposts/${feedPostId}/reactions/${reactionId}`, req, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (res.status === 200) {
            return res.data;
        }
    } catch (err) {
        if (err.response) {
            return { error: err.response.data || "Failed to update reaction" };
        } else if (err.request) {
            return { error: "No response from server. Check your connection." };
        } else {
            return { error: "An unexpected error occurred." };
        }
    }
}

// Reaction CRUD operations for comments
export const addReactionToComment = async (feedPostId: string | number, commentId: string | number, req: ReactionRequest) => {
    const token = localStorage.getItem("teamsync_jwt");

    try {
        const res = await axios.post(`${API_BASE_URL}/feedposts/${feedPostId}/comments/${commentId}/reactions`, req, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (res.status === 200 || res.status === 201) {
            return res.data;
        }
    } catch (err) {
        if (err.response) {
            return { error: err.response.data || "Failed to add reaction to comment" };
        } else if (err.request) {
            return { error: "No response from server. Check your connection." };
        } else {
            return { error: "An unexpected error occurred." };
        }
    }
}

export const removeReactionFromComment = async (feedPostId: string | number, commentId: string | number, reactionId: string | number) => {
    const token = localStorage.getItem("teamsync_jwt");

    try {
        const res = await axios.delete(`${API_BASE_URL}/feedposts/${feedPostId}/comments/${commentId}/reactions/${reactionId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (res.status === 200) {
            return res.data;
        }
    } catch (err) {
        if (err.response) {
            return { error: err.response.data || "Failed to remove reaction from comment" };
        } else if (err.request) {
            return { error: "No response from server. Check your connection." };
        } else {
            return { error: "An unexpected error occurred." };
        }
    }
}

export const getCommentReactions = async (feedPostId: string | number, commentId: string | number) => {
    const token = localStorage.getItem("teamsync_jwt");

    try {
        const res = await axios.get(`${API_BASE_URL}/feedposts/${feedPostId}/comments/${commentId}/reactions`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (res.status === 200) {
            return res.data;
        }
    } catch (err) {
        if (err.response) {
            return { error: err.response.data || "Failed to fetch comment reactions" };
        } else if (err.request) {
            return { error: "No response from server. Check your connection." };
        } else {
            return { error: "An unexpected error occurred." };
        }
    }
}

export const getCommentReactionById = async (feedPostId: string | number, commentId: string | number, reactionId: string | number) => {
    const token = localStorage.getItem("teamsync_jwt");

    try {
        const res = await axios.get(`${API_BASE_URL}/feedposts/${feedPostId}/comments/${commentId}/reactions/${reactionId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (res.status === 200) {
            return res.data;
        }
    } catch (err) {
        if (err.response) {
            return { error: err.response.data || "Failed to fetch comment reaction" };
        } else if (err.request) {
            return { error: "No response from server. Check your connection." };
        } else {
            return { error: "An unexpected error occurred." };
        }
    }
}

export const updateCommentReaction = async (feedPostId: string | number, commentId: string | number, reactionId: string | number, req: ReactionRequest) => {
    const token = localStorage.getItem("teamsync_jwt");

    try {
        const res = await axios.put(`${API_BASE_URL}/feedposts/${feedPostId}/comments/${commentId}/reactions/${reactionId}`, req, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (res.status === 200) {
            return res.data;
        }
    } catch (err) {
        if (err.response) {
            return { error: err.response.data || "Failed to update comment reaction" };
        } else if (err.request) {
            return { error: "No response from server. Check your connection." };
        } else {
            return { error: "An unexpected error occurred." };
        }
    }
}

// Reaction CRUD operations for replies
export const addReactionToReply = async (feedPostId: string | number, commentId: string | number, replyId: string | number, req: ReactionRequest) => {
    const token = localStorage.getItem("teamsync_jwt");

    try {
        const res = await axios.post(`${API_BASE_URL}/feedposts/${feedPostId}/comments/${commentId}/replies/${replyId}/reactions`, req, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (res.status === 200 || res.status === 201) {
            return res.data;
        }
    } catch (err) {
        if (err.response) {
            return { error: err.response.data || "Failed to add reaction to reply" };
        } else if (err.request) {
            return { error: "No response from server. Check your connection." };
        } else {
            return { error: "An unexpected error occurred." };
        }
    }
}

export const removeReactionFromReply = async (feedPostId: string | number, commentId: string | number, replyId: string | number, reactionId: string | number) => {
    const token = localStorage.getItem("teamsync_jwt");

    try {
        const res = await axios.delete(`${API_BASE_URL}/feedposts/${feedPostId}/comments/${commentId}/replies/${replyId}/reactions/${reactionId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (res.status === 200) {
            return res.data;
        }
    } catch (err) {
        if (err.response) {
            return { error: err.response.data || "Failed to remove reaction from reply" };
        } else if (err.request) {
            return { error: "No response from server. Check your connection." };
        } else {
            return { error: "An unexpected error occurred." };
        }
    }
}

export const getReplyReactions = async (feedPostId: string | number, commentId: string | number, replyId: string | number) => {
    const token = localStorage.getItem("teamsync_jwt");

    try {
        const res = await axios.get(`${API_BASE_URL}/feedposts/${feedPostId}/comments/${commentId}/replies/${replyId}/reactions`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (res.status === 200) {
            return res.data;
        }
    } catch (err) {
        if (err.response) {
            return { error: err.response.data || "Failed to fetch reply reactions" };
        } else if (err.request) {
            return { error: "No response from server. Check your connection." };
        } else {
            return { error: "An unexpected error occurred." };
        }
    }
}

export const getReplyReactionById = async (feedPostId: string | number, commentId: string | number, replyId: string | number, reactionId: string | number) => {
    const token = localStorage.getItem("teamsync_jwt");

    try {
        const res = await axios.get(`${API_BASE_URL}/feedposts/${feedPostId}/comments/${commentId}/replies/${replyId}/reactions/${reactionId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (res.status === 200) {
            return res.data;
        }
    } catch (err) {
        if (err.response) {
            return { error: err.response.data || "Failed to fetch reply reaction" };
        } else if (err.request) {
            return { error: "No response from server. Check your connection." };
        } else {
            return { error: "An unexpected error occurred." };
        }
    }
}

export const updateReplyReaction = async (feedPostId: string | number, commentId: string | number, replyId: string | number, reactionId: string | number, req: ReactionRequest) => {
    const token = localStorage.getItem("teamsync_jwt");

    try {
        const res = await axios.put(`${API_BASE_URL}/feedposts/${feedPostId}/comments/${commentId}/replies/${replyId}/reactions/${reactionId}`, req, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (res.status === 200) {
            return res.data;
        }
    } catch (err) {
        if (err.response) {
            return { error: err.response.data || "Failed to update reply reaction" };
        } else if (err.request) {
            return { error: "No response from server. Check your connection." };
        } else {
            return { error: "An unexpected error occurred." };
        }
    }
}

// Add this new function for the DELETE with query params
export const removeReactionFromFeedPostWithQuery = async (feedPostId, userId, reactionType) => {
    const token = localStorage.getItem("teamsync_jwt");
    try {
        const res = await axios.delete(`${API_BASE_URL}/feedposts/${feedPostId}/reactions?user_id=${userId}&reaction_type=${reactionType}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        if (res.status === 200 || res.status === 204) {
            return res.data;
        }
    } catch (err) {
        if (err.response) {
            return { error: err.response.data || "Failed to remove reaction" };
        } else if (err.request) {
            return { error: "No response from server. Check your connection." };
        } else {
            return { error: "An unexpected error occurred." };
        }
    }
};

export const removeReactionFromCommentWithQuery = async (feedPostId: string | number, commentId: string | number, userId: string | number, reactionType: string) => {
    const token = localStorage.getItem("teamsync_jwt");
    try {
        const res = await axios.delete(`${API_BASE_URL}/feedposts/${feedPostId}/comments/${commentId}/reactions`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
            params: {
                user_id: userId,
                reaction_type: reactionType,
            },
        });
        if (res.status === 200 || res.status === 204) {
            return res.data;
        }
    } catch (err) {
        if (err.response) {
            return { error: err.response.data || "Failed to remove reaction from comment" };
        } else if (err.request) {
            return { error: "No response from server. Check your connection." };
        } else {
            return { error: "An unexpected error occurred." };
        }
    }
}; 