import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { getReminderHistory, getStats } from '../services/api';
import './Analytics.css';

function Analytics() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [timeRange, setTimeRange] = useState('week'); // week, month, year

  useEffect(() => {
    loadAnalyticsData();
  }, [timeRange]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      
      // Get stats
      const statsResponse = await getStats();
      setStats(statsResponse.stats);

      // Get history based on time range
      const endDate = new Date();
      let startDate = new Date();
      
      switch(timeRange) {
        case 'week':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(endDate.getMonth() - 1);
          break;
        case 'year':
          startDate.setFullYear(endDate.getFullYear() - 1);
          break;
        default:
          startDate.setDate(endDate.getDate() - 7);
      }

      const historyResponse = await getReminderHistory(
        startDate.toISOString(),
        endDate.toISOString()
      );

      // Process history data for charts
      const processed = processHistoryData(historyResponse.history);
      setHistoryData(processed);

    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const processHistoryData = (history) => {
    const dateMap = {};

    history.forEach(log => {
      const date = new Date(log.date).toLocaleDateString();
      
      if (!dateMap[date]) {
        dateMap[date] = {
          date: date,
          taken: 0,
          missed: 0,
          skipped: 0,
          total: 0
        };
      }

      dateMap[date][log.status]++;
      dateMap[date].total++;
    });

    return Object.values(dateMap).sort((a, b) => 
      new Date(a.date) - new Date(b.date)
    );
  };

  // Calculate adherence trend data
  const getAdherenceTrend = () => {
    return historyData.map(day => ({
      date: day.date,
      adherence: day.total > 0 ? ((day.taken / day.total) * 100).toFixed(1) : 0
    }));
  };

  // Pie chart data
  const getPieData = () => {
    if (!stats) return [];
    
    return [
      { name: 'Taken', value: stats.takenDoses, color: '#28a745' },
      { name: 'Missed', value: stats.missedDoses, color: '#dc3545' },
    ];
  };

  // Weekly comparison data
  const getWeeklyData = () => {
    return historyData.slice(-7).map(day => ({
      day: new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' }),
      taken: day.taken,
      missed: day.missed
    }));
  };

  if (loading) {
    return <div className="loading">Loading analytics...</div>;
  }

  const adherenceTrend = getAdherenceTrend();
  const pieData = getPieData();
  const weeklyData = getWeeklyData();

  return (
    <div className="analytics-container">
      <div className="analytics-header">
        <button onClick={() => navigate('/dashboard')} className="back-btn">
          ← Back to Dashboard
        </button>
        <h1>📊 Analytics & Insights</h1>
        
        <div className="time-range-selector">
          <button 
            className={timeRange === 'week' ? 'active' : ''}
            onClick={() => setTimeRange('week')}
          >
            Week
          </button>
          <button 
            className={timeRange === 'month' ? 'active' : ''}
            onClick={() => setTimeRange('month')}
          >
            Month
          </button>
          <button 
            className={timeRange === 'year' ? 'active' : ''}
            onClick={() => setTimeRange('year')}
          >
            Year
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {stats && (
        <div className="stats-summary">
          <div className="summary-card">
            <div className="card-icon">💊</div>
            <div className="card-content">
              <h3>Total Doses</h3>
              <p className="big-number">{stats.totalDoses}</p>
            </div>
          </div>
          
          <div className="summary-card success">
            <div className="card-icon">✅</div>
            <div className="card-content">
              <h3>Doses Taken</h3>
              <p className="big-number">{stats.takenDoses}</p>
            </div>
          </div>
          
          <div className="summary-card danger">
            <div className="card-icon">❌</div>
            <div className="card-content">
              <h3>Doses Missed</h3>
              <p className="big-number">{stats.missedDoses}</p>
            </div>
          </div>
          
          <div className="summary-card primary">
            <div className="card-icon">📈</div>
            <div className="card-content">
              <h3>Adherence Rate</h3>
              <p className="big-number">{stats.adherenceRate}%</p>
            </div>
          </div>
        </div>
      )}

      {/* Charts Grid */}
      <div className="charts-grid">
        
        {/* Adherence Trend Line Chart */}
        <div className="chart-card full-width">
          <h3>📈 Adherence Trend Over Time</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={adherenceTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="adherence" 
                stroke="#667eea" 
                strokeWidth={3}
                name="Adherence %"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Weekly Doses Bar Chart */}
        <div className="chart-card">
          <h3>📊 Weekly Doses Overview</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="taken" fill="#28a745" name="Taken" />
              <Bar dataKey="missed" fill="#dc3545" name="Missed" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart - Taken vs Missed */}
        <div className="chart-card">
          <h3>🥧 Taken vs Missed Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${entry.name}: ${entry.value}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Daily Breakdown */}
        <div className="chart-card full-width">
          <h3>📅 Daily Medication Breakdown</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={historyData.slice(-14)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="taken" stackId="a" fill="#28a745" name="Taken" />
              <Bar dataKey="missed" stackId="a" fill="#dc3545" name="Missed" />
              <Bar dataKey="skipped" stackId="a" fill="#ffc107" name="Skipped" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Insights Section */}
      {stats && (
        <div className="insights-section">
          <h2>💡 Insights & Recommendations</h2>
          <div className="insights-grid">
            {stats.adherenceRate >= 80 && (
              <div className="insight-card success">
                <span className="insight-icon">🎉</span>
                <div>
                  <h4>Excellent Adherence!</h4>
                  <p>You're maintaining great medication discipline with {stats.adherenceRate}% adherence.</p>
                </div>
              </div>
            )}
            
            {stats.adherenceRate < 80 && stats.adherenceRate >= 60 && (
              <div className="insight-card warning">
                <span className="insight-icon">⚠️</span>
                <div>
                  <h4>Room for Improvement</h4>
                  <p>Your adherence is at {stats.adherenceRate}%. Try setting additional reminders.</p>
                </div>
              </div>
            )}
            
            {stats.adherenceRate < 60 && (
              <div className="insight-card danger">
                <span className="insight-icon">🚨</span>
                <div>
                  <h4>Action Needed</h4>
                  <p>Your adherence is low at {stats.adherenceRate}%. Consider reviewing your medication schedule.</p>
                </div>
              </div>
            )}
            
            {stats.missedDoses > 0 && (
              <div className="insight-card info">
                <span className="insight-icon">📱</span>
                <div>
                  <h4>Enable Notifications</h4>
                  <p>You've missed {stats.missedDoses} doses. Enable browser notifications for timely reminders.</p>
                </div>
              </div>
            )}
            
            <div className="insight-card info">
              <span className="insight-icon">💊</span>
              <div>
                <h4>Active Medications</h4>
                <p>You're currently managing {stats.activeMedicines} active medication{stats.activeMedicines !== 1 ? 's' : ''}.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Analytics;