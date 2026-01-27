:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# ActionDefinition

`ActionDefinition` definieert herbruikbare acties die in meerdere workflows en stappen kunnen worden gebruikt. Een actie is de kernuitvoeringsunit binnen de FlowEngine en omvat specifieke bedrijfslogica.

## Type Definitie

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

## Registratiemethode

```ts
// Globale registratie (via FlowEngine)
const engine = new FlowEngine();
engine.registerAction({
  name: 'loadDataAction',
  title: 'Gegevens laden',
  handler: async (ctx, params) => {
    // Verwerkingslogica
  }
});

// Registratie op modelniveau (via FlowModel)
class MyModel extends FlowModel {}
MyModel.registerAction({
  name: 'processDataAction',
  title: 'Gegevens verwerken',
  handler: async (ctx, params) => {
    // Verwerkingslogica
  }
});

// Gebruik in een workflow
MyModel.registerFlow({
  key: 'dataFlow',
  steps: {
    step1: {
      use: 'loadDataAction',  // Verwijzing naar globale actie
    },
    step2: {
      use: 'processDataAction', // Verwijzing naar actie op modelniveau
    }
  }
});
```

## Eigenschappen

### name

**Type**: `string`  
**Verplicht**: Ja  
**Beschrijving**: De unieke identificatie voor de actie

Gebruikt om de actie in een stap te verwijzen via de `use`-eigenschap.

**Voorbeeld**:
```ts
name: 'loadDataAction'
name: 'processDataAction'
name: 'saveDataAction'
```

### title

**Type**: `string`  
**Verplicht**: Nee  
**Beschrijving**: De weergavetitel voor de actie

Gebruikt voor weergave in de gebruikersinterface en voor debugging.

**Voorbeeld**:
```ts
title: 'Gegevens laden'
title: 'Informatie verwerken'
title: 'Resultaten opslaan'
```

### handler

**Type**: `(ctx: TCtx, params: any) => Promise<any> | any`  
**Verplicht**: Ja  
**Beschrijving**: De handler-functie voor de actie

De kernlogica van de actie, die de context en parameters ontvangt en het verwerkingsresultaat retourneert.

**Voorbeeld**:
```ts
handler: async (ctx, params) => {
  const { model, flowEngine } = ctx;
  
  try {
    // Voer specifieke logica uit
    const result = await performAction(params);
    
    // Retourneer resultaat
    return {
      success: true,
      data: result,
      message: 'Actie succesvol voltooid'
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
**Beschrijving**: De standaardparameters voor de actie

Vult parameters met standaardwaarden voordat de actie wordt uitgevoerd.

**Voorbeeld**:
```ts
// Statische standaardparameters
defaultParams: {
  timeout: 5000,
  retries: 3,
  format: 'json'
}

// Dynamische standaardparameters
defaultParams: (ctx) => {
  return {
    userId: ctx.model.uid,
    timestamp: Date.now(),
    version: ctx.flowEngine.version
  }
}

// Asynchrone standaardparameters
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

**Type**: `Record<string, ISchema> | ((ctx: TCtx) => Record<string, ISchema> | Promise<Record<string, ISchema>>)`  
**Verplicht**: Nee  
**Beschrijving**: Het UI-configuratieschema voor de actie

Definieert hoe de actie wordt weergegeven in de gebruikersinterface en de bijbehorende formulierconfiguratie.

**Voorbeeld**:
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
      title: 'HTTP Methode',
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

**Type**: `(ctx: FlowSettingsContext<TModel>, params: any, previousParams: any) => void | Promise<void>`  
**Verplicht**: Nee  
**Beschrijving**: Haakfunctie die wordt uitgevoerd voordat parameters worden opgeslagen

Wordt uitgevoerd voordat de actieparameters worden opgeslagen, en kan worden gebruikt voor parametervalidatie of -transformatie.

**Voorbeeld**:
```ts
beforeParamsSave: (ctx, params, previousParams) => {
  // Parametervalidatie
  if (!params.url) {
    throw new Error('URL is verplicht');
  }
  
  // Parametertransformatie
  params.url = params.url.trim();
  if (!params.url.startsWith('http')) {
    params.url = 'https://' + params.url;
  }
  
  // Wijzigingen loggen
  console.log('Parameters gewijzigd:', {
    from: previousParams,
    to: params
  });
}
```

### afterParamsSave

**Type**: `(ctx: FlowSettingsContext<TModel>, params: any, previousParams: any) => void | Promise<void>`  
**Verplicht**: Nee  
**Beschrijving**: Haakfunctie die wordt uitgevoerd nadat parameters zijn opgeslagen

Wordt uitgevoerd nadat de actieparameters zijn opgeslagen, en kan worden gebruikt om andere bewerkingen te activeren.

**Voorbeeld**:
```ts
afterParamsSave: (ctx, params, previousParams) => {
  // Logboeken bijhouden
  console.log('Actieparameters opgeslagen:', params);
  
  // Gebeurtenis activeren
  ctx.model.emitter.emit('actionParamsChanged', {
    actionName: 'loadDataAction',
    params,
    previousParams
  });
  
  // Cache bijwerken
  ctx.model.updateCache('actionParams', params);
}
```

### useRawParams

**Type**: `boolean | ((ctx: TCtx) => boolean | Promise<boolean>)`  
**Verplicht**: Nee  
**Beschrijving**: Of ruwe parameters moeten worden gebruikt

Als dit op `true` is ingesteld, worden de ruwe parameters direct aan de handler-functie doorgegeven zonder enige verwerking.

**Voorbeeld**:
```ts
// Statische configuratie
useRawParams: true

// Dynamische configuratie
useRawParams: (ctx) => {
  return ctx.model.isDebugMode;
}
```

### uiMode

**Type**: `StepUIMode | ((ctx: FlowRuntimeContext<TModel>) => StepUIMode | Promise<StepUIMode>)`  
**Verplicht**: Nee  
**Beschrijving**: De UI-weergavemodus voor de actie

Bepaalt hoe de actie wordt weergegeven in de gebruikersinterface.

**Ondersteunde modi**:
- `'dialog'` - Dialoogvenstermodus
- `'drawer'` - Lademodus
- `'embed'` - Ingebouwde modus
- of een aangepast configuratieobject

**Voorbeeld**:
```ts
// Eenvoudige modus
uiMode: 'dialog'

// Aangepaste configuratie
uiMode: {
  type: 'dialog',
  props: {
    width: 800,
    title: 'Actieconfiguratie',
    maskClosable: false
  }
}

// Dynamische modus
uiMode: (ctx) => {
  return ctx.model.isMobile ? 'drawer' : 'dialog';
}
```

### scene

**Type**: `ActionScene | ActionScene[]`  
**Verplicht**: Nee  
**Beschrijving**: De gebruiksscenario's voor de actie

Beperkt het gebruik van de actie tot specifieke scenario's.

**Ondersteunde scenario's**:
- `'settings'` - Instellingenscenario
- `'runtime'` - Runtime-scenario
- `'design'` - Ontwerpscenario

**Voorbeeld**:
```ts
scene: 'settings'  // Alleen gebruiken in het instellingenscenario
scene: ['settings', 'runtime']  // Gebruiken in instellingen- en runtime-scenario's
```

### sort

**Type**: `number`  
**Verplicht**: Nee  
**Beschrijving**: Het sorteergewicht voor de actie

Bepaalt de weergavevolgorde van de actie in een lijst. Een kleinere waarde betekent een hogere positie.

**Voorbeeld**:
```ts
sort: 0  // Hoogste positie
sort: 10 // Middenpositie
sort: 100 // Lagere positie
```

## Volledig Voorbeeld

```ts
class DataProcessingModel extends FlowModel {}

// Registreer actie voor het laden van gegevens
DataProcessingModel.registerAction({
  name: 'loadDataAction',
  title: 'Gegevens laden',
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
        message: 'Gegevens succesvol geladen'
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
        title: 'HTTP Methode',
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
      throw new Error('URL is verplicht');
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

// Registreer actie voor gegevensverwerking
DataProcessingModel.registerAction({
  name: 'processDataAction',
  title: 'Gegevens verwerken',
  handler: async (ctx, params) => {
    const { data, processor, options = {} } = params;
    
    try {
      const processedData = await processData(data, processor, options);
      
      return {
        success: true,
        data: processedData,
        message: 'Gegevens succesvol verwerkt'
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
        title: 'Opties',
        'x-component': 'Form',
        'x-decorator': 'FormItem',
        properties: {
          format: {
            type: 'string',
            title: 'Formaat',
            'x-component': 'Select',
            enum: ['json', 'xml', 'csv']
          },
          encoding: {
            type: 'string',
            title: 'Codering',
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