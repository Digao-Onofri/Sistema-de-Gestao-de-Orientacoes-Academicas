import { defineConfig, devices } from '@playwright/test';

const baseURL = 'http://127.0.0.1:3109';
const e2eDataDir = process.env.SGOA_DATA_DIR;

if (!e2eDataDir) {
  throw new Error('Run E2E tests with npm run test:e2e so the isolated data directory is shared.');
}

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'list',
  globalSetup: './e2e/global-setup.ts',
  globalTeardown: './e2e/global-teardown.ts',
  use: {
    ...devices['Desktop Chrome'],
    baseURL,
    launchOptions: {
      slowMo: Number(process.env.E2E_SLOW_MO ?? 0),
    },
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev -- --hostname 127.0.0.1 --port 3109',
    url: baseURL,
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      SGOA_DATA_DIR: e2eDataDir,
    },
  },
});
