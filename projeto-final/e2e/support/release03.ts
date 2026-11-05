import { pbkdf2Sync } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { expect, type Page } from '@playwright/test';
import { loginAs, resetTestData } from './test-data';

export const release03Credentials = {
  coordinator: { email: 'r03-coord@sgoa.test', password: 'teste123' },
  student: { email: 'r03-aluno@sgoa.test', password: 'teste123' },
  tutor: { email: 'r03-tutor@sgoa.test', password: 'teste123' },
};

export const release03CycleId = 'r03-ciclo-aberto';

export function prepararDadosR03() {
  const dir = process.env.SGOA_DATA_DIR;
  if (!dir || path.resolve(dir) === path.resolve('data')) throw new Error('Dados isolados obrigatórios.');
  resetTestData();
  fs.writeFileSync(path.join(dir, 'solicitacoes.json'), '[]');

  const senha = `r03:${pbkdf2Sync('teste123', 'r03', 10000, 64, 'sha512').toString('hex')}`;
  const registros: Record<string, Array<{ id: string; [key: string]: unknown }>> = {
    'usuarios.json': [
      { id: 'r03-coord', nome: 'Coord R03', email: release03Credentials.coordinator.email, senha, perfil: 'Coordenador', situacao: 'Ativa' },
      { id: 'r03-aluno', nome: 'Aluno R03', email: release03Credentials.student.email, senha, perfil: 'Tutorado', situacao: 'Ativa' },
      { id: 'r03-tutor', nome: 'Tutor R03', email: release03Credentials.tutor.email, senha, perfil: 'Tutor', situacao: 'Ativa', tiposOrientacao: ['TCC'], areasInteresse: ['Software'], disponibilidade: 'Tardes' },
    ],
    'cursos.json': [{ id: 'r03-curso', denominacao: 'Curso R03', unidadeId: 'e2e-unit-1', situacao: 'Ativo' }],
    'periodos.json': [{ id: 'r03-periodo', identificacao: '2026 R03' }],
    'propostas.json': [
      { id: 'r03-proposta', tutoradoId: 'r03-aluno', titulo: 'Proposta R03', resumo: 'Resumo preservado da Release 03', tipo: 'TCC', palavrasChave: ['Software'] },
      { id: 'r03-proposta-editar', tutoradoId: 'r03-aluno', titulo: 'Proposta R03 editada', resumo: 'Resumo atualizado', tipo: 'TCC', palavrasChave: ['Software'] },
      { id: 'r03-proposta-cancelar', tutoradoId: 'r03-aluno', titulo: 'Proposta para cancelamento R03', resumo: 'Manter no histórico', tipo: 'TCC', palavrasChave: [] },
    ],
  };

  for (const [arquivo, novos] of Object.entries(registros)) {
    const destino = path.join(dir, arquivo);
    const atuais = JSON.parse(fs.readFileSync(destino, 'utf8')) as Array<{ id: string }>;
    const porId = new Map(atuais.map(registro => [registro.id, registro]));
    novos.forEach(registro => porId.set(registro.id, registro));
    fs.writeFileSync(destino, JSON.stringify([...porId.values()]));
  }
}

export function prepararCicloAberto() {
  const dir = process.env.SGOA_DATA_DIR;
  if (!dir || path.resolve(dir) === path.resolve('data')) throw new Error('Dados isolados obrigatórios.');
  fs.writeFileSync(path.join(dir, 'ciclos.json'), JSON.stringify([{
    id: release03CycleId,
    cursoId: 'r03-curso',
    periodoId: 'r03-periodo',
    modalidade: 'TCC',
    prazoInicio: '2026-01-01',
    prazoFim: '2099-12-31',
    elegibilidade: 'Matrícula ativa',
    regras: 'Selecione tutores da modalidade.',
    situacao: 'Aberto',
  }]));
}

export async function criarCicloPelaInterface(page: Page) {
  await loginAs(page, release03Credentials.coordinator.email, release03Credentials.coordinator.password);
  await page.getByRole('link', { name: /Ciclos de orientação/ }).click();
  await page.getByRole('link', { name: 'Novo ciclo', exact: true }).click();
  await page.getByRole('combobox', { name: 'Curso *', exact: true }).selectOption('r03-curso');
  await page.getByRole('combobox', { name: 'Período letivo *', exact: true }).selectOption('r03-periodo');
  await page.getByLabel('Data de início *').fill('2026-01-01');
  await page.getByLabel('Data de encerramento *', { exact: true }).fill('2099-12-31');
  await page.getByLabel('Critérios de elegibilidade *').fill('Matrícula ativa');
  await page.getByLabel('Regras para solicitação *').fill('Selecione tutores da modalidade.');
  await page.getByRole('button', { name: 'Salvar rascunho' }).click();
  await page.waitForURL('**/ciclos');
  return page.getByRole('article').filter({ hasText: 'Curso R03' });
}

export async function criarSolicitacao(page: Page, propostaId: string) {
  await page.goto('/solicitacoes/nova');
  const ciclo = page.getByRole('combobox', { name: 'Ciclo aberto *', exact: true });
  const cicloId = await ciclo.getByRole('option', { name: /Curso R03/ }).getAttribute('value');
  if (!cicloId) throw new Error('O ciclo aberto do teste não foi encontrado.');
  await ciclo.selectOption(cicloId);
  await page.getByRole('combobox', { name: 'Proposta de sua autoria *', exact: true }).selectOption(propostaId);
  await page.getByRole('checkbox', { name: /Tutor R03/ }).check();
  await page.getByRole('checkbox', { name: /Li as regras/ }).check();
  await page.getByRole('button', { name: 'Enviar solicitação' }).click();
  await expect(page).toHaveURL(/\/solicitacoes$/);
  return cicloId;
}

export { loginAs };
