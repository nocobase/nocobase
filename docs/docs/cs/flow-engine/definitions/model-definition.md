:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# ModelDefinition

ModelDefinition definuje možnosti vytvoření pro model toku, které se používají k vytvoření instance modelu pomocí metody `FlowEngine.createModel()`. Obsahuje základní konfiguraci modelu, jeho vlastnosti, podmodely a další informace.

## Definice typu

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

## Použití

```ts
const engine = new FlowEngine();

// Vytvoření instance modelu
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

## Popis vlastností

### uid

**Typ**: `string`  
**Povinné**: Ne  
**Popis**: Jedinečný identifikátor instance modelu

Pokud není zadán, systém automaticky vygeneruje jedinečný UID.

**Příklad**:
```ts
uid: 'model-123'
uid: 'user-profile-model'
uid: 'data-processing-instance'
```

### use

**Typ**: `RegisteredModelClassName | ModelConstructor`  
**Povinné**: Ano  
**Popis**: Třída modelu, která se má použít

Může to být řetězec s názvem registrované třídy modelu, nebo konstruktor třídy modelu.

**Příklad**:
```ts
// Použití řetězcové reference
use: 'MyModel'

// Použití konstruktoru
use: MyModel

// Použití dynamické reference
const ModelClass = engine.getModelClass('MyModel');
use: ModelClass
```

### props

**Typ**: `IModelComponentProps`  
**Povinné**: Ne  
**Popis**: Konfigurace vlastností modelu

Objekt vlastností předaný konstruktoru modelu.

**Příklad**:
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
**Povinné**: Ne  
**Popis**: Konfigurace parametrů kroku

Nastavuje parametry pro jednotlivé kroky v toku.

**Příklad**:
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
**Povinné**: Ne  
**Popis**: Konfigurace podmodelů

Definuje podmodely modelu, podporuje pole i jednotlivé podmodely.

**Příklad**:
```ts
subModels: {
  // Podmodel typu pole
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
  // Jednotlivý podmodel
  singleChild: {
    use: 'SingleChildModel',
    props: { name: 'Single Child' }
  }
}
```

### parentId

**Typ**: `string`  
**Povinné**: Ne  
**Popis**: UID rodičovského modelu

Používá se k vytvoření vztahu rodič-potomek mezi modely.

**Příklad**:
```ts
parentId: 'parent-model-123'
parentId: 'master-instance'
```

### subKey

**Typ**: `string`  
**Povinné**: Ne  
**Popis**: Název klíče podmodelu v rodičovském modelu

Používá se k identifikaci pozice podmodelu v rodičovském modelu.

**Příklad**:
```ts
subKey: 'childModels'
subKey: 'subComponents'
subKey: 'nestedItems'
```

### subType

**Typ**: `'array' | 'single'`  
**Povinné**: Ne  
**Popis**: Typ podmodelu

- `'array'`: Podmodel typu pole, který může obsahovat více instancí
- `'single'`: Jednotlivý podmodel, který může obsahovat pouze jednu instanci

**Příklad**:
```ts
subType: 'array'  // Typ pole
subType: 'single' // Jednotlivý typ
```

### sortIndex

**Typ**: `number`  
**Povinné**: Ne  
**Popis**: Index řazení

Používá se k řízení pořadí zobrazení modelu v seznamu.

**Příklad**:
```ts
sortIndex: 0  // Na samém začátku
sortIndex: 10 // Střední pozice
sortIndex: 100 // Dále vzadu
```

### flowRegistry

**Typ**: `Record<string, Omit<FlowDefinitionOptions, 'key'>>`  
**Povinné**: Ne  
**Popis**: Registr toků

Registruje specifické definice toků pro instanci modelu.

**Příklad**:
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
          // Vlastní logika zpracování
        }
      }
    }
  }
}
```

## Kompletní příklad

```ts
class DataProcessingModel extends FlowModel {}

// Registrace třídy modelu
engine.registerModel('DataProcessingModel', DataProcessingModel);

// Vytvoření instance modelu
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

// Použití modelu
model.applyFlow('dataProcessingFlow');
```