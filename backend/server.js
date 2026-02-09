const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const { errorHandler, notFound } = require('./middleware/errorMiddleware');

const plannerRoutes = require('./routes/plannerRoutes');

const cors = require('cors');

app.use(cors({
  origin: 'https://studyaiplanner.vercel.app/',  // Your frontend URL
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Load environment variables
dotenv.config();

const app = express();

// Middleware

app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL 
    : 'http://localhost:5173',
  credentials: true,
}));


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api/planner', plannerRoutes);
// Routes
const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

const subjectRoutes = require('./routes/subjectRoutes');
app.use('/api/subjects', subjectRoutes);

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'AI Study Planner API is running!' });
});

// Error Handling
app.use(notFound);
app.use(errorHandler);

// Database connection
const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected successfully');
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });