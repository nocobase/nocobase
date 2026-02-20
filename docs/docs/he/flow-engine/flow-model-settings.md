:::tip
מסמך זה תורגם על ידי בינה מלאכותית. לכל אי דיוק, אנא עיין ב[גרסה האנגלית](/en)
:::

# FlowModel: זרם אירועים ותצורה

FlowModel מציעה גישה מבוססת "זרם אירועים" (Flow) ליישום לוגיקת תצורה של רכיבים, מה שהופך את התנהגות הרכיבים ותצורתם לניתנות להרחבה וויזואליות יותר.

## מודל מותאם אישית

באפשרותכם ליצור מודל רכיב מותאם אישית על ידי ירושה מ-`FlowModel`. המודל צריך לממש את מתודת `render()` כדי להגדיר את לוגיקת הרינדור של הרכיב.

```ts
class MyModel extends FlowModel {
  render() {
    return <Button {...this.props} />;
  }
}
```

## רישום זרם אירועים (Flow)

כל מודל יכול לרשום זרם אירועים (Flow) אחד או יותר, המשמשים לתיאור לוגיקת התצורה ושלבי האינטראקציה של הרכיב.

```ts
MyModel.registerFlow({
  key: 'buttonSettings',
  title: 'הגדרות כפתור',
  steps: {
    general: {
      title: 'תצורה כללית',
      uiSchema: {
        title: {
          type: 'string',
          title: 'כותרת כפתור',
          'x-decorator': 'FormItem',
          'x-component': 'Input',
        },
      },
      defaultParams: {
        type: 'primary',
      },
      handler(ctx, params) {
        ctx.model.setProps('children', params.title);
        ctx.model.setProps('type', params.type);
      },
    },
  },
});
```

תיאור

-   `key`: מזהה ייחודי עבור ה-Flow.
-   `title`: שם ה-Flow, המשמש לתצוגת ממשק המשתמש (UI).
-   `steps`: מגדיר את שלבי התצורה (Step). כל שלב כולל:
    -   `title`: כותרת השלב.
    -   `uiSchema`: מבנה טופס התצורה (תואם ל-Formily Schema).
    -   `defaultParams`: פרמטרים ברירת מחדל.
    -   `handler(ctx, params)`: מופעל בעת שמירה, ומשמש לעדכון מצב המודל.

## רינדור המודל

בעת רינדור מודל רכיב, באפשרותכם להשתמש בפרמטר `showFlowSettings` כדי לשלוט האם להפעיל את תכונת התצורה. אם `showFlowSettings` מופעל, כניסה לתצורה (כמו אייקון הגדרות או כפתור) תופיע אוטומטית בפינה הימנית העליונה של הרכיב.

```ts
<FlowModelRenderer model={model} showFlowSettings />
```

## פתיחה ידנית של טופס התצורה באמצעות openFlowSettings

בנוסף לפתיחת טופס התצורה דרך נקודת כניסה אינטראקטיבית מובנית, ניתן גם לקרוא ידנית ל-`openFlowSettings()` בקוד.

``` ts
flowSettings.open(options: FlowSettingsOpenOptions): Promise<boolean>;
model.openFlowSettings(options?: Omit<FlowSettingsOpenOptions, 'model'>): Promise<boolean>;
```

### הגדרות פרמטרים

``` ts
interface FlowSettingsOpenOptions {
  model: FlowModel;               // חובה, מופע המודל שאליו הוא שייך
  preset?: boolean;               // מציג רק שלבים המסומנים כ-preset=true (ברירת מחדל: false)
  flowKey?: string;               // מציין Flow יחיד
  flowKeys?: string[];            // מציין מספר Flow-ים (מתעלם אם flowKey סופק גם כן)
  stepKey?: string;               // מציין שלב יחיד (בדרך כלל בשילוב עם flowKey)
  uiMode?: 'dialog' | 'drawer';   // המכל (container) להצגת הטופס, ברירת מחדל: 'dialog'
  onCancel?: () => void;          // פונקציית קריאה חוזרת (callback) בעת לחיצה על ביטול
  onSaved?: () => void;           // פונקציית קריאה חוזרת לאחר שמירת התצורה בהצלחה
}
```

### דוגמה: פתיחת טופס תצורה של Flow ספציפי במצב Drawer

``` ts
await model.openFlowSettings({
  flowKey: 'buttonSettings',
  uiMode: 'drawer',
  onSaved: () => {
    console.log('הגדרות כפתור נשמרו');
  },
});
```