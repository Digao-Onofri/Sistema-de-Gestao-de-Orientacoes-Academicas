'use client';

import { useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { alterarPropostaAction } from '@/app/libs/proposal-actions';
import type { PropostaAcademica } from '@/app/types';

export default function EditPropostaForm({ proposta }: { proposta: PropostaAcademica }) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(alterarPropostaAction, null);

  useEffect(() => {
    if (state?.sucesso) {
      toast.success('Proposta atualizada com sucesso!');
      router.push('/propostas');
    }
  }, [state, router]);

  return (
    <div>
      <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Editar Proposta Acadêmica</h1>
          <p className="text-sm text-slate-500">
            Alteração de título, modalidade, resumo e palavras-chave (RF016)
          </p>
        </div>
        <Link
          href="/propostas"
          className="text-sm font-medium text-slate-600 hover:text-slate-800"
        >
          &larr; Voltar
        </Link>
      </div>

      <form action={formAction} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <input type="hidden" name="id" value={proposta.id} />

        {state?.erro && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 border border-red-200">
            {state.erro}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Título da Proposta <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="titulo"
            defaultValue={proposta.titulo}
            required
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Modalidade / Tipo da Proposta <span className="text-red-500">*</span>
          </label>
          <select
            name="tipo"
            defaultValue={proposta.tipo}
            required
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm bg-white focus:border-blue-500 focus:outline-none"
          >
            <option value="TCC">Trabalho de Conclusão de Curso (TCC)</option>
            <option value="IC">Iniciação Científica (IC)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Resumo da Proposta <span className="text-red-500">*</span>
          </label>
          <textarea
            name="resumo"
            rows={4}
            defaultValue={proposta.resumo}
            required
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Palavras-chave (separadas por vírgula)
          </label>
          <input
            type="text"
            name="palavrasChave"
            defaultValue={proposta.palavrasChave?.join(', ') || ''}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div className="pt-4 flex justify-end gap-3">
          <Link
            href="/propostas"
            className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={isPending}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {isPending ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </form>
    </div>
  );
}
