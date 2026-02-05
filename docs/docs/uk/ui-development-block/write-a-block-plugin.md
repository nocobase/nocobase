:::tip Повідомлення про переклад ШІ
Ця документація була автоматично перекладена штучним інтелектом.
:::


# Напишіть свій перший плагін-блок

Перед початком роботи радимо прочитати «[Створення першого плагіна](../plugin-development/write-your-first-plugin.md)», щоб дізнатися, як швидко створити базовий плагін. Далі ми розширимо його, додавши просту функцію блоку.

## Крок 1: Створіть файл моделі блоку

Створіть новий файл у каталозі плагіна: `client/models/SimpleBlockModel.tsx`

## Крок 2: Напишіть вміст моделі

Визначте та реалізуйте базову модель блоку у файлі, включно з логікою її рендерингу:

```tsx
import { BlockModel } from '@nocobase/client';
import React from 'react';
import { tExpr } from '../utils';

export class SimpleBlockModel extends BlockModel {
  renderComponent() {
    return (
      <div>
        <h1>Hello, NocoBase!</h1>
        <p>This is a simple block rendered by SimpleBlockModel.</p>
      </div>
    );
  }
}

SimpleBlockModel.define({
  label: tExpr('Hello block'),
});
```

## Крок 3: Зареєструйте модель блоку

Експортуйте новостворену модель у файлі `client/models/index.ts`:

```ts
import { ModelConstructor } from '@nocobase/flow-engine';
import { SimpleBlockModel } from './SimpleBlockModel';

export default {
  SimpleBlockModel,
} as Record<string, ModelConstructor>;
```

## Крок 4: Активуйте та спробуйте блок

Після активації плагіна ви побачите нову опцію **Hello block** у випадаючому меню «Додати блок».

Демонстрація ефекту:

![20251102223200_rec_](https://static-docs.nocobase.com/20251102223200_rec_.gif)

## Крок 5: Додайте можливість конфігурації до блоку

Далі ми додамо функціональність конфігурації до блоку за допомогою **Flow**, що дозволить користувачам редагувати вміст блоку в інтерфейсі.

Продовжуйте редагувати файл `SimpleBlockModel.tsx`:

```tsx
import { BlockModel } from '@nocobase/client';
import React from 'react';
import { tExpr } from '../locale';

export class SimpleBlockModel extends BlockModel {
  renderComponent() {
    return <div dangerouslySetInnerHTML={{ __html: this.props.html }} />;
  }
}

SimpleBlockModel.define({
  label: tExpr('Simple block'),
});

SimpleBlockModel.registerFlow({
  key: 'flow1',
  title: tExpr('Simple Block Flow'),
  on: 'beforeRender',
  steps: {
    editHtml: {
      title: tExpr('Edit HTML Content'),
      uiSchema: {
        html: {
          type: 'string',
          title: tExpr('HTML Content'),
          'x-decorator': 'FormItem',
          'x-component': 'Input.TextArea',
        },
      },
      defaultParams: {
        html: `<h3>This is a simple block</h3>
<p>You can edit the HTML content.</p>`,
      },
      handler(ctx, params) {
        ctx.model.props.html = params.html;
      },
    },
  },
});
```

Демонстрація ефекту:

![20251102222856_rec_](https://static-docs.nocobase.com/20251102222856_rec_.gif)

## Підсумок

У цій статті ми розглянули, як створити простий плагін-блок, включно з:

- Як визначити та реалізувати модель блоку
- Як зареєструвати модель блоку
- Як додати функціональність конфігурації до блоку за допомогою Flow

Повний вихідний код дивіться тут: [Приклад простого блоку](https://github.com/nocobase/nocobase/tree/develop/packages/plugins/%40nocobase-example/plugin-simple-block)