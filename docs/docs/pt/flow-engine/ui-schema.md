---
title: "UI Schema"
description: "Referência da sintaxe de UI Schema do NocoBase: protocolo de descrição de componentes baseado no Formily Schema, com explicação de type, x-component, x-decorator, x-pattern e outras propriedades."
keywords: "UI Schema,uiSchema,Formily,x-component,x-decorator,x-pattern,x-display,NocoBase"
---

# UI Schema

UI Schema é o protocolo que o NocoBase utiliza para descrever componentes de front-end. Ele é baseado no [Formily Schema 2.0](https://react.formilyjs.org/api/shared/schema), com um estilo semelhante ao JSON Schema. No FlowEngine, o campo `uiSchema` de `registerFlow` usa essa mesma sintaxe para definir a UI do painel de configurações.

```ts
interface ISchema {
  type: 'void' | 'string' | 'number' | 'object' | 'array';
  name?: string;
  title?: any;
  // Componente wrapper
  ['x-decorator']?: string;
  // Propriedades do componente wrapper
  ['x-decorator-props']?: any;
  // Componente
  ['x-component']?: string;
  // Propriedades do componente
  ['x-component-props']?: any;
  // Estado de exibição, padrão 'visible'
  ['x-display']?: 'none' | 'hidden' | 'visible';
  // Conteúdo filho do componente
  ['x-content']?: any;
  // schema dos nós filhos
  properties?: Record<string, ISchema>;

  // As propriedades abaixo são utilizadas apenas para componentes de campo

  // Reações de campo
  ['x-reactions']?: SchemaReactions;
  // Modo de interação UI do campo, padrão 'editable'
  ['x-pattern']?: 'editable' | 'disabled' | 'readPretty';
  // Validação do campo
  ['x-validator']?: Validator;
  // Dado padrão
  default?: any;
}
```

## Uso básico

### O componente mais simples

Todas as tags HTML nativas podem ser convertidas para a sintaxe schema:

```ts
{
  type: 'void',
  'x-component': 'h1',
  'x-content': 'Hello, world!',
}
```

Equivale ao JSX:

```tsx
<h1>Hello, world!</h1>
```

### Componentes filhos

Componentes filhos (children) são escritos em `properties`:

```ts
{
  type: 'void',
  'x-component': 'div',
  'x-component-props': { className: 'form-item' },
  properties: {
    title: {
      type: 'string',
      'x-component': 'input',
    },
  },
}
```

Equivale ao JSX:

```tsx
<div className={'form-item'}>
  <input name={'title'} />
</div>
```

## Descrição das propriedades

### type

O tipo do nó:

```ts
type SchemaTypes = 'string' | 'object' | 'array' | 'number' | 'boolean' | 'void';
```

### name

O nome do schema. O name de um nó filho é a key dentro de `properties`:

```ts
{
  name: 'root',
  properties: {
    child1: {
      // Aqui não é necessário escrever o name novamente
    },
  },
}
```

### title

Título do nó, geralmente usado como rótulo de campo de formulário.

### x-component

Nome do componente. Pode ser uma tag HTML nativa ou um componente React registrado:

```ts
{
  type: 'void',
  'x-component': 'h1',
  'x-content': 'Hello, world!',
}
```

### x-component-props

Propriedades do componente:

```ts
{
  type: 'void',
  'x-component': 'Table',
  'x-component-props': {
    loading: true,
  },
}
```

### x-decorator

Componente wrapper. A combinação `x-decorator` + `x-component` permite colocar dois componentes em um único nó schema, reduzindo a complexidade da estrutura e aumentando a reusabilidade.

Por exemplo, em um cenário de formulário, `FormItem` é o decorator:

```ts
{
  type: 'void',
  'x-component': 'div',
  properties: {
    title: {
      type: 'string',
      'x-decorator': 'FormItem',
      'x-component': 'Input',
    },
    content: {
      type: 'string',
      'x-decorator': 'FormItem',
      'x-component': 'Input.TextArea',
    },
  },
}
```

Equivale ao JSX:

```tsx
<div>
  <FormItem>
    <Input name={'title'} />
  </FormItem>
  <FormItem>
    <Input.TextArea name={'content'} />
  </FormItem>
</div>
```

### x-display

Estado de exibição do componente:

| Valor | Descrição |
|----|------|
| `'visible'` | Exibe o componente (padrão) |
| `'hidden'` | Oculta o componente, mas mantém os dados |
| `'none'` | Oculta o componente e os dados |

### x-pattern

Modo de interação do componente de campo:

| Valor | Descrição |
|----|------|
| `'editable'` | Editável (padrão) |
| `'disabled'` | Não editável |
| `'readPretty'` | Modo de leitura amigável — por exemplo, um componente de texto de linha única é `<input />` no modo de edição e `<div />` no modo de leitura amigável |

## Uso em registerFlow

No desenvolvimento de plugins, o uiSchema é principalmente utilizado no painel de configuração de `registerFlow`. Cada campo geralmente é envolvido por `'x-decorator': 'FormItem'`:

```ts
MyModel.registerFlow({
  key: 'flow1',
  on: 'beforeRender',
  steps: {
    editTitle: {
      title: '编辑标题',
      uiSchema: {
        title: {
          type: 'string',
          title: '标题',
          'x-decorator': 'FormItem',
          'x-component': 'Input',
        },
        showBorder: {
          type: 'boolean',
          title: '显示边框',
          'x-decorator': 'FormItem',
          'x-component': 'Switch',
        },
        color: {
          type: 'string',
          title: '颜色',
          'x-decorator': 'FormItem',
          'x-component': 'Select',
          enum: [
            { label: '红色', value: 'red' },
            { label: '蓝色', value: 'blue' },
            { label: '绿色', value: 'green' },
          ],
        },
      },
      handler(ctx, params) {
        ctx.model.props.title = params.title;
        ctx.model.props.showBorder = params.showBorder;
        ctx.model.props.color = params.color;
      },
    },
  },
});
```

:::tip Dica

A v2 mantém compatibilidade com a sintaxe do uiSchema, mas seus cenários de uso são limitados — principalmente para descrever a UI de formulários no painel de configuração do Flow. Para a maior parte da renderização de componentes em runtime, recomenda-se usar diretamente os [componentes do Antd](https://5x.ant.design/components/overview).

:::

## Referência rápida de componentes comuns

| Componente | x-component | type | Descrição |
|------|-------------|------|------|
| Texto de linha única | `Input` | `string` | Entrada de texto básica |
| Texto multilinha | `Input.TextArea` | `string` | Área de texto multilinha |
| Número | `InputNumber` | `number` | Entrada numérica |
| Switch | `Switch` | `boolean` | Switch booleano |
| Seleção dropdown | `Select` | `string` | Requer `enum` para fornecer opções |
| Radio | `Radio.Group` | `string` | Requer `enum` para fornecer opções |
| Checkbox | `Checkbox.Group` | `string` | Requer `enum` para fornecer opções |
| Data | `DatePicker` | `string` | Seletor de data |

## Links relacionados

- [Visão geral do FlowEngine (Desenvolvimento de plugins)](../plugin-development/client/flow-engine/index.md) — uso prático do uiSchema em registerFlow
- [Definição de Flow](./definitions/flow-definition.md) — documentação completa dos parâmetros de registerFlow
- [Documentação do Formily Schema](https://react.formilyjs.org/api/shared/schema) — protocolo Formily no qual o uiSchema é baseado
