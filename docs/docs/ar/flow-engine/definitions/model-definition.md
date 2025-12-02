:::tip إشعار الترجمة بالذكاء الاصطناعي
تمت ترجمة هذه الوثائق تلقائيًا بواسطة الذكاء الاصطناعي.
:::

# ModelDefinition

يحدد `ModelDefinition` خيارات إنشاء نموذج سير العمل، والتي تُستخدم لإنشاء نسخة نموذج عبر طريقة `FlowEngine.createModel()`. يتضمن هذا التعريف التكوين الأساسي للنموذج، وخصائصه، ونماذجه الفرعية، وغيرها من المعلومات.

## تعريف النوع

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

## الاستخدام

```ts
const engine = new FlowEngine();

// إنشاء نسخة نموذج
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

## وصف الخصائص

### uid

**النوع**: `string`  
**مطلوب**: لا  
**الوصف**: المعرف الفريد لنسخة النموذج.

إذا لم يتم توفيره، سيقوم النظام تلقائيًا بإنشاء معرف فريد.

**مثال**:
```ts
uid: 'model-123'
uid: 'user-profile-model'
uid: 'data-processing-instance'
```

### use

**النوع**: `RegisteredModelClassName | ModelConstructor`  
**مطلوب**: نعم  
**الوصف**: فئة النموذج المراد استخدامها.

يمكن أن تكون سلسلة نصية لاسم فئة نموذج مسجلة، أو دالة إنشاء فئة النموذج.

**مثال**:
```ts
// استخدام مرجع نصي
use: 'MyModel'

// استخدام دالة الإنشاء
use: MyModel

// استخدام مرجع ديناميكي
const ModelClass = engine.getModelClass('MyModel');
use: ModelClass
```

### props

**النوع**: `IModelComponentProps`  
**مطلوب**: لا  
**الوصف**: إعدادات خصائص النموذج.

كائن الخصائص الذي يتم تمريره إلى دالة إنشاء النموذج.

**مثال**:
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

**النوع**: `StepParams`  
**مطلوب**: لا  
**الوصف**: إعدادات معلمات الخطوات.

لتعيين المعلمات لكل خطوة في سير العمل.

**مثال**:
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

**النوع**: `Record<string, CreateSubModelOptions[]>`  
**مطلوب**: لا  
**الوصف**: إعدادات النماذج الفرعية.

تحدد النماذج الفرعية للنموذج، وتدعم النماذج الفرعية من نوع المصفوفة والمفردة.

**مثال**:
```ts
subModels: {
  // نموذج فرعي من نوع مصفوفة
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
  // نموذج فرعي مفرد
  singleChild: {
    use: 'SingleChildModel',
    props: { name: 'Single Child' }
  }
}
```

### parentId

**النوع**: `string`  
**مطلوب**: لا  
**الوصف**: المعرف الفريد (UID) للنموذج الأب.

يُستخدم لإنشاء علاقة الأبوة والبنوه بين النماذج.

**مثال**:
```ts
parentId: 'parent-model-123'
parentId: 'master-instance'
```

### subKey

**النوع**: `string`  
**مطلوب**: لا  
**الوصف**: اسم مفتاح النموذج الفرعي في النموذج الأب.

يُستخدم لتحديد موقع النموذج الفرعي داخل النموذج الأب.

**مثال**:
```ts
subKey: 'childModels'
subKey: 'subComponents'
subKey: 'nestedItems'
```

### subType

**النوع**: `'array' | 'single'`  
**مطلوب**: لا  
**الوصف**: نوع النموذج الفرعي.

- `'array'`: نموذج فرعي من نوع مصفوفة، يمكن أن يحتوي على عدة نُسخ.
- `'single'`: نموذج فرعي مفرد، يمكن أن يحتوي على نسخة واحدة فقط.

**مثال**:
```ts
subType: 'array'  // نوع مصفوفة
subType: 'single' // نوع مفرد
```

### sortIndex

**النوع**: `number`  
**مطلوب**: لا  
**الوصف**: فهرس الترتيب.

يُستخدم للتحكم في ترتيب عرض النموذج في القائمة.

**مثال**:
```ts
sortIndex: 0  // في المقدمة تمامًا
sortIndex: 10 // في المنتصف
sortIndex: 100 // في المؤخرة نسبيًا
```

### flowRegistry

**النوع**: `Record<string, Omit<FlowDefinitionOptions, 'key'>>`  
**مطلوب**: لا  
**الوصف**: سجل سير العمل.

لتسجيل تعريفات سير عمل محددة لنسخة النموذج.

**مثال**:
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
          // منطق معالجة مخصص
        }
      }
    }
  }
}
```

## مثال كامل

```ts
class DataProcessingModel extends FlowModel {}

// تسجيل فئة النموذج
engine.registerModel('DataProcessingModel', DataProcessingModel);

// إنشاء نسخة نموذج
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

// استخدام النموذج
model.applyFlow('dataProcessingFlow');
```