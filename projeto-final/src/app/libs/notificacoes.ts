'use server';

import ConexaoBD from './conexao-bd';
import { v4 as uuidv4 } from 'uuid';
import type { NotificacaoInterna } from '../types';

export async function criarNotificacao(
  usuarioId: string,
  tipoEvento: string,
  descricao: string,
  referencia?: string
) {
  try {
    const notificacoes = ConexaoBD.retornaDB<NotificacaoInterna>('notificacoes.json');
    const nova: NotificacaoInterna = {
      id: uuidv4(),
      usuarioId,
      tipoEvento,
      descricao,
      dataHora: new Date().toISOString(),
      referencia,
      lida: false,
    };
    notificacoes.push(nova);
    ConexaoBD.armazenaDB('notificacoes.json', notificacoes);
  } catch {
    // Notificações nunca devem quebrar o fluxo principal
  }
}
