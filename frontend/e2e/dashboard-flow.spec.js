import { test, expect } from '@playwright/test';
import { generateEmployeeData } from './helpers/test-data.js';
import { addEmployee, addEmployeesWithAttendance } from './helpers/actions.js';
import {
  navigateToDashboard,
  setDateFilter,
  clearDateFilters,
  clickEmployeesTile,
  clickPresentTile,
  clickAbsentTile,
  verifyModalOpen,
  closeModal,
  clickEmployeeInModal,
  getStatValue,
  verifyTileClickable
} from './helpers/dashboard-actions.js';

test.describe('Dashboard E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
    await expect(page.getByText('HRMS Lite')).toBeVisible();
  });

  test('01 - Dashboard Display and Stats', async ({ page }) => {
    // Navigate to Dashboard tab
    await navigateToDashboard(page);
    
    // Verify all stat tiles are visible
    await expect(page.getByText('Total Employees')).toBeVisible();
    await expect(page.getByText('Total Attendance Records')).toBeVisible();
    await expect(page.getByText('Present Days')).toBeVisible();
    await expect(page.getByText('Absent Days')).toBeVisible();
    
    // Verify attendance rate card
    await expect(page.getByText('Overall Attendance Rate')).toBeVisible();
    
    // Verify date filter controls
    await expect(page.getByLabelText('From Date')).toBeVisible();
    await expect(page.getByLabelText('To Date')).toBeVisible();
    
    // Take screenshot
    await page.screenshot({ path: 'e2e/screenshots/dashboard-01-display.png', fullPage: true });
  });

  test('02 - Date Filter Functionality', async ({ page }) => {
    // Add employees with attendance on different dates
    const employee1 = generateEmployeeData();
    const employee2 = generateEmployeeData();
    
    await addEmployeesWithAttendance(page, [
      {
        employee: employee1,
        attendanceRecords: [
          { date: '2026-02-01', status: 'Present' },
          { date: '2026-02-10', status: 'Present' },
          { date: '2026-02-20', status: 'Absent' }
        ]
      },
      {
        employee: employee2,
        attendanceRecords: [
          { date: '2026-02-05', status: 'Present' },
          { date: '2026-02-15', status: 'Absent' }
        ]
      }
    ]);
    
    // Navigate to dashboard
    await navigateToDashboard(page);
    
    // Get initial stats
    const initialAttendance = await getStatValue(page, 'Total Attendance Records');
    expect(initialAttendance).toBe(5);
    await page.screenshot({ path: 'e2e/screenshots/dashboard-02-no-filter.png', fullPage: true });
    
    // Apply start date filter
    await setDateFilter(page, '2026-02-10', null);
    await page.waitForTimeout(1000);
    const afterStartFilter = await getStatValue(page, 'Total Attendance Records');
    expect(afterStartFilter).toBe(3); // Feb 10, 15, 20
    await page.screenshot({ path: 'e2e/screenshots/dashboard-02-start-filter.png', fullPage: true });
    
    // Clear and apply end date filter
    await clearDateFilters(page);
    await page.waitForTimeout(1000);
    await setDateFilter(page, null, '2026-02-10');
    await page.waitForTimeout(1000);
    const afterEndFilter = await getStatValue(page, 'Total Attendance Records');
    expect(afterEndFilter).toBe(3); // Feb 1, 5, 10
    await page.screenshot({ path: 'e2e/screenshots/dashboard-02-end-filter.png', fullPage: true });
    
    // Apply both filters
    await setDateFilter(page, '2026-02-05', '2026-02-15');
    await page.waitForTimeout(1000);
    const afterBothFilters = await getStatValue(page, 'Total Attendance Records');
    expect(afterBothFilters).toBe(3); // Feb 5, 10, 15
    await page.screenshot({ path: 'e2e/screenshots/dashboard-02-both-filters.png', fullPage: true });
    
    // Clear filters
    await clearDateFilters(page);
    await page.waitForTimeout(1000);
    const afterClear = await getStatValue(page, 'Total Attendance Records');
    expect(afterClear).toBe(5);
    await page.screenshot({ path: 'e2e/screenshots/dashboard-02-cleared.png', fullPage: true });
  });

  test('03 - Click Total Employees Tile - Employee List Modal', async ({ page }) => {
    // Add test employees
    const employee1 = generateEmployeeData();
    const employee2 = generateEmployeeData();
    const employee3 = generateEmployeeData();
    
    await addEmployee(page, employee1);
    await addEmployee(page, employee2);
    await addEmployee(page, employee3);
    
    // Navigate to dashboard
    await navigateToDashboard(page);
    await page.screenshot({ path: 'e2e/screenshots/dashboard-03-before-click.png', fullPage: true });
    
    // Click on Total Employees tile
    await clickEmployeesTile(page);
    
    // Verify modal opened
    await verifyModalOpen(page, 'All Employees');
    await page.screenshot({ path: 'e2e/screenshots/dashboard-03-modal-open.png', fullPage: true });
    
    // Verify employees are displayed
    await expect(page.getByText(employee1.fullName)).toBeVisible();
    await expect(page.getByText(employee2.fullName)).toBeVisible();
    await expect(page.getByText(employee3.fullName)).toBeVisible();
    
    // Verify table headers
    await expect(page.getByText('ID')).toBeVisible();
    await expect(page.getByText('Email')).toBeVisible();
    await expect(page.getByText('Department')).toBeVisible();
    
    // Close modal
    await closeModal(page);
    await page.waitForTimeout(500);
    
    // Verify modal closed
    await expect(page.getByText('All Employees')).not.toBeVisible();
  });

  test('04 - Click Employee Name in Modal - Navigate to Attendance Details', async ({ page }) => {
    // Add employee with attendance
    const employee = generateEmployeeData();
    await addEmployeesWithAttendance(page, [
      {
        employee,
        attendanceRecords: [
          { date: '2026-02-10', status: 'Present' },
          { date: '2026-02-11', status: 'Absent' }
        ]
      }
    ]);
    
    // Navigate to dashboard and open Employee List Modal
    await navigateToDashboard(page);
    await clickEmployeesTile(page);
    await verifyModalOpen(page, 'All Employees');
    await page.screenshot({ path: 'e2e/screenshots/dashboard-04-employee-list.png', fullPage: true });
    
    // Click on employee name
    await clickEmployeeInModal(page, employee.fullName);
    
    // Verify Employee Attendance Modal opened
    await page.waitForTimeout(1000);
    await expect(page.getByText(employee.fullName)).toBeVisible();
    await expect(page.getByText(employee.email)).toBeVisible();
    await expect(page.getByText(employee.department)).toBeVisible();
    await page.screenshot({ path: 'e2e/screenshots/dashboard-04-attendance-modal.png', fullPage: true });
    
    // Verify attendance records are shown
    await expect(page.getByText('Present')).toBeVisible();
    await expect(page.getByText('Absent')).toBeVisible();
    
    // Verify stats
    await expect(page.getByText('Present:')).toBeVisible();
    await expect(page.getByText('Absent:')).toBeVisible();
    
    // Close modal
    await closeModal(page);
  });

  test('05 - Click Present Days Tile - Attendance List Modal', async ({ page }) => {
    // Add employees with present attendance
    const employee1 = generateEmployeeData();
    const employee2 = generateEmployeeData();
    
    await addEmployeesWithAttendance(page, [
      {
        employee: employee1,
        attendanceRecords: [
          { date: '2026-02-10', status: 'Present' },
          { date: '2026-02-11', status: 'Present' }
        ]
      },
      {
        employee: employee2,
        attendanceRecords: [
          { date: '2026-02-10', status: 'Absent' }
        ]
      }
    ]);
    
    // Navigate to dashboard
    await navigateToDashboard(page);
    await page.screenshot({ path: 'e2e/screenshots/dashboard-05-before-click.png', fullPage: true });
    
    // Click on Present Days tile
    await clickPresentTile(page);
    
    // Verify modal opened with Present status
    await verifyModalOpen(page, 'Employees with Present Days');
    await page.screenshot({ path: 'e2e/screenshots/dashboard-05-present-modal.png', fullPage: true });
    
    // Verify only employee with present days is shown
    await expect(page.getByText(employee1.fullName)).toBeVisible();
    // employee2 should not be visible as they only have absent days
    
    // Verify present count is displayed
    await expect(page.getByText('2')).toBeVisible(); // employee1 has 2 present days
    
    // Click on employee name to see details
    await clickEmployeeInModal(page, employee1.fullName);
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'e2e/screenshots/dashboard-05-employee-details.png', fullPage: true });
    
    // Close modals
    await closeModal(page);
  });

  test('06 - Click Absent Days Tile - Attendance List Modal', async ({ page }) => {
    // Add employees with absent attendance
    const employee1 = generateEmployeeData();
    const employee2 = generateEmployeeData();
    
    await addEmployeesWithAttendance(page, [
      {
        employee: employee1,
        attendanceRecords: [
          { date: '2026-02-10', status: 'Absent' },
          { date: '2026-02-11', status: 'Absent' }
        ]
      },
      {
        employee: employee2,
        attendanceRecords: [
          { date: '2026-02-10', status: 'Present' }
        ]
      }
    ]);
    
    // Navigate to dashboard
    await navigateToDashboard(page);
    await page.screenshot({ path: 'e2e/screenshots/dashboard-06-before-click.png', fullPage: true });
    
    // Click on Absent Days tile
    await clickAbsentTile(page);
    
    // Verify modal opened with Absent status
    await verifyModalOpen(page, 'Employees with Absent Days');
    await page.screenshot({ path: 'e2e/screenshots/dashboard-06-absent-modal.png', fullPage: true });
    
    // Verify only employee with absent days is shown
    await expect(page.getByText(employee1.fullName)).toBeVisible();
    
    // Verify absent count is displayed
    await expect(page.getByText('2')).toBeVisible(); // employee1 has 2 absent days
    
    // Close modal
    await closeModal(page);
  });

  test('07 - Date Filters with Modals', async ({ page }) => {
    // Add employees with attendance on different dates
    const employee = generateEmployeeData();
    
    await addEmployeesWithAttendance(page, [
      {
        employee,
        attendanceRecords: [
          { date: '2026-02-01', status: 'Present' },
          { date: '2026-02-10', status: 'Present' },
          { date: '2026-02-20', status: 'Absent' }
        ]
      }
    ]);
    
    // Navigate to dashboard
    await navigateToDashboard(page);
    
    // Apply date filter
    await setDateFilter(page, '2026-02-10', '2026-02-15');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'e2e/screenshots/dashboard-07-with-filter.png', fullPage: true });
    
    // Click on Present Days tile
    await clickPresentTile(page);
    await verifyModalOpen(page, 'Employees with Present Days');
    await page.screenshot({ path: 'e2e/screenshots/dashboard-07-modal-filtered.png', fullPage: true });
    
    // Verify only one present day is shown (Feb 10)
    await expect(page.getByText(employee.fullName)).toBeVisible();
    await expect(page.getByText('1')).toBeVisible(); // Only 1 present day in range
    
    // Close modal
    await closeModal(page);
    
    // Verify date filters persist
    await page.waitForTimeout(500);
    const startInput = page.locator('input#startDate');
    const endInput = page.locator('input#endDate');
    expect(await startInput.inputValue()).toBe('2026-02-10');
    expect(await endInput.inputValue()).toBe('2026-02-15');
  });

  test('08 - Empty States', async ({ page }) => {
    // Navigate to dashboard (no employees added)
    await navigateToDashboard(page);
    await page.screenshot({ path: 'e2e/screenshots/dashboard-08-empty-state.png', fullPage: true });
    
    // Verify empty state message
    await expect(page.getByText(/No employees in the system yet/i)).toBeVisible();
    
    // Verify stats show 0
    expect(await getStatValue(page, 'Total Employees')).toBe(0);
    
    // Try clicking tiles and verify modals show empty states
    await clickEmployeesTile(page);
    await verifyModalOpen(page, 'All Employees');
    await expect(page.getByText('No employees found')).toBeVisible();
    await page.screenshot({ path: 'e2e/screenshots/dashboard-08-empty-employees-modal.png', fullPage: true });
    await closeModal(page);
    
    await clickPresentTile(page);
    await verifyModalOpen(page, 'Employees with Present Days');
    await expect(page.getByText(/No employees found/i)).toBeVisible();
    await page.screenshot({ path: 'e2e/screenshots/dashboard-08-empty-present-modal.png', fullPage: true });
    await closeModal(page);
  });

  test('09 - Modal Navigation Flow', async ({ page }) => {
    // Add employee with attendance
    const employee = generateEmployeeData();
    await addEmployeesWithAttendance(page, [
      {
        employee,
        attendanceRecords: [
          { date: '2026-02-10', status: 'Present' }
        ]
      }
    ]);
    
    // Navigate to dashboard
    await navigateToDashboard(page);
    await page.screenshot({ path: 'e2e/screenshots/dashboard-09-initial.png', fullPage: true });
    
    // Click Total Employees tile (opens Employee List Modal)
    await clickEmployeesTile(page);
    await verifyModalOpen(page, 'All Employees');
    await page.screenshot({ path: 'e2e/screenshots/dashboard-09-first-modal.png', fullPage: true });
    
    // Click employee name (opens Employee Attendance Modal)
    await clickEmployeeInModal(page, employee.fullName);
    await page.waitForTimeout(1000);
    await expect(page.getByText(employee.email)).toBeVisible();
    await page.screenshot({ path: 'e2e/screenshots/dashboard-09-second-modal.png', fullPage: true });
    
    // Close modal (should still show Employee List Modal underneath)
    await closeModal(page);
    await page.waitForTimeout(500);
    
    // Verify we're back at Employee List Modal
    await expect(page.getByText('All Employees')).toBeVisible();
    await page.screenshot({ path: 'e2e/screenshots/dashboard-09-back-to-first.png', fullPage: true });
    
    // Close again (should return to dashboard)
    await closeModal(page);
    await page.waitForTimeout(500);
    await expect(page.getByText('Dashboard Overview')).toBeVisible();
  });

  test('10 - Non-Clickable Tile', async ({ page }) => {
    // Navigate to dashboard
    await navigateToDashboard(page);
    
    // Verify "Total Attendance Records" tile is not clickable
    const isClickable = await verifyTileClickable(page, 'Total Attendance Records');
    expect(isClickable).toBe(false);
    await page.screenshot({ path: 'e2e/screenshots/dashboard-10-non-clickable.png', fullPage: true });
    
    // Try clicking on it
    const tile = page.locator('div', { hasText: 'Total Attendance Records' }).first();
    await tile.click();
    await page.waitForTimeout(1000);
    
    // Verify no modal opened (Dashboard Overview should still be visible)
    await expect(page.getByText('Dashboard Overview')).toBeVisible();
    
    // Verify no modal heading appeared
    const modalHeadings = page.locator('h2.text-2xl');
    const count = await modalHeadings.count();
    // Should only be "Dashboard Overview"
    expect(count).toBeLessThanOrEqual(1);
  });
});
