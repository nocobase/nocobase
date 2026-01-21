:::tip Повідомлення про переклад ШІ
Ця документація була автоматично перекладена штучним інтелектом.
:::


# StepDefinition

StepDefinition визначає окремий крок у робочому процесі. Кожен крок може бути дією, обробкою події або іншою операцією. Крок є базовою одиницею виконання робочого процесу.

## Визначення типу

```ts
interface StepDefinition<TModel extends FlowModel = FlowModel>
  extends Partial<Omit<ActionDefinition<TModel, FlowRuntimeContext<TModel>>, 'name'>> {
  key?: string;
  isAwait?: boolean;
  use?: string;
  sort?: number;
  preset?: boolean;
  paramsRequired?: boolean;
  hideInSettings?: boolean;
  uiMode?: StepUIMode | ((ctx: FlowRuntimeContext<TModel>) => StepUIMode | Promise<StepUIMode>);
}
```

## Використання

```ts
class MyModel extends FlowModel {}

MyModel.registerFlow({
  key: 'pageSettings',
  steps: {
    step1: {
      use: 'actionName',
      title: 'Перший крок',
      sort: 0,
      preset: true
    },
    step2: {
      handler: async (ctx, params) => {
        // Користувацька логіка обробки
        return { result: 'success' };
      },
      title: 'Другий крок',
      sort: 1
    }
  }
});
```

## Опис властивостей

### key

**Тип**: `string`  
**Обов'язковий**: Ні  
**Опис**: Унікальний ідентифікатор кроку в межах робочого процесу.

Якщо не вказано, буде використано ім'я ключа кроку в об'єкті `steps`.

**Приклад**:
```ts
steps: {
  loadData: {  // ключ — 'loadData'
    use: 'loadDataAction'
  }
}
```

### use

**Тип**: `string`  
**Обов'язковий**: Ні  
**Опис**: Назва зареєстрованого ActionDefinition для використання.

Властивість `use` дозволяє посилатися на зареєстровану дію, уникаючи дублювання визначень.

**Приклад**:
```ts
// Спочатку зареєструйте дію
MyModel.registerAction({
  name: 'loadDataAction',
  handler: async (ctx, params) => {
    // Логіка завантаження даних
  }
});

// Використайте це в кроці
steps: {
  step1: {
    use: 'loadDataAction',  // Посилання на зареєстровану дію
    title: 'Завантажити дані'
  }
}
```

### title

**Тип**: `string`  
**Обов'язковий**: Ні  
**Опис**: Заголовок кроку для відображення.

Використовується для відображення в інтерфейсі та налагодження.

**Приклад**:
```ts
title: 'Завантажити дані'
title: 'Обробити інформацію'
title: 'Зберегти результати'
```

### sort

**Тип**: `number`  
**Обов'язковий**: Ні  
**Опис**: Порядок виконання кроку. Чим менше значення, тим раніше він виконується.

Використовується для керування порядком виконання кількох кроків в одному робочому процесі.

**Приклад**:
```ts
steps: {
  step1: { sort: 0 },  // Виконується першим
  step2: { sort: 1 },  // Виконується наступним
  step3: { sort: 2 }   // Виконується останнім
}
```

### handler

**Тип**: `(ctx: FlowRuntimeContext<TModel>, params: any) => Promise<any> | any`  
**Обов'язковий**: Ні  
**Опис**: Функція-обробник для кроку.

Якщо властивість `use` не використовується, ви можете визначити функцію-обробник безпосередньо.

**Приклад**:
```ts
handler: async (ctx, params) => {
  // Отримайте інформацію про контекст
  const { model, flowEngine } = ctx;
  
  // Логіка обробки
  const result = await processData(params);
  
  // Поверніть результат
  return { success: true, data: result };
}
```

### defaultParams

**Тип**: `Record<string, any> | ((ctx: FlowRuntimeContext<TModel>) => Record<string, any> | Promise<Record<string, any>>)`  
**Обов'язковий**: Ні  
**Опис**: Параметри за замовчуванням для кроку.

Заповнює параметри значеннями за замовчуванням перед виконанням кроку.

**Приклад**:
```ts
// Статичні параметри за замовчуванням
defaultParams: {
  timeout: 5000,
  retries: 3,
  format: 'json'
}

// Динамічні параметри за замовчуванням
defaultParams: (ctx) => {
  return {
    userId: ctx.model.uid,
    timestamp: Date.now()
  }
}

// Асинхронні параметри за замовчуванням
defaultParams: async (ctx) => {
  const config = await loadConfig();
  return {
    apiUrl: config.apiUrl,
    apiKey: config.apiKey
  }
}
```

### uiSchema

**Тип**: `Record<string, ISchema> | ((ctx: FlowRuntimeContext<TModel>) => Record<string, ISchema> | Promise<Record<string, ISchema>>)`  
**Обов'язковий**: Ні  
**Опис**: Схема конфігурації інтерфейсу для кроку.

Визначає, як крок відображається в інтерфейсі та його конфігурацію форми.

**Приклад**:
```ts
uiSchema: {
  'x-component': 'Form',
  'x-component-props': {
    layout: 'vertical'
  },
  properties: {
    name: {
      type: 'string',
      title: 'Ім\'я',
      'x-component': 'Input'
    },
    age: {
      type: 'number',
      title: 'Вік',
      'x-component': 'InputNumber'
    }
  }
}
```

### beforeParamsSave

**Тип**: `(ctx: FlowSettingsContext<TModel>, params: any, previousParams: any) => void | Promise<void>`  
**Обов'язковий**: Ні  
**Опис**: Функція-хук, яка виконується перед збереженням параметрів.

Виконується перед збереженням параметрів кроку і може використовуватися для перевірки або перетворення параметрів.

**Приклад**:
```ts
beforeParamsSave: (ctx, params, previousParams) => {
  // Перевірка параметрів
  if (!params.name) {
    throw new Error('Ім\'я є обов\'язковим');
  }
  
  // Перетворення параметрів
  params.name = params.name.trim().toLowerCase();
}
```

### afterParamsSave

**Тип**: `(ctx: FlowSettingsContext<TModel>, params: any, previousParams: any) => void | Promise<void>`  
**Обов'язковий**: Ні  
**Опис**: Функція-хук, яка виконується після збереження параметрів.

Виконується після збереження параметрів кроку і може використовуватися для запуску інших операцій.

**Приклад**:
```ts
afterParamsSave: (ctx, params, previousParams) => {
  // Запишіть логи
  console.log('Параметри кроку збережено:', params);
  
  // Запустіть інші операції
  ctx.model.emitter.emit('paramsChanged', params);
}
```

### uiMode

**Тип**: `StepUIMode | ((ctx: FlowRuntimeContext<TModel>) => StepUIMode | Promise<StepUIMode>)`  
**Обов'язковий**: Ні  
**Опис**: Режим відображення інтерфейсу для кроку.

Керує тим, як крок відображається в інтерфейсі.

**Підтримувані режими**:
- `'dialog'` - Режим діалогового вікна
- `'drawer'` - Режим висувної панелі
- `'embed'` - Режим вбудовування
- Або користувацький об'єкт конфігурації

**Приклад**:
```ts
// Простий режим
uiMode: 'dialog'

// Користувацька конфігурація
uiMode: {
  type: 'dialog',
  props: {
    width: 800,
    title: 'Конфігурація кроку'
  }
}

// Динамічний режим
uiMode: (ctx) => {
  return ctx.model.isMobile ? 'drawer' : 'dialog';
}
```

### preset

**Тип**: `boolean`  
**Обов'язковий**: Ні  
**Опис**: Чи є це попередньо налаштованим кроком.

Параметри для кроків з `preset: true` потрібно заповнити під час створення. Ті, що без цього прапорця, можна заповнити після створення моделі.

**Приклад**:
```ts
steps: {
  step1: {
    preset: true,  // Параметри необхідно заповнити під час створення
    use: 'requiredAction'
  },
  step2: {
    preset: false, // Параметри можна заповнити пізніше
    use: 'optionalAction'
  }
}
```

### paramsRequired

**Тип**: `boolean`  
**Обов'язковий**: Ні  
**Опис**: Чи є параметри кроку обов'язковими.

Якщо `true`, діалогове вікно конфігурації відкриється перед додаванням моделі.

**Приклад**:
```ts
paramsRequired: true  // Параметри необхідно налаштувати перед додаванням моделі
paramsRequired: false // Параметри можна налаштувати пізніше
```

### hideInSettings

**Тип**: `boolean`  
**Обов'язковий**: Ні  
**Опис**: Чи приховувати крок у меню налаштувань.

**Приклад**:
```ts
hideInSettings: true  // Приховати в налаштуваннях
hideInSettings: false // Показати в налаштуваннях (за замовчуванням)
```

### isAwait

**Тип**: `boolean`  
**Обов'язковий**: Ні  
**Значення за замовчуванням**: `true`  
**Опис**: Чи чекати завершення функції-обробника.

**Приклад**:
```ts
isAwait: true  // Чекати завершення функції-обробника (за замовчуванням)
isAwait: false // Не чекати, виконувати асинхронно
```

## Повний приклад

```ts
class DataProcessingModel extends FlowModel {}

DataProcessingModel.registerFlow({
  key: 'dataProcessing',
  title: 'Обробка даних',
  steps: {
    loadData: {
      use: 'loadDataAction',
      title: 'Завантажити дані',
      sort: 0,
      preset: true,
      paramsRequired: true,
      defaultParams: {
        source: 'api',
        timeout: 5000
      },
      uiMode: 'dialog'
    },
    processData: {
      handler: async (ctx, params) => {
        const data = await ctx.model.getData();
        return processData(data, params);
      },
      title: 'Обробити дані',
      sort: 1,
      defaultParams: (ctx) => ({
        userId: ctx.model.uid,
        timestamp: Date.now()
      }),
      beforeParamsSave: (ctx, params) => {
        if (!params.processor) {
          throw new Error('Обробник є обов’язковим');
        }
      },
      afterParamsSave: (ctx, params) => {
        ctx.model.emitter.emit('dataProcessed', params);
      }
    },
    saveData: {
      use: 'saveDataAction',
      title: 'Зберегти дані',
      sort: 2,
      hideInSettings: false,
      uiMode: {
        type: 'drawer',
        props: {
          width: 600,
          title: 'Конфігурація збереження'
        }
      }
    }
  }
});
```