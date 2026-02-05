:::tip Повідомлення про переклад ШІ
Ця документація була автоматично перекладена штучним інтелектом.
:::


# ActionDefinition

`ActionDefinition` визначає багаторазові дії, які можуть бути використані в кількох потоках та кроках. Дія є основною одиницею виконання в `FlowEngine`, що інкапсулює конкретну бізнес-логіку.

## Визначення типу

```ts
interface ActionDefinition<TModel extends FlowModel = FlowModel, TCtx extends FlowContext = FlowContext> {
  name: string;
  title?: string;
  handler: (ctx: TCtx, params: any) => Promise<any> | any;
  uiSchema?: Record<string, ISchema> | ((ctx: TCtx) => Record<string, ISchema> | Promise<Record<string, ISchema>>);
  defaultParams?: Record<string, any> | ((ctx: TCtx) => Record<string, any> | Promise<Record<string, any>>);
  beforeParamsSave?: (ctx: FlowSettingsContext<TModel>, params: any, previousParams: any) => void | Promise<void>;
  afterParamsSave?: (ctx: FlowSettingsContext<TModel>, params: any, previousParams: any) => void | Promise<void>;
  useRawParams?: boolean | ((ctx: TCtx) => boolean | Promise<boolean>);
  uiMode?: StepUIMode | ((ctx: FlowRuntimeContext<TModel>) => StepUIMode | Promise<StepUIMode>);
  scene?: ActionScene | ActionScene[];
  sort?: number;
}
```

## Метод реєстрації

```ts
// Глобальна реєстрація (через FlowEngine)
const engine = new FlowEngine();
engine.registerAction({
  name: 'loadDataAction',
  title: 'Load Data',
  handler: async (ctx, params) => {
    // Логіка обробки
  }
});

// Реєстрація на рівні моделі (через FlowModel)
class MyModel extends FlowModel {}
MyModel.registerAction({
  name: 'processDataAction',
  title: 'Process Data',
  handler: async (ctx, params) => {
    // Логіка обробки
  }
});

// Використання в потоці
MyModel.registerFlow({
  key: 'dataFlow',
  steps: {
    step1: {
      use: 'loadDataAction',  // Посилання на глобальну дію
    },
    step2: {
      use: 'processDataAction', // Посилання на дію рівня моделі
    }
  }
});
```

## Опис властивостей

### name

**Тип**: `string`  
**Обов'язково**: Так  
**Опис**: Унікальний ідентифікатор дії

Використовується для посилання на дію в кроці через властивість `use`.

**Приклад**:
```ts
name: 'loadDataAction'
name: 'processDataAction'
name: 'saveDataAction'
```

### title

**Тип**: `string`  
**Обов'язково**: Ні  
**Опис**: Заголовок дії для відображення

Використовується для відображення в інтерфейсі користувача та налагодження.

**Приклад**:
```ts
title: 'Load Data'
title: 'Process Information'
title: 'Save Results'
```

### handler

**Тип**: `(ctx: TCtx, params: any) => Promise<any> | any`  
**Обов'язково**: Так  
**Опис**: Функція-обробник дії

Основна логіка дії, яка приймає контекст та параметри і повертає результат обробки.

**Приклад**:
```ts
handler: async (ctx, params) => {
  const { model, flowEngine } = ctx;
  
  try {
    // Виконати конкретну логіку
    const result = await performAction(params);
    
    // Повернути результат
    return {
      success: true,
      data: result,
      message: 'Action completed successfully'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}
```

### defaultParams

**Тип**: `Record<string, any> | ((ctx: TCtx) => Record<string, any> | Promise<Record<string, any>>)`  
**Обов'язково**: Ні  
**Опис**: Параметри дії за замовчуванням

Заповнює параметри значеннями за замовчуванням перед виконанням дії.

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
    timestamp: Date.now(),
    version: ctx.flowEngine.version
  }
}

// Асинхронні параметри за замовчуванням
defaultParams: async (ctx) => {
  const config = await loadConfiguration();
  return {
    apiUrl: config.apiUrl,
    apiKey: config.apiKey,
    timeout: config.timeout
  }
}
```

### uiSchema

**Тип**: `Record<string, ISchema> | ((ctx: TCtx) => Record<string, ISchema> | Promise<Record<string, ISchema>>)`  
**Обов'язково**: Ні  
**Опис**: Схема конфігурації інтерфейсу користувача (UI) для дії

Визначає, як дія відображається в інтерфейсі користувача та її конфігурацію форми.

**Приклад**:
```ts
uiSchema: {
  'x-component': 'Form',
  'x-component-props': {
    layout: 'vertical',
    labelCol: { span: 6 },
    wrapperCol: { span: 18 }
  },
  properties: {
    url: {
      type: 'string',
      title: 'API URL',
      'x-component': 'Input',
      'x-decorator': 'FormItem',
      required: true
    },
    method: {
      type: 'string',
      title: 'HTTP Method',
      'x-component': 'Select',
      'x-decorator': 'FormItem',
      enum: ['GET', 'POST', 'PUT', 'DELETE'],
      default: 'GET'
    },
    timeout: {
      type: 'number',
      title: 'Timeout (ms)',
      'x-component': 'InputNumber',
      'x-decorator': 'FormItem',
      default: 5000
    }
  }
}
```

### beforeParamsSave

**Тип**: `(ctx: FlowSettingsContext<TModel>, params: any, previousParams: any) => void | Promise<void>`  
**Обов'язково**: Ні  
**Опис**: Функція-хук, що виконується перед збереженням параметрів

Виконується перед збереженням параметрів дії; може використовуватися для валідації або трансформації параметрів.

**Приклад**:
```ts
beforeParamsSave: (ctx, params, previousParams) => {
  // Валідація параметрів
  if (!params.url) {
    throw new Error('URL is required');
  }
  
  // Трансформація параметрів
  params.url = params.url.trim();
  if (!params.url.startsWith('http')) {
    params.url = 'https://' + params.url;
  }
  
  // Зафіксувати зміни
  console.log('Parameters changed:', {
    from: previousParams,
    to: params
  });
}
```

### afterParamsSave

**Тип**: `(ctx: FlowSettingsContext<TModel>, params: any, previousParams: any) => void | Promise<void>`  
**Обов'язково**: Ні  
**Опис**: Функція-хук, що виконується після збереження параметрів

Виконується після збереження параметрів дії; може використовуватися для запуску інших операцій.

**Приклад**:
```ts
afterParamsSave: (ctx, params, previousParams) => {
  // Записати в журнал
  console.log('Action params saved:', params);
  
  // Запустити подію
  ctx.model.emitter.emit('actionParamsChanged', {
    actionName: 'loadDataAction',
    params,
    previousParams
  });
  
  // Оновити кеш
  ctx.model.updateCache('actionParams', params);
}
```

### useRawParams

**Тип**: `boolean | ((ctx: TCtx) => boolean | Promise<boolean>)`  
**Обов'язково**: Ні  
**Опис**: Чи використовувати сирі (необроблені) параметри

Якщо `true`, сирі параметри передаються безпосередньо функції-обробнику без будь-якої обробки.

**Приклад**:
```ts
// Статична конфігурація
useRawParams: true

// Динамічна конфігурація
useRawParams: (ctx) => {
  return ctx.model.isDebugMode;
}
```

### uiMode

**Тип**: `StepUIMode | ((ctx: FlowRuntimeContext<TModel>) => StepUIMode | Promise<StepUIMode>)`  
**Обов'язково**: Ні  
**Опис**: Режим відображення UI для дії

Контролює, як дія відображається в інтерфейсі користувача.

**Підтримувані режими**:
- `'dialog'` - Режим діалогового вікна
- `'drawer'` - Режим висувної панелі
- `'embed'` - Вбудований режим
- або об'єкт кастомної конфігурації

**Приклад**:
```ts
// Простий режим
uiMode: 'dialog'

// Кастомна конфігурація
uiMode: {
  type: 'dialog',
  props: {
    width: 800,
    title: 'Action Configuration',
    maskClosable: false
  }
}

// Динамічний режим
uiMode: (ctx) => {
  return ctx.model.isMobile ? 'drawer' : 'dialog';
}
```

### scene

**Тип**: `ActionScene | ActionScene[]`  
**Обов'язково**: Ні  
**Опис**: Сценарії використання дії

Обмежує використання дії лише певними сценаріями.

**Підтримувані сценарії**:
- `'settings'` - Сценарій налаштувань
- `'runtime'` - Сценарій виконання
- `'design'` - Сценарій розробки

**Приклад**:
```ts
scene: 'settings'  // Використовувати лише в сценарії налаштувань
scene: ['settings', 'runtime']  // Використовувати в сценаріях налаштувань та виконання
```

### sort

**Тип**: `number`  
**Обов'язково**: Ні  
**Опис**: Вага сортування для дії

Використовується для контролю порядку відображення дії у списку; чим менше значення, тим вище позиція.

**Приклад**:
```ts
sort: 0  // Найвища позиція
sort: 10 // Середня позиція
sort: 100 // Нижча позиція
```

## Повний приклад

```ts
class DataProcessingModel extends FlowModel {}

// Реєстрація дії завантаження даних
DataProcessingModel.registerAction({
  name: 'loadDataAction',
  title: 'Load Data',
  handler: async (ctx, params) => {
    const { url, method = 'GET', timeout = 5000 } = params;
    
    try {
      const response = await fetch(url, {
        method,
        timeout,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      return {
        success: true,
        data,
        message: 'Data loaded successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },
  defaultParams: {
    method: 'GET',
    timeout: 5000
  },
  uiSchema: {
    'x-component': 'Form',
    properties: {
      url: {
        type: 'string',
        title: 'API URL',
        'x-component': 'Input',
        'x-decorator': 'FormItem',
        required: true
      },
      method: {
        type: 'string',
        title: 'HTTP Method',
        'x-component': 'Select',
        'x-decorator': 'FormItem',
        enum: ['GET', 'POST', 'PUT', 'DELETE']
      },
      timeout: {
        type: 'number',
        title: 'Timeout (ms)',
        'x-component': 'InputNumber',
        'x-decorator': 'FormItem'
      }
    }
  },
  beforeParamsSave: (ctx, params) => {
    if (!params.url) {
      throw new Error('URL is required');
    }
    params.url = params.url.trim();
  },
  afterParamsSave: (ctx, params) => {
    ctx.model.emitter.emit('dataSourceChanged', params);
  },
  uiMode: 'dialog',
  scene: ['settings', 'runtime'],
  sort: 0
});

// Реєстрація дії обробки даних
DataProcessingModel.registerAction({
  name: 'processDataAction',
  title: 'Process Data',
  handler: async (ctx, params) => {
    const { data, processor, options = {} } = params;
    
    try {
      const processedData = await processData(data, processor, options);
      
      return {
        success: true,
        data: processedData,
        message: 'Data processed successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },
  defaultParams: (ctx) => ({
    processor: 'default',
    options: {
      format: 'json',
      encoding: 'utf8'
    }
  }),
  uiSchema: {
    'x-component': 'Form',
    properties: {
      processor: {
        type: 'string',
        title: 'Processor',
        'x-component': 'Select',
        'x-decorator': 'FormItem',
        enum: ['default', 'advanced', 'custom']
      },
      options: {
        type: 'object',
        title: 'Options',
        'x-component': 'Form',
        'x-decorator': 'FormItem',
        properties: {
          format: {
            type: 'string',
            title: 'Format',
            'x-component': 'Select',
            enum: ['json', 'xml', 'csv']
          },
          encoding: {
            type: 'string',
            title: 'Encoding',
            'x-component': 'Select',
            enum: ['utf8', 'ascii', 'latin1']
          }
        }
      }
    }
  },
  scene: 'runtime',
  sort: 1
});
```