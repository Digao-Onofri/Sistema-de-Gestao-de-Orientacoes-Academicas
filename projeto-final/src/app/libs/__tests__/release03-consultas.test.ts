// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import { criarSolicitacaoAction } from '../release03-actions';
import { consultarSolicitacoes, csvSolicitacoes } from '../release03-queries';
import { configurarDadosR03, solicitar, usuarios } from './release03-fixtures';

const { sessao } = vi.hoisted(() => ({ sessao: vi.fn() }));
vi.mock('../session', () => ({ getSession: sessao }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

describe('Release 03: consultas e exportação', () => {
  configurarDadosR03(sessao);

  it('restringe solicitações a quem pode consultá-las e aplica filtros', async () => {
    await criarSolicitacaoAction(null, solicitar());

    expect(consultarSolicitacoes(usuarios[2], {})).toEqual([]);
    expect(consultarSolicitacoes(usuarios[4], {})).toEqual([]);
    expect(consultarSolicitacoes(usuarios[3], {})).toHaveLength(1);
    expect(consultarSolicitacoes(usuarios[0], { situacao: 'Aceita' })).toEqual([]);
    expect(consultarSolicitacoes(usuarios[0], { curso: 'curso' })).toHaveLength(1);
    expect(consultarSolicitacoes(usuarios[0], { ciclo: 'outro-ciclo' })).toEqual([]);
    expect(consultarSolicitacoes(usuarios[0], { tutor: 'estranho' })).toEqual([]);
    expect(consultarSolicitacoes(usuarios[0], { tutorado: 'outro' })).toEqual([]);
    expect(consultarSolicitacoes(usuarios[0], { proposta: 'outra-proposta' })).toEqual([]);
  });

  it('exporta CSV UTF-8 com escape e proteção contra fórmulas sem dados privados', async () => {
    await criarSolicitacaoAction(null, solicitar());
    const csv = csvSolicitacoes(consultarSolicitacoes(usuarios[0], { curso: 'curso' }));

    expect(csv.charCodeAt(0)).toBe(0xfeff);
    expect(csv).toContain(`"'=Proposta; com ""acentuação"""`);
    expect(csv).toContain('\r\n');
    expect(csv).not.toContain('segredo-que-nao-pode-vazar');
    expect(csv).not.toContain('@teste.invalid');
  });
});
