'use server';

import { revalidatePath } from 'next/cache';
import { v4 as uuidv4 } from 'uuid';
import ConexaoBD from './conexao-bd';
import { getSession } from './session';
import { registrarAuditoria } from './auditoria';
import type { UnidadeAcademica, Curso, PeriodoLetivo, SituacaoCurso } from '../types';

// ======================= UNIDADES (RF003 / RF010) =======================
export async function criarUnidadeAction(prevState: any, formData: FormData) {
  const session = await getSession();
  if (!session || session.perfil !== 'Coordenador') {
    return { erro: 'Apenas coordenadores podem incluir unidades acadêmicas (RF003).' };
  }

  const denominacao = (formData.get('denominacao') as string)?.trim();
  if (!denominacao) {
    return { erro: 'A denominação da unidade acadêmica é obrigatória.' };
  }

  const unidades = ConexaoBD.retornaDB<UnidadeAcademica>('unidades.json');
  const nova: UnidadeAcademica = {
    id: uuidv4(),
    denominacao,
  };

  unidades.push(nova);
  ConexaoBD.armazenaDB('unidades.json', unidades);

  await registrarAuditoria(
    session.userId,
    session.email,
    'UnidadeAcademica',
    'CRIACAO',
    `Unidade ${denominacao} criada.`
  );

  revalidatePath('/cursos');
  return { sucesso: true };
}

export async function excluirUnidadeAction(id: string) {
  const session = await getSession();
  if (!session || session.perfil !== 'Coordenador') {
    return { erro: 'Apenas coordenadores podem excluir unidades acadêmicas.' };
  }

  const cursos = ConexaoBD.retornaDB<Curso>('cursos.json');
  const temCurso = cursos.some((c) => c.unidadeId === id);
  if (temCurso) {
    return { erro: 'Não é possível excluir esta unidade pois existem cursos vinculados a ela.' };
  }

  const unidades = ConexaoBD.retornaDB<UnidadeAcademica>('unidades.json');
  const unidade = unidades.find((u) => u.id === id);
  if (!unidade) return { erro: 'Unidade não encontrada.' };

  const novasUnidades = unidades.filter((u) => u.id !== id);
  ConexaoBD.armazenaDB('unidades.json', novasUnidades);

  await registrarAuditoria(
    session.userId,
    session.email,
    'UnidadeAcademica',
    'EXCLUSAO',
    `Unidade ${unidade.denominacao} excluída.`
  );

  revalidatePath('/cursos');
  return { sucesso: true };
}

// ======================= CURSOS (RF011 / RF012) =======================
export async function criarCursoAction(prevState: any, formData: FormData) {
  const session = await getSession();
  if (!session || session.perfil !== 'Coordenador') {
    return { erro: 'Apenas coordenadores podem incluir cursos (RF011).' };
  }

  const denominacao = (formData.get('denominacao') as string)?.trim();
  const unidadeId = formData.get('unidadeId') as string;
  const situacao = (formData.get('situacao') as SituacaoCurso) || 'Ativo';

  if (!denominacao || !unidadeId) {
    return { erro: 'Denominação e unidade acadêmica são obrigatórias.' };
  }

  const unidades = ConexaoBD.retornaDB<UnidadeAcademica>('unidades.json');
  const unidadeExiste = unidades.some((u) => u.id === unidadeId);
  if (!unidadeExiste) {
    return { erro: 'A unidade acadêmica selecionada não existe.' };
  }

  const cursos = ConexaoBD.retornaDB<Curso>('cursos.json');
  const novo: Curso = {
    id: uuidv4(),
    denominacao,
    unidadeId,
    situacao,
  };

  cursos.push(novo);
  ConexaoBD.armazenaDB('cursos.json', cursos);

  await registrarAuditoria(
    session.userId,
    session.email,
    'Curso',
    'CRIACAO',
    `Curso ${denominacao} criado com situação ${situacao}.`
  );

  revalidatePath('/cursos');
  return { sucesso: true };
}

export async function alterarCursoAction(prevState: any, formData: FormData) {
  const session = await getSession();
  if (!session || session.perfil !== 'Coordenador') {
    return { erro: 'Apenas coordenadores podem alterar cursos (RF012).' };
  }

  const id = formData.get('id') as string;
  const denominacao = (formData.get('denominacao') as string)?.trim();
  const unidadeId = formData.get('unidadeId') as string;
  const situacao = formData.get('situacao') as SituacaoCurso;

  if (!denominacao || !unidadeId || !situacao) {
    return { erro: 'Todos os campos são obrigatórios.' };
  }

  const cursos = ConexaoBD.retornaDB<Curso>('cursos.json');
  const index = cursos.findIndex((c) => c.id === id);
  if (index === -1) {
    return { erro: 'Curso não encontrado.' };
  }

  cursos[index].denominacao = denominacao;
  cursos[index].unidadeId = unidadeId;
  cursos[index].situacao = situacao;

  ConexaoBD.armazenaDB('cursos.json', cursos);

  await registrarAuditoria(
    session.userId,
    session.email,
    'Curso',
    'EDICAO',
    `Curso ${denominacao} atualizado (situação: ${situacao}).`
  );

  revalidatePath('/cursos');
  return { sucesso: true };
}

export async function excluirCursoAction(id: string) {
  const session = await getSession();
  if (!session || session.perfil !== 'Coordenador') {
    return { erro: 'Apenas coordenadores podem excluir cursos.' };
  }

  const cursos = ConexaoBD.retornaDB<Curso>('cursos.json');
  const curso = cursos.find((c) => c.id === id);
  if (!curso) return { erro: 'Curso não encontrado.' };

  const novosCursos = cursos.filter((c) => c.id !== id);
  ConexaoBD.armazenaDB('cursos.json', novosCursos);

  await registrarAuditoria(
    session.userId,
    session.email,
    'Curso',
    'EXCLUSAO',
    `Curso ${curso.denominacao} excluído.`
  );

  revalidatePath('/cursos');
  return { sucesso: true };
}

// ======================= PERÍODOS LETIVOS (RF013 / RF014) =======================
export async function criarPeriodoAction(prevState: any, formData: FormData) {
  const session = await getSession();
  if (!session || session.perfil !== 'Coordenador') {
    return { erro: 'Apenas coordenadores podem incluir períodos letivos (RF013).' };
  }

  const identificacao = (formData.get('identificacao') as string)?.trim();
  if (!identificacao) {
    return { erro: 'A identificação do período letivo é obrigatória.' };
  }

  const periodos = ConexaoBD.retornaDB<PeriodoLetivo>('periodos.json');
  const existe = periodos.some((p) => p.identificacao.toLowerCase() === identificacao.toLowerCase());
  if (existe) {
    return { erro: 'Este período letivo já foi cadastrado.' };
  }

  const novo: PeriodoLetivo = {
    id: uuidv4(),
    identificacao,
  };

  periodos.push(novo);
  ConexaoBD.armazenaDB('periodos.json', periodos);

  await registrarAuditoria(
    session.userId,
    session.email,
    'PeriodoLetivo',
    'CRIACAO',
    `Período letivo ${identificacao} criado.`
  );

  revalidatePath('/periodos');
  return { sucesso: true };
}

export async function alterarPeriodoAction(prevState: any, formData: FormData) {
  const session = await getSession();
  if (!session || session.perfil !== 'Coordenador') {
    return { erro: 'Apenas coordenadores podem alterar períodos letivos (RF014).' };
  }

  const id = formData.get('id') as string;
  const identificacao = (formData.get('identificacao') as string)?.trim();

  if (!identificacao) {
    return { erro: 'A identificação do período letivo é obrigatória.' };
  }

  const periodos = ConexaoBD.retornaDB<PeriodoLetivo>('periodos.json');
  const index = periodos.findIndex((p) => p.id === id);
  if (index === -1) {
    return { erro: 'Período não encontrado.' };
  }

  periodos[index].identificacao = identificacao;
  ConexaoBD.armazenaDB('periodos.json', periodos);

  await registrarAuditoria(
    session.userId,
    session.email,
    'PeriodoLetivo',
    'EDICAO',
    `Período letivo atualizado para ${identificacao}.`
  );

  revalidatePath('/periodos');
  return { sucesso: true };
}

export async function excluirPeriodoAction(id: string) {
  const session = await getSession();
  if (!session || session.perfil !== 'Coordenador') {
    return { erro: 'Apenas coordenadores podem excluir períodos letivos.' };
  }

  const periodos = ConexaoBD.retornaDB<PeriodoLetivo>('periodos.json');
  const periodo = periodos.find((p) => p.id === id);
  if (!periodo) return { erro: 'Período não encontrado.' };

  const novosPeriodos = periodos.filter((p) => p.id !== id);
  ConexaoBD.armazenaDB('periodos.json', novosPeriodos);

  await registrarAuditoria(
    session.userId,
    session.email,
    'PeriodoLetivo',
    'EXCLUSAO',
    `Período letivo ${periodo.identificacao} excluído.`
  );

  revalidatePath('/periodos');
  return { sucesso: true };
}
