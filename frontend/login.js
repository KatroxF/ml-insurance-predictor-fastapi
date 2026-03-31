
// const token = localStorage.getItem("token");
// const role = localStorage.getItem("role");

// if (token && role) {
//     if (role === "admin") {
//         window.location.href = "InsuranceDashboard.html";
//     } else {
//         window.location.href = "predict.html";
//     }
// }
document.getElementById("loginBtn").addEventListener("click", login);
const API_URL =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
        ? "http://127.0.0.1:8000"
        : "https://ml-insurance-predictor-fastapi.onrender.com";


async function login() {

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {

        const response = await fetch(`${API_URL}/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                useremail: email,
                password: password
            })
        });

        const data = await response.json();

        if (!response.ok) {
            document.getElementById("message").innerText =
                data.detail || "Login failed.";
            return;
        }

        localStorage.setItem("access_token", data.access_token);
        localStorage.setItem("role", data.role);
        document.getElementById("message").style.color = "green";
        document.getElementById("message").innerText = "Login successful!";

        if (data.role === "admin") {

            setTimeout(() => {
                window.location.href = "InsuranceDashboard.html";
            }, 1200);

        } else {

            setTimeout(() => {
                window.location.href = "predict.html";
            }, 1200);

        }

    } catch (error) {

        document.getElementById("message").innerText =
            "Server error. Please try again.";

    }
}

function logout(){
    localStorage.removeItem("access_token");
    localStorage.removeItem("role");
    window.location.href="login.html"
}

function authHeader() {

    const token = localStorage.getItem("access_token");

    return {
        "Authorization": "Bearer " + token
    };

}