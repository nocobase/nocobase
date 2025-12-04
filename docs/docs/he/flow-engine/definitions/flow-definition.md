:::tip
מסמך זה תורגם על ידי בינה מלאכותית. לכל אי דיוק, אנא עיין ב[גרסה האנגלית](/en)
:::

# הגדרת זרימה (FlowDefinition)

הגדרת זרימה (FlowDefinition) מגדירה את המבנה הבסיסי והתצורה של זרימה, והיא אחד ממושגי הליבה של מנוע הזרימה (FlowEngine). היא מתארת את מטא-הנתונים של הזרימה, תנאי ההפעלה, שלבי הביצוע ועוד.

## הגדרת טיפוס

```ts
interface FlowDefinitionOptions<TModel extends FlowModel = FlowModel> {
  key: string;
  title?: string;
  manual?: boolean;
  sort?: number;
  on?: FlowEvent<TModel>;
  steps: Record<string, StepDefinition<TModel>>;
  defaultParams?: Record<string, any> | ((ctx: FlowModelContext) => StepParam | Promise<StepParam>);
}
```

## שיטת רישום

```ts
class MyModel extends FlowModel {}

// רישום זרימה באמצעות מחלקת המודל
MyModel.registerFlow({
  key: 'pageSettings',
  title: 'Page settings',
  manual: false,
  sort: 0,
  on: 'click',
  steps: {
    step1: {
      use: 'actionName',
      title: 'First Step'
    }
  },
  defaultParams: {
    step1: { param1: 'value1' }
  }
});
```

## תיאור מאפיינים

### key

**טיפוס**: `string`  
**נדרש**: כן  
**תיאור**: המזהה הייחודי של הזרימה.

מומלץ להשתמש בסגנון שמות עקבי של `xxxSettings`, לדוגמה:
- `pageSettings`
- `tableSettings` 
- `cardSettings`
- `formSettings`
- `detailsSettings`
- `buttonSettings`
- `popupSettings`
- `deleteSettings`
- `datetimeSettings`
- `numberSettings`

מוסכמת שמות זו מקלה על זיהוי ותחזוקה, ומומלץ להשתמש בה באופן עקבי בכל הפרויקט.

**דוגמה**:
```ts
key: 'pageSettings'
key: 'tableSettings'
key: 'deleteSettings'
```

### title

**טיפוס**: `string`  
**נדרש**: לא  
**תיאור**: הכותרת הקריאה לאדם של הזרימה.

מומלץ לשמור על סגנון עקבי עם המפתח, תוך שימוש בשמות `Xxx settings`, לדוגמה:
- `Page settings`
- `Table settings`
- `Card settings`
- `Form settings`
- `Details settings`
- `Button settings`
- `Popup settings`
- `Delete settings`
- `Datetime settings`
- `Number settings`

מוסכמת שמות זו ברורה וקלה יותר להבנה, ומקלה על תצוגת ממשק המשתמש ושיתוף הפעולה בצוות.

**דוגמה**:
```ts
title: 'Page settings'
title: 'Table settings'
title: 'Delete settings'
```

### manual

**טיפוס**: `boolean`  
**נדרש**: לא  
**ברירת מחדל**: `false`  
**תיאור**: האם הזרימה ניתנת להפעלה ידנית בלבד.

- `true`: הזרימה יכולה להיות מופעלת ידנית בלבד ולא תבוצע באופן אוטומטי.
- `false`: הזרימה יכולה להתבצע באופן אוטומטי (ברירת המחדל היא ביצוע אוטומטי כאשר מאפיין ה-`on` אינו קיים).

**דוגמה**:
```ts
manual: true  // הפעלה ידנית בלבד
manual: false // ניתן להפעיל אוטומטית
```

### sort

**טיפוס**: `number`  
**נדרש**: לא  
**ברירת מחדל**: `0`  
**תיאור**: סדר הביצוע של הזרימה. ככל שהערך קטן יותר, כך הזרימה תתבצע מוקדם יותר.

ניתן להשתמש במספרים שליליים כדי לשלוט בסדר הביצוע של מספר זרימות.

**דוגמה**:
```ts
sort: -1  // ביצוע בעדיפות
sort: 0   // סדר ברירת מחדל
sort: 1   // ביצוע מאוחר יותר
```

### on

**טיפוס**: `FlowEvent<TModel>`  
**נדרש**: לא  
**תיאור**: תצורת האירוע המאפשרת להפעיל זרימה זו באמצעות `dispatchEvent`.

משמש רק להצהרה על שם אירוע ההפעלה (מחרוזת או `{ eventName }`), אינו כולל פונקציית מטפל.

**סוגי אירועים נתמכים**:
- `'click'` - אירוע לחיצה
- `'submit'` - אירוע שליחה
- `'reset'` - אירוע איפוס
- `'remove'` - אירוע הסרה
- `'openView'` - אירוע פתיחת תצוגה
- `'dropdownOpen'` - אירוע פתיחת רשימה נפתחת
- `'popupScroll'` - אירוע גלילה של חלון קופץ
- `'search'` - אירוע חיפוש
- `'customRequest'` - אירוע בקשה מותאמת אישית
- `'collapseToggle'` - אירוע החלפת מצב כיווץ/הרחבה
- או כל מחרוזת מותאמת אישית

**דוגמה**:
```ts
on: 'click'  // מופעל בלחיצה
on: 'submit' // מופעל בשליחה
on: { eventName: 'customEvent', defaultParams: { param1: 'value1' } }
```

### steps

**טיפוס**: `Record<string, StepDefinition<TModel>>`  
**נדרש**: כן  
**תיאור**: הגדרת שלבי הזרימה.

מגדיר את כל השלבים הכלולים בזרימה, כאשר לכל שלב יש מפתח ייחודי.

**דוגמה**:
```ts
steps: {
  step1: {
    use: 'actionName',
    title: 'First Step',
    sort: 0
  },
  step2: {
    use: 'anotherAction',
    title: 'Second Step',
    sort: 1
  }
}
```

### defaultParams

**טיפוס**: `Record<string, any> | ((ctx: FlowModelContext) => StepParam | Promise<StepParam>)`  
**נדרש**: לא  
**תיאור**: פרמטרים ברירת מחדל ברמת הזרימה.

בעת יצירת מופע של המודל (createModel), הוא מאכלס את הערכים ההתחלתיים עבור פרמטרי השלבים של "הזרימה הנוכחית". הוא ממלא רק ערכים חסרים ואינו דורס ערכים קיימים. צורת ההחזרה הקבועה היא: `{ [stepKey]: params }`

**דוגמה**:
```ts
// פרמטרים סטטיים ברירת מחדל
defaultParams: {
  step1: { param1: 'value1', param2: 'value2' },
  step2: { param3: 'value3' }
}

// פרמטרים דינמיים ברירת מחדל
defaultParams: (ctx) => {
  return {
    step1: { 
      param1: ctx.model.uid,
      param2: new Date().toISOString()
    }
  }
}

// פרמטרים אסינכרוניים ברירת מחדל
defaultParams: async (ctx) => {
  const data = await fetchSomeData();
  return {
    step1: { data }
  }
}
```

## דוגמה מלאה

```ts
class PageModel extends FlowModel {}

PageModel.registerFlow({
  key: 'pageSettings',
  title: 'Page settings',
  manual: false,
  sort: 0,
  on: 'click',
  steps: {
    loadData: {
      use: 'loadDataAction',
      title: 'Load Data',
      sort: 0,
      preset: true
    },
    processData: {
      use: 'processDataAction', 
      title: 'Process Data',
      sort: 1,
      paramsRequired: true
    },
    saveData: {
      use: 'saveDataAction',
      title: 'Save Data', 
      sort: 2,
      hideInSettings: false
    }
  },
  defaultParams: {
    loadData: { 
      source: 'api',
      cache: true 
    },
    processData: { 
      format: 'json' 
    }
  }
});
```