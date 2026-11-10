'use server';

import ConexaoBD from './conexao-bd';
import { v4 as uuidv4 } from 'uuid';
import type { RegistroAuditoria } from '../types';
import { lerR03, gravarR03 } from './release03-store';

export async function registrarAuditoria(
  usuarioId: string,
  usuarioEmail: string,
  entidade: string,
  tipoAcao: string,
  detalhes?: string
) {
  try {
    const registros = ConexaoBD.retornaDB<RegistroAuditoria>('auditoria.json');
    const novo: RegistroAuditoria = {
      id: uuidv4(),
      dataHora: new Date().toISOString(),
      usuarioId,
      usuarioEmail,
      entidade,
      tipoAcao,
      detalhes,
    };
    registros.push(novo);
    ConexaoBD.armazenaDB('auditoria.json', registros);
  } catch {
    // Auditoria nunca deve quebrar o fluxo principal
  }
}

export async function registrarAuditoriaEstrita(
  usuarioId: string,
  usuarioEmail: string,
  entidade: string,
  tipoAcao: string,
  detalhes?: string
) {
  try {
    const registros = lerR03<RegistroAuditoria>('auditoria.json');
    const novo: RegistroAuditoria = {
      id: uuidv4(),
      dataHora: new Date().toISOString(),
      usuarioId,
      usuarioEmail,
      entidade,
      tipoAcao,
      detalhes,
    };
    registros.push(novo);
    gravarR03('auditoria.json', registros);
  } catch (erro) {
    console.error('Falha ao registrar auditoria (estrita):', erro);
  }
}
