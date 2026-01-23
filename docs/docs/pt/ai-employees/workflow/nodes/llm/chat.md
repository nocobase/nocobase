---
pkg: "@nocobase/plugin-ai"
---
:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::



# Conversa de Texto

## Introdução

Usando o nó LLM em um fluxo de trabalho, você pode iniciar uma conversa com um serviço LLM online, aproveitando as capacidades de grandes modelos para auxiliar na conclusão de uma série de processos de negócios.

![](https://static-docs.nocobase.com/202503041012091.png)

## Criar Nó LLM

Como as conversas com serviços LLM são frequentemente demoradas, o nó LLM só pode ser usado em fluxos de trabalho assíncronos.

![](https://static-docs.nocobase.com/202503041013363.png)

## Selecionar Modelo

Primeiro, selecione um serviço LLM conectado. Se nenhum serviço LLM estiver conectado ainda, você precisará adicionar uma configuração de serviço LLM primeiro. Consulte: [Gerenciamento de Serviço LLM](/ai-employees/quick-start/llm-service)

Após selecionar um serviço, o aplicativo tentará recuperar uma lista de modelos disponíveis do serviço LLM para você escolher. Alguns serviços LLM online podem ter APIs para buscar modelos que não estão em conformidade com os protocolos de API padrão; nesses casos, você também pode inserir manualmente o ID do modelo.

![](https://static-docs.nocobase.com/202503041013084.png)

## Definir Parâmetros de Chamada

Você pode ajustar os parâmetros para chamar o modelo LLM conforme necessário.

![](https://static-docs.nocobase.com/202503041014778.png)

### Response format

É importante notar a configuração de **Response format**. Esta opção é usada para indicar ao modelo grande o formato de sua resposta, que pode ser texto ou JSON. Se você selecionar o modo JSON, esteja ciente do seguinte:

- O modelo LLM correspondente deve suportar ser chamado no modo JSON. Além disso, você precisa instruir explicitamente o LLM a responder no formato JSON no Prompt, por exemplo: "Tell me a joke about cats, respond in JSON with \`setup\` and \`punchline\` keys". Caso contrário, pode não haver resposta, resultando em um erro de \`400 status code (no body)\`.
- A resposta será uma string JSON. Você precisará analisá-la usando as capacidades de outros nós do fluxo de trabalho para usar seu conteúdo estruturado. Você também pode usar o recurso de [Saída Estruturada](/ai-employees/workflow/nodes/llm/structured-output).

## Mensagens

O array de mensagens enviadas ao modelo LLM pode incluir um conjunto de mensagens históricas. As mensagens suportam três tipos:

- System - Geralmente usado para definir o papel e o comportamento do modelo LLM na conversa.
- User - O conteúdo inserido pelo usuário.
- Assistant - O conteúdo respondido pelo modelo.

Para mensagens de usuário, desde que o modelo suporte, você pode adicionar várias partes de conteúdo em um único prompt, correspondendo ao parâmetro `content`. Se o modelo que você está usando suportar apenas o parâmetro `content` como uma string (o que é o caso da maioria dos modelos que não suportam conversas multimodais), divida a mensagem em vários prompts, com cada prompt contendo apenas uma parte do conteúdo. Dessa forma, o nó enviará o conteúdo como uma string.

![](https://static-docs.nocobase.com/202503041016140.png)

Você pode usar variáveis no conteúdo da mensagem para referenciar o contexto do fluxo de trabalho.

![](https://static-docs.nocobase.com/202503041017879.png)

## Usando o Conteúdo da Resposta do Nó LLM

Você pode usar o conteúdo da resposta do nó LLM como uma variável em outros nós.

![](https://static-docs.nocobase.com/202503041018508.png)