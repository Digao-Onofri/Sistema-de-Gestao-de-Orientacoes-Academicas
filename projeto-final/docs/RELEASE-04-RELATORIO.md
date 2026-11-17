# Release 04 — Relatório final

## Escopo
RF021, RF022, RF030–RF041 e RNF001–RNF010, conforme DRE Seção 3 e decisões registradas em `docs/RELEASE-04-DECISOES.md`.

## Decisões aplicadas
D01–D20: consolidadas. D03, D07, D11, D13 resolvidas. RF034 registrado como **Parcial** por lacuna de alteração de prazo (D11) — `PrazoAlterado` nunca emitido.

## Arquivos criados/alterados

### Criados
- `src/app/libs/release04-model.ts`
- `src/app/libs/release04-actions.ts`
- `src/app/libs/release04-queries.ts`
- `src/app/(main)/alocacoes/page.tsx`
- `src/app/(main)/etapas/page.tsx`
- `src/app/(main)/reunioes/page.tsx`
- `src/app/(main)/painel/page.tsx`
- `src/app/(main)/painel/csv/route.ts`
- `src/app/(main)/notificacoes/page.tsx`
- `src/app/(main)/auditoria/page.tsx`
- `docs/RNF-PROCEDIMENTOS.md`
- `scripts/backup-sgoa.sh`
- `src/app/libs/__tests__/release04-fixtures.ts`
- `src/app/libs/__tests__/release04-alocacoes.test.ts`
- `src/app/libs/__tests__/release04-concorrencia.test.ts`
- `src/app/libs/__tests__/release04-consultas.test.ts`
- `src/app/libs/__tests__/release04-etapas-reunioes.test.ts`
- `src/app/components/__tests__/release04-form.test.tsx`
- `e2e/support/release04.ts`
- `e2e/release04-alocacoes.spec.ts`
- `e2e/release04-etapas-reunioes.spec.ts`
- `e2e/release04-painel.spec.ts`
- `e2e/release04-notificacoes-auditoria.spec.ts`

### Alterados
- `src/app/libs/release03-model.ts` (aditivo: `errosCampos`)
- `src/app/libs/auditoria.ts` (aditivo: `registrarAuditoriaEstrita`)
- `src/app/libs/notificacoes.ts` (aditivo: `criarNotificacaoEstrita`)
- `src/app/libs/release03-actions.ts` (instrumentação best-effort)
- `src/app/components/release03-form.tsx` (suporte a `errosCampos`)
- `src/app/(main)/layout.tsx` (links e responsividade)
- `projeto-final/README.md`
- `playwright.config.ts` (projeto Playwright `release04`)
- `src/app/libs/release04-actions.ts` (validação real de datas de calendário)
- `src/app/(main)/alocacoes/page.tsx` (confirmação explícita para encerramento/cancelamento)
- `docs/RELEASE-04-PLANO-EXECUCAO.md` (matriz e evidências da suíte R04)

### Preservados
- `docs/RELEASE-04.md` — **intacto**
- `data/auditoria.json` — **intacto** (13 registros)

## Baseline anterior (09/11/2026)
- `npm install` — sucesso (09/11/2026)
- `npx tsc --noEmit` — sucesso sem saída
- `npm test` — 167 testes aprovados, 12 arquivos; 4 erros unhandled de worker (Node 20) sem falhas de teste
- `npm run build` — sucesso (Next.js 16.4.3), rotas R04 geradas

## Evidências dos testes R04 (17/11/2026)
- Next.js atualizado pelo projeto para `16.4.6`.
- `npm test -- --run --pool=threads --maxWorkers=1 src/app/libs/__tests__/release04-*.test.ts src/app/components/__tests__/release04-form.test.tsx` — **37 testes R04 aprovados em cinco arquivos**.
- `npx tsc --noEmit` — sucesso sem saída.
- `E2E_SLOW_MO=300 npm run test:e2e -- --project=release04 --headed` — **sete testes aprovados em Chromium**, acompanhando as interações.
- `E2E_SLOW_MO=300 npm run test:e2e -- --project=chromium --headed` — **27 testes aprovados** na suíte E2E completa, incluindo R04 e releases anteriores.
- `npm run build` — sucesso; compilação, tipos e geração das rotas concluídos.
- Build/E2E emitem avisos: workspace detecta dois lockfiles e escolhe o da raiz; convenção `middleware` está depreciada; acesso dinâmico a filesystem gera avisos de tracing.

## Implementado x Verificado
- **Testado em Vitest**: confirmações e estados de alocação, capacidade/duplicidade, falha de gravação e concorrência em processo único, criação de etapa/reunião, consultas e isolamento por perfil, painel/CSV e formulário de encerramento/cancelamento.
- **Playwright executado em modo headed**: sete jornadas R04 e 27 testes na suíte completa, todos aprovados em Chromium.
- **Não verificado nesta rodada**: execução visual E2E, responsividade por viewport, leitor de tela, cross-browser, p95, backup/restauração e campanha de carga.

## Limitações
- Persistência JSON em processo único (sem lock distribuído).
- Auditoria/notificações em modo best-effort (D13).
- Avisos de configuração/build sobre múltiplos lockfiles, convenção `middleware` depreciada e rastreamento de filesystem dinâmico permanecem.
- RF034 parcial pela lacuna de alteração de prazo (D11).
- Layout responsivo aditivo; verificação completa 360–1366px recomendada em ambiente com browsers.

## Pendências
- Medição p95 com dados sintéticos conforme procedimento documentado.

## Implantação
1. Instalar dependências: `npm install`
2. Configurar `.env.local` com `TOKEN` e opcional `SGOA_DATA_DIR`
3. Build: `npm run build`
4. Start: `npm start`
5. Backup: `bash scripts/backup-sgoa.sh`

## Rollback
1. Reverter commit da release
2. Restaurar cópia de `data/` do backup mais recente
3. Validar login e listagens
