# Sistema de Gestão de Orientações Acadêmicas (SGOA)

SIS-TUTOR-001 - Sistema de Gerenciamento de Tutores e Tutorados
**DOCUMENTO DE REQUISITOS**

> Versão 1.1 - 23/10/2026

> Projeto acadêmico - Sistemas de Informação | UNIFEI

> Disciplina: Gerência de Projetos de Software

> Documento inicial para revisão da equipe e da docência

## Histórico de revisões

Revisões são melhoramentos na estrutura do documento e também no seu conteúdo. O objetivo primário desta tabela é a fácil identificação da versão do documento. Toda modificação no documento deve constar nesta tabela.

| Data | Versão | Descrição | Autor |
| --- | --- | --- | --- |
| 19/10/2026 | 1.0 | Versão inicial do DRE para revisão | Lucas Barbosa Pena |
| 23/10/2026 | 1.1 | Desdobramento dos requisitos funcionais em operações individuais | Lucas Barbosa Pena |
|  |  |  |  |
|  |  |  |  |

## Histórico de auditorias

As revisões e auditorias deste DRE registram a evolução do conteúdo e as verificações de qualidade realizadas pela equipe e pela docência.

| Data | Versão | Descrição | Autor |
| --- | --- | --- | --- |
| 19/10/2026 | 1.0 | Revisão formal validada | Lucas Barbosa Pena |
|  |  |  |  |
|  |  |  |  |
|  |  |  |  |

## Índice

1. [Introdução](#1-introducao)
2. [Visão geral do produto e serviço](#2-visao-geral-do-produto-e-servico)
3. [Requisitos funcionais](#3-requisitos-funcionais)
   - [Cadastros, perfis e estrutura acadêmica](#31-cadastros-perfis-e-estrutura-academica)
   - [Solicitação, seleção e alocação](#32-solicitacao-selecao-e-alocacao)
   - [Acompanhamento, comunicação e relatórios](#33-acompanhamento-comunicacao-e-relatorios)
4. [Requisitos não funcionais](#4-requisitos-nao-funcionais)
5. [Rastreabilidade](#5-rastreabilidade)
6. [Controle de mudanças nos requisitos](#6-controle-de-mudancas-nos-requisitos)
7. [Referências](#7-referencias)

## 1. Introdução

Este Documento de Requisitos (DRE) delimita o escopo do produto, registra as necessidades atendidas e fornece uma base comum para estimativas de tamanho, esforço, custo e prazo, planejamento das releases, implementação e testes. Destina-se à equipe do projeto, à docência responsável pela disciplina e aos representantes acadêmicos que venham a revisar a proposta.

O produto proposto é o Sistema de Gestão de Orientações Acadêmicas (SGOA), voltado à organização do relacionamento entre tutores e tutorados nos processos de Trabalho de Conclusão de Curso (TCC) e Iniciação Científica (IC). Os requisitos aqui descritos representam uma linha de base inicial, sujeita ao processo de controle de mudanças definido na Seção 6.

As seções seguintes apresentam a visão geral e os limites do produto, os requisitos funcionais e não funcionais, a rastreabilidade inicial e o procedimento para avaliar mudanças no escopo.

Seção 2 - Visão geral do produto: descreve objetivo, escopo, cliente de referência e perfis de usuário.

Seção 3 - Requisitos funcionais: define os serviços e comportamentos que o sistema deverá oferecer, com atores e prioridades.

Seção 4 - Requisitos não funcionais: define critérios de qualidade, segurança, desempenho, distribuição e ambiente.

Seção 5 - Rastreabilidade: relaciona objetivos do produto aos requisitos e às evidências de verificação previstas.

Seção 6 - Mudanças nos requisitos: estabelece como as solicitações serão registradas, avaliadas e aprovadas.

Seção 7 - Referências: lista a legislação e as diretrizes técnicas consideradas na definição inicial.

### 1.1. Convenções, termos e abreviações

Os termos abaixo são utilizados ao longo deste DRE. As regras de negócio institucionais ainda não formalizadas são tratadas como premissas e deverão ser confirmadas antes da implementação definitiva.

Tutor: docente ou pesquisador habilitado a orientar trabalhos acadêmicos. Tutorado: estudante que solicita ou recebe orientação. Coordenador: usuário responsável por administrar ciclos, revisar solicitações e confirmar alocações. Ciclo de orientação: período com regras, vagas e prazos próprios. Alocação: vínculo ativo entre um tutor, um tutorado e um projeto TCC/IC.

#### 1.1.1. Identificação dos requisitos

Cada requisito possui um identificador único e sequencial. Os identificadores permanecem estáveis entre versões para apoiar a rastreabilidade em backlog, casos de teste, releases e status reports.

[RFn] para requisitos funcionais e [RNFn] para requisitos não funcionais.

O identificador de tipo de requisito pode ser:

RF – requisito funcional

RNF – requisito não-funcional

Os identificadores numéricos são sequenciais por tipo e não devem ser reutilizados após a remoção ou substituição de um requisito.

As prioridades adotadas são Essenciais, Importantes e Desejáveis, conforme as definições abaixo.

#### 1.1.2. Prioridades dos requisitos

Para estabelecer a prioridade dos requisitos, foram adotadas as denominações “essencial”, “importante” e “desejável”.

Essencial é o requisito sem o qual o sistema não entra em funcionamento. Requisitos essenciais são requisitos imprescindíveis, que têm que ser implementados impreterivelmente.

Importante é o requisito sem o qual o sistema entra em funcionamento, mas de forma não satisfatória. Requisitos importantes devem ser implementados, mas, se não forem, o sistema poderá ser implantado e usado mesmo assim.

Desejável é o requisito que não compromete as funcionalidades básicas do sistema, isto é, o sistema pode funcionar de forma satisfatória sem ele. Requisitos desejáveis são requisitos que podem ser deixados para versões posteriores do sistema, caso não haja tempo hábil para implementá-los na versão que está sendo especificada.

## 2. Visão geral do produto e serviço

O SGOA será uma aplicação web para centralizar cadastros de tutores e tutorados, organizar ciclos de orientação para TCC e IC, registrar interesses e disponibilidade, receber e avaliar solicitações, confirmar alocações e acompanhar o andamento das orientações. A centralização deve reduzir controles dispersos em planilhas e facilitar a visão da carga de orientação pela coordenação. A arquitetura e a tecnologia de implementação serão definidas pela equipe em artefato técnico próprio.

### 2.1. Abrangência e sistemas relacionados

O escopo desta versão inclui autenticação e perfis, cadastro de estrutura acadêmica básica, ciclos de orientação, disponibilidade e capacidade dos tutores, proposta e solicitação de orientação, análise e alocação pela coordenação, acompanhamento, notificações internas e relatórios administrativos.

Ficam fora do escopo inicial: integração com SIGAA ou outros sistemas acadêmicos, autenticação federada institucional, envio de e-mails/SMS, algoritmo automático de recomendação ou matching, entrega e versionamento de arquivos completos de TCC/IC, avaliação de notas, assinatura eletrônica e gestão financeira. Esses itens dependeriam de regras institucionais, integrações ou esforço adicional e poderiam ser avaliados em releases futuras.

Na primeira versão, o sistema será independente e não dependerá de integrações externas para executar o fluxo principal. O acesso será realizado por navegador web; relatórios poderão ser exportados em CSV. Dados reais de estudantes e docentes não deverão ser usados em testes sem autorização institucional e medidas adequadas de proteção.

### 2.2. Cliente de referência

Cliente de referência: coordenação de curso, departamento ou unidade acadêmica de uma universidade pública brasileira que precise organizar orientações de TCC e IC. A instituição e a unidade requisitante ainda não foram identificadas pelo grupo; portanto, este DRE representa um cenário acadêmico genérico, não uma contratação ou homologação institucional.

### 2.3. Perfis de usuário

O sistema terá três perfis principais. As permissões deverão ser aplicadas tanto na interface quanto nas operações do servidor, de modo que usuários acessem somente as informações necessárias às suas atribuições.

Tutor (docente ou pesquisador)

Consulta solicitações relacionadas aos seus temas de interesse, mantém seu perfil e disponibilidade atualizados, registra decisões e acompanha as orientações que lhe foram alocadas. Não administra usuários nem ciclos institucionais.

Tutorado (estudante)

Consulta tutores e oportunidades disponíveis, mantém os próprios dados, descreve o projeto e envia solicitações dentro dos prazos publicados. Acompanha o status e os próximos passos da orientação.

Coordenador/administrador acadêmico

Gerencia usuários, cursos e ciclos; revisa solicitações, confirma ou encerra alocações e consulta relatórios e trilha de auditoria. Suas ações administrativas devem ser registradas.

## 3. Requisitos funcionais

Os requisitos funcionais abaixo são especificados como operações individuais. Cada requisito possui identificador único, atores, prioridade, dados/validações e regras de negócio. Nas consultas são explicitados filtros, campos retornados, ordenação e agrupamento; decisões institucionais ainda não definidas são registradas como pendências, sem assumir regras não estabelecidas.

### 3.1. Cadastros, perfis e estrutura acadêmica

Este grupo reúne os recursos necessários para controlar o acesso ao sistema e manter os dados básicos para o fluxo de orientação.

#### 3.1.1 [RF001] Autenticar usuário

**Atores:** Tutor, tutorado e coordenador  |  **Prioridade:** Essencial

**Dados e validações:** Identificador/e-mail institucional e senha são os dados de autenticação; ambos devem ser informados.

**Regras de negócio:** Somente contas ativas com credenciais válidas podem entrar. Em falha, exibir mensagem genérica que não revele se o e-mail/identificador está cadastrado.

#### 3.1.2 [RF002] Incluir usuário

**Atores:** Coordenador  |  **Prioridade:** Essencial

**Dados e validações:** Informar e-mail institucional ou identificador único e atribuir um perfil de acesso. Perfil é escolha fechada: Tutor, Tutorado ou Coordenador. A conta deve ter uma situação inicial definida; o estado padrão deverá ser validado pelo grupo antes da implementação.

**Regras de negócio:** Impedir a inclusão quando o identificador/e-mail já estiver associado a outra conta. Os demais atributos básicos da conta ainda não estão enumerados no escopo original e devem ser confirmados antes da implementação.

#### 3.1.3 [RF003] Incluir unidade acadêmica

**Atores:** Coordenador  |  **Prioridade:** Importante

**Dados e validações:** Registrar a denominação da unidade acadêmica. Código ou identificador institucional poderá ser informado se adotado pela unidade; a equipe deverá confirmar esse atributo antes da implementação.

**Regras de negócio:** A denominação é obrigatória. Não há, na versão original, uma regra institucional de unicidade ou outros campos para a unidade; essas regras devem ser confirmadas com a unidade de referência.

#### 3.1.4 [RF004] Alterar perfil do tutor

**Atores:** Tutor; coordenador  |  **Prioridade:** Essencial

**Dados e validações:** Atributos editáveis: apresentação acadêmica, áreas de interesse (lista multivalorada), tipos de orientação aceitos (escolha fechada: TCC e/ou IC), disponibilidade e limite de orientandos ativos (número inteiro).

**Regras de negócio:** Campos necessários ao perfil devem ser validados conforme seus tipos. A capacidade informada será validada novamente na confirmação da alocação; o fluxo não poderá ultrapassar o limite. A regra para reduzir o limite abaixo da quantidade já alocada deve ser confirmada antes da implementação.

#### 3.1.5 [RF005] Incluir proposta acadêmica

**Atores:** Tutorado  |  **Prioridade:** Essencial

**Dados e validações:** Informar título, resumo, palavras-chave (lista multivalorada) e tipo da proposta. Tipo é escolha fechada: TCC ou IC.

**Regras de negócio:** Título, resumo e tipo devem ser informados; o tipo deve corresponder a uma das opções permitidas. A proposta fica associada ao estudante que a incluiu.

#### 3.1.6 [RF006] Encerrar sessão

**Atores:** Tutor, tutorado e coordenador  |  **Prioridade:** Essencial

**Dados e validações:** A operação não exige novos atributos; utiliza a sessão autenticada do próprio usuário.

**Regras de negócio:** Encerrar somente a sessão do usuário solicitante, sem afetar sessões ou contas de outros usuários.

#### 3.1.7 [RF007] Alterar dados de usuário

**Atores:** Coordenador; tutor; tutorado  |  **Prioridade:** Essencial

**Dados e validações:** O coordenador pode alterar os dados da conta e o perfil de acesso. Tutor e tutorado podem alterar somente os campos próprios liberados para seu perfil. A situação ativa/inativa é tratada separadamente em [RF008].

**Regras de negócio:** O identificador/e-mail institucional, quando alterado, deve continuar único. Campos que não estejam liberados para o perfil solicitante não podem ser alterados. A lista exata de campos editáveis por usuários comuns deve ser validada antes da implementação.

#### 3.1.8 [RF008] Alterar situação da conta

**Atores:** Coordenador  |  **Prioridade:** Essencial

**Dados e validações:** Alterar o atributo situação da conta, com escolha fechada: Ativa ou Inativa.

**Regras de negócio:** Uma conta inativa não pode autenticar-se. A operação não exclui a conta nem apaga seus registros históricos.

#### 3.1.9 [RF009] Consultar usuários

**Atores:** Coordenador; tutor e tutorado para consultar os próprios dados  |  **Prioridade:** Importante

**Filtros:** identificador/e-mail institucional, perfil (Tutor, Tutorado ou Coordenador) e situação (Ativa/Inativa). Para tutor e tutorado, a consulta fica restrita à própria conta.

**Campos exibidos:** identificador/e-mail institucional, perfil de acesso e situação da conta. Não exibir outros dados pessoais que não sejam necessários à administração.

**Ordenação:** identificador/e-mail em ordem alfabética crescente. Agrupamento: não há agrupamento.

Regras: somente o coordenador pode consultar a lista de contas de terceiros e aplicar filtros administrativos.

#### 3.1.10 [RF010] Alterar unidade acadêmica

**Atores:** Coordenador  |  **Prioridade:** Importante

**Dados e validações:** Alterar a denominação e os demais atributos institucionais definidos para a unidade. O identificador técnico do registro não pode ser alterado.

**Regras de negócio:** A denominação permanece obrigatória. Código institucional, unicidade e restrições para alterações de unidades já vinculadas a cursos não foram definidos no escopo original e devem ser confirmados antes da implementação.

#### 3.1.11 [RF011] Incluir curso

**Atores:** Coordenador  |  **Prioridade:** Importante

**Dados e validações:** Informar denominação do curso e a unidade acadêmica relacionada. Situação é escolha fechada: Ativo ou Inativo, conforme a regra de oferta já prevista no escopo.

**Regras de negócio:** Denominação e unidade são obrigatórias; a unidade deve existir no cadastro. Um curso inativo não pode ser oferecido em novos ciclos e deve continuar associado ao histórico existente.

#### 3.1.12 [RF012] Alterar curso

**Atores:** Coordenador  |  **Prioridade:** Importante

**Dados e validações:** Permitir alterar denominação, unidade relacionada e situação do curso. O identificador técnico do registro não pode ser alterado.

**Regras de negócio:** A unidade relacionada deve existir. Ao tornar um curso inativo, bloquear sua oferta em novos ciclos sem remover associações históricas. Critérios institucionais de unicidade da denominação devem ser confirmados.

#### 3.1.13 [RF013] Incluir período letivo

**Atores:** Coordenador  |  **Prioridade:** Importante

**Dados e validações:** Registrar a identificação do período letivo que será utilizado em ciclos de orientação. O formato concreto do atributo (por exemplo, código ou descrição do período) deve ser definido pela equipe com a unidade de referência.

**Regras de negócio:** A identificação do período é obrigatória. O formato, a regra de unicidade e os atributos complementares não constam da versão original e devem ser acordados antes da implementação.

#### 3.1.14 [RF014] Alterar período letivo

**Atores:** Coordenador  |  **Prioridade:** Importante

**Dados e validações:** Permitir alterar os atributos definidos para o período letivo. O identificador técnico do registro não pode ser alterado.

**Regras de negócio:** A identificação deve permanecer preenchida. A regra para alteração de períodos já associados a ciclos deve ser definida antes da implementação; a alteração não deve causar perda dos vínculos históricos.

#### 3.1.15 [RF015] Alterar perfil do tutorado

**Atores:** Tutorado  |  **Prioridade:** Essencial

**Dados e validações:** Permitir ao estudante alterar seus próprios dados acadêmicos básicos. Os atributos específicos desses dados não estão enumerados na versão original e devem ser confirmados antes da implementação.

**Regras de negócio:** O estudante só pode alterar os próprios dados e os campos autorizados para seu perfil. Alterações da proposta acadêmica são especificadas separadamente em [RF016].

#### 3.1.16 [RF016] Alterar proposta acadêmica

**Atores:** Tutorado  |  **Prioridade:** Essencial

**Dados e validações:** Permitir alterar título, resumo, palavras-chave (lista multivalorada) e tipo (TCC ou IC). O tipo é escolha fechada. O vínculo com o estudante não pode ser transferido por esta operação.

**Regras de negócio:** A alteração é permitida enquanto os prazos do ciclo aplicável permitirem. A versão usada em uma solicitação já decidida deve ser preservada, sem ser sobrescrita pela edição posterior.

### 3.2. Solicitação, seleção e alocação

Este grupo cobre a publicação de ciclos, descoberta de tutores, registro e avaliação de solicitações e formalização do vínculo de orientação.

#### 3.2.1 [RF017] Incluir ciclo de orientação

**Atores:** Coordenador  |  **Prioridade:** Essencial

**Dados e validações:** Informar curso, período letivo, modalidade (escolha fechada: TCC ou IC), prazos, critérios de elegibilidade e regras para solicitação. A situação do ciclo deve ser controlada pelo fluxo de publicação/abertura/encerramento/cancelamento.

**Regras de negócio:** Curso e período devem referenciar registros existentes. Um ciclo só pode aceitar solicitações quando estiver aberto e dentro do prazo definido.

#### 3.2.2 [RF018] Consultar tutores

**Atores:** Tutorado  |  **Prioridade:** Importante

**Filtros:** curso, modalidade de orientação (TCC/IC), área de interesse e disponibilidade divulgada. Os filtros são obtidos da estrutura acadêmica e dos dados do perfil do tutor; áreas de interesse podem ter múltiplos valores.

**Campos exibidos:** identificador público do tutor, apresentação acadêmica, áreas de interesse, tipos de orientação aceitos e disponibilidade divulgada. Não exibir dados pessoais ou de contato não definidos como públicos.

**Ordenação:** identificador/nome público do tutor em ordem alfabética crescente. Agrupamento: não há agrupamento.

Regras: listar somente tutores ativos. Os filtros podem ser combinados; a ausência de um filtro não deve remover os demais resultados elegíveis.

#### 3.2.3 [RF019] Incluir solicitação de orientação

**Atores:** Tutorado  |  **Prioridade:** Essencial

**Dados e validações:** Selecionar uma proposta própria e informar preferências de tutor conforme as regras do ciclo. A lista de preferências é multivalorada; os tutores selecionados devem existir e estar ativos.

**Regras de negócio:** Aceitar somente solicitações dentro de ciclo aberto e prazo vigente. Validar elegibilidade e campos obrigatórios definidos para o ciclo. Impedir mais de uma solicitação para a mesma proposta no mesmo ciclo.

#### 3.2.4 [RF020] Registrar decisão sobre solicitação

**Atores:** Tutor  |  **Prioridade:** Essencial

**Dados e validações:** Registrar resultado como escolha fechada: Aceitar, Recusar ou Solicitar complementação; armazenar data da decisão e justificativa quando aplicável.

**Regras de negócio:** Somente o tutor relacionado à solicitação pode registrar a decisão. O status atualizado pode ser consultado pelo estudante e pelo coordenador. A aceitação do tutor, isoladamente, não confirma a alocação final.

#### 3.2.5 [RF021] Confirmar alocação de orientação

**Atores:** Coordenador  |  **Prioridade:** Essencial

**Dados e validações:** Confirmar o vínculo entre tutor, tutorado, proposta e ciclo, com data e responsável pela confirmação registrados.

**Regras de negócio:** Antes de gravar, validar tutor e tutorado ativos, ciclo e proposta válidos, capacidade disponível do tutor e ausência de alocação ativa duplicada para a mesma proposta. A confirmação deve preservar a consistência dos dados.

#### 3.2.6 [RF022] Encerrar alocação de orientação

**Atores:** Coordenador  |  **Prioridade:** Importante

**Dados e validações:** Registrar motivo do encerramento, data e responsável pela ação.

**Regras de negócio:** Exigir motivo. O encerramento não pode apagar o histórico de decisões, solicitações ou atividades vinculadas à orientação.

#### 3.2.7 [RF023] Alterar ciclo de orientação

**Atores:** Coordenador  |  **Prioridade:** Importante

**Dados e validações:** Permitir alterar curso, período letivo, modalidade (TCC/IC), prazos, elegibilidade e regras de solicitação. A situação do ciclo é alterada pelas operações de abrir, publicar, encerrar ou cancelar.

**Regras de negócio:** Curso e período devem continuar referenciando registros válidos. A regra para alteração de ciclo já publicado ou aberto não foi definida no escopo original e deve ser aprovada antes da implementação.

#### 3.2.8 [RF024] Abrir ciclo de orientação

**Atores:** Coordenador  |  **Prioridade:** Essencial

**Dados e validações:** Alterar a situação do ciclo para aberto.

**Regras de negócio:** Só permitir a abertura de um ciclo previamente configurado e publicado. O ciclo somente aceita novas solicitações durante o prazo vigente e enquanto estiver aberto. A equipe deve validar o fluxo exato de estados antes da implementação.

#### 3.2.9 [RF025] Publicar ciclo de orientação

**Atores:** Coordenador  |  **Prioridade:** Essencial

**Dados e validações:** Disponibilizar o ciclo configurado aos usuários que podem participar dele.

**Regras de negócio:** O ciclo deve possuir curso/período, modalidade, prazos, elegibilidade e regras para solicitação definidos. A publicação, por si só, não deve permitir solicitações se o ciclo ainda não estiver aberto.

#### 3.2.10 [RF026] Encerrar ciclo de orientação

**Atores:** Coordenador  |  **Prioridade:** Importante

**Dados e validações:** Alterar a situação do ciclo para encerrado.

**Regras de negócio:** Um ciclo encerrado não aceita novas solicitações. Solicitações, decisões e alocações previamente registradas devem permanecer disponíveis no histórico.

#### 3.2.11 [RF027] Cancelar ciclo de orientação

**Atores:** Coordenador  |  **Prioridade:** Importante

**Dados e validações:** Alterar a situação do ciclo para cancelado.

**Regras de negócio:** Um ciclo cancelado não aceita novas solicitações. O cancelamento não deve apagar solicitações, decisões ou alocações históricas relacionadas ao ciclo.

#### 3.2.12 [RF028] Consultar ciclos de orientação

**Atores:** Coordenador e tutorado  |  **Prioridade:** Importante

**Filtros:** curso, período letivo, modalidade (TCC/IC) e situação do ciclo. Os campos de curso e período são seleções relacionadas aos cadastros correspondentes.

**Campos exibidos:** curso, período, modalidade, prazos, critérios de elegibilidade, regras de solicitação e situação do ciclo.

**Ordenação:** data inicial do ciclo em ordem cronológica crescente. Agrupamento: não há agrupamento.

Regras: o coordenador pode consultar os ciclos administrados; o tutorado visualiza os ciclos publicados e pertinentes à sua participação. Apenas ciclos abertos dentro do prazo recebem novas solicitações.

#### 3.2.13 [RF029] Consultar solicitações de orientação

**Atores:** Tutor, tutorado e coordenador  |  **Prioridade:** Essencial

**Filtros:** ciclo, situação da solicitação, tutor, tutorado e proposta. Situação é escolha fechada: pendente, aceita, recusada ou aguardando complementação.

**Campos exibidos:** ciclo, título/resumo/tipo da proposta, palavras-chave, preferências de tutor, data da solicitação, situação e data/justificativa da decisão quando existentes.

**Ordenação:** data de envio em ordem cronológica decrescente. Agrupamento: não há agrupamento.

Regras: o tutor consulta solicitações recebidas; o tutorado consulta apenas as próprias; o coordenador consulta as solicitações sob sua responsabilidade. A visibilidade dos dados deve respeitar o perfil.

#### 3.2.14 [RF030] Cancelar alocação de orientação

**Atores:** Coordenador  |  **Prioridade:** Importante

**Dados e validações:** Registrar motivo do cancelamento, data e responsável pela ação.

**Regras de negócio:** Exigir motivo. O cancelamento não pode apagar o histórico de decisões, solicitações ou atividades vinculadas à orientação anterior.

#### 3.2.15 [RF031] Consultar alocações de orientação

**Atores:** Tutor, tutorado e coordenador  |  **Prioridade:** Importante

**Filtros:** curso, ciclo, tutor, tutorado e situação da alocação (ativa, encerrada ou cancelada).

**Campos exibidos:** tutor, tutorado, título/tipo da proposta, curso, ciclo, situação, data da confirmação e motivo/data de encerramento ou cancelamento quando houver.

**Ordenação:** data da confirmação em ordem cronológica decrescente. Agrupamento: não há agrupamento.

Regras: tutor e tutorado consultam apenas alocações das quais participam; o coordenador consulta as alocações sob sua responsabilidade.

### 3.3. Acompanhamento, comunicação e relatórios

Este grupo reúne o acompanhamento das orientações, os registros de comunicação, as notificações e as consultas gerenciais e de auditoria.

#### 3.3.1 [RF032] Incluir etapa de acompanhamento

**Atores:** Tutor  |  **Prioridade:** Importante

**Dados e validações:** Informar descrição, responsável, prazo e situação da etapa. A situação é um atributo de escolha fechada cujos valores devem ser definidos pela equipe antes da implementação.

**Regras de negócio:** A etapa deve estar vinculada a uma orientação válida. Os registros não representam submissão, armazenamento ou correção de arquivos completos de TCC/IC.

#### 3.3.2 [RF033] Incluir registro de reunião

**Atores:** Tutor  |  **Prioridade:** Importante

**Dados e validações:** Registrar data, resumo objetivo, encaminhamentos e data prevista para o próximo contato.

**Regras de negócio:** O registro deve estar vinculado à orientação pertinente. Seu conteúdo só pode ser acessado pelas pessoas vinculadas à orientação e por coordenadores autorizados.

#### 3.3.3 [RF034] Gerar notificações internas

**Atores:** Sistema  |  **Prioridade:** Importante

**Dados e validações:** Gerar uma notificação associada ao usuário destinatário e ao evento relevante, com tipo do evento e instante do registro.

**Regras de negócio:** Eventos mínimos: recebimento de solicitação, decisão do tutor, confirmação/encerramento/cancelamento de alocação e alteração de prazo. Nesta versão, não enviar notificações por e-mail ou SMS.

#### 3.3.4 [RF035] Consultar painel gerencial

**Atores:** Coordenador  |  **Prioridade:** Importante

**Filtros:** curso e ciclo de orientação.

**Indicadores exibidos:** solicitações por situação, alocações confirmadas, quantidade de orientandos por tutor e vagas disponíveis.

**Ordenação:** curso e, dentro dele, ciclo em ordem alfabética/crescente de identificação. Agrupamento: por curso e ciclo, pois os indicadores são apresentados por essas dimensões.

Regras: exibir apenas dados autorizados para a coordenação; não incluir dados pessoais que não sejam necessários aos indicadores.

#### 3.3.5 [RF036] Registrar eventos na trilha de auditoria

**Atores:** Sistema  |  **Prioridade:** Importante

**Dados e validações:** Registrar, no mínimo, data/hora, usuário responsável, entidade afetada e tipo de ação.

**Regras de negócio:** Registrar alterações relevantes em contas, ciclos, solicitações, decisões e alocações. Usuários comuns não podem editar os registros de auditoria.

#### 3.3.6 [RF037] Consultar etapas de acompanhamento

**Atores:** Tutor, tutorado e coordenador  |  **Prioridade:** Importante

**Filtros:** orientação/proposta, responsável e situação da etapa.

**Campos exibidos:** descrição, responsável, prazo e situação.

**Ordenação:** prazo em ordem cronológica crescente. Agrupamento: não há agrupamento.

Regras: cada perfil consulta somente etapas de orientações às quais tem acesso; a coordenação segue as permissões administrativas autorizadas.

#### 3.3.7 [RF038] Consultar registros de reunião

**Atores:** Tutor, tutorado vinculado e coordenador autorizado  |  **Prioridade:** Importante

**Filtros:** orientação e intervalo de datas da reunião.

**Campos exibidos:** data, resumo objetivo, encaminhamentos e data prevista para o próximo contato.

**Ordenação:** data da reunião em ordem cronológica decrescente. Agrupamento: não há agrupamento.

Regras: restringir os resultados às pessoas vinculadas à orientação e aos coordenadores autorizados; não expor registros de outras orientações.

#### 3.3.8 [RF039] Consultar notificações internas

**Atores:** Tutor, tutorado e coordenador  |  **Prioridade:** Importante

**Filtros:** tipo de evento e intervalo de datas.

**Campos exibidos:** tipo da notificação, data/hora do evento e referência da ação relacionada quando disponível.

**Ordenação:** data/hora em ordem cronológica decrescente. Agrupamento: não há agrupamento.

Regras: cada usuário consulta somente suas notificações; as notificações não substituem os avisos formais definidos pela instituição.

#### 3.3.9 [RF040] Exportar relatórios gerenciais

**Atores:** Coordenador  |  **Prioridade:** Importante

**Dados e validações:** Exportar em CSV codificado em UTF-8, com cabeçalhos claros e campos correspondentes aos indicadores e filtros do painel gerencial.

**Regras de negócio:** Respeitar os filtros aplicados por curso e ciclo, manter a ordenação/agrupamento do painel e excluir dados pessoais desnecessários. A exportação não pode ampliar as permissões de acesso aos dados.

#### 3.3.10 [RF041] Consultar trilha de auditoria

**Atores:** Coordenador autorizado  |  **Prioridade:** Importante

**Filtros:** intervalo de data/hora, usuário responsável, entidade afetada e tipo de ação.

**Campos exibidos:** data/hora, usuário responsável, entidade afetada e tipo de ação.

**Ordenação:** data/hora em ordem cronológica decrescente. Agrupamento: não há agrupamento.

Regras: somente coordenadores autorizados podem consultar o histórico; usuários comuns não podem alterar registros nem consultar ações fora de sua autorização.

## 4. Requisitos não funcionais

Os requisitos não funcionais estabelecem condições de qualidade e restrições que poderão ser verificadas por inspeção, testes ou revisão técnica. Metas de desempenho são critérios iniciais para o protótipo e devem ser reavaliadas quando o ambiente de implantação for definido.

### 4.1. Usabilidade

Os requisitos de usabilidade definem idioma, consistência e acessibilidade das principais jornadas.

#### 4.1.1 [RNF001] Idioma e consistência da interface

Toda a interface e as mensagens de validação devem estar em português do Brasil. Formulários devem identificar campos obrigatórios, informar erros junto ao campo correspondente e preservar os dados já preenchidos quando uma validação falhar.

**Verificação:** Inspeção das telas e teste dos fluxos de cadastro, solicitação e decisão  |  **Prioridade:** Essencial

#### 4.1.2 [RNF002] Acessibilidade e adaptação a telas

As principais jornadas (login, cadastro/edição de perfil, consulta de tutores, envio de solicitação e decisão) devem ser utilizáveis por teclado, possuir rótulos acessíveis e manter conteúdo sem perda funcional em larguras de 360 px a 1366 px. A avaliação deverá adotar WCAG 2.2 nível AA como referência de projeto, sem declarar conformidade formal sem auditoria completa.

**Verificação:** Teste manual por teclado, leitor de tela e visualizações em 360 px/1366 px  |  **Prioridade:** Importante

### 4.2. Confiabilidade

Os requisitos de confiabilidade tratam de integridade transacional, prevenção de inconsistências e recuperação dos dados.

#### 4.2.1 [RNF003] Integridade das alocações

A confirmação de alocação deve ocorrer em operação transacional. Em tentativas concorrentes, o sistema não pode ultrapassar a capacidade registrada do tutor nem criar duas alocações ativas para a mesma proposta. Falhas de gravação devem deixar os dados em estado consistente.

**Verificação:** Testes automatizados de regras, concorrência e rollback  |  **Prioridade:** Essencial

#### 4.2.2 [RNF004] Cópia de segurança e recuperação

No ambiente implantado, os dados persistidos devem ter cópia de segurança pelo menos diária. O procedimento de restauração deve ser documentado e testado antes da entrega final; a perda máxima de dados entre cópias consecutivas não deve superar 24 horas no cenário de referência.

**Verificação:** Verificação do procedimento e simulação de restauração no ambiente de teste  |  **Prioridade:** Importante

### 4.3. Desempenho

Os requisitos de desempenho estabelecem tempos-alvo para operações comuns em ambiente de teste documentado.

#### 4.3.1 [RNF005] Tempo de resposta

No ambiente de teste documentado, com base sintética de até 10.000 usuários e 20.000 registros de orientação e até 50 sessões simultâneas, pelo menos 95% das consultas e operações comuns devem responder em até 3 segundos; relatórios gerenciais devem responder em até 8 segundos.

**Verificação:** Teste de carga e medição de percentis de resposta; registrar ambiente e resultados  |  **Prioridade:** Importante

### 4.4. Segurança

Os requisitos de segurança estabelecem autenticação, autorização e proteção de dados durante o uso e a operação.

#### 4.4.1 [RNF006] Autenticação, autorização e segredos

Senhas não devem ser armazenadas em texto puro; o sistema deve utilizar um mecanismo de hash de senhas apropriado. As permissões devem ser verificadas no servidor em cada operação protegida; as sessões devem poder ser encerradas e segredos de execução não podem ser versionados no repositório. Em implantação, o tráfego deve usar HTTPS.

**Verificação:** Revisão do código/configuração e testes negativos de acesso entre perfis  |  **Prioridade:** Essencial

#### 4.4.2 [RNF007] Privacidade e minimização de dados

O sistema deve coletar apenas dados necessários ao fluxo de orientação, limitar o acesso a registros de reuniões e manter mecanismos de consulta, correção e desativação de dados conforme perfil autorizado. Antes do uso real, a instituição deverá validar a finalidade, a base legal, a retenção e o procedimento para atendimento aos titulares.

**Verificação:** Inspeção de campos, matriz de permissões e teste de acesso/alteração por perfil  |  **Prioridade:** Essencial

### 4.5. Distribuição

Os requisitos de distribuição tratam do acesso e da disponibilização da aplicação para os usuários finais.

#### 4.5.1 [RNF008] Acesso e distribuição web

O produto deve ser disponibilizado como aplicação web, sem exigir instalação de software específico no computador do usuário. As jornadas principais devem funcionar nas duas versões estáveis mais recentes de Chrome, Edge e Firefox disponíveis na data de homologação.

**Verificação:** Teste exploratório nos navegadores-alvo e verificação de instalação/acesso  |  **Prioridade:** Importante

### 4.6. Padrões

Os requisitos desta seção estabelecem referências de proteção de dados e padronização técnica/documental.

#### 4.6.1 [RNF009] Referências normativas e documentação

A solução deve observar os princípios aplicáveis da Lei nº 13.709/2018 (LGPD) na modelagem dos dados pessoais. Os formatos de exportação CSV devem usar UTF-8 e cabeçalhos estáveis; a equipe deve documentar as decisões de segurança, retenção, estrutura de campos e limitações conhecidas.

**Verificação:** Revisão da documentação e dos arquivos CSV; checklist LGPD com ressalvas institucionais  |  **Prioridade:** Essencial

### 4.7. Hardware e software

Os requisitos de ambiente definem compatibilidade e condições mínimas para executar e manter o sistema.

#### 4.7.1 [RNF010] Ambiente e reprodutibilidade

O repositório deve declarar as versões de runtime, dependências e banco de dados adotadas, fornecer instruções para configurar e iniciar o sistema em ambiente de desenvolvimento e separar configurações locais/secrets do código versionado. O ambiente de homologação deve ter seus requisitos mínimos documentados antes da entrega.

**Verificação:** Seguir o guia de instalação em ambiente limpo e revisar arquivos versionados  |  **Prioridade:** Importante

## 5. Rastreabilidade

A matriz abaixo é uma linha de base inicial da rastreabilidade entre necessidades do produto, requisitos e evidências de verificação. Ela deverá ser mantida junto ao backlog e atualizada a cada mudança aprovada.

| Código do Requisito | Nome do Requisito | Tipo | Prioridade | Objetivo / Necessidade do Negócio | Requisitos Relacionados | Método / Evidência de Verificação |
| --- | --- | --- | --- | --- | --- | --- |
| RF001 | Autenticação e encerramento de sessão | Funcional | Essencial | Controlar identidade, perfis e dados acadêmicos | RNF006, RNF007 | Testes de autenticação, encerramento e validação de mensagens de erro sem vazamento de dados. |
| RF002 | Gestão de usuários e perfis de acesso | Funcional | Essencial | Controlar identidade, perfis e dados acadêmicos | RF001, RNF006, RNF007 | Teste de permissões de perfil (CRUD de contas e restrições por perfil). |
| RF003 | Cadastro de unidades e cursos | Funcional | Importante | Controlar identidade, perfis e dados acadêmicos | RF006 | Teste de cadastro/edição de estrutura acadêmica e verificação de inativação sem perda de histórico. |
| RF004 | Perfil, áreas de interesse e capacidade do tutor | Funcional | Essencial | Organizar ciclos, solicitações e alocações | RF007, RF010 | Teste de alteração de perfil do tutor e validação do limite de orientandos na alocação. |
| RF005 | Perfil do tutorado e proposta acadêmica | Funcional | Essencial | Organizar ciclos, solicitações e alocações | RF008, RF010 | Teste de cadastro/edição de proposta e verificação do versionamento em solicitações decididas. |
| RF006 | Configuração e publicação de ciclos de orientação | Funcional | Essencial | Organizar ciclos, solicitações e alocações | RF003, RF008 | Teste de gerenciamento do ciclo (abertura/fechamento/prazos) e bloqueio de solicitações fora do prazo. |
| RF007 | Consulta e pesquisa de tutores | Funcional | Importante | Organizar ciclos, solicitações e alocações | RF004, RNF007 | Testes de pesquisa com filtros (curso, modalidade, área) e verificação de não exposição de dados privados. |
| RF008 | Solicitação de orientação | Funcional | Essencial | Organizar ciclos, solicitações e alocações | RF005, RF006 | Teste de validação de envio de solicitação, campos obrigatórios, regras de elegibilidade e duplicidade. |
| RF009 | Análise de solicitações pelo tutor | Funcional | Essencial | Organizar ciclos, solicitações e alocações | RF008, RF010 | Teste do fluxo de decisão do tutor (aceitar/recusar/complementar) e registro de justificativa. |
| RF010 | Confirmação e alocação de orientação | Funcional | Essencial | Organizar ciclos, solicitações e alocações | RF004, RF005, RF009, RNF003 | Testes automatizados de confirmação, validação de capacidade máxima e prevenção de vínculos duplicados. |
| RF011 | Alteração e encerramento de alocações | Funcional | Importante | Organizar ciclos, solicitações e alocações | RF010 | Teste de cancelamento/encerramento com exigência de motivo e verificação da preservação do histórico. |
| RF012 | Acompanhamento de etapas e situação do projeto | Funcional | Importante | Acompanhar o andamento e comunicar eventos | RF010 | Teste de acompanhamento de etapas e validação de visibilidade conforme perfil de acesso. |
| RF013 | Registro de reuniões e próximos passos | Funcional | Importante | Acompanhar o andamento e comunicar eventos | RF010, RNF007 | Teste de criação e restrição de acesso a atas/registros de reuniões aos envolvidos autorizados. |
| RF014 | Notificações internas de eventos | Funcional | Importante | Acompanhar o andamento e comunicar eventos | RF008, RF009, RF010 | Teste de disparo e consulta do painel de notificações internas para eventos do sistema. |
| RF015 | Painel gerencial e exportação de relatórios | Funcional | Importante | Oferecer visão gerencial e rastrear alterações | RNF005, RNF009 | Conferência dos indicadores do painel e validação de arquivo CSV exportado (UTF-8 e sem dados sensíveis). |
| RF016 | Histórico e trilha de auditoria | Funcional | Importante | Oferecer visão gerencial e rastrear alterações | RF002, RF010 | Testes de integridade e imutabilidade dos logs de ações relevantes do sistema. |
| RNF001 | Idioma e consistência da interface | Não Funcional | Essencial | Usabilidade | RF001–RF015 | Inspeção das telas em pt-BR e teste de preservação de dados preenchidos ao ocorrerem erros de formulário. |
| RNF002 | Acessibilidade e adaptação a telas | Não Funcional | Importante | Usabilidade | RF001, RF005, RF007, RF008, RF009 | Teste manual de navegação por teclado, leitor de tela e responsividade entre 360 px e 1366 px (WCAG 2.2 AA). |
| RNF003 | Integridade das alocações | Não Funcional | Essencial | Confiabilidade | RF004, RF010 | Testes automatizados de concorrência, consistência transacional e rollback em falhas de gravação. |
| RNF004 | Cópia de segurança e recuperação | Não Funcional | Importante | Confiabilidade | Todos os Requisitos Funcionais | Verificação de rotina de backup e teste de restauração de banco de dados (RPO < 24h). |
| RNF005 | Tempo de resposta | Não Funcional | Importante | Desempenho | RF007, RF008, RF015 | Teste de carga com base sintética (10k usuários, 50 sessões simultâneas) medindo percentis de resposta. |
| RNF006 | Autenticação, autorização e segredos | Não Funcional | Essencial | Segurança | RF001, RF002 | Revisão de código (hash de senha, ausência de segredos no git) e testes de acesso não autorizado por perfil. |
| RNF007 | Privacidade e minimização de dados | Não Funcional | Essencial | Segurança / Padrões (LGPD) | RF002, RF007, RF013 | Inspeção de campos coletados, matriz de permissões de acesso e validação de privacidade por perfil. |
| RNF008 | Acesso e distribuição web | Não Funcional | Importante | Distribuição | Todos os Requisitos Funcionais | Teste cross-browser exploratório nas versões recentes de Chrome, Edge e Firefox sem plugins necessários. |
| RNF009 | Referências normativas e documentação | Não Funcional | Essencial | Padrões (LGPD e CSV) | RF015, RNF007 | Checklist de conformidade LGPD e verificação da codificação UTF-8 dos arquivos exportados em CSV. |
| RNF010 | Ambiente e reprodutibilidade | Não Funcional | Importante | Hardware e Software | - | Execução do guia de instalação em ambiente limpo e verificação de separação de segredos do repositório. |

Os identificadores deste quadro devem ser reutilizados no planejamento das releases, nos casos de teste e nos relatórios de acompanhamento. A matriz não substitui os critérios detalhados de teste que serão elaborados durante o desenvolvimento.

## 6. Controle de mudanças nos requisitos

Qualquer mudança em relação ao escopo desta versão deve ser registrada antes da implementação. O objetivo é avaliar o impacto da solicitação sobre o produto e sobre a linha de base de escopo, esforço, custo, cronograma, qualidade e riscos.

A solicitação deve ser registrada pelo integrante solicitante no repositório de acompanhamento do projeto, com motivação, requisito afetado, comportamento esperado e prioridade proposta.

O gerente do projeto ou responsável designado deve analisar a viabilidade e os impactos, consultando os responsáveis técnicos quando necessário. A análise deve indicar esforço estimado, dependências, riscos e efeito nas entregas.

A mudança só será aprovada após decisão documentada da equipe e, quando afetar a definição acadêmica do trabalho, validação da docência ou do representante do cliente de referência.

Mudanças aprovadas devem atualizar este DRE, a matriz de rastreabilidade, o backlog, as estimativas e o cronograma. Se houver linha de base de desempenho aprovada, seu ajuste deve ser explícito e não deve apagar a diferença entre planejado e realizado nos status reports.

A equipe deve iniciar a implementação somente após aprovação e priorização da mudança. Solicitações rejeitadas ou adiadas também devem permanecer registradas, com justificativa.

## 7. Referências

Referências consideradas para a definição inicial dos requisitos:

BRASIL. Lei nº 13.709, de 14 de agosto de 2018. Lei Geral de Proteção de Dados Pessoais (LGPD). Disponível em: https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm. Acesso em: 19 out. 2026.

W3C. Web Content Accessibility Guidelines (WCAG) 2.2. Recomendação W3C, 12 dez. 2024. Disponível em: https://www.w3.org/TR/WCAG22/. Acesso em: 19 out. 2026.

UNIFEI. Template “Documento de Requisitos” disponibilizado para a atividade da disciplina de Gerência de Projetos de Software. Material didático da disciplina, sem data informada.
