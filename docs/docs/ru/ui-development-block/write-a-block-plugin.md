# Написание плагина блока

Перед началом рекомендуется ознакомиться со статьёй «[Написать первый плагин](../plugin-development/write-your-first-plugin.md)», чтобы понять, как быстро создать базовый плагин. Далее мы расширим этот плагин, добавив в него простой блок.

## Шаг 1. Создаём файл модели блока

Создайте в каталоге плагина новый файл: `client/models/SimpleBlockModel.tsx`

## Шаг 2. Пишем содержимое модели

Определите и реализуйте в этом файле базовую модель блока, включая логику её рендеринга:

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

## Шаг 3. Регистрируем модель блока

Экспортируйте созданную модель в файле `client/models/index.ts`:

```ts
import { ModelConstructor } from '@nocobase/flow-engine';
import { SimpleBlockModel } from './SimpleBlockModel';

export default {
  SimpleBlockModel,
} as Record<string, ModelConstructor>;
```

## Шаг 4. Активируем и проверяем блок

После включения плагина в выпадающем списке «Добавить блок» появится новая опция **Hello block**.

Пример результата:

![20251102223200_rec_](https://static-docs.nocobase.com/20251102223200_rec_.gif)

## Шаг 5. Добавляем возможность настройки блока

Далее мы добавим конфигурируемость блока через поток, чтобы пользователи могли редактировать содержимое блока в интерфейсе.

Продолжайте редактировать файл `SimpleBlockModel.tsx`:

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

Пример результата:

![20251102222856_rec_](https://static-docs.nocobase.com/20251102222856_rec_.gif)

## Итоги

В этой статье показано, как создать простой блок-плагин, включая:

- как определить и реализовать модель блока;
- как зарегистрировать модель блока;
- как добавить возможность конфигурации через Flow (поток).

Полный исходный код примера: [Пример простого блока](https://github.com/nocobase/nocobase/tree/develop/packages/plugins/%40nocobase-example/plugin-simple-block)