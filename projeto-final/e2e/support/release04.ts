import { pbkdf2Sync } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { resetTestData, loginAs } from './test-data';

function hashPassword(password: string): string {
  const salt = 'sgoa-release04-e2e-salt';
  return `${salt}:${pbkdf2Sync(password, salt, 10_000, 64, 'sha512').toString('hex')}`;
}

const release04Tutor = {
  id: 'r04-e2e-tutor',
  nome: 'Tutor R04 E2E',
  email: 'tutor-r04@sgoa.test',
  senha: hashPassword('tutor-r04-e2e'),
  perfil: 'Tutor',
  situacao: 'Ativa',
  tiposOrientacao: ['TCC'],
  limiteOrientandos: 3,
};

const release04OtherTutor = {
  id: 'r04-e2e-outro-tutor',
  nome: 'Outro tutor R04 E2E',
  email: 'outro-tutor-r04@sgoa.test',
  senha: hashPassword('outro-tutor-r04-e2e'),
  perfil: 'Tutor',
  situacao: 'Ativa',
  tiposOrientacao: ['TCC'],
  limiteOrientandos: 3,
};

export const release04Credentials = {
  coordinator: { email: 'coordenador@sgoa.test', password: 'coordenador123' },
  tutor: { email: release04Tutor.email, password: 'tutor-r04-e2e' },
  tutorado: { email: 'tutorado@sgoa.test', password: 'tutorado123' },
  otherTutorado: { email: 'outro-tutorado@sgoa.test', password: 'outro123' },
  otherTutor: { email: release04OtherTutor.email, password: 'outro-tutor-r04-e2e' },
};

const cicloBase = {
  id: 'r04-e2e-ciclo',
  cursoId: 'r04-e2e-curso',
  periodoId: 'r04-e2e-periodo',
  modalidade: 'TCC',
  prazoInicio: '2026-01-01',
  prazoFim: '2099-12-31',
  elegibilidade: 'Dados fictícios para teste',
  regras: 'Dados fictícios para teste',
  situacao: 'Aberto',
};

const proposta = {
  id: 'r04-e2e-proposta',
  tutoradoId: 'e2e-student',
  titulo: 'Proposta R04 E2E',
  resumo: 'Resumo fictício de E2E',
  palavrasChave: ['teste'],
  tipo: 'TCC',
};

const propostaOutroTutorado = {
  id: 'r04-e2e-proposta-outra',
  tutoradoId: 'e2e-other-student',
  titulo: 'Proposta de outro tutorado R04 E2E',
  resumo: 'Resumo fictício de E2E',
  palavrasChave: ['teste'],
  tipo: 'TCC',
};

function dataDirectory(): string {
  const directory = process.env.SGOA_DATA_DIR;
  if (!directory || path.resolve(directory) === path.resolve('data')) {
    throw new Error('Dados isolados obrigatórios para testes E2E da Release 04.');
  }
  return directory;
}

function gravar(nome: string, dados: unknown[]) {
  fs.writeFileSync(path.join(dataDirectory(), nome), JSON.stringify(dados, null, 2), 'utf-8');
}

export function prepararDadosR04() {
  resetTestData();
  const usuarios = JSON.parse(fs.readFileSync(path.join(dataDirectory(), 'usuarios.json'), 'utf-8')) as Array<Record<string, unknown>>;
  const tutorBase = usuarios.find((usuario) => usuario.id === 'e2e-tutor');
  if (tutorBase) {
    tutorBase.limiteOrientandos = 3;
    tutorBase.tiposOrientacao = ['TCC'];
  }
  gravar('usuarios.json', [...usuarios, release04Tutor, release04OtherTutor]);
  gravar('cursos.json', [
    { id: 'r04-e2e-curso', denominacao: 'Curso R04 E2E', unidadeId: 'e2e-unit-1', situacao: 'Ativo' },
  ]);
  gravar('periodos.json', [{ id: 'r04-e2e-periodo', identificacao: '2099/1' }]);
  gravar('propostas.json', [proposta, propostaOutroTutorado]);
  gravar('ciclos.json', [cicloBase]);
  gravar('solicitacoes.json', []);
  gravar('alocacoes.json', []);
  gravar('etapas.json', []);
  gravar('reunioes.json', []);
  gravar('notificacoes.json', []);
  gravar('auditoria.json', []);
}

export function prepararAlocacaoAtivaR04() {
  gravar('alocacoes.json', [{
    id: 'r04-e2e-alocacao',
    tutorId: release04Tutor.id,
    tutoradoId: 'e2e-student',
    propostaId: proposta.id,
    cicloId: cicloBase.id,
    situacao: 'Ativa',
    dataConfirmacao: '2026-11-05T12:00:00.000Z',
    coordenadorId: 'e2e-coordinator',
  }]);
}

export { loginAs };
