:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Referência da API

## Lado do servidor

As APIs disponíveis na estrutura do pacote do lado do servidor são mostradas no código a seguir:

```ts
import PluginWorkflowServer, {
  Trigger,
  Instruction,
  EXECUTION_STATUS,
  JOB_STATUS,
} from '@nocobase/plugin-workflow';
```

### `PluginWorkflowServer`

Classe do **plugin** de **fluxo de trabalho**.

Geralmente, durante a execução do aplicativo, você pode chamar `app.pm.get<PluginWorkflowServer>(PluginWorkflowServer)` em qualquer lugar onde possa obter a instância do aplicativo `app` para acessar a instância do **plugin** de **fluxo de trabalho** (referida como `plugin` abaixo).

#### `registerTrigger()`

Estende e registra um novo tipo de gatilho.

**Assinatura**

`registerTrigger(type: string, trigger: typeof Trigger | Trigger })`

**Parâmetros**

| Parâmetro | Tipo                        | Descrição                        |
| --------- | --------------------------- | -------------------------------- |
| `type`    | `string`                    | Identificador do tipo de gatilho |
| `trigger` | `typeof Trigger \| Trigger` | Tipo ou instância do gatilho     |

**Exemplo**

```ts
import PluginWorkflowServer, { Trigger } from '@nocobase/plugin-workflow';

function handler(this: MyTrigger, workflow: WorkflowModel, message: string) {
  // aciona o fluxo de trabalho
  this.workflow.trigger(workflow, { data: message.data });
}

class MyTrigger extends Trigger {
  messageHandlers: Map<number, WorkflowModel> = new Map();
  on(workflow: WorkflowModel) {
    const messageHandler = handler.bind(this, workflow);
    // escuta algum evento para acionar o fluxo de trabalho
    process.on(
      'message',
      this.messageHandlers.set(workflow.id, messageHandler),
    );
  }

  off(workflow: WorkflowModel) {
    const messageHandler = this.messageHandlers.get(workflow.id);
    // remove o listener
    process.off('message', messageHandler);
  }
}

export default class MyPlugin extends Plugin {
  load() {
    // obtém a instância do plugin de fluxo de trabalho
    const workflowPlugin =
      this.app.pm.get<PluginWorkflowServer>(PluginWorkflowServer);

    // registra o gatilho
    workflowPlugin.registerTrigger('myTrigger', MyTrigger);
  }
}
```

#### `registerInstruction()`

Estende e registra um novo tipo de nó.

**Assinatura**

`registerInstruction(type: string, instruction: typeof Instruction | Instruction })`

**Parâmetros**

| Parâmetro     | Tipo                                | Descrição                         |
| ------------- | ----------------------------------- | --------------------------------- |
| `type`        | `string`                            | Identificador do tipo de instrução |
| `instruction` | `typeof Instruction \| Instruction` | Tipo ou instância da instrução    |

**Exemplo**

```ts
import PluginWorkflowServer, { Instruction, JOB_STATUS } from '@nocobase/plugin-workflow';

class LogInstruction extends Instruction {
  run(node, input, processor) {
    console.log('my instruction runs!');
    return {
      status: JOB_STATUS.RESOVLED,
    };
  },
};

export default class MyPlugin extends Plugin {
  load() {
    // obtém a instância do plugin de fluxo de trabalho
    const workflowPlugin = this.app.pm.get<PluginWorkflowServer>(PluginWorkflowServer);

    // registra a instrução
    workflowPlugin.registerInstruction('log', LogInstruction);
  }
}
```

#### `trigger()`

Aciona um **fluxo de trabalho** específico. Usado principalmente em gatilhos personalizados para acionar o **fluxo de trabalho** correspondente quando um evento personalizado específico é detectado.

**Assinatura**

`trigger(workflow: Workflow, context: any)`

**Parâmetros**

| Parâmetro  | Tipo          | Descrição                                  |
| ---------- | ------------- | ------------------------------------------ |
| `workflow` | `WorkflowModel` | Objeto do **fluxo de trabalho** a ser acionado |
| `context`  | `object`      | Dados de contexto fornecidos no momento do acionamento |

:::info{title=Dica}
Atualmente, `context` é um item obrigatório. Se não for fornecido, o **fluxo de trabalho** não será acionado.
:::

**Exemplo**

```ts
import { Trigger } from '@nocobase/plugin-workflow';

class MyTrigger extends Trigger {
  timer: NodeJS.Timeout;

  on(workflow) {
    // registra o evento
    this.timer = setInterval(() => {
      // aciona o fluxo de trabalho
      this.plugin.trigger(workflow, { date: new Date() });
    }, workflow.config.interval ?? 60000);
  }
}
```

#### `resume()`

Retoma a execução de um **fluxo de trabalho** em espera com uma tarefa de nó específica.

- Apenas **fluxos de trabalho** no estado de espera (`EXECUTION_STATUS.STARTED`) podem ser retomados.
- Apenas tarefas de nó no estado pendente (`JOB_STATUS.PENDING`) podem ser retomadas.

**Assinatura**

`resume(job: JobModel)`

**Parâmetros**

| Parâmetro | Tipo       | Descrição                  |
| --------- | ---------- | -------------------------- |
| `job`     | `JobModel` | Objeto da tarefa atualizada |

:::info{title=Dica}
O objeto da tarefa passado é geralmente um objeto atualizado, e seu `status` é normalmente atualizado para um valor diferente de `JOB_STATUS.PENDING`, caso contrário, ele continuará em espera.
:::

**Exemplo**

Veja os detalhes no [código-fonte](https://github.com/nocobase/nocobase/blob/main/packages/plugins/%40nocobase/plugin-workflow-manual/src/server/actions.ts#L99).

### `Trigger`

A classe base para gatilhos, usada para estender tipos de gatilhos personalizados.

| Parâmetro     | Tipo                                                        | Descrição                                      |
| ------------- | ----------------------------------------------------------- | ---------------------------------------------- |
| `constructor` | `(public readonly workflow: PluginWorkflowServer): Trigger` | Construtor                                     |
| `on?`         | `(workflow: WorkflowModel): void`                           | Manipulador de eventos após ativar um **fluxo de trabalho** |
| `off?`        | `(workflow: WorkflowModel): void`                           | Manipulador de eventos após desativar um **fluxo de trabalho** |

`on`/`off` são usados para registrar/desregistrar listeners de eventos quando um **fluxo de trabalho** é ativado/desativado. O parâmetro passado é a instância do **fluxo de trabalho** correspondente ao gatilho, que pode ser processado de acordo com a configuração. Alguns tipos de gatilho que já possuem eventos escutados globalmente podem não precisar implementar esses dois métodos. Por exemplo, em um gatilho agendado, você pode registrar um temporizador em `on` e desregistrá-lo em `off`.

### `Instruction`

A classe base para tipos de instrução, usada para estender tipos de instrução personalizados.

| Parâmetro     | Tipo                                                            | Descrição                                          |
| ------------- | --------------------------------------------------------------- | -------------------------------------------------- |
| `constructor` | `(public readonly workflow: PluginWorkflowServer): Instruction` | Construtor                                         |
| `run`         | `Runner`                                                        | Lógica de execução para a primeira entrada no nó   |
| `resume?`     | `Runner`                                                        | Lógica de execução para entrar no nó após retomar de uma interrupção |
| `getScope?`   | `(node: FlowNodeModel, data: any, processor: Processor): any`   | Fornece o conteúdo da variável local para a ramificação gerada pelo nó correspondente |

**Tipos Relacionados**

```ts
export type Job =
  | {
      status: JOB_STATUS[keyof JOB_STATUS];
      result?: unknown;
      [key: string]: unknown;
    }
  | JobModel
  | null;

export type InstructionResult = Job | Promise<Job>;

export type Runner = (
  node: FlowNodeModel,
  input: JobModel,
  processor: Processor,
) => InstructionResult;

export class Instruction {
  run: Runner;
  resume?: Runner;
}
```

Para `getScope`, você pode consultar a [implementação do nó de loop](https://github.com/nocobase/nocobase/blob/main/packages/plugins/%40nocobase/plugin-workflow-loop/src/server/LoopInstruction.ts#L83), que é usada para fornecer o conteúdo da variável local para as ramificações.

### `EXECUTION_STATUS`

Uma tabela de constantes para os status do plano de execução do **fluxo de trabalho**, usada para identificar o status atual do plano de execução correspondente.

| Nome da Constante               | Significado                          |
| ------------------------------- | ------------------------------------ |
| `EXECUTION_STATUS.QUEUEING`     | Em fila                              |
| `EXECUTION_STATUS.STARTED`      | Iniciado                             |
| `EXECUTION_STATUS.RESOLVED`     | Resolvido                            |
| `EXECUTION_STATUS.FAILED`       | Falhou                               |
| `EXECUTION_STATUS.ERROR`        | Erro na execução                     |
| `EXECUTION_STATUS.ABORTED`      | Abortado                             |
| `EXECUTION_STATUS.CANCELED`     | Cancelado                            |
| `EXECUTION_STATUS.REJECTED`     | Rejeitado                            |
| `EXECUTION_STATUS.RETRY_NEEDED` | Não executado com sucesso, necessário tentar novamente |

Exceto pelos três primeiros, todos os outros representam um estado de falha, mas podem ser usados para descrever diferentes motivos de falha.

### `JOB_STATUS`

Uma tabela de constantes para os status das tarefas de nó do **fluxo de trabalho**, usada para identificar o status atual da tarefa de nó correspondente. O status gerado pelo nó também afeta o status de todo o plano de execução.

| Nome da Constante                 | Significado                                                               |
| ------------------------- | ------------------------------------------------------------------------- |
| `JOB_STATUS.PENDING`      | Pendente: A execução chegou a este nó, mas a instrução exige que ele seja suspenso e aguarde |
| `JOB_STATUS.RESOLVED`     | Resolvido                                                                 |
| `JOB_STATUS.FAILED`       | Falhou: A execução deste nó não atendeu às condições configuradas         |
| `JOB_STATUS.ERROR`        | Erro: Ocorreu um erro não tratado durante a execução deste nó             |
| `JOB_STATUS.ABORTED`      | Abortado: A execução deste nó foi encerrada por outra lógica após estar em estado pendente |
| `JOB_STATUS.CANCELED`     | Cancelado: A execução deste nó foi cancelada manualmente após estar em estado pendente |
| `JOB_STATUS.REJECTED`     | Rejeitado: A continuação deste nó foi rejeitada manualmente após estar em estado pendente |
| `JOB_STATUS.RETRY_NEEDED` | Não executado com sucesso, necessário tentar novamente                    |

## Lado do cliente

As APIs disponíveis na estrutura do pacote do lado do cliente são mostradas no código a seguir:

```ts
import PluginWorkflowClient, {
  Trigger,
  Instruction,
} from '@nocobase/plugin-workflow/client';
```

### `PluginWorkflowClient`

#### `registerTrigger()`

Registra o painel de configuração para o tipo de gatilho.

**Assinatura**

`registerTrigger(type: string, trigger: typeof Trigger | Trigger): void`

**Parâmetros**

| Parâmetro | Tipo                        | Descrição                                        |
| --------- | --------------------------- | ------------------------------------------------ |
| `type`    | `string`                    | Identificador do tipo de gatilho, consistente com o identificador usado para registro |
| `trigger` | `typeof Trigger \| Trigger` | Tipo ou instância do gatilho                     |

#### `registerInstruction()`

Registra o painel de configuração para o tipo de nó.

**Assinatura**

`registerInstruction(type: string, instruction: typeof Instruction | Instruction): void`

**Parâmetros**

| Parâmetro     | Tipo                                | Descrição                                        |
| ------------- | ----------------------------------- | ------------------------------------------------ |
| `type`        | `string`                            | Identificador do tipo de nó, consistente com o identificador usado para registro |
| `instruction` | `typeof Instruction \| Instruction` | Tipo ou instância do nó                          |

#### `registerInstructionGroup()`

Registra um grupo de tipos de nó. O NocoBase oferece 4 grupos de tipos de nó padrão:

*   `'control'`: Controle
*   `'collection'`: Operações de **coleção**
*   `'manual'`: Processamento manual
*   `'extended'`: Outras extensões

Se você precisar estender outros grupos, pode usar este método para registrá-los.

**Assinatura**

`registerInstructionGroup(type: string, group: { label: string }): void`

**Parâmetros**

| Parâmetro | Tipo               | Descrição                                        |
| --------- | ------------------ | ------------------------------------------------ |
| `type`    | `string`           | Identificador do grupo de nós, consistente com o identificador usado para registro |
| `group`   | `{ label: string }` | Informações do grupo, atualmente inclui apenas o título |

**Exemplo**

```js
export default class YourPluginClient extends Plugin {
  load() {
    const pluginWorkflow = this.app.pm.get(PluginWorkflowClient);

    pluginWorkflow.registerInstructionGroup('ai', { label: `{{t("AI", { ns: "${NAMESPACE}" })}}` });
  }
}
```

### `Trigger`

A classe base para gatilhos, usada para estender tipos de gatilhos personalizados.

| Parâmetro       | Tipo                                                             | Descrição                                                              |
| --------------- | ---------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `title`         | `string`                                                         | Nome do tipo de gatilho                                                |
| `fieldset`      | `{ [key: string]: ISchema }`                                     | **Coleção** de itens de configuração do gatilho                        |
| `scope?`        | `{ [key: string]: any }`                                         | **Coleção** de objetos que podem ser usados no Schema dos itens de configuração |
| `components?`   | `{ [key: string]: React.FC }`                                    | **Coleção** de componentes que podem ser usados no Schema dos itens de configuração |
| `useVariables?` | `(config: any, options: UseVariableOptions ) => VariableOptions` | Acessor de valor para dados de contexto do gatilho                     |

-   Se `useVariables` não for definido, significa que este tipo de gatilho não oferece uma função de recuperação de valor, e os dados de contexto do gatilho não podem ser selecionados nos nós do **fluxo de trabalho**.

### `Instruction`

A classe base para instruções, usada para estender tipos de nós personalizados.

| Parâmetro          | Tipo                                                    | Descrição                                                                                                  |
| ------------------ | ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `group`            | `string`                                                | Identificador do grupo de tipos de nó, opções atuais: `'control'`/`'collection'`/`'manual'`/`'extended'` |
| `fieldset`         | `Record<string, ISchema>`                               | **Coleção** de itens de configuração do nó                                                                 |
| `scope?`           | `Record<string, Function>`                              | **Coleção** de objetos que podem ser usados no Schema dos itens de configuração                            |
| `components?`      | `Record<string, React.FC>`                              | **Coleção** de componentes que podem ser usados no Schema dos itens de configuração                        |
| `Component?`       | `React.FC`                                              | Componente de renderização personalizado para o nó                                                         |
| `useVariables?`    | `(node, options: UseVariableOptions) => VariableOption` | Método para o nó fornecer opções de variáveis do nó                                                        |
| `useScopeVariables?` | `(node, options?) => VariableOptions`                   | Método para o nó fornecer opções de variáveis locais da ramificação                                        |
| `useInitializers?` | `(node) => SchemaInitializerItemType`                   | Método para o nó fornecer opções de inicializadores                                                        |
| `isAvailable?`     | `(ctx: NodeAvailableContext) => boolean`                | Método para determinar se o nó está disponível                                                             |

**Tipos Relacionados**

```ts
export type NodeAvailableContext = {
  workflow: object;
  upstream: object;
  branchIndex: number;
};
```

-   Se `useVariables` não for definido, significa que este tipo de nó não oferece uma função de recuperação de valor, e os dados de resultado deste tipo de nó não podem ser selecionados nos nós do **fluxo de trabalho**. Se o valor do resultado for singular (não selecionável), você pode retornar um conteúdo estático que expresse a informação correspondente (consulte: [código-fonte do nó de cálculo](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-workflow/src/client/nodes/calculation.tsx#L68)). Se for necessário que seja selecionável (por exemplo, uma propriedade de um Objeto), você pode personalizar a saída do componente de seleção correspondente (consulte: [código-fonte do nó de criação de dados](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-workflow/src/client/nodes/create.tsx#L41)).
-   `Component` é um componente de renderização personalizado para o nó. Quando a renderização padrão do nó não é suficiente, ele pode ser completamente substituído para uma renderização de visualização de nó personalizada. Por exemplo, se você precisar fornecer mais botões de ação ou outras interações para o nó inicial de um tipo de ramificação, você usaria este método (consulte: [código-fonte da ramificação paralela](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-workflow-parallel/src/client/ParallelInstruction.tsx)).
-   `useInitializers` é usado para fornecer um método para inicializar blocos. Por exemplo, em um nó manual, você pode inicializar blocos de usuário relacionados com base nos nós upstream. Se este método for fornecido, ele estará disponível ao inicializar blocos na configuração da interface do nó manual (consulte: [código-fonte do nó de criação de dados](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-workflow/src/client/nodes/create.tsx#L71)).
-   `isAvailable` é usado principalmente para determinar se um nó pode ser usado (adicionado) no ambiente atual. O ambiente atual inclui o **fluxo de trabalho** atual, nós upstream e o índice da ramificação atual.