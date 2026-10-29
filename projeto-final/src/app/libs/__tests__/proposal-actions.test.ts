// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PropostaAcademica } from '../../types';

const {
  auditMock,
  getSessionMock,
  revalidatePathMock,
  returnDatabaseMock,
  storeDatabaseMock,
  uuidMock,
} = vi.hoisted(() => ({
  auditMock: vi.fn(),
  getSessionMock: vi.fn(),
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

import {
  alterarPropostaAction,
  criarPropostaAction,
  excluirPropostaAction,
} from '../proposal-actions';

const tutorado = {
  userId: 'student-1',
  email: 'student@example.com',
  perfil: 'Tutorado',
};

const outroTutorado = {
  userId: 'student-2',
  email: 'other-student@example.com',
  perfil: 'Tutorado',
};

const tutor = {
  userId: 'tutor-1',
  email: 'tutor@example.com',
  perfil: 'Tutor',
};

const coordenador = {
  userId: 'coordinator-1',
  email: 'coord@example.com',
  perfil: 'Coordenador',
};

const propostasIniciais: PropostaAcademica[] = [
  {
    id: 'proposal-1',
    tutoradoId: 'student-1',
    titulo: 'Proposta original',
    resumo: 'Resumo original',
    palavrasChave: ['original'],
    tipo: 'TCC',
  },
  {
    id: 'proposal-2',
    tutoradoId: 'student-2',
    titulo: 'Proposta de outra pessoa',
    resumo: 'Outro resumo',
    palavrasChave: [],
    tipo: 'IC',
  },
];

let propostas: PropostaAcademica[];

function criarForm(campos: Record<string, string>) {
  const formData = new FormData();
  for (const [campo, valor] of Object.entries(campos)) {
    formData.set(campo, valor);
  }
  return formData;
}

const dadosPropostaValida = {
  titulo: 'Nova proposta',
  resumo: 'Resumo da proposta',
  palavrasChave: ' orientação, TCC, , pesquisa ',
  tipo: 'TCC',
};

describe('proposal actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    propostas = structuredClone(propostasIniciais);
    getSessionMock.mockResolvedValue(tutorado);
    returnDatabaseMock.mockReturnValue(propostas);
    storeDatabaseMock.mockImplementation((_arquivo: string, dados: PropostaAcademica[]) => {
      propostas = dados;
    });
    auditMock.mockResolvedValue(undefined);
    uuidMock.mockReturnValue('new-proposal-id');
  });

  describe('criarPropostaAction', () => {
    it('requires an authenticated user', async () => {
      getSessionMock.mockResolvedValue(null);

      await expect(
        criarPropostaAction(null, criarForm(dadosPropostaValida))
      ).resolves.toEqual({ erro: 'Usuário não autenticado.' });

      expect(storeDatabaseMock).not.toHaveBeenCalled();
    });

    it('allows an authenticated tutor to create a proposal linked to their account', async () => {
      getSessionMock.mockResolvedValue(tutor);

      await expect(
        criarPropostaAction(null, criarForm(dadosPropostaValida))
      ).resolves.toEqual({ sucesso: true });

      expect(propostas.at(-1)).toMatchObject({
        tutoradoId: tutor.userId,
        titulo: dadosPropostaValida.titulo,
        tipo: dadosPropostaValida.tipo,
      });
      expect(storeDatabaseMock).toHaveBeenCalledOnce();
    });

    it.each([
      ['title', { resumo: 'Resumo', tipo: 'TCC' }],
      ['summary', { titulo: 'Título', tipo: 'TCC' }],
      ['type', { titulo: 'Título', resumo: 'Resumo' }],
    ])('requires a non-empty proposal %s', async (_field, fields) => {
      await expect(
        criarPropostaAction(null, criarForm(fields))
      ).resolves.toMatchObject({ erro: expect.any(String) });

      expect(storeDatabaseMock).not.toHaveBeenCalled();
    });

    it('rejects an empty proposal type as a required field', async () => {
      await expect(
        criarPropostaAction(null, criarForm({ ...dadosPropostaValida, tipo: '' }))
      ).resolves.toMatchObject({ erro: expect.any(String) });

      expect(storeDatabaseMock).not.toHaveBeenCalled();
    });

    it('accepts and persists a non-empty proposal type outside TCC and IC', async () => {
      await expect(
        criarPropostaAction(
          null,
          criarForm({ ...dadosPropostaValida, tipo: 'Dissertacao' })
        )
      ).resolves.toEqual({ sucesso: true });

      expect(propostas.at(-1)?.tipo).toBe('Dissertacao');
    });

    it('creates a proposal linked to the authenticated tutorado and parses keywords', async () => {
      await expect(
        criarPropostaAction(null, criarForm(dadosPropostaValida))
      ).resolves.toEqual({ sucesso: true });

      expect(propostas.at(-1)).toEqual({
        id: 'new-proposal-id',
        tutoradoId: tutorado.userId,
        titulo: 'Nova proposta',
        resumo: 'Resumo da proposta',
        palavrasChave: ['orientação', 'TCC', 'pesquisa'],
        tipo: 'TCC',
      });
      expect(storeDatabaseMock).toHaveBeenCalledWith('propostas.json', propostas);
      expect(auditMock).toHaveBeenCalledWith(
        tutorado.userId,
        tutorado.email,
        'PropostaAcademica',
        'CRIACAO',
        'Proposta "Nova proposta" (TCC) criada.'
      );
      expect(revalidatePathMock).toHaveBeenCalledWith('/propostas');
    });
  });

  describe('alterarPropostaAction', () => {
    it('requires an authenticated user', async () => {
      getSessionMock.mockResolvedValue(null);

      await expect(
        alterarPropostaAction(
          null,
          criarForm({ id: 'proposal-1', ...dadosPropostaValida })
        )
      ).resolves.toEqual({ erro: 'Usuário não autenticado.' });

      expect(storeDatabaseMock).not.toHaveBeenCalled();
    });

    it('restricts editing to the proposal owner', async () => {
      getSessionMock.mockResolvedValue(outroTutorado);

      await expect(
        alterarPropostaAction(
          null,
          criarForm({ id: 'proposal-1', ...dadosPropostaValida })
        )
      ).resolves.toMatchObject({ erro: expect.any(String) });

      expect(propostas[0].titulo).toBe('Proposta original');
      expect(storeDatabaseMock).not.toHaveBeenCalled();
    });

    it('allows a coordinator to edit a proposal without changing its owner', async () => {
      getSessionMock.mockResolvedValue(coordenador);

      await expect(
        alterarPropostaAction(
          null,
          criarForm({ id: 'proposal-1', ...dadosPropostaValida })
        )
      ).resolves.toEqual({ sucesso: true });

      expect(propostas[0]).toMatchObject({
        tutoradoId: 'student-1',
        titulo: dadosPropostaValida.titulo,
        resumo: dadosPropostaValida.resumo,
      });
      expect(storeDatabaseMock).toHaveBeenCalledOnce();
    });

    it.each([
      ['title', { id: 'proposal-1', resumo: 'Resumo', tipo: 'TCC' }],
      ['summary', { id: 'proposal-1', titulo: 'Título', tipo: 'TCC' }],
      ['type', { id: 'proposal-1', titulo: 'Título', resumo: 'Resumo' }],
    ])('requires a non-empty proposal %s', async (_field, fields) => {
      await expect(
        alterarPropostaAction(null, criarForm(fields))
      ).resolves.toMatchObject({ erro: expect.any(String) });

      expect(storeDatabaseMock).not.toHaveBeenCalled();
    });

    it('accepts and persists a non-empty proposal type outside TCC and IC', async () => {
      await expect(
        alterarPropostaAction(
          null,
          criarForm({
            id: 'proposal-1',
            ...dadosPropostaValida,
            tipo: 'Dissertacao',
          })
        )
      ).resolves.toEqual({ sucesso: true });

      expect(propostas[0].tipo).toBe('Dissertacao');
    });

    it('rejects a proposal that does not exist', async () => {
      await expect(
        alterarPropostaAction(
          null,
          criarForm({ id: 'missing-proposal', ...dadosPropostaValida })
        )
      ).resolves.toEqual({ erro: 'Proposta não encontrada.' });

      expect(storeDatabaseMock).not.toHaveBeenCalled();
    });

    it('allows the owner to edit proposal fields without changing the owner link', async () => {
      await expect(
        alterarPropostaAction(
          null,
          criarForm({
            id: 'proposal-1',
            ...dadosPropostaValida,
            tutoradoId: 'student-2',
          })
        )
      ).resolves.toEqual({ sucesso: true });

      expect(propostas[0]).toEqual({
        id: 'proposal-1',
        tutoradoId: 'student-1',
        titulo: 'Nova proposta',
        resumo: 'Resumo da proposta',
        palavrasChave: ['orientação', 'TCC', 'pesquisa'],
        tipo: 'TCC',
      });
      expect(storeDatabaseMock).toHaveBeenCalledWith('propostas.json', propostas);
      expect(auditMock).toHaveBeenCalledOnce();
      expect(revalidatePathMock).toHaveBeenCalledWith('/propostas');
    });

  });

  describe('excluirPropostaAction', () => {
    it('requires an authenticated user', async () => {
      getSessionMock.mockResolvedValue(null);

      await expect(excluirPropostaAction('proposal-1')).resolves.toEqual({
        erro: 'Não autenticado.',
      });

      expect(storeDatabaseMock).not.toHaveBeenCalled();
    });

    it('rejects a proposal that does not exist', async () => {
      await expect(excluirPropostaAction('missing-proposal')).resolves.toEqual({
        erro: 'Proposta não encontrada.',
      });

      expect(storeDatabaseMock).not.toHaveBeenCalled();
    });

    it('prevents a tutorado from deleting another tutorado’s proposal', async () => {
      await expect(excluirPropostaAction('proposal-2')).resolves.toMatchObject({
        erro: expect.any(String),
      });

      expect(storeDatabaseMock).not.toHaveBeenCalled();
    });

    it('deletes only the owner’s proposal and records the action', async () => {
      await expect(excluirPropostaAction('proposal-1')).resolves.toEqual({
        sucesso: true,
      });

      expect(propostas.map(({ id }) => id)).toEqual(['proposal-2']);
      expect(storeDatabaseMock).toHaveBeenCalledWith('propostas.json', propostas);
      expect(auditMock).toHaveBeenCalledWith(
        tutorado.userId,
        tutorado.email,
        'PropostaAcademica',
        'EXCLUSAO',
        'Proposta "Proposta original" excluída.'
      );
      expect(revalidatePathMock).toHaveBeenCalledWith('/propostas');
    });

    it('allows a coordinator to delete a proposal as current behavior', async () => {
      getSessionMock.mockResolvedValue(coordenador);

      await expect(excluirPropostaAction('proposal-1')).resolves.toEqual({
        sucesso: true,
      });

      expect(propostas.map(({ id }) => id)).toEqual(['proposal-2']);
    });
  });
});
