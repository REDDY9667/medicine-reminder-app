const express = require('express');
const router = express.Router();
const Medicine = require('../models/Medicine');
const authMiddleware = require('../middleware/auth');

// Get upcoming reminders
router.get('/upcoming', authMiddleware, async (req, res) => {
  try {
    const medicines = await Medicine.find({
      userId: req.userId,
      isActive: true
    });

    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const upcomingReminders = [];
    
    medicines.forEach(medicine => {
      medicine.schedule.forEach((slot, index) => {
        upcomingReminders.push({
          medicineId: medicine._id,
          medicineName: medicine.name,
          dosage: medicine.dosage,
          time: slot.time,
          taken: slot.taken,
          scheduleIndex: index
        });
      });
    });

    // Sort by time
    upcomingReminders.sort((a, b) => a.time.localeCompare(b.time));

    res.json({ success: true, reminders: upcomingReminders });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch reminders', 
      error: error.message 
    });
  }
});

// Get reminder history/log
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const medicines = await Medicine.find({
      userId: req.userId
    });

    let allLogs = [];
    
    medicines.forEach(medicine => {
      medicine.reminderLog.forEach(log => {
        allLogs.push({
          medicineId: medicine._id,
          medicineName: medicine.name,
          dosage: medicine.dosage,
          ...log._doc
        });
      });
    });

    // Sort by date descending
    allLogs.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Filter by date range if provided
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      allLogs = allLogs.filter(log => {
        const logDate = new Date(log.date);
        return logDate >= start && logDate <= end;
      });
    }

    res.json({ success: true, history: allLogs });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch history', 
      error: error.message 
    });
  }
});

// Get adherence statistics
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const medicines = await Medicine.find({
      userId: req.userId,
      isActive: true
    });

    let totalDoses = 0;
    let takenDoses = 0;
    let missedDoses = 0;

    medicines.forEach(medicine => {
      medicine.reminderLog.forEach(log => {
        totalDoses++;
        if (log.status === 'taken') takenDoses++;
        if (log.status === 'missed') missedDoses++;
      });
    });

    const adherenceRate = totalDoses > 0 
      ? ((takenDoses / totalDoses) * 100).toFixed(1) 
      : 0;

    res.json({
      success: true,
      stats: {
        totalDoses,
        takenDoses,
        missedDoses,
        adherenceRate: parseFloat(adherenceRate),
        activeMedicines: medicines.length
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch statistics', 
      error: error.message 
    });
  }
});

module.exports = router;