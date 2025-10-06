const express = require('express');
const router = express.Router();
const Medicine = require('../models/Medicine');
const authMiddleware = require('../middleware/auth');

// Get all medicines for user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const medicines = await Medicine.find({ 
      userId: req.userId 
    }).sort({ createdAt: -1 });
    
    res.json({ success: true, medicines });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch medicines', 
      error: error.message 
    });
  }
});

// Get single medicine
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const medicine = await Medicine.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!medicine) {
      return res.status(404).json({ 
        success: false, 
        message: 'Medicine not found' 
      });
    }

    res.json({ success: true, medicine });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch medicine', 
      error: error.message 
    });
  }
});

// Create medicine
router.post('/', authMiddleware, async (req, res) => {
  try {
    const medicineData = {
      ...req.body,
      userId: req.userId
    };

    const medicine = new Medicine(medicineData);
    await medicine.save();

    res.status(201).json({
      success: true,
      message: 'Medicine added successfully',
      medicine
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to add medicine', 
      error: error.message 
    });
  }
});

// Update medicine
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const medicine = await Medicine.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!medicine) {
      return res.status(404).json({ 
        success: false, 
        message: 'Medicine not found' 
      });
    }

    res.json({
      success: true,
      message: 'Medicine updated successfully',
      medicine
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update medicine', 
      error: error.message 
    });
  }
});

// Delete medicine
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const medicine = await Medicine.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId
    });

    if (!medicine) {
      return res.status(404).json({ 
        success: false, 
        message: 'Medicine not found' 
      });
    }

    res.json({
      success: true,
      message: 'Medicine deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete medicine', 
      error: error.message 
    });
  }
});

// Mark dose as taken
router.post('/:id/take', authMiddleware, async (req, res) => {
  try {
    const { scheduleIndex } = req.body;
    const medicine = await Medicine.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!medicine) {
      return res.status(404).json({ 
        success: false, 
        message: 'Medicine not found' 
      });
    }

    medicine.schedule[scheduleIndex].taken = true;
    medicine.schedule[scheduleIndex].takenAt = new Date();
    
    medicine.reminderLog.push({
      date: new Date(),
      time: medicine.schedule[scheduleIndex].time,
      status: 'taken'
    });

    await medicine.save();

    res.json({
      success: true,
      message: 'Dose marked as taken',
      medicine
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update dose status', 
      error: error.message 
    });
  }
});

// Reset daily doses
router.post('/reset-daily', authMiddleware, async (req, res) => {
  try {
    const medicines = await Medicine.find({ 
      userId: req.userId,
      isActive: true 
    });

    for (let medicine of medicines) {
      medicine.schedule.forEach(slot => {
        slot.taken = false;
        slot.takenAt = null;
      });
      await medicine.save();
    }

    res.json({
      success: true,
      message: 'Daily doses reset successfully'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to reset doses', 
      error: error.message 
    });
  }
});

module.exports = router;