---
pkg: "@nocobase/plugin-ai"
---

:::tip{title="Aviso de tradução por IA"}
Este documento foi traduzido por IA. Para informações precisas, consulte a [versão em inglês](/ai-employees/index).
:::

# Visão Geral

![clipboard-image-1771905619](https://static-docs.nocobase.com/clipboard-image-1771905619.png)

Funcionários de IA (`AI Employees`) são capacidades de agentes inteligentes profundamente integradas aos sistemas de negócios do NocoBase.

Eles não são apenas robôs que "apenas conversam", mas sim "colegas digitais" que podem entender o contexto diretamente na interface de negócios e executar operações:

- **Entendem o contexto do negócio**: percebem a página atual, blocos, estruturas de dados e conteúdo selecionado.
- **Podem executar ações diretamente**: podem chamar habilidades para concluir tarefas de consulta, análise, preenchimento, configuração, geração, etc.
- **Colaboração baseada em funções**: configure diferentes funcionários de acordo com o cargo e alterne modelos na conversa para colaborar.

## Caminho de 5 minutos para começar

Veja primeiro o [Início Rápido](/ai-employees/quick-start) e complete a configuração mínima na seguinte ordem:

1. Configure pelo menos um [serviço de LLM](/ai-employees/features/llm-service).
2. Ative pelo menos um [Funcionário de IA](/ai-employees/features/enable-ai-employee).
3. Abra uma conversa e comece a [colaborar com os Funcionários de IA](/ai-employees/features/collaborate).
4. Ative a [Pesquisa na Web](/ai-employees/features/web-search) e [Tarefas de Atalho](/ai-employees/features/task) conforme necessário.

## Mapa de Funcionalidades

### A. Configuração Básica (Administrador)

- [Configurar serviço de LLM](/ai-employees/features/llm-service): conecte provedores, configure e gerencie modelos disponíveis.
- [Ativar Funcionários de IA](/ai-employees/features/enable-ai-employee): ative ou desative funcionários integrados e controle o escopo de uso.
- [Novo Funcionário de IA](/ai-employees/features/new-ai-employees): defina funções, persona, mensagem de boas-vindas e limites de capacidade.
- [Usar habilidades](/ai-employees/features/tool): configure permissões de habilidades (`Ask` / `Allow`) para controlar riscos de execução.

### B. Colaboração Diária (Usuários de Negócios)

- [Colaborar com Funcionários de IA](/ai-employees/features/collaborate): alterne entre funcionários e modelos dentro da conversa para colaboração contínua.
- [Adicionar contexto - Blocos](/ai-employees/features/pick-block): envie blocos de página como contexto para a IA.
- [Tarefas de Atalho](/ai-employees/features/task): predefina tarefas comuns em páginas/blocos e execute-as com um clique.
- [Pesquisa na Web](/ai-employees/features/web-search): ative a recuperação de informações atualizadas quando necessário.

### C. Capacidades Avançadas (Extensões)

- [Funcionários de IA integrados](/ai-employees/features/built-in-employee): entenda o posicionamento e os cenários aplicáveis dos funcionários predefinidos.
- [Controle de Permissões](/ai-employees/permission): controle o acesso a funcionários, habilidades e dados de acordo com o modelo de permissões da organização.
- [Base de Conhecimento de IA](/ai-employees/knowledge-base/index): introduza o conhecimento da empresa para melhorar a estabilidade e a rastreabilidade das respostas.
- [Nó de LLM no fluxo de trabalho](/ai-employees/workflow/nodes/llm/chat): orquestre capacidades de IA em fluxos de trabalho automatizados.

## Conceitos Centrais (Recomendado alinhar primeiro)

Os termos a seguir estão alinhados com o glossário; recomenda-se o uso unificado dentro da equipe:

- **Funcionário de IA (AI Employee)**: um agente executável composto por uma persona (Role setting) e habilidades (Tool / Skill).
- **Serviço de LLM (LLM Service)**: unidade de acesso a modelos e configuração de capacidades, usada para gerenciar provedores e listas de modelos.
- **Provedor (Provider)**: o fornecedor do modelo por trás do serviço de LLM.
- **Modelos Ativados (Enabled Models)**: o conjunto de modelos que o serviço de LLM atual permite selecionar na conversa.
- **Seletor de Funcionário de IA (AI Employee Switcher)**: alterna o funcionário colaborador atual dentro da conversa.
- **Seletor de Modelo (Model Switcher)**: alterna o modelo na conversa e memoriza as preferências por funcionário.
- **Habilidade (Tool / Skill)**: unidade de capacidade de execução que a IA pode chamar.
- **Permissão de Habilidade (Permission: Ask / Allow)**: se é necessária confirmação humana antes da chamada da habilidade.
- **Contexto (Context)**: informações do ambiente de negócios, como páginas, blocos e estruturas de dados.
- **Conversa (Chat)**: um processo de interação contínua entre o usuário e o Funcionário de IA.
- **Pesquisa na Web (Web Search)**: capacidade de complementar respostas com informações em tempo real baseada em recuperação externa.
- **Base de Conhecimento (Knowledge Base / RAG)**: introdução de conhecimento empresarial através de geração aumentada por recuperação.
- **Armazenamento Vetorial (Vector Store)**: armazenamento vetorizado que fornece capacidade de busca semântica para a base de conhecimento.

## Instruções de Instalação

Os Funcionários de IA são um plugin integrado do NocoBase (`@nocobase/plugin-ai`), prontos para uso, sem necessidade de instalação separada.