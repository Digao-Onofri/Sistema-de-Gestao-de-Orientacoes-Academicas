# Testes automatizados e roteiro de apresentação

O arquivo `roteiro.spec.ts` percorre, direto na aplicação, os requisitos do DRE SGOA v1.2 que já estão implementados. O mesmo roteiro funciona de duas formas:

- **teste automatizado:** valida cada requisito em cerca de 20 segundos, sem abrir janela;
- **apresentação ao vivo:** abre o navegador em câmera lenta, mostra uma legenda com o requisito de cada passo e pausa para explicação.

A ferramenta é o [Playwright](https://playwright.dev). Ela foi escolhida no lugar do Selenium porque usa a mesma linguagem do projeto (TypeScript), instala pelo npm, espera os elementos sozinha e tem modo câmera lenta e relatório com trace.

## Instalação (uma vez por máquina)

Todos os comandos abaixo rodam **dentro da pasta `projeto-final/`**, onde fica o `package.json`.

```bash
cd Sistema-de-Gestao-de-Orientacoes-Academicas/projeto-final
npm install
npx playwright install chromium
```

No Linux/WSL, se faltar alguma biblioteca do sistema, use `npx playwright install --with-deps chromium`.

## Como executar

| Comando | Para quê |
|---|---|
| `npm run test:e2e` (ou `npx playwright test`) | Valida todos os passos sem abrir janela (ensaio, conferência e CI) |
| `npm run demo` | Apresentação automática: cada passo fica 3 s na tela |
| `npm run demo:manual` | Apresentação conduzida: cada passo espera **→** ou **PageDown** (funciona com passador de slides) |
| `npm run e2e:relatorio` | Abre o relatório HTML da última execução (`playwright-report/`), com print e trace das falhas |

Os testes usam `playwright.config.ts`, que roda só o Chromium sem janela. As apresentações usam `playwright.apresentacao.config.ts`, que estende essa base. A separação garante que `npx playwright test` e o CI nunca abram navegador nem fiquem esperando tecla.

Se `npm run dev` já estiver rodando na porta 3000, o Playwright usa esse servidor; se não estiver, ele sobe um sozinho. Para outro endereço, defina `BASE_URL` (por exemplo `BASE_URL=http://localhost:4000 npm run demo`).

Antes de cada execução, o roteiro abre todas as telas uma vez para o `next dev` compilá-las. Assim a apresentação não trava na primeira visita a cada página.

### Dicas para o dia da apresentação

1. Rode `npm run test:e2e` antes de começar: confirma que está tudo funcionando e já deixa as páginas compiladas.
2. No modo manual, clique uma vez dentro da janela do navegador para ela receber as teclas.
3. Não clique nem digite na aplicação durante o roteiro. Ele depende da ordem dos passos, e um clique fora de hora pode quebrar a sequência.

## Dados de teste

O roteiro cria usuários, unidade, curso, período e proposta em `data/`. Antes de começar, ele guarda uma cópia da pasta em `.e2e-backup/` e a restaura no final, mesmo que algum passo falhe. Se a execução for interrompida, a restauração acontece automaticamente na próxima execução (ou use `git checkout -- data/`).

Para **manter** os dados criados depois da demo (por exemplo, para responder perguntas navegando pelo sistema):

```bash
SGOA_MANTER_DADOS=1 npm run demo                 # Linux, macOS, WSL
$env:SGOA_MANTER_DADOS=1; npm run demo           # PowerShell
```

## Roteiro

| # | Requisito | O que aparece na tela | Sugestão de fala |
|---|---|---|---|
| 1 | RF001 | Login com senha errada e depois com e-mail inexistente | "A mensagem é a mesma nos dois casos, para não revelar quais e-mails estão cadastrados." |
| 2 | RF001 | Login do coordenador e painel inicial | "Cada perfil entra com o e-mail institucional." |
| 3 | RF002 | Coordenador cadastra Profa. Ana Souza (Tutor), João Pereira e Marina Costa (Tutorados) | "Somente o coordenador inclui contas e define o perfil de acesso." |
| 4 | RF002 | Tentativa de cadastro com e-mail já usado | "O e-mail institucional é único." |
| 5 | RF009 | Lista em ordem alfabética e filtro por perfil Tutorado | "Filtros por e-mail, perfil e situação." |
| 6 | RF003 | Cadastro do Instituto de Matemática e Computação | "A estrutura acadêmica começa pela unidade." |
| 7 | RF011 | Cadastro do curso Sistemas de Informação vinculado à unidade | "O curso só pode ser ligado a uma unidade existente." |
| 8 | RF012 | Curso renomeado e marcado como Inativo | "Curso inativo não é ofertado em novos ciclos, mas o histórico é preservado." |
| 9 | RF013 | Cadastro do período 2027/1 e recusa do duplicado | "O período identifica os ciclos de orientação." |
| 10 | RF014 | Período corrigido para 2027/2 | "O registro é o mesmo; muda só a identificação." |
| 11 | RF008 | Conta da Marina passa para Inativa | "Inativar não apaga a conta." |
| 12 | RF006 | Sair do sistema e tentar abrir o painel | "Sem sessão, as páginas internas voltam para o login." |
| 13 | RF008 | Marina tenta entrar e é bloqueada | "Conta inativa não autentica." |
| 14 | RF005 | João cria uma proposta de TCC com palavras-chave | "A proposta fica associada ao estudante que a criou." |
| 15 | RF016 | João muda a proposta para IC e ajusta o título | "O estudante mantém a própria proposta atualizada." |
| 16 | RF009 / RF007 | João vê só a própria conta, edita o nome e é barrado na conta do coordenador | "Cada perfil acessa apenas o que lhe cabe." |
| 17 | RF006 | João encerra a sessão | Encerramento da demo. |

## Cobertura e próximos passos

O roteiro cobre os requisitos que funcionam hoje: RF001, RF002, RF003, RF005, RF006, RF007, RF008, RF009, RF011, RF012, RF013, RF014 e a parte implementada do RF016. Quando ciclos, solicitações e alocações forem implementados (RF017 em diante), acrescente os passos novos ao final de `roteiro.spec.ts`, seguindo o mesmo padrão: `narrar(...)`, ações e `expect(...)`.
