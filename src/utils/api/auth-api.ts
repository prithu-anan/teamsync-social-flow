import axios from 'axios';
import { API_BASE_URL, getAuthHeaders } from './api-config';

export const signup = async (req) => {
    try {
        const res = await axios.post(`${API_BASE_URL}/auth/register`, { name: req.name, email: req.email, password: req.password });

        if (res.status === 200 || res.status === 201) {
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
    console.log(API_BASE_URL);
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

export const getMe = async () => {
  try {
    const res = await axios.get(`${API_BASE_URL}/auth/me`, {
      headers: getAuthHeaders(),
    });

    return res.data;
  } catch (err) {
    if (err.response) {
      return { error: err.response.data || "Failed to fetch user" };
    } else if (err.request) {
      return { error: "No response from server. Check your connection." };
    } else {
      return { error: "An unexpected error occurred." };
    }
  }
};

export const updateMe = async (req) => {
    const token = localStorage.getItem("teamsync_jwt");

    try {
        let headers = {
            Authorization: `Bearer ${token}`,
        };

        const res = await axios.post(`${API_BASE_URL}/auth/me`, req, {
            headers,
        });

        if (res.status === 200) {
            return res.data;
        }
    } catch (err) {
        if (err.response) {
            return { error: err.response.data || "Failed to update profile" };
        } else if (err.request) {
            return { error: "No response from server. Check your connection." };
        } else {
            return { error: "An unexpected error occurred." };
        }
    }
}

export const logout = async () => {
    const token = localStorage.getItem("teamsync_jwt");

    try {
        const res = await axios.post(`${API_BASE_URL}/auth/logout`, {}, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (res.status === 200) {
            return res.data;
        }
    } catch (err) {
        if (err.response) {
            return { error: err.response.data || "Failed to logout" };
        }
    }
}

export const refreshToken = async () => {
    const token = localStorage.getItem("teamsync_jwt");

    try {
        const res = await axios.post(`${API_BASE_URL}/auth/refresh`, {}, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (res.status === 200) {
            return res.data;
        }
    } catch (err) {
        if (err.response) {
            return { error: err.response.data || "Failed to refresh token" };
        }
    }
}

export const changePassword = async (req) => {
    const token = localStorage.getItem("teamsync_jwt");

    try {
        const res = await axios.post(`${API_BASE_URL}/auth/password-change`, req, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (res.status === 200) {
            return res.data;
        }
    } catch (err) {
        if (err.response) {
            return { error: err.response.data || "Failed to change password" };
        }
    }
}

export const requestPasswordReset = async (req) => {
    try {
        const res = await axios.post(`${API_BASE_URL}/auth/password-reset-request`, req);

        if (res.status === 200) {
            return res.data;
        }
    } catch (err) {
        if (err.response) {
            return { error: err.response.data || "Failed to request password reset" };
        }
    }
}

export const resetPassword = async (req) => {
    try {
        const res = await axios.post(`${API_BASE_URL}/auth/password-reset`, req);

        if (res.status === 200) {
            return res.data;
        }
    } catch (err) {
        if (err.response) {
            return { error: err.response.data || "Failed to reset password" };
        }
    }
} 