import { test, expect } from '@playwright/test';
import { generateUniqueEmployee } from '../fixtures/test-data.js';
import { navigateToTab, fillEmployeeForm, waitForLoading, countTableRows } from '../helpers/test-utils.js';

test.describe('Employee Management - E2E', () => {
  let createdEmployeeIds = [];

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForLoading(page);
    await navigateToTab(page, 'Employee Management');
  });

  test.afterEach(async ({ page }) => {
    // Cleanup: Delete created employees
    for (const employeeId of createdEmployeeIds) {
      try {
        await page.request.delete(`http://localhost:8000/api/employees/${employeeId}`);
      } catch (error) {
        console.log(`Failed to cleanup employee ${employeeId}:`, error);
      }
    }
    createdEmployeeIds = [];
  });

  test('should display employee management page with add button', async ({ page }) => {
    await expect(page.locator('h2:has-text("Employee Management")')).toBeVisible();
    await expect(page.locator('button:has-text("Add New Employee")')).toBeVisible();
  });

  test('should open add employee modal when clicking add button', async ({ page }) => {
    await page.click('button:has-text("Add New Employee")');
    
    await expect(page.locator('h3:has-text("Add New Employee")')).toBeVisible();
    await expect(page.locator('#full_name')).toBeVisible();
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#department')).toBeVisible();
  });

  test('should successfully add a new employee with valid data', async ({ page }) => {
    const newEmployee = generateUniqueEmployee();
    
    // Open modal
    await page.click('button:has-text("Add New Employee")');
    
    // Fill form
    await fillEmployeeForm(page, newEmployee);
    
    // Submit
    await page.click('button:has-text("Add Employee")');
    
    // Wait for success message
    await expect(page.locator('.bg-green-50')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Employee added successfully')).toBeVisible();
    
    // Modal should close automatically
    await page.waitForSelector('h3:has-text("Add New Employee")', { state: 'hidden', timeout: 5000 });
    
    // Verify employee appears in the list
    await expect(page.locator(`text=${newEmployee.full_name}`)).toBeVisible();
    await expect(page.locator(`text=${newEmployee.email}`)).toBeVisible();
    await expect(page.locator(`text=${newEmployee.department}`)).toBeVisible();
    
    // Get employee ID for cleanup
    const response = await page.request.get('http://localhost:8000/api/employees');
    const employees = await response.json();
    const createdEmployee = employees.find(emp => emp.email === newEmployee.email);
    if (createdEmployee) {
      createdEmployeeIds.push(createdEmployee.id);
    }
  });

  test('should show validation errors for empty fields', async ({ page }) => {
    await page.click('button:has-text("Add New Employee")');
    
    // Try to submit empty form
    await page.click('button:has-text("Add Employee")');
    
    // Check for validation errors
    await expect(page.locator('text=Full name is required')).toBeVisible();
    await expect(page.locator('text=Email is required')).toBeVisible();
    await expect(page.locator('text=Department is required')).toBeVisible();
  });

  test('should show validation error for invalid email format', async ({ page }) => {
    await page.click('button:has-text("Add New Employee")');
    
    await page.fill('#full_name', 'Test User');
    await page.fill('#email', 'invalid-email');
    await page.fill('#department', 'Testing');
    
    await page.click('button:has-text("Add Employee")');
    
    await expect(page.locator('text=Invalid email format')).toBeVisible();
  });

  test('should handle duplicate email error', async ({ page }) => {
    const employee = generateUniqueEmployee();
    
    // Create first employee
    const createResponse = await page.request.post('http://localhost:8000/api/employees', {
      data: employee,
    });
    const createdEmployee = await createResponse.json();
    createdEmployeeIds.push(createdEmployee.id);
    
    // Reload page to refresh list
    await page.reload();
    await waitForLoading(page);
    
    // Try to create employee with same email
    await page.click('button:has-text("Add New Employee")');
    await fillEmployeeForm(page, {
      full_name: 'Different Name',
      email: employee.email, // Same email
      department: 'Different Dept',
    });
    await page.click('button:has-text("Add Employee")');
    
    // Should show error
    await expect(page.locator('.bg-red-50')).toBeVisible();
    await expect(page.locator('text=/email already exists/i')).toBeVisible();
  });

  test('should display employee list with correct columns', async ({ page }) => {
    // Check table headers
    await expect(page.locator('th:has-text("ID")')).toBeVisible();
    await expect(page.locator('th:has-text("Full Name")')).toBeVisible();
    await expect(page.locator('th:has-text("Email")')).toBeVisible();
    await expect(page.locator('th:has-text("Department")')).toBeVisible();
    await expect(page.locator('th:has-text("Actions")')).toBeVisible();
  });

  test('should successfully delete an employee', async ({ page }) => {
    const employee = generateUniqueEmployee();
    
    // Create employee
    const createResponse = await page.request.post('http://localhost:8000/api/employees', {
      data: employee,
    });
    const createdEmployee = await createResponse.json();
    
    // Reload page
    await page.reload();
    await waitForLoading(page);
    
    // Verify employee is in the list
    await expect(page.locator(`text=${employee.full_name}`)).toBeVisible();
    
    // Setup dialog handler for confirmation
    page.on('dialog', dialog => dialog.accept());
    
    // Find and click delete button for this employee
    const row = page.locator(`tr:has-text("${employee.email}")`);
    await row.locator('button:has-text("Delete")').click();
    
    // Wait for deletion
    await waitForLoading(page);
    
    // Verify employee is removed from list
    await expect(page.locator(`text=${employee.email}`)).not.toBeVisible();
  });

  test('should show empty state when no employees exist', async ({ page }) => {
    // Get all employees and delete them
    const response = await page.request.get('http://localhost:8000/api/employees');
    const employees = await response.json();
    
    for (const emp of employees) {
      await page.request.delete(`http://localhost:8000/api/employees/${emp.id}`);
    }
    
    // Reload page
    await page.reload();
    await waitForLoading(page);
    
    // Check for empty state
    await expect(page.locator('text=No employees found')).toBeVisible();
    await expect(page.locator('text=Get started by adding a new employee')).toBeVisible();
    
    // Cleanup: We deleted all, so no specific IDs to track
  });

  test('should close modal when clicking cancel button', async ({ page }) => {
    await page.click('button:has-text("Add New Employee")');
    
    await expect(page.locator('h3:has-text("Add New Employee")')).toBeVisible();
    
    await page.click('button:has-text("Cancel")');
    
    await expect(page.locator('h3:has-text("Add New Employee")')).not.toBeVisible();
  });

  test('should close modal when clicking X button', async ({ page }) => {
    await page.click('button:has-text("Add New Employee")');
    
    await expect(page.locator('h3:has-text("Add New Employee")')).toBeVisible();
    
    // Click the X button (close icon)
    await page.locator('button:has(svg path[d*="M6 18L18 6"])').click();
    
    await expect(page.locator('h3:has-text("Add New Employee")')).not.toBeVisible();
  });

  test('should clear error when user starts typing in a field', async ({ page }) => {
    await page.click('button:has-text("Add New Employee")');
    
    // Submit empty form to trigger validation
    await page.click('button:has-text("Add Employee")');
    
    // Verify error appears
    await expect(page.locator('text=Email is required')).toBeVisible();
    
    // Start typing in email field
    await page.fill('#email', 'test@example.com');
    
    // Error should disappear
    await expect(page.locator('text=Email is required')).not.toBeVisible();
  });
});
