:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# ActionDefinition

ActionDefinition definierar återanvändbara åtgärder som kan refereras till i flera arbetsflöden och steg. En åtgärd är den centrala exekveringsenheten i FlowEngine och kapslar in specifik affärslogik.

## Typdefinition

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

## Registreringsmetod

```ts
// Global registrering (via FlowEngine)
const engine = new FlowEngine();
engine.registerAction({
  name: 'loadDataAction',
  title: 'Ladda data',
  handler: async (ctx, params) => {
    // Bearbetningslogik
  }
});

// Modellnivåregistrering (via FlowModel)
class MyModel extends FlowModel {}
MyModel.registerAction({
  name: 'processDataAction',
  title: 'Bearbeta data',
  handler: async (ctx, params) => {
    // Bearbetningslogik
  }
});

// Använd i ett arbetsflöde
MyModel.registerFlow({
  key: 'dataFlow',
  steps: {
    step1: {
      use: 'loadDataAction',  // Referera till global åtgärd
    },
    step2: {
      use: 'processDataAction', // Referera till modellnivååtgärd
    }
  }
});
```

## Egenskapsbeskrivningar

### name

**Typ**: `string`  
**Obligatorisk**: Ja  
**Beskrivning**: Åtgärdens unika identifierare

Används för att referera till åtgärden i ett steg via egenskapen `use`.

**Exempel**:
```ts
name: 'loadDataAction'
name: 'processDataAction'
name: 'saveDataAction'
```

### title

**Typ**: `string`  
**Obligatorisk**: Nej  
**Beskrivning**: Åtgärdens visningsrubrik

Används för UI-visning och felsökning.

**Exempel**:
```ts
title: 'Ladda data'
title: 'Bearbeta information'
title: 'Spara resultat'
```

### handler

**Typ**: `(ctx: TCtx, params: any) => Promise<any> | any`  
**Obligatorisk**: Ja  
**Beskrivning**: Åtgärdens hanteringsfunktion

Åtgärdens kärnlogik, som tar emot kontext och parametrar och returnerar bearbetningsresultatet.

**Exempel**:
```ts
handler: async (ctx, params) => {
  const { model, flowEngine } = ctx;
  
  try {
    // Utför specifik logik
    const result = await performAction(params);
    
    // Returnera resultat
    return {
      success: true,
      data: result,
      message: 'Åtgärden slutfördes framgångsrikt'
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
**Obligatorisk**: Nej  
**Beskrivning**: Åtgärdens standardparametrar

Fyller parametrar med standardvärden innan åtgärden utförs.

**Exempel**:
```ts
// Statiska standardparametrar
defaultParams: {
  timeout: 5000,
  retries: 3,
  format: 'json'
}

// Dynamiska standardparametrar
defaultParams: (ctx) => {
  return {
    userId: ctx.model.uid,
    timestamp: Date.now(),
    version: ctx.flowEngine.version
  }
}

// Asynkrona standardparametrar
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
**Obligatorisk**: Nej  
**Beskrivning**: Åtgärdens UI-konfigurationsschema

Definierar hur åtgärden visas i användargränssnittet och dess formulärkonfiguration.

**Exempel**:
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
      title: 'HTTP-metod',
      'x-component': 'Select',
      'x-decorator': 'FormItem',
      enum: ['GET', 'POST', 'PUT', 'DELETE'],
      default: 'GET'
    },
    timeout: {
      type: 'number',
      title: 'Tidsgräns (ms)',
      'x-component': 'InputNumber',
      'x-decorator': 'FormItem',
      default: 5000
    }
  }
}
```

### beforeParamsSave

**Typ**: `(ctx: FlowSettingsContext<TModel>, params: any, previousParams: any) => void | Promise<void>`  
**Obligatorisk**: Nej  
**Beskrivning**: Krokfunktion som körs innan parametrar sparas

Körs innan åtgärdsparametrarna sparas, kan användas för parameterverifiering eller -omvandling.

**Exempel**:
```ts
beforeParamsSave: (ctx, params, previousParams) => {
  // Parameterverifiering
  if (!params.url) {
    throw new Error('URL krävs');
  }
  
  // Parameteromvandling
  params.url = params.url.trim();
  if (!params.url.startsWith('http')) {
    params.url = 'https://' + params.url;
  }
  
  // Logga ändringar
  console.log('Parametrar ändrade:', {
    from: previousParams,
    to: params
  });
}
```

### afterParamsSave

**Typ**: `(ctx: FlowSettingsContext<TModel>, params: any, previousParams: any) => void | Promise<void>`  
**Obligatorisk**: Nej  
**Beskrivning**: Krokfunktion som körs efter att parametrar har sparats

Körs efter att åtgärdsparametrarna har sparats, kan användas för att utlösa andra operationer.

**Exempel**:
```ts
afterParamsSave: (ctx, params, previousParams) => {
  // Logga poster
  console.log('Åtgärdsparametrar sparade:', params);
  
  // Utlös händelse
  ctx.model.emitter.emit('actionParamsChanged', {
    actionName: 'loadDataAction',
    params,
    previousParams
  });
  
  // Uppdatera cache
  ctx.model.updateCache('actionParams', params);
}
```

### useRawParams

**Typ**: `boolean | ((ctx: TCtx) => boolean | Promise<boolean>)`  
**Obligatorisk**: Nej  
**Beskrivning**: Om råa parametrar ska användas

Om `true`, skickas de råa parametrarna direkt till hanteringsfunktionen utan någon bearbetning.

**Exempel**:
```ts
// Statisk konfiguration
useRawParams: true

// Dynamisk konfiguration
useRawParams: (ctx) => {
  return ctx.model.isDebugMode;
}
```

### uiMode

**Typ**: `StepUIMode | ((ctx: FlowRuntimeContext<TModel>) => StepUIMode | Promise<StepUIMode>)`  
**Obligatorisk**: Nej  
**Beskrivning**: Åtgärdens UI-visningsläge

Styr hur åtgärden visas i användargränssnittet.

**Lägen som stöds**:
- `'dialog'` - Dialogläge
- `'drawer'` - Sidopanelsläge
- `'embed'` - Inbäddat läge
- eller ett anpassat konfigurationsobjekt

**Exempel**:
```ts
// Enkelt läge
uiMode: 'dialog'

// Anpassad konfiguration
uiMode: {
  type: 'dialog',
  props: {
    width: 800,
    title: 'Åtgärdskonfiguration',
    maskClosable: false
  }
}

// Dynamiskt läge
uiMode: (ctx) => {
  return ctx.model.isMobile ? 'drawer' : 'dialog';
}
```

### scene

**Typ**: `ActionScene | ActionScene[]`  
**Obligatorisk**: Nej  
**Beskrivning**: Åtgärdens användningsscenarier

Begränsar åtgärden till att endast användas i specifika scenarier.

**Scenarier som stöds**:
- `'settings'` - Inställningsscenario
- `'runtime'` - Körningsscenario
- `'design'` - Designscenario

**Exempel**:
```ts
scene: 'settings'  // Använd endast i inställningsscenariot
scene: ['settings', 'runtime']  // Använd i inställnings- och körningsscenarierna
```

### sort

**Typ**: `number`  
**Obligatorisk**: Nej  
**Beskrivning**: Åtgärdens sorteringsvikt

Styr åtgärdens visningsordning i en lista. Ett mindre värde innebär en högre position.

**Exempel**:
```ts
sort: 0  // Högst upp
sort: 10 // Mellanposition
sort: 100 // Längre ner
```

## Fullständigt exempel

```ts
class DataProcessingModel extends FlowModel {}

// Registrera åtgärd för dataladdning
DataProcessingModel.registerAction({
  name: 'loadDataAction',
  title: 'Ladda data',
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
        message: 'Data laddades framgångsrikt'
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
        title: 'HTTP-metod',
        'x-component': 'Select',
        'x-decorator': 'FormItem',
        enum: ['GET', 'POST', 'PUT', 'DELETE']
      },
      timeout: {
        type: 'number',
        title: 'Tidsgräns (ms)',
        'x-component': 'InputNumber',
        'x-decorator': 'FormItem'
      }
    }
  },
  beforeParamsSave: (ctx, params) => {
    if (!params.url) {
      throw new Error('URL krävs');
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

// Registrera åtgärd för databearbetning
DataProcessingModel.registerAction({
  name: 'processDataAction',
  title: 'Bearbeta data',
  handler: async (ctx, params) => {
    const { data, processor, options = {} } = params;
    
    try {
      const processedData = await processData(data, processor, options);
      
      return {
        success: true,
        data: processedData,
        message: 'Data bearbetades framgångsrikt'
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
        title: 'Alternativ',
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
            title: 'Kodning',
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