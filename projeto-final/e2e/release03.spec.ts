import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { pbkdf2Sync } from 'node:crypto';
import { loginAs } from './support/test-data';

test.beforeAll(() => {
  const dir = process.env.SGOA_DATA_DIR!;
  if (!dir || path.resolve(dir) === path.resolve('data')) throw new Error('Dados isolados obrigatórios.');
  function adicionar(arquivo: string, novos: unknown[]) {
    const destino = path.join(dir, arquivo);
    const atuais = fs.existsSync(destino) ? JSON.parse(fs.readFileSync(destino, 'utf8')) : [];
    fs.writeFileSync(destino, JSON.stringify([...atuais, ...novos]));
  }
  const senha = `r03:${pbkdf2Sync('teste123', 'r03', 10000, 64, 'sha512').toString('hex')}`;
  adicionar('usuarios.json', [
    { id: 'r03-coord', nome: 'Coord R03', email: 'r03-coord@sgoa.test', senha, perfil: 'Coordenador', situacao: 'Ativa' },
    { id: 'r03-aluno', nome: 'Aluno R03', email: 'r03-aluno@sgoa.test', senha, perfil: 'Tutorado', situacao: 'Ativa' },
    { id: 'r03-tutor', nome: 'Tutor R03', email: 'r03-tutor@sgoa.test', senha, perfil: 'Tutor', situacao: 'Ativa', tiposOrientacao: ['TCC'], areasInteresse: ['Software'], disponibilidade: 'Tardes' },
  ]);
  adicionar('cursos.json', [{ id: 'r03-curso', denominacao: 'Curso R03', unidadeId: 'e2e-unit-1', situacao: 'Ativo' }]);
  adicionar('periodos.json', [{ id: 'r03-periodo', identificacao: '2026 R03' }]);
  adicionar('propostas.json', [
    { id: 'r03-proposta', tutoradoId: 'r03-aluno', titulo: 'Proposta R03', resumo: 'Resumo preservado da Release 03', tipo: 'TCC', palavrasChave: ['Software'] },
    { id: 'r03-proposta-editar', tutoradoId: 'r03-aluno', titulo: 'Proposta R03 editada', resumo: 'Resumo atualizado', tipo: 'TCC', palavrasChave: ['Software'] },
    { id: 'r03-proposta-cancelar', tutoradoId: 'r03-aluno', titulo: 'Proposta para cancelamento R03', resumo: 'Manter no histórico', tipo: 'TCC', palavrasChave: [] },
  ]);
});

test('ciclo, solicitação, decisão e CSV pelos três perfis', async ({ browser }) => {
  test.setTimeout(300000);
  const coordContext = await browser.newContext();
  const alunoContext = await browser.newContext();
  const tutorContext = await browser.newContext();
  const coord = await coordContext.newPage(), aluno = await alunoContext.newPage(), tutor = await tutorContext.newPage();
  await loginAs(coord, 'r03-coord@sgoa.test', 'teste123');
  await coord.getByRole('link', { name: /Ciclos de orientação/ }).click();
  await coord.getByRole('link', { name: 'Novo ciclo', exact: true }).click();
  await coord.getByRole('combobox', { name: 'Curso *', exact: true }).selectOption('r03-curso');
  await coord.getByRole('combobox', { name: 'Período letivo *', exact: true }).selectOption('r03-periodo');
  await coord.getByLabel('Data de início *').fill('2026-01-01');
  await coord.getByLabel('Data de encerramento *').fill('2099-12-31');
  await coord.getByLabel('Critérios de elegibilidade *').fill('Matrícula ativa');
  await coord.getByLabel('Regras para solicitação *').fill('Selecione tutores da modalidade.');
  await coord.getByRole('button', { name: 'Salvar rascunho' }).click();
  await coord.waitForURL('**/ciclos');
  let cartao = coord.getByRole('article').filter({ hasText: 'Curso R03' });
  await cartao.getByRole('link', { name: 'Editar rascunho' }).click();
  await coord.getByLabel('Critérios de elegibilidade *').fill('Matrícula ativa no curso');
  await coord.getByRole('button', { name: 'Salvar rascunho' }).click();
  await coord.waitForURL('**/ciclos');
  await expect(cartao).toContainText('Matrícula ativa no curso');
  await cartao.getByRole('combobox', { name: 'Próxima situação', exact: true }).selectOption('Publicado');
  await cartao.getByRole('button', { name: 'Alterar situação' }).click();
  await expect(cartao.getByRole('combobox', { name: 'Próxima situação', exact: true }).getByRole('option', { name: 'Aberto', exact: true })).toBeAttached();
  await cartao.getByRole('combobox', { name: 'Próxima situação', exact: true }).selectOption('Aberto');
  await cartao.getByRole('button', { name: 'Alterar situação' }).click();
  await expect(cartao.getByRole('combobox', { name: 'Próxima situação', exact: true }).getByRole('option', { name: 'Encerrado', exact: true })).toBeAttached();
  await loginAs(aluno, 'r03-aluno@sgoa.test', 'teste123');
  await aluno.goto('/solicitacoes/nova');
  const cicloId = await aluno.getByRole('combobox', { name: 'Ciclo aberto *', exact: true }).getByRole('option', { name: /Curso R03/ }).getAttribute('value');
  await aluno.getByRole('combobox', { name: 'Ciclo aberto *', exact: true }).selectOption(cicloId!);
  await aluno.getByRole('combobox', { name: 'Proposta de sua autoria *', exact: true }).selectOption('r03-proposta');
  await aluno.getByRole('checkbox', { name: /Tutor R03/ }).check();
  await aluno.getByRole('checkbox', { name: /Li as regras/ }).check();
  await aluno.getByRole('button', { name: 'Enviar solicitação' }).click();
  await aluno.waitForURL('**/solicitacoes');
  await expect(aluno.getByRole('article')).toContainText('Pendente');
  const editarUrl = await aluno.getByRole('link', { name: 'Editar solicitação' }).getAttribute('href');
  await aluno.getByRole('link', { name: 'Editar solicitação' }).click();
  await expect(aluno.getByRole('combobox', { name: 'Ciclo aberto *', exact: true })).toBeDisabled();
  await aluno.getByRole('combobox', { name: 'Proposta de sua autoria *', exact: true }).selectOption('r03-proposta-editar');
  await aluno.getByRole('button', { name: 'Salvar alterações' }).click();
  await aluno.waitForURL('**/solicitacoes');
  await expect(aluno.getByRole('article')).toContainText('Proposta R03 editada');
  const negado = await alunoContext.request.get('/relatorio-solicitacoes/csv'); expect(negado.status()).toBe(403);
  await loginAs(tutor, 'r03-tutor@sgoa.test', 'teste123');
  await tutor.goto('/solicitacoes');
  await expect(tutor.getByRole('article')).toContainText('Proposta R03');
  await tutor.getByRole('combobox', { name: 'Decisão *', exact: true }).selectOption('Aceitar');
  await tutor.getByRole('button', { name: 'Registrar decisão' }).click();
  await expect(tutor.getByRole('article')).toContainText('Aceita');
  await aluno.reload(); await expect(aluno.getByRole('article')).toContainText('Aceita');
  await expect(aluno.getByRole('article')).toContainText('não confirma uma alocação definitiva');
  await expect(aluno.getByRole('link', { name: 'Editar solicitação' })).toHaveCount(0);
  await expect(aluno.getByRole('button', { name: 'Cancelar solicitação' })).toHaveCount(0);
  await aluno.goto(editarUrl!);
  await expect(aluno.getByText('Esta solicitação não pode ser editada.', { exact: false })).toBeVisible();
  await coord.goto('/relatorio-solicitacoes?ciclo=' + cicloId);
  await expect(coord.getByRole('article')).toContainText('Tutor R03');
  await coord.screenshot({ path: test.info().outputPath('release03-relatorio.png'), fullPage: true });
  const csv = await coordContext.request.get('/relatorio-solicitacoes/csv?ciclo=' + cicloId);
  expect(csv.status()).toBe(200); expect(await csv.text()).toContain('Proposta R03'); expect(await csv.text()).toContain('Aceita');
  expect(await csv.text()).not.toContain('senha'); expect(await csv.text()).not.toContain('@sgoa.test');
  const vazio = await coordContext.request.get('/relatorio-solicitacoes/csv?ciclo=inexistente'); expect(await vazio.text()).not.toContain('Proposta R03');
  await aluno.goto('/solicitacoes/nova?ciclo=' + cicloId);
  await aluno.getByRole('combobox', { name: 'Proposta de sua autoria *', exact: true }).selectOption('r03-proposta-cancelar');
  await aluno.getByRole('checkbox', { name: /Tutor R03/ }).check();
  await aluno.getByRole('checkbox', { name: /Li as regras/ }).check();
  await aluno.getByRole('button', { name: 'Enviar solicitação' }).click();
  await aluno.waitForURL('**/solicitacoes');
  const pendente = aluno.getByRole('article').filter({ hasText: 'Proposta para cancelamento R03' });
  aluno.once('dialog', dialog => dialog.dismiss());
  await pendente.getByRole('button', { name: 'Cancelar solicitação' }).click();
  await expect(pendente).toContainText('Pendente');
  aluno.once('dialog', dialog => dialog.accept());
  await pendente.getByRole('button', { name: 'Cancelar solicitação' }).click();
  await expect(pendente).toContainText('Cancelada');
  await expect(pendente.getByRole('button', { name: 'Cancelar solicitação' })).toHaveCount(0);
  await tutor.reload();
  await expect(tutor.getByRole('article').filter({ hasText: 'Proposta para cancelamento R03' })).toContainText('Cancelada');
  await expect(tutor.getByRole('button', { name: 'Registrar decisão' })).toHaveCount(0);
  await coord.goto('/relatorio-solicitacoes?ciclo=' + cicloId + '&situacao=Cancelada');
  await expect(coord.getByRole('article')).toHaveCount(1);
  await expect(coord.getByRole('article')).toContainText('Proposta para cancelamento R03');
  const canceladas = await coordContext.request.get('/relatorio-solicitacoes/csv?ciclo=' + cicloId + '&situacao=Cancelada');
  expect(await canceladas.text()).toContain('Cancelada'); expect(await canceladas.text()).not.toContain('Proposta R03 editada');
  await coord.goto('/ciclos'); cartao = coord.getByRole('article').filter({ hasText: 'Curso R03' });
  await cartao.getByRole('combobox', { name: 'Próxima situação', exact: true }).selectOption('Cancelado');
  coord.once('dialog', dialog => dialog.dismiss());
  await cartao.getByRole('button', { name: 'Alterar situação' }).click();
  await expect(cartao.getByRole('combobox', { name: 'Próxima situação', exact: true })).toBeVisible();
  coord.once('dialog', dialog => dialog.accept());
  await cartao.getByRole('button', { name: 'Alterar situação' }).click();
  await expect(cartao).toContainText('Ciclo cancelado. Os registros e o histórico foram preservados.');
  await coord.goto('/relatorio-solicitacoes?ciclo=' + cicloId); await expect(coord.getByRole('article')).toHaveCount(2);
  await expect(coord.locator('body')).not.toContainText(/\bRF\d+/);
  await coordContext.close(); await alunoContext.close(); await tutorContext.close();
});

test('telas anteriores exibem textos sem códigos de requisitos', async ({ page }) => {
  test.setTimeout(300000);
  await loginAs(page, 'r03-coord@sgoa.test', 'teste123');
  for (const rota of ['/dashboard', '/usuarios', '/usuarios/novo', '/usuarios/r03-coord', '/cursos', '/cursos/novo', '/cursos/r03-curso', '/periodos', '/periodos/novo', '/periodos/r03-periodo', '/propostas', '/propostas/nova', '/propostas/r03-proposta', '/unidades/nova']) {
    await page.goto(rota);
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('body')).not.toContainText(/\b(?:RF|RNF)\d+/);
  }
});
