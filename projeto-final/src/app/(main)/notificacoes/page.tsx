import { redirect } from 'next/navigation';
import { usuarioR03 } from '@/app/libs/release03-access';
import { consultarNotificacoesBase } from '@/app/libs/release04-queries';

export const dynamic = 'force-dynamic';

export default async function NotificacoesPage({ searchParams }: { searchParams?: Promise<Record<string, string>> }) {
  const usuario = await usuarioR03();
  if (!usuario) redirect('/login');

  const params = (await searchParams) || {};
  const filtros = { tipo: params.tipo || undefined, de: params.de || undefined, ate: params.ate || undefined };
  const notificacoes = await consultarNotificacoesBase(usuario, filtros);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-4 sm:p-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-slate-900">Notificações</h1>
        <p className="text-sm text-slate-600">Somente suas notificações.</p>
      </header>

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-slate-700 sm:px-6">Data/hora</th>
                <th className="px-4 py-2 text-left font-medium text-slate-700 sm:px-6">Tipo</th>
                <th className="px-4 py-2 text-left font-medium text-slate-700 sm:px-6">Descrição</th>
                <th className="px-4 py-2 text-left font-medium text-slate-700 sm:px-6">Referência</th>
              </tr>
            </thead>
            <tbody>
              {notificacoes.map((n: any) => (
                <tr key={n.id} className="border-t border-slate-200">
                  <td className="px-4 py-2 sm:px-6">{n.dataHora?.slice(0, 16).replace('T', ' ')}</td>
                  <td className="px-4 py-2 sm:px-6">{n.tipoEvento}</td>
                  <td className="px-4 py-2 sm:px-6">{n.descricao}</td>
                  <td className="px-4 py-2 sm:px-6">{n.referencia || '—'}</td>
                </tr>
              ))}
              {notificacoes.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-4 text-center text-sm text-slate-500 sm:px-6">Nenhuma notificação.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
