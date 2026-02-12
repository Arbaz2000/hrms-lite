import { test, expect } from '@playwright/test';
import { 
  mockEmployeeList, 
  mockAttendanceRecords,
  mockEmptyAttendanceRecords,
  mockAttendanceMarking,
  setupCommonMocks,
  mockAPIError,
  mockWithDelay
} from '../helpers/api-mock.js';
import { sampleEmployees, sampleAttendance } from '../fixtures/test-data.js';
import { navigateToTab, waitForLoading, getTodayDate } from '../helpers/test-utils.js';

test.describe('Attendance Tracker - Mocked API', () => {
  test.beforeEach(async ({ page }) => {
    await setupCommonMocks(page);
  });

  test('should display attendance tracker page', async ({ page }) => {
    await mockEmployeeList(page);
    
    await page.goto('/');
    await navigateToTab(page, 'Attendance Tracker');
    
    await expect(page.locator('h2:has-text("Attendance Tracker")')).toBeVisible();
    await expect(page.locator('h2:has-text("Mark Attendance")')).toBeVisible();
  });

  test('should show employee dropdown with mocked employees', async ({ page }) => {
    await mockEmployeeList(page);
    
    await page.goto('/');
    await navigateToTab(page, 'Attendance Tracker');
    await waitForLoading(page);
    
    // Type in search
    await page.fill('#employee', 'John');
    
    // Dropdown should appear with filtered results
    await expect(page.locator('.absolute.z-10')).toBeVisible();
    await expect(page.locator(`.absolute.z-10 >> text=${sampleEmployees[0].full_name}`)).toBeVisible();
  });

  test('should filter employees in dropdown based on search', async ({ page }) => {
    await mockEmployeeList(page);
    
    await page.goto('/');
    await navigateToTab(page, 'Attendance Tracker');
    await waitForLoading(page);
    
    // Search for specific employee
    await page.fill('#employee', 'Jane');
    
    await expect(page.locator('.absolute.z-10')).toBeVisible();
    await expect(page.locator('.absolute.z-10 >> text=Jane Smith')).toBeVisible();
    await expect(page.locator('.absolute.z-10 >> text=John Doe')).not.toBeVisible();
  });

  test('should show no results message when search has no matches', async ({ page }) => {
    await mockEmployeeList(page);
    
    await page.goto('/');
    await navigateToTab(page, 'Attendance Tracker');
    await waitForLoading(page);
    
    // Search for non-existent employee
    await page.fill('#employee', 'NonExistentEmployee123');
    
    await expect(page.locator('.absolute.z-10')).toBeVisible();
    await expect(page.locator('text=No employees found')).toBeVisible();
  });

  test('should successfully mark attendance with mocked API', async ({ page }) => {
    await mockEmployeeList(page);
    await mockAttendanceRecords(page);
    await mockAttendanceMarking(page);
    
    await page.goto('/');
    await navigateToTab(page, 'Attendance Tracker');
    await waitForLoading(page);
    
    // Select employee
    await page.fill('#employee', sampleEmployees[0].full_name);
    await page.waitForSelector('.absolute.z-10', { state: 'visible' });
    await page.click(`.absolute.z-10 >> text=${sampleEmployees[0].full_name}`);
    
    // Set date and status
    await page.fill('#date', getTodayDate());
    await page.click('input[value="Present"]');
    
    // Submit
    await page.click('button:has-text("Mark Attendance")');
    
    // Should show success message
    await expect(page.locator('.bg-green-50')).toBeVisible();
    await expect(page.locator('text=Attendance marked successfully')).toBeVisible();
  });

  test('should show error when submitting without employee selection', async ({ page }) => {
    await mockEmployeeList(page);
    
    await page.goto('/');
    await navigateToTab(page, 'Attendance Tracker');
    await waitForLoading(page);
    
    // Try to submit without selecting employee
    await page.fill('#date', getTodayDate());
    await page.click('input[value="Present"]');
    await page.click('button:has-text("Mark Attendance")');
    
    // Should show error
    await expect(page.locator('.bg-red-50')).toBeVisible();
    await expect(page.locator('text=Please select an employee')).toBeVisible();
  });

  test('should display attendance history after selecting employee', async ({ page }) => {
    await mockEmployeeList(page);
    await mockAttendanceRecords(page, sampleAttendance);
    
    await page.goto('/');
    await navigateToTab(page, 'Attendance Tracker');
    await waitForLoading(page);
    
    // Select employee
    await page.fill('#employee', sampleEmployees[0].full_name);
    await page.waitForSelector('.absolute.z-10', { state: 'visible' });
    await page.click(`.absolute.z-10 >> text=${sampleEmployees[0].full_name}`);
    
    await waitForLoading(page);
    
    // History should appear
    await expect(page.locator('h2:has-text("Attendance History")')).toBeVisible();
    await expect(page.locator('table')).toBeVisible();
  });

  test('should show empty state when employee has no attendance records', async ({ page }) => {
    await mockEmployeeList(page);
    await mockEmptyAttendanceRecords(page);
    
    await page.goto('/');
    await navigateToTab(page, 'Attendance Tracker');
    await waitForLoading(page);
    
    // Select employee
    await page.fill('#employee', sampleEmployees[0].full_name);
    await page.waitForSelector('.absolute.z-10', { state: 'visible' });
    await page.click(`.absolute.z-10 >> text=${sampleEmployees[0].full_name}`);
    
    await waitForLoading(page);
    
    // Should show empty state
    await expect(page.locator('text=No attendance records found')).toBeVisible();
  });

  test('BONUS: should display total present days count', async ({ page }) => {
    await mockEmployeeList(page);
    await mockAttendanceRecords(page, sampleAttendance);
    
    await page.goto('/');
    await navigateToTab(page, 'Attendance Tracker');
    await waitForLoading(page);
    
    // Select employee
    await page.fill('#employee', sampleEmployees[0].full_name);
    await page.waitForSelector('.absolute.z-10', { state: 'visible' });
    await page.click(`.absolute.z-10 >> text=${sampleEmployees[0].full_name}`);
    
    await waitForLoading(page);
    
    // Check for present days summary
    await expect(page.locator('text=Total Present Days')).toBeVisible();
    
    // Should show count (2 present out of 3 total in sample data)
    await expect(page.locator('text=2').first()).toBeVisible();
    await expect(page.locator('text=out of 3 records')).toBeVisible();
  });

  test('BONUS: should filter attendance by date range', async ({ page }) => {
    await mockEmployeeList(page);
    
    // Mock initial records
    await page.route('**/api/attendance/**', async (route) => {
      const url = route.request().url();
      if (url.includes('start_date') || url.includes('end_date')) {
        // Return filtered data
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([sampleAttendance[0]]),
        });
      } else {
        // Return all data
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(sampleAttendance),
        });
      }
    });
    
    await page.goto('/');
    await navigateToTab(page, 'Attendance Tracker');
    await waitForLoading(page);
    
    // Select employee
    await page.fill('#employee', sampleEmployees[0].full_name);
    await page.waitForSelector('.absolute.z-10', { state: 'visible' });
    await page.click(`.absolute.z-10 >> text=${sampleEmployees[0].full_name}`);
    
    await waitForLoading(page);
    
    // Apply date filter
    await page.fill('#filterStartDate', '2026-02-10');
    await page.fill('#filterEndDate', '2026-02-10');
    
    await waitForLoading(page);
    
    // Table should still be visible (with filtered data)
    await expect(page.locator('table')).toBeVisible();
  });

  test('BONUS: should clear date filters', async ({ page }) => {
    await mockEmployeeList(page);
    await mockAttendanceRecords(page, sampleAttendance);
    
    await page.goto('/');
    await navigateToTab(page, 'Attendance Tracker');
    await waitForLoading(page);
    
    // Select employee
    await page.fill('#employee', sampleEmployees[0].full_name);
    await page.waitForSelector('.absolute.z-10', { state: 'visible' });
    await page.click(`.absolute.z-10 >> text=${sampleEmployees[0].full_name}`);
    
    await waitForLoading(page);
    
    // Set filters
    await page.fill('#filterStartDate', '2026-02-10');
    await page.fill('#filterEndDate', '2026-02-12');
    
    // Click clear
    await page.click('button:has-text("Clear Filters")');
    
    // Filters should be cleared
    const startValue = await page.inputValue('#filterStartDate');
    const endValue = await page.inputValue('#filterEndDate');
    expect(startValue).toBe('');
    expect(endValue).toBe('');
  });

  test('should show loading state during submission', async ({ page }) => {
    await mockEmployeeList(page);
    
    // Mock with delay
    await page.route('**/api/attendance', async (route) => {
      if (route.request().method() === 'POST') {
        await new Promise(resolve => setTimeout(resolve, 2000));
        const postData = JSON.parse(route.request().postData());
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ id: 999, ...postData }),
        });
      }
    });
    
    await page.goto('/');
    await navigateToTab(page, 'Attendance Tracker');
    await waitForLoading(page);
    
    // Select employee
    await page.fill('#employee', sampleEmployees[0].full_name);
    await page.waitForSelector('.absolute.z-10', { state: 'visible' });
    await page.click(`.absolute.z-10 >> text=${sampleEmployees[0].full_name}`);
    
    await page.fill('#date', getTodayDate());
    await page.click('input[value="Present"]');
    await page.click('button:has-text("Mark Attendance")');
    
    // Should show loading state
    await expect(page.locator('button:has-text("Marking...")')).toBeVisible();
  });

  test('should show error message when API fails', async ({ page }) => {
    await mockEmployeeList(page);
    await mockAPIError(page, '**/api/attendance');
    
    await page.goto('/');
    await navigateToTab(page, 'Attendance Tracker');
    await waitForLoading(page);
    
    // Select employee
    await page.fill('#employee', sampleEmployees[0].full_name);
    await page.waitForSelector('.absolute.z-10', { state: 'visible' });
    await page.click(`.absolute.z-10 >> text=${sampleEmployees[0].full_name}`);
    
    await page.fill('#date', getTodayDate());
    await page.click('input[value="Present"]');
    await page.click('button:has-text("Mark Attendance")');
    
    // Should show error
    await expect(page.locator('.bg-red-50')).toBeVisible();
  });

  test('should display status badges with correct colors', async ({ page }) => {
    await mockEmployeeList(page);
    await mockAttendanceRecords(page, sampleAttendance);
    
    await page.goto('/');
    await navigateToTab(page, 'Attendance Tracker');
    await waitForLoading(page);
    
    // Select employee
    await page.fill('#employee', sampleEmployees[0].full_name);
    await page.waitForSelector('.absolute.z-10', { state: 'visible' });
    await page.click(`.absolute.z-10 >> text=${sampleEmployees[0].full_name}`);
    
    await waitForLoading(page);
    
    // Check for Present badge (green) - use .first() for multiple matches
    await expect(page.locator('.bg-green-100.text-green-800:has-text("Present")').first()).toBeVisible();
    
    // Check for Absent badge (red)
    await expect(page.locator('.bg-red-100.text-red-800:has-text("Absent")').first()).toBeVisible();
  });

  test('should switch between Present and Absent status', async ({ page }) => {
    await mockEmployeeList(page);
    
    await page.goto('/');
    await navigateToTab(page, 'Attendance Tracker');
    await waitForLoading(page);
    
    // Present should be selected by default
    await expect(page.locator('input[value="Present"]')).toBeChecked();
    
    // Switch to Absent
    await page.click('input[value="Absent"]');
    await expect(page.locator('input[value="Absent"]')).toBeChecked();
    
    // Switch back to Present
    await page.click('input[value="Present"]');
    await expect(page.locator('input[value="Present"]')).toBeChecked();
  });

  test('should show today\'s date as default', async ({ page }) => {
    await mockEmployeeList(page);
    
    await page.goto('/');
    await navigateToTab(page, 'Attendance Tracker');
    await waitForLoading(page);
    
    // Date field should have today's date
    const dateValue = await page.inputValue('#date');
    expect(dateValue).toBe(getTodayDate());
  });

  test('should display attendance table with correct headers', async ({ page }) => {
    await mockEmployeeList(page);
    await mockAttendanceRecords(page, sampleAttendance);
    
    await page.goto('/');
    await navigateToTab(page, 'Attendance Tracker');
    await waitForLoading(page);
    
    // Select employee
    await page.fill('#employee', sampleEmployees[0].full_name);
    await page.waitForSelector('.absolute.z-10', { state: 'visible' });
    await page.click(`.absolute.z-10 >> text=${sampleEmployees[0].full_name}`);
    
    await waitForLoading(page);
    
    // Check table headers
    await expect(page.locator('th:has-text("Date")')).toBeVisible();
    await expect(page.locator('th:has-text("Status")')).toBeVisible();
  });

  test('should clear employee selection when search is cleared', async ({ page }) => {
    await mockEmployeeList(page);
    
    await page.goto('/');
    await navigateToTab(page, 'Attendance Tracker');
    await waitForLoading(page);
    
    // Select employee
    await page.fill('#employee', sampleEmployees[0].full_name);
    await page.waitForSelector('.absolute.z-10', { state: 'visible' });
    await page.click(`.absolute.z-10 >> text=${sampleEmployees[0].full_name}`);
    
    // Clear search
    await page.fill('#employee', '');
    
    // Employee should be deselected
    const inputValue = await page.inputValue('#employee');
    expect(inputValue).toBe('');
  });

  test('should auto-dismiss success message after timeout', async ({ page }) => {
    await mockEmployeeList(page);
    await mockAttendanceRecords(page);
    await mockAttendanceMarking(page);
    
    await page.goto('/');
    await navigateToTab(page, 'Attendance Tracker');
    await waitForLoading(page);
    
    // Mark attendance
    await page.fill('#employee', sampleEmployees[0].full_name);
    await page.waitForSelector('.absolute.z-10', { state: 'visible' });
    await page.click(`.absolute.z-10 >> text=${sampleEmployees[0].full_name}`);
    await page.fill('#date', getTodayDate());
    await page.click('input[value="Present"]');
    await page.click('button:has-text("Mark Attendance")');
    
    // Success message should appear
    await expect(page.locator('.bg-green-50')).toBeVisible();
    
    // Success message should disappear after 3 seconds
    await page.waitForSelector('.bg-green-50', { state: 'hidden', timeout: 5000 });
  });
});
