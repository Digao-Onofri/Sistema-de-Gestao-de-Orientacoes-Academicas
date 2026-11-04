import { redirect } from 'next/navigation';
import { usuarioR03 } from '@/app/libs/release03-access';
import { consultarSolicitacoes, ordenarRelatorio, type FiltrosR03 } from '@/app/libs/release03-queries';
import { FiltrosSolicitacoes, ListaSolicitacoes } from '@/app/components/release03-solicitacoes';

export default async function RelatorioPage({ searchParams }: { searchParams: Promise<FiltrosR03> }) {
  const u = await usuarioR03();
  if (!u) redirect('/login');
  if (u.perfil !== 'Coordenador') return <p>Acesso restrito à coordenação.</p>;
  const filtros = await searchParams;
  const parametros = new URLSearchParams();
  for (const [chave, valor] of Object.entries(filtros)) if (typeof valor === 'string') parametros.set(chave, valor);
  const linhas = ordenarRelatorio(consultarSolicitacoes(u, filtros));
  return <div className="space-y-6"><h1 className="text-2xl font-bold text-slate-800">Relatório inicial de solicitações</h1><p className="text-sm text-slate-500">Consulta por curso e ciclo, com exportação CSV dos mesmos resultados.</p>
    <FiltrosSolicitacoes usuario={u} filtros={filtros}/><div className="flex justify-between"><p>{linhas.length} solicitação(ões)</p><a href={`/relatorio-solicitacoes/csv?${parametros}`} className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white">Exportar CSV</a></div>
    <ListaSolicitacoes linhas={linhas}/>
  </div>;
}
