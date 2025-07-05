import axios from 'axios';
import { API_BASE_URL, getAuthHeaders } from './api-config';

export const createPollVote = async (req) => {
    const token = localStorage.getItem("teamsync_jwt");

    try {
        const res = await axios.post(`${API_BASE_URL}/pollvotes`, req, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (res.status === 200 || res.status === 201) {
            return res.data;
        }
    } catch (err) {
        if (err.response) {
            return { error: err.response.data || "Failed to create poll vote" };
        } else if (err.request) {
            return { error: "No response from server. Check your connection." };
        } else {
            return { error: "An unexpected error occurred." };
        }
    }
}

export const getPollVotes = async () => {
    const token = localStorage.getItem("teamsync_jwt");

    try {
        const res = await axios.get(`${API_BASE_URL}/pollvotes`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (res.status === 200) {
            return res.data;
        }
    } catch (err) {
        if (err.response) {
            return { error: err.response.data || "Failed to fetch poll votes" };
        }
    }
}

export const getPollVoteById = async (id) => {
    const token = localStorage.getItem("teamsync_jwt");

    try {
        const res = await axios.get(`${API_BASE_URL}/pollvotes/${id}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (res.status === 200) {
            return res.data;
        }
    } catch (err) {
        if (err.response) {
            return { error: err.response.data || "Failed to fetch poll vote" };
        }
    }
}

export const updatePollVote = async (id, req) => {
    const token = localStorage.getItem("teamsync_jwt");

    try {
        const res = await axios.put(`${API_BASE_URL}/pollvotes/${id}`, req, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (res.status === 200) {
            return res.data;
        }
    } catch (err) {
        if (err.response) {
            return { error: err.response.data || "Failed to update poll vote" };
        }
    }
}

export const deletePollVote = async (id) => {
    const token = localStorage.getItem("teamsync_jwt");

    try {
        const res = await axios.delete(`${API_BASE_URL}/pollvotes/${id}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (res.status === 200) {
            return res.data;
        }
    } catch (err) {
        if (err.response) {
            return { error: err.response.data || "Failed to delete poll vote" };
        }
    }
} 