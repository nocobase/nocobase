:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# EventDefinition

Een EventDefinition definieert de logica voor gebeurtenisafhandeling binnen een workflow. Het wordt gebruikt om te reageren op specifieke gebeurtenistriggers. Gebeurtenissen zijn een belangrijk mechanisme in de FlowEngine voor het activeren van de uitvoering van workflows.

## Type-definitie

```ts
type EventDefinition<TModel extends FlowModel = FlowModel, TCtx extends FlowContext = FlowContext> = ActionDefinition<TModel, TCtx>;
```

Een EventDefinition is eigenlijk een alias voor een ActionDefinition en heeft daarom dezelfde eigenschappen en methoden.

## Registratiemethode

```ts
// Globale registratie (via FlowEngine)
const engine = new FlowEngine();
engine.registerEvent({
  name: 'clickEvent',
  title: 'Click Event',
  handler: async (ctx, params) => {
    // Logica voor gebeurtenisafhandeling
  }
});

// Registratie op modelniveau (via FlowModel)
class MyModel extends FlowModel {}
MyModel.registerEvent({
  name: 'submitEvent',
  title: 'Submit Event',
  handler: async (ctx, params) => {
    // Logica voor gebeurtenisafhandeling
  }
});

// Gebruik in een workflow
MyModel.registerFlow({
  key: 'formFlow',
  on: 'submitEvent',  // Verwijst naar een geregistreerde gebeurtenis
  steps: {
    step1: {
      use: 'processFormAction'
    }
  }
});
```

## Eigenschappen

### name

**Type**: `string`  
**Verplicht**: Ja  
**Beschrijving**: De unieke identificatie voor de gebeurtenis.

Gebruikt om de gebeurtenis in een workflow te verwijzen via de `on`-eigenschap.

**Voorbeeld**:
```ts
name: 'clickEvent'
name: 'submitEvent'
name: 'customEvent'
```

### title

**Type**: `string`  
**Verplicht**: Nee  
**Beschrijving**: De weergavetitel voor de gebeurtenis.

Gebruikt voor weergave in de gebruikersinterface en voor debugging.

**Voorbeeld**:
```ts
title: 'Click Event'
title: 'Form Submit'
title: 'Data Change'
```

### handler

**Type**: `(ctx: TCtx, params: any) => Promise<any> | any`  
**Verplicht**: Ja  
**Beschrijving**: De handler-functie voor de gebeurtenis.

Dit is de kernlogica van de gebeurtenis, die de context en parameters ontvangt en het verwerkingsresultaat retourneert.

**Voorbeeld**:
```ts
handler: async (ctx, params) => {
  const { model, flowEngine } = ctx;
  
  try {
    // Voer de logica voor gebeurtenisafhandeling uit
    const result = await handleEvent(params);
    
    // Retourneer het resultaat
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
**Verplicht**: Nee  
**Beschrijving**: De standaardparameters voor de gebeurtenis.

Vult parameters met standaardwaarden wanneer de gebeurtenis wordt geactiveerd.

**Voorbeeld**:
```ts
// Statische standaardparameters
defaultParams: {
  preventDefault: true,
  stopPropagation: false
}

// Dynamische standaardparameters
defaultParams: (ctx) => {
  return {
    timestamp: Date.now(),
    userId: ctx.model.uid,
    eventSource: 'user'
  }
}

// Asynchrone standaardparameters
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
**Verplicht**: Nee  
**Beschrijving**: Het UI-configuratieschema voor de gebeurtenis.

Definieert de weergavemethode en formulierconfiguratie voor de gebeurtenis in de gebruikersinterface.

**Voorbeeld**:
```ts
uiSchema: {
  'x-component': 'Form',
  'x-component-props': {
    layout: 'vertical'
  },
  properties: {
    preventDefault: {
      type: 'boolean',
      title: 'Standaardactie voorkomen',
      'x-component': 'Switch',
      'x-decorator': 'FormItem'
    },
    stopPropagation: {
      type: 'boolean',
      title: 'Propagatie stoppen',
      'x-component': 'Switch',
      'x-decorator': 'FormItem'
    },
    customData: {
      type: 'object',
      title: 'Aangepaste gegevens',
      'x-component': 'Form',
      'x-decorator': 'FormItem',
      properties: {
        key: {
          type: 'string',
          title: 'Sleutel',
          'x-component': 'Input'
        },
        value: {
          type: 'string',
          title: 'Waarde',
          'x-component': 'Input'
        }
      }
    }
  }
}
```

### beforeParamsSave

**Type**: `(ctx: FlowSettingsContext<TModel>, params: any, previousParams: any) => void | Promise<void>`  
**Verplicht**: Nee  
**Beschrijving**: Hook-functie die wordt uitgevoerd voordat parameters worden opgeslagen.

Deze functie wordt uitgevoerd voordat gebeurtenisparameters worden opgeslagen en kan worden gebruikt voor parametervalidatie of -transformatie.

**Voorbeeld**:
```ts
beforeParamsSave: (ctx, params, previousParams) => {
  // Parametervalidatie
  if (!params.eventType) {
    throw new Error('Event type is required');
  }
  
  // Parametertransformatie
  params.eventType = params.eventType.toLowerCase();
  
  // Wijzigingen loggen
  console.log('Event params changed:', {
    from: previousParams,
    to: params
  });
}
```

### afterParamsSave

**Type**: `(ctx: FlowSettingsContext<TModel>, params: any, previousParams: any) => void | Promise<void>`  
**Verplicht**: Nee  
**Beschrijving**: Hook-functie die wordt uitgevoerd nadat parameters zijn opgeslagen.

Deze functie wordt uitgevoerd nadat gebeurtenisparameters zijn opgeslagen en kan worden gebruikt om andere acties te activeren.

**Voorbeeld**:
```ts
afterParamsSave: (ctx, params, previousParams) => {
  // Loggen
  console.log('Event params saved:', params);
  
  // Gebeurtenis activeren
  ctx.model.emitter.emit('eventConfigChanged', {
    eventName: 'clickEvent',
    params,
    previousParams
  });
  
  // Cache bijwerken
  ctx.model.updateCache('eventConfig', params);
}
```

### uiMode

**Type**: `StepUIMode | ((ctx: FlowRuntimeContext<TModel>) => StepUIMode | Promise<StepUIMode>)`  
**Verplicht**: Nee  
**Beschrijving**: De UI-weergavemodus voor de gebeurtenis.

Bepaalt hoe de gebeurtenis wordt weergegeven in de gebruikersinterface.

**Ondersteunde modi**:
- `'dialog'` - Dialoogvenstermodus
- `'drawer'` - Lade-modus
- `'embed'` - Ingesloten modus
- Of een aangepast configuratieobject

**Voorbeeld**:
```ts
// Eenvoudige modus
uiMode: 'dialog'

// Aangepaste configuratie
uiMode: {
  type: 'dialog',
  props: {
    width: 600,
    title: 'Gebeurtenisconfiguratie'
  }
}

// Dynamische modus
uiMode: (ctx) => {
  return ctx.model.isMobile ? 'drawer' : 'dialog';
}
```

## Ingebouwde gebeurtenistypen

De FlowEngine heeft de volgende veelvoorkomende gebeurtenistypen ingebouwd:

- `'click'` - Klikgebeurtenis
- `'submit'` - Indienen-gebeurtenis
- `'reset'` - Reset-gebeurtenis
- `'remove'` - Verwijder-gebeurtenis
- `'openView'` - Open-weergave-gebeurtenis
- `'dropdownOpen'` - Dropdown-open-gebeurtenis
- `'popupScroll'` - Pop-up-scroll-gebeurtenis
- `'search'` - Zoek-gebeurtenis
- `'customRequest'` - Aangepaste-aanvraag-gebeurtenis
- `'collapseToggle'` - Inklap-toggle-gebeurtenis

## Volledig voorbeeld

```ts
class FormModel extends FlowModel {}

// Registreer formulierindieningsgebeurtenis
FormModel.registerEvent({
  name: 'formSubmitEvent',
  title: 'Formulierindieningsgebeurtenis',
  handler: async (ctx, params) => {
    const { formData, validation } = params;
    
    try {
      // Valideer formuliergegevens
      if (validation && !validateFormData(formData)) {
        throw new Error('Form validation failed');
      }
      
      // Verwerk formulierindiening
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
        title: 'Validatie inschakelen',
        'x-component': 'Switch',
        'x-decorator': 'FormItem',
        default: true
      },
      preventDefault: {
        type: 'boolean',
        title: 'Standaardactie voorkomen',
        'x-component': 'Switch',
        'x-decorator': 'FormItem',
        default: true
      },
      stopPropagation: {
        type: 'boolean',
        title: 'Propagatie stoppen',
        'x-component': 'Switch',
        'x-decorator': 'FormItem',
        default: false
      },
      customHandlers: {
        type: 'array',
        title: 'Aangepaste handlers',
        'x-component': 'ArrayItems',
        'x-decorator': 'FormItem',
        items: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              title: 'Handlernaam',
              'x-component': 'Input'
            },
            enabled: {
              type: 'boolean',
              title: 'Ingeschakeld',
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

// Registreer gegevenswijzigingsgebeurtenis
FormModel.registerEvent({
  name: 'dataChangeEvent',
  title: 'Gegevenswijzigingsgebeurtenis',
  handler: async (ctx, params) => {
    const { field, oldValue, newValue } = params;
    
    try {
      // Log gegevenswijziging
      await logDataChange({
        field,
        oldValue,
        newValue,
        timestamp: Date.now(),
        userId: ctx.model.uid
      });
      
      // Activeer gerelateerde acties
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

// Gebeurtenissen gebruiken in een workflow
FormModel.registerFlow({
  key: 'formProcessing',
  title: 'Formulierverwerking',
  on: 'formSubmitEvent',
  steps: {
    validate: {
      use: 'validateFormAction',
      title: 'Formulier valideren',
      sort: 0
    },
    process: {
      use: 'processFormAction',
      title: 'Formulier verwerken',
      sort: 1
    },
    save: {
      use: 'saveFormAction',
      title: 'Formulier opslaan',
      sort: 2
    }
  }
});
```