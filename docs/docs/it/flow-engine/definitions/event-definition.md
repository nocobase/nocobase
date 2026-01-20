:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# EventDefinition

`EventDefinition` definisce la logica di gestione degli eventi all'interno di un flusso di lavoro, utilizzata per rispondere a specifici trigger di evento. Gli eventi sono un meccanismo fondamentale nel `FlowEngine` per avviare l'esecuzione dei flussi di lavoro.

## Definizione del Tipo

```ts
type EventDefinition<TModel extends FlowModel = FlowModel, TCtx extends FlowContext = FlowContext> = ActionDefinition<TModel, TCtx>;
```

`EventDefinition` è in realtà un alias di `ActionDefinition`, pertanto possiede le stesse proprietà e metodi.

## Metodo di Registrazione

```ts
// Registrazione globale (tramite FlowEngine)
const engine = new FlowEngine();
engine.registerEvent({
  name: 'clickEvent',
  title: 'Click Event',
  handler: async (ctx, params) => {
    // Logica di gestione dell'evento
  }
});

// Registrazione a livello di modello (tramite FlowModel)
class MyModel extends FlowModel {}
MyModel.registerEvent({
  name: 'submitEvent',
  title: 'Submit Event',
  handler: async (ctx, params) => {
    // Logica di gestione dell'evento
  }
});

// Utilizzo in un flusso di lavoro
MyModel.registerFlow({
  key: 'formFlow',
  on: 'submitEvent',  // Riferimento a un evento registrato
  steps: {
    step1: {
      use: 'processFormAction'
    }
  }
});
```

## Descrizione delle Proprietà

### `name`

**Tipo**: `string`  
**Obbligatorio**: Sì  
**Descrizione**: L'identificatore univoco per l'evento.

Utilizzato per fare riferimento all'evento in un flusso di lavoro tramite la proprietà `on`.

**Esempio**:
```ts
name: 'clickEvent'
name: 'submitEvent'
name: 'customEvent'
```

### `title`

**Tipo**: `string`  
**Obbligatorio**: No  
**Descrizione**: Il titolo visualizzato per l'evento.

Utilizzato per la visualizzazione nell'interfaccia utente e per il debugging.

**Esempio**:
```ts
title: 'Click Event'
title: 'Form Submit'
title: 'Data Change'
```

### `handler`

**Tipo**: `(ctx: TCtx, params: any) => Promise<any> | any`  
**Obbligatorio**: Sì  
**Descrizione**: La funzione handler per l'evento.

La logica principale dell'evento, che riceve il contesto e i parametri e restituisce il risultato dell'elaborazione.

**Esempio**:
```ts
handler: async (ctx, params) => {
  const { model, flowEngine } = ctx;
  
  try {
    // Esegue la logica di gestione dell'evento
    const result = await handleEvent(params);
    
    // Restituisce il risultato
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

**Tipo**: `Record<string, any> | ((ctx: TCtx) => Record<string, any> | Promise<Record<string, any>>)`  
**Obbligatorio**: No  
**Descrizione**: I parametri predefiniti per l'evento.

Popola i parametri con valori predefiniti quando l'evento viene attivato.

**Esempio**:
```ts
// Parametri predefiniti statici
defaultParams: {
  preventDefault: true,
  stopPropagation: false
}

// Parametri predefiniti dinamici
defaultParams: (ctx) => {
  return {
    timestamp: Date.now(),
    userId: ctx.model.uid,
    eventSource: 'user'
  }
}

// Parametri predefiniti asincroni
defaultParams: async (ctx) => {
  const userInfo = await getUserInfo();
  return {
    user: userInfo,
    session: await getSessionInfo()
  }
}
```

### `uiSchema`

**Tipo**: `Record<string, ISchema> | ((ctx: TCtx) => Record<string, ISchema> | Promise<Record<string, ISchema>>)`  
**Obbligatorio**: No  
**Descrizione**: Lo schema di configurazione dell'interfaccia utente per l'evento.

Definisce il metodo di visualizzazione e la configurazione del modulo per l'evento nell'interfaccia utente.

**Esempio**:
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

**Tipo**: `(ctx: FlowSettingsContext<TModel>, params: any, previousParams: any) => void | Promise<void>`  
**Obbligatorio**: No  
**Descrizione**: Funzione hook eseguita prima del salvataggio dei parametri.

Eseguita prima che i parametri dell'evento vengano salvati, può essere utilizzata per la validazione o la trasformazione dei parametri.

**Esempio**:
```ts
beforeParamsSave: (ctx, params, previousParams) => {
  // Validazione dei parametri
  if (!params.eventType) {
    throw new Error('Event type is required');
  }
  
  // Trasformazione dei parametri
  params.eventType = params.eventType.toLowerCase();
  
  // Registra le modifiche
  console.log('Event params changed:', {
    from: previousParams,
    to: params
  });
}
```

### `afterParamsSave`

**Tipo**: `(ctx: FlowSettingsContext<TModel>, params: any, previousParams: any) => void | Promise<void>`  
**Obbligatorio**: No  
**Descrizione**: Funzione hook eseguita dopo il salvataggio dei parametri.

Eseguita dopo che i parametri dell'evento sono stati salvati, può essere utilizzata per attivare altre azioni.

**Esempio**:
```ts
afterParamsSave: (ctx, params, previousParams) => {
  // Registra il log
  console.log('Event params saved:', params);
  
  // Attiva l'evento
  ctx.model.emitter.emit('eventConfigChanged', {
    eventName: 'clickEvent',
    params,
    previousParams
  });
  
  // Aggiorna la cache
  ctx.model.updateCache('eventConfig', params);
}
```

### `uiMode`

**Tipo**: `StepUIMode | ((ctx: FlowRuntimeContext<TModel>) => StepUIMode | Promise<StepUIMode>)`  
**Obbligatorio**: No  
**Descrizione**: La modalità di visualizzazione dell'interfaccia utente per l'evento.

Controlla come l'evento viene visualizzato nell'interfaccia utente.

**Modalità supportate**:
- `'dialog'` - Modalità dialogo
- `'drawer'` - Modalità cassetto
- `'embed'` - Modalità incorporata
- Oppure un oggetto di configurazione personalizzato

**Esempio**:
```ts
// Modalità semplice
uiMode: 'dialog'

// Configurazione personalizzata
uiMode: {
  type: 'dialog',
  props: {
    width: 600,
    title: 'Event Configuration'
  }
}

// Modalità dinamica
uiMode: (ctx) => {
  return ctx.model.isMobile ? 'drawer' : 'dialog';
}
```

## Tipi di Evento Integrati

Il `FlowEngine` include i seguenti tipi di evento comuni:

- `'click'` - Evento di click
- `'submit'` - Evento di invio
- `'reset'` - Evento di reset
- `'remove'` - Evento di rimozione
- `'openView'` - Evento di apertura vista
- `'dropdownOpen'` - Evento di apertura dropdown
- `'popupScroll'` - Evento di scroll popup
- `'search'` - Evento di ricerca
- `'customRequest'` - Evento di richiesta personalizzata
- `'collapseToggle'` - Evento di toggle collasso

## Esempio Completo

```ts
class FormModel extends FlowModel {}

// Registra l'evento di invio del modulo
FormModel.registerEvent({
  name: 'formSubmitEvent',
  title: 'Form Submit Event',
  handler: async (ctx, params) => {
    const { formData, validation } = params;
    
    try {
      // Valida i dati del modulo
      if (validation && !validateFormData(formData)) {
        throw new Error('Form validation failed');
      }
      
      // Elabora l'invio del modulo
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

// Registra l'evento di modifica dei dati
FormModel.registerEvent({
  name: 'dataChangeEvent',
  title: 'Data Change Event',
  handler: async (ctx, params) => {
    const { field, oldValue, newValue } = params;
    
    try {
      // Registra la modifica dei dati
      await logDataChange({
        field,
        oldValue,
        newValue,
        timestamp: Date.now(),
        userId: ctx.model.uid
      });
      
      // Attiva le azioni correlate
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

// Utilizzo degli eventi in un flusso di lavoro
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