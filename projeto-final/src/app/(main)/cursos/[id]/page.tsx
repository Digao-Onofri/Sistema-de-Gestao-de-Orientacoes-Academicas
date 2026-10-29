import { notFound } from 'next/navigation';
import ConexaoBD from '@/app/libs/conexao-bd';
import type { Curso, UnidadeAcademica } from '@/app/types';
import EditCursoForm from './edit-curso-form';

interface EditCursoPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditCursoPage(props: EditCursoPageProps) {
  const params = await props.params;
  const cursos = ConexaoBD.retornaDB<Curso>('cursos.json');
  const unidades = ConexaoBD.retornaDB<UnidadeAcademica>('unidades.json');

  const curso = cursos.find((c) => c.id === params.id);
  if (!curso) {
    notFound();
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <EditCursoForm curso={curso} unidades={unidades} />
    </div>
  );
}
