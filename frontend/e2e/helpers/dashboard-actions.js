/**
 * Dashboard-specific helper actions for E2E tests
 */

/**
 * Navigate to the Dashboard tab
 */
export async function navigateToDashboard(page) {
  await page.getByText('Dashboard').first().click();
  await page.waitForTimeout(500);
  await page.waitForSelector('text=Dashboard Overview', { timeout: 5000 });
}

/**
 * Set date range filters on the dashboard
 */
export async function setDateFilter(page, startDate = null, endDate = null) {
  if (startDate) {
    await page.fill('input#startDate', startDate);
    await page.waitForTimeout(500);
  }
  if (endDate) {
    await page.fill('input#endDate', endDate);
    await page.waitForTimeout(500);
  }
}

/**
 * Clear date filters by clicking the Clear Filters button
 */
export async function clearDateFilters(page) {
  const clearButton = page.getByRole('button', { name: 'Clear Filters' });
  if (await clearButton.isVisible()) {
    await clearButton.click();
    await page.waitForTimeout(500);
  }
}

/**
 * Click on the Total Employees tile
 */
export async function clickEmployeesTile(page) {
  const tile = page.locator('div', { hasText: 'Total Employees' }).first();
  await tile.click();
  await page.waitForTimeout(500);
}

/**
 * Click on the Present Days tile
 */
export async function clickPresentTile(page) {
  const tile = page.locator('div', { hasText: 'Present Days' }).first();
  await tile.click();
  await page.waitForTimeout(500);
}

/**
 * Click on the Absent Days tile
 */
export async function clickAbsentTile(page) {
  const tile = page.locator('div', { hasText: 'Absent Days' }).first();
  await tile.click();
  await page.waitForTimeout(500);
}

/**
 * Verify that a modal with the given title is open
 */
export async function verifyModalOpen(page, modalTitle) {
  await page.waitForSelector(`text=${modalTitle}`, { timeout: 5000 });
  const modal = page.getByRole('heading', { name: modalTitle });
  await modal.waitFor({ state: 'visible' });
}

/**
 * Close the currently open modal by clicking the X button
 */
export async function closeModal(page) {
  // Find the close button (X icon) in the modal
  const closeButton = page.locator('button').filter({ has: page.locator('svg path[d*="M6 18L18 6M6 6l12 12"]') }).first();
  await closeButton.click();
  await page.waitForTimeout(500);
}

/**
 * Click on an employee name within a modal
 */
export async function clickEmployeeInModal(page, employeeName) {
  const employeeLink = page.getByRole('button', { name: employeeName });
  await employeeLink.click();
  await page.waitForTimeout(500);
}

/**
 * Get the stat value from a dashboard tile
 */
export async function getStatValue(page, statTitle) {
  const tile = page.locator('div', { hasText: statTitle }).first();
  const valueElement = tile.locator('p.text-3xl').first();
  const text = await valueElement.textContent();
  return parseInt(text.trim());
}

/**
 * Verify that a tile is clickable (has cursor pointer and click hint)
 */
export async function verifyTileClickable(page, statTitle) {
  const tile = page.locator('div', { hasText: statTitle }).first();
  const classes = await tile.getAttribute('class');
  return classes.includes('cursor-pointer');
}
