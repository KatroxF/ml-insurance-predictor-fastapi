document.getElementById("registerBtn").addEventListener("click", signup);
const API_URL =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
        ? "http://127.0.0.1:8000"
        : "https://ml-insurance-predictor-fastapi.onrender.com'";
async function signup() {
    const messageEl = document.getElementById("message"); 

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

        if (!response.ok) {
            let errorMessage = "Signup failed.";

            if (Array.isArray(data.detail)) {
                const msg = data.detail[0].msg;

                if (msg.includes("valid email")) {
                    errorMessage = "Please enter a valid email address";
                } else if (msg.includes("at least 8 characters")) {
                    errorMessage = "Password must be at least 8 characters";
                } else {
                    errorMessage = msg;
                }
            }

            messageEl.style.color = "red";
            messageEl.innerText = errorMessage;
            return;
        }

        // success
        messageEl.style.color = "green";
        messageEl.innerText = "Signup successful! Redirecting...";

        setTimeout(() => {
            window.location.href = "login.html";
        }, 1500);

    } catch (error) {
        messageEl.style.color = "red"; // 
        messageEl.innerText = "Server error. Please try again.";
    }
}