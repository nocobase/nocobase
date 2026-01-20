:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::

# ModelDefinition

ModelDefinition은 `FlowEngine.createModel()` 메서드를 통해 모델 인스턴스를 생성하는 데 사용되는 플로우 모델의 생성 옵션을 정의합니다. 여기에는 모델의 기본 설정, 속성, 하위 모델 등의 정보가 포함됩니다.

## 타입 정의

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

## 사용 방법

```ts
const engine = new FlowEngine();

// 모델 인스턴스 생성
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

## 속성 설명

### uid

**타입**: `string`  
**필수**: 아니요  
**설명**: 모델 인스턴스의 고유 식별자입니다.

값을 제공하지 않으면 시스템이 자동으로 고유한 UID를 생성합니다.

**예시**:
```ts
uid: 'model-123'
uid: 'user-profile-model'
uid: 'data-processing-instance'
```

### use

**타입**: `RegisteredModelClassName | ModelConstructor`  
**필수**: 예  
**설명**: 사용할 모델 클래스입니다.

등록된 모델 클래스 이름 문자열 또는 모델 클래스의 생성자일 수 있습니다.

**예시**:
```ts
// 문자열 참조 사용
use: 'MyModel'

// 생성자 사용
use: MyModel

// 동적 참조 사용
const ModelClass = engine.getModelClass('MyModel');
use: ModelClass
```

### props

**타입**: `IModelComponentProps`  
**필수**: 아니요  
**설명**: 모델의 속성 설정입니다.

모델 생성자에 전달되는 속성 객체입니다.

**예시**:
```ts
props: {
  title: 'My Model',
  description: 'A sample model instance',
  config: {
    theme: 'dark',
    language: 'ko-KR'
  },
  metadata: {
    version: '1.0.0',
    author: 'Developer'
  }
}
```

### stepParams

**타입**: `StepParams`  
**필수**: 아니요  
**설명**: 스텝 파라미터 설정입니다.

워크플로우의 각 스텝에 파라미터를 설정합니다.

**예시**:
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

**타입**: `Record<string, CreateSubModelOptions[]>`  
**필수**: 아니요  
**설명**: 하위 모델 설정입니다.

모델의 하위 모델을 정의하며, 배열 및 단일 하위 모델을 모두 지원합니다.

**예시**:
```ts
subModels: {
  // 배열 타입 하위 모델
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
  // 단일 하위 모델
  singleChild: {
    use: 'SingleChildModel',
    props: { name: 'Single Child' }
  }
}
```

### parentId

**타입**: `string`  
**필수**: 아니요  
**설명**: 부모 모델의 UID입니다.

모델 간의 부모-자식 관계를 설정하는 데 사용됩니다.

**예시**:
```ts
parentId: 'parent-model-123'
parentId: 'master-instance'
```

### subKey

**타입**: `string`  
**필수**: 아니요  
**설명**: 부모 모델 내 하위 모델의 키 이름입니다.

부모 모델 내에서 하위 모델의 위치를 식별하는 데 사용됩니다.

**예시**:
```ts
subKey: 'childModels'
subKey: 'subComponents'
subKey: 'nestedItems'
```

### subType

**타입**: `'array' | 'single'`  
**필수**: 아니요  
**설명**: 하위 모델의 타입입니다.

- `'array'`: 여러 인스턴스를 포함할 수 있는 배열 타입 하위 모델입니다.
- `'single'`: 하나의 인스턴스만 포함할 수 있는 단일 하위 모델입니다.

**예시**:
```ts
subType: 'array'  // 배열 타입
subType: 'single' // 단일 타입
```

### sortIndex

**타입**: `number`  
**필수**: 아니요  
**설명**: 정렬 인덱스입니다.

목록에서 모델의 표시 순서를 제어하는 데 사용됩니다.

**예시**:
```ts
sortIndex: 0  // 가장 앞
sortIndex: 10 // 중간 위치
sortIndex: 100 // 뒤쪽
```

### flowRegistry

**타입**: `Record<string, Omit<FlowDefinitionOptions, 'key'>>`  
**필수**: 아니요  
**설명**: 플로우 레지스트리입니다.

모델 인스턴스에 특정 플로우 정의를 등록합니다.

**예시**:
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
          // 사용자 정의 처리 로직
        }
      }
    }
  }
}
```

## 전체 예시

```ts
class DataProcessingModel extends FlowModel {}

// 모델 클래스 등록
engine.registerModel('DataProcessingModel', DataProcessingModel);

// 모델 인스턴스 생성
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

// 모델 사용
model.applyFlow('dataProcessingFlow');
```