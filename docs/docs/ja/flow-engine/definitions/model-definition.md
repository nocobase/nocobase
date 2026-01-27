:::tip
このドキュメントはAIによって翻訳されました。不正確な情報については、[英語版](/en)をご参照ください
:::

# ModelDefinition

`ModelDefinition` は、`FlowEngine.createModel()` メソッドを使ってモデルインスタンスを作成するための、フローモデルの作成オプションを定義します。モデルの基本的な設定、プロパティ、サブモデルなどの情報が含まれています。

## 型定義

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

## 使用方法

```ts
const engine = new FlowEngine();

// モデルインスタンスを作成します
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

## プロパティの説明

### uid

**型**: `string`  
**必須**: いいえ  
**説明**: モデルインスタンスの一意な識別子です。

指定しない場合、システムが自動的に一意な UID を生成します。

**例**:
```ts
uid: 'model-123'
uid: 'user-profile-model'
uid: 'data-processing-instance'
```

### use

**型**: `RegisteredModelClassName | ModelConstructor`  
**必須**: はい  
**説明**: 使用するモデルクラスです。

登録済みのモデルクラス名の文字列、またはモデルクラスのコンストラクタを指定できます。

**例**:
```ts
// 文字列で参照する場合
use: 'MyModel'

// コンストラクタを使用する場合
use: MyModel

// 動的に参照する場合
const ModelClass = engine.getModelClass('MyModel');
use: ModelClass
```

### props

**型**: `IModelComponentProps`  
**必須**: いいえ  
**説明**: モデルのプロパティ設定です。

モデルのコンストラクタに渡されるプロパティオブジェクトです。

**例**:
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

**型**: `StepParams`  
**必須**: いいえ  
**説明**: ステップのパラメータ設定です。

フロー内の各ステップにパラメータを設定します。

**例**:
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

**型**: `Record<string, CreateSubModelOptions[]>`  
**必須**: いいえ  
**説明**: サブモデルの設定です。

モデルのサブモデルを定義します。配列形式と単一形式の両方をサポートしています。

**例**:
```ts
subModels: {
  // 配列形式のサブモデル
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
  // 単一のサブモデル
  singleChild: {
    use: 'SingleChildModel',
    props: { name: 'Single Child' }
  }
}
```

### parentId

**型**: `string`  
**必須**: いいえ  
**説明**: 親モデルの UID です。

モデル間の親子関係を確立するために使用されます。

**例**:
```ts
parentId: 'parent-model-123'
parentId: 'master-instance'
```

### subKey

**型**: `string`  
**必須**: いいえ  
**説明**: 親モデル内のサブモデルのキー名です。

親モデル内でのサブモデルの位置を識別するために使用されます。

**例**:
```ts
subKey: 'childModels'
subKey: 'subComponents'
subKey: 'nestedItems'
```

### subType

**型**: `'array' | 'single'`  
**必須**: いいえ  
**説明**: サブモデルのタイプです。

- `'array'`: 複数のインスタンスを含めることができる、配列タイプのサブモデルです。
- `'single'`: 1つのインスタンスのみを含めることができる、単一タイプのサブモデルです。

**例**:
```ts
subType: 'array'  // 配列タイプ
subType: 'single' // 単一タイプ
```

### sortIndex

**型**: `number`  
**必須**: いいえ  
**説明**: ソートインデックスです。

リスト内でのモデルの表示順序を制御するために使用されます。

**例**:
```ts
sortIndex: 0  // 最も先頭
sortIndex: 10 // 中間の位置
sortIndex: 100 // 後方の位置
```

### flowRegistry

**型**: `Record<string, Omit<FlowDefinitionOptions, 'key'>>`  
**必須**: いいえ  
**説明**: フローレジストリです。

モデルインスタンスに特定のフロー定義を登録します。

**例**:
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
          // カスタムの処理ロジック
        }
      }
    }
  }
}
```

## 完全な例

```ts
class DataProcessingModel extends FlowModel {}

// モデルクラスを登録します
engine.registerModel('DataProcessingModel', DataProcessingModel);

// モデルインスタンスを作成します
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

// モデルを使用します
model.applyFlow('dataProcessingFlow');
```