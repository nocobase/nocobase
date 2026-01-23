:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# ModelDefinition

ModelDefinition, `FlowEngine.createModel()` metodu aracılığıyla bir model örneği oluşturmak için kullanılan bir akış modelinin oluşturma seçeneklerini tanımlar. Bu tanım, modelin temel yapılandırmasını, özelliklerini, alt modellerini ve diğer bilgilerini içerir.

## Tip Tanımı

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

## Kullanım

```ts
const engine = new FlowEngine();

// Bir model örneği oluşturun
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

## Özellik Açıklamaları

### uid

**Tip**: `string`  
**Gerekli**: Hayır  
**Açıklama**: Model örneği için benzersiz tanımlayıcı.

Eğer belirtilmezse, sistem otomatik olarak benzersiz bir UID oluşturacaktır.

**Örnek**:
```ts
uid: 'model-123'
uid: 'user-profile-model'
uid: 'data-processing-instance'
```

### use

**Tip**: `RegisteredModelClassName | ModelConstructor`  
**Gerekli**: Evet  
**Açıklama**: Kullanılacak model sınıfı.

Kayıtlı bir model sınıfı adı dizesi veya model sınıfının kurucu fonksiyonu olabilir.

**Örnek**:
```ts
// Dize referansı kullanın
use: 'MyModel'

// Kurucu fonksiyon kullanın
use: MyModel

// Dinamik referans kullanın
const ModelClass = engine.getModelClass('MyModel');
use: ModelClass
```

### props

**Tip**: `IModelComponentProps`  
**Gerekli**: Hayır  
**Açıklama**: Modelin özellik yapılandırması.

Model kurucu fonksiyonuna iletilen özellikler nesnesi.

**Örnek**:
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

**Tip**: `StepParams`  
**Gerekli**: Hayır  
**Açıklama**: Adım parametre yapılandırması.

İş akışındaki her adım için parametreleri ayarlar.

**Örnek**:
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

**Tip**: `Record<string, CreateSubModelOptions[]>`  
**Gerekli**: Hayır  
**Açıklama**: Alt model yapılandırması.

Modelin alt modellerini tanımlar, hem dizi hem de tekil alt modelleri destekler.

**Örnek**:
```ts
subModels: {
  // Dizi tipinde alt model
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
  // Tekil alt model
  singleChild: {
    use: 'SingleChildModel',
    props: { name: 'Single Child' }
  }
}
```

### parentId

**Tip**: `string`  
**Gerekli**: Hayır  
**Açıklama**: Üst modelin UID'si.

Modeller arasında üst-alt ilişkisi kurmak için kullanılır.

**Örnek**:
```ts
parentId: 'parent-model-123'
parentId: 'master-instance'
```

### subKey

**Tip**: `string`  
**Gerekli**: Hayır  
**Açıklama**: Alt modelin üst modeldeki anahtar adı.

Alt modelin üst model içindeki konumunu belirlemek için kullanılır.

**Örnek**:
```ts
subKey: 'childModels'
subKey: 'subComponents'
subKey: 'nestedItems'
```

### subType

**Tip**: `'array' | 'single'`  
**Gerekli**: Hayır  
**Açıklama**: Alt modelin tipi.

- `'array'`: Birden fazla örnek içerebilen dizi tipinde bir alt model.
- `'single'`: Yalnızca bir örnek içerebilen tekil bir alt model.

**Örnek**:
```ts
subType: 'array'  // Dizi tipi
subType: 'single' // Tekil tip
```

### sortIndex

**Tip**: `number`  
**Gerekli**: Hayır  
**Açıklama**: Sıralama indeksi.

Modelin bir listedeki görüntülenme sırasını kontrol etmek için kullanılır.

**Örnek**:
```ts
sortIndex: 0  // En önde
sortIndex: 10 // Orta konumda
sortIndex: 100 // Daha geride
```

### flowRegistry

**Tip**: `Record<string, Omit<FlowDefinitionOptions, 'key'>>`  
**Gerekli**: Hayır  
**Açıklama**: İş akışı kayıt defteri.

Model örneği için belirli iş akışı tanımlarını kaydeder.

**Örnek**:
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
          // Özel işleme mantığı
        }
      }
    }
  }
}
```

## Tam Örnek

```ts
class DataProcessingModel extends FlowModel {}

// Model sınıfını kaydedin
engine.registerModel('DataProcessingModel', DataProcessingModel);

// Bir model örneği oluşturun
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

// Modeli kullanın
model.applyFlow('dataProcessingFlow');
```