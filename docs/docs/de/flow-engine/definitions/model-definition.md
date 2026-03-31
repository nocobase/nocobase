:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# ModelDefinition

Die ModelDefinition definiert die Erstellungsoptionen für ein Flussmodell, das über die Methode `FlowEngine.createModel()` instanziiert wird. Sie enthält die grundlegende Konfiguration, Eigenschaften, Submodelle und weitere Informationen des Modells.

## Typdefinition

```ts
interface CreateModelOptions {
  uid?: string;
  use: RegisteredModelClassName | ModelConstructor;
  props?: IModelComponentProps;
  flowRegistry?: Record<string, Omit<FlowDefinitionOptions, 'key'>>;
  stepParams?: StepParams;
  subModels?: Record<string, CreateSubModelOptions[]>;
  parentId?: string;
  subKey?: string;
  subType?: 'array' | 'single';
  sortIndex?: number;
  flowRegistry?: Record<string, Omit<FlowDefinitionOptions, 'key'>>;
}
```

## Verwendung

```ts
const engine = new FlowEngine();

// Eine Modellinstanz erstellen
const model = engine.createModel({
  uid: 'unique-model-id',
  use: 'MyModel',
  props: {
    title: 'My Model',
    description: 'A sample model'
  },
  stepParams: {
    step1: { param1: 'value1' }
  },
  subModels: {
    childModels: [
      {
        use: 'ChildModel',
        props: { name: 'Child 1' }
      }
    ]
  }
});
```

## Eigenschaften

### uid

**Typ**: `string`  
**Erforderlich**: Nein  
**Beschreibung**: Der eindeutige Bezeichner für die Modellinstanz.

Wird keine UID angegeben, generiert das System automatisch eine eindeutige UID.

**Beispiel**:
```ts
uid: 'model-123'
uid: 'user-profile-model'
uid: 'data-processing-instance'
```

### use

**Typ**: `RegisteredModelClassName | ModelConstructor`  
**Erforderlich**: Ja  
**Beschreibung**: Die zu verwendende Modellklasse.

Dies kann der Name einer registrierten Modellklasse als String oder der Konstruktor der Modellklasse sein.

**Beispiel**:
```ts
// Verwendung als String-Referenz
use: 'MyModel'

// Verwendung des Konstruktors
use: MyModel

// Verwendung einer dynamischen Referenz
const ModelClass = engine.getModelClass('MyModel');
use: ModelClass
```

### props

**Typ**: `IModelComponentProps`  
**Erforderlich**: Nein  
**Beschreibung**: Die Eigenschaftskonfiguration für das Modell.

Das Eigenschaften-Objekt, das an den Modellkonstruktor übergeben wird.

**Beispiel**:
```ts
props: {
  title: 'My Model',
  description: 'A sample model instance',
  config: {
    theme: 'dark',
    language: 'en-US'
  },
  metadata: {
    version: '1.0.0',
    author: 'Developer'
  }
}
```

### stepParams

**Typ**: `StepParams`  
**Erforderlich**: Nein  
**Beschreibung**: Parameterkonfiguration für Schritte.

Hier legen Sie Parameter für jeden Schritt im Workflow fest.

**Beispiel**:
```ts
stepParams: {
  loadData: {
    url: 'https://api.example.com/data',
    method: 'GET',
    timeout: 5000
  },
  processData: {
    processor: 'advanced',
    options: {
      format: 'json',
      encoding: 'utf8'
    }
  },
  saveData: {
    destination: 'database',
    table: 'processed_data'
  }
}
```

### subModels

**Typ**: `Record<string, CreateSubModelOptions[]>`  
**Erforderlich**: Nein  
**Beschreibung**: Submodell-Konfiguration.

Hier definieren Sie die Submodelle des Modells, sowohl als Arrays als auch als einzelne Submodelle.

**Beispiel**:
```ts
subModels: {
  // Submodell vom Typ Array
  childModels: [
    {
      use: 'ChildModel1',
      props: { name: 'Child 1', type: 'primary' }
    },
    {
      use: 'ChildModel2',
      props: { name: 'Child 2', type: 'secondary' }
    }
  ],
  // Einzelnes Submodell
  singleChild: {
    use: 'SingleChildModel',
    props: { name: 'Single Child' }
  }
}
```

### parentId

**Typ**: `string`  
**Erforderlich**: Nein  
**Beschreibung**: Die UID des übergeordneten Modells.

Wird verwendet, um eine Eltern-Kind-Beziehung zwischen Modellen herzustellen.

**Beispiel**:
```ts
parentId: 'parent-model-123'
parentId: 'master-instance'
```

### subKey

**Typ**: `string`  
**Erforderlich**: Nein  
**Beschreibung**: Der Schlüsselname des Submodells im übergeordneten Modell.

Wird verwendet, um die Position des Submodells innerhalb des übergeordneten Modells zu identifizieren.

**Beispiel**:
```ts
subKey: 'childModels'
subKey: 'subComponents'
subKey: 'nestedItems'
```

### subType

**Typ**: `'array' | 'single'`  
**Erforderlich**: Nein  
**Beschreibung**: Der Typ des Submodells.

- `'array'`: Ein Submodell vom Typ Array, das mehrere Instanzen enthalten kann.
- `'single'`: Ein einzelnes Submodell, das nur eine Instanz enthalten kann.

**Beispiel**:
```ts
subType: 'array'  // Array-Typ
subType: 'single' // Einzelner Typ
```

### sortIndex

**Typ**: `number`  
**Erforderlich**: Nein  
**Beschreibung**: Sortierindex.

Wird verwendet, um die Anzeigereihenfolge des Modells in einer Liste zu steuern.

**Beispiel**:
```ts
sortIndex: 0  // Ganz vorne
sortIndex: 10 // Mittlere Position
sortIndex: 100 // Weiter hinten
```

### flowRegistry

**Typ**: `Record<string, Omit<FlowDefinitionOptions, 'key'>>`  
**Erforderlich**: Nein  
**Beschreibung**: Workflow-Registrierung.

Registriert spezifische Workflow-Definitionen für die Modellinstanz.

**Beispiel**:
```ts
flowRegistry: {
  'customFlow': {
    title: 'Custom Flow',
    manual: false,
    steps: {
      step1: {
        use: 'customAction',
        title: 'Custom Step'
      }
    }
  },
  'anotherFlow': {
    title: 'Another Flow',
    on: 'click',
    steps: {
      step1: {
        handler: async (ctx, params) => {
          // Benutzerdefinierte Verarbeitungslogik
        }
      }
    }
  }
}
```

## Vollständiges Beispiel

```ts
class DataProcessingModel extends FlowModel {}

// Registrieren Sie die Modellklasse
engine.registerModel('DataProcessingModel', DataProcessingModel);

// Erstellen Sie eine Modellinstanz
const model = engine.createModel({
  uid: 'data-processing-001',
  use: 'DataProcessingModel',
  props: {
    title: 'Data Processing Instance',
    description: 'Processes user data with advanced algorithms',
    config: {
      algorithm: 'neural-network',
      batchSize: 100,
      learningRate: 0.01
    },
    metadata: {
      version: '2.1.0',
      author: 'Data Team',
      createdAt: new Date().toISOString()
    }
  },
  stepParams: {
    loadData: {
      source: 'database',
      query: 'SELECT * FROM users WHERE active = true',
      limit: 1000
    },
    preprocess: {
      normalize: true,
      removeOutliers: true,
      encoding: 'utf8'
    },
    process: {
      algorithm: 'neural-network',
      layers: [64, 32, 16],
      epochs: 100,
      batchSize: 32
    },
    saveResults: {
      destination: 'results_table',
      format: 'json',
      compress: true
    }
  },
  subModels: {
    dataSources: [
      {
        use: 'DatabaseSource',
        props: {
          name: 'Primary DB',
          connection: 'mysql://localhost:3306/db1'
        }
      },
      {
        use: 'APISource',
        props: {
          name: 'External API',
          url: 'https://api.external.com/data'
        }
      }
    ],
    processors: [
      {
        use: 'DataProcessor',
        props: {
          name: 'Main Processor',
          type: 'neural-network'
        }
      }
    ],
    outputHandler: {
      use: 'OutputHandler',
      props: {
        name: 'Results Handler',
        format: 'json'
      }
    }
  },
  flowRegistry: {
    'dataProcessingFlow': {
      title: 'Data Processing Flow',
      manual: false,
      sort: 0,
      steps: {
        load: {
          use: 'loadDataAction',
          title: 'Load Data',
          sort: 0
        },
        process: {
          use: 'processDataAction',
          title: 'Process Data',
          sort: 1
        },
        save: {
          use: 'saveDataAction',
          title: 'Save Results',
          sort: 2
        }
      }
    },
    'errorHandlingFlow': {
      title: 'Error Handling Flow',
      manual: true,
      on: 'error',
      steps: {
        log: {
          use: 'logErrorAction',
          title: 'Log Error'
        },
        notify: {
          use: 'notifyErrorAction',
          title: 'Notify Admin'
        }
      }
    }
  }
});

// Verwenden Sie das Modell
model.applyFlow('dataProcessingFlow');
```