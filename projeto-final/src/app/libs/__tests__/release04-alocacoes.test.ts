// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AlocacaoOrientacao, Usuario } from '../../types';
import type { AlocacaoR04 } from '../release04-model';
import { lerR03, gravarR03 } from '../release03-store';
import {
  alocacaoAtivaR04,
  autenticarR04,
  configurarDadosR04,
  formR04,
  usuariosR04,
} from './release04-fixtures';

const { sessao, auditoria, notificacao } = vi.hoisted(() => ({
  sessao: vi.fn(),
  auditoria: vi.fn(),
  notificacao: vi.fn(),
}));

vi.mock('../session', () => ({ getSession: sessao }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('../auditoria', () => ({ registrarAuditoriaEstrita: auditoria }));
vi.mock('../notificacoes', () => ({ criarNotificacaoEstrita: notificacao }));

import {
  cancelarAlocacaoAction,
  confirmarAlocacaoAction,
  encerrarAlocacaoAction,
} from '../release04-actions';

describe('Release 04: ações de alocação', () => {
  configurarDadosR04(sessao);

  beforeEach(() => {
    auditoria.mockResolvedValue(undefined);
    notificacao.mockResolvedValue(undefined);
  });

  it('confirma uma alocação e notifica os participantes sem exigir solicitação aceita', async () => {
    autenticarR04(sessao, 'r04-coord');
    gravarR03('alocacoes.json', []);

    expect(await confirmarAlocacaoAction(null, formR04({
      tutorId: 'r04-tutor',
      tutoradoId: 'r04-tutorado',
      propostaId: 'r04-proposta',
      cicloId: 'r04-ciclo-aberto',
    }))).toEqual({ sucesso: true });

    const [alocacao] = lerR03<AlocacaoR04>('alocacoes.json');
    expect(alocacao).toMatchObject({
      tutorId: 'r04-tutor',
      tutoradoId: 'r04-tutorado',
      propostaId: 'r04-proposta',
      cicloId: 'r04-ciclo-aberto',
      situacao: 'Ativa',
      coordenadorId: 'r04-coord',
    });
    expect(alocacao.dataConfirmacao).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(auditoria).toHaveBeenCalledWith(
      'r04-coord',
      'coord-r04@sgoa.test',
      'AlocacaoOrientacao',
      'CONFIRMACAO',
      expect.any(String),
    );
    expect(notificacao).toHaveBeenNthCalledWith(1, 'r04-tutor', 'AlocacaoConfirmada', expect.any(String), alocacao.id);
    expect(notificacao).toHaveBeenNthCalledWith(2, 'r04-tutorado', 'AlocacaoConfirmada', expect.any(String), alocacao.id);
  });

  it('aceita referência opcional vazia e ciclo encerrado, mas não ciclo rascunho', async () => {
    autenticarR04(sessao, 'r04-coord');
    gravarR03('alocacoes.json', []);

    expect(await confirmarAlocacaoAction(null, formR04({
      tutorId: 'r04-tutor',
      tutoradoId: 'r04-tutorado',
      propostaId: 'r04-proposta',
      cicloId: 'r04-ciclo-encerrado',
      solicitacaoId: '',
    }))).toEqual({ sucesso: true });
    expect(lerR03<AlocacaoR04>('alocacoes.json')[0].solicitacaoId).toBeUndefined();

    gravarR03('alocacoes.json', []);
    expect(await confirmarAlocacaoAction(null, formR04({
      tutorId: 'r04-tutor',
      tutoradoId: 'r04-tutorado',
      propostaId: 'r04-proposta',
      cicloId: 'r04-ciclo-rascunho',
    }))).toEqual({ erro: 'Não é possível confirmar alocação neste ciclo.' });
    expect(lerR03('alocacoes.json')).toEqual([]);
  });

  it.each([
    ['tutor inativo', 'r04-tutor-inativo', 'r04-tutorado', 'r04-proposta', 'r04-ciclo-aberto', 'Tutor inválido ou inativo.'],
    ['tutorado inativo', 'r04-tutor', 'r04-tutorado-inativo', 'r04-proposta', 'r04-ciclo-aberto', 'Tutorado inválido ou inativo.'],
    ['tutor sem limite', 'r04-tutor-sem-limite', 'r04-tutorado', 'r04-proposta', 'r04-ciclo-aberto', 'Tutor sem limite de orientandos configurado.'],
    ['proposta de outro tutorado', 'r04-tutor', 'r04-tutorado', 'r04-proposta-2', 'r04-ciclo-aberto', 'Proposta inválida para este tutorado.'],
    ['modalidade divergente', 'r04-tutor', 'r04-tutorado', 'r04-proposta-ic', 'r04-ciclo-aberto', 'A modalidade da proposta não corresponde à do ciclo.'],
  ])('rejeita confirmação com %s sem persistir', async (_caso, tutorId, tutoradoId, propostaId, cicloId, erro) => {
    autenticarR04(sessao, 'r04-coord');
    gravarR03('alocacoes.json', []);

    expect(await confirmarAlocacaoAction(null, formR04({
      tutorId,
      tutoradoId,
      propostaId,
      cicloId,
    }))).toEqual({ erro });
    expect(lerR03('alocacoes.json')).toEqual([]);
  });

  it('rejeita proposta já alocada e capacidade global excedida', async () => {
    autenticarR04(sessao, 'r04-coord');
    expect(await confirmarAlocacaoAction(null, formR04({
      tutorId: 'r04-tutor',
      tutoradoId: 'r04-tutorado',
      propostaId: 'r04-proposta',
      cicloId: 'r04-ciclo-aberto',
    }))).toEqual({ erro: 'Já existe alocação ativa para esta proposta.' });

    const demais: AlocacaoOrientacao[] = [
      ...['r04-proposta-2', 'r04-proposta-ic'].map((propostaId, index) => ({
        ...alocacaoAtivaR04,
        id: `r04-outra-${index}`,
        propostaId,
        cicloId: 'r04-ciclo-encerrado',
        situacao: 'Ativa' as const,
      })),
    ];
    gravarR03('usuarios.json', usuariosR04.map((usuario) => (
      usuario.id === 'r04-tutor' ? { ...usuario, limiteOrientandos: 2 } : usuario
    )));
    gravarR03('alocacoes.json', demais);
    expect(await confirmarAlocacaoAction(null, formR04({
      tutorId: 'r04-tutor',
      tutoradoId: 'r04-tutorado',
      propostaId: 'r04-proposta',
      cicloId: 'r04-ciclo-aberto',
    }))).toEqual({ erro: 'Tutor atingiu o limite de orientandos ativos.' });
    expect(lerR03('alocacoes.json')).toHaveLength(2);
  });

  it('permite nova alocação quando o registro anterior não está ativo', async () => {
    autenticarR04(sessao, 'r04-coord');
    gravarR03('alocacoes.json', [{ ...alocacaoAtivaR04, situacao: 'Encerrada' }]);

    expect(await confirmarAlocacaoAction(null, formR04({
      tutorId: 'r04-tutor',
      tutoradoId: 'r04-tutorado',
      propostaId: 'r04-proposta',
      cicloId: 'r04-ciclo-aberto',
    }))).toEqual({ sucesso: true });
    expect(lerR03<AlocacaoR04>('alocacoes.json').map(({ situacao }) => situacao)).toEqual(['Encerrada', 'Ativa']);
  });

  it('recusa operações de alocação para perfis que não sejam coordenação ativa', async () => {
    for (const id of ['r04-tutor', 'r04-tutorado']) {
      autenticarR04(sessao, id);
      expect(await confirmarAlocacaoAction(null, formR04({
        tutorId: 'r04-tutor',
        tutoradoId: 'r04-tutorado',
        propostaId: 'r04-proposta',
        cicloId: 'r04-ciclo-aberto',
      }))).toMatchObject({ erro: 'Apenas coordenadores ativos podem confirmar alocações.' });
    }

    const coordenadorInativo: Usuario = { ...usuariosR04[0], situacao: 'Inativa' };
    gravarR03('usuarios.json', [...usuariosR04.filter(({ id }) => id !== coordenadorInativo.id), coordenadorInativo]);
    autenticarR04(sessao, 'r04-coord');
    expect(await confirmarAlocacaoAction(null, formR04({
      tutorId: 'r04-tutor',
      tutoradoId: 'r04-tutorado',
      propostaId: 'r04-proposta',
      cicloId: 'r04-ciclo-aberto',
    }))).toMatchObject({ erro: 'Apenas coordenadores ativos podem confirmar alocações.' });
  });

  it.each([
    ['encerrar', encerrarAlocacaoAction, 'ENCERRAMENTO', 'dataEncerramento'],
    ['cancelar', cancelarAlocacaoAction, 'CANCELAMENTO', 'dataCancelamento'],
  ] as const)('registra motivo, data e responsável ao %s alocação ativa', async (_nome, action, acao, campoData) => {
    autenticarR04(sessao, 'r04-coord');

    expect(await action(null, formR04({ id: alocacaoAtivaR04.id, motivo: 'Fim do acompanhamento' }))).toEqual({ sucesso: true });

    const [alocacao] = lerR03<AlocacaoR04>('alocacoes.json');
    expect(alocacao).toMatchObject({
      situacao: acao === 'ENCERRAMENTO' ? 'Encerrada' : 'Cancelada',
      motivo: 'Fim do acompanhamento',
      responsavelAcaoId: 'r04-coord',
    });
    expect(alocacao[campoData]).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(auditoria).toHaveBeenCalledWith(
      'r04-coord',
      'coord-r04@sgoa.test',
      'AlocacaoOrientacao',
      acao,
      expect.any(String),
    );
    expect(notificacao).toHaveBeenCalledTimes(2);
  });

  it.each([
    ['motivo vazio', ''],
    ['motivo acima do limite', 'x'.repeat(5001)],
  ])('não encerra ou cancela quando existe %s', async (_caso, motivo) => {
    autenticarR04(sessao, 'r04-coord');
    const dadosOriginais = lerR03('alocacoes.json');

    expect(await encerrarAlocacaoAction(null, formR04({ id: alocacaoAtivaR04.id, motivo }))).toHaveProperty('erro');
    expect(await cancelarAlocacaoAction(null, formR04({ id: alocacaoAtivaR04.id, motivo }))).toHaveProperty('erro');
    expect(lerR03('alocacoes.json')).toEqual(dadosOriginais);
  });

  it('não permite encerrar ou cancelar alocação que já saiu do estado ativo', async () => {
    autenticarR04(sessao, 'r04-coord');
    gravarR03('alocacoes.json', [{ ...alocacaoAtivaR04, situacao: 'Encerrada' }]);

    expect(await encerrarAlocacaoAction(null, formR04({ id: alocacaoAtivaR04.id, motivo: 'Motivo' }))).toHaveProperty('erro');
    expect(await cancelarAlocacaoAction(null, formR04({ id: alocacaoAtivaR04.id, motivo: 'Motivo' }))).toHaveProperty('erro');
    expect(lerR03<AlocacaoOrientacao>('alocacoes.json')[0].situacao).toBe('Encerrada');
  });

  it('não reverte alocação se auditoria ou notificações falharem', async () => {
    autenticarR04(sessao, 'r04-coord');
    gravarR03('alocacoes.json', []);
    auditoria.mockRejectedValue(new Error('falha de auditoria'));
    notificacao.mockRejectedValue(new Error('falha de notificação'));

    expect(await confirmarAlocacaoAction(null, formR04({
      tutorId: 'r04-tutor',
      tutoradoId: 'r04-tutorado',
      propostaId: 'r04-proposta',
      cicloId: 'r04-ciclo-aberto',
    }))).toEqual({ sucesso: true });
    expect(lerR03<AlocacaoR04>('alocacoes.json')).toHaveLength(1);
  });
});
