import { expect, test } from '@playwright/test';
import { credentials, loginAs, resetTestData } from './support/test-data';

test.beforeEach(() => {
  resetTestData();
});

test('RF005/RF016: tutorado cria, altera e remove a própria proposta', async ({ page }) => {
  await loginAs(page, credentials.tutorado.email, credentials.tutorado.password);
  await page.getByRole('link', { name: /Propostas TCC \/ IC/ }).click();

  await page.getByRole('link', { name: '+ Nova Proposta' }).click();
  await page.locator('input[name="titulo"]').fill('Nova proposta E2E');
  await page.locator('select[name="tipo"]').selectOption('IC');
  await page.locator('textarea[name="resumo"]').fill('Resumo inicial da proposta E2E.');
  await page.locator('input[name="palavrasChave"]').fill('pesquisa, sistemas');
  await page.getByRole('button', { name: 'Salvar Proposta' }).click();

  const proposta = page.getByRole('row').filter({ hasText: 'Nova proposta E2E' });
  await expect(proposta).toContainText('IC');
  await expect(proposta).toContainText('Tutorado E2E');
  await expect(proposta).toContainText('pesquisa');

  await proposta.getByRole('link', { name: 'Editar' }).click();
  await page.locator('input[name="titulo"]').fill('Proposta E2E Atualizada');
  await page.locator('textarea[name="resumo"]').fill('Resumo atualizado.');
  await page.locator('select[name="tipo"]').selectOption('TCC');
  await page.getByRole('button', { name: 'Salvar Alterações' }).click();

  const propostaAtualizada = page.getByRole('row').filter({
    hasText: 'Proposta E2E Atualizada',
  });
  await expect(propostaAtualizada).toContainText('TCC');
  await expect(propostaAtualizada).toContainText('Resumo atualizado.');
  await expect(propostaAtualizada).toContainText('Tutorado E2E');
  page.once('dialog', (dialog) => dialog.accept());
  await propostaAtualizada.getByRole('button', { name: 'Excluir' }).click();
  await expect(propostaAtualizada).toHaveCount(0);
});

test('tutorado visualiza somente as próprias propostas', async ({ page }) => {
  await loginAs(page, credentials.tutorado.email, credentials.tutorado.password);
  await page.getByRole('link', { name: /Propostas TCC \/ IC/ }).click();

  await expect(page.getByText('Proposta E2E')).toBeVisible();
  await expect(page.getByText('Proposta de outro tutorado')).toHaveCount(0);
});
