import axios from 'axios';
import { API_BASE_URL, getAuthHeaders } from './api-config';

export const createChannel = async (req) => {
    const token = localStorage.getItem("teamsync_jwt");

    try {
        const requestBody = {
            name: req.name,
            type: "group",
            project_id: req.project_id || null,
            member_ids: req.members || []
        };

        console.log("Creating channel with body:", requestBody);

        const res = await axios.post(`${API_BASE_URL}/channels`, requestBody, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (res.status === 200 || res.status === 201) {
            return res.data;
        }
    } catch (err) {
        console.error("Create channel error:", err);
        if (err.response) {
            console.error("Error response:", err.response.data);
            console.error("Error status:", err.response.status);
            return { error: err.response.data || "Failed to create channel" };
        } else if (err.request) {
            return { error: "No response from server. Check your connection." };
        } else {
            return { error: "An unexpected error occurred." };
        }
    }
}

export const getChannels = async () => {
    const token = localStorage.getItem("teamsync_jwt");

    try {
        const res = await axios.get(`${API_BASE_URL}/channels`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (res.status === 200) {
            return res.data;
        }
    } catch (err) {
        if (err.response) {
            return { error: err.response.data || "Failed to fetch channels" };
        } else if (err.request) {
            return { error: "No response from server. Check your connection." };
        } else {
            return { error: "An unexpected error occurred." };
        }
    }
}

export const getChannelById = async (id) => {
    const token = localStorage.getItem("teamsync_jwt");

    try {
        const res = await axios.get(`${API_BASE_URL}/channels/${id}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (res.status === 200) {
            return res.data;
        }
    } catch (err) {
        if (err.response) {
            return { error: err.response.data || "Failed to fetch channel" };
        }
    }
}

export const updateChannel = async (id, req) => {
    const token = localStorage.getItem("teamsync_jwt");

    try {
        const res = await axios.put(`${API_BASE_URL}/channels/${id}`, { name: req.name }, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (res.status === 200) {
            return res.data;
        }
    } catch (err) {
        if (err.response) {
            return { error: err.response.data || "Failed to update channel" };
        }
    }
}

export const deleteChannel = async (id) => {
    const token = localStorage.getItem("teamsync_jwt");

    try {
        const res = await axios.delete(`${API_BASE_URL}/channels/${id}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (res.status === 200) {
            return res.data;
        }
    } catch (err) {
        if (err.response) {
            return { error: err.response.data || "Failed to delete channel" };
        }
    }
}

export const getMessages = async (channelId) => {
    const token = localStorage.getItem("teamsync_jwt");

    try {
        const res = await axios.get(`${API_BASE_URL}/channels/${channelId}/messages`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (res.status === 200) {
            return res.data;
        }
    } catch (err) {
        if (err.response) {
            return { error: err.response.data || "Failed to fetch messages" };
        }
    }
}

export const getMessageById = async (channelId, messageId) => {
    const token = localStorage.getItem("teamsync_jwt");

    try {
        const res = await axios.get(`${API_BASE_URL}/channels/${channelId}/messages/${messageId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (res.status === 200) {
            return res.data;
        }
    } catch (err) {
        if (err.response) {
            return { error: err.response.data || "Failed to fetch message" };
        }
    }
}

export const sendMessage = async (channelId, req) => {
    const token = localStorage.getItem("teamsync_jwt");

    try {
        const requestBody = {
            content: req.content,
            recipient_id: req.recipient_id || null,
            thread_parent_id: req.thread_parent_id || null
        };

        console.log("Sending message to channel:", channelId);
        console.log("Request body:", requestBody);

        const res = await axios.post(`${API_BASE_URL}/channels/${channelId}/messages`, requestBody, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (res.status === 200 || res.status === 201) {
            return res.data;
        }
    } catch (err) {
        console.error("Send message error:", err);
        if (err.response) {
            console.error("Error response:", err.response.data);
            console.error("Error status:", err.response.status);
            return { error: err.response.data || "Failed to send message" };
        } else if (err.request) {
            return { error: "No response from server. Check your connection." };
        } else {
            return { error: "An unexpected error occurred." };
        }
    }
}

export const editMessage = async (channelId, messageId, message) => {
    const token = localStorage.getItem("teamsync_jwt");

    try {
        console.log("Editing message with body:", message);
        const res = await axios.put(`${API_BASE_URL}/channels/${channelId}/messages/${messageId}`, message, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (res.status === 200) {
            return res.data;
        }
    } catch (err) {
        if (err.response) {
            console.error("Edit message error:", err.response.data);
            return { error: err.response.data?.message || err.response.data || "Failed to edit message" };
        }
    }
}

export const deleteMessage = async (channelId, messageId) => {
    const token = localStorage.getItem("teamsync_jwt");

    try {
        const res = await axios.delete(`${API_BASE_URL}/channels/${channelId}/messages/${messageId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (res.status === 200) {
            return res.data;
        }
    } catch (err) {
        if (err.response) {
            return { error: err.response.data || "Failed to delete message" };
        }
    }
} 

export const sendFileMessage = async (channelId, req) => {
    const token = localStorage.getItem("teamsync_jwt");

    try {
        // Create FormData for file upload
        const formData = new FormData();
        
        // Add files to FormData
        if (req.files && req.files.length > 0) {
            req.files.forEach((file, index) => {
                formData.append('files', file);
            });
        }
        
        // Add optional message content
        if (req.content) {
            formData.append('content', req.content);
        }
        
        // Add optional recipient_id
        if (req.recipient_id) {
            formData.append('recipient_id', req.recipient_id);
        }
        
        // Add optional thread_parent_id
        if (req.thread_parent_id) {
            formData.append('thread_parent_id', req.thread_parent_id);
        }

        for (let [key, value] of formData.entries()) {
            console.log(`${key}:`, value);
        }

        const res = await axios.post(`${API_BASE_URL}/channels/files?channelId=${channelId}`, formData, {
            headers: {
                Authorization: `Bearer ${token}`,
                // Don't set Content-Type manually - let axios set it with boundary
            },
        });

        if (res.status === 200 || res.status === 201) {
            return res.data;
        } else {
            return { error: `Unexpected status: ${res.status}` };
        }
    } catch (err) {
        console.error("Send file message error:", err);
        if (err.response) {
            return { error: err.response.data || "Failed to send file message" };
        } else if (err.request) {
            return { error: "No response from server. Check your connection." };
        } else {
            return { error: "An unexpected error occurred." };
        }
    }
}