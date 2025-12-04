:::tip
מסמך זה תורגם על ידי בינה מלאכותית. לכל אי דיוק, אנא עיין ב[גרסה האנגלית](/en)
:::

# ActionDefinition

ActionDefinition מגדיר פעולות שניתן לעשות בהן שימוש חוזר, ושניתן להפנות אליהן במספר תהליכי עבודה ושלבים. פעולה היא יחידת הביצוע המרכזית ב-FlowEngine, המכילה לוגיקה עסקית ספציפית.

## הגדרת טיפוס

```ts
interface ActionDefinition<TModel extends FlowModel = FlowModel, TCtx extends FlowContext = FlowContext> {
  name: string;
  title?: string;
  handler: (ctx: TCtx, params: any) => Promise<any> | any;
  uiSchema?: Record<string, ISchema> | ((ctx: TCtx) => Record<string, ISchema> | Promise<Record<string, ISchema>>);
  defaultParams?: Record<string, any> | ((ctx: TCtx) => Record<string, any> | Promise<Record<string, any>>);
  beforeParamsSave?: (ctx: FlowSettingsContext<TModel>, params: any, previousParams: any) => void | Promise<void>;
  afterParamsSave?: (ctx: FlowSettingsContext<TModel>, params: any, previousParams: any) => void | Promise<void>;
  useRawParams?: boolean | ((ctx: TCtx) => boolean | Promise<boolean>);
  uiMode?: StepUIMode | ((ctx: FlowRuntimeContext<TModel>) => StepUIMode | Promise<StepUIMode>);
  scene?: ActionScene | ActionScene[];
  sort?: number;
}
```

## שיטת רישום

```ts
// רישום גלובלי (באמצעות FlowEngine)
const engine = new FlowEngine();
engine.registerAction({
  name: 'loadDataAction',
  title: 'Load Data',
  handler: async (ctx, params) => {
    // לוגיקת טיפול
  }
});

// רישום ברמת מודל (באמצעות FlowModel)
class MyModel extends FlowModel {}
MyModel.registerAction({
  name: 'processDataAction',
  title: 'Process Data',
  handler: async (ctx, params) => {
    // לוגיקת טיפול
  }
});

// שימוש בתהליך עבודה
MyModel.registerFlow({
  key: 'dataFlow',
  steps: {
    step1: {
      use: 'loadDataAction',  // הפניה לפעולה גלובלית
    },
    step2: {
      use: 'processDataAction', // הפניה לפעולה ברמת מודל
    }
  }
});
```

## תיאורי מאפיינים

### name

**טיפוס**: `string`  
**נדרש**: כן  
**תיאור**: מזהה ייחודי לפעולה

משמש להפניה לפעולה בשלב מסוים באמצעות המאפיין `use`.

**דוגמה**:
```ts
name: 'loadDataAction'
name: 'processDataAction'
name: 'saveDataAction'
```

### title

**טיפוס**: `string`  
**נדרש**: לא  
**תיאור**: כותרת התצוגה של הפעולה

משמש לתצוגה בממשק המשתמש ולניפוי באגים.

**דוגמה**:
```ts
title: 'Load Data'
title: 'Process Information'
title: 'Save Results'
```

### handler

**טיפוס**: `(ctx: TCtx, params: any) => Promise<any> | any`  
**נדרש**: כן  
**תיאור**: פונקציית הטיפול של הפעולה

זוהי לוגיקת הליבה של הפעולה, המקבלת את ההקשר והפרמטרים, ומחזירה את תוצאת הטיפול.

**דוגמה**:
```ts
handler: async (ctx, params) => {
  const { model, flowEngine } = ctx;
  
  try {
    // בצע לוגיקה ספציפית
    const result = await performAction(params);
    
    // החזר תוצאה
    return {
      success: true,
      data: result,
      message: 'Action completed successfully'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}
```

### defaultParams

**טיפוס**: `Record<string, any> | ((ctx: TCtx) => Record<string, any> | Promise<Record<string, any>>)`  
**נדרש**: לא  
**תיאור**: פרמטרי ברירת המחדל של הפעולה

ממלא את הפרמטרים בערכי ברירת מחדל לפני ביצוע הפעולה.

**דוגמה**:
```ts
// פרמטרי ברירת מחדל סטטיים
defaultParams: {
  timeout: 5000,
  retries: 3,
  format: 'json'
}

// פרמטרי ברירת מחדל דינמיים
defaultParams: (ctx) => {
  return {
    userId: ctx.model.uid,
    timestamp: Date.now(),
    version: ctx.flowEngine.version
  }
}

// פרמטרי ברירת מחדל אסינכרוניים
defaultParams: async (ctx) => {
  const config = await loadConfiguration();
  return {
    apiUrl: config.apiUrl,
    apiKey: config.apiKey,
    timeout: config.timeout
  }
}
```

### uiSchema

**טיפוס**: `Record<string, ISchema> | ((ctx: TCtx) => Record<string, ISchema> | Promise<Record<string, ISchema>>)`  
**נדרש**: לא  
**תיאור**: סכמת תצורת ממשק המשתמש עבור הפעולה

מגדיר כיצד הפעולה מוצגת בממשק המשתמש ואת תצורת הטופס שלה.

**דוגמה**:
```ts
uiSchema: {
  'x-component': 'Form',
  'x-component-props': {
    layout: 'vertical',
    labelCol: { span: 6 },
    wrapperCol: { span: 18 }
  },
  properties: {
    url: {
      type: 'string',
      title: 'API URL',
      'x-component': 'Input',
      'x-decorator': 'FormItem',
      required: true
    },
    method: {
      type: 'string',
      title: 'HTTP Method',
      'x-component': 'Select',
      'x-decorator': 'FormItem',
      enum: ['GET', 'POST', 'PUT', 'DELETE'],
      default: 'GET'
    },
    timeout: {
      type: 'number',
      title: 'Timeout (ms)',
      'x-component': 'InputNumber',
      'x-decorator': 'FormItem',
      default: 5000
    }
  }
}
```

### beforeParamsSave

**טיפוס**: `(ctx: FlowSettingsContext<TModel>, params: any, previousParams: any) => void | Promise<void>`  
**נדרש**: לא  
**תיאור**: פונקציית Hook המופעלת לפני שמירת פרמטרים

מופעלת לפני שמירת פרמטרי הפעולה, וניתן להשתמש בה לאימות או המרה של פרמטרים.

**דוגמה**:
```ts
beforeParamsSave: (ctx, params, previousParams) => {
  // אימות פרמטרים
  if (!params.url) {
    throw new Error('URL is required');
  }
  
  // המרת פרמטרים
  params.url = params.url.trim();
  if (!params.url.startsWith('http')) {
    params.url = 'https://' + params.url;
  }
  
  // תיעוד שינויים
  console.log('Parameters changed:', {
    from: previousParams,
    to: params
  });
}
```

### afterParamsSave

**טיפוס**: `(ctx: FlowSettingsContext<TModel>, params: any, previousParams: any) => void | Promise<void>`  
**נדרש**: לא  
**תיאור**: פונקציית Hook המופעלת לאחר שמירת פרמטרים

מופעלת לאחר שמירת פרמטרי הפעולה, וניתן להשתמש בה להפעלת פעולות אחרות.

**דוגמה**:
```ts
afterParamsSave: (ctx, params, previousParams) => {
  // תיעוד לוג
  console.log('Action params saved:', params);
  
  // הפעלת אירוע
  ctx.model.emitter.emit('actionParamsChanged', {
    actionName: 'loadDataAction',
    params,
    previousParams
  });
  
  // עדכון מטמון
  ctx.model.updateCache('actionParams', params);
}
```

### useRawParams

**טיפוס**: `boolean | ((ctx: TCtx) => boolean | Promise<boolean>)`  
**נדרש**: לא  
**תיאור**: האם להשתמש בפרמטרים גולמיים

אם `true`, הפרמטרים הגולמיים יועברו ישירות לפונקציית הטיפול ללא כל עיבוד.

**דוגמה**:
```ts
// תצורה סטטית
useRawParams: true

// תצורה דינמית
useRawParams: (ctx) => {
  return ctx.model.isDebugMode;
}
```

### uiMode

**טיפוס**: `StepUIMode | ((ctx: FlowRuntimeContext<TModel>) => StepUIMode | Promise<StepUIMode>)`  
**נדרש**: לא  
**תיאור**: מצב תצוגת ממשק המשתמש עבור הפעולה

שולט באופן שבו הפעולה מוצגת בממשק המשתמש.

**מצבים נתמכים**:
- `'dialog'` - מצב דיאלוג
- `'drawer'` - מצב מגירה
- `'embed'` - מצב מוטבע
- או אובייקט תצורה מותאם אישית

**דוגמה**:
```ts
// מצב פשוט
uiMode: 'dialog'

// תצורה מותאמת אישית
uiMode: {
  type: 'dialog',
  props: {
    width: 800,
    title: 'Action Configuration',
    maskClosable: false
  }
}

// מצב דינמי
uiMode: (ctx) => {
  return ctx.model.isMobile ? 'drawer' : 'dialog';
}
```

### scene

**טיפוס**: `ActionScene | ActionScene[]`  
**נדרש**: לא  
**תיאור**: תרחישי השימוש עבור הפעולה

מגביל את השימוש בפעולה לתרחישים ספציפיים בלבד.

**תרחישים נתמכים**:
- `'settings'` - תרחיש הגדרות
- `'runtime'` - תרחיש זמן ריצה
- `'design'` - תרחיש זמן עיצוב

**דוגמה**:
```ts
scene: 'settings'  // שימוש רק בתרחיש ההגדרות
scene: ['settings', 'runtime']  // שימוש בתרחישי הגדרות וזמן ריצה
```

### sort

**טיפוס**: `number`  
**נדרש**: לא  
**תיאור**: משקל המיון של הפעולה

שולט בסדר התצוגה של הפעולה ברשימה. ערך קטן יותר פירושו מיקום גבוה יותר (מוקדם יותר).

**דוגמה**:
```ts
sort: 0  // המיקום הגבוה ביותר
sort: 10 // מיקום בינוני
sort: 100 // מיקום נמוך יותר
```

## דוגמה מלאה

```ts
class DataProcessingModel extends FlowModel {}

// רישום פעולת טעינת נתונים
DataProcessingModel.registerAction({
  name: 'loadDataAction',
  title: 'Load Data',
  handler: async (ctx, params) => {
    const { url, method = 'GET', timeout = 5000 } = params;
    
    try {
      const response = await fetch(url, {
        method,
        timeout,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      return {
        success: true,
        data,
        message: 'Data loaded successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },
  defaultParams: {
    method: 'GET',
    timeout: 5000
  },
  uiSchema: {
    'x-component': 'Form',
    properties: {
      url: {
        type: 'string',
        title: 'API URL',
        'x-component': 'Input',
        'x-decorator': 'FormItem',
        required: true
      },
      method: {
        type: 'string',
        title: 'HTTP Method',
        'x-component': 'Select',
        'x-decorator': 'FormItem',
        enum: ['GET', 'POST', 'PUT', 'DELETE']
      },
      timeout: {
        type: 'number',
        title: 'Timeout (ms)',
        'x-component': 'InputNumber',
        'x-decorator': 'FormItem'
      }
    }
  },
  beforeParamsSave: (ctx, params) => {
    if (!params.url) {
      throw new Error('URL is required');
    }
    params.url = params.url.trim();
  },
  afterParamsSave: (ctx, params) => {
    ctx.model.emitter.emit('dataSourceChanged', params);
  },
  uiMode: 'dialog',
  scene: ['settings', 'runtime'],
  sort: 0
});

// רישום פעולת עיבוד נתונים
DataProcessingModel.registerAction({
  name: 'processDataAction',
  title: 'Process Data',
  handler: async (ctx, params) => {
    const { data, processor, options = {} } = params;
    
    try {
      const processedData = await processData(data, processor, options);
      
      return {
        success: true,
        data: processedData,
        message: 'Data processed successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },
  defaultParams: (ctx) => ({
    processor: 'default',
    options: {
      format: 'json',
      encoding: 'utf8'
    }
  }),
  uiSchema: {
    'x-component': 'Form',
    properties: {
      processor: {
        type: 'string',
        title: 'Processor',
        'x-component': 'Select',
        'x-decorator': 'FormItem',
        enum: ['default', 'advanced', 'custom']
      },
      options: {
        type: 'object',
        title: 'Options',
        'x-component': 'Form',
        'x-decorator': 'FormItem',
        properties: {
          format: {
            type: 'string',
            title: 'Format',
            'x-component': 'Select',
            enum: ['json', 'xml', 'csv']
          },
          encoding: {
            type: 'string',
            title: 'Encoding',
            'x-component': 'Select',
            enum: ['utf8', 'ascii', 'latin1']
          }
        }
      }
    }
  },
  scene: 'runtime',
  sort: 1
});
```