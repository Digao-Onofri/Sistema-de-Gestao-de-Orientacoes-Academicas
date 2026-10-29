'use client';

import { useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { alterarPeriodoAction } from '@/app/libs/academic-actions';
import type { PeriodoLetivo } from '@/app/types';

export default function EditPeriodoForm({ periodo }: { periodo: PeriodoLetivo }) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(alterarPeriodoAction, null);

  useEffect(() => {
    if (state?.sucesso) {
      toast.success('Período letivo atualizado com sucesso!');
      router.push('/periodos');
    }
  }, [state, router]);

  return (
    <div>
      <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Editar Período Letivo</h1>
          <p className="text-sm text-slate-500">
            Atualização de identificação sem perda de vínculos históricos (RF014)
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
        <input type="hidden" name="id" value={periodo.id} />

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
            defaultValue={periodo.identificacao}
            required
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
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
            {isPending ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </form>
    </div>
  );
}
