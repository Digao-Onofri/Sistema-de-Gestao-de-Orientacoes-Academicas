import type { AlocacaoOrientacao, EtapaAcompanhamento, NotificacaoInterna, RegistroAuditoria } from '../types';

export interface AlocacaoR04 extends AlocacaoOrientacao {
  solicitacaoId?: string;
  responsavelAcaoId?: string;
  dataCancelamento?: string;
}

export interface EtapaR04 extends EtapaAcompanhamento {
  criadaPorId?: string;
}

export const estadosAlocacao = ['Ativa', 'Encerrada', 'Cancelada'] as const;
export const estadosEtapa = ['Pendente', 'EmAndamento', 'Concluida', 'Atrasada'] as const;
export const tiposEventoNotificacao = [
  'SolicitacaoRecebida',
  'DecisaoSolicitacao',
  'AlocacaoConfirmada',
  'AlocacaoEncerrada',
  'AlocacaoCancelada',
  'PrazoAlterado',
] as const;

export const rotuloSituacaoEtapa = (valor: string) => {
  if (valor === 'Concluida') return 'Concluída';
  if (valor === 'EmAndamento') return 'Em andamento';
  if (valor === 'Atrasada') return 'Atrasada';
  if (valor === 'Pendente') return 'Pendente';
  return valor;
};

export const rotuloTipoEventoNotificacao = (valor: string) => {
  switch (valor) {
    case 'SolicitacaoRecebida':
      return 'Recebimento de solicitação';
    case 'DecisaoSolicitacao':
      return 'Decisão sobre solicitação';
    case 'AlocacaoConfirmada':
      return 'Alocação confirmada';
    case 'AlocacaoEncerrada':
      return 'Alocação encerrada';
    case 'AlocacaoCancelada':
      return 'Alocação cancelada';
    case 'PrazoAlterado':
      return 'Alteração de prazo';
    default:
      return valor;
  }
};

export function textoObrigatorio(valor: unknown, min = 1, max = 5000) {
  if (typeof valor !== 'string') return false;
  const t = valor.trim();
  if (t.length < min || t.length > max) return false;
  return true;
}

export function textoTrim(valor: FormDataEntryValue | null) {
  return typeof valor === 'string' ? valor.trim() : '';
}

export function inteiroPositivo(valor: unknown): valor is number {
  if (typeof valor !== 'number') return false;
  if (!Number.isInteger(valor)) return false;
  if (valor < 1) return false;
  return true;
}

export function limiteOrientandosValido(valor: unknown): valor is number {
  return inteiroPositivo(valor);
}

export function contarAlocacoesAtivas(alocacoes: AlocacaoOrientacao[] | AlocacaoR04[], tutorId: string) {
  return alocacoes.filter((a) => a.tutorId === tutorId && a.situacao === 'Ativa').length;
}

export function notificarParaDestino(tipoEvento: string) {
  // Destinos definidos na seção 4.7 do plano
  return {
    SolicitaoRecebida: 'tutoresPreferidos',
    SolicitacaoRecebida: 'tutoresPreferidos',
    DecisaoSolicitacao: 'tutorado',
    AlocacaoConfirmada: 'tutorEtutorado',
    AlocacaoEncerrada: 'tutorEtutorado',
    AlocacaoCancelada: 'tutorEtutorado',
    PrazoAlterado: 'reservado',
  } as Record<string, string>;
}

export type NotificacaoInternaR04 = NotificacaoInterna;
export type RegistroAuditoriaR04 = RegistroAuditoria;
