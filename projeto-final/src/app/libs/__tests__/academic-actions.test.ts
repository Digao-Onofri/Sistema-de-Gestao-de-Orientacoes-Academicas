// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Curso, PeriodoLetivo, UnidadeAcademica } from '../../types';

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
  alterarCursoAction,
  alterarPeriodoAction,
  criarCursoAction,
  criarPeriodoAction,
  criarUnidadeAction,
  excluirCursoAction,
  excluirPeriodoAction,
  excluirUnidadeAction,
} from '../academic-actions';

const coordenador = {
  userId: 'coordinator-1',
  email: 'coord@example.com',
  perfil: 'Coordenador',
};

const tutor = {
  userId: 'tutor-1',
  email: 'tutor@example.com',
  perfil: 'Tutor',
};

const unidadesIniciais: UnidadeAcademica[] = [
  { id: 'unit-1', denominacao: 'Instituto de Computação' },
  { id: 'unit-2', denominacao: 'Instituto de Matemática' },
];

const cursosIniciais: Curso[] = [
  {
    id: 'course-1',
    denominacao: 'Sistemas de Informação',
    unidadeId: 'unit-1',
    situacao: 'Ativo',
  },
];

const periodosIniciais: PeriodoLetivo[] = [
  { id: 'period-1', identificacao: '2026/1' },
];

let unidades: UnidadeAcademica[];
let cursos: Curso[];
let periodos: PeriodoLetivo[];

function criarForm(campos: Record<string, string>) {
  const formData = new FormData();
  for (const [campo, valor] of Object.entries(campos)) {
    formData.set(campo, valor);
  }
  return formData;
}

describe('academic actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    unidades = structuredClone(unidadesIniciais);
    cursos = structuredClone(cursosIniciais);
    periodos = structuredClone(periodosIniciais);

    getSessionMock.mockResolvedValue(coordenador);
    returnDatabaseMock.mockImplementation((arquivo: string) => {
      if (arquivo === 'unidades.json') return unidades;
      if (arquivo === 'cursos.json') return cursos;
      if (arquivo === 'periodos.json') return periodos;
      throw new Error(`Arquivo inesperado: ${arquivo}`);
    });
    storeDatabaseMock.mockImplementation((arquivo: string, dados: unknown[]) => {
      if (arquivo === 'unidades.json') unidades = dados as UnidadeAcademica[];
      if (arquivo === 'cursos.json') cursos = dados as Curso[];
      if (arquivo === 'periodos.json') periodos = dados as PeriodoLetivo[];
    });
    auditMock.mockResolvedValue(undefined);
    uuidMock.mockReturnValue('new-record-id');
  });

  describe('criarUnidadeAction', () => {
    it('allows only a coordinator to create a unit', async () => {
      getSessionMock.mockResolvedValue(tutor);

      await expect(
        criarUnidadeAction(null, criarForm({ denominacao: 'Nova unidade' }))
      ).resolves.toMatchObject({ erro: expect.any(String) });

      expect(storeDatabaseMock).not.toHaveBeenCalled();
    });

    it('requires a non-empty unit name', async () => {
      await expect(
        criarUnidadeAction(null, criarForm({ denominacao: '   ' }))
      ).resolves.toEqual({ erro: 'A denominação da unidade acadêmica é obrigatória.' });

      expect(storeDatabaseMock).not.toHaveBeenCalled();
    });

    it('trims and persists the required unit name', async () => {
      await expect(
        criarUnidadeAction(null, criarForm({ denominacao: '  Nova unidade  ' }))
      ).resolves.toEqual({ sucesso: true });

      expect(unidades.at(-1)).toEqual({
        id: 'new-record-id',
        denominacao: 'Nova unidade',
      });
      expect(storeDatabaseMock).toHaveBeenCalledWith('unidades.json', unidades);
      expect(revalidatePathMock).toHaveBeenCalledWith('/cursos');
    });
  });

  describe('excluirUnidadeAction', () => {
    it('allows only a coordinator to delete a unit', async () => {
      getSessionMock.mockResolvedValue(tutor);

      await expect(excluirUnidadeAction('unit-2')).resolves.toMatchObject({
        erro: expect.any(String),
      });

      expect(storeDatabaseMock).not.toHaveBeenCalled();
    });

    it('prevents deleting a unit that has associated courses', async () => {
      await expect(excluirUnidadeAction('unit-1')).resolves.toEqual({
        erro: 'Não é possível excluir esta unidade pois existem cursos vinculados a ela.',
      });

      expect(storeDatabaseMock).not.toHaveBeenCalled();
    });

    it('rejects deleting a unit that does not exist', async () => {
      await expect(excluirUnidadeAction('missing-unit')).resolves.toEqual({
        erro: 'Unidade não encontrada.',
      });

      expect(storeDatabaseMock).not.toHaveBeenCalled();
    });

    it('deletes an unlinked unit and records the action', async () => {
      await expect(excluirUnidadeAction('unit-2')).resolves.toEqual({ sucesso: true });

      expect(unidades.map(({ id }) => id)).toEqual(['unit-1']);
      expect(storeDatabaseMock).toHaveBeenCalledWith('unidades.json', unidades);
      expect(auditMock).toHaveBeenCalledWith(
        coordenador.userId,
        coordenador.email,
        'UnidadeAcademica',
        'EXCLUSAO',
        'Unidade Instituto de Matemática excluída.'
      );
      expect(revalidatePathMock).toHaveBeenCalledWith('/cursos');
    });
  });

  describe('criarCursoAction', () => {
    it('allows only a coordinator to create a course', async () => {
      getSessionMock.mockResolvedValue(tutor);

      await expect(
        criarCursoAction(
          null,
          criarForm({ denominacao: 'Novo curso', unidadeId: 'unit-1' })
        )
      ).resolves.toMatchObject({ erro: expect.any(String) });

      expect(storeDatabaseMock).not.toHaveBeenCalled();
    });

    it.each([
      ['denominação', { unidadeId: 'unit-1' }],
      ['unidade', { denominacao: 'Novo curso' }],
    ])('requires the course %s', async (_campo, campos) => {
      await expect(criarCursoAction(null, criarForm(campos))).resolves.toMatchObject({
        erro: expect.any(String),
      });

      expect(storeDatabaseMock).not.toHaveBeenCalled();
    });

    it('rejects a unit that does not exist', async () => {
      await expect(
        criarCursoAction(
          null,
          criarForm({ denominacao: 'Novo curso', unidadeId: 'missing-unit' })
        )
      ).resolves.toEqual({ erro: 'A unidade acadêmica selecionada não existe.' });

      expect(storeDatabaseMock).not.toHaveBeenCalled();
    });

    it.each(['Ativo', 'Inativo'] as const)(
      'creates a course with the requested %s status',
      async (situacao) => {
        await expect(
          criarCursoAction(
            null,
            criarForm({
              denominacao: '  Novo curso  ',
              unidadeId: 'unit-1',
              situacao,
            })
          )
        ).resolves.toEqual({ sucesso: true });

        expect(cursos.at(-1)).toEqual({
          id: 'new-record-id',
          denominacao: 'Novo curso',
          unidadeId: 'unit-1',
          situacao,
        });
        expect(storeDatabaseMock).toHaveBeenCalledWith('cursos.json', cursos);
        expect(revalidatePathMock).toHaveBeenCalledWith('/cursos');
      }
    );
  });

  describe('alterarCursoAction', () => {
    it('allows only a coordinator to update a course', async () => {
      getSessionMock.mockResolvedValue(tutor);

      await expect(
        alterarCursoAction(
          null,
          criarForm({
            id: 'course-1',
            denominacao: 'Curso alterado',
            unidadeId: 'unit-2',
            situacao: 'Ativo',
          })
        )
      ).resolves.toMatchObject({ erro: expect.any(String) });

      expect(storeDatabaseMock).not.toHaveBeenCalled();
    });

    it('requires the name, unit, and status', async () => {
      await expect(
        alterarCursoAction(
          null,
          criarForm({ id: 'course-1', denominacao: 'Curso alterado', unidadeId: 'unit-2' })
        )
      ).resolves.toEqual({ erro: 'Todos os campos são obrigatórios.' });

      expect(storeDatabaseMock).not.toHaveBeenCalled();
    });

    it('rejects an unknown course', async () => {
      await expect(
        alterarCursoAction(
          null,
          criarForm({
            id: 'missing-course',
            denominacao: 'Curso alterado',
            unidadeId: 'unit-2',
            situacao: 'Ativo',
          })
        )
      ).resolves.toEqual({ erro: 'Curso não encontrado.' });

      expect(storeDatabaseMock).not.toHaveBeenCalled();
    });

    it('persists a selected unit identifier without checking that the unit exists', async () => {
      await expect(
        alterarCursoAction(
          null,
          criarForm({
            id: 'course-1',
            denominacao: 'Curso alterado',
            unidadeId: 'missing-unit',
            situacao: 'Ativo',
          })
        )
      ).resolves.toEqual({ sucesso: true });

      expect(cursos[0]).toMatchObject({
        id: 'course-1',
        denominacao: 'Curso alterado',
        unidadeId: 'missing-unit',
        situacao: 'Ativo',
      });
      expect(storeDatabaseMock).toHaveBeenCalledWith('cursos.json', cursos);
    });

    it('updates course fields without changing its technical identifier', async () => {
      await expect(
        alterarCursoAction(
          null,
          criarForm({
            id: 'course-1',
            denominacao: '  Sistemas atualizados  ',
            unidadeId: 'unit-2',
            situacao: 'Inativo',
          })
        )
      ).resolves.toEqual({ sucesso: true });

      expect(cursos[0]).toEqual({
        id: 'course-1',
        denominacao: 'Sistemas atualizados',
        unidadeId: 'unit-2',
        situacao: 'Inativo',
      });
      expect(storeDatabaseMock).toHaveBeenCalledWith('cursos.json', cursos);
      expect(revalidatePathMock).toHaveBeenCalledWith('/cursos');
    });
  });

  describe('excluirCursoAction', () => {
    it('allows only a coordinator to delete a course', async () => {
      getSessionMock.mockResolvedValue(tutor);

      await expect(excluirCursoAction('course-1')).resolves.toMatchObject({
        erro: expect.any(String),
      });

      expect(storeDatabaseMock).not.toHaveBeenCalled();
    });

    it('rejects deleting a course that does not exist', async () => {
      await expect(excluirCursoAction('missing-course')).resolves.toEqual({
        erro: 'Curso não encontrado.',
      });

      expect(storeDatabaseMock).not.toHaveBeenCalled();
    });

    it('deletes only the requested course and records the action', async () => {
      cursos.push({
        id: 'course-2',
        denominacao: 'Engenharia',
        unidadeId: 'unit-2',
        situacao: 'Ativo',
      });

      await expect(excluirCursoAction('course-1')).resolves.toEqual({ sucesso: true });

      expect(cursos.map(({ id }) => id)).toEqual(['course-2']);
      expect(storeDatabaseMock).toHaveBeenCalledWith('cursos.json', cursos);
      expect(auditMock).toHaveBeenCalledWith(
        coordenador.userId,
        coordenador.email,
        'Curso',
        'EXCLUSAO',
        'Curso Sistemas de Informação excluído.'
      );
      expect(revalidatePathMock).toHaveBeenCalledWith('/cursos');
    });
  });

  describe('criarPeriodoAction', () => {
    it('allows only a coordinator to create a period', async () => {
      getSessionMock.mockResolvedValue(tutor);

      await expect(
        criarPeriodoAction(null, criarForm({ identificacao: '2027/1' }))
      ).resolves.toMatchObject({ erro: expect.any(String) });

      expect(storeDatabaseMock).not.toHaveBeenCalled();
    });

    it('requires a non-empty period identifier', async () => {
      await expect(
        criarPeriodoAction(null, criarForm({ identificacao: '   ' }))
      ).resolves.toEqual({ erro: 'A identificação do período letivo é obrigatória.' });

      expect(storeDatabaseMock).not.toHaveBeenCalled();
    });

    it('rejects a case-insensitive duplicate as current implementation behavior', async () => {
      await expect(
        criarPeriodoAction(null, criarForm({ identificacao: ' 2026/1 ' }))
      ).resolves.toEqual({ erro: 'Este período letivo já foi cadastrado.' });

      expect(storeDatabaseMock).not.toHaveBeenCalled();
    });

    it('creates a period with the requested identifier', async () => {
      await expect(
        criarPeriodoAction(null, criarForm({ identificacao: ' 2027/1 ' }))
      ).resolves.toEqual({ sucesso: true });

      expect(periodos.at(-1)).toEqual({
        id: 'new-record-id',
        identificacao: '2027/1',
      });
      expect(storeDatabaseMock).toHaveBeenCalledWith('periodos.json', periodos);
      expect(revalidatePathMock).toHaveBeenCalledWith('/periodos');
    });
  });

  describe('alterarPeriodoAction', () => {
    it('allows only a coordinator to update a period', async () => {
      getSessionMock.mockResolvedValue(tutor);

      await expect(
        alterarPeriodoAction(
          null,
          criarForm({ id: 'period-1', identificacao: '2026/2' })
        )
      ).resolves.toMatchObject({ erro: expect.any(String) });

      expect(storeDatabaseMock).not.toHaveBeenCalled();
    });

    it('requires a non-empty period identifier', async () => {
      await expect(
        alterarPeriodoAction(
          null,
          criarForm({ id: 'period-1', identificacao: '   ' })
        )
      ).resolves.toEqual({ erro: 'A identificação do período letivo é obrigatória.' });

      expect(storeDatabaseMock).not.toHaveBeenCalled();
    });

    it('rejects updating a period that does not exist', async () => {
      await expect(
        alterarPeriodoAction(
          null,
          criarForm({ id: 'missing-period', identificacao: '2026/2' })
        )
      ).resolves.toEqual({ erro: 'Período não encontrado.' });

      expect(storeDatabaseMock).not.toHaveBeenCalled();
    });

    it('changes the identifier without changing the technical id', async () => {
      await expect(
        alterarPeriodoAction(
          null,
          criarForm({ id: 'period-1', identificacao: ' 2026/2 ' })
        )
      ).resolves.toEqual({ sucesso: true });

      expect(periodos[0]).toEqual({
        id: 'period-1',
        identificacao: '2026/2',
      });
      expect(storeDatabaseMock).toHaveBeenCalledWith('periodos.json', periodos);
      expect(revalidatePathMock).toHaveBeenCalledWith('/periodos');
    });
  });

  describe('excluirPeriodoAction', () => {
    it('allows only a coordinator to delete a period', async () => {
      getSessionMock.mockResolvedValue(tutor);

      await expect(excluirPeriodoAction('period-1')).resolves.toMatchObject({
        erro: expect.any(String),
      });

      expect(storeDatabaseMock).not.toHaveBeenCalled();
    });

    it('rejects deleting a period that does not exist', async () => {
      await expect(excluirPeriodoAction('missing-period')).resolves.toEqual({
        erro: 'Período não encontrado.',
      });

      expect(storeDatabaseMock).not.toHaveBeenCalled();
    });

    it('deletes only the requested period and records the action', async () => {
      periodos.push({ id: 'period-2', identificacao: '2026/2' });

      await expect(excluirPeriodoAction('period-1')).resolves.toEqual({ sucesso: true });

      expect(periodos).toEqual([{ id: 'period-2', identificacao: '2026/2' }]);
      expect(storeDatabaseMock).toHaveBeenCalledWith('periodos.json', periodos);
      expect(auditMock).toHaveBeenCalledWith(
        coordenador.userId,
        coordenador.email,
        'PeriodoLetivo',
        'EXCLUSAO',
        'Período letivo 2026/1 excluído.'
      );
      expect(revalidatePathMock).toHaveBeenCalledWith('/periodos');
    });
  });
});
