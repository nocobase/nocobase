:::tip
यह दस्तावेज़ AI द्वारा अनुवादित किया गया है। किसी भी अशुद्धि के लिए, कृपया [अंग्रेजी संस्करण](/en) देखें
:::

# ModelDefinition

ModelDefinition एक फ़्लो मॉडल के निर्माण विकल्पों को परिभाषित करता है, जिसका उपयोग `FlowEngine.createModel()` विधि के माध्यम से मॉडल इंस्टेंस बनाने के लिए किया जाता है। इसमें मॉडल का मूल कॉन्फ़िगरेशन, गुण (properties), सब-मॉडल और अन्य जानकारी शामिल होती है।

## प्रकार की परिभाषा

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

## उपयोग

```ts
const engine = new FlowEngine();

// एक मॉडल इंस्टेंस बनाएँ
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

## गुणों का विवरण

### uid

**प्रकार**: `string`  
**आवश्यक**: नहीं  
**विवरण**: मॉडल इंस्टेंस के लिए अद्वितीय पहचानकर्ता।

यदि आप इसे प्रदान नहीं करते हैं, तो सिस्टम स्वचालित रूप से एक अद्वितीय UID उत्पन्न करेगा।

**उदाहरण**:
```ts
uid: 'model-123'
uid: 'user-profile-model'
uid: 'data-processing-instance'
```

### use

**प्रकार**: `RegisteredModelClassName | ModelConstructor`  
**आवश्यक**: हाँ  
**विवरण**: उपयोग की जाने वाली मॉडल क्लास।

यह एक पंजीकृत मॉडल क्लास नाम स्ट्रिंग या मॉडल क्लास का कंस्ट्रक्टर हो सकता है।

**उदाहरण**:
```ts
// स्ट्रिंग संदर्भ का उपयोग करें
use: 'MyModel'

// कंस्ट्रक्टर का उपयोग करें
use: MyModel

// डायनामिक संदर्भ का उपयोग करें
const ModelClass = engine.getModelClass('MyModel');
use: ModelClass
```

### props

**प्रकार**: `IModelComponentProps`  
**आवश्यक**: नहीं  
**विवरण**: मॉडल के लिए गुण (property) कॉन्फ़िगरेशन।

यह वह गुण ऑब्जेक्ट है जिसे मॉडल कंस्ट्रक्टर को पास किया जाता है।

**उदाहरण**:
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

**प्रकार**: `StepParams`  
**आवश्यक**: नहीं  
**विवरण**: स्टेप पैरामीटर कॉन्फ़िगरेशन।

यह फ़्लो में प्रत्येक स्टेप के लिए पैरामीटर सेट करता है।

**उदाहरण**:
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

**प्रकार**: `Record<string, CreateSubModelOptions[]>`  
**आवश्यक**: नहीं  
**विवरण**: सब-मॉडल कॉन्फ़िगरेशन।

यह मॉडल के सब-मॉडल को परिभाषित करता है, जो एरे (array) और सिंगल सब-मॉडल दोनों को सपोर्ट करता है।

**उदाहरण**:
```ts
subModels: {
  // एरे-प्रकार का सब-मॉडल
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
  // सिंगल सब-मॉडल
  singleChild: {
    use: 'SingleChildModel',
    props: { name: 'Single Child' }
  }
}
```

### parentId

**प्रकार**: `string`  
**आवश्यक**: नहीं  
**विवरण**: पैरेंट मॉडल का UID।

इसका उपयोग मॉडलों के बीच पैरेंट-चाइल्ड संबंध स्थापित करने के लिए किया जाता है।

**उदाहरण**:
```ts
parentId: 'parent-model-123'
parentId: 'master-instance'
```

### subKey

**प्रकार**: `string`  
**आवश्यक**: नहीं  
**विवरण**: पैरेंट मॉडल में सब-मॉडल का की नाम।

इसका उपयोग पैरेंट मॉडल के भीतर सब-मॉडल की स्थिति को पहचानने के लिए किया जाता है।

**उदाहरण**:
```ts
subKey: 'childModels'
subKey: 'subComponents'
subKey: 'nestedItems'
```

### subType

**प्रकार**: `'array' | 'single'`  
**आवश्यक**: नहीं  
**विवरण**: सब-मॉडल का प्रकार।

- `'array'`: एक एरे-प्रकार का सब-मॉडल, जिसमें कई इंस्टेंस हो सकते हैं।
- `'single'`: एक सिंगल सब-मॉडल, जिसमें केवल एक इंस्टेंस हो सकता है।

**उदाहरण**:
```ts
subType: 'array'  // एरे प्रकार
subType: 'single' // सिंगल प्रकार
```

### sortIndex

**प्रकार**: `number`  
**आवश्यक**: नहीं  
**विवरण**: सॉर्ट इंडेक्स।

इसका उपयोग सूची में मॉडल के प्रदर्शन क्रम को नियंत्रित करने के लिए किया जाता है।

**उदाहरण**:
```ts
sortIndex: 0  // सबसे आगे
sortIndex: 10 // मध्य स्थिति
sortIndex: 100 // थोड़ा पीछे
```

### flowRegistry

**प्रकार**: `Record<string, Omit<FlowDefinitionOptions, 'key'>>`  
**आवश्यक**: नहीं  
**विवरण**: फ़्लो रजिस्ट्री।

यह मॉडल इंस्टेंस के लिए विशिष्ट फ़्लो परिभाषाओं को पंजीकृत करता है।

**उदाहरण**:
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
          // कस्टम प्रोसेसिंग लॉजिक
        }
      }
    }
  }
}
```

## पूर्ण उदाहरण

```ts
class DataProcessingModel extends FlowModel {}

// मॉडल क्लास को पंजीकृत करें
engine.registerModel('DataProcessingModel', DataProcessingModel);

// एक मॉडल इंस्टेंस बनाएँ
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

// मॉडल का उपयोग करें
model.applyFlow('dataProcessingFlow');
```