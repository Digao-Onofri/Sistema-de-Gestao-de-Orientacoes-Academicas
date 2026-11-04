import Link from 'next/link';
import { redirect } from 'next/navigation';
import { usuarioR03 } from '@/app/libs/release03-access';
import { consultarSolicitacoes, type FiltrosR03 } from '@/app/libs/release03-queries';
import { FiltrosSolicitacoes, ListaSolicitacoes } from '@/app/components/release03-solicitacoes';

export default async function SolicitacoesPage({ searchParams }: { searchParams: Promise<FiltrosR03> }) {
  const u = await usuarioR03();
  if (!u) redirect('/login');
  const filtros = await searchParams;
  return <div className="space-y-6"><div className="flex justify-between border-b border-slate-200 pb-4"><div><h1 className="text-2xl font-bold text-slate-800">Solicitações de orientação</h1><p className="text-sm text-slate-500">{u.perfil === 'Tutor' ? 'Solicitações recebidas e decisões' : u.perfil === 'Tutorado' ? 'Acompanhe suas solicitações e os resultados' : 'Consulta administrativa das solicitações'}</p></div>{u.perfil === 'Tutorado' && <Link href="/solicitacoes/nova" className="text-blue-600">Nova solicitação</Link>}</div>
    <FiltrosSolicitacoes usuario={u} filtros={filtros}/><ListaSolicitacoes linhas={consultarSolicitacoes(u, filtros)} tutorId={u.perfil === 'Tutor' ? u.id : undefined} tutoradoId={u.perfil === 'Tutorado' ? u.id : undefined}/>
  </div>;
}
