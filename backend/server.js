const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cron = require('node-cron');
require('dotenv').config();

const app = express();
//this change is done in chatbot branch
// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/medicine-reminder')
.then(() => console.log('✅ MongoDB Connected'))
.catch(err => console.log('❌ MongoDB Connection Error:', err));

// Routes
const authRoutes = require('./routes/auth');
const medicineRoutes = require('./routes/medicine');
const reminderRoutes = require('./routes/reminder');

app.use('/api/auth', authRoutes);
app.use('/api/medicines', medicineRoutes);
app.use('/api/reminders', reminderRoutes);

// Cron job to check for reminders and missed doses every minute
cron.schedule('* * * * *', async () => {
  const Medicine = require('./models/Medicine');
  const now = new Date();
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  
  try {
    // 1. Trigger reminders for current time
    const medicines = await Medicine.find({ 
      isActive: true,
      'schedule.time': currentTime
    });
    
    if (medicines.length > 0) {
      console.log(`⏰ ${medicines.length} reminder(s) triggered at ${currentTime}`);
    }
    
    // 2. Check for missed doses (30-minute grace period)
    const allMedicines = await Medicine.find({ isActive: true });
    
    for (let med of allMedicines) {
      let updated = false;
      
      for (let i = 0; i < med.schedule.length; i++) {
        const slot = med.schedule[i];
        const [hour, min] = slot.time.split(':').map(Number);
        
        // Create dose time for today
        const doseTime = new Date(now);
        doseTime.setHours(hour, min, 0, 0);
        
        // Calculate grace period end (30 minutes after dose time)
        const gracePeriodEnd = new Date(doseTime.getTime() + 30 * 60000);
        
        // If grace period has passed and dose wasn't taken
        if (now > gracePeriodEnd && !slot.taken) {
          // Check if already logged as missed today
          const alreadyLogged = med.reminderLog.some(log => {
            const logDate = new Date(log.date);
            return log.time === slot.time && 
                   log.status === 'missed' &&
                   logDate.toDateString() === now.toDateString();
          });
          
          if (!alreadyLogged) {
            med.reminderLog.push({
              date: doseTime,
              time: slot.time,
              status: 'missed'
            });
            updated = true;
            console.log(`❌ Marked as missed: ${med.name} at ${slot.time}`);
          }
        }
      }
      
      if (updated) {
        await med.save();
      }
    }
  } catch (error) {
    console.error('Cron job error:', error);
  }
});

// Reset daily doses at 1:41 AM IST
cron.schedule('47 1 * * *', async () => {
  const Medicine = require('./models/Medicine');
  
  try {
    const now = new Date();
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🌙 DAILY RESET TRIGGERED');
    console.log('Server Time:', now.toString());
    console.log('Timezone:', Intl.DateTimeFormat().resolvedOptions().timeZone);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const medicines = await Medicine.find({ isActive: true });
    console.log(`📊 Found ${medicines.length} active medicine(s)`);
    
    let resetCount = 0;
    
    for (let med of medicines) {
      let needsSave = false;
      
      // Reset all schedule slots for the new day
      med.schedule.forEach((slot, index) => {
        if (slot.taken || slot.takenAt) {
          console.log(`  ↻ Resetting ${med.name} - slot ${index + 1} (${slot.time})`);
          slot.taken = false;
          slot.takenAt = null;
          needsSave = true;
          resetCount++;
        }
      });
      
      if (needsSave) {
        await med.save();
      }
    }
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ Daily reset completed: ${resetCount} slot(s) reset`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  } catch (error) {
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('❌ DAILY RESET ERROR:', error);
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  }
}, {
  timezone: "Asia/Kolkata"  // Set your timezone here
});

// Health check route
app.get('/', (req, res) => {
  res.json({ message: 'Medicine Reminder API is running!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});