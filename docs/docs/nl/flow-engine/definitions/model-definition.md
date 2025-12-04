:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# ModelDefinition

`ModelDefinition` definieert de creatie-opties voor een `flow` model. U gebruikt dit om een modelinstantie te maken via de `FlowEngine.createModel()` methode. Het bevat de basisconfiguratie, eigenschappen, submodellen en andere relevante informatie van het model.

## Type Definitie

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

## Gebruik

```ts
const engine = new FlowEngine();

// Maak een modelinstantie
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

## Eigenschappen

### uid

**Type**: `string`  
**Verplicht**: Nee  
**Beschrijving**: De unieke identificatiecode (UID) voor de modelinstantie.

Als u geen UID opgeeft, genereert het systeem automatisch een unieke UID.

**Voorbeeld**:
```ts
uid: 'model-123'
uid: 'user-profile-model'
uid: 'data-processing-instance'
```

### use

**Type**: `RegisteredModelClassName | ModelConstructor`  
**Verplicht**: Ja  
**Beschrijving**: De te gebruiken modelklasse.

Dit kan een string zijn met de naam van een geregistreerde modelklasse, of de constructor van de modelklasse zelf.

**Voorbeeld**:
```ts
// Gebruik een stringreferentie
use: 'MyModel'

// Gebruik een constructor
use: MyModel

// Gebruik een dynamische referentie
const ModelClass = engine.getModelClass('MyModel');
use: ModelClass
```

### props

**Type**: `IModelComponentProps`  
**Verplicht**: Nee  
**Beschrijving**: De eigenschappenconfiguratie voor het model.

Dit is het object met eigenschappen dat wordt doorgegeven aan de constructor van het model.

**Voorbeeld**:
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

**Type**: `StepParams`  
**Verplicht**: Nee  
**Beschrijving**: Configuratie van stap-parameters.

Hiermee stelt u parameters in voor elke stap in de `workflow`.

**Voorbeeld**:
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

**Type**: `Record<string, CreateSubModelOptions[]>`  
**Verplicht**: Nee  
**Beschrijving**: Configuratie van submodellen.

Definieert de submodellen van het model, met ondersteuning voor zowel array- als enkele submodellen.

**Voorbeeld**:
```ts
subModels: {
  // Submodel van het type array
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
  // Enkel submodel
  singleChild: {
    use: 'SingleChildModel',
    props: { name: 'Single Child' }
  }
}
```

### parentId

**Type**: `string`  
**Verplicht**: Nee  
**Beschrijving**: De UID van het bovenliggende model.

Wordt gebruikt om een ouder-kind relatie tussen modellen tot stand te brengen.

**Voorbeeld**:
```ts
parentId: 'parent-model-123'
parentId: 'master-instance'
```

### subKey

**Type**: `string`  
**Verplicht**: Nee  
**Beschrijving**: De sleutelnaam van het submodel in het bovenliggende model.

Wordt gebruikt om de positie van het submodel binnen het bovenliggende model te identificeren.

**Voorbeeld**:
```ts
subKey: 'childModels'
subKey: 'subComponents'
subKey: 'nestedItems'
```

### subType

**Type**: `'array' | 'single'`  
**Verplicht**: Nee  
**Beschrijving**: Het type submodel.

- `'array'`: Een submodel van het type array, dat meerdere instanties kan bevatten.
- `'single'`: Een enkel submodel, dat slechts één instantie kan bevatten.

**Voorbeeld**:
```ts
subType: 'array'  // Array type
subType: 'single' // Enkel type
```

### sortIndex

**Type**: `number`  
**Verplicht**: Nee  
**Beschrijving**: Sorteerindex.

Wordt gebruikt om de weergavevolgorde van het model in een lijst te bepalen.

**Voorbeeld**:
```ts
sortIndex: 0  // Helemaal vooraan
sortIndex: 10 // Middenpositie
sortIndex: 100 // Verder naar achteren
```

### flowRegistry

**Type**: `Record<string, Omit<FlowDefinitionOptions, 'key'>>`  
**Verplicht**: Nee  
**Beschrijving**: `Workflow` register.

Registreert specifieke `workflow` definities voor de modelinstantie.

**Voorbeeld**:
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
          // Aangepaste verwerkingslogica
        }
      }
    }
  }
}
```

## Volledig Voorbeeld

```ts
class DataProcessingModel extends FlowModel {}

// Registreer de modelklasse
engine.registerModel('DataProcessingModel', DataProcessingModel);

// Maak een modelinstantie
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

// Gebruik het model
model.applyFlow('dataProcessingFlow');
```