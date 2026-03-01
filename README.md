# 🧠 AI Study Planner — Smart Planning, Progress Tracking & Analytics Dashboard

### 🔗 Live Demo  
👉 **Web App:** https://studyaiplanner.vercel.app/dashboard

AI Study Planner is a **full-stack AI-powered web application** that creates **personalized study schedules**, tracks progress automatically, and adapts plans intelligently based on **time availability, subject difficulty, syllabus load, and exam deadlines**.

It is designed as a **startup-level productivity dashboard** for students, combining **rule-based AI planning**, **visual analytics**, and **automation** — with support for **syllabus analysis via image upload**.

---

# 🧠 What This Project Does

The application helps students:
- Plan daily & weekly study schedules intelligently
- Break subjects into topics with realistic time allocation
- Track planned vs actual study time
- Automatically reschedule missed tasks
- Visualize performance trends and focus patterns
- Convert syllabus images into structured study plans

This project demonstrates **real-world AI logic**, **full-stack engineering**, and **product-oriented system design**.

---

# 🚀 Key Features

### ✔ Core Functionality
- JWT-based Authentication
- Personalized user profile (study hours, preferences)
- Subject & topic management
- Intelligent study timetable generation
- Automatic progress tracking
- Missed-task detection & auto-rescheduling

### ✔ AI-Powered Planning
- Priority-based study allocation
- Adaptive planning using:
  - Exam deadlines
  - Subject difficulty
  - Remaining workload
- Focus & burnout warnings

### ✔ Analytics Dashboard
- Daily study hours (Line chart)
- Subject-wise time distribution (Pie chart)
- Weekly performance (Bar chart)
- Completion rate & streak tracking

### ✔ Syllabus Analysis (Advanced Feature)
- Upload syllabus 
- AI parses subjects & topics
- Auto-generates study plan from syllabus

---

# 🧠 AI Planner Logic Overview

### Inputs Used
- Available study hours per day
- Subject difficulty level
- Exam dates
- Pending topics & estimated hours

### Priority Score Formula
```
priorityScore =
(difficultyWeight × 0.4) +
(daysLeftWeight × 0.4) +
(topicLoadWeight × 0.2)
```

**Difficulty Weight**
- Easy → 1  
- Medium → 2  
- Hard → 3  

**Days Left Weight**
- ≤ 7 days → 3  
- ≤ 15 days → 2  
- > 15 days → 1  

**Topic Load**
```
totalRemainingHours / daysLeft
```

### Example AI Output
```
Today's Plan:
• Data Structures – 2.5 hrs
• DBMS – 1.5 hrs
• Mathematics – 1 hr
```

---

# 🛠 Tech Stack

### Frontend
- React + Vite
- Tailwind CSS
- React Router
- Axios
- Recharts
- Framer Motion

### Backend
- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT Authentication

---

# 📂 Project Structure
```
AI-Study-Planner/
│
├── frontend/
│ └── src/
│ ├── components/
│ ├── pages/
│ ├── services/
│ ├── context/
│ ├── hooks/
│ ├── utils/
│ ├── App.jsx
│ └── main.jsx
│
├── backend/
│ ├── config/
│ ├── models/
│ ├── controllers/
│ ├── routes/
│ ├── middleware/
│ ├── utils/
│ ├── server.js
│ └── package.json
│
├── README.md
```

---

# 🗄 Database Schema Overview

### 👤 User
- Name
- Email
- Password (hashed)
- Daily study hours
- Preferred study time

### 📘 Subject
- Subject name
- Difficulty level
- Exam date
- Priority score

### 📗 Topic
- Topic name
- Estimated hours
- Completion status

### ⏱ Study Task
- Planned date & hours
- Actual hours
- Status (pending / completed / missed)

---

# 🔐 Authentication Flow

1. User registers / logs in  
2. Password hashed using bcrypt  
3. JWT token generated  
4. Token stored in localStorage  
5. Protected routes enabled  

---

# 📸 Syllabus Analysis Workflow

1. User syllabus text 
2. AI parses subjects & topics  
3. Topics mapped to estimated hours  
4. Planner auto-generates schedule  

This allows **zero-manual-entry onboarding**.

---

# 🏃 How to Run Locally

### **1. Clone the repository**
```bash
git clone https://github.com/your-username/AI-Study-Planner
```
### **2. Start Backend
```bash
cd backend
npm install
npm run dev
```
### **3. Start Frontend
```bash
cd frontend
npm install
npm run dev
```
# 📊 Analytics & Insights

The analytics dashboard provides actionable insights to help users study smarter and more efficiently.

### The dashboard helps users to:
- Monitor study consistency and daily/weekly streaks
- Identify weak or underperforming subjects
- Compare planned study time vs actual effort
- Detect burnout or overload patterns early

These insights help students **optimize learning efficiency**, not just increase time spent studying.

---

# 🏢 Real-World Use Case & Impact

The **AI Study Planner** can be effectively used by:
- College students
- Competitive exam aspirants
- Online and self-paced learners
- Coaching institutes and training programs

### Business & Educational Impact
- Improved exam preparation outcomes
- Reduced academic burnout
- Development of data-driven study habits
- Personalized learning plans at scale

---

# 🚀 Future Enhancements

### 🔧 AI Improvements
- GPT-based topic explanation generator
- Smart revision and spaced repetition scheduling
- Confidence score estimation per subject

### 📈 Productivity Features
- Integrated Pomodoro timer
- Calendar synchronization
- Push notifications & reminders
- PDF export of personalized study plans

### 📊 Analytics Expansion
- Cohort-wise performance comparison
- Performance forecasting using historical data
- Intelligent recommendation engine for study optimization

---





cd AI-Study-Planner
