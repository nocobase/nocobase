---
title: "ModelDefinition - Định nghĩa kiểu"
description: "ModelDefinition định nghĩa các tùy chọn tạo FlowModel CreateModelOptions: uid, use, props, flowRegistry, subModels, v.v., cách dùng createModel."
keywords: "ModelDefinition,CreateModelOptions,createModel,flowRegistry,subModels,Tạo FlowModel,FlowEngine,NocoBase"
---

# ModelDefinition

ModelDefinition định nghĩa các tùy chọn tạo flow model, dùng để tạo instance model thông qua phương thức `FlowEngine.createModelAsync()`. Nó bao gồm cấu hình cơ bản, thuộc tính, subModel, v.v. của model.

## Định nghĩa kiểu

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

## Cách dùng

```ts
const engine = new FlowEngine();

// Tạo instance model
const model = await engine.createModelAsync({
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

## Mô tả thuộc tính

### uid

**Kiểu**: `string`  
**Bắt buộc**: Không  
**Mô tả**: Định danh duy nhất của instance model

Nếu không cung cấp, hệ thống sẽ tự động sinh một UID duy nhất.

**Ví dụ**:
```ts
uid: 'model-123'
uid: 'user-profile-model'
uid: 'data-processing-instance'
```

### use

**Kiểu**: `RegisteredModelClassName | ModelConstructor`  
**Bắt buộc**: Có  
**Mô tả**: Class model cần dùng

Có thể là chuỗi tên class model đã đăng ký, hoặc constructor của class model.

**Ví dụ**:
```ts
// Dùng tham chiếu chuỗi
use: 'MyModel'

// Dùng constructor
use: MyModel

// Dùng tham chiếu động
const ModelClass = await engine.getModelClassAsync('MyModel');
use: ModelClass
```

### props

**Kiểu**: `IModelComponentProps`  
**Bắt buộc**: Không  
**Mô tả**: Cấu hình thuộc tính của model

Đối tượng thuộc tính được truyền cho constructor của model.

**Ví dụ**:
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

**Kiểu**: `StepParams`  
**Bắt buộc**: Không  
**Mô tả**: Cấu hình tham số bước

Đặt tham số cho các bước trong Flow.

**Ví dụ**:
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

**Kiểu**: `Record<string, CreateSubModelOptions[]>`  
**Bắt buộc**: Không  
**Mô tả**: Cấu hình subModel

Định nghĩa subModel của model, hỗ trợ array và subModel đơn.

**Ví dụ**:
```ts
subModels: {
  // SubModel kiểu array
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
  // SubModel đơn
  singleChild: {
    use: 'SingleChildModel',
    props: { name: 'Single Child' }
  }
}
```

### parentId

**Kiểu**: `string`  
**Bắt buộc**: Không  
**Mô tả**: UID của model cha

Dùng để thiết lập quan hệ cha-con giữa các model.

**Ví dụ**:
```ts
parentId: 'parent-model-123'
parentId: 'master-instance'
```

### subKey

**Kiểu**: `string`  
**Bắt buộc**: Không  
**Mô tả**: Tên key của subModel trong model cha

Dùng để định danh vị trí của subModel trong model cha.

**Ví dụ**:
```ts
subKey: 'childModels'
subKey: 'subComponents'
subKey: 'nestedItems'
```

### subType

**Kiểu**: `'array' | 'single'`  
**Bắt buộc**: Không  
**Mô tả**: Kiểu của subModel

- `'array'`: SubModel kiểu array, có thể chứa nhiều instance
- `'single'`: SubModel đơn, chỉ chứa một instance

**Ví dụ**:
```ts
subType: 'array'  // Kiểu array
subType: 'single' // Kiểu đơn
```

### sortIndex

**Kiểu**: `number`  
**Bắt buộc**: Không  
**Mô tả**: Index sắp xếp

Dùng để kiểm soát thứ tự hiển thị của model trong danh sách.

**Ví dụ**:
```ts
sortIndex: 0  // Trên cùng
sortIndex: 10 // Vị trí giữa
sortIndex: 100 // Phía sau
```

### flowRegistry

**Kiểu**: `Record<string, Omit<FlowDefinitionOptions, 'key'>>`  
**Bắt buộc**: Không  
**Mô tả**: Bảng đăng ký Flow

Đăng ký các định nghĩa Flow cụ thể cho instance model.

**Ví dụ**:
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
          // Logic xử lý tùy chỉnh
        }
      }
    }
  }
}
```

## Ví dụ đầy đủ

```ts
class DataProcessingModel extends FlowModel {}

// Đăng ký class model
engine.registerModelLoaders({
  DataProcessingModel: {
    // Dynamic import, chỉ tải module tương ứng khi model này được dùng đến lần đầu
    loader: () => import('./DataProcessingModel'),
  },
});

// Tạo instance model
const model = await engine.createModelAsync({
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

// Sử dụng model
model.applyFlow('dataProcessingFlow');
```
