:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Estender Tipos de Gatilho

Todo fluxo de trabalho precisa ser configurado com um gatilho específico, que serve como ponto de entrada para iniciar a execução do processo.

Um tipo de gatilho geralmente representa um evento específico do ambiente do sistema. Durante o ciclo de vida de execução do aplicativo, qualquer parte que forneça eventos que possam ser inscritos pode ser usada para definir um tipo de gatilho. Por exemplo, receber requisições, operações de **coleção**, tarefas agendadas, etc.

Os tipos de gatilho são registrados na tabela de gatilhos do **plugin** com base em um identificador de string. O **plugin** de **fluxo de trabalho** já vem com alguns gatilhos embutidos:

- `'collection'`: Acionado por operações de **coleção**;
- `'schedule'`: Acionado por tarefas agendadas;
- `'action'`: Acionado por eventos pós-ação;

Tipos de gatilho estendidos precisam garantir que seus identificadores sejam únicos. A implementação para assinar/cancelar a assinatura do gatilho é registrada no lado do servidor, e a implementação para a interface de configuração é registrada no lado do cliente.

## Lado do Servidor

Qualquer gatilho precisa herdar da classe base `Trigger` e implementar os métodos `on`/`off`, que são usados para assinar e cancelar a assinatura de eventos específicos do ambiente, respectivamente. No método `on`, você precisa chamar `this.workflow.trigger()` dentro da função de callback do evento específico para, finalmente, acionar o evento. Já no método `off`, você precisa realizar o trabalho de limpeza relacionado ao cancelamento da assinatura.

O `this.workflow` é a instância do **plugin** de **fluxo de trabalho** passada para o construtor da classe base `Trigger`.

```ts
import { Trigger } from '@nocobase/plugin-workflow';

class MyTrigger extends Trigger {
  timer: NodeJS.Timeout;

  on(workflow) {
    // register event
    this.timer = setInterval(() => {
      // trigger workflow
      this.workflow.trigger(workflow, { date: new Date() });
    }, workflow.config.interval ?? 60000);
  }

  off(workflow) {
    // unregister event
    clearInterval(this.timer);
  }
}
```

Depois, no **plugin** que estende o **fluxo de trabalho**, registre a instância do gatilho no motor do **fluxo de trabalho**:

```ts
import WorkflowPlugin from '@nocobase/plugin-workflow';

export default class MyPlugin extends Plugin {
  load() {
    // get workflow plugin instance
    const workflowPlugin = this.app.pm.get(WorkflowPlugin) as WorkflowPlugin;

    // register trigger
    workflowPlugin.registerTrigger('interval', MyTrigger);
  }
}
```

Após o servidor iniciar e carregar, o gatilho do tipo `'interval'` poderá ser adicionado e executado.

## Lado do Cliente

A parte do lado do cliente principalmente fornece uma interface de configuração baseada nos itens de configuração exigidos pelo tipo de gatilho. Cada tipo de gatilho também precisa registrar sua configuração de tipo correspondente com o **plugin** de **fluxo de trabalho**.

Por exemplo, para o gatilho de execução agendada mencionado acima, defina o item de configuração de tempo de intervalo (`interval`) necessário no formulário da interface de configuração:

```ts
import { Trigger } from '@nocobase/workflow/client';

class MyTrigger extends Trigger {
  title = 'Interval timer trigger';
  // fields of trigger config
  fieldset = {
    interval: {
      type: 'number',
      title: 'Interval',
      name: 'config.interval',
      'x-decorator': 'FormItem',
      'x-component': 'InputNumber',
      default: 60000,
    },
  };
}
```

Em seguida, registre este tipo de gatilho com a instância do **plugin** de **fluxo de trabalho** dentro do **plugin** estendido:

```ts
import { Plugin } from '@nocobase/client';
import WorkflowPlugin from '@nocobase/plugin-workflow/client';

import MyTrigger from './MyTrigger';

export default class extends Plugin {
  // You can get and modify the app instance here
  async load() {
    const workflow = this.app.pm.get(WorkflowPlugin) as WorkflowPlugin;
    workflow.registerTrigger('interval', MyTrigger);
  }
}
```

Depois disso, o novo tipo de gatilho ficará visível na interface de configuração do **fluxo de trabalho**.

:::info{title=Dica}
O identificador do tipo de gatilho registrado no lado do cliente deve ser consistente com o do lado do servidor, caso contrário, causará erros.
:::

Para outros detalhes sobre a definição de tipos de gatilho, consulte a seção [Referência da API de Fluxo de Trabalho](./api#pluginregisterTrigger).