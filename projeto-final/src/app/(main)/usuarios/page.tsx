import Link from 'next/link';
import { getSession } from '@/app/libs/session';
import ConexaoBD from '@/app/libs/conexao-bd';
import { excluirUsuarioAction } from '@/app/libs/user-actions';
import DeleteButton from '@/app/components/delete-button';
import type { Usuario } from '@/app/types';

interface UsuariosPageProps {
  searchParams: Promise<{
    email?: string;
    perfil?: string;
    situacao?: string;
  }>;
}

export default async function UsuariosPage(props: UsuariosPageProps) {
  const session = await getSession();
  const searchParams = await props.searchParams;
  let usuarios = ConexaoBD.retornaDB<Usuario>('usuarios.json');

  const isCoordenador = session?.perfil === 'Coordenador';

  if (!isCoordenador) {
    usuarios = usuarios.filter((u) => u.id === session?.userId);
  } else {
    if (searchParams.email) {
      usuarios = usuarios.filter((u) =>
        u.email.toLowerCase().includes(searchParams.email!.toLowerCase())
      );
    }
    if (searchParams.perfil) {
      usuarios = usuarios.filter((u) => u.perfil === searchParams.perfil);
    }
    if (searchParams.situacao) {
      usuarios = usuarios.filter((u) => u.situacao === searchParams.situacao);
    }
  }

  usuarios.sort((a, b) => a.email.localeCompare(b.email));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Usuários Cadastrados
          </h1>
          <p className="text-sm text-slate-500">
            Controle de perfis, permissões e situação de contas (RF002 / RF008 / RF009)
          </p>
        </div>

        {isCoordenador && (
          <Link
            href="/usuarios/novo"
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            + Novo Usuário
          </Link>
        )}
      </div>

      {isCoordenador && (
        <form method="GET" className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Filtrar por E-mail
            </label>
            <input
              type="text"
              name="email"
              defaultValue={searchParams.email || ''}
              placeholder="Digite parte do e-mail..."
              className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
            />
          </div>

          <div className="w-40">
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Perfil
            </label>
            <select
              name="perfil"
              defaultValue={searchParams.perfil || ''}
              className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm bg-white"
            >
              <option value="">Todos</option>
              <option value="Coordenador">Coordenador</option>
              <option value="Tutor">Tutor</option>
              <option value="Tutorado">Tutorado</option>
            </select>
          </div>

          <div className="w-40">
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Situação
            </label>
            <select
              name="situacao"
              defaultValue={searchParams.situacao || ''}
              className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm bg-white"
            >
              <option value="">Todas</option>
              <option value="Ativa">Ativa</option>
              <option value="Inativa">Inativa</option>
            </select>
          </div>

          <button
            type="submit"
            className="rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
          >
            Filtrar
          </button>
          
          <Link
            href="/usuarios"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
          >
            Limpar
          </Link>
        </form>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-500">
            <tr>
              <th className="px-6 py-3">Nome / Usuário</th>
              <th className="px-6 py-3">E-mail Institucional</th>
              <th className="px-6 py-3">Perfil de Acesso</th>
              <th className="px-6 py-3">Situação</th>
              <th className="px-6 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {usuarios.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                  Nenhum usuário encontrado com os filtros aplicados.
                </td>
              </tr>
            ) : (
              usuarios.map((usuario) => (
                <tr key={usuario.id} className="hover:bg-slate-50/50">
                  <td className="px-6 py-4 font-medium text-slate-800">
                    {usuario.nome}
                  </td>
                  <td className="px-6 py-4">{usuario.email}</td>
                  <td className="px-6 py-4">
                    <span className="inline-block rounded px-2 py-0.5 text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                      {usuario.perfil}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {usuario.situacao === 'Ativa' ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        Ativa
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-1 text-xs font-medium text-red-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                        Inativa
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right space-x-3">
                    <Link
                      href={`/usuarios/${usuario.id}`}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                    >
                      Editar
                    </Link>
                    {isCoordenador && session?.userId !== usuario.id && (
                      <DeleteButton
                        onDelete={async () => {
                          'use server';
                          return excluirUsuarioAction(usuario.id);
                        }}
                        itemLabel={`o usuário ${usuario.nome}`}
                      />
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
