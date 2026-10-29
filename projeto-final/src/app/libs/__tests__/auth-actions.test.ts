// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  auditMock,
  comparePasswordMock,
  createSessionTokenMock,
  deleteSessionMock,
  redirectMock,
  returnDatabaseMock,
} = vi.hoisted(() => ({
  auditMock: vi.fn(),
  comparePasswordMock: vi.fn(),
  createSessionTokenMock: vi.fn(),
  deleteSessionMock: vi.fn(),
  redirectMock: vi.fn(),
  returnDatabaseMock: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  redirect: redirectMock,
}));

vi.mock('../conexao-bd', () => ({
  default: {
    retornaDB: returnDatabaseMock,
  },
}));

vi.mock('../session', () => ({
  createSessionToken: createSessionTokenMock,
  deleteSession: deleteSessionMock,
}));

vi.mock('../auditoria', () => ({
  registrarAuditoria: auditMock,
}));

vi.mock('../password', () => ({
  compararSenha: comparePasswordMock,
}));

import { autenticarUsuario, logoutAction } from '../auth-actions';

const usuario = {
  id: 'user-123',
  email: 'tutorado@example.com',
  senha: 'hash-armazenado',
  perfil: 'Tutorado' as const,
  situacao: 'Ativa' as const,
  nome: 'Estudante',
};

function criarForm(email: string | null, senha: string | null) {
  const formData = new FormData();
  if (email !== null) formData.set('email', email);
  if (senha !== null) formData.set('senha', senha);
  return formData;
}

describe('auth actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    returnDatabaseMock.mockReturnValue([usuario]);
    comparePasswordMock.mockResolvedValue(true);
    createSessionTokenMock.mockResolvedValue(undefined);
    deleteSessionMock.mockResolvedValue(undefined);
    auditMock.mockResolvedValue(undefined);
  });

  it.each([
    ['missing email', null, 'password'],
    ['missing password', 'tutorado@example.com', null],
  ])('requires both login fields (%s)', async (_case, email, senha) => {
    await expect(autenticarUsuario(null, criarForm(email, senha))).resolves.toEqual({
      erro: 'Identificador/e-mail e senha são obrigatórios.',
    });

    expect(returnDatabaseMock).not.toHaveBeenCalled();
    expect(comparePasswordMock).not.toHaveBeenCalled();
    expect(createSessionTokenMock).not.toHaveBeenCalled();
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it('uses the same generic error when the account does not exist', async () => {
    returnDatabaseMock.mockReturnValue([]);

    await expect(
      autenticarUsuario(null, criarForm('unknown@example.com', 'password'))
    ).resolves.toEqual({ erro: 'Credenciais inválidas ou conta inativa.' });

    expect(comparePasswordMock).not.toHaveBeenCalled();
    expect(createSessionTokenMock).not.toHaveBeenCalled();
  });

  it('uses the same generic error and does not check the password for an inactive account', async () => {
    returnDatabaseMock.mockReturnValue([{ ...usuario, situacao: 'Inativa' }]);

    await expect(
      autenticarUsuario(null, criarForm(usuario.email, 'password'))
    ).resolves.toEqual({ erro: 'Credenciais inválidas ou conta inativa.' });

    expect(comparePasswordMock).not.toHaveBeenCalled();
    expect(createSessionTokenMock).not.toHaveBeenCalled();
  });

  it('uses the same generic error when the password is incorrect', async () => {
    comparePasswordMock.mockResolvedValue(false);

    await expect(
      autenticarUsuario(null, criarForm(usuario.email, 'wrong-password'))
    ).resolves.toEqual({ erro: 'Credenciais inválidas ou conta inativa.' });

    expect(comparePasswordMock).toHaveBeenCalledWith('wrong-password', usuario.senha);
    expect(createSessionTokenMock).not.toHaveBeenCalled();
    expect(auditMock).not.toHaveBeenCalled();
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it('normalizes the email and starts a session for an active account with a valid password', async () => {
    await autenticarUsuario(null, criarForm('  TUTORADO@EXAMPLE.COM  ', 'correct-password'));

    expect(comparePasswordMock).toHaveBeenCalledWith('correct-password', usuario.senha);
    expect(createSessionTokenMock).toHaveBeenCalledWith(
      usuario.id,
      usuario.email,
      usuario.perfil
    );
    expect(auditMock).toHaveBeenCalledWith(
      usuario.id,
      usuario.email,
      'Autenticacao',
      'LOGIN',
      'Login efetuado com sucesso'
    );
    expect(redirectMock).toHaveBeenCalledWith('/dashboard');
  });

  it('ends the current session before redirecting to login', async () => {
    await logoutAction();

    expect(deleteSessionMock).toHaveBeenCalledOnce();
    expect(redirectMock).toHaveBeenCalledWith('/login');
  });
});
