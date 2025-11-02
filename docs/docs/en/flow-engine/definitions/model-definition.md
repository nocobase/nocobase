# ModelDefinition

ModelDefinition defines the creation options for a flow model, used to create a model instance via the `FlowEngine.createModel()` method. It includes the model's basic configuration, properties, sub-models, and other information.

## Type Definition

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

## Usage

```ts
const engine = new FlowEngine();

// Create a model instance
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

## Property Descriptions

### uid

**Type**: `string`  
**Required**: No  
**Description**: The unique identifier for the model instance

If not provided, the system will automatically generate a unique UID.

**Example**:
```ts
uid: 'model-123'
uid: 'user-profile-model'
uid: 'data-processing-instance'
```

### use

**Type**: `RegisteredModelClassName | ModelConstructor`  
**Required**: Yes  
**Description**: The model class to use

Can be a registered model class name string, or the model class constructor.

**Example**:
```ts
// Use string reference
use: 'MyModel'

// Use constructor
use: MyModel

// Use dynamic reference
const ModelClass = engine.getModelClass('MyModel');
use: ModelClass
```

### props

**Type**: `IModelComponentProps`  
**Required**: No  
**Description**: The property configuration for the model

The properties object passed to the model constructor.

**Example**:
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

**Type**: `StepParams`  
**Required**: No  
**Description**: Step parameter configuration

Sets parameters for each step in the flow.

**Example**:
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
**Required**: No  
**Description**: Sub-model configuration

Defines the sub-models of the model, supporting both array and single sub-models.

**Example**:
```ts
subModels: {
  // Array-type sub-model
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
  // Single sub-model
  singleChild: {
    use: 'SingleChildModel',
    props: { name: 'Single Child' }
  }
}
```

### parentId

**Type**: `string`  
**Required**: No  
**Description**: The UID of the parent model

Used to establish a parent-child relationship between models.

**Example**:
```ts
parentId: 'parent-model-123'
parentId: 'master-instance'
```

### subKey

**Type**: `string`  
**Required**: No  
**Description**: The key name of the sub-model in the parent model

Used to identify the position of the sub-model within the parent model.

**Example**:
```ts
subKey: 'childModels'
subKey: 'subComponents'
subKey: 'nestedItems'
```

### subType

**Type**: `'array' | 'single'`  
**Required**: No  
**Description**: The type of the sub-model

- `'array'`: An array-type sub-model, which can contain multiple instances
- `'single'`: A single sub-model, which can only contain one instance

**Example**:
```ts
subType: 'array'  // Array type
subType: 'single' // Single type
```

### sortIndex

**Type**: `number`  
**Required**: No  
**Description**: Sort index

Used to control the display order of the model in a list.

**Example**:
```ts
sortIndex: 0  // At the very front
sortIndex: 10 // Middle position
sortIndex: 100 // Further back
```

### flowRegistry

**Type**: `Record<string, Omit<FlowDefinitionOptions, 'key'>>`  
**Required**: No  
**Description**: Flow registry

Registers specific flow definitions for the model instance.

**Example**:
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
          // Custom processing logic
        }
      }
    }
  }
}
```

## Complete Example

```ts
class DataProcessingModel extends FlowModel {}

// Register the model class
engine.registerModel('DataProcessingModel', DataProcessingModel);

// Create a model instance
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

// Use the model
model.applyFlow('dataProcessingFlow');
```