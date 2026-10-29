// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Usuario } from '../../types';

const {
  auditMock,
  getSessionMock,
  hashPasswordMock,
  revalidatePathMock,
  returnDatabaseMock,
  storeDatabaseMock,
  uuidMock,
} = vi.hoisted(() => ({
  auditMock: vi.fn(),
  getSessionMock: vi.fn(),
  hashPasswordMock: vi.fn(),
  revalidatePathMock: vi.fn(),
  returnDatabaseMock: vi.fn(),
  storeDatabaseMock: vi.fn(),
  uuidMock: vi.fn(),
}));

vi.mock('next/cache', () => ({
  revalidatePath: revalidatePathMock,
}));

vi.mock('uuid', () => ({
  v4: uuidMock,
}));

vi.mock('../conexao-bd', () => ({
  default: {
    retornaDB: returnDatabaseMock,
    armazenaDB: storeDatabaseMock,
  },
}));

vi.mock('../session', () => ({
  getSession: getSessionMock,
}));

vi.mock('../auditoria', () => ({
  registrarAuditoria: auditMock,
}));

vi.mock('../password', () => ({
  hashSenha: hashPasswordMock,
}));

import { alterarUsuarioAction, criarUsuarioAction } from '../user-actions';

const coordenador = {
  userId: 'coordinator-1',
  email: 'coord@example.com',
  perfil: 'Coordenador',
};

const tutorado = {
  userId: 'student-1',
  email: 'student@example.com',
  perfil: 'Tutorado',
};

const tutor = {
  userId: 'tutor-1',
  email: 'tutor@example.com',
  perfil: 'Tutor',
};

const usuariosIniciais: Usuario[] = [
  {
    id: 'student-1',
    nome: 'Estudante',
    email: 'student@example.com',
    senha: 'stored-hash',
    perfil: 'Tutorado',
    situacao: 'Ativa',
    dadosAcademicos: 'Curso inicial',
  },
  {
    id: 'tutor-1',
    nome: 'Tutor',
    email: 'tutor@example.com',
    senha: 'stored-hash',
    perfil: 'Tutor',
    situacao: 'Ativa',
    apresentacao: 'Apresentação inicial',
    areasInteresse: ['Computação'],
    tiposOrientacao: ['TCC'],
    disponibilidade: 'Manhã',
    limiteOrientandos: 5,
  },
];

let usuarios: Usuario[];

function criarForm(campos: Record<string, string>) {
  const formData = new FormData();
  for (const [campo, valor] of Object.entries(campos)) {
    formData.set(campo, valor);
  }
  return formData;
}

describe('user actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    usuarios = structuredClone(usuariosIniciais);
    getSessionMock.mockResolvedValue(coordenador);
    returnDatabaseMock.mockReturnValue(usuarios);
    storeDatabaseMock.mockImplementation((_arquivo: string, dados: Usuario[]) => {
      usuarios = dados;
    });
    hashPasswordMock.mockResolvedValue('hashed-new-password');
    uuidMock.mockReturnValue('new-user-id');
    auditMock.mockResolvedValue(undefined);
  });

  describe('criarUsuarioAction (RF002)', () => {
    const camposObrigatorios = {
      nome: 'Nova pessoa',
      email: 'new@example.com',
      senha: 'secret',
      perfil: 'Tutor',
      situacao: 'Ativa',
    };

    it('allows only a coordinator to create users', async () => {
      getSessionMock.mockResolvedValue(tutorado);

      await expect(
        criarUsuarioAction(null, criarForm(camposObrigatorios))
      ).resolves.toMatchObject({ erro: expect.any(String) });

      expect(storeDatabaseMock).not.toHaveBeenCalled();
    });

    it.each([
      ['email', { ...camposObrigatorios, email: '' }],
      ['profile', { ...camposObrigatorios, perfil: '' }],
    ])('requires an explicit %s when creating an account', async (_field, fields) => {
      await expect(
        criarUsuarioAction(null, criarForm(fields))
      ).resolves.toMatchObject({ erro: expect.any(String) });

      expect(storeDatabaseMock).not.toHaveBeenCalled();
    });

    it.each(['Tutor', 'Tutorado', 'Coordenador'] as const)(
      'accepts the DRE profile option %s',
      async (perfil) => {
        await expect(
          criarUsuarioAction(
            null,
            criarForm({ ...camposObrigatorios, perfil })
          )
        ).resolves.toEqual({ sucesso: true });

        expect(usuarios.at(-1)?.perfil).toBe(perfil);
      }
    );

    it('persists a profile value without validating it against a closed list', async () => {
      await expect(
        criarUsuarioAction(
          null,
          criarForm({ ...camposObrigatorios, perfil: 'Administrador' })
        )
      ).resolves.toEqual({ sucesso: true });

      expect(usuarios.at(-1)?.perfil).toBe('Administrador');
    });

    it.each(['Ativa', 'Inativa'] as const)(
      'accepts the account status option %s',
      async (situacao) => {
        await expect(
          criarUsuarioAction(
            null,
            criarForm({ ...camposObrigatorios, situacao })
          )
        ).resolves.toEqual({ sucesso: true });

        expect(usuarios.at(-1)?.situacao).toBe(situacao);
      }
    );

    it('persists an account status value without validating it against a closed list', async () => {
      await expect(
        criarUsuarioAction(
          null,
          criarForm({ ...camposObrigatorios, situacao: 'Suspensa' })
        )
      ).resolves.toEqual({ sucesso: true });

      expect(usuarios.at(-1)?.situacao).toBe('Suspensa');
    });

    it('defaults the initial account status to active when omitted', async () => {
      const { situacao: _situacao, ...camposSemSituacao } = camposObrigatorios;

      await expect(
        criarUsuarioAction(null, criarForm(camposSemSituacao))
      ).resolves.toEqual({ sucesso: true });

      expect(usuarios.at(-1)?.situacao).toBe('Ativa');
    });

    it('prevents assigning an e-mail already used by another account, ignoring case', async () => {
      await expect(
        criarUsuarioAction(
          null,
          criarForm({ ...camposObrigatorios, email: 'STUDENT@example.com' })
        )
      ).resolves.toMatchObject({ erro: expect.any(String) });

      expect(storeDatabaseMock).not.toHaveBeenCalled();
      expect(hashPasswordMock).not.toHaveBeenCalled();
    });

    it('normalizes the e-mail and hashes the password while persisting the explicit status', async () => {
      await expect(
        criarUsuarioAction(
          null,
          criarForm({
            ...camposObrigatorios,
            nome: '  Nova tutora  ',
            email: '  NEW@example.com ',
            situacao: 'Inativa',
          })
        )
      ).resolves.toEqual({ sucesso: true });

      expect(hashPasswordMock).toHaveBeenCalledWith('secret');
      expect(usuarios.at(-1)).toEqual({
        id: 'new-user-id',
        nome: 'Nova tutora',
        email: 'new@example.com',
        senha: 'hashed-new-password',
        perfil: 'Tutor',
        situacao: 'Inativa',
      });
      expect(storeDatabaseMock).toHaveBeenCalledWith('usuarios.json', usuarios);
      expect(revalidatePathMock).toHaveBeenCalledWith('/usuarios');
    });
  });

  describe('alterarUsuarioAction (RF007/RF008)', () => {
    it('rejects a request without an authenticated session', async () => {
      getSessionMock.mockResolvedValue(null);

      await expect(
        alterarUsuarioAction(null, criarForm({ id: 'student-1', nome: 'Novo nome' }))
      ).resolves.toEqual({ erro: 'Não autorizado.' });

      expect(storeDatabaseMock).not.toHaveBeenCalled();
    });

    it('rejects a non-coordinator trying to edit another user', async () => {
      getSessionMock.mockResolvedValue(tutorado);

      await expect(
        alterarUsuarioAction(null, criarForm({ id: 'tutor-1', nome: 'Alterado' }))
      ).resolves.toMatchObject({ erro: expect.any(String) });

      expect(usuarios[1].nome).toBe('Tutor');
      expect(storeDatabaseMock).not.toHaveBeenCalled();
    });

    it('rejects editing a user that does not exist', async () => {
      await expect(
        alterarUsuarioAction(null, criarForm({ id: 'missing-user', nome: 'Alterado' }))
      ).resolves.toEqual({ erro: 'Usuário não encontrado.' });

      expect(storeDatabaseMock).not.toHaveBeenCalled();
    });

    it('rejects an e-mail already assigned to another user', async () => {
      await expect(
        alterarUsuarioAction(
          null,
          criarForm({ id: 'student-1', email: 'TUTOR@example.com' })
        )
      ).resolves.toMatchObject({ erro: expect.any(String) });

      expect(usuarios[0].email).toBe('student@example.com');
      expect(storeDatabaseMock).not.toHaveBeenCalled();
    });

    it.each([
      ['tutorado', tutorado, 'student-1'],
      ['tutor', tutor, 'tutor-1'],
    ])('allows a %s to change their own account name', async (_role, session, userId) => {
      getSessionMock.mockResolvedValue(session);

      await expect(
        alterarUsuarioAction(
          null,
          criarForm({ id: userId, nome: 'Nome atualizado' })
        )
      ).resolves.toEqual({ sucesso: true });

      expect(usuarios.find(({ id }) => id === userId)?.nome).toBe('Nome atualizado');
      expect(storeDatabaseMock).toHaveBeenCalledOnce();
    });

    it('allows coordinators to change an account e-mail', async () => {
      await expect(
        alterarUsuarioAction(
          null,
          criarForm({ id: 'student-1', email: '  UPDATED@example.com ' })
        )
      ).resolves.toEqual({ sucesso: true });

      expect(usuarios[0].email).toBe('updated@example.com');
    });

    it('persists a profile value without validating it against a closed list', async () => {
      await expect(
        alterarUsuarioAction(
          null,
          criarForm({ id: 'student-1', perfil: 'Administrador' })
        )
      ).resolves.toEqual({ sucesso: true });

      expect(usuarios[0].perfil).toBe('Administrador');
    });

    it('persists an account status value without validating it against a closed list', async () => {
      await expect(
        alterarUsuarioAction(
          null,
          criarForm({ id: 'student-1', situacao: 'Suspensa' })
        )
      ).resolves.toEqual({ sucesso: true });

      expect(usuarios[0].situacao).toBe('Suspensa');
    });

    it('allows a tutorado to change their own e-mail', async () => {
      getSessionMock.mockResolvedValue(tutorado);

      await expect(
        alterarUsuarioAction(
          null,
          criarForm({ id: tutorado.userId, email: 'changed@example.com' })
        )
      ).resolves.toEqual({ sucesso: true });

      expect(usuarios[0].email).toBe('changed@example.com');
      expect(storeDatabaseMock).toHaveBeenCalledOnce();
    });

    it('allows a tutor to change their own e-mail', async () => {
      getSessionMock.mockResolvedValue(tutor);

      await expect(
        alterarUsuarioAction(
          null,
          criarForm({ id: tutor.userId, email: 'changed@example.com' })
        )
      ).resolves.toEqual({ sucesso: true });

      expect(usuarios[1].email).toBe('changed@example.com');
      expect(storeDatabaseMock).toHaveBeenCalledOnce();
    });

    it('ignores submitted tutor-profile fields while allowing the update action', async () => {
      getSessionMock.mockResolvedValue(tutor);

      await expect(
        alterarUsuarioAction(
          null,
          criarForm({
            id: tutor.userId,
            apresentacao: 'Nova apresentação',
            areasInteresse: JSON.stringify(['IA', 'Sistemas']),
            tiposOrientacao: JSON.stringify(['TCC', 'IC']),
            disponibilidade: 'Tarde',
            limiteOrientandos: '8',
          })
        )
      ).resolves.toEqual({ sucesso: true });

      expect(usuarios[1]).toMatchObject({
        id: tutor.userId,
        email: tutor.email,
        perfil: 'Tutor',
        apresentacao: 'Apresentação inicial',
        areasInteresse: ['Computação'],
        tiposOrientacao: ['TCC'],
        disponibilidade: 'Manhã',
        limiteOrientandos: 5,
      });
    });

    it('ignores submitted academic data while allowing the update action', async () => {
      getSessionMock.mockResolvedValue(tutorado);

      await expect(
        alterarUsuarioAction(
          null,
          criarForm({
            id: tutorado.userId,
            dadosAcademicos: 'Curso de Sistemas de Informação',
          })
        )
      ).resolves.toEqual({ sucesso: true });

      expect(usuarios[0]).toMatchObject({
        id: tutorado.userId,
        email: tutorado.email,
        perfil: 'Tutorado',
        dadosAcademicos: 'Curso inicial',
      });
    });

    it('allows a coordinator to change account data, profile, and status', async () => {
      await expect(
        alterarUsuarioAction(
          null,
          criarForm({
            id: 'student-1',
            nome: 'Nome atualizado',
            email: 'updated@example.com',
            perfil: 'Tutor',
            situacao: 'Inativa',
          })
        )
      ).resolves.toEqual({ sucesso: true });

      expect(usuarios[0]).toMatchObject({
        id: 'student-1',
        nome: 'Nome atualizado',
        email: 'updated@example.com',
        perfil: 'Tutor',
        situacao: 'Inativa',
      });
      expect(revalidatePathMock).toHaveBeenCalledWith('/usuarios');
    });

    it('allows only coordinators to change account status (RF008)', async () => {
      getSessionMock.mockResolvedValue(tutorado);

      await expect(
        alterarUsuarioAction(
          null,
          criarForm({ id: tutorado.userId, situacao: 'Inativa' })
        )
      ).resolves.toEqual({ sucesso: true });

      expect(usuarios[0].situacao).toBe('Ativa');
    });

    it('does not delete the account or its associated records when inactivated (RF008)', async () => {
      await expect(
        alterarUsuarioAction(
          null,
          criarForm({ id: 'student-1', situacao: 'Inativa' })
        )
      ).resolves.toEqual({ sucesso: true });

      expect(usuarios).toHaveLength(2);
      expect(usuarios[0].situacao).toBe('Inativa');
      expect(storeDatabaseMock).toHaveBeenCalledOnce();
      expect(storeDatabaseMock).toHaveBeenCalledWith('usuarios.json', usuarios);
    });
  });
});
