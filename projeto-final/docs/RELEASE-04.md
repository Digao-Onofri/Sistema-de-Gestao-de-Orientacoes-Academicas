
# Guia de implementação — Release 04

## Objetivo

Implementar e concluir a Release 04 do Sistema de Gestão de Orientações Acadêmicas, cobrindo alocações, acompanhamento de etapas e reuniões, permissões, governança, testes e rastreabilidade. Use este guia como plano de trabalho no repositório `Sistema-de-Gestao-de-Orientacoes-Academicas` (WSL).

## Regra de partida

Antes de alterar código, inspecione o repositório e leia as instruções locais (`AGENTS.md`, README, documentação de requisitos, decisões e convenções). Identifique arquitetura, stack, comandos reais de validação, padrões já existentes e o estado da Release 04. Não presuma nomes de tabelas, rotas, telas, papéis ou regras de negócio que não estejam documentados. Preserve alterações preexistentes e evite refatorações fora do escopo. Se houver conflito ou lacuna nos requisitos, registre a dúvida/decisão e siga o padrão consistente mais seguro, sem inventar regra funcional.

A captura fornecida resume o escopo, mas corta parte dos títulos e códigos de requisitos. Confirme os códigos e critérios completos nos documentos do próprio repositório antes de fechar cada item. A lista visível é a referência inicial abaixo.

## Escopo funcional

### 1. Alocações e encerramentos

- **Confirmar alocação com verificações [RF021]**: aplicar as verificações e pré-condições documentadas antes de confirmar; impedir transições inválidas e preservar integridade dos vínculos.
- **Consultar alocações com filtros e permissões [RF031]**: disponibilizar filtros previstos e restringir registros/ações conforme autorização do usuário no servidor, além de refletir isso na interface.
- **Encerrar ou cancelar alocações com motivo [RF022/RF030]**: implementar os fluxos e estados definidos, exigir e persistir motivo quando previsto, manter histórico e impedir encerramento/cancelamento incompatível com o estado atual.
- **Testar integridade, capacidade e concorrência [RNF003]**: validar limites de capacidade e consistência em solicitações simultâneas; usar transação/controle de concorrência conforme arquitetura do projeto.

### 2. Etapas e reuniões

- **Incluir etapa e registrar reunião [RF032/RF033]**: criar os registros com campos, vínculos e validações definidos nos requisitos.
- **Consultar etapas e reuniões por permissão [RF037/RF038]**: filtrar dados no servidor de acordo com a política de acesso existente; testar acesso permitido e negado.
- **Validar etapa, responsável, prazo e situação [RF032/RF037]**: garantir relações válidas, campos obrigatórios, datas e transições conforme regras documentadas.
- **Proteger acesso às reuniões e seus vínculos [RF033/RF038]**: validar autorização também ao consultar ou alterar reunião e recursos associados, evitando acesso indireto por identificador.

### 3. Fechamento da release

- **Concluir painel, CSV, notificações e auditoria [RF035–RF041]**: localizar o detalhamento individual destes requisitos; concluir os itens aplicáveis e preservar autorização, consistência e trilha de auditoria em cada fluxo.
- **Testes integrados e verificação dos RNF001–RNF010**: levantar critérios mensuráveis no projeto; executar testes unitários/integrados e verificações não funcionais relevantes, registrando evidências e lacunas.
- **Corrigir defeitos e registrar decisões da Release 04**: corrigir problemas reproduzíveis dentro do escopo, acrescentar testes de regressão e registrar decisões relevantes com contexto e impacto.
- **Documentar testes, LGPD, implantação e rastreabilidade**: registrar dados pessoais tratados, finalidade, acesso, retenção/exportação aplicável e medidas adotadas; documentar implantação/rollback conforme padrão existente; relacionar requisitos a código, testes e evidências.
- **Marco R04 — alocações, acompanhamento e governança**: só declarar concluído quando todos os critérios aplicáveis estiverem implementados, validados e documentados, ou quando pendências estiverem explicitamente justificadas.

## Sequência sugerida

1. **Levantamento** — localizar os textos completos de RF021, RF022, RF030–RF041 e RNF001–RNF010; inspecionar modelos, migrações, serviços, políticas de autorização, interface, APIs e testes atuais. Anotar cobertura existente e lacunas.
2. **Plano rastreável** — montar uma matriz `requisito → comportamento/camada → alteração → teste → evidência`; ordenar por dependências. Confirmar contratos e compatibilidade com dados existentes antes de propor migrações.
3. **Implementação incremental** — completar primeiro regras de domínio e integridade; depois endpoints/serviços e autorização; então interface, filtros, painel, CSV e notificações. Seguir os padrões existentes e manter cada alteração pequena e revisável.
4. **Segurança e dados** — aplicar checagem de permissão no backend em toda operação; validar propriedade/acesso aos objetos relacionados; evitar confiar em IDs enviados pelo cliente; exportar apenas dados autorizados; não incluir dados pessoais em logs desnecessários.
5. **Validação** — executar os comandos documentados no repositório. Cobrir caminhos válidos, validações, limites, transições, papéis/acessos, concorrência e falhas. Testar exportações e notificações sem enviar comunicações reais a destinatários externos durante testes.
6. **Fechamento** — revisar diff, migrações, configurações e documentação; registrar resultados dos testes, decisões, riscos conhecidos e passos de implantação/rollback. Não marcar requisitos como atendidos sem evidência.

## Critérios de aceite

- Cada requisito do escopo tem status e evidência na matriz de rastreabilidade.
- Regras de alocação, capacidade, cancelamento e encerramento são aplicadas no backend e preservam integridade sob concorrência.
- Etapas e reuniões respeitam validações, vínculos e autorização também em acessos indiretos.
- Filtros, painel e CSV não revelam dados além das permissões do solicitante.
- Notificações e auditoria seguem os eventos, conteúdo e limites definidos nos requisitos; ações relevantes deixam registro auditável sem expor segredos/dados excessivos.
- Testes cobrem permissões, casos de borda, erros e regressões; RNF001–RNF010 foram verificados segundo os critérios documentados.
- Documentação de LGPD, implantação, rollback e decisões está atualizada; mudanças de banco são reversíveis ou têm procedimento seguro de recuperação.
- Nenhuma falha conhecida relevante fica oculta: pendências e limitações são descritas com impacto e próximo passo.

## Entrega esperada do OpenCode

Ao concluir, apresente um resumo conciso com:

1. requisitos atendidos e principais arquivos/áreas alterados;
2. migrações ou mudanças de configuração e instruções de implantação/rollback;
3. comandos de teste executados e resultados (sem afirmar testes não executados);
4. matriz de rastreabilidade atualizada ou link/caminho para ela;
5. decisões tomadas, pendências e riscos que ainda impedem o marco R04.

Trabalhe diretamente no repositório WSL indicado pelo usuário, mas não altere arquivos de referência/sincronizados se o projeto os marcar como somente leitura. Não sobrescreva instruções do projeto para fazer este guia prevalecer.
