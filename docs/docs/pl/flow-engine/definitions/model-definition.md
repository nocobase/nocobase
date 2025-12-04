:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# ModelDefinition

ModelDefinition określa opcje tworzenia modelu przepływu pracy, które są wykorzystywane do tworzenia instancji modelu za pomocą metody `FlowEngine.createModel()`. Zawiera podstawową konfigurację modelu, jego właściwości, podmodele oraz inne istotne informacje.

## Definicja typu

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

## Sposób użycia

```ts
const engine = new FlowEngine();

// Tworzenie instancji modelu
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

## Opis właściwości

### uid

**Typ**: `string`  
**Wymagane**: Nie  
**Opis**: Unikalny identyfikator instancji modelu.

Jeśli nie zostanie podany, system automatycznie wygeneruje unikalny identyfikator UID.

**Przykład**:
```ts
uid: 'model-123'
uid: 'user-profile-model'
uid: 'data-processing-instance'
```

### use

**Typ**: `RegisteredModelClassName | ModelConstructor`  
**Wymagane**: Tak  
**Opis**: Klasa modelu do użycia.

Może to być nazwa zarejestrowanej klasy modelu (jako string) lub konstruktor klasy modelu.

**Przykład**:
```ts
// Użycie referencji stringowej
use: 'MyModel'

// Użycie konstruktora
use: MyModel

// Użycie dynamicznej referencji
const ModelClass = engine.getModelClass('MyModel');
use: ModelClass
```

### props

**Typ**: `IModelComponentProps`  
**Wymagane**: Nie  
**Opis**: Konfiguracja właściwości dla modelu.

Jest to obiekt właściwości przekazywany do konstruktora modelu.

**Przykład**:
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

**Typ**: `StepParams`  
**Wymagane**: Nie  
**Opis**: Konfiguracja parametrów dla kroków.

Ustawia parametry dla każdego kroku w przepływie pracy.

**Przykład**:
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

**Typ**: `Record<string, CreateSubModelOptions[]>`  
**Wymagane**: Nie  
**Opis**: Konfiguracja podmodeli.

Definiuje podmodele dla danego modelu, obsługując zarówno podmodele tablicowe, jak i pojedyncze.

**Przykład**:
```ts
subModels: {
  // Podmodel typu tablicowego
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
  // Pojedynczy podmodel
  singleChild: {
    use: 'SingleChildModel',
    props: { name: 'Single Child' }
  }
}
```

### parentId

**Typ**: `string`  
**Wymagane**: Nie  
**Opis**: UID modelu nadrzędnego.

Służy do ustanawiania relacji rodzic-dziecko między modelami.

**Przykład**:
```ts
parentId: 'parent-model-123'
parentId: 'master-instance'
```

### subKey

**Typ**: `string`  
**Wymagane**: Nie  
**Opis**: Nazwa klucza podmodelu w modelu nadrzędnym.

Służy do identyfikacji pozycji podmodelu w modelu nadrzędnym.

**Przykład**:
```ts
subKey: 'childModels'
subKey: 'subComponents'
subKey: 'nestedItems'
```

### subType

**Typ**: `'array' | 'single'`  
**Wymagane**: Nie  
**Opis**: Typ podmodelu.

- `'array'`: Podmodel typu tablicowego, który może zawierać wiele instancji.
- `'single'`: Pojedynczy podmodel, który może zawierać tylko jedną instancję.

**Przykład**:
```ts
subType: 'array'  // Typ tablicowy
subType: 'single' // Typ pojedynczy
```

### sortIndex

**Typ**: `number`  
**Wymagane**: Nie  
**Opis**: Indeks sortowania.

Służy do kontrolowania kolejności wyświetlania modelu na liście.

**Przykład**:
```ts
sortIndex: 0  // Na samym początku
sortIndex: 10 // Pozycja środkowa
sortIndex: 100 // Dalej na liście
```

### flowRegistry

**Typ**: `Record<string, Omit<FlowDefinitionOptions, 'key'>>`  
**Wymagane**: Nie  
**Opis**: Rejestr przepływów pracy.

Rejestruje konkretne definicje przepływów pracy dla instancji modelu.

**Przykład**:
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
          // Niestandardowa logika przetwarzania
        }
      }
    }
  }
}
```

## Pełny przykład

```ts
class DataProcessingModel extends FlowModel {}

// Rejestracja klasy modelu
engine.registerModel('DataProcessingModel', DataProcessingModel);

// Tworzenie instancji modelu
const model = engine.createModel({
  uid: 'data-processing-001',
  use: 'DataProcessingModel',
  props: {
    title: 'Instancja przetwarzania danych',
    description: 'Przetwarza dane użytkownika za pomocą zaawansowanych algorytmów',
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
          name: 'Główna baza danych',
          connection: 'mysql://localhost:3306/db1'
        }
      },
      {
        use: 'APISource',
        props: {
          name: 'Zewnętrzne API',
          url: 'https://api.external.com/data'
        }
      }
    ],
    processors: [
      {
        use: 'DataProcessor',
        props: {
          name: 'Główny procesor',
          type: 'neural-network'
        }
      }
    ],
    outputHandler: {
      use: 'OutputHandler',
      props: {
        name: 'Obsługa wyników',
        format: 'json'
      }
    }
  },
  flowRegistry: {
    'dataProcessingFlow': {
      title: 'Przepływ pracy przetwarzania danych',
      manual: false,
      sort: 0,
      steps: {
        load: {
          use: 'loadDataAction',
          title: 'Wczytaj dane',
          sort: 0
        },
        process: {
          use: 'processDataAction',
          title: 'Przetwórz dane',
          sort: 1
        },
        save: {
          use: 'saveDataAction',
          title: 'Zapisz wyniki',
          sort: 2
        }
      }
    },
    'errorHandlingFlow': {
      title: 'Przepływ pracy obsługi błędów',
      manual: true,
      on: 'error',
      steps: {
        log: {
          use: 'logErrorAction',
          title: 'Zaloguj błąd'
        },
        notify: {
          use: 'notifyErrorAction',
          title: 'Powiadom administratora'
        }
      }
    }
  }
});

// Użycie modelu
model.applyFlow('dataProcessingFlow');
```