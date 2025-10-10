const mongoose = require('mongoose');
const cron = require('node-cron');
require('dotenv').config();

const Medicine = require('../models/Medicine');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/medicine-reminder')
  .then(() => console.log('✅ Reminder Cron: MongoDB Connected'))
  .catch(err => console.log('❌ Reminder Cron: MongoDB Error:', err));

// Every minute
cron.schedule('* * * * *', async () => {
  const now = new Date();
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  try {
    // 1. Trigger reminders
    const medicines = await Medicine.find({
      isActive: true,
      'schedule.time': currentTime
    });

    if (medicines.length > 0) {
      console.log(`⏰ ${medicines.length} reminder(s) triggered at ${currentTime}`);
    }

    // 2. Missed doses (30-min grace)
    const allMedicines = await Medicine.find({ isActive: true });

    for (let med of allMedicines) {
      let updated = false;

      for (let slot of med.schedule) {
        const [hour, min] = slot.time.split(':').map(Number);
        const doseTime = new Date(now);
        doseTime.setHours(hour, min, 0, 0);

        const gracePeriodEnd = new Date(doseTime.getTime() + 30 * 60000);

        if (now > gracePeriodEnd && !slot.taken) {
          const alreadyLogged = med.reminderLog.some(log => {
            const logDate = new Date(log.date);
            return (
              log.time === slot.time &&
              log.status === 'missed' &&
              logDate.toDateString() === now.toDateString()
            );
          });

          if (!alreadyLogged) {
            med.reminderLog.push({
              date: doseTime,
              time: slot.time,
              status: 'missed',
            });
            updated = true;
            console.log(`❌ Marked missed: ${med.name} at ${slot.time}`);
          }
        }
      }

      if (updated) await med.save();
    }
  } catch (error) {
    console.error('Reminder Cron error:', error);
  }
});

console.log('🕐 Reminder checker cron started...');
