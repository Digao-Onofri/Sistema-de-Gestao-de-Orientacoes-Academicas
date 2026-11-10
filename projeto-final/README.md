# Sistema de Gestão de Orientações Acadêmicas (SGOA)

Aplicação web Next.js 16.4.3 com TypeScript, Tailwind CSS, Server Actions e persistência em arquivos JSON locais.

## Versões e ambiente
- Node.js: compatível com Next.js 16 (testado em Node v20.20.2; pacotes podem apresentar avisos EBADENGINE)
- Next.js: ^16.4.3
- React: ^19.2.0
- TypeScript: ^5
- Testes: Vitest, Playwright

## Instalação
```bash
cd projeto-final
npm install
```

## Desenvolvimento
```bash
npm run dev
```
Acesse http://localhost:3000

## Build e execução
```bash
npm run build
npm start
```

## Variáveis de ambiente
- `SGOA_DATA_DIR` - diretório com arquivos JSON de dados (padrão: `./data`)
- `TOKEN` - segredo para sessão (não versionar)

Crie `.env.local` conforme necessidade. Nunca commitar segredos.

## Dados
Os dados ficam em `data/*.json`. Em testes E2E, usar `SGOA_DATA_DIR` apontando para diretório temporário. Preservar `data/auditoria.json`.

## Backup e restauração
Ver `docs/RNF-PROCEDIMENTOS.md`. Script: `scripts/backup-sgoa.sh`.

## Testes
```bash
npx tsc --noEmit
npm test -- --run --pool=threads --maxWorkers=1
npm run test:e2e -- --timeout=120000
```
Observação: em alguns ambientes Node 20 há avisos de worker; browsers Playwright podem precisar ser instalados com `npx playwright install`.

## Documentação Release 04
- `docs/RELEASE-04.md` (referência, não alterado)
- `docs/RELEASE-04-PLANO-EXECUCAO.md`
- `docs/RELEASE-04-DECISOES.md`
- `docs/RELEASE-04-RELATORIO.md`
- `docs/RNF-PROCEDIMENTOS.md`
- `docs/DRE_SGOA_v1.2_requisitos_ordenados.md`
- `docs/MANUAL-TESTE-R04.md`

## Teste manual R04 (base demo isolada)
```bash
node scripts/preparar-demo-r04.mjs
NEXT_DIST_DIR=.next-manual-r04 SGOA_DATA_DIR=./data/manual-r04 npm run dev -- --port 3001
```
Veja `docs/MANUAL-TESTE-R04.md` para credenciais e roteiro. Artifacts locais gerados (`.next-manual-r04/`, `data/manual-r04/`) são de teste e estão no `.gitignore`.
