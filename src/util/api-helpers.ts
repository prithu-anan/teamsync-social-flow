import axios from 'axios';

const API_BASE_URL = 'https://localhost:8080';

export const signup = async (req) => {
    try {
        const res = await axios.post(`${API_BASE_URL}/auth/register`, { name: req.name, email: req.email, password: req.password });

        if (res.status === 200) {
            return res.data;
        }

    } catch (err) {
        if (err.response) {
            return { error: err.response.data || "Invalid credentials" };
        } else if (err.request) {
            return { error: "No response from server. Check your connection." };
        } else {
            return { error: "An unexpected error occurred." };
        }
    }
}; 

export const login = async (req) => {
    try {
        const res = await axios.post(`${API_BASE_URL}/auth/login`, { email: req.email, password: req.password });

        if (res.status === 200) {
            return res.data;
        }

    } catch (err) {
        if (err.response) {
            return { error: err.response.data || "Invalid credentials" };
        } else if (err.request) {
            return { error: "No response from server. Check your connection." };
        } else {
            return { error: "An unexpected error occurred." };
        }
    }
}; 