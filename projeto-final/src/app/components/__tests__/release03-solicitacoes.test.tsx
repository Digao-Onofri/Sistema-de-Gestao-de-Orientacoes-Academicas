import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { gravarR03 } from '../../libs/release03-store';
import { consultarSolicitacoes } from '../../libs/release03-queries';
import type { SolicitacaoR03 } from '../../libs/release03-model';
import {
  configurarDadosR03,
  usuarios,
} from '../../libs/__tests__/release03-fixtures';
import { FiltrosSolicitacoes, ListaSolicitacoes } from '../release03-solicitacoes';

const { sessao, push, refresh } = vi.hoisted(() => ({
  sessao: vi.fn(),
  push: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock('../../libs/session', () => ({ getSession: sessao }));
vi.mock('../../libs/release03-actions', () => ({
  decidirSolicitacaoAction: vi.fn(),
  cancelarSolicitacaoAction: vi.fn(),
}));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push, refresh }) }));

describe('componentes de solicitações da Release 03', () => {
  configurarDadosR03(sessao);

  beforeEach(() => vi.clearAllMocks());

  it('exibe filtros administrativos e preserva valores selecionados', () => {
    const coordenador = usuarios[0];
    render(<FiltrosSolicitacoes usuario={coordenador} filtros={{ ciclo: 'ciclo', situacao: 'Pendente' }} />);

    expect(screen.getByRole('combobox', { name: 'Ciclo' })).toHaveValue('ciclo');
    expect(screen.getByRole('combobox', { name: 'Situação' })).toHaveValue('Pendente');
    expect(screen.getByRole('combobox', { name: 'Curso' })).toHaveValue('');
    expect(screen.getByRole('combobox', { name: 'Período' })).toHaveValue('');
    expect(screen.getByRole('combobox', { name: 'Modalidade' })).toHaveValue('');
    expect(screen.getByRole('button', { name: 'Aplicar filtros' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Limpar' })).toHaveAttribute('href', '?');
  });

  it('restringe os filtros de tutor a ciclos e pessoas relacionadas às solicitações recebidas', async () => {
    await gravarSolicitacao();
    const tutor = usuarios[3];
    expect(consultarSolicitacoes(tutor, {})).toHaveLength(1);
    render(<FiltrosSolicitacoes usuario={tutor} filtros={{}} />);

    const ciclos = screen.getByRole('combobox', { name: 'Ciclo' });
    expect(ciclos.querySelector('option[value="ciclo"]')).toHaveTextContent('Computação · 2026/2 · TCC');
    expect(screen.getByRole('combobox', { name: 'Tutor' }).querySelector('option[value="tutor"]')).toHaveTextContent('tutor');
    expect(screen.queryByRole('combobox', { name: 'Curso' })).not.toBeInTheDocument();
    expect(screen.queryByRole('combobox', { name: 'Período' })).not.toBeInTheDocument();
    expect(screen.queryByRole('combobox', { name: 'Modalidade' })).not.toBeInTheDocument();
  });

  it('mostra ações pertinentes ao tutorado proprietário da solicitação pendente', async () => {
    await gravarSolicitacao();
    const linhas = consultarSolicitacoes(usuarios[1], {});
    render(<ListaSolicitacoes linhas={linhas} tutoradoId="aluno" />);

    expect(screen.getByRole('heading', { name: 'Proposta R03' })).toBeInTheDocument();
    expect(screen.getByText('Resumo')).toBeInTheDocument();
    expect(screen.getByText('Palavras-chave: pesquisa')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Editar solicitação' })).toHaveAttribute('href', '/solicitacoes/solicitacao-1');
    expect(screen.getByRole('button', { name: 'Cancelar solicitação' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Registrar decisão' })).not.toBeInTheDocument();
  });

  it('exibe controles de decisão apenas para o tutor preferido e solicitação pendente', async () => {
    await gravarSolicitacao();
    const linhas = consultarSolicitacoes(usuarios[3], {});
    render(<ListaSolicitacoes linhas={linhas} tutorId="tutor" />);

    expect(screen.getByRole('combobox', { name: 'Decisão *' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Solicitar complementação' })).toHaveValue('SolicitarComplementacao');
    expect(screen.getByRole('textbox', { name: 'Justificativa (obrigatória para recusa ou complementação)' })).toHaveAttribute('maxLength', '5000');
    expect(screen.getByRole('button', { name: 'Registrar decisão' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Cancelar solicitação' })).not.toBeInTheDocument();
  });

  it('exibe status terminal e informações da decisão sem ações de edição ou cancelamento', async () => {
    await gravarSolicitacao({
      situacao: 'Cancelada',
      cancelamento: { dataCancelamento: '2026-11-05T12:00:00.000Z', tutoradoId: 'aluno' },
    });
    const linhas = consultarSolicitacoes(usuarios[1], {});
    render(<ListaSolicitacoes linhas={linhas} tutoradoId="aluno" />);

    expect(screen.getByText('Cancelada')).toBeInTheDocument();
    expect(screen.getByText(/O registro permanece no histórico/)).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Editar solicitação' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Cancelar solicitação' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Registrar decisão' })).not.toBeInTheDocument();
  });

  it('explica que aceitar a solicitação não confirma alocação definitiva', async () => {
    await gravarSolicitacao({
      situacao: 'Aceita',
      decisao: {
        resultado: 'Aceitar',
        dataDecisao: '2026-11-05T12:00:00.000Z',
        tutorId: 'tutor',
      },
    });
    const linhas = consultarSolicitacoes(usuarios[1], {});
    render(<ListaSolicitacoes linhas={linhas} tutoradoId="aluno" />);

    expect(screen.getByText('Decisão: Aceitar · 05/11/2026, 09:00 · tutor')).toBeInTheDocument();
    expect(screen.getByText('O aceite do tutor não confirma uma alocação definitiva.')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Editar solicitação' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Cancelar solicitação' })).not.toBeInTheDocument();
  });

  it('mostra mensagem de lista vazia', () => {
    render(<ListaSolicitacoes linhas={[]} />);

    expect(screen.getByText('Nenhuma solicitação encontrada.')).toBeInTheDocument();
  });
});

async function gravarSolicitacao(alteracoes: Partial<SolicitacaoR03> = {}) {
  const solicitacao: SolicitacaoR03 = {
    id: 'solicitacao-1',
    cicloId: 'ciclo',
    propostaId: 'proposta',
    tutoradoId: 'aluno',
    tutoresPreferidos: ['tutor'],
    situacao: 'Pendente',
    dataSolicitacao: '2026-11-05T12:00:00.000Z',
    propostaSubmetida: {
      id: 'proposta',
      tutoradoId: 'aluno',
      titulo: 'Proposta R03',
      resumo: 'Resumo',
      palavrasChave: ['pesquisa'],
      tipo: 'TCC',
    },
    ...alteracoes,
  };
  gravarR03('solicitacoes.json', [solicitacao]);
}
