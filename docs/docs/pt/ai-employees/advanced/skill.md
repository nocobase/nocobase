:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Avançado

## Introdução

Modelos de linguagem grandes (LLMs) populares têm a capacidade de usar ferramentas. O **plugin** de funcionário de IA já vem com algumas ferramentas comuns integradas para que os LLMs possam utilizá-las.

As habilidades configuradas na página de configurações do funcionário de IA são as ferramentas que o modelo de linguagem grande pode usar.

![20251022142348](https://static-docs.nocobase.com/20251022142348.png)

## Configurar Habilidades

Acesse a página de configuração do **plugin** de funcionário de IA, clique na aba `AI employees` para entrar na página de gerenciamento de funcionários de IA.

Selecione o funcionário de IA para o qual você deseja configurar habilidades e clique no botão `Edit` para acessar a página de edição do funcionário de IA.

Na aba `Skills`, clique no botão `Add Skill` para adicionar uma habilidade ao funcionário de IA atual.

![20251022145748](https://static-docs.nocobase.com/20251022145748.png)

## Introdução às Habilidades

### Frontend

O grupo Frontend permite que o funcionário de IA interaja com componentes de frontend.

- A habilidade `Form filler` permite que o funcionário de IA preencha novamente os dados de formulário gerados em um formulário especificado pelo usuário.

![20251022145954](https://static-docs.nocobase.com/20251022145954.png)

### Modelagem de Dados

O grupo de habilidades de Modelagem de Dados concede ao funcionário de IA a capacidade de chamar as APIs internas do NocoBase para realizar a modelagem de dados.

- `Intent Router`: Roteia intenções, determinando se o usuário deseja modificar a estrutura de uma **coleção** ou criar uma nova.
- `Get collection names`: Obtém os nomes de todas as **coleções** existentes no sistema.
- `Get collection metadata`: Obtém as informações de estrutura de uma **coleção** especificada.
- `Define collections`: Permite que o funcionário de IA crie **coleções** no sistema.

![20251022150441](https://static-docs.nocobase.com/20251022150441.png)

### Chamador de Fluxo de Trabalho

O `Workflow caller` concede ao funcionário de IA a capacidade de executar **fluxos de trabalho**. Os **fluxos de trabalho** configurados com `Trigger type` como `AI employee event` no **plugin** de **fluxo de trabalho** estarão disponíveis aqui como habilidades para o funcionário de IA usar.

![20251022153320](https://static-docs.nocobase.com/20251022153320.png)

### Editor de Código

As habilidades do grupo Editor de Código permitem principalmente que o funcionário de IA interaja com o editor de código.

- `Get code snippet list`: Obtém a lista de trechos de código predefinidos.
- `Get code snippet content`: Obtém o conteúdo de um trecho de código especificado.

![20251022153811](https://static-docs.nocobase.com/20251022153811.png)

### Outros

- O `Chart generator` concede ao funcionário de IA a capacidade de gerar gráficos e exibi-los diretamente na conversa.

![20251022154141](https://static-docs.nocobase.com/20251022154141.png)