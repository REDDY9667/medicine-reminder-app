import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Auth APIs
export const register = async (userData) => {
  const response = await axios.post(`${API_URL}/auth/register`, userData);
  return response.data;
};

export const login = async (credentials) => {
  const response = await axios.post(`${API_URL}/auth/login`, credentials);
  return response.data;
};

export const getCurrentUser = async () => {
  const response = await axios.get(`${API_URL}/auth/me`, {
    headers: getAuthHeader()
  });
  return response.data;
};

// Medicine APIs
export const getMedicines = async () => {
  const response = await axios.get(`${API_URL}/medicines`, {
    headers: getAuthHeader()
  });
  return response.data;
};

export const getMedicine = async (id) => {
  const response = await axios.get(`${API_URL}/medicines/${id}`, {
    headers: getAuthHeader()
  });
  return response.data;
};

export const createMedicine = async (medicineData) => {
  const response = await axios.post(`${API_URL}/medicines`, medicineData, {
    headers: getAuthHeader()
  });
  return response.data;
};

export const updateMedicine = async (id, medicineData) => {
  const response = await axios.put(`${API_URL}/medicines/${id}`, medicineData, {
    headers: getAuthHeader()
  });
  return response.data;
};

export const deleteMedicine = async (id) => {
  const response = await axios.delete(`${API_URL}/medicines/${id}`, {
    headers: getAuthHeader()
  });
  return response.data;
};

export const markDoseTaken = async (id, scheduleIndex) => {
  const response = await axios.post(
    `${API_URL}/medicines/${id}/take`,
    { scheduleIndex },
    { headers: getAuthHeader() }
  );
  return response.data;
};

// Reminder APIs
export const getUpcomingReminders = async () => {
  const response = await axios.get(`${API_URL}/reminders/upcoming`, {
    headers: getAuthHeader()
  });
  return response.data;
};

export const getReminderHistory = async (startDate, endDate) => {
  const response = await axios.get(`${API_URL}/reminders/history`, {
    params: { startDate, endDate },
    headers: getAuthHeader()
  });
  return response.data;
};

export const getStats = async () => {
  const response = await axios.get(`${API_URL}/reminders/stats`, {
    headers: getAuthHeader()
  });
  return response.data;
};


// Check for missed doses
export const checkMissedDoses = async () => {
  const response = await axios.post(`${API_URL}/reminders/check-missed`, {}, {
    headers: getAuthHeader()
  });
  return response.data;
};