:::tip Повідомлення про переклад ШІ
Ця документація була автоматично перекладена штучним інтелектом.
:::


# ModelDefinition

ModelDefinition визначає параметри створення моделі потоку, які використовуються для створення екземпляра моделі за допомогою методу `FlowEngine.createModel()`. Він містить основну конфігурацію моделі, її властивості, підмоделі та іншу інформацію.

## Визначення типу

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

## Використання

```ts
const engine = new FlowEngine();

// Створити екземпляр моделі
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

## Опис властивостей

### uid

**Тип**: `string`  
**Обов'язковий**: Ні  
**Опис**: Унікальний ідентифікатор екземпляра моделі

Якщо ви його не надасте, система автоматично згенерує унікальний UID.

**Приклад**:
```ts
uid: 'model-123'
uid: 'user-profile-model'
uid: 'data-processing-instance'
```

### use

**Тип**: `RegisteredModelClassName | ModelConstructor`  
**Обов'язковий**: Так  
**Опис**: Клас моделі для використання

Це може бути рядок з назвою зареєстрованого класу моделі або конструктор класу моделі.

**Приклад**:
```ts
// Використання посилання у вигляді рядка
use: 'MyModel'

// Використання конструктора
use: MyModel

// Використання динамічного посилання
const ModelClass = engine.getModelClass('MyModel');
use: ModelClass
```

### props

**Тип**: `IModelComponentProps`  
**Обов'язковий**: Ні  
**Опис**: Конфігурація властивостей моделі

Це об'єкт властивостей, що передається конструктору моделі.

**Приклад**:
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

**Тип**: `StepParams`  
**Обов'язковий**: Ні  
**Опис**: Конфігурація параметрів кроку

Встановлює параметри для кожного кроку в робочому процесі.

**Приклад**:
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

**Тип**: `Record<string, CreateSubModelOptions[]>`  
**Обов'язковий**: Ні  
**Опис**: Конфігурація підмоделей

Визначає підмоделі моделі, підтримуючи як масиви, так і поодинокі підмоделі.

**Приклад**:
```ts
subModels: {
  // Підмодель типу масиву
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
  // Одинична підмодель
  singleChild: {
    use: 'SingleChildModel',
    props: { name: 'Single Child' }
  }
}
```

### parentId

**Тип**: `string`  
**Обов'язковий**: Ні  
**Опис**: UID батьківської моделі

Використовується для встановлення зв'язку "батько-нащадок" між моделями.

**Приклад**:
```ts
parentId: 'parent-model-123'
parentId: 'master-instance'
```

### subKey

**Тип**: `string`  
**Обов'язковий**: Ні  
**Опис**: Ключове ім'я підмоделі в батьківській моделі

Використовується для ідентифікації позиції підмоделі всередині батьківської моделі.

**Приклад**:
```ts
subKey: 'childModels'
subKey: 'subComponents'
subKey: 'nestedItems'
```

### subType

**Тип**: `'array' | 'single'`  
**Обов'язковий**: Ні  
**Опис**: Тип підмоделі

- `'array'`: Підмодель типу масиву, яка може містити кілька екземплярів
- `'single'`: Одинична підмодель, яка може містити лише один екземпляр

**Приклад**:
```ts
subType: 'array'  // Тип масиву
subType: 'single' // Одиничний тип
```

### sortIndex

**Тип**: `number`  
**Обов'язковий**: Ні  
**Опис**: Індекс сортування

Використовується для керування порядком відображення моделі у списку.

**Приклад**:
```ts
sortIndex: 0  // На початку списку
sortIndex: 10 // Середня позиція
sortIndex: 100 // Ближче до кінця
```

### flowRegistry

**Тип**: `Record<string, Omit<FlowDefinitionOptions, 'key'>>`  
**Обов'язковий**: Ні  
**Опис**: Реєстр робочих процесів

Реєструє конкретні визначення робочих процесів для екземпляра моделі.

**Приклад**:
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
          // Власна логіка обробки
        }
      }
    }
  }
}
```

## Повний приклад

```ts
class DataProcessingModel extends FlowModel {}

// Зареєструвати клас моделі
engine.registerModel('DataProcessingModel', DataProcessingModel);

// Створити екземпляр моделі
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

// Використати модель
model.applyFlow('dataProcessingFlow');
```