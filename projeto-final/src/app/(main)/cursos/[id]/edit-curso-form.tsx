'use client';

import { useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { alterarCursoAction } from '@/app/libs/academic-actions';
import type { Curso, UnidadeAcademica } from '@/app/types';

export default function EditCursoForm({
  curso,
  unidades,
}: {
  curso: Curso;
  unidades: UnidadeAcademica[];
}) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(alterarCursoAction, null);

  useEffect(() => {
    if (state?.sucesso) {
      toast.success('Curso atualizado com sucesso!');
      router.push('/cursos');
    }
  }, [state, router]);

  return (
    <div>
      <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Editar Curso</h1>
          <p className="text-sm text-slate-500">
            Atualização de denominação, unidade e situação (RF012)
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
        <input type="hidden" name="id" value={curso.id} />

        {state?.erro && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 border border-red-200">
            {state.erro}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Denominação do Curso <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="denominacao"
            defaultValue={curso.denominacao}
            required
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Unidade Acadêmica Relacionada <span className="text-red-500">*</span>
          </label>
          <select
            name="unidadeId"
            defaultValue={curso.unidadeId}
            required
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm bg-white focus:border-blue-500 focus:outline-none"
          >
            {unidades.map((u) => (
              <option key={u.id} value={u.id}>
                {u.denominacao}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Situação do Curso (RF012)
          </label>
          <select
            name="situacao"
            defaultValue={curso.situacao}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm bg-white focus:border-blue-500 focus:outline-none"
          >
            <option value="Ativo">Ativo</option>
            <option value="Inativo">Inativo (Bloqueia oferta em novos ciclos)</option>
          </select>
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
            {isPending ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </form>
    </div>
  );
}
