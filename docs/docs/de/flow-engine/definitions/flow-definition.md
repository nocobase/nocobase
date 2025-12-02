:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# FlowDefinition

FlowDefinition definiert die grundlegende Struktur und Konfiguration eines Workflows und ist eines der Kernkonzepte der Workflow-Engine. Es beschreibt die Metadaten, Auslösebedingungen und Ausführungsschritte des Workflows.

## Typdefinition

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

## Registrierung

```ts
class MyModel extends FlowModel {}

// Registrieren Sie einen Workflow über die Modellklasse
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

## Eigenschaften

### key

**Typ**: `string`  
**Erforderlich**: Ja  
**Beschreibung**: Der eindeutige Bezeichner für den Workflow.

Wir empfehlen, einen konsistenten Benennungsstil im Format `xxxSettings` zu verwenden, zum Beispiel:
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

Diese Benennungskonvention erleichtert die Identifizierung und Wartung. Wir empfehlen, sie projektweit einheitlich zu verwenden.

**Beispiel**:
```ts
key: 'pageSettings'
key: 'tableSettings'
key: 'deleteSettings'
```

### title

**Typ**: `string`  
**Erforderlich**: Nein  
**Beschreibung**: Der menschenlesbare Titel des Workflows.

Wir empfehlen, einen mit dem Schlüssel konsistenten Stil im Format `Xxx settings` zu verwenden, zum Beispiel:
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

Diese Benennungskonvention ist klarer und leichter verständlich, was die Anzeige in der Benutzeroberfläche und die Zusammenarbeit im Team erleichtert.

**Beispiel**:
```ts
title: 'Page settings'
title: 'Table settings'
title: 'Delete settings'
```

### manual

**Typ**: `boolean`  
**Erforderlich**: Nein  
**Standardwert**: `false`  
**Beschreibung**: Legt fest, ob der Workflow nur manuell ausgeführt werden kann.

- `true`: Der Workflow kann nur manuell ausgelöst werden und wird nicht automatisch ausgeführt.
- `false`: Der Workflow kann automatisch ausgeführt werden (wenn die Eigenschaft `on` nicht vorhanden ist, erfolgt die Ausführung standardmäßig automatisch).

**Beispiel**:
```ts
manual: true  // Nur manuell ausführen
manual: false // Kann automatisch ausgeführt werden
```

### sort

**Typ**: `number`  
**Erforderlich**: Nein  
**Standardwert**: `0`  
**Beschreibung**: Die Ausführungsreihenfolge des Workflows. Je kleiner der Wert, desto früher wird er ausgeführt.

Es können auch negative Zahlen verwendet werden, um die Ausführungsreihenfolge mehrerer Workflows zu steuern.

**Beispiel**:
```ts
sort: -1  // Mit Priorität ausführen
sort: 0   // Standardreihenfolge
sort: 1   // Später ausführen
```

### on

**Typ**: `FlowEvent<TModel>`  
**Erforderlich**: Nein  
**Beschreibung**: Die Ereigniskonfiguration, die es ermöglicht, diesen Workflow mittels `dispatchEvent` auszulösen.

Wird nur verwendet, um den Namen des auslösenden Ereignisses (als String oder `{ eventName }`) zu deklarieren; eine Handler-Funktion ist nicht enthalten.

**Unterstützte Ereignistypen**:
- `'click'` - Klick-Ereignis
- `'submit'` - Senden-Ereignis
- `'reset'` - Zurücksetzen-Ereignis
- `'remove'` - Entfernen-Ereignis
- `'openView'` - Ansicht-öffnen-Ereignis
- `'dropdownOpen'` - Dropdown-öffnen-Ereignis
- `'popupScroll'` - Popup-Scroll-Ereignis
- `'search'` - Suchen-Ereignis
- `'customRequest'` - Benutzerdefiniertes Anfrage-Ereignis
- `'collapseToggle'` - Ein-/Ausklappen-Ereignis
- Oder ein beliebiger benutzerdefinierter String

**Beispiel**:
```ts
on: 'click'  // Wird beim Klick ausgelöst
on: 'submit' // Wird beim Senden ausgelöst
on: { eventName: 'customEvent', defaultParams: { param1: 'value1' } }
```

### steps

**Typ**: `Record<string, StepDefinition<TModel>>`  
**Erforderlich**: Ja  
**Beschreibung**: Die Definition der Schritte des Workflows.

Hier werden alle im Workflow enthaltenen Schritte definiert, wobei jeder Schritt einen eindeutigen Schlüssel hat.

**Beispiel**:
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

**Typ**: `Record<string, any> | ((ctx: FlowModelContext) => StepParam | Promise<StepParam>)`  
**Erforderlich**: Nein  
**Beschreibung**: Standardparameter auf Workflow-Ebene.

Bei der Instanziierung des Modells (`createModel`) werden die Schrittparameter des "aktuellen Workflows" mit Initialwerten befüllt. Dabei werden nur fehlende Werte ergänzt, bestehende Werte werden nicht überschrieben. Das feste Rückgabeformat ist: `{ [stepKey]: params }`

**Beispiel**:
```ts
// Statische Standardparameter
defaultParams: {
  step1: { param1: 'value1', param2: 'value2' },
  step2: { param3: 'value3' }
}

// Dynamische Standardparameter
defaultParams: (ctx) => {
  return {
    step1: { 
      param1: ctx.model.uid,
      param2: new Date().toISOString()
    }
  }
}

// Asynchrone Standardparameter
defaultParams: async (ctx) => {
  const data = await fetchSomeData();
  return {
    step1: { data }
  }
}
```

## Vollständiges Beispiel

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
      title: 'Load Data',
      sort: 0,
      preset: true
    },
    processData: {
      use: 'processDataAction', 
      title: 'Process Data',
      sort: 1,
      paramsRequired: true
    },
    saveData: {
      use: 'saveDataAction',
      title: 'Save Data', 
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