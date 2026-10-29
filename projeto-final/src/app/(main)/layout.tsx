import Link from 'next/link';
import { getSession } from '../libs/session';
import { logoutAction } from '../libs/auth-actions';

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  return (
    <div className="flex min-h-screen bg-slate-100">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-100 flex flex-col justify-between p-4">
        <div>
          <div className="mb-6 px-2">
            <h2 className="text-xl font-bold tracking-tight text-white">SGOA</h2>
            <p className="text-xs text-slate-400">SIS-TUTOR-001 | UNIFEI</p>
          </div>

          <nav className="space-y-1">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-slate-800 text-slate-300 hover:text-white"
            >
              📊 Painel Inicial
            </Link>

            <div className="pt-4 pb-1 text-xs font-semibold text-slate-400 uppercase tracking-wider px-3">
              Módulos do Sistema
            </div>

            <Link
              href="/usuarios"
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-slate-800 text-slate-300 hover:text-white"
            >
              👥 Usuários (RF002/09)
            </Link>

            <Link
              href="/cursos"
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-slate-800 text-slate-300 hover:text-white"
            >
              🎓 Cursos & Unidades (RF011/12)
            </Link>

            <Link
              href="/periodos"
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-slate-800 text-slate-300 hover:text-white"
            >
              📅 Períodos Letivos (RF013/14)
            </Link>

            <Link
              href="/propostas"
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-slate-800 text-slate-300 hover:text-white"
            >
              📝 Propostas TCC / IC (RF005/16)
            </Link>
          </nav>
        </div>

        {/* Informações do usuário logado e logout */}
        <div className="border-t border-slate-800 pt-4">
          <div className="mb-3 px-2">
            <p className="text-xs text-slate-400">Conectado como:</p>
            <p className="text-sm font-medium text-white truncate">{session?.email}</p>
            <span className="inline-block mt-1 rounded bg-blue-900/60 text-blue-300 border border-blue-700/50 px-2 py-0.5 text-xs font-semibold">
              {session?.perfil}
            </span>
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              className="w-full text-left rounded-md px-3 py-2 text-sm font-medium text-red-400 hover:bg-red-950/40 hover:text-red-300 transition-colors"
            >
              🚪 Encerrar Sessão
            </button>
          </form>
        </div>
      </aside>

      {/* Conteúdo Principal */}
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="mx-auto max-w-5xl">
          {children}
        </div>
      </main>
    </div>
  );
}
