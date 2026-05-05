# Comprehensive Project Specification: Student Retention & Recommendation Platform

## 1. Project Overview
The Student Retention & Recommendation Platform is an end-to-end educational system designed to identify students at risk of dropping out and proactively intervene by curating personalized learning paths. The platform consists of two primary engines: a **Dropout Prediction System** identifying at-risk behavior using machine learning, and a **Lecture Recommendation System** guiding students toward academic success.

## 2. Feature Breakdown

### 2.1 Dropout Prediction System
- **Data Ingestion Pipeline**: Collects attendance, grades, engagement metrics, assignment scores, demographic data, and socio-economic backgrounds.
- **Risk Scoring Engine**: Integrates an existing ML model to compute a standardized 0-100 risk score, converting binary dropout predictions into risk tiers (High, Medium, Low).
- **Alert Generation**: Automatically triggers notifications and emails when a student's risk profile escalates rapidly or crosses high-risk thresholds.
- **Factor Attribution Explainer**: Identifies the top 3 contributing factors to a student's risk score (e.g., "Sharp drop in last two quiz scores", "Attendance < 70%") to provide actionable context for teachers.

### 2.2 Lecture Recommendation System
- **Content Profiling**: Tags and categorizes corporate/academic video lectures based on micro-skills, difficulty, and historical effectiveness.
- **Student Profiling**: Analyzes student performance data to pinpoint precise granular weaknesses.
- **Recommendation Engine**: An ML model (e.g., Collaborative Filtering + Content-based) that matches student weaknesses with the highest-probability lecture content to bridge their learning gap.
- **Feedback Loop Tracking**: Monitors student interaction with recommended resources (ignored, started, completed) to reinforce and retrain the ML model.

### 2.3 Teacher Dashboard Features
- **Risk Roster View**: A sortable, filterable command center of all students with their current risk status, recent trends, and unread alerts.
- **Student 360 Profile**: A deep dive into an individual student showing historical performance, risk factor breakdown, and engagement logs.
- **Intervention Tracker**: A CRM-like feature to log, monitor, and follow up on actions taken to assist at-risk students.
- **Class-Level Analytics**: Aggregate view of classroom risk distributions and common learning bottlenecks.

### 2.4 Student Dashboard Features
- **Personalized Learning Path**: A curated, Netflix-style feed of recommended lectures tailored specifically to current academic blind spots.
- **Progress & Engagement Metrics**: Constructive tracking of attendance, completed assignments, and watched lectures to reinforce positive habits.
- **"Academic Health" Assessment**: A positively framed reflection of the risk score accompanied by actionable mini-goals.
- **Resource Hub**: Direct, low-friction access to tutoring scheduling, academic counseling, and campus resources.

## 3. Machine Learning Models & Data

### 3.1 Dropout Prediction Dataset Description
The base capability of the Dropout Prediction system relies on a dataset of **649 student records** containing **34 key features**:
- **Target Variable**: `Dropped_Out` (Boolean)
- **Demographic & Background**: `School`, `Gender`, `Age`, `Address`, `Family_Size`, `Parental_Status`
- **Parental Information**: `Mother_Education`, `Father_Education`, `Mother_Job`, `Father_Job`
- **Academic Environment & Support**: `Reason_for_Choosing_School`, `Guardian`, `Travel_Time`, `Study_Time`, `School_Support`, `Family_Support`, `Extra_Paid_Class`, `Extra_Curricular_Activities`, `Attended_Nursery`, `Wants_Higher_Education`
- **Social & Health Factors**: `Internet_Access`, `In_Relationship`, `Family_Relationship`, `Free_Time`, `Going_Out`, `Weekend_Alcohol_Consumption`, `Weekday_Alcohol_Consumption`, `Health_Status`
- **Academic Performance**: `Number_of_Failures`, `Number_of_Absences`, `Grade_1`, `Grade_2`, `Final_Grade`

### 3.2 Implemented Dropout Models
Data preprocessing utilizes `LabelEncoder` for categoricals and `StandardScaler` for numericals, with an 80/20 train-test split.
- **Deep Learning Model (PyTorch)**: A custom Feedforward Neural Network (Input -> 64 ReLU -> 32 ReLU -> 1 Sigmoid) optimized via Adam with L2 regularization. Achieves **~91.54% Accuracy**.
- **Traditional ML Models**: Ensemble models (Random Forest, Gradient Boosting, XGBoost, LightGBM, CatBoost) achieved up to 100% accuracy on historical data, with Extra Trees and SVC reaching ~96%.

## 4. API Specification (Spring Boot, JWT)

### Student Data & Assessment
- `GET /api/v1/students/{id}/profile` - Retrieve student demographics and basic metrics.
- `GET /api/v1/students/{id}/academic-health` - Fetch risk score, tier, and contributing factors.
- `GET /api/v1/teachers/roster?riskFilter=HIGH` - Fetch paginated list of students and statuses.

### ML Inference Integration
- `POST /api/v1/ml/predict-dropout` - Internal trigger for batch/real-time ML inference.
- `POST /api/v1/ml/recommend-lectures` - Internal trigger for lecture recommendation list generation.

### Lecture Recommendations
- `GET /api/v1/students/{id}/recommendations` - Fetch personalized, ranked recommendations.
- `POST /api/v1/recommendations/{recId}/interact` - Log student interaction (CLICKED, WATCHING, COMPLETED).

### Interventions & Alerts
- `GET /api/v1/alerts/active` - Fetch unacknowledged high-risk alerts for the teacher.
- `POST /api/v1/interventions` - Create a new intervention log.
- `GET /api/v1/students/{id}/interventions` - Retrieve a student's intervention history timeline.

## 5. Database Schema (MongoDB)
- **Users**: `_id`, `name`, `email`, `role` (STUDENT, TEACHER, ADMIN), `passwordHash`, `lastLogin`
- **Students**: `_id`, `userId` (ref: Users), `enrollmentDate`, `major`, `demographics`, `currentRiskScore`, `currentRiskTier`
- **AcademicRecords**: `_id`, `studentId`, `courseId`, `assignments` (Array), `attendanceRate`, `term`
- **Lectures**: `_id`, `title`, `description`, `tags` (Array), `difficultyLevel`, `durationSeconds`, `videoUrl`
- **RiskAssessments** (Time-series append-only): `_id`, `studentId`, `timestamp`, `calculatedScore`, `contributingFactors` (Array), `modelId`
- **Recommendations**: `_id`, `studentId`, `lectureId`, `confidenceScore`, `status` (UNSEEN, CLICKED, COMPLETED), `generatedAt`, `completedAt`
- **InterventionLogs**: `_id`, `studentId`, `teacherId`, `type` (EMAIL, MEETING, WARNING), `notes`, `outcome`, `createdAt`

## 6. UI/UX Framework

### Design Principles
- **Premium & Professional**: Focus on clean lines, intentional whitespace, and a high-trust aesthetic, completely eliminating visual clutter.
- **Data-Forward**: Strict visual hierarchy and typographical alignment; relying on explicit scannability over an overabundance of charts.
- **Empathetic UX**: Information surfaced to students is empowering and actionable, never purely punitive or discouraging.

### Color Palette & Typography
- **Primary Colors**: Deep Trust Navy (`#0F172A`), Pristine White (`#FFFFFF`), Subtle Slate (`#F8FAFC`).
- **Accent Color**: Vibrant Indigo (`#4F46E5`).
- **Semantic Colors**: Emerald (`#10B981` / Positive), Amber (`#F59E0B` / Warning), Rose (`#E11D48` / Critical).
- **Typography**: Inter (Sans-serif) with bold headings and tabular-lining numerals for perfect column alignment.

### Wireframe Summaries
- **Teacher Dashboard**: Persistent dark left sidebar. Top row KPIs (High Risk, Interventions). Main view is a pristine Risk Roster table with sparklines and color-coded pills. Right slide-out "Student 360" drawer for quick context.
- **Student Dashboard**: Top horizontal nav. Welcoming hero section (`"Welcome back, [Name]. Here is your focus for today."`). Actionable Academic Health circular widget. "Up Next" horizontal Netflix-style learning path carousel. GitHub-style engagement heatmap.

## 7. Implementation Roadmap
- **Phase 1: Backend Foundation & Model 1 Integration (Weeks 1-3)**: Spring Boot setup, MongoDB schema, wrapping PyTorch/ML dropout model via API or microservice (FastAPI), exposing academic health endpoints.
- **Phase 2: Core Frontend & Teacher Dashboard (Weeks 4-7)**: React & TailwindCSS frontend (Radix/HeadlessUI), role-based auth, Teacher Dashboard UI, Student 360 drawers, and backend wiring.
- **Phase 3: Model 2 MVP & Student Dashboard (Weeks 8-11)**: Train Lecture Recommendation ML model, integrate into pipeline, build Student Dashboard and feedback tracking loops.
- **Phase 4: Admin, Monitoring & Optimization (Weeks 12-14)**: Admin tools, Redis caching layer, MongoDB composite indexing, Dockerization and Cloud deployment via CI/CD (AWS/GCP/Azure).

## 8. Scalability & Performance Considerations
- **Handling Data Volume**: Separate time-series data (RiskAssessments, InterventionLogs) from main collections. Use indexing on `userId`, `studentId`, and `timestamp`.
- **ML Model Inference Speed**: Run Dropout Prediction as a nightly asynchronous batch job (Spring Batch/Quartz). Pre-compute top 10 Lecture Recommendations nightly into Redis/database cache to eliminate API latency during heavy traffic.
- **Handling Concurrent Users**: Stateless Spring Boot architecture scalable via load balancers. Redis caching for static active data (lecture catalogs). WebSockets or SSE strictly limited to high-priority alerts for teachers to avoid memory hogging via idle socket connections.
