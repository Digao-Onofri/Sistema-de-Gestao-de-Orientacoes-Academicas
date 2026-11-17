import { expect, test } from '@playwright/test';
import {
  loginAs,
  prepararDadosR04,
  release04Credentials,
} from './support/release04';

test.beforeEach(() => {
  prepararDadosR04();
});

test('confirmação gera notificação para participantes e evento de auditoria', async ({ browser }) => {
  const coordenador = await browser.newPage();
  const tutor = await browser.newPage();

  try {
    await loginAs(coordenador, release04Credentials.coordinator.email, release04Credentials.coordinator.password);
    await coordenador.goto('/alocacoes');
    await coordenador.locator('select[name="tutorId"]').selectOption('r04-e2e-tutor');
    await coordenador.locator('select[name="tutoradoId"]').selectOption('e2e-student');
    await coordenador.locator('select[name="propostaId"]').selectOption('r04-e2e-proposta');
    await coordenador.locator('select[name="cicloId"]').selectOption('r04-e2e-ciclo');
    await coordenador.getByRole('button', { name: 'Confirmar alocação' }).click();
    await expect(coordenador.getByRole('row').filter({ hasText: 'Proposta R04 E2E' })).toContainText('Ativa');

    await loginAs(tutor, release04Credentials.tutor.email, release04Credentials.tutor.password);
    await tutor.goto('/notificacoes');
    await expect(tutor.getByText('Alocação confirmada.')).toBeVisible();

    await coordenador.goto('/auditoria');
    await expect(coordenador.getByRole('heading', { name: 'Trilha de auditoria' })).toBeVisible();
    await expect(coordenador.getByRole('row').filter({ hasText: 'CONFIRMACAO' })).toBeVisible();
  } finally {
    await Promise.all([coordenador.close(), tutor.close()]);
  }
});
