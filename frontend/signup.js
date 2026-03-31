document.getElementById("registerBtn").addEventListener("click", signup);
const API_URL =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
        ? "http://127.0.0.1:8000"
        : "https://your-backend-name.onrender.com";

async function signup() {
    try {
        const response = await fetch(`${API_URL}/register`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                username: document.getElementById("username").value,
                email: document.getElementById("email").value,
                password: document.getElementById("password").value
            })
        });

        const data = await response.json();

        document.getElementById("message").innerText =
            data.message || data.detail;

        if (response.ok) {
            setTimeout(() => {
                window.location.href = "login.html";
            }, 1500);
        }

    } catch (error) {
        document.getElementById("message").innerText =
            "Server error. Please try again.";
    }
}