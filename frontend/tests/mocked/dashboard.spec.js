import { test, expect } from '@playwright/test';
import { 
  mockDashboardSummary,
  mockEmployeesWithAttendance,
  mockAPIError,
  mockWithDelay,
  setupCommonMocks
} from '../helpers/api-mock.js';
import { dashboardSummary, employeesWithAttendance } from '../fixtures/test-data.js';
import { waitForLoading, getDateOffset } from '../helpers/test-utils.js';

test.describe('Dashboard - Mocked API', () => {
  test.beforeEach(async ({ page }) => {
    await setupCommonMocks(page);
  });

  test('BONUS: should display dashboard with mocked summary statistics', async ({ page }) => {
    await mockDashboardSummary(page);
    
    await page.goto('/');
    await waitForLoading(page);
    
    await expect(page.locator('h2:has-text("Dashboard Overview")')).toBeVisible();
    
    // Check stat tiles exist
    await expect(page.locator('text=Total Employees')).toBeVisible();
    await expect(page.locator('text=Total Attendance Records')).toBeVisible();
    await expect(page.locator('text=Present Days')).toBeVisible();
    await expect(page.locator('text=Absent Days')).toBeVisible();
    
    // Verify tiles display numbers (not checking specific values to avoid strict mode)
    const employeeTile = page.locator('text=Total Employees').locator('..').locator('..');
    await expect(employeeTile.locator('.text-3xl.font-bold')).toBeVisible();
  });

  test('BONUS: should display attendance rate', async ({ page }) => {
    await mockDashboardSummary(page);
    
    await page.goto('/');
    await waitForLoading(page);
    
    await expect(page.locator('text=Overall Attendance Rate')).toBeVisible();
    await expect(page.locator(`text=${dashboardSummary.attendance_rate}%`)).toBeVisible();
  });

  test('should show loading state before displaying dashboard', async ({ page }) => {
    await mockWithDelay(page, '**/api/dashboard/summary*', dashboardSummary, 1000);
    
    await page.goto('/');
    
    // Should show loading spinner
    await expect(page.locator('.animate-spin')).toBeVisible();
    
    // Wait for data to load
    await waitForLoading(page);
    
    // Dashboard should be visible
    await expect(page.locator('h2:has-text("Dashboard Overview")')).toBeVisible();
  });

  test('should open employee list modal when clicking employees tile', async ({ page }) => {
    await mockDashboardSummary(page);
    await mockEmployeesWithAttendance(page);
    
    await page.goto('/');
    await waitForLoading(page);
    
    // Click on employees tile
    const employeeTile = page.locator('text=Total Employees').locator('..').locator('..').locator('..');
    await employeeTile.click();
    
    // Modal should open
    await expect(page.locator('h2:has-text("All Employees")')).toBeVisible();
  });

  test('should display employee list in modal with mocked data', async ({ page }) => {
    await mockDashboardSummary(page);
    await mockEmployeesWithAttendance(page);
    
    await page.goto('/');
    await waitForLoading(page);
    
    // Open modal
    const employeeTile = page.locator('text=Total Employees').locator('..').locator('..').locator('..');
    await employeeTile.click();
    
    await waitForLoading(page);
    
    // Check table content
    await expect(page.locator('table')).toBeVisible();
    await expect(page.locator(`text=${employeesWithAttendance[0].full_name}`)).toBeVisible();
    await expect(page.locator(`text=${employeesWithAttendance[0].email}`)).toBeVisible();
    
    // Check attendance counts
    await expect(page.locator('th:has-text("Present")')).toBeVisible();
    await expect(page.locator('th:has-text("Absent")')).toBeVisible();
    await expect(page.locator('th:has-text("Total Records")')).toBeVisible();
  });

  test('should close modal when clicking close button', async ({ page }) => {
    await mockDashboardSummary(page);
    await mockEmployeesWithAttendance(page);
    
    await page.goto('/');
    await waitForLoading(page);
    
    // Open modal
    const employeeTile = page.locator('text=Total Employees').locator('..').locator('..').locator('..');
    await employeeTile.click();
    
    await expect(page.locator('h2:has-text("All Employees")')).toBeVisible();
    
    // Close modal
    await page.locator('button:has(svg path[d*="M6 18L18 6"])').first().click();
    
    // Modal should close
    await expect(page.locator('h2:has-text("All Employees")')).not.toBeVisible();
  });

  test('should open present attendance modal when clicking present tile', async ({ page }) => {
    await mockDashboardSummary(page);
    await mockEmployeesWithAttendance(page);
    
    await page.goto('/');
    await waitForLoading(page);
    
    // Wait for tile to be ready
    await expect(page.locator('text=Present Days')).toBeVisible();
    
    // Click present tile using a more specific selector
    await page.locator('text=Present Days').locator('..').locator('..').locator('..').click({ timeout: 5000 });
    
    // Wait for modal to appear
    await page.waitForSelector('.fixed.inset-0', { state: 'visible', timeout: 5000 });
    
    // Modal should open with correct title
    await expect(page.locator('h2:has-text("Employees with Present Days")')).toBeVisible({ timeout: 5000 });
  });

  test('should open absent attendance modal when clicking absent tile', async ({ page }) => {
    await mockDashboardSummary(page);
    await mockEmployeesWithAttendance(page);
    
    await page.goto('/');
    await waitForLoading(page);
    
    // Wait for tile to be ready
    await expect(page.locator('text=Absent Days')).toBeVisible();
    
    // Click absent tile using a more specific selector
    await page.locator('text=Absent Days').locator('..').locator('..').locator('..').click({ timeout: 5000 });
    
    // Wait for modal to appear
    await page.waitForSelector('.fixed.inset-0', { state: 'visible', timeout: 5000 });
    
    // Modal should open with correct title
    await expect(page.locator('h2:has-text("Employees with Absent Days")')).toBeVisible({ timeout: 5000 });
  });

  test('BONUS: should filter dashboard by date range', async ({ page }) => {
    // Mock filtered response
    await page.route('**/api/dashboard/summary*', async (route) => {
      const url = route.request().url();
      if (url.includes('start_date') || url.includes('end_date')) {
        // Return filtered summary
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            ...dashboardSummary,
            total_attendance_records: 5,
            present_count: 3,
            absent_count: 2,
          }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(dashboardSummary),
        });
      }
    });
    
    await page.goto('/');
    await waitForLoading(page);
    
    const startDate = getDateOffset(-7);
    const endDate = getDateOffset(0);
    
    // Apply filters
    await page.fill('#startDate', startDate);
    await page.fill('#endDate', endDate);
    
    await waitForLoading(page);
    
    // Filter info should be visible (check for "Showing data" text)
    await expect(page.locator('text=Showing data')).toBeVisible({ timeout: 10000 });
  });

  test('BONUS: should clear date filters', async ({ page }) => {
    await mockDashboardSummary(page);
    
    await page.goto('/');
    await waitForLoading(page);
    
    // Set filters
    await page.fill('#startDate', getDateOffset(-7));
    await page.fill('#endDate', getDateOffset(0));
    
    await waitForLoading(page);
    
    // Clear filters
    await page.click('button:has-text("Clear Filters")');
    
    // Filters should be cleared
    const startValue = await page.inputValue('#startDate');
    const endValue = await page.inputValue('#endDate');
    expect(startValue).toBe('');
    expect(endValue).toBe('');
  });

  test('should show clear filters button only when filters are active', async ({ page }) => {
    await mockDashboardSummary(page);
    
    await page.goto('/');
    await waitForLoading(page);
    
    // Initially no clear button
    await expect(page.locator('button:has-text("Clear Filters")')).not.toBeVisible();
    
    // Set a filter
    await page.fill('#startDate', getDateOffset(-7));
    
    // Clear button should appear
    await expect(page.locator('button:has-text("Clear Filters")')).toBeVisible();
  });

  test('should show error state when API fails', async ({ page }) => {
    await mockAPIError(page, '**/api/dashboard/summary*');
    
    await page.goto('/');
    await waitForLoading(page);
    
    // Should show error message
    await expect(page.locator('.bg-red-50')).toBeVisible();
    await expect(page.locator('text=Error loading dashboard')).toBeVisible();
  });

  test('should show empty state when no employees exist', async ({ page }) => {
    await page.route('**/api/dashboard/summary*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          total_employees: 0,
          total_attendance_records: 0,
          present_count: 0,
          absent_count: 0,
          attendance_rate: 0,
        }),
      });
    });
    
    await page.goto('/');
    await waitForLoading(page);
    
    // Should show empty state message
    await expect(page.locator('text=No employees in the system yet')).toBeVisible();
  });

  test('should display all stat tiles with icons', async ({ page }) => {
    await mockDashboardSummary(page);
    
    await page.goto('/');
    await waitForLoading(page);
    
    // Each tile should have an icon (svg)
    const tiles = [
      'Total Employees',
      'Total Attendance Records',
      'Present Days',
      'Absent Days',
    ];
    
    for (const title of tiles) {
      const tile = page.locator(`text=${title}`).locator('..').locator('..').locator('..');
      await expect(tile.locator('svg').first()).toBeVisible();
    }
  });

  test('should show clickable indicator on interactive tiles', async ({ page }) => {
    await mockDashboardSummary(page);
    
    await page.goto('/');
    await waitForLoading(page);
    
    // Interactive tiles should have "Click to view details" text
    const employeeTile = page.locator('text=Total Employees').locator('..').locator('..').locator('..');
    await expect(employeeTile.locator('text=Click to view details')).toBeVisible();
    
    const presentTile = page.locator('text=Present Days').locator('..').locator('..').locator('..');
    await expect(presentTile.locator('text=Click to view details')).toBeVisible();
  });

  test('should not show clickable indicator on non-interactive tile', async ({ page }) => {
    await mockDashboardSummary(page);
    
    await page.goto('/');
    await waitForLoading(page);
    
    // Total Attendance Records tile is not clickable
    const recordsTile = page.locator('text=Total Attendance Records').locator('..').locator('..').locator('..');
    await expect(recordsTile.locator('text=Click to view details')).not.toBeVisible();
  });

  test('should display attendance rate in gradient card', async ({ page }) => {
    await mockDashboardSummary(page);
    
    await page.goto('/');
    await waitForLoading(page);
    
    // Check gradient card
    await expect(page.locator('.bg-gradient-to-r.from-blue-500')).toBeVisible();
    await expect(page.locator('text=Overall Attendance Rate')).toBeVisible();
    await expect(page.locator(`text=${dashboardSummary.attendance_rate}%`)).toBeVisible();
  });

  test('should show date range filter inputs', async ({ page }) => {
    await mockDashboardSummary(page);
    
    await page.goto('/');
    await waitForLoading(page);
    
    // Check filter inputs exist
    await expect(page.locator('label:has-text("From Date")')).toBeVisible();
    await expect(page.locator('label:has-text("To Date")')).toBeVisible();
    await expect(page.locator('#startDate')).toBeVisible();
    await expect(page.locator('#endDate')).toBeVisible();
  });

  test('should handle modal loading state', async ({ page }) => {
    await mockDashboardSummary(page);
    
    // Mock modal data with delay
    await page.route('**/api/dashboard/employees*', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(employeesWithAttendance),
      });
    });
    
    await page.goto('/');
    await waitForLoading(page);
    
    // Open modal
    const employeeTile = page.locator('text=Total Employees').locator('..').locator('..').locator('..');
    await employeeTile.click();
    
    // Should show loading spinner in modal
    await expect(page.locator('.animate-spin')).toBeVisible();
    
    // Wait for data
    await waitForLoading(page);
    
    // Table should appear
    await expect(page.locator('table')).toBeVisible();
  });

  test('should handle empty modal state', async ({ page }) => {
    await mockDashboardSummary(page);
    
    // Mock empty employees list
    await page.route('**/api/dashboard/employees*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });
    
    await page.goto('/');
    await waitForLoading(page);
    
    // Open modal
    const employeeTile = page.locator('text=Total Employees').locator('..').locator('..').locator('..');
    await employeeTile.click();
    
    await waitForLoading(page);
    
    // Should show empty state in modal
    await expect(page.locator('text=No employees found')).toBeVisible();
  });

  test('should display correct stat values from mocked data', async ({ page }) => {
    await mockDashboardSummary(page);
    
    await page.goto('/');
    await waitForLoading(page);
    
    // Verify specific values from mock data
    const { total_employees, present_count, absent_count, attendance_rate } = dashboardSummary;
    
    // Check each stat value
    const employeeValue = page.locator('text=Total Employees').locator('..').locator('.text-3xl.font-bold');
    await expect(employeeValue).toHaveText(total_employees.toString());
    
    const presentValue = page.locator('text=Present Days').locator('..').locator('.text-3xl.font-bold');
    await expect(presentValue).toHaveText(present_count.toString());
    
    const absentValue = page.locator('text=Absent Days').locator('..').locator('.text-3xl.font-bold');
    await expect(absentValue).toHaveText(absent_count.toString());
  });
});
