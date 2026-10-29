// @vitest-environment node

import path from 'path';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { existsSyncMock, mkdirSyncMock, readFileSyncMock, writeFileSyncMock } = vi.hoisted(
  () => ({
    existsSyncMock: vi.fn(),
    mkdirSyncMock: vi.fn(),
    readFileSyncMock: vi.fn(),
    writeFileSyncMock: vi.fn(),
  })
);

vi.mock('fs', () => ({
  default: {
    existsSync: existsSyncMock,
    mkdirSync: mkdirSyncMock,
    readFileSync: readFileSyncMock,
    writeFileSync: writeFileSyncMock,
  },
}));

import ConexaoBD from '../conexao-bd';

const dataDirectory = path.join(process.cwd(), 'data');

describe('ConexaoBD', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    existsSyncMock.mockReturnValue(false);
  });

  describe('retornaDB', () => {
    it('returns an empty array when the data file does not exist', () => {
      expect(ConexaoBD.retornaDB('usuarios.json')).toEqual([]);

      expect(existsSyncMock).toHaveBeenCalledWith(
        path.join(dataDirectory, 'usuarios.json')
      );
      expect(readFileSyncMock).not.toHaveBeenCalled();
    });

    it('reads and parses JSON from an existing file as UTF-8', () => {
      const usuarios = [{ id: 'user-1', nome: 'João' }];
      existsSyncMock.mockReturnValue(true);
      readFileSyncMock.mockReturnValue(JSON.stringify(usuarios));

      expect(ConexaoBD.retornaDB('usuarios.json')).toEqual(usuarios);

      expect(readFileSyncMock).toHaveBeenCalledWith(
        path.join(dataDirectory, 'usuarios.json'),
        'utf-8'
      );
    });

    it('returns an empty array when the existing file contains malformed JSON', () => {
      existsSyncMock.mockReturnValue(true);
      readFileSyncMock.mockReturnValue('{invalid json');

      expect(ConexaoBD.retornaDB('usuarios.json')).toEqual([]);
    });

    it('returns an empty array when reading an existing file throws', () => {
      existsSyncMock.mockReturnValue(true);
      readFileSyncMock.mockImplementation(() => {
        throw new Error('read failed');
      });

      expect(ConexaoBD.retornaDB('usuarios.json')).toEqual([]);
    });
  });

  describe('armazenaDB', () => {
    it('creates the data directory when missing and writes formatted UTF-8 JSON', () => {
      const dados = [{ id: 'unit-1', denominacao: 'Unidade São João' }];
      const expectedJson = JSON.stringify(dados, null, 2);

      ConexaoBD.armazenaDB('unidades.json', dados);

      expect(mkdirSyncMock).toHaveBeenCalledWith(dataDirectory, { recursive: true });
      expect(writeFileSyncMock).toHaveBeenCalledWith(
        path.join(dataDirectory, 'unidades.json'),
        expectedJson,
        'utf-8'
      );
    });

    it('does not recreate an existing data directory', () => {
      existsSyncMock.mockReturnValue(true);

      ConexaoBD.armazenaDB('periodos.json', []);

      expect(mkdirSyncMock).not.toHaveBeenCalled();
      expect(writeFileSyncMock).toHaveBeenCalledWith(
        path.join(dataDirectory, 'periodos.json'),
        '[]',
        'utf-8'
      );
    });

    it('surfaces errors when writing the data file fails', () => {
      writeFileSyncMock.mockImplementation(() => {
        throw new Error('write failed');
      });

      expect(() => ConexaoBD.armazenaDB('usuarios.json', [])).toThrow('write failed');
    });
  });
});
