import axios from 'axios';
import { API_BASE_URL, getAuthHeaders } from './api-config';

export const addUser = async (req) => {
    const token = localStorage.getItem("teamsync_jwt");

    try {
        const res = await axios.post(`${API_BASE_URL}/users`, { name: req.name, email: req.email, password: req.password }, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (res.status === 200) {
            return res.data;
        }
    } catch (err) {
        if (err.response) {
            return { error: err.response.data || "Failed to add user" };
        } else if (err.request) {
            return { error: "No response from server. Check your connection." };
        } else {
            return { error: "An unexpected error occurred." };
        }
    }
}

export const getUsers = async () => {
    const token = localStorage.getItem("teamsync_jwt");

    try {
        const res = await axios.get(`${API_BASE_URL}/users`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (res.status === 200) {
            return res.data;
        }
    } catch (err) {
        if (err.response) {
            return { error: err.response.data || "Failed to fetch users" };
        }
    }
}

export const getUserById = async (id) => {
    const token = localStorage.getItem("teamsync_jwt");

    try {
        const res = await axios.get(`${API_BASE_URL}/users/${id}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (res.status === 200) {
            return res.data;
        }
    } catch (err) {
        if (err.response) {
            return { error: err.response.data || "Failed to fetch user" };
        }
    }
}

export const updateUser = async (req, file = null) => {
    const token = localStorage.getItem("teamsync_jwt");

    try {
        // Create FormData for multipart form
        const formData = new FormData();
        
        // Add user data as JSON string - only include supported fields
        const userData = {
            name: req.name,
            ...(req.birthdate && { birthdate: req.birthdate })
        };
        
        formData.append('user', new Blob([JSON.stringify(userData)], { type: 'application/json' }));
        
        // Add file if provided
        if (file) {
            formData.append('file', file);
        }

        const res = await axios.put(`${API_BASE_URL}/users`, formData, {
            headers: {
                Authorization: `Bearer ${token}`,
                // Don't set Content-Type header - let browser set it with boundary for multipart
            },
        });

        if (res.status === 200) {
            return res.data;
        }
    } catch (err) {
        if (err.response) {
            return { error: err.response.data || "Failed to update user" };
        } else if (err.request) {
            return { error: "No response from server. Check your connection." };
        } else {
            return { error: "An unexpected error occurred." };
        }
    }
}

export const deleteUser = async (id) => {
    const token = localStorage.getItem("teamsync_jwt");
    
    try {
        const res = await axios.delete(`${API_BASE_URL}/users/${id}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (res.status === 200) {
            return res.data;
        }
    } catch (err) {
        if (err.response) {
            return { error: err.response.data || "Failed to delete user" };
        }
    }
}

export const updateDesignation = async (userId, designation) => {
    const token = localStorage.getItem("teamsync_jwt");

    try {
        const res = await axios.put(`${API_BASE_URL}/users/designation/${userId}`, {
            designation: designation
        }, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (res.status === 200) {
            return res.data;
        }
    } catch (err) {
        if (err.response) {
            return { error: err.response.data || "Failed to update designation" };
        } else if (err.request) {
            return { error: "No response from server. Check your connection." };
        } else {
            return { error: "An unexpected error occurred." };
        }
    }
} 