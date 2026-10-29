'use client';

import { useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { criarUsuarioAction } from '@/app/libs/user-actions';

export default function NovoUsuarioPage() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(criarUsuarioAction, null);

  useEffect(() => {
    if (state?.sucesso) {
      toast.success('Usuário incluído com sucesso!');
      router.push('/usuarios');
    }
  }, [state, router]);

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Novo Usuário</h1>
          <p className="text-sm text-slate-500">
            Cadastrar usuário institucional e definir perfil (RF002)
          </p>
        </div>
        <Link
          href="/usuarios"
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
            Nome Completo <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="nome"
            required
            placeholder="ex: Prof. Lucas Barbosa"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            E-mail Institucional ou Identificador <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            name="email"
            required
            placeholder="ex: lucas@unifei.edu.br"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Senha Provisória <span className="text-red-500">*</span>
          </label>
          <input
            type="password"
            name="senha"
            required
            placeholder="••••••••"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Perfil de Acesso <span className="text-red-500">*</span>
            </label>
            <select
              name="perfil"
              required
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm bg-white focus:border-blue-500 focus:outline-none"
            >
              <option value="Tutorado">Tutorado (Estudante)</option>
              <option value="Tutor">Tutor (Docente)</option>
              <option value="Coordenador">Coordenador</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Situação Inicial
            </label>
            <select
              name="situacao"
              defaultValue="Ativa"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm bg-white focus:border-blue-500 focus:outline-none"
            >
              <option value="Ativa">Ativa</option>
              <option value="Inativa">Inativa</option>
            </select>
          </div>
        </div>

        <div className="pt-4 flex justify-end gap-3">
          <Link
            href="/usuarios"
            className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={isPending}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {isPending ? 'Salvando...' : 'Salvar Usuário'}
          </button>
        </div>
      </form>
    </div>
  );
}
