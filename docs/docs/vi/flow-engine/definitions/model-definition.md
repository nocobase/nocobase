:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# ModelDefinition

ModelDefinition định nghĩa các tùy chọn tạo mô hình luồng, dùng để tạo một thể hiện mô hình thông qua phương thức `FlowEngine.createModel()`. Nó bao gồm cấu hình cơ bản, thuộc tính, các mô hình con và các thông tin khác của mô hình.

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

## Cách sử dụng

```ts
const engine = new FlowEngine();

// Tạo một thể hiện mô hình
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

## Mô tả thuộc tính

### uid

**Kiểu**: `string`  
**Bắt buộc**: Không  
**Mô tả**: Mã định danh duy nhất cho thể hiện mô hình.

Nếu không cung cấp, hệ thống sẽ tự động tạo một UID duy nhất.

**Ví dụ**:
```ts
uid: 'model-123'
uid: 'user-profile-model'
uid: 'data-processing-instance'
```

### use

**Kiểu**: `RegisteredModelClassName | ModelConstructor`  
**Bắt buộc**: Có  
**Mô tả**: Lớp mô hình sẽ sử dụng.

Có thể là một chuỗi tên lớp mô hình đã được đăng ký, hoặc hàm khởi tạo của lớp mô hình.

**Ví dụ**:
```ts
// Sử dụng tham chiếu chuỗi
use: 'MyModel'

// Sử dụng hàm khởi tạo
use: MyModel

// Sử dụng tham chiếu động
const ModelClass = engine.getModelClass('MyModel');
use: ModelClass
```

### props

**Kiểu**: `IModelComponentProps`  
**Bắt buộc**: Không  
**Mô tả**: Cấu hình thuộc tính cho mô hình.

Đối tượng thuộc tính được truyền vào hàm khởi tạo của mô hình.

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
**Mô tả**: Cấu hình tham số bước.

Đặt các tham số cho từng bước trong luồng.

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
**Mô tả**: Cấu hình mô hình con.

Định nghĩa các mô hình con của mô hình, hỗ trợ cả mô hình con dạng mảng và mô hình con đơn lẻ.

**Ví dụ**:
```ts
subModels: {
  // Mô hình con dạng mảng
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
  // Mô hình con đơn lẻ
  singleChild: {
    use: 'SingleChildModel',
    props: { name: 'Single Child' }
  }
}
```

### parentId

**Kiểu**: `string`  
**Bắt buộc**: Không  
**Mô tả**: UID của mô hình cha.

Dùng để thiết lập mối quan hệ cha-con giữa các mô hình.

**Ví dụ**:
```ts
parentId: 'parent-model-123'
parentId: 'master-instance'
```

### subKey

**Kiểu**: `string`  
**Bắt buộc**: Không  
**Mô tả**: Tên khóa của mô hình con trong mô hình cha.

Dùng để xác định vị trí của mô hình con trong mô hình cha.

**Ví dụ**:
```ts
subKey: 'childModels'
subKey: 'subComponents'
subKey: 'nestedItems'
```

### subType

**Kiểu**: `'array' | 'single'`  
**Bắt buộc**: Không  
**Mô tả**: Kiểu của mô hình con.

-   `'array'`: Mô hình con dạng mảng, có thể chứa nhiều thể hiện.
-   `'single'`: Mô hình con đơn lẻ, chỉ có thể chứa một thể hiện.

**Ví dụ**:
```ts
subType: 'array'  // Kiểu mảng
subType: 'single' // Kiểu đơn lẻ
```

### sortIndex

**Kiểu**: `number`  
**Bắt buộc**: Không  
**Mô tả**: Chỉ mục sắp xếp.

Dùng để kiểm soát thứ tự hiển thị của mô hình trong danh sách.

**Ví dụ**:
```ts
sortIndex: 0  // Ở vị trí đầu tiên
sortIndex: 10 // Vị trí giữa
sortIndex: 100 // Vị trí cuối
```

### flowRegistry

**Kiểu**: `Record<string, Omit<FlowDefinitionOptions, 'key'>>`  
**Bắt buộc**: Không  
**Mô tả**: Danh sách đăng ký luồng.

Đăng ký các định nghĩa luồng cụ thể cho thể hiện mô hình.

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

// Đăng ký lớp mô hình
engine.registerModel('DataProcessingModel', DataProcessingModel);

// Tạo một thể hiện mô hình
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

// Sử dụng mô hình
model.applyFlow('dataProcessingFlow');
```