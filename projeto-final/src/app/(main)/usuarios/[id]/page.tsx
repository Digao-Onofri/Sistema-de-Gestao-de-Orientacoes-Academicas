import { notFound } from 'next/navigation';
import ConexaoBD from '@/app/libs/conexao-bd';
import { getSession } from '@/app/libs/session';
import type { Usuario } from '@/app/types';
import EditUserForm from './edit-form';

interface EditUserPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditUserPage(props: EditUserPageProps) {
  const session = await getSession();
  const params = await props.params;

  const usuarios = ConexaoBD.retornaDB<Usuario>('usuarios.json');
  const usuario = usuarios.find((u) => u.id === params.id);

  if (!usuario) {
    notFound();
  }

  const isCoordenador = session?.perfil === 'Coordenador';
  const isSelf = session?.userId === usuario.id;

  if (!isCoordenador && !isSelf) {
    return (
      <div className="p-6 bg-red-50 text-red-700 rounded-xl border border-red-200">
        Você não possui permissão para acessar ou modificar esta conta.
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <EditUserForm usuario={usuario} isCoordenador={isCoordenador} />
    </div>
  );
}
