import { defineConfig } from '@playwright/test';
import base from './playwright.config';

const servidor = Array.isArray(base.webServer) ? base.webServer[0] : base.webServer;
if (!servidor) throw new Error('Servidor de testes não configurado.');

// Configuração aditiva para execução local em disco lento, sem alterar a suíte anterior.
export default defineConfig({
  ...base,
  testMatch: 'release03.spec.ts',
  timeout: 180000,
  expect: { timeout: 30000 },
  use: { ...base.use, navigationTimeout: 120000, actionTimeout: 60000 },
  webServer: { ...servidor, timeout: 360000 },
});
