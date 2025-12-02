:::tip Уведомление о переводе ИИ
Эта документация была автоматически переведена ИИ.
:::

# StepDefinition

StepDefinition определяет отдельный шаг в рабочем процессе. Каждый шаг может представлять собой действие, обработку события или другую операцию. Шаг — это базовая единица выполнения рабочего процесса.

## Определение типа

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

## Использование

```ts
class MyModel extends FlowModel {}

MyModel.registerFlow({
  key: 'pageSettings',
  steps: {
    step1: {
      use: 'actionName',
      title: 'First Step',
      sort: 0,
      preset: true
    },
    step2: {
      handler: async (ctx, params) => {
        // Пользовательская логика обработки
        return { result: 'success' };
      },
      title: 'Second Step',
      sort: 1
    }
  }
});
```

## Описание свойств

### key

**Тип**: `string`  
**Обязательно**: Нет  
**Описание**: Уникальный идентификатор шага в рабочем процессе.

Если не указано, будет использоваться имя ключа шага в объекте `steps`.

**Пример**:
```ts
steps: {
  loadData: {  // ключ — 'loadData'
    use: 'loadDataAction'
  }
}
```

### use

**Тип**: `string`  
**Обязательно**: Нет  
**Описание**: Имя зарегистрированного ActionDefinition для использования.

Свойство `use` позволяет ссылаться на зарегистрированное действие, избегая дублирования определений.

**Пример**:
```ts
// Сначала зарегистрируйте действие
MyModel.registerAction({
  name: 'loadDataAction',
  handler: async (ctx, params) => {
    // Логика загрузки данных
  }
});

// Используйте в шаге
steps: {
  step1: {
    use: 'loadDataAction',  // Ссылка на зарегистрированное действие
    title: 'Load Data'
  }
}
```

### title

**Тип**: `string`  
**Обязательно**: Нет  
**Описание**: Заголовок шага для отображения.

Используется для отображения в пользовательском интерфейсе и отладки.

**Пример**:
```ts
title: 'Load Data'
title: 'Process Information'
title: 'Save Results'
```

### sort

**Тип**: `number`  
**Обязательно**: Нет  
**Описание**: Порядок выполнения шага. Чем меньше значение, тем раньше он выполняется.

Используется для управления порядком выполнения нескольких шагов в одном рабочем процессе.

**Пример**:
```ts
steps: {
  step1: { sort: 0 },  // Выполняется первым
  step2: { sort: 1 },  // Выполняется следующим
  step3: { sort: 2 }   // Выполняется последним
}
```

### handler

**Тип**: `(ctx: FlowRuntimeContext<TModel>, params: any) => Promise<any> | any`  
**Обязательно**: Нет  
**Описание**: Функция-обработчик для шага.

Когда свойство `use` не используется, вы можете определить функцию-обработчик напрямую.

**Пример**:
```ts
handler: async (ctx, params) => {
  // Получить информацию о контексте
  const { model, flowEngine } = ctx;
  
  // Логика обработки
  const result = await processData(params);
  
  // Вернуть результат
  return { success: true, data: result };
}
```

### defaultParams

**Тип**: `Record<string, any> | ((ctx: FlowRuntimeContext<TModel>) => Record<string, any> | Promise<Record<string, any>>)`  
**Обязательно**: Нет  
**Описание**: Параметры шага по умолчанию.

Заполняет параметры значениями по умолчанию перед выполнением шага.

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
    timestamp: Date.now()
  }
}

// Асинхронные параметры по умолчанию
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
**Обязательно**: Нет  
**Описание**: Схема конфигурации пользовательского интерфейса для шага.

Определяет, как шаг отображается в интерфейсе, и его конфигурацию формы.

**Пример**:
```ts
uiSchema: {
  'x-component': 'Form',
  'x-component-props': {
    layout: 'vertical'
  },
  properties: {
    name: {
      type: 'string',
      title: 'Name',
      'x-component': 'Input'
    },
    age: {
      type: 'number',
      title: 'Age',
      'x-component': 'InputNumber'
    }
  }
}
```

### beforeParamsSave

**Тип**: `(ctx: FlowSettingsContext<TModel>, params: any, previousParams: any) => void | Promise<void>`  
**Обязательно**: Нет  
**Описание**: Функция-хук, которая выполняется перед сохранением параметров.

Выполняется перед сохранением параметров шага и может использоваться для проверки или преобразования параметров.

**Пример**:
```ts
beforeParamsSave: (ctx, params, previousParams) => {
  // Проверка параметров
  if (!params.name) {
    throw new Error('Name is required');
  }
  
  // Преобразование параметров
  params.name = params.name.trim().toLowerCase();
}
```

### afterParamsSave

**Тип**: `(ctx: FlowSettingsContext<TModel>, params: any, previousParams: any) => void | Promise<void>`  
**Обязательно**: Нет  
**Описание**: Функция-хук, которая выполняется после сохранения параметров.

Выполняется после сохранения параметров шага и может использоваться для запуска других операций.

**Пример**:
```ts
afterParamsSave: (ctx, params, previousParams) => {
  // Запись логов
  console.log('Step params saved:', params);
  
  // Запуск других операций
  ctx.model.emitter.emit('paramsChanged', params);
}
```

### uiMode

**Тип**: `StepUIMode | ((ctx: FlowRuntimeContext<TModel>) => StepUIMode | Promise<StepUIMode>)`  
**Обязательно**: Нет  
**Описание**: Режим отображения пользовательского интерфейса для шага.

Контролирует, как шаг отображается в интерфейсе.

**Поддерживаемые режимы**:
- `'dialog'` - Диалоговый режим
- `'drawer'` - Режим выдвижной панели
- `'embed'` - Встроенный режим
- Или пользовательский объект конфигурации

**Пример**:
```ts
// Простой режим
uiMode: 'dialog'

// Пользовательская конфигурация
uiMode: {
  type: 'dialog',
  props: {
    width: 800,
    title: 'Step Configuration'
  }
}

// Динамический режим
uiMode: (ctx) => {
  return ctx.model.isMobile ? 'drawer' : 'dialog';
}
```

### preset

**Тип**: `boolean`  
**Обязательно**: Нет  
**Описание**: Является ли шаг предустановленным.

Параметры для шагов с `preset: true` необходимо заполнить во время создания. Для шагов без этого флага параметры можно заполнить после создания модели.

**Пример**:
```ts
steps: {
  step1: {
    preset: true,  // Параметры должны быть заполнены во время создания
    use: 'requiredAction'
  },
  step2: {
    preset: false, // Параметры могут быть заполнены позже
    use: 'optionalAction'
  }
}
```

### paramsRequired

**Тип**: `boolean`  
**Обязательно**: Нет  
**Описание**: Являются ли параметры шага обязательными.

Если `true`, диалоговое окно конфигурации откроется перед добавлением модели.

**Пример**:
```ts
paramsRequired: true  // Параметры должны быть настроены перед добавлением модели
paramsRequired: false // Параметры могут быть настроены позже
```

### hideInSettings

**Тип**: `boolean`  
**Обязательно**: Нет  
**Описание**: Скрывать ли шаг в меню настроек.

**Пример**:
```ts
hideInSettings: true  // Скрыть в настройках
hideInSettings: false // Показать в настройках (по умолчанию)
```

### isAwait

**Тип**: `boolean`  
**Обязательно**: Нет  
**По умолчанию**: `true`  
**Описание**: Ожидать ли завершения функции-обработчика.

**Пример**:
```ts
isAwait: true  // Ожидать завершения функции-обработчика (по умолчанию)
isAwait: false // Не ожидать, выполнять асинхронно
```

## Полный пример

```ts
class DataProcessingModel extends FlowModel {}

DataProcessingModel.registerFlow({
  key: 'dataProcessing',
  title: 'Data Processing',
  steps: {
    loadData: {
      use: 'loadDataAction',
      title: 'Load Data', // Загрузка данных
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
      title: 'Process Data', // Обработка данных
      sort: 1,
      defaultParams: (ctx) => ({
        userId: ctx.model.uid,
        timestamp: Date.now()
      }),
      beforeParamsSave: (ctx, params) => {
        if (!params.processor) {
          throw new Error('Processor is required');
        }
      },
      afterParamsSave: (ctx, params) => {
        ctx.model.emitter.emit('dataProcessed', params);
      }
    },
    saveData: {
      use: 'saveDataAction',
      title: 'Save Data', // Сохранение данных
      sort: 2,
      hideInSettings: false,
      uiMode: {
        type: 'drawer',
        props: {
          width: 600,
          title: 'Save Configuration' // Конфигурация сохранения
        }
      }
    }
  }
});
```