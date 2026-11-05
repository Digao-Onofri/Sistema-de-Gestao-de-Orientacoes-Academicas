// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import type { CicloOrientacao } from '../../types';
import { lerR03, gravarR03 } from '../release03-store';
import { hojeInstitucional } from '../release03-model';

const { sessao } = vi.hoisted(() => ({ sessao: vi.fn() }));
vi.mock('../session', () => ({ getSession: sessao }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
import { mudarCicloAction, salvarCicloAction } from '../release03-actions';
import { autenticar, ciclo, configurarDadosR03, form } from './release03-fixtures';

describe('Release 03: ciclos', () => {
  configurarDadosR03(sessao);

  it('cria rascunho, exige publicação antes de abrir e preserva configurações publicadas', async () => {
    autenticar(sessao, 'coord');
    expect(await salvarCicloAction(null, form({ ...ciclo, id: '' }))).toEqual({ sucesso: true });
    const novo = lerR03<CicloOrientacao>('ciclos.json')[1];
    expect(novo.situacao).toBe('Rascunho');
    expect(await mudarCicloAction(null, form({ id: novo.id, situacao: 'Aberto' }))).toEqual({
      erro: 'Transição de situação inválida ou ciclo já atualizado. Recarregue a página.',
    });
    expect(await mudarCicloAction(null, form({ id: novo.id, situacao: 'Publicado' }))).toEqual({ sucesso: true });
    expect(await salvarCicloAction(null, form({ ...ciclo, id: novo.id }))).toEqual({
      erro: 'Somente rascunhos podem ser editados. As regras dos ciclos publicados são preservadas.',
    });
    expect(await mudarCicloAction(null, form({ id: novo.id, situacao: 'Aberto' }))).toEqual({ sucesso: true });
    expect(await mudarCicloAction(null, form({ id: novo.id, situacao: 'Encerrado' }))).toEqual({ sucesso: true });
    expect(await mudarCicloAction(null, form({ id: novo.id, situacao: 'Aberto' }))).toEqual({
      erro: 'Transição de situação inválida ou ciclo já atualizado. Recarregue a página.',
    });
  });

  it.each([
    ['prazo final anterior ao inicial', { prazoFim: '2025-01-01' }, 'Informe datas válidas; o encerramento deve ser igual ou posterior ao início.'],
    ['data de calendário inválida', { prazoInicio: '2026-02-30' }, 'Informe datas válidas; o encerramento deve ser igual ou posterior ao início.'],
    ['período inexistente', { periodoId: 'inexistente' }, 'Período letivo inválido.'],
    ['modalidade inválida', { modalidade: 'Outro' }, 'Modalidade inválida.'],
    ['regras ausentes', { regras: '' }, 'Elegibilidade e regras são obrigatórias.'],
  ] as const)('rejeita ciclo com %s sem persistir', async (_caso, alteracao, mensagem) => {
    autenticar(sessao, 'coord');
    expect(await salvarCicloAction(null, form({ ...ciclo, id: '', ...alteracao }))).toEqual({ erro: mensagem });
    expect(lerR03('ciclos.json')).toHaveLength(1);
  });

  it.each(['elegibilidade', 'regras'] as const)('aceita até 5.000 caracteres em %s e rejeita o limite excedido', async campo => {
    autenticar(sessao, 'coord');
    const textoNoLimite = 'x'.repeat(5000);
    const valido = { ...ciclo, id: '', [campo]: textoNoLimite };
    expect(await salvarCicloAction(null, form(valido))).toEqual({ sucesso: true });

    const acimaDoLimite = { ...ciclo, id: '', [campo]: `${textoNoLimite}x` };
    expect(await salvarCicloAction(null, form(acimaDoLimite))).toEqual({
      erro: 'Utilize até 5.000 caracteres por campo.',
    });
    expect(lerR03<CicloOrientacao>('ciclos.json')).toHaveLength(2);
  });

  it('não permite criar ciclo para curso inativo', async () => {
    autenticar(sessao, 'coord');
    gravarR03('cursos.json', [{ id: 'curso', situacao: 'Inativo' }]);

    expect(await salvarCicloAction(null, form({ ...ciclo, id: '' }))).toEqual({
      erro: 'Selecione um curso ativo.',
    });
    expect(lerR03('ciclos.json')).toEqual([ciclo]);
  });

  it('aplica limites de dia no fuso de Brasília', () => {
    expect(hojeInstitucional(new Date('2026-11-05T02:59:59Z'))).toBe('2026-11-04');
    expect(hojeInstitucional(new Date('2026-11-05T03:00:00Z'))).toBe('2026-11-05');
  });

  it('mantém solicitações vinculadas ao cancelar ciclo e bloqueia sua reabertura', async () => {
    const historico = [{ id: 'solicitacao', cicloId: 'ciclo', situacao: 'Pendente' }];
    gravarR03('solicitacoes.json', historico);
    autenticar(sessao, 'coord');

    expect(await mudarCicloAction(null, form({ id: 'ciclo', situacao: 'Cancelado' }))).toEqual({
      sucesso: true,
      mensagem: 'Ciclo cancelado. Os registros e o histórico foram preservados.',
    });
    expect(lerR03('solicitacoes.json')).toEqual(historico);
    expect(await mudarCicloAction(null, form({ id: 'ciclo', situacao: 'Aberto' }))).toEqual({
      erro: 'Transição de situação inválida ou ciclo já atualizado. Recarregue a página.',
    });
  });
});
