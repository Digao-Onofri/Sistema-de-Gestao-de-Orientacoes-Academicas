import { defineConfig } from '@playwright/test';

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000';

/**
 * Testes de ponta a ponta (`npx playwright test` ou `npm run test:e2e`).
 * O roteiro de apresentação ao vivo reaproveita esta base em playwright.apresentacao.config.ts.
 */
export default defineConfig({
  testDir: './e2e',
  // O roteiro tem estado compartilhado entre os passos (quem é cadastrado depois entra no
  // sistema), então roda em série e sem novas tentativas: repetir criaria registros duplicados.
  fullyParallel: false,
  workers: 1,
  retries: 0,
  forbidOnly: !!process.env.CI,
  reporter: [['list'], ['html', { open: 'never' }]],
  globalSetup: './e2e/global-setup.ts',
  globalTeardown: './e2e/global-teardown.ts',
  use: {
    baseURL: BASE_URL,
    viewport: { width: 1366, height: 768 },
    locale: 'pt-BR',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      timeout: 60_000,
      use: { browserName: 'chromium', headless: true },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: `${BASE_URL}/login`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
