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
