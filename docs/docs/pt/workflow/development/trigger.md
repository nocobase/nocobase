---
title: "Estendendo tipos de gatilho"
description: "Estendendo tipos de gatilho: desenvolvimento de gatilhos personalizados, interface de configuração, lógica de acionamento, referência da API."
keywords: "fluxo de trabalho,extensão de gatilhos,gatilhos personalizados,desenvolvimento de gatilhos,NocoBase"
---

# Estendendo Tipos de Gatilho

Todo fluxo de trabalho precisa ser configurado com um gatilho específico, que serve como ponto de entrada para iniciar a execução do processo.

Um tipo de gatilho geralmente representa um evento específico do ambiente do sistema. Durante o ciclo de vida de execução do aplicativo, qualquer parte que forneça eventos que possam ser assinados pode ser usada para definir um tipo de gatilho. Por exemplo, receber requisições, operações de coleção, tarefas agendadas, etc.

Os tipos de gatilho são registrados na tabela de gatilhos do plugin com base em um identificador de string. O plugin de fluxo de trabalho já vem com alguns gatilhos embutidos:

- `'collection'`: Acionado por operações de coleção;
- `'schedule'`: Acionado por tarefas agendadas;
- `'action'`: Acionado por eventos pós-ação;


Tipos de gatilho estendidos precisam garantir que seus identificadores sejam únicos. A implementação para assinar/cancelar a assinatura do gatilho é registrada no lado do servidor, e a implementação para a interface de configuração é registrada no lado do cliente.

## Lado do Servidor

Qualquer gatilho precisa herdar da classe base `Trigger` e implementar os métodos `on`/`off`, que são usados para assinar e cancelar a assinatura de eventos específicos do ambiente, respectivamente. No método `on`, você precisa chamar `this.workflow.trigger()` dentro da função de callback do evento específico para, finalmente, acionar o evento. Já no método `off`, você precisa realizar o trabalho de limpeza relacionado ao cancelamento da assinatura.

O `this.workflow` é a instância do plugin de fluxo de trabalho passada para o construtor da classe base `Trigger`.

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

Depois, no plugin que estende o fluxo de trabalho, registre a instância do gatilho no motor do fluxo de trabalho:

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

A parte do lado do cliente fornece principalmente uma interface de configuração baseada nos itens de configuração exigidos pelo tipo de gatilho. Cada tipo de gatilho também precisa registrar sua configuração de tipo correspondente com o plugin de fluxo de trabalho.

A interface de configuração do gatilho é definida através de um Loader (função de carregamento lazy), que aponta para um componente React puro que constrói o formulário usando o `Form.Item` do antd.

### O Gatilho Mais Simples

Por exemplo, para o gatilho de temporizador de intervalo descrito acima, defina o item de configuração de tempo de intervalo (`interval`) necessário no formulário da interface de configuração:

```ts
import { Trigger } from '@nocobase/plugin-workflow/client-v2';

class MyTrigger extends Trigger {
  title = 'Interval timer trigger';

  // Trigger config form (lazy-loaded component)
  FieldsetLoader = () => import('./IntervalConfig');

  // Config validation
  validate(config) {
    return Boolean(config?.interval);
  }
}
```

Aqui, `FieldsetLoader` é uma função que retorna `Promise<{ default: ComponentType }>`, implementando o carregamento lazy via `import()` dinâmico. O componente para o qual aponta é um componente funcional React padrão:

```tsx
// IntervalConfig.tsx
import { Form, InputNumber } from 'antd';

export default function IntervalConfig() {
  return (
    <Form.Item
      name={['config', 'interval']}
      label="Interval"
      initialValue={60000}
      rules={[{ required: true }]}
    >
      <InputNumber min={1000} />
    </Form.Item>
  );
}
```

Observe que o `name` do campo do formulário usa o formato de array aninhado `['config', 'fieldName']`, que é a convenção padrão do antd Form.

### Múltiplas Interfaces de Configuração

Um gatilho pode fornecer múltiplas interfaces de configuração para diferentes cenários:

- `PresetFieldsetLoader` — Formulário predefinido ao criar um fluxo de trabalho (geralmente contém apenas os campos obrigatórios)
![PresetFieldsetLoader](https://static-docs.nocobase.com/20260701152711.png)

- `FieldsetLoader` — Formulário completo de configuração do gatilho (exibido na gaveta de configuração)
![FieldsetLoader](https://static-docs.nocobase.com/20260701152822.png)

- `TriggerFieldsetLoader` — Formulário de entrada para execução manual
![FieldsetLoader](https://static-docs.nocobase.com/20260701152846.png)

Quando um Loader precisa apontar para uma exportação nomeada (em vez da exportação padrão) em um arquivo, use `.then()` para remapear:

```ts
class MyTrigger extends Trigger {
  title = 'My trigger';

  PresetFieldsetLoader = () =>
    import('./MyTriggerConfig').then((m) => ({ default: m.MyPresetConfig }));
  FieldsetLoader = () => import('./MyTriggerConfig');
  TriggerFieldsetLoader = () => import('./TriggerMyConfig');

  validate(config) {
    return Boolean(config?.collection && config?.mode);
  }

  createDefaultConfig() {
    return { mode: 1 };
  }
}
```

```tsx
// MyTriggerConfig.tsx
import { Form, Select } from 'antd';
import { CollectionCascader } from '@nocobase/plugin-workflow/client-v2';

// Preset form for creation (named export)
export function MyPresetConfig() {
  return (
    <Form.Item name={['config', 'collection']} label="Collection" rules={[{ required: true }]}>
      <CollectionCascader />
    </Form.Item>
  );
}

// Full config form (default export)
export default function MyTriggerConfig() {
  return (
    <>
      <Form.Item name={['config', 'collection']} label="Collection">
        <CollectionCascader disabled />
      </Form.Item>
      <Form.Item name={['config', 'mode']} label="Mode">
        <Select
          options={[
            { label: 'Created', value: 1 },
            { label: 'Updated', value: 2 },
          ]}
        />
      </Form.Item>
    </>
  );
}
```

### Registrar o Gatilho

Registre o tipo de gatilho com a instância do plugin de fluxo de trabalho dentro do plugin estendido:

```ts
import { Plugin } from '@nocobase/client-v2';
import MyTrigger from './MyTrigger';

export default class extends Plugin {
  async load() {
    const workflow = this.app.pm.get('workflow');
    workflow.registerTrigger('interval', MyTrigger);
  }
}
```

Depois disso, o novo tipo de gatilho ficará visível na interface de configuração do fluxo de trabalho.

:::info{title=Nota}
O identificador do tipo de gatilho registrado no lado do cliente deve ser consistente com o do lado do servidor, caso contrário, causará erros.
:::

Para um exemplo completo do mundo real, consulte: [Código-fonte do CollectionTrigger](https://github.com/nocobase/nocobase/blob/develop/packages/plugins/%40nocobase/plugin-workflow/src/client-v2/triggers/collection/index.tsx)

Para outros detalhes sobre a definição de tipos de gatilho, consulte a seção [Referência da API do Fluxo de Trabalho](./api).

:::info{title=Nota}
Se você estava usando o código do lado do cliente legado (v1) e deseja migrar para a nova versão v2, consulte o [Guia de Migração de v1 para v2](./migration).
:::
