import { expect, test } from '@playwright/test';
import { credentials, loginAs, resetTestData } from './support/test-data';

test.beforeEach(() => {
  resetTestData();
});

test('RF001: autentica conta ativa e RF006: encerra a própria sessão', async ({ page }) => {
  await loginAs(page, credentials.coordinator.email, credentials.coordinator.password);

  await expect(page.getByText(credentials.coordinator.email)).toBeVisible();
  await page.getByRole('button', { name: /Encerrar Sessão/ }).click();

  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('button', { name: 'Entrar' })).toBeVisible();
});

test('RF001: apresenta mensagem genérica para credenciais inválidas e conta inativa', async ({
  page,
}) => {
  await page.goto('/login');
  await page.getByLabel(/E-mail ou Identificador Institucional/).fill('inexistente@sgoa.test');
  await page.getByLabel('Senha').fill('senha-incorreta');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page.getByText('Credenciais inválidas ou conta inativa.', { exact: true })).toBeVisible();

  await page.getByLabel(/E-mail ou Identificador Institucional/).fill(credentials.inactive.email);
  await page.getByLabel('Senha').fill(credentials.inactive.password);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page.getByText('Credenciais inválidas ou conta inativa.', { exact: true })).toBeVisible();

  await expect(page).toHaveURL(/\/login$/);
});

test('RF001: rejeita senha incorreta sem iniciar sessão', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel(/E-mail ou Identificador Institucional/).fill(credentials.coordinator.email);
  await page.getByLabel('Senha').fill('senha-incorreta');
  await page.getByRole('button', { name: 'Entrar' }).click();

  await expect(page.getByText('Credenciais inválidas ou conta inativa.', { exact: true })).toBeVisible();
  await expect(page).toHaveURL(/\/login$/);
});
