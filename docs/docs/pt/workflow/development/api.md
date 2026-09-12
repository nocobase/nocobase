---
title: "Referência da API"
description: "Referência da API de extensão do fluxo de trabalho: modelo de fluxo de trabalho, contexto de execução de nós, API de gatilho, passagem de variáveis."
keywords: "fluxo de trabalho,referência da API,modelo de fluxo de trabalho,contexto de nós,API de gatilho,NocoBase"
---

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

Classe do plugin de fluxo de trabalho.

Geralmente, durante a execução do aplicativo, você pode chamar `app.pm.get<PluginWorkflowServer>(PluginWorkflowServer)` em qualquer lugar onde possa obter a instância do aplicativo `app` para acessar a instância do plugin de fluxo de trabalho (referida como `plugin` abaixo).

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
  // trigger workflow
  this.workflow.trigger(workflow, { data: message.data });
}

class MyTrigger extends Trigger {
  messageHandlers: Map<number, WorkflowModel> = new Map();
  on(workflow: WorkflowModel) {
    const messageHandler = handler.bind(this, workflow);
    // listen some event to trigger workflow
    process.on(
      'message',
      this.messageHandlers.set(workflow.id, messageHandler),
    );
  }

  off(workflow: WorkflowModel) {
    const messageHandler = this.messageHandlers.get(workflow.id);
    // remove listener
    process.off('message', messageHandler);
  }
}

export default class MyPlugin extends Plugin {
  load() {
    // get workflow plugin instance
    const workflowPlugin =
      this.app.pm.get<PluginWorkflowServer>(PluginWorkflowServer);

    // register trigger
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
    // get workflow plugin instance
    const workflowPlugin = this.app.pm.get<PluginWorkflowServer>(PluginWorkflowServer);

    // register instruction
    workflowPlugin.registerInstruction('log', LogInstruction);
  }
}
```

#### `trigger()`

Aciona um fluxo de trabalho específico. Usado principalmente em gatilhos personalizados para acionar o fluxo de trabalho correspondente quando um evento personalizado específico é detectado.

**Assinatura**

`trigger(workflow: Workflow, context: any)`

**Parâmetros**
| Parâmetro | Tipo | Descrição |
| --- | --- | --- |
| `workflow` | `WorkflowModel` | Objeto do fluxo de trabalho a ser acionado |
| `context` | `object` | Dados de contexto fornecidos no momento do acionamento |

:::info{title=Nota}
Atualmente, `context` é um item obrigatório. Se não for fornecido, o fluxo de trabalho não será acionado.
:::

**Exemplo**

```ts
import { Trigger } from '@nocobase/plugin-workflow';

class MyTrigger extends Trigger {
  timer: NodeJS.Timeout;

  on(workflow) {
    // register event
    this.timer = setInterval(() => {
      // trigger workflow
      this.plugin.trigger(workflow, { date: new Date() });
    }, workflow.config.interval ?? 60000);
  }
}
```

#### `resume()`

Retoma a execução de um fluxo de trabalho em espera com uma tarefa de nó específica.

- Apenas fluxos de trabalho no estado de espera (`EXECUTION_STATUS.STARTED`) podem ser retomados.
- Apenas tarefas de nó no estado pendente (`JOB_STATUS.PENDING`) podem ser retomadas.

**Assinatura**

`resume(job: JobModel)`

**Parâmetros**

| Parâmetro | Tipo       | Descrição                  |
| --------- | ---------- | -------------------------- |
| `job`     | `JobModel` | Objeto da tarefa atualizada |

:::info{title=Nota}
O objeto da tarefa passado é geralmente um objeto atualizado, e seu `status` é normalmente atualizado para um valor diferente de `JOB_STATUS.PENDING`, caso contrário, ele continuará em espera.
:::

**Exemplo**

Veja os detalhes no [código-fonte](https://github.com/nocobase/nocobase/blob/main/packages/plugins/%40nocobase/plugin-workflow-manual/src/server/actions.ts#L99).

### `Trigger`

A classe base para gatilhos, usada para estender tipos de gatilhos personalizados.

```ts
import { Trigger } from '@nocobase/plugin-workflow';
```

| Parâmetro     | Tipo                                                        | Descrição                                      |
| ------------- | ----------------------------------------------------------- | ---------------------------------------------- |
| `constructor` | `(public readonly workflow: PluginWorkflowServer): Trigger` | Construtor                                     |
| `on?`         | `(workflow: WorkflowModel): void`                           | Manipulador de eventos após ativar um fluxo de trabalho |
| `off?`        | `(workflow: WorkflowModel): void`                           | Manipulador de eventos após desativar um fluxo de trabalho |

`on`/`off` são usados para registrar/desregistrar listeners de eventos quando um fluxo de trabalho é ativado/desativado. O parâmetro passado é a instância do fluxo de trabalho correspondente ao gatilho, que pode ser processado de acordo com a configuração. Alguns tipos de gatilho que já possuem eventos escutados globalmente podem não precisar implementar esses dois métodos. Por exemplo, em um gatilho agendado, você pode registrar um temporizador em `on` e desregistrá-lo em `off`.

### `Instruction`

A classe base para tipos de instrução, usada para estender tipos de instrução personalizados.

```ts
import { Instruction } from '@nocobase/plugin-workflow';
```

| Parâmetro     | Tipo                                                            | Descrição                                          |
| ------------- | --------------------------------------------------------------- | -------------------------------------------------- |
| `constructor` | `(public readonly workflow: PluginWorkflowServer): Instruction` | Construtor                                         |
| `run`         | `Runner`                                                        | Lógica de execução para a primeira entrada no nó   |
| `resume?`     | `Runner`                                                        | Lógica de execução para entrar no nó após retomar de uma interrupção |
| `getScope?`   | `(node: FlowNodeModel, data: any, processor: Processor): any`  | Fornece o conteúdo da variável local para a ramificação gerada pelo nó correspondente |

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

Uma tabela de constantes para os status do plano de execução do fluxo de trabalho, usada para identificar o status atual do plano de execução correspondente.

```ts
import { EXECUTION_STATUS } from '@nocobase/plugin-workflow';
```

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

Uma tabela de constantes para os status das tarefas de nó do fluxo de trabalho, usada para identificar o status atual da tarefa de nó correspondente. O status gerado pelo nó também afeta o status de todo o plano de execução.

```ts
import { JOB_STATUS } from '@nocobase/plugin-workflow';
```

| Nome da Constante              | Significado                                                                                          |
| -------------------------- | ------------------------------------------------------------------------------------------------ |
| `JOB_STATUS.PENDING`      | Pendente: A execução chegou a este nó, mas a instrução exige que ele seja suspenso e aguarde    |
| `JOB_STATUS.RESOLVED`     | Resolvido                                                                                         |
| `JOB_STATUS.FAILED`       | Falhou: A execução deste nó não atendeu às condições configuradas                      |
| `JOB_STATUS.ERROR`        | Erro: Ocorreu um erro não tratado durante a execução deste nó                             |
| `JOB_STATUS.ABORTED`      | Abortado: A execução deste nó foi encerrada por outra lógica após estar em estado pendente  |
| `JOB_STATUS.CANCELED`     | Cancelado: A execução deste nó foi cancelada manualmente após estar em estado pendente         |
| `JOB_STATUS.REJECTED`     | Rejeitado: A continuação deste nó foi rejeitada manualmente após estar em estado pendente      |
| `JOB_STATUS.RETRY_NEEDED` | Não executado com sucesso, necessário tentar novamente                                                          |

## Lado do cliente

As APIs disponíveis na estrutura do pacote do lado do cliente são mostradas no código a seguir:

```ts
import PluginWorkflowClientV2, {
  Trigger,
  Instruction,
} from '@nocobase/plugin-workflow/client-v2';
```

### `PluginWorkflowClientV2`

Classe do plugin de fluxo de trabalho do lado do cliente. Geralmente obtida via `this.app.pm.get('workflow')`.

#### `registerTrigger()`

Registra o painel de configuração para um tipo de gatilho.

**Assinatura**

`registerTrigger(type: string, trigger: typeof Trigger | Trigger): void`

**Parâmetros**

| Parâmetro | Tipo | Descrição |
| --- | --- | --- |
| `type` | `string` | Identificador do tipo de gatilho, consistente com o identificador registrado no lado do servidor |
| `trigger` | `typeof Trigger \| Trigger` | Tipo ou instância do gatilho |

#### `registerInstruction()`

Registra o painel de configuração para um tipo de nó.

**Assinatura**

`registerInstruction(type: string, instruction: typeof Instruction | Instruction): void`

**Parâmetros**

| Parâmetro | Tipo | Descrição |
| --- | --- | --- |
| `type` | `string` | Identificador do tipo de nó, consistente com o identificador registrado no lado do servidor |
| `instruction` | `typeof Instruction \| Instruction` | Tipo ou instância do nó |

#### `registerInstructionGroup()`

Registra um grupo de tipos de nó. O NocoBase oferece 4 grupos de tipos de nó padrão:

* `'control'`: Controle
* `'collection'`: Operações de coleção
* `'manual'`: Processamento manual
* `'extended'`: Outras extensões

Se você precisar estender outros grupos, pode usar este método para registrá-los.

**Assinatura**

`registerInstructionGroup(type: string, group: { label: string }): void`

**Parâmetros**

| Parâmetro | Tipo | Descrição |
| --- | --- | --- |
| `type` | `string` | Identificador do grupo de nós |
| `group` | `{ label: string }` | Informações do grupo, atualmente inclui apenas o título |

**Exemplo**

```ts
import { Plugin } from '@nocobase/client-v2';

export default class YourPluginClient extends Plugin {
  async load() {
    const pluginWorkflow = this.app.pm.get('workflow');
    pluginWorkflow.registerInstructionGroup('ai', { label: `{{t("AI", { ns: "${NAMESPACE}" })}}` });
  }
}
```

#### `isWorkflowSync()`

Determina se um fluxo de trabalho está no modo síncrono.

**Assinatura**

`isWorkflowSync(workflow: object): boolean`

### `Trigger`

A classe base para gatilhos, usada para estender tipos de gatilhos personalizados.

| Parâmetro | Tipo | Descrição |
| --- | --- | --- |
| `title` | `string` | Nome do tipo de gatilho |
| `description?` | `string` | Descrição do tipo de gatilho |
| `PresetFieldsetLoader?` | `LoaderOf` | Formulário de configuração predefinido na criação (carregamento lazy) |
| `FieldsetLoader?` | `LoaderOf` | Formulário completo de configuração do gatilho (carregamento lazy) |
| `TriggerFieldsetLoader?` | `LoaderOf` | Formulário de entrada para execução manual (carregamento lazy) |
| `validate` | `(config: Record<string, unknown>) => boolean` | Validação da configuração; retorna `true` se a configuração for válida |
| `createDefaultConfig?` | `() => Record<string, unknown>` | Fornece valores de configuração padrão |
| `useVariables?` | `(config, options?: UseVariableOptions) => VariableOption[] \| null` | Opções de variáveis para dados de contexto do gatilho |
| `getCreateModelMenuItem?` | `(args) => SubModelItem \| SubModelItem[] \| null` | Itens de menu para criar sub-modelos no canvas |
| `useTempAssociationSource?` | `(config, workflow?) => TriggerTempAssociationSource \| null` | Fornece uma fonte de dados de associação temporária |

**Tipos Relacionados**

```ts
export type LoaderOf<P = {}> = () => Promise<{ default: ComponentType<P> }>;
```

- Se `useVariables` não for definido, significa que este tipo de gatilho não fornece uma função de recuperação de valor, e os dados de contexto do gatilho não podem ser selecionados nos nós do fluxo de trabalho.

### `Instruction`

A classe base para instruções, usada para estender tipos de nós personalizados.

| Parâmetro | Tipo | Descrição |
| --- | --- | --- |
| `title` | `string` | Nome do tipo de nó |
| `type` | `string` | Identificador do tipo de nó |
| `group` | `string` | Identificador do grupo do tipo de nó, opções: `'control'`/`'collection'`/`'manual'`/`'extended'` |
| `description?` | `string` | Descrição do tipo de nó |
| `icon?` | `JSX.Element` | Ícone do nó |
| `FieldsetLoader?` | `LoaderOf` | Formulário da gaveta de configuração do nó (carregamento lazy) |
| `PresetFieldsetLoader?` | `LoaderOf` | Formulário de configuração predefinido na criação (carregamento lazy) |
| `ComponentLoader?` | `LoaderOf<{ data: any }>` | Renderização personalizada do nó no canvas (carregamento lazy), usado para nós de ramificação e outros casos que requerem renderização especial |
| `branching?` | `boolean \| object \| ((config) => boolean \| object)` | Declara se o nó é um nó de ramificação |
| `end?` | `boolean \| ((node) => boolean)` | Declara se o nó é um nó terminal |
| `testable?` | `boolean` | Declara se o nó suporta execuções de teste |
| `createDefaultConfig?` | `() => object` | Fornece valores de configuração padrão |
| `useVariables?` | `(node, options?: UseVariableOptions) => VariableOption` | Método para o nó fornecer opções de variáveis |
| `useScopeVariables?` | `(node, options?) => VariableOption[] \| MetaTreeNode[]` | Método para o nó fornecer opções de variáveis com escopo de ramificação |
| `isAvailable?` | `(ctx: NodeAvailableContext) => boolean` | Método para determinar se o nó está disponível |
| `getCreateModelMenuItem?` | `({ node, workflow }) => SubModelItem \| null` | Itens de menu para criar sub-modelos no canvas |
| `useTempAssociationSource?` | `(node) => TempAssociationSource \| null` | Fornece uma fonte de dados de associação temporária |

**Tipos Relacionados**

```ts
export type NodeAvailableContext = {
  engine: WorkflowPlugin;
  workflow: object;
  upstream: object;
  branchIndex: number;
};
```

- Se `useVariables` não for definido, significa que este tipo de nó não fornece uma função de recuperação de valor, e os dados de resultado deste tipo de nó não podem ser selecionados nos nós do fluxo de trabalho. Se o valor do resultado for singular (não selecionável), você pode retornar um conteúdo estático que expresse a informação correspondente (consulte: [código-fonte do nó de cálculo](https://github.com/nocobase/nocobase/blob/develop/packages/plugins/%40nocobase/plugin-workflow/src/client-v2/nodes/calculation.tsx)). Se for necessário que seja selecionável (por exemplo, uma propriedade de um Object), você pode personalizar a saída do componente de seleção correspondente (consulte: [código-fonte do nó de consulta de dados](https://github.com/nocobase/nocobase/blob/develop/packages/plugins/%40nocobase/plugin-workflow/src/client-v2/nodes/query.tsx)).
- `ComponentLoader` é um componente de renderização personalizado para o nó. Quando a renderização padrão do nó não é suficiente, ele pode ser completamente substituído para uma renderização de visualização de nó personalizada. Por exemplo, para fornecer renderização adicional de ramificação para nós do tipo ramificação (consulte: [código-fonte do nó de condição](https://github.com/nocobase/nocobase/blob/develop/packages/plugins/%40nocobase/plugin-workflow/src/client-v2/nodes/condition.tsx)).
- `isAvailable` é usado principalmente para determinar se um nó pode ser usado (adicionado) no ambiente atual. O ambiente atual inclui a instância do plugin de fluxo de trabalho, o fluxo de trabalho atual, nós upstream e o índice da ramificação atual.

### Componentes de Entrada de Variáveis

O fluxo de trabalho fornece um conjunto de componentes de entrada de variáveis para permitir que os usuários selecionem variáveis do fluxo de trabalho nos formulários de configuração de nós/gatilhos.

```ts
import {
  WorkflowVariableInput,
  WorkflowVariableTextArea,
  WorkflowTypedVariableInput,
  WorkflowVariableWrapper,
} from '@nocobase/plugin-workflow/client-v2';
```

#### `WorkflowVariableInput`

Entrada de variável que suporta selecionar uma variável e continuar digitando conteúdo. Adequado para cenários de entrada de linha única que requerem uma mistura de referências de variável e texto livre.

```tsx
import { WorkflowVariableInput } from '@nocobase/plugin-workflow/client-v2';

<Form.Item name={['config', 'target']} label="Target">
  <WorkflowVariableInput />
</Form.Item>
```

![WorkflowVariableInput](https://static-docs.nocobase.com/20260701160110.png)

**Props**

| Parâmetro | Tipo | Descrição |
| --- | --- | --- |
| `value?` | `string` | Valor do caminho da variável, ex.: `{{$jobsMapByNodeKey.xxx.field}}` |
| `onChange?` | `(value: string) => void` | Callback de alteração de valor |
| `variableOptions?` | `UseWorkflowVariableOptions` | Opções de filtro de variáveis (filtragem por tipo, profundidade, etc.) |
| `disabled?` | `boolean` | Se está desabilitado |
| `placeholder?` | `string` | Texto de placeholder |

#### `WorkflowVariableTextArea`

Área de texto de múltiplas linhas que suporta inserir referências de variável em qualquer posição do cursor. Adequado para cenários de texto livre como corpo HTTP, texto de template, etc.

```tsx
import { WorkflowVariableTextArea } from '@nocobase/plugin-workflow/client-v2';

<Form.Item name={['config', 'body']} label="Body">
  <WorkflowVariableTextArea autoSize={{ minRows: 5 }} />
</Form.Item>
```

![WorkflowVariableTextArea](https://static-docs.nocobase.com/20260701160242.png)

**Props**

| Parâmetro | Tipo | Descrição |
| --- | --- | --- |
| `value?` | `string` | Valor do texto (pode conter referências de variável) |
| `onChange?` | `(value: string) => void` | Callback de alteração de valor |
| `variableOptions?` | `UseWorkflowVariableOptions` | Opções de filtro de variáveis |
| `delimiters?` | `readonly [string, string]` | Delimitadores de variável, padrão: `['{{', '}}']` |

Herda outras Props do `TextArea` do antd (como `autoSize`, `placeholder`, etc.).

#### `WorkflowTypedVariableInput`

Entrada tipada que alterna entre os modos "constante" e "referência de variável". No modo variável, você só pode selecionar uma variável; não é possível continuar digitando após a seleção. No modo constante, cinco tipos são suportados: `string`, `number`, `boolean`, `date` e `object`.

```tsx
import { WorkflowTypedVariableInput } from '@nocobase/plugin-workflow/client-v2';

<Form.Item name={['config', 'value']} label="Value">
  <WorkflowTypedVariableInput />
</Form.Item>
```

![WorkflowTypedVariableInput](https://static-docs.nocobase.com/20260701160608.png)

**Props**

| Parâmetro | Tipo | Descrição |
| --- | --- | --- |
| `variableOptions?` | `UseWorkflowVariableOptions` | Opções de filtro de variáveis |

Herda outras Props de `TypedVariableInput` (excluindo `extraNodes`, `metaTree`, `namespaces` usados internamente).

#### `WorkflowVariableWrapper`

Wrapper genérico para substituir diferentes componentes de entrada em diferentes contextos. Por exemplo, quando o mesmo campo requer diferentes métodos de entrada na configuração do nó gatilho e na gaveta de configuração do nó, você pode usar este componente para envolver uma entrada nativa em uma entrada com alternância de modo variável.

```tsx
import { WorkflowVariableWrapper } from '@nocobase/plugin-workflow/client-v2';

<Form.Item name={['config', 'timeout']} label="Timeout">
  <WorkflowVariableWrapper
    render={({ value, onChange }) => (
      <InputNumber value={value} onChange={onChange} min={0} />
    )}
  />
</Form.Item>
```

**Props**

| Parâmetro | Tipo | Descrição |
| --- | --- | --- |
| `value?` | `TValue \| string \| null` | Valor atual (valor constante ou string de caminho de variável) |
| `onChange?` | `(value: TValue \| string \| null) => void` | Callback de alteração de valor |
| `variableOptions?` | `UseWorkflowVariableOptions` | Opções de filtro de variáveis |
| `render` | `(props: { value?, onChange? }) => ReactNode` | Renderiza o componente de entrada nativo |
| `clearValue?` | `TValue \| null` | Valor inicial ao alternar do modo variável de volta para o modo constante, padrão: `null` |

### Componentes Relacionados a Coleções

O fluxo de trabalho também fornece um conjunto de componentes auxiliares relacionados a coleções:

```ts
import {
  CollectionCascader,
  AppendsSelect,
  FieldsSelect,
  SortFieldsInput,
  PaginationFields,
} from '@nocobase/plugin-workflow/client-v2';
```

- `CollectionCascader` — Seletor de coleção com reconhecimento de fonte de dados (cascata)
- `AppendsSelect` — Seletor de pré-carregamento de campos de associação (seleção em árvore)
- `FieldsSelect` — Multi-seletor de campos de coleção
- `SortFieldsInput` — Entrada de campo de ordenação
- `PaginationFields` — Itens de formulário para parâmetros de paginação
