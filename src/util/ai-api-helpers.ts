import axios from 'axios';

const AI_API_BASE_URL = 'http://135.235.169.115:8000';
// const AI_API_BASE_URL = 'http://localhost:8000';

export const channel_auto_reply = async ({ channel_id, sender_id }) => {
    try {
        const res = await axios.post(`${AI_API_BASE_URL}/channels/auto-reply`, { channel_id, sender_id });

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