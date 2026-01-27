:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# ModelDefinition

ModelDefinition mendefinisikan opsi pembuatan untuk model alur kerja, yang digunakan untuk membuat instans model melalui metode `FlowEngine.createModel()`. Ini mencakup konfigurasi dasar model, properti, sub-model, dan informasi lainnya.

## Definisi Tipe

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

## Cara Penggunaan

```ts
const engine = new FlowEngine();

// Membuat instans model
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

## Deskripsi Properti

### uid

**Tipe**: `string`  
**Wajib**: Tidak  
**Deskripsi**: Pengidentifikasi unik untuk instans model

Jika tidak disediakan, sistem akan secara otomatis menghasilkan UID yang unik.

**Contoh**:
```ts
uid: 'model-123'
uid: 'user-profile-model'
uid: 'data-processing-instance'
```

### use

**Tipe**: `RegisteredModelClassName | ModelConstructor`  
**Wajib**: Ya  
**Deskripsi**: Kelas model yang akan digunakan

Bisa berupa string nama kelas model yang terdaftar, atau konstruktor kelas model.

**Contoh**:
```ts
// Menggunakan referensi string
use: 'MyModel'

// Menggunakan konstruktor
use: MyModel

// Menggunakan referensi dinamis
const ModelClass = engine.getModelClass('MyModel');
use: ModelClass
```

### props

**Tipe**: `IModelComponentProps`  
**Wajib**: Tidak  
**Deskripsi**: Konfigurasi properti untuk model

Objek properti yang diteruskan ke konstruktor model.

**Contoh**:
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

**Tipe**: `StepParams`  
**Wajib**: Tidak  
**Deskripsi**: Konfigurasi parameter langkah

Mengatur parameter untuk setiap langkah dalam alur kerja.

**Contoh**:
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

**Tipe**: `Record<string, CreateSubModelOptions[]>`  
**Wajib**: Tidak  
**Deskripsi**: Konfigurasi sub-model

Mendefinisikan sub-model dari model, mendukung sub-model bertipe array dan tunggal.

**Contoh**:
```ts
subModels: {
  // Sub-model bertipe array
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
  // Sub-model tunggal
  singleChild: {
    use: 'SingleChildModel',
    props: { name: 'Single Child' }
  }
}
```

### parentId

**Tipe**: `string`  
**Wajib**: Tidak  
**Deskripsi**: UID dari model induk

Digunakan untuk membangun hubungan induk-anak antar model.

**Contoh**:
```ts
parentId: 'parent-model-123'
parentId: 'master-instance'
```

### subKey

**Tipe**: `string`  
**Wajib**: Tidak  
**Deskripsi**: Nama kunci sub-model dalam model induk

Digunakan untuk mengidentifikasi posisi sub-model di dalam model induk.

**Contoh**:
```ts
subKey: 'childModels'
subKey: 'subComponents'
subKey: 'nestedItems'
```

### subType

**Tipe**: `'array' | 'single'`  
**Wajib**: Tidak  
**Deskripsi**: Tipe sub-model

-   `'array'`: Sub-model bertipe array, yang dapat berisi beberapa instans
-   `'single'`: Sub-model tunggal, yang hanya dapat berisi satu instans

**Contoh**:
```ts
subType: 'array'  // Tipe array
subType: 'single' // Tipe tunggal
```

### sortIndex

**Tipe**: `number`  
**Wajib**: Tidak  
**Deskripsi**: Indeks pengurutan

Digunakan untuk mengontrol urutan tampilan model dalam daftar.

**Contoh**:
```ts
sortIndex: 0  // Paling depan
sortIndex: 10 // Posisi tengah
sortIndex: 100 // Agak belakang
```

### flowRegistry

**Tipe**: `Record<string, Omit<FlowDefinitionOptions, 'key'>>`  
**Wajib**: Tidak  
**Deskripsi**: Registri alur kerja

Mendaftarkan definisi alur kerja tertentu untuk instans model.

**Contoh**:
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
          // Logika pemrosesan kustom
        }
      }
    }
  }
}
```

## Contoh Lengkap

```ts
class DataProcessingModel extends FlowModel {}

// Mendaftarkan kelas model
engine.registerModel('DataProcessingModel', DataProcessingModel);

// Membuat instans model
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

// Menggunakan model
model.applyFlow('dataProcessingFlow');
```