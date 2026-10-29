import fs from 'fs';
import { PASTA_BACKUP, restaurarDados } from './dados';

export default async function globalTeardown() {
  // SGOA_MANTER_DADOS=1 deixa os registros criados pelo roteiro (útil para perguntas após a demo).
  if (process.env.SGOA_MANTER_DADOS === '1') {
    fs.rmSync(PASTA_BACKUP, { recursive: true, force: true });
    return;
  }
  restaurarDados();
}
