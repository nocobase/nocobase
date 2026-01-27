:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# FlowDefinition

La FlowDefinition definisce la struttura e la configurazione di base di un flusso ed è uno dei concetti chiave del motore di flussi. Descrive i metadati del flusso, le condizioni di attivazione, i passaggi di esecuzione e altro ancora.

## Definizione del Tipo

```ts
interface FlowDefinitionOptions<TModel extends FlowModel = FlowModel> {
  key: string;
  title?: string;
  manual?: boolean;
  sort?: number;
  on?: FlowEvent<TModel>;
  steps: Record<string, StepDefinition<TModel>>;
  defaultParams?: Record<string, any> | ((ctx: FlowModelContext) => StepParam | Promise<StepParam>);
}
```

## Metodo di Registrazione

```ts
class MyModel extends FlowModel {}

// Registra un flusso tramite la classe del modello
MyModel.registerFlow({
  key: 'pageSettings',
  title: 'Page settings',
  manual: false,
  sort: 0,
  on: 'click',
  steps: {
    step1: {
      use: 'actionName',
      title: 'First Step'
    }
  },
  defaultParams: {
    step1: { param1: 'value1' }
  }
});
```

## Descrizione delle Proprietà

### key

**Tipo**: `string`  
**Obbligatorio**: Sì  
**Descrizione**: L'identificatore univoco del flusso.

Le consigliamo di adottare uno stile di denominazione uniforme `xxxSettings`, ad esempio:
- `pageSettings`
- `tableSettings` 
- `cardSettings`
- `formSettings`
- `detailsSettings`
- `buttonSettings`
- `popupSettings`
- `deleteSettings`
- `datetimeSettings`
- `numberSettings`

Questa convenzione di denominazione facilita l'identificazione e la manutenzione; le raccomandiamo di utilizzarla in modo coerente a livello globale.

**Esempio**:
```ts
key: 'pageSettings'
key: 'tableSettings'
key: 'deleteSettings'
```

### title

**Tipo**: `string`  
**Obbligatorio**: No  
**Descrizione**: Il titolo comprensibile del flusso.

Le consigliamo di mantenere uno stile coerente con la `key`, utilizzando la denominazione `Xxx settings`, ad esempio:
- `Page settings`
- `Table settings`
- `Card settings`
- `Form settings`
- `Details settings`
- `Button settings`
- `Popup settings`
- `Delete settings`
- `Datetime settings`
- `Number settings`

Questa convenzione di denominazione è più chiara e facile da comprendere, facilitando la visualizzazione nell'interfaccia utente e la collaborazione del team.

**Esempio**:
```ts
title: 'Page settings'
title: 'Table settings'
title: 'Delete settings'
```

### manual

**Tipo**: `boolean`  
**Obbligatorio**: No  
**Valore predefinito**: `false`  
**Descrizione**: Indica se il flusso deve essere eseguito solo manualmente.

- `true`: Il flusso può essere attivato solo manualmente e non si eseguirà automaticamente.
- `false`: Il flusso può essere eseguito automaticamente (viene eseguito automaticamente per impostazione predefinita quando la proprietà `on` non è presente).

**Esempio**:
```ts
manual: true  // Esecuzione solo manuale
manual: false // Può essere eseguito automaticamente
```

### sort

**Tipo**: `number`  
**Obbligatorio**: No  
**Valore predefinito**: `0`  
**Descrizione**: L'ordine di esecuzione del flusso. Un valore inferiore indica una priorità maggiore nell'esecuzione.

È possibile utilizzare numeri negativi per controllare l'ordine di esecuzione di più flussi.

**Esempio**:
```ts
sort: -1  // Esecuzione prioritaria
sort: 0   // Ordine predefinito
sort: 1   // Esecuzione posticipata
```

### on

**Tipo**: `FlowEvent<TModel>`  
**Obbligatorio**: No  
**Descrizione**: La configurazione dell'evento che permette l'attivazione di questo flusso tramite `dispatchEvent`.

Viene utilizzato solo per dichiarare il nome dell'evento di attivazione (una stringa o `{ eventName }`), senza includere una funzione di gestione.

**Tipi di evento supportati**:
- `'click'` - Evento click
- `'submit'` - Evento submit
- `'reset'` - Evento reset
- `'remove'` - Evento remove
- `'openView'` - Evento openView
- `'dropdownOpen'` - Evento dropdownOpen
- `'popupScroll'` - Evento popupScroll
- `'search'` - Evento search
- `'customRequest'` - Evento customRequest
- `'collapseToggle'` - Evento collapseToggle
- O qualsiasi stringa personalizzata

**Esempio**:
```ts
on: 'click'  // Attivato al click
on: 'submit' // Attivato al submit
on: { eventName: 'customEvent', defaultParams: { param1: 'value1' } }
```

### steps

**Tipo**: `Record<string, StepDefinition<TModel>>`  
**Obbligatorio**: Sì  
**Descrizione**: La definizione dei passaggi del flusso.

Definisce tutti i passaggi inclusi nel flusso; ogni passaggio ha una chiave univoca.

**Esempio**:
```ts
steps: {
  step1: {
    use: 'actionName',
    title: 'First Step',
    sort: 0
  },
  step2: {
    use: 'anotherAction',
    title: 'Second Step',
    sort: 1
  }
}
```

### defaultParams

**Tipo**: `Record<string, any> | ((ctx: FlowModelContext) => StepParam | Promise<StepParam>)`  
**Obbligatorio**: No  
**Descrizione**: Parametri predefiniti a livello di flusso.

Quando il modello viene istanziato (`createModel`), vengono popolati i valori iniziali per i parametri dei passaggi del "flusso corrente". Vengono riempiti solo i valori mancanti, senza sovrascrivere quelli esistenti. La struttura di ritorno fissa è: `{ [stepKey]: params }`

**Esempio**:
```ts
// Parametri predefiniti statici
defaultParams: {
  step1: { param1: 'value1', param2: 'value2' },
  step2: { param3: 'value3' }
}

// Parametri predefiniti dinamici
defaultParams: (ctx) => {
  return {
    step1: { 
      param1: ctx.model.uid,
      param2: new Date().toISOString()
    }
  }
}

// Parametri predefiniti asincroni
defaultParams: async (ctx) => {
  const data = await fetchSomeData();
  return {
    step1: { data }
  }
}
```

## Esempio Completo

```ts
class PageModel extends FlowModel {}

PageModel.registerFlow({
  key: 'pageSettings',
  title: 'Page settings',
  manual: false,
  sort: 0,
  on: 'click',
  steps: {
    loadData: {
      use: 'loadDataAction',
      title: 'Carica Dati',
      sort: 0,
      preset: true
    },
    processData: {
      use: 'processDataAction', 
      title: 'Elabora Dati',
      sort: 1,
      paramsRequired: true
    },
    saveData: {
      use: 'saveDataAction',
      title: 'Salva Dati', 
      sort: 2,
      hideInSettings: false
    }
  },
  defaultParams: {
    loadData: { 
      source: 'api',
      cache: true 
    },
    processData: { 
      format: 'json' 
    }
  }
});
```