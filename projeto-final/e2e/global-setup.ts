import fs from 'fs';
import { chromium, type FullConfig } from '@playwright/test';
import { PASTA_BACKUP, PASTA_DADOS, restaurarDados } from './dados';

// Rotas compiladas antecipadamente para que o `next dev` não fique lento durante a apresentação.
const ROTAS = [
  '/dashboard',
  '/usuarios',
  '/usuarios/novo',
  '/usuarios/coord-default-001',
  '/cursos',
  '/cursos/novo',
  '/cursos/aquecimento',
  '/unidades/nova',
  '/periodos',
  '/periodos/novo',
  '/periodos/aquecimento',
  '/propostas',
  '/propostas/nova',
  '/propostas/aquecimento',
];

export default async function globalSetup(config: FullConfig) {
  // Uma execução interrompida deixa o backup para trás: restaura antes de salvar de novo.
  restaurarDados();
  fs.cpSync(PASTA_DADOS, PASTA_BACKUP, { recursive: true });

  const baseURL = config.projects[0].use.baseURL!;
  const browser = await chromium.launch();
  const page = await browser.newPage({ baseURL });
  await page.goto('/login');
  await page.locator('#email').fill('admin@sgoa.edu');
  await page.locator('#senha').fill('admin123');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await page.waitForURL('**/dashboard', { timeout: 60_000 });
  for (const rota of ROTAS) {
    await page.goto(rota, { timeout: 60_000 });
  }
  await browser.close();
}
