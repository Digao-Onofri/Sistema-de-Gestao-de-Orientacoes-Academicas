// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import type { PropostaAcademica } from '../../types';
import { lerR03, gravarR03 } from '../release03-store';
import type { SolicitacaoR03 } from '../release03-model';

const { sessao } = vi.hoisted(() => ({ sessao: vi.fn() }));
vi.mock('../session', () => ({ getSession: sessao }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
import {
  cancelarSolicitacaoAction,
  criarSolicitacaoAction,
  decidirSolicitacaoAction,
  editarSolicitacaoAction,
} from '../release03-actions';
import { autenticar, ciclo, configurarDadosR03, dataDirR03, form, solicitar, usuarios } from './release03-fixtures';
import { consultarSolicitacoes } from '../release03-queries';

type CasoValidacaoCriacao = readonly [string, () => void, string];

describe('Release 03: solicitações e decisões', () => {
  configurarDadosR03(sessao);

  it.each([
    ['coordenador', 'coord', 'Apenas tutorados ativos podem criar solicitações próprias.'],
    ['tutor', 'tutor', 'Apenas tutorados ativos podem criar solicitações próprias.'],
    ['outro tutorado', 'outro', 'Selecione uma proposta de sua autoria.'],
  ] as const)('bloqueia criação por %s sem alterar os registros', async (_caso, ator, erro) => {
    autenticar(sessao, ator);
    expect(await criarSolicitacaoAction(null, solicitar())).toEqual({ erro });
    expect(lerR03('solicitacoes.json')).toEqual([]);
  });

  it.each(['Publicado', 'Encerrado', 'Cancelado', 'Rascunho'] as const)(
    'bloqueia criação no ciclo %s',
    async situacao => {
      gravarR03('ciclos.json', [{ ...ciclo, situacao }]);
      expect(await criarSolicitacaoAction(null, solicitar())).toEqual({
        erro: 'O ciclo deve estar aberto e dentro do prazo de solicitação.',
      });
      expect(lerR03('solicitacoes.json')).toEqual([]);
    },
  );

  const validacoesCriacao: CasoValidacaoCriacao[] = [
    ['prazo expirado', () => gravarR03('ciclos.json', [{ ...ciclo, prazoFim: '2020-01-01' }]), 'O ciclo deve estar aberto e dentro do prazo de solicitação.'],
    ['modalidade incompatível', () => gravarR03('ciclos.json', [{ ...ciclo, modalidade: 'IC' }]), 'A modalidade da proposta deve corresponder à do ciclo.'],
    ['sem declaração de elegibilidade', () => undefined, 'Leia as regras e declare que atende aos critérios de elegibilidade.'],
    ['tutor inexistente', () => undefined, 'Os tutores devem estar ativos e oferecer a modalidade do ciclo.'],
    ['tutor inativo', () => gravarR03('usuarios.json', usuarios.map(usuario => usuario.id === 'tutor' ? { ...usuario, situacao: 'Inativa' } : usuario)), 'Os tutores devem estar ativos e oferecer a modalidade do ciclo.'],
    ['preferência duplicada', () => undefined, 'Informe ao menos um tutor, sem repetir preferências.'],
  ];
  it.each(validacoesCriacao)('rejeita solicitação com %s', async (_caso, preparar, erro) => {
    preparar();
    const dados = solicitar();
    if (_caso === 'sem declaração de elegibilidade') dados.delete('elegibilidadeDeclarada');
    if (_caso === 'tutor inexistente') dados.set('tutoresPreferidos', 'inexistente');
    if (_caso === 'preferência duplicada') dados.append('tutoresPreferidos', 'tutor');

    expect(await criarSolicitacaoAction(null, dados)).toEqual({ erro });
    expect(lerR03('solicitacoes.json')).toEqual([]);
  });

  it('rejeita criação sem tutor preferido', async () => {
    const dados = solicitar();
    dados.delete('tutoresPreferidos');

    expect(await criarSolicitacaoAction(null, dados)).toEqual({
      erro: 'Informe ao menos um tutor, sem repetir preferências.',
    });
    expect(lerR03('solicitacoes.json')).toEqual([]);
  });

  it('aceita solicitação nos dias inicial e final do prazo e rejeita fora dos limites', async () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date('2026-01-01T15:00:00.000Z'));
      expect(await criarSolicitacaoAction(null, solicitar())).toEqual({ sucesso: true });

      gravarR03('solicitacoes.json', []);
      vi.setSystemTime(new Date('2099-12-31T15:00:00.000Z'));
      expect(await criarSolicitacaoAction(null, solicitar())).toEqual({ sucesso: true });

      gravarR03('solicitacoes.json', []);
      vi.setSystemTime(new Date('2025-12-31T15:00:00.000Z'));
      expect(await criarSolicitacaoAction(null, solicitar())).toEqual({
        erro: 'O ciclo deve estar aberto e dentro do prazo de solicitação.',
      });

      vi.setSystemTime(new Date('2100-01-01T15:00:00.000Z'));
      expect(await criarSolicitacaoAction(null, solicitar())).toEqual({
        erro: 'O ciclo deve estar aberto e dentro do prazo de solicitação.',
      });
      expect(lerR03('solicitacoes.json')).toEqual([]);
    } finally {
      vi.useRealTimers();
    }
  });

  it('cria solicitação, bloqueia duplicidade e preserva o conteúdo da proposta enviada', async () => {
    const resultados = await Promise.all([
      criarSolicitacaoAction(null, solicitar()),
      criarSolicitacaoAction(null, solicitar()),
    ]);
    expect(resultados.filter(resultado => resultado?.sucesso)).toHaveLength(1);
    expect(resultados.filter(resultado => resultado?.erro)).toHaveLength(1);
    expect(resultados.find(resultado => resultado?.erro)).toEqual({
      erro: 'Já existe uma solicitação para esta proposta neste ciclo, inclusive no histórico de cancelamentos.',
    });

    gravarR03('propostas.json', [{ id: 'proposta', titulo: 'Alterada depois' }]);
    const criada = lerR03<SolicitacaoR03>('solicitacoes.json')[0];
    expect(criada.propostaSubmetida?.titulo).toContain('acentuação');
    expect(consultarSolicitacoes(usuarios[1], {})[0].proposta?.titulo).toContain('acentuação');
  });

  it.each([
    ['Aceitar', 'Aceita'],
    ['Recusar', 'Recusada'],
    ['SolicitarComplementacao', 'AguardandoComplementacao'],
  ] as const)('registra a decisão %s sem criar alocação', async (resultado, situacao) => {
    await criarSolicitacaoAction(null, solicitar());
    const id = lerR03<SolicitacaoR03>('solicitacoes.json')[0].id;

    autenticar(sessao, 'estranho');
    expect(await decidirSolicitacaoAction(null, form({ id, resultado, justificativa: 'Motivo' }))).toEqual({
      erro: 'Solicitação não encontrada ou sem permissão.',
    });

    autenticar(sessao, 'tutor');
    if (resultado !== 'Aceitar') {
      expect(await decidirSolicitacaoAction(null, form({ id, resultado }))).toEqual({
        erro: 'Informe a justificativa para recusar ou solicitar complementação.',
      });
    }

    expect(await decidirSolicitacaoAction(null, form({ id, resultado, justificativa: 'Motivo' }))).toEqual({
      sucesso: true,
    });
    const decidida = lerR03<SolicitacaoR03>('solicitacoes.json')[0];
    expect(decidida).toMatchObject({
      situacao,
      decisao: { resultado, tutorId: 'tutor', justificativa: 'Motivo' },
    });
    expect(Number.isNaN(Date.parse(decidida.decisao?.dataDecisao ?? ''))).toBe(false);
    expect(await decidirSolicitacaoAction(null, form({ id, resultado, justificativa: 'Sobrescrever' }))).toEqual({
      erro: 'Somente solicitações pendentes e sem decisão podem ser avaliadas. Recarregue a página.',
    });
    expect(fs.existsSync(path.join(dataDirR03(), 'alocacoes.json'))).toBe(false);
  });

  it('rejeita decisão desconhecida e justificativa acima do limite sem alterar a solicitação', async () => {
    await criarSolicitacaoAction(null, solicitar());
    const original = lerR03<SolicitacaoR03>('solicitacoes.json')[0];
    autenticar(sessao, 'tutor');

    expect(await decidirSolicitacaoAction(null, form({
      id: original.id,
      resultado: 'Outro',
      justificativa: 'Motivo',
    }))).toEqual({ erro: 'Decisão inválida.' });
    expect(await decidirSolicitacaoAction(null, form({
      id: original.id,
      resultado: 'Recusar',
      justificativa: 'x'.repeat(5001),
    }))).toEqual({ erro: 'Utilize até 5.000 caracteres na justificativa.' });
    expect(lerR03<SolicitacaoR03>('solicitacoes.json')).toEqual([original]);

    expect(await decidirSolicitacaoAction(null, form({
      id: original.id,
      resultado: 'Recusar',
      justificativa: 'x'.repeat(5000),
    }))).toEqual({ sucesso: true });
    expect(lerR03<SolicitacaoR03>('solicitacoes.json')[0].decisao?.justificativa).toHaveLength(5000);
  });

  it.each(['ciclo cancelado', 'ciclo inexistente'] as const)('impede decisão em solicitação de %s', async caso => {
    await criarSolicitacaoAction(null, solicitar());
    const original = lerR03<SolicitacaoR03>('solicitacoes.json')[0];
    gravarR03('ciclos.json', caso === 'ciclo cancelado' ? [{ ...ciclo, situacao: 'Cancelado' }] : []);
    autenticar(sessao, 'tutor');

    expect(await decidirSolicitacaoAction(null, form({
      id: original.id,
      resultado: 'Aceitar',
      justificativa: '',
    }))).toEqual({
      erro: 'Não é possível decidir uma solicitação de ciclo cancelado ou inexistente.',
    });
    expect(lerR03<SolicitacaoR03>('solicitacoes.json')).toEqual([original]);
  });

  it.each([
    ['coordenador', 'coord', 'Apenas tutorados ativos podem criar solicitações próprias.', 'Apenas tutorados ativos podem cancelar solicitações próprias.'],
    ['tutor', 'tutor', 'Apenas tutorados ativos podem criar solicitações próprias.', 'Apenas tutorados ativos podem cancelar solicitações próprias.'],
    ['outro tutorado', 'outro', 'Solicitação não encontrada ou sem permissão.', 'Solicitação não encontrada ou sem permissão.'],
  ] as const)('bloqueia edição/cancelamento por %s sem autoria', async (_caso, ator, erroEdicao, erroCancelamento) => {
    await criarSolicitacaoAction(null, solicitar());
    const original = lerR03<SolicitacaoR03>('solicitacoes.json')[0];
    const dados = solicitar();
    dados.set('id', original.id);

    autenticar(sessao, ator);
    expect(await editarSolicitacaoAction(null, dados)).toEqual({ erro: erroEdicao });
    expect(await cancelarSolicitacaoAction(null, dados)).toEqual({ erro: erroCancelamento });
    expect(lerR03<SolicitacaoR03>('solicitacoes.json')).toEqual([original]);
  });

  it.each([
    ['Aceita', 'Aceitar'],
    ['Recusada', 'Recusar'],
    ['AguardandoComplementacao', 'SolicitarComplementacao'],
  ] as const)('bloqueia edição/cancelamento após solicitação %s', async (situacao, resultado) => {
    await criarSolicitacaoAction(null, solicitar());
    const original = lerR03<SolicitacaoR03>('solicitacoes.json')[0];
    autenticar(sessao, 'tutor');
    expect(await decidirSolicitacaoAction(null, form({ id: original.id, resultado, justificativa: 'Decidida' }))).toEqual({
      sucesso: true,
    });
    const decidida = lerR03<SolicitacaoR03>('solicitacoes.json')[0];
    expect(decidida.situacao).toBe(situacao);

    autenticar(sessao, 'aluno');
    const dados = solicitar();
    dados.set('id', original.id);
    expect(await editarSolicitacaoAction(null, dados)).toEqual({
      erro: 'Somente solicitações pendentes e sem decisão podem ser editadas.',
    });
    expect(await cancelarSolicitacaoAction(null, dados)).toEqual({
      erro: 'Somente solicitações pendentes e sem decisão podem ser canceladas.',
    });
    expect(lerR03<SolicitacaoR03>('solicitacoes.json')).toEqual([decidida]);
  });

  it.each(['Publicado', 'Encerrado', 'Cancelado'] as const)(
    'impede edição em ciclo %s e permite cancelamento da pendente',
    async situacao => {
      await criarSolicitacaoAction(null, solicitar());
      const original = lerR03<SolicitacaoR03>('solicitacoes.json')[0];
      gravarR03('ciclos.json', [{ ...ciclo, situacao }]);
      const dados = solicitar();
      dados.set('id', original.id);

      expect(await editarSolicitacaoAction(null, dados)).toEqual({
        erro: 'O ciclo deve estar aberto e dentro do prazo de solicitação.',
      });
      expect(await cancelarSolicitacaoAction(null, dados)).toEqual({
        sucesso: true,
        mensagem: 'Solicitação cancelada. O registro foi mantido no histórico.',
      });
      expect(lerR03<SolicitacaoR03>('solicitacoes.json')[0]).toMatchObject({
        ...original,
        situacao: 'Cancelada',
        cancelamento: { tutoradoId: 'aluno' },
      });
      expect(Number.isNaN(Date.parse(lerR03<SolicitacaoR03>('solicitacoes.json')[0].cancelamento?.dataCancelamento ?? ''))).toBe(false);
    },
  );

  it.each([
    ['ciclo diferente', 'cicloId', 'outro-ciclo', 'O ciclo de uma solicitação enviada não pode ser alterado.'],
    ['proposta alheia', 'propostaId', 'alheia', 'Selecione uma proposta de sua autoria.'],
    ['tutor inexistente', 'tutoresPreferidos', 'inexistente', 'Os tutores devem estar ativos e oferecer a modalidade do ciclo.'],
    ['sem declaração', 'elegibilidadeDeclarada', '', 'Leia as regras e declare que atende aos critérios de elegibilidade.'],
  ] as const)('rejeita edição com %s sem alterar a solicitação', async (_caso, campo, valor, erro) => {
    await criarSolicitacaoAction(null, solicitar());
    const original = lerR03<SolicitacaoR03>('solicitacoes.json')[0];
    const dados = solicitar();
    dados.set('id', original.id);
    dados.set(campo, valor);

    expect(await editarSolicitacaoAction(null, dados)).toEqual({ erro });
    expect(lerR03<SolicitacaoR03>('solicitacoes.json')).toEqual([original]);
  });

  it.each([
    ['prazo expirado', { prazoFim: '2020-01-01' }],
    ['prazo ainda não iniciado', { prazoInicio: '2099-01-01' }],
  ] as const)('rejeita edição com %s', async (_caso, alteracao) => {
    await criarSolicitacaoAction(null, solicitar());
    const original = lerR03<SolicitacaoR03>('solicitacoes.json')[0];
    gravarR03('ciclos.json', [{ ...ciclo, ...alteracao }]);
    const dados = solicitar();
    dados.set('id', original.id);

    expect(await editarSolicitacaoAction(null, dados)).toEqual({
      erro: 'O ciclo deve estar aberto e dentro do prazo de solicitação.',
    });
    expect(lerR03<SolicitacaoR03>('solicitacoes.json')).toEqual([original]);
  });

  it('edita a própria solicitação sem alterar id nem data de envio', async () => {
    await criarSolicitacaoAction(null, solicitar());
    const original = lerR03<SolicitacaoR03>('solicitacoes.json')[0];
    const propostas = lerR03<PropostaAcademica>('propostas.json');
    gravarR03('propostas.json', [...propostas, { ...propostas[0], id: 'segunda', titulo: 'Nova escolha' }]);
    const dados = solicitar();
    dados.set('id', original.id);
    dados.set('propostaId', 'segunda');
    dados.set('tutoresPreferidos', 'estranho');

    expect(await editarSolicitacaoAction(null, dados)).toEqual({ sucesso: true });
    const editada = lerR03<SolicitacaoR03>('solicitacoes.json')[0];
    expect(editada).toMatchObject({
      id: original.id,
      dataSolicitacao: original.dataSolicitacao,
      situacao: 'Pendente',
      propostaId: 'segunda',
      tutoresPreferidos: ['estranho'],
      propostaSubmetida: { titulo: 'Nova escolha' },
    });
    expect(Number.isNaN(Date.parse(editada.dataAtualizacao ?? ''))).toBe(false);
  });

  it('valida modalidade, tutor ativo e duplicidade ao editar', async () => {
    await criarSolicitacaoAction(null, solicitar());
    const original = lerR03<SolicitacaoR03>('solicitacoes.json')[0];
    const dados = solicitar();
    dados.set('id', original.id);
    const propostas = lerR03<PropostaAcademica>('propostas.json');

    gravarR03('propostas.json', [{ ...propostas[0], tipo: 'IC' }]);
    expect(await editarSolicitacaoAction(null, dados)).toEqual({
      erro: 'A modalidade da proposta deve corresponder à do ciclo.',
    });
    expect(lerR03<SolicitacaoR03>('solicitacoes.json')).toEqual([original]);

    gravarR03('propostas.json', propostas);
    gravarR03('usuarios.json', usuarios.map(usuario => usuario.id === 'tutor' ? { ...usuario, situacao: 'Inativa' } : usuario));
    expect(await editarSolicitacaoAction(null, dados)).toEqual({
      erro: 'Os tutores devem estar ativos e oferecer a modalidade do ciclo.',
    });
    expect(lerR03<SolicitacaoR03>('solicitacoes.json')).toEqual([original]);

    gravarR03('usuarios.json', usuarios);
    gravarR03('propostas.json', [...propostas, { ...propostas[0], id: 'segunda' }]);
    const outra = solicitar();
    outra.set('propostaId', 'segunda');
    expect(await criarSolicitacaoAction(null, outra)).toEqual({ sucesso: true });
    dados.set('propostaId', 'segunda');
    expect(await editarSolicitacaoAction(null, dados)).toEqual({
      erro: 'Já existe uma solicitação para esta proposta neste ciclo, inclusive no histórico de cancelamentos.',
    });
    expect(lerR03<SolicitacaoR03>('solicitacoes.json')[0]).toEqual(original);
  });

  it('cancela logicamente, mantém visibilidade e impede nova decisão, edição e duplicidade', async () => {
    await criarSolicitacaoAction(null, solicitar());
    const original = lerR03<SolicitacaoR03>('solicitacoes.json')[0];
    const dados = form({ id: original.id });
    expect(await cancelarSolicitacaoAction(null, dados)).toEqual({
      sucesso: true,
      mensagem: 'Solicitação cancelada. O registro foi mantido no histórico.',
    });
    expect(await cancelarSolicitacaoAction(null, dados)).toEqual({
      erro: 'Somente solicitações pendentes e sem decisão podem ser canceladas.',
    });
    expect(await editarSolicitacaoAction(null, form({ id: original.id }))).toEqual({
      erro: 'Somente solicitações pendentes e sem decisão podem ser editadas.',
    });
    expect(await criarSolicitacaoAction(null, solicitar())).toEqual({
      erro: 'Já existe uma solicitação para esta proposta neste ciclo, inclusive no histórico de cancelamentos.',
    });
    expect(consultarSolicitacoes(usuarios[0], { situacao: 'Cancelada' })).toHaveLength(1);
    expect(consultarSolicitacoes(usuarios[1], {})).toHaveLength(1);
    expect(consultarSolicitacoes(usuarios[3], {})).toHaveLength(1);

    autenticar(sessao, 'tutor');
    expect(await decidirSolicitacaoAction(null, form({ id: original.id, resultado: 'Aceitar' }))).toEqual({
      erro: 'Somente solicitações pendentes e sem decisão podem ser avaliadas. Recarregue a página.',
    });
    expect(lerR03<SolicitacaoR03>('solicitacoes.json')[0].decisao).toBeUndefined();
  });

  it('edita e cancela registro legado sem exigir migração prévia', async () => {
    const legado: SolicitacaoR03 = {
      id: 'legado',
      cicloId: 'ciclo',
      propostaId: 'proposta',
      tutoradoId: 'aluno',
      tutoresPreferidos: ['tutor'],
      situacao: 'Pendente',
      dataSolicitacao: '2026-01-01T12:00:00Z',
    };
    gravarR03('solicitacoes.json', [legado]);
    const dados = solicitar();
    dados.set('id', legado.id);

    expect(await editarSolicitacaoAction(null, dados)).toEqual({ sucesso: true });
    expect(lerR03<SolicitacaoR03>('solicitacoes.json')[0].propostaSubmetida).toEqual(
      expect.objectContaining({ id: 'proposta' }),
    );

    gravarR03('solicitacoes.json', [legado]);
    expect(await cancelarSolicitacaoAction(null, form({ id: legado.id }))).toEqual({
      sucesso: true,
      mensagem: 'Solicitação cancelada. O registro foi mantido no histórico.',
    });
    expect(lerR03<SolicitacaoR03>('solicitacoes.json')[0]).toMatchObject({
      id: legado.id,
      dataSolicitacao: legado.dataSolicitacao,
      situacao: 'Cancelada',
    });
  });

  it('mantém decisão e cancelamento mutuamente exclusivos em chamadas concorrentes', async () => {
    await criarSolicitacaoAction(null, solicitar());
    const original = lerR03<SolicitacaoR03>('solicitacoes.json')[0];
    sessao.mockResolvedValueOnce({ userId: 'aluno', perfil: 'Tutorado' })
      .mockResolvedValueOnce({ userId: 'tutor', perfil: 'Tutor' });

    const resultados = await Promise.all([
      cancelarSolicitacaoAction(null, form({ id: original.id })),
      decidirSolicitacaoAction(null, form({ id: original.id, resultado: 'Aceitar' })),
    ]);
    expect(resultados.filter(resultado => resultado?.sucesso)).toHaveLength(1);
    expect(resultados.filter(resultado => resultado?.erro)).toHaveLength(1);
    const final = lerR03<SolicitacaoR03>('solicitacoes.json')[0];
    expect(Boolean(final.decisao && final.cancelamento)).toBe(false);
  });

  const falhasPersistencia: CasoValidacaoCriacao[] = [
    ['conta inativa', () => gravarR03('usuarios.json', usuarios.map(usuario => usuario.id === 'aluno' ? { ...usuario, situacao: 'Inativa' } : usuario)), 'Apenas tutorados ativos podem criar solicitações próprias.'],
    ['arquivo JSON corrompido', () => fs.writeFileSync(path.join(dataDirR03(), 'solicitacoes.json'), 'corrompido'), 'Não foi possível registrar a solicitação. Verifique os arquivos JSON.'],
  ];
  it.each(falhasPersistencia)('não registra solicitação quando há %s', async (_caso, preparar, erro) => {
    preparar();
    expect(await criarSolicitacaoAction(null, solicitar())).toEqual({ erro });
    if (_caso === 'arquivo JSON corrompido') {
      expect(fs.readFileSync(path.join(dataDirR03(), 'solicitacoes.json'), 'utf8')).toBe('corrompido');
    } else {
      expect(lerR03('solicitacoes.json')).toEqual([]);
    }
  });
});
