import { notFound } from 'next/navigation';
import ConexaoBD from '@/app/libs/conexao-bd';
import { getSession } from '@/app/libs/session';
import type { PropostaAcademica } from '@/app/types';
import EditPropostaForm from './edit-proposta-form';

interface EditPropostaPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditPropostaPage(props: EditPropostaPageProps) {
  const session = await getSession();
  const params = await props.params;

  const propostas = ConexaoBD.retornaDB<PropostaAcademica>('propostas.json');
  const proposta = propostas.find((p) => p.id === params.id);

  if (!proposta) {
    notFound();
  }

  const isCoordenador = session?.perfil === 'Coordenador';
  const isOwner = proposta.tutoradoId === session?.userId;

  if (!isCoordenador && !isOwner) {
    return (
      <div className="p-6 bg-red-50 text-red-700 rounded-xl border border-red-200">
        Você não possui permissão para editar esta proposta acadêmica.
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <EditPropostaForm proposta={proposta} />
    </div>
  );
}
