:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# EventDefinition

EventDefinition definiert die Ereignisbehandlungslogik in einem Workflow und wird verwendet, um auf bestimmte Ereignisauslöser zu reagieren. Ereignisse sind ein wichtiger Mechanismus in der FlowEngine, um die Ausführung von Workflows zu starten.

## Typdefinition

```ts
type EventDefinition<TModel extends FlowModel = FlowModel, TCtx extends FlowContext = FlowContext> = ActionDefinition<TModel, TCtx>;
```

EventDefinition ist eigentlich ein Alias für ActionDefinition und besitzt daher dieselben Eigenschaften und Methoden.

## Registrierungsarten

```ts
// Globale Registrierung (über FlowEngine)
const engine = new FlowEngine();
engine.registerEvent({
  name: 'clickEvent',
  title: 'Click Event',
  handler: async (ctx, params) => {
    // Ereignisbehandlungslogik
  }
});

// Modellbasierte Registrierung (über FlowModel)
class MyModel extends FlowModel {}
MyModel.registerEvent({
  name: 'submitEvent',
  title: 'Submit Event',
  handler: async (ctx, params) => {
    // Ereignisbehandlungslogik
  }
});

// Verwendung in einem Workflow
MyModel.registerFlow({
  key: 'formFlow',
  on: 'submitEvent',  // Verweis auf ein registriertes Ereignis
  steps: {
    step1: {
      use: 'processFormAction'
    }
  }
});
```

## Eigenschaften

### name

**Typ**: `string`  
**Erforderlich**: Ja  
**Beschreibung**: Der eindeutige Bezeichner für das Ereignis.

Wird verwendet, um das Ereignis in einem Workflow über die Eigenschaft `on` zu referenzieren.

**Beispiel**:
```ts
name: 'clickEvent'
name: 'submitEvent'
name: 'customEvent'
```

### title

**Typ**: `string`  
**Erforderlich**: Nein  
**Beschreibung**: Der Anzeigetitel für das Ereignis.

Wird für die Anzeige in der Benutzeroberfläche und zum Debuggen verwendet.

**Beispiel**:
```ts
title: 'Click Event'
title: 'Form Submit'
title: 'Data Change'
```

### handler

**Typ**: `(ctx: TCtx, params: any) => Promise<any> | any`  
**Erforderlich**: Ja  
**Beschreibung**: Die Handler-Funktion für das Ereignis.

Die Kernlogik des Ereignisses, die den Kontext und die Parameter empfängt und das Verarbeitungsergebnis zurückgibt.

**Beispiel**:
```ts
handler: async (ctx, params) => {
  const { model, flowEngine } = ctx;
  
  try {
    // Ereignisbehandlungslogik ausführen
    const result = await handleEvent(params);
    
    // Ergebnis zurückgeben
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

**Typ**: `Record<string, any> | ((ctx: TCtx) => Record<string, any> | Promise<Record<string, any>>)`  
**Erforderlich**: Nein  
**Beschreibung**: Die Standardparameter für das Ereignis.

Füllt Parameter mit Standardwerten auf, wenn das Ereignis ausgelöst wird.

**Beispiel**:
```ts
// Statische Standardparameter
defaultParams: {
  preventDefault: true,
  stopPropagation: false
}

// Dynamische Standardparameter
defaultParams: (ctx) => {
  return {
    timestamp: Date.now(),
    userId: ctx.model.uid,
    eventSource: 'user'
  }
}

// Asynchrone Standardparameter
defaultParams: async (ctx) => {
  const userInfo = await getUserInfo();
  return {
    user: userInfo,
    session: await getSessionInfo()
  }
}
```

### uiSchema

**Typ**: `Record<string, ISchema> | ((ctx: TCtx) => Record<string, ISchema> | Promise<Record<string, ISchema>>)`  
**Erforderlich**: Nein  
**Beschreibung**: Das UI-Konfigurationsschema für das Ereignis.

Definiert die Anzeigemethode und Formular-Konfiguration für das Ereignis in der Benutzeroberfläche.

**Beispiel**:
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

**Typ**: `(ctx: FlowSettingsContext<TModel>, params: any, previousParams: any) => void | Promise<void>`  
**Erforderlich**: Nein  
**Beschreibung**: Die Hook-Funktion, die vor dem Speichern der Parameter ausgeführt wird.

Wird ausgeführt, bevor Ereignisparameter gespeichert werden, und kann zur Parametervalidierung oder -transformation verwendet werden.

**Beispiel**:
```ts
beforeParamsSave: (ctx, params, previousParams) => {
  // Parametervalidierung
  if (!params.eventType) {
    throw new Error('Event type is required');
  }
  
  // Parametertransformation
  params.eventType = params.eventType.toLowerCase();
  
  // Änderungen protokollieren
  console.log('Event params changed:', {
    from: previousParams,
    to: params
  });
}
```

### afterParamsSave

**Typ**: `(ctx: FlowSettingsContext<TModel>, params: any, previousParams: any) => void | Promise<void>`  
**Erforderlich**: Nein  
**Beschreibung**: Die Hook-Funktion, die nach dem Speichern der Parameter ausgeführt wird.

Wird ausgeführt, nachdem Ereignisparameter gespeichert wurden, und kann zum Auslösen anderer Aktionen verwendet werden.

**Beispiel**:
```ts
afterParamsSave: (ctx, params, previousParams) => {
  // Protokollieren
  console.log('Event params saved:', params);
  
  // Ereignis auslösen
  ctx.model.emitter.emit('eventConfigChanged', {
    eventName: 'clickEvent',
    params,
    previousParams
  });
  
  // Cache aktualisieren
  ctx.model.updateCache('eventConfig', params);
}
```

### uiMode

**Typ**: `StepUIMode | ((ctx: FlowRuntimeContext<TModel>) => StepUIMode | Promise<StepUIMode>)`  
**Erforderlich**: Nein  
**Beschreibung**: Der UI-Anzeigemodus für das Ereignis.

Steuert, wie das Ereignis in der Benutzeroberfläche angezeigt wird.

**Unterstützte Modi**:
- `'dialog'` - Dialogmodus
- `'drawer'` - Schubladenmodus
- `'embed'` - Einbettungsmodus
- Oder ein benutzerdefiniertes Konfigurationsobjekt

**Beispiel**:
```ts
// Einfacher Modus
uiMode: 'dialog'

// Benutzerdefinierte Konfiguration
uiMode: {
  type: 'dialog',
  props: {
    width: 600,
    title: 'Event Configuration'
  }
}

// Dynamischer Modus
uiMode: (ctx) => {
  return ctx.model.isMobile ? 'drawer' : 'dialog';
}
```

## Integrierte Ereignistypen

Die FlowEngine verfügt über die folgenden integrierten gängigen Ereignistypen:

- `'click'` - Klick-Ereignis
- `'submit'` - Sende-Ereignis
- `'reset'` - Zurücksetzungs-Ereignis
- `'remove'` - Lösch-Ereignis
- `'openView'` - Ansicht-öffnen-Ereignis
- `'dropdownOpen'` - Dropdown-öffnen-Ereignis
- `'popupScroll'` - Popup-Scroll-Ereignis
- `'search'` - Such-Ereignis
- `'customRequest'` - Benutzerdefiniertes Anfrage-Ereignis
- `'collapseToggle'` - Zusammenklappen-Umschalt-Ereignis

## Vollständiges Beispiel

```ts
class FormModel extends FlowModel {}

// Formular-Sende-Ereignis registrieren
FormModel.registerEvent({
  name: 'formSubmitEvent',
  title: 'Formular-Sende-Ereignis',
  handler: async (ctx, params) => {
    const { formData, validation } = params;
    
    try {
      // Formulardaten validieren
      if (validation && !validateFormData(formData)) {
        throw new Error('Form validation failed');
      }
      
      // Formularübermittlung verarbeiten
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
        title: 'Validierung aktivieren',
        'x-component': 'Switch',
        'x-decorator': 'FormItem',
        default: true
      },
      preventDefault: {
        type: 'boolean',
        title: 'Standardverhalten verhindern',
        'x-component': 'Switch',
        'x-decorator': 'FormItem',
        default: true
      },
      stopPropagation: {
        type: 'boolean',
        title: 'Propagation stoppen',
        'x-component': 'Switch',
        'x-decorator': 'FormItem',
        default: false
      },
      customHandlers: {
        type: 'array',
        title: 'Benutzerdefinierte Handler',
        'x-component': 'ArrayItems',
        'x-decorator': 'FormItem',
        items: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              title: 'Handler-Name',
              'x-component': 'Input'
            },
            enabled: {
              type: 'boolean',
              title: 'Aktiviert',
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

// Datenänderungsereignis registrieren
FormModel.registerEvent({
  name: 'dataChangeEvent',
  title: 'Datenänderungsereignis',
  handler: async (ctx, params) => {
    const { field, oldValue, newValue } = params;
    
    try {
      // Datenänderung protokollieren
      await logDataChange({
        field,
        oldValue,
        newValue,
        timestamp: Date.now(),
        userId: ctx.model.uid
      });
      
      // Verwandte Aktionen auslösen
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

// Ereignisse in einem Workflow verwenden
FormModel.registerFlow({
  key: 'formProcessing',
  title: 'Formularverarbeitung',
  on: 'formSubmitEvent',
  steps: {
    validate: {
      use: 'validateFormAction',
      title: 'Formular validieren',
      sort: 0
    },
    process: {
      use: 'processFormAction',
      title: 'Formular verarbeiten',
      sort: 1
    },
    save: {
      use: 'saveFormAction',
      title: 'Formular speichern',
      sort: 2
    }
  }
});
```