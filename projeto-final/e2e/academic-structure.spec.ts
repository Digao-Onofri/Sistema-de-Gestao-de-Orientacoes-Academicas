import { expect, test } from '@playwright/test';
import { credentials, loginAs, resetTestData } from './support/test-data';

test.beforeEach(async ({ page }) => {
  resetTestData();
  await loginAs(page, credentials.coordinator.email, credentials.coordinator.password);
  await page.goto('/cursos');
});

test('RF003/RF011: cadastra unidade e curso vinculado com situação definida', async ({ page }) => {
  await page.getByRole('link', { name: '+ Nova Unidade' }).click();
  await page.locator('input[name="denominacao"]').fill('Instituto E2E Novo');
  await page.getByRole('button', { name: 'Salvar Unidade' }).click();
  await expect(page.getByText('Instituto E2E Novo')).toBeVisible();

  await page.getByRole('link', { name: '+ Novo Curso' }).click();
  await page.locator('input[name="denominacao"]').fill('Curso E2E Novo');
  await page.locator('select[name="unidadeId"]').selectOption({
    label: 'Instituto E2E Novo',
  });
  await page.locator('select[name="situacao"]').selectOption('Inativo');
  await page.getByRole('button', { name: 'Salvar Curso' }).click();

  const curso = page.getByRole('row').filter({ hasText: 'Curso E2E Novo' });
  await expect(curso).toContainText('Instituto E2E Novo');
  await expect(curso).toContainText('Inativo');
});

test('RF012: alteração de curso preserva histórico e permite inativação', async ({ page }) => {
  const curso = page.getByRole('row').filter({
    has: page.getByText('Curso E2E', { exact: true }),
  });
  await curso.getByRole('link', { name: 'Editar' }).click();

  await page.locator('input[name="denominacao"]').fill('Curso E2E Atualizado');
  await page.locator('select[name="unidadeId"]').selectOption('e2e-unit-2');
  await page.locator('select[name="situacao"]').selectOption('Inativo');
  await page.getByRole('button', { name: 'Salvar Alterações' }).click();

  const cursoAtualizado = page.getByRole('row').filter({ hasText: 'Curso E2E Atualizado' });
  await expect(cursoAtualizado).toContainText('Unidade E2E sem cursos');
  await expect(cursoAtualizado).toContainText('Inativo');
});

test('impede remover unidade que ainda possui cursos vinculados', async ({ page }) => {
  await expect(page.getByText('Instituto E2E', { exact: true }).first()).toBeVisible();
  await expect(
    page.getByRole('row').filter({
      has: page.getByText('Curso E2E', { exact: true }),
    })
  ).toContainText('Instituto E2E');

  const unidade = page
    .locator('div.grid > div')
    .filter({ has: page.getByText('Instituto E2E', { exact: true }) });
  page.once('dialog', (dialog) => dialog.accept());
  await unidade.getByRole('button', { name: 'Excluir' }).click();

  await expect(
    page.getByText('Não é possível excluir esta unidade pois existem cursos vinculados a ela.')
  ).toBeVisible();
  await expect(unidade).toBeVisible();
});
