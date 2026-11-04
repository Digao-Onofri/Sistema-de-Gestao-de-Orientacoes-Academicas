import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

const diretorio = () => path.resolve(process.env.SGOA_DATA_DIR || path.join(process.cwd(), 'data'));

// Leitura estrita para que um JSON inválido nunca seja substituído por uma lista vazia.
export function lerR03<T>(arquivo: string): T[] {
  const destino = path.join(diretorio(), arquivo);
  if (!fs.existsSync(destino)) return [];
  const dados: unknown = JSON.parse(fs.readFileSync(destino, 'utf8'));
  if (!Array.isArray(dados)) throw new Error(`Formato inválido: ${arquivo}`);
  return dados as T[];
}

// As mutações são síncronas, sem await entre leitura e gravação, para a PoC de processo único.
export function gravarR03<T>(arquivo: string, dados: T[]) {
  fs.mkdirSync(diretorio(), { recursive: true });
  const destino = path.join(diretorio(), arquivo);
  const temporario = `${destino}.${randomUUID()}.tmp`;
  try {
    fs.writeFileSync(temporario, JSON.stringify(dados, null, 2), 'utf8');
    fs.renameSync(temporario, destino);
  } finally {
    if (fs.existsSync(temporario)) fs.unlinkSync(temporario);
  }
}
