/**
 * API mocking helpers for Playwright tests
 * Provides utilities to intercept and mock API requests
 */

import { sampleEmployees, sampleAttendance, dashboardSummary, employeesWithAttendance, errorResponses } from '../fixtures/test-data.js';

/**
 * Mock successful employee list response
 */
export const mockEmployeeList = (page, employees = sampleEmployees) => {
  return page.route('**/api/employees', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(employees),
      });
    }
  });
};

/**
 * Mock empty employee list
 */
export const mockEmptyEmployeeList = (page) => {
  return page.route('**/api/employees', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    }
  });
};

/**
 * Mock successful employee creation
 */
export const mockEmployeeCreation = (page, responseData = null) => {
  return page.route('**/api/employees', async (route) => {
    if (route.request().method() === 'POST') {
      const postData = JSON.parse(route.request().postData());
      const response = responseData || { id: 999, ...postData };
      
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify(response),
      });
    }
  });
};

/**
 * Mock employee creation with duplicate email error
 */
export const mockEmployeeCreationDuplicateError = (page) => {
  return page.route('**/api/employees', async (route) => {
    if (route.request().method() === 'POST') {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify(errorResponses.duplicateEmail),
      });
    }
  });
};

/**
 * Mock successful employee deletion
 */
export const mockEmployeeDeletion = (page) => {
  return page.route('**/api/employees/*', async (route) => {
    if (route.request().method() === 'DELETE') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Employee deleted successfully' }),
      });
    }
  });
};

/**
 * Mock attendance records for an employee
 */
export const mockAttendanceRecords = (page, records = sampleAttendance) => {
  return page.route('**/api/attendance/*', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(records),
      });
    }
  });
};

/**
 * Mock empty attendance records
 */
export const mockEmptyAttendanceRecords = (page) => {
  return page.route('**/api/attendance/*', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    }
  });
};

/**
 * Mock successful attendance marking
 */
export const mockAttendanceMarking = (page) => {
  return page.route('**/api/attendance', async (route) => {
    if (route.request().method() === 'POST') {
      const postData = JSON.parse(route.request().postData());
      const response = { id: 999, ...postData };
      
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify(response),
      });
    }
  });
};

/**
 * Mock dashboard summary
 */
export const mockDashboardSummary = (page, summary = dashboardSummary) => {
  return page.route('**/api/dashboard/summary*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(summary),
    });
  });
};

/**
 * Mock employees with attendance data
 */
export const mockEmployeesWithAttendance = (page, employees = employeesWithAttendance) => {
  return page.route('**/api/dashboard/employees*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(employees),
    });
  });
};

/**
 * Mock API error (500)
 */
export const mockAPIError = (page, endpoint = '**/api/**') => {
  return page.route(endpoint, async (route) => {
    await route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify(errorResponses.serverError),
    });
  });
};

/**
 * Mock loading delay (for testing loading states)
 */
export const mockWithDelay = async (page, endpoint, responseData, delay = 2000) => {
  return page.route(endpoint, async (route) => {
    await new Promise(resolve => setTimeout(resolve, delay));
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(responseData),
    });
  });
};

/**
 * Setup common mocks for a page (employees list and dashboard)
 */
export const setupCommonMocks = async (page) => {
  await mockEmployeeList(page);
  await mockDashboardSummary(page);
  await mockEmployeesWithAttendance(page);
};
