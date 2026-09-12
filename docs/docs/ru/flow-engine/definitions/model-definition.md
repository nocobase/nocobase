# ModelDefinition

ModelDefinition определяет параметры создания FlowModel и используется для создания экземпляра модели через метод `FlowEngine.createModel()`. Включает базовую конфигурацию модели, свойства, подмодели и другую информацию.

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

// Создать экземпляр модели
const model = engine.createModel({
  uid: 'unique-model-id',
  use: 'MyModel',
  props: {
    title: 'Моя модель',
    description: 'Пример модели'
  },
  stepParams: {
    step1: { param1: 'value1' }
  },
  subModels: {
    childModels: [
      {
        use: 'ChildModel',
        props: { name: 'Дочерняя 1' }
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
**Описание**: Используемый класс модели

Может быть строковым именем зарегистрированного класса модели или конструктором класса модели.

**Пример**:
```ts
// Использовать строковую ссылку
use: 'MyModel'

// Использовать конструктор
use: MyModel

// Использовать динамическую ссылку
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
  title: 'Моя модель',
  description: 'Пример экземпляра модели',
  config: {
    theme: 'dark',
    language: 'en-US'
  },
  metadata: {
    version: '1.0.0',
    author: 'Разработчик'
  }
}
```

### stepParams

**Тип**: `StepParams`  
**Обязательно**: Нет  
**Описание**: Конфигурация параметров шагов

Задает параметры для каждого шага в flow.

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
**Описание**: Конфигурация подмодели

Определяет подмодели, поддерживая как массивные, так и одиночные варианты.

**Пример**:
```ts
subModels: {
  // Подмодель типа массив
  childModels: [
    {
      use: 'ChildModel1',
      props: { name: 'Дочерний 1', type: 'primary' }
    },
    {
      use: 'ChildModel2',
      props: { name: 'Дочерний 2', type: 'secondary' }
    }
  ],
  // Одиночная подмодель
  singleChild: {
    use: 'SingleChildModel',
    props: { name: 'Одиночный дочерний' }
  }
}
```

### parentId

**Тип**: `string`  
**Обязательно**: Нет  
**Описание**: UID родительской модели

Используется для установления связи «родитель-потомок» между моделями.

**Пример**:
```ts
parentId: 'parent-model-123'
parentId: 'master-instance'
```

### subKey

**Тип**: `string`  
**Обязательно**: Нет  
**Описание**: Имя ключа подмодели в родительской модели

Используется для идентификации позиции подмодели внутри родительской модели.

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

- `'array'`: подмодель типа массива, может содержать несколько экземпляров
- `'single'`: одиночная подмодель, может содержать только один экземпляр

**Пример**:
```ts
subType: 'array'  // Тип массива
subType: 'single' // Одиночный тип
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
sortIndex: 100 // Дальше по списку
```

### flowRegistry

**Тип**: `Record<string, Omit<FlowDefinitionOptions, 'key'>>`  
**Обязательно**: Нет  
**Описание**: Реестр flow

Регистрирует конкретные определения flow для экземпляра модели.

**Пример**:
```ts
flowRegistry: {
  'customFlow': {
    title: 'Пользовательский flow',
    manual: false,
    steps: {
      step1: {
        use: 'customAction',
        title: 'Пользовательский шаг'
      }
    }
  },
  'anotherFlow': {
    title: 'Другой flow',
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

// Зарегистрировать класс модели
engine.registerModelLoaders({
  DataProcessingModel: {
    // Динамический импорт: модуль модели загружается только тогда, когда эта модель впервые действительно нужна
    loader: () => import('./DataProcessingModel'),
  },
});

// Создать экземпляр модели
const model = engine.createModel({
  uid: 'data-processing-001',
  use: 'DataProcessingModel',
  props: {
    title: 'Экземпляр обработки данных',
    description: 'Обрабатывает пользовательские данные с помощью продвинутых алгоритмов',
    config: {
      algorithm: 'neural-network',
      batchSize: 100,
      learningRate: 0.01
    },
    metadata: {
      version: '2.1.0',
      author: 'Команда данных',
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
          name: 'Основная БД',
          connection: 'mysql://localhost:3306/db1'
        }
      },
      {
        use: 'APISource',
        props: {
          name: 'Внешний API',
          url: 'https://api.external.com/data'
        }
      }
    ],
    processors: [
      {
        use: 'DataProcessor',
        props: {
          name: 'Основной процессор',
          type: 'neural-network'
        }
      }
    ],
    outputHandler: {
      use: 'OutputHandler',
      props: {
        name: 'Обработчик результатов',
        format: 'json'
      }
    }
  },
  flowRegistry: {
    'dataProcessingFlow': {
      title: 'Flow обработки данных',
      manual: false,
      sort: 0,
      steps: {
        load: {
          use: 'loadDataAction',
          title: 'Загрузить данные',
          sort: 0
        },
        process: {
          use: 'processDataAction',
          title: 'Обработать данные',
          sort: 1
        },
        save: {
          use: 'saveDataAction',
          title: 'Сохранить результат',
          sort: 2
        }
      }
    },
    'errorHandlingFlow': {
      title: 'Flow обработки ошибок',
      manual: true,
      on: 'error',
      steps: {
        log: {
          use: 'logErrorAction',
          title: 'Логировать ошибку'
        },
        notify: {
          use: 'notifyErrorAction',
          title: 'Уведомить администратора'
        }
      }
    }
  }
});

// Использование модели
model.applyFlow('dataProcessingFlow');
```