:::tip{title="Aviso de tradução por IA"}
Este documento foi traduzido por IA. Para informações precisas, consulte a [versão em inglês](/ai-employees/configuration/admin-configuration).
:::

# Funcionário IA · Guia de Configuração do Administrador

> Este documento ajuda você a entender rapidamente como configurar e gerenciar funcionários IA, guiando você passo a passo por todo o processo, desde o serviço de modelo até a entrada em serviço das tarefas.


## I. Antes de Começar

### 1. Requisitos do Sistema

Antes de configurar, certifique-se de que seu ambiente atende às seguintes condições:

* **NocoBase 2.0 ou superior** instalado
* **Plugin de Funcionário IA** habilitado
* Pelo menos um **serviço de modelo de linguagem grande (LLM)** disponível (como OpenAI, Claude, DeepSeek, GLM, etc.)


### 2. Entenda o Design de Duas Camadas do Funcionário IA

Os funcionários IA são divididos em duas camadas: **"Definição de Papel"** e **"Customização de Tarefa"**.

| Camada | Descrição | Características | Função |
| -------- | ------------ | ---------- | ------- |
| **Definição de Papel** | Personalidade básica e capacidades centrais do funcionário | Estável e imutável, como um "currículo" | Garante a consistência do papel |
| **Customização de Tarefa** | Configuração para diferentes cenários de negócio | Flexível e ajustável | Adapta-se a tarefas específicas |

**Entendimento simples:**

> "Definição de Papel" determina quem é este funcionário,
> "Customização de Tarefa" determina o que ele deve fazer no momento.

As vantagens deste design são:

* O papel não muda, mas ele pode ser competente em diferentes cenários
* Atualizar ou substituir tarefas não afeta o funcionário em si
* O contexto e as tarefas são independentes, facilitando a manutenção


## II. Processo de Configuração (5 passos)

### Passo 1: Configurar o Serviço de Modelo

O serviço de modelo equivale ao cérebro do funcionário IA e deve ser configurado primeiro.

> 💡 Para instruções detalhadas de configuração, consulte: [Configurar serviço LLM](/ai-employees/features/llm-service)

**Caminho:**
`Configurações do sistema → Funcionário IA → LLM service`

![Entrar na página de configuração](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-15-40-47.png)

Clique em **Adicionar** e preencha as seguintes informações:

| Item | Descrição | Observações |
| ------ | -------------------------- | --------- |
| Provider | Como OpenAI, Claude, Gemini, Kimi, etc. | Compatível com serviços do mesmo padrão |
| API Key | Chave fornecida pelo provedor | Mantenha em sigilo e troque regularmente |
| Base URL | API Endpoint (opcional) | Modificar ao usar um proxy |
| Enabled Models | Modelos recomendados / Selecionar modelos / Entrada manual | Define o alcance de modelos alternáveis no chat |

![Criar um serviço de modelo grande](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-15-45-27.png)

Após a configuração, use o `Test flight` para **testar a conexão**.
Se falhar, verifique a rede, a chave ou o nome do modelo.

![Testar conexão](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-18-25.png)


### Passo 2: Criar Funcionário IA

> 💡 Para instruções detalhadas, consulte: [Criar Funcionário IA](/ai-employees/features/new-ai-employees)

Caminho: `Gerenciamento de Funcionários IA → Criar funcionário`

Preencha as informações básicas:

| Campo | Obrigatório | Exemplo |
| ----- | -- | -------------- |
| Nome | ✓ | viz, dex, cole |
| Apelido | ✓ | Viz, Dex, Cole |
| Status | ✓ | Ativado |
| Biografia | - | "Especialista em análise de dados" |
| Prompt principal | ✓ | Veja o Guia de Engenharia de Prompt |
| Mensagem de boas-vindas | - | "Olá, eu sou o Viz…" |

![Configuração de informações básicas](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-21-09.png)

A fase de criação do funcionário conclui principalmente a configuração de papel e habilidades. O modelo real utilizado pode ser selecionado no chat através do `Model Switcher`.

**Sugestões para escrita de prompts:**

* Deixe claro o papel, o tom e as responsabilidades do funcionário
* Use palavras como "deve" e "nunca" para enfatizar regras
* Tente incluir exemplos para evitar instruções abstratas
* Controle entre 500 e 1000 caracteres

> Quanto mais claro o prompt, mais estável será o desempenho da IA.
> Você pode consultar o [Guia de Engenharia de Prompt](./prompt-engineering-guide.md).


### Passo 3: Configurar Habilidades

As habilidades determinam o que o funcionário "pode fazer".

> 💡 Para instruções detalhadas, consulte: [Habilidades](/ai-employees/features/tool)

| Tipo | Escopo de Capacidade | Exemplo | Nível de Risco |
| ---- | ------- | --------- | ------ |
| Frontend | Interação com a página | Ler dados do bloco, preencher formulário | Baixo |
| Modelo de dados | Consulta e análise de dados | Estatísticas agregadas | Médio |
| Fluxo de trabalho | Executar processos de negócio | Ferramentas personalizadas | Depende do fluxo de trabalho |
| Outros | Extensões externas | Pesquisa na rede, operações de arquivo | Depende do caso |

**Sugestões de configuração:**

* 3 a 5 habilidades por funcionário é o mais adequado
* Não é recomendado selecionar tudo, para evitar confusão
* Para operações importantes, sugere-se usar a permissão `Ask` em vez de `Allow`

![Configurar habilidades](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-26-06.png)


### Passo 4: Configurar Base de Conhecimento (Opcional)

Se o seu funcionário IA precisar memorizar ou referenciar uma grande quantidade de materiais, como manuais de produtos, FAQs, etc., você pode configurar uma base de conhecimento.

> 💡 Para instruções detalhadas, consulte:
> - [Visão Geral da Base de Conhecimento de IA](/ai-employees/knowledge-base/index)
> - [Banco de Dados Vetorial](/ai-employees/knowledge-base/vector-database)
> - [Configuração da Base de Conhecimento](/ai-employees/knowledge-base/knowledge-base)
> - [RAG (Geração Aumentada por Recuperação)](/ai-employees/knowledge-base/rag)

Isso requer a instalação adicional do plugin de banco de dados vetorial.

![Configurar base de conhecimento](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-32-54.png)

**Cenários aplicáveis:**

* Fazer a IA entender o conhecimento da empresa
* Suportar perguntas, respostas e recuperação de documentos
* Treinar assistentes exclusivos de um domínio


### Passo 5: Verificar o Efeito

Após concluir, você verá o avatar do novo funcionário no canto inferior direito da página.

![Verificar configuração](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-36-54.png)

Verifique item por item:

* ✅ O ícone é exibido normalmente?
* ✅ É possível realizar um diálogo básico?
* ✅ As habilidades podem ser chamadas corretamente?

Se tudo passar, a configuração foi bem-sucedida 🎉


## III. Configuração de Tarefas: Fazendo a IA Trabalhar de Fato

O que foi feito anteriormente foi a "criação do funcionário",
agora é necessário fazê-los "ir trabalhar".

As tarefas de IA definem o comportamento do funcionário em uma página ou bloco específico.

> 💡 Para instruções detalhadas, consulte: [Tarefas](/ai-employees/features/task)


### 1. Tarefas de Nível de Página

Aplicáveis ao escopo de toda a página, como "Analisar os dados desta página".

**Entrada de configuração:**
`Configurações da página → Funcionário IA → Adicionar tarefa`

| Campo | Descrição | Exemplo |
| ---- | -------- | --------- |
| Título | Nome da tarefa | Análise de conversão de estágio |
| Contexto | Contexto da página atual | Página de lista de Leads |
| Mensagem padrão | Diálogo predefinido | "Por favor, analise a tendência deste mês" |
| Bloco padrão | Associa automaticamente a uma coleção | Tabela de leads |
| Habilidades | Ferramentas disponíveis | Consultar dados, gerar gráficos |

![Configuração de tarefa de nível de página](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-40-34.png)

**Suporte a múltiplas tarefas:**
Um mesmo funcionário IA pode ter várias tarefas configuradas, oferecidas como opções para o usuário:

![Suporte a múltiplas tarefas](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-46-00.png)

Sugestões:

* Uma tarefa deve focar em um objetivo
* O nome deve ser claro e fácil de entender
* Controle o número de tarefas entre 5 e 7


### 2. Tarefas de Nível de Bloco

Adequadas para operar em um bloco específico, como "Traduzir o formulário atual".

**Método de configuração:**

1. Abra a configuração de operações do bloco
2. Adicione "Funcionário IA"

![Botão adicionar Funcionário IA](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-51-06.png)

3. Vincule ao funcionário desejado

![Selecionar Funcionário IA](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-52-26.png)

![Configuração de tarefa de nível de bloco](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-53-35.png)

| Item de Comparação | Nível de Página | Nível de Bloco |
| ---- | ---- | --------- |
| Escopo de dados | Página inteira | Bloco atual |
| Granularidade | Análise global | Processamento de detalhes |
| Uso típico | Análise de tendências | Tradução de formulários, extração de campos |


## IV. Melhores Práticas

### 1. Sugestões de Configuração

| Item | Sugestão | Razão |
| ---------- | ----------- | -------- |
| Número de habilidades | 3 a 5 | Alta precisão, resposta rápida |
| Modo de permissão (Ask / Allow) | Sugere-se Ask para modificar dados | Evita operações acidentais |
| Comprimento do prompt | 500 a 1000 caracteres | Equilibra velocidade e qualidade |
| Objetivo da tarefa | Único e claro | Evita confusão da IA |
| Fluxo de trabalho | Usar após encapsular tarefas complexas | Maior taxa de sucesso |


### 2. Sugestões Práticas

**Do pequeno ao grande, otimize gradualmente:**

1. Crie primeiro funcionários básicos (como Viz, Dex)
2. Habilite 1 ou 2 habilidades centrais para teste
3. Confirme se as tarefas podem ser executadas normalmente
4. Então, expanda gradualmente para mais habilidades e tarefas

**Processo de otimização contínua:**

1. Faça a primeira versão rodar
2. Colete feedback de uso
3. Otimize prompts e configurações de tarefas
4. Teste e melhore em ciclos


## V. Perguntas Frequentes

### 1. Fase de Configuração

**P: O que fazer se a gravação falhar?**
R: Verifique se todos os campos obrigatórios foram preenchidos, especialmente o serviço de modelo e o prompt.

**P: Qual modelo escolher?**

* Programação → Claude, GPT-4
* Análise → Claude, DeepSeek
* Sensível a custo → Qwen, GLM
* Texto longo → Gemini, Claude


### 2. Fase de Uso

**P: A resposta da IA está muito lenta?**

* Reduza o número de habilidades
* Otimize o prompt
* Verifique a latência do serviço de modelo
* Considere trocar de modelo

**P: A execução da tarefa não é precisa?**

* O prompt não está claro o suficiente
* Excesso de habilidades causando confusão
* Divida em tarefas menores, adicione exemplos

**P: Quando escolher Ask ou Allow?**

* Tarefas de consulta podem usar `Allow`
* Tarefas de modificação de dados sugerem o uso de `Ask`

**P: Como fazer a IA processar um formulário específico?**

R: Se for uma configuração de nível de página, é necessário selecionar o bloco manualmente.

![Selecionar bloco manualmente](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-17-02-22.png)

Se for uma configuração de tarefa de nível de bloco, o contexto de dados é vinculado automaticamente.


## VI. Leitura Adicional

Para tornar seu funcionário IA mais poderoso, continue lendo os seguintes documentos:

**Relacionados à Configuração:**

* [Guia de Engenharia de Prompt](./prompt-engineering-guide.md) - Técnicas e melhores práticas para escrever prompts de alta qualidade
* [Configurar serviço LLM](/ai-employees/features/llm-service) - Instruções detalhadas de configuração para serviços de modelos grandes
* [Criar Funcionário IA](/ai-employees/features/new-ai-employees) - Criação e configuração básica de funcionários IA
* [Colaborar com Funcionário IA](/ai-employees/features/collaborate) - Como realizar diálogos eficazes com funcionários IA

**Recursos Avançados:**

* [Habilidades](/ai-employees/features/tool) - Entenda profundamente a configuração e o uso de diversos tipos de habilidades
* [Tarefas](/ai-employees/features/task) - Técnicas avançadas de configuração de tarefas
* [Selecionar Bloco](/ai-employees/features/pick-block) - Como designar blocos de dados para funcionários IA
* Fonte de dados - Consulte o documento de configuração de fonte de dados do plugin correspondente
* [Pesquisa na Rede](/ai-employees/features/web-search) - Configure a capacidade de pesquisa na rede para funcionários IA

**Base de Conhecimento e RAG:**

* [Visão Geral da Base de Conhecimento de IA](/ai-employees/knowledge-base/index) - Introdução às funções da base de conhecimento
* [Banco de Dados Vetorial](/ai-employees/knowledge-base/vector-database) - Configuração de bancos de dados vetoriais
* [Base de Conhecimento](/ai-employees/knowledge-base/knowledge-base) - Como criar e gerenciar bases de conhecimento
* [RAG (Geração Aumentada por Recuperação)](/ai-employees/knowledge-base/rag) - Aplicação da tecnologia RAG

**Integração com Fluxo de Trabalho:**

* [Nó LLM - Diálogo de Texto](/ai-employees/workflow/nodes/llm/chat) - Use diálogos de texto em fluxos de trabalho
* [Nó LLM - Diálogo Multimodal](/ai-employees/workflow/nodes/llm/multimodal-chat) - Processe entradas multimodais como imagens e arquivos
* [Nó LLM - Saída Estruturada](/ai-employees/workflow/nodes/llm/structured-output) - Obtenha respostas de IA estruturadas


## 结语 (Conclusão)

O mais importante ao configurar funcionários IA é: **faça rodar primeiro, depois otimize**.
Deixe o primeiro funcionário entrar em serviço com sucesso e, então, expanda e ajuste gradualmente.

A ordem de resolução de problemas pode seguir esta sequência:

1. O serviço de modelo está conectado?
2. O número de habilidades é excessivo?
3. O prompt está claro?
4. O objetivo da tarefa está definido?

Seguindo passo a passo, você poderá construir uma equipe de IA verdadeiramente eficiente.