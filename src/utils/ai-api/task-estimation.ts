import axios from 'axios';
import { AI_API_BASE_URL, getAuthHeaders } from './config';

export const get_task_deadline = async ({ title, description, project_id }) => {
    /**
        Example response:

        {
        "priority": "high",
        "estimated_time": "8.0 hours",
        "comment": "A bug in the authentication module, specifically with JWT parsing, can prevent users from logging in or accessing resources. This directly impacts system functionality and security, making it a high priority. Fixing authentication issues generally requires debugging, code modification, and testing, hence the 8-hour estimate."
        }
    */

    try {
        const res = await axios.post(`${AI_API_BASE_URL}/tasks/estimate-deadline`, {
            title,
            description,
            project_id,
        },
        {
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

export const get_task_deadline_by_parent_task_id = async ({ title, description, project_id, parent_task_id }) => {
    /**
        Example response:

        {
        "priority": "high",
        "estimated_time": "8.0 hours",
        "comment": "A bug in the authentication module, specifically with JWT parsing, can prevent users from logging in or accessing resources. This directly impacts system functionality and security, making it a high priority. Fixing authentication issues generally requires debugging, code modification, and testing, hence the 8-hour estimate."
        }
    */

    try {
        const res = await axios.post(`${AI_API_BASE_URL}/tasks/estimate-deadline`, {
            title,
            description,
            project_id,
            parent_task_id,
        },
        {
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