---
pkg: "@nocobase/plugin-ai"
---

:::tip{title="Aviso de tradução por IA"}
Este documento foi traduzido por IA. Para informações precisas, consulte a [versão em inglês](/ai-employees/workflow/nodes/llm/chat).
:::

# Diálogo de Texto

## Introdução

O uso do nó LLM do fluxo de trabalho permite iniciar diálogos com serviços de LLM online, aproveitando as capacidades dos grandes modelos para auxiliar na conclusão de uma série de processos de negócio.

![](https://static-docs.nocobase.com/202503041012091.png)

## Novo nó LLM

Como o diálogo com serviços de LLM geralmente é demorado, o nó LLM só pode ser usado em fluxos de trabalho assíncronos.

![](https://static-docs.nocobase.com/202503041013363.png)

## Selecionar modelo

Primeiro, selecione um serviço de LLM já conectado. Se ainda não houver um serviço de LLM conectado, você precisará adicionar uma configuração de serviço de LLM primeiro. Referência: [Gerenciamento de serviço LLM](/ai-employees/features/llm-service)

Após selecionar o serviço, o aplicativo tentará obter a lista de modelos disponíveis do serviço de LLM para escolha. Como as interfaces de obtenção de modelos de alguns serviços de LLM online podem não seguir o protocolo de API padrão, o usuário também pode inserir manualmente o ID do modelo.

![](https://static-docs.nocobase.com/202503041013084.png)

## Configurar parâmetros de chamada

Você pode ajustar os parâmetros de chamada do modelo LLM conforme necessário.

![](https://static-docs.nocobase.com/202503041014778.png)

### Response format

Vale notar a configuração **Response format**, que é usada para indicar o formato do conteúdo da resposta do grande modelo, podendo ser texto ou JSON. Se o modo JSON for selecionado, observe que:

- O modelo LLM correspondente deve suportar chamadas em modo JSON e, ao mesmo tempo, você deve solicitar explicitamente no Prompt que o LLM responda em formato JSON, por exemplo: "Tell me a joke about cats, respond in JSON with \`setup\` and \`punchline\` keys". Caso contrário, pode não haver resultado na resposta, gerando o erro `400 status code (no body)`.
- O resultado da resposta é uma string JSON; você precisará usar as capacidades de outros nós do fluxo de trabalho para analisá-la antes de usar o conteúdo estruturado. Você também pode usar a função de [Saída estruturada](/ai-employees/workflow/nodes/llm/structured-output).

## Mensagens

Um array de mensagens enviadas ao modelo LLM, que pode conter um conjunto de mensagens históricas. As mensagens suportam três tipos:

- System - Geralmente usado para definir o papel e o comportamento que o modelo LLM desempenha no diálogo.
- User - Conteúdo inserido pelo usuário.
- Assistant - Conteúdo da resposta do modelo.

Para mensagens do usuário, desde que o modelo suporte, você pode adicionar vários conteúdos em um único prompt, correspondendo ao parâmetro `content`. Se o modelo utilizado suportar apenas o parâmetro `content` em formato de string (a maioria dos modelos que não suportam diálogos multimodais pertence a esta categoria), divida a mensagem em vários prompts, mantendo apenas um conteúdo em cada prompt; assim, o nó enviará o conteúdo em formato de string.

![](https://static-docs.nocobase.com/202503041016140.png)

Você pode usar variáveis no conteúdo da mensagem para referenciar o contexto do fluxo de trabalho.

![](https://static-docs.nocobase.com/202503041017879.png)

## Usar o conteúdo da resposta do nó LLM

O conteúdo da resposta do nó LLM pode ser usado como variável em outros nós.

![](https://static-docs.nocobase.com/202503041018508.png)