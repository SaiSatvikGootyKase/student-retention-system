# Student Retention System — Code Execution & Deployment Guide

This document describes how to run the application locally, configure MongoDB, execute optional ML evaluation scripts, and deploy to Render.

**Repository:** [student-retention-system](https://github.com/SaiSatvikGootyKase/student-retention-system)  
**Stack:** Spring Boot (Gradle) backend, React (Vite) frontend, MongoDB, optional Python ML tooling.

---

## Table of contents

1. [Prerequisites](#1-prerequisites)
2. [Clone the repository](#2-clone-the-repository)
3. [Database setup](#3-database-setup)
4. [Backend execution](#4-backend-execution)
5. [Frontend execution](#5-frontend-execution)
6. [Full stack with Docker Compose](#6-full-stack-with-docker-compose)
7. [Admin access](#7-admin-access)
8. [ML evaluation scripts (optional)](#8-ml-evaluation-scripts-optional)
9. [Deployment on Render](#9-deployment-on-render)
10. [Verification checklist](#10-verification-checklist)
11. [API base URL reference](#11-api-base-url-reference)

---

## 1. Prerequisites

| Software | Purpose |
|----------|---------|
| **JDK 21** | Backend build and runtime (aligned with `Dockerfile`) |
| **Node.js 18+** (LTS) | Frontend `npm install`, `npm run dev`, `npm run build` |
| **MongoDB** | Local instance, Docker, or **MongoDB Atlas** |
| **Git** | Clone and version control |
| **Python 3.10+** (optional) | Scripts under `ML_model/` |
| **Docker Desktop** (optional) | `docker compose` for full stack |

---

## 2. Clone the repository

```bash
git clone https://github.com/SaiSatvikGootyKase/student-retention-system.git
cd student-retention-system
```

---

## 3. Database setup

The application uses MongoDB database name **`student`** (see `src/main/resources/application.properties`).

### Option A — Local MongoDB

1. Start MongoDB on **port 27017**.
2. The app will use database **`student`** automatically when connecting to `localhost`.

### Option B — MongoDB Atlas

1. Create a cluster, a **database user**, and **Network Access** (your IP for local dev; for cloud hosting add `0.0.0.0/0` or specific egress IPs).
2. Use an SRV URI that includes the database name, for example:

   ```text
   mongodb+srv://<username>:<password>@<cluster-host>/student?retryWrites=true&w=majority&appName=Cluster0
   ```

3. URL-encode the password if it contains special characters (`@`, `#`, `/`, etc.).

### Important: localhost override

When `app.mongodb.use-localhost-only=true` (default in `application.properties`), the application **pins** MongoDB to `mongodb://localhost:27017/student` at startup, which **ignores** environment variables for the URI.

To use **Atlas** or any non-localhost URI, set:

```text
APP_MONGODB_USE_LOCALHOST_ONLY=false
SPRING_MONGODB_URI=<your full mongodb or mongodb+srv URI>
```

---

## 4. Backend execution

**Working directory:** repository root (where `build.gradle`, `gradlew`, `src/` are located).

**Default HTTP port:** `8080` (`server.port=8080`).

### 4.1 Windows — local MongoDB on localhost

1. Start MongoDB on `localhost:27017`.
2. Run:

   ```powershell
   .\gradlew.bat bootRun
   ```

### 4.2 Windows — MongoDB Atlas (or remote MongoDB)

```powershell
$env:SPRING_MONGODB_URI="mongodb+srv://USER:PASS@cluster.xxx.mongodb.net/student?retryWrites=true&w=majority"
$env:APP_MONGODB_USE_LOCALHOST_ONLY="false"
.\gradlew.bat bootRun
```

### 4.3 Linux / macOS — local MongoDB

```bash
./gradlew bootRun
```

### 4.4 Build JAR and run

```powershell
.\gradlew.bat clean build -x test
java -jar build\libs\*.jar
```

Use the same environment variables as in §4.2 if not using localhost MongoDB.

### 4.5 Docker (backend image only)

The root `Dockerfile` builds the Spring Boot application with Gradle and runs the JAR on port **8080**. Pass Atlas/local URI at runtime, for example:

```bash
docker build -t retention-backend .
docker run -p 8080:8080 \
  -e APP_MONGODB_USE_LOCALHOST_ONLY=false \
  -e SPRING_MONGODB_URI="mongodb+srv://..." \
  retention-backend
```

---

## 5. Frontend execution

**Working directory:** `frontend/`

### Development (hot reload)

```bash
cd frontend
npm install
npm run dev
```

- Default Vite URL: **http://localhost:5173**
- The dev server **proxies** requests under `/api` to **http://localhost:8080** (`vite.config.ts`).  
  **Start the backend first** on port 8080 for API calls to succeed.

### Production build

```bash
cd frontend
npm install
npm run build
```

Output directory: **`frontend/dist`**.

### Hosted frontend (Render, etc.)

Set at **build time**:

```text
VITE_API_BASE_URL=https://<your-backend-host>/api/v1
```

Then run `npm run build` so the client points to the deployed API.

---

## 6. Full stack with Docker Compose

From the **repository root**:

```bash
docker compose up --build
```

Typical port mappings:

| Service | Host port |
|---------|-----------|
| Frontend (nginx) | **80** |
| Backend | **8080** |
| MongoDB | **27017** |
| Redis | **6379** |

Compose sets `APP_MONGODB_USE_LOCALHOST_ONLY=false` and `SPRING_MONGODB_URI=mongodb://mongo:27017/student` for the backend service.

Ensure host ports are not already in use.

---

## 7. Admin access

- The web UI includes an **Admin** sign-in tab and an admin portal to create **faculty** and **student** accounts.
- If no `ADMIN` user exists in the `users` collection, the application may bootstrap a default administrator (see `DefaultAdminBootstrapRunner.java`). **Change default credentials in production** and restrict network access.
- Public self-registration remains available for **STUDENT** and **FACULTY** via `/api/v1/auth/register` as implemented in the app.

---

## 8. ML evaluation scripts (optional)

Requires Python with `pandas`, `scikit-learn`, `matplotlib`. Some dropout comparison models need optional packages (`xgboost`, `lightgbm`, `catboost`).

### Dropout model evaluation

```bash
cd "ML_model/Dropout Prediction System"
python evaluate_dropout_models.py
```

- Default mode uses honest train/test preprocessing; use `--mode notebook` for legacy notebook-style preprocessing.

### Lecture recommendation evaluation

```bash
cd "ML_model/Lecture Recommendation System"
python evaluate_lecture_recommendation_models.py
```

### Feature importance figures

```bash
cd ML_model
python plot_feature_importance_both.py
```

Generated PNGs are written under:

- `ML_model/Dropout Prediction System/figures/`
- `ML_model/Lecture Recommendation System/figures/`

---

## 9. Deployment on Render

### Backend (Web Service)

- **Language:** Docker (root `Dockerfile` is detected).
- **Branch:** `main` (or your deployment branch).
- **Root directory:** repository root (empty / default).

**Environment variables:**

| Name | Description |
|------|-------------|
| `SPRING_MONGODB_URI` | Full Atlas or Mongo URI including database path `/student` and query params as needed |
| `APP_MONGODB_USE_LOCALHOST_ONLY` | Set to `false` so Atlas URI is not overridden by localhost |

### Frontend (Static Site)

- **Root directory:** `frontend`
- **Build command:** `npm install && npm run build`
- **Publish directory:** `dist`

**Environment variable:**

| Name | Description |
|------|-------------|
| `VITE_API_BASE_URL` | `https://<your-backend-service>.onrender.com/api/v1` |

Deploy the backend first, copy its public URL, then set `VITE_API_BASE_URL` and redeploy the frontend.

### MongoDB Atlas for production

- Resume cluster if paused.
- **Network Access:** allow Render (often `0.0.0.0/0` for coursework; tighten for real production).
- **Database Access:** dedicated application user with strong password.

---

## 10. Verification checklist

| Check | Expected |
|-------|----------|
| MongoDB | Database `student` exists; collections appear after API usage |
| Backend | HTTP service responds on configured port (e.g. 8080) |
| Frontend (local) | Login page loads; login works with backend running |
| Frontend (hosted) | `VITE_API_BASE_URL` matches deployed backend `/api/v1` |
| CORS | If issues occur, confirm backend allows frontend origin (broad `@CrossOrigin` may be enabled in dev) |

---

## 11. API base URL reference

- **Local dev (Vite):** browser calls `/api/v1/...` → proxied to `http://localhost:8080/api/v1/...`
- **Production build:** set `VITE_API_BASE_URL` to `https://<host>/api/v1` (no trailing slash)

REST endpoints are implemented under `/api/v1` (auth, users, students, teachers, assignments, etc.). For a full route list, refer to controllers in `src/main/java/com/example/demo/controller/` or your report appendix.

---

## Document history

| Version | Description |
|---------|-------------|
| 1.0 | Initial guide: local run, Atlas, Docker, Render, ML scripts |

---

*End of document.*
