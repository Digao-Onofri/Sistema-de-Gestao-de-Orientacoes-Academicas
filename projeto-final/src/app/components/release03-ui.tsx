import type { CicloOrientacao, Curso, PeriodoLetivo } from '../types';
import { rotuloSituacao } from '../libs/release03-model';

export const campoR03 = 'w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none';
export const painelR03 = 'rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4';
export function CampoR03({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return <label className="block space-y-1 text-sm font-medium text-slate-700"><span>{titulo}</span>{children}</label>;
}
export function tituloCiclo(c: CicloOrientacao, cursos: Curso[], periodos: PeriodoLetivo[]) {
  return `${cursos.find(v => v.id === c.cursoId)?.denominacao ?? 'Curso indisponível'} · ${periodos.find(v => v.id === c.periodoId)?.identificacao ?? 'Período indisponível'} · ${c.modalidade}`;
}
export function SituacaoR03({ valor }: { valor: string }) {
  return <span className="inline-block rounded-md bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-800">{rotuloSituacao(valor)}</span>;
}
export function dataR03(valor?: string) {
  if (!valor) return '—';
  return new Date(valor.length === 10 ? `${valor}T12:00:00-03:00` : valor).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', ...(valor.length === 10 ? { dateStyle: 'short' } : { dateStyle: 'short', timeStyle: 'short' }) });
}
