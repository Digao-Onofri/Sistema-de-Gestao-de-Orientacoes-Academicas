# Release 04 — registro de decisões

> Documento de apoio ao `docs/RELEASE-04-PLANO-EXECUCAO.md`.
> Não substitui o DRE nem o guia de referência. As decisões marcadas como resolvidas são vinculantes para a implementação; as demais têm padrão definido e só mudam com registro explícito.
>
> **Estado:** preparação concluída. D03, D07, D11 e D13 aprovadas em 09/11/2026. Nenhum teste foi executado nesta sessão; o baseline da Fase 0 ainda precisa ser rodado e registrado.

---

## 1. Fontes e escopo

- Fonte primária: `docs/DRE_SGOA_v1.2_requisitos_ordenados.md`.
- Escopo da Release 04: RF021, RF022, RF030–RF041 e RNF001–RNF010.
- Fora do escopo: RF023 (edição de ciclo), RF024–RF029 (já entregues na Release 03), RF020 (já entregue na Release 03) e requisitos inexistentes no DRE.
- `docs/RELEASE-04.md` é referência e não deve ser alterado.

## 2. Numeração do DRE

O DRE tem duas numerações:

- **Seção 3:** RF001–RF041, operações individuais. É a numeração canônica deste plano.
- **Seção 5:** RF001–RF016, matriz antiga e agrupada. Não usar para implementar RF021/RF030–RF041.

Exemplos da divergência:

- Seção 5, RF010 = “Confirmação e alocação de orientação” → Seção 3, RF021.
- Seção 5, RF011 = “Alteração e encerramento de alocações” → Seção 3, RF022 e RF030.
- Seção 5, RF016 = “Histórico e trilha de auditoria” → Seção 3, RF036 e RF041.

**Decisão D01:** usar a Seção 3. Registrar a inconsistência no relatório final. Se o DRE for corrigido, atualizar a matriz de rastreabilidade sem alterar o código.

## 3. Decisões resolvidas

### 3.1 Resolvidas pelo DRE

| ID | Decisão | Resolução |
| --- | --- | --- |
| D02 | Alocação exige solicitação `Aceita`? | Não. O DRE não exige. `solicitacaoId` é vínculo opcional de rastreabilidade. |
| D04 | Quem confirma alocação? | Coordenador. |
| D05 | Quem encerra/cancela alocação? | Coordenador. |
| D06 | Quem cria etapa/reunião? | Tutor da alocação; coordenação e tutorado apenas consultam. |
| D16 | Pode haver mais de uma alocação ativa por proposta? | Não. Proibido por RF021. |

### 3.2 Resolvidas por decisão explícita (09/11/2026)

| ID | Decisão | Regra adotada |
| --- | --- | --- |
| D03 | `limiteOrientandos` ausente/0 e recorte da capacidade. | O limite efetivo é `limiteOrientandos` somente quando for inteiro ≥ 1. Ausente, não inteiro ou ≤ 0 bloqueia a confirmação com a mensagem “Tutor sem limite de orientandos configurado.” Não tratar ausência como ilimitado. A capacidade é contada por **todas** as alocações `Ativa` do tutor, em todos os cursos e ciclos. |
| D07 | Situação da etapa e cálculo de `Atrasada`. | O conjunto é exatamente `Pendente`, `EmAndamento`, `Concluida`, `Atrasada`. O valor é obrigatório e gravado como informado. O sistema **não** deriva `Atrasada` de `prazo` versus data atual e **não** altera a situação automaticamente. |
| D11 | “Alteração de prazo” sem fluxo na Release 03. | Registrar a lacuna na rastreabilidade e no relatório final. **Não** implementar RF023 nem criar fluxo de edição de ciclo publicado. O tipo de notificação `PrazoAlterado` fica reservado e nunca é emitido nesta release. RF034 é registrado como **Parcial — lacuna documentada**, nunca como atendido. |
| D13 | Falha de auditoria/notificação bloqueia a operação? | A gravação principal (alocação/etapa/reunião) é a fonte de verdade. Auditoria e notificação são executadas **após** a gravação bem-sucedida, em modo best-effort: falha é registrada com `console.error` e **não** reverte, não bloqueia e não altera a resposta de sucesso. |

## 4. Decisões com padrão definido (confirmar na Fase 0)

Estas decisões não bloqueiam o início do código: o padrão abaixo é o comportamento a implementar. Qualquer mudança exige atualizar esta tabela, o plano e os testes correspondentes.

| ID | Decisão | Padrão adotado | Impacto se mudar |
| --- | --- | --- | --- |
| D08 | `responsavel` da etapa é ID ou texto? | Texto livre, `trim`, 1–200 caracteres, obrigatório. A UI pode sugerir nomes de participantes, mas o servidor não valida contra IDs. | Afeta validação, integridade e projeções. |
| D09 | `proximoContato` é obrigatório? | Obrigatório, data de calendário `YYYY-MM-DD` válida. Não é exigido que seja posterior à `data` da reunião. | Afeta formulário e testes. |
| D10 | “Recebimento de solicitação” notifica todos os preferidos? | Notificar **todos** os `tutoresPreferidos`, uma notificação por tutor, sem duplicatas. | Notificações faltantes/excessivas. |
| D12 | Retenção/exportação LGPD. | Sem exclusão automática. Registrar proposta de retenção no relatório/LGPD; exportação restrita ao CSV do painel; nenhuma anonimização automática nesta release. | Conformidade e operação. |
| D14 | Coordenação é global ou por curso? | Global: consultas, painel, CSV e auditoria cobrem todos os cursos/ciclos. Registrar limitação no relatório. | Escopo de consultas e CSV. |
| D15 | Alocação pode ser confirmada em ciclo `Encerrado`? | Sim. Permitir `Publicado`, `Aberto` e `Encerrado`; bloquear `Rascunho` e `Cancelado`. Não validar janela de datas. | Pré-condições e testes. |
| D17 | “Alocações confirmadas” no painel = ativas? | Contar `Ativa`; exibir `Encerradas` e `Canceladas` em colunas separadas e rotuladas. | Indicador pode divergir do esperado. |
| D18 | Formato/grão do CSV do painel. | Uma linha por `(curso, ciclo, tutor)`; contagens do ciclo repetidas por linha; linha com tutor vazio quando o ciclo não tiver tutor. Colunas exatas na seção 4.13 do plano. | Pode exigir outro layout. |
| D19 | Criar etapa/reunião apenas para alocação ativa? | Sim; `Encerrada`/`Cancelada` são somente leitura. | Regra e testes. |
| D20 | Formato de data da reunião e do próximo contato. | Datas de calendário (`prazo`, `data`, `proximoContato`) em `YYYY-MM-DD`; timestamps (`dataConfirmacao`, `dataEncerramento`, `dataCancelamento`, `dataHora`) em ISO 8601. Filtros de intervalo incluem os dois limites pela parte de data. | Filtros e exibição. |

## 5. Baseline (preencher na Fase 0)

```bash
cd projeto-final
npm install
npx tsc --noEmit
npm test -- --run --pool=threads --maxWorkers=1
npm run build
npm run test:e2e -- --timeout=120000
```

| Comando | Resultado | Data | Observações |
| --- | --- | --- | --- |
| `npm install` | Sucesso | 09/11/2026 | `added 209 packages`. Warnings EBADENGINE (Node v20.20.2 vs pacotes exigindo Node >=22). Sem vulnerabilidades. |
| `npx tsc --noEmit` | Sucesso (sem saída) | 09/11/2026 | Sem erros de tipo. |
| `npm test -- --run --pool=threads --maxWorkers=1` | Sucesso com erros de worker | 09/11/2026 | 12 arquivos de teste, 167 testes aprovados. 4 erros unhandled do worker threads/undici (Node 20 vs engines). Todos os testes passaram. |
| `npm run build` | Sucesso | 09/11/2026 | Next.js 16.4.3 build concluído. Rotas R03 geradas; sem erros. |
| `npm run test:e2e -- --timeout=120000` | Bloqueado | 09/11/2026 | Playwright browsers não instalados (`npx playwright install` necessário). 20 testes falharam por ausência do executável Chromium. Não foi possível obter resultado de aprovação da suíte E2E neste ambiente. |

## 6. Regras de registro

- Toda mudança de hipótese deve atualizar esta tabela com data, contexto e impacto.
- Nenhum requisito deve ser marcado como atendido sem teste/inspeção registrado.
- Decisões que afetam o DRE devem ser levadas ao responsável do documento antes de virarem código definitivo.
