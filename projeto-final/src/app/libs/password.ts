import crypto from 'crypto';

/**
 * Utilitário de hash e comparação de senhas utilizando PBKDF2 nativo do Node.js
 * Atende ao RNF006: senhas nunca são armazenadas em texto puro.
 */
export async function hashSenha(senha: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString('hex');
    crypto.pbkdf2(senha, salt, 10000, 64, 'sha512', (err, derivedKey) => {
      if (err) reject(err);
      resolve(`${salt}:${derivedKey.toString('hex')}`);
    });
  });
}

export async function compararSenha(senha: string, hashArmazenado: string): Promise<boolean> {
  return new Promise((resolve) => {
    // Caso suporte legado ou formato salt:hash
    if (!hashArmazenado || !hashArmazenado.includes(':')) {
      // Se não for hash PBKDF2 válido
      resolve(false);
      return;
    }

    const [salt, key] = hashArmazenado.split(':');
    crypto.pbkdf2(senha, salt, 10000, 64, 'sha512', (err, derivedKey) => {
      if (err) {
        resolve(false);
        return;
      }
      resolve(key === derivedKey.toString('hex'));
    });
  });
}
