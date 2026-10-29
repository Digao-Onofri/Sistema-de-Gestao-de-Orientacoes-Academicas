import Link from 'next/link';
import { getSession } from '@/app/libs/session';
import ConexaoBD from '@/app/libs/conexao-bd';
import { excluirPropostaAction } from '@/app/libs/proposal-actions';
import DeleteButton from '@/app/components/delete-button';
import type { PropostaAcademica, Usuario } from '@/app/types';

export default async function PropostasPage() {
  const session = await getSession();
  const propostas = ConexaoBD.retornaDB<PropostaAcademica>('propostas.json');
  const usuarios = ConexaoBD.retornaDB<Usuario>('usuarios.json');

  const isCoordenador = session?.perfil === 'Coordenador';

  // Coordenador vê todas, outros veem as suas
  const lista = isCoordenador
    ? propostas
    : propostas.filter((p) => p.tutoradoId === session?.userId);

  const getAutorNome = (tutoradoId: string) => {
    return usuarios.find((u) => u.id === tutoradoId)?.nome || 'Autor não identificado';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Propostas Acadêmicas (TCC / IC)
          </h1>
          <p className="text-sm text-slate-500">
            Registro e gerenciamento de temas e propostas de pesquisa (RF005 / RF016)
          </p>
        </div>

        <Link
          href="/propostas/nova"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          + Nova Proposta
        </Link>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-500">
            <tr>
              <th className="px-6 py-3">Título da Proposta</th>
              <th className="px-6 py-3">Modalidade</th>
              <th className="px-6 py-3">Autor (Tutorado)</th>
              <th className="px-6 py-3">Palavras-chave</th>
              <th className="px-6 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {lista.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                  Nenhuma proposta acadêmica cadastrada ainda.
                </td>
              </tr>
            ) : (
              lista.map((proposta) => (
                <tr key={proposta.id} className="hover:bg-slate-50/50">
                  <td className="px-6 py-4 font-semibold text-slate-800 max-w-xs truncate">
                    {proposta.titulo}
                    <p className="text-xs text-slate-400 font-normal line-clamp-1 mt-0.5">
                      {proposta.resumo}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-block rounded px-2 py-0.5 text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                      {proposta.tipo}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-700">
                    {getAutorNome(proposta.tutoradoId)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {proposta.palavrasChave?.map((kw, i) => (
                        <span key={i} className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">
                          {kw}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right space-x-3">
                    {(isCoordenador || proposta.tutoradoId === session?.userId) && (
                      <>
                        <Link
                          href={`/propostas/${proposta.id}`}
                          className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                        >
                          Editar
                        </Link>
                        <DeleteButton
                          onDelete={async () => {
                            'use server';
                            return excluirPropostaAction(proposta.id);
                          }}
                          itemLabel={`a proposta "${proposta.titulo}"`}
                        />
                      </>
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
