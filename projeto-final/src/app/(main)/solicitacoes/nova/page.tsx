import Link from 'next/link';
import { redirect } from 'next/navigation';
import { usuarioR03 } from '@/app/libs/release03-access';
import { lerR03 } from '@/app/libs/release03-store';
import { hojeInstitucional } from '@/app/libs/release03-model';
import type { CicloOrientacao, Curso, PeriodoLetivo, PropostaAcademica, Usuario } from '@/app/types';
import { tituloCiclo, painelR03 } from '@/app/components/release03-ui';
import SolicitacaoForm from './solicitacao-form';

export default async function NovaSolicitacaoPage({ searchParams }: { searchParams: Promise<{ ciclo?: string }> }) {
  const u = await usuarioR03();
  if (!u) redirect('/login');
  if (u.perfil !== 'Tutorado') return <p>Apenas tutorados podem enviar solicitações.</p>;
  const hoje = hojeInstitucional();
  const cursos = lerR03<Curso>('cursos.json'), periodos = lerR03<PeriodoLetivo>('periodos.json');
  const ciclos = lerR03<CicloOrientacao>('ciclos.json').filter(c => c.situacao === 'Aberto' && c.prazoInicio <= hoje && c.prazoFim >= hoje)
    .sort((a, b) => a.prazoInicio.localeCompare(b.prazoInicio)).map(c => ({ ...c, titulo: tituloCiclo(c, cursos, periodos) }));
  const propostas = lerR03<PropostaAcademica>('propostas.json').filter(p => p.tutoradoId === u.id);
  const tutores = lerR03<Usuario>('usuarios.json').filter(t => t.perfil === 'Tutor' && t.situacao === 'Ativa').sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
    .map(({ id, nome, apresentacao, areasInteresse, tiposOrientacao, disponibilidade }) => ({ id, nome, apresentacao, areasInteresse, tiposOrientacao, disponibilidade }));
  return <div className="mx-auto max-w-2xl space-y-6"><div className="flex justify-between"><h1 className="text-2xl font-bold text-slate-800">Nova solicitação</h1><Link href="/solicitacoes" className="text-blue-600">Voltar</Link></div>
    {!ciclos.length ? <p className={painelR03}>Não há ciclos abertos dentro do prazo. <Link href="/ciclos" className="text-blue-700">Consultar ciclos</Link></p> : <SolicitacaoForm ciclos={ciclos} propostas={propostas} tutores={tutores} cicloInicial={(await searchParams).ciclo ?? ''}/>}
  </div>;
}
