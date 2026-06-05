:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# ModelDefinition

ModelDefinition define las opciones de creación para un modelo de flujo, que se utilizan para crear una instancia de modelo a través del método `FlowEngine.createModel()`. Incluye la configuración básica del modelo, sus propiedades, submodelos y otra información relevante.

## Definición de Tipo

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

## Uso

```ts
const engine = new FlowEngine();

// Crea una instancia del modelo
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

## Descripción de Propiedades

### uid

**Tipo**: `string`  
**Requerido**: No  
**Descripción**: El identificador único para la instancia del modelo.

Si no lo proporciona, el sistema generará automáticamente un UID único.

**Ejemplo**:
```ts
uid: 'model-123'
uid: 'user-profile-model'
uid: 'data-processing-instance'
```

### use

**Tipo**: `RegisteredModelClassName | ModelConstructor`  
**Requerido**: Sí  
**Descripción**: La clase de modelo a utilizar.

Puede ser una cadena con el nombre de una clase de modelo registrada o el constructor de la clase de modelo.

**Ejemplo**:
```ts
// Usar referencia de cadena
use: 'MyModel'

// Usar constructor
use: MyModel

// Usar referencia dinámica
const ModelClass = engine.getModelClass('MyModel');
use: ModelClass
```

### props

**Tipo**: `IModelComponentProps`  
**Requerido**: No  
**Descripción**: La configuración de propiedades para el modelo.

Es el objeto de propiedades que se pasa al constructor del modelo.

**Ejemplo**:
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
**Requerido**: No  
**Descripción**: Configuración de parámetros para los pasos.

Permite establecer parámetros para cada paso en el flujo de trabajo.

**Ejemplo**:
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
**Requerido**: No  
**Descripción**: Configuración de submodelos.

Define los submodelos del modelo, admitiendo tanto submodelos de tipo array como individuales.

**Ejemplo**:
```ts
subModels: {
  // Submodelo de tipo array
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
  // Submodelo individual
  singleChild: {
    use: 'SingleChildModel',
    props: { name: 'Single Child' }
  }
}
```

### parentId

**Tipo**: `string`  
**Requerido**: No  
**Descripción**: El UID del modelo padre.

Se utiliza para establecer una relación padre-hijo entre modelos.

**Ejemplo**:
```ts
parentId: 'parent-model-123'
parentId: 'master-instance'
```

### subKey

**Tipo**: `string`  
**Requerido**: No  
**Descripción**: El nombre de la clave del submodelo en el modelo padre.

Se utiliza para identificar la posición del submodelo dentro del modelo padre.

**Ejemplo**:
```ts
subKey: 'childModels'
subKey: 'subComponents'
subKey: 'nestedItems'
```

### subType

**Tipo**: `'array' | 'single'`  
**Requerido**: No  
**Descripción**: El tipo del submodelo.

- `'array'`: Un submodelo de tipo array, que puede contener múltiples instancias.
- `'single'`: Un submodelo individual, que solo puede contener una instancia.

**Ejemplo**:
```ts
subType: 'array'  // Tipo array
subType: 'single' // Tipo individual
```

### sortIndex

**Tipo**: `number`  
**Requerido**: No  
**Descripción**: Índice de ordenación.

Se utiliza para controlar el orden de visualización del modelo en una lista.

**Ejemplo**:
```ts
sortIndex: 0  // Al principio
sortIndex: 10 // Posición intermedia
sortIndex: 100 // Más atrás
```

### flowRegistry

**Tipo**: `Record<string, Omit<FlowDefinitionOptions, 'key'>>`  
**Requerido**: No  
**Descripción**: Registro de flujos.

Registra definiciones de flujo específicas para la instancia del modelo.

**Ejemplo**:
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
          // Lógica de procesamiento personalizada
        }
      }
    }
  }
}
```

## Ejemplo Completo

```ts
class DataProcessingModel extends FlowModel {}

// Registra la clase del modelo
engine.registerModel('DataProcessingModel', DataProcessingModel);

// Crea una instancia del modelo
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

// Usa el modelo
model.applyFlow('dataProcessingFlow');
```