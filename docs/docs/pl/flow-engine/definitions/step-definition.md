:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Definicja kroku (StepDefinition)

StepDefinition definiuje pojedynczy krok w przepływie pracy. Każdy krok może być akcją, obsługą zdarzeń lub inną operacją. Krok jest podstawową jednostką wykonawczą przepływu pracy.

## Definicja typu

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

## Sposób użycia

```ts
class MyModel extends FlowModel {}

MyModel.registerFlow({
  key: 'pageSettings',
  steps: {
    step1: {
      use: 'actionName',
      title: 'First Step',
      sort: 0,
      preset: true
    },
    step2: {
      handler: async (ctx, params) => {
        // Custom processing logic
        return { result: 'success' };
      },
      title: 'Second Step',
      sort: 1
    }
  }
});
```

## Opis właściwości

### key

**Typ**: `string`  
**Wymagane**: Nie  
**Opis**: Unikalny identyfikator kroku w ramach przepływu pracy.

Jeśli nie zostanie podany, zostanie użyta nazwa klucza kroku w obiekcie `steps`.

**Przykład**:
```ts
steps: {
  loadData: {  // key is 'loadData'
    use: 'loadDataAction'
  }
}
```

### use

**Typ**: `string`  
**Wymagane**: Nie  
**Opis**: Nazwa zarejestrowanej definicji akcji (ActionDefinition) do użycia.

Właściwość `use` umożliwia odwołanie się do zarejestrowanej akcji, co pozwala uniknąć powielania definicji.

**Przykład**:
```ts
// Register the action first
MyModel.registerAction({
  name: 'loadDataAction',
  handler: async (ctx, params) => {
    // Data loading logic
  }
});

// Use it in a step
steps: {
  step1: {
    use: 'loadDataAction',  // Reference the registered action
    title: 'Load Data'
  }
}
```

### title

**Typ**: `string`  
**Wymagane**: Nie  
**Opis**: Tytuł wyświetlany dla kroku.

Używany do wyświetlania w interfejsie użytkownika i debugowania.

**Przykład**:
```ts
title: 'Load Data'
title: 'Process Information'
title: 'Save Results'
```

### sort

**Typ**: `number`  
**Wymagane**: Nie  
**Opis**: Kolejność wykonywania kroku. Im mniejsza wartość, tym wcześniej krok zostanie wykonany.

Służy do kontrolowania kolejności wykonywania wielu kroków w tym samym przepływie pracy.

**Przykład**:
```ts
steps: {
  step1: { sort: 0 },  // Executes first
  step2: { sort: 1 },  // Executes next
  step3: { sort: 2 }   // Executes last
}
```

### handler

**Typ**: `(ctx: FlowRuntimeContext<TModel>, params: any) => Promise<any> | any`  
**Wymagane**: Nie  
**Opis**: Funkcja obsługująca krok.

Gdy właściwość `use` nie jest używana, można bezpośrednio zdefiniować funkcję obsługującą.

**Przykład**:
```ts
handler: async (ctx, params) => {
  // Get context information
  const { model, flowEngine } = ctx;
  
  // Processing logic
  const result = await processData(params);
  
  // Return result
  return { success: true, data: result };
}
```

### defaultParams

**Typ**: `Record<string, any> | ((ctx: FlowRuntimeContext<TModel>) => Record<string, any> | Promise<Record<string, any>>)`  
**Wymagane**: Nie  
**Opis**: Domyślne parametry dla kroku.

Wypełnia parametry wartościami domyślnymi przed wykonaniem kroku.

**Przykład**:
```ts
// Static default parameters
defaultParams: {
  timeout: 5000,
  retries: 3,
  format: 'json'
}

// Dynamic default parameters
defaultParams: (ctx) => {
  return {
    userId: ctx.model.uid,
    timestamp: Date.now()
  }
}

// Asynchronous default parameters
defaultParams: async (ctx) => {
  const config = await loadConfig();
  return {
    apiUrl: config.apiUrl,
    apiKey: config.apiKey
  }
}
```

### uiSchema

**Typ**: `Record<string, ISchema> | ((ctx: FlowRuntimeContext<TModel>) => Record<string, ISchema> | Promise<Record<string, ISchema>>)`  
**Wymagane**: Nie  
**Opis**: Schemat konfiguracji interfejsu użytkownika (UI) dla kroku.

Definiuje sposób wyświetlania kroku w interfejsie oraz jego konfigurację formularza.

**Przykład**:
```ts
uiSchema: {
  'x-component': 'Form',
  'x-component-props': {
    layout: 'vertical'
  },
  properties: {
    name: {
      type: 'string',
      title: 'Name',
      'x-component': 'Input'
    },
    age: {
      type: 'number',
      title: 'Age',
      'x-component': 'InputNumber'
    }
  }
}
```

### beforeParamsSave

**Typ**: `(ctx: FlowSettingsContext<TModel>, params: any, previousParams: any) => void | Promise<void>`  
**Wymagane**: Nie  
**Opis**: Funkcja haka (hook), która uruchamia się przed zapisaniem parametrów.

Wykonuje się przed zapisaniem parametrów kroku i może być używana do walidacji lub transformacji parametrów.

**Przykład**:
```ts
beforeParamsSave: (ctx, params, previousParams) => {
  // Parameter validation
  if (!params.name) {
    throw new Error('Name is required');
  }
  
  // Parameter transformation
  params.name = params.name.trim().toLowerCase();
}
```

### afterParamsSave

**Typ**: `(ctx: FlowSettingsContext<TModel>, params: any, previousParams: any) => void | Promise<void>`  
**Wymagane**: Nie  
**Opis**: Funkcja haka (hook), która uruchamia się po zapisaniu parametrów.

Wykonuje się po zapisaniu parametrów kroku i może być używana do wyzwalania innych operacji.

**Przykład**:
```ts
afterParamsSave: (ctx, params, previousParams) => {
  // Record logs
  console.log('Step params saved:', params);
  
  // Trigger other operations
  ctx.model.emitter.emit('paramsChanged', params);
}
```

### uiMode

**Typ**: `StepUIMode | ((ctx: FlowRuntimeContext<TModel>) => StepUIMode | Promise<StepUIMode>)`  
**Wymagane**: Nie  
**Opis**: Tryb wyświetlania interfejsu użytkownika (UI) dla kroku.

Kontroluje sposób wyświetlania kroku w interfejsie.

**Obsługiwane tryby**:
- `'dialog'` - Tryb dialogowy (okno dialogowe)
- `'drawer'` - Tryb szuflady (panel boczny)
- `'embed'` - Tryb osadzony
- Lub niestandardowy obiekt konfiguracyjny

**Przykład**:
```ts
// Simple mode
uiMode: 'dialog'

// Custom configuration
uiMode: {
  type: 'dialog',
  props: {
    width: 800,
    title: 'Step Configuration'
  }
}

// Dynamic mode
uiMode: (ctx) => {
  return ctx.model.isMobile ? 'drawer' : 'dialog';
}
```

### preset

**Typ**: `boolean`  
**Wymagane**: Nie  
**Opis**: Czy jest to krok predefiniowany (preset).

Parametry dla kroków z `preset: true` muszą być uzupełnione podczas tworzenia. Te bez tej flagi mogą być uzupełnione po utworzeniu modelu.

**Przykład**:
```ts
steps: {
  step1: {
    preset: true,  // Parameters must be filled in at creation time
    use: 'requiredAction'
  },
  step2: {
    preset: false, // Parameters can be filled in later
    use: 'optionalAction'
  }
}
```

### paramsRequired

**Typ**: `boolean`  
**Wymagane**: Nie  
**Opis**: Czy parametry kroku są wymagane.

Jeśli `true`, okno dialogowe konfiguracji otworzy się przed dodaniem modelu.

**Przykład**:
```ts
paramsRequired: true  // Parameters must be configured before adding the model
paramsRequired: false // Parameters can be configured later
```

### hideInSettings

**Typ**: `boolean`  
**Wymagane**: Nie  
**Opis**: Czy ukryć krok w menu ustawień.

**Przykład**:
```ts
hideInSettings: true  // Hide in settings
hideInSettings: false // Show in settings (default)
```

### isAwait

**Typ**: `boolean`  
**Wymagane**: Nie  
**Wartość domyślna**: `true`  
**Opis**: Czy czekać na zakończenie funkcji obsługującej.

**Przykład**:
```ts
isAwait: true  // Wait for the handler function to complete (default)
isAwait: false // Do not wait, execute asynchronously
```

## Kompletny przykład

```ts
class DataProcessingModel extends FlowModel {}

DataProcessingModel.registerFlow({
  key: 'dataProcessing',
  title: 'Data Processing',
  steps: {
    loadData: {
      use: 'loadDataAction',
      title: 'Load Data',
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
      title: 'Process Data',
      sort: 1,
      defaultParams: (ctx) => ({
        userId: ctx.model.uid,
        timestamp: Date.now()
      }),
      beforeParamsSave: (ctx, params) => {
        if (!params.processor) {
          throw new Error('Processor is required');
        }
      },
      afterParamsSave: (ctx, params) => {
        ctx.model.emitter.emit('dataProcessed', params);
      }
    },
    saveData: {
      use: 'saveDataAction',
      title: 'Save Data',
      sort: 2,
      hideInSettings: false,
      uiMode: {
        type: 'drawer',
        props: {
          width: 600,
          title: 'Save Configuration'
        }
      }
    }
  }
});
```