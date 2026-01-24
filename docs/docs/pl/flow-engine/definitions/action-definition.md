:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# ActionDefinition

ActionDefinition definiuje akcje wielokrotnego użytku, które mogą być wywoływane w wielu przepływach pracy i krokach. Akcja jest podstawową jednostką wykonawczą w silniku przepływów pracy (FlowEngine), hermetyzującą konkretną logikę biznesową.

## Definicja typu

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

## Sposób rejestracji

```ts
// Rejestracja globalna (przez FlowEngine)
const engine = new FlowEngine();
engine.registerAction({
  name: 'loadDataAction',
  title: 'Load Data',
  handler: async (ctx, params) => {
    // Logika przetwarzania
  }
});

// Rejestracja na poziomie modelu (przez FlowModel)
class MyModel extends FlowModel {}
MyModel.registerAction({
  name: 'processDataAction',
  title: 'Process Data',
  handler: async (ctx, params) => {
    // Logika przetwarzania
  }
});

// Użycie w przepływie pracy
MyModel.registerFlow({
  key: 'dataFlow',
  steps: {
    step1: {
      use: 'loadDataAction',  // Odwołanie do akcji globalnej
    },
    step2: {
      use: 'processDataAction', // Odwołanie do akcji na poziomie modelu
    }
  }
});
```

## Opis właściwości

### name

**Typ**: `string`  
**Wymagane**: Tak  
**Opis**: Unikalny identyfikator akcji

Służy do odwoływania się do akcji w kroku za pomocą właściwości `use`.

**Przykład**:
```ts
name: 'loadDataAction'
name: 'processDataAction'
name: 'saveDataAction'
```

### title

**Typ**: `string`  
**Wymagane**: Nie  
**Opis**: Tytuł wyświetlany dla akcji

Używany do wyświetlania w interfejsie użytkownika i debugowania.

**Przykład**:
```ts
title: 'Load Data'
title: 'Process Information'
title: 'Save Results'
```

### handler

**Typ**: `(ctx: TCtx, params: any) => Promise<any> | any`  
**Wymagane**: Tak  
**Opis**: Funkcja obsługująca akcję

Główna logika akcji, która przyjmuje kontekst i parametry, a następnie zwraca wynik przetwarzania.

**Przykład**:
```ts
handler: async (ctx, params) => {
  const { model, flowEngine } = ctx;
  
  try {
    // Wykonaj konkretną logikę
    const result = await performAction(params);
    
    // Zwróć wynik
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

**Typ**: `Record<string, any> | ((ctx: TCtx) => Record<string, any> | Promise<Record<string, any>>)`  
**Wymagane**: Nie  
**Opis**: Domyślne parametry dla akcji

Wypełnia parametry wartościami domyślnymi przed wykonaniem akcji.

**Przykład**:
```ts
// Statyczne parametry domyślne
defaultParams: {
  timeout: 5000,
  retries: 3,
  format: 'json'
}

// Dynamiczne parametry domyślne
defaultParams: (ctx) => {
  return {
    userId: ctx.model.uid,
    timestamp: Date.now(),
    version: ctx.flowEngine.version
  }
}

// Asynchroniczne parametry domyślne
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

**Typ**: `Record<string, ISchema> | ((ctx: TCtx) => Record<string, ISchema> | Promise<Record<string, ISchema>>)`  
**Wymagane**: Nie  
**Opis**: Schemat konfiguracji interfejsu użytkownika (UI) dla akcji

Definiuje sposób wyświetlania akcji w interfejsie użytkownika oraz jej konfigurację formularza.

**Przykład**:
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
      title: 'API URL',
      'x-component': 'Input',
      'x-decorator': 'FormItem',
      required: true
    },
    method: {
      type: 'string',
      title: 'HTTP Method',
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

**Typ**: `(ctx: FlowSettingsContext<TModel>, params: any, previousParams: any) => void | Promise<void>`  
**Wymagane**: Nie  
**Opis**: Funkcja-hak wywoływana przed zapisaniem parametrów

Wykonuje się przed zapisaniem parametrów akcji i może być używana do walidacji lub transformacji parametrów.

**Przykład**:
```ts
beforeParamsSave: (ctx, params, previousParams) => {
  // Walidacja parametrów
  if (!params.url) {
    throw new Error('URL is required');
  }
  
  // Transformacja parametrów
  params.url = params.url.trim();
  if (!params.url.startsWith('http')) {
    params.url = 'https://' + params.url;
  }
  
  // Rejestrowanie zmian
  console.log('Parameters changed:', {
    from: previousParams,
    to: params
  });
}
```

### afterParamsSave

**Typ**: `(ctx: FlowSettingsContext<TModel>, params: any, previousParams: any) => void | Promise<void>`  
**Wymagane**: Nie  
**Opis**: Funkcja-hak wywoływana po zapisaniu parametrów

Wykonuje się po zapisaniu parametrów akcji i może być używana do wyzwalania innych operacji.

**Przykład**:
```ts
afterParamsSave: (ctx, params, previousParams) => {
  // Rejestrowanie logów
  console.log('Action params saved:', params);
  
  // Wyzwalanie zdarzenia
  ctx.model.emitter.emit('actionParamsChanged', {
    actionName: 'loadDataAction',
    params,
    previousParams
  });
  
  // Aktualizacja pamięci podręcznej
  ctx.model.updateCache('actionParams', params);
}
```

### useRawParams

**Typ**: `boolean | ((ctx: TCtx) => boolean | Promise<boolean>)`  
**Wymagane**: Nie  
**Opis**: Czy używać surowych (nieprzetworzonych) parametrów

Jeśli `true`, surowe parametry zostaną przekazane bezpośrednio do funkcji obsługującej, bez żadnego przetwarzania.

**Przykład**:
```ts
// Konfiguracja statyczna
useRawParams: true

// Konfiguracja dynamiczna
useRawParams: (ctx) => {
  return ctx.model.isDebugMode;
}
```

### uiMode

**Typ**: `StepUIMode | ((ctx: FlowRuntimeContext<TModel>) => StepUIMode | Promise<StepUIMode>)`  
**Wymagane**: Nie  
**Opis**: Tryb wyświetlania interfejsu użytkownika (UI) dla akcji

Kontroluje sposób wyświetlania akcji w interfejsie użytkownika.

**Obsługiwane tryby**:
- `'dialog'` - tryb okna dialogowego
- `'drawer'` - tryb szuflady
- `'embed'` - tryb osadzony
- lub niestandardowy obiekt konfiguracyjny

**Przykład**:
```ts
// Tryb prosty
uiMode: 'dialog'

// Niestandardowa konfiguracja
uiMode: {
  type: 'dialog',
  props: {
    width: 800,
    title: 'Action Configuration',
    maskClosable: false
  }
}

// Tryb dynamiczny
uiMode: (ctx) => {
  return ctx.model.isMobile ? 'drawer' : 'dialog';
}
```

### scene

**Typ**: `ActionScene | ActionScene[]`  
**Wymagane**: Nie  
**Opis**: Scenariusze użycia akcji

Ogranicza użycie akcji do określonych scenariuszy.

**Obsługiwane scenariusze**:
- `'settings'` - scenariusz ustawień
- `'runtime'` - scenariusz wykonawczy
- `'design'` - scenariusz projektowy

**Przykład**:
```ts
scene: 'settings'  // Używaj tylko w scenariuszu ustawień
scene: ['settings', 'runtime']  // Używaj w scenariuszach ustawień i wykonawczym
```

### sort

**Typ**: `number`  
**Wymagane**: Nie  
**Opis**: Waga sortowania dla akcji

Służy do kontrolowania kolejności wyświetlania akcji na liście; im mniejsza wartość, tym wyższa pozycja.

**Przykład**:
```ts
sort: 0  // Najwyższa pozycja
sort: 10 // Pozycja środkowa
sort: 100 // Niższa pozycja
```

## Pełny przykład

```ts
class DataProcessingModel extends FlowModel {}

// Rejestracja akcji ładowania danych
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
        title: 'API URL',
        'x-component': 'Input',
        'x-decorator': 'FormItem',
        required: true
      },
      method: {
        type: 'string',
        title: 'HTTP Method',
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
      throw new Error('URL is required');
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

// Rejestracja akcji przetwarzania danych
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
        title: 'Processor',
        'x-component': 'Select',
        'x-decorator': 'FormItem',
        enum: ['default', 'advanced', 'custom']
      },
      options: {
        type: 'object',
        title: 'Options',
        'x-component': 'Form',
        'x-decorator': 'FormItem',
        properties: {
          format: {
            type: 'string',
            title: 'Format',
            'x-component': 'Select',
            enum: ['json', 'xml', 'csv']
          },
          encoding: {
            type: 'string',
            title: 'Encoding',
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