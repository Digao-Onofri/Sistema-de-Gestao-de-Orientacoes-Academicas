import { expect, test } from '@playwright/test';
import { credentials, loginAs, resetTestData } from './support/test-data';

test.beforeEach(async ({ page }) => {
  resetTestData();
  await loginAs(page, credentials.coordinator.email, credentials.coordinator.password);
  await page.getByRole('link', { name: /Períodos Letivos/ }).click();
});

test('RF013/RF014: cria, altera e remove período letivo', async ({ page }) => {
  await page.getByRole('link', { name: '+ Novo Período' }).click();
  await page.locator('input[name="identificacao"]').fill('2098/2');
  await page.getByRole('button', { name: 'Salvar Período' }).click();
  await expect(page.getByRole('cell', { name: '2098/2' })).toBeVisible();

  const periodo = page.getByRole('row').filter({ hasText: '2098/2' });
  await periodo.getByRole('link', { name: 'Editar' }).click();
  await page.locator('input[name="identificacao"]').fill('2098/3');
  await page.getByRole('button', { name: 'Salvar Alterações' }).click();
  await expect(page.getByRole('cell', { name: '2098/3' })).toBeVisible();

  const periodoAtualizado = page.getByRole('row').filter({ hasText: '2098/3' });
  page.once('dialog', (dialog) => dialog.accept());
  await periodoAtualizado.getByRole('button', { name: 'Excluir' }).click();
  await expect(periodoAtualizado).toHaveCount(0);
});
