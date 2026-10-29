import Link from 'next/link';
import { getSession } from '@/app/libs/session';
import ConexaoBD from '@/app/libs/conexao-bd';
import { excluirPeriodoAction } from '@/app/libs/academic-actions';
import DeleteButton from '@/app/components/delete-button';
import type { PeriodoLetivo } from '@/app/types';

export default async function PeriodosPage() {
  const session = await getSession();
  const periodos = ConexaoBD.retornaDB<PeriodoLetivo>('periodos.json');
  const isCoordenador = session?.perfil === 'Coordenador';

  periodos.sort((a, b) => b.identificacao.localeCompare(a.identificacao));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Períodos Letivos
          </h1>
          <p className="text-sm text-slate-500">
            Cadastro e manutenção dos períodos acadêmicos para ciclos de orientação (RF013 / RF014)
          </p>
        </div>

        {isCoordenador && (
          <Link
            href="/periodos/novo"
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            + Novo Período
          </Link>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-500">
            <tr>
              <th className="px-6 py-3">Identificação do Período</th>
              <th className="px-6 py-3">Finalidade no SGOA</th>
              {isCoordenador && <th className="px-6 py-3 text-right">Ações</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {periodos.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-6 py-8 text-center text-slate-400">
                  Nenhum período letivo cadastrado ainda.
                </td>
              </tr>
            ) : (
              periodos.map((periodo) => (
                <tr key={periodo.id} className="hover:bg-slate-50/50">
                  <td className="px-6 py-4 font-semibold text-slate-800">
                    {periodo.identificacao}
                  </td>
                  <td className="px-6 py-4 text-slate-500 text-xs">
                    Vigência para abertura e controle de ciclos de TCC/IC
                  </td>
                  {isCoordenador && (
                    <td className="px-6 py-4 text-right space-x-3">
                      <Link
                        href={`/periodos/${periodo.id}`}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                      >
                        Editar
                      </Link>
                      <DeleteButton
                        onDelete={async () => {
                          'use server';
                          return excluirPeriodoAction(periodo.id);
                        }}
                        itemLabel={`o período ${periodo.identificacao}`}
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
  );
}
