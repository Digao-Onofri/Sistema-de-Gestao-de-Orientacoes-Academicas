'use client';

import { useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { criarUnidadeAction } from '@/app/libs/academic-actions';

export default function NovaUnidadePage() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(criarUnidadeAction, null);

  useEffect(() => {
    if (state?.sucesso) {
      toast.success('Unidade acadêmica incluída com sucesso!');
      router.push('/cursos');
    }
  }, [state, router]);

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Nova Unidade Acadêmica</h1>
          <p className="text-sm text-slate-500">
            Cadastrar departamento ou instituto de vinculação (RF003)
          </p>
        </div>
        <Link
          href="/cursos"
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
            Denominação da Unidade <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="denominacao"
            required
            placeholder="ex: Instituto de Engenharia de Sistemas e Tecnologia da Informação (IESTI)"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div className="pt-4 flex justify-end gap-3">
          <Link
            href="/cursos"
            className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={isPending}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {isPending ? 'Salvando...' : 'Salvar Unidade'}
          </button>
        </div>
      </form>
    </div>
  );
}
