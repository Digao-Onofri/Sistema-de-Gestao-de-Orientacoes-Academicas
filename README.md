# Sistema de Gestão de Orientações Acadêmicas (SGOA)

O **SGOA** é uma aplicação web desenvolvida para centralizar e facilitar o gerenciamento de orientações acadêmicas de **Trabalho de Conclusão de Curso (TCC)** e **Iniciação Científica (IC)**.

A plataforma conecta tutores (docentes e pesquisadores), tutorados (estudantes) e coordenadores, permitindo organizar propostas acadêmicas, gerenciar solicitações de orientação, acompanhar o progresso das atividades e consultar informações administrativas.

## Links do projeto

- **Aplicação online:** [Acesse o sistema](LINK_DA_APLICACAO)
- **Documentação:** [Consulte a documentação do projeto](LINK_DA_DOCUMENTACAO)

## Tecnologias utilizadas

As tecnologias abaixo devem ser preenchidas de acordo com as ferramentas efetivamente utilizadas no desenvolvimento.

- **Frontend:** `Tecnologia utilizada` — interface e interação com os usuários.
- **Backend:** `Tecnologia utilizada` — implementação das regras de negócio e processamento das solicitações.
- **Banco de dados:** `Tecnologia utilizada` — armazenamento e gerenciamento das informações acadêmicas.
- **Ferramentas de desenvolvimento:** `Tecnologias utilizadas` — controle de versão, gerenciamento de dependências e execução do projeto.

## Funcionalidades

- **Gerenciamento de usuários:** autenticação e gerenciamento dos perfis de tutores, tutorados e coordenadores.
- **Estrutura acadêmica:** gerenciamento de unidades acadêmicas, cursos e períodos letivos.
- **Propostas acadêmicas:** cadastro e atualização de propostas de TCC e IC.
- **Ciclos de orientação:** criação, publicação, abertura e encerramento de ciclos.
- **Solicitações de orientação:** consulta de tutores disponíveis, envio de solicitações e análise das propostas.
- **Alocação de orientações:** confirmação e gerenciamento dos vínculos entre tutores e tutorados.
- **Acompanhamento:** registro de etapas, reuniões e próximos passos.
- **Notificações internas:** comunicação de decisões e atualizações relevantes.
- **Relatórios:** consulta de indicadores e exportação de dados em CSV.
- **Auditoria:** histórico de ações administrativas relevantes.

## Como executar o projeto localmente

### Pré-requisitos

Antes de começar, verifique os requisitos definidos para a implementação do projeto, como:

- Git instalado.
- Runtime ou ambiente de execução exigido pela tecnologia utilizada.
- Gerenciador de pacotes correspondente ao projeto.
- Banco de dados configurado, caso necessário.

### Instalação

1. Clone o repositório:

   ```bash
   git clone LINK_DO_REPOSITORIO
   ```

2. Entre na pasta do projeto:

   ```bash
   cd NOME_DA_PASTA
   ```

3. Instale as dependências utilizando o gerenciador de pacotes adotado pelo projeto.

4. Configure as variáveis de ambiente necessárias, conforme o arquivo de exemplo disponibilizado no repositório, como `.env.example`, caso exista.

5. Configure o banco de dados e execute as migrações ou scripts necessários, se aplicável.

6. Inicie o backend e o frontend conforme os comandos definidos para cada parte da aplicação.

7. Acesse a URL local informada no terminal ou na documentação do projeto.

> **Observação:** os comandos específicos de instalação, configuração e execução devem ser atualizados conforme as tecnologias e a estrutura reais do repositório.

## Requisitos e segurança

O projeto considera requisitos de segurança, confiabilidade e usabilidade, incluindo:

- Controle de acesso de acordo com o perfil do usuário.
- Armazenamento seguro de senhas.
- Proteção de dados pessoais, considerando a Lei Geral de Proteção de Dados (LGPD).
- Integridade das alocações de orientação.
- Interface responsiva e em português do Brasil.
- Compatibilidade com navegadores modernos.
- Mecanismos de backup e recuperação de dados.

## Contexto acadêmico

Projeto desenvolvido no contexto da disciplina de **Gerência de Projetos de Software**, do curso de Sistemas de Informação da **Universidade Federal de Itajubá (UNIFEI)**.

Documento de requisitos de referência: **SIS-TUTOR-001 — Sistema de Gerenciamento de Tutores e Tutorados**, versão 1.1, de 23/10/2026.
