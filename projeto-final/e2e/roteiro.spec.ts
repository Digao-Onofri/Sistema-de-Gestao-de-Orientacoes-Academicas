import { expect, test, type Page } from '@playwright/test';
import { abrir, entrar, esperarToast, narrar, prepararApresentacao, sair } from './apresentacao';

/**
 * Roteiro de demonstração dos requisitos já implementados do DRE SGOA v1.2.
 * Os passos dependem uns dos outros (o coordenador cria os usuários que depois
 * entram no sistema), por isso rodam em série e compartilham a mesma aba.
 */
test.describe.configure({ mode: 'serial' });

const ADMIN = { email: 'admin@sgoa.edu', senha: 'admin123' };
const TUTOR = { nome: 'Profa. Ana Souza', email: 'ana.souza@sgoa.edu', senha: 'tutor123' };
const TUTORADO = { nome: 'João Pereira', email: 'joao.pereira@sgoa.edu', senha: 'aluno123' };
const TUTORADO_INATIVO = { nome: 'Marina Costa', email: 'marina.costa@sgoa.edu', senha: 'aluno123' };
const UNIDADE = 'Instituto de Matemática e Computação (IMC)';
const CURSO = 'Sistemas de Informação';
const PROPOSTA = 'Recomendação de orientadores com aprendizado de máquina';

let page: Page;

test.beforeAll(async ({ browser }, testInfo) => {
  const context = await browser.newContext({ baseURL: testInfo.project.use.baseURL });
  page = await context.newPage();
  await prepararApresentacao(page);
});

test.afterAll(async () => {
  await page.context().close();
});

async function incluirUsuario(usuario: { nome: string; email: string; senha: string }, perfil: string) {
  await page.getByRole('link', { name: '+ Novo Usuário' }).click();
  // A listagem também tem campos "email" e "situacao" (filtros): espera a tela trocar.
  await expect(page.getByRole('heading', { name: 'Novo Usuário' })).toBeVisible();
  await page.locator('input[name=nome]').fill(usuario.nome);
  await page.locator('input[name=email]').fill(usuario.email);
  await page.locator('input[name=senha]').fill(usuario.senha);
  await page.locator('select[name=perfil]').selectOption(perfil);
  await page.getByRole('button', { name: 'Salvar Usuário' }).click();
  await esperarToast(page, 'Usuário incluído com sucesso!');
  await expect(page).toHaveURL(/\/usuarios$/);
  await expect(page.locator('tbody tr', { hasText: usuario.email })).toBeVisible();
}

test('RF001 · Login com credenciais inválidas exibe mensagem genérica', async () => {
  await abrir(page, '/login');
  await narrar(page, 'RF001 · Autenticar usuário',
    'Primeiro, uma senha errada para um e-mail que existe.');
  await entrar(page, ADMIN.email, 'senha-errada');
  await expect(page.getByText('Credenciais inválidas ou conta inativa.')).toBeVisible();

  await narrar(page, 'RF001 · Mensagem genérica',
    'Agora um e-mail que não existe: a mensagem é a mesma, sem revelar se a conta está cadastrada.');
  await entrar(page, 'ninguem@sgoa.edu', 'qualquer');
  await expect(page.getByText('Credenciais inválidas ou conta inativa.')).toBeVisible();
});

test('RF001 · Login do coordenador', async () => {
  await narrar(page, 'RF001 · Login do coordenador',
    'Com credenciais válidas, o coordenador entra no painel inicial.');
  await entrar(page, ADMIN.email, ADMIN.senha);
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole('heading', { name: 'Bem-vindo ao SGOA' })).toBeVisible();
});

test('RF002 · Coordenador inclui tutor e tutorados', async () => {
  await page.getByRole('link', { name: /Usuários/ }).click();
  await narrar(page, 'RF002 · Incluir usuário',
    'O coordenador cadastra uma tutora e dois tutorados, cada um com seu perfil de acesso.');
  await incluirUsuario(TUTOR, 'Tutor');
  await incluirUsuario(TUTORADO, 'Tutorado');
  await incluirUsuario(TUTORADO_INATIVO, 'Tutorado');
});

test('RF002 · E-mail já cadastrado é recusado', async () => {
  await narrar(page, 'RF002 · E-mail único',
    'Tentativa de cadastrar outra conta com um e-mail que já está em uso.');
  await page.getByRole('link', { name: '+ Novo Usuário' }).click();
  await expect(page.getByRole('heading', { name: 'Novo Usuário' })).toBeVisible();
  await page.locator('input[name=nome]').fill('Cadastro Duplicado');
  await page.locator('input[name=email]').fill(TUTORADO.email);
  await page.locator('input[name=senha]').fill('qualquer123');
  await page.getByRole('button', { name: 'Salvar Usuário' }).click();
  await expect(
    page.getByText('Este e-mail/identificador institucional já está associado a outra conta.')
  ).toBeVisible();
  await expect(page).toHaveURL(/\/usuarios\/novo$/);
});

test('RF009 · Consulta de usuários com filtros e ordenação por e-mail', async () => {
  await abrir(page, '/usuarios');
  await narrar(page, 'RF009 · Consultar usuários',
    'A lista vem em ordem alfabética de e-mail. Vamos filtrar apenas os tutorados.');
  const emails = await page.locator('tbody tr td:nth-child(2)').allTextContents();
  expect(emails).toEqual([...emails].sort((a, b) => a.localeCompare(b)));

  await page.locator('select[name=perfil]').selectOption('Tutorado');
  // O filtro é um formulário GET comum: recarrega a página inteira.
  await page.getByRole('button', { name: 'Filtrar' }).click();
  await expect(page).toHaveURL(/perfil=Tutorado/);
  await page.waitForLoadState('networkidle');
  const linhas = page.locator('tbody tr');
  await expect(linhas).toHaveCount(2);
  for (const perfil of await page.locator('tbody tr td:nth-child(3)').allTextContents()) {
    expect(perfil.trim()).toBe('Tutorado');
  }
  await page.getByRole('link', { name: 'Limpar' }).click();
});

test('RF003 · Inclusão de unidade acadêmica', async () => {
  await page.getByRole('link', { name: /Cursos & Unidades/ }).click();
  await narrar(page, 'RF003 · Incluir unidade acadêmica',
    'A estrutura acadêmica começa pela unidade (instituto ou departamento).');
  await page.getByRole('link', { name: '+ Nova Unidade' }).click();
  await page.locator('input[name=denominacao]').fill(UNIDADE);
  await page.getByRole('button', { name: 'Salvar Unidade' }).click();
  await esperarToast(page, 'Unidade acadêmica incluída com sucesso!');
  await expect(page).toHaveURL(/\/cursos$/);
  await expect(page.getByText(UNIDADE)).toBeVisible();
});

test('RF011 · Inclusão de curso vinculado à unidade', async () => {
  await narrar(page, 'RF011 · Incluir curso',
    'O curso precisa estar ligado a uma unidade já cadastrada.');
  await page.getByRole('link', { name: '+ Novo Curso' }).click();
  await page.locator('input[name=denominacao]').fill(CURSO);
  await page.locator('select[name=unidadeId]').selectOption({ label: UNIDADE });
  await page.getByRole('button', { name: 'Salvar Curso' }).click();
  await esperarToast(page, 'Curso cadastrado com sucesso!');
  const linha = page.locator('tbody tr', { hasText: CURSO });
  await expect(linha).toContainText(UNIDADE);
  await expect(linha).toContainText('Ativo');
});

test('RF012 · Alteração de curso (denominação e situação)', async () => {
  await narrar(page, 'RF012 · Alterar curso',
    'Renomeamos o curso e o marcamos como inativo: ele deixa de ser ofertado em novos ciclos, mas o histórico é mantido.');
  await page.locator('tbody tr', { hasText: CURSO }).getByRole('link', { name: 'Editar' }).click();
  await page.locator('input[name=denominacao]').fill(`Bacharelado em ${CURSO}`);
  await page.locator('select[name=situacao]').selectOption('Inativo');
  await page.getByRole('button', { name: 'Salvar Alterações' }).click();
  await esperarToast(page, 'Curso atualizado com sucesso!');
  const linha = page.locator('tbody tr', { hasText: `Bacharelado em ${CURSO}` });
  await expect(linha).toContainText('Inativo');
});

test('RF013 · Inclusão de período letivo e bloqueio de duplicidade', async () => {
  await page.getByRole('link', { name: /Períodos Letivos/ }).click();
  await narrar(page, 'RF013 · Incluir período letivo',
    'Cadastramos o período 2027/1, que será usado nos ciclos de orientação.');
  await page.getByRole('link', { name: '+ Novo Período' }).click();
  await page.locator('input[name=identificacao]').fill('2027/1');
  await page.getByRole('button', { name: 'Salvar Período' }).click();
  await esperarToast(page, 'Período letivo criado com sucesso!');
  await expect(page.locator('tbody tr', { hasText: '2027/1' })).toBeVisible();

  await narrar(page, 'RF013 · Período duplicado',
    'Ao tentar cadastrar o mesmo período novamente, o sistema recusa.');
  await page.getByRole('link', { name: '+ Novo Período' }).click();
  await page.locator('input[name=identificacao]').fill('2027/1');
  await page.getByRole('button', { name: 'Salvar Período' }).click();
  await expect(page.getByText('Este período letivo já foi cadastrado.')).toBeVisible();
});

test('RF014 · Alteração de período letivo', async () => {
  await abrir(page, '/periodos');
  await narrar(page, 'RF014 · Alterar período letivo',
    'Corrigimos a identificação do período; o registro continua o mesmo.');
  await page.locator('tbody tr', { hasText: '2027/1' }).getByRole('link', { name: 'Editar' }).click();
  await page.locator('input[name=identificacao]').fill('2027/2');
  await page.getByRole('button', { name: 'Salvar Alterações' }).click();
  await esperarToast(page, 'Período letivo atualizado com sucesso!');
  await expect(page.locator('tbody tr', { hasText: '2027/2' })).toBeVisible();
  await expect(page.locator('tbody tr', { hasText: '2027/1' })).toHaveCount(0);
});

test('RF007/RF008 · Coordenador inativa a conta de um usuário', async () => {
  await page.getByRole('link', { name: /Usuários/ }).click();
  await narrar(page, 'RF008 · Alterar situação da conta',
    `O coordenador inativa a conta de ${TUTORADO_INATIVO.nome}. A conta não é excluída.`);
  await page.locator('tbody tr', { hasText: TUTORADO_INATIVO.email })
    .getByRole('link', { name: 'Editar' }).click();
  await expect(page.getByRole('heading', { name: 'Editar Usuário' })).toBeVisible();
  await page.locator('select[name=situacao]').selectOption('Inativa');
  await page.getByRole('button', { name: 'Salvar Alterações' }).click();
  await esperarToast(page, 'Dados atualizados com sucesso!');
  await expect(page.locator('tbody tr', { hasText: TUTORADO_INATIVO.email })).toContainText('Inativa');
});

test('RF006 · Encerrar sessão protege as páginas internas', async () => {
  await narrar(page, 'RF006 · Encerrar sessão',
    'Ao sair, as páginas internas voltam a exigir login.');
  await sair(page);
  await abrir(page, '/dashboard');
  await expect(page).toHaveURL(/\/login$/);
});

test('RF008 · Conta inativa não consegue entrar', async () => {
  await narrar(page, 'RF008 · Conta inativa',
    `${TUTORADO_INATIVO.nome} tenta entrar com a senha correta e é bloqueada.`);
  await entrar(page, TUTORADO_INATIVO.email, TUTORADO_INATIVO.senha);
  await expect(page.getByText('Credenciais inválidas ou conta inativa.')).toBeVisible();
  await expect(page).toHaveURL(/\/login$/);
});

test('RF005 · Tutorado inclui proposta acadêmica', async () => {
  await narrar(page, 'Perfil Tutorado',
    `Agora entramos como o estudante ${TUTORADO.nome}.`);
  await entrar(page, TUTORADO.email, TUTORADO.senha);
  await expect(page).toHaveURL(/\/dashboard$/);

  await page.getByRole('link', { name: /Propostas TCC/ }).click();
  await narrar(page, 'RF005 · Incluir proposta acadêmica',
    'O estudante descreve a proposta: título, tipo (TCC ou IC), resumo e palavras-chave.');
  await page.getByRole('link', { name: '+ Nova Proposta' }).click();
  await page.locator('input[name=titulo]').fill(PROPOSTA);
  await page.locator('select[name=tipo]').selectOption('TCC');
  await page.locator('textarea[name=resumo]').fill(
    'Sistema que sugere orientadores a partir das áreas de interesse e das palavras-chave da proposta.'
  );
  await page.locator('input[name=palavrasChave]').fill('aprendizado de máquina, educação, recomendação');
  await page.getByRole('button', { name: 'Salvar Proposta' }).click();
  await esperarToast(page, 'Proposta acadêmica incluída com sucesso!');
  const linha = page.locator('tbody tr', { hasText: PROPOSTA });
  await expect(linha).toContainText('TCC');
  await expect(linha).toContainText(TUTORADO.nome);
  await expect(linha).toContainText('recomendação');
});

test('RF016 · Tutorado altera a própria proposta', async () => {
  await narrar(page, 'RF016 · Alterar proposta acadêmica',
    'O estudante muda o tipo da proposta para Iniciação Científica e ajusta o título.');
  await page.locator('tbody tr', { hasText: PROPOSTA }).getByRole('link', { name: 'Editar' }).click();
  await page.locator('input[name=titulo]').fill(`${PROPOSTA} (IC)`);
  await page.locator('select[name=tipo]').selectOption('IC');
  await page.getByRole('button', { name: 'Salvar Alterações' }).click();
  await esperarToast(page, 'Proposta atualizada com sucesso!');
  await expect(page.locator('tbody tr', { hasText: `${PROPOSTA} (IC)` })).toContainText('IC');
});

test('RF009/RF007 · Tutorado vê e edita apenas os próprios dados', async () => {
  await page.getByRole('link', { name: /Usuários/ }).click();
  await narrar(page, 'RF009 · Consulta restrita',
    'Para o tutorado, a consulta de usuários mostra só a própria conta e não oferece filtros administrativos.');
  await expect(page.locator('tbody tr')).toHaveCount(1);
  await expect(page.locator('tbody tr')).toContainText(TUTORADO.email);
  await expect(page.getByRole('button', { name: 'Filtrar' })).toHaveCount(0);

  await narrar(page, 'RF007 · Alterar os próprios dados',
    'Ele pode corrigir o nome, mas não o e-mail, o perfil ou a situação da conta.');
  await page.locator('tbody tr').getByRole('link', { name: 'Editar' }).click();
  await expect(page.getByRole('heading', { name: 'Editar Usuário' })).toBeVisible();
  await expect(page.locator('input[name=email]')).toBeDisabled();
  await expect(page.locator('select[name=perfil]')).toHaveCount(0);
  await page.locator('input[name=nome]').fill(`${TUTORADO.nome} da Silva`);
  await page.getByRole('button', { name: 'Salvar Alterações' }).click();
  await esperarToast(page, 'Dados atualizados com sucesso!');
  await expect(page.locator('tbody tr')).toContainText(`${TUTORADO.nome} da Silva`);

  await narrar(page, 'Controle de acesso',
    'Se tentar abrir a conta do coordenador pelo endereço, o acesso é negado.');
  await abrir(page, '/usuarios/coord-default-001');
  await expect(page.getByText('Você não possui permissão para acessar ou modificar esta conta.')).toBeVisible();
});

test('RF006 · Tutorado encerra a sessão', async () => {
  await abrir(page, '/dashboard');
  await sair(page);
  await narrar(page, 'Fim do roteiro',
    'Todos os requisitos implementados até aqui foram demonstrados diretamente na aplicação.');
});
