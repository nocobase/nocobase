:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# StepDefinition

Eine StepDefinition definiert einen einzelnen Schritt in einem Workflow. Jeder Schritt kann eine Aktion, eine Ereignisbehandlung oder eine andere Operation sein. Ein Schritt ist die grundlegende Ausführungseinheit eines Workflows.

## Typdefinition

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

## Verwendung

```ts
class MyModel extends FlowModel {}

MyModel.registerFlow({
  key: 'pageSettings',
  steps: {
    step1: {
      use: 'actionName',
      title: 'First Step', // Erster Schritt
      sort: 0,
      preset: true
    },
    step2: {
      handler: async (ctx, params) => {
        // Benutzerdefinierte Verarbeitungslogik
        return { result: 'success' };
      },
      title: 'Second Step', // Zweiter Schritt
      sort: 1
    }
  }
});
```

## Eigenschaften

### key

**Typ**: `string`  
**Erforderlich**: Nein  
**Beschreibung**: Der eindeutige Bezeichner für den Schritt innerhalb des Workflows.

Wird kein Wert angegeben, wird der Schlüsselname des Schritts im `steps`-Objekt verwendet.

**Beispiel**:
```ts
steps: {
  loadData: {  // Der Schlüssel ist 'loadData'
    use: 'loadDataAction'
  }
}
```

### use

**Typ**: `string`  
**Erforderlich**: Nein  
**Beschreibung**: Der Name einer registrierten ActionDefinition, die verwendet werden soll.

Die `use`-Eigenschaft ermöglicht es Ihnen, auf eine registrierte Aktion zu verweisen und so doppelte Definitionen zu vermeiden.

**Beispiel**:
```ts
// Registrieren Sie zuerst die Aktion
MyModel.registerAction({
  name: 'loadDataAction',
  handler: async (ctx, params) => {
    // Logik zum Laden von Daten
  }
});

// Verwenden Sie sie in einem Schritt
steps: {
  step1: {
    use: 'loadDataAction',  // Verweis auf die registrierte Aktion
    title: 'Load Data'
  }
}
```

### title

**Typ**: `string`  
**Erforderlich**: Nein  
**Beschreibung**: Der Anzeigetitel des Schritts.

Wird für die UI-Anzeige und das Debugging verwendet.

**Beispiel**:
```ts
title: 'Load Data'
title: 'Process Information'
title: 'Save Results'
```

### sort

**Typ**: `number`  
**Erforderlich**: Nein  
**Beschreibung**: Die Ausführungsreihenfolge des Schritts. Je kleiner der Wert, desto früher wird er ausgeführt.

Wird verwendet, um die Ausführungsreihenfolge mehrerer Schritte im selben Workflow zu steuern.

**Beispiel**:
```ts
steps: {
  step1: { sort: 0 },  // Wird zuerst ausgeführt
  step2: { sort: 1 },  // Wird als Nächstes ausgeführt
  step3: { sort: 2 }   // Wird zuletzt ausgeführt
}
```

### handler

**Typ**: `(ctx: FlowRuntimeContext<TModel>, params: any) => Promise<any> | any`  
**Erforderlich**: Nein  
**Beschreibung**: Die Handler-Funktion für den Schritt.

Wenn die `use`-Eigenschaft nicht verwendet wird, können Sie die Handler-Funktion direkt definieren.

**Beispiel**:
```ts
handler: async (ctx, params) => {
  // Kontextinformationen abrufen
  const { model, flowEngine } = ctx;
  
  // Verarbeitungslogik
  const result = await processData(params);
  
  // Ergebnis zurückgeben
  return { success: true, data: result };
}
```

### defaultParams

**Typ**: `Record<string, any> | ((ctx: FlowRuntimeContext<TModel>) => Record<string, any> | Promise<Record<string, any>>)`  
**Erforderlich**: Nein  
**Beschreibung**: Die Standardparameter für den Schritt.

Füllt Parameter mit Standardwerten, bevor der Schritt ausgeführt wird.

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
    timestamp: Date.now()
  }
}

// Asynchrone Standardparameter
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
**Erforderlich**: Nein  
**Beschreibung**: Das UI-Konfigurationsschema für den Schritt.

Definiert, wie der Schritt in der Benutzeroberfläche angezeigt wird und seine Formular-Konfiguration.

**Beispiel**:
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
**Erforderlich**: Nein  
**Beschreibung**: Eine Hook-Funktion, die ausgeführt wird, bevor die Parameter gespeichert werden.

Wird ausgeführt, bevor die Schrittparameter gespeichert werden, und kann zur Parametervalidierung oder -transformation verwendet werden.

**Beispiel**:
```ts
beforeParamsSave: (ctx, params, previousParams) => {
  // Parameter-Validierung
  if (!params.name) {
    throw new Error('Name is required');
  }
  
  // Parameter-Transformation
  params.name = params.name.trim().toLowerCase();
}
```

### afterParamsSave

**Typ**: `(ctx: FlowSettingsContext<TModel>, params: any, previousParams: any) => void | Promise<void>`  
**Erforderlich**: Nein  
**Beschreibung**: Eine Hook-Funktion, die ausgeführt wird, nachdem die Parameter gespeichert wurden.

Wird ausgeführt, nachdem die Schrittparameter gespeichert wurden, und kann verwendet werden, um andere Operationen auszulösen.

**Beispiel**:
```ts
afterParamsSave: (ctx, params, previousParams) => {
  // Protokolle aufzeichnen
  console.log('Step params saved:', params);
  
  // Andere Operationen auslösen
  ctx.model.emitter.emit('paramsChanged', params);
}
```

### uiMode

**Typ**: `StepUIMode | ((ctx: FlowRuntimeContext<TModel>) => StepUIMode | Promise<StepUIMode>)`  
**Erforderlich**: Nein  
**Beschreibung**: Der UI-Anzeigemodus für den Schritt.

Steuert, wie der Schritt in der Benutzeroberfläche angezeigt wird.

**Unterstützte Modi**:
- `'dialog'` - Dialogmodus
- `'drawer'` - Drawer-Modus
- `'embed'` - Einbettungsmodus
- Oder ein benutzerdefiniertes Konfigurationsobjekt

**Beispiel**:
```ts
// Einfacher Modus
uiMode: 'dialog'

// Benutzerdefinierte Konfiguration
uiMode: {
  type: 'dialog',
  props: {
    width: 800,
    title: 'Step Configuration'
  }
}

// Dynamischer Modus
uiMode: (ctx) => {
  return ctx.model.isMobile ? 'drawer' : 'dialog';
}
```

### preset

**Typ**: `boolean`  
**Erforderlich**: Nein  
**Beschreibung**: Gibt an, ob es sich um einen vordefinierten Schritt handelt.

Parameter für Schritte mit `preset: true` müssen zum Zeitpunkt der Erstellung ausgefüllt werden. Schritte ohne dieses Flag können nach der Erstellung des Modells ausgefüllt werden.

**Beispiel**:
```ts
steps: {
  step1: {
    preset: true,  // Parameter müssen zum Zeitpunkt der Erstellung ausgefüllt werden
    use: 'requiredAction'
  },
  step2: {
    preset: false, // Parameter können später ausgefüllt werden
    use: 'optionalAction'
  }
}
```

### paramsRequired

**Typ**: `boolean`  
**Erforderlich**: Nein  
**Beschreibung**: Gibt an, ob die Schrittparameter erforderlich sind.

Wenn `true`, öffnet sich ein Konfigurationsdialog, bevor das Modell hinzugefügt wird.

**Beispiel**:
```ts
paramsRequired: true  // Parameter müssen konfiguriert werden, bevor das Modell hinzugefügt wird
paramsRequired: false // Parameter können später konfiguriert werden
```

### hideInSettings

**Typ**: `boolean`  
**Erforderlich**: Nein  
**Beschreibung**: Gibt an, ob der Schritt im Einstellungsmenü ausgeblendet werden soll.

**Beispiel**:
```ts
hideInSettings: true  // In den Einstellungen ausblenden
hideInSettings: false // In den Einstellungen anzeigen (Standard)
```

### isAwait

**Typ**: `boolean`  
**Erforderlich**: Nein  
**Standardwert**: `true`  
**Beschreibung**: Gibt an, ob auf den Abschluss der Handler-Funktion gewartet werden soll.

**Beispiel**:
```ts
isAwait: true  // Warten, bis die Handler-Funktion abgeschlossen ist (Standard)
isAwait: false // Nicht warten, asynchron ausführen
```

## Vollständiges Beispiel

```ts
class DataProcessingModel extends FlowModel {}

DataProcessingModel.registerFlow({
  key: 'dataProcessing',
  title: 'Data Processing',
  steps: {
    loadData: {
      use: 'loadDataAction',
      title: 'Load Data', // Daten laden
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
      title: 'Process Data', // Daten verarbeiten
      sort: 1,
      defaultParams: (ctx) => ({
        userId: ctx.model.uid,
        timestamp: Date.now()
      }),
      beforeParamsSave: (ctx, params) => {
        if (!params.processor) {
          throw new Error('Processor is required'); // Prozessor ist erforderlich
        }
      },
      afterParamsSave: (ctx, params) => {
        ctx.model.emitter.emit('dataProcessed', params);
      }
    },
    saveData: {
      use: 'saveDataAction',
      title: 'Save Data', // Daten speichern
      sort: 2,
      hideInSettings: false,
      uiMode: {
        type: 'drawer',
        props: {
          width: 600,
          title: 'Save Configuration' // Konfiguration speichern
        }
      }
    }
  }
});
```