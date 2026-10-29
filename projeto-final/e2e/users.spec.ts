import { expect, test } from '@playwright/test';
import { credentials, loginAs, resetTestData } from './support/test-data';

test.beforeEach(() => {
  resetTestData();
});

test('RF002: coordenador cadastra usuário com perfil e situação escolhidos', async ({ page }) => {
  await loginAs(page, credentials.coordinator.email, credentials.coordinator.password);
  await page.goto('/usuarios');
  await page.getByRole('link', { name: '+ Novo Usuário' }).click();

  await page.locator('input[name="nome"]').fill('Novo Tutor E2E');
  await page.locator('input[name="email"]').fill('novo-tutor@sgoa.test');
  await page.locator('input[name="senha"]').fill('senha-e2e');
  await page.locator('select[name="perfil"]').selectOption('Tutor');
  await page.locator('select[name="situacao"]').selectOption('Inativa');
  await page.getByRole('button', { name: 'Salvar Usuário' }).click();

  await expect(page).toHaveURL(/\/usuarios$/);
  const usuario = page.getByRole('row').filter({ hasText: 'novo-tutor@sgoa.test' });
  await expect(usuario).toContainText('Novo Tutor E2E');
  await expect(usuario).toContainText('Tutor');
  await expect(usuario).toContainText('Inativa');
});

test('RF008: coordenador inativa conta sem remover seus registros associados', async ({ page }) => {
  await loginAs(page, credentials.coordinator.email, credentials.coordinator.password);
  await page.goto('/usuarios');
  const linha = page.getByRole('row').filter({
    has: page.getByText(credentials.tutorado.email, { exact: true }),
  });
  await linha.getByRole('link', { name: 'Editar' }).click();

  await expect(page).toHaveURL(/\/usuarios\/e2e-student$/);
  await page.locator('select[name="situacao"]').selectOption('Inativa');
  await expect(page.locator('select[name="situacao"]')).toHaveValue('Inativa');
  await page.getByRole('button', { name: 'Salvar Alterações' }).click();
  await expect(page).toHaveURL(/\/usuarios$/);
  await page.reload();

  const linhaAtualizada = page.getByRole('row').filter({
    has: page.getByText(credentials.tutorado.email, { exact: true }),
  });
  await expect(linhaAtualizada).toContainText('Inativa');

  await page.getByRole('link', { name: /Propostas TCC \/ IC/ }).click();
  await expect(page.getByText('Proposta E2E')).toBeVisible();
});

test('RF009: coordenador filtra usuários por perfil e situação', async ({ page }) => {
  await loginAs(page, credentials.coordinator.email, credentials.coordinator.password);
  await page.goto('/usuarios');
  await page.locator('select[name="perfil"]').selectOption('Tutorado');
  await page.locator('select[name="situacao"]').selectOption('Inativa');
  await page.getByRole('button', { name: 'Filtrar' }).click();

  await expect(page).toHaveURL(/perfil=Tutorado/);
  await expect(page).toHaveURL(/situacao=Inativa/);
  await expect(page.getByRole('row').filter({ hasText: credentials.inactive.email })).toBeVisible();
  await expect(
    page.getByRole('row').filter({
      has: page.getByText(credentials.tutorado.email, { exact: true }),
    })
  ).toHaveCount(0);
});

test('RF009: tutorado consulta somente a própria conta', async ({ page }) => {
  await loginAs(page, credentials.tutorado.email, credentials.tutorado.password);
  await page.getByRole('link', { name: /Usuários/ }).click();

  await expect(
    page.getByRole('cell', { name: credentials.tutorado.email, exact: true })
  ).toBeVisible();
  await expect(page.getByText(credentials.coordinator.email)).toHaveCount(0);
  await expect(page.locator('input[name="email"]')).toHaveCount(0);
});

test('RF007: tutorado não altera dados da conta fora dos campos do próprio perfil', async ({
  page,
}) => {
  await loginAs(page, credentials.tutorado.email, credentials.tutorado.password);
  await page.getByRole('link', { name: /Usuários/ }).click();
  await page.getByRole('link', { name: 'Editar' }).click();

  await expect(page.locator('input[name="email"]')).toBeDisabled();
  await expect(page.locator('input[name="nome"]')).toBeEnabled();
  await expect(page.locator('select[name="perfil"], select[name="situacao"]')).toHaveCount(0);
});

test('coordenador remove usuário após confirmar a exclusão', async ({ page }) => {
  await loginAs(page, credentials.coordinator.email, credentials.coordinator.password);
  await page.goto('/usuarios');
  const linha = page.getByRole('row').filter({ hasText: credentials.otherTutorado.email });
  page.once('dialog', (dialog) => dialog.accept());
  await linha.getByRole('button', { name: 'Excluir' }).click();

  await expect(linha).toHaveCount(0);
});
