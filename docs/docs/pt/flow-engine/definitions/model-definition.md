:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# ModelDefinition

`ModelDefinition` define as opções de criação para um modelo de fluxo, usadas para criar uma instância de modelo através do método `FlowEngine.createModel()`. Ele inclui a configuração básica do modelo, propriedades, submodelos e outras informações.

## Definição de Tipo

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

## Uso

```ts
const engine = new FlowEngine();

// Cria uma instância de modelo
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

## Descrição das Propriedades

### uid

**Tipo**: `string`  
**Obrigatório**: Não  
**Descrição**: O identificador único para a instância do modelo.

Se não for fornecido, o sistema irá gerar automaticamente um UID único.

**Exemplo**:
```ts
uid: 'model-123'
uid: 'user-profile-model'
uid: 'data-processing-instance'
```

### use

**Tipo**: `RegisteredModelClassName | ModelConstructor`  
**Obrigatório**: Sim  
**Descrição**: A classe de modelo a ser usada.

Pode ser uma string com o nome de uma classe de modelo registrada, ou o construtor da classe de modelo.

**Exemplo**:
```ts
// Usa referência de string
use: 'MyModel'

// Usa construtor
use: MyModel

// Usa referência dinâmica
const ModelClass = engine.getModelClass('MyModel');
use: ModelClass
```

### props

**Tipo**: `IModelComponentProps`  
**Obrigatório**: Não  
**Descrição**: A configuração de propriedades para o modelo.

O objeto de propriedades passado para o construtor do modelo.

**Exemplo**:
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

**Tipo**: `StepParams`  
**Obrigatório**: Não  
**Descrição**: Configuração de parâmetros de passo.

Define parâmetros para cada passo no **fluxo de trabalho**.

**Exemplo**:
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

**Tipo**: `Record<string, CreateSubModelOptions[]>`  
**Obrigatório**: Não  
**Descrição**: Configuração de submodelos.

Define os submodelos do modelo, suportando tanto submodelos em array quanto submodelos únicos.

**Exemplo**:
```ts
subModels: {
  // Submodelo do tipo array
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
  // Submodelo único
  singleChild: {
    use: 'SingleChildModel',
    props: { name: 'Single Child' }
  }
}
```

### parentId

**Tipo**: `string`  
**Obrigatório**: Não  
**Descrição**: O UID do modelo pai.

Usado para estabelecer uma relação pai-filho entre os modelos.

**Exemplo**:
```ts
parentId: 'parent-model-123'
parentId: 'master-instance'
```

### subKey

**Tipo**: `string`  
**Obrigatório**: Não  
**Descrição**: O nome da chave do submodelo no modelo pai.

Usado para identificar a posição do submodelo dentro do modelo pai.

**Exemplo**:
```ts
subKey: 'childModels'
subKey: 'subComponents'
subKey: 'nestedItems'
```

### subType

**Tipo**: `'array' | 'single'`  
**Obrigatório**: Não  
**Descrição**: O tipo do submodelo.

- `'array'`: Um submodelo do tipo array, que pode conter múltiplas instâncias.
- `'single'`: Um submodelo único, que pode conter apenas uma instância.

**Exemplo**:
```ts
subType: 'array'  // Tipo array
subType: 'single' // Tipo único
```

### sortIndex

**Tipo**: `number`  
**Obrigatório**: Não  
**Descrição**: Índice de ordenação.

Usado para controlar a ordem de exibição do modelo em uma lista.

**Exemplo**:
```ts
sortIndex: 0  // No topo
sortIndex: 10 // Posição intermediária
sortIndex: 100 // Mais para trás
```

### flowRegistry

**Tipo**: `Record<string, Omit<FlowDefinitionOptions, 'key'>>`  
**Obrigatório**: Não  
**Descrição**: Registro de **fluxo de trabalho**.

Registra definições específicas de **fluxo de trabalho** para a instância do modelo.

**Exemplo**:
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
          // Lógica de processamento personalizada
        }
      }
    }
  }
}
```

## Exemplo Completo

```ts
class DataProcessingModel extends FlowModel {}

// Registra a classe de modelo
engine.registerModel('DataProcessingModel', DataProcessingModel);

// Cria uma instância de modelo
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
      title: 'Fluxo de Processamento de Dados',
      manual: false,
      sort: 0,
      steps: {
        load: {
          use: 'loadDataAction',
          title: 'Carregar Dados',
          sort: 0
        },
        process: {
          use: 'processDataAction',
          title: 'Processar Dados',
          sort: 1
        },
        save: {
          use: 'saveDataAction',
          title: 'Salvar Resultados',
          sort: 2
        }
      }
    },
    'errorHandlingFlow': {
      title: 'Fluxo de Tratamento de Erros',
      manual: true,
      on: 'error',
      steps: {
        log: {
          use: 'logErrorAction',
          title: 'Registrar Erro'
        },
        notify: {
          use: 'notifyErrorAction',
          title: 'Notificar Administrador'
        }
      }
    }
  }
});

// Usa o modelo
model.applyFlow('dataProcessingFlow');
```