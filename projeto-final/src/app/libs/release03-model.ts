import type { PropostaAcademica, SolicitacaoOrientacao } from '../types';

// Extensão aditiva: preserva a proposta submetida sem alterar o CRUD da Release 02.
export interface SolicitacaoR03 extends SolicitacaoOrientacao {
  propostaSubmetida?: PropostaAcademica;
  elegibilidadeDeclarada?: boolean;
  dataAtualizacao?: string;
  cancelamento?: { dataCancelamento: string; tutoradoId: string };
}
export type ResultadoAcao = { erro?: string; sucesso?: boolean; mensagem?: string; errosCampos?: Record<string, string> } | null;
export const estadosCiclo = ['Rascunho', 'Publicado', 'Aberto', 'Encerrado', 'Cancelado'] as const;
export const estadosSolicitacao = ['Pendente', 'Aceita', 'Recusada', 'AguardandoComplementacao', 'Cancelada'] as const;
export const rotuloSituacao = (valor: string) => valor === 'AguardandoComplementacao' ? 'Aguardando complementação' : valor;
export const transicoes: Record<string, readonly string[]> = {
  Rascunho: ['Publicado', 'Cancelado'], Publicado: ['Aberto', 'Cancelado'],
  Aberto: ['Encerrado', 'Cancelado'], Encerrado: [], Cancelado: [],
};

// Datas de calendário no fuso da instituição, incluindo os dois dias limites.
export function hojeInstitucional(data = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(data);
}
export function dataValida(valor: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(valor) && Number.isFinite(Date.parse(valor)) && new Date(valor).toISOString().slice(0, 10) === valor;
}
