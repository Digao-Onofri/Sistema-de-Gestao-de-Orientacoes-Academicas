'use client';

import { useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { ResultadoAcao } from '../libs/release03-model';

export default function FormR03({ action, children, rotulo = 'Salvar', destino, confirmacao, confirmarQuando }: {
  action: (estado: ResultadoAcao, dados: FormData) => Promise<ResultadoAcao>;
  children: React.ReactNode; rotulo?: string; destino?: string;
  confirmacao?: string; confirmarQuando?: { campo: string; valor: string };
}) {
  const [estado, enviar, pendente] = useActionState(action, null);
  const router = useRouter();
  useEffect(() => { if (estado?.sucesso) { if (destino) router.push(destino); else router.refresh(); } }, [estado, destino, router]);
  return <form action={enviar} className="space-y-4" onSubmit={evento => {
    const deveConfirmar = !confirmarQuando || new FormData(evento.currentTarget).get(confirmarQuando.campo) === confirmarQuando.valor;
    if (confirmacao && deveConfirmar && !window.confirm(confirmacao)) evento.preventDefault();
  }}>
    {estado?.erro && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{estado.erro}</p>}
    {estado?.sucesso && <p role="status" className="rounded-lg bg-green-50 p-3 text-sm text-green-800">{estado.mensagem ?? 'Operação realizada com sucesso.'}</p>}
    <fieldset disabled={pendente} className="space-y-4">{children}</fieldset>
    <button disabled={pendente} className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">{pendente ? 'Salvando...' : rotulo}</button>
  </form>;
}
