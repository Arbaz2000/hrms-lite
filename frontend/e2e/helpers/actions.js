/**
 * Reusable actions for E2E tests
 */

export async function addEmployee(page, { fullName, email, department }) {
  // Click Add New Employee button
  await page.getByRole('button', { name: 'Add New Employee' }).click();
  
  // Wait for modal to appear
  await page.waitForSelector('input[name="full_name"]', { state: 'visible' });
  
  // Fill the form
  await page.fill('input[name="full_name"]', fullName);
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="department"]', department);
  
  // Submit the form
  await page.getByRole('button', { name: /Add Employee/i }).click();
  
  // Wait for success - the modal shows success message for 2 seconds before closing
  // So we wait 3 seconds total to ensure modal is fully closed
  await page.waitForTimeout(3500);
}

export async function deleteEmployee(page, employeeName) {
  // Find the row containing the employee
  const row = page.locator('tr', { hasText: employeeName });
  
  // Click delete button in that row
  await row.getByText('Delete').click();
  
  // Confirm deletion in the browser dialog
  page.on('dialog', dialog => dialog.accept());
  
  // Wait for deletion to complete
  await page.waitForTimeout(1000);
}

export async function markAttendance(page, { employeeName, department, date, status }) {
  // Click Attendance Tracker tab
  await page.getByText('Attendance Tracker').click();
  
  // Wait for the tab content to load
  await page.waitForTimeout(500);
  
  // Select employee from dropdown (format: "Full Name (Department)")
  await page.selectOption('select#employee', { label: `${employeeName} (${department})` });
  
  // Fill date if provided
  if (date) {
    await page.fill('input[type="date"]', date);
  }
  
  // Select status (Present or Absent)
  await page.check(`input[value="${status}"]`);
  
  // Submit attendance
  await page.getByRole('button', { name: /Mark Attendance/i }).click();
  
  // Wait for success
  await page.waitForTimeout(1000);
}

export async function waitForEmployeeInList(page, employeeName) {
  await page.waitForSelector(`text=${employeeName}`, { timeout: 5000 });
}

/**
 * Add multiple employees in batch
 */
export async function addEmployeesInBatch(page, employeesData) {
  for (const employeeData of employeesData) {
    await addEmployee(page, employeeData);
  }
}

/**
 * Add employees with attendance records in batch
 */
export async function addEmployeesWithAttendance(page, employeesWithAttendance) {
  for (const { employee, attendanceRecords } of employeesWithAttendance) {
    // First add the employee
    await addEmployee(page, employee);
    
    // Then add attendance records for this employee
    if (attendanceRecords && attendanceRecords.length > 0) {
      for (const attendance of attendanceRecords) {
        await markAttendance(page, {
          employeeName: employee.fullName,
          department: employee.department,
          date: attendance.date,
          status: attendance.status
        });
        
        // Return to Employee Management tab for next employee
        await page.getByText('Employee Management').first().click();
        await page.waitForTimeout(500);
      }
    }
  }
}
