'use client';

import { useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { criarPeriodoAction } from '@/app/libs/academic-actions';

export default function NovoPeriodoPage() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(criarPeriodoAction, null);

  useEffect(() => {
    if (state?.sucesso) {
      toast.success('Período letivo criado com sucesso!');
      router.push('/periodos');
    }
  }, [state, router]);

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Novo Período Letivo</h1>
          <p className="text-sm text-slate-500">
            Definir identificação do período (RF013)
          </p>
        </div>
        <Link
          href="/periodos"
          className="text-sm font-medium text-slate-600 hover:text-slate-800"
        >
          &larr; Voltar
        </Link>
      </div>

      <form action={formAction} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
        {state?.erro && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 border border-red-200">
            {state.erro}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Identificação do Período <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="identificacao"
            required
            placeholder="ex: 2026/1 ou 2026/2"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
          <p className="mt-1 text-xs text-slate-400">
            Informe o ano e semestre acadêmico que será associado aos ciclos de orientação.
          </p>
        </div>

        <div className="pt-4 flex justify-end gap-3">
          <Link
            href="/periodos"
            className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={isPending}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {isPending ? 'Salvando...' : 'Salvar Período'}
          </button>
        </div>
      </form>
    </div>
  );
}
