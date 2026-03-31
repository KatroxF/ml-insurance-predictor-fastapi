import { authHeader } from "./auth.js";
document.getElementById("submit").addEventListener("click",predict);
const API_URL =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
        ? "http://127.0.0.1:8000"
        : "";

async function predict(){
    try {
        const response=await fetch(`${API_URL}/predict`,{
            method:"POST",
            headers:{
                "Content-Type": "application/json",
                ...authHeader()
            },
            body:JSON.stringify({
                age:parseInt(document.getElementById("age").value),
                bmi:parseFloat(document.getElementById("bmi").value),
                children:parseInt(document.getElementById("children").value),
                smoker_encoded:parseInt(document.getElementById("smoke").value)

            })

            });
            const data=await response.json();

            if(response.ok){
                setTimeout(() => {

        // Prediction
        document.getElementById("result").innerHTML =
            `<h3>Prediction: ₹${data.prediction}</h3>`;

        const explanationDiv = document.getElementById("explanation");

        let html = `<p><strong>Base Value:</strong> ₹${data.base_value.toFixed(2)}</p>`;
        html += `<hr/>`;

        const names = {
            smoker_encoded: "Smoking",
            bmi: "BMI",
            age: "Age",
            children: "Children"
        };

        let total = data.base_value;

        Object.entries(data.explanation).forEach(([feature, value]) => {

            total += value;

            const sign = value >= 0 ? "+" : "-";
            const color = value >= 0 ? "red" : "green";

            html += `<p style="color:${color}">
                ${sign} ${names[feature] || feature}: ₹${Math.abs(value).toFixed(2)}
            </p>`;
        });

        html += `<hr/>`;
        html += `<p><strong>Calculated Total:</strong> ₹${total.toFixed(2)}</p>`;

        explanationDiv.innerHTML = html;
                    
                }, 1500);
            
            }else
                if(data.detail){
                showErrors(data.detail);
            }else{
                document.getElementById("result").innerText = "Prediction failed";
            }
            


        } catch(error){
            document.getElementById("result").innerText =
            "Server error. Please try again.";


        }
    }
function showErrors(errors) {
    
    document.querySelectorAll(".error").forEach(e => e.innerText = "");

    errors.forEach(err => {
        const field = err.loc[1];   
        const message = err.msg;

        const errorElement = document.getElementById(field + "_error");
        if (errorElement) {
            errorElement.innerText = message;
        }
    });
}

document.getElementById("logout-btn").addEventListener("click",()=>{
    localStorage.removeItem("access_token");
    window.location.href="login.html"
})
        
    