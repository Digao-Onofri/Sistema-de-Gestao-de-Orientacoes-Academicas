import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CampoR03, SituacaoR03, dataR03, tituloCiclo } from '../release03-ui';
import type { CicloOrientacao, Curso, PeriodoLetivo } from '../../types';

const ciclo: CicloOrientacao = {
  id: 'ciclo-1',
  cursoId: 'curso-1',
  periodoId: 'periodo-1',
  modalidade: 'TCC',
  prazoInicio: '2026-01-01',
  prazoFim: '2026-12-31',
  elegibilidade: 'Matrícula ativa',
  regras: 'Indicar tutores',
  situacao: 'Aberto',
};

describe('componentes visuais da Release 03', () => {
  it('associa o título do campo ao controle renderizado', () => {
    render(<CampoR03 titulo="Nome do ciclo"><input type="text" /></CampoR03>);

    expect(screen.getByRole('textbox', { name: 'Nome do ciclo' })).toBeInTheDocument();
  });

  it('monta título do ciclo com curso, período e modalidade', () => {
    const cursos: Curso[] = [{
      id: 'curso-1',
      denominacao: 'Sistemas de Informação',
      unidadeId: 'unidade-1',
      situacao: 'Ativo',
    }];
    const periodos: PeriodoLetivo[] = [{ id: 'periodo-1', identificacao: '2026/2' }];

    expect(tituloCiclo(ciclo, cursos, periodos)).toBe('Sistemas de Informação · 2026/2 · TCC');
    expect(tituloCiclo(ciclo, [], [])).toBe('Curso indisponível · Período indisponível · TCC');
  });

  it('apresenta o rótulo amigável para complementação', () => {
    render(<SituacaoR03 valor="AguardandoComplementacao" />);

    expect(screen.getByText('Aguardando complementação')).toBeInTheDocument();
  });

  it('formata datas de calendário e timestamps no horário de Brasília', () => {
    expect(dataR03('2026-11-05')).toBe('05/11/2026');
    expect(dataR03('2026-11-05T03:00:00.000Z')).toBe('05/11/2026, 00:00');
    expect(dataR03()).toBe('—');
  });
});
