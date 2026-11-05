import { afterEach, beforeEach, vi } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { CicloOrientacao, Usuario, PropostaAcademica } from '../../types';
import { gravarR03 } from '../release03-store';

type SessionMock = {
  mockReset(): void;
  mockResolvedValue(value: unknown): void;
};

export const usuarios = [
  { id: 'coord', perfil: 'Coordenador' },
  { id: 'aluno', perfil: 'Tutorado' },
  { id: 'outro', perfil: 'Tutorado' },
  { id: 'tutor', perfil: 'Tutor' },
  { id: 'estranho', perfil: 'Tutor' },
].map(({ id, perfil }) => ({
  id,
  perfil,
  nome: id,
  email: `${id}@teste.invalid`,
  senha: 'segredo-que-nao-pode-vazar',
  situacao: 'Ativa',
  tiposOrientacao: ['TCC'],
})) as Usuario[];

export const ciclo: CicloOrientacao = {
  id: 'ciclo',
  cursoId: 'curso',
  periodoId: 'periodo',
  modalidade: 'TCC',
  prazoInicio: '2026-01-01',
  prazoFim: '2099-12-31',
  elegibilidade: 'Matrícula ativa',
  regras: 'Indicar tutores',
  situacao: 'Aberto',
};

export const proposta: PropostaAcademica = {
  id: 'proposta',
  tutoradoId: 'aluno',
  tipo: 'TCC',
  titulo: '=Proposta; com "acentuação"',
  resumo: 'Resumo',
  palavrasChave: ['pesquisa'],
};

let diretorio: string;

export const dataDirR03 = () => diretorio;

export function autenticar(sessao: SessionMock, id: string) {
  const usuario = usuarios.find(usuario => usuario.id === id);
  if (!usuario) throw new Error(`Usuário de teste desconhecido: ${id}`);
  sessao.mockResolvedValue({ userId: usuario.id, perfil: usuario.perfil, email: usuario.email });
}

export function form(campos: Record<string, string>) {
  const dados = new FormData();
  Object.entries(campos).forEach(([chave, valor]) => dados.set(chave, valor));
  return dados;
}

export const solicitar = () => form({
  cicloId: 'ciclo',
  propostaId: 'proposta',
  tutoresPreferidos: 'tutor',
  elegibilidadeDeclarada: 'on',
});

export function configurarDadosR03(sessao: SessionMock) {
  beforeEach(() => {
    sessao.mockReset();
    diretorio = fs.mkdtempSync(path.join(os.tmpdir(), 'sgoa-r03-test-'));
    vi.stubEnv('SGOA_DATA_DIR', diretorio);
    gravarR03('usuarios.json', usuarios);
    gravarR03('cursos.json', [{ id: 'curso', denominacao: 'Computação', situacao: 'Ativo' }]);
    gravarR03('periodos.json', [{ id: 'periodo', identificacao: '2026/2' }]);
    gravarR03('ciclos.json', [ciclo]);
    gravarR03('propostas.json', [proposta]);
    gravarR03('solicitacoes.json', []);
    autenticar(sessao, 'aluno');
  });

  afterEach(() => {
    fs.rmSync(diretorio, { recursive: true, force: true });
    vi.unstubAllEnvs();
  });
}
