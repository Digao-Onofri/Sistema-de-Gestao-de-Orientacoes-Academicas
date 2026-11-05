import { test, expect } from '@playwright/test';
import { criarCicloPelaInterface, prepararDadosR03 } from './support/release03';

test.beforeEach(() => {
  prepararDadosR03();
});

test('coordenação cria, edita, publica, abre e cancela um ciclo', async ({ page }) => {
  test.setTimeout(180000);
  const ciclo = await criarCicloPelaInterface(page);
  await ciclo.getByRole('link', { name: 'Editar rascunho' }).click();
  await page.getByLabel('Critérios de elegibilidade *').fill('Matrícula ativa no curso');
  await page.getByRole('button', { name: 'Salvar rascunho' }).click();
  await page.waitForURL('**/ciclos');
  await expect(ciclo).toContainText('Matrícula ativa no curso');

  const situacao = ciclo.getByRole('combobox', { name: 'Próxima situação', exact: true });
  await situacao.selectOption('Publicado');
  await ciclo.getByRole('button', { name: 'Alterar situação' }).click();
  await expect(situacao.getByRole('option', { name: 'Aberto', exact: true })).toBeAttached();
  await situacao.selectOption('Aberto');
  await ciclo.getByRole('button', { name: 'Alterar situação' }).click();
  await expect(situacao.getByRole('option', { name: 'Encerrado', exact: true })).toBeAttached();

  await situacao.selectOption('Cancelado');
  page.once('dialog', dialog => dialog.dismiss());
  await ciclo.getByRole('button', { name: 'Alterar situação' }).click();
  await expect(situacao).toBeVisible();
  page.once('dialog', dialog => dialog.accept());
  await ciclo.getByRole('button', { name: 'Alterar situação' }).click();
  await expect(ciclo).toContainText('Ciclo cancelado. Os registros e o histórico foram preservados.');
});
