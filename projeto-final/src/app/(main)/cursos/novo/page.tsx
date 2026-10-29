import Link from 'next/link';
import ConexaoBD from '@/app/libs/conexao-bd';
import type { UnidadeAcademica } from '@/app/types';
import NovoCursoForm from './novo-curso-form';

export default async function NovoCursoPage() {
  const unidades = ConexaoBD.retornaDB<UnidadeAcademica>('unidades.json');

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Novo Curso</h1>
          <p className="text-sm text-slate-500">
            Cadastrar curso e vincular à sua respectiva unidade acadêmica (RF011)
          </p>
        </div>
        <Link
          href="/cursos"
          className="text-sm font-medium text-slate-600 hover:text-slate-800"
        >
          &larr; Voltar
        </Link>
      </div>

      <NovoCursoForm unidades={unidades} />
    </div>
  );
}
