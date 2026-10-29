'use client';

import { useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { criarCursoAction } from '@/app/libs/academic-actions';
import type { UnidadeAcademica } from '@/app/types';

export default function NovoCursoForm({
  unidades,
}: {
  unidades: UnidadeAcademica[];
}) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(criarCursoAction, null);

  useEffect(() => {
    if (state?.sucesso) {
      toast.success('Curso cadastrado com sucesso!');
      router.push('/cursos');
    }
  }, [state, router]);

  return (
    <form action={formAction} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
      {state?.erro && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 border border-red-200">
          {state.erro}
        </div>
      )}

      {unidades.length === 0 && (
        <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800 border border-amber-200">
          Atenção: Nenhuma unidade acadêmica cadastrada. Por favor,{' '}
          <Link href="/unidades/nova" className="font-semibold underline">
            cadastre uma unidade primeiro
          </Link>.
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Denominação do Curso <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="denominacao"
          required
          placeholder="ex: Bacharelado em Sistemas de Informação"
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Unidade Acadêmica Relacionada <span className="text-red-500">*</span>
        </label>
        <select
          name="unidadeId"
          required
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm bg-white focus:border-blue-500 focus:outline-none"
        >
          <option value="">Selecione uma unidade...</option>
          {unidades.map((u) => (
            <option key={u.id} value={u.id}>
              {u.denominacao}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Situação do Curso (RF011)
        </label>
        <select
          name="situacao"
          defaultValue="Ativo"
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm bg-white focus:border-blue-500 focus:outline-none"
        >
          <option value="Ativo">Ativo (Permite abertura de ciclos de orientação)</option>
          <option value="Inativo">Inativo (Bloqueia novos ciclos, preserva histórico)</option>
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
          disabled={isPending || unidades.length === 0}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {isPending ? 'Salvando...' : 'Salvar Curso'}
        </button>
      </div>
    </form>
  );
}
