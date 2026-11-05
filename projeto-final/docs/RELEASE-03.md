# Release 03 do SGOA

Revisão incremental das atividades A19 a A24 em 04/11/2026, na branch local `feat/release-03`. O objetivo é completar o CRUD de solicitações e limpar os textos visíveis, preservando os módulos existentes e o histórico acadêmico. Não houve commits, merges, pushes, tags ou alteração de cronogramas POD.

## Escopo e rastreabilidade

O pedido atual do usuário autoriza a edição e o cancelamento de solicitações pendentes e a remoção dos códigos de requisitos de todas as telas. Os documentos da Release 00 são especificações de domínio; não são instruções operacionais para publicar ou alterar dados.

| Task | Referência antiga | DRE v1.2 | Resultado funcional |
| --- | --- | --- | --- |
| A19 | RF006 | RF017, RF023–RF028 | Criação, consulta filtrada, edição de rascunhos, publicação, abertura, encerramento e cancelamento lógico de ciclos; confirmação antes de cancelar |
| A20 | RF008 | RF019, RF029 | Criação e consulta por perfil; edição própria pendente e vigente; cancelamento lógico próprio pendente; compatibilidade com registros existentes |
| A21 | RF009 | RF020 | Aceite, recusa e complementação preservados; solicitação cancelada não pode receber decisão |
| A22 | RF015 | RF035/RF040 parciais | Relatório e CSV com filtros, incluindo o estado Cancelada; sem indicadores de alocação ou vagas |
| A23 | Verificação R03 | Testes unitários e E2E | Permissões, estados, integridade, concorrência, textos, decisões e exportação |
| A24 | Consolidação | Documentação e matriz acima | Este documento e relatório da revisão; nenhuma publicação ou tag |

O DRE detalha o fluxo de avaliação, mas não especifica operações de desistência ou edição de solicitações. O pedido atual acrescenta essas operações. Foi incluído o estado terminal Cancelada, mantendo todos os estados anteriores e sem converter cancelamento em decisão do tutor. O DRE proíbe mais de uma solicitação da mesma proposta no mesmo ciclo; essa validação continua incluindo registros cancelados.

## Operações disponíveis

| Entidade | Criar | Consultar | Editar | Retirar de uso |
| --- | --- | --- | --- | --- |
| Ciclo | Coordenador; inicia em Rascunho | Coordenador e tutorado, com filtros | Coordenador; somente Rascunho | Cancelamento lógico em Rascunho, Publicado ou Aberto; mantém vínculos e histórico |
| Solicitação | Tutorado ativo; proposta própria e ciclo aberto no prazo | Tutorado: próprias; tutor: recebidas; coordenador: todas | Autor; Pendente, sem decisão, ciclo aberto dentro do prazo | Autor; Pendente e sem decisão, inclusive após o prazo; mantém registro e histórico |

Não há exclusão física. Encerrado e Cancelado são terminais para ciclos. Aceita, Recusada, AguardandoComplementacao e Cancelada não admitem edição ou cancelamento pelo estudante.

## Como utilizar

1. Coordenador: abrir **Ciclos de orientação**, criar ou editar um rascunho, publicar e abrir. O menu de próxima situação respeita as transições existentes. Cancelar exige confirmação e informa que o histórico foi preservado.
2. Tutorado: abrir **Solicitações de orientação**, criar uma solicitação escolhendo proposta compatível e tutores ativos. A elegibilidade exige declaração explícita.
3. Enquanto a solicitação estiver pendente e o ciclo estiver aberto no prazo, usar **Editar solicitação**. É possível trocar a proposta e as preferências. O ciclo, o identificador e a data original de envio são mantidos; a última atualização é registrada.
4. Para desistir de uma solicitação pendente sem decisão, usar **Cancelar solicitação** e confirmar. Rejeitar a confirmação não altera o registro. O cancelamento é terminal e não libera outra solicitação da mesma proposta no mesmo ciclo.
5. Tutor: avaliar as solicitações pendentes recebidas. Recusa e complementação exigem justificativa. Solicitações canceladas ficam consultáveis, sem botão de decisão.
6. Coordenador: abrir **Relatório de solicitações**, filtrar por situação, ciclo ou outros campos e exportar CSV. O filtro **Cancelada** inclui as desistências sem removê-las do histórico.

Rotas: `/ciclos`, `/ciclos/novo`, `/ciclos/[id]`, `/solicitacoes`, `/solicitacoes/nova`, `/solicitacoes/[id]`, `/relatorio-solicitacoes` e `/relatorio-solicitacoes/csv`.

## Regras e implementação

- Next.js, React, TypeScript, Tailwind, Server Actions e JSON foram mantidos. O formulário de nova solicitação foi reutilizado na edição e a validação de criação/edição é compartilhada.
- As ações verificam a conta atual no JSON, perfil, situação ativa e autoria. O servidor valida o estado novamente no momento de salvar, mesmo que a tela já esteja aberta.
- Edição não transfere a solicitação para outro ciclo. Valida proposta própria, modalidade, tutores ativos que ofereçam a modalidade, declaração de elegibilidade, prazo e ausência de outra solicitação para a mesma proposta/ciclo.
- Cancelamento não exige prazo vigente: o pedido limita a edição ao prazo e permite desistir de solicitações ainda pendentes. Exige autoria e ausência de decisão e preserva a proposta, preferências e data original.
- `SituacaoSolicitacao` recebeu a alternativa aditiva `Cancelada`. A extensão `SolicitacaoR03` possui campos opcionais `dataAtualizacao` e `cancelamento` com data e tutorado responsável. Registros antigos continuam válidos, sem migração ou regravação em massa.
- `propostaSubmetida` preserva a versão enviada. Na edição pendente, recebe a nova escolha/conteúdo. Na decisão ou cancelamento de um registro legado sem cópia, captura a proposta disponível quando possível; versões antigas não armazenadas não podem ser reconstruídas.
- Datas de ciclo são inclusivas e usam America/Sao_Paulo. Envio, edição, decisão e cancelamento guardam timestamps ISO.
- O fluxo de ciclos permanece Rascunho → Publicado → Aberto → Encerrado; cancelamento permitido nos três primeiros estados. Edição após publicação continua bloqueada, pois a regra institucional correspondente permanece indefinida no DRE.
- A primeira decisão de um tutor indicado resolve a solicitação. A decisão registra responsável, data, resultado e justificativa. Aceitar não confirma alocação.
- Leitura e gravação novas continuam síncronas, sem await no intervalo de leitura/validação/gravação. No processo local único, isso impede que cancelamento e decisão concorrentes sejam gravados como se ambos tivessem sido aceitos. JSON inválido não é convertido em uma lista vazia; a gravação usa temporário e renomeação.
- CSV mantém UTF-8/BOM, ponto e vírgula, CRLF, escape de aspas e proteção contra fórmulas. Inclui o estado Cancelada, sem ampliar permissões ou exportar senhas/e-mails. Filtros e ordenação da consulta foram preservados.
- Confirmações usam o componente de formulário existente. A janela de confirmação é acompanhada de validação no servidor; não substitui verificação de permissão ou estado.
- Os códigos RF foram removidos somente dos textos visíveis e mensagens de erro. Comentários técnicos, títulos de testes e documentação de rastreabilidade permanecem. Nenhuma regra de negócio das Releases 1 e 2 foi alterada por essa limpeza.

## Verificação

Os resultados efetivamente executados nesta revisão são registrados ao final deste documento. Todos os testes usam dados temporários. Os hashes dos 12 JSONs originais são comparados com os valores anteriores à revisão, inclusive `auditoria.json`, que já estava modificado ao início.

Com Node/npm no PATH:

```bash
npx tsc --noEmit
npm test -- --run --pool=threads --maxWorkers=1
npm run build
npm run test:e2e -- --timeout=120000
# Apenas os cenários R03:
npm run test:e2e -- --project=release03
```

A suíte E2E ampliada verifica criação, edição, publicação e cancelamento do ciclo; criação, edição e cancelamento da solicitação; aceitar ou rejeitar confirmações; bloqueio de edição após decisão; histórico no relatório/CSV; e ausência de códigos RF nas telas antigas. Os testes unitários cobrem também recusa e complementação, autoria, perfil, tutores inválidos, prazos, modalidades, duplicidade, registros legados, JSON corrompido e concorrência.

Para não interferir no servidor original, os testes de navegador e build desta revisão podem ser executados em cópia de verificação com fontes idênticas e dependências do mesmo lockfile. Os dados originais não são copiados para os testes.

## Execução local

No terminal WSL/Linux mostrado pelo usuário:

```bash
cd /mnt/d/adler/Sistema-de-Gestao-de-Orientacoes-Academicas/projeto-final
npm run dev
```

No PowerShell, com Node/npm no PATH:

```powershell
cd D:\adler\Sistema-de-Gestao-de-Orientacoes-Academicas\projeto-final
npm run dev
```

O endereço é o anunciado pelo Next.js, normalmente http://localhost:3000. Caso já exista servidor aberto, recarregue a página para receber as alterações. Use as credenciais existentes; a revisão não cria contas nos dados originais. Não execute instalação de dependências Windows sobre um ambiente WSL em uso, ou vice-versa.

## Limitações preservadas

- Elegibilidade e disponibilidade são textos livres. A declaração do estudante é conferida manualmente; não se inferem regras institucionais a partir de linguagem natural.
- Não há vínculo estruturado de curso em Usuario ou escopo de coordenação por curso. A coordenação consulta todos os ciclos da PoC.
- Não há edição de solicitação após decisão, reenvio de complementação, reativação de cancelamento, exclusão física, alocação definitiva ou novos dashboards nesta entrega.
- A persistência é apropriada à PoC local de processo único, sem suporte a múltiplos servidores escrevendo simultaneamente.
- Permanecem problemas preexistentes fora do escopo: segredo de sessão de fallback, middleware depreciado e proteção parcial de rotas antigas, ausência de proteção de todos os vínculos nas exclusões antigas, permissões/prazos amplos nas ações antigas de propostas e script `next lint` incompatível com a versão. As rotas novas verificam acesso no servidor e preservam a proposta submetida.
- Uma instalação limpa do lockfile na cópia de verificação encontrou conflito entre `@types/node` 20 e o peer opcional exigido por Vitest 5. A cópia foi instalada com `npm ci --legacy-peer-deps`. Nenhuma dependência ou lockfile do projeto original foi alterado para corrigir esse problema preexistente.
- Build pode emitir avisos de rastreamento de caminhos dinâmicos do armazenamento JSON. A entrega é local e não inclui publicação ou homologação institucional.

## Resultados executados nesta revisão

- TypeScript no projeto original: `tsc --noEmit` aprovado.
- Vitest no projeto original: 10 arquivos e **145 testes aprovados** na mesma execução, com `--pool=threads --maxWorkers=1` (31,01 s).
- Playwright/Chromium: **17 testes E2E aprovados** na execução completa, com `--timeout=120000` (aproximadamente 1,1 minuto). Inclui regressão de autenticação, usuários, estrutura acadêmica, períodos e propostas, além dos dois cenários R03 ampliados.
- Build Next.js: aprovado, incluindo TypeScript e todas as rotas, em cópia de verificação isolada. Permanecem avisos preexistentes de middleware e caminhos dinâmicos do JSON.
- Fontes `src` e `e2e` da cópia testada: comparação byte a byte com o projeto original aprovada.
- **12 arquivos JSON originais com SHA-256 idêntico ao início desta revisão.** A alteração já existente em `auditoria.json` foi preservada, sem reverter ou sobrescrever esse trabalho.
- Nenhuma alteração em package.json, package-lock.json, configuração Next.js, cronogramas POD ou lógica anterior das Releases 1 e 2. As mudanças nesses módulos foram somente textos visíveis e a extensão aditiva do tipo de situação.

## Arquivos desta revisão

A comparação abaixo usa o estado dos arquivos no início desta revisão, incluindo a implementação R03 que já estava sem commit.

Criado:

- `src/app/(main)/solicitacoes/[id]/page.tsx`

Modificados:

- `src/app/(main)/layout.tsx`
- `src/app/components/release03-form.tsx`
- `src/app/components/release03-solicitacoes.tsx`
- `src/app/libs/academic-actions.ts`
- `src/app/libs/proposal-actions.ts`
- `src/app/libs/release03-actions.ts`
- `src/app/libs/release03-model.ts`
- `src/app/libs/user-actions.ts`
- `src/app/types/index.ts`
- `src/app/(main)/ciclos/page.tsx`
- `src/app/(main)/cursos/page.tsx`
- `src/app/(main)/dashboard/page.tsx`
- `src/app/(main)/periodos/page.tsx`
- `src/app/(main)/propostas/page.tsx`
- `src/app/(main)/solicitacoes/page.tsx`
- `src/app/(main)/usuarios/page.tsx`
- `src/app/(main)/cursos/novo/novo-curso-form.tsx`
- `src/app/(main)/cursos/novo/page.tsx`
- `src/app/(main)/cursos/[id]/edit-curso-form.tsx`
- `src/app/(main)/periodos/novo/page.tsx`
- `src/app/(main)/periodos/[id]/edit-periodo-form.tsx`
- `src/app/(main)/propostas/nova/page.tsx`
- `src/app/(main)/propostas/[id]/edit-proposta-form.tsx`
- `src/app/(main)/solicitacoes/nova/solicitacao-form.tsx`
- `src/app/(main)/unidades/nova/page.tsx`
- `src/app/(main)/usuarios/novo/page.tsx`
- `src/app/(main)/usuarios/[id]/edit-form.tsx`
- `src/app/libs/__tests__/release03.test.ts`
- `e2e/release03.spec.ts`
- `docs/RELEASE-03.md`

## Estado final do Git

Branch: `feat/release-03`. As alterações permanecem locais e sem commit. O status inclui trabalho anterior à revisão; `data/auditoria.json` já estava modificado antes de qualquer correção.

```text
 M data/auditoria.json
 M src/app/(main)/cursos/[id]/edit-curso-form.tsx
 M src/app/(main)/cursos/novo/novo-curso-form.tsx
 M src/app/(main)/cursos/novo/page.tsx
 M src/app/(main)/cursos/page.tsx
 M src/app/(main)/dashboard/page.tsx
 M src/app/(main)/layout.tsx
 M src/app/(main)/periodos/[id]/edit-periodo-form.tsx
 M src/app/(main)/periodos/novo/page.tsx
 M src/app/(main)/periodos/page.tsx
 M src/app/(main)/propostas/[id]/edit-proposta-form.tsx
 M src/app/(main)/propostas/nova/page.tsx
 M src/app/(main)/propostas/page.tsx
 M src/app/(main)/unidades/nova/page.tsx
 M src/app/(main)/usuarios/[id]/edit-form.tsx
 M src/app/(main)/usuarios/novo/page.tsx
 M src/app/(main)/usuarios/page.tsx
 M src/app/libs/academic-actions.ts
 M src/app/libs/proposal-actions.ts
 M src/app/libs/user-actions.ts
 M src/app/types/index.ts
?? docs/RELEASE-03.md
?? e2e/release03.spec.ts
?? playwright.release03.config.ts
?? src/app/(main)/ciclos/[id]/page.tsx
?? src/app/(main)/ciclos/page.tsx
?? src/app/(main)/relatorio-solicitacoes/csv/route.ts
?? src/app/(main)/relatorio-solicitacoes/page.tsx
?? src/app/(main)/solicitacoes/[id]/page.tsx
?? src/app/(main)/solicitacoes/nova/page.tsx
?? src/app/(main)/solicitacoes/nova/solicitacao-form.tsx
?? src/app/(main)/solicitacoes/page.tsx
?? src/app/components/release03-form.tsx
?? src/app/components/release03-solicitacoes.tsx
?? src/app/components/release03-ui.tsx
?? src/app/libs/__tests__/release03.test.ts
?? src/app/libs/release03-access.ts
?? src/app/libs/release03-actions.ts
?? src/app/libs/release03-model.ts
?? src/app/libs/release03-queries.ts
?? src/app/libs/release03-store.ts
```

## Servidor local já aberto

A verificação final de `http://localhost:3000/login` no servidor que já estava aberto excedeu 30 segundos. Esse resultado não foi considerado aprovação do servidor original. Os 17 testes de navegador passaram no servidor isolado. O servidor original não foi reiniciado nesta revisão, para não interromper a sessão/terminal do usuário. Para carregar a versão atual, encerre o servidor no seu terminal com Ctrl+C e execute novamente `npm run dev` no diretório correto, usando um único ambiente de execução.
