:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# ActionDefinition

`ActionDefinition` definiert wiederverwendbare Aktionen, die in verschiedenen Workflows und Schritten referenziert werden können. Eine Aktion ist die zentrale Ausführungseinheit in der FlowEngine und kapselt spezifische Geschäftslogik.

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

## Registrierung

```ts
// Globale Registrierung (über FlowEngine)
const engine = new FlowEngine();
engine.registerAction({
  name: 'loadDataAction',
  title: 'Daten laden',
  handler: async (ctx, params) => {
    // Verarbeitungslogik
  }
});

// Modell-spezifische Registrierung (über FlowModel)
class MyModel extends FlowModel {}
MyModel.registerAction({
  name: 'processDataAction',
  title: 'Daten verarbeiten',
  handler: async (ctx, params) => {
    // Verarbeitungslogik
  }
});

// Verwendung in einem Workflow
MyModel.registerFlow({
  key: 'dataFlow',
  steps: {
    step1: {
      use: 'loadDataAction',  // Referenziert eine globale Aktion
    },
    step2: {
      use: 'processDataAction', // Referenziert eine modell-spezifische Aktion
    }
  }
});
```

## Eigenschaften

### name

**Typ**: `string`  
**Erforderlich**: Ja  
**Beschreibung**: Der eindeutige Bezeichner für die Aktion

Wird verwendet, um die Aktion in einem Schritt über die Eigenschaft `use` zu referenzieren.

**Beispiel**:
```ts
name: 'loadDataAction'
name: 'processDataAction'
name: 'saveDataAction'
```

### title

**Typ**: `string`  
**Erforderlich**: Nein  
**Beschreibung**: Der Anzeigetitel für die Aktion

Wird für die Anzeige in der Benutzeroberfläche und zum Debuggen verwendet.

**Beispiel**:
```ts
title: 'Daten laden'
title: 'Informationen verarbeiten'
title: 'Ergebnisse speichern'
```

### handler

**Typ**: `(ctx: TCtx, params: any) => Promise<any> | any`  
**Erforderlich**: Ja  
**Beschreibung**: Die Handler-Funktion für die Aktion

Die Kernlogik der Aktion, die den Kontext und die Parameter empfängt und das Verarbeitungsergebnis zurückgibt.

**Beispiel**:
```ts
handler: async (ctx, params) => {
  const { model, flowEngine } = ctx;
  
  try {
    // Spezifische Logik ausführen
    const result = await performAction(params);
    
    // Ergebnis zurückgeben
    return {
      success: true,
      data: result,
      message: 'Aktion erfolgreich abgeschlossen'
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
**Erforderlich**: Nein  
**Beschreibung**: Die Standardparameter für die Aktion

Füllt Parameter mit Standardwerten, bevor die Aktion ausgeführt wird.

**Beispiel**:
```ts
// Statische Standardparameter
defaultParams: {
  timeout: 5000,
  retries: 3,
  format: 'json'
}

// Dynamische Standardparameter
defaultParams: (ctx) => {
  return {
    userId: ctx.model.uid,
    timestamp: Date.now(),
    version: ctx.flowEngine.version
  }
}

// Asynchrone Standardparameter
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
**Erforderlich**: Nein  
**Beschreibung**: Das UI-Konfigurationsschema für die Aktion

Definiert, wie die Aktion in der Benutzeroberfläche angezeigt wird und wie ihre Formulare konfiguriert sind.

**Beispiel**:
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
      title: 'API-URL',
      'x-component': 'Input',
      'x-decorator': 'FormItem',
      required: true
    },
    method: {
      type: 'string',
      title: 'HTTP-Methode',
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
**Erforderlich**: Nein  
**Beschreibung**: Hook-Funktion, die vor dem Speichern der Parameter ausgeführt wird

Wird ausgeführt, bevor die Aktionsparameter gespeichert werden, und kann zur Parametervalidierung oder -transformation verwendet werden.

**Beispiel**:
```ts
beforeParamsSave: (ctx, params, previousParams) => {
  // Parameter validieren
  if (!params.url) {
    throw new Error('URL ist erforderlich');
  }
  
  // Parameter transformieren
  params.url = params.url.trim();
  if (!params.url.startsWith('http')) {
    params.url = 'https://' + params.url;
  }
  
  // Änderungen protokollieren
  console.log('Parameter geändert:', {
    from: previousParams,
    to: params
  });
}
```

### afterParamsSave

**Typ**: `(ctx: FlowSettingsContext<TModel>, params: any, previousParams: any) => void | Promise<void>`  
**Erforderlich**: Nein  
**Beschreibung**: Hook-Funktion, die nach dem Speichern der Parameter ausgeführt wird

Wird ausgeführt, nachdem die Aktionsparameter gespeichert wurden, und kann zum Auslösen weiterer Operationen verwendet werden.

**Beispiel**:
```ts
afterParamsSave: (ctx, params, previousParams) => {
  // Protokollieren
  console.log('Aktionsparameter gespeichert:', params);
  
  // Ereignis auslösen
  ctx.model.emitter.emit('actionParamsChanged', {
    actionName: 'loadDataAction',
    params,
    previousParams
  });
  
  // Cache aktualisieren
  ctx.model.updateCache('actionParams', params);
}
```

### useRawParams

**Typ**: `boolean | ((ctx: TCtx) => boolean | Promise<boolean>)`  
**Erforderlich**: Nein  
**Beschreibung**: Ob Rohparameter verwendet werden sollen

Wenn `true`, werden die Rohparameter direkt an die Handler-Funktion übergeben, ohne weitere Verarbeitung.

**Beispiel**:
```ts
// Statische Konfiguration
useRawParams: true

// Dynamische Konfiguration
useRawParams: (ctx) => {
  return ctx.model.isDebugMode;
}
```

### uiMode

**Typ**: `StepUIMode | ((ctx: FlowRuntimeContext<TModel>) => StepUIMode | Promise<StepUIMode>)`  
**Erforderlich**: Nein  
**Beschreibung**: Der UI-Anzeigemodus für die Aktion

Steuert, wie die Aktion in der Benutzeroberfläche angezeigt wird.

**Unterstützte Modi**:
- `'dialog'` - Dialogmodus
- `'drawer'` - Schubladenmodus
- `'embed'` - Einbettungsmodus
- oder ein benutzerdefiniertes Konfigurationsobjekt

**Beispiel**:
```ts
// Einfacher Modus
uiMode: 'dialog'

// Benutzerdefinierte Konfiguration
uiMode: {
  type: 'dialog',
  props: {
    width: 800,
    title: 'Aktionskonfiguration',
    maskClosable: false
  }
}

// Dynamischer Modus
uiMode: (ctx) => {
  return ctx.model.isMobile ? 'drawer' : 'dialog';
}
```

### scene

**Typ**: `ActionScene | ActionScene[]`  
**Erforderlich**: Nein  
**Beschreibung**: Die Anwendungsszenarien für die Aktion

Beschränkt die Verwendung der Aktion auf bestimmte Szenarien.

**Unterstützte Szenarien**:
- `'settings'` - Einstellungs-Szenario
- `'runtime'` - Laufzeit-Szenario
- `'design'` - Design-Zeit-Szenario

**Beispiel**:
```ts
scene: 'settings'  // Nur im Einstellungs-Szenario verwenden
scene: ['settings', 'runtime']  // In Einstellungs- und Laufzeit-Szenarien verwenden
```

### sort

**Typ**: `number`  
**Erforderlich**: Nein  
**Beschreibung**: Das Sortiergewicht für die Aktion

Steuert die Anzeigereihenfolge der Aktion in einer Liste. Ein kleinerer Wert bedeutet eine höhere Position.

**Beispiel**:
```ts
sort: 0  // Ganz oben
sort: 10 // Mittlere Position
sort: 100 // Weiter unten
```

## Vollständiges Beispiel

```ts
class DataProcessingModel extends FlowModel {}

// Datenlade-Aktion registrieren
DataProcessingModel.registerAction({
  name: 'loadDataAction',
  title: 'Daten laden',
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
        message: 'Daten erfolgreich geladen'
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
        title: 'API-URL',
        'x-component': 'Input',
        'x-decorator': 'FormItem',
        required: true
      },
      method: {
        type: 'string',
        title: 'HTTP-Methode',
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
      throw new Error('URL ist erforderlich');
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

// Datenverarbeitungs-Aktion registrieren
DataProcessingModel.registerAction({
  name: 'processDataAction',
  title: 'Daten verarbeiten',
  handler: async (ctx, params) => {
    const { data, processor, options = {} } = params;
    
    try {
      const processedData = await processData(data, processor, options);
      
      return {
        success: true,
        data: processedData,
        message: 'Daten erfolgreich verarbeitet'
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
        title: 'Prozessor',
        'x-component': 'Select',
        'x-decorator': 'FormItem',
        enum: ['default', 'advanced', 'custom']
      },
      options: {
        type: 'object',
        title: 'Optionen',
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
            title: 'Kodierung',
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