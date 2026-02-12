import axios from 'axios';

// Create axios instance with base URL
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Employee API calls
export const employeeAPI = {
  getAll: async () => {
    const response = await apiClient.get('/api/employees');
    return response.data;
  },
  
  create: async (employeeData) => {
    const response = await apiClient.post('/api/employees', employeeData);
    return response.data;
  },
  
  delete: async (employeeId) => {
    const response = await apiClient.delete(`/api/employees/${employeeId}`);
    return response.data;
  },
};

// Attendance API calls
export const attendanceAPI = {
  getByEmployee: async (employeeId, startDate = null, endDate = null) => {
    let url = `/api/attendance/${employeeId}`;
    const params = new URLSearchParams();
    
    if (startDate) {
      params.append('start_date', startDate);
    }
    if (endDate) {
      params.append('end_date', endDate);
    }
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    
    const response = await apiClient.get(url);
    return response.data;
  },
  
  mark: async (attendanceData) => {
    const response = await apiClient.post('/api/attendance', attendanceData);
    return response.data;
  },
};

// Dashboard API calls
export const dashboardAPI = {
  getSummary: async (startDate = null, endDate = null) => {
    let url = '/api/dashboard/summary';
    const params = new URLSearchParams();
    
    if (startDate) {
      params.append('start_date', startDate);
    }
    if (endDate) {
      params.append('end_date', endDate);
    }
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    
    const response = await apiClient.get(url);
    return response.data;
  },
  
  getEmployeesWithAttendance: async (status = null, startDate = null, endDate = null) => {
    let url = '/api/dashboard/employees';
    const params = new URLSearchParams();
    
    if (status) {
      params.append('status', status);
    }
    if (startDate) {
      params.append('start_date', startDate);
    }
    if (endDate) {
      params.append('end_date', endDate);
    }
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    
    const response = await apiClient.get(url);
    return response.data;
  },
};

export default apiClient;
