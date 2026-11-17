import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ResultadoAcao } from '../../libs/release03-model';
import FormR03 from '../release03-form';

const { push, refresh } = vi.hoisted(() => ({
  push: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, refresh }),
}));

describe('formulários de alocação da Release 04', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('confirm', vi.fn());
  });

  it('cancela encerramento ou cancelamento se a confirmação do usuário for recusada', () => {
    vi.mocked(window.confirm).mockReturnValue(false);
    const action = vi.fn<(estado: ResultadoAcao, dados: FormData) => Promise<ResultadoAcao>>();

    render(
      <FormR03 action={action} confirmacao="Deseja encerrar esta alocação?">
        <input name="motivo" defaultValue="Conclusão do acompanhamento" />
      </FormR03>,
    );

    fireEvent.submit(screen.getByRole('button', { name: 'Salvar' }).closest('form')!);

    expect(window.confirm).toHaveBeenCalledWith('Deseja encerrar esta alocação?');
    expect(action).not.toHaveBeenCalled();
  });

  it('preserva motivo informado quando a action retorna erro de validação', async () => {
    const action = vi.fn<(estado: ResultadoAcao, dados: FormData) => Promise<ResultadoAcao>>()
      .mockResolvedValue({ erro: 'Informe o motivo.' });

    render(
      <FormR03 action={action} confirmacao="Deseja cancelar esta alocação?">
        <input name="motivo" aria-label="Motivo" defaultValue="Dados fictícios de teste" />
      </FormR03>,
    );
    vi.mocked(window.confirm).mockReturnValue(true);

    fireEvent.submit(screen.getByRole('button', { name: 'Salvar' }).closest('form')!);

    expect(await screen.findByRole('alert')).toHaveTextContent('Informe o motivo.');
    expect(screen.getByRole('textbox', { name: 'Motivo' })).toHaveValue('Dados fictícios de teste');
    await waitFor(() => expect(action).toHaveBeenCalledOnce());
  });
});
