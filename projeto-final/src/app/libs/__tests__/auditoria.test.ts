// @vitest-environment node

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { RegistroAuditoria } from '../../types';

const { returnDatabaseMock, storeDatabaseMock, uuidMock } = vi.hoisted(() => ({
  returnDatabaseMock: vi.fn(),
  storeDatabaseMock: vi.fn(),
  uuidMock: vi.fn(),
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

import { registrarAuditoria } from '../auditoria';

describe('registrarAuditoria', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-29T12:00:00.000Z'));
    uuidMock.mockReturnValue('audit-record-id');
    returnDatabaseMock.mockReturnValue([]);
    storeDatabaseMock.mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('appends a record with its audit details and timestamp', async () => {
    const registrosExistentes: RegistroAuditoria[] = [
      {
        id: 'existing-record',
        dataHora: '2026-10-28T12:00:00.000Z',
        usuarioId: 'previous-user',
        usuarioEmail: 'previous@example.com',
        entidade: 'Usuario',
        tipoAcao: 'EDICAO',
      },
    ];
    returnDatabaseMock.mockReturnValue(registrosExistentes);

    await registrarAuditoria(
      'user-123',
      'user@example.com',
      'PropostaAcademica',
      'CRIACAO',
      'Proposta criada.'
    );

    expect(returnDatabaseMock).toHaveBeenCalledWith('auditoria.json');
    expect(registrosExistentes).toHaveLength(2);
    expect(registrosExistentes[0]).toMatchObject({ id: 'existing-record' });
    expect(registrosExistentes[1]).toEqual({
      id: 'audit-record-id',
      dataHora: '2026-10-29T12:00:00.000Z',
      usuarioId: 'user-123',
      usuarioEmail: 'user@example.com',
      entidade: 'PropostaAcademica',
      tipoAcao: 'CRIACAO',
      detalhes: 'Proposta criada.',
    });
    expect(storeDatabaseMock).toHaveBeenCalledWith('auditoria.json', registrosExistentes);
  });

  it('stores a record when optional details are omitted', async () => {
    await registrarAuditoria(
      'user-123',
      'user@example.com',
      'Autenticacao',
      'LOGIN'
    );

    expect(storeDatabaseMock).toHaveBeenCalledWith('auditoria.json', [
      {
        id: 'audit-record-id',
        dataHora: '2026-10-29T12:00:00.000Z',
        usuarioId: 'user-123',
        usuarioEmail: 'user@example.com',
        entidade: 'Autenticacao',
        tipoAcao: 'LOGIN',
        detalhes: undefined,
      },
    ]);
  });

  it('does not throw when reading or writing audit storage fails', async () => {
    returnDatabaseMock.mockImplementation(() => {
      throw new Error('audit read failed');
    });

    await expect(
      registrarAuditoria('user-123', 'user@example.com', 'Usuario', 'EDICAO')
    ).resolves.toBeUndefined();
    expect(storeDatabaseMock).not.toHaveBeenCalled();

    returnDatabaseMock.mockReturnValue([]);
    storeDatabaseMock.mockImplementation(() => {
      throw new Error('audit write failed');
    });

    await expect(
      registrarAuditoria('user-123', 'user@example.com', 'Usuario', 'EDICAO')
    ).resolves.toBeUndefined();
  });
});
