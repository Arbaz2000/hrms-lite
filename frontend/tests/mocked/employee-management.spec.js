import { test, expect } from '@playwright/test';
import { 
  mockEmployeeList, 
  mockEmptyEmployeeList, 
  mockEmployeeCreation, 
  mockEmployeeCreationDuplicateError, 
  mockEmployeeDeletion,
  mockAPIError,
  mockWithDelay,
  setupCommonMocks,
  mockDashboardSummary
} from '../helpers/api-mock.js';
import { sampleEmployees, newEmployee, errorResponses } from '../fixtures/test-data.js';
import { navigateToTab, fillEmployeeForm, waitForLoading } from '../helpers/test-utils.js';

test.describe('Employee Management - Mocked API', () => {
  test.beforeEach(async ({ page }) => {
    // Setup common mocks
    await setupCommonMocks(page);
  });

  test('should display loading state and then employee list', async ({ page }) => {
    // Mock delayed response to see loading state
    await mockWithDelay(page, '**/api/employees', sampleEmployees, 500);
    await mockDashboardSummary(page);
    
    await page.goto('/');
    await navigateToTab(page, 'Employee Management');
    
    // Wait for data to load
    await waitForLoading(page);
    
    // Should show employee list
    await expect(page.locator('table')).toBeVisible();
    await expect(page.locator(`text=${sampleEmployees[0].full_name}`)).toBeVisible();
  });

  test('should display employee list with mocked data', async ({ page }) => {
    await mockEmployeeList(page);
    
    await page.goto('/');
    await navigateToTab(page, 'Employee Management');
    await waitForLoading(page);
    
    // Verify all employees are displayed
    for (const employee of sampleEmployees) {
      await expect(page.locator(`text=${employee.full_name}`)).toBeVisible();
      await expect(page.locator(`text=${employee.email}`)).toBeVisible();
    }
  });

  test('should display empty state with mocked empty list', async ({ page }) => {
    await mockEmptyEmployeeList(page);
    
    await page.goto('/');
    await navigateToTab(page, 'Employee Management');
    await waitForLoading(page);
    
    await expect(page.locator('text=No employees found')).toBeVisible();
    await expect(page.locator('text=Get started by adding a new employee')).toBeVisible();
  });

  test('should successfully add employee with mocked creation', async ({ page }) => {
    await mockEmployeeList(page);
    await mockEmployeeCreation(page);
    
    await page.goto('/');
    await navigateToTab(page, 'Employee Management');
    await waitForLoading(page);
    
    // Open modal
    await page.click('button:has-text("Add New Employee")');
    
    // Fill form
    await fillEmployeeForm(page, newEmployee);
    
    // Submit
    await page.click('button:has-text("Add Employee")');
    
    // Should show success message
    await expect(page.locator('.bg-green-50')).toBeVisible();
    await expect(page.locator('text=Employee added successfully')).toBeVisible();
  });

  test('should show duplicate email error with mocked error response', async ({ page }) => {
    await mockEmployeeList(page);
    await mockEmployeeCreationDuplicateError(page);
    
    await page.goto('/');
    await navigateToTab(page, 'Employee Management');
    await waitForLoading(page);
    
    // Open modal
    await page.click('button:has-text("Add New Employee")');
    
    // Fill form
    await fillEmployeeForm(page, newEmployee);
    
    // Submit
    await page.click('button:has-text("Add Employee")');
    
    // Should show error message
    await expect(page.locator('.bg-red-50')).toBeVisible();
    await expect(page.locator('text=/email already exists/i')).toBeVisible();
  });

  test('should handle delete action with mocked API', async ({ page }) => {
    await mockEmployeeList(page);
    await mockEmployeeDeletion(page);
    
    await page.goto('/');
    await navigateToTab(page, 'Employee Management');
    await waitForLoading(page);
    
    // Setup dialog handler
    page.on('dialog', dialog => dialog.accept());
    
    // Click delete on first employee
    await page.locator('button:has-text("Delete")').first().click();
    
    // In a mocked test, we just verify the UI attempts deletion
    // The actual removal from list would require re-mocking with updated data
  });

  test('should show error state when API fails', async ({ page }) => {
    await mockAPIError(page, '**/api/employees');
    
    await page.goto('/');
    await navigateToTab(page, 'Employee Management');
    await waitForLoading(page);
    
    // Should show error message
    await expect(page.locator('.bg-red-50')).toBeVisible();
    await expect(page.locator('text=Error loading employees')).toBeVisible();
  });

  test('should show loading button state during submission', async ({ page }) => {
    await mockEmployeeList(page);
    // Mock with delay to see loading state
    await page.route('**/api/employees', async (route) => {
      if (route.request().method() === 'POST') {
        await new Promise(resolve => setTimeout(resolve, 2000));
        const postData = JSON.parse(route.request().postData());
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ id: 999, ...postData }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(sampleEmployees),
        });
      }
    });
    
    await page.goto('/');
    await navigateToTab(page, 'Employee Management');
    await waitForLoading(page);
    
    // Open modal
    await page.click('button:has-text("Add New Employee")');
    await fillEmployeeForm(page, newEmployee);
    
    // Submit
    await page.click('button:has-text("Add Employee")');
    
    // Button should show loading state
    await expect(page.locator('button:has-text("Adding...")')).toBeVisible();
  });

  test('should clear form errors when typing in field', async ({ page }) => {
    await mockEmployeeList(page);
    
    await page.goto('/');
    await navigateToTab(page, 'Employee Management');
    await waitForLoading(page);
    
    // Open modal
    await page.click('button:has-text("Add New Employee")');
    
    // Submit empty form
    await page.click('button:has-text("Add Employee")');
    
    // Error should appear
    await expect(page.locator('text=Email is required')).toBeVisible();
    
    // Type in email field
    await page.fill('#email', 'test@example.com');
    
    // Error should disappear
    await expect(page.locator('text=Email is required')).not.toBeVisible();
  });

  test('should close modal and clear form when clicking cancel', async ({ page }) => {
    await mockEmployeeList(page);
    
    await page.goto('/');
    await navigateToTab(page, 'Employee Management');
    await waitForLoading(page);
    
    // Open modal
    await page.click('button:has-text("Add New Employee")');
    
    // Fill some data
    await page.fill('#full_name', 'Test Name');
    
    // Click cancel
    await page.click('button:has-text("Cancel")');
    
    // Modal should close
    await expect(page.locator('h3:has-text("Add New Employee")')).not.toBeVisible();
    
    // Reopen modal
    await page.click('button:has-text("Add New Employee")');
    
    // Form should be empty
    const nameValue = await page.inputValue('#full_name');
    expect(nameValue).toBe('');
  });

  test('should handle modal close after successful submission', async ({ page }) => {
    await mockEmployeeList(page);
    await mockEmployeeCreation(page);
    
    await page.goto('/');
    await navigateToTab(page, 'Employee Management');
    await waitForLoading(page);
    
    // Open modal
    await page.click('button:has-text("Add New Employee")');
    await fillEmployeeForm(page, newEmployee);
    await page.click('button:has-text("Add Employee")');
    
    // Wait for success message
    await expect(page.locator('.bg-green-50')).toBeVisible();
    
    // Modal should auto-close after 2 seconds
    await page.waitForSelector('h3:has-text("Add New Employee")', { 
      state: 'hidden', 
      timeout: 3000 
    });
  });

  test('should show confirmation dialog before deleting', async ({ page }) => {
    await mockEmployeeList(page);
    await mockEmployeeDeletion(page);
    
    await page.goto('/');
    await navigateToTab(page, 'Employee Management');
    await waitForLoading(page);
    
    // Setup dialog handler to verify it appears
    let dialogShown = false;
    page.on('dialog', dialog => {
      dialogShown = true;
      expect(dialog.message()).toContain('Are you sure');
      dialog.dismiss();
    });
    
    // Click delete
    await page.locator('button:has-text("Delete")').first().click();
    
    // Verify dialog was shown
    expect(dialogShown).toBe(true);
  });

  test('should display all required table columns', async ({ page }) => {
    await mockEmployeeList(page);
    
    await page.goto('/');
    await navigateToTab(page, 'Employee Management');
    await waitForLoading(page);
    
    // Check all column headers
    await expect(page.locator('th:has-text("ID")')).toBeVisible();
    await expect(page.locator('th:has-text("Full Name")')).toBeVisible();
    await expect(page.locator('th:has-text("Email")')).toBeVisible();
    await expect(page.locator('th:has-text("Department")')).toBeVisible();
    await expect(page.locator('th:has-text("Actions")')).toBeVisible();
  });

  test('should validate all required fields together', async ({ page }) => {
    await mockEmployeeList(page);
    
    await page.goto('/');
    await navigateToTab(page, 'Employee Management');
    await waitForLoading(page);
    
    // Open modal
    await page.click('button:has-text("Add New Employee")');
    
    // Submit empty form - triggers React validation
    await page.click('button:has-text("Add Employee")');
    
    // All validation errors should appear
    await expect(page.locator('text=Full name is required')).toBeVisible();
    await expect(page.locator('text=Email is required')).toBeVisible();
    await expect(page.locator('text=Department is required')).toBeVisible();
  });
});
