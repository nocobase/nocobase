# Реактивный механизм: Observable

:::info
Реактивный механизм Observable в NocoBase по сути похож на [MobX](https://mobx.js.org/README.html). Текущая базовая реализация использует [@formily/reactive](https://github.com/alibaba/formily/tree/next/packages/reactive), а его синтаксис и концепции в высокой степени совместимы с [MobX](https://mobx.js.org/README.html). Напрямую MobX не использовался по историческим причинам.
:::

В NocoBase 2.0 реактивные объекты `Observable` используются повсеместно. Это основа внутреннего потока данных и отзывчивости UI, которая широко применяется в компонентах контекста потока (`FlowContext`), модели потока (`FlowModel`) и шага потока (`FlowStep`).

## Почему выбрали Observable?

NocoBase выбрал Observable вместо других решений управления состоянием, таких как Redux, Recoil, Zustand и Jotai, по следующим основным причинам:

- **Очень гибкий**: Observable может сделать реактивными любой объект, массив и т.д. Он естественно поддерживает глубокую вложенность и динамические структуры, что хорошо подходит для сложных бизнес-моделей.
- **Неинвазивный**: можно напрямую изменять исходный объект без определения actions, reducers или дополнительных stores, что дает отличный опыт разработки.
- **Автоматическое отслеживание зависимостей**: если обернуть компонент в `observer`, он автоматически отслеживает используемые свойства Observable. При изменении данных UI обновляется автоматически, без ручного управления зависимостями.
- **Подходит не только для React-сценариев**: реактивный механизм Observable применим не только в React, но и может сочетаться с другими фреймворками для более широких задач реактивных данных.

## Зачем использовать observer?

`observer` отслеживает изменения в объектах Observable и автоматически запускает обновления React-компонентов при изменении данных. Это поддерживает синхронизацию UI с данными без ручных вызовов `setState` или других методов обновления.

## Базовое использование

```tsx
import React from 'react';
import { Input } from 'antd';
import { observer, observable } from '@nocobase/flow-engine';

const obs = observable.deep({
  value: 'aa'
});

const MyComponent = observer(() => {
  return (
    <div>
      <Input
        defaultValue={obs.value}
        onChange={(e) => {
          obs.value = e.target.value;
        }}
      />
      <div>{obs.value}</div>
    </div>
  );
});

export default MyComponent;
```

Подробнее о реактивном использовании см. в документации [@formily/reactive](https://reactive.formilyjs.org/).