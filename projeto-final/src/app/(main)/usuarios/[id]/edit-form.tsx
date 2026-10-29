'use client';

import { useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { alterarUsuarioAction } from '@/app/libs/user-actions';
import type { Usuario } from '@/app/types';

export default function EditUserForm({
  usuario,
  isCoordenador,
}: {
  usuario: Usuario;
  isCoordenador: boolean;
}) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(alterarUsuarioAction, null);

  useEffect(() => {
    if (state?.sucesso) {
      toast.success('Dados atualizados com sucesso!');
      router.push('/usuarios');
    }
  }, [state, router]);

  return (
    <div>
      <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Editar Usuário</h1>
          <p className="text-sm text-slate-500">
            Atualização de dados e situação da conta (RF007 / RF008)
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
        <input type="hidden" name="id" value={usuario.id} />

        {state?.erro && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 border border-red-200">
            {state.erro}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Nome Completo
          </label>
          <input
            type="text"
            name="nome"
            defaultValue={usuario.nome}
            required
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            E-mail Institucional
          </label>
          <input
            type="email"
            name="email"
            defaultValue={usuario.email}
            required
            disabled={!isCoordenador}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none disabled:bg-slate-50 disabled:text-slate-500"
          />
        </div>

        {isCoordenador ? (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Perfil de Acesso
              </label>
              <select
                name="perfil"
                defaultValue={usuario.perfil}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm bg-white"
              >
                <option value="Tutorado">Tutorado</option>
                <option value="Tutor">Tutor</option>
                <option value="Coordenador">Coordenador</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Situação da Conta (RF008)
              </label>
              <select
                name="situacao"
                defaultValue={usuario.situacao}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm bg-white"
              >
                <option value="Ativa">Ativa</option>
                <option value="Inativa">Inativa</option>
              </select>
            </div>
          </div>
        ) : (
          <div className="text-xs text-slate-500">
            Situação da conta: <strong>{usuario.situacao}</strong> | Perfil: <strong>{usuario.perfil}</strong>
          </div>
        )}

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
            {isPending ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </form>
    </div>
  );
}
