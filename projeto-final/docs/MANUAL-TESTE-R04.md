# Teste manual Release 04 (dados fictícios isolados)

## 1) Gerar base demo
Execute na raiz do repositório:
```bash
node scripts/preparar-demo-r04.mjs
```
Por padrão cria `projeto-final/data/manual-r04/`. Para outro local:
```bash
DEMO_DIR=/caminho/para/demo node scripts/preparar-demo-r04.mjs
```

## 2) Credenciais (fictícias)
| Perfil | E-mail | Senha |
| --- | --- | --- |
| Coordenador | coord.demo@sgoa.test | demo-coord-123 |
| Tutor | tutor.demo@sgoa.test | demo-tutor-123 |
| Tutorado | tutorado.demo@sgoa.test | demo-tutorado-123 |

Senhas geradas com PBKDF2 (`salt:hash`) pelo script, formato compatível com `compararSenha`.

## 3) Iniciar aplicação com a base demo
Na pasta `projeto-final/`:
```bash
NEXT_DIST_DIR=.next-manual-r04 SGOA_DATA_DIR=./data/manual-r04 npm run dev -- --port 3001
```
Acesse: http://localhost:3001

## 4) Pontos para testar
- `/alocacoes` (filtros, confirmação/encerramento/cancelamento conforme perfil)
- `/etapas` e `/reunioes` (criação pelo tutor para alocação ativa)
- `/painel` e `/painel/csv` (agregações, CSV com formato do painel)
- `/notificacoes` (apenas próprias)
- `/auditoria` (apenas coordenador)
- Permissões por perfil

## 5) Voltar ao banco normal
Interrompa o servidor e rode sem `SGOA_DATA_DIR`:
```bash
npm run dev
```
Ou defina `SGOA_DATA_DIR` para `./data`. Os arquivos em `data/` e `data/auditoria.json` **não** foram alterados pelo script.

## Observações
- Script é idempotente (sobrescreve arquivos no diretório destino).
- Base contém apenas dados fictícios.
- Não altera base real nem arquivos de teste.
