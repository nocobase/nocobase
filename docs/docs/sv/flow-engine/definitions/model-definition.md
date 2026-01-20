:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# ModelDefinition

ModelDefinition definierar skapandealternativen för en flödesmodell, som används för att skapa en modellinstans via metoden `FlowEngine.createModel()`. Den innehåller modellens grundläggande konfiguration, egenskaper, undermodeller och annan information.

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

## Användning

```ts
const engine = new FlowEngine();

// Skapa en modellinstans
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

## Egenskapsbeskrivningar

### uid

**Typ**: `string`  
**Obligatorisk**: Nej  
**Beskrivning**: Den unika identifieraren för modellinstansen

Om den inte anges genererar systemet automatiskt ett unikt UID.

**Exempel**:
```ts
uid: 'model-123'
uid: 'user-profile-model'
uid: 'data-processing-instance'
```

### use

**Typ**: `RegisteredModelClassName | ModelConstructor`  
**Obligatorisk**: Ja  
**Beskrivning**: Modellklassen som ska användas

Kan vara en sträng med ett registrerat modellklassnamn, eller modellklassens konstruktor.

**Exempel**:
```ts
// Använd strängreferens
use: 'MyModel'

// Använd konstruktor
use: MyModel

// Använd dynamisk referens
const ModelClass = engine.getModelClass('MyModel');
use: ModelClass
```

### props

**Typ**: `IModelComponentProps`  
**Obligatorisk**: Nej  
**Beskrivning**: Egenskapskonfigurationen för modellen

Egenskapsobjektet som skickas till modellkonstruktorn.

**Exempel**:
```ts
props: {
  title: 'My Model',
  description: 'A sample model instance',
  config: {
    theme: 'dark',
    language: 'zh-CN'
  },
  metadata: {
    version: '1.0.0',
    author: 'Developer'
  }
}
```

### stepParams

**Typ**: `StepParams`  
**Obligatorisk**: Nej  
**Beskrivning**: Stegparameterkonfiguration

Anger parametrar för varje steg i flödet.

**Exempel**:
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
**Obligatorisk**: Nej  
**Beskrivning**: Undermodellskonfiguration

Definierar modellens undermodeller, med stöd för både array- och enskilda undermodeller.

**Exempel**:
```ts
subModels: {
  // Undermodell av array-typ
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
  // Enskild undermodell
  singleChild: {
    use: 'SingleChildModel',
    props: { name: 'Single Child' }
  }
}
```

### parentId

**Typ**: `string`  
**Obligatorisk**: Nej  
**Beskrivning**: Föräldramodellens UID

Används för att upprätta en förälder-barn-relation mellan modeller.

**Exempel**:
```ts
parentId: 'parent-model-123'
parentId: 'master-instance'
```

### subKey

**Typ**: `string`  
**Obligatorisk**: Nej  
**Beskrivning**: Nyckelnamnet för undermodellen i föräldramodellen

Används för att identifiera undermodellens position inom föräldramodellen.

**Exempel**:
```ts
subKey: 'childModels'
subKey: 'subComponents'
subKey: 'nestedItems'
```

### subType

**Typ**: `'array' | 'single'`  
**Obligatorisk**: Nej  
**Beskrivning**: Typen av undermodell

- `'array'`: En undermodell av array-typ, som kan innehålla flera instanser
- `'single'`: En enskild undermodell, som endast kan innehålla en instans

**Exempel**:
```ts
subType: 'array'  // Array-typ
subType: 'single' // Enskild typ
```

### sortIndex

**Typ**: `number`  
**Obligatorisk**: Nej  
**Beskrivning**: Sorteringsindex

Används för att styra modellens visningsordning i en lista.

**Exempel**:
```ts
sortIndex: 0  // Längst fram
sortIndex: 10 // Mellanposition
sortIndex: 100 // Längre bak
```

### flowRegistry

**Typ**: `Record<string, Omit<FlowDefinitionOptions, 'key'>>`  
**Obligatorisk**: Nej  
**Beskrivning**: Flödesregister

Registrerar specifika flödesdefinitioner för modellinstansen.

**Exempel**:
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
          // Anpassad behandlingslogik
        }
      }
    }
  }
}
```

## Komplett exempel

```ts
class DataProcessingModel extends FlowModel {}

// Registrera modellklassen
engine.registerModel('DataProcessingModel', DataProcessingModel);

// Skapa en modellinstans
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

// Använd modellen
model.applyFlow('dataProcessingFlow');
```