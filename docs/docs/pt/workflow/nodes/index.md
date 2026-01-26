:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Visão Geral

Um **fluxo de trabalho** geralmente é composto por várias etapas operacionais conectadas. Cada nó representa uma dessas etapas e serve como uma unidade lógica básica no processo. Assim como em uma linguagem de programação, diferentes tipos de nós representam diferentes instruções, que determinam o comportamento do nó. Quando o **fluxo de trabalho** é executado, o sistema entra em cada nó sequencialmente e executa suas instruções.

:::info{title=Dica}
O gatilho de um **fluxo de trabalho** não é um nó. Ele é exibido apenas como um ponto de entrada no fluxograma, mas é um conceito diferente de um nó. Para mais detalhes, consulte o conteúdo sobre [Gatilhos](../triggers/index.md).
:::

Do ponto de vista funcional, os nós atualmente implementados podem ser divididos em várias categorias principais (totalizando 29 tipos de nós):

- Inteligência Artificial
  - [Grande Modelo de Linguagem](../../ai-employees/workflow/nodes/llm/chat.md) (fornecido pelo **plugin** @nocobase/plugin-workflow-llm)
- Controle de Fluxo
  - [Condição](./condition.md)
  - [Múltiplas Condições](./multi-conditions.md)
  - [Loop](./loop.md) (fornecido pelo **plugin** @nocobase/plugin-workflow-loop)
  - [Variável](./variable.md) (fornecido pelo **plugin** @nocobase/plugin-workflow-variable)
  - [Ramificação Paralela](./parallel.md) (fornecido pelo **plugin** @nocobase/plugin-workflow-parallel)
  - [Invocar Fluxo de Trabalho](./subflow.md) (fornecido pelo **plugin** @nocobase/plugin-workflow-subflow)
  - [Saída do Fluxo de Trabalho](./output.md) (fornecido pelo **plugin** @nocobase/plugin-workflow-subflow)
  - [Mapeamento de Variáveis JSON](./json-variable-mapping.md) (fornecido pelo **plugin** @nocobase/plugin-workflow-json-variable-mapping)
  - [Atraso](./delay.md) (fornecido pelo **plugin** @nocobase/plugin-workflow-delay)
  - [Finalizar Fluxo de Trabalho](./end.md)
- Cálculo
  - [Cálculo](./calculation.md)
  - [Cálculo de Data](./date-calculation.md) (fornecido pelo **plugin** @nocobase/plugin-workflow-date-calculation)
  - [Cálculo JSON](./json-query.md) (fornecido pelo **plugin** @nocobase/plugin-workflow-json-query)
- Ações de **Coleção**
  - [Criar Dados](./create.md)
  - [Atualizar Dados](./update.md)
  - [Excluir Dados](./destroy.md)
  - [Consultar Dados](./query.md)
  - [Consulta Agregada](./aggregate.md) (fornecido pelo **plugin** @nocobase/plugin-workflow-aggregate)
  - [Ação SQL](./sql.md) (fornecido pelo **plugin** @nocobase/plugin-workflow-sql)
- Tratamento Manual
  - [Tratamento Manual](./manual.md) (fornecido pelo **plugin** @nocobase/plugin-workflow-manual)
  - [Aprovação](./approval.md) (fornecido pelo **plugin** @nocobase/plugin-workflow-approval)
  - [CC](./cc.md) (fornecido pelo **plugin** @nocobase/plugin-workflow-cc)
- Outras Extensões
  - [Requisição HTTP](./request.md) (fornecido pelo **plugin** @nocobase/plugin-workflow-request)
  - [JavaScript](./javascript.md) (fornecido pelo **plugin** @nocobase/plugin-workflow-javascript)
  - [Enviar E-mail](./mailer.md) (fornecido pelo **plugin** @nocobase/plugin-workflow-mailer)
  - [Notificação](../../notification-manager/index.md#nó-de-notificação-do-fluxo-de-trabalho) (fornecido pelo **plugin** @nocobase/plugin-workflow-notification)
  - [Resposta](./response.md) (fornecido pelo **plugin** @nocobase/plugin-workflow-webhook)
  - [Mensagem de Resposta](./response-message.md) (fornecido pelo **plugin** @nocobase/plugin-workflow-response-message)