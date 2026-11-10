# Release 04 — plano de execução e guia para sessões futuras

> Documento operacional derivado de `docs/RELEASE-04.md` e do DRE `docs/DRE_SGOA_v1.2_requisitos_ordenados.md`.
> Não substitui os requisitos, não altera `docs/RELEASE-04.md` e não declara requisito atendido sem evidência.
>
> **Estado desta preparação:** DRE localizado e lido integralmente; plano revisado; nenhum código de Release 04 implementado; nenhum teste executado nesta sessão.
>
> **Data da análise:** 09/11/2026.

---

## 0. Leitura obrigatória e regras de ouro

Antes de codar, leia nesta ordem:

1. `projeto-final/AGENTS.md` (aviso sobre a versão do Next.js);
2. `README.md` da raiz e `projeto-final/README.md`;
3. `docs/DRE_SGOA_v1.2_requisitos_ordenados.md` — fonte primária dos requisitos;
4. `docs/RELEASE-03.md` e `docs/RELEASE-04.md` — escopo e padrões das releases;
5. `package.json`, `tsconfig.json`, `playwright.config.ts` e `vitest.config.mts`;
6. `src/app/types/index.ts`, `src/app/libs/release03-*`, `src/app/libs/auditoria.ts`, `src/app/libs/notificacoes.ts`;
7. os JSONs em `data/` (não os altere fora de teste).

Regras de ouro:

1. **A Seção 3 do DRE é a fonte canônica dos requisitos funcionais desta release.** A Seção 5 usa uma numeração antiga e agrupada; não a use para implementar RF021/RF030–RF041.
2. **Não invente regra de negócio.** Quando o DRE não define, siga a decisão registrada em `docs/RELEASE-04-DECISOES.md` e a opção mais conservadora.
3. **Autorização no servidor.** Toda página e toda Server Action devem chamar `usuarioR03()` e validar perfil e vínculo. O middleware não cobre as rotas novas.
4. **Não confie em IDs do cliente.** Recarregue tutor, tutorado, proposta, ciclo, alocação e vínculo no servidor.
5. **Mutações novas usam `lerR03`/`gravarR03`.** Não use `ConexaoBD` para escrita nova: ele devolve `[]` em JSON corrompido.
6. **Campos novos são opcionais e aditivos.** Não reescreva registros antigos nem introduza campo obrigatório em contrato existente.
7. **Não apague histórico.** Encerrar/cancelar muda a situação; não remove alocação, etapa, reunião, solicitação, decisão ou auditoria.
8. **Não exiba códigos `RF...`/`RNF...` em texto visível.** O teste `release03-interface.test.ts` varre `src` e falha se encontrar códigos em literais de string ou JSX.
9. **Testes E2E só com `npm run test:e2e`**, para usar o diretório temporário de `SGOA_DATA_DIR`.
10. **Não declare teste executado sem executar.** Registre comandos, saída e limitações.

---

## 1. O que o DRE mudou no plano anterior

O plano anterior tratava o DRE como ausente. Com o documento localizado, as seguintes correções são obrigatórias:

| # | Correção | Consequência prática |
| --- | --- | --- |
| 1 | RF021 **não exige** solicitação com decisão `Aceita`. O DRE exige tutor e tutorado ativos, ciclo e proposta válidos, capacidade disponível e ausência de alocação ativa duplicada para a mesma proposta. | Remover a pré-condição “solicitação aceita” do plano. `solicitacaoId` pode existir como vínculo opcional de rastreabilidade, mas não é requisito. |
| 2 | RF032 e RF033 têm ator **Tutor**, não coordenador. | Somente o tutor da alocação cria etapa e reunião. Coordenação apenas consulta. |
| 3 | RF034 e RF036 são do **sistema** e cobrem eventos de Releases 01–03. | É preciso instrumentar também `release03-actions.ts` (ciclos, solicitações, decisões) e as ações de usuário já existentes, não só os arquivos novos de R04. |
| 4 | RF034 exige notificação de “alteração de prazo”. | A Release 03 bloqueia edição de ciclo publicado; não existe fluxo de alteração de prazo. Decisão D11: registrar a lacuna e não inventar um fluxo de RF023 fora do escopo. `PrazoAlterado` fica reservado e nunca é emitido. |
| 5 | RF021/RNF003 exigem operação transacional. | A persistência é JSON local. A garantia possível é escrita atômica por arquivo (`gravarR03`) + bloco síncrono de leitura/validação/gravação em processo único. Documentar a limitação multi-processo. |
| 6 | RF021 proíbe **duas alocações ativas para a mesma proposta**. | A unicidade é por `propostaId` com `situacao === 'Ativa'`, não por tutorado/ciclo. |
| 7 | RNF001 exige erro **junto ao campo** e preservação dos dados preenchidos. | O `FormR03` atual mostra um alerta global. É preciso adicionar erros por campo de forma aditiva. |
| 8 | RNF002 exige funcionamento de 360 px a 1366 px. | O layout atual tem sidebar fixa de 256 px; em 360 px o conteúdo fica com ~104 px. Ajustar o layout ou as jornadas novas. |
| 9 | RF035 usa “alocações confirmadas” e “vagas disponíveis” sem definir a métrica. | Decisão D03/D17: “alocações confirmadas” = `Ativa`; “vagas disponíveis” = `max(0, limite − ativas globais)`, exibida por tutor e repetida em cada ciclo; a contagem de orientandos é por ciclo e exibida em coluna separada. |
| 10 | RF031 e RF041 falam em “sob sua responsabilidade” e “coordenador autorizado”. | O sistema só tem o perfil Coordenador, sem escopo por curso. Tratar coordenação como global e registrar a limitação. |

---

## 2. Diagnóstico verificado do repositório

### 2.1 Stack e execução

- Next.js `^16.4.3` (App Router), React 19, TypeScript estrito, Tailwind, Server Actions.
- Persistência local em JSON (`data/*.json`), sem banco relacional e sem migrações.
- Testes unitários/componentes com Vitest + Testing Library; E2E com Playwright.
- Scripts: `dev`, `build`, `start`, `lint`, `test`, `test:e2e`.
- `lint` (`next lint`) é incompatível com a versão atual do Next.js. Use `npx tsc --noEmit`.
- `node_modules/` **não existe** no diretório no momento desta análise. O baseline depende de `npm install`.
- O `README.md` da raiz ainda tem placeholders de tecnologia e implantação; `projeto-final/README.md` é o boilerplate do `create-next-app`. Isso afeta RNF010.

### 2.2 Estado da Release 04

- Branch atual: `feat/release04`.
- `docs/RELEASE-04.md` e este plano estão não rastreados; não altere o guia de referência.
- DRE localizado em `docs/DRE_SGOA_v1.2_requisitos_ordenados.md` (666 linhas).
- Dados atuais:
  - `data/alocacoes.json` → `[]`
  - `data/etapas.json` → `[]`
  - `data/reunioes.json` → `[]`
  - `data/notificacoes.json` → `[]`
  - `data/auditoria.json` → 13 registros históricos (preservar)
  - `data/usuarios.json` → 1 registro; `data/periodos.json` → 1 registro; demais cadastros vazios.
- Não existem `release04-actions.ts`, `release04-queries.ts`, `release04-model.ts`, páginas de alocação/etapa/reunião/painel/notificação/auditoria, nem testes de R04.
- `data/` contém os arquivos de acompanhamento já criados, mas vazios.

### 2.3 O que já existe e deve ser reutilizado

| Área | Arquivo | Papel |
| --- | --- | --- |
| Tipos de domínio | `src/app/types/index.ts` | Já define `AlocacaoOrientacao`, `EtapaAcompanhamento`, `RegistroReuniao`, `NotificacaoInterna`, `RegistroAuditoria`, `SituacaoAlocacao` e `SituacaoEtapa`. |
| Armazenamento estrito | `src/app/libs/release03-store.ts` | `lerR03` falha em JSON inválido; `gravarR03` grava em temporário e renomeia. Use para novas mutações. |
| Acesso | `src/app/libs/release03-access.ts` | `usuarioR03()` valida sessão, conta ativa e perfil atual contra o JSON. |
| Modelo R03 | `src/app/libs/release03-model.ts` | `ResultadoAcao`, transições de ciclo, datas institucionais e rótulos. |
| Consultas R03 | `src/app/libs/release03-queries.ts` | Filtro por perfil no servidor, projeções sem dados privados e CSV seguro. |
| Ações R03 | `src/app/libs/release03-actions.ts` | Padrão de Server Action: permissão, validação, leitura/gravação síncrona e mensagens em português. |
| Formulário | `src/app/components/release03-form.tsx` | `FormR03` com `useActionState`, erro/sucesso, confirmação e bloqueio durante envio. |
| UI R03 | `src/app/components/release03-ui.tsx` | `CampoR03`, `campoR03`, `painelR03`, `dataR03`, `SituacaoR03`. |
| Auditoria | `src/app/libs/auditoria.ts` | `registrarAuditoria(...)` já usado por ações de usuário, estrutura acadêmica, propostas e login. |
| Notificação | `src/app/libs/notificacoes.ts` | `criarNotificacao(...)` existe, mas não é usado por nenhuma ação. |
| CSV | `src/app/(main)/relatorio-solicitacoes/csv/route.ts` | Padrão de rota CSV com `usuarioR03()`, 401/403, UTF-8 com BOM, `;`, CRLF e proteção contra fórmula. |
| Dados | `data/*.json` | JSONs locais; testes E2E usam diretório temporário via `SGOA_DATA_DIR`. |

### 2.4 Lacunas verificadas

- Não há ações, consultas, telas ou testes para alocação, etapa, reunião, notificação ou auditoria.
- O dashboard conta apenas usuários, cursos, períodos e propostas; não há painel gerencial.
- O relatório/CSV existente cobre somente solicitações; não há exportação de alocações/painel.
- As ações da Release 03 **não** chamam `registrarAuditoria` nem `criarNotificacao`.
- O layout não tem links para alocações, etapas, reuniões, painel, notificações ou auditoria.
- O middleware protege apenas `/dashboard`, `/usuarios`, `/cursos` e `/unidades`. As rotas novas precisam validar sessão e perfil dentro da própria página/action.
- `ConexaoBD` devolve `[]` quando o JSON está corrompido. Não use essa camada para mutações novas.
- `auditoria.ts` e `notificacoes.ts` usam `ConexaoBD` e engolem falhas. Decisão D13: criar `registrarAuditoriaEstrita`/`criarNotificacaoEstrita` com `lerR03`/`gravarR03`, mantendo as funções atuais; em falha, registrar `console.error` sem reverter a operação principal.
- `release03-interface.test.ts` falha se encontrar `RF...`/`RNF...` em literais de string ou texto JSX. Códigos podem aparecer em comentários, nomes de testes e documentação, nunca em texto visível.

### 2.5 Baseline a reproduzir antes de alterar código

```bash
cd projeto-final
npm install
npx tsc --noEmit
npm test -- --run --pool=threads --maxWorkers=1
npm run build
npm run test:e2e -- --timeout=120000
```

A Release 03 registra como referência histórica 145 testes unitários e 17 testes E2E aprovados. Isso **não** é evidência da execução atual. Registre os números e falhas encontrados no baseline.

---

## 3. Numeração do DRE: qual usar

O DRE tem uma inconsistência interna que precisa ser tratada explicitamente:

- O cabeçalho diz “Versão 1.1 - 23/10/2026”, mas o arquivo se chama `v1.2`.
- A **Seção 3** detalha RF001–RF041 como operações individuais.
- A **Seção 5** (Rastreabilidade) usa uma matriz antiga e agrupada, com RF001–RF016. Exemplos:
  - Seção 5, RF010 = “Confirmação e alocação de orientação”;
  - Seção 3, RF010 = “Alterar unidade acadêmica”;
  - Seção 5, RF001 = “Autenticação e encerramento de sessão” (agrupa RF001 + RF006 da Seção 3);
  - Seção 5, RF016 = “Histórico e trilha de auditoria” (corresponde a RF036/RF041 da Seção 3).

**Decisão:** usar a numeração da Seção 3, porque é a especificação detalhada e porque `docs/RELEASE-04.md` referencia RF021, RF022, RF030–RF041, que só existem nessa numeração. Registrar a inconsistência em `docs/RELEASE-04-DECISOES.md` e, se o DRE for corrigido depois, atualizar a matriz sem mudar o código.

Mapa de correspondência útil (Seção 5 → Seção 3):

| Seção 5 (agrupada) | Seção 3 (canônica) |
| --- | --- |
| RF001 Autenticação e sessão | RF001 + RF006 |
| RF002 Gestão de usuários | RF002, RF007, RF008, RF009 |
| RF003 Unidades e cursos | RF003, RF010, RF011, RF012 |
| RF004 Perfil do tutor | RF004 |
| RF005 Perfil do tutorado e proposta | RF005, RF015, RF016 |
| RF006 Ciclos | RF017, RF023–RF028 |
| RF007 Consulta de tutores | RF018 |
| RF008 Solicitação | RF019 |
| RF009 Análise de solicitações | RF020 |
| RF010 Confirmação e alocação | RF021 |
| RF011 Alteração/encerramento de alocações | RF022, RF030 |
| RF012 Acompanhamento de etapas | RF032, RF037 |
| RF013 Registro de reuniões | RF033, RF038 |
| RF014 Notificações | RF034, RF039 |
| RF015 Painel e exportação | RF035, RF040 |
| RF016 Auditoria | RF036, RF041 |

---

## 4. Catálogo dos requisitos da Release 04

Esta seção resume o que o DRE exige. Onde o DRE não define, a regra adotada está marcada como decisão (seção 14) e é vinculante para a implementação e os testes.

### 4.1 [RF021] Confirmar alocação de orientação

- **Ator/prioridade:** Coordenador; Essencial.
- **Dados:** vínculo entre tutor, tutorado, proposta e ciclo; data e responsável pela confirmação.
- **Regras verificáveis:**
  1. Somente Coordenador autenticado e ativo.
  2. Tutor existe, é do perfil Tutor e está ativo.
  3. Tutorado existe, é do perfil Tutorado e está ativo.
  4. Ciclo existe e é válido.
  5. Proposta existe e é válida.
  6. Tutor possui capacidade disponível.
  7. Não existe outra alocação ativa para a mesma proposta.
  8. A gravação preserva consistência (sem registro parcial).
- **Aceite:** ao confirmar, cria `AlocacaoOrientacao` com `situacao: 'Ativa'`, `dataConfirmacao` ISO, `coordenadorId` do usuário; se qualquer validação falhar, nada é gravado.
- **Regras decididas (D02, D03, D15):**
  - Proposta “válida” = existe, `proposta.tutoradoId === tutoradoId` e `proposta.tipo === ciclo.modalidade`. Não há campo de situação da proposta; nenhum outro estado é validado.
  - Ciclo “válido” = existe e está em `Publicado`, `Aberto` ou `Encerrado`. Bloquear `Rascunho` e `Cancelado`. Não validar `prazoInicio`/`prazoFim` para confirmar.
  - Capacidade: o limite só é válido se `limiteOrientandos` for inteiro ≥ 1. Ausente, não inteiro ou ≤ 0 bloqueia com “Tutor sem limite de orientandos configurado.” Contar todas as alocações `Ativa` do tutor, em todos os cursos e ciclos.
  - `solicitacaoId` é opcional. String vazia equivale a omitido. Se informado e inexistente → “Solicitação de referência não encontrada.”; se existir mas `tutoradoId`, `propostaId` ou `cicloId` divergirem → “Solicitação de referência não corresponde à alocação.”; se válido, gravar. Não exigir decisão `Aceita` nem situação específica.
  - Duplicidade: bloquear se existir outra alocação `Ativa` com o mesmo `propostaId`, independentemente de tutor, tutorado ou ciclo.
- **Fora do escopo:** RF020 (decisão do tutor) já existe na R03; RF021 não altera a solicitação.

### 4.2 [RF022] Encerrar alocação de orientação

- **Ator/prioridade:** Coordenador; Importante.
- **Dados:** motivo, data e responsável pela ação.
- **Regras verificáveis:**
  1. Somente Coordenador ativo.
  2. Alocação existe e está `Ativa`.
  3. Motivo é obrigatório, com `trim`, entre 1 e 5.000 caracteres.
  4. Encerrar não apaga histórico de decisões, solicitações ou atividades vinculadas.
- **Aceite:** `situacao: 'Encerrada'`, `motivo`, `dataEncerramento` ISO e `responsavelAcaoId`; demais registros intactos.
- **Transições:** `Ativa → Encerrada`. `Encerrada`/`Cancelada` não podem ser encerradas de novo.

### 4.3 [RF030] Cancelar alocação de orientação

- **Ator/prioridade:** Coordenador; Importante.
- **Dados:** motivo, data e responsável pela ação.
- **Regras verificáveis:**
  1. Somente Coordenador ativo.
  2. Alocação existe e está `Ativa`.
  3. Motivo é obrigatório, com `trim`, entre 1 e 5.000 caracteres.
  4. Cancelar não apaga histórico de decisões, solicitações ou atividades vinculadas.
- **Aceite:** `situacao: 'Cancelada'`, `motivo`, `dataCancelamento` ISO e `responsavelAcaoId`; demais registros intactos.
- **Transições:** `Ativa → Cancelada`. `Encerrada`/`Cancelada` não podem ser canceladas de novo.

### 4.4 [RF031] Consultar alocações de orientação

- **Atores/prioridade:** Tutor, Tutorado e Coordenador; Importante.
- **Filtros:** curso, ciclo, tutor, tutorado e situação (`Ativa`, `Encerrada`, `Cancelada`).
- **Campos exibidos:** tutor, tutorado, título/tipo da proposta, curso, ciclo, situação, data da confirmação e motivo/data de encerramento ou cancelamento.
- **Ordenação:** data da confirmação decrescente.
- **Regras de acesso:** tutor e tutorado consultam apenas alocações das quais participam; coordenador consulta as alocações sob sua responsabilidade.
- **Aceite:** filtros aplicados no servidor; nenhum objeto `Usuario` completo, e-mail ou senha é retornado; coordenador global (limitação registrada).
- **Regras decididas (D14, D20):**
  - Filtros: `curso` compara com `ciclo.cursoId`; `ciclo` compara com `alocacao.cicloId`; `tutor` com `tutorId`; `tutorado` com `tutoradoId`; `situacao` por igualdade exata. Parâmetro vazio/ausente não restringe; se repetido, usar o primeiro valor.
  - Participação: `u.perfil === 'Tutor'` exige `tutorId === u.id`; `u.perfil === 'Tutorado'` exige `tutoradoId === u.id`; `Coordenador` não é filtrado.
  - Ordenação: `dataConfirmacao` decrescente, desempate por `id` crescente.
  - Projeção permitida: `id`, `tutorId`, `tutorNome`, `tutoradoId`, `tutoradoNome`, `propostaId`, `propostaTitulo`, `propostaTipo`, `cursoId`, `cursoNome`, `cicloId`, `periodoIdentificacao`, `modalidade`, `situacao`, `dataConfirmacao`, `motivo`, `dataEncerramento`, `dataCancelamento`. Nunca `email`, `senha` ou o objeto `Usuario` completo.
  - “Sob sua responsabilidade” = todas as alocações, porque o modelo não tem escopo de coordenação por curso (D14).

### 4.5 [RF032] Incluir etapa de acompanhamento

- **Ator/prioridade:** Tutor; Importante.
- **Dados:** descrição, responsável, prazo e situação.
- **Regras verificáveis:**
  1. Somente Tutor ativo.
  2. Tutor deve ser o tutor da alocação.
  3. Alocação existe e é válida.
  4. Descrição, responsável, prazo e situação são obrigatórios.
  5. Situação pertence ao conjunto fechado definido em D07.
- **Aceite:** cria `EtapaAcompanhamento` com `alocacaoId` válido; não representa submissão/armazenamento de arquivo de TCC/IC.
- **Regras decididas (D07, D08, D09, D19, D20):**
  - `situacao` obrigatória e restrita a `Pendente | EmAndamento | Concluida | Atrasada`; gravar exatamente o valor escolhido, sem derivação automática de `Atrasada`.
  - `responsavel`: texto livre, `trim`, 1–200 caracteres; a UI pode sugerir nomes de participantes, mas o servidor não exige ID.
  - `descricao`: obrigatória, `trim`, 1–5.000 caracteres.
  - `prazo`: obrigatório, `YYYY-MM-DD` válido; não exigir data futura.
  - Criar apenas para alocação `Ativa`; `Encerrada`/`Cancelada` são somente leitura.
  - Não implementar edição/exclusão de etapa: o DRE só especifica inclusão e consulta.

### 4.6 [RF033] Incluir registro de reunião

- **Ator/prioridade:** Tutor; Importante.
- **Dados:** data, resumo objetivo, encaminhamentos e data prevista para o próximo contato.
- **Regras verificáveis:**
  1. Somente Tutor ativo.
  2. Tutor deve ser o tutor da alocação.
  3. Alocação existe e é válida.
  4. Data, resumo, encaminhamentos e próximo contato são obrigatórios.
  5. Conteúdo acessível apenas às pessoas vinculadas à orientação e a coordenadores autorizados.
- **Aceite:** cria `RegistroReuniao` com `alocacaoId` válido; consulta posterior restrita.
- **Regras decididas (D09, D19, D20):**
  - `data` e `proximoContato`: obrigatórios, `YYYY-MM-DD` válidos. `proximoContato` não precisa ser posterior a `data`.
  - `resumo` e `encaminhamentos`: obrigatórios, `trim`, 1–5.000 caracteres cada.
  - Criar apenas para alocação `Ativa`; `Encerrada`/`Cancelada` são somente leitura.
  - Não implementar edição/exclusão de reunião: o DRE só especifica inclusão e consulta.

### 4.7 [RF034] Gerar notificações internas

- **Ator/prioridade:** Sistema; Importante.
- **Dados:** usuário destinatário, evento relevante, tipo do evento e instante do registro.
- **Eventos mínimos:** recebimento de solicitação, decisão do tutor, confirmação/encerramento/cancelamento de alocação e alteração de prazo.
- **Regras:** notificação interna; não enviar e-mail nem SMS.
- **Aceite:** cada evento gera registro em `notificacoes.json` com `usuarioId`, `tipoEvento`, `descricao`, `dataHora`, `referencia` e `lida: false`; consulta por usuário em RF039.
- **Regras decididas (D10, D11, D13):**
  - `SolicitacaoRecebida`: uma notificação para cada ID em `tutoresPreferidos`, sem duplicatas; `referencia = solicitacaoId`.
  - `DecisaoSolicitacao`: uma notificação para o tutorado; `referencia = solicitacaoId`; a descrição contém apenas o resultado (`Aceita`, `Recusada` ou `Aguardando complementação`).
  - `AlocacaoConfirmada`, `AlocacaoEncerrada`, `AlocacaoCancelada`: uma notificação para o tutor e uma para o tutorado, sem duplicatas; `referencia = alocacaoId`.
  - `PrazoAlterado`: reservado, nunca emitido (D11).
  - Todas as notificações são gravadas após a operação principal, com `lida: false`; falha não bloqueia a operação (D13).
  - Descrição ≤ 300 caracteres; nunca incluir senha, e-mail, resumo ou encaminhamentos de reunião.

### 4.8 [RF035] Consultar painel gerencial

- **Ator/prioridade:** Coordenador; Importante.
- **Filtros:** curso e ciclo.
- **Indicadores:** solicitações por situação, alocações confirmadas, quantidade de orientandos por tutor e vagas disponíveis.
- **Ordenação/agrupamento:** por curso e, dentro dele, ciclo em ordem crescente de identificação.
- **Regras:** exibir apenas dados autorizados; não incluir dados pessoais desnecessários.
- **Aceite:** painel agrupado por curso/ciclo; cada indicador deriva dos JSONs no servidor; filtros não ampliam acesso.
- **Regras decididas (D03, D14, D17, D18, D20):**
  - Filtros: `curso` compara com `ciclo.cursoId`; `ciclo` compara com `cicloId`; parâmetro vazio/ausente não restringe.
  - Agrupamento: `(cursoId, cicloId, tutorId)`. Ordenação: `curso.denominacao` asc (pt-BR), depois `periodo.identificacao` asc, depois `ciclo.id` asc, depois `tutor.nome` asc.
  - “Solicitações por situação”: contar as solicitações do ciclo nas cinco situações existentes.
  - “Alocações confirmadas”: contar `Ativa` no recorte de curso/ciclo. Exibir `Encerradas` e `Canceladas` em colunas separadas e rotuladas.
  - “Orientandos por tutor”: contar alocações `Ativa` do tutor **no ciclo** exibido.
  - “Vagas disponíveis”: `max(0, limiteOrientandos − ativas globais do tutor)`, calculada em todos os ciclos e repetida em cada linha do tutor. Se o limite for ausente/inválido/≤ 0, exibir `—` com o rótulo “limite não definido”.
  - Coordenação é global (D14).
  - Exibir nome do tutor (necessário para “por tutor”), mas não nome ou e-mail do tutorado.

### 4.9 [RF036] Registrar eventos na trilha de auditoria

- **Ator/prioridade:** Sistema; Importante.
- **Dados mínimos:** data/hora, usuário responsável, entidade afetada e tipo de ação.
- **Regras:** registrar alterações relevantes em contas, ciclos, solicitações, decisões e alocações; usuários comuns não podem editar os registros.
- **Aceite:** ações relevantes gravam `RegistroAuditoria`; não existe action de edição/exclusão de auditoria; consulta em RF041.
- **Implementação:** instrumentar também `release03-actions.ts` (ciclos, solicitações, decisões), além das ações novas de alocação. Ações de usuário, estrutura acadêmica, propostas e login já auditam.
- **Regras decididas (D13):**
  - Instrumentar as ações da Release 03 e as novas ações de R04 **após** a gravação bem-sucedida.
  - Nomes canônicos de entidade e ação:

    | Entidade | `tipoAcao` | Origem |
    | --- | --- | --- |
    | `CicloOrientacao` | `CRIACAO` | `salvarCicloAction` sem `id` |
    | `CicloOrientacao` | `EDICAO` | `salvarCicloAction` com `id` |
    | `CicloOrientacao` | `ALTERACAO_SITUACAO` | `mudarCicloAction` |
    | `SolicitacaoOrientacao` | `CRIACAO` | `criarSolicitacaoAction` |
    | `SolicitacaoOrientacao` | `EDICAO` | `editarSolicitacaoAction` |
    | `SolicitacaoOrientacao` | `CANCELAMENTO` | `cancelarSolicitacaoAction` |
    | `SolicitacaoOrientacao` | `DECISAO` | `decidirSolicitacaoAction` |
    | `AlocacaoOrientacao` | `CONFIRMACAO` | `confirmarAlocacaoAction` |
    | `AlocacaoOrientacao` | `ENCERRAMENTO` | `encerrarAlocacaoAction` |
    | `AlocacaoOrientacao` | `CANCELAMENTO` | `cancelarAlocacaoAction` |
    | `EtapaAcompanhamento` | `CRIACAO` | `criarEtapaAction` |
    | `RegistroReuniao` | `CRIACAO` | `criarReuniaoAction` |

  - Ações de usuário, estrutura acadêmica, propostas e login já auditam com `Usuario`, `Curso`, `UnidadeAcademica`, `PeriodoLetivo`, `PropostaAcademica`, `Autenticacao` e `CRIACAO`/`EDICAO`/`EXCLUSAO`/`LOGIN`.
  - `detalhes`: frase curta em pt-BR, ≤ 500 caracteres, com IDs e rótulos; nunca senha, e-mail ou conteúdo integral de reunião.
  - Falha de auditoria não reverte a operação e é registrada com `console.error` (D13).
  - Não existe action de edição/exclusão de auditoria.

### 4.10 [RF037] Consultar etapas de acompanhamento

- **Atores/prioridade:** Tutor, Tutorado e Coordenador; Importante.
- **Filtros:** orientação/proposta, responsável e situação.
- **Campos exibidos:** descrição, responsável, prazo e situação.
- **Ordenação:** prazo crescente.
- **Regras:** cada perfil consulta somente etapas de orientações às quais tem acesso; coordenação segue permissões administrativas.
- **Aceite:** filtro de participação no servidor; tutor/tutorado não veem etapas de alocações alheias; coordenação global (limitação).
- **Regras decididas (D08, D14, D20):**
  - Filtros: `alocacao` = `alocacaoId`; `proposta` = `propostaId` derivado da alocação; `responsavel` = igualdade sem diferenciar maiúsculas/minúsculas após `trim`; `situacao` = igualdade exata.
  - Participação: tutor/tutorado somente alocações em que são `tutorId`/`tutoradoId`; coordenação global.
  - Ordenação: `prazo` asc, desempate por `id` asc.
  - “Orientação/proposta” = `alocacaoId` e `propostaId` derivado da alocação.

### 4.11 [RF038] Consultar registros de reunião

- **Atores/prioridade:** Tutor, Tutorado vinculado e Coordenador autorizado; Importante.
- **Filtros:** orientação e intervalo de datas da reunião.
- **Campos exibidos:** data, resumo objetivo, encaminhamentos e data prevista para o próximo contato.
- **Ordenação:** data decrescente.
- **Regras:** restringir às pessoas vinculadas à orientação e aos coordenadores autorizados; não expor registros de outras orientações.
- **Aceite:** consulta por `alocacaoId` valida vínculo; acesso indireto por ID de outra alocação retorna vazio/negado; coordenação global (limitação).
- **Regras decididas (D14, D20):**
  - Filtros: `alocacao` = `alocacaoId`; `de`/`ate` comparam a parte de data de `data`, incluindo os dois limites.
  - Participação: somente tutor/tutorado da alocação; coordenação global.
  - Ordenação: `data` desc, desempate por `id` asc.
  - Acesso por `alocacaoId` de terceiro retorna lista vazia, sem revelar existência.

### 4.12 [RF039] Consultar notificações internas

- **Atores/prioridade:** Tutor, Tutorado e Coordenador; Importante.
- **Filtros:** tipo de evento e intervalo de datas.
- **Campos exibidos:** tipo da notificação, data/hora do evento e referência da ação relacionada quando disponível.
- **Ordenação:** data/hora decrescente.
- **Regras:** cada usuário consulta somente suas notificações; não substituem avisos formais.
- **Aceite:** `consultarNotificacoes(u, filtros)` filtra `usuarioId === u.id` inclusive para Coordenador; nenhuma notificação de terceiro é retornada.
- **Regras decididas (D10, D20):**
  - Filtro `tipo` = igualdade exata com `tipoEvento`; `de`/`ate` comparam a parte de data de `dataHora` em `America/Sao_Paulo`, incluindo os limites.
  - Sempre filtrar `usuarioId === u.id`, inclusive para Coordenador.
  - Ordenação: `dataHora` desc, desempate por `id` asc.

### 4.13 [RF040] Exportar relatórios gerenciais

- **Ator/prioridade:** Coordenador; Importante.
- **Dados:** CSV em UTF-8, cabeçalhos claros, campos correspondentes aos indicadores e filtros do painel.
- **Regras:** respeitar filtros de curso/ciclo; manter ordenação/agrupamento do painel; excluir dados pessoais desnecessários; não ampliar permissões.
- **Aceite:** rota CSV com 401/403, `Content-Type: text/csv; charset=utf-8`, BOM, `;`, CRLF, proteção contra fórmula (mesmo padrão de `csvSolicitacoes`), `Cache-Control: no-store`.
- **Formato decidido (D18):**
  - Uma linha por `(curso, ciclo, tutor)`; o tutor entra na linha se tiver ao menos uma alocação (qualquer situação) no ciclo. Se o ciclo não tiver tutor, uma linha com os campos de tutor vazios.
  - Colunas exatas, nesta ordem:
    `Curso; Ciclo; Modalidade; Tutor; Limite; Orientandos ativos no ciclo; Vagas disponíveis (global); Solicitações pendentes; Solicitações aceitas; Solicitações recusadas; Solicitações aguardando complementação; Solicitações canceladas; Alocações ativas no ciclo; Alocações encerradas no ciclo; Alocações canceladas no ciclo`
  - `Ciclo` = `periodo.identificacao`; se ausente, `ciclo.id`.
  - Contagens de solicitações e alocações referem-se ao ciclo e são repetidas em cada linha de tutor.
  - `Vagas disponíveis (global)` é o mesmo valor para todas as linhas do tutor no recorte.
  - Sem nome ou e-mail de tutorado.
  - Formatação: BOM `\uFEFF`, separador `;`, CRLF, todas as células entre aspas, proteção contra fórmula (`^[\s]*[=+@-]` recebe prefixo `'`).
  - Cabeçalhos HTTP: `Content-Type: text/csv; charset=utf-8`, `Content-Disposition: attachment; filename="painel-gerencial.csv"`, `Cache-Control: no-store`, `X-Content-Type-Options: nosniff`.

### 4.14 [RF041] Consultar trilha de auditoria

- **Ator/prioridade:** Coordenador autorizado; Importante.
- **Filtros:** intervalo de data/hora, usuário responsável, entidade afetada e tipo de ação.
- **Campos exibidos:** data/hora, usuário responsável, entidade afetada e tipo de ação.
- **Ordenação:** data/hora decrescente.
- **Regras:** somente coordenadores autorizados consultam; usuários comuns não alteram registros nem consultam ações fora de sua autorização.
- **Aceite:** página/ação restrita a Coordenador; sem actions de escrita; `detalhes` exibidos apenas se não contiverem dados sensíveis.
- **Regras decididas (D14, D20):**
  - Filtros: `de`/`ate` comparam a parte de data de `dataHora` em `America/Sao_Paulo`, incluindo os limites; `usuario` = `usuarioId`; `entidade` e `tipoAcao` = igualdade exata.
  - Ordenação: `dataHora` desc, desempate por `id` asc.
  - Somente perfil Coordenador; não há action de escrita.
  - “Coordenador autorizado” = perfil Coordenador, pois não há outro marcador de autorização no modelo.

---

## 5. Requisitos não funcionais aplicáveis

| RNF | Critério do DRE | Como verificar neste repositório | Situação inicial |
| --- | --- | --- | --- |
| RNF001 | Interface e mensagens em pt-BR; campos obrigatórios identificados; erros junto ao campo; dados preservados em falha de validação. | Contrato: `errosCampos` usa como chave o atributo `name` do campo; a mensagem aparece em `<p id="<name>-erro">`; o campo recebe `aria-invalid="true"` e `aria-describedby="<name>-erro"`; `erro` global permanece; valores enviados são preservados. Testes de componente para atributos e `defaultValue`; `FormR03` precisa de extensão aditiva. | Parcial: textos em pt-BR e `CampoR03` com `<label>`, mas erro global. |
| RNF002 | Jornadas por teclado, rótulos acessíveis, 360 px–1366 px; WCAG 2.2 AA como referência, sem declarar conformidade formal. | Em ≤ 640 px a sidebar vira barra superior/colapsável, filtros empilham e listas usam cartões ou região com `overflow-x-auto`; em 360 px não pode haver rolagem horizontal da página (`scrollWidth <= innerWidth`). Playwright em 360×800 e 1366×768; inspeção de foco e rótulos. | Parcial: rótulos existem; layout não é responsivo em 360 px. |
| RNF003 | Confirmação transacional; concorrência não ultrapassa capacidade nem cria duplicidade ativa para a mesma proposta; falha de gravação deixa estado consistente. | Testes unitários de regra, concorrência (`Promise.all`) e falha injetada em `fs.renameSync`; verificar `gravarR03`. | A implementar. |
| RNF004 | Backup diário no ambiente implantado; restauração documentada e testada; RPO ≤ 24 h. | Script/procedimento de backup do diretório `data/`; simulação de restauração em diretório temporário; documentação. | A implementar (ambiente). |
| RNF005 | 10.000 usuários, 20.000 registros de orientação, 50 sessões; 95% das consultas ≤ 3 s; relatórios ≤ 8 s. | Script de dados sintéticos + medição de p95 em ambiente documentado; registrar hardware/runtime. | A implementar (verificação). |
| RNF006 | Hash de senha; permissões no servidor em cada operação; sessão encerrável; segredos fora do repositório; HTTPS em implantação. | Revisão de `password.ts` (PBKDF2), `session.ts`, `usuarioR03()`; testes negativos por perfil; checklist de segredos/HTTPS. | Parcial: hash e sessão existem; faltam testes negativos das rotas novas. |
| RNF007 | Minimização; acesso restrito a reuniões; consulta/correção/desativação por perfil; finalidade/base legal/retenção validadas pela instituição. | Inspeção de campos; testes de acesso por perfil; documentação LGPD com ressalvas. | Parcial: RF007/RF008 existem; falta inventário e testes de reunião. |
| RNF008 | Aplicação web sem instalação; duas versões estáveis mais recentes de Chrome, Edge e Firefox. | Teste exploratório manual; Playwright cobre Chromium; documentar limitação dos demais navegadores. | A verificar (manual). |
| RNF009 | Princípios da LGPD; CSV UTF-8 com cabeçalhos estáveis; documentar decisões de segurança, retenção, campos e limitações. | Checklist LGPD; revisão dos CSVs; documentação em `docs/`. | Parcial: CSV de solicitações já usa UTF-8/BOM; falta documentação. |
| RNF010 | Declarar versões de runtime/dependências/banco; instruções de instalação; separar configuração local/secrets; documentar homologação. | Revisar `package.json`, README, `.env.example` (se existir), guia de instalação em ambiente limpo. | Parcial: `package.json` existe; README com placeholders. |

---

## 6. Matriz de rastreabilidade inicial

Status: **A implementar** = não existe; **Parcial** = existe base a completar; **Existente** = já atende e só precisa de evidência; **Bloqueado** = depende de decisão registrada.

| Requisito | Comportamento/camada | Arquivos previstos/implementados | Evidência/teste | Status |
| --- | --- | --- | --- | --- |
| RF021 | Ação de confirmação com validações de tutor/tutorado/ciclo/proposta/capacidade/duplicidade | `release04-actions.ts`, `release04-model.ts` | Implementado. Verificação por `tsc`/`build`. Sem suíte E2E executada neste ambiente. | Implementado (não verificado por testes) |
| RF022 | Ação de encerramento com motivo/data/responsável | `release04-actions.ts` | Implementado. | Implementado (não verificado por testes) |
| RF030 | Ação de cancelamento com motivo/data/responsável | `release04-actions.ts` | Implementado. | Implementado (não verificado por testes) |
| RF031 | Consulta de alocações com filtros e projeção por perfil | `release04-queries.ts`, `app/(main)/alocacoes/page.tsx` | Implementado. | Implementado (não verificado por testes) |
| RF032 | Inclusão de etapa pelo tutor da alocação | `release04-actions.ts`, `app/(main)/etapas/page.tsx` | Implementado. | Implementado (não verificado por testes) |
| RF033 | Inclusão de reunião pelo tutor da alocação | `release04-actions.ts`, `app/(main)/reunioes/page.tsx` | Implementado. | Implementado (não verificado por testes) |
| RF034 | Notificações internas em eventos mínimos | `notificacoes.ts`/estrita, ações R03/R04 | Implementado para eventos mínimos. Lacuna de “alteração de prazo” documentada (D11). `PrazoAlterado` não emitido. | Parcial (lacuna documentada) |
| RF035 | Painel gerencial por curso/ciclo | `release04-queries.ts`, `app/(main)/painel/page.tsx` | Implementado. | Implementado (não verificado por testes) |
| RF036 | Auditoria de contas, ciclos, solicitações, decisões e alocações | `auditoria.ts`/estrita, ações R01/R03/R04 | Instrumentação adicionada (R01/R02 já auditavam; R03 instrumentado). Sem action de edição/exclusão. | Parcial/Implementado (sem verificação por testes) |
| RF037 | Consulta de etapas por perfil e vínculo | `release04-queries.ts`, `app/(main)/etapas/page.tsx` | Implementado. | Implementado (não verificado por testes) |
| RF038 | Consulta de reuniões por perfil e vínculo | `release04-queries.ts`, `app/(main)/reunioes/page.tsx` | Implementado. | Implementado (não verificado por testes) |
| RF039 | Consulta de notificações próprias | `release04-queries.ts`, `app/(main)/notificacoes/page.tsx` | Implementado. | Implementado (não verificado por testes) |
| RF040 | CSV do painel em UTF-8, com filtros e ordenação | `release04-queries.ts`, `app/(main)/painel/csv/route.ts` | Implementado. | Implementado (não verificado por testes) |
| RF041 | Consulta de auditoria restrita à coordenação | `release04-queries.ts`, `app/(main)/auditoria/page.tsx` | Implementado. | Implementado (não verificado por testes) |
| RNF001 | Erros por campo, pt-BR, preservação de dados | `release03-form.tsx`/`release03-ui.tsx` (extensão aditiva) | Testes de componente e inspeção | Parcial |
| RNF002 | Teclado, rótulos, 360–1366 px | Layout e componentes | Playwright viewports + inspeção manual | Parcial |
| RNF003 | Integridade/capacidade/concorrência | `release04-actions.ts`, `release04-store` (reuso) | Testes de concorrência, rollback e atomicidade | A implementar |
| RNF004 | Backup/restauração | `docs/`, script de backup | Simulação de restauração | A implementar |
| RNF005 | Tempo de resposta | Script de carga | Medição p95 documentada | A implementar |
| RNF006 | Hash, autorização, sessão, segredos, HTTPS | `password.ts`, `session.ts`, ações/páginas | Testes negativos + checklist | Parcial |
| RNF007 | Privacidade/minimização | Consultas/projeções, docs | Testes de acesso e inventário LGPD | Parcial |
| RNF008 | Web/cross-browser | Docs | Teste manual + limitação | A verificar |
| RNF009 | LGPD/CSV/documentação | Docs, CSV | Checklist + revisão | Parcial |
| RNF010 | Ambiente/reprodutibilidade | README, docs, configs | Instalação em ambiente limpo | Parcial |

---

## 7. Contratos de dados e compatibilidade

### 7.1 Tipos existentes

`src/app/types/index.ts` já contém:

- `AlocacaoOrientacao`: `id`, `tutorId`, `tutoradoId`, `propostaId`, `cicloId`, `situacao`, `dataConfirmacao`, `coordenadorId`, `motivo?`, `dataEncerramento?`.
- `EtapaAcompanhamento`: `id`, `alocacaoId`, `descricao`, `responsavel`, `prazo`, `situacao`.
- `RegistroReuniao`: `id`, `alocacaoId`, `data`, `resumo`, `encaminhamentos`, `proximoContato`.
- `NotificacaoInterna`: `id`, `usuarioId`, `tipoEvento`, `descricao`, `dataHora`, `referencia?`, `lida`.
- `RegistroAuditoria`: `id`, `dataHora`, `usuarioId`, `usuarioEmail`, `entidade`, `tipoAcao`, `detalhes?`.

### 7.2 Extensões aditivas adotadas

```ts
// release04-model.ts
import type { AlocacaoOrientacao, EtapaAcompanhamento } from '../types';

export interface AlocacaoR04 extends AlocacaoOrientacao {
  solicitacaoId?: string;       // rastreabilidade opcional; não exigir decisão Aceita
  responsavelAcaoId?: string;   // quem encerrou/cancelou
  dataCancelamento?: string;    // ISO; preenchida apenas em cancelamento
}

export interface EtapaR04 extends EtapaAcompanhamento {
  criadaPorId?: string;         // opcional; auditoria já registra o autor
}
```

- `dataEncerramento` continua sendo a data terminal do encerramento.
- `dataCancelamento` é aditiva e distingue cancelamento de encerramento.
- `responsavelAcaoId` é opcional para não invalidar registros antigos e é preenchido no encerramento e no cancelamento.
- `solicitacaoId` é opcional; string vazia equivale a omitido; se informado, validar no servidor conforme 4.1.
- `motivo` é reutilizado em encerramento e cancelamento.
- Não alterar `NotificacaoInterna` nem `RegistroAuditoria`; já atendem ao DRE.

### 7.3 Resultado de ação e erros por campo

Estender `ResultadoAcao` de forma aditiva:

```ts
export type ResultadoAcao = {
  erro?: string;
  sucesso?: boolean;
  mensagem?: string;
  errosCampos?: Record<string, string>;
} | null;
```

- `erro` continua sendo a mensagem global (compatível com testes existentes).
- `errosCampos` é opcional; a chave é exatamente o atributo `name` do campo e o valor é a mensagem em pt-BR.
- A UI deve renderizar `<p id="<name>-erro">` junto ao campo e aplicar `aria-invalid="true"` e `aria-describedby="<name>-erro"`.
- Em falha de validação, `erro` global permanece e os valores enviados são preservados.
- Mensagens de campo não podem conter códigos `RF...`/`RNF...`.
- Não renomear `erro` nem `sucesso`.

### 7.4 Datas e horários

- Timestamps (`dataConfirmacao`, `dataEncerramento`, `dataCancelamento`, `dataHora`, `dataSolicitacao`, `dataDecisao`): ISO 8601 (`new Date().toISOString()`).
- Datas de calendário (`prazo`, `data` da reunião, `proximoContato`, prazos de ciclo): `YYYY-MM-DD`, validadas com `dataValida`.
- Exibição: usar `dataR03`, que trata os dois formatos no fuso `America/Sao_Paulo`.
- Filtros de intervalo de reunião/auditoria: aceitar `YYYY-MM-DD` e comparar com a parte de data do registro; documentar inclusão dos limites.

### 7.5 Persistência e compatibilidade

- Arquivos: `alocacoes.json`, `etapas.json`, `reunioes.json`, `notificacoes.json`, `auditoria.json`.
- Novas mutações: `lerR03` + validação + `gravarR03` uma única vez.
- `gravarR03` grava em arquivo temporário e renomeia: o destino nunca fica parcial.
- Não criar migração destrutiva. Registros antigos sem os campos novos continuam válidos.
- Preservar `data/auditoria.json` (13 registros) em qualquer teste manual.
- Testes sempre com `SGOA_DATA_DIR` temporário.

### 7.6 Nomes de campos de formulário e filtros

Contrato vinculante para actions, páginas e testes:

| Operação | Campos `name` |
| --- | --- |
| Confirmar alocação | `tutorId`, `tutoradoId`, `propostaId`, `cicloId`, `solicitacaoId` (opcional) |
| Encerrar alocação | `id`, `motivo` |
| Cancelar alocação | `id`, `motivo` |
| Criar etapa | `alocacaoId`, `descricao`, `responsavel`, `prazo`, `situacao` |
| Criar reunião | `alocacaoId`, `data`, `resumo`, `encaminhamentos`, `proximoContato` |
| Filtros de alocações | `curso`, `ciclo`, `tutor`, `tutorado`, `situacao` |
| Filtros de etapas | `alocacao`, `proposta`, `responsavel`, `situacao` |
| Filtros de reuniões | `alocacao`, `de`, `ate` |
| Filtros de notificações | `tipo`, `de`, `ate` |
| Filtros de painel/CSV | `curso`, `ciclo` |
| Filtros de auditoria | `de`, `ate`, `usuario`, `entidade`, `tipoAcao` |

Parâmetros repetidos: usar o primeiro valor. Parâmetro vazio é equivalente a ausente.

---

## 8. Matriz de autorização

| Ação/consulta | Coordenador | Tutor | Tutorado | Regra de vínculo |
| --- | --- | --- | --- | --- |
| RF021 Confirmar alocação | Sim | Não | Não | Coordenador ativo. |
| RF022 Encerrar alocação | Sim | Não | Não | Coordenador ativo. |
| RF030 Cancelar alocação | Sim | Não | Não | Coordenador ativo. |
| RF031 Consultar alocações | Sim (global) | Sim (próprias) | Sim (próprias) | `tutorId === u.id` ou `tutoradoId === u.id`. |
| RF032 Incluir etapa | Não | Sim | Não | `alocacao.tutorId === u.id`. |
| RF033 Incluir reunião | Não | Sim | Não | `alocacao.tutorId === u.id`. |
| RF034 Gerar notificação | Sistema | Sistema | Sistema | Destinatário definido pelo evento. |
| RF035 Painel gerencial | Sim | Não | Não | Coordenador ativo. |
| RF036 Auditoria (escrita) | Sistema | Sistema | Sistema | Ação do sistema; nunca pelo cliente. |
| RF037 Consultar etapas | Sim (global) | Sim (próprias) | Sim (próprias) | Participação na alocação. |
| RF038 Consultar reuniões | Sim (global) | Sim (próprias) | Sim (próprias) | Participação na alocação; validar acesso por ID. |
| RF039 Consultar notificações | Sim (próprias) | Sim (próprias) | Sim (próprias) | `usuarioId === u.id`, inclusive para Coordenador. |
| RF040 Exportar CSV | Sim | Não | Não | Coordenador ativo; mesmos filtros do painel. |
| RF041 Consultar auditoria | Sim | Não | Não | Coordenador ativo. |

Observações:

- O middleware só verifica presença de cookie; **não** substitui `usuarioR03()`.
- Toda página deve redirecionar para `/login` quando `usuarioR03()` retornar `null`.
- Toda action deve repetir a validação de perfil e vínculo, mesmo que a UI esconda o botão.
- “Coordenação global” é limitação do modelo atual; registrar em decisões.

---

## 9. Sequência de implementação

### Fase 0 — Baseline, decisões e congelamento de escopo (bloqueante)

**Objetivo:** saber o estado real antes de alterar código e confirmar as decisões registradas.

Tarefas:

1. Executar `npm install` em `projeto-final` (se houver conflito de peer, usar `npm ci --legacy-peer-deps` em cópia isolada e registrar).
2. Executar o baseline da seção 2.5 e registrar números/falhas em `docs/RELEASE-04-DECISOES.md`.
3. Criar/atualizar `docs/RELEASE-04-DECISOES.md` com:
   - numeração canônica do DRE e a inconsistência da Seção 5;
   - decisões D01–D20 com decisão ou padrão registrado (seção 14 deste plano);
   - escopo congelado: RF021, RF022, RF030–RF041, RNF001–RNF010;
   - itens fora do escopo: RF023 (edição de ciclo), RF024–RF029 (já na R03), RF020 (já na R03), RF042+ (não existem);
   - baseline real da seção 2.5 (a tabela de baseline do arquivo de decisões começa vazia).
4. Confirmar que `docs/RELEASE-04.md` permanece intacto.

**Saída:** baseline registrado; decisões documentadas; nenhum código funcional alterado.

### Fase 1 — Contratos, modelo, acesso e consultas-base

**Objetivo:** criar a fundação sem alterar comportamento existente.

Tarefas:

1. Adicionar `AlocacaoR04` e `EtapaR04` em `release04-model.ts` (ou no arquivo de tipos, se o padrão da equipe preferir).
2. Estender `ResultadoAcao` com `errosCampos?`.
3. Criar `release04-model.ts` com:
   - `estadosAlocacao`, `estadosEtapa`, `tiposEventoNotificacao`;
   - rótulos em pt-BR;
   - validadores `textoObrigatorio`, `dataValida`, `dataHoraValida`, `limiteInteiro`;
   - função de capacidade `contarAlocacoesAtivas(alocacoes, tutorId)`.
4. Adicionar variantes estritas de auditoria/notificação **sem alterar** as funções existentes. **Opção A adotada:** funções aditivas em `auditoria.ts`/`notificacoes.ts` — `registrarAuditoriaEstrita(...)` e `criarNotificacaoEstrita(...)`, usando `lerR03`/`gravarR03`; mantêm `registrarAuditoria` e `criarNotificacao` atuais e seus testes. Em falha, registrar `console.error` e não reverter a operação principal (D13).
5. Criar fixtures de R04 reutilizando o padrão de `release03-fixtures.ts`.
6. Criar esqueleto de `release04-queries.ts` com tipos de filtro e projeções.

**Saída:** `npx tsc --noEmit` e testes existentes verdes; nenhuma rota nova ainda.

### Fase 2 — Alocações: confirmar, encerrar, cancelar e consultar

**Objetivo:** entregar RF021, RF022, RF030, RF031 e a base de RNF003.

Tarefas:

1. Implementar `confirmarAlocacaoAction`:
   - `usuarioR03()` + perfil Coordenador;
   - recarregar tutor, tutorado, proposta, ciclo;
   - validar vínculos e modalidade;
   - validar limite inteiro ≥ 1 (D03);
   - validar capacidade global e duplicidade ativa por proposta;
   - validar `solicitacaoId` se informado;
   - criar registro e gravar uma única vez;
   - auditar e notificar após a gravação, em best-effort (D13).
2. Implementar `encerrarAlocacaoAction` e `cancelarAlocacaoAction`:
   - exigir `motivo` com `trim` (1–5.000 caracteres);
   - validar `Ativa → Encerrada` / `Ativa → Cancelada`;
   - preencher `dataEncerramento`/`dataCancelamento` e `responsavelAcaoId`;
   - preservar demais registros;
   - auditar e notificar em best-effort.
3. Implementar `consultarAlocacoes(u, filtros)`:
   - filtros de curso, ciclo, tutor, tutorado e situação;
   - projeção explícita sem objetos `Usuario` completos;
   - ordenação por `dataConfirmacao` decrescente;
   - filtro de participação no servidor.
4. Criar página `/alocacoes` com filtros, lista e formulários de confirmação/encerramento/cancelamento.
5. Criar testes unitários de ações e consultas (ver seção 11).

**Saída:** RF021/RF022/RF030/RF031 cobertos por testes; dados antigos intactos; nenhuma duplicidade ativa.

### Fase 3 — Etapas e reuniões

**Objetivo:** entregar RF032, RF033, RF037 e RF038.

Tarefas:

1. Implementar `criarEtapaAction`:
   - Tutor ativo e tutor da alocação;
   - alocação `Ativa`;
   - validar descrição, responsável, prazo e situação;
   - gravar `EtapaAcompanhamento`.
2. Implementar `criarReuniaoAction`:
   - Tutor ativo e tutor da alocação;
   - alocação `Ativa`;
   - validar data, resumo, encaminhamentos e próximo contato;
   - gravar `RegistroReuniao`.
3. Implementar `consultarEtapas(u, filtros)` e `consultarReunioes(u, filtros)`:
   - filtros e ordenação do DRE;
   - validação de participação no servidor;
   - proteção contra acesso indireto por `alocacaoId` de terceiros.
4. Criar páginas `/etapas` e `/reunioes` com filtros, lista e formulário (formulário só para tutor da alocação).
5. Criar testes de ator, vínculo, campos, datas, ordenação e isolamento.

**Saída:** RF032/RF033/RF037/RF038 cobertos; tutorado e coordenação não conseguem criar; acessos negados testados.

### Fase 4 — Painel, CSV, notificações e auditoria

**Objetivo:** entregar RF034, RF035, RF036, RF039, RF040 e RF041, incluindo a instrumentação das ações da R03.

Tarefas:

1. Implementar `consultarPainel(u, filtros)`:
   - agrupar por `(curso, ciclo, tutor)`;
   - contar solicitações por situação no ciclo;
   - contar alocações ativas no ciclo e exibir encerradas/canceladas em colunas separadas;
   - contar orientandos ativos por tutor no ciclo;
   - calcular vagas disponíveis globais por tutor (`max(0, limite − ativas globais)`), repetidas por linha;
   - ordenar por curso, período, ciclo e tutor.
2. Criar página `/painel` (Coordenação) e rota `/painel/csv` com o formato da seção 4.13.
3. Implementar `consultarNotificacoes(u, filtros)` e página `/notificacoes`:
   - somente `usuarioId === u.id`;
   - filtros por tipo e intervalo inclusivo de datas;
   - ordenação `dataHora` decrescente, desempate por `id`.
4. Instrumentar notificações nos eventos existentes, com os tipos da seção 4.7:
   - `criarSolicitacaoAction` → todos os `tutoresPreferidos`, sem duplicatas;
   - `decidirSolicitacaoAction` → tutorado;
   - confirmação/encerramento/cancelamento → tutor e tutorado;
   - não emitir `PrazoAlterado`; registrar a lacuna de “alteração de prazo” (D11).
5. Instrumentar auditoria em `release03-actions.ts`, com entidade e `tipoAcao` da tabela 4.9:
   - `salvarCicloAction` → `CRIACAO`/`EDICAO`;
   - `mudarCicloAction` → `ALTERACAO_SITUACAO`;
   - criar/editar/cancelar/decidir solicitação → `CRIACAO`/`EDICAO`/`CANCELAMENTO`/`DECISAO`.
6. Implementar `consultarAuditoria(u, filtros)` e página `/auditoria` (Coordenação), sem actions de escrita; filtros `de`, `ate`, `usuario`, `entidade`, `tipoAcao`.
7. Atualizar navegação em `src/app/(main)/layout.tsx` e, por conveniência de UX, incluir as rotas novas no middleware (sem confiar nele para autorização).
8. Criar testes de painel, CSV, notificações, auditoria e instrumentação das ações R03.

**Saída:** RF034–RF036, RF039–RF041 cobertos; painel e CSV consistentes; eventos da R03 notificados/auditados.

### Fase 5 — RNFs, acessibilidade e verificações transversais

**Objetivo:** fechar RNF001–RNF010 com evidência ou limitação explícita.

Tarefas:

1. RNF001: adicionar `errosCampos` ao fluxo de formulário e exibir mensagem junto ao campo; manter `erro` global; testar preservação de dados.
2. RNF002: tornar o layout utilizável em 360 px (sidebar colapsável ou empilhada) e garantir foco/teclado/rótulos; testar 360×800 e 1366×768.
3. RNF003: testes de concorrência e falha de gravação; documentar limite de processo único.
4. RNF004: criar procedimento/script de backup e simular restauração em diretório temporário; documentar RPO de 24 h.
5. RNF005: criar script de dados sintéticos e medição de p95; registrar ambiente; não prometer produção.
6. RNF006: testes negativos por perfil em todas as rotas/ações; revisar hash, sessão, segredos e HTTPS.
7. RNF007: inventário de dados pessoais, testes de acesso a reuniões e minimização.
8. RNF008: registrar matriz de navegadores e limitação do Playwright (Chromium).
9. RNF009: checklist LGPD e revisão dos CSVs (UTF-8/BOM, cabeçalhos estáveis).
10. RNF010: completar README com versões reais, instalação, `SGOA_DATA_DIR`, `TOKEN`, requisitos de homologação e separação de secrets.

**Saída:** matriz de RNFs com evidência ou limitação; nenhum RNF marcado como atendido sem teste/inspeção.

### Fase 6 — Documentação, rastreabilidade e marco R04

**Objetivo:** fechar a release com evidência, não com promessa.

Tarefas:

1. Criar `docs/RELEASE-04-RELATORIO.md` (ou seção equivalente) com:
   - requisitos atendidos e arquivos alterados;
   - comandos executados e resultados reais;
   - decisões e pendências;
   - riscos e limitações;
   - instruções de implantação/rollback.
2. Atualizar a matriz de rastreabilidade com status final e links para testes.
3. Revisar o diff completo; garantir que `docs/RELEASE-04.md` e `data/auditoria.json` não foram alterados indevidamente.
4. Executar a suíte completa (unitários, build, E2E) e registrar a saída.
5. Só declarar o marco R04 quando todos os critérios aplicáveis tiverem evidência ou pendência justificada.

**Saída:** relatório de R04 e matriz final; marco R04 declarado apenas com evidência.

---

## 10. Rotas e arquivos previstos

| Caminho | Tipo | Finalidade | Autorização |
| --- | --- | --- | --- |
| `src/app/libs/release04-model.ts` | lib | Constantes, validações, tipos aditivos, capacidade | Servidor |
| `src/app/libs/release04-actions.ts` | Server Actions | Confirmar/encerrar/cancelar alocação; criar etapa/reunião | Perfil + vínculo |
| `src/app/libs/release04-queries.ts` | lib | Consultas de alocações, etapas, reuniões, painel, notificações, auditoria e CSV | Servidor |
| `src/app/(main)/alocacoes/page.tsx` | página | Lista/filtros e formulários de alocação | Coordenação para escrita; participantes para leitura |
| `src/app/(main)/etapas/page.tsx` | página | Lista/filtros e formulário de etapa | Tutor da alocação para escrita; participantes para leitura |
| `src/app/(main)/reunioes/page.tsx` | página | Lista/filtros e formulário de reunião | Tutor da alocação para escrita; participantes para leitura |
| `src/app/(main)/painel/page.tsx` | página | Painel gerencial | Coordenação |
| `src/app/(main)/painel/csv/route.ts` | route handler | Exportação CSV | Coordenação |
| `src/app/(main)/notificacoes/page.tsx` | página | Notificações próprias | Todos os perfis |
| `src/app/(main)/auditoria/page.tsx` | página | Trilha de auditoria | Coordenação |
| `src/app/components/release04-ui.tsx` | componente | Componentes compartilhados de R04 | Cliente/servidor |
| `src/app/(main)/layout.tsx` | layout | Links novos | Sessão |
| `src/middleware.ts` | middleware | Redirecionar rotas novas sem cookie | Apenas UX; não autorização |

Observações:

- Não criar rota de detalhe por ID sem validar vínculo. Se `/alocacoes/[id]` for necessária, aplicar a mesma matriz de autorização.
- Reutilizar `FormR03`, `CampoR03`, `campoR03`, `painelR03`, `dataR03` e `SituacaoR03` sempre que possível. Estender `FormR03` de forma aditiva para `errosCampos`; não criar `release04-form.tsx` nesta release.
- Novas páginas devem seguir o padrão de `relatorio-solicitacoes/page.tsx`: `usuarioR03()`, `redirect('/login')` e verificação de perfil.

---

## 11. Integridade, capacidade e concorrência (RNF003)

### 11.1 Algoritmo de confirmação

```text
1. usuarioR03() e perfil Coordenador
2. Ler usuarios.json, propostas.json, ciclos.json, alocacoes.json, solicitacoes.json
3. Validar tutor (existe, Tutor, Ativa)
4. Validar tutorado (existe, Tutorado, Ativa)
5. Validar proposta (existe, proposta.tutoradoId === tutoradoId, proposta.tipo === ciclo.modalidade)
6. Validar ciclo (existe, situacao ∈ {Publicado, Aberto, Encerrado})
7. Validar limite: limiteOrientandos inteiro ≥ 1; senão erro
8. Contar alocações Ativa do tutor em todos os ciclos
9. Se contagem >= limite → erro
10. Se existe alocação Ativa com mesmo propostaId → erro
11. Se solicitacaoId informado: validar existência e vínculo; senão erro
12. Criar registro com situacao Ativa, dataConfirmacao ISO, coordenadorId
13. gravarR03('alocacoes.json', [...alocacoes, nova])
14. Auditar e notificar em best-effort (após a gravação)
```

Regras:

- O bloco 2–13 deve ser síncrono, sem `await` entre leitura e gravação.
- `gravarR03` é atômico por arquivo (temporário + rename).
- Não usar `ConexaoBD` para a escrita.
- Se a gravação falhar, o arquivo original permanece; o erro é retornado ao usuário.
- Auditoria/notificação não desfazem a alocação já gravada; falha é registrada com `console.error` e a resposta continua sendo de sucesso (D13).

### 11.2 Capacidade

- Limite: `Usuario.limiteOrientandos`, válido somente se inteiro ≥ 1.
- Contagem: todas as alocações `Ativa` do tutor, em todos os cursos e ciclos (D03).
- Limite ausente, não inteiro ou ≤ 0: bloquear confirmação; não tratar como ilimitado.
- No painel, a vaga exibida é global por tutor; a contagem de orientandos é por ciclo (seção 4.8).

### 11.3 Duplicidade

- Proibido: mais de uma alocação `Ativa` para a mesma `propostaId`.
- Permitido: alocações encerradas/canceladas da mesma proposta (histórico).
- A validação ocorre no servidor, não na UI.

### 11.4 Concorrência

Teste obrigatório:

```ts
const resultados = await Promise.all([
  confirmarAlocacaoAction(null, form(...)),
  confirmarAlocacaoAction(null, form(...)),
]);
expect(resultados.filter(r => r?.sucesso)).toHaveLength(1);
expect(lerR03<AlocacaoR04>('alocacoes.json').filter(a => a.situacao === 'Ativa')).toHaveLength(limite);
```

Limitação: o modelo é de processo único. Em múltiplos processos/instâncias, o arquivo JSON não oferece lock distribuído. Documentar em RNF003/RNF010 e não prometer concorrência multi-processo.

### 11.5 Falha de gravação

Teste obrigatório:

- Fazer `vi.spyOn(fs, 'renameSync').mockImplementationOnce(() => { throw new Error('falha'); })`.
- Chamar a action.
- Verificar que `alocacoes.json` permanece com o conteúdo anterior e que o arquivo temporário foi removido.

### 11.6 Falha de auditoria/notificação (D13)

- A gravação principal é a fonte de verdade; auditoria e notificação são efeitos secundários.
- Teste: simular falha em `registrarAuditoriaEstrita`/`criarNotificacaoEstrita` e verificar que:
  1. o registro principal continua gravado;
  2. a action retorna `sucesso: true`;
  3. a falha aparece em `console.error`.
- Não implementar rollback da alocação por falha de auditoria/notificação.
- Se auditoria passar a ser obrigatória por decisão institucional, isso exige nova decisão e desenho transacional próprio.

---

## 12. Plano de testes

### 12.1 Unitários (Vitest, ambiente node)

Arquivos previstos:

- `src/app/libs/__tests__/release04-alocacoes.test.ts`
- `src/app/libs/__tests__/release04-etapas-reunioes.test.ts`
- `src/app/libs/__tests__/release04-consultas.test.ts`
- `src/app/libs/__tests__/release04-painel.test.ts`
- `src/app/libs/__tests__/release04-notificacoes.test.ts`
- `src/app/libs/__tests__/release04-auditoria.test.ts`
- `src/app/libs/__tests__/release04-concorrencia.test.ts`
- `src/app/libs/__tests__/release04-fixtures.ts`

Casos mínimos:

**RF021**
- Coordenador confirma com dados válidos.
- Tutor inativo, tutorado inativo, proposta inexistente, proposta de outro tutorado, modalidade divergente, ciclo inexistente/cancelado.
- Ciclo `Encerrado` permite confirmação; `Rascunho` bloqueia.
- Capacidade cheia; limite ausente/0/não inteiro bloqueia.
- Duplicidade ativa por proposta; duplicidade histórica permitida.
- `solicitacaoId` ausente/vazio é aceito; inexistente bloqueia; vínculo divergente bloqueia; vínculo válido é gravado.
- Tutor/tutorado/coordenador sem permissão.
- Concorrência: duas confirmações para a última vaga → uma sucesso.
- Falha de gravação → arquivo intacto.
- Falha de auditoria/notificação → alocação permanece e ação retorna sucesso (D13).

**RF022/RF030**
- Encerrar/cancelar com motivo.
- Motivo vazio; motivo acima de 5.000.
- Alocação inexistente; alocação já encerrada/cancelada.
- Tutor/tutorado não podem.
- Histórico de solicitações/decisões/etapas/reuniões preservado.

**RF031**
- Filtros combinados e isolados.
- Tutor vê só as próprias; tutorado só as próprias; coordenação vê todas.
- Ordenação por confirmação decrescente.
- Projeção não contém `senha`, `email` ou objeto `Usuario` completo.

**RF032/RF033**
- Tutor da alocação cria etapa/reunião.
- Outro tutor, tutorado e coordenação não criam.
- Alocação inexistente/encerrada/cancelada.
- Campos vazios, datas inválidas, limites de texto.
- Situação inválida de etapa.
- `Atrasada` é gravada somente quando escolhida; nenhum cálculo automático a partir do prazo (D07).
- `proximoContato` válido e anterior à `data` é aceito (D09).

**RF037/RF038**
- Participantes consultam; terceiros não.
- Filtros por alocação/proposta, responsável, situação, intervalo de datas.
- Ordenação (prazo asc; data desc).
- Acesso direto por ID de alocação alheia retorna vazio/negado.

**RF034/RF039**
- Eventos geram notificação para os destinatários corretos.
- Nenhum e-mail/SMS é enviado (não há integração; testar que só grava JSON).
- Usuário vê só as próprias; coordenação também só as próprias.
- Filtros por tipo e intervalo inclusivo; ordenação decrescente com desempate por `id`.
- `PrazoAlterado` não é emitido em nenhum fluxo (D11).
- Falha de notificação não quebra a operação principal (D13).

**RF035/RF040**
- Contagens por situação, alocações ativas no ciclo, orientandos por tutor no ciclo e vagas globais.
- Tutor com limite 3 e 2 ativas em outro ciclo: vagas globais = 1 em todas as linhas; orientandos no ciclo = valor do ciclo.
- Limite ausente/inválido exibe `—` e não vira ilimitado.
- Filtros por curso/ciclo; agrupamento e ordenação por curso, período, ciclo e tutor.
- CSV: BOM, `;`, CRLF, colunas exatas da seção 4.13, fórmula (`=`, `+`, `-`, `@`), permissão 401/403.
- CSV não inclui nome/e-mail de tutorado.
- Linha com tutor vazio quando o ciclo não tiver tutor.

**RF036/RF041**
- Eventos de conta, ciclo, solicitação, decisão e alocação geram registro com entidade e `tipoAcao` da tabela 4.9.
- Registro contém data/hora, usuário, entidade e tipo de ação.
- Não existe action de edição/exclusão de auditoria.
- Coordenação consulta; tutor/tutorado não.
- Filtros por data, usuário, entidade e tipo; ordenação decrescente com desempate por `id`.
- Falha de auditoria não reverte a operação principal (D13).

### 12.2 Componentes (jsdom)

- Formulário exibe erro global e erro por campo.
- Cada erro de campo usa `<p id="<name>-erro">` e o campo tem `aria-invalid="true"` e `aria-describedby="<name>-erro"`.
- Dados preenchidos permanecem após erro.
- Botão desabilita durante envio.
- Confirmação de encerramento/cancelamento.
- Links/rotas visíveis conforme perfil.
- Em 360 px, `scrollWidth <= innerWidth` na página e nos formulários.

### 12.3 E2E (Playwright)

Arquivos previstos:

- `e2e/release04-alocacoes.spec.ts`
- `e2e/release04-etapas-reunioes.spec.ts`
- `e2e/release04-painel.spec.ts`
- `e2e/release04-notificacoes-auditoria.spec.ts`

Jornadas:

1. Coordenação confirma alocação; tutor e tutorado veem a alocação.
2. Coordenação encerra e cancela com motivo; histórico permanece.
3. Tutor cria etapa e reunião; tutorado consulta; terceiro não acessa.
4. Coordenação abre painel, aplica filtros e baixa CSV.
5. Tutorado consulta notificações próprias; não vê de terceiros.
6. Coordenação consulta auditoria; tutor não acessa.
7. Acesso negado por URL direta é testado.

### 12.4 Comandos de evidência

```bash
cd projeto-final
npx tsc --noEmit
npm test -- --run --pool=threads --maxWorkers=1
npm run build
npm run test:e2e -- --timeout=120000
```

Para uma suíte específica:

```bash
npx vitest run src/app/libs/__tests__/release04-alocacoes.test.ts
npm run test:e2e -- --project=chromium e2e/release04-alocacoes.spec.ts
```

Não registrar “aprovado” sem a saída real do comando.

---

## 13. LGPD, implantação, backup e rollback

### 13.1 Inventário de dados pessoais

| Arquivo | Dados pessoais | Finalidade | Acesso | Retenção/exportação |
| --- | --- | --- | --- | --- |
| `usuarios.json` | Nome, e-mail, senha hash, perfil, dados acadêmicos, apresentação, áreas, disponibilidade | Autenticação e gestão acadêmica | Coordenação; próprio usuário conforme tela | Sem exclusão automática; retenção documentada (D12); nunca exportar senha. |
| `propostas.json` | Autoria, título, resumo, palavras-chave | Solicitação de orientação | Autor, coordenação, tutores conforme fluxo | Sem exclusão automática; retenção documentada (D12). |
| `solicitacoes.json` | Tutorado, preferências, decisão, justificativa | Avaliação de orientação | Participantes e coordenação | Sem exclusão automática; retenção documentada (D12). |
| `alocacoes.json` | Tutor, tutorado, proposta, ciclo, motivo | Vínculo de orientação | Participantes e coordenação | Sem exclusão automática; retenção documentada (D12). |
| `etapas.json` | Responsável, descrição, prazo | Acompanhamento | Participantes e coordenação | Sem exclusão automática; retenção documentada (D12). |
| `reunioes.json` | Resumo, encaminhamentos, próximo contato | Acompanhamento | Participantes e coordenação | Sem exclusão automática; retenção documentada (D12); acesso restrito. |
| `notificacoes.json` | Usuário, descrição, referência | Comunicação interna | Apenas o destinatário | Sem exclusão automática; retenção documentada (D12). |
| `auditoria.json` | Usuário, e-mail, ação, detalhes | Trilha de auditoria | Coordenação | Sem exclusão automática; retenção documentada (D12); minimizar detalhes. |

### 13.2 Backup e restauração (RNF004)

Procedimento mínimo:

1. Copiar o diretório `data/` para um destino fora do repositório, com data/hora no nome.
2. Agendar cópia diária no ambiente de homologação.
3. Testar restauração em diretório temporário:
   - parar a aplicação;
   - substituir `data/` pela cópia;
   - iniciar e validar login/listagens;
   - registrar data, responsável e resultado.
4. Documentar RPO de 24 h e a limitação de backup local.

### 13.3 Implantação

- Runtime: Node.js compatível com Next.js 16 (declarar versão exata no README).
- Instalação: `npm ci` (ou `npm install`), `npm run build`, `npm start`.
- Variáveis: `SGOA_DATA_DIR` (diretório de dados) e `TOKEN` (segredo de sessão). Nunca versionar `.env` com segredo real.
- HTTPS obrigatório em implantação (RNF006).
- Não usar dados reais em testes sem autorização (DRE 2.1).

### 13.4 Rollback

- Código: reverter o commit da release.
- Dados: restaurar a cópia mais recente de `data/`; não há migração destrutiva.
- Registrar no relatório qual backup foi usado e quais registros foram perdidos (se houver).

---

## 14. Decisões

### 14.1 Resolvidas

| ID | Decisão | Resolução |
| --- | --- | --- |
| D01 | Numeração do DRE (Seção 3 vs Seção 5). | Usar a Seção 3; registrar a inconsistência. |
| D02 | Alocação exige solicitação `Aceita`? | **Não.** O DRE não exige. `solicitacaoId` é opcional. |
| D03 | `limiteOrientandos` ausente/0 e recorte da capacidade. | Limite válido somente se inteiro ≥ 1; senão bloquear. Contar alocações `Ativa` globalmente, em todos os ciclos. |
| D04 | Quem confirma alocação? | Coordenador. |
| D05 | Quem encerra/cancela alocação? | Coordenador. |
| D06 | Quem cria etapa/reunião? | Tutor da alocação; coordenação e tutorado apenas consultam. |
| D07 | Situação da etapa e `Atrasada`. | `Pendente/EmAndamento/Concluida/Atrasada`; gravar o valor escolhido, sem derivação automática. |
| D11 | “Alteração de prazo” sem fluxo na R03. | Registrar lacuna; não implementar RF023; `PrazoAlterado` nunca é emitido; RF034 fica Parcial. |
| D13 | Falha de auditoria/notificação bloqueia a operação? | Não. Gravação principal é a fonte de verdade; auditoria/notificação best-effort com `console.error`. |
| D16 | Pode haver mais de uma alocação ativa por proposta? | **Não.** Proibido por RF021. |

### 14.2 Com padrão definido (confirmar na Fase 0)

| ID | Decisão | Padrão adotado | Impacto se mudar |
| --- | --- | --- | --- |
| D08 | `responsavel` da etapa é ID ou texto? | Texto livre, `trim`, 1–200 caracteres; sugestão de nomes na UI, sem validação por ID. | Afeta integridade e projeções. |
| D09 | `proximoContato` é obrigatório? | Obrigatório, `YYYY-MM-DD` válido; não precisa ser posterior à `data`. | Afeta formulário e testes. |
| D10 | “Recebimento de solicitação” notifica todos os preferidos? | Notificar todos os `tutoresPreferidos`, sem duplicatas. | Notificações faltantes/excessivas. |
| D12 | Retenção/exportação LGPD. | Sem exclusão automática; documentar política; exportação restrita ao CSV do painel. | Conformidade e operação. |
| D14 | Coordenação é global ou por curso? | Global; consultas, painel, CSV e auditoria cobrem todos os cursos/ciclos. | Escopo de consultas e CSV. |
| D15 | Alocação pode ser confirmada em ciclo `Encerrado`? | Sim; permitir `Publicado`, `Aberto`, `Encerrado`; bloquear `Rascunho`/`Cancelado`. | Pré-condições e testes. |
| D17 | “Alocações confirmadas” no painel = ativas? | Contar `Ativa`; exibir `Encerradas`/`Canceladas` em colunas separadas. | Indicador pode divergir do esperado. |
| D18 | Formato/grão do CSV do painel. | Uma linha por `(curso, ciclo, tutor)`; contagens do ciclo repetidas; colunas da seção 4.13. | Pode exigir outro layout. |
| D19 | Criar etapa/reunião apenas para alocação ativa? | Sim; `Encerrada`/`Cancelada` são somente leitura. | Afeta regra e testes. |
| D20 | Formato de data da reunião e do próximo contato. | Datas de calendário em `YYYY-MM-DD`; timestamps em ISO 8601; filtros inclusivos. | Afeta filtros e exibição. |

---

## 15. Riscos e armadilhas

| Risco | Mitigação |
| --- | --- |
| Implementar regra inventada por falta de detalhe no DRE. | Seguir a seção 14; não declarar requisito atendido sem confirmação. |
| Usar a numeração antiga da Seção 5. | Usar a Seção 3; manter o mapa de correspondência. |
| Usar `ConexaoBD` em mutação nova e perder dados em JSON corrompido. | Usar `lerR03`/`gravarR03`. |
| Confiar em IDs/hidden inputs do cliente. | Recarregar tudo no servidor e validar vínculo pai. |
| Esquecer autorização em rota nova porque o middleware não a cobre. | Chamar `usuarioR03()` e validar perfil em toda página/action. |
| Vazar e-mail/senha em CSV, notificação, auditoria ou log. | Projeções explícitas; testes de não vazamento. |
| Duplicar alocação em chamadas concorrentes. | Bloco síncrono + unicidade + teste `Promise.all`. |
| Quebrar o teste que proíbe RF/RNF em textos visíveis. | Códigos só em comentários/docs/test titles. |
| Alterar `data/*.json` durante testes. | `SGOA_DATA_DIR` temporário e fixtures. |
| Introduzir campo obrigatório e invalidar registros antigos. | Campos novos opcionais; migração aditiva. |
| Usar `next lint`. | Usar `npx tsc --noEmit`. |
| Prometer concorrência multi-processo. | Documentar limitação de processo único. |
| Notificação/auditoria engolir falha silenciosamente. | Política D13: best-effort com `console.error`; teste garante que a operação principal permanece. |
| UI esconder ação, mas action permitir. | Testar a action diretamente, não só a tela. |
| Sidebar fixa quebrar 360 px. | Ajustar layout e testar viewport. |
| Formulário perder dados após erro. | `defaultValue` + estado do formulário + teste. |
| CSV com fórmula injetada. | Reutilizar proteção de `csvSolicitacoes`. |
| Auditoria com dados sensíveis. | `detalhes` mínimo; nunca senha/conteúdo completo. |

---

## 16. Checklist do marco R04

- [ ] Baseline executado e registrado (sem inventar resultados).
- [ ] Decisões D01–D20 com decisão ou padrão registrado em `docs/RELEASE-04-DECISOES.md`.
- [ ] RF021 implementado e testado (permissão, validações, `solicitacaoId`, capacidade global, duplicidade, concorrência).
- [ ] RF022 implementado e testado (motivo, transição, histórico).
- [ ] RF030 implementado e testado (motivo, transição, histórico).
- [ ] RF031 implementado e testado (filtros, ordenação, isolamento, projeção).
- [ ] RF032 implementado e testado (ator, vínculo, campos, datas, situação sem derivação).
- [ ] RF033 implementado e testado (ator, vínculo, campos, datas).
- [ ] RF034 implementado e testado (eventos, destinatários, sem e-mail/SMS); lacuna de “alteração de prazo” registrada como parcial.
- [ ] RF035 implementado e testado (indicadores por ciclo, vagas globais, filtros, agrupamento).
- [ ] RF036 implementado e testado (eventos mínimos, sem edição).
- [ ] RF037 implementado e testado (filtros, ordenação, isolamento).
- [ ] RF038 implementado e testado (filtros, ordenação, acesso indireto).
- [ ] RF039 implementado e testado (somente próprias).
- [ ] RF040 implementado e testado (UTF-8, cabeçalhos, filtros, permissão).
- [ ] RF041 implementado e testado (filtros, ordenação, permissão).
- [ ] RNF001 verificado (pt-BR, `errosCampos` por `name`, `aria-invalid`/`aria-describedby`, preservação).
- [ ] RNF002 verificado (teclado, rótulos, 360–1366 px, sem rolagem horizontal em 360 px).
- [ ] RNF003 verificado (concorrência, atomicidade, rollback).
- [ ] RNF004 documentado e simulado (backup/restauração, RPO).
- [ ] RNF005 medido e documentado (p95, ambiente).
- [ ] RNF006 verificado (hash, autorização, sessão, segredos, HTTPS).
- [ ] RNF007 verificado (minimização, acesso a reuniões, LGPD).
- [ ] RNF008 documentado (navegadores/limitações).
- [ ] RNF009 documentado (LGPD, CSV, decisões).
- [ ] RNF010 documentado (versões, instalação, secrets, homologação).
- [ ] `npx tsc --noEmit` verde.
- [ ] `npm test -- --run --pool=threads --maxWorkers=1` verde.
- [ ] `npm run build` verde.
- [ ] `npm run test:e2e -- --timeout=120000` verde.
- [ ] Diff revisado; `docs/RELEASE-04.md` e `data/auditoria.json` preservados.
- [ ] Relatório final de R04 com evidências e pendências.

---

## 17. Handoff para a próxima sessão

### 17.1 Ordem de leitura

1. `docs/DRE_SGOA_v1.2_requisitos_ordenados.md` (Seção 3 para RF; Seção 4 para RNF).
2. `docs/RELEASE-04.md`.
3. Este plano.
4. `docs/RELEASE-04-DECISOES.md` (já criado; atualizar na Fase 0 com o baseline real).
5. Código existente: `release03-*`, `auditoria.ts`, `notificacoes.ts`, `types/index.ts`, `relatorio-solicitacoes`.

### 17.2 Primeiro comando

```bash
cd projeto-final
npm install
npx tsc --noEmit
npm test -- --run --pool=threads --maxWorkers=1
npm run build
npm run test:e2e -- --timeout=120000
```

Registrar a saída real antes de qualquer alteração.

### 17.3 Modelo de registro de sessão

```text
Sessão: <data>
Objetivo: <fase/requisito>
Arquivos alterados: <lista>
Comandos executados: <comando + resultado>
Requisitos afetados: <RF/RNF>
Decisões tomadas: <ID + contexto>
Pendências: <item + impacto + próximo passo>
Riscos: <item + mitigação>
```

### 17.4 Critério de “OK” para começar a codar

A preparação está OK quando:

1. o baseline foi executado e registrado;
2. todas as decisões D01–D20 têm decisão ou padrão registrado na seção 14;
3. a matriz de rastreabilidade foi aceita como ponto de partida;
4. o escopo está congelado em RF021, RF022, RF030–RF041 e RNF001–RNF010;
5. ninguém pretende alterar `docs/RELEASE-04.md` nem `data/auditoria.json`.

---

## 18. Observações finais

- Este plano não implementa a Release 04; ele organiza a implementação.
- O DRE é a fonte primária. Quando o DRE silencia, a decisão conservadora está registrada e não pode ser alterada sem atualizar o plano e os testes.
- A ausência de banco relacional limita a garantia transacional a escrita atômica por arquivo e processo único. Isso deve ser dito no relatório final, não omitido.
- D03, D07, D11 e D13 estão resolvidas (seção 14.1). Qualquer mudança exige atualizar decisões, plano e testes de forma consistente.
- O maior risco de segurança está em consultas por ID sem validação de vínculo (RF031, RF037, RF038, RF041). Teste acesso negado diretamente nas actions, não apenas na UI.
