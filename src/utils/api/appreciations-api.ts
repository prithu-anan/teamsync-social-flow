import axios from 'axios';
import { API_BASE_URL, getAuthHeaders } from './api-config';

export const createAppreciation = async (req) => {
    const token = localStorage.getItem("teamsync_jwt");

    try {
        const res = await axios.post(`${API_BASE_URL}/appreciations`, req, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (res.status === 200 || res.status === 201) {
            return res.data;
        }
    } catch (err) {
        if (err.response) {
            return { error: err.response.data || "Failed to create appreciation" };
        } else if (err.request) {
            return { error: "No response from server. Check your connection." };
        } else {
            return { error: "An unexpected error occurred." };
        }
    }
}

export const getAppreciations = async () => {
    const token = localStorage.getItem("teamsync_jwt");

    try {
        const res = await axios.get(`${API_BASE_URL}/appreciations`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (res.status === 200) {
            return res.data;
        }
    } catch (err) {
        if (err.response) {
            return { error: err.response.data || "Failed to fetch appreciations" };
        }
    }
}

export const getAppreciationById = async (id) => {
    const token = localStorage.getItem("teamsync_jwt");

    try {
        const res = await axios.get(`${API_BASE_URL}/appreciations/${id}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (res.status === 200) {
            return res.data;
        }
    } catch (err) {
        if (err.response) {
            return { error: err.response.data || "Failed to fetch appreciation" };
        }
    }
}

export const updateAppreciation = async (id, req) => {
    const token = localStorage.getItem("teamsync_jwt");

    try {
        const res = await axios.put(`${API_BASE_URL}/appreciations/${id}`, req, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (res.status === 200) {
            return res.data;
        }
    } catch (err) {
        if (err.response) {
            return { error: err.response.data || "Failed to update appreciation" };
        }
    }
}

export const deleteAppreciation = async (id) => {
    const token = localStorage.getItem("teamsync_jwt");

    try {
        const res = await axios.delete(`${API_BASE_URL}/appreciations/${id}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (res.status === 200) {
            return res.data;
        }
    } catch (err) {
        if (err.response) {
            return { error: err.response.data || "Failed to delete appreciation" };
        }
    }
} 