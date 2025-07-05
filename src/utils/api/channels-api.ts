import axios from 'axios';
import { API_BASE_URL, getAuthHeaders } from './api-config';

export const createChannel = async (req) => {
    const token = localStorage.getItem("teamsync_jwt");

    try {
        const res = await axios.post(`${API_BASE_URL}/channels`, { name: req.name }, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (res.status === 200) {
            return res.data;
        }
    } catch (err) {
        if (err.response) {
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