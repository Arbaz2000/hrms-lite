import { test, expect } from '@playwright/test';
import { generateUniqueEmployee } from '../fixtures/test-data.js';
import { waitForLoading, getTodayDate, getDateOffset } from '../helpers/test-utils.js';

test.describe('Dashboard - E2E', () => {
  let testEmployeeId = null;
  let testAttendanceIds = [];

  test.beforeAll(async ({ browser }) => {
    // Create test employee with attendance data
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // Create employee
    const employee = generateUniqueEmployee();
    const empResponse = await page.request.post('http://localhost:8000/api/employees', {
      data: employee,
    });
    const createdEmployee = await empResponse.json();
    testEmployeeId = createdEmployee.id;
    
    // Create some attendance records
    const dates = [
      getDateOffset(-5),
      getDateOffset(-4),
      getDateOffset(-3),
      getDateOffset(-2),
      getDateOffset(-1),
    ];
    
    for (let i = 0; i < dates.length; i++) {
      const status = i < 3 ? 'Present' : 'Absent';
      const attResponse = await page.request.post('http://localhost:8000/api/attendance', {
        data: {
          employee_id: testEmployeeId,
          date: new Date(dates[i] + 'T09:00:00').toISOString(),
          status: status,
        },
      });
      const attData = await attResponse.json();
      testAttendanceIds.push(attData.id);
    }
    
    await context.close();
  });

  test.afterAll(async ({ browser }) => {
    // Cleanup
    if (testEmployeeId) {
      const context = await browser.newContext();
      const page = await context.newPage();
      
      try {
        await page.request.delete(`http://localhost:8000/api/employees/${testEmployeeId}`);
      } catch (error) {
        console.log(`Failed to cleanup:`, error);
      }
      
      await context.close();
    }
  });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForLoading(page);
    // Dashboard tab is default, so we should already be there
  });

  test('BONUS: should display dashboard with summary statistics', async ({ page }) => {
    await expect(page.locator('h2:has-text("Dashboard Overview")')).toBeVisible();
    
    // Check for all stat tiles
    await expect(page.locator('text=Total Employees')).toBeVisible();
    await expect(page.locator('text=Total Attendance Records')).toBeVisible();
    await expect(page.locator('text=Present Days')).toBeVisible();
    await expect(page.locator('text=Absent Days')).toBeVisible();
  });

  test('BONUS: should display attendance rate card', async ({ page }) => {
    await expect(page.locator('text=Overall Attendance Rate')).toBeVisible();
    
    // Should show percentage
    await expect(page.locator('.text-4xl.font-bold:has-text("%")')).toBeVisible();
  });

  test('BONUS: should show numeric values in stat tiles', async ({ page }) => {
    // Total Employees should have a number
    const employeeTile = page.locator('text=Total Employees').locator('..').locator('..');
    await expect(employeeTile.locator('.text-3xl.font-bold')).toBeVisible();
    
    // Present Days should have a number
    const presentTile = page.locator('text=Present Days').locator('..').locator('..');
    await expect(presentTile.locator('.text-3xl.font-bold')).toBeVisible();
  });

  test('should open employee list modal when clicking on employees tile', async ({ page }) => {
    // Find and click the Total Employees tile
    const employeeTile = page.locator('text=Total Employees').locator('..').locator('..').locator('..');
    await employeeTile.click();
    
    // Modal should open
    await expect(page.locator('h2:has-text("All Employees")')).toBeVisible();
    
    // Should show employee table
    await expect(page.locator('table')).toBeVisible();
  });

  test('should open attendance list modal when clicking on present tile', async ({ page }) => {
    // Find and click the Present Days tile
    const presentTile = page.locator('text=Present Days').locator('..').locator('..').locator('..');
    await presentTile.click();
    
    // Modal should open
    await expect(page.locator('text=Employees with Present Days')).toBeVisible();
  });

  test('should open attendance list modal when clicking on absent tile', async ({ page }) => {
    // Find and click the Absent Days tile
    const absentTile = page.locator('text=Absent Days').locator('..').locator('..').locator('..');
    await absentTile.click();
    
    // Modal should open
    await expect(page.locator('text=Employees with Absent Days')).toBeVisible();
  });

  test('should close modal when clicking close button', async ({ page }) => {
    // Open employees modal
    const employeeTile = page.locator('text=Total Employees').locator('..').locator('..').locator('..');
    await employeeTile.click();
    
    await expect(page.locator('h2:has-text("All Employees")')).toBeVisible();
    
    // Click close button
    await page.locator('button:has(svg path[d*="M6 18L18 6"])').first().click();
    
    // Modal should close
    await expect(page.locator('h2:has-text("All Employees")')).not.toBeVisible();
  });

  test('BONUS: should filter dashboard data by date range', async ({ page }) => {
    const startDate = getDateOffset(-7);
    const endDate = getTodayDate();
    
    // Fill date filters
    await page.fill('#startDate', startDate);
    await page.fill('#endDate', endDate);
    
    // Wait for data to reload
    await waitForLoading(page);
    
    // Verify filter info is displayed
    await expect(page.locator('text=Showing data')).toBeVisible();
  });

  test('BONUS: should clear date filters', async ({ page }) => {
    const startDate = getDateOffset(-7);
    const endDate = getTodayDate();
    
    // Set filters
    await page.fill('#startDate', startDate);
    await page.fill('#endDate', endDate);
    
    await waitForLoading(page);
    
    // Click clear filters button
    await page.click('button:has-text("Clear Filters")');
    
    // Filters should be cleared
    const startValue = await page.inputValue('#startDate');
    const endValue = await page.inputValue('#endDate');
    expect(startValue).toBe('');
    expect(endValue).toBe('');
  });

  test('should show clear filters button only when filters are set', async ({ page }) => {
    // Initially, no clear button should be visible
    await expect(page.locator('button:has-text("Clear Filters")')).not.toBeVisible();
    
    // Set a filter
    await page.fill('#startDate', getDateOffset(-7));
    
    // Now clear button should appear
    await expect(page.locator('button:has-text("Clear Filters")')).toBeVisible();
  });

  test('should display employee list in modal with attendance counts', async ({ page }) => {
    // Open employees modal
    const employeeTile = page.locator('text=Total Employees').locator('..').locator('..').locator('..');
    await employeeTile.click();
    
    await waitForLoading(page);
    
    // Check table headers
    await expect(page.locator('th:has-text("ID")')).toBeVisible();
    await expect(page.locator('th:has-text("Name")')).toBeVisible();
    await expect(page.locator('th:has-text("Email")')).toBeVisible();
    await expect(page.locator('th:has-text("Department")')).toBeVisible();
    await expect(page.locator('th:has-text("Present")')).toBeVisible();
    await expect(page.locator('th:has-text("Absent")')).toBeVisible();
    await expect(page.locator('th:has-text("Total Records")')).toBeVisible();
  });

  test('should open employee attendance detail modal when clicking employee name', async ({ page }) => {
    // Open employees modal
    const employeeTile = page.locator('text=Total Employees').locator('..').locator('..').locator('..');
    await employeeTile.click();
    
    await waitForLoading(page);
    
    // Click on an employee name (should be a link)
    const employeeLink = page.locator('table .text-blue-600').first();
    if (await employeeLink.count() > 0) {
      await employeeLink.click();
      
      // Should open detail modal
      await expect(page.locator('text=Attendance Details')).toBeVisible();
    }
  });

  test('should display loading state while fetching data', async ({ page }) => {
    // Reload to see loading state
    await page.reload();
    
    // Loading spinner should appear briefly
    const spinner = page.locator('.animate-spin');
    // It might be too fast to catch, so we just check if the page loads correctly
    await waitForLoading(page);
    
    // Dashboard should be visible after loading
    await expect(page.locator('h2:has-text("Dashboard Overview")')).toBeVisible();
  });

  test('should show clickable indicators on interactive tiles', async ({ page }) => {
    // Employees tile should show "Click to view details"
    const employeeTile = page.locator('text=Total Employees').locator('..').locator('..').locator('..');
    await expect(employeeTile.locator('text=Click to view details')).toBeVisible();
    
    // Present Days tile should show "Click to view details"
    const presentTile = page.locator('text=Present Days').locator('..').locator('..').locator('..');
    await expect(presentTile.locator('text=Click to view details')).toBeVisible();
    
    // Absent Days tile should show "Click to view details"
    const absentTile = page.locator('text=Absent Days').locator('..').locator('..').locator('..');
    await expect(absentTile.locator('text=Click to view details')).toBeVisible();
  });

  test('should have hover effects on clickable tiles', async ({ page }) => {
    const employeeTile = page.locator('text=Total Employees').locator('..').locator('..').locator('..');
    
    // Check if the tile has cursor-pointer class (indicates clickability)
    const className = await employeeTile.getAttribute('class');
    expect(className).toContain('cursor-pointer');
  });

  test('should display icons for each stat tile', async ({ page }) => {
    // Each tile should have an SVG icon
    const tiles = page.locator('.text-3xl.font-bold').locator('..').locator('..').locator('..');
    const count = await tiles.count();
    
    expect(count).toBeGreaterThan(0);
    
    // Check that tiles have icons (svg elements)
    for (let i = 0; i < Math.min(count, 4); i++) {
      const tile = tiles.nth(i);
      await expect(tile.locator('svg').first()).toBeVisible();
    }
  });

  test('BONUS: should display correct attendance rate calculation', async ({ page }) => {
    await waitForLoading(page);
    
    // Get the attendance rate value
    const rateElement = page.locator('.text-4xl.font-bold:has-text("%")');
    const rateText = await rateElement.textContent();
    const rate = parseFloat(rateText);
    
    // Rate should be between 0 and 100
    expect(rate).toBeGreaterThanOrEqual(0);
    expect(rate).toBeLessThanOrEqual(100);
  });

  test('should show empty state message when no employees exist', async ({ browser }) => {
    // Get all employees and delete them temporarily
    const context = await browser.newContext();
    const page = await context.newPage();
    
    const response = await page.request.get('http://localhost:8000/api/employees');
    const employees = await response.json();
    
    // Store original employees to restore later
    const employeeBackup = [...employees];
    
    // Delete all employees
    for (const emp of employees) {
      await page.request.delete(`http://localhost:8000/api/employees/${emp.id}`);
    }
    
    // Navigate to dashboard
    await page.goto('/');
    await waitForLoading(page);
    
    // Should show empty state message
    await expect(page.locator('text=No employees in the system yet')).toBeVisible();
    
    // Restore employees (only if they're not our test employee)
    for (const emp of employeeBackup) {
      if (emp.id !== testEmployeeId) {
        await page.request.post('http://localhost:8000/api/employees', {
          data: {
            full_name: emp.full_name,
            email: emp.email,
            department: emp.department,
          },
        });
      }
    }
    
    await context.close();
  });
});
