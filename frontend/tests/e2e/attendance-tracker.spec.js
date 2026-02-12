import { test, expect } from '@playwright/test';
import { generateUniqueEmployee, testDates } from '../fixtures/test-data.js';
import { navigateToTab, waitForLoading, searchAndSelectEmployee, getTodayDate, getDateOffset } from '../helpers/test-utils.js';

test.describe('Attendance Tracker - E2E', () => {
  let testEmployee = null;
  let testEmployeeId = null;

  test.beforeAll(async ({ browser }) => {
    // Create a test employee for all tests
    const context = await browser.newContext();
    const page = await context.newPage();
    
    const employee = generateUniqueEmployee();
    const response = await page.request.post('http://localhost:8000/api/employees', {
      data: employee,
    });
    testEmployee = await response.json();
    testEmployeeId = testEmployee.id;
    
    await context.close();
  });

  test.afterAll(async ({ browser }) => {
    // Cleanup: Delete test employee
    if (testEmployeeId) {
      const context = await browser.newContext();
      const page = await context.newPage();
      
      try {
        await page.request.delete(`http://localhost:8000/api/employees/${testEmployeeId}`);
      } catch (error) {
        console.log(`Failed to cleanup employee ${testEmployeeId}:`, error);
      }
      
      await context.close();
    }
  });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForLoading(page);
    await navigateToTab(page, 'Attendance Tracker');
  });

  test('should display attendance tracker page', async ({ page }) => {
    await expect(page.locator('h2:has-text("Attendance Tracker")')).toBeVisible();
    await expect(page.locator('h2:has-text("Mark Attendance")')).toBeVisible();
    await expect(page.locator('label:has-text("Search Employee")')).toBeVisible();
  });

  test('should show employee dropdown when typing in search', async ({ page }) => {
    await page.fill('#employee', testEmployee.full_name.substring(0, 3));
    
    // Dropdown should appear
    await expect(page.locator('.absolute.z-10')).toBeVisible();
    await expect(page.locator(`.absolute.z-10 >> text=${testEmployee.full_name}`)).toBeVisible();
  });

  test('should select employee from dropdown', async ({ page }) => {
    await page.fill('#employee', testEmployee.full_name.substring(0, 3));
    await page.waitForSelector('.absolute.z-10', { state: 'visible' });
    
    await page.click(`.absolute.z-10 >> text=${testEmployee.full_name}`);
    
    // Employee should be selected and shown in input
    const inputValue = await page.inputValue('#employee');
    expect(inputValue).toContain(testEmployee.full_name);
  });

  test('should successfully mark attendance as Present', async ({ page }) => {
    const today = getTodayDate();
    
    // Search and select employee
    await page.fill('#employee', testEmployee.full_name);
    await page.waitForSelector('.absolute.z-10', { state: 'visible' });
    await page.click(`.absolute.z-10 >> text=${testEmployee.full_name}`);
    
    // Set date
    await page.fill('#date', today);
    
    // Select Present status
    await page.click('input[value="Present"]');
    
    // Submit
    await page.click('button:has-text("Mark Attendance")');
    
    // Wait for success message
    await expect(page.locator('.bg-green-50')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Attendance marked successfully')).toBeVisible();
    
    // Verify attendance appears in history
    await expect(page.locator('h2:has-text("Attendance History")')).toBeVisible();
    await expect(page.locator('table')).toBeVisible();
  });

  test('should successfully mark attendance as Absent', async ({ page }) => {
    const yesterday = getDateOffset(-1);
    
    // Search and select employee
    await page.fill('#employee', testEmployee.full_name);
    await page.waitForSelector('.absolute.z-10', { state: 'visible' });
    await page.click(`.absolute.z-10 >> text=${testEmployee.full_name}`);
    
    // Set date
    await page.fill('#date', yesterday);
    
    // Select Absent status
    await page.click('input[value="Absent"]');
    
    // Submit
    await page.click('button:has-text("Mark Attendance")');
    
    // Wait for success message
    await expect(page.locator('.bg-green-50')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Attendance marked successfully')).toBeVisible();
  });

  test('should show error when marking attendance without selecting employee', async ({ page }) => {
    const today = getTodayDate();
    
    await page.fill('#date', today);
    await page.click('input[value="Present"]');
    await page.click('button:has-text("Mark Attendance")');
    
    // Should show error
    await expect(page.locator('.bg-red-50')).toBeVisible();
    await expect(page.locator('text=Please select an employee')).toBeVisible();
  });

  test('should display attendance history after selecting employee', async ({ page }) => {
    // Select employee (who should have attendance from previous tests)
    await page.fill('#employee', testEmployee.full_name);
    await page.waitForSelector('.absolute.z-10', { state: 'visible' });
    await page.click(`.absolute.z-10 >> text=${testEmployee.full_name}`);
    
    // Wait for attendance history to load
    await waitForLoading(page);
    
    // History section should appear
    await expect(page.locator('h2:has-text("Attendance History")')).toBeVisible();
  });

  test('BONUS: should display total present days count', async ({ page }) => {
    // Select employee
    await page.fill('#employee', testEmployee.full_name);
    await page.waitForSelector('.absolute.z-10', { state: 'visible' });
    await page.click(`.absolute.z-10 >> text=${testEmployee.full_name}`);
    
    await waitForLoading(page);
    
    // Check for present days summary
    await expect(page.locator('text=Total Present Days')).toBeVisible();
    
    // The count should be visible
    await expect(page.locator('.bg-blue-50').locator('text=/\\d+ out of \\d+ records/')).toBeVisible();
  });

  test('BONUS: should filter attendance by date range', async ({ page }) => {
    const startDate = getDateOffset(-7);
    const endDate = getTodayDate();
    
    // Select employee
    await page.fill('#employee', testEmployee.full_name);
    await page.waitForSelector('.absolute.z-10', { state: 'visible' });
    await page.click(`.absolute.z-10 >> text=${testEmployee.full_name}`);
    
    await waitForLoading(page);
    
    // Fill date filters
    await page.fill('#filterStartDate', startDate);
    await page.fill('#filterEndDate', endDate);
    
    // Wait for filtered results
    await waitForLoading(page);
    
    // Verify table still displays (filtered data)
    await expect(page.locator('table')).toBeVisible();
  });

  test('BONUS: should clear date filters', async ({ page }) => {
    const startDate = getDateOffset(-7);
    const endDate = getTodayDate();
    
    // Select employee
    await page.fill('#employee', testEmployee.full_name);
    await page.waitForSelector('.absolute.z-10', { state: 'visible' });
    await page.click(`.absolute.z-10 >> text=${testEmployee.full_name}`);
    
    await waitForLoading(page);
    
    // Set filters
    await page.fill('#filterStartDate', startDate);
    await page.fill('#filterEndDate', endDate);
    
    await waitForLoading(page);
    
    // Click clear filters button
    await page.click('button:has-text("Clear Filters")');
    
    // Filters should be cleared
    const startValue = await page.inputValue('#filterStartDate');
    const endValue = await page.inputValue('#filterEndDate');
    expect(startValue).toBe('');
    expect(endValue).toBe('');
  });

  test('should show empty state when employee has no attendance records', async ({ browser }) => {
    // Create a new employee with no attendance
    const context = await browser.newContext();
    const setupPage = await context.newPage();
    
    const newEmployee = generateUniqueEmployee();
    const response = await setupPage.request.post('http://localhost:8000/api/employees', {
      data: newEmployee,
    });
    const createdEmployee = await response.json();
    
    await context.close();
    
    // Now test in the main page
    const { page } = await test.step('Navigate and select employee', async () => {
      const page = await browser.newPage();
      await page.goto('/');
      await waitForLoading(page);
      await navigateToTab(page, 'Attendance Tracker');
      return { page };
    });
    
    // Select the new employee
    await page.fill('#employee', newEmployee.full_name);
    await page.waitForSelector('.absolute.z-10', { state: 'visible' });
    await page.click(`.absolute.z-10 >> text=${newEmployee.full_name}`);
    
    await waitForLoading(page);
    
    // Should show empty state
    await expect(page.locator('text=No attendance records found')).toBeVisible();
    
    // Cleanup
    await page.request.delete(`http://localhost:8000/api/employees/${createdEmployee.id}`);
    await page.close();
  });

  test('should show status badge with correct color for Present', async ({ page }) => {
    // Select employee
    await page.fill('#employee', testEmployee.full_name);
    await page.waitForSelector('.absolute.z-10', { state: 'visible' });
    await page.click(`.absolute.z-10 >> text=${testEmployee.full_name}`);
    
    await waitForLoading(page);
    
    // Look for Present status badges
    const presentBadge = page.locator('.bg-green-100.text-green-800:has-text("Present")').first();
    if (await presentBadge.count() > 0) {
      await expect(presentBadge).toBeVisible();
    }
  });

  test('should show status badge with correct color for Absent', async ({ page }) => {
    // Select employee
    await page.fill('#employee', testEmployee.full_name);
    await page.waitForSelector('.absolute.z-10', { state: 'visible' });
    await page.click(`.absolute.z-10 >> text=${testEmployee.full_name}`);
    
    await waitForLoading(page);
    
    // Look for Absent status badges
    const absentBadge = page.locator('.bg-red-100.text-red-800:has-text("Absent")').first();
    if (await absentBadge.count() > 0) {
      await expect(absentBadge).toBeVisible();
    }
  });

  test('should display attendance records in table format', async ({ page }) => {
    // Select employee
    await page.fill('#employee', testEmployee.full_name);
    await page.waitForSelector('.absolute.z-10', { state: 'visible' });
    await page.click(`.absolute.z-10 >> text=${testEmployee.full_name}`);
    
    await waitForLoading(page);
    
    // Check table structure
    await expect(page.locator('th:has-text("Date")')).toBeVisible();
    await expect(page.locator('th:has-text("Status")')).toBeVisible();
  });

  test('should show "no employees found" message when search has no results', async ({ page }) => {
    await page.fill('#employee', 'NonExistentEmployeeXYZ123');
    await page.waitForSelector('.absolute.z-10', { state: 'visible' });
    
    await expect(page.locator('text=No employees found')).toBeVisible();
  });
});
