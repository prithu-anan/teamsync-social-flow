export const AI_API_BASE_URL = 'http://135.235.169.115:8000';
// export const AI_API_BASE_URL = 'http://localhost:8000';

export const getAuthHeaders = () => {
    const token = localStorage.getItem("teamsync_jwt");
    return {
        Authorization: `Bearer ${token}`,
    };
}; 