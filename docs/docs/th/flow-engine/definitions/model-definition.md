:::tip
เอกสารนี้แปลโดย AI หากมีข้อมูลที่ไม่ถูกต้อง โปรดดู[เวอร์ชันภาษาอังกฤษ](/en)
:::


# ModelDefinition

ModelDefinition กำหนดตัวเลือกสำหรับการสร้างโมเดล Flow ซึ่งใช้สำหรับสร้างอินสแตนซ์ของโมเดลผ่านเมธอด `FlowEngine.createModel()` ครับ/ค่ะ โดยจะรวมถึงการตั้งค่าพื้นฐาน, คุณสมบัติ, ซับโมเดล (sub-models) และข้อมูลอื่นๆ ของโมเดลครับ/ค่ะ

## การกำหนดประเภท

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

## วิธีการใช้งาน

```ts
const engine = new FlowEngine();

// สร้างอินสแตนซ์ของโมเดล
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

## รายละเอียดคุณสมบัติ

### uid

**ประเภท**: `string`  
**บังคับ**: ไม่  
**คำอธิบาย**: ตัวระบุเฉพาะสำหรับอินสแตนซ์ของโมเดล

หากไม่ได้ระบุ ระบบจะสร้าง UID ที่ไม่ซ้ำกันให้โดยอัตโนมัติครับ/ค่ะ

**ตัวอย่าง**:
```ts
uid: 'model-123'
uid: 'user-profile-model'
uid: 'data-processing-instance'
```

### use

**ประเภท**: `RegisteredModelClassName | ModelConstructor`  
**บังคับ**: ใช่  
**คำอธิบาย**: คลาสโมเดลที่จะใช้

สามารถเป็นสตริงชื่อคลาสโมเดลที่ลงทะเบียนไว้ หรือเป็น Constructor ของคลาสโมเดลก็ได้ครับ/ค่ะ

**ตัวอย่าง**:
```ts
// ใช้การอ้างอิงแบบสตริง
use: 'MyModel'

// ใช้ Constructor
use: MyModel

// ใช้การอ้างอิงแบบไดนามิก
const ModelClass = engine.getModelClass('MyModel');
use: ModelClass
```

### props

**ประเภท**: `IModelComponentProps`  
**บังคับ**: ไม่  
**คำอธิบาย**: การตั้งค่าคุณสมบัติสำหรับโมเดล

ออบเจกต์คุณสมบัติที่จะส่งไปยัง Constructor ของโมเดลครับ/ค่ะ

**ตัวอย่าง**:
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

**ประเภท**: `StepParams`  
**บังคับ**: ไม่  
**คำอธิบาย**: การตั้งค่าพารามิเตอร์สำหรับ Step

ใช้สำหรับกำหนดพารามิเตอร์สำหรับแต่ละ Step ใน Flow ครับ/ค่ะ

**ตัวอย่าง**:
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

**ประเภท**: `Record<string, CreateSubModelOptions[]>`  
**บังคับ**: ไม่  
**คำอธิบาย**: การตั้งค่าซับโมเดล (Sub-model)

ใช้สำหรับกำหนดซับโมเดลของโมเดล โดยรองรับทั้งแบบอาร์เรย์และแบบซับโมเดลเดี่ยวครับ/ค่ะ

**ตัวอย่าง**:
```ts
subModels: {
  // ซับโมเดลประเภทอาร์เรย์
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
  // ซับโมเดลเดี่ยว
  singleChild: {
    use: 'SingleChildModel',
    props: { name: 'Single Child' }
  }
}
```

### parentId

**ประเภท**: `string`  
**บังคับ**: ไม่  
**คำอธิบาย**: UID ของโมเดลหลัก (Parent Model)

ใช้เพื่อสร้างความสัมพันธ์แบบ Parent-Child ระหว่างโมเดลครับ/ค่ะ

**ตัวอย่าง**:
```ts
parentId: 'parent-model-123'
parentId: 'master-instance'
```

### subKey

**ประเภท**: `string`  
**บังคับ**: ไม่  
**คำอธิบาย**: ชื่อคีย์ของซับโมเดลในโมเดลหลัก

ใช้เพื่อระบุตำแหน่งของซับโมเดลภายในโมเดลหลักครับ/ค่ะ

**ตัวอย่าง**:
```ts
subKey: 'childModels'
subKey: 'subComponents'
subKey: 'nestedItems'
```

### subType

**ประเภท**: `'array' | 'single'`  
**บังคับ**: ไม่  
**คำอธิบาย**: ประเภทของซับโมเดล

- `'array'`: ซับโมเดลประเภทอาร์เรย์ ซึ่งสามารถมีได้หลายอินสแตนซ์
- `'single'`: ซับโมเดลเดี่ยว ซึ่งสามารถมีได้เพียงอินสแตนซ์เดียว

**ตัวอย่าง**:
```ts
subType: 'array'  // ประเภทอาร์เรย์
subType: 'single' // ประเภทเดี่ยว
```

### sortIndex

**ประเภท**: `number`  
**บังคับ**: ไม่  
**คำอธิบาย**: ดัชนีการจัดเรียง

ใช้เพื่อควบคุมลำดับการแสดงผลของโมเดลในรายการครับ/ค่ะ

**ตัวอย่าง**:
```ts
sortIndex: 0  // อยู่หน้าสุด
sortIndex: 10 // อยู่ตำแหน่งกลางๆ
sortIndex: 100 // อยู่ค่อนไปทางด้านหลัง
```

### flowRegistry

**ประเภท**: `Record<string, Omit<FlowDefinitionOptions, 'key'>>`  
**บังคับ**: ไม่  
**คำอธิบาย**: Flow Registry

ใช้สำหรับลงทะเบียน Flow Definition เฉพาะสำหรับอินสแตนซ์ของโมเดลครับ/ค่ะ

**ตัวอย่าง**:
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
          // โลจิกการประมวลผลแบบกำหนดเอง
        }
      }
    }
  }
}
```

## ตัวอย่างแบบสมบูรณ์

```ts
class DataProcessingModel extends FlowModel {}

// ลงทะเบียนคลาสโมเดล
engine.registerModel('DataProcessingModel', DataProcessingModel);

// สร้างอินสแตนซ์ของโมเดล
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

// ใช้งานโมเดล
model.applyFlow('dataProcessingFlow');
```