'use client';

import { useTransition } from 'react';
import toast from 'react-hot-toast';

interface DeleteButtonProps {
  onDelete: () => Promise<{ erro?: string; sucesso?: boolean }>;
  itemLabel?: string;
}

export default function DeleteButton({ onDelete, itemLabel = 'este item' }: DeleteButtonProps) {
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    if (!confirm(`Tem certeza que deseja excluir ${itemLabel}? Esta ação não pode ser desfeita.`)) {
      return;
    }

    startTransition(async () => {
      const res = await onDelete();
      if (res?.erro) {
        toast.error(res.erro);
      } else {
        toast.success(`${itemLabel} excluído com sucesso!`);
      }
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className="text-xs font-semibold text-red-600 hover:text-red-800 disabled:opacity-50 transition-colors"
    >
      {isPending ? 'Excluindo...' : 'Excluir'}
    </button>
  );
}
