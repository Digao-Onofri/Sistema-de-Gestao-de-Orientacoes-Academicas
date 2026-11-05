import { test, expect } from '@playwright/test';
import { criarSolicitacao, loginAs, prepararCicloAberto, prepararDadosR03, release03Credentials } from './support/release03';

test.beforeEach(() => {
  prepararDadosR03();
  prepararCicloAberto();
});

test('tutorado edita solicitação pendente e tutor registra decisão', async ({ browser }) => {
  test.setTimeout(180000);
  const alunoContext = await browser.newContext();
  const tutorContext = await browser.newContext();
  try {
    const aluno = await alunoContext.newPage();
    await loginAs(aluno, release03Credentials.student.email, release03Credentials.student.password);
    await criarSolicitacao(aluno, 'r03-proposta');
    await expect(aluno.getByRole('article')).toContainText('Pendente');
    const editarUrl = await aluno.getByRole('link', { name: 'Editar solicitação' }).getAttribute('href');
    await aluno.getByRole('link', { name: 'Editar solicitação' }).click();
    await expect(aluno.getByRole('combobox', { name: 'Ciclo aberto *', exact: true })).toBeDisabled();
    await aluno.getByRole('combobox', { name: 'Proposta de sua autoria *', exact: true }).selectOption('r03-proposta-editar');
    await aluno.getByRole('button', { name: 'Salvar alterações' }).click();
    await aluno.waitForURL('**/solicitacoes');
    await expect(aluno.getByRole('article')).toContainText('Proposta R03 editada');

    const tutor = await tutorContext.newPage();
    await loginAs(tutor, release03Credentials.tutor.email, release03Credentials.tutor.password);
    await tutor.goto('/solicitacoes');
    await expect(tutor.getByRole('article')).toContainText('Proposta R03');
    await tutor.getByRole('combobox', { name: 'Decisão *', exact: true }).selectOption('Aceitar');
    await tutor.getByRole('button', { name: 'Registrar decisão' }).click();
    await expect(tutor.getByRole('article')).toContainText('Aceita');
    await aluno.reload();
    await expect(aluno.getByRole('article')).toContainText('Aceita');
    await expect(aluno.getByRole('article')).toContainText('não confirma uma alocação definitiva');
    await expect(aluno.getByRole('link', { name: 'Editar solicitação' })).toHaveCount(0);
    await expect(aluno.getByRole('button', { name: 'Cancelar solicitação' })).toHaveCount(0);
    await aluno.goto(editarUrl!);
    await expect(aluno.getByText('Esta solicitação não pode ser editada.', { exact: false })).toBeVisible();
  } finally {
    await Promise.all([alunoContext.close(), tutorContext.close()]);
  }
});

test('tutorado cancela solicitação e ela permanece no histórico sem opção de decisão', async ({ browser }) => {
  test.setTimeout(180000);
  const alunoContext = await browser.newContext();
  const tutorContext = await browser.newContext();
  try {
    const aluno = await alunoContext.newPage();
    await loginAs(aluno, release03Credentials.student.email, release03Credentials.student.password);
    await criarSolicitacao(aluno, 'r03-proposta-cancelar');
    const pendente = aluno.getByRole('article').filter({ hasText: 'Proposta para cancelamento R03' });

    aluno.once('dialog', dialog => dialog.dismiss());
    await pendente.getByRole('button', { name: 'Cancelar solicitação' }).click();
    await expect(pendente).toContainText('Pendente');
    aluno.once('dialog', dialog => dialog.accept());
    await pendente.getByRole('button', { name: 'Cancelar solicitação' }).click();
    await expect(pendente).toContainText('Cancelada');
    await expect(pendente.getByRole('button', { name: 'Cancelar solicitação' })).toHaveCount(0);

    const tutor = await tutorContext.newPage();
    await loginAs(tutor, release03Credentials.tutor.email, release03Credentials.tutor.password);
    await tutor.goto('/solicitacoes');
    const cancelada = tutor.getByRole('article').filter({ hasText: 'Proposta para cancelamento R03' });
    await expect(cancelada).toContainText('Cancelada');
    await expect(cancelada.getByRole('button', { name: 'Registrar decisão' })).toHaveCount(0);
  } finally {
    await Promise.all([alunoContext.close(), tutorContext.close()]);
  }
});
