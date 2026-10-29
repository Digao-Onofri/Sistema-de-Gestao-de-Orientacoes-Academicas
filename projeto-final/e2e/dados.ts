import fs from 'fs';
import path from 'path';

export const PASTA_DADOS = path.join(__dirname, '..', 'data');
export const PASTA_BACKUP = path.join(__dirname, '..', '.e2e-backup');

/** Devolve a pasta data/ ao estado salvo antes da execução do roteiro. */
export function restaurarDados() {
  if (!fs.existsSync(PASTA_BACKUP)) return;

  const salvos = new Set(fs.readdirSync(PASTA_BACKUP));
  for (const arquivo of fs.readdirSync(PASTA_DADOS)) {
    if (!salvos.has(arquivo)) fs.rmSync(path.join(PASTA_DADOS, arquivo));
  }
  fs.cpSync(PASTA_BACKUP, PASTA_DADOS, { recursive: true });
  fs.rmSync(PASTA_BACKUP, { recursive: true });
}
