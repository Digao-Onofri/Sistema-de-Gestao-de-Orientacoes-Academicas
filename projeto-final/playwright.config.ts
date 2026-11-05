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
      expect: { timeout: 30_000 },
      use: {
        ...devices['Desktop Chrome'],
        navigationTimeout: 120_000,
        actionTimeout: 60_000,
      },
    },
    {
      name: 'release03',
      default: false,
      testMatch: 'release03-*.spec.ts',
      timeout: 180_000,
      expect: { timeout: 30_000 },
      use: {
        ...devices['Desktop Chrome'],
        navigationTimeout: 120_000,
        actionTimeout: 60_000,
      },
    },
  ],
  webServer: {
    command: 'npm run dev -- --hostname 127.0.0.1 --port 3109',
    url: baseURL,
    reuseExistingServer: false,
    timeout: 360_000,
    env: {
      SGOA_DATA_DIR: e2eDataDir,
    },
  },
});
