---
title: "Guia de migração v1 para v2"
description: "Desenvolvimento de extensões de fluxo de trabalho: guia para migrar código do lado do cliente de v1 para v2."
keywords: "fluxo de trabalho,migração,v1,v2,NocoBase"
---

# Guia de Migração de v1 para v2 no Lado do Cliente

Este guia descreve como migrar o código do lado do cliente de um plugin de extensão de fluxo de trabalho de v1 para v2. A mudança principal no cliente v2 é a substituição das UIs de configuração declarativas com Formily Schema por uma abordagem de Loader + componentes puros React/antd.

## Visão Geral

### Principais Mudanças

1. **Mudanças nos caminhos de importação**: `@nocobase/plugin-workflow/client` → `@nocobase/plugin-workflow/client-v2`, classe base do plugin `@nocobase/client` → `@nocobase/client-v2`
2. **Mudanças no padrão de UI de configuração**: De objetos Formily Schema (`fieldset`) para componentes React carregados via Loader com lazy loading (`FieldsetLoader`)
3. **Propriedades `scope`/`components` removidas**: Não é mais necessário injetar objetos de escopo ou componentes no Schema; simplesmente importe e use-os diretamente nos componentes React

### Mapeamento de caminhos de importação

```ts
// v1
import { Plugin } from '@nocobase/client';
import WorkflowPlugin, { Trigger, Instruction } from '@nocobase/plugin-workflow/client';

// v2
import { Plugin } from '@nocobase/client-v2';
import WorkflowPlugin, { Trigger, Instruction } from '@nocobase/plugin-workflow/client-v2';
```

## Regras Gerais

### Padrão Loader

O v2 usa propriedades do tipo `LoaderOf` para substituir o `fieldset` e outros objetos Formily Schema do v1. Um Loader é essencialmente uma função que retorna `Promise<{ default: ComponentType }>`, habilitando divisão de código e carregamento lazy via `import()` dinâmico:

```ts
// v1: Formily Schema object
fieldset = {
  interval: {
    type: 'number',
    title: 'Interval',
    'x-decorator': 'FormItem',
    'x-component': 'InputNumber',
    default: 60000,
  },
};

// v2: Loader pointing to a React component
FieldsetLoader = () => import('./MyConfig');
```

Se você precisar apontar para uma exportação nomeada (em vez da exportação padrão), use `.then()` para remapear:

```ts
FieldsetLoader = () => import('./MyConfig').then((m) => ({ default: m.MyPresetConfig }));
```

### Sintaxe do componente de configuração

O componente carregado por um Loader é um componente funcional React padrão que usa o `Form.Item` do antd para construir formulários. Os caminhos dos campos usam consistentemente o formato de array aninhado `['config', 'fieldName']`:

```tsx
// v1: Formily Schema
fieldset = {
  interval: {
    type: 'number',
    title: '{{t("Interval")}}',
    name: 'config.interval',
    'x-decorator': 'FormItem',
    'x-component': 'InputNumber',
    default: 60000,
  },
};

// v2: React component
import { Form, InputNumber } from 'antd';

export default function MyConfig() {
  const { t } = useWorkflowTranslation();

  return (
    <Form.Item
      name={['config', 'interval']}
      label={t('Interval')}
      initialValue={60000}
    >
      <InputNumber />
    </Form.Item>
  );
}
```

## Migração de Gatilhos

### Tabela de mapeamento de propriedades

| Propriedade v1 | Propriedade v2 | Descrição |
|---------|---------|------|
| `fieldset` | `FieldsetLoader` | Formulário de configuração do gatilho |
| `presetFieldset` | `PresetFieldsetLoader` | Formulário predefinido na criação |
| `triggerFieldset` | `TriggerFieldsetLoader` | Formulário de entrada para execução manual |
| `scope` | Removido | Não é mais necessário; importe diretamente no componente |
| `components` | Removido | Não é mais necessário; importe diretamente no componente |
| `view` | Removido | |
| — | `validate(config)` | Novo; validação da configuração |
| — | `createDefaultConfig()` | Novo; fornece valores de configuração padrão |

### Exemplo de migração

**Sintaxe v1:**

```ts
import { Trigger } from '@nocobase/plugin-workflow/client';

class MyTrigger extends Trigger {
  title = '{{t("My Trigger")}}';
  fieldset = {
    collection: {
      type: 'string',
      title: '{{t("Collection")}}',
      'x-decorator': 'FormItem',
      'x-component': 'CollectionSelect',
      required: true,
    },
    mode: {
      type: 'number',
      title: '{{t("Mode")}}',
      'x-decorator': 'FormItem',
      'x-component': 'Select',
      'x-component-props': {
        options: [
          { label: '{{t("Created")}}', value: 1 },
          { label: '{{t("Updated")}}', value: 2 },
        ],
      },
    },
  };
  scope = { /* ... */ };
  components = { CollectionSelect };
}
```

**Sintaxe v2:**

```ts
import { Trigger } from '@nocobase/plugin-workflow/client-v2';

class MyTrigger extends Trigger {
  title = '{{t("My Trigger")}}';

  PresetFieldsetLoader = () =>
    import('./MyTriggerConfig').then((m) => ({ default: m.MyPresetConfig }));
  FieldsetLoader = () => import('./MyTriggerConfig');
  TriggerFieldsetLoader = () => import('./TriggerMyConfig');

  validate(config) {
    return Boolean(config?.collection && config?.mode);
  }
}
```

```tsx
// MyTriggerConfig.tsx
import { Form, Select } from 'antd';
import { CollectionCascader } from '@nocobase/plugin-workflow/client-v2';

export function MyPresetConfig() {
  return (
    <Form.Item name={['config', 'collection']} label="Collection" rules={[{ required: true }]}>
      <CollectionCascader />
    </Form.Item>
  );
}

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

### Registro do plugin

```ts
// v1
import { Plugin } from '@nocobase/client';
import WorkflowPlugin from '@nocobase/plugin-workflow/client';

export default class extends Plugin {
  async load() {
    const workflow = this.app.pm.get(WorkflowPlugin);
    workflow.registerTrigger('myTrigger', MyTrigger);
  }
}

// v2
import { Plugin } from '@nocobase/client-v2';

export default class extends Plugin {
  async load() {
    const workflow = this.app.pm.get('workflow');
    workflow.registerTrigger('myTrigger', MyTrigger);
  }
}
```

## Migração de Nós

### Tabela de mapeamento de propriedades

| Propriedade v1 | Propriedade v2 | Descrição |
|---------|---------|------|
| `fieldset` | `FieldsetLoader` | Formulário da gaveta de configuração do nó |
| `presetFieldset` | `PresetFieldsetLoader` | Formulário predefinido na criação |
| `Component` | `ComponentLoader` | Renderização personalizada do nó no canvas |
| `scope` | Removido | Não é mais necessário; importe diretamente no componente |
| `components` | Removido | Não é mais necessário; importe diretamente no componente |
| `view` | Removido | |
| — | `createDefaultConfig()` | Novo; fornece valores de configuração padrão |

### Exemplo de migração

**Sintaxe v1:**

```ts
import WorkflowPlugin, { Instruction } from '@nocobase/plugin-workflow/client';

class MyInstruction extends Instruction {
  title = 'Random string';
  type = 'randomString';
  group = 'extended';
  fieldset = {
    digit: {
      type: 'number',
      title: 'Digit',
      name: 'digit',
      'x-decorator': 'FormItem',
      'x-component': 'InputNumber',
      'x-component-props': { min: 1, max: 10 },
      default: 6,
    },
  };
  useVariables(node, options) {
    return { value: node.key, label: node.title };
  }
}
```

**Sintaxe v2:**

```ts
import { Instruction } from '@nocobase/plugin-workflow/client-v2';

class MyInstruction extends Instruction {
  title = 'Random string';
  type = 'randomString';
  group = 'extended';

  FieldsetLoader = () => import('./components/RandomStringConfig');

  useVariables(node, options) {
    return { value: node.key, label: node.title };
  }
}
```

```tsx
// components/RandomStringConfig.tsx
import { Form, InputNumber } from 'antd';

export default function RandomStringConfig() {
  return (
    <Form.Item
      name={['config', 'digit']}
      label="Digit"
      initialValue={6}
      rules={[{ required: true }]}
    >
      <InputNumber min={1} max={10} />
    </Form.Item>
  );
}
```

## Outras Observações

### Partes inalteradas

As seguintes propriedades e métodos possuem essencialmente as mesmas assinaturas em v1 e v2, e podem ser mantidos como estão durante a migração:

- `useVariables(node/config, options)` — Fornece opções de variáveis
- `useScopeVariables(node, options)` — Fornece variáveis com escopo de ramificação
- `isAvailable(ctx)` — Verificação de disponibilidade do nó (o `NodeAvailableContext` do v2 adiciona uma nova propriedade `engine`)

### Novas propriedades no v2

- `getCreateModelMenuItem` — Define a configuração para criar itens de menu de sub-modelo para nós/gatilhos no canvas v2
- `useTempAssociationSource` — Fornece informações de fonte de dados de associação temporária
- `validate(config)` — Validação da configuração do gatilho (somente gatilhos)
- `branching` — Declara se o nó é um nó de ramificação (somente nós)
- `end` — Declara se o nó é um nó terminal (somente nós)
- `testable` — Declara se o nó suporta execuções de teste (somente nós)

### Consistência semântica dos valores

Ao migrar, certifique-se de que os valores de formulário produzidos pelos componentes v2 sejam consistentes com os do v1, especialmente o formato do payload durante a execução manual. Por exemplo, se o formulário de execução manual do v1 armazena um objeto de registro completo, a versão v2 deve manter a mesma estrutura de valor em vez de armazenar apenas a chave primária.
