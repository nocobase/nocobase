---
title: "UI Schema"
description: "Справочник синтаксиса NocoBase UI Schema: протокол описания компонентов на основе Formily Schema, описание свойств type, x-component, x-decorator, x-pattern и других."
keywords: "UI Schema,uiSchema,Formily,x-component,x-decorator,x-pattern,x-display,NocoBase"
---

# UI Schema

UI Schema — это протокол, который NocoBase использует для описания фронтенд-компонентов. Он основан на [Formily Schema 2.0](https://react.formilyjs.org/api/shared/schema) и выполнен в стиле, близком к JSON Schema. В FlowEngine поле `uiSchema` метода `registerFlow` использует именно этот синтаксис для описания UI панели настроек.

```ts
interface ISchema {
  type: 'void' | 'string' | 'number' | 'object' | 'array';
  name?: string;
  title?: any;
  // компонент-обёртка
  ['x-decorator']?: string;
  // свойства компонента-обёртки
  ['x-decorator-props']?: any;
  // компонент
  ['x-component']?: string;
  // свойства компонента
  ['x-component-props']?: any;
  // состояние отображения, по умолчанию 'visible'
  ['x-display']?: 'none' | 'hidden' | 'visible';
  // дочерние узлы компонента
  ['x-content']?: any;
  // схема дочерних узлов
  properties?: Record<string, ISchema>;

  // Следующее используется только для компонентов полей

  // связи между полями
  ['x-reactions']?: SchemaReactions;
  // режим взаимодействия UI поля, по умолчанию 'editable'
  ['x-pattern']?: 'editable' | 'disabled' | 'readPretty';
  // валидация поля
  ['x-validator']?: Validator;
  // данные по умолчанию
  default?: any;
}
```

## Базовое использование

### Простейший компонент

Любой нативный HTML-тег можно представить в виде schema:

```ts
{
  type: 'void',
  'x-component': 'h1',
  'x-content': 'Hello, world!',
}
```

Эквивалент в JSX:

```tsx
<h1>Hello, world!</h1>
```

### Дочерние компоненты

Дочерние компоненты описываются в `properties`:

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

Эквивалент в JSX:

```tsx
<div className={'form-item'}>
  <input name={'title'} />
</div>
```

## Описание свойств

### type

Тип узла:

```ts
type SchemaTypes = 'string' | 'object' | 'array' | 'number' | 'boolean' | 'void';
```

### name

Имя schema. Имя дочернего узла — это ключ в `properties`:

```ts
{
  name: 'root',
  properties: {
    child1: {
      // здесь имя name указывать не нужно
    },
  },
}
```

### title

Заголовок узла, обычно используется как метка поля формы.

### x-component

Имя компонента. Может быть нативным HTML-тегом или зарегистрированным React-компонентом:

```ts
{
  type: 'void',
  'x-component': 'h1',
  'x-content': 'Hello, world!',
}
```

### x-component-props

Свойства компонента:

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

Компонент-обёртка. Сочетание `x-decorator` + `x-component` позволяет разместить два компонента в одном узле schema — это упрощает структуру и повышает переиспользуемость.

Например, в формах `FormItem` используется как decorator:

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

Эквивалент в JSX:

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

Состояние отображения компонента:

| Значение | Описание |
|----|------|
| `'visible'` | Компонент отображается (по умолчанию) |
| `'hidden'` | Компонент скрыт, но данные сохраняются |
| `'none'` | Компонент скрыт, данные также скрыты |

### x-pattern

Режим взаимодействия для компонента поля:

| Значение | Описание |
|----|------|
| `'editable'` | Доступно для редактирования (по умолчанию) |
| `'disabled'` | Недоступно для редактирования |
| `'readPretty'` | Дружественный режим чтения — например, однострочный текстовый компонент в режиме редактирования отображается как `<input />`, а в режиме чтения — как `<div />` |

## Использование в registerFlow

При разработке плагинов uiSchema в основном применяется в панелях настроек `registerFlow`. Каждое поле обычно оборачивается в `'x-decorator': 'FormItem'`:

```ts
MyModel.registerFlow({
  key: 'flow1',
  on: 'beforeRender',
  steps: {
    editTitle: {
      title: 'Редактировать заголовок',
      uiSchema: {
        title: {
          type: 'string',
          title: 'Заголовок',
          'x-decorator': 'FormItem',
          'x-component': 'Input',
        },
        showBorder: {
          type: 'boolean',
          title: 'Показывать рамку',
          'x-decorator': 'FormItem',
          'x-component': 'Switch',
        },
        color: {
          type: 'string',
          title: 'Цвет',
          'x-decorator': 'FormItem',
          'x-component': 'Select',
          enum: [
            { label: 'Красный', value: 'red' },
            { label: 'Синий', value: 'blue' },
            { label: 'Зелёный', value: 'green' },
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

:::tip Подсказка

В v2 синтаксис uiSchema сохраняет совместимость, однако сценарии его использования ограничены — он применяется в основном в панелях настроек Flow для описания форм UI. Для большей части runtime-рендеринга компонентов рекомендуется использовать [компоненты Antd](https://5x.ant.design/components/overview) напрямую.

:::

## Шпаргалка по часто используемым компонентам

| Компонент | x-component | type | Описание |
|------|-------------|------|------|
| Однострочный текст | `Input` | `string` | Базовый ввод текста |
| Многострочный текст | `Input.TextArea` | `string` | Многострочное текстовое поле |
| Число | `InputNumber` | `number` | Ввод числа |
| Переключатель | `Switch` | `boolean` | Логический переключатель |
| Выпадающий список | `Select` | `string` | Требуется задать варианты в `enum` |
| Радиокнопка | `Radio.Group` | `string` | Требуется задать варианты в `enum` |
| Множественный выбор | `Checkbox.Group` | `string` | Требуется задать варианты в `enum` |
| Дата | `DatePicker` | `string` | Выбор даты |

## Связанные ссылки

- [Обзор FlowEngine (разработка плагинов)](../plugin-development/client/flow-engine/index.md) — практическое использование uiSchema в registerFlow
- [Определение Flow](./definitions/flow-definition.md) — полное описание параметров registerFlow
- [Документация Formily Schema](https://react.formilyjs.org/api/shared/schema) — протокол Formily, на котором основан uiSchema
