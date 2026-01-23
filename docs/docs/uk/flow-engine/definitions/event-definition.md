:::tip Повідомлення про переклад ШІ
Ця документація була автоматично перекладена штучним інтелектом.
:::


# EventDefinition

`EventDefinition` визначає логіку обробки подій у робочому процесі, що використовується для реагування на певні тригери подій. Події є важливим механізмом у FlowEngine для запуску виконання робочих процесів.

## Визначення типу

```ts
type EventDefinition<TModel extends FlowModel = FlowModel, TCtx extends FlowContext = FlowContext> = ActionDefinition<TModel, TCtx>;
```

`EventDefinition` насправді є псевдонімом для `ActionDefinition`, тому має ті ж самі властивості та методи.

## Спосіб реєстрації

```ts
// Глобальна реєстрація (через FlowEngine)
const engine = new FlowEngine();
engine.registerEvent({
  name: 'clickEvent',
  title: 'Click Event',
  handler: async (ctx, params) => {
    // Логіка обробки події
  }
});

// Реєстрація на рівні моделі (через FlowModel)
class MyModel extends FlowModel {}
MyModel.registerEvent({
  name: 'submitEvent',
  title: 'Submit Event',
  handler: async (ctx, params) => {
    // Логіка обробки події
  }
});

// Використання в робочому процесі
MyModel.registerFlow({
  key: 'formFlow',
  on: 'submitEvent',  // Посилання на зареєстровану подію
  steps: {
    step1: {
      use: 'processFormAction'
    }
  }
});
```

## Опис властивостей

### name

**Тип**: `string`  
**Обов'язково**: Так  
**Опис**: Унікальний ідентифікатор події.

Використовується для посилання на подію в робочому процесі через властивість `on`.

**Приклад**:
```ts
name: 'clickEvent'
name: 'submitEvent'
name: 'customEvent'
```

### title

**Тип**: `string`  
**Обов'язково**: Ні  
**Опис**: Заголовок події для відображення.

Використовується для відображення в інтерфейсі та налагодження.

**Приклад**:
```ts
title: 'Click Event'
title: 'Form Submit'
title: 'Data Change'
```

### handler

**Тип**: `(ctx: TCtx, params: any) => Promise<any> | any`  
**Обов'язково**: Так  
**Опис**: Функція-обробник події.

Основна логіка події, яка отримує контекст та параметри, і повертає результат обробки.

**Приклад**:
```ts
handler: async (ctx, params) => {
  const { model, flowEngine } = ctx;
  
  try {
    // Виконати логіку обробки події
    const result = await handleEvent(params);
    
    // Повернути результат
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
**Обов'язково**: Ні  
**Опис**: Параметри за замовчуванням для події.

Заповнює параметри значеннями за замовчуванням при спрацьовуванні події.

**Приклад**:
```ts
// Статичні параметри за замовчуванням
defaultParams: {
  preventDefault: true,
  stopPropagation: false
}

// Динамічні параметри за замовчуванням
defaultParams: (ctx) => {
  return {
    timestamp: Date.now(),
    userId: ctx.model.uid,
    eventSource: 'user'
  }
}

// Асинхронні параметри за замовчуванням
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
**Обов'язково**: Ні  
**Опис**: Схема конфігурації інтерфейсу користувача для події.

Визначає спосіб відображення події в інтерфейсі та конфігурацію форми.

**Приклад**:
```ts
uiSchema: {
  'x-component': 'Form',
  'x-component-props': {
    layout: 'vertical'
  },
  properties: {
    preventDefault: {
      type: 'boolean',
      title: 'Prevent Default',
      'x-component': 'Switch',
      'x-decorator': 'FormItem'
    },
    stopPropagation: {
      type: 'boolean',
      title: 'Stop Propagation',
      'x-component': 'Switch',
      'x-decorator': 'FormItem'
    },
    customData: {
      type: 'object',
      title: 'Custom Data',
      'x-component': 'Form',
      'x-decorator': 'FormItem',
      properties: {
        key: {
          type: 'string',
          title: 'Key',
          'x-component': 'Input'
        },
        value: {
          type: 'string',
          title: 'Value',
          'x-component': 'Input'
        }
      }
    }
  }
}
```

### beforeParamsSave

**Тип**: `(ctx: FlowSettingsContext<TModel>, params: any, previousParams: any) => void | Promise<void>`  
**Обов'язково**: Ні  
**Опис**: Функція-хук, що виконується перед збереженням параметрів.

Виконується перед збереженням параметрів події; може використовуватися для їх валідації або трансформації.

**Приклад**:
```ts
beforeParamsSave: (ctx, params, previousParams) => {
  // Валідація параметрів
  if (!params.eventType) {
    throw new Error('Event type is required');
  }
  
  // Трансформація параметрів
  params.eventType = params.eventType.toLowerCase();
  
  // Запис змін
  console.log('Event params changed:', {
    from: previousParams,
    to: params
  });
}
```

### afterParamsSave

**Тип**: `(ctx: FlowSettingsContext<TModel>, params: any, previousParams: any) => void | Promise<void>`  
**Обов'язково**: Ні  
**Опис**: Функція-хук, що виконується після збереження параметрів.

Виконується після збереження параметрів події; може використовуватися для запуску інших дій.

**Приклад**:
```ts
afterParamsSave: (ctx, params, previousParams) => {
  // Запис у журнал
  console.log('Event params saved:', params);
  
  // Запуск події
  ctx.model.emitter.emit('eventConfigChanged', {
    eventName: 'clickEvent',
    params,
    previousParams
  });
  
  // Оновлення кешу
  ctx.model.updateCache('eventConfig', params);
}
```

### uiMode

**Тип**: `StepUIMode | ((ctx: FlowRuntimeContext<TModel>) => StepUIMode | Promise<StepUIMode>)`  
**Обов'язково**: Ні  
**Опис**: Режим відображення інтерфейсу користувача для події.

Контролює, як подія відображається в інтерфейсі користувача.

**Підтримувані режими**:
- `'dialog'` - Режим діалогового вікна
- `'drawer'` - Режим висувної панелі
- `'embed'` - Вбудований режим
- Або об'єкт користувацької конфігурації

**Приклад**:
```ts
// Простий режим
uiMode: 'dialog'

// Користувацька конфігурація
uiMode: {
  type: 'dialog',
  props: {
    width: 600,
    title: 'Event Configuration'
  }
}

// Динамічний режим
uiMode: (ctx) => {
  return ctx.model.isMobile ? 'drawer' : 'dialog';
}
```

## Вбудовані типи подій

FlowEngine має вбудовані наступні поширені типи подій:

- `'click'` - Подія кліку
- `'submit'` - Подія відправлення
- `'reset'` - Подія скидання
- `'remove'` - Подія видалення
- `'openView'` - Подія відкриття подання
- `'dropdownOpen'` - Подія відкриття випадаючого списку
- `'popupScroll'` - Подія прокрутки спливаючого вікна
- `'search'` - Подія пошуку
- `'customRequest'` - Подія користувацького запиту
- `'collapseToggle'` - Подія перемикання згортання/розгортання

## Повний приклад

```ts
class FormModel extends FlowModel {}

// Реєстрація події відправлення форми
FormModel.registerEvent({
  name: 'formSubmitEvent',
  title: 'Form Submit Event',
  handler: async (ctx, params) => {
    const { formData, validation } = params;
    
    try {
      // Валідація даних форми
      if (validation && !validateFormData(formData)) {
        throw new Error('Form validation failed');
      }
      
      // Обробка відправлення форми
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
        title: 'Enable Validation',
        'x-component': 'Switch',
        'x-decorator': 'FormItem',
        default: true
      },
      preventDefault: {
        type: 'boolean',
        title: 'Prevent Default',
        'x-component': 'Switch',
        'x-decorator': 'FormItem',
        default: true
      },
      stopPropagation: {
        type: 'boolean',
        title: 'Stop Propagation',
        'x-component': 'Switch',
        'x-decorator': 'FormItem',
        default: false
      },
      customHandlers: {
        type: 'array',
        title: 'Custom Handlers',
        'x-component': 'ArrayItems',
        'x-decorator': 'FormItem',
        items: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              title: 'Handler Name',
              'x-component': 'Input'
            },
            enabled: {
              type: 'boolean',
              title: 'Enabled',
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

// Реєстрація події зміни даних
FormModel.registerEvent({
  name: 'dataChangeEvent',
  title: 'Data Change Event',
  handler: async (ctx, params) => {
    const { field, oldValue, newValue } = params;
    
    try {
      // Запис зміни даних
      await logDataChange({
        field,
        oldValue,
        newValue,
        timestamp: Date.now(),
        userId: ctx.model.uid
      });
      
      // Запуск пов'язаних дій
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

// Використання подій у робочому процесі
FormModel.registerFlow({
  key: 'formProcessing',
  title: 'Form Processing',
  on: 'formSubmitEvent',
  steps: {
    validate: {
      use: 'validateFormAction',
      title: 'Validate Form',
      sort: 0
    },
    process: {
      use: 'processFormAction',
      title: 'Process Form',
      sort: 1
    },
    save: {
      use: 'saveFormAction',
      title: 'Save Form',
      sort: 2
    }
  }
});
```