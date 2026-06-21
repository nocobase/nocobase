# EventDefinition

Определение события (`EventDefinition`) определяет логику обработки событий в потоке и используется для реакции на конкретные триггеры событий. События — важный механизм в движке потоков для запуска выполнения потока.

## Определение типа

```ts
type EventDefinition<TModel extends FlowModel = FlowModel, TCtx extends FlowContext = FlowContext> = ActionDefinition<TModel, TCtx>;
```

`EventDefinition` фактически является алиасом для `ActionDefinition`, поэтому имеет те же свойства и методы.

## Способ регистрации

```ts
// Глобальная регистрация (через FlowEngine)
const engine = new FlowEngine();
engine.registerEvent({
  name: 'clickEvent',
  title: 'Событие клика',
  handler: async (ctx, params) => {
    // Логика обработки события
  }
});

// Регистрация на уровне модели (через FlowModel)
class MyModel extends FlowModel {}
MyModel.registerEvent({
  name: 'submitEvent',
  title: 'Событие отправки',
  handler: async (ctx, params) => {
    // Логика обработки события
  }
});

// Использование в flow
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

Используется для ссылки на событие в flow через свойство `on`.

**Пример**:
```ts
name: 'clickEvent'
name: 'submitEvent'
name: 'customEvent'
```

### title

**Тип**: `string`  
**Обязательно**: Нет  
**Описание**: Отображаемый заголовок события.

Используется для отображения в UI и отладки.

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

Базовая логика события, которая принимает контекст и параметры и возвращает результат обработки.

**Пример**:
```ts
handler: async (ctx, params) => {
  const { model, flowEngine } = ctx;
  
  try {
    // Выполнение логики обработки события
    const result = await handleEvent(params);
    
    // Возврат результата
    return {
      success: true,
      data: result,
      message: 'Событие успешно обработано'
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
**Описание**: Схема UI-конфигурации события.

Определяет способ отображения события в UI и конфигурацию его формы.

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
      title: 'Отменять действие по умолчанию',
      'x-component': 'Switch',
      'x-decorator': 'FormItem'
    },
    stopPropagation: {
      type: 'boolean',
      title: 'Останавливать всплытие',
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
**Описание**: Хук-функция, выполняемая перед сохранением параметров.

Выполняется перед сохранением параметров события; может использоваться для валидации или преобразования параметров.

**Пример**:
```ts
beforeParamsSave: (ctx, params, previousParams) => {
  // Валидация параметров
  if (!params.eventType) {
    throw new Error('Тип события обязателен');
  }
  
  // Преобразование параметров
  params.eventType = params.eventType.toLowerCase();
  
  // Логирование изменений
  console.log('Параметры события изменены:', {
    from: previousParams,
    to: params
  });
}
```

### afterParamsSave

**Тип**: `(ctx: FlowSettingsContext<TModel>, params: any, previousParams: any) => void | Promise<void>`  
**Обязательно**: Нет  
**Описание**: Хук-функция, выполняемая после сохранения параметров.

Выполняется после сохранения параметров события; может использоваться для запуска других действий.

**Пример**:
```ts
afterParamsSave: (ctx, params, previousParams) => {
  // Логирование
  console.log('Параметры события сохранены:', params);
  
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
**Описание**: Режим отображения UI для события.

Управляет тем, как событие отображается в UI.

**Поддерживаемые режимы**:
- `'dialog'` - режим диалога
- `'drawer'` - режим выдвижной панели
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

В движке потоков встроены следующие распространённые типы событий:

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
        throw new Error('Ошибка валидации формы');
      }
      
      // Обработка отправки формы
      const result = await submitForm(formData);
      
      return {
        success: true,
        data: result,
        message: 'Форма успешно отправлена'
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
        title: 'Отменять действие по умолчанию',
        'x-component': 'Switch',
        'x-decorator': 'FormItem',
        default: true
      },
      stopPropagation: {
        type: 'boolean',
        title: 'Останавливать всплытие',
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
      throw new Error('Данные формы обязательны, когда включена валидация');
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
      // Логирование изменения данных
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
        message: 'Изменение данных успешно зафиксировано'
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

// Использование событий в flow
FormModel.registerFlow({
  key: 'formProcessing',
  title: 'Обработка формы',
  on: 'formSubmitEvent',
  steps: {
    validate: {
      use: 'validateFormAction',
      title: 'Проверить форму',
      sort: 0
    },
    process: {
      use: 'processFormAction',
      title: 'Обработать форму',
      sort: 1
    },
    save: {
      use: 'saveFormAction',
      title: 'Сохранить форму',
      sort: 2
    }
  }
});
```