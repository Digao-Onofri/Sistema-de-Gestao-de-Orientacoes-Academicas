import fs from 'node:fs';
import { expect, test } from '@playwright/test';
import {
  loginAs,
  prepararAlocacaoAtivaR04,
  prepararDadosR04,
  release04Credentials,
} from './support/release04';

test.beforeEach(() => {
  prepararDadosR04();
  prepararAlocacaoAtivaR04();
});

test('coordenação consulta o painel filtrado e exporta CSV sem dados desnecessários', async ({ page }) => {
  await loginAs(page, release04Credentials.coordinator.email, release04Credentials.coordinator.password);
  await page.goto('/painel?curso=r04-e2e-curso&ciclo=r04-e2e-ciclo');

  await expect(page.getByRole('heading', { name: 'Painel gerencial' })).toBeVisible();
  await expect(page.getByRole('row').filter({ hasText: 'Curso R04 E2E' })).toContainText('1');

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('link', { name: 'Exportar CSV' }).click();
  const download = await downloadPromise;
  const path = await download.path();
  expect(path).not.toBeNull();
  const csv = fs.readFileSync(path!, 'utf8');
  expect(csv.charCodeAt(0)).toBe(0xfeff);
  expect(csv).toContain('"Curso R04 E2E"');
  expect(csv).not.toContain('tutorado@sgoa.test');
});

test('tutor não acessa painel nem exportação de relatórios', async ({ page }) => {
  await loginAs(page, release04Credentials.tutor.email, release04Credentials.tutor.password);

  await page.goto('/painel');
  await expect(page).toHaveURL(/\/dashboard$/);
  const respostaCsv = await page.goto('/painel/csv');
  expect(respostaCsv?.status()).toBe(403);

  await page.goto('/auditoria');
  await expect(page).toHaveURL(/\/dashboard$/);
});
