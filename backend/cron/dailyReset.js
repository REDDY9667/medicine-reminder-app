const mongoose = require('mongoose');
const cron = require('node-cron');
require('dotenv').config();

const Medicine = require('../models/Medicine');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/medicine-reminder')
  .then(() => console.log('✅ Daily Reset Cron: MongoDB Connected'))
  .catch(err => console.log('❌ Daily Reset Cron: MongoDB Error:', err));

cron.schedule('53 1 * * *', async () => {
  try {
    const now = new Date();
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🌙 DAILY RESET TRIGGERED');
    console.log('Server Time:', now.toString());
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const medicines = await Medicine.find({ isActive: true });
    console.log(`📊 Found ${medicines.length} active medicine(s)`);

    let resetCount = 0;
    for (let med of medicines) {
      let needsSave = false;
      med.schedule.forEach((slot, i) => {
        if (slot.taken || slot.takenAt) {
          slot.taken = false;
          slot.takenAt = null;
          needsSave = true;
          resetCount++;
          console.log(`↻ Reset: ${med.name} - slot ${i + 1} (${slot.time})`);
        }
      });
      if (needsSave) await med.save();
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ Daily reset completed: ${resetCount} slot(s) reset`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  } catch (error) {
    console.error('❌ DAILY RESET ERROR:', error);
  }
}, {
  timezone: "Asia/Kolkata"
});

console.log('🌙 Daily reset cron started...');
