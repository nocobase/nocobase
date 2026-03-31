:::tip Уведомление о переводе ИИ
Эта документация была автоматически переведена ИИ.
:::

# ActionDefinition

`ActionDefinition` определяет многократно используемые действия, на которые можно ссылаться в различных рабочих процессах и шагах. Действие является основной исполнительной единицей в движке рабочих процессов (`FlowEngine`), инкапсулирующей конкретную бизнес-логику.

## Определение типа

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

## Способ регистрации

```ts
// Глобальная регистрация (через FlowEngine)
const engine = new FlowEngine();
engine.registerAction({
  name: 'loadDataAction',
  title: 'Load Data',
  handler: async (ctx, params) => {
    // Логика обработки
  }
});

// Регистрация на уровне модели (через FlowModel)
class MyModel extends FlowModel {}
MyModel.registerAction({
  name: 'processDataAction',
  title: 'Process Data',
  handler: async (ctx, params) => {
    // Логика обработки
  }
});

// Использование в рабочем процессе
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
**Описание**: Уникальный идентификатор действия.

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
**Описание**: Заголовок действия для отображения.

Используется для отображения в пользовательском интерфейсе и отладки.

**Пример**:
```ts
title: 'Load Data'
title: 'Process Information'
title: 'Save Results'
```

### handler

**Тип**: `(ctx: TCtx, params: any) => Promise<any> | any`  
**Обязательно**: Да  
**Описание**: Функция-обработчик действия.

Это основная логика действия, которая принимает контекст и параметры, а затем возвращает результат обработки.

**Пример**:
```ts
handler: async (ctx, params) => {
  const { model, flowEngine } = ctx;
  
  try {
    // Выполнить конкретную логику
    const result = await performAction(params);
    
    // Вернуть результат
    return {
      success: true,
      data: result,
      message: 'Действие успешно завершено'
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
**Описание**: Параметры действия по умолчанию.

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
**Описание**: Схема конфигурации пользовательского интерфейса для действия.

Определяет, как действие отображается в пользовательском интерфейсе и его конфигурацию формы.

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
      title: 'URL API',
      'x-component': 'Input',
      'x-decorator': 'FormItem',
      required: true
    },
    method: {
      type: 'string',
      title: 'Метод HTTP',
      'x-component': 'Select',
      'x-decorator': 'FormItem',
      enum: ['GET', 'POST', 'PUT', 'DELETE'],
      default: 'GET'
    },
    timeout: {
      type: 'number',
      title: 'Таймаут (мс)',
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
**Описание**: Функция-хук, выполняемая перед сохранением параметров.

Выполняется до сохранения параметров действия и может использоваться для их валидации или преобразования.

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
  
  // Запись изменений
  console.log('Параметры изменены:', {
    from: previousParams,
    to: params
  });
}
```

### afterParamsSave

**Тип**: `(ctx: FlowSettingsContext<TModel>, params: any, previousParams: any) => void | Promise<void>`  
**Обязательно**: Нет  
**Описание**: Функция-хук, выполняемая после сохранения параметров.

Выполняется после сохранения параметров действия и может использоваться для запуска других операций.

**Пример**:
```ts
afterParamsSave: (ctx, params, previousParams) => {
  // Запись логов
  console.log('Параметры действия сохранены:', params);
  
  // Запуск события
  ctx.model.emitter.emit('actionParamsChanged', {
    actionName: 'loadDataAction',
    params,
    previousParams
  });
  
  // Обновление кеша
  ctx.model.updateCache('actionParams', params);
}
```

### useRawParams

**Тип**: `boolean | ((ctx: TCtx) => boolean | Promise<boolean>)`  
**Обязательно**: Нет  
**Описание**: Использовать ли необработанные параметры.

Если `true`, необработанные параметры будут переданы функции-обработчику напрямую, без какой-либо предварительной обработки.

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
**Описание**: Режим отображения действия в пользовательском интерфейсе.

Определяет, как действие отображается в пользовательском интерфейсе.

**Поддерживаемые режимы**:
- `'dialog'` - режим диалогового окна
- `'drawer'` - режим выдвижной панели
- `'embed'` - встроенный режим
- или пользовательский объект конфигурации

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
**Описание**: Сценарии использования действия.

Ограничивает использование действия только определенными сценариями.

**Поддерживаемые сценарии**:
- `'settings'` - сценарий настроек
- `'runtime'` - сценарий выполнения
- `'design'` - сценарий проектирования

**Пример**:
```ts
scene: 'settings'  // Использовать только в сценарии настроек
scene: ['settings', 'runtime']  // Использовать в сценариях настроек и выполнения
```

### sort

**Тип**: `number`  
**Обязательно**: Нет  
**Описание**: Вес сортировки для действия.

Определяет порядок отображения действия в списке. Меньшее значение означает более высокую позицию.

**Пример**:
```ts
sort: 0  // Самая высокая позиция
sort: 10 // Средняя позиция
sort: 100 // Более низкая позиция
```

## Полный пример

```ts
class DataProcessingModel extends FlowModel {}

// Регистрация действия загрузки данных
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
        title: 'URL API',
        'x-component': 'Input',
        'x-decorator': 'FormItem',
        required: true
      },
      method: {
        type: 'string',
        title: 'Метод HTTP',
        'x-component': 'Select',
        'x-decorator': 'FormItem',
        enum: ['GET', 'POST', 'PUT', 'DELETE']
      },
      timeout: {
        type: 'number',
        title: 'Таймаут (мс)',
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
  title: 'Process Data',
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
        title: 'Обработчик',
        'x-component': 'Select',
        'x-decorator': 'FormItem',
        enum: ['default', 'advanced', 'custom']
      },
      options: {
        type: 'object',
        title: 'Опции',
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