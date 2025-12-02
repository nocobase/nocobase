:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# StepDefinition

StepDefinition definisce un singolo passo all'interno di un flusso. Ogni passo può rappresentare un'azione, la gestione di un evento o un'altra operazione. Un passo è l'unità di esecuzione fondamentale di un flusso.

## Definizione del tipo

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

## Utilizzo

```ts
class MyModel extends FlowModel {}

MyModel.registerFlow({
  key: 'pageSettings',
  steps: {
    step1: {
      use: 'actionName',
      title: 'Primo Passo',
      sort: 0,
      preset: true
    },
    step2: {
      handler: async (ctx, params) => {
        // Logica di elaborazione personalizzata
        return { result: 'success' };
      },
      title: 'Secondo Passo',
      sort: 1
    }
  }
});
```

## Descrizione delle proprietà

### key

**Tipo**: `string`  
**Obbligatorio**: No  
**Descrizione**: L'identificatore univoco per il passo all'interno del flusso.

Se non specificato, verrà utilizzato il nome della chiave del passo all'interno dell'oggetto `steps`.

**Esempio**:
```ts
steps: {
  loadData: {  // la chiave è 'loadData'
    use: 'loadDataAction'
  }
}
```

### use

**Tipo**: `string`  
**Obbligatorio**: No  
**Descrizione**: Il nome di una ActionDefinition registrata da utilizzare.

La proprietà `use` Le permette di fare riferimento a un'azione già registrata, evitando definizioni duplicate.

**Esempio**:
```ts
// Prima registri l'azione
MyModel.registerAction({
  name: 'loadDataAction',
  handler: async (ctx, params) => {
    // Logica di caricamento dati
  }
});

// La utilizzi in un passo
steps: {
  step1: {
    use: 'loadDataAction',  // Fa riferimento all'azione registrata
    title: 'Carica Dati'
  }
}
```

### title

**Tipo**: `string`  
**Obbligatorio**: No  
**Descrizione**: Il titolo visualizzato del passo.

Utilizzato per la visualizzazione nell'interfaccia utente e per il debug.

**Esempio**:
```ts
title: 'Carica Dati'
title: 'Elabora Informazioni'
title: 'Salva Risultati'
```

### sort

**Tipo**: `number`  
**Obbligatorio**: No  
**Descrizione**: L'ordine di esecuzione del passo. Minore è il valore, prima viene eseguito.

Utilizzato per controllare l'ordine di esecuzione di più passi all'interno dello stesso flusso.

**Esempio**:
```ts
steps: {
  step1: { sort: 0 },  // Esegue per primo
  step2: { sort: 1 },  // Esegue successivamente
  step3: { sort: 2 }   // Esegue per ultimo
}
```

### handler

**Tipo**: `(ctx: FlowRuntimeContext<TModel>, params: any) => Promise<any> | any`  
**Obbligatorio**: No  
**Descrizione**: La funzione di gestione (handler) per il passo.

Quando la proprietà `use` non viene utilizzata, può definire la funzione di gestione direttamente.

**Esempio**:
```ts
handler: async (ctx, params) => {
  // Ottiene le informazioni di contesto
  const { model, flowEngine } = ctx;
  
  // Logica di elaborazione
  const result = await processData(params);
  
  // Restituisce il risultato
  return { success: true, data: result };
}
```

### defaultParams

**Tipo**: `Record<string, any> | ((ctx: FlowRuntimeContext<TModel>) => Record<string, any> | Promise<Record<string, any>>)`  
**Obbligatorio**: No  
**Descrizione**: I parametri predefiniti per il passo.

Popola i parametri con valori predefiniti prima che il passo venga eseguito.

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
    timestamp: Date.now()
  }
}

// Parametri predefiniti asincroni
defaultParams: async (ctx) => {
  const config = await loadConfig();
  return {
    apiUrl: config.apiUrl,
    apiKey: config.apiKey
  }
}
```

### uiSchema

**Tipo**: `Record<string, ISchema> | ((ctx: FlowRuntimeContext<TModel>) => Record<string, ISchema> | Promise<Record<string, ISchema>>)`  
**Obbligatorio**: No  
**Descrizione**: Lo schema di configurazione UI per il passo.

Definisce come il passo viene visualizzato nell'interfaccia e la sua configurazione del modulo.

**Esempio**:
```ts
uiSchema: {
  'x-component': 'Form',
  'x-component-props': {
    layout: 'vertical'
  },
  properties: {
    name: {
      type: 'string',
      title: 'Nome',
      'x-component': 'Input'
    },
    age: {
      type: 'number',
      title: 'Età',
      'x-component': 'InputNumber'
    }
  }
}
```

### beforeParamsSave

**Tipo**: `(ctx: FlowSettingsContext<TModel>, params: any, previousParams: any) => void | Promise<void>`  
**Obbligatorio**: No  
**Descrizione**: Una funzione hook che viene eseguita prima del salvataggio dei parametri.

Viene eseguita prima del salvataggio dei parametri del passo e può essere utilizzata per la validazione o la trasformazione dei parametri.

**Esempio**:
```ts
beforeParamsSave: (ctx, params, previousParams) => {
  // Validazione dei parametri
  if (!params.name) {
    throw new Error('Il nome è obbligatorio');
  }
  
  // Trasformazione dei parametri
  params.name = params.name.trim().toLowerCase();
}
```

### afterParamsSave

**Tipo**: `(ctx: FlowSettingsContext<TModel>, params: any, previousParams: any) => void | Promise<void>`  
**Obbligatorio**: No  
**Descrizione**: Una funzione hook che viene eseguita dopo il salvataggio dei parametri.

Viene eseguita dopo il salvataggio dei parametri del passo e può essere utilizzata per attivare altre operazioni.

**Esempio**:
```ts
afterParamsSave: (ctx, params, previousParams) => {
  // Registra i log
  console.log('Parametri del passo salvati:', params);
  
  // Attiva altre operazioni
  ctx.model.emitter.emit('paramsChanged', params);
}
```

### uiMode

**Tipo**: `StepUIMode | ((ctx: FlowRuntimeContext<TModel>) => StepUIMode | Promise<StepUIMode>)`  
**Obbligatorio**: No  
**Descrizione**: La modalità di visualizzazione UI per il passo.

Controlla come il passo viene visualizzato nell'interfaccia.

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
    width: 800,
    title: 'Configurazione del Passo'
  }
}

// Modalità dinamica
uiMode: (ctx) => {
  return ctx.model.isMobile ? 'drawer' : 'dialog';
}
```

### preset

**Tipo**: `boolean`  
**Obbligatorio**: No  
**Descrizione**: Indica se si tratta di un passo preimpostato.

I parametri per i passi con `preset: true` devono essere compilati al momento della creazione. Quelli senza questo flag possono essere compilati dopo la creazione del modello.

**Esempio**:
```ts
steps: {
  step1: {
    preset: true,  // I parametri devono essere compilati al momento della creazione
    use: 'requiredAction'
  },
  step2: {
    preset: false, // I parametri possono essere compilati in seguito
    use: 'optionalAction'
  }
}
```

### paramsRequired

**Tipo**: `boolean`  
**Obbligatorio**: No  
**Descrizione**: Indica se i parametri del passo sono obbligatori.

Se `true`, si aprirà una finestra di dialogo di configurazione prima di aggiungere il modello.

**Esempio**:
```ts
paramsRequired: true  // I parametri devono essere configurati prima di aggiungere il modello
paramsRequired: false // I parametri possono essere configurati in seguito
```

### hideInSettings

**Tipo**: `boolean`  
**Obbligatorio**: No  
**Descrizione**: Indica se nascondere il passo nel menu delle impostazioni.

**Esempio**:
```ts
hideInSettings: true  // Nascondi nelle impostazioni
hideInSettings: false // Mostra nelle impostazioni (predefinito)
```

### isAwait

**Tipo**: `boolean`  
**Obbligatorio**: No  
**Valore predefinito**: `true`  
**Descrizione**: Indica se attendere il completamento della funzione di gestione.

**Esempio**:
```ts
isAwait: true  // Attende il completamento della funzione di gestione (predefinito)
isAwait: false // Non attende, esegue in modo asincrono
```

## Esempio completo

```ts
class DataProcessingModel extends FlowModel {}

DataProcessingModel.registerFlow({
  key: 'dataProcessing',
  title: 'Elaborazione Dati',
  steps: {
    loadData: {
      use: 'loadDataAction',
      title: 'Carica Dati',
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
      title: 'Elabora Dati',
      sort: 1,
      defaultParams: (ctx) => ({
        userId: ctx.model.uid,
        timestamp: Date.now()
      }),
      beforeParamsSave: (ctx, params) => {
        if (!params.processor) {
          throw new Error('Il processore è obbligatorio');
        }
      },
      afterParamsSave: (ctx, params) => {
        ctx.model.emitter.emit('dataProcessed', params);
      }
    },
    saveData: {
      use: 'saveDataAction',
      title: 'Salva Dati',
      sort: 2,
      hideInSettings: false,
      uiMode: {
        type: 'drawer',
        props: {
          width: 600,
          title: 'Configurazione di Salvataggio'
        }
      }
    }
  }
});
```