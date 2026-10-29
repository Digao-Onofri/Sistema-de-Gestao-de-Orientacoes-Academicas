import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import DeleteButton from './delete-button';

const { errorToast, successToast } = vi.hoisted(() => ({
  errorToast: vi.fn(),
  successToast: vi.fn(),
}));

vi.mock('react-hot-toast', () => ({
  default: {
    error: errorToast,
    success: successToast,
  },
}));

const confirmMock = vi.fn();

describe('DeleteButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('confirm', confirmMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('calls the provided delete action after confirmation', async () => {
    confirmMock.mockReturnValue(true);
    const onDelete = vi.fn().mockResolvedValue({ sucesso: true });

    render(<DeleteButton onDelete={onDelete} itemLabel="o curso Sistemas" />);

    fireEvent.click(screen.getByRole('button', { name: 'Excluir' }));

    expect(confirmMock).toHaveBeenCalledWith(
      'Tem certeza que deseja excluir o curso Sistemas? Esta ação não pode ser desfeita.'
    );
    await waitFor(() => expect(onDelete).toHaveBeenCalledOnce());
    expect(successToast).toHaveBeenCalledWith('o curso Sistemas excluído com sucesso!');
  });

  it('does not call the delete action when confirmation is canceled', () => {
    confirmMock.mockReturnValue(false);
    const onDelete = vi.fn().mockResolvedValue({ sucesso: true });

    render(<DeleteButton onDelete={onDelete} />);

    fireEvent.click(screen.getByRole('button', { name: 'Excluir' }));

    expect(onDelete).not.toHaveBeenCalled();
    expect(successToast).not.toHaveBeenCalled();
    expect(errorToast).not.toHaveBeenCalled();
  });

  it('shows the error returned by the delete action', async () => {
    confirmMock.mockReturnValue(true);
    const onDelete = vi.fn().mockResolvedValue({ erro: 'Não foi possível excluir.' });

    render(<DeleteButton onDelete={onDelete} />);

    fireEvent.click(screen.getByRole('button', { name: 'Excluir' }));

    await waitFor(() => expect(errorToast).toHaveBeenCalledWith('Não foi possível excluir.'));
    expect(successToast).not.toHaveBeenCalled();
  });
});