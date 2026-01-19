:::tip
מסמך זה תורגם על ידי בינה מלאכותית. לכל אי דיוק, אנא עיין ב[גרסה האנגלית](/en)
:::

# ModelDefinition

`ModelDefinition` מגדיר את אפשרויות היצירה עבור מודל זרימה (flow model), המשמש ליצירת מופע מודל (model instance) באמצעות שיטת `FlowEngine.createModel()`. הוא כולל את התצורה הבסיסית של המודל, מאפיינים, תת-מודלים ומידע נוסף.

## הגדרת טיפוס

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

## אופן השימוש

```ts
const engine = new FlowEngine();

// יצירת מופע מודל
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

## תיאורי מאפיינים

### uid

**סוג**: `string`  
**נדרש**: לא  
**תיאור**: מזהה ייחודי (UID) עבור מופע המודל.  
אם לא סופק, המערכת תיצור UID ייחודי באופן אוטומטי.

**דוגמה**:
```ts
uid: 'model-123'
uid: 'user-profile-model'
uid: 'data-processing-instance'
```

### use

**סוג**: `RegisteredModelClassName | ModelConstructor`  
**נדרש**: כן  
**תיאור**: מחלקת המודל לשימוש.  
יכול להיות מחרוזת של שם מחלקת מודל רשומה, או פונקציית הבנאי של מחלקת המודל.

**דוגמה**:
```ts
// שימוש בהפניה באמצעות מחרוזת
use: 'MyModel'

// שימוש בפונקציית הבנאי
use: MyModel

// שימוש בהפניה דינמית
const ModelClass = engine.getModelClass('MyModel');
use: ModelClass
```

### props

**סוג**: `IModelComponentProps`  
**נדרש**: לא  
**תיאור**: תצורת המאפיינים עבור המודל.  
אובייקט המאפיינים המועבר לפונקציית הבנאי של המודל.

**דוגמה**:
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

**סוג**: `StepParams`  
**נדרש**: לא  
**תיאור**: תצורת פרמטרים עבור שלבים.  
מגדיר פרמטרים עבור כל שלב בתוך תהליך העבודה (flow).

**דוגמה**:
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

**סוג**: `Record<string, CreateSubModelOptions[]>`  
**נדרש**: לא  
**תיאור**: תצורת תת-מודלים.  
מגדיר את תת-המודלים של המודל, ותומך הן במערך והן בתת-מודל יחיד.

**דוגמה**:
```ts
subModels: {
  // תת-מודל מסוג מערך
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
  // תת-מודל יחיד
  singleChild: {
    use: 'SingleChildModel',
    props: { name: 'Single Child' }
  }
}
```

### parentId

**סוג**: `string`  
**נדרש**: לא  
**תיאור**: ה-UID של מודל האב.  
משמש ליצירת קשר הורה-ילד בין מודלים.

**דוגמה**:
```ts
parentId: 'parent-model-123'
parentId: 'master-instance'
```

### subKey

**סוג**: `string`  
**נדרש**: לא  
**תיאור**: שם המפתח של תת-המודל במודל האב.  
משמש לזיהוי מיקום תת-המודל בתוך מודל האב.

**דוגמה**:
```ts
subKey: 'childModels'
subKey: 'subComponents'
subKey: 'nestedItems'
```

### subType

**סוג**: `'array' | 'single'`  
**נדרש**: לא  
**תיאור**: טיפוס תת-המודל.  
- `'array'`: תת-מודל מסוג מערך, שיכול להכיל מספר מופעים.
- `'single'`: תת-מודל יחיד, שיכול להכיל מופע אחד בלבד.

**דוגמה**:
```ts
subType: 'array'  // סוג מערך
subType: 'single' // סוג יחיד
```

### sortIndex

**סוג**: `number`  
**נדרש**: לא  
**תיאור**: אינדקס מיון.  
משמש לשליטה על סדר התצוגה של המודל ברשימה.

**דוגמה**:
```ts
sortIndex: 0  // בראש הרשימה
sortIndex: 10 // במיקום אמצעי
sortIndex: 100 // במיקום אחורי יותר
```

### flowRegistry

**סוג**: `Record<string, Omit<FlowDefinitionOptions, 'key'>>`  
**נדרש**: לא  
**תיאור**: רישום תהליכי עבודה (Flow registry).  
רושם הגדרות ספציפיות של תהליכי עבודה עבור מופע המודל.

**דוגמה**:
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
          // לוגיקת טיפול מותאמת אישית
        }
      }
    }
  }
}
```

## דוגמה מלאה

```ts
class DataProcessingModel extends FlowModel {}

// רישום מחלקת המודל
engine.registerModel('DataProcessingModel', DataProcessingModel);

// יצירת מופע מודל
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

// שימוש במודל
model.applyFlow('dataProcessingFlow');
```