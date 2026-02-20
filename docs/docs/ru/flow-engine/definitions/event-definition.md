:::tip Уведомление о переводе ИИ
Эта документация была автоматически переведена ИИ.
:::

# EventDefinition

`EventDefinition` определяет логику обработки событий в рабочем процессе, используемую для реагирования на определённые события. События — это важный механизм в FlowEngine для запуска выполнения рабочих процессов.

## Определение типа

```ts
type EventDefinition<TModel extends FlowModel = FlowModel, TCtx extends FlowContext = FlowContext> = ActionDefinition<TModel, TCtx>;
```

`EventDefinition` по сути, является псевдонимом для `ActionDefinition` и, следовательно, обладает теми же свойствами и методами.

## Способы регистрации

```ts
// Глобальная регистрация (через FlowEngine)
const engine = new FlowEngine();
engine.registerEvent({
  name: 'clickEvent',
  title: 'Click Event',
  handler: async (ctx, params) => {
    // Логика обработки события
  }
});

// Регистрация на уровне модели (через FlowModel)
class MyModel extends FlowModel {}
MyModel.registerEvent({
  name: 'submitEvent',
  title: 'Submit Event',
  handler: async (ctx, params) => {
    // Логика обработки события
  }
});

// Использование в рабочем процессе
MyModel.registerFlow({
  key: 'formFlow',
  on: 'submitEvent',  // Ссылка на зарегистрированное событие
  steps: {
    step1: {
      use: 'processFormAction'
    }
  }
});
```

## Описание свойств

### name

**Тип**: `string`  
**Обязательно**: Да  
**Описание**: Уникальный идентификатор события.

Используется для ссылки на событие в рабочем процессе через свойство `on`.

**Пример**:
```ts
name: 'clickEvent'
name: 'submitEvent'
name: 'customEvent'
```

### title

**Тип**: `string`  
**Обязательно**: Нет  
**Описание**: Отображаемое название события.

Используется для отображения в пользовательском интерфейсе и отладки.

**Пример**:
```ts
title: 'Click Event'
title: 'Form Submit'
title: 'Data Change'
```

### handler

**Тип**: `(ctx: TCtx, params: any) => Promise<any> | any`  
**Обязательно**: Да  
**Описание**: Функция-обработчик события.

Основная логика события, которая принимает контекст и параметры, а затем возвращает результат обработки.

**Пример**:
```ts
handler: async (ctx, params) => {
  const { model, flowEngine } = ctx;
  
  try {
    // Выполнить логику обработки события
    const result = await handleEvent(params);
    
    // Вернуть результат
    return {
      success: true,
      data: result,
      message: 'Event handled successfully'
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
**Описание**: Параметры события по умолчанию.

Заполняет параметры значениями по умолчанию при срабатывании события.

**Пример**:
```ts
// Статические параметры по умолчанию
defaultParams: {
  preventDefault: true,
  stopPropagation: false
}

// Динамические параметры по умолчанию
defaultParams: (ctx) => {
  return {
    timestamp: Date.now(),
    userId: ctx.model.uid,
    eventSource: 'user'
  }
}

// Асинхронные параметры по умолчанию
defaultParams: async (ctx) => {
  const userInfo = await getUserInfo();
  return {
    user: userInfo,
    session: await getSessionInfo()
  }
}
```

### uiSchema

**Тип**: `Record<string, ISchema> | ((ctx: TCtx) => Record<string, ISchema> | Promise<Record<string, ISchema>>)`  
**Обязательно**: Нет  
**Описание**: Схема конфигурации пользовательского интерфейса для события.

Определяет способ отображения события и конфигурацию формы в пользовательском интерфейсе.

**Пример**:
```ts
uiSchema: {
  'x-component': 'Form',
  'x-component-props': {
    layout: 'vertical'
  },
  properties: {
    preventDefault: {
      type: 'boolean',
      title: 'Предотвратить действие по умолчанию',
      'x-component': 'Switch',
      'x-decorator': 'FormItem'
    },
    stopPropagation: {
      type: 'boolean',
      title: 'Остановить распространение',
      'x-component': 'Switch',
      'x-decorator': 'FormItem'
    },
    customData: {
      type: 'object',
      title: 'Пользовательские данные',
      'x-component': 'Form',
      'x-decorator': 'FormItem',
      properties: {
        key: {
          type: 'string',
          title: 'Ключ',
          'x-component': 'Input'
        },
        value: {
          type: 'string',
          title: 'Значение',
          'x-component': 'Input'
        }
      }
    }
  }
}
```

### beforeParamsSave

**Тип**: `(ctx: FlowSettingsContext<TModel>, params: any, previousParams: any) => void | Promise<void>`  
**Обязательно**: Нет  
**Описание**: Функция-хук, выполняемая перед сохранением параметров.

Выполняется перед сохранением параметров события и может использоваться для их валидации или преобразования.

**Пример**:
```ts
beforeParamsSave: (ctx, params, previousParams) => {
  // Валидация параметров
  if (!params.eventType) {
    throw new Error('Event type is required');
  }
  
  // Преобразование параметров
  params.eventType = params.eventType.toLowerCase();
  
  // Запись изменений
  console.log('Event params changed:', {
    from: previousParams,
    to: params
  });
}
```

### afterParamsSave

**Тип**: `(ctx: FlowSettingsContext<TModel>, params: any, previousParams: any) => void | Promise<void>`  
**Обязательно**: Нет  
**Описание**: Функция-хук, выполняемая после сохранения параметров.

Выполняется после сохранения параметров события и может использоваться для запуска других операций.

**Пример**:
```ts
afterParamsSave: (ctx, params, previousParams) => {
  // Запись в журнал
  console.log('Event params saved:', params);
  
  // Запуск события
  ctx.model.emitter.emit('eventConfigChanged', {
    eventName: 'clickEvent',
    params,
    previousParams
  });
  
  // Обновление кэша
  ctx.model.updateCache('eventConfig', params);
}
```

### uiMode

**Тип**: `StepUIMode | ((ctx: FlowRuntimeContext<TModel>) => StepUIMode | Promise<StepUIMode>)`  
**Обязательно**: Нет  
**Описание**: Режим отображения события в пользовательском интерфейсе.

Контролирует способ отображения события в пользовательском интерфейсе.

**Поддерживаемые режимы**:
- `'dialog'` - режим диалогового окна
- `'drawer'` - режим выдвижной панели
- `'embed'` - встроенный режим
- Или пользовательский объект конфигурации

**Пример**:
```ts
// Простой режим
uiMode: 'dialog'

// Пользовательская конфигурация
uiMode: {
  type: 'dialog',
  props: {
    width: 600,
    title: 'Конфигурация события'
  }
}

// Динамический режим
uiMode: (ctx) => {
  return ctx.model.isMobile ? 'drawer' : 'dialog';
}
```

## Встроенные типы событий

FlowEngine включает следующие встроенные типы событий:

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

## Полный пример

```ts
class FormModel extends FlowModel {}

// Регистрация события отправки формы
FormModel.registerEvent({
  name: 'formSubmitEvent',
  title: 'Событие отправки формы',
  handler: async (ctx, params) => {
    const { formData, validation } = params;
    
    try {
      // Валидация данных формы
      if (validation && !validateFormData(formData)) {
        throw new Error('Form validation failed');
      }
      
      // Обработка отправки формы
      const result = await submitForm(formData);
      
      return {
        success: true,
        data: result,
        message: 'Form submitted successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },
  defaultParams: {
    validation: true,
    preventDefault: true,
    stopPropagation: false
  },
  uiSchema: {
    'x-component': 'Form',
    properties: {
      validation: {
        type: 'boolean',
        title: 'Включить валидацию',
        'x-component': 'Switch',
        'x-decorator': 'FormItem',
        default: true
      },
      preventDefault: {
        type: 'boolean',
        title: 'Предотвратить действие по умолчанию',
        'x-component': 'Switch',
        'x-decorator': 'FormItem',
        default: true
      },
      stopPropagation: {
        type: 'boolean',
        title: 'Остановить распространение',
        'x-component': 'Switch',
        'x-decorator': 'FormItem',
        default: false
      },
      customHandlers: {
        type: 'array',
        title: 'Пользовательские обработчики',
        'x-component': 'ArrayItems',
        'x-decorator': 'FormItem',
        items: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              title: 'Имя обработчика',
              'x-component': 'Input'
            },
            enabled: {
              type: 'boolean',
              title: 'Включено',
              'x-component': 'Switch'
            }
          }
        }
      }
    }
  },
  beforeParamsSave: (ctx, params) => {
    if (params.validation && !params.formData) {
      throw new Error('Form data is required when validation is enabled');
    }
  },
  afterParamsSave: (ctx, params) => {
    ctx.model.emitter.emit('formEventConfigChanged', params);
  },
  uiMode: 'dialog'
});

// Регистрация события изменения данных
FormModel.registerEvent({
  name: 'dataChangeEvent',
  title: 'Событие изменения данных',
  handler: async (ctx, params) => {
    const { field, oldValue, newValue } = params;
    
    try {
      // Запись изменения данных
      await logDataChange({
        field,
        oldValue,
        newValue,
        timestamp: Date.now(),
        userId: ctx.model.uid
      });
      
      // Запуск связанных действий
      ctx.model.emitter.emit('dataChanged', {
        field,
        oldValue,
        newValue
      });
      
      return {
        success: true,
        message: 'Data change logged successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },
  defaultParams: (ctx) => ({
    logLevel: 'info',
    notify: true,
    timestamp: Date.now()
  }),
  uiMode: 'embed'
});

// Использование событий в рабочем процессе
FormModel.registerFlow({
  key: 'formProcessing',
  title: 'Обработка формы',
  on: 'formSubmitEvent',
  steps: {
    validate: {
      use: 'validateFormAction',
      title: 'Валидация формы',
      sort: 0
    },
    process: {
      use: 'processFormAction',
      title: 'Обработка формы',
      sort: 1
    },
    save: {
      use: 'saveFormAction',
      title: 'Сохранение формы',
      sort: 2
    }
  }
});
```