# ActionDefinition

Определение действия (`ActionDefinition`) определяет переиспользуемые действия, на которые можно ссылаться в нескольких потоках и шагах. Действие — это базовая единица выполнения в движке потоков, инкапсулирующая конкретную бизнес-логику.

## Определение типа

```ts
interface ActionDefinition<TModel extends FlowModel = FlowModel, TCCtx extends FlowContext = FlowContext> {
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

## Способ регистрации

```ts
// Глобальная регистрация (через FlowEngine)
const engine = new FlowEngine();
engine.registerAction({
  name: 'loadDataAction',
  title: 'Загрузить данные',
  handler: async (ctx, params) => {
    // Логика обработки
  }
});

// Регистрация на уровне модели (через FlowModel)
class MyModel extends FlowModel {}
MyModel.registerAction({
  name: 'processDataAction',
  title: 'Обработать данные',
  handler: async (ctx, params) => {
    // Логика обработки
  }
});

// Использование в flow
MyModel.registerFlow({
  key: 'dataFlow',
  steps: {
    step1: {
      use: 'loadDataAction',  // Ссылка на глобальное действие
    },
    step2: {
      use: 'processDataAction', // Ссылка на действие уровня модели
    }
  }
});
```

## Описание свойств

### name

**Тип**: `string`  
**Обязательно**: Да  
**Описание**: Уникальный идентификатор действия

Используется для ссылки на действие в шаге через свойство `use`.

**Пример**:
```ts
name: 'loadDataAction'
name: 'processDataAction'
name: 'saveDataAction'
```

### title

**Тип**: `string`  
**Обязательно**: Нет  
**Описание**: Отображаемый заголовок действия

Используется для отображения в UI и отладки.

**Пример**:
```ts
title: 'Load Data'
title: 'Process Information'
title: 'Save Results'
```

### handler

**Тип**: `(ctx: TCtx, params: any) => Promise<any> | any`  
**Обязательно**: Да  
**Описание**: Функция-обработчик действия

Базовая логика действия, которая принимает контекст и параметры и возвращает результат обработки.

**Пример**:
```ts
handler: async (ctx, params) => {
  const { model, flowEngine } = ctx;
  
  try {
    // Выполнение конкретной логики
    const result = await performAction(params);
    
    // Возврат результата
    return {
      success: true,
      data: result,
      message: 'Действие успешно выполнено'
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
**Обязательно**: Нет  
**Описание**: Параметры действия по умолчанию

Заполняет параметры значениями по умолчанию перед выполнением действия.

**Пример**:
```ts
// Статические параметры по умолчанию
defaultParams: {
  timeout: 5000,
  retries: 3,
  format: 'json'
}

// Динамические параметры по умолчанию
defaultParams: (ctx) => {
  return {
    userId: ctx.model.uid,
    timestamp: Date.now(),
    version: ctx.flowEngine.version
  }
}

// Асинхронные параметры по умолчанию
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
**Обязательно**: Нет  
**Описание**: Схема UI-конфигурации действия

Определяет, как действие отображается в UI и как устроена его форма настройки.

**Пример**:
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
      title: 'HTTP-метод',
      'x-component': 'Select',
      'x-decorator': 'FormItem',
      enum: ['GET', 'POST', 'PUT', 'DELETE'],
      default: 'GET'
    },
    timeout: {
      type: 'number',
      title: 'Таймаут (ms)',
      'x-component': 'InputNumber',
      'x-decorator': 'FormItem',
      default: 5000
    }
  }
}
```

### beforeParamsSave

**Тип**: `(ctx: FlowSettingsContext<TModel>, params: any, previousParams: any) => void | Promise<void>`  
**Обязательно**: Нет  
**Описание**: Хук-функция, выполняемая перед сохранением параметров

Выполняется перед сохранением параметров действия; может использоваться для валидации или преобразования параметров.

**Пример**:
```ts
beforeParamsSave: (ctx, params, previousParams) => {
  // Валидация параметров
  if (!params.url) {
    throw new Error('URL обязателен');
  }
  
  // Преобразование параметров
  params.url = params.url.trim();
  if (!params.url.startsWith('http')) {
    params.url = 'https://' + params.url;
  }
  
  // Логирование изменений
  console.log('Параметры изменены:', {
    from: previousParams,
    to: params
  });
}
```

### afterParamsSave

**Тип**: `(ctx: FlowSettingsContext<TModel>, params: any, previousParams: any) => void | Promise<void>`  
**Обязательно**: Нет  
**Описание**: Хук-функция, выполняемая после сохранения параметров

Выполняется после сохранения параметров действия; может использоваться для запуска других операций.

**Пример**:
```ts
afterParamsSave: (ctx, params, previousParams) => {
  // Логирование
  console.log('Параметры действия сохранены:', params);
  
  // Запуск события
  ctx.model.emitter.emit('actionParamsChanged', {
    actionName: 'loadDataAction',
    params,
    previousParams
  });
  
  // Обновление кэша
  ctx.model.updateCache('actionParams', params);
}
```

### useRawParams

**Тип**: `boolean | ((ctx: TCtx) => boolean | Promise<boolean>)`  
**Обязательно**: Нет  
**Описание**: Использовать ли необработанные параметры

Если `true`, необработанные параметры передаются в функцию-обработчик напрямую, без дополнительной обработки.

**Пример**:
```ts
// Статическая конфигурация
useRawParams: true

// Динамическая конфигурация
useRawParams: (ctx) => {
  return ctx.model.isDebugMode;
}
```

### uiMode

**Тип**: `StepUIMode | ((ctx: FlowRuntimeContext<TModel>) => StepUIMode | Promise<StepUIMode>)`  
**Обязательно**: Нет  
**Описание**: Режим отображения UI для действия

Управляет тем, как действие отображается в UI.

**Поддерживаемые режимы**:
- `'dialog'` - режим диалога
- `'drawer'` - режим drawer
- `'embed'` - режим встраивания
- либо пользовательский объект конфигурации

**Пример**:
```ts
// Простой режим
uiMode: 'dialog'

// Пользовательская конфигурация
uiMode: {
  type: 'dialog',
  props: {
    width: 800,
    title: 'Конфигурация действия',
    maskClosable: false
  }
}

// Динамический режим
uiMode: (ctx) => {
  return ctx.model.isMobile ? 'drawer' : 'dialog';
}
```

### scene

**Тип**: `ActionScene | ActionScene[]`  
**Обязательно**: Нет  
**Описание**: Сценарии использования действия

Ограничивает использование действия только заданными сценариями.

**Поддерживаемые сцены**:
- `'settings'` - сцена настройки
- `'runtime'` - runtime-сцена
- `'design'` - сцена проектирования

**Пример**:
```ts
scene: 'settings'  // Использовать только в сцене настройки
scene: ['settings', 'runtime']  // Использовать в сценах настройки и runtime
```

### sort

**Тип**: `number`  
**Обязательно**: Нет  
**Описание**: Вес сортировки действия

Управляет порядком отображения действия в списке. Чем меньше значение, тем выше позиция.

**Пример**:
```ts
sort: 0  // Самая высокая позиция
sort: 10 // Средняя позиция
sort: 100 // Низкая позиция
```

## Полный пример (Complete Example)

```ts
class DataProcessingModel extends FlowModel {}

// Регистрация действия загрузки данных
DataProcessingModel.registerAction({
  name: 'loadDataAction',
  title: 'Загрузить данные',
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
        message: 'Данные успешно загружены'
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
        title: 'HTTP-метод',
        'x-component': 'Select',
        'x-decorator': 'FormItem',
        enum: ['GET', 'POST', 'PUT', 'DELETE']
      },
      timeout: {
        type: 'number',
        title: 'Таймаут (ms)',
        'x-component': 'InputNumber',
        'x-decorator': 'FormItem'
      }
    }
  },
  beforeParamsSave: (ctx, params) => {
    if (!params.url) {
      throw new Error('URL обязателен');
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

// Регистрация действия обработки данных
DataProcessingModel.registerAction({
  name: 'processDataAction',
  title: 'Обработать данные',
  handler: async (ctx, params) => {
    const { data, processor, options = {} } = params;
    
    try {
      const processedData = await processData(data, processor, options);
      
      return {
        success: true,
        data: processedData,
        message: 'Данные успешно обработаны'
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
        title: 'Процессор',
        'x-component': 'Select',
        'x-decorator': 'FormItem',
        enum: ['default', 'advanced', 'custom']
      },
      options: {
        type: 'object',
        title: 'Параметры',
        'x-component': 'Form',
        'x-decorator': 'FormItem',
        properties: {
          format: {
            type: 'string',
            title: 'Формат',
            'x-component': 'Select',
            enum: ['json', 'xml', 'csv']
          },
          encoding: {
            type: 'string',
            title: 'Кодировка',
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