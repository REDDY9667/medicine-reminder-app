const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cron = require('node-cron');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/medicine-reminder', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB Connected'))
.catch(err => console.log('❌ MongoDB Connection Error:', err));

// Routes
const authRoutes = require('./routes/auth');
const medicineRoutes = require('./routes/medicine');
const reminderRoutes = require('./routes/reminder');

app.use('/api/auth', authRoutes);
app.use('/api/medicines', medicineRoutes);
app.use('/api/reminders', reminderRoutes);

// Cron job to check for reminders every minute
cron.schedule('* * * * *', async () => {
  const Medicine = require('./models/Medicine');
  const now = new Date();
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  
  try {
    const medicines = await Medicine.find({ 
      isActive: true,
      'schedule.time': currentTime
    });
    
    // Here you would send notifications
    if (medicines.length > 0) {
      console.log(`⏰ ${medicines.length} reminder(s) triggered at ${currentTime}`);
    }
  } catch (error) {
    console.error('Cron job error:', error);
  }
});

// Health check route
app.get('/', (req, res) => {
  res.json({ message: 'Medicine Reminder API is running!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});