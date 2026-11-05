import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { loginAs, prepararCicloAberto, prepararDadosR03, release03Credentials, release03CycleId } from './support/release03';

test.beforeEach(() => {
  prepararDadosR03();
  prepararCicloAberto();
});

test('coordenação filtra relatório e exporta somente as solicitações correspondentes', async ({ browser }) => {
  const dir = process.env.SGOA_DATA_DIR;
  if (!dir) throw new Error('Dados isolados obrigatórios.');
  fs.writeFileSync(path.join(dir, 'solicitacoes.json'), JSON.stringify([
    {
      id: 'r03-solicitacao-aceita',
      cicloId: release03CycleId,
      propostaId: 'r03-proposta',
      tutoradoId: 'r03-aluno',
      tutoresPreferidos: ['r03-tutor'],
      situacao: 'Aceita',
      dataSolicitacao: '2026-11-05T12:00:00.000Z',
      propostaSubmetida: {
        id: 'r03-proposta',
        tutoradoId: 'r03-aluno',
        titulo: 'Proposta R03',
        resumo: 'Resumo de relatório',
        tipo: 'TCC',
        palavrasChave: ['Software'],
      },
      decisao: {
        resultado: 'Aceitar',
        tutorId: 'r03-tutor',
        dataDecisao: '2026-11-05T13:00:00.000Z',
      },
    },
    {
      id: 'r03-solicitacao-cancelada',
      cicloId: release03CycleId,
      propostaId: 'r03-proposta-cancelar',
      tutoradoId: 'r03-aluno',
      tutoresPreferidos: ['r03-tutor'],
      situacao: 'Cancelada',
      dataSolicitacao: '2026-11-04T12:00:00.000Z',
      propostaSubmetida: {
        id: 'r03-proposta-cancelar',
        tutoradoId: 'r03-aluno',
        titulo: 'Proposta para cancelamento R03',
        resumo: 'Manter no histórico',
        tipo: 'TCC',
        palavrasChave: [],
      },
      cancelamento: {
        tutoradoId: 'r03-aluno',
        dataCancelamento: '2026-11-05T14:00:00.000Z',
      },
    },
  ]));

  const context = await browser.newContext();
  try {
    const coord = await context.newPage();
    await loginAs(coord, release03Credentials.coordinator.email, release03Credentials.coordinator.password);
    await coord.goto(`/relatorio-solicitacoes?ciclo=${release03CycleId}&situacao=Cancelada`);
    await expect(coord.getByRole('article')).toHaveCount(1);
    await expect(coord.getByRole('article')).toContainText('Proposta para cancelamento R03');
    const csvResponse = await context.request.get(`/relatorio-solicitacoes/csv?ciclo=${release03CycleId}&situacao=Cancelada`);
    expect(csvResponse.status()).toBe(200);
    const csv = await csvResponse.text();
    expect(csv).toContain('Cancelada');
    expect(csv).toContain('Proposta para cancelamento R03');
    expect(csv).not.toContain('Proposta R03');
    expect(csv).not.toContain('senha');
    expect(csv).not.toContain('@sgoa.test');

    const vazio = await context.request.get('/relatorio-solicitacoes/csv?ciclo=inexistente');
    expect(await vazio.text()).not.toContain('Proposta R03');

    const studentContext = await browser.newContext();
    try {
      const student = await studentContext.newPage();
      await loginAs(student, release03Credentials.student.email, release03Credentials.student.password);
      expect((await studentContext.request.get('/relatorio-solicitacoes/csv')).status()).toBe(403);
    } finally {
      await studentContext.close();
    }
  } finally {
    await context.close();
  }
});
