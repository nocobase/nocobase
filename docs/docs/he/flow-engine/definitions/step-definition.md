:::tip
מסמך זה תורגם על ידי בינה מלאכותית. לכל אי דיוק, אנא עיין ב[גרסה האנגלית](/en)
:::

# StepDefinition

`StepDefinition` מגדיר צעד יחיד בזרם. כל צעד יכול להיות פעולה, טיפול באירוע או פעולה אחרת. צעד הוא יחידת הביצוע הבסיסית של זרם.

## הגדרת טיפוס

```ts
interface StepDefinition<TModel extends FlowModel = FlowModel>
  extends Partial<Omit<ActionDefinition<TModel, FlowRuntimeContext<TModel>>, 'name'>> {
  key?: string;
  isAwait?: boolean;
  use?: string;
  sort?: number;
  preset?: boolean;
  paramsRequired?: boolean;
  hideInSettings?: boolean;
  uiMode?: StepUIMode | ((ctx: FlowRuntimeContext<TModel>) => StepUIMode | Promise<StepUIMode>);
}
```

## אופן השימוש

```ts
class MyModel extends FlowModel {}

MyModel.registerFlow({
  key: 'pageSettings',
  steps: {
    step1: {
      use: 'actionName',
      title: 'First Step',
      sort: 0,
      preset: true
    },
    step2: {
      handler: async (ctx, params) => {
        // Custom processing logic
        return { result: 'success' };
      },
      title: 'Second Step',
      sort: 1
    }
  }
});
```

## תיאור מאפיינים

### key

**סוג**: `string`  
**נדרש**: לא  
**תיאור**: מזהה ייחודי לצעד בתוך הזרם.

אם לא סופק, ייעשה שימוש בשם המפתח של הצעד באובייקט `steps`.

**דוגמה**:
```ts
steps: {
  loadData: {  // key is 'loadData'
    use: 'loadDataAction'
  }
}
```

### use

**סוג**: `string`  
**נדרש**: לא  
**תיאור**: שם של `ActionDefinition` רשום לשימוש.

מאפיין ה-`use` מאפשר לכם להפנות לפעולה רשומה, ובכך למנוע הגדרות כפולות.

**דוגמה**:
```ts
// Register the action first
MyModel.registerAction({
  name: 'loadDataAction',
  handler: async (ctx, params) => {
    // Data loading logic
  }
});

// Use it in a step
steps: {
  step1: {
    use: 'loadDataAction',  // Reference the registered action
    title: 'Load Data'
  }
}
```

### title

**סוג**: `string`  
**נדרש**: לא  
**תיאור**: כותרת התצוגה של הצעד.

משמש לתצוגת ממשק המשתמש ולניפוי באגים.

**דוגמה**:
```ts
title: 'Load Data'
title: 'Process Information'
title: 'Save Results'
```

### sort

**סוג**: `number`  
**נדרש**: לא  
**תיאור**: סדר הביצוע של הצעד. ככל שהערך קטן יותר, כך הצעד יבוצע מוקדם יותר.

משמש לשליטה על סדר הביצוע של מספר צעדים באותו זרם.

**דוגמה**:
```ts
steps: {
  step1: { sort: 0 },  // Executes first
  step2: { sort: 1 },  // Executes next
  step3: { sort: 2 }   // Executes last
}
```

### handler

**סוג**: `(ctx: FlowRuntimeContext<TModel>, params: any) => Promise<any> | any`  
**נדרש**: לא  
**תיאור**: פונקציית הטיפול (handler) עבור הצעד.

כאשר מאפיין ה-`use` אינו בשימוש, תוכלו להגדיר את פונקציית הטיפול ישירות.

**דוגמה**:
```ts
handler: async (ctx, params) => {
  // Get context information
  const { model, flowEngine } = ctx;
  
  // Processing logic
  const result = await processData(params);
  
  // Return result
  return { success: true, data: result };
}
```

### defaultParams

**סוג**: `Record<string, any> | ((ctx: FlowRuntimeContext<TModel>) => Record<string, any> | Promise<Record<string, any>>)`  
**נדרש**: לא  
**תיאור**: הפרמטרים ברירת המחדל עבור הצעד.

ממלא פרמטרים בערכי ברירת מחדל לפני ביצוע הצעד.

**דוגמה**:
```ts
// Static default parameters
defaultParams: {
  timeout: 5000,
  retries: 3,
  format: 'json'
}

// Dynamic default parameters
defaultParams: (ctx) => {
  return {
    userId: ctx.model.uid,
    timestamp: Date.now()
  }
}

// Asynchronous default parameters
defaultParams: async (ctx) => {
  const config = await loadConfig();
  return {
    apiUrl: config.apiUrl,
    apiKey: config.apiKey
  }
}
```

### uiSchema

**סוג**: `Record<string, ISchema> | ((ctx: FlowRuntimeContext<TModel>) => Record<string, ISchema> | Promise<Record<string, ISchema>>)`  
**נדרש**: לא  
**תיאור**: סכימת תצורת ממשק המשתמש (UI) עבור הצעד.

מגדיר כיצד הצעד מוצג בממשק וכיצד מוגדרת תצורת הטופס שלו.

**דוגמה**:
```ts
uiSchema: {
  'x-component': 'Form',
  'x-component-props': {
    layout: 'vertical'
  },
  properties: {
    name: {
      type: 'string',
      title: 'Name',
      'x-component': 'Input'
    },
    age: {
      type: 'number',
      title: 'Age',
      'x-component': 'InputNumber'
    }
  }
}
```

### beforeParamsSave

**סוג**: `(ctx: FlowSettingsContext<TModel>, params: any, previousParams: any) => void | Promise<void>`  
**נדרש**: לא  
**תיאור**: פונקציית וו (hook) המופעלת לפני שמירת הפרמטרים.

מבוצעת לפני שמירת פרמטרי הצעד, וניתן להשתמש בה לאימות או המרה של פרמטרים.

**דוגמה**:
```ts
beforeParamsSave: (ctx, params, previousParams) => {
  // Parameter validation
  if (!params.name) {
    throw new Error('Name is required');
  }
  
  // Parameter transformation
  params.name = params.name.trim().toLowerCase();
}
```

### afterParamsSave

**סוג**: `(ctx: FlowSettingsContext<TModel>, params: any, previousParams: any) => void | Promise<void>`  
**נדרש**: לא  
**תיאור**: פונקציית וו (hook) המופעלת לאחר שמירת הפרמטרים.

מבוצעת לאחר שמירת פרמטרי הצעד, וניתן להשתמש בה להפעלת פעולות נוספות.

**דוגמה**:
```ts
afterParamsSave: (ctx, params, previousParams) => {
  // Record logs
  console.log('Step params saved:', params);
  
  // Trigger other operations
  ctx.model.emitter.emit('paramsChanged', params);
}
```

### uiMode

**סוג**: `StepUIMode | ((ctx: FlowRuntimeContext<TModel>) => StepUIMode | Promise<StepUIMode>)`  
**נדרש**: לא  
**תיאור**: מצב תצוגת ממשק המשתמש (UI) עבור הצעד.

שולט באופן שבו הצעד מוצג בממשק.

**מצבים נתמכים**:
- `'dialog'` - מצב דיאלוג (חלון קופץ)
- `'drawer'` - מצב מגירה (פאנל צדדי)
- `'embed'` - מצב מוטבע
- או אובייקט תצורה מותאם אישית

**דוגמה**:
```ts
// Simple mode
uiMode: 'dialog'

// Custom configuration
uiMode: {
  type: 'dialog',
  props: {
    width: 800,
    title: 'Step Configuration'
  }
}

// Dynamic mode
uiMode: (ctx) => {
  return ctx.model.isMobile ? 'drawer' : 'dialog';
}
```

### preset

**סוג**: `boolean`  
**נדרש**: לא  
**תיאור**: האם זהו צעד מוגדר מראש.

פרמטרים עבור צעדים עם `preset: true` צריכים להימלא בעת היצירה. אלה ללא דגל זה ניתנים למילוי לאחר יצירת המודל.

**דוגמה**:
```ts
steps: {
  step1: {
    preset: true,  // Parameters must be filled in at creation time
    use: 'requiredAction'
  },
  step2: {
    preset: false, // Parameters can be filled in later
    use: 'optionalAction'
  }
}
```

### paramsRequired

**סוג**: `boolean`  
**נדרש**: לא  
**תיאור**: האם פרמטרי הצעד נדרשים.

אם `true`, ייפתח חלון דיאלוג תצורה לפני הוספת המודל.

**דוגמה**:
```ts
paramsRequired: true  // Parameters must be configured before adding the model
paramsRequired: false // Parameters can be configured later
```

### hideInSettings

**סוג**: `boolean`  
**נדרש**: לא  
**תיאור**: האם להסתיר את הצעד בתפריט ההגדרות.

**דוגמה**:
```ts
hideInSettings: true  // Hide in settings
hideInSettings: false // Show in settings (default)
```

### isAwait

**סוג**: `boolean`  
**נדרש**: לא  
**ברירת מחדל**: `true`  
**תיאור**: האם להמתין לסיום פונקציית הטיפול (handler).

**דוגמה**:
```ts
isAwait: true  // Wait for the handler function to complete (default)
isAwait: false // Do not wait, execute asynchronously
```

## דוגמה מלאה

```ts
class DataProcessingModel extends FlowModel {}

DataProcessingModel.registerFlow({
  key: 'dataProcessing',
  title: 'Data Processing',
  steps: {
    loadData: {
      use: 'loadDataAction',
      title: 'Load Data',
      sort: 0,
      preset: true,
      paramsRequired: true,
      defaultParams: {
        source: 'api',
        timeout: 5000
      },
      uiMode: 'dialog'
    },
    processData: {
      handler: async (ctx, params) => {
        const data = await ctx.model.getData();
        return processData(data, params);
      },
      title: 'Process Data',
      sort: 1,
      defaultParams: (ctx) => ({
        userId: ctx.model.uid,
        timestamp: Date.now()
      }),
      beforeParamsSave: (ctx, params) => {
        if (!params.processor) {
          throw new Error('Processor is required');
        }
      },
      afterParamsSave: (ctx, params) => {
        ctx.model.emitter.emit('dataProcessed', params);
      }
    },
    saveData: {
      use: 'saveDataAction',
      title: 'Save Data',
      sort: 2,
      hideInSettings: false,
      uiMode: {
        type: 'drawer',
        props: {
          width: 600,
          title: 'Save Configuration'
        }
      }
    }
  }
});
```