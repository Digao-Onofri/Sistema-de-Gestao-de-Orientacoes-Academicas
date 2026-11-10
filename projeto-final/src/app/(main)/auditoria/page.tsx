import { redirect } from 'next/navigation';
import { usuarioR03 } from '@/app/libs/release03-access';
import { consultarAuditoriaBase } from '@/app/libs/release04-queries';

export const dynamic = 'force-dynamic';

export default async function AuditoriaPage({ searchParams }: { searchParams?: Promise<Record<string, string>> }) {
  const usuario = await usuarioR03();
  if (!usuario) redirect('/login');
  if (usuario.perfil !== 'Coordenador') redirect('/dashboard');

  const params = (await searchParams) || {};
  const filtros = {
    de: params.de || undefined,
    ate: params.ate || undefined,
    usuario: params.usuario || undefined,
    entidade: params.entidade || undefined,
    tipoAcao: params.tipoAcao || undefined,
  };
  const registros = await consultarAuditoriaBase(usuario, filtros);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-4 sm:p-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-slate-900">Trilha de auditoria</h1>
        <p className="text-sm text-slate-600">Apenas para coordenação.</p>
      </header>

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-slate-700 sm:px-6">Data/hora</th>
                <th className="px-4 py-2 text-left font-medium text-slate-700 sm:px-6">Usuário</th>
                <th className="px-4 py-2 text-left font-medium text-slate-700 sm:px-6">E-mail</th>
                <th className="px-4 py-2 text-left font-medium text-slate-700 sm:px-6">Entidade</th>
                <th className="px-4 py-2 text-left font-medium text-slate-700 sm:px-6">Ação</th>
                <th className="px-4 py-2 text-left font-medium text-slate-700 sm:px-6">Detalhes</th>
              </tr>
            </thead>
            <tbody>
              {registros.map((r: any) => (
                <tr key={r.id} className="border-t border-slate-200">
                  <td className="px-4 py-2 sm:px-6">{r.dataHora?.slice(0, 16).replace('T', ' ')}</td>
                  <td className="px-4 py-2 sm:px-6">{r.usuarioId}</td>
                  <td className="px-4 py-2 sm:px-6">{r.usuarioEmail}</td>
                  <td className="px-4 py-2 sm:px-6">{r.entidade}</td>
                  <td className="px-4 py-2 sm:px-6">{r.tipoAcao}</td>
                  <td className="px-4 py-2 sm:px-6">{r.detalhes || '—'}</td>
                </tr>
              ))}
              {registros.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-4 text-center text-sm text-slate-500 sm:px-6">Nenhum registro.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
