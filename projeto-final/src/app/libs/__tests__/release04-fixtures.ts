import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { afterEach, beforeEach, vi } from 'vitest';
import type {
  AlocacaoOrientacao,
  CicloOrientacao,
  Curso,
  EtapaAcompanhamento,
  NotificacaoInterna,
  PeriodoLetivo,
  PropostaAcademica,
  RegistroAuditoria,
  RegistroReuniao,
  SolicitacaoOrientacao,
  Usuario,
} from '../../types';
import { gravarR03 } from '../release03-store';

type SessionMock = {
  mockReset(): void;
  mockResolvedValue(value: unknown): void;
};

export const usuariosR04: Usuario[] = [
  {
    id: 'r04-coord',
    nome: 'Coordenação R04',
    email: 'coord-r04@sgoa.test',
    senha: 'senha-ficticia-coord',
    perfil: 'Coordenador',
    situacao: 'Ativa',
  },
  {
    id: 'r04-tutor',
    nome: 'Tutor R04',
    email: 'tutor-r04@sgoa.test',
    senha: 'senha-ficticia-tutor',
    perfil: 'Tutor',
    situacao: 'Ativa',
    limiteOrientandos: 3,
    tiposOrientacao: ['TCC', 'IC'],
  },
  {
    id: 'r04-tutor-sem-limite',
    nome: 'Tutor sem limite R04',
    email: 'sem-limite-r04@sgoa.test',
    senha: 'senha-ficticia-tutor',
    perfil: 'Tutor',
    situacao: 'Ativa',
  },
  {
    id: 'r04-outro-tutor',
    nome: 'Outro tutor R04',
    email: 'outro-tutor-r04@sgoa.test',
    senha: 'senha-ficticia-tutor',
    perfil: 'Tutor',
    situacao: 'Ativa',
    limiteOrientandos: 3,
  },
  {
    id: 'r04-tutor-inativo',
    nome: 'Tutor inativo R04',
    email: 'inativo-r04@sgoa.test',
    senha: 'senha-ficticia-tutor',
    perfil: 'Tutor',
    situacao: 'Inativa',
    limiteOrientandos: 3,
  },
  {
    id: 'r04-tutorado',
    nome: 'Tutorado R04',
    email: 'tutorado-r04@sgoa.test',
    senha: 'senha-ficticia-tutorado',
    perfil: 'Tutorado',
    situacao: 'Ativa',
  },
  {
    id: 'r04-outro-tutorado',
    nome: 'Outro tutorado R04',
    email: 'outro-r04@sgoa.test',
    senha: 'senha-ficticia-tutorado',
    perfil: 'Tutorado',
    situacao: 'Ativa',
  },
  {
    id: 'r04-tutorado-inativo',
    nome: 'Tutorado inativo R04',
    email: 'tutorado-inativo-r04@sgoa.test',
    senha: 'senha-ficticia-tutorado',
    perfil: 'Tutorado',
    situacao: 'Inativa',
  },
];

export const ciclosR04: CicloOrientacao[] = [
  {
    id: 'r04-ciclo-aberto',
    cursoId: 'r04-curso',
    periodoId: 'r04-periodo',
    modalidade: 'TCC',
    prazoInicio: '2026-01-01',
    prazoFim: '2099-12-31',
    elegibilidade: 'Dados fictícios para teste',
    regras: 'Dados fictícios para teste',
    situacao: 'Aberto',
  },
  {
    id: 'r04-ciclo-encerrado',
    cursoId: 'r04-curso',
    periodoId: 'r04-periodo',
    modalidade: 'TCC',
    prazoInicio: '2026-01-01',
    prazoFim: '2026-12-31',
    elegibilidade: 'Dados fictícios para teste',
    regras: 'Dados fictícios para teste',
    situacao: 'Encerrado',
  },
  {
    id: 'r04-ciclo-rascunho',
    cursoId: 'r04-curso',
    periodoId: 'r04-periodo',
    modalidade: 'TCC',
    prazoInicio: '2026-01-01',
    prazoFim: '2099-12-31',
    elegibilidade: 'Dados fictícios para teste',
    regras: 'Dados fictícios para teste',
    situacao: 'Rascunho',
  },
];

export const propostasR04: PropostaAcademica[] = [
  {
    id: 'r04-proposta',
    tutoradoId: 'r04-tutorado',
    titulo: 'Proposta R04',
    resumo: 'Resumo fictício',
    palavrasChave: ['teste'],
    tipo: 'TCC',
  },
  {
    id: 'r04-proposta-2',
    tutoradoId: 'r04-outro-tutorado',
    titulo: 'Outra proposta R04',
    resumo: 'Resumo fictício',
    palavrasChave: ['teste'],
    tipo: 'TCC',
  },
  {
    id: 'r04-proposta-ic',
    tutoradoId: 'r04-tutorado',
    titulo: 'Proposta IC R04',
    resumo: 'Resumo fictício',
    palavrasChave: ['teste'],
    tipo: 'IC',
  },
];

export const alocacaoAtivaR04: AlocacaoOrientacao = {
  id: 'r04-alocacao',
  tutorId: 'r04-tutor',
  tutoradoId: 'r04-tutorado',
  propostaId: 'r04-proposta',
  cicloId: 'r04-ciclo-aberto',
  situacao: 'Ativa',
  dataConfirmacao: '2026-11-05T12:00:00.000Z',
  coordenadorId: 'r04-coord',
};

export function formR04(campos: Record<string, string>) {
  const dados = new FormData();
  Object.entries(campos).forEach(([chave, valor]) => dados.set(chave, valor));
  return dados;
}

export function autenticarR04(sessao: SessionMock, id: string) {
  const usuario = obterUsuarioR04(id);
  sessao.mockResolvedValue({ userId: usuario.id, perfil: usuario.perfil, email: usuario.email });
}

export function obterUsuarioR04(id: string) {
  const usuario = usuariosR04.find((item) => item.id === id);
  if (!usuario) throw new Error(`Usuário de teste desconhecido: ${id}`);
  return usuario;
}

export function configurarDadosR04(sessao: SessionMock) {
  let diretorio: string;

  beforeEach(() => {
    sessao.mockReset();
    diretorio = path.join(os.tmpdir(), `sgoa-r04-test-${randomUUID()}`);
    vi.stubEnv('SGOA_DATA_DIR', diretorio);
    gravarR03('usuarios.json', usuariosR04);
    gravarR03('cursos.json', [{
      id: 'r04-curso',
      denominacao: 'Curso R04',
      unidadeId: 'r04-unidade',
      situacao: 'Ativo',
    } satisfies Curso]);
    gravarR03('periodos.json', [{
      id: 'r04-periodo',
      identificacao: '2099/1',
    } satisfies PeriodoLetivo]);
    gravarR03('ciclos.json', ciclosR04);
    gravarR03('propostas.json', propostasR04);
    gravarR03('solicitacoes.json', [{
      id: 'r04-solicitacao',
      cicloId: 'r04-ciclo-aberto',
      propostaId: 'r04-proposta',
      tutoradoId: 'r04-tutorado',
      tutoresPreferidos: ['r04-tutor'],
      situacao: 'Pendente',
      dataSolicitacao: '2026-11-05T12:00:00.000Z',
    } satisfies SolicitacaoOrientacao]);
    gravarR03('alocacoes.json', [alocacaoAtivaR04]);
    gravarR03('etapas.json', [{
      id: 'r04-etapa',
      alocacaoId: alocacaoAtivaR04.id,
      descricao: 'Etapa fictícia',
      responsavel: 'Tutor R04',
      prazo: '2026-11-10',
      situacao: 'Pendente',
    } satisfies EtapaAcompanhamento]);
    gravarR03('reunioes.json', [{
      id: 'r04-reuniao',
      alocacaoId: alocacaoAtivaR04.id,
      data: '2026-11-05',
      resumo: 'Resumo fictício',
      encaminhamentos: 'Encaminhamento fictício',
      proximoContato: '2026-11-04',
    } satisfies RegistroReuniao]);
    gravarR03('notificacoes.json', [
      {
        id: 'r04-notificacao-propria',
        usuarioId: 'r04-tutor',
        tipoEvento: 'AlocacaoConfirmada',
        descricao: 'Notificação fictícia',
        dataHora: '2026-11-05T12:00:00.000Z',
        referencia: alocacaoAtivaR04.id,
        lida: false,
      },
      {
        id: 'r04-notificacao-alheia',
        usuarioId: 'r04-tutorado',
        tipoEvento: 'AlocacaoConfirmada',
        descricao: 'Notificação fictícia de outro perfil',
        dataHora: '2026-11-05T12:00:00.000Z',
        lida: false,
      },
    ] satisfies NotificacaoInterna[]);
    gravarR03('auditoria.json', [{
      id: 'r04-auditoria',
      dataHora: '2026-11-05T12:00:00.000Z',
      usuarioId: 'r04-coord',
      usuarioEmail: 'coord-r04@sgoa.test',
      entidade: 'AlocacaoOrientacao',
      tipoAcao: 'CONFIRMACAO',
      detalhes: 'Registro fictício',
    } satisfies RegistroAuditoria]);
    autenticarR04(sessao, 'r04-coord');
  });

  afterEach(() => {
    if (diretorio) fs.rmSync(diretorio, { recursive: true, force: true });
    vi.unstubAllEnvs();
  });
}
