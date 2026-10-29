import { notFound } from 'next/navigation';
import ConexaoBD from '@/app/libs/conexao-bd';
import type { PeriodoLetivo } from '@/app/types';
import EditPeriodoForm from './edit-periodo-form';

interface EditPeriodoPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditPeriodoPage(props: EditPeriodoPageProps) {
  const params = await props.params;
  const periodos = ConexaoBD.retornaDB<PeriodoLetivo>('periodos.json');
  const periodo = periodos.find((p) => p.id === params.id);

  if (!periodo) {
    notFound();
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <EditPeriodoForm periodo={periodo} />
    </div>
  );
}
