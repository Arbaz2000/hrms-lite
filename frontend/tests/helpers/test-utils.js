/**
 * Common test utilities and helpers
 */

/**
 * Wait for loading spinner to disappear
 */
export const waitForLoading = async (page) => {
  try {
    // Wait a bit for spinner to appear if it's going to
    await page.waitForTimeout(100);
    // Then wait for it to disappear
    await page.waitForSelector('.animate-spin', { state: 'hidden', timeout: 5000 });
  } catch (error) {
    // Spinner might not appear or already gone, that's okay
  }
};

/**
 * Navigate to a specific tab
 */
export const navigateToTab = async (page, tabName) => {
  await page.click(`text=${tabName}`, { timeout: 5000 });
  await page.waitForTimeout(500); // Give UI time to update
  await waitForLoading(page);
};

/**
 * Fill employee form
 */
export const fillEmployeeForm = async (page, employeeData) => {
  await page.fill('#full_name', employeeData.full_name);
  await page.fill('#email', employeeData.email);
  await page.fill('#department', employeeData.department);
};

/**
 * Check if success message is visible
 */
export const expectSuccessMessage = async (page, message = null) => {
  const successDiv = page.locator('.bg-green-50');
  await successDiv.waitFor({ state: 'visible' });
  
  if (message) {
    await expect(successDiv).toContainText(message);
  }
};

/**
 * Check if error message is visible
 */
export const expectErrorMessage = async (page, message = null) => {
  const errorDiv = page.locator('.bg-red-50');
  await errorDiv.waitFor({ state: 'visible' });
  
  if (message) {
    await expect(errorDiv).toContainText(message);
  }
};

/**
 * Format date for display (matches frontend format)
 */
export const formatDateForDisplay = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

/**
 * Get today's date in YYYY-MM-DD format
 */
export const getTodayDate = () => {
  return new Date().toISOString().split('T')[0];
};

/**
 * Get date offset by days in YYYY-MM-DD format
 */
export const getDateOffset = (days) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
};

/**
 * Wait for modal to open
 */
export const waitForModal = async (page) => {
  await page.waitForSelector('.fixed.inset-0', { state: 'visible', timeout: 5000 });
};

/**
 * Open add employee modal
 */
export const openAddEmployeeModal = async (page) => {
  await page.click('button:has-text("Add New Employee")', { timeout: 5000 });
  await page.waitForSelector('h3:has-text("Add New Employee")', { state: 'visible', timeout: 5000 });
};

/**
 * Close modal by clicking close button
 */
export const closeModal = async (page) => {
  await page.click('button:has-text("×"), button:has(svg path[d*="M6 18L18 6"])');
};

/**
 * Wait for table to load
 */
export const waitForTable = async (page) => {
  await page.waitForSelector('table', { state: 'visible' });
};

/**
 * Count table rows (excluding header)
 */
export const countTableRows = async (page) => {
  return await page.locator('tbody tr').count();
};

/**
 * Check if empty state is visible
 */
export const expectEmptyState = async (page, message = null) => {
  const emptyState = page.locator('text=No employees found, text=No attendance records found').first();
  await emptyState.waitFor({ state: 'visible' });
  
  if (message) {
    await expect(page.locator(`text=${message}`)).toBeVisible();
  }
};

/**
 * Search and select employee in attendance tracker
 */
export const searchAndSelectEmployee = async (page, employeeName) => {
  await page.fill('#employee', employeeName);
  await page.waitForSelector('.absolute.z-10', { state: 'visible' });
  await page.click(`.absolute.z-10 >> text=${employeeName}`);
};

/**
 * Mark attendance for an employee
 */
export const markAttendance = async (page, employeeName, date, status) => {
  await searchAndSelectEmployee(page, employeeName);
  await page.fill('#date', date);
  await page.click(`input[value="${status}"]`);
  await page.click('button:has-text("Mark Attendance")');
};

/**
 * Wait for network idle (useful after actions that trigger API calls)
 */
export const waitForNetworkIdle = async (page) => {
  await page.waitForLoadState('networkidle');
};

/**
 * Retry an action until it succeeds or times out
 */
export const retryAction = async (action, maxAttempts = 3, delayMs = 1000) => {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      await action();
      return;
    } catch (error) {
      if (i === maxAttempts - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
};
