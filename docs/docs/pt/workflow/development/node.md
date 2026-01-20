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

Quando você precisa de controle de **fluxo de trabalho** ou operações de I/O assíncronas (demoradas), o método `run` pode retornar um objeto com um `status` de `JOB_STATUS.PENDING`, instruindo o executor a esperar (suspender) até que alguma operação assíncrona externa seja concluída. Em seguida, ele notifica o motor do **fluxo de trabalho** para continuar a execução. Se um valor de status pendente for retornado na função `run`, a instrução deve implementar o método `resume`; caso contrário, a execução do **fluxo de trabalho** não poderá ser retomada:

```ts
import { Instruction, JOB_STATUS } from '@nocobase/plugin-workflow';

export class PayInstruction extends Instruction {
  async run(node, input, processor) {
    // job could be create first via processor
    const job = await processor.saveJob({
      status: JOB_STATUS.PENDING,
    });

    const { workflow } = processor;
    // do payment asynchronously
    paymentService.pay(node.config, (result) => {
      // notify processor to resume the job
      return workflow.resume(job.id, result);
    });

    // return created job instance
    return job;
  }

  resume(node, job, processor) {
    // check payment status
    job.set('status', job.result.status === 'ok' ? JOB_STATUS.RESOVLED : JOB_STATUS.REJECTED);
    return job;
  },
};
```

Aqui, `paymentService` refere-se a um serviço de pagamento. No *callback* do serviço, o **fluxo de trabalho** é acionado para retomar a execução da tarefa correspondente, e o processo atual é encerrado primeiro. Posteriormente, o motor do **fluxo de trabalho** cria um novo processador e o passa para o método `resume` do nó para continuar executando o nó que estava suspenso.

:::info{title=Dica}
A "operação assíncrona" mencionada aqui não se refere a funções `async` em JavaScript, mas sim a operações de retorno não instantâneo ao interagir com outros sistemas externos, como um serviço de pagamento que precisa aguardar outra notificação para saber o resultado.
:::

### Status de Resultado do Nó

O status de execução de um nó afeta o sucesso ou a falha de todo o **fluxo de trabalho**. Geralmente, sem ramificações, a falha de um nó causará diretamente a falha de todo o **fluxo de trabalho**. O cenário mais comum é que, se um nó for executado com sucesso, ele prossegue para o próximo nó na tabela de nós até que não haja mais nós subsequentes, momento em que todo o **fluxo de trabalho** é concluído com um status de sucesso.

Se um nó retornar um status de execução com falha durante a execução, o motor o tratará de forma diferente, dependendo das duas situações a seguir:

1.  O nó que retorna um status de falha está no **fluxo de trabalho** principal, ou seja, não está dentro de nenhum **fluxo de trabalho** de ramificação aberto por um nó upstream. Neste caso, todo o **fluxo de trabalho** principal é considerado falho e o processo é encerrado.

2.  O nó que retorna um status de falha está dentro de um **fluxo de trabalho** de ramificação. Neste caso, a responsabilidade de determinar o próximo status do **fluxo de trabalho** é transferida para o nó que abriu a ramificação. A lógica interna desse nó decidirá o status do **fluxo de trabalho** subsequente, e essa decisão se propagará recursivamente até o **fluxo de trabalho** principal.

No final, o próximo status de todo o **fluxo de trabalho** é determinado nos nós do **fluxo de trabalho** principal. Se um nó no **fluxo de trabalho** principal retornar uma falha, todo o **fluxo de trabalho** termina com um status de falha.

Se qualquer nó retornar um status "pendente" após a execução, todo o processo de execução será temporariamente interrompido e suspenso, aguardando que um evento definido pelo nó correspondente acione a retomada da execução do **fluxo de trabalho**. Por exemplo, o Nó Manual, quando executado, pausará nesse nó com um status "pendente", aguardando intervenção manual para decidir se aprova. Se o status inserido manualmente for de aprovação, os nós subsequentes do **fluxo de trabalho** continuarão; caso contrário, será tratado de acordo com a lógica de falha descrita anteriormente.

Para mais status de retorno de instrução, consulte a seção [Referência da API de **Fluxo de Trabalho**](#).

### Saída Antecipada

Em alguns **fluxos de trabalho** especiais, pode ser necessário encerrar o **fluxo de trabalho** diretamente dentro de um nó. Você pode retornar `null` para indicar a saída do **fluxo de trabalho** atual, e os nós subsequentes não serão executados.

Essa situação é comum em nós do tipo controle de **fluxo de trabalho**, como o Nó de Ramificação Paralela ([referência de código](https://github.com/nocobase/nocobase/blob/main/packages/plugins/%40nocobase/plugin-workflow-parallel/src/server/ParallelInstruction.ts#L87)), onde o **fluxo de trabalho** do nó atual é encerrado, mas novos **fluxos de trabalho** são iniciados para cada sub-ramificação e continuam a ser executados.

:::warn{title=Atenção}
O agendamento de **fluxos de trabalho** de ramificação com nós estendidos possui certa complexidade e requer manuseio cuidadoso e testes completos.
:::

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