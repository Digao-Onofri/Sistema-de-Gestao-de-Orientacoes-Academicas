import { pbkdf2Sync } from 'crypto';
import fs from 'fs';
import path from 'path';

const passwordSalt = 'sgoa-playwright-test-salt';

function hashPassword(password: string): string {
  const hash = pbkdf2Sync(password, passwordSalt, 10_000, 64, 'sha512').toString('hex');
  return `${passwordSalt}:${hash}`;
}

export function resetTestData(): void {
  const dataDirectory = process.env.SGOA_DATA_DIR;
  if (!dataDirectory) {
    throw new Error('SGOA_DATA_DIR must point to an isolated Playwright data directory.');
  }

  fs.mkdirSync(dataDirectory, { recursive: true });

  const usuarios = [
    {
      id: 'e2e-coordinator',
      nome: 'Coordenador E2E',
      email: 'coordenador@sgoa.test',
      senha: hashPassword('coordenador123'),
      perfil: 'Coordenador',
      situacao: 'Ativa',
    },
    {
      id: 'e2e-student',
      nome: 'Tutorado E2E',
      email: 'tutorado@sgoa.test',
      senha: hashPassword('tutorado123'),
      perfil: 'Tutorado',
      situacao: 'Ativa',
      dadosAcademicos: 'Sistemas de Informação',
    },
    {
      id: 'e2e-other-student',
      nome: 'Outro Tutorado E2E',
      email: 'outro-tutorado@sgoa.test',
      senha: hashPassword('outro123'),
      perfil: 'Tutorado',
      situacao: 'Ativa',
    },
    {
      id: 'e2e-tutor',
      nome: 'Tutor E2E',
      email: 'tutor@sgoa.test',
      senha: hashPassword('tutor123'),
      perfil: 'Tutor',
      situacao: 'Ativa',
    },
    {
      id: 'e2e-inactive',
      nome: 'Conta Inativa E2E',
      email: 'inativo@sgoa.test',
      senha: hashPassword('inativo123'),
      perfil: 'Tutorado',
      situacao: 'Inativa',
    },
  ];

  const records: Record<string, unknown[]> = {
    'usuarios.json': usuarios,
    'unidades.json': [
      { id: 'e2e-unit-1', denominacao: 'Instituto E2E' },
      { id: 'e2e-unit-2', denominacao: 'Unidade E2E sem cursos' },
    ],
    'cursos.json': [
      {
        id: 'e2e-course-1',
        denominacao: 'Curso E2E',
        unidadeId: 'e2e-unit-1',
        situacao: 'Ativo',
      },
    ],
    'periodos.json': [{ id: 'e2e-period-1', identificacao: '2098/1' }],
    'propostas.json': [
      {
        id: 'e2e-proposal-1',
        tutoradoId: 'e2e-student',
        titulo: 'Proposta E2E',
        resumo: 'Resumo inicial para testes de ponta a ponta.',
        palavrasChave: ['E2E'],
        tipo: 'TCC',
      },
      {
        id: 'e2e-proposal-2',
        tutoradoId: 'e2e-other-student',
        titulo: 'Proposta de outro tutorado',
        resumo: 'Proposta que não deve aparecer para outro estudante.',
        palavrasChave: [],
        tipo: 'IC',
      },
    ],
    'auditoria.json': [],
    'notificacoes.json': [],
  };

  for (const [fileName, data] of Object.entries(records)) {
    fs.writeFileSync(
      path.join(dataDirectory, fileName),
      JSON.stringify(data, null, 2),
      'utf-8'
    );
  }
}

export async function loginAs(
  page: import('@playwright/test').Page,
  email: string,
  password: string
): Promise<void> {
  await page.goto('/login');
  await page.getByLabel(/E-mail ou Identificador Institucional/).fill(email);
  await page.getByLabel('Senha').fill(password);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await page.waitForURL('**/dashboard');
}

export const credentials = {
  coordinator: { email: 'coordenador@sgoa.test', password: 'coordenador123' },
  tutorado: { email: 'tutorado@sgoa.test', password: 'tutorado123' },
  otherTutorado: { email: 'outro-tutorado@sgoa.test', password: 'outro123' },
  tutor: { email: 'tutor@sgoa.test', password: 'tutor123' },
  inactive: { email: 'inativo@sgoa.test', password: 'inativo123' },
};
