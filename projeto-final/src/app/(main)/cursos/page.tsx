import Link from 'next/link';
import { getSession } from '@/app/libs/session';
import ConexaoBD from '@/app/libs/conexao-bd';
import { excluirCursoAction, excluirUnidadeAction } from '@/app/libs/academic-actions';
import DeleteButton from '@/app/components/delete-button';
import type { Curso, UnidadeAcademica } from '@/app/types';

export default async function CursosPage() {
  const session = await getSession();
  const cursos = ConexaoBD.retornaDB<Curso>('cursos.json');
  const unidades = ConexaoBD.retornaDB<UnidadeAcademica>('unidades.json');

  const isCoordenador = session?.perfil === 'Coordenador';

  const getUnidadeNome = (id: string) => {
    return unidades.find((u) => u.id === id)?.denominacao || 'Unidade desconhecida';
  };

  return (
    <div className="space-y-8">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Estrutura Acadêmica: Cursos e Unidades
          </h1>
          <p className="text-sm text-slate-500">
            Gerenciamento de cursos ofertados e unidades vinculadas (RF003 / RF011 / RF012)
          </p>
        </div>

        {isCoordenador && (
          <div className="flex gap-2">
            <Link
              href="/unidades/nova"
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              + Nova Unidade
            </Link>
            <Link
              href="/cursos/novo"
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              + Novo Curso
            </Link>
          </div>
        )}
      </div>

      {/* Seção de Unidades Cadastradas */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-800">
          Unidades Acadêmicas (Departamentos/Institutos)
        </h2>
        {unidades.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 bg-white">
            Nenhuma unidade acadêmica cadastrada ainda.
            {isCoordenador && (
              <span className="block mt-1">
                Cadastre ao menos uma unidade antes de incluir cursos!
              </span>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {unidades.map((u) => (
              <div key={u.id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <div>
                  <span className="text-xs uppercase font-semibold text-slate-400">Unidade</span>
                  <p className="font-semibold text-slate-800 mt-0.5">{u.denominacao}</p>
                </div>
                {isCoordenador && (
                  <DeleteButton
                    onDelete={async () => {
                      'use server';
                      return excluirUnidadeAction(u.id);
                    }}
                    itemLabel={`a unidade ${u.denominacao}`}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Seção de Cursos */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-800">
          Cursos Ofertados
        </h2>
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-500">
              <tr>
                <th className="px-6 py-3">Curso</th>
                <th className="px-6 py-3">Unidade Acadêmica Relacionada</th>
                <th className="px-6 py-3">Situação</th>
                {isCoordenador && <th className="px-6 py-3 text-right">Ações</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {cursos.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-400">
                    Nenhum curso cadastrado ainda.
                  </td>
                </tr>
              ) : (
                cursos.map((curso) => (
                  <tr key={curso.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4 font-medium text-slate-800">
                      {curso.denominacao}
                    </td>
                    <td className="px-6 py-4">
                      {getUnidadeNome(curso.unidadeId)}
                    </td>
                    <td className="px-6 py-4">
                      {curso.situacao === 'Ativo' ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          Ativo (Ofertável em Ciclos)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                          <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                          Inativo
                        </span>
                      )}
                    </td>
                    {isCoordenador && (
                      <td className="px-6 py-4 text-right space-x-3">
                        <Link
                          href={`/cursos/${curso.id}`}
                          className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                        >
                          Editar
                        </Link>
                        <DeleteButton
                          onDelete={async () => {
                            'use server';
                            return excluirCursoAction(curso.id);
                          }}
                          itemLabel={`o curso ${curso.denominacao}`}
                        />
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
