:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# ActionDefinition

ActionDefinition definisce azioni riutilizzabili che possono essere richiamate in più flussi di lavoro e passaggi. Un'azione è l'unità di esecuzione centrale nel FlowEngine, e incapsula la logica di business specifica.

## Definizione del Tipo

```ts
interface ActionDefinition<TModel extends FlowModel = FlowModel, TCtx extends FlowContext = FlowContext> {
  name: string;
  title?: string;
  handler: (ctx: TCtx, params: any) => Promise<any> | any;
  uiSchema?: Record<string, ISchema> | ((ctx: TCtx) => Record<string, ISchema> | Promise<Record<string, ISchema>>);
  defaultParams?: Record<string, any> | ((ctx: TCtx) => Record<string, any> | Promise<Record<string, any>>);
  beforeParamsSave?: (ctx: FlowSettingsContext<TModel>, params: any, previousParams: any) => void | Promise<void>;
  afterParamsSave?: (ctx: FlowSettingsContext<TModel>, params: any, previousParams: any) => void | Promise<void>;
  useRawParams?: boolean | ((ctx: TCtx) => boolean | Promise<boolean>);
  uiMode?: StepUIMode | ((ctx: FlowRuntimeContext<TModel>) => StepUIMode | Promise<StepUIMode>);
  scene?: ActionScene | ActionScene[];
  sort?: number;
}
```

## Metodo di Registrazione

```ts
// Registrazione globale (tramite FlowEngine)
const engine = new FlowEngine();
engine.registerAction({
  name: 'loadDataAction',
  title: 'Load Data',
  handler: async (ctx, params) => {
    // Logica di elaborazione
  }
});

// Registrazione a livello di modello (tramite FlowModel)
class MyModel extends FlowModel {}
MyModel.registerAction({
  name: 'processDataAction',
  title: 'Process Data',
  handler: async (ctx, params) => {
    // Logica di elaborazione
  }
});

// Utilizzo in un flusso di lavoro
MyModel.registerFlow({
  key: 'dataFlow',
  steps: {
    step1: {
      use: 'loadDataAction',  // Riferimento all'azione globale
    },
    step2: {
      use: 'processDataAction', // Riferimento all'azione a livello di modello
    }
  }
});
```

## Descrizione delle Proprietà

### name

**Tipo**: `string`  
**Obbligatorio**: Sì  
**Descrizione**: L'identificatore unico per l'azione

Utilizzato per richiamare l'azione in un passaggio tramite la proprietà `use`.

**Esempio**:
```ts
name: 'loadDataAction'
name: 'processDataAction'
name: 'saveDataAction'
```

### title

**Tipo**: `string`  
**Obbligatorio**: No  
**Descrizione**: Il titolo visualizzato per l'azione

Utilizzato per la visualizzazione nell'interfaccia utente e per il debug.

**Esempio**:
```ts
title: 'Load Data'
title: 'Process Information'
title: 'Save Results'
```

### handler

**Tipo**: `(ctx: TCtx, params: any) => Promise<any> | any`  
**Obbligatorio**: Sì  
**Descrizione**: La funzione handler per l'azione

La logica centrale dell'azione, che riceve il contesto e i parametri, e restituisce il risultato dell'elaborazione.

**Esempio**:
```ts
handler: async (ctx, params) => {
  const { model, flowEngine } = ctx;
  
  try {
    // Esegue la logica specifica
    const result = await performAction(params);
    
    // Restituisce il risultato
    return {
      success: true,
      data: result,
      message: 'Action completed successfully'
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

**Tipo**: `Record<string, any> | ((ctx: TCtx) => Record<string, any> | Promise<Record<string, any>>)`  
**Obbligatorio**: No  
**Descrizione**: I parametri predefiniti per l'azione

Popola i parametri con valori predefiniti prima che l'azione venga eseguita.

**Esempio**:
```ts
// Parametri predefiniti statici
defaultParams: {
  timeout: 5000,
  retries: 3,
  format: 'json'
}

// Parametri predefiniti dinamici
defaultParams: (ctx) => {
  return {
    userId: ctx.model.uid,
    timestamp: Date.now(),
    version: ctx.flowEngine.version
  }
}

// Parametri predefiniti asincroni
defaultParams: async (ctx) => {
  const config = await loadConfiguration();
  return {
    apiUrl: config.apiUrl,
    apiKey: config.apiKey,
    timeout: config.timeout
  }
}
```

### uiSchema

**Tipo**: `Record<string, ISchema> | ((ctx: TCtx) => Record<string, ISchema> | Promise<Record<string, ISchema>>)`  
**Obbligatorio**: No  
**Descrizione**: Lo schema di configurazione dell'interfaccia utente per l'azione

Definisce come l'azione viene visualizzata nell'interfaccia utente e la sua configurazione del modulo.

**Esempio**:
```ts
uiSchema: {
  'x-component': 'Form',
  'x-component-props': {
    layout: 'vertical',
    labelCol: { span: 6 },
    wrapperCol: { span: 18 }
  },
  properties: {
    url: {
      type: 'string',
      title: 'URL API',
      'x-component': 'Input',
      'x-decorator': 'FormItem',
      required: true
    },
    method: {
      type: 'string',
      title: 'Metodo HTTP',
      'x-component': 'Select',
      'x-decorator': 'FormItem',
      enum: ['GET', 'POST', 'PUT', 'DELETE'],
      default: 'GET'
    },
    timeout: {
      type: 'number',
      title: 'Timeout (ms)',
      'x-component': 'InputNumber',
      'x-decorator': 'FormItem',
      default: 5000
    }
  }
}
```

### beforeParamsSave

**Tipo**: `(ctx: FlowSettingsContext<TModel>, params: any, previousParams: any) => void | Promise<void>`  
**Obbligatorio**: No  
**Descrizione**: Funzione hook eseguita prima del salvataggio dei parametri

Eseguita prima del salvataggio dei parametri dell'azione, può essere utilizzata per la validazione o la trasformazione dei parametri.

**Esempio**:
```ts
beforeParamsSave: (ctx, params, previousParams) => {
  // Validazione dei parametri
  if (!params.url) {
    throw new Error('L\'URL è obbligatorio');
  }
  
  // Trasformazione dei parametri
  params.url = params.url.trim();
  if (!params.url.startsWith('http')) {
    params.url = 'https://' + params.url;
  }
  
  // Registra le modifiche
  console.log('Parameters changed:', {
    from: previousParams,
    to: params
  });
}
```

### afterParamsSave

**Tipo**: `(ctx: FlowSettingsContext<TModel>, params: any, previousParams: any) => void | Promise<void>`  
**Obbligatorio**: No  
**Descrizione**: Funzione hook eseguita dopo il salvataggio dei parametri

Eseguita dopo il salvataggio dei parametri dell'azione, può essere utilizzata per attivare altre operazioni.

**Esempio**:
```ts
afterParamsSave: (ctx, params, previousParams) => {
  // Registra i log
  console.log('Action params saved:', params);
  
  // Attiva l'evento
  ctx.model.emitter.emit('actionParamsChanged', {
    actionName: 'loadDataAction',
    params,
    previousParams
  });
  
  // Aggiorna la cache
  ctx.model.updateCache('actionParams', params);
}
```

### useRawParams

**Tipo**: `boolean | ((ctx: TCtx) => boolean | Promise<boolean>)`  
**Obbligatorio**: No  
**Descrizione**: Indica se utilizzare i parametri grezzi

Se `true`, i parametri grezzi vengono passati direttamente alla funzione handler senza alcuna elaborazione.

**Esempio**:
```ts
// Configurazione statica
useRawParams: true

// Configurazione dinamica
useRawParams: (ctx) => {
  return ctx.model.isDebugMode;
}
```

### uiMode

**Tipo**: `StepUIMode | ((ctx: FlowRuntimeContext<TModel>) => StepUIMode | Promise<StepUIMode>)`  
**Obbligatorio**: No  
**Descrizione**: La modalità di visualizzazione dell'interfaccia utente per l'azione

Controlla come l'azione viene visualizzata nell'interfaccia utente.

**Modalità supportate**:
- `'dialog'` - Modalità dialogo
- `'drawer'` - Modalità cassetto
- `'embed'` - Modalità incorporata
- o un oggetto di configurazione personalizzato

**Esempio**:
```ts
// Modalità semplice
uiMode: 'dialog'

// Configurazione personalizzata
uiMode: {
  type: 'dialog',
  props: {
    width: 800,
    title: 'Action Configuration',
    maskClosable: false
  }
}

// Modalità dinamica
uiMode: (ctx) => {
  return ctx.model.isMobile ? 'drawer' : 'dialog';
}
```

### scene

**Tipo**: `ActionScene | ActionScene[]`  
**Obbligatorio**: No  
**Descrizione**: Gli scenari di utilizzo per l'azione

Limita l'utilizzo dell'azione a scenari specifici.

**Scenari supportati**:
- `'settings'` - Scenario di impostazioni
- `'runtime'` - Scenario di runtime
- `'design'` - Scenario di progettazione

**Esempio**:
```ts
scene: 'settings'  // Utilizzare solo nello scenario di impostazioni
scene: ['settings', 'runtime']  // Utilizzare negli scenari di impostazioni e runtime
```

### sort

**Tipo**: `number`  
**Obbligatorio**: No  
**Descrizione**: Il peso di ordinamento per l'azione

Controlla l'ordine di visualizzazione dell'azione in un elenco. Un valore più piccolo indica una posizione più alta.

**Esempio**:
```ts
sort: 0  // Posizione più alta
sort: 10 // Posizione intermedia
sort: 100 // Posizione più bassa
```

## Esempio Completo

```ts
class DataProcessingModel extends FlowModel {}

// Registra l'azione di caricamento dati
DataProcessingModel.registerAction({
  name: 'loadDataAction',
  title: 'Load Data',
  handler: async (ctx, params) => {
    const { url, method = 'GET', timeout = 5000 } = params;
    
    try {
      const response = await fetch(url, {
        method,
        timeout,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      return {
        success: true,
        data,
        message: 'Data loaded successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },
  defaultParams: {
    method: 'GET',
    timeout: 5000
  },
  uiSchema: {
    'x-component': 'Form',
    properties: {
      url: {
        type: 'string',
        title: 'URL API',
        'x-component': 'Input',
        'x-decorator': 'FormItem',
        required: true
      },
      method: {
        type: 'string',
        title: 'Metodo HTTP',
        'x-component': 'Select',
        'x-decorator': 'FormItem',
        enum: ['GET', 'POST', 'PUT', 'DELETE']
      },
      timeout: {
        type: 'number',
        title: 'Timeout (ms)',
        'x-component': 'InputNumber',
        'x-decorator': 'FormItem'
      }
    }
  },
  beforeParamsSave: (ctx, params) => {
    if (!params.url) {
      throw new Error('L\'URL è obbligatorio');
    }
    params.url = params.url.trim();
  },
  afterParamsSave: (ctx, params) => {
    ctx.model.emitter.emit('dataSourceChanged', params);
  },
  uiMode: 'dialog',
  scene: ['settings', 'runtime'],
  sort: 0
});

// Registra l'azione di elaborazione dati
DataProcessingModel.registerAction({
  name: 'processDataAction',
  title: 'Process Data',
  handler: async (ctx, params) => {
    const { data, processor, options = {} } = params;
    
    try {
      const processedData = await processData(data, processor, options);
      
      return {
        success: true,
        data: processedData,
        message: 'Data processed successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },
  defaultParams: (ctx) => ({
    processor: 'default',
    options: {
      format: 'json',
      encoding: 'utf8'
    }
  }),
  uiSchema: {
    'x-component': 'Form',
    properties: {
      processor: {
        type: 'string',
        title: 'Processore',
        'x-component': 'Select',
        'x-decorator': 'FormItem',
        enum: ['default', 'advanced', 'custom']
      },
      options: {
        type: 'object',
        title: 'Opzioni',
        'x-component': 'Form',
        'x-decorator': 'FormItem',
        properties: {
          format: {
            type: 'string',
            title: 'Formato',
            'x-component': 'Select',
            enum: ['json', 'xml', 'csv']
          },
          encoding: {
            type: 'string',
            title: 'Codifica',
            'x-component': 'Select',
            enum: ['utf8', 'ascii', 'latin1']
          }
        }
      }
    }
  },
  scene: 'runtime',
  sort: 1
});
```