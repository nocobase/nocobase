# ModelDefinition

ModelDefinition 定义了流模型的创建选项，用于通过 `FlowEngine.createModel()` 方法创建模型实例。它包含了模型的基本配置、属性、子模型等信息。

## 类型定义

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

## 使用方式

```ts
const engine = new FlowEngine();

// 创建模型实例
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

## 属性说明

### uid

**类型**: `string`  
**必需**: 否  
**描述**: 模型实例的唯一标识符

如果不提供，系统会自动生成一个唯一的 UID。

**示例**:
```ts
uid: 'model-123'
uid: 'user-profile-model'
uid: 'data-processing-instance'
```

### use

**类型**: `RegisteredModelClassName | ModelConstructor`  
**必需**: 是  
**描述**: 要使用的模型类

可以是已注册的模型类名字符串，或者模型类的构造函数。

**示例**:
```ts
// 使用字符串引用
use: 'MyModel'

// 使用构造函数
use: MyModel

// 使用动态引用
const ModelClass = engine.getModelClass('MyModel');
use: ModelClass
```

### props

**类型**: `IModelComponentProps`  
**必需**: 否  
**描述**: 模型的属性配置

传递给模型构造函数的属性对象。

**示例**:
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

**类型**: `StepParams`  
**必需**: 否  
**描述**: 步骤参数配置

为流中的各个步骤设置参数。

**示例**:
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

**类型**: `Record<string, CreateSubModelOptions[]>`  
**必需**: 否  
**描述**: 子模型配置

定义模型的子模型，支持数组和单个子模型。

**示例**:
```ts
subModels: {
  // 数组类型的子模型
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
  // 单个子模型
  singleChild: {
    use: 'SingleChildModel',
    props: { name: 'Single Child' }
  }
}
```

### parentId

**类型**: `string`  
**必需**: 否  
**描述**: 父模型的 UID

用于建立模型之间的父子关系。

**示例**:
```ts
parentId: 'parent-model-123'
parentId: 'master-instance'
```

### subKey

**类型**: `string`  
**必需**: 否  
**描述**: 在父模型中的子模型键名

用于标识子模型在父模型中的位置。

**示例**:
```ts
subKey: 'childModels'
subKey: 'subComponents'
subKey: 'nestedItems'
```

### subType

**类型**: `'array' | 'single'`  
**必需**: 否  
**描述**: 子模型的类型

- `'array'`: 数组类型的子模型，可以包含多个实例
- `'single'`: 单个子模型，只能包含一个实例

**示例**:
```ts
subType: 'array'  // 数组类型
subType: 'single' // 单个类型
```

### sortIndex

**类型**: `number`  
**必需**: 否  
**描述**: 排序索引

用于控制模型在列表中的显示顺序。

**示例**:
```ts
sortIndex: 0  // 最靠前
sortIndex: 10 // 中等位置
sortIndex: 100 // 较靠后
```

### flowRegistry

**类型**: `Record<string, Omit<FlowDefinitionOptions, 'key'>>`  
**必需**: 否  
**描述**: 流注册表

为模型实例注册特定的流定义。

**示例**:
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

## 完整示例

```ts
class DataProcessingModel extends FlowModel {}

// 注册模型类
engine.registerModel('DataProcessingModel', DataProcessingModel);

// 创建模型实例
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

// 使用模型
model.applyFlow('dataProcessingFlow');
```
