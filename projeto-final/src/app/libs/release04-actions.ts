'use server';

import { randomUUID } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import type { AlocacaoOrientacao, CicloOrientacao, PropostaAcademica, SolicitacaoOrientacao, Usuario } from '../types';
import type { ResultadoAcao } from './release03-model';
import { lerR03, gravarR03 } from './release03-store';
import { usuarioR03 } from './release03-access';
import { registrarAuditoriaEstrita } from './auditoria';
import { criarNotificacaoEstrita } from './notificacoes';
import type { AlocacaoR04 } from './release04-model';
import { contarAlocacoesAtivas, limiteOrientandosValido, textoTrim } from './release04-model';

const texto = (f: FormData, chave: string) => typeof f.get(chave) === 'string' ? String(f.get(chave)).trim() : '';

function atualizarAlocacoes() {
  ['/alocacoes', '/painel', '/notificacoes'].forEach((p) => {
    try { revalidatePath(p); } catch {}
  });
  return { sucesso: true };
}

export async function confirmarAlocacaoAction(_: ResultadoAcao, f: FormData): Promise<ResultadoAcao> {
  try {
    const usuario = await usuarioR03();
    if (!usuario || usuario.perfil !== 'Coordenador' || usuario.situacao !== 'Ativa') {
      return { erro: 'Apenas coordenadores ativos podem confirmar alocações.' };
    }

    const tutorId = texto(f, 'tutorId');
    const tutoradoId = texto(f, 'tutoradoId');
    const propostaId = texto(f, 'propostaId');
    const cicloId = texto(f, 'cicloId');
    const solicitacaoIdBruto = texto(f, 'solicitacaoId');
    const solicitacaoId = solicitacaoIdBruto === '' ? undefined : solicitacaoIdBruto;

    if (!tutorId || !tutoradoId || !propostaId || !cicloId) {
      return { erro: 'Informe tutor, tutorado, proposta e ciclo.' };
    }

    const usuarios = lerR03<Usuario>('usuarios.json');
    const tutor = usuarios.find((u) => u.id === tutorId);
    const tutorado = usuarios.find((u) => u.id === tutoradoId);
    if (!tutor || tutor.perfil !== 'Tutor' || tutor.situacao !== 'Ativa') {
      return { erro: 'Tutor inválido ou inativo.' };
    }
    if (!tutorado || tutorado.perfil !== 'Tutorado' || tutorado.situacao !== 'Ativa') {
      return { erro: 'Tutorado inválido ou inativo.' };
    }
    if (!limiteOrientandosValido(tutor.limiteOrientandos)) {
      return { erro: 'Tutor sem limite de orientandos configurado.' };
    }

    const propostas = lerR03<PropostaAcademica>('propostas.json');
    const proposta = propostas.find((p) => p.id === propostaId);
    if (!proposta || proposta.tutoradoId !== tutoradoId) {
      return { erro: 'Proposta inválida para este tutorado.' };
    }

    const ciclos = lerR03<CicloOrientacao>('ciclos.json');
    const ciclo = ciclos.find((c) => c.id === cicloId);
    if (!ciclo) return { erro: 'Ciclo não encontrado.' };
    if (ciclo.situacao === 'Rascunho' || ciclo.situacao === 'Cancelado') {
      return { erro: 'Não é possível confirmar alocação neste ciclo.' };
    }
    if (proposta.tipo !== ciclo.modalidade) {
      return { erro: 'A modalidade da proposta não corresponde à do ciclo.' };
    }

    const alocacoes = lerR03<AlocacaoR04>('alocacoes.json');
    const ativasDoTutor = contarAlocacoesAtivas(alocacoes, tutorId);
    if (ativasDoTutor >= (tutor.limiteOrientandos as number)) {
      return { erro: 'Tutor atingiu o limite de orientandos ativos.' };
    }
    if (alocacoes.some((a) => a.propostaId === propostaId && a.situacao === 'Ativa')) {
      return { erro: 'Já existe alocação ativa para esta proposta.' };
    }

    if (solicitacaoId) {
      const solicitacoes = lerR03<SolicitacaoOrientacao>('solicitacoes.json');
      const s = solicitacoes.find((sol) => sol.id === solicitacaoId);
      if (!s) return { erro: 'Solicitação de referência não encontrada.' };
      if (s.tutoradoId !== tutoradoId || s.propostaId !== propostaId || s.cicloId !== cicloId) {
        return { erro: 'Solicitação de referência não corresponde à alocação.' };
      }
    }

    const nova: AlocacaoR04 = {
      id: randomUUID(),
      tutorId,
      tutoradoId,
      propostaId,
      cicloId,
      situacao: 'Ativa',
      dataConfirmacao: new Date().toISOString(),
      coordenadorId: usuario.id,
      solicitacaoId,
    };

    alocacoes.push(nova);
    gravarR03('alocacoes.json', alocacoes);

    try {
      await registrarAuditoriaEstrita(usuario.id, usuario.email, 'AlocacaoOrientacao', 'CONFIRMACAO', `Alocação confirmada entre tutor ${tutorId} e tutorado ${tutoradoId}.`);
    } catch {}
    try {
      await criarNotificacaoEstrita(tutorId, 'AlocacaoConfirmada', 'Alocação confirmada.', nova.id);
    } catch {}
    try {
      await criarNotificacaoEstrita(tutoradoId, 'AlocacaoConfirmada', 'Alocação confirmada.', nova.id);
    } catch {}

    return atualizarAlocacoes();
  } catch {
    return { erro: 'Não foi possível confirmar a alocação. Verifique os dados e tente novamente.' };
  }
}

export async function encerrarAlocacaoAction(_: ResultadoAcao, f: FormData): Promise<ResultadoAcao> {
  try {
    const usuario = await usuarioR03();
    if (!usuario || usuario.perfil !== 'Coordenador' || usuario.situacao !== 'Ativa') {
      return { erro: 'Apenas coordenadores ativos podem encerrar alocações.' };
    }

    const id = texto(f, 'id');
    const motivo = textoTrim(f.get('motivo'));
    if (!id) return { erro: 'Alocação não encontrada.' };
    if (motivo.length < 1 || motivo.length > 5000) return { erro: 'Informe o motivo (entre 1 e 5.000 caracteres).' };

    const alocacoes = lerR03<AlocacaoR04>('alocacoes.json');
    const a = alocacoes.find((al) => al.id === id);
    if (!a) return { erro: 'Alocação não encontrada.' };
    if (a.situacao !== 'Ativa') return { erro: 'Somente alocações ativas podem ser encerradas.' };

    a.situacao = 'Encerrada';
    a.motivo = motivo;
    a.dataEncerramento = new Date().toISOString();
    a.responsavelAcaoId = usuario.id;

    gravarR03('alocacoes.json', alocacoes);

    try {
      await registrarAuditoriaEstrita(usuario.id, usuario.email, 'AlocacaoOrientacao', 'ENCERRAMENTO', `Alocação ${a.id} encerrada.`);
    } catch {}
    try {
      await criarNotificacaoEstrita(a.tutorId, 'AlocacaoEncerrada', 'Alocação encerrada.', a.id);
    } catch {}
    try {
      await criarNotificacaoEstrita(a.tutoradoId, 'AlocacaoEncerrada', 'Alocação encerrada.', a.id);
    } catch {}

    return atualizarAlocacoes();
  } catch {
    return { erro: 'Não foi possível encerrar a alocação.' };
  }
}

export async function cancelarAlocacaoAction(_: ResultadoAcao, f: FormData): Promise<ResultadoAcao> {
  try {
    const usuario = await usuarioR03();
    if (!usuario || usuario.perfil !== 'Coordenador' || usuario.situacao !== 'Ativa') {
      return { erro: 'Apenas coordenadores ativos podem cancelar alocações.' };
    }

    const id = texto(f, 'id');
    const motivo = textoTrim(f.get('motivo'));
    if (!id) return { erro: 'Alocação não encontrada.' };
    if (motivo.length < 1 || motivo.length > 5000) return { erro: 'Informe o motivo (entre 1 e 5.000 caracteres).' };

    const alocacoes = lerR03<AlocacaoR04>('alocacoes.json');
    const a = alocacoes.find((al) => al.id === id);
    if (!a) return { erro: 'Alocação não encontrada.' };
    if (a.situacao !== 'Ativa') return { erro: 'Somente alocações ativas podem ser canceladas.' };

    a.situacao = 'Cancelada';
    a.motivo = motivo;
    a.dataCancelamento = new Date().toISOString();
    a.responsavelAcaoId = usuario.id;

    gravarR03('alocacoes.json', alocacoes);

    try {
      await registrarAuditoriaEstrita(usuario.id, usuario.email, 'AlocacaoOrientacao', 'CANCELAMENTO', `Alocação ${a.id} cancelada.`);
    } catch {}
    try {
      await criarNotificacaoEstrita(a.tutorId, 'AlocacaoCancelada', 'Alocação cancelada.', a.id);
    } catch {}
    try {
      await criarNotificacaoEstrita(a.tutoradoId, 'AlocacaoCancelada', 'Alocação cancelada.', a.id);
    } catch {}

    return atualizarAlocacoes();
  } catch {
    return { erro: 'Não foi possível cancelar a alocação.' };
  }
}

function atualizarEtapasReunioes() {
  ['/etapas', '/reunioes', '/alocacoes'].forEach((p) => {
    try { revalidatePath(p); } catch {}
  });
  return { sucesso: true };
}

export async function criarEtapaAction(_: ResultadoAcao, f: FormData): Promise<ResultadoAcao> {
  try {
    const usuario = await usuarioR03();
    if (!usuario || usuario.perfil !== 'Tutor' || usuario.situacao !== 'Ativa') {
      return { erro: 'Apenas tutores ativos podem criar etapas.' };
    }

    const alocacaoId = texto(f, 'alocacaoId');
    const descricao = textoTrim(f.get('descricao'));
    const responsavel = textoTrim(f.get('responsavel'));
    const prazo = texto(f, 'prazo');
    const situacao = texto(f, 'situacao');

    if (!alocacaoId) return { erro: 'Selecione a alocação.' };
    if (descricao.length < 1 || descricao.length > 5000) return { erro: 'Informe a descrição (até 5.000 caracteres).' };
    if (responsavel.length < 1 || responsavel.length > 200) return { erro: 'Informe o responsável (1 a 200 caracteres).' };
    if (!/^\d{4}-\d{2}-\d{2}$/.test(prazo)) return { erro: 'Informe um prazo válido.' };
    if (!['Pendente', 'EmAndamento', 'Concluida', 'Atrasada'].includes(situacao)) {
      return { erro: 'Situação da etapa inválida.' };
    }

    const alocacoes = lerR03<AlocacaoR04>('alocacoes.json');
    const a = alocacoes.find((al) => al.id === alocacaoId);
    if (!a || a.tutorId !== usuario.id) return { erro: 'Alocação não encontrada ou sem permissão.' };
    if (a.situacao !== 'Ativa') return { erro: 'Só é possível criar etapa para alocação ativa.' };

    const etapas = lerR03<any>('etapas.json');
    const nova = {
      id: randomUUID(),
      alocacaoId,
      descricao,
      responsavel,
      prazo,
      situacao,
    };
    etapas.push(nova);
    gravarR03('etapas.json', etapas);

    try {
      await registrarAuditoriaEstrita(usuario.id, usuario.email, 'EtapaAcompanhamento', 'CRIACAO', `Etapa criada para alocação ${alocacaoId}.`);
    } catch {}

    return atualizarEtapasReunioes();
  } catch {
    return { erro: 'Não foi possível criar a etapa.' };
  }
}
