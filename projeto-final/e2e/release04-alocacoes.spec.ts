import { expect, test } from '@playwright/test';
import {
  loginAs,
  prepararDadosR04,
  release04Credentials,
} from './support/release04';

test.beforeEach(() => {
  prepararDadosR04();
});

test('coordenação confirma e encerra alocação após confirmação explícita', async ({ page }) => {
  await loginAs(page, release04Credentials.coordinator.email, release04Credentials.coordinator.password);
  await page.goto('/alocacoes');

  await page.locator('select[name="tutorId"]').selectOption('r04-e2e-tutor');
  await page.locator('select[name="tutoradoId"]').selectOption('e2e-student');
  await page.locator('select[name="propostaId"]').selectOption('r04-e2e-proposta');
  await page.locator('select[name="cicloId"]').selectOption('r04-e2e-ciclo');
  await page.getByRole('button', { name: 'Confirmar alocação' }).click();

  const linha = page.getByRole('row').filter({ hasText: 'Proposta R04 E2E' });
  await expect(linha).toContainText('Ativa');
  await linha.getByPlaceholder('Motivo').first().fill('Acompanhamento concluído');
  page.once('dialog', (dialog) => dialog.accept());
  await linha.getByRole('button', { name: 'Encerrar' }).click();

  await expect(linha).toContainText('Encerrada');
  await expect(linha).toContainText('Acompanhamento concluído');
});

test('coordenação cancela alocação ativa e persiste o motivo', async ({ page }) => {
  await loginAs(page, release04Credentials.coordinator.email, release04Credentials.coordinator.password);
  await page.goto('/alocacoes');
  await page.locator('select[name="tutorId"]').selectOption('r04-e2e-tutor');
  await page.locator('select[name="tutoradoId"]').selectOption('e2e-student');
  await page.locator('select[name="propostaId"]').selectOption('r04-e2e-proposta');
  await page.locator('select[name="cicloId"]').selectOption('r04-e2e-ciclo');
  await page.getByRole('button', { name: 'Confirmar alocação' }).click();

  const linha = page.getByRole('row').filter({ hasText: 'Proposta R04 E2E' });
  await linha.getByPlaceholder('Motivo').nth(1).fill('Cancelamento de teste');
  page.once('dialog', (dialog) => dialog.accept());
  await linha.getByRole('button', { name: 'Cancelar' }).click();

  await expect(linha).toContainText('Cancelada');
  await expect(linha).toContainText('Cancelamento de teste');
});

test('tutor vê apenas suas alocações e não recebe controles de coordenação', async ({ page }) => {
  prepararDadosR04();
  await loginAs(page, release04Credentials.coordinator.email, release04Credentials.coordinator.password);
  await page.goto('/alocacoes');
  await page.locator('select[name="tutorId"]').selectOption('r04-e2e-tutor');
  await page.locator('select[name="tutoradoId"]').selectOption('e2e-student');
  await page.locator('select[name="propostaId"]').selectOption('r04-e2e-proposta');
  await page.locator('select[name="cicloId"]').selectOption('r04-e2e-ciclo');
  await page.getByRole('button', { name: 'Confirmar alocação' }).click();
  await page.context().clearCookies();

  await loginAs(page, release04Credentials.tutor.email, release04Credentials.tutor.password);
  await page.goto('/alocacoes');
  await expect(page.getByRole('row').filter({ hasText: 'Proposta R04 E2E' })).toContainText('Ativa');
  await expect(page.getByRole('heading', { name: 'Confirmar alocação' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Encerrar', exact: true })).toHaveCount(0);
});
