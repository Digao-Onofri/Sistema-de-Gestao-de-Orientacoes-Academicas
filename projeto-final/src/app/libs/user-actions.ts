'use server';

import { revalidatePath } from 'next/cache';
import { v4 as uuidv4 } from 'uuid';
import ConexaoBD from './conexao-bd';
import { getSession } from './session';
import { registrarAuditoria } from './auditoria';
import { hashSenha } from './password';
import type { Usuario, Perfil, SituacaoConta } from '../types';

export async function criarUsuarioAction(prevState: any, formData: FormData) {
  const session = await getSession();
  if (!session || session.perfil !== 'Coordenador') {
    return { erro: 'Apenas coordenadores podem incluir novos usuários (RF002).' };
  }

  const nome = (formData.get('nome') as string)?.trim();
  const email = (formData.get('email') as string)?.trim().toLowerCase();
  const senha = formData.get('senha') as string;
  const perfil = formData.get('perfil') as Perfil;
  const situacao = (formData.get('situacao') as SituacaoConta) || 'Ativa';

  if (!email || !senha || !perfil || !nome) {
    return { erro: 'Preencha todos os campos obrigatórios.' };
  }

  const usuarios = ConexaoBD.retornaDB<Usuario>('usuarios.json');
  const existe = usuarios.some((u) => u.email.toLowerCase() === email);

  if (existe) {
    return { erro: 'Este e-mail/identificador institucional já está associado a outra conta.' };
  }

  const senhaCriptografada = await hashSenha(senha);
  const novoUsuario: Usuario = {
    id: uuidv4(),
    nome,
    email,
    senha: senhaCriptografada,
    perfil,
    situacao,
  };

  usuarios.push(novoUsuario);
  ConexaoBD.armazenaDB('usuarios.json', usuarios);

  await registrarAuditoria(
    session.userId,
    session.email,
    'Usuario',
    'CRIACAO',
    `Usuário ${email} criado com perfil ${perfil}`
  );

  revalidatePath('/usuarios');
  return { sucesso: true };
}

export async function alterarUsuarioAction(prevState: any, formData: FormData) {
  const session = await getSession();
  if (!session) {
    return { erro: 'Não autorizado.' };
  }

  const id = formData.get('id') as string;
  const nome = (formData.get('nome') as string)?.trim();
  const email = (formData.get('email') as string)?.trim().toLowerCase();
  const perfil = formData.get('perfil') as Perfil;
  const situacao = formData.get('situacao') as SituacaoConta;

  const usuarios = ConexaoBD.retornaDB<Usuario>('usuarios.json');
  const index = usuarios.findIndex((u) => u.id === id);

  if (index === -1) {
    return { erro: 'Usuário não encontrado.' };
  }

  // Se não for coordenador, só pode alterar o próprio nome
  if (session.perfil !== 'Coordenador' && session.userId !== id) {
    return { erro: 'Você não tem permissão para alterar dados de outros usuários.' };
  }

  // Validação de e-mail duplicado
  if (email && email !== usuarios[index].email) {
    const existe = usuarios.some((u) => u.id !== id && u.email.toLowerCase() === email);
    if (existe) {
      return { erro: 'O e-mail informado já pertence a outro usuário.' };
    }
    usuarios[index].email = email;
  }

  if (nome) usuarios[index].nome = nome;

  // Apenas coordenador pode alterar perfil ou situação da conta (RF007 e RF008)
  if (session.perfil === 'Coordenador') {
    if (perfil) usuarios[index].perfil = perfil;
    if (situacao) usuarios[index].situacao = situacao;
  }

  ConexaoBD.armazenaDB('usuarios.json', usuarios);

  await registrarAuditoria(
    session.userId,
    session.email,
    'Usuario',
    'EDICAO',
    `Dados do usuário ${usuarios[index].email} atualizados.`
  );

  revalidatePath('/usuarios');
  return { sucesso: true };
}

export async function excluirUsuarioAction(id: string) {
  const session = await getSession();
  if (!session || session.perfil !== 'Coordenador') {
    return { erro: 'Apenas coordenadores podem excluir usuários.' };
  }

  if (session.userId === id) {
    return { erro: 'Você não pode excluir sua própria conta conectada.' };
  }

  const usuarios = ConexaoBD.retornaDB<Usuario>('usuarios.json');
  const usuario = usuarios.find((u) => u.id === id);
  if (!usuario) {
    return { erro: 'Usuário não encontrado.' };
  }

  const novosUsuarios = usuarios.filter((u) => u.id !== id);
  ConexaoBD.armazenaDB('usuarios.json', novosUsuarios);

  await registrarAuditoria(
    session.userId,
    session.email,
    'Usuario',
    'EXCLUSAO',
    `Usuário ${usuario.email} removido do sistema.`
  );

  revalidatePath('/usuarios');
  return { sucesso: true };
}
