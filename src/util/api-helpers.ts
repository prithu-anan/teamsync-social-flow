import axios from 'axios';

// const API_BASE_URL = 'http://135.235.169.115:8080';
const API_BASE_URL = 'http://localhost:8080';

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
  const token = localStorage.getItem("teamsync_jwt");

  try {
    const res = await axios.get(`${API_BASE_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return res.data; // ✅ Don't forget to return the user data
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


export const createChannel = async (req) => {
    const token = localStorage.getItem("teamsync_jwt");

    /**
    {
        "name": "Backend dev",
        "type": "group",
        "project_id": 5,
        "member_ids": [
            1,
            2,
            5
        ]
    }
    */

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

    
    /**
    {
        "name": "Ai backend",
        "type": "group",
        "project_id": 3,
        "members": [
            1,2,5,7,9
        ]
    }
    */

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

// Available api for channles and messages

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

    /**
    {
        "content": "Ai backend",
        "recipient_id": 15,
        "thread_parent_id": 25
    }
    */

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

export const editMessage = async (channelId, messageId, req) => {
    const token = localStorage.getItem("teamsync_jwt");

    /**
    {
        "sender_id": 1,
        "channel_id": 1,
        "recipient_id": null,
        "content": "Ending module",
        "timestamp": "2025-06-04T10:04:58.797Z",
        "thread_parent_id": null
    }
    */

    try {
        const res = await axios.put(`${API_BASE_URL}/channels/${channelId}/messages/${messageId}`, { content: req.content }, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (res.status === 200) {
            return res.data;
        }
    } catch (err) {
        if (err.response) {
            return { error: err.response.data || "Failed to edit message" };
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

// End of channles and messages api

export const addUser = async (req) => {
    const token = localStorage.getItem("teamsync_jwt");

    /**
    {
        "name": "new",
        "email": "new@gmail.com",
        "password": "123"
    }
    */

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

export const updateUser = async (id, req) => {
    const token = localStorage.getItem("teamsync_jwt");
    
    /**
    {
        "name": "hello",
        "email": "hello@gmail.com",
        "profile_picture": "",
        "designation": "ML engineer",
        "birthdate": "",
        "join_date": "2025-02-31"
    }
    */

    try {
        const res = await axios.put(`${API_BASE_URL}/users/${id}`, { name: req.name, email: req.email, password: req.password }, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (res.status === 200) {
            return res.data;
        }
    } catch (err) {
        if (err.response) {
            return { error: err.response.data || "Failed to update user" };
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

// No more api available from backend
