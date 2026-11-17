// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import type { AlocacaoOrientacao, EtapaAcompanhamento, RegistroReuniao } from '../../types';
import { lerR03, gravarR03 } from '../release03-store';
import {
  alocacaoAtivaR04,
  autenticarR04,
  configurarDadosR04,
  formR04,
} from './release04-fixtures';

const { sessao, auditoria } = vi.hoisted(() => ({
  sessao: vi.fn(),
  auditoria: vi.fn(),
}));

vi.mock('../session', () => ({ getSession: sessao }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('../auditoria', () => ({ registrarAuditoriaEstrita: auditoria }));

import { criarEtapaAction, criarReuniaoAction } from '../release04-actions';

describe('Release 04: etapas e reuniões', () => {
  configurarDadosR04(sessao);

  it('permite ao tutor da alocação ativa criar etapa com situação informada', async () => {
    autenticarR04(sessao, 'r04-tutor');

    expect(await criarEtapaAction(null, formR04({
      alocacaoId: alocacaoAtivaR04.id,
      descricao: 'Entrega do capítulo inicial',
      responsavel: 'Tutor R04',
      prazo: '2026-01-01',
      situacao: 'Pendente',
    }))).toEqual({ sucesso: true });

    const etapas = lerR03<EtapaAcompanhamento>('etapas.json');
    expect(etapas).toHaveLength(2);
    expect(etapas[1]).toMatchObject({
      alocacaoId: alocacaoAtivaR04.id,
      descricao: 'Entrega do capítulo inicial',
      responsavel: 'Tutor R04',
      prazo: '2026-01-01',
      situacao: 'Pendente',
    });
  });

  it.each(['r04-coord', 'r04-tutorado', 'r04-outro-tutor'])(
    'impede que %s crie etapa para alocação de outro usuário',
    async (usuarioId) => {
      autenticarR04(sessao, usuarioId);

      expect(await criarEtapaAction(null, formR04({
        alocacaoId: alocacaoAtivaR04.id,
        descricao: 'Etapa não autorizada',
        responsavel: 'Responsável',
        prazo: '2026-11-10',
        situacao: 'Pendente',
      }))).toHaveProperty('erro');
      expect(lerR03<EtapaAcompanhamento>('etapas.json')).toHaveLength(1);
    },
  );

  it('impede etapa em alocação encerrada e rejeita situação desconhecida', async () => {
    autenticarR04(sessao, 'r04-tutor');
    gravarR03<AlocacaoOrientacao>('alocacoes.json', [{ ...alocacaoAtivaR04, situacao: 'Encerrada' }]);

    expect(await criarEtapaAction(null, formR04({
      alocacaoId: alocacaoAtivaR04.id,
      descricao: 'Etapa',
      responsavel: 'Responsável',
      prazo: '2026-11-10',
      situacao: 'Pendente',
    }))).toEqual({ erro: 'Só é possível criar etapa para alocação ativa.' });

    gravarR03('alocacoes.json', [alocacaoAtivaR04]);
    expect(await criarEtapaAction(null, formR04({
      alocacaoId: alocacaoAtivaR04.id,
      descricao: 'Etapa',
      responsavel: 'Responsável',
      prazo: '2026-11-10',
      situacao: 'Desconhecida',
    }))).toEqual({ erro: 'Situação da etapa inválida.' });
    expect(lerR03<EtapaAcompanhamento>('etapas.json')).toHaveLength(1);
  });

  it('rejeita data de prazo que não existe no calendário', async () => {
    autenticarR04(sessao, 'r04-tutor');

    expect(await criarEtapaAction(null, formR04({
      alocacaoId: alocacaoAtivaR04.id,
      descricao: 'Etapa',
      responsavel: 'Responsável',
      prazo: '2026-02-30',
      situacao: 'Pendente',
    }))).toHaveProperty('erro');
    expect(lerR03<EtapaAcompanhamento>('etapas.json')).toHaveLength(1);
  });

  it('permite reunião ao tutor vinculado, inclusive com próximo contato anterior', async () => {
    autenticarR04(sessao, 'r04-tutor');

    expect(await criarReuniaoAction(null, formR04({
      alocacaoId: alocacaoAtivaR04.id,
      data: '2026-11-05',
      resumo: 'Resumo objetivo da conversa',
      encaminhamentos: 'Revisar a bibliografia',
      proximoContato: '2026-11-04',
    }))).toEqual({ sucesso: true });

    const reunioes = lerR03<RegistroReuniao>('reunioes.json');
    expect(reunioes).toHaveLength(2);
    expect(reunioes[1]).toMatchObject({
      alocacaoId: alocacaoAtivaR04.id,
      data: '2026-11-05',
      proximoContato: '2026-11-04',
    });
  });

  it.each(['r04-coord', 'r04-tutorado', 'r04-outro-tutor'])(
    'impede que %s registre reunião para alocação de outro usuário',
    async (usuarioId) => {
      autenticarR04(sessao, usuarioId);

      expect(await criarReuniaoAction(null, formR04({
        alocacaoId: alocacaoAtivaR04.id,
        data: '2026-11-05',
        resumo: 'Resumo',
        encaminhamentos: 'Encaminhamento',
        proximoContato: '2026-11-04',
      }))).toHaveProperty('erro');
      expect(lerR03<RegistroReuniao>('reunioes.json')).toHaveLength(1);
    },
  );

  it('rejeita reunião sem campos obrigatórios ou para alocação inativa', async () => {
    autenticarR04(sessao, 'r04-tutor');
    expect(await criarReuniaoAction(null, formR04({
      alocacaoId: alocacaoAtivaR04.id,
      data: '2026-11-05',
      resumo: '',
      encaminhamentos: 'Encaminhamento',
      proximoContato: '2026-11-04',
    }))).toHaveProperty('erro');

    gravarR03<AlocacaoOrientacao>('alocacoes.json', [{ ...alocacaoAtivaR04, situacao: 'Cancelada' }]);
    expect(await criarReuniaoAction(null, formR04({
      alocacaoId: alocacaoAtivaR04.id,
      data: '2026-11-05',
      resumo: 'Resumo',
      encaminhamentos: 'Encaminhamento',
      proximoContato: '2026-11-04',
    }))).toEqual({ erro: 'Só é possível registrar reunião para alocação ativa.' });
    expect(lerR03<RegistroReuniao>('reunioes.json')).toHaveLength(1);
  });
});
