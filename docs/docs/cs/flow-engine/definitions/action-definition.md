:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# ActionDefinition

ActionDefinition definuje opakovaně použitelné akce, na které lze odkazovat v různých pracovních postupech a krocích. Akce je základní vykonávací jednotkou v FlowEngine, která zapouzdřuje specifickou obchodní logiku.

## Definice typu

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

## Způsob registrace

```ts
// Globální registrace (prostřednictvím FlowEngine)
const engine = new FlowEngine();
engine.registerAction({
  name: 'loadDataAction',
  title: 'Load Data',
  handler: async (ctx, params) => {
    // Logika zpracování
  }
});

// Registrace na úrovni modelu (prostřednictvím FlowModel)
class MyModel extends FlowModel {}
MyModel.registerAction({
  name: 'processDataAction',
  title: 'Process Data',
  handler: async (ctx, params) => {
    // Logika zpracování
  }
});

// Použití v pracovním postupu
MyModel.registerFlow({
  key: 'dataFlow',
  steps: {
    step1: {
      use: 'loadDataAction',  // Odkaz na globální akci
    },
    step2: {
      use: 'processDataAction', // Odkaz na akci na úrovni modelu
    }
  }
});
```

## Popis vlastností

### name

**Typ**: `string`  
**Povinné**: Ano  
**Popis**: Jedinečný identifikátor akce

Slouží k odkazování na akci v kroku pomocí vlastnosti `use`.

**Příklad**:
```ts
name: 'loadDataAction'
name: 'processDataAction'
name: 'saveDataAction'
```

### title

**Typ**: `string`  
**Povinné**: Ne  
**Popis**: Zobrazovaný název akce

Používá se pro zobrazení v uživatelském rozhraní a pro ladění.

**Příklad**:
```ts
title: 'Load Data'
title: 'Process Information'
title: 'Save Results'
```

### handler

**Typ**: `(ctx: TCtx, params: any) => Promise<any> | any`  
**Povinné**: Ano  
**Popis**: Funkce pro zpracování akce

Jde o základní logiku akce, která přijímá kontext a parametry a vrací výsledek zpracování.

**Příklad**:
```ts
handler: async (ctx, params) => {
  const { model, flowEngine } = ctx;
  
  try {
    // Spustit konkrétní logiku
    const result = await performAction(params);
    
    // Vrátit výsledek
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
**Povinné**: Ne  
**Popis**: Výchozí parametry pro akci

Před spuštěním akce se parametry vyplní výchozími hodnotami.

**Příklad**:
```ts
// Statické výchozí parametry
defaultParams: {
  timeout: 5000,
  retries: 3,
  format: 'json'
}

// Dynamické výchozí parametry
defaultParams: (ctx) => {
  return {
    userId: ctx.model.uid,
    timestamp: Date.now(),
    version: ctx.flowEngine.version
  }
}

// Asynchronní výchozí parametry
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
**Povinné**: Ne  
**Popis**: Schéma konfigurace uživatelského rozhraní pro akci

Definuje, jak se akce zobrazuje v uživatelském rozhraní a její konfiguraci formuláře.

**Příklad**:
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
**Povinné**: Ne  
**Popis**: Funkce háčku spuštěná před uložením parametrů

Spustí se před uložením parametrů akce a lze ji použít pro validaci nebo transformaci parametrů.

**Příklad**:
```ts
beforeParamsSave: (ctx, params, previousParams) => {
  // Validace parametrů
  if (!params.url) {
    throw new Error('URL is required');
  }
  
  // Transformace parametrů
  params.url = params.url.trim();
  if (!params.url.startsWith('http')) {
    params.url = 'https://' + params.url;
  }
  
  // Zaznamenat změny
  console.log('Parameters changed:', {
    from: previousParams,
    to: params
  });
}
```

### afterParamsSave

**Typ**: `(ctx: FlowSettingsContext<TModel>, params: any, previousParams: any) => void | Promise<void>`  
**Povinné**: Ne  
**Popis**: Funkce háčku spuštěná po uložení parametrů

Spustí se po uložení parametrů akce a lze ji použít k vyvolání dalších operací.

**Příklad**:
```ts
afterParamsSave: (ctx, params, previousParams) => {
  // Zaznamenat do protokolu
  console.log('Action params saved:', params);
  
  // Spustit událost
  ctx.model.emitter.emit('actionParamsChanged', {
    actionName: 'loadDataAction',
    params,
    previousParams
  });
  
  // Aktualizovat cache
  ctx.model.updateCache('actionParams', params);
}
```

### useRawParams

**Typ**: `boolean | ((ctx: TCtx) => boolean | Promise<boolean>)`  
**Povinné**: Ne  
**Popis**: Zda použít nezpracované (raw) parametry

Pokud je `true`, nezpracované parametry se předají přímo funkci handleru bez jakéhokoli dalšího zpracování.

**Příklad**:
```ts
// Statická konfigurace
useRawParams: true

// Dynamická konfigurace
useRawParams: (ctx) => {
  return ctx.model.isDebugMode;
}
```

### uiMode

**Typ**: `StepUIMode | ((ctx: FlowRuntimeContext<TModel>) => StepUIMode | Promise<StepUIMode>)`  
**Povinné**: Ne  
**Popis**: Režim zobrazení akce v uživatelském rozhraní

Určuje, jak se akce zobrazí v uživatelském rozhraní.

**Podporované režimy**:
- `'dialog'` - Režim dialogového okna
- `'drawer'` - Režim postranního panelu
- `'embed'` - Režim vložení
- nebo vlastní konfigurační objekt

**Příklad**:
```ts
// Jednoduchý režim
uiMode: 'dialog'

// Vlastní konfigurace
uiMode: {
  type: 'dialog',
  props: {
    width: 800,
    title: 'Action Configuration',
    maskClosable: false
  }
}

// Dynamický režim
uiMode: (ctx) => {
  return ctx.model.isMobile ? 'drawer' : 'dialog';
}
```

### scene

**Typ**: `ActionScene | ActionScene[]`  
**Povinné**: Ne  
**Popis**: Scénáře použití akce

Omezuje použití akce pouze na konkrétní scénáře.

**Podporované scénáře**:
- `'settings'` - Scénář nastavení
- `'runtime'` - Scénář běhu
- `'design'` - Scénář návrhu

**Příklad**:
```ts
scene: 'settings'  // Použít pouze ve scénáři nastavení
scene: ['settings', 'runtime']  // Použít ve scénářích nastavení a běhu
```

### sort

**Typ**: `number`  
**Povinné**: Ne  
**Popis**: Váha pro řazení akce

Určuje pořadí zobrazení akce v seznamu. Menší hodnota znamená vyšší pozici.

**Příklad**:
```ts
sort: 0  // Nejvyšší pozice
sort: 10 // Střední pozice
sort: 100 // Nižší pozice
```

## Kompletní příklad

```ts
class DataProcessingModel extends FlowModel {}

// Registrace akce pro načítání dat
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

// Registrace akce pro zpracování dat
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