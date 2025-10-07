import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMedicines, deleteMedicine, markDoseTaken, getStats, getUpcomingReminders, checkMissedDoses } from '../services/api';
import './Dashboard.css';

function Dashboard({ onLogout }) {
  const [medicines, setMedicines] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('medicines');
  const navigate = useNavigate();

  useEffect(() => {
    loadData();

    // Check for missed doses on page load
    handleCheckMissedDoses();

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Check for reminders every minute
    const interval = setInterval(() => {
      checkReminders();
      handleCheckMissedDoses(); // Also check missed doses periodically
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [medicinesRes, remindersRes, statsRes] = await Promise.all([
        getMedicines(),
        getUpcomingReminders(),
        getStats()
      ]);
      
      setMedicines(medicinesRes.medicines);
      setReminders(remindersRes.reminders);
      setStats(statsRes.stats);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkReminders = async () => {
    try {
      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      
      const remindersRes = await getUpcomingReminders();
      const dueReminders = remindersRes.reminders.filter(
        r => r.time === currentTime && !r.taken
      );

      dueReminders.forEach(reminder => {
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('💊 Medicine Reminder', {
            body: `Time to take ${reminder.medicineName} - ${reminder.dosage}`,
            icon: '/pill-icon.png'
          });
        }
      });
    } catch (error) {
      console.error('Failed to check reminders:', error);
    }
  };

    const handleCheckMissedDoses = async () => {
    try {
      const response = await checkMissedDoses();
      if (response.success && response.missedCount > 0) {
        console.log(`📊 ${response.missedCount} missed dose(s) detected`);
        // Reload data to reflect changes
        loadData();
      }
    } catch (error) {
      console.error('Failed to check missed doses:', error);
    }
  };
  
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this medicine?')) {
      try {
        await deleteMedicine(id);
        loadData();
      } catch (error) {
        alert('Failed to delete medicine');
      }
    }
  };

  const handleMarkTaken = async (medicineId, scheduleIndex) => {
    try {
      await markDoseTaken(medicineId, scheduleIndex);
      loadData();
    } catch (error) {
      alert('Failed to mark dose as taken');
    }
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      onLogout();
      navigate('/login');
    }
  };

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>💊 Medicine Reminder Dashboard</h1>
        <div className="header-actions">
          <button onClick={() => navigate('/analytics')} className="btn-analytics">
            📊 Analytics
          </button>
          <button onClick={() => navigate('/add-medicine')} className="btn-primary">
            + Add Medicine
          </button>
          <button onClick={handleLogout} className="btn-secondary">
            Logout
          </button>
        </div>
      </header>

      {stats && (
        <div className="stats-cards">
          <div className="stat-card">
            <h3>Active Medicines</h3>
            <p className="stat-number">{stats.activeMedicines}</p>
          </div>
          <div className="stat-card">
            <h3>Adherence Rate</h3>
            <p className="stat-number">{stats.adherenceRate}%</p>
          </div>
          <div className="stat-card">
            <h3>Doses Taken</h3>
            <p className="stat-number">{stats.takenDoses}</p>
          </div>
          <div className="stat-card">
            <h3>Doses Missed</h3>
            <p className="stat-number">{stats.missedDoses}</p>
          </div>
        </div>
      )}

      <div className="tabs">
        <button 
          className={activeTab === 'medicines' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('medicines')}
        >
          My Medicines
        </button>
        <button 
          className={activeTab === 'reminders' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('reminders')}
        >
          Today's Schedule
        </button>
      </div>

      {activeTab === 'medicines' && (
        <div className="medicines-list">
          <h2>My Medicines</h2>
          {medicines.length === 0 ? (
            <div className="empty-state">
              <p>No medicines added yet. Click "Add Medicine" to get started!</p>
            </div>
          ) : (
            <div className="medicine-cards">
              {medicines.map(medicine => (
                <div key={medicine._id} className="medicine-card">
                  <div className="medicine-header">
                    <h3>{medicine.name}</h3>
                    <span className={medicine.isActive ? 'badge active' : 'badge inactive'}>
                      {medicine.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  
                  <div className="medicine-details">
                    <p><strong>Dosage:</strong> {medicine.dosage}</p>
                    <p><strong>Frequency:</strong> {medicine.frequency.replace('_', ' ')}</p>
                    <p><strong>Schedule:</strong></p>
                    <div className="schedule-times">
                      {medicine.schedule.map((slot, idx) => (
                        <span key={idx} className="time-badge">
                          {slot.time}
                        </span>
                      ))}
                    </div>
                    {medicine.notes && <p><strong>Notes:</strong> {medicine.notes}</p>}
                  </div>

                  <div className="medicine-actions">
                    <button 
                      onClick={() => navigate(`/edit-medicine/${medicine._id}`)}
                      className="btn-edit"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDelete(medicine._id)}
                      className="btn-delete"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'reminders' && (
        <div className="reminders-list">
          <h2>Today's Medication Schedule</h2>
          {reminders.length === 0 ? (
            <div className="empty-state">
              <p>No reminders scheduled for today.</p>
            </div>
          ) : (
            <div className="reminder-cards">
              {reminders.map((reminder, idx) => (
                <div key={idx} className={`reminder-card ${reminder.taken ? 'taken' : ''}`}>
                  <div className="reminder-time">
                    <span className="time">{reminder.time}</span>
                  </div>
                  <div className="reminder-details">
                    <h4>{reminder.medicineName}</h4>
                    <p>{reminder.dosage}</p>
                  </div>
                  <div className="reminder-action">
                    {reminder.taken ? (
                      <span className="taken-badge">✓ Taken</span>
                    ) : (
                      <button
                        onClick={() => handleMarkTaken(reminder.medicineId, reminder.scheduleIndex)}
                        className="btn-take"
                      >
                        Mark as Taken
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Dashboard;