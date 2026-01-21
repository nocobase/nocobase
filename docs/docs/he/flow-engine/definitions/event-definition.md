:::tip
מסמך זה תורגם על ידי בינה מלאכותית. לכל אי דיוק, אנא עיין ב[גרסה האנגלית](/en)
:::

# EventDefinition

`EventDefinition` מגדיר את לוגיקת הטיפול באירועים בתוך זרימה, ומשמש לתגובה לטריגרים ספציפיים של אירועים. אירועים הם מנגנון חשוב במנוע הזרימה להפעלת ביצוע זרימות.

## הגדרת טיפוס

```ts
type EventDefinition<TModel extends FlowModel = FlowModel, TCtx extends FlowContext = FlowContext> = ActionDefinition<TModel, TCtx>;
```

`EventDefinition` הוא למעשה כינוי ל-`ActionDefinition`, ולכן יש לו את אותם המאפיינים והמתודות.

## שיטות רישום

```ts
// רישום גלובלי (באמצעות FlowEngine)
const engine = new FlowEngine();
engine.registerEvent({
  name: 'clickEvent',
  title: 'Click Event',
  handler: async (ctx, params) => {
    // לוגיקת טיפול באירוע
  }
});

// רישום ברמת המודל (באמצעות FlowModel)
class MyModel extends FlowModel {}
MyModel.registerEvent({
  name: 'submitEvent',
  title: 'Submit Event',
  handler: async (ctx, params) => {
    // לוגיקת טיפול באירוע
  }
});

// שימוש בזרימה
MyModel.registerFlow({
  key: 'formFlow',
  on: 'submitEvent',  // הפניה לאירוע רשום
  steps: {
    step1: {
      use: 'processFormAction'
    }
  }
});
```

## תיאור מאפיינים

### name

**טיפוס**: `string`  
**נדרש**: כן  
**תיאור**: מזהה ייחודי לאירוע.

משמש להפניה לאירוע בזרימה באמצעות המאפיין `on`.

**דוגמה**:
```ts
name: 'clickEvent'
name: 'submitEvent'
name: 'customEvent'
```

### title

**טיפוס**: `string`  
**נדרש**: לא  
**תיאור**: כותרת התצוגה של האירוע.

משמש לתצוגת ממשק משתמש ולניפוי באגים.

**דוגמה**:
```ts
title: 'Click Event'
title: 'Form Submit'
title: 'Data Change'
```

### handler

**טיפוס**: `(ctx: TCtx, params: any) => Promise<any> | any`  
**נדרש**: כן  
**תיאור**: פונקציית הטיפול (handler) של האירוע.

זוהי לוגיקת הליבה של האירוע, המקבלת את ההקשר (context) והפרמטרים, ומחזירה את תוצאת הטיפול.

**דוגמה**:
```ts
handler: async (ctx, params) => {
  const { model, flowEngine } = ctx;
  
  try {
    // הפעלת לוגיקת טיפול באירוע
    const result = await handleEvent(params);
    
    // החזרת התוצאה
    return {
      success: true,
      data: result,
      message: 'Event handled successfully'
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
**תיאור**: פרמטרי ברירת המחדל של האירוע.

מאכלס את הפרמטרים בערכי ברירת מחדל כאשר האירוע מופעל.

**דוגמה**:
```ts
// פרמטרים סטטיים כברירת מחדל
defaultParams: {
  preventDefault: true,
  stopPropagation: false
}

// פרמטרים דינמיים כברירת מחדל
defaultParams: (ctx) => {
  return {
    timestamp: Date.now(),
    userId: ctx.model.uid,
    eventSource: 'user'
  }
}

// פרמטרים אסינכרוניים כברירת מחדל
defaultParams: async (ctx) => {
  const userInfo = await getUserInfo();
  return {
    user: userInfo,
    session: await getSessionInfo()
  }
}
```

### uiSchema

**טיפוס**: `Record<string, ISchema> | ((ctx: TCtx) => Record<string, ISchema> | Promise<Record<string, ISchema>>)`  
**נדרש**: לא  
**תיאור**: סכמת תצורת ממשק המשתמש (UI) של האירוע.

מגדיר את אופן הצגת האירוע בממשק המשתמש ואת תצורת הטופס שלו.

**דוגמה**:
```ts
uiSchema: {
  'x-component': 'Form',
  'x-component-props': {
    layout: 'vertical'
  },
  properties: {
    preventDefault: {
      type: 'boolean',
      title: 'Prevent Default',
      'x-component': 'Switch',
      'x-decorator': 'FormItem'
    },
    stopPropagation: {
      type: 'boolean',
      title: 'Stop Propagation',
      'x-component': 'Switch',
      'x-decorator': 'FormItem'
    },
    customData: {
      type: 'object',
      title: 'Custom Data',
      'x-component': 'Form',
      'x-decorator': 'FormItem',
      properties: {
        key: {
          type: 'string',
          title: 'Key',
          'x-component': 'Input'
        },
        value: {
          type: 'string',
          title: 'Value',
          'x-component': 'Input'
        }
      }
    }
  }
}
```

### beforeParamsSave

**טיפוס**: `(ctx: FlowSettingsContext<TModel>, params: any, previousParams: any) => void | Promise<void>`  
**נדרש**: לא  
**תיאור**: פונקציית וו (hook) המופעלת לפני שמירת הפרמטרים.

מופעלת לפני שמירת פרמטרי האירוע, ויכולה לשמש לאימות או המרה של פרמטרים.

**דוגמה**:
```ts
beforeParamsSave: (ctx, params, previousParams) => {
  // אימות פרמטרים
  if (!params.eventType) {
    throw new Error('Event type is required');
  }
  
  // המרת פרמטרים
  params.eventType = params.eventType.toLowerCase();
  
  // תיעוד שינויים
  console.log('Event params changed:', {
    from: previousParams,
    to: params
  });
}
```

### afterParamsSave

**טיפוס**: `(ctx: FlowSettingsContext<TModel>, params: any, previousParams: any) => void | Promise<void>`  
**נדרש**: לא  
**תיאור**: פונקציית וו (hook) המופעלת לאחר שמירת הפרמטרים.

מופעלת לאחר שמירת פרמטרי האירוע, ויכולה לשמש להפעלת פעולות אחרות.

**דוגמה**:
```ts
afterParamsSave: (ctx, params, previousParams) => {
  // תיעוד לוג
  console.log('Event params saved:', params);
  
  // הפעלת אירוע
  ctx.model.emitter.emit('eventConfigChanged', {
    eventName: 'clickEvent',
    params,
    previousParams
  });
  
  // עדכון מטמון
  ctx.model.updateCache('eventConfig', params);
}
```

### uiMode

**טיפוס**: `StepUIMode | ((ctx: FlowRuntimeContext<TModel>) => StepUIMode | Promise<StepUIMode>)`  
**נדרש**: לא  
**תיאור**: מצב תצוגת ממשק המשתמש (UI) של האירוע.

שולט באופן שבו האירוע מוצג בממשק המשתמש.

**מצבים נתמכים**:
- `'dialog'` - מצב דיאלוג (חלון קופץ)
- `'drawer'` - מצב מגירה (פאנל צדדי)
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
    width: 600,
    title: 'Event Configuration'
  }
}

// מצב דינמי
uiMode: (ctx) => {
  return ctx.model.isMobile ? 'drawer' : 'dialog';
}
```

## סוגי אירועים מובנים

מנוע הזרימה כולל את סוגי האירועים הנפוצים הבאים:

- `'click'` - אירוע לחיצה
- `'submit'` - אירוע שליחה
- `'reset'` - אירוע איפוס
- `'remove'` - אירוע הסרה
- `'openView'` - אירוע פתיחת תצוגה
- `'dropdownOpen'` - אירוע פתיחת רשימה נפתחת
- `'popupScroll'` - אירוע גלילה בחלון קופץ
- `'search'` - אירוע חיפוש
- `'customRequest'` - אירוע בקשה מותאמת אישית
- `'collapseToggle'` - אירוע החלפת מצב כיווץ/הרחבה

## דוגמה מלאה

```ts
class FormModel extends FlowModel {}

// רישום אירוע שליחת טופס
FormModel.registerEvent({
  name: 'formSubmitEvent',
  title: 'Form Submit Event',
  handler: async (ctx, params) => {
    const { formData, validation } = params;
    
    try {
      // אימות נתוני הטופס
      if (validation && !validateFormData(formData)) {
        throw new Error('Form validation failed');
      }
      
      // טיפול בשליחת הטופס
      const result = await submitForm(formData);
      
      return {
        success: true,
        data: result,
        message: 'Form submitted successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },
  defaultParams: {
    validation: true,
    preventDefault: true,
    stopPropagation: false
  },
  uiSchema: {
    'x-component': 'Form',
    properties: {
      validation: {
        type: 'boolean',
        title: 'Enable Validation',
        'x-component': 'Switch',
        'x-decorator': 'FormItem',
        default: true
      },
      preventDefault: {
        type: 'boolean',
        title: 'Prevent Default',
        'x-component': 'Switch',
        'x-decorator': 'FormItem',
        default: true
      },
      stopPropagation: {
        type: 'boolean',
        title: 'Stop Propagation',
        'x-component': 'Switch',
        'x-decorator': 'FormItem',
        default: false
      },
      customHandlers: {
        type: 'array',
        title: 'Custom Handlers',
        'x-component': 'ArrayItems',
        'x-decorator': 'FormItem',
        items: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              title: 'Handler Name',
              'x-component': 'Input'
            },
            enabled: {
              type: 'boolean',
              title: 'Enabled',
              'x-component': 'Switch'
            }
          }
        }
      }
    }
  },
  beforeParamsSave: (ctx, params) => {
    if (params.validation && !params.formData) {
      throw new Error('Form data is required when validation is enabled');
    }
  },
  afterParamsSave: (ctx, params) => {
    ctx.model.emitter.emit('formEventConfigChanged', params);
  },
  uiMode: 'dialog'
});

// רישום אירוע שינוי נתונים
FormModel.registerEvent({
  name: 'dataChangeEvent',
  title: 'Data Change Event',
  handler: async (ctx, params) => {
    const { field, oldValue, newValue } = params;
    
    try {
      // תיעוד שינוי נתונים
      await logDataChange({
        field,
        oldValue,
        newValue,
        timestamp: Date.now(),
        userId: ctx.model.uid
      });
      
      // הפעלת פעולות קשורות
      ctx.model.emitter.emit('dataChanged', {
        field,
        oldValue,
        newValue
      });
      
      return {
        success: true,
        message: 'Data change logged successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },
  defaultParams: (ctx) => ({
    logLevel: 'info',
    notify: true,
    timestamp: Date.now()
  }),
  uiMode: 'embed'
});

// שימוש באירועים בזרימה
FormModel.registerFlow({
  key: 'formProcessing',
  title: 'Form Processing',
  on: 'formSubmitEvent',
  steps: {
    validate: {
      use: 'validateFormAction',
      title: 'Validate Form',
      sort: 0
    },
    process: {
      use: 'processFormAction',
      title: 'Process Form',
      sort: 1
    },
    save: {
      use: 'saveFormAction',
      title: 'Save Form',
      sort: 2
    }
  }
});
```