import axios from 'axios';
import { AI_API_BASE_URL, getAuthHeaders } from './config';

export const get_context = async () => {
    /**
        name: Get Available Contexts description: Returns all available context collections from Qdrant response: | Returns a list of collection names that can be used as context for RAG conversations.

        Example response:

        [
        "suhas_profile_chunks",
        "about_us",
        "code_pilot"
        ]
    */
    try {
        const res = await axios.get(`${AI_API_BASE_URL}/chatbot/context`);

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

export const send_message = async ({ userId, query, context }) => {
    /**
        name: Send Message description: Send a message to the chatbot and get a response params: |

        userId: Unique identifier for the user
        userQuery: The message/query from the user
        context (optional): Collection name for RAG context (if not provided, works as regular chat) request: |
        {
        "query": "Tell me about Suhas",
        "context": "suhas_profile_chunks"
        }
        response: | Returns the AI response with metadata.

        Example response:

        {
        "answer": "Suhas Abdullah is a Computer Science and Engineering student...",
        "response_type": "rag",
        "context": "suhas_profile_chunks",
        "user_id": "user123",
        "message_count": 4,
        "error": null
        }
    */
    const token = localStorage.getItem("teamsync_jwt");

    try {
        const res = await axios.post(`${AI_API_BASE_URL}/chatbot/${userId}`, { query, context }, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

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

export const clear_chat_history = async ({ userId, query, context }) => {
    /**
        name: Clear Chat History description: Clear all chat history for a specific user params: |

        userId: Unique identifier for the user response: | Returns a success message.
        Example response:

        {
        "message": "Chat history cleared for user user123"
        }
    */

    try {
        const res = await axios.delete(`${AI_API_BASE_URL}/chatbot/${userId}`, {
            headers: getAuthHeaders(),
        });

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

export const get_chat_history = async ({ userId, size }) => {
    /**
        size indicates message count : higher size is discouraged as it might overflow the LLM's context window.

        Example response:
        [
            {
                "id": 0,
                "type": "user",
                "content": "Hello I am halum. can you tell me about Prithu Anan",
                "timestamp": null
            },
            {
                "id": 1,
                "type": "ai",
                "content": "I hope you remember me. can you tell me about Prithu Anan",
                "timestamp": null
            },
        ]
    */

    try {
        const res = await axios.get(`${AI_API_BASE_URL}/chatbot/${userId}`, {
            params: {
                size: size,
            },
            headers: getAuthHeaders(),
        });

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

export const get_chatbot_health = async () => {
    /**
        name: Chatbot Health Check description: Health check endpoint for the chatbot service response: | Returns the health status of the chatbot service.

        Example response:

        {
            "status": "healthy",
            "available_collections": 3,
            "service": "chatbot"
        }
    */

    try {
        const res = await axios.get(`${AI_API_BASE_URL}/chatbot/health`);

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