import { test, expect } from '@playwright/test';
import { loginAs, prepararDadosR03, release03Credentials } from './support/release03';

test.beforeEach(() => {
  prepararDadosR03();
});

test('telas anteriores exibem textos sem códigos de requisitos', async ({ page }) => {
  await loginAs(page, release03Credentials.coordinator.email, release03Credentials.coordinator.password);
  for (const rota of ['/dashboard', '/usuarios', '/usuarios/novo', '/usuarios/r03-coord', '/cursos', '/cursos/novo', '/cursos/r03-curso', '/periodos', '/periodos/novo', '/periodos/r03-periodo', '/propostas', '/propostas/nova', '/propostas/r03-proposta', '/unidades/nova']) {
    await page.goto(rota);
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('body')).not.toContainText(/\b(?:RF|RNF)\d+/);
  }
});
