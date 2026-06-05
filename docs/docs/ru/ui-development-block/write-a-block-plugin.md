:::tip Уведомление о переводе ИИ
Эта документация была автоматически переведена ИИ.
:::

# Создайте свой первый плагин-блок

Прежде чем начать, рекомендуем ознакомиться с руководством «[Создайте свой первый плагин](../plugin-development/write-your-first-plugin.md)», чтобы узнать, как быстро создать базовый плагин. Далее мы расширим его, добавив простую функциональность **блока**.

## Шаг 1: Создайте файл модели блока

Создайте новый файл в директории плагина: `client/models/SimpleBlockModel.tsx`

## Шаг 2: Напишите содержимое модели

Определите и реализуйте базовую модель блока в файле, включая логику её рендеринга:

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

## Шаг 3: Зарегистрируйте модель блока

Экспортируйте только что созданную модель в файле `client/models/index.ts`:

```ts
import { ModelConstructor } from '@nocobase/flow-engine';
import { SimpleBlockModel } from './SimpleBlockModel';

export default {
  SimpleBlockModel,
} as Record<string, ModelConstructor>;
```

## Шаг 4: Активируйте и протестируйте блок

После включения плагина вы увидите новую опцию **Hello block** в выпадающем меню «Добавить блок».

Демонстрация работы:

![20251102223200_rec_](https://static-docs.nocobase.com/20251102223200_rec_.gif)

## Шаг 5: Добавьте возможность настройки блока

Далее мы добавим настраиваемую функциональность к блоку с помощью **рабочего процесса** (Flow), что позволит пользователям редактировать содержимое блока прямо в интерфейсе.

Продолжите редактирование файла `SimpleBlockModel.tsx`:

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

Демонстрация работы:

![20251102222856_rec_](https://static-docs.nocobase.com/20251102222856_rec_.gif)

## Итоги

В этой статье мы рассмотрели, как создать простой плагин-блок, включая:

- Как определить и реализовать модель блока
- Как зарегистрировать модель блока
- Как добавить настраиваемую функциональность к блоку с помощью рабочего процесса (Flow)

Полный исходный код можно найти здесь: [Пример простого блока](https://github.com/nocobase/nocobase/tree/develop/packages/plugins/%40nocobase-example/plugin-simple-block)