:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# ModelDefinition

`ModelDefinition` définit les options de création d'un modèle de flux, utilisées pour créer une instance de modèle via la méthode `FlowEngine.createModel()`. Elle regroupe la configuration de base du modèle, ses propriétés, ses sous-modèles et d'autres informations.

## Définition du type

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

## Utilisation

```ts
const engine = new FlowEngine();

// Crée une instance de modèle
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

## Description des propriétés

### uid

**Type**: `string`  
**Requis**: Non  
**Description**: L'identifiant unique de l'instance de modèle.

Si vous ne le fournissez pas, le système générera automatiquement un UID unique.

**Exemple**:
```ts
uid: 'model-123'
uid: 'user-profile-model'
uid: 'data-processing-instance'
```

### use

**Type**: `RegisteredModelClassName | ModelConstructor`  
**Requis**: Oui  
**Description**: La classe de modèle à utiliser.

Il peut s'agir d'une chaîne de caractères représentant le nom d'une classe de modèle enregistrée, ou du constructeur de la classe de modèle elle-même.

**Exemple**:
```ts
// Utilisation d'une référence par chaîne de caractères
use: 'MyModel'

// Utilisation du constructeur
use: MyModel

// Utilisation d'une référence dynamique
const ModelClass = engine.getModelClass('MyModel');
use: ModelClass
```

### props

**Type**: `IModelComponentProps`  
**Requis**: Non  
**Description**: La configuration des propriétés du modèle.

L'objet de propriétés passé au constructeur du modèle.

**Exemple**:
```ts
props: {
  title: 'My Model',
  description: 'A sample model instance',
  config: {
    theme: 'dark',
    language: 'fr-FR'
  },
  metadata: {
    version: '1.0.0',
    author: 'Developer'
  }
}
```

### stepParams

**Type**: `StepParams`  
**Requis**: Non  
**Description**: La configuration des paramètres d'étape.

Définit les paramètres pour chaque étape du flux.

**Exemple**:
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
**Requis**: Non  
**Description**: La configuration des sous-modèles.

Définit les sous-modèles du modèle, prenant en charge les sous-modèles de type tableau et les sous-modèles uniques.

**Exemple**:
```ts
subModels: {
  // Sous-modèle de type tableau
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
  // Sous-modèle unique
  singleChild: {
    use: 'SingleChildModel',
    props: { name: 'Single Child' }
  }
}
```

### parentId

**Type**: `string`  
**Requis**: Non  
**Description**: L'UID du modèle parent.

Utilisé pour établir une relation parent-enfant entre les modèles.

**Exemple**:
```ts
parentId: 'parent-model-123'
parentId: 'master-instance'
```

### subKey

**Type**: `string`  
**Requis**: Non  
**Description**: Le nom de la clé du sous-modèle dans le modèle parent.

Utilisé pour identifier la position du sous-modèle au sein du modèle parent.

**Exemple**:
```ts
subKey: 'childModels'
subKey: 'subComponents'
subKey: 'nestedItems'
```

### subType

**Type**: `'array' | 'single'`  
**Requis**: Non  
**Description**: Le type du sous-modèle.

- `'array'`: Un sous-modèle de type tableau, pouvant contenir plusieurs instances.
- `'single'`: Un sous-modèle unique, ne pouvant contenir qu'une seule instance.

**Exemple**:
```ts
subType: 'array'  // Type tableau
subType: 'single' // Type unique
```

### sortIndex

**Type**: `number`  
**Requis**: Non  
**Description**: L'index de tri.

Utilisé pour contrôler l'ordre d'affichage du modèle dans une liste.

**Exemple**:
```ts
sortIndex: 0  // En première position
sortIndex: 10 // Position intermédiaire
sortIndex: 100 // En dernière position
```

### flowRegistry

**Type**: `Record<string, Omit<FlowDefinitionOptions, 'key'>>`  
**Requis**: Non  
**Description**: Le registre de flux.

Enregistre des définitions de flux spécifiques pour l'instance de modèle.

**Exemple**:
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
          // Logique de traitement personnalisée
        }
      }
    }
  }
}
```

## Exemple complet

```ts
class DataProcessingModel extends FlowModel {}

// Enregistre la classe de modèle
engine.registerModel('DataProcessingModel', DataProcessingModel);

// Crée une instance de modèle
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

// Utilise le modèle
model.applyFlow('dataProcessingFlow');
```