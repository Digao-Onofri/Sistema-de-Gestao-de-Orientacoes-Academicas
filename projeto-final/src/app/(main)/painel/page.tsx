import { redirect } from 'next/navigation';
import { usuarioR03 } from '@/app/libs/release03-access';
import { consultarPainel } from '@/app/libs/release04-queries';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function PainelPage({ searchParams }: { searchParams?: Promise<Record<string, string>> }) {
  const usuario = await usuarioR03();
  if (!usuario) redirect('/login');
  if (usuario.perfil !== 'Coordenador') redirect('/dashboard');

  const params = (await searchParams) || {};
  const filtros = { curso: params.curso || undefined, ciclo: params.ciclo || undefined };
  const linhas = await consultarPainel(usuario, filtros);

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 sm:p-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Painel gerencial</h1>
          <p className="text-sm text-slate-600">Indicadores por curso/ciclo/tutor.</p>
        </div>
        <Link href={`/painel/csv?${new URLSearchParams(filtros as any).toString()}`} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white">Exportar CSV</Link>
      </header>

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-slate-700 sm:px-6">Curso</th>
                <th className="px-4 py-2 text-left font-medium text-slate-700 sm:px-6">Ciclo</th>
                <th className="px-4 py-2 text-left font-medium text-slate-700 sm:px-6">Modalidade</th>
                <th className="px-4 py-2 text-left font-medium text-slate-700 sm:px-6">Tutor</th>
                <th className="px-4 py-2 text-left font-medium text-slate-700 sm:px-6">Limite</th>
                <th className="px-4 py-2 text-left font-medium text-slate-700 sm:px-6">Orientandos no ciclo</th>
                <th className="px-4 py-2 text-left font-medium text-slate-700 sm:px-6">Vagas globais</th>
                <th className="px-4 py-2 text-left font-medium text-slate-700 sm:px-6">Pendentes</th>
                <th className="px-4 py-2 text-left font-medium text-slate-700 sm:px-6">Aceitas</th>
                <th className="px-4 py-2 text-left font-medium text-slate-700 sm:px-6">Recusadas</th>
                <th className="px-4 py-2 text-left font-medium text-slate-700 sm:px-6">Aguardando</th>
                <th className="px-4 py-2 text-left font-medium text-slate-700 sm:px-6">Canceladas</th>
                <th className="px-4 py-2 text-left font-medium text-slate-700 sm:px-6">Ativas</th>
                <th className="px-4 py-2 text-left font-medium text-slate-700 sm:px-6">Encerradas</th>
                <th className="px-4 py-2 text-left font-medium text-slate-700 sm:px-6">Canceladas (aloc)</th>
              </tr>
            </thead>
            <tbody>
              {linhas.map((l, i) => (
                <tr key={i} className="border-t border-slate-200">
                  <td className="px-4 py-2 sm:px-6">{l.curso}</td>
                  <td className="px-4 py-2 sm:px-6">{l.periodo}</td>
                  <td className="px-4 py-2 sm:px-6">{l.modalidade}</td>
                  <td className="px-4 py-2 sm:px-6">{l.tutor || '—'}</td>
                  <td className="px-4 py-2 sm:px-6">{l.limite}</td>
                  <td className="px-4 py-2 sm:px-6">{l.orientandosCiclo}</td>
                  <td className="px-4 py-2 sm:px-6">{l.vagasGlobais}</td>
                  <td className="px-4 py-2 sm:px-6">{l.Pendente || 0}</td>
                  <td className="px-4 py-2 sm:px-6">{l.Aceita || 0}</td>
                  <td className="px-4 py-2 sm:px-6">{l.Recusada || 0}</td>
                  <td className="px-4 py-2 sm:px-6">{l.AguardandoComplementacao || 0}</td>
                  <td className="px-4 py-2 sm:px-6">{l.Cancelada || 0}</td>
                  <td className="px-4 py-2 sm:px-6">{l.alocAtivasCiclo || 0}</td>
                  <td className="px-4 py-2 sm:px-6">{l.alocEncerradasCiclo || 0}</td>
                  <td className="px-4 py-2 sm:px-6">{l.alocCanceladasCiclo || 0}</td>
                </tr>
              ))}
              {linhas.length === 0 ? (
                <tr>
                  <td colSpan={15} className="px-4 py-4 text-center text-sm text-slate-500 sm:px-6">Sem dados.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
