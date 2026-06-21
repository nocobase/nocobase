# FlowDefinition

FlowDefinition определяет базовую структуру и конфигурацию Flow и является одной из ключевых концепций FlowEngine. Оно описывает метаданные Flow, условия запуска, шаги выполнения и т.д.

## Определение типа

```ts
interface FlowDefinitionOptions<TModel extends FlowModel = FlowModel> {
  key: string;
  title?: string;
  manual?: boolean;
  sort?: number;
  on?: FlowEvent<TModel>;
  steps: Record<string, StepDefinition<TModel>>;
  defaultParams?: Record<string, any> | ((ctx: FlowModelContext) => StepParam | Promise<StepParam>);
}
```

## Способ регистрации

```ts
class MyModel extends FlowModel {}

// Регистрация Flow через класс модели
MyModel.registerFlow({
  key: 'pageSettings',
  title: 'Настройки страницы',
  manual: false,
  sort: 0,
  on: 'click',
  steps: {
    step1: {
      use: 'actionName',
      title: 'Первый шаг'
    }
  },
  defaultParams: {
    step1: { param1: 'value1' }
  }
});
```

## Описание свойств

### key

**Тип**: `string`  
**Обязательно**: Да  
**Описание**: Уникальный идентификатор flow.

Рекомендуется использовать единый стиль именования `xxxSettings`, например:
- `pageSettings`
- `tableSettings` 
- `cardSettings`
- `formSettings`
- `detailsSettings`
- `buttonSettings`
- `popupSettings`
- `deleteSettings`
- `datetimeSettings`
- `numberSettings`

Такой стиль именования упрощает идентификацию и сопровождение; рекомендуется использовать его единообразно во всем проекте.

**Пример**:
```ts
key: 'pageSettings'
key: 'tableSettings'
key: 'deleteSettings'
```

### title

**Тип**: `string`  
**Обязательно**: Нет  
**Описание**: Человекочитаемый заголовок flow.

Рекомендуется придерживаться стиля, согласованного с key, и использовать именование `Xxx settings`, например:
- `Page settings`
- `Table settings`
- `Card settings`
- `Form settings`
- `Details settings`
- `Button settings`
- `Popup settings`
- `Delete settings`
- `Datetime settings`
- `Number settings`

Такое именование более понятно и удобно для восприятия, что упрощает отображение в UI и командную работу.

**Пример**:
```ts
title: 'Page settings'
title: 'Table settings'
title: 'Delete settings'
```

### manual

**Тип**: `boolean`  
**Обязательно**: Нет  
**Default**: `false`  
**Описание**: Может ли flow выполняться только вручную.

- `true`: flow можно запустить только вручную, автоматически он выполняться не будет.
- `false`: flow может выполняться автоматически (по умолчанию выполняется автоматически, если свойство `on` отсутствует).

**Пример**:
```ts
manual: true  // Выполнять только вручную
manual: false // Можно выполнять автоматически
```

### sort

**Тип**: `number`  
**Обязательно**: Нет  
**Default**: `0`  
**Описание**: Порядок выполнения flow. Чем меньше значение, тем раньше выполняется.

Отрицательные числа можно использовать для управления порядком выполнения нескольких flows.

**Пример**:
```ts
sort: -1  // Выполнить с приоритетом
sort: 0   // Порядок по умолчанию
sort: 1   // Выполнить позже
```

### on

**Тип**: `FlowEvent<TModel>`  
**Обязательно**: Нет  
**Описание**: Конфигурация события, позволяющая запускать этот flow через `dispatchEvent`.

Используется только для объявления имени триггер-события (строка или `{ eventName }`) и не включает функцию-обработчик.

**Поддерживаемые типы событий**:
- `'click'` - событие клика
- `'submit'` - событие отправки
- `'reset'` - событие сброса
- `'remove'` - событие удаления
- `'openView'` - событие открытия представления
- `'dropdownOpen'` - событие открытия выпадающего списка
- `'popupScroll'` - событие прокрутки popup
- `'search'` - событие поиска
- `'customRequest'` - событие пользовательского запроса
- `'collapseToggle'` - событие переключения collapse
- либо любая пользовательская строка

**Пример**:
```ts
on: 'click'  // Запускается при клике
on: 'submit' // Запускается при отправке
on: { eventName: 'customEvent', defaultParams: { param1: 'value1' } }
```

### steps

**Тип**: `Record<string, StepDefinition<TModel>>`  
**Обязательно**: Да  
**Описание**: Определение шагов flow.

Определяет все шаги, входящие в flow; каждый шаг имеет уникальный key.

**Пример**:
```ts
steps: {
  step1: {
    use: 'actionName',
    title: 'Первый шаг',
    sort: 0
  },
  step2: {
    use: 'anotherAction',
    title: 'Второй шаг',
    sort: 1
  }
}
```

### defaultParams

**Тип**: `Record<string, any> | ((ctx: FlowModelContext) => StepParam | Promise<StepParam>)`  
**Обязательно**: Нет  
**Описание**: Параметры flow по умолчанию.

При создании модели (`createModel`) заполняет начальные значения параметров шагов "текущего flow". Заполняются только отсутствующие значения, существующие не перезаписываются. Фиксированная форма возврата: `{ [stepKey]: params }`.

**Пример**:
```ts
// Статические параметры по умолчанию
defaultParams: {
  step1: { param1: 'value1', param2: 'value2' },
  step2: { param3: 'value3' }
}

// Динамические параметры по умолчанию
defaultParams: (ctx) => {
  return {
    step1: { 
      param1: ctx.model.uid,
      param2: new Date().toISOString()
    }
  }
}

// Асинхронные параметры по умолчанию
defaultParams: async (ctx) => {
  const data = await fetchSomeData();
  return {
    step1: { data }
  }
}
```

## Полный пример (Complete Example)

```ts
class PageModel extends FlowModel {}

PageModel.registerFlow({
  key: 'pageSettings',
  title: 'Настройки страницы',
  manual: false,
  sort: 0,
  on: 'click',
  steps: {
    loadData: {
      use: 'loadDataAction',
      title: 'Загрузить данные',
      sort: 0,
      preset: true
    },
    processData: {
      use: 'processDataAction', 
      title: 'Обработать данные',
      sort: 1,
      paramsRequired: true
    },
    saveData: {
      use: 'saveDataAction',
      title: 'Сохранить данные',
      sort: 2,
      hideInSettings: false
    }
  },
  defaultParams: {
    loadData: { 
      source: 'api',
      cache: true 
    },
    processData: { 
      format: 'json' 
    }
  }
});
```