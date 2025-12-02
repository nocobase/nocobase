:::tip Уведомление о переводе ИИ
Эта документация была автоматически переведена ИИ.
:::

# FlowDefinition

`FlowDefinition` определяет базовую структуру и конфигурацию рабочего процесса и является одной из ключевых концепций движка рабочих процессов. Он описывает метаданные рабочего процесса, условия запуска, шаги выполнения и так далее.

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

// Зарегистрируйте рабочий процесс через класс модели
MyModel.registerFlow({
  key: 'pageSettings',
  title: 'Page settings',
  manual: false,
  sort: 0,
  on: 'click',
  steps: {
    step1: {
      use: 'actionName',
      title: 'First Step'
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
**Описание**: Уникальный идентификатор рабочего процесса.

Рекомендуется использовать единый стиль именования `xxxSettings`, например:
- `pageSettings` (настройки страницы)
- `tableSettings` (настройки таблицы) 
- `cardSettings` (настройки карточки)
- `formSettings` (настройки формы)
- `detailsSettings` (настройки деталей)
- `buttonSettings` (настройки кнопки)
- `popupSettings` (настройки всплывающего окна)
- `deleteSettings` (настройки удаления)
- `datetimeSettings` (настройки даты и времени)
- `numberSettings` (настройки числа)

Такой подход к именованию упрощает идентификацию и поддержку. Рекомендуется использовать его единообразно по всему проекту.

**Пример**:
```ts
key: 'pageSettings'
key: 'tableSettings'
key: 'deleteSettings'
```

### title

**Тип**: `string`  
**Обязательно**: Нет  
**Описание**: Человекочитаемое название рабочего процесса.

Рекомендуется придерживаться стиля, соответствующего `key`, используя именование `Xxx settings`, например:
- `Page settings` (Настройки страницы)
- `Table settings` (Настройки таблицы)
- `Card settings` (Настройки карточки)
- `Form settings` (Настройки формы)
- `Details settings` (Настройки деталей)
- `Button settings` (Настройки кнопки)
- `Popup settings` (Настройки всплывающего окна)
- `Delete settings` (Настройки удаления)
- `Datetime settings` (Настройки даты и времени)
- `Number settings` (Настройки числа)

Такой подход к именованию делает его более понятным и простым для восприятия, что упрощает отображение в пользовательском интерфейсе и командную работу.

**Пример**:
```ts
title: 'Page settings'
title: 'Table settings'
title: 'Delete settings'
```

### manual

**Тип**: `boolean`  
**Обязательно**: Нет  
**Значение по умолчанию**: `false`  
**Описание**: Определяет, может ли рабочий процесс быть выполнен только вручную.

- `true`: Рабочий процесс может быть запущен только вручную и не будет выполняться автоматически.
- `false`: Рабочий процесс может выполняться автоматически (по умолчанию он выполняется автоматически, если свойство `on` отсутствует).

**Пример**:
```ts
manual: true  // Только ручной запуск
manual: false // Может выполняться автоматически
```

### sort

**Тип**: `number`  
**Обязательно**: Нет  
**Значение по умолчанию**: `0`  
**Описание**: Порядок выполнения рабочего процесса. Чем меньше значение, тем раньше он будет выполнен.

Отрицательные числа также могут быть использованы для управления порядком выполнения нескольких рабочих процессов.

**Пример**:
```ts
sort: -1  // Выполнить в первую очередь
sort: 0   // Порядок по умолчанию
sort: 1   // Выполнить позже
```

### on

**Тип**: `FlowEvent<TModel>`  
**Обязательно**: Нет  
**Описание**: Конфигурация события, которая позволяет запускать этот рабочий процесс с помощью `dispatchEvent`.

Используется только для объявления имени запускающего события (строка или `{ eventName }`), не включает функцию-обработчик.

**Поддерживаемые типы событий**:
- `'click'` - Событие клика
- `'submit'` - Событие отправки
- `'reset'` - Событие сброса
- `'remove'` - Событие удаления
- `'openView'` - Событие открытия представления
- `'dropdownOpen'` - Событие открытия выпадающего списка
- `'popupScroll'` - Событие прокрутки всплывающего окна
- `'search'` - Событие поиска
- `'customRequest'` - Событие пользовательского запроса
- `'collapseToggle'` - Событие переключения сворачивания/разворачивания
- Или любая пользовательская строка

**Пример**:
```ts
on: 'click'  // Запускается по клику
on: 'submit' // Запускается при отправке
on: { eventName: 'customEvent', defaultParams: { param1: 'value1' } }
```

### steps

**Тип**: `Record<string, StepDefinition<TModel>>`  
**Обязательно**: Да  
**Описание**: Определение шагов рабочего процесса.

Определяет все шаги, входящие в рабочий процесс, при этом каждый шаг имеет уникальный ключ.

**Пример**:
```ts
steps: {
  step1: {
    use: 'actionName',
    title: 'First Step',
    sort: 0
  },
  step2: {
    use: 'anotherAction',
    title: 'Second Step',
    sort: 1
  }
}
```

### defaultParams

**Тип**: `Record<string, any> | ((ctx: FlowModelContext) => StepParam | Promise<StepParam>)`  
**Обязательно**: Нет  
**Описание**: Параметры по умолчанию на уровне рабочего процесса.

При создании экземпляра модели (`createModel`) он заполняет начальные значения для параметров шагов "текущего рабочего процесса". Заполняются только отсутствующие значения, существующие не перезаписываются. Фиксированный формат возвращаемого значения: `{ [stepKey]: params }`

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

## Полный пример

```ts
class PageModel extends FlowModel {}

PageModel.registerFlow({
  key: 'pageSettings',
  title: 'Page settings',
  manual: false,
  sort: 0,
  on: 'click',
  steps: {
    loadData: {
      use: 'loadDataAction',
      title: 'Load Data',
      sort: 0,
      preset: true
    },
    processData: {
      use: 'processDataAction', 
      title: 'Process Data',
      sort: 1,
      paramsRequired: true
    },
    saveData: {
      use: 'saveDataAction',
      title: 'Save Data', 
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