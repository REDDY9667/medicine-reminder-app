import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createMedicine, getMedicine, updateMedicine } from '../services/api';
import './MedicineForm.css';

function MedicineForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    dosage: '',
    frequency: 'once_daily',
    schedule: [{ time: '08:00' }],
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    notes: '',
    isActive: true
  });

  useEffect(() => {
    if (id) {
      loadMedicine();
    }
  }, [id]);

  const loadMedicine = async () => {
    try {
      const response = await getMedicine(id);
      const medicine = response.medicine;
      setFormData({
        name: medicine.name,
        dosage: medicine.dosage,
        frequency: medicine.frequency,
        schedule: medicine.schedule,
        startDate: medicine.startDate.split('T')[0],
        endDate: medicine.endDate ? medicine.endDate.split('T')[0] : '',
        notes: medicine.notes || '',
        isActive: medicine.isActive
      });
    } catch (error) {
      setError('Failed to load medicine details');
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });

    // Auto-update schedule based on frequency
    if (name === 'frequency') {
      updateScheduleByFrequency(value);
    }
  };

  const updateScheduleByFrequency = (frequency) => {
    let newSchedule = [];
    switch (frequency) {
      case 'once_daily':
        newSchedule = [{ time: '08:00' }];
        break;
      case 'twice_daily':
        newSchedule = [{ time: '08:00' }, { time: '20:00' }];
        break;
      case 'three_times':
        newSchedule = [{ time: '08:00' }, { time: '14:00' }, { time: '20:00' }];
        break;
      default:
        newSchedule = [{ time: '08:00' }];
    }
    setFormData(prev => ({ ...prev, schedule: newSchedule }));
  };

  const handleScheduleChange = (index, value) => {
    const newSchedule = [...formData.schedule];
    newSchedule[index].time = value;
    setFormData({ ...formData, schedule: newSchedule });
  };

  const addScheduleSlot = () => {
    setFormData({
      ...formData,
      schedule: [...formData.schedule, { time: '08:00' }]
    });
  };

  const removeScheduleSlot = (index) => {
    const newSchedule = formData.schedule.filter((_, i) => i !== index);
    setFormData({ ...formData, schedule: newSchedule });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (id) {
        await updateMedicine(id, formData);
      } else {
        await createMedicine(formData);
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save medicine');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="medicine-form-container">
      <div className="medicine-form-card">
        <div className="form-header">
          <button onClick={() => navigate('/dashboard')} className="back-btn">
            ← Back
          </button>
          <h2>{id ? 'Edit Medicine' : 'Add New Medicine'}</h2>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Medicine Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="e.g., Aspirin, Vitamin D"
            />
          </div>

          <div className="form-group">
            <label>Dosage *</label>
            <input
              type="text"
              name="dosage"
              value={formData.dosage}
              onChange={handleChange}
              required
              placeholder="e.g., 100mg, 2 tablets"
            />
          </div>

          <div className="form-group">
            <label>Frequency *</label>
            <select
              name="frequency"
              value={formData.frequency}
              onChange={handleChange}
              required
            >
              <option value="once_daily">Once Daily</option>
              <option value="twice_daily">Twice Daily</option>
              <option value="three_times">Three Times Daily</option>
              <option value="custom">Custom</option>
            </select>
          </div>

          <div className="form-group">
            <label>Schedule Times *</label>
            {formData.schedule.map((slot, index) => (
              <div key={index} className="schedule-input">
                <input
                  type="time"
                  value={slot.time}
                  onChange={(e) => handleScheduleChange(index, e.target.value)}
                  required
                />
                {formData.schedule.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeScheduleSlot(index)}
                    className="btn-remove"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addScheduleSlot}
              className="btn-add-time"
            >
              + Add Time Slot
            </button>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Start Date *</label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>End Date (Optional)</label>
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Notes</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="3"
              placeholder="Any special instructions..."
            />
          </div>

          <div className="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleChange}
              />
              Active
            </label>
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="btn-cancel"
            >
              Cancel
            </button>
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? 'Saving...' : id ? 'Update Medicine' : 'Add Medicine'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default MedicineForm;