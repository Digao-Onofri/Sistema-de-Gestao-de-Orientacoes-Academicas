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

test('tutor registra etapa e reunião e o tutorado vinculado consegue consultá-las', async ({ browser, page }) => {
  await loginAs(page, release04Credentials.tutor.email, release04Credentials.tutor.password);

  await page.goto('/etapas');
  await page.getByLabel('Alocação').selectOption('r04-e2e-alocacao');
  await page.getByLabel('Responsável').fill('Tutor R04 E2E');
  await page.getByLabel('Prazo').fill('2026-11-20');
  await page.getByLabel('Situação').selectOption('EmAndamento');
  await page.getByLabel('Descrição').fill('Revisar capítulo um');
  await page.getByRole('button', { name: 'Incluir etapa' }).click();
  await expect(page.getByRole('row').filter({ hasText: 'Revisar capítulo um' })).toContainText('EmAndamento');

  await page.goto('/reunioes');
  await page.getByLabel('Alocação').selectOption('r04-e2e-alocacao');
  await page.getByLabel('Data da reunião').fill('2026-11-10');
  await page.getByLabel('Próximo contato').fill('2026-11-09');
  await page.getByLabel('Resumo').fill('Discussão sobre o cronograma');
  await page.getByLabel('Encaminhamentos').fill('Enviar versão revisada');
  await page.getByRole('button', { name: 'Registrar reunião' }).click();
  await expect(page.getByRole('row').filter({ hasText: 'Discussão sobre o cronograma' })).toContainText('Enviar versão revisada');

  await page.context().clearCookies();
  await loginAs(page, release04Credentials.tutorado.email, release04Credentials.tutorado.password);
  await page.goto('/etapas');
  await expect(page.getByRole('row').filter({ hasText: 'Revisar capítulo um' })).toBeVisible();
  await page.goto('/reunioes');
  await expect(page.getByRole('row').filter({ hasText: 'Discussão sobre o cronograma' })).toBeVisible();

  const outroTutorado = await browser.newPage();
  try {
    await loginAs(outroTutorado, release04Credentials.otherTutorado.email, release04Credentials.otherTutorado.password);
    await outroTutorado.goto('/etapas?alocacao=r04-e2e-alocacao');
    await expect(outroTutorado.getByText('Nenhuma etapa encontrada.')).toBeVisible();
    await outroTutorado.goto('/reunioes?alocacao=r04-e2e-alocacao');
    await expect(outroTutorado.getByText('Nenhum registro encontrado.')).toBeVisible();
  } finally {
    await outroTutorado.close();
  }
});
