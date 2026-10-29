import { defineConfig } from '@playwright/test';
import base from './playwright.config';

/**
 * Roteiro ao vivo (npm run demo / npm run demo:manual): navegador visível, câmera lenta e legendas.
 *  - apresentacao:        cada passo fica alguns segundos na tela e avança sozinho.
 *  - apresentacao-manual: cada passo só avança com → ou PageDown.
 * Fica fora do playwright.config.ts para que `npx playwright test` (e o CI) nunca abra janela.
 */
export default defineConfig({
  ...base,
  testMatch: 'roteiro.spec.ts',
  projects: [
    {
      name: 'apresentacao',
      timeout: 0,
      metadata: { demo: true, manual: false, pausaMs: 3000 },
      use: { browserName: 'chromium', headless: false, launchOptions: { slowMo: 450 } },
    },
    {
      name: 'apresentacao-manual',
      timeout: 0,
      metadata: { demo: true, manual: true },
      use: { browserName: 'chromium', headless: false, launchOptions: { slowMo: 450 } },
    },
  ],
});
