:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# EventDefinition

`EventDefinition` definierar logiken för händelsehantering i ett arbetsflöde, som används för att svara på specifika händelsetriggers. Händelser är en viktig mekanism i `FlowEngine` för att trigga arbetsflödesexekvering.

## Typdefinition

```ts
type EventDefinition<TModel extends FlowModel = FlowModel, TCtx extends FlowContext = FlowContext> = ActionDefinition<TModel, TCtx>;
```

`EventDefinition` är egentligen ett alias för `ActionDefinition` och har därför samma egenskaper och metoder.

## Registreringsmetod

```ts
// Global registrering (via FlowEngine)
const engine = new FlowEngine();
engine.registerEvent({
  name: 'clickEvent',
  title: 'Click Event',
  handler: async (ctx, params) => {
    // Logik för händelsehantering
  }
});

// Modellnivåregistrering (via FlowModel)
class MyModel extends FlowModel {}
MyModel.registerEvent({
  name: 'submitEvent',
  title: 'Submit Event',
  handler: async (ctx, params) => {
    // Logik för händelsehantering
  }
});

// Användning i ett arbetsflöde
MyModel.registerFlow({
  key: 'formFlow',
  on: 'submitEvent',  // Refererar till en registrerad händelse
  steps: {
    step1: {
      use: 'processFormAction'
    }
  }
});
```

## Egenskapsbeskrivningar

### `name`

**Typ**: `string`  
**Obligatorisk**: Ja  
**Beskrivning**: Den unika identifieraren för händelsen.

Används för att referera till händelsen i ett arbetsflöde via egenskapen `on`.

**Exempel**:
```ts
name: 'clickEvent'
name: 'submitEvent'
name: 'customEvent'
```

### `title`

**Typ**: `string`  
**Obligatorisk**: Nej  
**Beskrivning**: Visningsrubriken för händelsen.

Används för visning i användargränssnittet och för felsökning.

**Exempel**:
```ts
title: 'Click Event'
title: 'Form Submit'
title: 'Data Change'
```

### `handler`

**Typ**: `(ctx: TCtx, params: any) => Promise<any> | any`  
**Obligatorisk**: Ja  
**Beskrivning**: Händelsens hanteringsfunktion.

Händelsens kärnlogik, som tar emot kontext och parametrar och returnerar bearbetningsresultatet.

**Exempel**:
```ts
handler: async (ctx, params) => {
  const { model, flowEngine } = ctx;
  
  try {
    // Utför logik för händelsehantering
    const result = await handleEvent(params);
    
    // Returnera resultatet
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

### `defaultParams`

**Typ**: `Record<string, any> | ((ctx: TCtx) => Record<string, any> | Promise<Record<string, any>>)`  
**Obligatorisk**: Nej  
**Beskrivning**: Händelsens standardparametrar.

Fyller i parametrar med standardvärden när händelsen triggas.

**Exempel**:
```ts
// Statiska standardparametrar
defaultParams: {
  preventDefault: true,
  stopPropagation: false
}

// Dynamiska standardparametrar
defaultParams: (ctx) => {
  return {
    timestamp: Date.now(),
    userId: ctx.model.uid,
    eventSource: 'user'
  }
}

// Asynkrona standardparametrar
defaultParams: async (ctx) => {
  const userInfo = await getUserInfo();
  return {
    user: userInfo,
    session: await getSessionInfo()
  }
}
```

### `uiSchema`

**Typ**: `Record<string, ISchema> | ((ctx: TCtx) => Record<string, ISchema> | Promise<Record<string, ISchema>>)`  
**Obligatorisk**: Nej  
**Beskrivning**: Händelsens UI-konfigurationsschema.

Definierar hur händelsen visas i användargränssnittet och dess formulärkonfiguration.

**Exempel**:
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

### `beforeParamsSave`

**Typ**: `(ctx: FlowSettingsContext<TModel>, params: any, previousParams: any) => void | Promise<void>`  
**Obligatorisk**: Nej  
**Beskrivning**: En hook-funktion som körs innan parametrar sparas.

Utförs innan händelseparametrar sparas och kan användas för parameterverifiering eller -omvandling.

**Exempel**:
```ts
beforeParamsSave: (ctx, params, previousParams) => {
  // Parameterverifiering
  if (!params.eventType) {
    throw new Error('Event type is required');
  }
  
  // Parameteromvandling
  params.eventType = params.eventType.toLowerCase();
  
  // Logga ändringar
  console.log('Event params changed:', {
    from: previousParams,
    to: params
  });
}
```

### `afterParamsSave`

**Typ**: `(ctx: FlowSettingsContext<TModel>, params: any, previousParams: any) => void | Promise<void>`  
**Obligatorisk**: Nej  
**Beskrivning**: En hook-funktion som körs efter att parametrar har sparats.

Utförs efter att händelseparametrar har sparats och kan användas för att trigga andra åtgärder.

**Exempel**:
```ts
afterParamsSave: (ctx, params, previousParams) => {
  // Logga
  console.log('Event params saved:', params);
  
  // Trigga händelse
  ctx.model.emitter.emit('eventConfigChanged', {
    eventName: 'clickEvent',
    params,
    previousParams
  });
  
  // Uppdatera cache
  ctx.model.updateCache('eventConfig', params);
}
```

### `uiMode`

**Typ**: `StepUIMode | ((ctx: FlowRuntimeContext<TModel>) => StepUIMode | Promise<StepUIMode>)`  
**Obligatorisk**: Nej  
**Beskrivning**: Händelsens UI-visningsläge.

Styr hur händelsen visas i användargränssnittet.

**Lägen som stöds**:
- `'dialog'` - Dialogläge
- `'drawer'` - Sidopanelsläge (drawer)
- `'embed'` - Inbäddat läge
- Eller ett anpassat konfigurationsobjekt

**Exempel**:
```ts
// Enkelt läge
uiMode: 'dialog'

// Anpassad konfiguration
uiMode: {
  type: 'dialog',
  props: {
    width: 600,
    title: 'Event Configuration'
  }
}

// Dynamiskt läge
uiMode: (ctx) => {
  return ctx.model.isMobile ? 'drawer' : 'dialog';
}
```

## Inbyggda händelsetyper

`FlowEngine` har följande vanliga inbyggda händelsetyper:

- `'click'` - Klickhändelse
- `'submit'` - Skicka-händelse
- `'reset'` - Återställ-händelse
- `'remove'` - Ta bort-händelse
- `'openView'` - Öppna vy-händelse
- `'dropdownOpen'` - Öppna rullgardinsmeny-händelse
- `'popupScroll'` - Scrollhändelse för popup
- `'search'` - Sökhändelse
- `'customRequest'` - Anpassad förfrågan-händelse
- `'collapseToggle'` - Växla kollaps-händelse

## Fullständigt exempel

```ts
class FormModel extends FlowModel {}

// Registrera händelse för formulärinskick
FormModel.registerEvent({
  name: 'formSubmitEvent',
  title: 'Form Submit Event',
  handler: async (ctx, params) => {
    const { formData, validation } = params;
    
    try {
      // Validera formulärdata
      if (validation && !validateFormData(formData)) {
        throw new Error('Form validation failed');
      }
      
      // Hantera formulärinskick
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

// Registrera händelse för dataändring
FormModel.registerEvent({
  name: 'dataChangeEvent',
  title: 'Data Change Event',
  handler: async (ctx, params) => {
    const { field, oldValue, newValue } = params;
    
    try {
      // Logga dataändring
      await logDataChange({
        field,
        oldValue,
        newValue,
        timestamp: Date.now(),
        userId: ctx.model.uid
      });
      
      // Trigga relaterade åtgärder
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

// Använda händelser i ett arbetsflöde
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