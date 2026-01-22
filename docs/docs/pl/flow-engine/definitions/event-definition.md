:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# EventDefinition

`EventDefinition` definiuje logikę obsługi zdarzeń w przepływie pracy, służącą do reagowania na określone wyzwalacze zdarzeń. Zdarzenia są kluczowym mechanizmem w silniku przepływów pracy, który uruchamia ich wykonanie.

## Definicja typu

```ts
type EventDefinition<TModel extends FlowModel = FlowModel, TCtx extends FlowContext = FlowContext> = ActionDefinition<TModel, TCtx>;
```

`EventDefinition` jest w rzeczywistości aliasem dla `ActionDefinition`, dlatego posiada te same właściwości i metody.

## Metoda rejestracji

```ts
// Rejestracja globalna (za pośrednictwem FlowEngine)
const engine = new FlowEngine();
engine.registerEvent({
  name: 'clickEvent',
  title: 'Click Event',
  handler: async (ctx, params) => {
    // Logika obsługi zdarzenia
  }
});

// Rejestracja na poziomie modelu (za pośrednictwem FlowModel)
class MyModel extends FlowModel {}
MyModel.registerEvent({
  name: 'submitEvent',
  title: 'Submit Event',
  handler: async (ctx, params) => {
    // Logika obsługi zdarzenia
  }
});

// Użycie w przepływie pracy
MyModel.registerFlow({
  key: 'formFlow',
  on: 'submitEvent',  // Odwołanie do zarejestrowanego zdarzenia
  steps: {
    step1: {
      use: 'processFormAction'
    }
  }
});
```

## Opis właściwości

### name

**Type**: `string`  
**Required**: Yes  
**Description**: Unikalny identyfikator zdarzenia.

Służy do odwoływania się do zdarzenia w przepływie pracy za pomocą właściwości `on`.

**Example**:
```ts
name: 'clickEvent'
name: 'submitEvent'
name: 'customEvent'
```

### title

**Type**: `string`  
**Required**: No  
**Description**: Tytuł wyświetlany dla zdarzenia.

Używany do wyświetlania w interfejsie użytkownika i debugowania.

**Example**:
```ts
title: 'Click Event'
title: 'Form Submit'
title: 'Data Change'
```

### handler

**Type**: `(ctx: TCtx, params: any) => Promise<any> | any`  
**Required**: Yes  
**Description**: Funkcja obsługująca zdarzenie.

Główna logika zdarzenia, która przyjmuje kontekst i parametry, a następnie zwraca wynik przetwarzania.

**Example**:
```ts
handler: async (ctx, params) => {
  const { model, flowEngine } = ctx;
  
  try {
    // Wykonanie logiki obsługi zdarzenia
    const result = await handleEvent(params);
    
    // Zwrócenie wyniku
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

**Type**: `Record<string, any> | ((ctx: TCtx) => Record<string, any> | Promise<Record<string, any>>)`  
**Required**: No  
**Description**: Domyślne parametry dla zdarzenia.

Wypełnia parametry wartościami domyślnymi po wyzwoleniu zdarzenia.

**Example**:
```ts
// Statyczne parametry domyślne
defaultParams: {
  preventDefault: true,
  stopPropagation: false
}

// Dynamiczne parametry domyślne
defaultParams: (ctx) => {
  return {
    timestamp: Date.now(),
    userId: ctx.model.uid,
    eventSource: 'user'
  }
}

// Asynchroniczne parametry domyślne
defaultParams: async (ctx) => {
  const userInfo = await getUserInfo();
  return {
    user: userInfo,
    session: await getSessionInfo()
  }
}
```

### uiSchema

**Type**: `Record<string, ISchema> | ((ctx: TCtx) => Record<string, ISchema> | Promise<Record<string, ISchema>>)`  
**Required**: No  
**Description**: Schemat konfiguracji interfejsu użytkownika dla zdarzenia.

Definiuje sposób wyświetlania zdarzenia w interfejsie użytkownika oraz konfigurację formularza.

**Example**:
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

**Type**: `(ctx: FlowSettingsContext<TModel>, params: any, previousParams: any) => void | Promise<void>`  
**Required**: No  
**Description**: Funkcja hakowa wykonywana przed zapisaniem parametrów.

Wykonywana przed zapisaniem parametrów zdarzenia; może być używana do walidacji lub transformacji parametrów.

**Example**:
```ts
beforeParamsSave: (ctx, params, previousParams) => {
  // Walidacja parametrów
  if (!params.eventType) {
    throw new Error('Event type is required');
  }
  
  // Transformacja parametrów
  params.eventType = params.eventType.toLowerCase();
  
  // Rejestrowanie zmian
  console.log('Event params changed:', {
    from: previousParams,
    to: params
  });
}
```

### afterParamsSave

**Type**: `(ctx: FlowSettingsContext<TModel>, params: any, previousParams: any) => void | Promise<void>`  
**Required**: No  
**Description**: Funkcja hakowa wykonywana po zapisaniu parametrów.

Wykonywana po zapisaniu parametrów zdarzenia; może być używana do wyzwalania innych akcji.

**Example**:
```ts
afterParamsSave: (ctx, params, previousParams) => {
  // Rejestrowanie logów
  console.log('Event params saved:', params);
  
  // Wyzwolenie zdarzenia
  ctx.model.emitter.emit('eventConfigChanged', {
    eventName: 'clickEvent',
    params,
    previousParams
  });
  
  // Aktualizacja pamięci podręcznej
  ctx.model.updateCache('eventConfig', params);
}
```

### uiMode

**Type**: `StepUIMode | ((ctx: FlowRuntimeContext<TModel>) => StepUIMode | Promise<StepUIMode>)`  
**Required**: No  
**Description**: Tryb wyświetlania interfejsu użytkownika dla zdarzenia.

Kontroluje sposób wyświetlania zdarzenia w interfejsie użytkownika.

**Obsługiwane tryby**:
- `'dialog'` - Tryb dialogowy
- `'drawer'` - Tryb szuflady
- `'embed'` - Tryb osadzony
- Lub niestandardowy obiekt konfiguracyjny

**Example**:
```ts
// Tryb prosty
uiMode: 'dialog'

// Niestandardowa konfiguracja
uiMode: {
  type: 'dialog',
  props: {
    width: 600,
    title: 'Event Configuration'
  }
}

// Tryb dynamiczny
uiMode: (ctx) => {
  return ctx.model.isMobile ? 'drawer' : 'dialog';
}
```

## Wbudowane typy zdarzeń

Silnik przepływów pracy ma wbudowane następujące typy zdarzeń:

- `'click'` - Zdarzenie kliknięcia
- `'submit'` - Zdarzenie wysłania
- `'reset'` - Zdarzenie resetowania
- `'remove'` - Zdarzenie usunięcia
- `'openView'` - Zdarzenie otwarcia widoku
- `'dropdownOpen'` - Zdarzenie otwarcia listy rozwijanej
- `'popupScroll'` - Zdarzenie przewijania wyskakującego okna
- `'search'` - Zdarzenie wyszukiwania
- `'customRequest'` - Zdarzenie niestandardowego żądania
- `'collapseToggle'` - Zdarzenie przełączania zwijania

## Pełny przykład

```ts
class FormModel extends FlowModel {}

// Rejestracja zdarzenia wysłania formularza
FormModel.registerEvent({
  name: 'formSubmitEvent',
  title: 'Form Submit Event',
  handler: async (ctx, params) => {
    const { formData, validation } = params;
    
    try {
      // Walidacja danych formularza
      if (validation && !validateFormData(formData)) {
        throw new Error('Form validation failed');
      }
      
      // Przetwarzanie wysłania formularza
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

// Rejestracja zdarzenia zmiany danych
FormModel.registerEvent({
  name: 'dataChangeEvent',
  title: 'Data Change Event',
  handler: async (ctx, params) => {
    const { field, oldValue, newValue } = params;
    
    try {
      // Rejestrowanie zmiany danych
      await logDataChange({
        field,
        oldValue,
        newValue,
        timestamp: Date.now(),
        userId: ctx.model.uid
      });
      
      // Wyzwolenie powiązanych akcji
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

// Użycie zdarzeń w przepływie pracy
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