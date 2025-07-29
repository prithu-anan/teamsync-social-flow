import axios from 'axios';
import { API_BASE_URL, getAuthHeaders } from './api-config';

export const getTasks = async () => {
    const token = localStorage.getItem("teamsync_jwt");

    try {
        const res = await axios.get(`${API_BASE_URL}/tasks`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (res.status === 200) {
            return res.data;
        }
    } catch (err) {
        if (err.response) {
            return { error: err.response.data || "Failed to fetch tasks" };
        } else if (err.request) {
            return { error: "No response from server. Check your connection." };
        } else {
            return { error: "An unexpected error occurred." };
        }
    }
};

export const createTask = async (req) => {
    const token = localStorage.getItem("teamsync_jwt");

    try {
        const res = await axios.post(`${API_BASE_URL}/tasks`, req, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (res.status === 200 || res.status === 201) {
            return res.data;
        }
    } catch (err) {
        if (err.response) {
            return { error: err.response.data || "Failed to create task" };
        } else if (err.request) {
            return { error: "No response from server. Check your connection." };
        } else {
            return { error: "An unexpected error occurred." };
        }
    }
}

export const updateTask = async (id, req) => {
    const token = localStorage.getItem("teamsync_jwt");
    
    try {
        const res = await axios.put(`${API_BASE_URL}/tasks/${id}`, req, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (res.status === 200) {
            return res.data;
        }
    } catch (err) {
        if (err.response) {
            return { error: err.response.data || "Failed to update task" };
        }
    }
}

export const deleteTask = async (id) => {
    const token = localStorage.getItem("teamsync_jwt");

    try {
        const res = await axios.delete(`${API_BASE_URL}/tasks/${id}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (res.status === 200) {
            return res.data;
        }
    } catch (err) {
        if (err.response) {
            return { error: err.response.data || "Failed to delete task" };
        }
    }
}

export const getUserTasks = async (userId) => {
    const token = localStorage.getItem("teamsync_jwt");
    try {
        const res = await axios.get(`${API_BASE_URL}/tasks/${userId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        if (res.status === 200) {
            return res.data;
        }
    } catch (err) {
        if (err.response) {
            return { error: err.response.data || "Failed to fetch user tasks" };
        } else if (err.request) {
            return { error: "No response from server. Check your connection." };
        } else {
            return { error: "An unexpected error occurred." };
        }
    }
}

export const getTaskById = async (taskId) => {
    const token = localStorage.getItem("teamsync_jwt");
    try {
        const res = await axios.get(`${API_BASE_URL}/tasks/${taskId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        if (res.status === 200) {
            return res.data;
        }
    } catch (err) {
        if (err.response) {
            return { error: err.response.data || "Failed to fetch task" };
        } else if (err.request) {
            return { error: "No response from server. Check your connection." };
        } else {
            return { error: "An unexpected error occurred." };
        }
    }
}

export const getUserInvolvedTasks = async () => {
    const token = localStorage.getItem("teamsync_jwt");
    try {
        const res = await axios.get(`${API_BASE_URL}/tasks/user/involved`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        if (res.status === 200) {
            return res.data;
        }
    } catch (err) {
        if (err.response) {
            return { error: err.response.data || "Failed to fetch user involved tasks" };
        } else if (err.request) {
            return { error: "No response from server. Check your connection." };
        } else {
            return { error: "An unexpected error occurred." };
        }
    }
}