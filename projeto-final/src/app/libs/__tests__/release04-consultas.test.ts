// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import type { AlocacaoOrientacao, RegistroAuditoria } from '../../types';
import { gravarR03 } from '../release03-store';
import {
  consultarAlocacoesBase,
  consultarAuditoriaBase,
  consultarEtapasBase,
  consultarNotificacoesBase,
  consultarPainel,
  consultarReunioesBase,
  csvPainel,
} from '../release04-queries';
import {
  alocacaoAtivaR04,
  configurarDadosR04,
  obterUsuarioR04,
  usuariosR04,
} from './release04-fixtures';

describe('Release 04: consultas, painel e CSV', () => {
  configurarDadosR04(vi.fn());

  it('filtra alocações e restringe a projeção aos dados necessários por perfil', async () => {
    const alocacoes = await consultarAlocacoesBase(usuariosR04[1], {});
    expect(alocacoes).toHaveLength(1);
    expect(alocacoes[0]).toMatchObject({
      id: alocacaoAtivaR04.id,
      tutorNome: 'Tutor R04',
      tutoradoNome: 'Tutorado R04',
      cursoNome: 'Curso R04',
    });
    expect(alocacoes[0]).not.toHaveProperty('email');
    expect(alocacoes[0]).not.toHaveProperty('senha');

    expect(await consultarAlocacoesBase(obterUsuarioR04('r04-tutorado'), {})).toHaveLength(1);
    expect(await consultarAlocacoesBase(obterUsuarioR04('r04-outro-tutorado'), {})).toEqual([]);
    expect(await consultarAlocacoesBase(usuariosR04[0], { situacao: 'Encerrada' })).toEqual([]);
    expect(await consultarAlocacoesBase(usuariosR04[0], {
      curso: 'r04-curso',
      ciclo: 'r04-ciclo-aberto',
      tutor: 'r04-tutor',
      tutorado: 'r04-tutorado',
      situacao: 'Ativa',
    })).toHaveLength(1);
  });

  it('restringe etapas e reuniões a participantes e aplica filtros/ordenação', async () => {
    gravarR03('etapas.json', [
      { id: 'etapa-longa', alocacaoId: alocacaoAtivaR04.id, descricao: 'Prazo posterior', responsavel: 'Ana', prazo: '2026-11-20', situacao: 'Pendente' },
      { id: 'etapa-curta', alocacaoId: alocacaoAtivaR04.id, descricao: 'Prazo anterior', responsavel: 'Bia', prazo: '2026-11-10', situacao: 'Concluida' },
      { id: 'etapa-orfa', alocacaoId: 'alocacao-inexistente', descricao: 'Não deve aparecer', responsavel: 'Ana', prazo: '2026-11-01', situacao: 'Pendente' },
    ]);
    const etapas = await consultarEtapasBase(usuariosR04[1], { responsavel: 'a', situacao: 'Pendente' });
    expect(etapas.map(({ id }) => id)).toEqual(['etapa-longa']);
    expect(await consultarEtapasBase(obterUsuarioR04('r04-outro-tutorado'), {})).toEqual([]);
    expect((await consultarEtapasBase(usuariosR04[0], {})).map(({ id }) => id)).toEqual(['etapa-curta', 'etapa-longa']);

    gravarR03('reunioes.json', [
      { id: 'reuniao-antiga', alocacaoId: alocacaoAtivaR04.id, data: '2026-11-04', resumo: 'Antiga', encaminhamentos: 'X', proximoContato: '2026-11-04' },
      { id: 'reuniao-nova', alocacaoId: alocacaoAtivaR04.id, data: '2026-11-05', resumo: 'Nova', encaminhamentos: 'Y', proximoContato: '2026-11-06' },
      { id: 'reuniao-orfa', alocacaoId: 'alocacao-inexistente', data: '2026-11-05', resumo: 'Não deve aparecer', encaminhamentos: 'Z', proximoContato: '2026-11-06' },
    ]);
    const reunioes = await consultarReunioesBase(obterUsuarioR04('r04-tutorado'), { de: '2026-11-04', ate: '2026-11-05' });
    expect(reunioes.map(({ id }) => id)).toEqual(['reuniao-nova', 'reuniao-antiga']);
    expect(await consultarReunioesBase(obterUsuarioR04('r04-outro-tutorado'), {})).toEqual([]);
  });

  it('retorna apenas notificações do próprio usuário e restringe auditoria à coordenação', async () => {
    const notificacoes = await consultarNotificacoesBase(usuariosR04[1], {
      tipo: 'AlocacaoConfirmada',
      de: '2026-11-05',
      ate: '2026-11-05',
    });
    expect(notificacoes.map(({ id }) => id)).toEqual(['r04-notificacao-propria']);
    expect(await consultarNotificacoesBase(usuariosR04[0], {})).toEqual([]);

    gravarR03<RegistroAuditoria>('auditoria.json', [
      { id: 'auditoria-antiga', dataHora: '2026-11-04T12:00:00.000Z', usuarioId: 'r04-coord', usuarioEmail: 'coord-r04@sgoa.test', entidade: 'Ciclo', tipoAcao: 'PUBLICACAO' },
      { id: 'auditoria-nova', dataHora: '2026-11-05T12:00:00.000Z', usuarioId: 'r04-coord', usuarioEmail: 'coord-r04@sgoa.test', entidade: 'AlocacaoOrientacao', tipoAcao: 'CONFIRMACAO' },
    ]);
    const auditoria = await consultarAuditoriaBase(usuariosR04[0], {
      de: '2026-11-05',
      ate: '2026-11-05',
      usuario: 'r04-coord',
      entidade: 'AlocacaoOrientacao',
      tipoAcao: 'CONFIRMACAO',
    });
    expect(auditoria.map(({ id }) => id)).toEqual(['auditoria-nova']);
    expect(await consultarAuditoriaBase(usuariosR04[1], {})).toEqual([]);
  });

  it('calcula vagas globais e orientandos do ciclo separadamente', async () => {
    const adicionais: AlocacaoOrientacao[] = [
      alocacaoAtivaR04,
      {
        ...alocacaoAtivaR04,
        id: 'r04-alocacao-outro-ciclo',
        propostaId: 'r04-proposta-2',
        tutoradoId: 'r04-outro-tutorado',
        cicloId: 'r04-ciclo-encerrado',
      },
    ];
    gravarR03('alocacoes.json', adicionais);
    const linhas = await consultarPainel(usuariosR04[0], {});

    const cicloAberto = linhas.find(({ cicloId }) => cicloId === 'r04-ciclo-aberto');
    const cicloEncerrado = linhas.find(({ cicloId }) => cicloId === 'r04-ciclo-encerrado');
    expect(cicloAberto).toMatchObject({ orientandosCiclo: 1, vagasGlobais: 1, alocAtivasCiclo: 1 });
    expect(cicloEncerrado).toMatchObject({ orientandosCiclo: 1, vagasGlobais: 1, alocAtivasCiclo: 1 });
    expect(await consultarPainel(usuariosR04[1], {})).toEqual([]);
    expect(await consultarPainel(usuariosR04[0], { ciclo: 'r04-ciclo-aberto' })).toHaveLength(1);
  });

  it('exporta CSV UTF-8 com BOM, delimitadores consistentes e proteção contra fórmulas', async () => {
    gravarR03('cursos.json', [{
      id: 'r04-curso',
      denominacao: '=HYPERLINK("https://example.invalid";"Abrir")',
      unidadeId: 'r04-unidade',
      situacao: 'Ativo',
    }]);
    const csv = csvPainel(await consultarPainel(usuariosR04[0], { ciclo: 'r04-ciclo-aberto' }));

    expect(csv.charCodeAt(0)).toBe(0xfeff);
    expect(csv).toContain('"Curso";"Ciclo";"Modalidade"');
    expect(csv).toContain('\r\n');
    expect(csv).toContain(`"'=HYPERLINK(""https://example.invalid"";""Abrir"")"`);
    expect(csv).not.toContain('tutorado-r04@sgoa.test');
    expect(csv).not.toContain('senha-ficticia');
  });

  it('inclui linha sem tutor quando o ciclo não tem alocações', async () => {
    gravarR03('alocacoes.json', []);
    const linhas = await consultarPainel(usuariosR04[0], { ciclo: 'r04-ciclo-aberto' });
    expect(linhas).toHaveLength(1);
    expect(linhas[0]).toMatchObject({ tutor: '', tutorId: '', alocAtivasCiclo: 0 });
    expect(csvPainel(linhas)).toContain('"Curso R04"');
  });
});
