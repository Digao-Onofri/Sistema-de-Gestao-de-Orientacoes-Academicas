// @vitest-environment node
import fs from 'node:fs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AlocacaoOrientacao, Usuario } from '../../types';
import { lerR03, gravarR03 } from '../release03-store';
import {
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

import { confirmarAlocacaoAction } from '../release04-actions';

describe('Release 04: integridade de alocações em processo único', () => {
  configurarDadosR04(sessao);

  beforeEach(() => {
    auditoria.mockResolvedValue(undefined);
    notificacao.mockResolvedValue(undefined);
  });

  it('não excede a última vaga quando duas confirmações concorrentes são submetidas', async () => {
    autenticarR04(sessao, 'r04-coord');
    const usuariosComLimiteUm: Usuario[] = usuariosR04.map((usuario) => (
      usuario.id === 'r04-tutor' ? { ...usuario, limiteOrientandos: 1 } : usuario
    ));
    gravarR03('usuarios.json', usuariosComLimiteUm);
    gravarR03('alocacoes.json', []);

    const resultados = await Promise.all([
      confirmarAlocacaoAction(null, formR04({
        tutorId: 'r04-tutor',
        tutoradoId: 'r04-tutorado',
        propostaId: 'r04-proposta',
        cicloId: 'r04-ciclo-aberto',
      })),
      confirmarAlocacaoAction(null, formR04({
        tutorId: 'r04-tutor',
        tutoradoId: 'r04-outro-tutorado',
        propostaId: 'r04-proposta-2',
        cicloId: 'r04-ciclo-aberto',
      })),
    ]);

    expect(resultados.filter((resultado) => resultado?.sucesso)).toHaveLength(1);
    expect(resultados.filter((resultado) => resultado?.erro)).toHaveLength(1);
    expect(lerR03<AlocacaoOrientacao>('alocacoes.json')).toHaveLength(1);
  });

  it('preserva o arquivo original se a gravação atômica falhar', async () => {
    autenticarR04(sessao, 'r04-coord');
    gravarR03('alocacoes.json', []);
    const gravacaoOriginal = fs.renameSync;
    const falhaRename = vi.spyOn(fs, 'renameSync').mockImplementationOnce(() => {
      throw new Error('falha simulada de gravação');
    });

    try {
      expect(await confirmarAlocacaoAction(null, formR04({
        tutorId: 'r04-tutor',
        tutoradoId: 'r04-tutorado',
        propostaId: 'r04-proposta',
        cicloId: 'r04-ciclo-aberto',
      }))).toEqual({
        erro: 'Não foi possível confirmar a alocação. Verifique os dados e tente novamente.',
      });
      expect(lerR03('alocacoes.json')).toEqual([]);
      expect(falhaRename).toHaveBeenCalled();
    } finally {
      falhaRename.mockRestore();
      expect(fs.renameSync).toBe(gravacaoOriginal);
    }
  });
});
