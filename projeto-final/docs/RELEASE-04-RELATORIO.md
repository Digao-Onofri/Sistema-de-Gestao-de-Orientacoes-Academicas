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

### Alterados
- `src/app/libs/release03-model.ts` (aditivo: `errosCampos`)
- `src/app/libs/auditoria.ts` (aditivo: `registrarAuditoriaEstrita`)
- `src/app/libs/notificacoes.ts` (aditivo: `criarNotificacaoEstrita`)
- `src/app/libs/release03-actions.ts` (instrumentação best-effort)
- `src/app/components/release03-form.tsx` (suporte a `errosCampos`)
- `src/app/(main)/layout.tsx` (links e responsividade)
- `projeto-final/README.md`

### Preservados
- `docs/RELEASE-04.md` — **intacto**
- `data/auditoria.json` — **intacto** (13 registros)

## Evidências reais
- `npm install` — sucesso (09/11/2026)
- `npx tsc --noEmit` — sucesso sem saída
- `npm test` — 167 testes aprovados, 12 arquivos; 4 erros unhandled de worker (Node 20) sem falhas de teste
- `npm run build` — sucesso (Next.js 16.4.3), rotas R04 geradas
- `npm run test:e2e` — **bloqueado** por ausência de browsers Playwright (`npx playwright install`)

## Implementado x Verificado
- **Implementado**: contratos, actions com validações/proteção, consultas com isolamento, páginas, painel/CSV, notificações/auditoria, instrumentação R03, RNFs em código/docs.
- **Verificado**: apenas compilação (`tsc`) e build. Sem execução completa de testes E2E. `p95` não medido.

## Limitações
- Persistência JSON em processo único (sem lock distribuído).
- Auditoria/notificações em modo best-effort (D13).
- E2E não executado neste ambiente (falta browsers Chromium).
- RF034 parcial pela lacuna de alteração de prazo (D11).
- Layout responsivo aditivo; verificação completa 360–1366px recomendada em ambiente com browsers.

## Pendências
- Fase 6: relatório concluído; validação funcional via testes fica condicionada à instalação de browsers.
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
