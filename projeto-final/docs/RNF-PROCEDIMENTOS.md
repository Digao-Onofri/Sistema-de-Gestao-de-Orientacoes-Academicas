# Procedimentos RNF - Release 04

## RNF003 - Persistência JSON em processo único
- Persistência local em arquivos JSON (`data/*.json`).
- Mutações novas utilizam `lerR03` + validação + `gravarR03` (gravação atômica via arquivo temporário + rename).
- Não há lock distribuído. Em múltiplos processos/instâncias não há garantia de concorrência. Limitação documentada.

## RNF004 - Backup e restauração (RPO <= 24h)
**Procedimento de backup:**
1. Definir `SGOA_DATA_DIR` (padrão `projeto-final/data`).
2. Executar `bash scripts/backup-sgoa.sh` diariamente.
3. Armazenar cópia fora do repositório.

**Procedimento de restauração:**
1. Parar a aplicação.
2. Substituir o diretório de dados pela cópia desejada.
3. Iniciar a aplicação e validar login/listagens.
4. Registrar data, responsável e resultado.

**RPO:** 24 horas (backup diário). Limitação: backup local.

## RNF005 - Medição de desempenho (p95)
- Criar dados sintéticos em diretório temporário com `SGOA_DATA_DIR`.
- Medir consultas do painel e listagens em ambiente documentado (hardware/Node/Next).
- Não prometer desempenho para produção. Registrar p95, ambiente e número de registros.

## RNF006 - Segurança
- Senhas com hash (PBKDF2) via `password.ts`.
- Autorização no servidor em páginas/actions com `usuarioR03()`.
- Sessão gerenciada via `session.ts`.
- Segredos fora do repositório (`.env` não versionado). Uso de `TOKEN` e `SGOA_DATA_DIR`.
- HTTPS obrigatório em implantação.

## RNF007 - Privacidade e minimização
- Consultas com projeção (sem objetos `Usuario` completos, sem `senha`).
- Reuniões com acesso restrito por vínculo.
- Notificações somente para o destinatário.
- Inventário em `docs/RELEASE-04-PLANO-EXECUCAO.md` seção 13.1.

## RNF008 - Compatibilidade
- Aplicação web sem instalação.
- Testado em Chromium via Playwright. Suporte alvo: duas versões estáveis mais recentes de Chrome, Edge e Firefox (verificação manual). Limitação: ambiente atual sem browsers Playwright instalados.

## RNF009 - LGPD e CSV
- Checklist LGPD no inventário.
- CSV UTF-8 com BOM, cabeçalhos estáveis, separador `;`, proteção contra fórmula.
- Sem exclusão automática nesta release (D12).

## RNF010 - Ambiente
Ver `README.md` do projeto para versões, instalação, variáveis e homologação.
