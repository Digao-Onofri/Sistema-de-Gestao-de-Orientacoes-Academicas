import type { CicloOrientacao, Curso, PeriodoLetivo, PropostaAcademica, Usuario } from '../types';
import type { SolicitacaoR03 } from './release03-model';
import { lerR03 } from './release03-store';

export type FiltrosR03 = Record<string, string | string[] | undefined>;
export function consultarSolicitacoes(u: Usuario, filtros: FiltrosR03) {
  const ciclos = lerR03<CicloOrientacao>('ciclos.json');
  const cursos = lerR03<Curso>('cursos.json'), periodos = lerR03<PeriodoLetivo>('periodos.json');
  const usuarios = lerR03<Usuario>('usuarios.json'), propostas = lerR03<PropostaAcademica>('propostas.json');
  return lerR03<SolicitacaoR03>('solicitacoes.json')
    .filter(s => (u.perfil === 'Coordenador' || (u.perfil === 'Tutorado' && s.tutoradoId === u.id) || (u.perfil === 'Tutor' && s.tutoresPreferidos.includes(u.id))))
    .map(s => {
      const ciclo = ciclos.find(c => c.id === s.cicloId);
      const curso = cursos.find(c => c.id === ciclo?.cursoId), periodo = periodos.find(p => p.id === ciclo?.periodoId);
      // Nunca retornar os objetos Usuario completos ao cliente ou exportação.
      return { ...s, ciclo, curso: curso?.denominacao ?? 'Curso indisponível', periodo: periodo?.identificacao ?? 'Período indisponível',
        proposta: s.propostaSubmetida ?? propostas.find(p => p.id === s.propostaId),
        tutorado: usuarios.find(v => v.id === s.tutoradoId)?.nome ?? 'Tutorado indisponível',
        tutores: s.tutoresPreferidos.map(id => ({ id, nome: usuarios.find(v => v.id === id)?.nome ?? 'Tutor indisponível' })),
        responsavel: usuarios.find(v => v.id === s.decisao?.tutorId)?.nome ?? '—' };
    })
    .filter(s => (!filtros.ciclo || s.cicloId === filtros.ciclo) && (!filtros.situacao || s.situacao === filtros.situacao) &&
      (!filtros.tutor || s.tutoresPreferidos.includes(String(filtros.tutor))) && (!filtros.tutorado || s.tutoradoId === filtros.tutorado) &&
      (!filtros.proposta || s.propostaId === filtros.proposta) && (!filtros.curso || s.ciclo?.cursoId === filtros.curso) &&
      (!filtros.periodo || s.ciclo?.periodoId === filtros.periodo) && (!filtros.modalidade || s.ciclo?.modalidade === filtros.modalidade))
    .sort((a, b) => b.dataSolicitacao.localeCompare(a.dataSolicitacao));
}

export function ordenarRelatorio(linhas: ReturnType<typeof consultarSolicitacoes>) {
  return linhas.sort((a, b) => a.curso.localeCompare(b.curso, 'pt-BR') || a.cicloId.localeCompare(b.cicloId) || b.dataSolicitacao.localeCompare(a.dataSolicitacao));
}

export function csvSolicitacoes(linhas: ReturnType<typeof consultarSolicitacoes>) {
  const cabecalhos = ['Ciclo', 'Curso', 'Período letivo', 'Modalidade', 'Proposta', 'Tutorado', 'Tutores preferidos', 'Situação', 'Data da solicitação', 'Tutor responsável pela decisão', 'Data da decisão', 'Resultado da decisão'];
  const celula = (valor: string) => `"${(/^[\s]*[=+@-]/.test(valor) ? "'" + valor : valor).replaceAll('"', '""')}"`;
  const linhasCsv = linhas.map(s => [s.cicloId, s.curso, s.periodo, s.ciclo?.modalidade ?? '', s.proposta?.titulo ?? 'Proposta indisponível', s.tutorado,
    s.tutores.map(t => t.nome).join(' / '), s.situacao === 'AguardandoComplementacao' ? 'Aguardando complementação' : s.situacao,
    s.dataSolicitacao, s.responsavel, s.decisao?.dataDecisao ?? '', s.decisao?.resultado === 'SolicitarComplementacao' ? 'Solicitar complementação' : s.decisao?.resultado ?? '']);
  return '\uFEFF' + [cabecalhos, ...linhasCsv].map(l => l.map(celula).join(';')).join('\r\n') + '\r\n';
}
