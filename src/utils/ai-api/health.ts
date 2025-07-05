import axios from 'axios';
import { AI_API_BASE_URL } from './config';

export const get_health = async () => {
    /**
        Example response:

        {
            "status": "healthy",
            "message": "Connected to database",
            "time": "2025-07-05T22:09:33.586255+00:00"
        }
    */

    try {
        const res = await axios.post(`${AI_API_BASE_URL}/tasks/estimate-deadline`);

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