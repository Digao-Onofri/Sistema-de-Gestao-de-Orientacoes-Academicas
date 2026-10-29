'use server';

import { revalidatePath } from 'next/cache';
import { v4 as uuidv4 } from 'uuid';
import ConexaoBD from './conexao-bd';
import { getSession } from './session';
import { registrarAuditoria } from './auditoria';
import type { PropostaAcademica, TipoOrientacao } from '../types';

export async function criarPropostaAction(prevState: any, formData: FormData) {
  const session = await getSession();
  if (!session) {
    return { erro: 'Usuário não autenticado.' };
  }

  const titulo = (formData.get('titulo') as string)?.trim();
  const resumo = (formData.get('resumo') as string)?.trim();
  const palavrasChaveRaw = (formData.get('palavrasChave') as string)?.trim();
  const tipo = formData.get('tipo') as TipoOrientacao;

  if (!titulo || !resumo || !tipo) {
    return { erro: 'Título, resumo e tipo da proposta são obrigatórios (RF005).' };
  }

  const palavrasChave = palavrasChaveRaw
    ? palavrasChaveRaw.split(',').map((p) => p.trim()).filter(Boolean)
    : [];

  const propostas = ConexaoBD.retornaDB<PropostaAcademica>('propostas.json');
  const nova: PropostaAcademica = {
    id: uuidv4(),
    tutoradoId: session.userId,
    titulo,
    resumo,
    palavrasChave,
    tipo,
  };

  propostas.push(nova);
  ConexaoBD.armazenaDB('propostas.json', propostas);

  await registrarAuditoria(
    session.userId,
    session.email,
    'PropostaAcademica',
    'CRIACAO',
    `Proposta "${titulo}" (${tipo}) criada.`
  );

  revalidatePath('/propostas');
  return { sucesso: true };
}

export async function alterarPropostaAction(prevState: any, formData: FormData) {
  const session = await getSession();
  if (!session) {
    return { erro: 'Usuário não autenticado.' };
  }

  const id = formData.get('id') as string;
  const titulo = (formData.get('titulo') as string)?.trim();
  const resumo = (formData.get('resumo') as string)?.trim();
  const palavrasChaveRaw = (formData.get('palavrasChave') as string)?.trim();
  const tipo = formData.get('tipo') as TipoOrientacao;

  if (!titulo || !resumo || !tipo) {
    return { erro: 'Título, resumo e tipo da proposta são obrigatórios (RF016).' };
  }

  const propostas = ConexaoBD.retornaDB<PropostaAcademica>('propostas.json');
  const index = propostas.findIndex((p) => p.id === id);
  if (index === -1) {
    return { erro: 'Proposta não encontrada.' };
  }

  // Apenas o autor ou Coordenador pode editar
  if (session.perfil !== 'Coordenador' && propostas[index].tutoradoId !== session.userId) {
    return { erro: 'Você não tem permissão para editar esta proposta.' };
  }

  const palavrasChave = palavrasChaveRaw
    ? palavrasChaveRaw.split(',').map((p) => p.trim()).filter(Boolean)
    : [];

  propostas[index].titulo = titulo;
  propostas[index].resumo = resumo;
  propostas[index].palavrasChave = palavrasChave;
  propostas[index].tipo = tipo;

  ConexaoBD.armazenaDB('propostas.json', propostas);

  await registrarAuditoria(
    session.userId,
    session.email,
    'PropostaAcademica',
    'EDICAO',
    `Proposta "${titulo}" alterada.`
  );

  revalidatePath('/propostas');
  return { sucesso: true };
}

export async function excluirPropostaAction(id: string) {
  const session = await getSession();
  if (!session) {
    return { erro: 'Não autenticado.' };
  }

  const propostas = ConexaoBD.retornaDB<PropostaAcademica>('propostas.json');
  const proposta = propostas.find((p) => p.id === id);
  if (!proposta) return { erro: 'Proposta não encontrada.' };

  if (session.perfil !== 'Coordenador' && proposta.tutoradoId !== session.userId) {
    return { erro: 'Você só pode excluir suas próprias propostas.' };
  }

  const novasPropostas = propostas.filter((p) => p.id !== id);
  ConexaoBD.armazenaDB('propostas.json', novasPropostas);

  await registrarAuditoria(
    session.userId,
    session.email,
    'PropostaAcademica',
    'EXCLUSAO',
    `Proposta "${proposta.titulo}" excluída.`
  );

  revalidatePath('/propostas');
  return { sucesso: true };
}
