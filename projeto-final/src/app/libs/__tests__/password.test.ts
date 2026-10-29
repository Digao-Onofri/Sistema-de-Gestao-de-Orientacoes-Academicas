// @vitest-environment node

import { describe, expect, it } from 'vitest';
import { compararSenha, hashSenha } from '../password';

describe('password utilities', () => {
  it('stores passwords as hashes rather than plaintext', async () => {
    const senha = 'senha-de-teste';

    const hash = await hashSenha(senha);

    expect(hash).not.toBe(senha);
    expect(await compararSenha(senha, hash)).toBe(true);
  });

  it('rejects a password that does not match the stored hash', async () => {
    const hash = await hashSenha('senha-correta');

    await expect(compararSenha('senha-incorreta', hash)).resolves.toBe(false);
  });

  it.each(['', 'senha-em-texto-puro', 'formato:invalido:completo'])(
    'rejects an empty, plaintext, or malformed stored value',
    async (hashArmazenado) => {
      await expect(compararSenha('senha-de-teste', hashArmazenado)).resolves.toBe(false);
    }
  );
});
