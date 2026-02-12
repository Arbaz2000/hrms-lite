import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for HRMS Lite
 * Includes two projects:
 * - e2e: End-to-end tests with real backend (requires backend running on port 8000)
 * - mocked: Tests with mocked API responses (no backend needed)
 */
export default defineConfig({
  testDir: './tests',
  
  // Maximum time one test can run
  timeout: 30 * 1000,
  
  // Test execution settings
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  
  // Reporter to use
  reporter: [
    ['html'],
    ['list']
  ],
  
  // Shared settings for all projects
  use: {
    // Base URL for navigation
    baseURL: 'http://localhost:5173',
    
    // Collect trace when retrying the failed test
    trace: 'on-first-retry',
    
    // Screenshot on failure
    screenshot: 'only-on-failure',
    
    // Video on failure
    video: 'retain-on-failure',
    
    // Shorter default action timeout for faster feedback
    actionTimeout: 10 * 1000,
    
    // Shorter navigation timeout
    navigationTimeout: 15 * 1000,
  },

  // Configure projects for different test scenarios
  projects: [
    {
      name: 'e2e',
      testMatch: '**/e2e/**/*.spec.js',
      use: {
        ...devices['Desktop Chrome'],
        // E2E tests use real backend API
        baseURL: 'http://localhost:5173',
      },
    },
    
    {
      name: 'mocked',
      testMatch: '**/mocked/**/*.spec.js',
      use: {
        ...devices['Desktop Chrome'],
        // Mocked tests intercept API calls
        baseURL: 'http://localhost:5173',
      },
    },
  ],

  // Run dev server before starting tests (optional)
  // Uncomment if you want Playwright to auto-start the dev server
  // webServer: {
  //   command: 'npm run dev',
  //   url: 'http://localhost:5173',
  //   reuseExistingServer: !process.env.CI,
  //   timeout: 120 * 1000,
  // },
});
