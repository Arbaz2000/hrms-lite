/**
 * Test data fixtures for Playwright tests
 * Contains sample employees, attendance records, and API responses
 */

// Sample employees for testing
export const sampleEmployees = [
  {
    id: 1,
    full_name: 'John Doe',
    email: 'john.doe@example.com',
    department: 'Engineering',
  },
  {
    id: 2,
    full_name: 'Jane Smith',
    email: 'jane.smith@example.com',
    department: 'HR',
  },
  {
    id: 3,
    full_name: 'Bob Johnson',
    email: 'bob.johnson@example.com',
    department: 'Marketing',
  },
];

// Sample employee for creation tests
export const newEmployee = {
  full_name: 'Test Employee',
  email: 'test.employee@example.com',
  department: 'Testing',
};

// Sample attendance records
export const sampleAttendance = [
  {
    id: 1,
    employee_id: 1,
    date: '2026-02-10T09:00:00Z',
    status: 'Present',
  },
  {
    id: 2,
    employee_id: 1,
    date: '2026-02-11T09:00:00Z',
    status: 'Present',
  },
  {
    id: 3,
    employee_id: 1,
    date: '2026-02-12T09:00:00Z',
    status: 'Absent',
  },
];

// Dashboard summary mock data
export const dashboardSummary = {
  total_employees: 3,
  total_attendance_records: 10,
  present_count: 7,
  absent_count: 3,
  attendance_rate: 70.0,
};

// Employees with attendance data
export const employeesWithAttendance = [
  {
    id: 1,
    full_name: 'John Doe',
    email: 'john.doe@example.com',
    department: 'Engineering',
    present_count: 5,
    absent_count: 1,
    total_records: 6,
  },
  {
    id: 2,
    full_name: 'Jane Smith',
    email: 'jane.smith@example.com',
    department: 'HR',
    present_count: 2,
    absent_count: 2,
    total_records: 4,
  },
];

// Error responses
export const errorResponses = {
  duplicateEmail: {
    detail: 'Employee with this email already exists',
  },
  notFound: {
    detail: 'Employee not found',
  },
  validationError: {
    detail: 'Invalid input data',
  },
  serverError: {
    detail: 'Internal server error',
  },
};

// Helper to generate unique email
export const generateUniqueEmail = () => {
  const timestamp = Date.now();
  return `test.${timestamp}@example.com`;
};

// Helper to generate unique employee
export const generateUniqueEmployee = () => ({
  full_name: `Test Employee ${Date.now()}`,
  email: generateUniqueEmail(),
  department: 'Testing',
});

// Date helpers for testing
export const testDates = {
  today: new Date().toISOString().split('T')[0],
  yesterday: new Date(Date.now() - 86400000).toISOString().split('T')[0],
  tomorrow: new Date(Date.now() + 86400000).toISOString().split('T')[0],
  lastWeek: new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0],
};
