import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ResultadoAcao } from '../../libs/release03-model';
import FormR03 from '../release03-form';

const { push, refresh } = vi.hoisted(() => ({
  push: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, refresh }),
}));

describe('FormR03', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('confirm', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('cancela envio quando a confirmação é recusada', () => {
    vi.mocked(window.confirm).mockReturnValue(false);
    const action = vi.fn<(estado: ResultadoAcao, dados: FormData) => Promise<ResultadoAcao>>();
    render(
      <FormR03 action={action} confirmacao="Confirmar operação?">
        <input name="campo" defaultValue="valor" />
      </FormR03>,
    );

    fireEvent.submit(screen.getByRole('button', { name: 'Salvar' }).closest('form')!);

    expect(window.confirm).toHaveBeenCalledWith('Confirmar operação?');
    expect(action).not.toHaveBeenCalled();
  });

  it('envia sem confirmação quando o campo não corresponde ao valor configurado', async () => {
    vi.mocked(window.confirm).mockReturnValue(false);
    const action = vi.fn<(estado: ResultadoAcao, dados: FormData) => Promise<ResultadoAcao>>();
    render(
      <FormR03 action={action} confirmacao="Cancelar ciclo?" confirmarQuando={{ campo: 'situacao', valor: 'Cancelado' }}>
        <input name="situacao" value="Aberto" readOnly />
      </FormR03>,
    );

    fireEvent.submit(screen.getByRole('button', { name: 'Salvar' }).closest('form')!);

    expect(window.confirm).not.toHaveBeenCalled();
    await waitFor(() => expect(action).toHaveBeenCalledOnce());
  });

  it('solicita confirmação quando o campo corresponde ao valor configurado', () => {
    vi.mocked(window.confirm).mockReturnValue(false);
    const action = vi.fn<(estado: ResultadoAcao, dados: FormData) => Promise<ResultadoAcao>>();
    render(
      <FormR03 action={action} confirmacao="Cancelar ciclo?" confirmarQuando={{ campo: 'situacao', valor: 'Cancelado' }}>
        <input name="situacao" value="Cancelado" readOnly />
      </FormR03>,
    );

    fireEvent.submit(screen.getByRole('button', { name: 'Salvar' }).closest('form')!);

    expect(window.confirm).toHaveBeenCalledWith('Cancelar ciclo?');
    expect(action).not.toHaveBeenCalled();
  });

  it('mostra erro retornado pela ação sem navegar', async () => {
    const action = vi.fn<(estado: ResultadoAcao, dados: FormData) => Promise<ResultadoAcao>>()
      .mockResolvedValue({ erro: 'Não foi possível salvar.' });
    render(
      <FormR03 action={action}>
        <input name="campo" defaultValue="valor" />
      </FormR03>,
    );

    fireEvent.submit(screen.getByRole('button', { name: 'Salvar' }).closest('form')!);

    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível salvar.');
    expect(push).not.toHaveBeenCalled();
    expect(refresh).not.toHaveBeenCalled();
  });

  it('mostra sucesso e navega para o destino quando configurado', async () => {
    vi.mocked(window.confirm).mockReturnValue(true);
    const action = vi.fn<(estado: ResultadoAcao, dados: FormData) => Promise<ResultadoAcao>>()
      .mockResolvedValue({ sucesso: true, mensagem: 'Ciclo salvo.' });
    render(
      <FormR03 action={action} destino="/ciclos">
        <input name="campo" defaultValue="valor" />
      </FormR03>,
    );

    fireEvent.submit(screen.getByRole('button', { name: 'Salvar' }).closest('form')!);

    expect(await screen.findByRole('status')).toHaveTextContent('Ciclo salvo.');
    await waitFor(() => expect(push).toHaveBeenCalledWith('/ciclos'));
    expect(refresh).not.toHaveBeenCalled();
  });
});
