# StepDefinition

StepDefinition определяет отдельный шаг в Flow. Каждый шаг может быть действием, обработкой события или другой операцией. Шаг — базовая единица выполнения Flow.

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
        return { result: 'успех' };
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
**Описание**: Уникальный идентификатор шага внутри flow.

Если не указан, будет использовано имя ключа шага в объекте `steps`.

**Пример**:
```ts
steps: {
  loadData: {  // key равен 'loadData'
    use: 'loadDataAction'
  }
}
```

### use

**Тип**: `string`  
**Обязательно**: Нет  
**Описание**: Имя зарегистрированного действия (`ActionDefinition`) для использования.

Свойство `use` позволяет ссылаться на зарегистрированное действие и избегать дублирования определений.

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
    title: 'Загрузить данные'
  }
}
```

### title

**Тип**: `string`  
**Обязательно**: Нет  
**Описание**: Отображаемый заголовок шага.

Используется для отображения в UI и отладки.

**Пример**:
```ts
title: 'Загрузить данные'
title: 'Обработать информацию'
title: 'Сохранить результат'
```

### sort

**Тип**: `number`  
**Обязательно**: Нет  
**Описание**: Порядок выполнения шага. Чем меньше значение, тем раньше выполняется.

Используется для управления порядком выполнения нескольких шагов в одном flow.

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
**Описание**: Функция-обработчик шага.

Если свойство `use` не используется, можно определить функцию-обработчик напрямую.

**Пример**:
```ts
handler: async (ctx, params) => {
  // Получение информации из контекста
  const { model, flowEngine } = ctx;
  
  // Логика обработки
  const result = await processData(params);
  
  // Возврат результата
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
**Описание**: Схема UI-конфигурации шага.

Определяет, как шаг отображается в интерфейсе, и конфигурацию его формы.

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
      title: 'Имя',
      'x-component': 'Input'
    },
    age: {
      type: 'number',
      title: 'Возраст',
      'x-component': 'InputNumber'
    }
  }
}
```

### beforeParamsSave

**Тип**: `(ctx: FlowSettingsContext<TModel>, params: any, previousParams: any) => void | Promise<void>`  
**Обязательно**: Нет  
**Описание**: Хук-функция, выполняемая перед сохранением параметров.

Выполняется перед сохранением параметров шага и может использоваться для валидации или преобразования параметров.

**Пример**:
```ts
beforeParamsSave: (ctx, params, previousParams) => {
  // Валидация параметров
  if (!params.name) {
    throw new Error('Имя обязательно');
  }
  
  // Преобразование параметров
  params.name = params.name.trim().toLowerCase();
}
```

### afterParamsSave

**Тип**: `(ctx: FlowSettingsContext<TModel>, params: any, previousParams: any) => void | Promise<void>`  
**Обязательно**: Нет  
**Описание**: Хук-функция, выполняемая после сохранения параметров.

Выполняется после сохранения параметров шага и может использоваться для запуска других операций.

**Пример**:
```ts
afterParamsSave: (ctx, params, previousParams) => {
  // Логирование
  console.log('Параметры шага сохранены:', params);
  
  // Запуск других операций
  ctx.model.emitter.emit('paramsChanged', params);
}
```

### uiMode

**Тип**: `StepUIMode | ((ctx: FlowRuntimeContext<TModel>) => StepUIMode | Promise<StepUIMode>)`  
**Обязательно**: Нет  
**Описание**: Режим отображения UI для шага.

Управляет тем, как шаг отображается в интерфейсе.

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
    title: 'Конфигурация шага'
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

Параметры шагов с `preset: true` нужно заполнить при создании. Для шагов без этого флага параметры можно заполнить после создания модели.

**Пример**:
```ts
steps: {
  step1: {
    preset: true,  // Параметры нужно заполнить при создании
    use: 'requiredAction'
  },
  step2: {
    preset: false, // Параметры можно заполнить позже
    use: 'optionalAction'
  }
}
```

### paramsRequired

**Тип**: `boolean`  
**Обязательно**: Нет  
**Описание**: Обязательны ли параметры шага.

Если `true`, перед добавлением модели откроется диалог настройки.

**Пример**:
```ts
paramsRequired: true  // Параметры должны быть настроены до добавления модели
paramsRequired: false // Параметры можно настроить позже
```

### hideInSettings

**Тип**: `boolean`  
**Обязательно**: Нет  
**Описание**: Скрывать ли шаг в меню настроек.

**Пример**:
```ts
hideInSettings: true  // Скрыть в настройках
hideInSettings: false // Показывать в настройках (по умолчанию)
```

### isAwait

**Тип**: `boolean`  
**Обязательно**: Нет  
**Default**: `true`  
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
  title: 'Обработка данных',
  steps: {
    loadData: {
      use: 'loadDataAction',
      title: 'Загрузить данные',
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
      title: 'Обработать данные',
      sort: 1,
      defaultParams: (ctx) => ({
        userId: ctx.model.uid,
        timestamp: Date.now()
      }),
      beforeParamsSave: (ctx, params) => {
        if (!params.processor) {
          throw new Error('Процессор обязателен');
        }
      },
      afterParamsSave: (ctx, params) => {
        ctx.model.emitter.emit('dataProcessed', params);
      }
    },
    saveData: {
      use: 'saveDataAction',
      title: 'Сохранить данные',
      sort: 2,
      hideInSettings: false,
      uiMode: {
        type: 'drawer',
        props: {
          width: 600,
          title: 'Конфигурация сохранения'
        }
      }
    }
  }
});
```