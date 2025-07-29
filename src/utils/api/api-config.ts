// export const API_BASE_URL = 'http://135.235.169.115:8080';
export const API_BASE_URL = 'http://localhost:8080';

export const getAuthHeaders = () => {
    const token = localStorage.getItem("teamsync_jwt");
    return {
        Authorization: `Bearer ${token}`,
    };
}; 