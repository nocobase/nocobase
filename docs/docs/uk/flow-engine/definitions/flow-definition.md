:::tip Повідомлення про переклад ШІ
Ця документація була автоматично перекладена штучним інтелектом.
:::


# FlowDefinition

`FlowDefinition` визначає базову структуру та конфігурацію **робочого процесу** і є однією з ключових концепцій рушія **робочих процесів**. Вона описує метаінформацію **робочого процесу**, умови спрацьовування, кроки виконання тощо.

## Визначення типу

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

## Метод реєстрації

```ts
class MyModel extends FlowModel {}

// Зареєструйте робочий процес через клас моделі
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

## Опис властивостей

### key

**Тип**: `string`  
**Обов'язково**: Так  
**Опис**: Унікальний ідентифікатор для **робочого процесу**.

Рекомендується використовувати єдиний стиль іменування `xxxSettings`, наприклад:
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

Така конвенція іменування полегшує ідентифікацію та супровід, і її рекомендується використовувати послідовно в усьому проєкті.

**Приклад**:
```ts
key: 'pageSettings'
key: 'tableSettings'
key: 'deleteSettings'
```

### title

**Тип**: `string`  
**Обов'язково**: Ні  
**Опис**: Зрозумілий для людини заголовок **робочого процесу**.

Рекомендується підтримувати стиль, узгоджений з `key`, використовуючи іменування `Xxx settings`, наприклад:
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

Така конвенція іменування є чіткішою та легшою для розуміння, що полегшує відображення в інтерфейсі користувача та командну співпрацю.

**Приклад**:
```ts
title: 'Page settings'
title: 'Table settings'
title: 'Delete settings'
```

### manual

**Тип**: `boolean`  
**Обов'язково**: Ні  
**Значення за замовчуванням**: `false`  
**Опис**: Чи може **робочий процес** виконуватися лише вручну.

- `true`: **Робочий процес** може бути запущений лише вручну і не виконуватиметься автоматично.
- `false`: **Робочий процес** може виконуватися автоматично (за замовчуванням він виконується автоматично, якщо властивість `on` відсутня).

**Приклад**:
```ts
manual: true  // Виконувати лише вручну
manual: false // Може виконуватися автоматично
```

### sort

**Тип**: `number`  
**Обов'язково**: Ні  
**Значення за замовчуванням**: `0`  
**Опис**: Порядок виконання **робочого процесу**. Чим менше значення, тим раніше він виконується.

Можна використовувати від'ємні числа для керування порядком виконання кількох **робочих процесів**.

**Приклад**:
```ts
sort: -1  // Виконувати з пріоритетом
sort: 0   // Порядок за замовчуванням
sort: 1   // Виконувати пізніше
```

### on

**Тип**: `FlowEvent<TModel>`  
**Обов'язково**: Ні  
**Опис**: Конфігурація події, яка дозволяє запускати цей **робочий процес** за допомогою `dispatchEvent`.

Використовується лише для оголошення назви події-тригера (рядок або `{ eventName }`), не містить функції обробника.

**Підтримувані типи подій**:
- `'click'` - Подія кліку
- `'submit'` - Подія відправки
- `'reset'` - Подія скидання
- `'remove'` - Подія видалення
- `'openView'` - Подія відкриття подання
- `'dropdownOpen'` - Подія відкриття випадаючого списку
- `'popupScroll'` - Подія прокрутки спливаючого вікна
- `'search'` - Подія пошуку
- `'customRequest'` - Подія користувацького запиту
- `'collapseToggle'` - Подія перемикання згортання
- Або будь-який користувацький рядок

**Приклад**:
```ts
on: 'click'  // Спрацьовує при кліку
on: 'submit' // Спрацьовує при відправці
on: { eventName: 'customEvent', defaultParams: { param1: 'value1' } }
```

### steps

**Тип**: `Record<string, StepDefinition<TModel>>`  
**Обов'язково**: Так  
**Опис**: Визначення кроків **робочого процесу**.

Визначає всі кроки, що містяться в **робочому процесі**, причому кожен крок має унікальний ключ.

**Приклад**:
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
**Обов'язково**: Ні  
**Опис**: Параметри за замовчуванням на рівні **робочого процесу**.

При інстанціюванні моделі (`createModel`) заповнює початкові значення для параметрів кроків "поточного **робочого процесу**". Заповнює лише відсутні значення і не перезаписує існуючі. Фіксована форма повернення: `{ [stepKey]: params }`

**Приклад**:
```ts
// Статичні параметри за замовчуванням
defaultParams: {
  step1: { param1: 'value1', param2: 'value2' },
  step2: { param3: 'value3' }
}

// Динамічні параметри за замовчуванням
defaultParams: (ctx) => {
  return {
    step1: { 
      param1: ctx.model.uid,
      param2: new Date().toISOString()
    }
  }
}

// Асинхронні параметри за замовчуванням
defaultParams: async (ctx) => {
  const data = await fetchSomeData();
  return {
    step1: { data }
  }
}
```

## Повний приклад

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