# HRMS Lite - Playwright Test Suite

Comprehensive test suite for the HRMS Lite application, covering all core features and bonus functionalities.

## Test Structure

```
tests/
├── e2e/                          # End-to-end tests (requires backend)
│   ├── employee-management.spec.js
│   ├── attendance-tracker.spec.js
│   └── dashboard.spec.js
├── mocked/                       # Mocked API tests (no backend needed)
│   ├── employee-management.spec.js
│   ├── attendance-tracker.spec.js
│   └── dashboard.spec.js
├── fixtures/
│   └── test-data.js             # Sample test data
└── helpers/
    ├── api-mock.js              # API mocking utilities
    └── test-utils.js            # Common test helpers
```

## Test Coverage

### Core Features

#### Employee Management
- ✅ Add employee with validation
- ✅ View employee list
- ✅ Delete employee
- ✅ Form validation (empty fields, invalid email)
- ✅ Duplicate email handling
- ✅ Empty state display
- ✅ Modal operations (open, close, clear)

#### Attendance Tracking
- ✅ Mark attendance (Present/Absent)
- ✅ Employee search and selection
- ✅ View attendance history
- ✅ Empty state handling
- ✅ Status badge display
- ✅ Date selection

### Bonus Features

#### Date Filtering
- ✅ Filter attendance by date range
- ✅ Filter dashboard by date range
- ✅ Clear filters functionality

#### Present Days Count
- ✅ Display total present days per employee
- ✅ Show count in attendance history

#### Dashboard Summary
- ✅ Display total employees count
- ✅ Display total attendance records
- ✅ Display present/absent counts
- ✅ Calculate and display attendance rate
- ✅ Interactive tiles with modals
- ✅ Date filtering on dashboard

### UI & UX Tests
- ✅ Loading states
- ✅ Error states
- ✅ Empty states
- ✅ Success/error messages
- ✅ Button loading states
- ✅ Modal interactions

## Running Tests

### Prerequisites

Ensure you have:
- Node.js installed
- Frontend dependencies installed (`npm install`)
- For E2E tests: Backend running on port 8000
- For E2E tests: Frontend running on port 5173

### Install Playwright Browsers

First time setup:

```bash
cd frontend
npx playwright install
```

### Run E2E Tests (with Real Backend)

**Terminal 1 - Backend:**
```bash
cd backend
uvicorn main:app --reload
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

**Terminal 3 - Tests:**
```bash
cd frontend
npm run test:e2e
```

### Run Mocked Tests (No Backend Needed)

**Terminal 1 - Frontend:**
```bash
cd frontend
npm run dev
```

**Terminal 2 - Tests:**
```bash
cd frontend
npm run test:mocked
```

### Run All Tests

```bash
npm run test:all
```

### Run Tests in UI Mode (Recommended for Development)

```bash
npm run test:ui
```

This opens an interactive UI where you can:
- Run individual tests
- Watch tests in real-time
- Debug test failures
- See test traces

### Debug Mode

```bash
npm run test:debug
```

Runs tests with Playwright Inspector for step-by-step debugging.

### View Test Report

After running tests:

```bash
npm run test:report
```

## Test Scripts Reference

| Command | Description |
|---------|-------------|
| `npm run test:e2e` | Run E2E tests only (requires backend) |
| `npm run test:mocked` | Run mocked API tests only |
| `npm run test:all` | Run all tests (both E2E and mocked) |
| `npm run test:ui` | Open Playwright UI for interactive testing |
| `npm run test:debug` | Run tests in debug mode |
| `npm run test:report` | View HTML test report |

## Test Configuration

Configuration is in `playwright.config.js`:

- **Base URL**: http://localhost:5173
- **Timeout**: 30 seconds per test
- **Retries**: 0 (local), 2 (CI)
- **Browsers**: Chromium (can be extended to Firefox, WebKit)
- **Screenshots**: On failure
- **Video**: On failure
- **Trace**: On first retry

## E2E vs Mocked Tests

### E2E Tests
- **Purpose**: Test full integration with real backend
- **Pros**: 
  - Tests actual API integration
  - Validates end-to-end workflows
  - Catches real-world issues
- **Cons**: 
  - Requires backend running
  - Slower execution
  - Database state management needed
- **When to use**: Before deployment, integration testing

### Mocked Tests
- **Purpose**: Test UI behavior and error handling
- **Pros**: 
  - Fast execution
  - No backend dependency
  - Easy to test edge cases and error scenarios
  - Consistent test data
- **Cons**: 
  - Doesn't test real API integration
- **When to use**: During development, CI/CD pipelines

## Test Statistics

### Total Test Cases: ~100+

- **E2E Employee Management**: 12 tests
- **E2E Attendance Tracker**: 17 tests
- **E2E Dashboard**: 20 tests
- **Mocked Employee Management**: 15 tests
- **Mocked Attendance Tracker**: 20 tests
- **Mocked Dashboard**: 20 tests

## Best Practices

1. **Run mocked tests frequently** during development
2. **Run E2E tests** before committing major changes
3. **Use test:ui** for debugging failing tests
4. **Keep test data clean** - E2E tests auto-cleanup created data
5. **Check test reports** after failures for screenshots and traces

## Troubleshooting

### Tests Timeout
- Increase timeout in `playwright.config.js`
- Check if backend/frontend is running
- Verify network connectivity

### E2E Tests Failing
- Ensure backend is running on port 8000
- Ensure frontend is running on port 5173
- Check database is accessible
- Clear browser cache: `npx playwright clean`

### Mocked Tests Failing
- Ensure frontend is running
- Check API routes in `api-mock.js` match actual routes
- Verify test data in `test-data.js`

## CI/CD Integration

For CI/CD pipelines, run mocked tests:

```yaml
# Example GitHub Actions
- name: Install dependencies
  run: npm ci
  
- name: Install Playwright browsers
  run: npx playwright install --with-deps
  
- name: Run mocked tests
  run: npm run test:mocked
```

For full integration tests, add backend setup and run E2E tests.

## Contributing

When adding new features:
1. Add test data to `fixtures/test-data.js`
2. Add API mocks to `helpers/api-mock.js`
3. Write E2E tests for happy path
4. Write mocked tests for edge cases and errors
5. Update this README if needed

## Support

For issues or questions:
- Check test reports: `npm run test:report`
- Run in UI mode: `npm run test:ui`
- Run in debug mode: `npm run test:debug`
- Check Playwright documentation: https://playwright.dev
