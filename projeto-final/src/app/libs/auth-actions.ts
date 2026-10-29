'use server';

import { redirect } from 'next/navigation';
import ConexaoBD from './conexao-bd';
import { createSessionToken, deleteSession } from './session';
import { registrarAuditoria } from './auditoria';
import { compararSenha } from './password';
import type { Usuario } from '../types';

export async function autenticarUsuario(prevState: any, formData: FormData) {
  const email = formData.get('email') as string;
  const senha = formData.get('senha') as string;

  if (!email || !senha) {
    return { erro: 'Identificador/e-mail e senha são obrigatórios.' };
  }

  const usuarios = ConexaoBD.retornaDB<Usuario>('usuarios.json');
  const usuario = usuarios.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());

  // Mensagem genérica para não vazar se o usuário existe ou não (RF001 / RNF006)
  if (!usuario || usuario.situacao !== 'Ativa') {
    return { erro: 'Credenciais inválidas ou conta inativa.' };
  }

  const senhaValida = await compararSenha(senha, usuario.senha);
  if (!senhaValida) {
    return { erro: 'Credenciais inválidas ou conta inativa.' };
  }

  await createSessionToken(usuario.id, usuario.email, usuario.perfil);
  await registrarAuditoria(usuario.id, usuario.email, 'Autenticacao', 'LOGIN', 'Login efetuado com sucesso');

  redirect('/dashboard');
}

export async function logoutAction() {
  await deleteSession();
  redirect('/login');
}
