export function authHeader() {

    const token = localStorage.getItem("access_token");

    if (!token) {
        throw new Error("Authentication token missing. Please login.");
    }

    return {
        "Authorization": "Bearer " + token
    };
}