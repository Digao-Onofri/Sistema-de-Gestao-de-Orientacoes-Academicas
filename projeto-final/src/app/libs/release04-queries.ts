import type { AlocacaoOrientacao, CicloOrientacao, Curso, EtapaAcompanhamento, NotificacaoInterna, PeriodoLetivo, PropostaAcademica, RegistroAuditoria, RegistroReuniao, Usuario } from '../types';
import type { AlocacaoR04, EtapaR04 } from './release04-model';
import { lerR03 } from './release03-store';
import { usuarioR03 } from './release03-access';

export type FiltrosAlocacoesR04 = {
  curso?: string;
  ciclo?: string;
  tutor?: string;
  tutorado?: string;
  situacao?: string;
};

export type FiltrosEtapasR04 = {
  alocacao?: string;
  proposta?: string;
  responsavel?: string;
  situacao?: string;
};

export type FiltrosReunioesR04 = {
  alocacao?: string;
  de?: string;
  ate?: string;
};

export type FiltrosNotificacoesR04 = {
  tipo?: string;
  de?: string;
  ate?: string;
};

export type FiltrosPainelR04 = {
  curso?: string;
  ciclo?: string;
};

export type FiltrosAuditoriaR04 = {
  de?: string;
  ate?: string;
  usuario?: string;
  entidade?: string;
  tipoAcao?: string;
};

export type ProjecaoAlocacaoR04 = {
  id: string;
  tutorId: string;
  tutorNome?: string;
  tutoradoId: string;
  tutoradoNome?: string;
  propostaId: string;
  propostaTitulo?: string;
  propostaTipo?: string;
  cursoId?: string;
  cursoNome?: string;
  cicloId: string;
  periodoIdentificacao?: string;
  modalidade?: string;
  situacao: string;
  dataConfirmacao: string;
  motivo?: string;
  dataEncerramento?: string;
  dataCancelamento?: string;
  coordenadorId?: string;
  solicitacaoId?: string;
  responsavelAcaoId?: string;
};

export async function consultarAlocacoesBase(u: Usuario, filtros: FiltrosAlocacoesR04) {
  // Consulta base para RF031 - filtros e projeção conforme plano
  const alocacoes = lerR03<AlocacaoR04>('alocacoes.json');
  const usuarios = lerR03<Usuario>('usuarios.json');
  const propostas = lerR03<PropostaAcademica>('propostas.json');
  const ciclos = lerR03<CicloOrientacao>('ciclos.json');
  const cursos = lerR03<Curso>('cursos.json');
  const periodos = lerR03<PeriodoLetivo>('periodos.json');

  let resultado = alocacoes.filter((a) => {
    if (u.perfil === 'Coordenador') return true;
    if (u.perfil === 'Tutor') return a.tutorId === u.id;
    if (u.perfil === 'Tutorado') return a.tutoradoId === u.id;
    return false;
  });

  if (filtros.curso) {
    resultado = resultado.filter((a) => {
      const c = ciclos.find((x) => x.id === a.cicloId);
      return c?.cursoId === filtros.curso;
    });
  }
  if (filtros.ciclo) {
    resultado = resultado.filter((a) => a.cicloId === filtros.ciclo);
  }
  if (filtros.tutor) {
    resultado = resultado.filter((a) => a.tutorId === filtros.tutor);
  }
  if (filtros.tutorado) {
    resultado = resultado.filter((a) => a.tutoradoId === filtros.tutorado);
  }
  if (filtros.situacao) {
    resultado = resultado.filter((a) => a.situacao === filtros.situacao);
  }

  return resultado
    .map((a) => {
      const tutor = usuarios.find((u2) => u2.id === a.tutorId);
      const tutorado = usuarios.find((u2) => u2.id === a.tutoradoId);
      const proposta = propostas.find((p) => p.id === a.propostaId);
      const ciclo = ciclos.find((c) => c.id === a.cicloId);
      const curso = ciclo ? cursos.find((cur) => cur.id === ciclo.cursoId) : undefined;
      const periodo = ciclo ? periodos.find((p) => p.id === ciclo.periodoId) : undefined;
      const proj: ProjecaoAlocacaoR04 = {
        id: a.id,
        tutorId: a.tutorId,
        tutorNome: tutor?.nome,
        tutoradoId: a.tutoradoId,
        tutoradoNome: tutorado?.nome,
        propostaId: a.propostaId,
        propostaTitulo: proposta?.titulo,
        propostaTipo: proposta?.tipo,
        cursoId: ciclo?.cursoId,
        cursoNome: curso?.denominacao,
        cicloId: a.cicloId,
        periodoIdentificacao: periodo?.identificacao,
        modalidade: ciclo?.modalidade,
        situacao: a.situacao,
        dataConfirmacao: a.dataConfirmacao,
        motivo: a.motivo,
        dataEncerramento: a.dataEncerramento,
        dataCancelamento: (a as AlocacaoR04).dataCancelamento,
        coordenadorId: a.coordenadorId,
        solicitacaoId: (a as AlocacaoR04).solicitacaoId,
        responsavelAcaoId: (a as AlocacaoR04).responsavelAcaoId,
      };
      return proj;
    })
    .sort((x, y) => y.dataConfirmacao.localeCompare(x.dataConfirmacao) || x.id.localeCompare(y.id));
}

export const consultarAlocacoes = consultarAlocacoesBase;

export async function consultarEtapasBase(u: Usuario, filtros: FiltrosEtapasR04) {
  const etapas = lerR03<EtapaR04>('etapas.json');
  const alocacoes = lerR03<AlocacaoR04>('alocacoes.json');
  const propostas = lerR03<PropostaAcademica>('propostas.json');

  let resultado = etapas.filter((e) => {
    const a = alocacoes.find((al) => al.id === e.alocacaoId);
    if (!a) return false;
    if (u.perfil === 'Coordenador') return true;
    if (u.perfil === 'Tutor') return a.tutorId === u.id;
    if (u.perfil === 'Tutorado') return a.tutoradoId === u.id;
    return false;
  });

  if (filtros.alocacao) {
    resultado = resultado.filter((e) => e.alocacaoId === filtros.alocacao);
  }
  if (filtros.proposta) {
    resultado = resultado.filter((e) => {
      const a = alocacoes.find((al) => al.id === e.alocacaoId);
      return a?.propostaId === filtros.proposta;
    });
  }
  if (filtros.responsavel) {
    const r = filtros.responsavel.toLowerCase();
    resultado = resultado.filter((e) => e.responsavel?.toLowerCase().includes(r));
  }
  if (filtros.situacao) {
    resultado = resultado.filter((e) => e.situacao === filtros.situacao);
  }

  return resultado.sort((x, y) => x.prazo.localeCompare(y.prazo) || x.id.localeCompare(y.id));
}

export const consultarEtapas = consultarEtapasBase;

export async function consultarReunioesBase(u: Usuario, filtros: FiltrosReunioesR04) {
  const reunioes = lerR03<RegistroReuniao>('reunioes.json');
  const alocacoes = lerR03<AlocacaoR04>('alocacoes.json');

  let resultado = reunioes.filter((r) => {
    const a = alocacoes.find((al) => al.id === r.alocacaoId);
    if (!a) return false;
    if (u.perfil === 'Coordenador') return true;
    if (u.perfil === 'Tutor') return a.tutorId === u.id;
    if (u.perfil === 'Tutorado') return a.tutoradoId === u.id;
    return false;
  });

  if (filtros.alocacao) {
    resultado = resultado.filter((r) => r.alocacaoId === filtros.alocacao);
  }
  if (filtros.de) {
    resultado = resultado.filter((r) => r.data >= filtros.de!);
  }
  if (filtros.ate) {
    resultado = resultado.filter((r) => r.data <= filtros.ate!);
  }

  return resultado.sort((x, y) => y.data.localeCompare(x.data) || x.id.localeCompare(y.id));
}

export const consultarReunioes = consultarReunioesBase;

export async function consultarNotificacoesBase(u: Usuario, filtros: FiltrosNotificacoesR04) {
  const notificacoes = lerR03<NotificacaoInterna>('notificacoes.json');
  let resultado = notificacoes.filter((n) => n.usuarioId === u.id);

  if (filtros.tipo) {
    resultado = resultado.filter((n) => n.tipoEvento === filtros.tipo);
  }
  if (filtros.de) {
    resultado = resultado.filter((n) => n.dataHora.slice(0, 10) >= filtros.de!);
  }
  if (filtros.ate) {
    resultado = resultado.filter((n) => n.dataHora.slice(0, 10) <= filtros.ate!);
  }

  return resultado.sort((x, y) => y.dataHora.localeCompare(x.dataHora) || x.id.localeCompare(y.id));
}

export const consultarNotificacoes = consultarNotificacoesBase;

export async function consultarAuditoriaBase(u: Usuario, filtros: FiltrosAuditoriaR04) {
  if (u.perfil !== 'Coordenador') return [];
  const auditoria = lerR03<RegistroAuditoria>('auditoria.json');
  let resultado = auditoria;

  if (filtros.de) {
    resultado = resultado.filter((a) => a.dataHora.slice(0, 10) >= filtros.de!);
  }
  if (filtros.ate) {
    resultado = resultado.filter((a) => a.dataHora.slice(0, 10) <= filtros.ate!);
  }
  if (filtros.usuario) {
    resultado = resultado.filter((a) => a.usuarioId === filtros.usuario);
  }
  if (filtros.entidade) {
    resultado = resultado.filter((a) => a.entidade === filtros.entidade);
  }
  if (filtros.tipoAcao) {
    resultado = resultado.filter((a) => a.tipoAcao === filtros.tipoAcao);
  }

  return resultado.sort((x, y) => y.dataHora.localeCompare(x.dataHora) || x.id.localeCompare(y.id));
}

export const consultarAuditoria = consultarAuditoriaBase;
