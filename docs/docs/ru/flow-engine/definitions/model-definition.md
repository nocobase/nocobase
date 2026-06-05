:::tip Уведомление о переводе ИИ
Эта документация была автоматически переведена ИИ.
:::

# ModelDefinition

ModelDefinition определяет параметры создания модели потока, которые используются для создания экземпляра модели с помощью метода `FlowEngine.createModel()`. Оно включает базовую конфигурацию, свойства, подмодели и другую информацию о модели.

## Определение типа

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

## Использование

```ts
const engine = new FlowEngine();

// Создание экземпляра модели
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

## Описание свойств

### uid

**Тип**: `string`  
**Обязательно**: Нет  
**Описание**: Уникальный идентификатор экземпляра модели

Если не указан, система автоматически сгенерирует уникальный UID.

**Пример**:
```ts
uid: 'model-123'
uid: 'user-profile-model'
uid: 'data-processing-instance'
```

### use

**Тип**: `RegisteredModelClassName | ModelConstructor`  
**Обязательно**: Да  
**Описание**: Класс модели для использования

Может быть строкой с именем зарегистрированного класса модели или конструктором класса модели.

**Пример**:
```ts
// Использование строковой ссылки
use: 'MyModel'

// Использование конструктора
use: MyModel

// Использование динамической ссылки
const ModelClass = engine.getModelClass('MyModel');
use: ModelClass
```

### props

**Тип**: `IModelComponentProps`  
**Обязательно**: Нет  
**Описание**: Конфигурация свойств модели

Объект свойств, передаваемый в конструктор модели.

**Пример**:
```ts
props: {
  title: 'My Model',
  description: 'A sample model instance',
  config: {
    theme: 'dark',
    language: 'ru-RU'
  },
  metadata: {
    version: '1.0.0',
    author: 'Developer'
  }
}
```

### stepParams

**Тип**: `StepParams`  
**Обязательно**: Нет  
**Описание**: Конфигурация параметров шагов

Задает параметры для каждого шага в рабочем процессе.

**Пример**:
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
**Обязательно**: Нет  
**Описание**: Конфигурация подмоделей

Определяет подмодели модели, поддерживая как массивы, так и отдельные подмодели.

**Пример**:
```ts
subModels: {
  // Подмодель типа "массив"
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
  // Отдельная подмодель
  singleChild: {
    use: 'SingleChildModel',
    props: { name: 'Single Child' }
  }
}
```

### parentId

**Тип**: `string`  
**Обязательно**: Нет  
**Описание**: UID родительской модели

Используется для установления связи "родитель-потомок" между моделями.

**Пример**:
```ts
parentId: 'parent-model-123'
parentId: 'master-instance'
```

### subKey

**Тип**: `string`  
**Обязательно**: Нет  
**Описание**: Имя ключа подмодели в родительской модели

Используется для идентификации положения подмодели внутри родительской модели.

**Пример**:
```ts
subKey: 'childModels'
subKey: 'subComponents'
subKey: 'nestedItems'
```

### subType

**Тип**: `'array' | 'single'`  
**Обязательно**: Нет  
**Описание**: Тип подмодели

- `'array'`: Подмодель типа "массив", которая может содержать несколько экземпляров
- `'single'`: Отдельная подмодель, которая может содержать только один экземпляр

**Пример**:
```ts
subType: 'array'  // Тип "массив"
subType: 'single' // Тип "одиночный"
```

### sortIndex

**Тип**: `number`  
**Обязательно**: Нет  
**Описание**: Индекс сортировки

Используется для управления порядком отображения модели в списке.

**Пример**:
```ts
sortIndex: 0  // В самом начале
sortIndex: 10 // Средняя позиция
sortIndex: 100 // Ближе к концу
```

### flowRegistry

**Тип**: `Record<string, Omit<FlowDefinitionOptions, 'key'>>`  
**Обязательно**: Нет  
**Описание**: Реестр рабочих процессов

Регистрирует определенные определения рабочих процессов для экземпляра модели.

**Пример**:
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
          // Пользовательская логика обработки
        }
      }
    }
  }
}
```

## Полный пример

```ts
class DataProcessingModel extends FlowModel {}

// Регистрация класса модели
engine.registerModel('DataProcessingModel', DataProcessingModel);

// Создание экземпляра модели
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

// Использование модели
model.applyFlow('dataProcessingFlow');
```