# 🚀 Insurance Risk Prediction System (Full Stack + ML)

A full-stack web application that predicts insurance costs using a machine learning model.  
Users can securely sign up, log in, and get real-time predictions along with explainability of how each feature affects the result.

---

## 🌐 Live Demo

🔗 Frontend: https://ml-insurance-predictor-fastapi.onrender.com  
🔗 Backend API Docs: https://insurance-backend-ewkb.onrender.com/docs  

---

## 🧠 Key Highlights

- ⚡ FastAPI backend with optimized REST APIs (~40–50ms response time)
- 🔐 JWT-based authentication (secure login/signup)
- 📊 SHAP-based model explainability for prediction insights
- 📈 Admin dashboard for tracking user activity and prediction history
- 🧮 ML model with log transformation for improved accuracy on skewed data
- 🐘 PostgreSQL database with scalable schema design
- 🐳 Dockerized backend deployment on Render

---
## 📊 Model Selection & Justification

- Performed exploratory data analysis (EDA) to understand feature relationships  
- Observed strong linear correlation between key features (age, BMI, smoker status) and insurance charges  
- Applied log transformation to handle skewness in the target variable  
- Evaluated model performance and found that Linear Regression performed effectively for this dataset  

### ✅ Why Linear Regression?

- Simplicity and interpretability  
- Fast inference (ideal for real-time API responses)  
- Comparable performance to more complex models  

Additionally, SHAP is used to provide explainability, helping users understand how each feature contributes to their prediction.

---

## 🗄️ Database Design + System Details

### 🗄️ Database Design

The application uses a relational database with a **one-to-many relationship** between users and insurance records.

#### 👤 User Table
- Stores user credentials and role information  
- Fields: `id`, `username`, `email`, `hashed_password`, `role`, `created_at`, `last_active`  

#### 📊 Insurance Records Table
- Stores user input data and prediction results  
- Fields: `id`, `user_id`, `age`, `bmi`, `children`, `smoker_encoded`, `prediction`  

#### 🔗 Relationship
- One user can have multiple insurance prediction records  
- Implemented using SQLAlchemy ORM relationships and foreign keys  

---

### ⚡ Performance Optimization

- The trained ML model is serialized using **joblib** and loaded once at application startup  
- This avoids repeated loading overhead and ensures low-latency predictions (~40–50ms response time)  

---

### 🔐 Security

- Passwords are securely hashed using **Argon2** via Passlib  
- JWT-based authentication is used for secure API access  
- Role-based access control implemented (`user` vs `admin`)  
- Rate limiting applied on authentication and prediction endpoints to prevent brute-force attacks and API abuse
---

### 📜 API Logging & Monitoring

To ensure observability and track API usage, the application implements a custom logging system that records every incoming request.

#### 📌 What is Logged?

- 🌐 Client IP address  
- 🔁 HTTP method (GET, POST, OPTIONS, etc.)  
- 🔗 Requested endpoint  
- ✅ Response status code  
- ⏱️ Response time (latency)

---

#### 🧾 Sample Logs

```text
2026-03-17 22:15:12 | INFO | IP: 127.0.0.1 | Method: OPTIONS | URL: /login | Status: 200 | Time: 0.0000s
2026-03-17 22:15:12 | INFO | IP: 127.0.0.1 | Method: POST | URL: /login | Status: 200 | Time: 0.1789s
2026-03-17 22:17:31 | INFO | IP: 127.0.0.1 | Method: OPTIONS | URL: /predict | Status: 200 | Time: 0.0000s
2026-03-17 22:17:31 | INFO | IP: 127.0.0.1 | Method: POST | URL: /predict | Status: 200 | Time: 0.0685s
---
```

### 🧠 Explainability

- SHAP values are generated using **LinearExplainer**  
- Feature contributions are returned along with predictions for transparency  

---

### ⚠️ Error Handling

- Input validation handled using **Pydantic models**  
- Custom HTTP exceptions implemented for consistent API error responses  



### 📦 Example API Usage

#### Request

`POST /predict`

**Headers:**
`Content-Type: application/json`

**Body:**
```json
{
  "age": 25,
  "bmi": 28.5,
  "children": 1,
  "smoker": 1
}
```

#### Response

**Status:** `200 OK`

**Body:**
```json
{
  "prediction": 32000,
  "explanation": {
    "age": 1200,
    "bmi": 800,
    "smoker": 15000
  }
}
```
## ⚙️ Tech Stack

### 🖥️ Frontend
- HTML
- CSS
- JavaScript

### 🔧 Backend
- FastAPI
- SQLAlchemy (ORM)
- Alembic (database migrations)

### 🗄️ Database
- PostgreSQL (Render hosted)

### 🤖 Machine Learning
- Linear Regression (Scikit-learn)
- Log Transformation (for skewed data handling)
- SHAP (Explainability)

### 🚀 Deployment
- Backend: Render (Docker)
- Frontend: Render (Static Site)
- Database: Render PostgreSQL

---

## ✨ Features

- 🔐 User Authentication (Signup/Login with hashed passwords)
- 🎟️ JWT Token-based secure API access
- 📊 Prediction Dashboard for users
- 📈 Graphs:
  - Age distribution
  - Smoker vs Non-smoker percentage
  - Prediction trends
- 🧠 ML Prediction with Explainability (SHAP)
- 🛠️ Admin Panel:
  - View registered users
  - Track prediction history

---

## 🧪 API Endpoints

| Method | Endpoint        | Description                     |
|--------|----------------|---------------------------------|
| POST   | `/register`    | Register new user              |
| POST   | `/login`       | Authenticate user & get token  |
| POST   | `/predict`     | Predict insurance cost         |
| GET    | `/dashboard`   | Admin dashboard data           |

👉 Full API docs available at:  
https://insurance-backend-ewkb.onrender.com/docs

## 📂 Project Structure

```bash
.
├── frontend/        # UI (HTML, CSS, JS)
├── backend/         # FastAPI backend
├── ml_code/         # ML model logic
├── notebook/        # Model experimentation
├── alembic/         # DB migrations
├── docker-compose.yml
├── alembic.ini
└── README.md
```

## 📸 Screenshots

## 📸 Screenshots

### 🧠 Prediction Page (Input + Result + Explainability)
![Prediction](screenshots/prediction-page.png)

### 📊 Dashboard Overview
![Dashboard](screenshots/dashboard-overview.png)

### 📈 Analytics
![Analytics](screenshots/analytics.png)

### 📋 Prediction History
![History](screenshots/prediction-history.png)
