export type Perfil = 'Tutor' | 'Tutorado' | 'Coordenador';
export type SituacaoConta = 'Ativa' | 'Inativa';
export type TipoOrientacao = 'TCC' | 'IC';
export type SituacaoCurso = 'Ativo' | 'Inativo';
export type SituacaoCiclo = 'Rascunho' | 'Publicado' | 'Aberto' | 'Encerrado' | 'Cancelado';
export type SituacaoSolicitacao = 'Pendente' | 'Aceita' | 'Recusada' | 'AguardandoComplementacao';
export type SituacaoAlocacao = 'Ativa' | 'Encerrada' | 'Cancelada';
export type SituacaoEtapa = 'Pendente' | 'EmAndamento' | 'Concluida' | 'Atrasada';

export interface Usuario {
  id: string;
  email: string;
  senha: string;
  perfil: Perfil;
  situacao: SituacaoConta;
  nome: string;
  // Tutor
  apresentacao?: string;
  areasInteresse?: string[];
  tiposOrientacao?: TipoOrientacao[];
  disponibilidade?: string;
  limiteOrientandos?: number;
  // Tutorado
  dadosAcademicos?: string;
}

export interface UnidadeAcademica {
  id: string;
  denominacao: string;
}

export interface Curso {
  id: string;
  denominacao: string;
  unidadeId: string;
  situacao: SituacaoCurso;
}

export interface PeriodoLetivo {
  id: string;
  identificacao: string;
}

export interface PropostaAcademica {
  id: string;
  tutoradoId: string;
  titulo: string;
  resumo: string;
  palavrasChave: string[];
  tipo: TipoOrientacao;
}

export interface CicloOrientacao {
  id: string;
  cursoId: string;
  periodoId: string;
  modalidade: TipoOrientacao;
  prazoInicio: string;
  prazoFim: string;
  elegibilidade: string;
  regras: string;
  situacao: SituacaoCiclo;
}

export interface DecisaoSolicitacao {
  resultado: 'Aceitar' | 'Recusar' | 'SolicitarComplementacao';
  dataDecisao: string;
  justificativa?: string;
  tutorId: string;
}

export interface SolicitacaoOrientacao {
  id: string;
  cicloId: string;
  propostaId: string;
  tutoradoId: string;
  tutoresPreferidos: string[];
  situacao: SituacaoSolicitacao;
  dataSolicitacao: string;
  decisao?: DecisaoSolicitacao;
}

export interface AlocacaoOrientacao {
  id: string;
  tutorId: string;
  tutoradoId: string;
  propostaId: string;
  cicloId: string;
  situacao: SituacaoAlocacao;
  dataConfirmacao: string;
  coordenadorId: string;
  motivo?: string;
  dataEncerramento?: string;
}

export interface EtapaAcompanhamento {
  id: string;
  alocacaoId: string;
  descricao: string;
  responsavel: string;
  prazo: string;
  situacao: SituacaoEtapa;
}

export interface RegistroReuniao {
  id: string;
  alocacaoId: string;
  data: string;
  resumo: string;
  encaminhamentos: string;
  proximoContato: string;
}

export interface NotificacaoInterna {
  id: string;
  usuarioId: string;
  tipoEvento: string;
  descricao: string;
  dataHora: string;
  referencia?: string;
  lida: boolean;
}

export interface RegistroAuditoria {
  id: string;
  dataHora: string;
  usuarioId: string;
  usuarioEmail: string;
  entidade: string;
  tipoAcao: string;
  detalhes?: string;
}
