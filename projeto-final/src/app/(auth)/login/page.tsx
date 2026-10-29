'use client';

import { useActionState } from 'react';
import { autenticarUsuario } from '@/app/libs/auth-actions';

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(autenticarUsuario, null);

  return (
    <div>
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-slate-800">SGOA</h1>
        <p className="text-sm text-slate-500 mt-1">
          Sistema de Gestão de Orientações Acadêmicas
        </p>
      </div>

      <form action={formAction} className="space-y-4">
        {state?.erro && (
          <div
            role="alert"
            className="rounded-lg bg-red-50 p-3 text-sm text-red-700 border border-red-200"
          >
            {state.erro}
          </div>
        )}

        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-slate-700 mb-1"
          >
            E-mail ou Identificador Institucional <span className="text-red-500">*</span>
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            placeholder="ex: admin@sgoa.edu"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div>
          <label
            htmlFor="senha"
            className="block text-sm font-medium text-slate-700 mb-1"
          >
            Senha <span className="text-red-500">*</span>
          </label>
          <input
            id="senha"
            name="senha"
            type="password"
            required
            placeholder="••••••••"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {isPending ? 'Entrando...' : 'Entrar'}
        </button>
      </form>

      <div className="mt-6 rounded-md bg-slate-50 p-3 border border-slate-200 text-xs text-slate-500">
        <p className="font-semibold text-slate-700 mb-1">Acesso inicial de demonstração:</p>
        <p>E-mail: <code className="text-blue-600">admin@sgoa.edu</code></p>
        <p>Senha: <code className="text-blue-600">admin123</code></p>
      </div>
    </div>
  );
}
