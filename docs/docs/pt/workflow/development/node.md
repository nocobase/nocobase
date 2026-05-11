:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Estendendo Tipos de Nós
O tipo de um nó é, essencialmente, uma instrução de operação. Instruções diferentes representam operações distintas executadas no **fluxo de trabalho**.

Assim como os gatilhos, estender os tipos de nós também se divide em duas partes: *server-side* (lado do servidor) e *client-side* (lado do cliente). O *server-side* precisa implementar a lógica para a instrução registrada, enquanto o *client-side* deve fornecer a configuração da interface para os parâmetros do nó onde a instrução está localizada.

## Lado do Servidor

### A Instrução de Nó Mais Simples

O conteúdo principal de uma instrução é uma função, o que significa que o método `run` na classe da instrução deve ser implementado para executar a lógica da instrução. Dentro da função, você pode realizar qualquer operação necessária, como operações de banco de dados, operações de arquivo, chamadas a APIs de terceiros, entre outras.

Todas as instruções precisam ser derivadas da classe base `Instruction`. A instrução mais simples exige apenas a implementação de uma função `run`:

```ts
import { Instruction, JOB_STATUS } from '@nocobase/plugin-workflow';

export class MyInstruction extends Instruction {
  run(node, input, processor) {
    console.log('my instruction runs!');
    return {
      status: JOB_STATUS.RESOVLED,
    };
  }
}
```

E registre esta instrução no **plugin** de **fluxo de trabalho**:

```ts
export default class MyPlugin extends Plugin {
  load() {
    // get workflow plugin instance
    const workflowPlugin = this.app.getPlugin<WorkflowPlugin>(WorkflowPlugin);

    // register instruction
    workflowPlugin.registerInstruction('my-instruction', MyInstruction);
  }
}
```

O valor de status (`status`) no objeto de retorno da instrução é obrigatório e deve ser um dos valores da constante `JOB_STATUS`. Este valor determinará o fluxo de processamento subsequente para este nó no **fluxo de trabalho**. Geralmente, `JOB_STATUS.RESOVLED` é usado, indicando que o nó foi executado com sucesso e a execução continuará para os próximos nós. Se houver um valor de resultado que precise ser salvo antecipadamente, você também pode chamar o método `processor.saveJob` e retornar seu objeto de retorno. O executor gerará um registro de resultado de execução com base neste objeto.

### Valor de Resultado do Nó

Se houver um resultado de execução específico, especialmente dados preparados para uso por nós subsequentes, ele pode ser retornado através da propriedade `result` e salvo no objeto de tarefa do nó:

```ts
import { Instruction, JOB_STATUS } from '@nocobase/plugin-workflow';

export class RandomStringInstruction extends Instruction {
  run(node, input, processor) {
    // customized config from node
    const { digit = 1 } = node.config;
    const result = `${Math.round(10 ** digit * Math.random())}`.padStart(
      digit,
      '0',
    );
    return {
      status: JOB_STATUS.RESOVLED,
      result,
    };
  },
};
```

Aqui, `node.config` é o item de configuração do nó, que pode ser qualquer valor necessário. Ele será salvo como um campo do tipo `JSON` no registro de nó correspondente no banco de dados.

### Tratamento de Erros da Instrução

Se puderem ocorrer exceções durante a execução, você pode capturá-las antecipadamente e retornar um status de falha:

```ts
import { JOB_STATUS } from '@nocobase/plugin-workflow';

export const errorInstruction = {
  run(node, input, processor) {
    try {
      throw new Error('exception');
    } catch (error) {
      return {
        status: JOB_STATUS.ERROR,
        result: error,
      };
    }
  },
};
```

Se exceções previsíveis não forem capturadas, o motor do **fluxo de trabalho** as capturará automaticamente e retornará um status de erro para evitar que exceções não capturadas causem a falha do programa.

### Nós Assíncronos

Quando um nó precisa aguardar a conclusão de uma operação externa antes de continuar o fluxo de trabalho (como requisições HTTP, callbacks de pagamento de terceiros ou outras operações demoradas ou que não retornam resultados imediatamente), a tarefa deve ser salva primeiro com o status `JOB_STATUS.PENDING` para suspender a execução atual, e depois retomada via `resume` assim que a operação for concluída. Qualquer instrução que use lógica de suspensão também deve implementar o método `resume`; caso contrário, o fluxo de trabalho não pode ser retomado.

O padrão de implementação recomendado é o seguinte:

```ts
import { Instruction, JOB_STATUS, FlowNodeModel, IJob } from '@nocobase/plugin-workflow';

export class AsyncInstruction extends Instruction {
  async run(node: FlowNodeModel, prevJob, processor) {
    // 1. Save the pending task and record its id
    const { id } = processor.saveJob({
      status: JOB_STATUS.PENDING,
      nodeId: node.id,
      nodeKey: node.key,
      upstreamId: prevJob?.id ?? null,
    });

    // 2. Explicitly call exit() to flush the task to the database and commit the transaction
    await processor.exit();

    // 3. Initiate the async operation (the transaction is now committed, no longer holding the database connection)
    const jobDone: IJob = { status: JOB_STATUS.PENDING };
    try {
      const result = await someAsyncOperation(node.config);
      jobDone.status = JOB_STATUS.RESOLVED;
      jobDone.result = result;
    } catch (error) {
      jobDone.status = JOB_STATUS.FAILED;
      jobDone.result = { message: error.message };
    } finally {
      // 4. Re-query the task from the database; do not use the cached in-memory object
      const job = await this.workflow.app.db.getRepository('jobs').findOne({
        filterByTk: id,
      });
      job.set(jobDone);

      // 5. Notify the workflow engine to resume execution, entering the resume flow
      this.workflow.resume(job);
    }
    // 6. Return nothing (void); the executor will exit immediately
  }

  async resume(node: FlowNodeModel, job, processor) {
    // The job already has its final status set in run(), just return it
    return job;
  }
}
```

Há vários detalhes importantes a observar:

**Por que chamar `processor.exit()` explicitamente em vez de retornar o objeto de tarefa pendente?**
`return { status: PENDING }` encerra imediatamente a função `run`, tornando impossível executar qualquer código posterior. Chamar `await processor.exit()` apenas confirma a transação e sai do contexto do banco de dados, enquanto a função continua sendo executada. Isso permite que você faça `await` de uma operação demorada dentro do mesmo corpo de função e depois chame `resume` quando ela for concluída. Se você ignorar `exit()` e diretamente fizer `await` de uma operação longa antes de retornar, isso mantém a transação do banco de dados aberta por muito tempo, causando contenção de bloqueios, e o registro da tarefa não será persistido até que a transação seja confirmada após a conclusão da operação.

**Por que re-consultar a tarefa em vez de usar o objeto retornado por `saveJob`?**
O objeto retornado por `saveJob` é uma instância de modelo em memória vinculada à transação original. Após a chamada de `processor.exit()`, essa transação foi confirmada e fechada. Modificar diretamente essa instância e chamar `resume` causará anomalias no estado do ORM (referências de transação obsoletas, inconsistências de estado, etc.). Re-consultar do banco de dados pelo `id` garante obter uma instância limpa não vinculada a nenhuma transação.

**Por que a função `run` não retorna nada (`void`)?**
`processor.exit()` já foi chamado manualmente. Quando o executor recebe `void`, ele chama `exit(true)` e sai imediatamente sem nenhum processamento redundante. Se um `IJob` fosse retornado neste ponto, o executor tentaria salvar e confirmar novamente, causando erros. Consulte a seção de tipos de valores de retorno de `run`/`resume` para mais detalhes.

**Para cenários que requerem callbacks externos** (por exemplo, resultados de pagamento notificados via webhook), a mesma abordagem se aplica: chamar `processor.exit()` antes de registrar o callback para garantir que o registro da tarefa esteja no banco de dados antes que o sistema externo chame de volta. No callback, re-consultar a tarefa pelo `id` e depois chamar `this.workflow.resume(job)`.

Para um exemplo completo do mundo real, consulte: [RequestInstruction.ts](https://github.com/nocobase/nocobase/blob/main/packages/plugins/%40nocobase/plugin-workflow-request/src/server/RequestInstruction.ts) (nó de requisição HTTP, que usa este padrão na ramificação de fluxo de trabalho assíncrono)

### Status de Resultado do Nó

O status de execução de um nó afeta o sucesso ou a falha de todo o **fluxo de trabalho**. Geralmente, sem ramificações, a falha de um nó causará diretamente a falha de todo o **fluxo de trabalho**. O cenário mais comum é que, se um nó for executado com sucesso, ele prossegue para o próximo nó na tabela de nós até que não haja mais nós subsequentes, momento em que todo o **fluxo de trabalho** é concluído com um status de sucesso.

Se um nó retornar um status de execução com falha durante a execução, o motor o tratará de forma diferente, dependendo das duas situações a seguir:

1.  O nó que retorna um status de falha está no **fluxo de trabalho** principal, ou seja, não está dentro de nenhum **fluxo de trabalho** de ramificação aberto por um nó upstream. Neste caso, todo o **fluxo de trabalho** principal é considerado falho e o processo é encerrado.

2.  O nó que retorna um status de falha está dentro de um **fluxo de trabalho** de ramificação. Neste caso, a responsabilidade de determinar o próximo status do **fluxo de trabalho** é transferida para o nó que abriu a ramificação. A lógica interna desse nó decidirá o status do **fluxo de trabalho** subsequente, e essa decisão se propagará recursivamente até o **fluxo de trabalho** principal.

No final, o próximo status de todo o **fluxo de trabalho** é determinado nos nós do **fluxo de trabalho** principal. Se um nó no **fluxo de trabalho** principal retornar uma falha, todo o **fluxo de trabalho** termina com um status de falha.

Se qualquer nó retornar um status "pendente" após a execução, todo o processo de execução será temporariamente interrompido e suspenso, aguardando que um evento definido pelo nó correspondente acione a retomada da execução do **fluxo de trabalho**. Por exemplo, o Nó Manual, quando executado, pausará nesse nó com um status "pendente", aguardando intervenção manual para decidir se aprova. Se o status inserido manualmente for de aprovação, os nós subsequentes do **fluxo de trabalho** continuarão; caso contrário, será tratado de acordo com a lógica de falha descrita anteriormente.

Para mais status de retorno de instrução, consulte a seção [Referência da API de **Fluxo de Trabalho**](#).

### Tipos de Valores de Retorno de `run`/`resume` e Comportamento do Executor

A definição completa do tipo de retorno dos métodos `run` e `resume` é:

```ts
type InstructionResult = IJob | Promise<IJob> | Promise<void> | Promise<null> | null | void;
```

Após o executor (`Processor`) chamar uma instrução, ele executa diferentes lógicas de processamento com base no tipo do valor de retorno. Existem três casos.

#### 1. Retornar um Objeto de Tarefa `IJob`

Este é o caso mais comum. Retorne um objeto contendo um campo `status` obrigatório e um campo `result` opcional. O executor o salva como o registro de tarefa do nó e determina o fluxo subsequente com base no valor de `status`:

- `JOB_STATUS.RESOLVED`: Nó executado com sucesso; continua para o próximo nó se houver um, caso contrário o fluxo de trabalho encerra
- `JOB_STATUS.PENDING`: Nó entra em estado suspenso; o contexto de execução atual para, aguardando um evento externo para acionar `resume`
- Outros status de falha (`FAILED`, `ERROR`, etc.): Propagados para o nó pai da ramificação ou termina diretamente todo o fluxo de trabalho

Este caminho é o caminho completo de confirmação de transação — o executor salva o registro de tarefa, escreve no banco de dados e confirma a transação.

Exemplo: [ConditionInstruction.ts](https://github.com/nocobase/nocobase/blob/main/packages/plugins/%40nocobase/plugin-workflow/src/server/instructions/ConditionInstruction.ts) (retorna um objeto `job` diretamente quando não há ramificação; veja o caso `void` abaixo quando há uma ramificação)

#### 2. Retornar `null`

Quando `null` é retornado, o executor chama `processor.exit()` (sem argumento), com o efeito de: **descarregar as tarefas pendentes no banco de dados e confirmar a transação, mas sem atualizar o status de execução geral**.

Este uso é comum no método `resume` de nós de controle de ramificação: uma ramificação foi concluída e o status de tarefa do nó pai precisa ser atualizado e salvo (por exemplo, registrando "ramificação N concluída"), mas outras ramificações ainda estão em execução, e a execução geral deve permanecer no status `STARTED` aguardando as ramificações restantes — retornar `null` sai do contexto de resume atual sem afetar o status de execução geral.

Exemplo: [ParallelInstruction.ts](https://github.com/nocobase/nocobase/blob/main/packages/plugins/%40nocobase/plugin-workflow-parallel/src/server/ParallelInstruction.ts)

- Linha [117](https://github.com/nocobase/nocobase/blob/main/packages/plugins/%40nocobase/plugin-workflow-parallel/src/server/ParallelInstruction.ts#L117): O nó paralelo já foi concluído antecipadamente (resolved/rejected); ignora resumes de ramificações subsequentes e retorna `null` diretamente
- Linha [135](https://github.com/nocobase/nocobase/blob/main/packages/plugins/%40nocobase/plugin-workflow-parallel/src/server/ParallelInstruction.ts#L135): Algumas ramificações ainda estão incompletas (`PENDING`); salva o progresso atual e retorna `null` para continuar aguardando outras ramificações

#### 3. Retornar `void` (sem retorno, ou seja, `undefined` implícito)

Quando `void` é retornado (a função não possui instrução de retorno explícita, ou o caminho de execução termina sem valor de retorno), o executor chama `processor.exit(true)`, com o efeito de **retornar imediatamente sem executar nenhuma operação no banco de dados**.

Este padrão é exclusivamente para **cenários onde a instrução assumiu o controle do agendamento de execução**: a instrução inicia manualmente um subfluxo via `processor.run()`, e a cadeia de execução do subfluxo lidará com as gravações no banco de dados e as confirmações de transação quando for concluída. O executor não deve processar novamente.

Exemplos típicos:

- [ConditionInstruction.ts#L67](https://github.com/nocobase/nocobase/blob/main/packages/plugins/%40nocobase/plugin-workflow/src/server/instructions/ConditionInstruction.ts#L67): Quando existe uma ramificação, chama manualmente `processor.run(branchNode, savedJob)` e então a função termina, retornando `void` implicitamente
- [ParallelInstruction.ts#L108](https://github.com/nocobase/nocobase/blob/main/packages/plugins/%40nocobase/plugin-workflow-parallel/src/server/ParallelInstruction.ts#L108): Itera por todas as ramificações e chama `processor.run(branch, job)` para cada uma, então a função termina, retornando `void` implicitamente

:::warn{title=Atenção}
Se `processor.saveJob()` foi chamado antes de retornar `void`, esses registros de tarefa não serão gravados no banco de dados pelo executor atual. Eles são armazenados temporariamente na lista de tarefas do executor (em memória) e serão descarregados no banco de dados pelo `exit()` acionado quando a sub-execução iniciada por `processor.run()` for concluída. Portanto, ao usar este padrão, você deve garantir que haja um caminho de sub-execução que seja concluído normalmente para persistir esses registros. O agendamento de fluxo de trabalho de ramificação tem certa complexidade; requer design cuidadoso e testes completos.
:::

Comparação resumida dos três valores de retorno:

| Valor de Retorno | Comportamento do Executor | Caso de Uso Típico |
|--------|-----------|------------|
| `IJob` | Salva tarefa, continua/encerra/suspende o fluxo com base em `status` | Execução normal do nó com resultado e status |
| `null` | Descarrega tarefas pendentes e confirma transação, não atualiza o status de execução | Ramificação ainda aguardando, sai temporariamente do contexto de execução atual |
| `void` | Retorna imediatamente, sem operações no BD | Nó agendou um subfluxo, deixando o subfluxo assumir o processamento subsequente |

### Saiba Mais

Para as definições dos vários parâmetros para a definição de tipos de nós, consulte a seção [Referência da API de **Fluxo de Trabalho**](#).

## Lado do Cliente

Assim como os gatilhos, o formulário de configuração para uma instrução (tipo de nó) precisa ser implementado no *client-side* (lado do cliente).

### A Instrução de Nó Mais Simples

Todas as instruções precisam ser derivadas da classe base `Instruction`. As propriedades e métodos relacionados são usados para configurar e utilizar o nó.

Por exemplo, se precisarmos fornecer uma interface de configuração para o nó do tipo string de número aleatório (`randomString`) definido no lado do servidor acima, que possui um item de configuração `digit` representando o número de dígitos para o número aleatório, usaríamos uma caixa de entrada numérica no formulário de configuração para receber a entrada do usuário.

```tsx pure
import WorkflowPlugin, { Instruction, VariableOption } from '@nocobase/workflow/client';

class MyInstruction extends Instruction {
  title = 'Random number string';
  type = 'randomString';
  group = 'extended';
  fieldset = {
    'digit': {
      type: 'number',
      title: 'Digit',
      name: 'digit',
      'x-decorator': 'FormItem',
      'x-component': 'InputNumber',
      'x-component-props': {
        min: 1,
        max: 10,
      },
      default: 6,
    },
  };
  useVariables(node, options): VariableOption {
    return {
      value: node.key,
      label: node.title,
    };
  }
}

export default class MyPlugin extends Plugin {
  load() {
    // get workflow plugin instance
    const workflowPlugin = this.app.getPlugin<WorkflowPlugin>(WorkflowPlugin);

    // register instruction
    workflowPlugin.registerInstruction('randomString', MyInstruction);
  }
}
```

:::info{title=Dica}
O identificador do tipo de nó registrado no lado do cliente deve ser consistente com o do lado do servidor, caso contrário, causará erros.
:::

### Fornecendo Resultados do Nó como Variáveis

Você pode notar o método `useVariables` no exemplo acima. Se você precisar usar o resultado do nó (a parte `result`) como uma variável para nós subsequentes, precisará implementar este método na classe de instrução herdada e retornar um objeto que esteja em conformidade com o tipo `VariableOption`. Este objeto serve como uma descrição estrutural do resultado da execução do nó, fornecendo mapeamento de nomes de variáveis para seleção e uso em nós subsequentes.

O tipo `VariableOption` é definido da seguinte forma:

```ts
export type VariableOption = {
  value?: string;
  label?: string;
  children?: VariableOption[] | null;
  [key: string]: any;
};
```

O cerne é a propriedade `value`, que representa o valor do caminho segmentado do nome da variável. `label` é usado para exibição na interface, e `children` é usado para representar uma estrutura de variável multinível, utilizada quando o resultado do nó é um objeto profundamente aninhado.

Uma variável utilizável é representada internamente no sistema como uma *string* de modelo de caminho separada por `.`, por exemplo, `{{jobsMapByNodeKey.2dw92cdf.abc}}`. Aqui, `jobsMapByNodeKey` representa o conjunto de resultados de todos os nós (definido internamente, sem necessidade de manipulação), `2dw92cdf` é a `key` do nó, e `abc` é uma propriedade personalizada no objeto de resultado do nó.

Além disso, como o resultado de um nó também pode ser um valor simples, ao fornecer variáveis de nó, o primeiro nível **deve** ser a descrição do próprio nó:

```ts
{
  value: node.key,
  label: node.title,
}
```

Ou seja, o primeiro nível é a `key` e o título do nó. Por exemplo, na [referência de código](https://github.com/nocobase/nocobase/blob/main/packages/plugins/%40nocobase/plugin-workflow/src/client/nodes/calculation.tsx#L77) do nó de cálculo, ao usar o resultado do nó de cálculo, as opções da interface são as seguintes:

![Resultado do Nó de Cálculo](https://static-docs.nocobase.com/20240514230014.png)

Quando o resultado do nó é um objeto complexo, você pode usar `children` para continuar descrevendo propriedades aninhadas. Por exemplo, uma instrução personalizada pode retornar os seguintes dados JSON:

```json
{
  "message": "ok",
  "data": {
    "id": 1,
    "name": "test",
  }
}
```

Então você pode retorná-lo através do método `useVariables` da seguinte forma:

```ts
useVariables(node, options): VariableOption {
  return {
    value: node.key,
    label: node.title,
    children: [
      {
        value: 'message',
        label: 'Message',
      },
      {
        value: 'data',
        label: 'Data',
        children: [
          {
            value: 'id',
            label: 'ID',
          },
          {
            value: 'name',
            label: 'Name',
          },
        ],
      },
    ],
  };
}
```

Dessa forma, em nós subsequentes, você pode usar a seguinte interface para selecionar variáveis:

![Variáveis de Resultado Mapeadas](https://static-docs.nocobase.com/20240514230103.png)

:::info{title="Dica"}
Quando uma estrutura no resultado é um *array* de objetos profundamente aninhados, você também pode usar `children` para descrever o caminho, mas não pode incluir índices de *array*. Isso ocorre porque no tratamento de variáveis do **fluxo de trabalho** do NocoBase, a descrição do caminho da variável para um *array* de objetos é automaticamente nivelada em um *array* de valores profundos quando usada, e você não pode acessar um valor específico pelo seu índice.
:::

### Disponibilidade do Nó

Por padrão, qualquer nó pode ser adicionado a um **fluxo de trabalho**. No entanto, em alguns casos, um nó pode não ser aplicável em certos tipos de **fluxos de trabalho** ou ramificações. Nessas situações, você pode configurar a disponibilidade do nó usando `isAvailable`:

```ts
// Definição de Tipo
export abstract class Instruction {
  isAvailable?(ctx: NodeAvailableContext): boolean;
}

export type NodeAvailableContext = {
  // Instância do plugin de fluxo de trabalho
  engine: WorkflowPlugin;
  // Instância do fluxo de trabalho
  workflow: object;
  // Nó upstream
  upstream: object;
  // Se é um nó de ramificação (número da ramificação)
  branchIndex: number;
};
```

O método `isAvailable` retorna `true` se o nó estiver disponível e `false` se não estiver. O parâmetro `ctx` contém as informações de contexto do nó atual, que podem ser usadas para determinar sua disponibilidade.

Se não houver requisitos especiais, você não precisa implementar o método `isAvailable`, pois os nós estão disponíveis por padrão. O cenário mais comum que exige configuração é quando um nó pode ser uma operação demorada e não é adequado para execução em um **fluxo de trabalho** síncrono. Você pode usar o método `isAvailable` para restringir seu uso. Por exemplo:

```ts
isAvailable({ engine, workflow, upstream, branchIndex }) {
  return !engine.isWorkflowSync(workflow);
}
```

### Saiba Mais

Para as definições dos vários parâmetros para a definição de tipos de nós, consulte a seção [Referência da API de **Fluxo de Trabalho**](#).