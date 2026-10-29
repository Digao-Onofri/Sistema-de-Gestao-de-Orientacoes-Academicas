import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');

const ConexaoBD = {
  retornaDB<T>(arquivo: string): T[] {
    const filePath = path.join(DATA_DIR, arquivo);
    if (!fs.existsSync(filePath)) return [];
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(content);
    } catch {
      return [];
    }
  },
  armazenaDB<T>(arquivo: string, dados: T[]): void {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const filePath = path.join(DATA_DIR, arquivo);
    fs.writeFileSync(filePath, JSON.stringify(dados, null, 2), 'utf-8');
  }
};

export default ConexaoBD;
