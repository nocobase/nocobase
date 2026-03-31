:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Funcionário IA · Guia de Configuração para Administradores

> Este documento vai te ajudar a entender rapidamente como configurar e gerenciar Funcionários IA, guiando você passo a passo por todo o processo, desde os serviços de modelo até a atribuição de tarefas.

## I. Antes de Começar

### 1. Requisitos do Sistema

Antes de configurar, certifique-se de que seu ambiente atende às seguintes condições:

* **NocoBase 2.0 ou superior** esteja instalado
* O **plugin** de **Funcionário IA** esteja habilitado
* Pelo menos um **serviço de Modelo de Linguagem Grande** (LLM) disponível (como OpenAI, Claude, DeepSeek, GLM, etc.)

### 2. Entendendo o Design de Duas Camadas dos Funcionários IA

Os Funcionários IA são divididos em duas camadas: **"Definição de Papel"** e **"Personalização de Tarefas"**.

| Camada | Descrição | Características | Função |
|---|---|---|---|
| **Definição de Papel** | A personalidade básica e as habilidades centrais do funcionário | Estável e imutável, como um "currículo" | Garante a consistência do papel |
| **Personalização de Tarefas** | Configuração para diferentes cenários de negócio | Flexível e ajustável | Adapta-se a tarefas específicas |

**Para simplificar:**

> "Definição de Papel" determina quem é este funcionário,
> "Personalização de Tarefas" determina o que ele está fazendo no momento.

Os benefícios deste design são:

* O papel permanece constante, mas pode lidar com diferentes cenários
* A atualização ou substituição de tarefas não afeta o próprio funcionário
* O contexto e as tarefas são independentes, facilitando a manutenção

## II. Processo de Configuração (em 5 passos)

### Passo 1: Configurar o Serviço de Modelo

O serviço de modelo é como o cérebro de um Funcionário IA e deve ser configurado primeiro.

> 💡 Para instruções detalhadas de configuração, consulte: [Configurar Serviço LLM](/ai-employees/quick-start/llm-service)

**Caminho:**
`Configurações do Sistema → Funcionário IA → Serviço de Modelo`

![Entrar na página de configuração](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-15-40-47.png)

Clique em **Adicionar** e preencha as seguintes informações:

| Item | Descrição | Observações |
|---|---|---|
| Tipo de Interface | Ex: OpenAI, Claude, etc. | Compatível com serviços que usam a mesma especificação |
| Chave de API | A chave fornecida pelo provedor de serviço | Mantenha-a confidencial e troque-a regularmente |
| Endereço do Serviço | API Endpoint | Precisa ser modificado ao usar um proxy |
| Nome do Modelo | Nome específico do modelo (ex: gpt-4, claude-opus) | Afeta as capacidades e o custo |

![Criar um serviço de modelo grande](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-15-45-27.png)

Após a configuração, por favor, **teste a conexão**.
Se falhar, verifique sua rede, chave de API ou nome do modelo.

![Testar conexão](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-18-25.png)

### Passo 2: Criar um Funcionário IA

> 💡 Para instruções detalhadas, consulte: [Criar um Funcionário IA](/ai-employees/quick-start/ai-employees)

Caminho: `Gerenciamento de Funcionários IA → Criar Funcionário`

Preencha as informações básicas:

| Campo | Obrigatório | Exemplo |
|---|---|---|
| Nome | ✓ | viz, dex, cole |
| Apelido | ✓ | Viz, Dex, Cole |
| Status de Habilitação | ✓ | Ativado |
| Biografia | - | "Especialista em Análise de Dados" |
| Prompt Principal | ✓ | Consulte o Guia de Engenharia de Prompts |
| Mensagem de Boas-Vindas | - | "Olá, sou Viz…" |

![Configuração de informações básicas](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-21-09.png)

Em seguida, vincule o **serviço de modelo** que você acabou de configurar.

![Vincular serviço de modelo grande](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-22-27.png)

**Sugestões para Escrever Prompts:**

* Descreva claramente o papel, o tom e as responsabilidades do funcionário
* Use palavras como "deve" e "nunca" para enfatizar as regras
* Inclua exemplos sempre que possível para evitar descrições abstratas
* Mantenha entre 500 e 1000 caracteres

> Quanto mais claro o prompt, mais estável será o desempenho da IA.
> Você pode consultar o [Guia de Engenharia de Prompts](./prompt-engineering-guide.md).

### Passo 3: Configurar Habilidades

As habilidades determinam o que um funcionário "pode fazer".

> 💡 Para instruções detalhadas, consulte: [Habilidades](/ai-employees/advanced/skill)

| Tipo | Escopo da Capacidade | Exemplo | Nível de Risco |
|---|---|---|---|
| Frontend | Interação com a página | Ler dados de bloco, preencher formulários | Baixo |
| **Coleção** | Consulta e análise de dados | Estatísticas agregadas | Médio |
| **Fluxo de trabalho** | Executar processos de negócio | Ferramentas personalizadas | Depende do **fluxo de trabalho** |
| Outros | Extensões externas | Pesquisa na web, operações de arquivo | Varia |

**Sugestões de Configuração:**

* 3 a 5 habilidades por funcionário é o mais adequado
* Não é recomendado selecionar todas as habilidades, pois isso pode causar confusão
* Desative o uso automático (Auto usage) antes de operações importantes

![Configurar habilidades](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-26-06.png)

### Passo 4: Configurar Base de Conhecimento (Opcional)

Se o seu Funcionário IA precisar memorizar ou referenciar uma grande quantidade de material, como manuais de produto, FAQs, etc., você pode configurar uma base de conhecimento.

> 💡 Para instruções detalhadas, consulte:
> - [Visão Geral da Base de Conhecimento de IA](/ai-employees/knowledge-base/index)
> - [Banco de Dados Vetorial](/ai-employees/knowledge-base/vector-database)
> - [Configuração da Base de Conhecimento](/ai-employees/knowledge-base/knowledge-base)
> - [RAG (Geração Aumentada por Recuperação)](/ai-employees/knowledge-base/rag)

Isso requer a instalação adicional do **plugin** de banco de dados vetorial.

![Configurar base de conhecimento](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-32-54.png)

**Cenários Aplicáveis:**

* Para fazer a IA entender o conhecimento da empresa
* Para suportar perguntas e respostas e recuperação de documentos
* Para treinar assistentes específicos de domínio

### Passo 5: Verificar o Resultado

Após a conclusão, você verá o avatar do novo funcionário no canto inferior direito da página.

![Verificar configuração](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-36-54.png)

Por favor, verifique cada item:

* ✅ O ícone é exibido corretamente?
* ✅ É possível realizar uma conversa básica?
* ✅ As habilidades podem ser chamadas corretamente?

Se tudo estiver ok, a configuração foi bem-sucedida 🎉

## III. Configuração de Tarefas: Colocando a IA para Trabalhar

O que fizemos até agora foi "criar um funcionário".
O próximo passo é fazê-los "trabalhar".

As tarefas de IA definem o comportamento do funcionário em uma página ou bloco específico.

> 💡 Para instruções detalhadas, consulte: [Tarefas](/ai-employees/advanced/task)

### 1. Tarefas em Nível de Página

Aplicável a todo o escopo da página, como "Analisar os dados desta página".

**Entrada de Configuração:**
`Configurações da Página → Funcionário IA → Adicionar Tarefa`

| Campo | Descrição | Exemplo |
|---|---|---|
| Título | Nome da tarefa | Análise de Conversão de Estágio |
| Contexto | O contexto da página atual | Página de lista de Leads |
| Mensagem Padrão | Início de conversa predefinido | "Por favor, analise as tendências deste mês" |
| Bloco Padrão | Associar automaticamente a uma **coleção** | tabela de leads |
| Habilidades | Ferramentas disponíveis | Consultar dados, gerar gráficos |

![Configuração de tarefa em nível de página](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-40-34.png)

**Suporte a Múltiplas Tarefas:**
Um único Funcionário IA pode ser configurado com várias tarefas, que são apresentadas como opções para o usuário escolher:

![Suporte a múltiplas tarefas](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-46-00.png)

Sugestões:

* Uma tarefa deve focar em um único objetivo
* O nome deve ser claro e fácil de entender
* Mantenha o número de tarefas entre 5 e 7

### 2. Tarefas em Nível de Bloco

Adequado para operar em um bloco específico, como "Traduzir o formulário atual".

**Método de Configuração:**

1. Abra a configuração de ação do bloco
2. Adicione "Funcionário IA"

![Botão Adicionar Funcionário IA](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-51-06.png)

3. Vincule o funcionário alvo

![Selecionar Funcionário IA](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-52-26.png)

![Configuração de tarefa em nível de bloco](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-53-35.png)

| Comparação | Nível de Página | Nível de Bloco |
|---|---|---|
| Escopo de Dados | Página inteira | Bloco atual |
| Granularidade | Análise global | Processamento detalhado |
| Uso Típico | Análise de tendências | Tradução de formulários, extração de campos |

## IV. Melhores Práticas

### 1. Sugestões de Configuração

| Item | Sugestão | Razão |
|---|---|---|
| Número de Habilidades | 3 a 5 | Alta precisão, resposta rápida |
| Uso automático | Habilitar com cautela | Evita operações acidentais |
| Comprimento do Prompt | 500 a 1000 caracteres | Equilibra velocidade e qualidade |
| Objetivo da Tarefa | Único e claro | Evita confundir a IA |
| **Fluxo de trabalho** | Usar após encapsular tarefas complexas | Maior taxa de sucesso |

### 2. Sugestões Práticas

**Comece pequeno, otimize gradualmente:**

1. Primeiro, crie funcionários básicos (ex: Viz, Dex)
2. Habilite 1 a 2 habilidades essenciais para teste
3. Confirme se as tarefas podem ser executadas normalmente
4. Em seguida, expanda gradualmente com mais habilidades e tarefas

**Processo de otimização contínua:**

1. Faça a versão inicial funcionar
2. Colete feedback dos usuários
3. Otimize os prompts e as configurações de tarefas
4. Teste e itere

## V. Perguntas Frequentes

### 1. Etapa de Configuração

**P: O que fazer se a gravação falhar?**
R: Verifique se todos os campos obrigatórios foram preenchidos, especialmente o serviço de modelo e o prompt.

**P: Qual modelo devo escolher?**

* Relacionado a código → Claude, GPT-4
* Relacionado a análise → Claude, DeepSeek
* Sensível a custo → Qwen, GLM
* Texto longo → Gemini, Claude

### 2. Etapa de Uso

**P: A resposta da IA está muito lenta?**

* Reduza o número de habilidades
* Otimize o prompt
* Verifique a latência do serviço de modelo
* Considere mudar o modelo

**P: A execução da tarefa está imprecisa?**

* O prompt não é claro o suficiente
* Muitas habilidades estão causando confusão
* Divida a tarefa em partes menores, adicione exemplos

**P: Quando o uso automático deve ser habilitado?**

* Pode ser habilitado para tarefas do tipo consulta
* É recomendado desabilitá-lo para tarefas de modificação de dados

**P: Como fazer a IA processar um formulário específico?**

R: Para configurações em nível de página, você precisa selecionar manualmente o bloco.

![Selecionar bloco manualmente](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-17-02-22.png)

Para configurações de tarefas em nível de bloco, o contexto de dados é vinculado automaticamente.

## VI. Leitura Adicional

Para tornar seus Funcionários IA ainda mais poderosos, você pode continuar lendo os seguintes documentos:

**Relacionado à Configuração:**

* [Guia de Engenharia de Prompts](./prompt-engineering-guide.md) - Técnicas e melhores práticas para escrever prompts de alta qualidade
* [Configurar Serviço LLM](/ai-employees/quick-start/llm-service) - Instruções detalhadas de configuração para serviços de modelo grande
* [Criar um Funcionário IA](/ai-employees/quick-start/ai-employees) - Criação e configuração básica de Funcionários IA
* [Colaborar com Funcionário IA](/ai-employees/quick-start/collaborate) - Como ter conversas eficazes com Funcionários IA

**Recursos Avançados:**

* [Habilidades](/ai-employees/advanced/skill) - Entendimento aprofundado da configuração e uso de várias habilidades
* [Tarefas](/ai-employees/advanced/task) - Técnicas avançadas para configuração de tarefas
* [Selecionar Bloco](/ai-employees/advanced/pick-block) - Como especificar blocos de dados para Funcionários IA
* [**Fonte de Dados**](/ai-employees/advanced/datasource) - Configuração e gerenciamento de **fontes de dados**
* [Pesquisa na Web](/ai-employees/advanced/web-search) - Configurando a capacidade de pesquisa na web para Funcionários IA

**Base de Conhecimento e RAG:**

* [Visão Geral da Base de Conhecimento de IA](/ai-employees/knowledge-base/index) - Introdução ao recurso de base de conhecimento
* [Banco de Dados Vetorial](/ai-employees/knowledge-base/vector-database) - Configuração do banco de dados vetorial
* [Base de Conhecimento](/ai-employees/knowledge-base/knowledge-base) - Como criar e gerenciar uma base de conhecimento
* [RAG (Geração Aumentada por Recuperação)](/ai-employees/knowledge-base/rag) - Aplicação da tecnologia RAG

**Integração com **Fluxo de Trabalho****:

* [Nó LLM - Chat de Texto](/ai-employees/workflow/nodes/llm/chat) - Usando chat de texto em **fluxos de trabalho**
* [Nó LLM - Chat Multimodal](/ai-employees/workflow/nodes/llm/multimodal-chat) - Lidando com entradas multimodais como imagens e arquivos
* [Nó LLM - Saída Estruturada](/ai-employees/workflow/nodes/llm/structured-output) - Obtendo respostas de IA estruturadas

## Conclusão

O mais importante ao configurar Funcionários IA é: **faça funcionar primeiro, depois otimize**.
Primeiro, coloque seu primeiro funcionário para trabalhar com sucesso, depois expanda e ajuste gradualmente.

Você pode solucionar problemas na seguinte ordem:

1. O serviço de modelo está conectado?
2. Há muitas habilidades?
3. O prompt é claro?
4. O objetivo da tarefa está bem definido?

Desde que você prossiga passo a passo, poderá construir uma equipe de IA verdadeiramente eficiente.