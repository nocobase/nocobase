:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# ModelDefinition

ModelDefinition definisce le opzioni di creazione per un modello di **flusso di lavoro**, utilizzate per creare un'istanza di modello tramite il metodo `FlowEngine.createModel()`. Include la configurazione di base del modello, le proprietà, i sotto-modelli e altre informazioni.

## Definizione del Tipo

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

## Utilizzo

```ts
const engine = new FlowEngine();

// Crea un'istanza del modello
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

## Descrizione delle Proprietà

### uid

**Tipo**: `string`  
**Obbligatorio**: No  
**Descrizione**: L'identificatore unico per l'istanza del modello.

Se non fornito, il sistema genererà automaticamente un UID unico.

**Esempio**:
```ts
uid: 'model-123'
uid: 'user-profile-model'
uid: 'data-processing-instance'
```

### use

**Tipo**: `RegisteredModelClassName | ModelConstructor`  
**Obbligatorio**: Sì  
**Descrizione**: La classe del modello da utilizzare.

Può essere una stringa con il nome di una classe di modello registrata, oppure il costruttore della classe del modello.

**Esempio**:
```ts
// Utilizza il riferimento stringa
use: 'MyModel'

// Utilizza il costruttore
use: MyModel

// Utilizza il riferimento dinamico
const ModelClass = engine.getModelClass('MyModel');
use: ModelClass
```

### props

**Tipo**: `IModelComponentProps`  
**Obbligatorio**: No  
**Descrizione**: La configurazione delle proprietà per il modello.

L'oggetto delle proprietà passato al costruttore del modello.

**Esempio**:
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

**Tipo**: `StepParams`  
**Obbligatorio**: No  
**Descrizione**: Configurazione dei parametri del passo.

Imposta i parametri per ogni passo nel **flusso di lavoro**.

**Esempio**:
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

**Tipo**: `Record<string, CreateSubModelOptions[]>`  
**Obbligatorio**: No  
**Descrizione**: Configurazione dei sotto-modelli.

Definisce i sotto-modelli del modello, supportando sia sotto-modelli di tipo array che singoli.

**Esempio**:
```ts
subModels: {
  // Sotto-modello di tipo array
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
  // Sotto-modello singolo
  singleChild: {
    use: 'SingleChildModel',
    props: { name: 'Single Child' }
  }
}
```

### parentId

**Tipo**: `string`  
**Obbligatorio**: No  
**Descrizione**: L'UID del modello padre.

Utilizzato per stabilire una relazione padre-figlio tra i modelli.

**Esempio**:
```ts
parentId: 'parent-model-123'
parentId: 'master-instance'
```

### subKey

**Tipo**: `string`  
**Obbligatorio**: No  
**Descrizione**: Il nome della chiave del sotto-modello nel modello padre.

Utilizzato per identificare la posizione del sotto-modello all'interno del modello padre.

**Esempio**:
```ts
subKey: 'childModels'
subKey: 'subComponents'
subKey: 'nestedItems'
```

### subType

**Tipo**: `'array' | 'single'`  
**Obbligatorio**: No  
**Descrizione**: Il tipo del sotto-modello.

- `'array'`: Un sotto-modello di tipo array, che può contenere più istanze.
- `'single'`: Un sotto-modello singolo, che può contenere una sola istanza.

**Esempio**:
```ts
subType: 'array'  // Tipo array
subType: 'single' // Tipo singolo
```

### sortIndex

**Tipo**: `number`  
**Obbligatorio**: No  
**Descrizione**: Indice di ordinamento.

Utilizzato per controllare l'ordine di visualizzazione del modello in un elenco.

**Esempio**:
```ts
sortIndex: 0  // Il più in alto
sortIndex: 10 // Posizione intermedia
sortIndex: 100 // Il più in basso
```

### flowRegistry

**Tipo**: `Record<string, Omit<FlowDefinitionOptions, 'key'>>`  
**Obbligatorio**: No  
**Descrizione**: Registro dei **flussi di lavoro**.

Registra definizioni di **flusso di lavoro** specifiche per l'istanza del modello.

**Esempio**:
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
          // 自定义处理逻辑
        }
      }
    }
  }
}
```

## Esempio Completo

```ts
class DataProcessingModel extends FlowModel {}

// Registra la classe del modello
engine.registerModel('DataProcessingModel', DataProcessingModel);

// Crea un'istanza del modello
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

// Utilizza il modello
model.applyFlow('dataProcessingFlow');
```